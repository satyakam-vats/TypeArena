import { Copy, Crown, Flag, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { KeybrRaceTrack } from "../../components/typing/KeybrRaceTrack";
import { KeybrViewport } from "../../components/typing/KeybrViewport";
import { LiveMetrics } from "../../components/typing/LiveMetrics";
import { ReactionBar } from "../../components/typing/ReactionBar";
import { useAuth } from "../../context/AuthContext";
import { useTypingTest } from "../../hooks/useTypingTest";
import { endRace, finishRace, leaveRoom, startCountdown, startRace, subscribePlayers, subscribeRoom, updateHeartbeat, updateProgress } from "../../lib/firestore/rooms";
import type { RacePlayer, RaceRoom } from "../../types/room";
import { normalizeSettings, type CompletedRun } from "../../types/typing";

function parseTimestampMs(val: any): number {
  if (!val) return 0;
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const parsed = Date.parse(val);
    if (!isNaN(parsed)) return parsed;
  }
  if (typeof val === "object" && typeof val.toMillis === "function") return val.toMillis();
  if (typeof val === "object" && typeof val.seconds === "number") return val.seconds * 1000;
  return 0;
}

function isRaceDone(status: string | undefined) {
  return status === "finished" || status === "timed_out";
}

function orderedPlayers(players: RacePlayer[]) {
  return [...players].sort((left, right) => {
    const leftDone = isRaceDone(left.result.status);
    const rightDone = isRaceDone(right.result.status);
    // Finished racers first by finish time; never re-rank by volatile liveWpm (causes standings blink).
    if (leftDone && rightDone) {
      return (left.result.finishElapsedMs ?? Number.MAX_SAFE_INTEGER) - (right.result.finishElapsedMs ?? Number.MAX_SAFE_INTEGER);
    }
    if (leftDone !== rightDone) return leftDone ? -1 : 1;
    // Still racing: stable order by progress percent, then name (not live WPM).
    const pct = (right.progress.percent ?? 0) - (left.progress.percent ?? 0);
    if (pct !== 0) return pct;
    return left.displayName.localeCompare(right.displayName);
  });
}

function displayWpm(player: RacePlayer) {
  if (isRaceDone(player.result.status) && player.result.finalWpm != null) {
    return player.result.finalWpm;
  }
  return player.progress.liveWpm;
}

/** Prefer richer snapshots; never drop a player we already showed on standings. */
function mergeStandings(prev: RacePlayer[], next: RacePlayer[]): RacePlayer[] {
  const byUid = new Map<string, RacePlayer>();
  for (const p of prev) byUid.set(p.uid, p);
  for (const p of next) {
    const old = byUid.get(p.uid);
    if (!old) {
      byUid.set(p.uid, p);
      continue;
    }
    // Keep finished result if the new snapshot is missing it (transient Firestore gap).
    const oldDone = isRaceDone(old.result.status);
    const newDone = isRaceDone(p.result.status);
    if (oldDone && !newDone) continue;
    byUid.set(p.uid, p);
  }
  return orderedPlayers([...byUid.values()]);
}

function getGuestIdentity(): { uid: string; displayName: string } {
  let guestId = localStorage.getItem("typearena_guest_id");
  if (!guestId) {
    guestId = "guest_" + Math.random().toString(36).substring(2, 8);
    localStorage.setItem("typearena_guest_id", guestId);
  }
  const tag = guestId.slice(-4).toUpperCase();
  return { uid: guestId, displayName: `Guest-${tag}` };
}

export function RoomPage() {
  const { roomId = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const activeUser = useMemo(() => {
    if (user) return { uid: user.uid, displayName: user.displayName ?? "Racer", photoURL: user.photoURL };
    return { ...getGuestIdentity(), photoURL: null };
  }, [user]);

  const [room, setRoom] = useState<RaceRoom | null>(null);
  const [players, setPlayers] = useState<RacePlayer[]>([]);
  const [now, setNow] = useState(Date.now());
  const [copied, setCopied] = useState(false);
  const leftRef = useRef(false);
  const roomStatusRef = useRef<string | undefined>(undefined);
  /** Once standings are shown, keep them — never blank the row for a Firestore blip. */
  const standingsSealedRef = useRef(false);
  const frozenStandingsRef = useRef<RacePlayer[]>([]);
  /** Local finisher row so we still render if our Firestore player doc blips away. */
  const localResultRef = useRef<RacePlayer | null>(null);

  useEffect(() => subscribeRoom(roomId, setRoom), [roomId]);
  useEffect(() => subscribePlayers(roomId, setPlayers), [roomId]);
  useEffect(() => { const tick = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(tick); }, []);

  roomStatusRef.current = room?.status;

  // Reset sealed standings when entering a different room.
  useEffect(() => {
    standingsSealedRef.current = false;
    frozenStandingsRef.current = [];
    localResultRef.current = null;
  }, [roomId]);

  // Heartbeat while in room. Auto-leave only from lobby — not mid-race/results
  // (deleting the player doc was blanking final standings for ~0.5s).
  useEffect(() => {
    if (!activeUser.uid || !roomId) return;
    leftRef.current = false;

    void updateHeartbeat(roomId, activeUser.uid);
    const hbInterval = window.setInterval(() => {
      if (!leftRef.current) void updateHeartbeat(roomId, activeUser.uid);
    }, 4000);

    const onUnload = () => {
      if (!leftRef.current && activeUser.uid && roomId) {
        leftRef.current = true;
        void leaveRoom(roomId, activeUser.uid);
      }
    };

    window.addEventListener("beforeunload", onUnload);
    window.addEventListener("pagehide", onUnload);

    return () => {
      window.clearInterval(hbInterval);
      window.removeEventListener("beforeunload", onUnload);
      window.removeEventListener("pagehide", onUnload);
      const status = roomStatusRef.current;
      // Only auto-leave waiting/countdown so quick-match lobbies free up.
      // Racing/finished: keep player doc so standings don't flicker or vanish.
      if (!leftRef.current && activeUser.uid && roomId && (status === "waiting" || status === "countdown" || !status)) {
        leftRef.current = true;
        void leaveRoom(roomId, activeUser.uid);
      }
    };
  }, [roomId, activeUser.uid]);

  const handleLeave = useCallback(async () => {
    if (activeUser.uid && roomId && !leftRef.current) {
      leftRef.current = true;
      await leaveRoom(roomId, activeUser.uid);
    }
    navigate("/race");
  }, [navigate, roomId, activeUser.uid]);
  const raceStartedAt = room?.lifecycle.raceStartedAt?.toMillis();
  const countdownAt = room?.lifecycle.countdownStartedAt?.toMillis();
  const countdown = countdownAt ? Math.max(0, 3 - Math.floor((now - countdownAt) / 1000)) : 3;
  const startTime = room?.status === "racing" && raceStartedAt ? raceStartedAt : undefined;
  const lastProgressRef = useRef<number>(0);
  const lastSentRef = useRef({ chars: -1, wpm: -1, acc: -1 });
  const finishedProgressSentRef = useRef(false);
  const onComplete = useCallback((run: CompletedRun) => {
    if (!activeUser.uid) return;
    finishedProgressSentRef.current = true;
    const total = room?.content.text.length ?? run.targetText.length;
    // Cache local result only — do NOT open standings early (others may still be racing).
    localResultRef.current = {
      uid: activeUser.uid,
      displayName: activeUser.displayName,
      photoURL: activeUser.photoURL ?? null,
      role: "player",
      presence: "joined",
      progress: {
        typedChars: total,
        totalChars: total,
        percent: 100,
        liveWpm: run.metrics.wpm,
        accuracy: run.metrics.accuracy,
      },
      result: {
        status: "finished",
        finishElapsedMs: run.metrics.durationMs,
        finalWpm: run.metrics.wpm,
        rawWpm: run.metrics.rawWpm,
        accuracy: run.metrics.accuracy,
        testRunId: run.id,
      },
    };
    void updateProgress(roomId, activeUser.uid, total, total, run.metrics);
    void finishRace(roomId, activeUser.uid, run.metrics, run.metrics.durationMs, run.id);
  }, [room?.content.text.length, roomId, activeUser.uid, activeUser.displayName, activeUser.photoURL]);
  const test = useTypingTest(
    room?.content.text ?? "",
    normalizeSettings({ ...room?.settings, stopOnError: "letter" }),
    onComplete,
    room?.content.seed ?? roomId,
    startTime,
  );

  // Reset finish guard when a new race/content loads.
  useEffect(() => {
    finishedProgressSentRef.current = false;
    lastSentRef.current = { chars: -1, wpm: -1, acc: -1 };
    lastProgressRef.current = 0;
  }, [room?.content.seed, roomId, startTime]);

  useEffect(() => {
    if (!room || !activeUser.uid || room.status !== "racing") return;
    // Critical: once finished, never spam progress again on every Firestore room snapshot
    // (that was re-rendering everyone's race UI and making bars/WPM thrash).
    if (test.status === "finished" || finishedProgressSentRef.current) return;

    const nowMs = Date.now();
    if (nowMs - lastProgressRef.current < 400) return;

    const chars = test.typedText.length;
    const wpm = test.metrics.wpm;
    const acc = Math.round(test.metrics.accuracy);
    const prev = lastSentRef.current;
    // Only write when something meaningful changed (cuts liveWpm jitter on peers).
    if (chars === prev.chars && Math.abs(wpm - prev.wpm) < 2 && acc === prev.acc) return;

    lastProgressRef.current = nowMs;
    lastSentRef.current = { chars, wpm, acc };
    void updateProgress(roomId, activeUser.uid, chars, room.content.text.length, test.metrics);
  }, [room, roomId, test.metrics, test.status, test.typedText.length, activeUser.uid]);
  useEffect(() => {
    if (!room || !activeUser.uid || room.status !== "countdown" || !countdownAt || now - countdownAt < 3000 || room.hostId !== activeUser.uid) return;
    void startRace(roomId, activeUser.uid, room.settings.raceTimeoutMs);
  }, [countdownAt, now, room, roomId, activeUser.uid]);
  const isHost = room?.hostId === activeUser.uid;
  const activePlayers = useMemo(() => players.filter((p) => {
    // Always keep finishers on the board — never drop them for presence/heartbeat lag.
    if (isRaceDone(p.result?.status)) return true;
    if (p.presence === "left") return false;
    const lastActive = parseTimestampMs(p.lastActiveAt) || parseTimestampMs(p.joinedAt) || parseTimestampMs(p.progress?.updatedAt);
    if (lastActive > 0 && now - lastActive > 30000) return false;
    return true;
  }), [players, now]);

  const allFinished = activePlayers.length > 0 && activePlayers.every((player) => isRaceDone(player.result.status));
  const timedOut = room?.lifecycle.endsAt ? now >= room.lifecycle.endsAt.toMillis() : false;
  useEffect(() => {
    if (room?.status === "racing" && isHost && activeUser.uid && (allFinished || timedOut)) void endRace(roomId, activeUser.uid);
  }, [allFinished, isHost, room?.status, roomId, timedOut, activeUser.uid]);

  // Hooks must stay above any early return (blank screen crash if useMemo ran only after room loaded).
  const progressPlayers = useMemo(
    () => [...activePlayers].sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [activePlayers],
  );

  // Seal standings once race is over — empty Firestore snapshots must not clear the UI.
  const raceOver = !!room && (room.status === "finished" || allFinished);
  if (raceOver) {
    standingsSealedRef.current = true;
    let next = activePlayers;
    if (localResultRef.current) next = mergeStandings(next, [localResultRef.current]);
    if (next.length > 0) {
      frozenStandingsRef.current = mergeStandings(frozenStandingsRef.current, next);
    }
  }
  const showLeaderboard = standingsSealedRef.current || raceOver;
  const standings = useMemo(() => {
    if (standingsSealedRef.current && frozenStandingsRef.current.length > 0) {
      return frozenStandingsRef.current;
    }
    return orderedPlayers(activePlayers);
  }, [activePlayers, showLeaderboard, players]);

  const localFinished = test.status === "finished";
  const aloneInPublic = !!room && room.roomType === "public" && room.status === "waiting" && activePlayers.length <= 1;

  const copyLink = async () => {
    if (!room) return;
    await navigator.clipboard.writeText(`${window.location.origin}/race/${roomId}`);
    setCopied(true);
  };

  if (!room) return <main className="center-page"><p>Loading race room…</p></main>;
  if (room.abandoned && room.status === "finished" && !allFinished && test.status !== "finished") {
    return (
      <main className="center-page">
        <p>This lobby closed because everyone left.</p>
        <Link className="primary-button" to="/race">find another race</Link>
      </main>
    );
  }

  return <main className="mx-auto w-full max-w-5xl px-5 pb-12 pt-9 sm:px-8 sm:pt-14">
    <div className="room-topline">
      <button type="button" onClick={() => void handleLeave()} className="quiet-button" style={{ padding: 0 }}>← leave</button>
      <span>room <b>{room.roomCode}</b></span>
      <button onClick={() => void copyLink()} className="copy-button"><Copy size={14} /> {copied ? "copied" : "copy invite"}</button>
    </div>
    {room.status === "waiting" && (
      <section className="lobby-panel">
        <p className="eyebrow">waiting room</p>
        <h1>{activePlayers.length} {activePlayers.length === 1 ? "racer" : "racers"} ready to type.</h1>
        <p>
          {aloneInPublic
            ? "Waiting for another typist to join this quick match. Leave anytime — the room will free up for others."
            : "Everyone receives the same text. The host starts a three-second countdown when the room is ready."}
        </p>
        <div className="player-list">
          {activePlayers.map((player) => (
            <div key={player.uid} className="player-row">
              <span>{player.photoURL ? <img src={player.photoURL} alt="" /> : player.displayName.slice(0, 1)}</span>
              {player.displayName}
              {(player.role === "host" || player.uid === room.hostId) && <Crown size={14} />}
            </div>
          ))}
        </div>
        {isHost && activePlayers.length >= 1 && (
          <button
            onClick={() => void startCountdown(roomId, activeUser.uid)}
            className="primary-button"
            disabled={room.roomType === "public" && activePlayers.length < 2}
            title={room.roomType === "public" && activePlayers.length < 2 ? "Need at least 2 racers for quick match" : undefined}
          >
            start countdown
          </button>
        )}
        {isHost && room.roomType === "public" && activePlayers.length < 2 && (
          <p className="mt-3 text-sm text-[var(--muted)]">Quick match starts once a second racer joins.</p>
        )}
      </section>
    )}
    {room.status === "countdown" && <section className="countdown-screen"><span>race begins in</span><strong>{countdown || "go"}</strong></section>}
    {room.status === "racing" && !showLeaderboard && (
      <section className="race-room">
        <div className="mb-5 flex items-center justify-between text-sm text-[var(--muted)]">
          <span className="font-mono">
            {localFinished
              ? "🏁 Finished — waiting for other racers…"
              : `Live Race · ${activePlayers.length} racers`}
          </span>
          <LiveMetrics metrics={test.metrics} />
        </div>

        <KeybrRaceTrack
          players={progressPlayers}
          hostId={room.hostId ?? undefined}
          currentUid={activeUser.uid}
        />

        {activeUser.uid && (
          <ReactionBar
            roomId={roomId}
            uid={activeUser.uid}
            displayName={activeUser.displayName}
            active={!localFinished}
          />
        )}

        {!localFinished ? (
          <>
            <KeybrViewport
              target={room.content.text}
              typed={test.typedText}
              active
              caretStyle="line"
            />
            <textarea
              autoFocus
              value={test.typedText}
              onChange={(event) => test.updateTypedText(event.target.value)}
              onPaste={(event) => event.preventDefault()}
              className="typing-input"
              aria-label="Race typing input"
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
            />
          </>
        ) : (
          <div className="mt-6 p-4 rounded-lg bg-[var(--paper-soft)] border border-[var(--line)] text-center text-sm text-[var(--muted)] font-mono">
            🎉 You finished! Waiting for all racers to complete to display final standings.
          </div>
        )}
      </section>
    )}
    {showLeaderboard && (
      <section className="leaderboard">
        <p className="eyebrow"><Flag size={13} /> race results</p>
        <h1>Final standings</h1>
        {standings.map((player, index) => (
          <div className="leaderboard-row" key={player.uid}>
            <span>{index + 1}</span>
            <b>{player.displayName}</b>
            <em>{displayWpm(player)} wpm</em>
            <small>{player.result.finishElapsedMs ? `${(player.result.finishElapsedMs / 1000).toFixed(2)}s` : "—"}</small>
          </div>
        ))}
        <Link className="primary-button" to="/race" onClick={() => { leftRef.current = true; }}><RotateCcw size={16} /> race again</Link>
      </section>
    )}
  </main>;
}
