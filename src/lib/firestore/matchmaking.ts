import { addDoc, collection, doc, getDocs, limit, onSnapshot, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "../firebase";
import { createRoom, joinRoom } from "./rooms";
import type { TestSettings } from "../../types/typing";
import type { RaceRoom } from "../../types/room";

export async function joinMatchmakingQueue(user: User): Promise<() => void> {
  if (!db) throw new Error("Firebase is not configured");
  const queueRef = collection(db, "matchmaking_queue");
  await addDoc(queueRef, {
    uid: user.uid,
    joinedAt: serverTimestamp(),
    status: "searching"
  });

  return () => {
    // Unsubscribe / leave queue cleanup
  };
}

export function subscribeToQueueMatch(uid: string, onMatch: (roomId: string) => void): () => void {
  if (!db) return () => undefined;
  const queueRef = collection(db, "matchmaking_queue");
  const q = query(queueRef, where("uid", "==", uid), limit(1));
  
  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "modified") {
        const data = change.doc.data();
        if (data.status === "matched" && data.roomId) {
          onMatch(data.roomId);
        }
      }
    });
  });
}

export async function findOrCreatePublicRoom(user: User, settings: TestSettings): Promise<string> {
  if (!db) throw new Error("Firebase is not configured");
  const roomsRef = collection(db, "rooms");
  // Find a public room that is waiting and has space
  const q = query(
    roomsRef,
    where("roomType", "==", "public"),
    where("status", "==", "waiting"),
    limit(1)
  );

  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const roomDoc = snapshot.docs[0];
    try {
      await joinRoom(roomDoc.id, user);
      return roomDoc.id;
    } catch (err) {
      console.warn("Failed to join found room, trying again or creating...", err);
    }
  }

  // Create a new public room
  const newRoom = await createRoom(user, settings);
  await updateDoc(doc(db, "rooms", newRoom.id), {
    roomType: "public"
  });
  
  return newRoom.id;
}
