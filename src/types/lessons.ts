export type LessonTier = "home_row" | "top_row" | "bottom_row" | "numbers_symbols";

export type LessonCategory = {
  tier: LessonTier;
  title: string;
  description: string;
  badge: string;
};

export type Lesson = {
  id: string;
  tier: LessonTier;
  title: string;
  subtitle: string;
  targetKeys: string[];
  fingerGuideHint: string;
  text: string;
  minAccuracyToPass: number; // e.g. 90%
  starThresholds: {
    oneStar: number;   // WPM e.g. 15
    twoStars: number;  // WPM e.g. 25
    threeStars: number;// WPM e.g. 40
  };
};

export type UserLessonProgress = {
  lessonId: string;
  completed: boolean;
  stars: number; // 0, 1, 2, 3
  bestWpm: number;
  bestAccuracy: number;
  attemptsCount: number;
  updatedAt: number;
};
