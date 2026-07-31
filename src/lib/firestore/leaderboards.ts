import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import { getStoredRuns } from "../storage/analyticsStorage";

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

function toMillis(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "object" && value !== null && "toMillis" in value && typeof (value as { toMillis: () => number }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (typeof value === "object" && value !== null && "seconds" in value) {
    return Number((value as { seconds: number }).seconds) * 1000;
  }
  return Number(value) || 0;
}

/**
 * Leaderboard: best single qualifying run per user for the selected filters.
 * Prefer Firestore testRuns; merge local history for the current browser user.
 */
export async function fetchLeaderboard(
  opts: {
    mode?: "time" | "words";
    value?: number;
    timeframe?: "all-time" | "weekly" | "daily";
    max?: number;
  },
  currentUser?: CurrentUserInfo
): Promise<LeaderboardEntry[]> {
  const rawEntries: LeaderboardEntry[] = [];
  const now = Date.now();
  const cutoff =
    opts.timeframe === "daily" ? now - 86400000
    : opts.timeframe === "weekly" ? now - 604800000
    : 0;

  // 1) Firestore runs (actual completed tests)
  if (db) {
    try {
      // Pull recent runs; filter/sort client-side so we don't need composite indexes for every mode combo.
      let snap;
      try {
        snap = await getDocs(query(collection(db, "testRuns"), orderBy("completedAt", "desc"), limit(300)));
      } catch {
        snap = await getDocs(query(collection(db, "testRuns"), limit(300)));
      }

      snap.docs.forEach((docSnap) => {
        const d = docSnap.data();
        const completedAt = toMillis(d.completedAt) || toMillis(d.createdAt);
        if (cutoff && completedAt < cutoff) return;

        const mode = d.settings?.mode as string | undefined;
        const value = Number(d.settings?.value ?? 0);
        if (opts.mode && mode !== opts.mode) return;
        if (opts.value != null && value !== opts.value) return;

        const wpm = Number(d.metrics?.wpm ?? 0);
        const accuracy = Number(d.metrics?.accuracy ?? 0);
        if (wpm <= 0) return;
        // Ignore junk / accidental runs (Monkeytype-style soft quality gate).
        if (accuracy < 60) return;

        rawEntries.push({
          id: docSnap.id,
          uid: d.ownerId ?? "anon",
          displayName: d.displayName ?? "Anonymous",
          photoURL: d.photoURL ?? null,
          wpm,
          accuracy,
          consistency: Number(d.metrics?.consistency ?? 0),
          mode: mode ?? "time",
          value: value || 30,
          kind: d.kind ?? "solo",
          completedAt,
        });
      });
    } catch (err) {
      console.warn("Firestore testRuns query warning:", err);
    }

    // 2) Fallback: user personal-best fields when few/no runs exist yet
    if (rawEntries.length < 5) {
      try {
        const userSnap = await getDocs(query(collection(db, "users"), limit(100)));
        userSnap.docs.forEach((docSnap) => {
          const u = docSnap.data();
          const stats = u.stats;
          if (!stats) return;

          let wpm = 0;
          let modeLabel: string = opts.mode ?? "time";
          let valueLabel = opts.value ?? 30;

          if (opts.mode && opts.value != null) {
            const modeKey = `${opts.mode}_${opts.value}`;
            wpm = Number(stats.bestWpmByMode?.[modeKey] ?? 0);
          } else if (!opts.mode) {
            wpm = Number(stats.personalBestWpm ?? 0);
            modeLabel = "best";
            valueLabel = 0;
          } else {
            // Mode selected but no value: take best across that mode's common presets
            const presets = opts.mode === "time" ? [15, 30, 60, 120] : [10, 25, 50, 100];
            for (const v of presets) {
              const candidate = Number(stats.bestWpmByMode?.[`${opts.mode}_${v}`] ?? 0);
              if (candidate > wpm) {
                wpm = candidate;
                valueLabel = v;
              }
            }
            modeLabel = opts.mode;
          }

          if (wpm <= 0) return;
          const completedAt = toMillis(u.updatedAt) || Date.now();
          if (cutoff && completedAt < cutoff) return;

          rawEntries.push({
            id: `user-${docSnap.id}`,
            uid: docSnap.id,
            displayName: u.displayName ?? "Anonymous",
            photoURL: u.photoURL ?? null,
            wpm,
            accuracy: Number(stats.avgAccuracy ?? 100),
            consistency: Number(stats.avgConsistency ?? 100),
            mode: modeLabel,
            value: valueLabel,
            kind: "solo",
            completedAt,
          });
        });
      } catch (err) {
        console.warn("Firestore users fallback query warning:", err);
      }
    }
  }

  // 3) Local history for this browser (helps offline / unsigned-in users)
  const localRuns = getStoredRuns();
  const defaultDisplayName = currentUser?.displayName || "You";
  const defaultPhoto = currentUser?.photoURL || null;
  const defaultUid = currentUser?.uid || "local-user";

  localRuns.forEach((r) => {
    if (cutoff && r.completedAt < cutoff) return;
    if (opts.mode && r.settings.mode !== opts.mode) return;
    if (opts.value != null && r.settings.value !== opts.value) return;
    if (r.metrics.wpm <= 0 || r.metrics.accuracy < 60) return;

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

  // Best run per user (not per display name — avoids merging different people named "Anonymous")
  const bestByUser = new Map<string, LeaderboardEntry>();

  for (const entry of rawEntries) {
    if (entry.displayName.includes("(Local)")) {
      entry.displayName = entry.displayName.replace(/\s*\(Local\)/g, "").trim() || defaultDisplayName;
    }

    // Attach local scores to the signed-in account
    if (currentUser && (entry.uid === "local-user" || entry.displayName === "You")) {
      entry.uid = currentUser.uid;
      if (currentUser.displayName) entry.displayName = currentUser.displayName;
      if (currentUser.photoURL) entry.photoURL = currentUser.photoURL;
    }

    const key = entry.uid || `name:${entry.displayName}`;
    const existing = bestByUser.get(key);
    if (!existing || entry.wpm > existing.wpm || (entry.wpm === existing.wpm && entry.accuracy > existing.accuracy)) {
      bestByUser.set(key, entry);
    }
  }

  return Array.from(bestByUser.values())
    .sort((a, b) => b.wpm - a.wpm || b.accuracy - a.accuracy)
    .slice(0, opts.max ?? 50);
}
