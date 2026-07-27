import { ArrowRight, Copy, Plus, Users } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { createRoom, joinRoomByCode } from "../../lib/firestore/rooms";
import type { TestSettings } from "../../types/typing";

const defaultSettings: TestSettings = { mode: "words", value: 25, wordSourceId: "common-en" };

export function RaceLandingPage() {
  const navigate = useNavigate();
  const { user, enabled, signIn } = useAuth();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const requireUser = async () => { if (!user) await signIn(); return user; };
  const create = async () => {
    setError(""); setBusy(true);
    try {
      const currentUser = await requireUser();
      if (!currentUser) { setError("Sign in with Google to create a race."); return; }
      const room = await createRoom(currentUser, defaultSettings);
      navigate(`/race/${room.id}`);
    } catch { setError("Could not create a room. Check your Firebase configuration."); } finally { setBusy(false); }
  };
  const join = async () => {
    setError(""); setBusy(true);
    try {
      const currentUser = await requireUser();
      if (!currentUser) { setError("Sign in with Google to join a race."); return; }
      const roomId = await joinRoomByCode(currentUser, code);
      navigate(`/race/${roomId}`);
    } catch { setError("That room code is unavailable or the race has already started."); } finally { setBusy(false); }
  };
  return <main className="mx-auto w-full max-w-4xl px-5 pb-16 pt-12 sm:px-8 sm:pt-20">
    <div className="race-intro"><p className="eyebrow">multiplayer</p><h1>Race people, not the clock.</h1><p>Make a private room, share the code, then type the same text at the same time.</p></div>
    {!enabled && <div className="notice">Add Firebase values to <code>.env.local</code> to enable live rooms and Google sign-in.</div>}
    <div className="race-actions">
      <section className="race-card"><Plus size={20} /><h2>Start a room</h2><p>You host. Up to 8 players can join before the countdown.</p><button disabled={busy || !enabled} onClick={() => void create()} className="primary-button">create room <ArrowRight size={16} /></button></section>
      <section className="race-card"><Users size={20} /><h2>Join a room</h2><p>Paste a code from a friend and enter their lobby.</p><div className="join-row"><input value={code} onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))} placeholder="ABC123" aria-label="Room code" /><button disabled={busy || code.length < 6 || !enabled} onClick={() => void join()} className="primary-button">join</button></div></section>
    </div>
    {error && <p className="mt-5 text-center text-sm text-[var(--danger)]">{error}</p>}
    <p className="race-footnote"><Copy size={14} /> Room links copy the code automatically. Your live WPM is visible to everyone in the room.</p>
  </main>;
}
