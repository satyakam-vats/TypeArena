import { Copy, Crown, Flag, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { LiveMetrics } from "../../components/typing/LiveMetrics";
import { TypingViewport } from "../../components/typing/TypingViewport";
import { useAuth } from "../../context/AuthContext";
import { useTypingTest } from "../../hooks/useTypingTest";
import { endRace, finishRace, startCountdown, startRace, subscribePlayers, subscribeRoom, updateProgress } from "../../lib/firestore/rooms";
import type { RacePlayer, RaceRoom } from "../../types/room";
import type { CompletedRun } from "../../types/typing";

function orderedPlayers(players: RacePlayer[]) {
  return [...players].sort((left, right) => (left.result.finishElapsedMs ?? Number.MAX_SAFE_INTEGER) - (right.result.finishElapsedMs ?? Number.MAX_SAFE_INTEGER));
}

export function RoomPage() {
  const { roomId = "" } = useParams();
  const { user } = useAuth();
  const [room, setRoom] = useState<RaceRoom | null>(null);
  const [players, setPlayers] = useState<RacePlayer[]>([]);
  const [now, setNow] = useState(Date.now());
  const [copied, setCopied] = useState(false);
  useEffect(() => subscribeRoom(roomId, setRoom), [roomId]);
  useEffect(() => subscribePlayers(roomId, setPlayers), [roomId]);
  useEffect(() => { const tick = window.setInterval(() => setNow(Date.now()), 100); return () => window.clearInterval(tick); }, []);
  const raceStartedAt = room?.lifecycle.raceStartedAt?.toMillis();
  const countdownAt = room?.lifecycle.countdownStartedAt?.toMillis();
  const countdown = countdownAt ? Math.max(0, 3 - Math.floor((now - countdownAt) / 1000)) : 3;
  const startTime = room?.status === "racing" && raceStartedAt ? raceStartedAt : undefined;
  const onComplete = useCallback((run: CompletedRun) => {
    if (!user) return;
    void finishRace(roomId, user.uid, run.metrics, run.metrics.durationMs, run.id);
  }, [roomId, user]);
  const test = useTypingTest(room?.content.text ?? "", room?.settings ?? { mode: "words", value: 25, wordSourceId: "common-en" }, onComplete, startTime);
  useEffect(() => {
    if (!room || !user || room.status !== "racing" || test.status === "finished") return;
    const timer = window.setTimeout(() => void updateProgress(roomId, user.uid, test.typedText.length, room.content.text.length, test.metrics), 250);
    return () => window.clearTimeout(timer);
  }, [room, roomId, test.metrics, test.status, test.typedText.length, user]);
  useEffect(() => {
    if (!room || !user || room.status !== "countdown" || !countdownAt || now - countdownAt < 3000 || room.hostId !== user.uid) return;
    void startRace(roomId, user.uid, room.settings.raceTimeoutMs);
  }, [countdownAt, now, room, roomId, user]);
  const isHost = room?.hostId === user?.uid;
  const allFinished = players.length > 0 && players.every((player) => player.result.status !== "pending");
  const timedOut = room?.lifecycle.endsAt ? now >= room.lifecycle.endsAt.toMillis() : false;
  useEffect(() => {
    if (room?.status === "racing" && isHost && user && (allFinished || timedOut)) void endRace(roomId, user.uid);
  }, [allFinished, isHost, room?.status, roomId, timedOut, user]);
  if (!room) return <main className="center-page"><p>Loading race room…</p></main>;
  const showLeaderboard = room.status === "finished" || allFinished || test.status === "finished";
  const copyLink = async () => { await navigator.clipboard.writeText(`${window.location.origin}/race/${roomId}`); setCopied(true); };

  return <main className="mx-auto w-full max-w-5xl px-5 pb-12 pt-9 sm:px-8 sm:pt-14">
    <div className="room-topline"><Link to="/race">← leave</Link><span>room <b>{room.roomCode}</b></span><button onClick={() => void copyLink()} className="copy-button"><Copy size={14} /> {copied ? "copied" : "copy invite"}</button></div>
    {room.status === "waiting" && <section className="lobby-panel"><p className="eyebrow">waiting room</p><h1>{players.length} {players.length === 1 ? "racer" : "racers"} ready to type.</h1><p>Everyone receives the same text. The host starts a three-second countdown when the room is ready.</p><div className="player-list">{players.map((player) => <div key={player.uid} className="player-row"><span>{player.photoURL ? <img src={player.photoURL} alt="" /> : player.displayName.slice(0, 1)}</span>{player.displayName}{player.role === "host" && <Crown size={14} />}</div>)}</div>{isHost && <button onClick={() => void startCountdown(roomId, user!.uid)} className="primary-button">start countdown</button>}</section>}
    {room.status === "countdown" && <section className="countdown-screen"><span>race begins in</span><strong>{countdown || "go"}</strong></section>}
    {room.status === "racing" && !showLeaderboard && <section className="race-room">
      <div className="mb-7 flex justify-between text-sm text-[var(--muted)]"><span>live race · {players.length} racers</span><LiveMetrics metrics={test.metrics} /></div>
      <div className="race-progress">{players.map((player) => <div className="racer-line" key={player.uid}><span>{player.displayName}</span><div><i style={{ width: `${player.progress.percent}%` }} /></div><b>{player.result.finalWpm ?? player.progress.liveWpm} wpm</b></div>)}</div>
      <TypingViewport target={room.content.text} typed={test.typedText} active />
      <textarea autoFocus value={test.typedText} onChange={(event) => test.updateTypedText(event.target.value)} onPaste={(event) => event.preventDefault()} className="typing-input" aria-label="Race typing input" spellCheck={false} autoCapitalize="off" autoCorrect="off" />
    </section>}
    {showLeaderboard && <section className="leaderboard"><p className="eyebrow"><Flag size={13} /> race results</p><h1>Final standings</h1>{orderedPlayers(players).map((player, index) => <div className="leaderboard-row" key={player.uid}><span>{index + 1}</span><b>{player.displayName}</b><em>{player.result.finalWpm ?? player.progress.liveWpm} wpm</em><small>{player.result.finishElapsedMs ? `${(player.result.finishElapsedMs / 1000).toFixed(2)}s` : "—"}</small></div>)}<Link className="primary-button" to="/race"><RotateCcw size={16} /> race again</Link></section>}
  </main>;
}
