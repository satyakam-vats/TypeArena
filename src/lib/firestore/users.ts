import { doc, runTransaction, serverTimestamp, setDoc, getDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "../firebase";
import type { CompletedRun } from "../../types/typing";

function parseTimestampMs(val: any): number {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const parsed = Date.parse(val);
    if (!isNaN(parsed)) return parsed;
  }
  if (typeof val === 'object' && typeof val.toMillis === 'function') return val.toMillis();
  if (typeof val === 'object' && typeof val.seconds === 'number') return val.seconds * 1000;
  return 0;
}

export async function ensureUserProfile(user: User) {
  if (!db) return;
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  const creationTimeMs = user.metadata?.creationTime
    ? Date.parse(user.metadata.creationTime)
    : Date.now();

  const payload: Record<string, any> = {
    displayName: user.displayName ?? "Anonymous racer",
    photoURL: user.photoURL ?? null,
    email: user.email ?? null,
    updatedAt: serverTimestamp(),
  };

  const existingCreated = snap.data()?.createdAt ? parseTimestampMs(snap.data()?.createdAt) : 0;
  if (!existingCreated || (creationTimeMs > 0 && creationTimeMs < existingCreated)) {
    payload.createdAt = creationTimeMs;
  }

  await setDoc(userRef, payload, { merge: true });
}

export async function recordRunStats(uid: string, run: CompletedRun) {
  const firestore = db;
  if (!firestore) return;
  const reference = doc(firestore, "users", uid);
  const modeKey = `${run.settings.mode}_${run.settings.value}`;

  await runTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(reference);
    const data = snapshot.data() ?? {};
    const stats = data.stats ?? {};

    const currentBest = Number(stats.personalBestWpm ?? 0);
    const completed = Number(stats.testsCompleted ?? 0);
    const currentAvgWpm = Number(stats.avgWpm ?? 0);
    const currentAvgAccuracy = Number(stats.avgAccuracy ?? 0);
    const currentAvgConsistency = Number(stats.avgConsistency ?? 0);
    const bestByMode = stats.bestWpmByMode ?? {};
    const currentModeBest = Number(bestByMode[modeKey] ?? 0);

    const newCount = completed + 1;
    const newAvgWpm = currentAvgWpm + (run.metrics.wpm - currentAvgWpm) / newCount;
    const newAvgAccuracy = currentAvgAccuracy + (run.metrics.accuracy - currentAvgAccuracy) / newCount;
    const newAvgConsistency = currentAvgConsistency + (run.metrics.consistency - currentAvgConsistency) / newCount;

    const existingKeyErrors = data.allTimeKeyErrors ?? {};
    const existingKeyTotals = data.allTimeKeyTotals ?? {};
    const mergedKeyErrors = { ...existingKeyErrors };
    const mergedKeyTotals = { ...existingKeyTotals };

    for (const [key, count] of Object.entries(run.metrics.keyErrors || {})) {
      mergedKeyErrors[key] = (mergedKeyErrors[key] || 0) + (count as number);
    }
    for (const [key, count] of Object.entries(run.metrics.keyTotals || {})) {
      mergedKeyTotals[key] = (mergedKeyTotals[key] || 0) + (count as number);
    }

    transaction.set(reference, {
      stats: {
        personalBestWpm: Math.max(currentBest, run.metrics.wpm),
        bestWpmByMode: { ...bestByMode, [modeKey]: Math.max(currentModeBest, run.metrics.wpm) },
        testsCompleted: newCount,
        totalRaces: stats.totalRaces ?? 0,
        raceWins: stats.raceWins ?? 0,
        avgWpm: Math.round(newAvgWpm * 10) / 10,
        avgAccuracy: Math.round(newAvgAccuracy * 10) / 10,
        avgConsistency: Math.round(newAvgConsistency * 10) / 10,
      },
      allTimeKeyErrors: mergedKeyErrors,
      allTimeKeyTotals: mergedKeyTotals,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });
}

export async function recordRaceResult(uid: string, isWin: boolean) {
  const firestore = db;
  if (!firestore) return;
  const reference = doc(firestore, "users", uid);

  await runTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(reference);
    const stats = snapshot.data()?.stats ?? {};
    const totalRaces = Number(stats.totalRaces ?? 0) + 1;
    const raceWins = Number(stats.raceWins ?? 0) + (isWin ? 1 : 0);

    transaction.set(reference, {
      stats: { totalRaces, raceWins },
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });
}

export async function recordPersonalBest(uid: string, wpm: number) {
  const firestore = db;
  if (!firestore) return;
  const reference = doc(firestore, "users", uid);
  await runTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(reference);
    const currentBest = Number(snapshot.data()?.stats?.personalBestWpm ?? 0);
    const completed = Number(snapshot.data()?.stats?.testsCompleted ?? 0);
    transaction.set(reference, {
      stats: { personalBestWpm: Math.max(currentBest, wpm), testsCompleted: completed + 1 },
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });
}
