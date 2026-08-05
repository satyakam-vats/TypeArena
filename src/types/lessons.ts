export type LessonTier = "beginner" | "advanced";

export type LessonCategory = {
  tier: LessonTier;
  title: string;
  description: string;
  badge: string;
};

export type LessonExercise = {
  id: string;
  title: string;
  text: string;
  targetKeys?: string[];
  minAccuracyToPass?: number;
};

export type Lesson = {
  id: string;
  tier: LessonTier;
  code?: string;
  title: string;
  subtitle: string;
  targetKeys: string[];
  fingerGuideHint: string;
  text: string;
  exercises?: LessonExercise[];
  minAccuracyToPass: number; // e.g. 90%
  starThresholds: {
    oneStar: number; // WPM e.g. 15
    twoStars: number; // WPM e.g. 25
    threeStars: number; // WPM e.g. 40
  };
};

export type UserLessonProgress = {
  lessonId: string;
  completed: boolean;
  stars: number; // 0, 1, 2, 3
  bestWpm: number;
  bestAccuracy: number;
  attemptsCount: number;
  completedExercises?: string[]; // IDs of completed exercises within the lesson
  updatedAt: number;
};
