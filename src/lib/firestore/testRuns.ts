import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import type { CompletedRun } from "../../types/typing";
import { db } from "../firebase";

export async function saveRun(uid: string, run: CompletedRun, displayName?: string, photoURL?: string | null) {
  if (!db) return;

  const modeKey = `${run.settings.mode}_${run.settings.value}`;

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
    await Promise.all([
      setDoc(doc(db, "testRuns", run.id), {
        ownerId: uid,
        displayName: displayName ?? "Anonymous",
        photoURL: photoURL ?? null,
        kind: run.kind,
        settings: run.settings,
        content: { sourceId: run.settings.wordSourceId, text: run.targetText, version: 1 },
        metrics: run.metrics,
        roomId: run.roomId ?? null,
        createdAt: serverTimestamp(),
        completedAt: serverTimestamp(),
      }),
      setDoc(doc(db, "users", uid, "recentRuns", run.id), summary),
    ]);
  } catch (err) {
    console.warn("Failed to save run to firestore:", err);
  }
}
