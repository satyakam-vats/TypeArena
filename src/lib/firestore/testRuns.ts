import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import type { CompletedRun } from "../../types/typing";
import { db } from "../firebase";

export async function saveRun(uid: string, run: CompletedRun) {
  if (!db) return;
  const summary = {
    runId: run.id,
    kind: run.kind,
    wpm: run.metrics.wpm,
    accuracy: run.metrics.accuracy,
    roomId: run.roomId ?? null,
    completedAt: serverTimestamp(),
  };
  await Promise.all([
    setDoc(doc(db, "testRuns", run.id), {
      ownerId: uid,
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
}
