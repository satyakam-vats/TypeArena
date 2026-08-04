import { Copy, Crown, Flag, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { LiveMetrics } from "../../components/typing/LiveMetrics";
import { ReactionBar } from "../../components/typing/ReactionBar";
import { TypingViewport } from "../../components/typing/TypingViewport";
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

function orderedPlayers(players: RacePlayer[]) {
  return [...players].sort((left, right) => {
    const timeL = left.result.finishElapsedMs ?? Number.MAX_SAFE_INTEGER;
    const timeR = right.result.finishElapsedMs ?? Number.MAX_SAFE_INTEGER;
    if (timeL === timeR) {
      return right.progress.liveWpm - left.progress.liveWpm;
    }
    return timeL - timeR;
  });
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

  useEffect(() => subscribeRoom(roomId, setRoom), [roomId]);
  useEffect(() => subscribePlayers(roomId, setPlayers), [roomId]);
  useEffect(() => { const tick = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(tick); }, []);

  // Clean leave & heartbeat on unmount / navigation so ghost hosts don't stick in quick-match.
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
      if (!leftRef.current && activeUser.uid && roomId) {
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
  const onComplete = useCallback((run: CompletedRun) => {
    if (!activeUser.uid) return;
    void updateProgress(roomId, activeUser.uid, room?.content.text.length ?? run.targetText.length, room?.content.text.length ?? run.targetText.length, run.metrics);
    void finishRace(roomId, activeUser.uid, run.metrics, run.metrics.durationMs, run.id);
  }, [room?.content.text.length, roomId, activeUser.uid]);
  const test = useTypingTest(
    room?.content.text ?? "",
    normalizeSettings({ ...room?.settings, stopOnError: "letter" }),
    onComplete,
    room?.content.seed ?? roomId,
    startTime,
  );
  useEffect(() => {
    if (!room || !activeUser.uid || room.status !== "racing") return;
    const nowMs = Date.now();
    if (nowMs - lastProgressRef.current >= 200 || test.status === "finished") {
      lastProgressRef.current = nowMs;
      void updateProgress(roomId, activeUser.uid, test.typedText.length, room.content.text.length, test.metrics);
    }
  }, [room, roomId, test.metrics, test.status, test.typedText.length, activeUser.uid]);
  useEffect(() => {
    if (!room || !activeUser.uid || room.status !== "countdown" || !countdownAt || now - countdownAt < 3000 || room.hostId !== activeUser.uid) return;
    void startRace(roomId, activeUser.uid, room.settings.raceTimeoutMs);
  }, [countdownAt, now, room, roomId, activeUser.uid]);
  const isHost = room?.hostId === activeUser.uid;
  const activePlayers = players.filter((p) => {
    if (p.presence === "left") return false;
    const lastActive = parseTimestampMs(p.lastActiveAt) || parseTimestampMs(p.joinedAt) || parseTimestampMs(p.progress?.updatedAt);
    if (lastActive > 0 && now - lastActive > 30000) return false;
    return true;
  });
  const allFinished = activePlayers.length > 0 && activePlayers.every((player) => player.result.status === "finished");
  const timedOut = room?.lifecycle.endsAt ? now >= room.lifecycle.endsAt.toMillis() : false;
  useEffect(() => {
    if (room?.status === "racing" && isHost && activeUser.uid && (allFinished || timedOut)) void endRace(roomId, activeUser.uid);
  }, [allFinished, isHost, room?.status, roomId, timedOut, activeUser.uid]);
  if (!room) return <main className="center-page"><p>Loading race room…</p></main>;
  if (room.abandoned && room.status === "finished" && !allFinished && test.status !== "finished") {
    return (
      <main className="center-page">
        <p>This lobby closed because everyone left.</p>
        <Link className="primary-button" to="/race">find another race</Link>
      </main>
    );
  }
  const showLeaderboard = room.status === "finished" || allFinished || test.status === "finished";
  const copyLink = async () => { await navigator.clipboard.writeText(`${window.location.origin}/race/${roomId}`); setCopied(true); };

  const aloneInPublic = room.roomType === "public" && room.status === "waiting" && activePlayers.length <= 1;

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
    {room.status === "racing" && !showLeaderboard && <section className="race-room">
      <div className="mb-7 flex justify-between text-sm text-[var(--muted)]"><span>live race · {activePlayers.length} racers</span><LiveMetrics metrics={test.metrics} /></div>
      <div className="race-progress">{activePlayers.map((player) => <div className="racer-line" key={player.uid}><span>{player.displayName}</span><div><i style={{ width: `${player.progress.percent}%` }} /></div><b>{player.result.finalWpm ?? player.progress.liveWpm} wpm</b></div>)}</div>
      {activeUser.uid && <ReactionBar roomId={roomId} uid={activeUser.uid} displayName={activeUser.displayName} active={!showLeaderboard} />}
      <TypingViewport target={room.content.text} typed={test.typedText} active smoothCaret />
      <textarea autoFocus value={test.typedText} onChange={(event) => test.updateTypedText(event.target.value)} onPaste={(event) => event.preventDefault()} className="typing-input" aria-label="Race typing input" spellCheck={false} autoCapitalize="off" autoCorrect="off" />
    </section>}
    {showLeaderboard && <section className="leaderboard"><p className="eyebrow"><Flag size={13} /> race results</p><h1>Final standings</h1>{orderedPlayers(activePlayers).map((player, index) => <div className="leaderboard-row" key={player.uid}><span>{index + 1}</span><b>{player.displayName}</b><em>{player.result.finalWpm ?? player.progress.liveWpm} wpm</em><small>{player.result.finishElapsedMs ? `${(player.result.finishElapsedMs / 1000).toFixed(2)}s` : "—"}</small></div>)}<Link className="primary-button" to="/race" onClick={() => { leftRef.current = true; }}><RotateCcw size={16} /> race again</Link></section>}
  </main>;
}
