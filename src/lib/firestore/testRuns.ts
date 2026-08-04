import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import type { CompletedRun } from "../../types/typing";
import { db } from "../firebase";

export async function saveRun(
  uid: string,
  run: CompletedRun,
  displayName?: string,
  photoURL?: string | null,
  isGuest = false
) {
  if (!db) return;

  const summary = {
    runId: run.id,
    kind: run.kind,
    wpm: run.metrics.wpm,
    rawWpm: run.metrics.rawWpm,
    accuracy: run.metrics.accuracy,
    consistency: run.metrics.consistency,
    mode: run.settings.mode,
    value: run.settings.value,
    roomId: run.roomId ?? null,
    isWin: false,
    completedAt: serverTimestamp(),
  };

  try {
    // Save to global testRuns so ALL users and guests appear on the global leaderboard
    await setDoc(doc(db, "testRuns", run.id), {
      ownerId: uid,
      displayName: displayName ?? (isGuest ? "Guest Typist" : "Anonymous"),
      photoURL: photoURL ?? null,
      kind: run.kind,
      settings: run.settings,
      content: { sourceId: run.settings.wordSourceId, text: run.targetText.slice(0, 100), version: 1 },
      metrics: run.metrics,
      roomId: run.roomId ?? null,
      createdAt: serverTimestamp(),
      completedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn("Failed to save run to testRuns in firestore:", err);
  }

  // Save to user stats if signed in
  if (!isGuest && uid) {
    try {
      await setDoc(doc(db, "users", uid, "recentRuns", run.id), summary);
    } catch (err) {
      console.warn("Failed to save run to user recentRuns in firestore:", err);
    }
  }
}
