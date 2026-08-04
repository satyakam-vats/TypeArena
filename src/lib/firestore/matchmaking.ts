import { collection, doc, getDocs, limit, query, updateDoc, where } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "../firebase";
import { countRoomPlayers, createRoom, joinRoom } from "./rooms";
import type { TestSettings } from "../../types/typing";

/**
 * Find an open public waiting room with at least one real player, or create one.
 * Skips empty / abandoned ghost rooms left by hosts who never started.
 */
export async function findOrCreatePublicRoom(user: User, settings: TestSettings): Promise<string> {
  if (!db) throw new Error("Firebase is not configured");
  const roomsRef = collection(db, "rooms");

  const q = query(
    roomsRef,
    where("roomType", "==", "public"),
    where("status", "==", "waiting"),
    limit(8)
  );

  const snapshot = await getDocs(q);

  for (const roomDoc of snapshot.docs) {
    const data = roomDoc.data();
    if (data.abandoned) continue;

    try {
      const playerCount = await countRoomPlayers(roomDoc.id);

      if (playerCount <= 0) {
        // Ghost room (no active typists): mark abandoned so it drops out of matchmaking.
        await updateDoc(doc(db, "rooms", roomDoc.id), {
          status: "finished",
          abandoned: true,
          hostId: null,
        }).catch(() => undefined);
        continue;
      }

      // If user is host of an existing active waiting public room, return it
      if (data.hostId === user.uid) {
        return roomDoc.id;
      }

      if (playerCount >= 8) continue;

      await joinRoom(roomDoc.id, user);
      return roomDoc.id;
    } catch (err) {
      console.warn("Failed to join public room candidate", roomDoc.id, err);
    }
  }

  const newRoom = await createRoom(user, settings);
  await updateDoc(doc(db, "rooms", newRoom.id), {
    roomType: "public",
    abandoned: false,
  });

  return newRoom.id;
}
