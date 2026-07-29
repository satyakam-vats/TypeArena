import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../firebase';
import { getStoredRuns } from '../storage/analyticsStorage';

export type LeaderboardEntry = {
  id: string;
  uid: string;
  displayName: string;
  photoURL: string | null;
  wpm: number;
  accuracy: number;
  consistency: number;
  mode: string;
  value: number;
  kind: string;
  completedAt: number;
};

export async function fetchLeaderboard(opts: {
  mode?: 'time' | 'words';
  value?: number;
  timeframe?: 'all-time' | 'weekly' | 'daily';
  max?: number;
}): Promise<LeaderboardEntry[]> {
  const entries: LeaderboardEntry[] = [];
  const now = Date.now();
  const cutoff = opts.timeframe === 'daily' ? now - 86400000
    : opts.timeframe === 'weekly' ? now - 604800000 : 0;

  // 1. Try fetching from Firestore testRuns collection
  if (db) {
    try {
      // Query without complex multi-field constraints to avoid requiring custom composite indexes
      const snap = await getDocs(query(collection(db, 'testRuns'), limit(200)));
      snap.docs.forEach((doc) => {
        const d = doc.data();
        const completedAt = typeof d.completedAt?.toMillis === 'function' 
          ? d.completedAt.toMillis() 
          : (Number(d.completedAt) || 0);

        if (cutoff && completedAt < cutoff) return;
        if (opts.mode && d.settings?.mode !== opts.mode) return;
        if (opts.value && d.settings?.value !== opts.value) return;

        entries.push({
          id: doc.id,
          uid: d.ownerId ?? 'anon',
          displayName: d.displayName ?? 'Anonymous',
          photoURL: d.photoURL ?? null,
          wpm: Number(d.metrics?.wpm ?? 0),
          accuracy: Number(d.metrics?.accuracy ?? 0),
          consistency: Number(d.metrics?.consistency ?? 0),
          mode: d.settings?.mode ?? 'time',
          value: Number(d.settings?.value ?? 30),
          kind: d.kind ?? 'solo',
          completedAt,
        });
      });
    } catch (err) {
      console.warn('Firestore testRuns query warning:', err);
    }

    // 2. If testRuns gave no results, try querying users collection stats
    if (entries.length === 0) {
      try {
        const userSnap = await getDocs(query(collection(db, 'users'), limit(100)));
        userSnap.docs.forEach((doc) => {
          const u = doc.data();
          const stats = u.stats;
          if (!stats || !stats.personalBestWpm) return;

          entries.push({
            id: `user-${doc.id}`,
            uid: doc.id,
            displayName: u.displayName ?? 'Anonymous',
            photoURL: u.photoURL ?? null,
            wpm: Number(stats.personalBestWpm ?? 0),
            accuracy: Number(stats.avgAccuracy ?? 100),
            consistency: Number(stats.avgConsistency ?? 100),
            mode: opts.mode ?? 'time',
            value: opts.value ?? 30,
            kind: 'solo',
            completedAt: typeof u.updatedAt?.toMillis === 'function' ? u.updatedAt.toMillis() : Date.now(),
          });
        });
      } catch (err) {
        console.warn('Firestore users fallback query warning:', err);
      }
    }
  }

  // 3. Fallback: If still no entries (e.g. guest mode or clean database), include local storage runs
  if (entries.length === 0) {
    const localRuns = getStoredRuns();
    localRuns.forEach((r) => {
      if (cutoff && r.completedAt < cutoff) return;
      if (opts.mode && r.settings.mode !== opts.mode) return;
      if (opts.value && r.settings.value !== opts.value) return;

      entries.push({
        id: r.id,
        uid: 'local-user',
        displayName: 'You (Local)',
        photoURL: null,
        wpm: r.metrics.wpm,
        accuracy: r.metrics.accuracy,
        consistency: r.metrics.consistency,
        mode: r.settings.mode,
        value: r.settings.value,
        kind: r.kind,
        completedAt: r.completedAt,
      });
    });
  }

  // Sort by WPM descending and limit to max
  return entries
    .sort((a, b) => b.wpm - a.wpm)
    .slice(0, opts.max ?? 50);
}
