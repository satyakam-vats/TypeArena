export type Badge = {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'speed' | 'accuracy' | 'stamina' | 'races' | 'consistency';
  check: (stats: UserStatsInput) => boolean;
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
  {
    id: 'speed_demon',
    title: 'Speed Demon',
    icon: '⚡',
    description: 'Hit 100+ WPM',
    category: 'speed',
    check: (stats) => stats.personalBestWpm >= 100,
  },
  {
    id: 'centurion',
    title: 'Centurion',
    icon: '💯',
    description: 'Hit 150+ WPM',
    category: 'speed',
    check: (stats) => stats.personalBestWpm >= 150,
  },
  {
    id: 'sharpshooter',
    title: 'Sharpshooter',
    icon: '🎯',
    description: '98%+ average accuracy',
    category: 'accuracy',
    check: (stats) => stats.avgAccuracy >= 98,
  },
  {
    id: 'perfectionist',
    title: 'Perfectionist',
    icon: '✨',
    description: '99.5%+ average accuracy',
    category: 'accuracy',
    check: (stats) => stats.avgAccuracy >= 99.5,
  },
  {
    id: 'marathon',
    title: 'Marathon Runner',
    icon: '🏃',
    description: 'Complete 100 tests',
    category: 'stamina',
    check: (stats) => stats.testsCompleted >= 100,
  },
  {
    id: 'veteran',
    title: 'Veteran Typist',
    icon: '🏅',
    description: 'Complete 500 tests',
    category: 'stamina',
    check: (stats) => stats.testsCompleted >= 500,
  },
  {
    id: 'racer',
    title: 'Race Enthusiast',
    icon: '🏁',
    description: 'Complete 10 races',
    category: 'races',
    check: (stats) => stats.totalRaces >= 10,
  },
  {
    id: 'champion',
    title: 'Arena Champion',
    icon: '🏆',
    description: 'Win 10 races',
    category: 'races',
    check: (stats) => stats.raceWins >= 10,
  },
  {
    id: 'consistent',
    title: 'Steady Hands',
    icon: '🧘',
    description: '85%+ average consistency',
    category: 'consistency',
    check: (stats) => stats.avgConsistency >= 85,
  },
  {
    id: 'rocksteady',
    title: 'Rock Steady',
    icon: '💎',
    description: '92%+ average consistency',
    category: 'consistency',
    check: (stats) => stats.avgConsistency >= 92,
  },
];

export function evaluateBadges(stats: UserStatsInput): { badge: Badge; unlocked: boolean }[] {
  return BADGES.map((badge) => ({
    badge,
    unlocked: badge.check(stats),
  }));
}
