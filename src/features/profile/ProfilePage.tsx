import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { evaluateBadges, type UserStatsInput } from '../../lib/achievements';
import { Trophy, LogOut, Mail, Calendar } from 'lucide-react';
import { TrendChart } from '../../components/charts/TrendChart';

type UserProfileData = {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  email: string | null;
  createdAt: number;
  stats: UserStatsInput & {
    bestWpmByMode: Record<string, number>;
    avgWpm: number;
  };
};

type RecentRun = {
  id: string;
  runId: string;
  kind: 'solo' | 'race';
  wpm: number;
  accuracy: number;
  consistency: number;
  rawWpm: number;
  mode: string;
  value: number;
  roomId?: string;
  completedAt: any;
  isWin?: boolean;
};

function parseTimestampMs(val: any): number {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const parsed = Date.parse(val);
    if (!isNaN(parsed)) return parsed;
  }
  if (typeof val === 'object' && typeof val.toMillis === 'function') return val.toMillis();
  if (typeof val === 'object' && typeof val.seconds === 'number') return val.seconds * 1000;
  return 0;
}

function formatRelativeDate(timestampMs: number): string {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const dateStart = new Date(timestampMs);
  dateStart.setHours(0, 0, 0, 0);
  const diffDays = Math.round((todayStart.getTime() - dateStart.getTime()) / 86400000);

  if (diffDays <= 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 30) return `${diffDays} days ago`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;

  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
}

export function ProfilePage() {
  const { uid: paramUid } = useParams<{ uid: string }>();
  const { user, signOutUser } = useAuth();

  const targetUid = paramUid || user?.uid;

  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [recentRuns, setRecentRuns] = useState<RecentRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const isOwnProfile = user && user.uid === targetUid;

  useEffect(() => {
    if (!targetUid) {
      setLoading(false);
      setError("Sign in to view your profile");
      return;
    }

    const database = db;
    if (!database) {
      setLoading(false);
      setError("Profiles require Firebase configuration");
      return;
    }

    const fetchProfileData = async () => {
      setLoading(true);
      setError(null);
      try {
        const userDocRef = doc(database, 'users', targetUid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          setError("User not found");
          setLoading(false);
          return;
        }

        const userData = userDoc.data() as UserProfileData;
        setProfile({ ...userData, uid: targetUid });

        const runsRef = collection(database, 'users', targetUid, 'recentRuns');
        const q = query(runsRef, orderBy('completedAt', 'desc'), limit(20));
        const runsSnap = await getDocs(q);

        const runs: RecentRun[] = [];
        runsSnap.forEach((d) => {
          runs.push({ id: d.id, ...d.data() } as RecentRun);
        });

        setRecentRuns(runs);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [targetUid]);

  const badgesStatus = useMemo(() => {
    const defaultStats: UserStatsInput = {
      personalBestWpm: 0,
      testsCompleted: 0,
      totalRaces: 0,
      raceWins: 0,
      avgAccuracy: 0,
      avgConsistency: 0,
    };
    return evaluateBadges({ ...defaultStats, ...profile?.stats });
  }, [profile?.stats]);

  const unlockedCount = badgesStatus.filter(b => b.unlocked).length;

  const joinedTimeMs = useMemo(() => {
    const candidates: number[] = [];

    if (isOwnProfile && user?.metadata?.creationTime) {
      const authTime = Date.parse(user.metadata.creationTime);
      if (!isNaN(authTime) && authTime > 0) candidates.push(authTime);
    }

    if (profile?.createdAt) {
      const docTime = parseTimestampMs(profile.createdAt);
      if (docTime > 0) candidates.push(docTime);
    }

    if (recentRuns.length > 0) {
      for (const r of recentRuns) {
        const rTime = parseTimestampMs(r.completedAt);
        if (rTime > 0) candidates.push(rTime);
      }
    }

    return candidates.length > 0 ? Math.min(...candidates) : Date.now();
  }, [isOwnProfile, user?.metadata?.creationTime, profile?.createdAt, recentRuns]);

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-skeleton">
          <div className="skeleton-avatar" />
          <div className="skeleton-lines">
            <div className="skeleton-line w-40" />
            <div className="skeleton-line w-24" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-container" style={{ display: 'grid', placeContent: 'center', minHeight: '50vh' }}>
        <p style={{ color: 'var(--muted)', fontSize: '1.1rem' }}>{error}</p>
        <Link to="/" className="primary-button" style={{ marginTop: 16 }}>back to typing</Link>
      </div>
    );
  }

  if (!profile) return null;

  const stats = profile.stats || {
    personalBestWpm: 0, avgWpm: 0, avgAccuracy: 0, testsCompleted: 0, totalRaces: 0, raceWins: 0, avgConsistency: 0, bestWpmByMode: {}
  };

  const chartData = [...recentRuns].reverse().map(run => {
    const timeMs = parseTimestampMs(run.completedAt);
    return {
      label: new Date(timeMs).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      value: Math.round(run.wpm || 0)
    };
  });

  const photoURL = isOwnProfile ? (user?.photoURL || profile.photoURL) : profile.photoURL;
  const email = isOwnProfile ? (user?.email || profile.email) : profile.email;
  const displayName = isOwnProfile ? (user?.displayName || profile.displayName) : profile.displayName;

  const initial = (displayName || email || '?')[0].toUpperCase();

  const joinedDateFormatted = new Date(joinedTimeMs).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="profile-container">
      {/* Header */}
      <header className="profile-header">
        <div className="profile-avatar">
          {photoURL && !avatarFailed ? (
            <img
              src={photoURL}
              alt="Avatar"
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
              onError={() => setAvatarFailed(true)}
            />
          ) : (
            <div className="profile-avatar-fallback">{initial}</div>
          )}
        </div>
        <div className="profile-info">
          <div className="profile-name-row">
            <h1 className="profile-name">{displayName || 'Anonymous Typist'}</h1>
            {isOwnProfile && (
              <button
                className="icon-button quiet"
                title="Sign out"
                onClick={() => void signOutUser()}
              >
                <LogOut size={16} />
              </button>
            )}
          </div>

          {email && (
            <p className="profile-email text-xs text-[var(--muted)] flex items-center gap-1.5 mt-1 font-mono">
              <Mail size={13} className="text-[var(--accent)]" />
              <span>{email}</span>
            </p>
          )}

          <p className="profile-joined text-xs text-[var(--muted)] flex items-center gap-1.5 mt-1" title={`Joined on ${joinedDateFormatted}`}>
            <Calendar size={13} />
            <span>joined {formatRelativeDate(joinedTimeMs)} ({joinedDateFormatted})</span>
          </p>
        </div>
      </header>

      {/* Stats Grid */}
      <section className="profile-section">
        <div className="stats-grid">
          <div className="stat-card accent-card">
            <div className="stat-label">Best WPM</div>
            <div className="stat-value">{Math.round(stats.personalBestWpm || 0)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Avg WPM</div>
            <div className="stat-value">{Math.round(stats.avgWpm || 0)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Avg Accuracy</div>
            <div className="stat-value">{stats.avgAccuracy ? stats.avgAccuracy.toFixed(1) : 0}%</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Tests</div>
            <div className="stat-value">{stats.testsCompleted || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Races</div>
            <div className="stat-value">{stats.totalRaces || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Wins</div>
            <div className="stat-value">{stats.raceWins || 0}</div>
          </div>
        </div>
      </section>

      {/* Best WPM by Mode */}
      {stats.bestWpmByMode && Object.keys(stats.bestWpmByMode).length > 0 && (
        <section className="profile-section">
          <h2 className="section-title">best wpm by mode</h2>
          <div className="mode-bests-grid">
            {Object.entries(stats.bestWpmByMode).map(([modeKey, wpm]) => {
              const [mode, val] = modeKey.split('_');
              return (
                <div key={modeKey} className="mode-best-chip">
                  <span className="mode-best-label">{mode} {val}</span>
                  <span className="mode-best-wpm">{Math.round(wpm)}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Chart Section */}
      {chartData.length > 0 && (
        <section className="profile-section">
          <h2 className="section-title">recent performance</h2>
          <div className="chart-container">
            <TrendChart data={chartData} />
          </div>
        </section>
      )}

      {/* Achievements Section */}
      <section className="profile-section">
        <div className="section-header-row">
          <h2 className="section-title" style={{ margin: 0 }}>achievements</h2>
          <span className="badge-counter">
            {unlockedCount} / {badgesStatus.length}
          </span>
        </div>
        <div className="badges-grid">
          {badgesStatus.map(({ badge, unlocked }) => (
            <div key={badge.id} className={`badge-card ${unlocked ? 'unlocked' : 'locked'}`}>
              <div className="badge-icon">{badge.icon}</div>
              <div className="badge-details">
                <h3 className="badge-title">{badge.title}</h3>
                <p className="badge-desc">{badge.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Runs */}
      <section className="profile-section">
        <h2 className="section-title">recent tests</h2>
        {recentRuns.length > 0 ? (
          <div className="recent-runs-list">
            {recentRuns.map(run => {
              const runTimeMs = parseTimestampMs(run.completedAt);
              return (
                <div key={run.id} className="run-row">
                  <div className="run-main-info">
                    <span className="run-mode">{run.mode} {run.value}</span>
                    {run.kind === 'race' && <Trophy size={14} className={run.isWin ? 'text-accent' : 'text-muted'} />}
                  </div>
                  <div className="run-metrics">
                    <span className="run-wpm">{Math.round(run.wpm)} wpm</span>
                    <span className="run-acc">{run.accuracy.toFixed(1)}%</span>
                    <span className="run-date">{new Date(runTimeMs).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ color: 'var(--muted)' }}>No recent tests found.</p>
        )}
      </section>
    </div>
  );
}

export default ProfilePage;
