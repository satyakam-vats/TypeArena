import type { User } from "firebase/auth";
import { addDoc, collection, deleteDoc, doc, getDocs, limit, onSnapshot, orderBy, query, runTransaction, serverTimestamp, setDoc, updateDoc, where, writeBatch, type Unsubscribe } from "firebase/firestore";
import { db } from "../firebase";
import { createTestText } from "../typing/wordSources";
import type { RacePlayer, RaceRoom } from "../../types/room";
import { normalizeSettings, type RunMetrics, type TestSettings } from "../../types/typing";

const codeCharacters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const makeCode = () => Array.from({ length: 6 }, () => codeCharacters[Math.floor(Math.random() * codeCharacters.length)]).join("");

function playerPayload(user: User, role: RacePlayer["role"]): Omit<RacePlayer, "joinedAt"> & { joinedAt: ReturnType<typeof serverTimestamp> } {
  return {
    uid: user.uid,
    displayName: user.displayName ?? "Anonymous racer",
    photoURL: user.photoURL ?? null,
    role,
    joinedAt: serverTimestamp(),
    presence: "joined",
    progress: { typedChars: 0, totalChars: 0, percent: 0, liveWpm: 0, accuracy: 100, updatedAt: serverTimestamp() },
    result: { status: "pending", finishElapsedMs: null, finalWpm: null, rawWpm: null, accuracy: null, testRunId: null },
  };
}

export async function createRoom(user: User, settings: TestSettings) {
  const firestore = db;
  if (!firestore) throw new Error("Firebase is not configured");
  const seed = crypto.randomUUID();
  const normalized = normalizeSettings(settings);
  // Races stay on words/time only for fairness
  const raceSettings = normalizeSettings({
    ...normalized,
    mode: normalized.mode === "time" ? "time" : "words",
    value: normalized.mode === "time" ? normalized.value : (normalized.value || 25),
    stopOnError: "off",
    confidence: "off",
    difficulty: "normal",
    blind: false,
    focusMode: false,
  });
  const text = createTestText(raceSettings, seed);
  const room = await addDoc(collection(firestore, "rooms"), {
    roomCode: makeCode(),
    roomType: "race",
    hostId: user.uid,
    status: "waiting",
    settings: { ...raceSettings, maxPlayers: 8, raceTimeoutMs: raceSettings.mode === "time" ? raceSettings.value * 1000 + 15000 : 180000 },
    content: { sourceId: raceSettings.wordSourceId, seed, text, version: 1 },
    lifecycle: { createdAt: serverTimestamp(), countdownStartedAt: null, raceStartedAt: null, endsAt: null, finishedAt: null },
    metadata: {},
  });
  await setDoc(doc(firestore, "rooms", room.id, "players", user.uid), playerPayload(user, "host"));
  return room;
}

export async function joinRoomByCode(user: User, code: string) {
  const firestore = db;
  if (!firestore) throw new Error("Firebase is not configured");
  const match = await getDocs(query(collection(firestore, "rooms"), where("roomCode", "==", code), limit(1)));
  if (match.empty) throw new Error("Room not found");
  const room = match.docs[0];
  await runTransaction(firestore, async (transaction) => {
    const freshRoom = await transaction.get(room.ref);
    const data = freshRoom.data() as Omit<RaceRoom, "id">;
    if (data.status !== "waiting") throw new Error("Race already started");
    const playerReference = doc(firestore, "rooms", room.id, "players", user.uid);
    const currentPlayer = await transaction.get(playerReference);
    if (!currentPlayer.exists()) transaction.set(playerReference, playerPayload(user, "player"));
  });
  return room.id;
}

export async function joinRoom(roomId: string, user: User) {
  const firestore = db;
  if (!firestore) throw new Error("Firebase is not configured");
  await runTransaction(firestore, async (transaction) => {
    const ref = doc(firestore, "rooms", roomId);
    const freshRoom = await transaction.get(ref);
    if (!freshRoom.exists()) throw new Error("Room not found");
    const data = freshRoom.data() as Omit<RaceRoom, "id">;
    if (data.status !== "waiting") throw new Error("Race already started");
    if ((data as { abandoned?: boolean }).abandoned) throw new Error("Room abandoned");
    const playerReference = doc(firestore, "rooms", roomId, "players", user.uid);
    const currentPlayer = await transaction.get(playerReference);
    if (!currentPlayer.exists()) transaction.set(playerReference, playerPayload(user, "player"));
  });
}

/** Remove player from room; reassign host or close empty waiting public rooms. */
export async function leaveRoom(roomId: string, uid: string): Promise<void> {
  const firestore = db;
  if (!firestore || !roomId || !uid) return;

  const roomRef = doc(firestore, "rooms", roomId);
  const playerRef = doc(firestore, "rooms", roomId, "players", uid);

  try {
    await deleteDoc(playerRef);
  } catch {
    // Player doc may already be gone.
  }

  const playersSnap = await getDocs(collection(firestore, "rooms", roomId, "players"));
  const remaining = playersSnap.docs
    .map((d) => d.data() as RacePlayer)
    .filter((p) => p.uid !== uid);

  const roomSnap = await runTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(roomRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...(snapshot.data() as Omit<RaceRoom, "id">) };
  });

  if (!roomSnap) return;

  // Empty waiting lobby → close so quick-match never reuses ghost rooms.
  if (remaining.length === 0 && (roomSnap.status === "waiting" || roomSnap.status === "countdown")) {
    await updateDoc(roomRef, {
      status: "finished",
      abandoned: true,
      hostId: null,
      "lifecycle.finishedAt": serverTimestamp(),
    });
    return;
  }

  // Host left while waiting → promote next racer.
  if (roomSnap.hostId === uid && remaining.length > 0) {
    const nextHost = remaining.find((p) => p.role === "player") ?? remaining[0];
    const batch = writeBatch(firestore);
    batch.update(roomRef, { hostId: nextHost.uid });
    batch.update(doc(firestore, "rooms", roomId, "players", nextHost.uid), { role: "host" });
    await batch.commit();
  }
}

/** Count active (non-left) players in a room. */
export async function countRoomPlayers(roomId: string): Promise<number> {
  const firestore = db;
  if (!firestore) return 0;
  const snap = await getDocs(collection(firestore, "rooms", roomId, "players"));
  return snap.size;
}

export function subscribeRoom(roomId: string, callback: (room: RaceRoom | null) => void): Unsubscribe {
  if (!db) return () => undefined;
  return onSnapshot(doc(db, "rooms", roomId), (snapshot) => callback(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as RaceRoom : null));
}

export function subscribePlayers(roomId: string, callback: (players: RacePlayer[]) => void): Unsubscribe {
  if (!db) return () => undefined;
  return onSnapshot(collection(db, "rooms", roomId, "players"), (snapshot) => callback(snapshot.docs.map((entry) => entry.data() as RacePlayer)));
}

export async function startCountdown(roomId: string, uid: string) {
  const firestore = db;
  if (!firestore) throw new Error("Firebase is not configured");
  await runTransaction(firestore, async (transaction) => {
    const ref = doc(firestore, "rooms", roomId);
    const snapshot = await transaction.get(ref);
    const room = snapshot.data() as Omit<RaceRoom, "id">;
    if (!snapshot.exists() || room.hostId !== uid || room.status !== "waiting") throw new Error("Cannot start room");
    transaction.update(ref, { status: "countdown", "lifecycle.countdownStartedAt": serverTimestamp() });
  });
}

export async function startRace(roomId: string, uid: string, timeoutMs: number) {
  const firestore = db;
  if (!firestore) throw new Error("Firebase is not configured");
  await runTransaction(firestore, async (transaction) => {
    const ref = doc(firestore, "rooms", roomId);
    const snapshot = await transaction.get(ref);
    const room = snapshot.data() as Omit<RaceRoom, "id">;
    if (!snapshot.exists() || room.hostId !== uid || room.status !== "countdown") throw new Error("Cannot start race");
    const startAt = new Date();
    transaction.update(ref, { status: "racing", "lifecycle.raceStartedAt": startAt, "lifecycle.endsAt": new Date(startAt.getTime() + timeoutMs) });
  });
}

export async function updateProgress(roomId: string, uid: string, typedChars: number, totalChars: number, metrics: Pick<RunMetrics, "wpm" | "accuracy">) {
  const firestore = db;
  if (!firestore) return;
  await updateDoc(doc(firestore, "rooms", roomId, "players", uid), {
    progress: { typedChars, totalChars, percent: Math.min(100, Math.round(typedChars / totalChars * 100)), liveWpm: metrics.wpm, accuracy: metrics.accuracy, updatedAt: serverTimestamp() },
  });
}

export async function finishRace(roomId: string, uid: string, metrics: RunMetrics, elapsedMs: number, runId: string) {
  const firestore = db;
  if (!firestore) return;
  await runTransaction(firestore, async (transaction) => {
    const playerRef = doc(firestore, "rooms", roomId, "players", uid);
    const player = await transaction.get(playerRef);
    if (!player.exists() || player.data().result.status === "finished") return;
    transaction.update(playerRef, { result: { status: "finished", finishedAt: serverTimestamp(), finishElapsedMs: elapsedMs, finalWpm: metrics.wpm, rawWpm: metrics.rawWpm, accuracy: metrics.accuracy, testRunId: runId } });
  });
}

export async function endRace(roomId: string, uid: string) {
  const firestore = db;
  if (!firestore) return;
  const roomRef = doc(firestore, "rooms", roomId);
  const room = await runTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(roomRef);
    if (!snapshot.exists() || snapshot.data().hostId !== uid || snapshot.data().status !== "racing") throw new Error("Cannot end race");
    return snapshot.data();
  });
  const pending = await getDocs(collection(firestore, "rooms", roomId, "players"));
  const batch = writeBatch(firestore);
  pending.docs.forEach((player) => {
    if (player.data().result.status === "pending") batch.update(player.ref, { "result.status": "timed_out" });
  });
  batch.update(roomRef, { status: "finished", "lifecycle.finishedAt": serverTimestamp() });
  await batch.commit();
  return room;
}

export async function sendReaction(roomId: string, uid: string, emoji: string, displayName: string): Promise<void> {
  const firestore = db;
  if (!firestore) return;
  await addDoc(collection(firestore, "rooms", roomId, "reactions"), {
    uid,
    emoji,
    displayName,
    createdAt: serverTimestamp(),
  });
}

export function subscribeReactions(roomId: string, callback: (reactions: { id: string; uid: string; emoji: string; displayName: string; createdAt: unknown }[]) => void): Unsubscribe {
  if (!db) return () => undefined;
  return onSnapshot(
    query(collection(db, "rooms", roomId, "reactions"), orderBy("createdAt"), limit(20)),
    (snapshot) => {
      callback(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as { uid: string; emoji: string; displayName: string; createdAt: unknown }),
        }))
      );
    }
  );
}
