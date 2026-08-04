import type { TestSettings } from "./typing";

export type RoomStatus = "waiting" | "countdown" | "racing" | "finished" | "cancelled";
export type RaceRoom = {
  id: string;
  roomCode: string;
  roomType: "race" | "public";
  hostId: string | null;
  status: RoomStatus;
  abandoned?: boolean;
  settings: TestSettings & { maxPlayers: number; raceTimeoutMs: number };
  content: { sourceId: string; seed: string; text: string; version: number };
  lifecycle: { createdAt?: unknown; countdownStartedAt?: { toMillis: () => number } | null; raceStartedAt?: { toMillis: () => number } | null; endsAt?: { toMillis: () => number } | null };
};

export type RacePlayer = {
  uid: string;
  displayName: string;
  photoURL: string | null;
  role: "host" | "player" | "spectator";
  joinedAt?: unknown;
  lastActiveAt?: unknown;
  presence: "joined" | "ready" | "left";
  progress: { typedChars: number; totalChars: number; percent: number; liveWpm: number; accuracy: number; updatedAt?: unknown };
  result: { status: "pending" | "finished" | "timed_out"; finishedAt?: unknown; finishElapsedMs: number | null; finalWpm: number | null; rawWpm: number | null; accuracy: number | null; testRunId: string | null };
};
