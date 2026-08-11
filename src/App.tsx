import { useState } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { Header } from "./components/layout/Header";
import { useTheme } from "./hooks/useTheme";
import { RaceLandingPage } from "./features/race/RaceLandingPage";
import { RoomPage } from "./features/race/RoomPage";
import { ResultsPage } from "./features/results/ResultsPage";
import { SoloTestPage } from "./features/solo/SoloTestPage";
import { AnalyticsDashboard } from "./features/analytics/AnalyticsDashboard";
import { LeaderboardPage } from "./features/leaderboard/LeaderboardPage";
import { ProfilePage } from "./features/profile/ProfilePage";
import { OnboardingModal, shouldShowOnboarding } from "./features/onboarding/OnboardingModal";

import { DailyChallengePage } from "./features/daily/DailyChallengePage";
import { PracticePage } from "./features/practice/PracticePage";
import { LessonsOverviewPage } from "./features/lessons/LessonsOverviewPage";
import { LessonPracticePage } from "./features/lessons/LessonPracticePage";
import { AiChatWidget } from "./components/ai/AiChatWidget";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [showOnboarding, setShowOnboarding] = useState(shouldShowOnboarding);
  return (
    <div className="app-frame">
      <Header theme={theme} onToggleTheme={toggleTheme} />
      <Routes>
        <Route path="/" element={<SoloTestPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/race" element={<RaceLandingPage />} />
        <Route path="/race/:roomId" element={<RoomPage />} />
        <Route path="/analytics" element={<AnalyticsDashboard />} />
        <Route path="/practice" element={<PracticePage />} />
        <Route path="/lessons" element={<LessonsOverviewPage />} />
        <Route path="/lessons/:lessonId" element={<LessonPracticePage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/daily" element={<DailyChallengePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/:uid" element={<ProfilePage />} />
      </Routes>
      {showOnboarding && <OnboardingModal onDismiss={() => setShowOnboarding(false)} />}
      <AiChatWidget />
    </div>
  );
}
