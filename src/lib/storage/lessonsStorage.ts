import type { UserLessonProgress, Lesson } from "../../types/lessons";
import { LESSONS } from "../../data/lessonsData";

const STORAGE_KEY = "typearena_lessons_progress";

export function getStoredLessonProgress(): Record<string, UserLessonProgress> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    let progress = JSON.parse(raw);

    // Migration: old lesson-1, lesson-2... -> beginner-1a, beginner-1b...
    const oldToNew: Record<string, string> = {
      "lesson-1": "beginner-1a",
      "lesson-2": "beginner-1b",
      "lesson-3": "beginner-2a",
      "lesson-4": "beginner-2b",
      "lesson-5": "beginner-3",
      "lesson-6": "beginner-4",
      "lesson-7": "beginner-5",
      "lesson-8": "beginner-6",
      "lesson-9": "beginner-7",
      "lesson-10": "advanced-1",
      "lesson-11": "advanced-2",
      "lesson-12": "advanced-3",
      "lesson-13": "advanced-4",
      "lesson-14": "advanced-5",
      "lesson-15": "advanced-6",
      // note: original had lesson-15 as grand master, now mapped to advanced-6
    };

    // Migrate any old keys
    const migrated: Record<string, UserLessonProgress> = {};
    for (const [oldId, val] of Object.entries(progress)) {
      const newId = oldToNew[oldId] || oldId;
      if (val && typeof val === "object" && val !== null) {
        migrated[newId] = val as UserLessonProgress;
      }
    }

    return migrated;
  } catch (e) {
    console.error("Failed to load lesson progress from storage", e);
    return {};
  }
}

export function saveStoredLessonProgress(progress: Record<string, UserLessonProgress>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error("Failed to save lesson progress to storage", e);
  }
}

export function calculateLessonStars(lesson: Lesson, wpm: number, accuracy: number): number {
  if (accuracy < lesson.minAccuracyToPass) {
    return 0; // Failed accuracy threshold
  }
  if (wpm >= lesson.starThresholds.threeStars) return 3;
  if (wpm >= lesson.starThresholds.twoStars) return 2;
  if (wpm >= lesson.starThresholds.oneStar) return 1;
  return 1; // Passed accuracy
}

export function recordLessonAttempt(
  lesson: Lesson,
  wpm: number,
  accuracy: number
): { progress: UserLessonProgress; starsEarned: number; passed: boolean } {
  const currentMap = getStoredLessonProgress();
  const existing = currentMap[lesson.id];
  const passed = accuracy >= lesson.minAccuracyToPass;
  const starsEarned = passed ? calculateLessonStars(lesson, wpm, accuracy) : 0;

  const nextProgress: UserLessonProgress = {
    lessonId: lesson.id,
    completed: existing?.completed || passed,
    stars: Math.max(existing?.stars || 0, starsEarned),
    bestWpm: Math.max(existing?.bestWpm || 0, passed ? wpm : 0),
    bestAccuracy: Math.max(existing?.bestAccuracy || 0, accuracy),
    attemptsCount: (existing?.attemptsCount || 0) + 1,
    updatedAt: Date.now(),
  };

  currentMap[lesson.id] = nextProgress;
  saveStoredLessonProgress(currentMap);

  return { progress: nextProgress, starsEarned, passed };
}

export function isLessonUnlocked(lessonId: string, progressMap: Record<string, UserLessonProgress>): boolean {
  const index = LESSONS.findIndex((l) => l.id === lessonId);
  if (index <= 0) return true; // First lesson is always unlocked
  const prevLesson = LESSONS[index - 1];
  if (!prevLesson) return true;
  const prevProgress = progressMap[prevLesson.id];
  return Boolean(prevProgress && prevProgress.completed);
}

export function getTotalStarsEarned(progressMap: Record<string, UserLessonProgress>): number {
  return Object.values(progressMap).reduce((acc, p) => acc + (p.stars || 0), 0);
}
