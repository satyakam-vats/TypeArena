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

export type CurrentUserInfo = {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
} | null;

export async function fetchLeaderboard(
  opts: {
    mode?: 'time' | 'words';
    value?: number;
    timeframe?: 'all-time' | 'weekly' | 'daily';
    max?: number;
  },
  currentUser?: CurrentUserInfo
): Promise<LeaderboardEntry[]> {
  const rawEntries: LeaderboardEntry[] = [];
  const now = Date.now();
  const cutoff = opts.timeframe === 'daily' ? now - 86400000
    : opts.timeframe === 'weekly' ? now - 604800000 : 0;

  // 1. Fetch from Firestore testRuns collection
  if (db) {
    try {
      const snap = await getDocs(query(collection(db, 'testRuns'), limit(200)));
      snap.docs.forEach((doc) => {
        const d = doc.data();
        const completedAt = typeof d.completedAt?.toMillis === 'function' 
          ? d.completedAt.toMillis() 
          : (Number(d.completedAt) || 0);

        if (cutoff && completedAt < cutoff) return;
        if (opts.mode && d.settings?.mode !== opts.mode) return;
        if (opts.value && d.settings?.value !== opts.value) return;

        rawEntries.push({
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

    // 2. Fetch from Firestore users collection (profiles with stats)
    try {
      const userSnap = await getDocs(query(collection(db, 'users'), limit(100)));
      userSnap.docs.forEach((doc) => {
        const u = doc.data();
        const stats = u.stats;
        if (!stats) return;

        const modeKey = opts.mode && opts.value ? `${opts.mode}_${opts.value}` : null;
        const wpm = modeKey && stats.bestWpmByMode?.[modeKey] 
          ? Number(stats.bestWpmByMode[modeKey]) 
          : Number(stats.personalBestWpm ?? 0);

        if (wpm <= 0) return;

        const completedAt = typeof u.updatedAt?.toMillis === 'function' ? u.updatedAt.toMillis() : Date.now();
        if (cutoff && completedAt < cutoff) return;

        rawEntries.push({
          id: `user-${doc.id}`,
          uid: doc.id,
          displayName: u.displayName ?? 'Anonymous',
          photoURL: u.photoURL ?? null,
          wpm,
          accuracy: Number(stats.avgAccuracy ?? 100),
          consistency: Number(stats.avgConsistency ?? 100),
          mode: opts.mode ?? 'time',
          value: opts.value ?? 30,
          kind: 'solo',
          completedAt,
        });
      });
    } catch (err) {
      console.warn('Firestore users fallback query warning:', err);
    }
  }

  // 3. Add local storage runs (associated with logged in user or 'You')
  const localRuns = getStoredRuns();
  const defaultDisplayName = currentUser?.displayName || 'You';
  const defaultPhoto = currentUser?.photoURL || null;
  const defaultUid = currentUser?.uid || 'local-user';

  localRuns.forEach((r) => {
    if (cutoff && r.completedAt < cutoff) return;
    if (opts.mode && r.settings.mode !== opts.mode) return;
    if (opts.value && r.settings.value !== opts.value) return;

    rawEntries.push({
      id: r.id,
      uid: defaultUid,
      displayName: defaultDisplayName,
      photoURL: defaultPhoto,
      wpm: r.metrics.wpm,
      accuracy: r.metrics.accuracy,
      consistency: r.metrics.consistency,
      mode: r.settings.mode,
      value: r.settings.value,
      kind: r.kind,
      completedAt: r.completedAt,
    });
  });

  // Clean up legacy 'You (Local)' names and deduplicate entries by user UID / DisplayName keeping each typist's highest WPM
  const userBestMap = new Map<string, LeaderboardEntry>();

  for (const entry of rawEntries) {
    if (entry.displayName.includes('(Local)')) {
      entry.displayName = entry.displayName.replace(/\s*\(Local\)/g, '').trim() || (currentUser?.displayName || 'You');
    }

    if (currentUser && (entry.uid === 'local-user' || entry.displayName === 'You')) {
      entry.uid = currentUser.uid;
      if (currentUser.displayName) entry.displayName = currentUser.displayName;
      if (currentUser.photoURL) entry.photoURL = currentUser.photoURL;
    }

    const key = (entry.uid && entry.uid !== 'anon' && entry.uid !== 'local-user')
      ? entry.uid
      : entry.displayName;

    const existing = userBestMap.get(key);
    if (!existing || entry.wpm > existing.wpm) {
      userBestMap.set(key, entry);
    }
  }

  const finalEntries = Array.from(userBestMap.values());

  // Sort by WPM descending and limit to max
  return finalEntries
    .sort((a, b) => b.wpm - a.wpm)
    .slice(0, opts.max ?? 50);
}
