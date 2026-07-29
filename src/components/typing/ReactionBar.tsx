import { useCallback, useEffect, useRef, useState } from "react";
import { sendReaction, subscribeReactions } from "../../lib/firestore/rooms";

const EMOJIS = ["🔥", "⚡", "😮", "💀", "🎯", "👏"];

interface FloatingEmoji {
  id: string;
  emoji: string;
  left: number;
}

interface ReactionBarProps {
  roomId: string;
  uid: string;
  displayName: string;
  active: boolean;
}

export function ReactionBar({ roomId, uid, displayName, active }: ReactionBarProps) {
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const seenReactions = useRef<Set<string>>(new Set());
  const initialLoad = useRef(true);
  const lastReactionTime = useRef(0);
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    return subscribeReactions(roomId, (reactions) => {
      if (initialLoad.current) {
        reactions.forEach((r) => seenReactions.current.add(r.id));
        initialLoad.current = false;
        return;
      }

      const newFloating: FloatingEmoji[] = [];
      reactions.forEach((r) => {
        if (!seenReactions.current.has(r.id)) {
          seenReactions.current.add(r.id);
          newFloating.push({
            id: r.id,
            emoji: r.emoji,
            left: 10 + Math.random() * 80,
          });
        }
      });

      if (newFloating.length > 0) {
        setFloatingEmojis((prev) => [...prev, ...newFloating]);
        setTimeout(() => {
          setFloatingEmojis((prev) =>
            prev.filter((f) => !newFloating.find((n) => n.id === f.id))
          );
        }, 3000);
      }
    });
  }, [roomId]);

  const onReact = useCallback(
    (emoji: string) => {
      const now = Date.now();
      if (now - lastReactionTime.current < 2000) return;
      lastReactionTime.current = now;
      setTick(now);
      void sendReaction(roomId, uid, emoji, displayName);
    },
    [roomId, uid, displayName]
  );

  const disabled = !active || Date.now() - lastReactionTime.current < 2000;

  return (
    <>
      <div className="reaction-bar" style={{ opacity: active ? 1 : 0, pointerEvents: active ? "auto" : "none" }}>
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            className="reaction-btn"
            disabled={disabled}
            onClick={() => onReact(emoji)}
            title="Send reaction"
          >
            {emoji}
          </button>
        ))}
      </div>
      <div className="floating-reactions">
        {floatingEmojis.map((f) => (
          <div
            key={f.id}
            className="floating-emoji"
            style={{ left: `${f.left}%`, bottom: 0 }}
          >
            {f.emoji}
          </div>
        ))}
      </div>
    </>
  );
}
