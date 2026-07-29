import { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchLeaderboard, type LeaderboardEntry } from '../../lib/firestore/leaderboards';

export function LeaderboardPage() {
  const { user } = useAuth();

  const [timeframe, setTimeframe] = useState<'all-time' | 'weekly' | 'daily'>('all-time');
  const [mode, setMode] = useState<'all' | 'time' | 'words'>('all');
  const [timeValue, setTimeValue] = useState<15 | 30 | 60>(30);
  const [wordsValue, setWordsValue] = useState<10 | 25 | 50>(25);

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchLeaderboard({
      mode: mode === 'all' ? undefined : mode,
      value: mode === 'time' ? timeValue : mode === 'words' ? wordsValue : undefined,
      timeframe,
      max: 50
    }).then(res => {
      setEntries(res);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to fetch leaderboard:', err);
      setLoading(false);
    });
  }, [timeframe, mode, timeValue, wordsValue]);

  const userRankIndex = entries.findIndex(e => e.uid === user?.uid);
  const isUserInTop = userRankIndex !== -1;

  const getRankMedal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank.toString();
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8 animate-fade-in leaderboard">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-[var(--ink)] tracking-tight mb-2 flex items-center gap-2">
          <Trophy className="w-8 h-8 text-[var(--accent)]" />
          leaderboard
        </h1>
        <p className="text-[var(--muted)]">top typists across the arena</p>
      </div>

      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
          <button 
            className={`control ${timeframe === 'all-time' ? 'control-active' : ''}`}
            onClick={() => setTimeframe('all-time')}
          >
            all-time
          </button>
          <button 
            className={`control ${timeframe === 'weekly' ? 'control-active' : ''}`}
            onClick={() => setTimeframe('weekly')}
          >
            weekly
          </button>
          <button 
            className={`control ${timeframe === 'daily' ? 'control-active' : ''}`}
            onClick={() => setTimeframe('daily')}
          >
            daily
          </button>

          <div className="control-divider h-6 w-px bg-[var(--line)] mx-2"></div>

          <button 
            className={`control ${mode === 'all' ? 'control-active' : ''}`}
            onClick={() => setMode('all')}
          >
            all
          </button>
          <button 
            className={`control ${mode === 'time' ? 'control-active' : ''}`}
            onClick={() => setMode('time')}
          >
            time
          </button>
          <button 
            className={`control ${mode === 'words' ? 'control-active' : ''}`}
            onClick={() => setMode('words')}
          >
            words
          </button>

          {mode === 'time' && (
            <>
              <div className="control-divider h-6 w-px bg-[var(--line)] mx-2"></div>
              {[15, 30, 60].map(v => (
                <button
                  key={v}
                  className={`control ${timeValue === v ? 'control-active' : ''}`}
                  onClick={() => setTimeValue(v as any)}
                >
                  {v}
                </button>
              ))}
            </>
          )}

          {mode === 'words' && (
            <>
              <div className="control-divider h-6 w-px bg-[var(--line)] mx-2"></div>
              {[10, 25, 50].map(v => (
                <button
                  key={v}
                  className={`control ${wordsValue === v ? 'control-active' : ''}`}
                  onClick={() => setWordsValue(v as any)}
                >
                  {v}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      <div className="global-leaderboard-container">
        <div className="global-leaderboard-header text-xs uppercase tracking-wider text-[var(--muted)] pb-2 mb-4 border-b border-[var(--line)] font-mono">
          <div className="global-leaderboard-row">
            <div>#</div>
            <div>user</div>
            <div className="text-right">wpm</div>
            <div className="text-right">acc</div>
            <div className="text-right">mode</div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="global-leaderboard-row p-3 bg-[var(--surface)] rounded skeleton">
                <div className="w-4 h-4 bg-[var(--line)] rounded"></div>
                <div className="w-24 h-4 bg-[var(--line)] rounded"></div>
                <div className="w-8 h-4 bg-[var(--line)] rounded ml-auto"></div>
                <div className="w-8 h-4 bg-[var(--line)] rounded ml-auto"></div>
                <div className="w-12 h-4 bg-[var(--line)] rounded ml-auto"></div>
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 text-[var(--muted)]">
            no scores yet — be the first!
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {entries.map((entry, idx) => {
              const isCurrentUser = user && user.uid === entry.uid;
              return (
                <div 
                  key={entry.id} 
                  className={`global-leaderboard-row p-3 rounded items-center ${isCurrentUser ? 'bg-[var(--accent-soft)] border border-[var(--accent)]' : 'bg-[var(--surface)]'}`}
                >
                  <div className={`font-mono flex items-center justify-center w-6 h-6 ${idx < 3 ? 'text-lg' : 'text-[var(--muted)]'}`}>
                    {getRankMedal(idx + 1)}
                  </div>
                  <Link to={entry.uid === 'local-user' ? '#' : `/profile/${entry.uid}`} className="flex items-center gap-3 overflow-hidden hover:underline">
                    {entry.photoURL ? (
                      <img src={entry.photoURL} alt={entry.displayName} className="w-6 h-6 rounded-full" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[var(--line)] flex-shrink-0"></div>
                    )}
                    <div className="truncate font-medium text-[var(--ink)]">{entry.displayName}</div>
                  </Link>
                  <div className="font-mono text-right text-[var(--accent)] font-bold">
                    {Math.round(entry.wpm)}
                  </div>
                  <div className="font-mono text-right text-[var(--muted)]">
                    {Math.round(entry.accuracy)}%
                  </div>
                  <div className="font-mono text-right text-[var(--muted)] text-xs bg-[var(--paper)] px-2 py-1 rounded border border-[var(--line)] whitespace-nowrap">
                    {entry.mode} {entry.value}
                  </div>
                </div>
              );
            })}

            {user && !isUserInTop && (
              <>
                <div className="text-center text-[var(--muted)] py-2">...</div>
                <div className="global-leaderboard-row p-3 rounded items-center bg-[var(--accent-soft)] border border-[var(--accent)] opacity-90">
                  <div className="font-mono flex items-center justify-center w-6 h-6 text-[var(--muted)]">—</div>
                  <Link to="/profile" className="flex items-center gap-3 overflow-hidden hover:underline">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || 'You'} className="w-6 h-6 rounded-full" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[var(--line)] flex-shrink-0"></div>
                    )}
                    <div className="truncate font-medium text-[var(--ink)]">{user.displayName || 'You'}</div>
                  </Link>
                  <div className="font-mono text-right text-[var(--accent)] font-bold">-</div>
                  <div className="font-mono text-right text-[var(--muted)]">-</div>
                  <div className="font-mono text-right text-[var(--muted)] text-xs bg-[var(--paper)] px-2 py-1 rounded border border-[var(--line)] whitespace-nowrap">
                    your rank
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
