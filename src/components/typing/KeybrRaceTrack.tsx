import { Crown, CheckCircle2 } from "lucide-react";
import type { RacePlayer } from "../../types/room";

type KeybrRaceTrackProps = {
  players: RacePlayer[];
  hostId?: string;
  currentUid?: string;
};

export function KeybrRaceTrack({ players, hostId, currentUid }: KeybrRaceTrackProps) {
  return (
    <div className="keybr-racetrack">
      <div className="keybr-racetrack-header">
        <span>Racers</span>
        <span>Progress & Live WPM</span>
      </div>

      <div className="keybr-racetrack-lanes">
        {players.map((player) => {
          const isMe = player.uid === currentUid;
          const isHost = player.role === "host" || player.uid === hostId;
          const isFinished = player.result?.status === "finished";
          const percent = Math.min(100, Math.max(0, player.progress?.percent ?? 0));
          const wpm = isFinished ? (player.result.finalWpm ?? 0) : (player.progress?.liveWpm ?? 0);

          return (
            <div
              key={player.uid}
              className={`keybr-lane ${isMe ? "keybr-lane-me" : ""} ${isFinished ? "keybr-lane-finished" : ""}`}
            >
              <div className="keybr-lane-player">
                <div className="keybr-avatar">
                  {player.photoURL ? (
                    <img src={player.photoURL} alt="" />
                  ) : (
                    <span>{player.displayName.slice(0, 1).toUpperCase()}</span>
                  )}
                </div>
                <div className="keybr-player-info">
                  <span className="keybr-player-name">
                    {player.displayName} {isMe && <span className="keybr-you-badge">(You)</span>}
                  </span>
                  {isHost && <Crown size={12} className="keybr-crown" />}
                </div>
              </div>

              <div className="keybr-lane-track">
                <div className="keybr-track-bg">
                  <div
                    className={`keybr-track-fill ${isFinished ? "finished" : ""}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="keybr-lane-stats">
                  {isFinished && <CheckCircle2 size={14} className="keybr-check-icon" />}
                  <span className="keybr-wpm-pill">{wpm} WPM</span>
                  <span className="keybr-percent-label">{Math.round(percent)}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default KeybrRaceTrack;
