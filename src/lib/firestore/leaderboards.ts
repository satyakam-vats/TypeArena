import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { db } from '../firebase';

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
  if (!db) return [];
  const constraints = [
    orderBy('metrics.wpm', 'desc'),
    limit(opts.max ?? 50),
  ];
  if (opts.mode) constraints.unshift(where('settings.mode', '==', opts.mode));
  if (opts.value) constraints.unshift(where('settings.value', '==', opts.value));

  const snap = await getDocs(query(collection(db, 'testRuns'), ...constraints));
  const now = Date.now();
  const cutoff = opts.timeframe === 'daily' ? now - 86400000
    : opts.timeframe === 'weekly' ? now - 604800000 : 0;

  const entries: LeaderboardEntry[] = [];
  snap.docs.forEach((doc) => {
    const d = doc.data();
    const completedAt = d.completedAt?.toMillis?.() ?? d.completedAt ?? 0;
    if (cutoff && completedAt < cutoff) return;
    entries.push({
      id: doc.id,
      uid: d.ownerId,
      displayName: d.displayName ?? 'Anonymous',
      photoURL: d.photoURL ?? null,
      wpm: d.metrics?.wpm ?? 0,
      accuracy: d.metrics?.accuracy ?? 0,
      consistency: d.metrics?.consistency ?? 0,
      mode: d.settings?.mode ?? 'time',
      value: d.settings?.value ?? 30,
      kind: d.kind ?? 'solo',
      completedAt,
    });
  });

  return entries.sort((a, b) => b.wpm - a.wpm);
}
