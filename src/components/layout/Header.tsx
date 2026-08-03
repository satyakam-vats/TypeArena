import { useState } from "react";
import { Menu, Moon, Sun, Trophy, Volume2, VolumeX, X } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSound } from "../../context/SoundContext";

type HeaderProps = { theme: "light" | "dark"; onToggleTheme: () => void };

const NAV_LINKS = [
  { to: "/", label: "type", end: true },
  { to: "/lessons", label: "lessons" },
  { to: "/daily", label: "daily" },
  { to: "/practice", label: "practice" },
  { to: "/race", label: "race" },
  { to: "/leaderboard", label: "leaderboard" },
  { to: "/analytics", label: "analytics" },
];

export function Header({ theme, onToggleTheme }: HeaderProps) {
  const { user, enabled, signIn } = useAuth();
  const { enabled: soundEnabled, toggleSound } = useSound();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="relative app-header mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
      <Link to="/" className="flex items-center gap-2 font-mono text-lg font-semibold tracking-tight">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-[var(--ink)] text-[var(--paper)]">
          <Trophy size={15} />
        </span>
        typearena
      </Link>
      <nav className="hidden items-center gap-6 text-sm text-[var(--muted)] sm:flex">
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `transition-colors duration-150 ${isActive ? "text-[var(--ink)]" : "hover:text-[var(--ink)]"}`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        <button aria-label="Toggle sound" onClick={toggleSound} className="icon-button">
          {soundEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
        </button>
        <button aria-label="Toggle theme" onClick={onToggleTheme} className="icon-button">
          {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
        </button>
        <button
          aria-label="Toggle navigation menu"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="icon-button sm:hidden"
        >
          {mobileOpen ? <X size={17} /> : <Menu size={17} />}
        </button>
        {enabled &&
          (user ? (
            <Link to="/profile" className="user-chip" title="View profile">
              {user.photoURL ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" /> : <span>{user.displayName?.slice(0, 1) ?? "U"}</span>}
              <span className="hidden sm:inline">{user.displayName?.split(" ")[0] ?? "profile"}</span>
            </Link>
          ) : (
            <button onClick={() => void signIn()} className="quiet-button">
              sign in
            </button>
          ))}
      </div>
      {mobileOpen && (
        <nav className="absolute left-0 right-0 top-full z-50 flex flex-col gap-3 border-b border-[var(--border)] bg-[var(--paper)] px-5 py-4 text-sm text-[var(--muted)] shadow-md sm:hidden">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `transition-colors duration-150 ${isActive ? "text-[var(--ink)]" : "hover:text-[var(--ink)]"}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}
