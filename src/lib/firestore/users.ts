import { doc, runTransaction, serverTimestamp, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "../firebase";

export async function ensureUserProfile(user: User) {
  if (!db) return;
  await setDoc(doc(db, "users", user.uid), {
    displayName: user.displayName ?? "Anonymous racer",
    photoURL: user.photoURL ?? null,
    email: user.email ?? null,
    updatedAt: serverTimestamp(),
  }, { merge: true });
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
