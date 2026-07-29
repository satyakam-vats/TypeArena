import { Route, Routes } from "react-router-dom";
import { Header } from "./components/layout/Header";
import { useTheme } from "./hooks/useTheme";
import { RaceLandingPage } from "./features/race/RaceLandingPage";
import { RoomPage } from "./features/race/RoomPage";
import { ResultsPage } from "./features/results/ResultsPage";
import { SoloTestPage } from "./features/solo/SoloTestPage";
import { AnalyticsDashboard } from "./features/analytics/AnalyticsDashboard";
import { LeaderboardPage } from "./features/leaderboard/LeaderboardPage";
import { ProfilePage } from "./features/profile/ProfilePage";

export default function App() {
  const { theme, toggleTheme } = useTheme();
  return <div className="app-frame"><Header theme={theme} onToggleTheme={toggleTheme} /><Routes><Route path="/" element={<SoloTestPage />} /><Route path="/results" element={<ResultsPage />} /><Route path="/race" element={<RaceLandingPage />} /><Route path="/race/:roomId" element={<RoomPage />} /><Route path="/analytics" element={<AnalyticsDashboard />} /><Route path="/leaderboard" element={<LeaderboardPage />} /><Route path="/profile" element={<ProfilePage />} /><Route path="/profile/:uid" element={<ProfilePage />} /></Routes></div>;
}
