export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'mythic';
export type BadgeCategory = 'speed' | 'accuracy' | 'stamina' | 'races' | 'consistency';

export type Badge = {
  id: string;
  title: string;
  description: string;
  icon: string;
  tier: BadgeTier;
  category: BadgeCategory;
  check: (stats: UserStatsInput) => boolean;
  getProgress: (stats: UserStatsInput) => { current: number; target: number; unit?: string };
};

export type UserStatsInput = {
  personalBestWpm: number;
  testsCompleted: number;
  totalRaces: number;
  raceWins: number;
  avgAccuracy: number;
  avgConsistency: number;
};

export const BADGES: Badge[] = [
  // --- Speed Badges ---
  {
    id: 'speed_30',
    title: 'First Gear',
    icon: '🚀',
    description: 'Reach 30+ WPM',
    tier: 'bronze',
    category: 'speed',
    check: (s) => s.personalBestWpm >= 30,
    getProgress: (s) => ({ current: Math.round(s.personalBestWpm || 0), target: 30, unit: 'WPM' }),
  },
  {
    id: 'speed_60',
    title: 'Cruiser',
    icon: '🏎️',
    description: 'Reach 60+ WPM',
    tier: 'silver',
    category: 'speed',
    check: (s) => s.personalBestWpm >= 60,
    getProgress: (s) => ({ current: Math.round(s.personalBestWpm || 0), target: 60, unit: 'WPM' }),
  },
  {
    id: 'speed_80',
    title: 'Road Runner',
    icon: '⚡',
    description: 'Reach 80+ WPM',
    tier: 'gold',
    category: 'speed',
    check: (s) => s.personalBestWpm >= 80,
    getProgress: (s) => ({ current: Math.round(s.personalBestWpm || 0), target: 80, unit: 'WPM' }),
  },
  {
    id: 'speed_100',
    title: 'Supersonic',
    icon: '💥',
    description: 'Reach 100+ WPM',
    tier: 'platinum',
    category: 'speed',
    check: (s) => s.personalBestWpm >= 100,
    getProgress: (s) => ({ current: Math.round(s.personalBestWpm || 0), target: 100, unit: 'WPM' }),
  },
  {
    id: 'speed_120',
    title: 'Lightning Strike',
    icon: '🌩️',
    description: 'Reach 120+ WPM',
    tier: 'diamond',
    category: 'speed',
    check: (s) => s.personalBestWpm >= 120,
    getProgress: (s) => ({ current: Math.round(s.personalBestWpm || 0), target: 120, unit: 'WPM' }),
  },
  {
    id: 'speed_150',
    title: 'Centurion',
    icon: '💯',
    description: 'Reach 150+ WPM',
    tier: 'mythic',
    category: 'speed',
    check: (s) => s.personalBestWpm >= 150,
    getProgress: (s) => ({ current: Math.round(s.personalBestWpm || 0), target: 150, unit: 'WPM' }),
  },
  {
    id: 'speed_180',
    title: 'Typing Deity',
    icon: '👑',
    description: 'Reach 180+ WPM',
    tier: 'mythic',
    category: 'speed',
    check: (s) => s.personalBestWpm >= 180,
    getProgress: (s) => ({ current: Math.round(s.personalBestWpm || 0), target: 180, unit: 'WPM' }),
  },

  // --- Accuracy Badges ---
  {
    id: 'acc_90',
    title: 'Marksman',
    icon: '🏹',
    description: '90%+ average accuracy',
    tier: 'bronze',
    category: 'accuracy',
    check: (s) => s.avgAccuracy >= 90,
    getProgress: (s) => ({ current: Number((s.avgAccuracy || 0).toFixed(1)), target: 90, unit: '%' }),
  },
  {
    id: 'acc_95',
    title: 'Sharpshooter',
    icon: '🎯',
    description: '95%+ average accuracy',
    tier: 'silver',
    category: 'accuracy',
    check: (s) => s.avgAccuracy >= 95,
    getProgress: (s) => ({ current: Number((s.avgAccuracy || 0).toFixed(1)), target: 95, unit: '%' }),
  },
  {
    id: 'acc_98',
    title: 'Deadeye',
    icon: '🦅',
    description: '98%+ average accuracy',
    tier: 'gold',
    category: 'accuracy',
    check: (s) => s.avgAccuracy >= 98,
    getProgress: (s) => ({ current: Number((s.avgAccuracy || 0).toFixed(1)), target: 98, unit: '%' }),
  },
  {
    id: 'acc_99',
    title: 'Perfectionist',
    icon: '✨',
    description: '99%+ average accuracy',
    tier: 'platinum',
    category: 'accuracy',
    check: (s) => s.avgAccuracy >= 99,
    getProgress: (s) => ({ current: Number((s.avgAccuracy || 0).toFixed(1)), target: 99, unit: '%' }),
  },
  {
    id: 'acc_995',
    title: 'Flawless Master',
    icon: '💎',
    description: '99.5%+ average accuracy',
    tier: 'diamond',
    category: 'accuracy',
    check: (s) => s.avgAccuracy >= 99.5,
    getProgress: (s) => ({ current: Number((s.avgAccuracy || 0).toFixed(1)), target: 99.5, unit: '%' }),
  },

  // --- Stamina Badges ---
  {
    id: 'tests_1',
    title: 'First Steps',
    icon: '🐣',
    description: 'Complete 1 test',
    tier: 'bronze',
    category: 'stamina',
    check: (s) => s.testsCompleted >= 1,
    getProgress: (s) => ({ current: s.testsCompleted || 0, target: 1, unit: 'tests' }),
  },
  {
    id: 'tests_10',
    title: 'Warmup Master',
    icon: '📜',
    description: 'Complete 10 tests',
    tier: 'bronze',
    category: 'stamina',
    check: (s) => s.testsCompleted >= 10,
    getProgress: (s) => ({ current: s.testsCompleted || 0, target: 10, unit: 'tests' }),
  },
  {
    id: 'tests_50',
    title: 'Dedicated Typist',
    icon: '🏃',
    description: 'Complete 50 tests',
    tier: 'silver',
    category: 'stamina',
    check: (s) => s.testsCompleted >= 50,
    getProgress: (s) => ({ current: s.testsCompleted || 0, target: 50, unit: 'tests' }),
  },
  {
    id: 'tests_100',
    title: 'Century Club',
    icon: '🏅',
    description: 'Complete 100 tests',
    tier: 'gold',
    category: 'stamina',
    check: (s) => s.testsCompleted >= 100,
    getProgress: (s) => ({ current: s.testsCompleted || 0, target: 100, unit: 'tests' }),
  },
  {
    id: 'tests_500',
    title: 'Veteran Typist',
    icon: '🎖️',
    description: 'Complete 500 tests',
    tier: 'platinum',
    category: 'stamina',
    check: (s) => s.testsCompleted >= 500,
    getProgress: (s) => ({ current: s.testsCompleted || 0, target: 500, unit: 'tests' }),
  },
  {
    id: 'tests_1000',
    title: 'Arena Legend',
    icon: '🏛️',
    description: 'Complete 1,000 tests',
    tier: 'diamond',
    category: 'stamina',
    check: (s) => s.testsCompleted >= 1000,
    getProgress: (s) => ({ current: s.testsCompleted || 0, target: 1000, unit: 'tests' }),
  },

  // --- Race Badges ---
  {
    id: 'races_1',
    title: 'Rookie Racer',
    icon: '🏎️',
    description: 'Complete 1 race',
    tier: 'bronze',
    category: 'races',
    check: (s) => s.totalRaces >= 1,
    getProgress: (s) => ({ current: s.totalRaces || 0, target: 1, unit: 'races' }),
  },
  {
    id: 'wins_1',
    title: 'First Victory',
    icon: '🥇',
    description: 'Win 1 multiplayer race',
    tier: 'silver',
    category: 'races',
    check: (s) => s.raceWins >= 1,
    getProgress: (s) => ({ current: s.raceWins || 0, target: 1, unit: 'wins' }),
  },
  {
    id: 'races_10',
    title: 'Race Enthusiast',
    icon: '🏁',
    description: 'Complete 10 races',
    tier: 'gold',
    category: 'races',
    check: (s) => s.totalRaces >= 10,
    getProgress: (s) => ({ current: s.totalRaces || 0, target: 10, unit: 'races' }),
  },
  {
    id: 'wins_10',
    title: 'Arena Champion',
    icon: '🏆',
    description: 'Win 10 multiplayer races',
    tier: 'platinum',
    category: 'races',
    check: (s) => s.raceWins >= 10,
    getProgress: (s) => ({ current: s.raceWins || 0, target: 10, unit: 'wins' }),
  },
  {
    id: 'wins_50',
    title: 'Dominator',
    icon: '👑',
    description: 'Win 50 multiplayer races',
    tier: 'diamond',
    category: 'races',
    check: (s) => s.raceWins >= 50,
    getProgress: (s) => ({ current: s.raceWins || 0, target: 50, unit: 'wins' }),
  },

  // --- Consistency Badges ---
  {
    id: 'cons_80',
    title: 'Steady Hands',
    icon: '🧘',
    description: '80%+ average consistency',
    tier: 'silver',
    category: 'consistency',
    check: (s) => s.avgConsistency >= 80,
    getProgress: (s) => ({ current: Number((s.avgConsistency || 0).toFixed(1)), target: 80, unit: '%' }),
  },
  {
    id: 'cons_90',
    title: 'Rock Steady',
    icon: '💎',
    description: '90%+ average consistency',
    tier: 'gold',
    category: 'consistency',
    check: (s) => s.avgConsistency >= 90,
    getProgress: (s) => ({ current: Number((s.avgConsistency || 0).toFixed(1)), target: 90, unit: '%' }),
  },
  {
    id: 'cons_95',
    title: 'Metronome',
    icon: '🔮',
    description: '95%+ average consistency',
    tier: 'platinum',
    category: 'consistency',
    check: (s) => s.avgConsistency >= 95,
    getProgress: (s) => ({ current: Number((s.avgConsistency || 0).toFixed(1)), target: 95, unit: '%' }),
  },
];

export function evaluateBadges(stats: UserStatsInput): {
  badge: Badge;
  unlocked: boolean;
  progress: { current: number; target: number; unit?: string; percent: number };
}[] {
  return BADGES.map((badge) => {
    const unlocked = badge.check(stats);
    const progressData = badge.getProgress(stats);
    const percent = Math.min(100, Math.max(0, Math.round((progressData.current / progressData.target) * 100)));
    return {
      badge,
      unlocked,
      progress: { ...progressData, percent },
    };
  });
}
