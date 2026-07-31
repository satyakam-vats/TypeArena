import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, Star, Trophy, Award, Play } from "lucide-react";
import { LESSONS, LESSON_CATEGORIES } from "../../data/lessonsData";
import {
  getStoredLessonProgress,
  isLessonUnlocked,
  getTotalStarsEarned,
} from "../../lib/storage/lessonsStorage";
import type { LessonTier } from "../../types/lessons";

export function LessonsOverviewPage() {
  const navigate = useNavigate();
  const [progressMap] = useState(() => getStoredLessonProgress());

  const totalStars = useMemo(() => getTotalStarsEarned(progressMap), [progressMap]);
  const maxPossibleStars = LESSONS.length * 3;
  const completedCount = useMemo(
    () => Object.values(progressMap).filter((p) => p.completed).length,
    [progressMap]
  );
  const completionPercentage = Math.round((completedCount / LESSONS.length) * 100);

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
      <Link to="/" className="back-link mb-6 inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--ink)] transition-colors">
        <ArrowLeft size={16} /> Back to typing test
      </Link>

      {/* Header Banner */}
      <section className="mb-10 rounded-2xl border border-[var(--line)] bg-[var(--paper-soft)] p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent)] mb-3">
              <Trophy size={14} /> Touch Typing Academy
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--ink)] tracking-tight font-sans">
              Structured Touch-Typing Lessons
            </h1>
            <p className="mt-2 max-w-xl text-sm text-[var(--muted)] leading-relaxed">
              Master the keyboard step-by-step from baseline home row to top numbers & symbols. Build muscle memory without looking at your keys.
            </p>
          </div>

          {/* Progress Card */}
          <div className="flex items-center gap-6 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-4 sm:p-5 shadow-xs">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-yellow-500 font-bold text-xl">
                <Star size={20} className="fill-yellow-500" />
                <span>{totalStars}</span>
                <span className="text-xs text-[var(--muted)] font-normal">/ {maxPossibleStars}</span>
              </div>
              <span className="text-[11px] text-[var(--muted)] uppercase tracking-wider mt-1">Stars Earned</span>
            </div>

            <div className="h-10 w-px bg-[var(--line)]" />

            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 font-bold text-xl text-[var(--ink)] font-mono">
                <Award size={20} className="text-[var(--accent)]" />
                <span>{completedCount}</span>
                <span className="text-xs text-[var(--muted)] font-normal">/ {LESSONS.length}</span>
              </div>
              <span className="text-[11px] text-[var(--muted)] uppercase tracking-wider mt-1">Completed</span>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-6 pt-6 border-t border-[var(--line)]">
          <div className="flex items-center justify-between text-xs text-[var(--muted)] mb-2 font-mono">
            <span>Overall Course Progress</span>
            <span>{completionPercentage}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--line)]">
            <div
              className="h-full bg-[var(--accent)] transition-all duration-500 ease-out"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </section>

      {/* Curriculum Tiers */}
      <div className="space-y-10">
        {LESSON_CATEGORIES.map((category) => {
          const tierLessons = LESSONS.filter((l) => l.tier === category.tier);

          return (
            <section key={category.tier} className="space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                <div>
                  <h2 className="text-lg font-bold text-[var(--ink)] flex items-center gap-2">
                    <span>{category.title}</span>
                    <span className="text-xs font-normal text-[var(--muted)] font-mono">({category.badge})</span>
                  </h2>
                  <p className="text-xs text-[var(--muted)] mt-1">{category.description}</p>
                </div>
              </div>

              {/* Lesson Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
                {tierLessons.map((lesson) => {
                  const unlocked = isLessonUnlocked(lesson.id, progressMap);
                  const progress = progressMap[lesson.id];
                  const stars = progress?.stars || 0;

                  return (
                    <div
                      key={lesson.id}
                      className={`group relative flex flex-col justify-between rounded-xl border p-5 transition-all duration-200 ${
                        unlocked
                          ? "border-[var(--line)] bg-[var(--paper)] hover:border-[var(--accent)] hover:shadow-md"
                          : "border-[var(--line)]/60 bg-[var(--paper-soft)]/50 opacity-70"
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="font-semibold text-sm text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
                            {lesson.title}
                          </h3>
                          {!unlocked ? (
                            <span className="inline-flex items-center gap-1 rounded bg-[var(--line)] px-2 py-0.5 text-[11px] font-medium text-[var(--muted)]">
                              <Lock size={12} /> Locked
                            </span>
                          ) : (
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3].map((star) => (
                                <Star
                                  key={star}
                                  size={15}
                                  className={
                                    star <= stars
                                      ? "fill-yellow-500 text-yellow-500"
                                      : "text-[var(--line)]"
                                  }
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-[var(--muted)] mb-4">{lesson.subtitle}</p>

                        {/* Key Targets Badge */}
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {lesson.targetKeys.slice(0, 6).map((key) => (
                            <span
                              key={key}
                              className="inline-block rounded border border-[var(--line)] bg-[var(--paper-soft)] px-2 py-0.5 text-[11px] font-mono font-medium text-[var(--ink)]"
                            >
                              {key === "space" ? "␣ space" : key.toUpperCase()}
                            </span>
                          ))}
                          {lesson.targetKeys.length > 6 && (
                            <span className="text-[11px] text-[var(--muted)] self-center font-mono">
                              +{lesson.targetKeys.length - 6} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-[var(--line)] text-xs font-mono">
                        {progress?.completed ? (
                          <div className="flex items-center gap-3 text-[var(--muted)] text-[11px]">
                            <span>Best: <strong className="text-[var(--ink)]">{progress.bestWpm} WPM</strong></span>
                            <span>Acc: <strong className="text-[var(--ink)]">{progress.bestAccuracy}%</strong></span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[var(--muted)]">Pass: {lesson.minAccuracyToPass}% Acc</span>
                        )}

                        {unlocked ? (
                          <button
                            type="button"
                            onClick={() => navigate(`/lessons/${lesson.id}`)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity shadow-xs cursor-pointer"
                          >
                            <Play size={12} fill="currentColor" /> {progress?.completed ? "Retry" : "Start"}
                          </button>
                        ) : (
                          <span className="text-[11px] text-[var(--muted)] italic">Complete previous</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
