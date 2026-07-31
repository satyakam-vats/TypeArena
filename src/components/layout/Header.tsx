import { Moon, Sun, Trophy, Volume2, VolumeX } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSound } from "../../context/SoundContext";

type HeaderProps = { theme: "light" | "dark"; onToggleTheme: () => void };

export function Header({ theme, onToggleTheme }: HeaderProps) {
  const { user, enabled, signIn } = useAuth();
  const { enabled: soundEnabled, toggleSound } = useSound();
  return (
    <header className="app-header mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
      <Link to="/" className="flex items-center gap-2 font-mono text-lg font-semibold tracking-tight">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-[var(--ink)] text-[var(--paper)]">
          <Trophy size={15} />
        </span>
        typearena
      </Link>
      <nav className="hidden items-center gap-6 text-sm text-[var(--muted)] sm:flex">
        <NavLink to="/" end className={({ isActive }) => (isActive ? "text-[var(--ink)]" : "hover:text-[var(--ink)]")}>
          type
        </NavLink>
        <NavLink to="/lessons" className={({ isActive }) => (isActive ? "text-[var(--ink)]" : "hover:text-[var(--ink)]")}>
          lessons
        </NavLink>
        <NavLink to="/daily" className={({ isActive }) => (isActive ? "text-[var(--ink)]" : "hover:text-[var(--ink)]")}>
          daily
        </NavLink>
        <NavLink to="/practice" className={({ isActive }) => (isActive ? "text-[var(--ink)]" : "hover:text-[var(--ink)]")}>
          practice
        </NavLink>
        <NavLink to="/race" className={({ isActive }) => (isActive ? "text-[var(--ink)]" : "hover:text-[var(--ink)]")}>
          race
        </NavLink>
        <NavLink to="/leaderboard" className={({ isActive }) => (isActive ? "text-[var(--ink)]" : "hover:text-[var(--ink)]")}>
          leaderboard
        </NavLink>
        <NavLink to="/analytics" className={({ isActive }) => (isActive ? "text-[var(--ink)]" : "hover:text-[var(--ink)]")}>
          analytics
        </NavLink>
      </nav>
      <div className="flex items-center gap-2">
        <button aria-label="Toggle sound" onClick={toggleSound} className="icon-button">
          {soundEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
        </button>
        <button aria-label="Toggle theme" onClick={onToggleTheme} className="icon-button">
          {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
        </button>
        {enabled &&
          (user ? (
            <Link to="/profile" className="user-chip" title="View profile">
              {user.photoURL ? <img src={user.photoURL} alt="" /> : <span>{user.displayName?.slice(0, 1) ?? "U"}</span>}
              <span className="hidden sm:inline">{user.displayName?.split(" ")[0] ?? "profile"}</span>
            </Link>
          ) : (
            <button onClick={() => void signIn()} className="quiet-button">
              sign in
            </button>
          ))}
      </div>
    </header>
  );
}
