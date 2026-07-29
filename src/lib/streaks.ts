const STREAK_KEY = "typearena_streak_v1";

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: string; // YYYY-MM-DD
}

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function getStreak(): StreakData {
  const data = localStorage.getItem(STREAK_KEY);
  if (!data) {
    return { currentStreak: 0, longestStreak: 0, lastPracticeDate: "" };
  }
  try {
    const parsed = JSON.parse(data) as StreakData;
    
    // Check if streak is broken
    if (parsed.lastPracticeDate) {
      const today = getTodayString();
      if (today !== parsed.lastPracticeDate) {
        const lastDate = parseDate(parsed.lastPracticeDate);
        const todayDate = parseDate(today);
        
        // Use UTC to safely calculate day difference without DST issues
        const utcLast = Date.UTC(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
        const utcToday = Date.UTC(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
        
        const diffDays = Math.floor(Math.abs(utcToday - utcLast) / (1000 * 60 * 60 * 24));
        
        if (diffDays > 1) {
          // Streak broken
          parsed.currentStreak = 0;
        }
      }
    }
    
    return parsed;
  } catch (e) {
    return { currentStreak: 0, longestStreak: 0, lastPracticeDate: "" };
  }
}

export function recordPractice(): void {
  const streak = getStreak();
  const today = getTodayString();

  if (streak.lastPracticeDate === today) {
    return;
  }

  streak.currentStreak += 1;
  streak.lastPracticeDate = today;

  if (streak.currentStreak > streak.longestStreak) {
    streak.longestStreak = streak.currentStreak;
  }

  localStorage.setItem(STREAK_KEY, JSON.stringify(streak));
}

export function getStreakEmoji(count: number): string {
  if (count <= 0) return "⚪";
  if (count <= 6) return "🔥";
  if (count <= 29) return "🔥🔥";
  return "🔥🔥🔥";
}
