import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, RotateCcw, ArrowRight, Star, AlertTriangle, CheckCircle2, ListOrdered, ChevronRight, ChevronLeft } from "lucide-react";
import { LESSONS } from "../../data/lessonsData";
import { recordLessonAttempt, isLessonUnlocked, getStoredLessonProgress } from "../../lib/storage/lessonsStorage";
import { useTypingTest } from "../../hooks/useTypingTest";
import { TypingViewport } from "../../components/typing/TypingViewport";
import { LiveMetrics } from "../../components/typing/LiveMetrics";
import { normalizeSettings, type CompletedRun } from "../../types/typing";

export function LessonPracticePage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();

  const lesson = useMemo(() => LESSONS.find((l) => l.id === lessonId) ?? LESSONS[0]!, [lessonId]);
  const isUnlocked = isLessonUnlocked(lesson.id, getStoredLessonProgress());

  const exercises = useMemo(() => {
    if (lesson.exercises && lesson.exercises.length > 0) {
      return lesson.exercises;
    }
    return [
      {
        id: `${lesson.id}-ex1`,
        title: "Full Exercise",
        text: lesson.text,
        targetKeys: lesson.targetKeys,
        minAccuracyToPass: lesson.minAccuracyToPass,
      },
    ];
  }, [lesson]);

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const currentExercise = exercises[currentExerciseIndex] || exercises[0]!;

  const [showResultModal, setShowResultModal] = useState(false);
  const [resultData, setResultData] = useState<{
    wpm: number;
    accuracy: number;
    stars: number;
    passed: boolean;
  } | null>(null);

  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const lessonSettings = useMemo(
    () =>
      normalizeSettings({
        mode: "custom",
        customText: currentExercise.text,
        wordSourceId: "custom",
        smoothCaret: true,
      }),
    [currentExercise.text]
  );

  const onComplete = useCallback(
    (run: CompletedRun) => {
      const { wpm, accuracy } = run.metrics;
      const minAcc = currentExercise.minAccuracyToPass ?? lesson.minAccuracyToPass;
      const { starsEarned, passed } = recordLessonAttempt(lesson, wpm, accuracy);
      setResultData({
        wpm,
        accuracy,
        stars: starsEarned,
        passed,
      });
      setShowResultModal(true);
    },
    [lesson, currentExercise]
  );

  const test = useTypingTest(currentExercise.text, lessonSettings, onComplete, `${lesson.id}-ex${currentExerciseIndex}`);

  useEffect(() => {
    inputRef.current?.focus();
  }, [lesson.id, currentExerciseIndex]);

  const nextLesson = useMemo(() => {
    const currentIndex = LESSONS.findIndex((l) => l.id === lesson.id);
    if (currentIndex >= 0 && currentIndex < LESSONS.length - 1) {
      return LESSONS[currentIndex + 1];
    }
    return null;
  }, [lesson.id]);

  const handleNextExerciseOrLesson = () => {
    setShowResultModal(false);
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex((prev) => prev + 1);
    } else if (nextLesson) {
      navigate(`/lessons/${nextLesson.id}`);
    } else {
      navigate("/lessons");
    }
  };

  const handleRetry = () => {
    setShowResultModal(false);
    test.reset();
    inputRef.current?.focus();
  };

  if (!isUnlocked) {
    return (
      <main className="mx-auto w-full max-w-xl px-5 py-16 text-center">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-8 shadow-sm">
          <AlertTriangle size={48} className="mx-auto mb-4 text-amber-500" />
          <h1 className="text-xl font-bold text-[var(--ink)] mb-2">Lesson Locked</h1>
          <p className="text-sm text-[var(--muted)] mb-6">
            You must complete the previous lessons before unlocking this exercise.
          </p>
          <Link to="/lessons" className="primary-button inline-flex items-center gap-2">
            <ArrowLeft size={16} /> Return to Course Map
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8 sm:py-12">
      {/* Top Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/lessons"
          className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
        >
          <ArrowLeft size={16} /> Course Map
        </Link>
        <span className="text-xs font-mono text-[var(--muted)] uppercase tracking-wider">
          {lesson.tier.replace("_", " ")}
        </span>
      </div>

      {/* Lesson Header Card */}
      <header className="mb-6 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[var(--ink)] font-sans">{lesson.title}</h1>
            <p className="text-xs text-[var(--muted)] mt-1">{lesson.subtitle}</p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-[var(--muted)] font-mono mr-1">Target Keys:</span>
            {lesson.targetKeys.map((key) => (
              <span
                key={key}
                className="rounded border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-mono font-semibold text-[var(--accent)]"
              >
                {key === "space" ? "␣ space" : key.toUpperCase()}
              </span>
            ))}
          </div>
        </div>

        {/* Exercise Selector / Stepper */}
        {exercises.length > 1 && (
          <div className="mt-4 pt-4 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--ink)] font-semibold">
              <ListOrdered size={15} className="text-[var(--accent)]" />
              <span>Exercise {currentExerciseIndex + 1} of {exercises.length}</span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
              <button
                type="button"
                disabled={currentExerciseIndex === 0}
                onClick={() => setCurrentExerciseIndex((p) => Math.max(0, p - 1))}
                className="p-1 rounded border border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)] disabled:opacity-30 disabled:cursor-not-allowed"
                title="Previous exercise"
              >
                <ChevronLeft size={14} />
              </button>

              {exercises.map((ex, idx) => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => setCurrentExerciseIndex(idx)}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                    idx === currentExerciseIndex
                      ? "bg-[var(--accent)] text-white font-bold"
                      : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  Ex {idx + 1}
                </button>
              ))}

              <button
                type="button"
                disabled={currentExerciseIndex === exercises.length - 1}
                onClick={() => setCurrentExerciseIndex((p) => Math.min(exercises.length - 1, p + 1))}
                className="p-1 rounded border border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)] disabled:opacity-30 disabled:cursor-not-allowed"
                title="Next exercise"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Instructional Finger Guide */}
        <div className="mt-4 rounded-lg bg-[var(--paper-soft)] p-3 border border-[var(--line)]/60 text-xs text-[var(--ink)] flex items-start gap-2">
          <span className="text-base">💡</span>
          <p className="leading-relaxed"><strong className="font-semibold">Technique Hint:</strong> {lesson.fingerGuideHint}</p>
        </div>
      </header>

      {/* Typing Viewport Stage */}
      <section className="typing-stage solo-typing-stage relative">
        <div className="mb-3 flex items-center justify-between text-sm text-[var(--muted)]">
          <span className="font-mono text-xs">Accuracy Requirement: {lesson.minAccuracyToPass}%</span>
          <LiveMetrics metrics={test.metrics} comboCount={test.comboCount} comboMultiplier={test.comboMultiplier} />
        </div>

        <TypingViewport
          target={currentExercise.text}
          typed={test.typedText}
          active={test.status !== "finished"}
          smoothCaret
          focused
          onRequestFocus={() => inputRef.current?.focus()}
        />

        <textarea
          ref={inputRef}
          value={test.typedText}
          onChange={(e) => test.updateTypedText(e.target.value)}
          rows={1}
          aria-label="Lesson typing input"
          className="sr-only"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          onPaste={(e) => e.preventDefault()}
        />
      </section>

      {/* Control Buttons */}
      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleRetry}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--paper)] px-4 py-2 text-xs font-semibold text-[var(--ink)] hover:border-[var(--accent)] transition-all cursor-pointer"
        >
          <RotateCcw size={14} /> Restart Exercise
        </button>
      </div>

      {/* Result Modal / Stars Drawer */}
      {showResultModal && resultData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-8 shadow-2xl text-center space-y-6">
            <div>
              {resultData.passed ? (
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 text-green-500">
                  <CheckCircle2 size={36} />
                </div>
              ) : (
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                  <AlertTriangle size={36} />
                </div>
              )}
              <h2 className="text-xl font-bold text-[var(--ink)]">
                {resultData.passed ? "Exercise Complete!" : "Accuracy Threshold Missed"}
              </h2>
              <p className="text-xs text-[var(--muted)] mt-1">
                {resultData.passed
                  ? `Exercise ${currentExerciseIndex + 1} of ${exercises.length} completed successfully.`
                  : `You need at least ${lesson.minAccuracyToPass}% accuracy to pass.`}
              </p>
            </div>

            {/* Stars Display */}
            {resultData.passed && (
              <div className="flex justify-center gap-2 py-2">
                {[1, 2, 3].map((star) => (
                  <Star
                    key={star}
                    size={36}
                    className={`transition-all duration-300 ${
                      star <= resultData.stars
                        ? "fill-yellow-500 text-yellow-500 scale-110"
                        : "text-[var(--line)]"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Metric Summary */}
            <div className="grid grid-cols-2 gap-4 rounded-xl bg-[var(--paper-soft)] p-4 border border-[var(--line)] text-center font-mono">
              <div>
                <span className="text-[11px] text-[var(--muted)] uppercase tracking-wider block">Speed</span>
                <strong className="text-lg text-[var(--ink)]">{resultData.wpm} WPM</strong>
              </div>
              <div>
                <span className="text-[11px] text-[var(--muted)] uppercase tracking-wider block">Accuracy</span>
                <strong
                  className={`text-lg ${
                    resultData.accuracy >= lesson.minAccuracyToPass ? "text-green-500" : "text-amber-500"
                  }`}
                >
                  {resultData.accuracy}%
                </strong>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleRetry}
                className="w-full inline-flex justify-center items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--paper)] py-2.5 text-xs font-semibold text-[var(--ink)] hover:border-[var(--accent)] transition-all cursor-pointer"
              >
                <RotateCcw size={14} /> Try Again
              </button>
              {resultData.passed && (
                <button
                  type="button"
                  onClick={handleNextExerciseOrLesson}
                  className="w-full inline-flex justify-center items-center gap-2 rounded-xl bg-[var(--accent)] py-2.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                >
                  {currentExerciseIndex < exercises.length - 1 ? "Next Exercise" : "Next Lesson"} <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
