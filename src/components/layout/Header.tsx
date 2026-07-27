import { Moon, Sun, Trophy } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

type HeaderProps = { theme: "light" | "dark"; onToggleTheme: () => void };

export function Header({ theme, onToggleTheme }: HeaderProps) {
  const { user, enabled, signIn, signOutUser } = useAuth();
  return <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
    <Link to="/" className="flex items-center gap-2 font-mono text-lg font-semibold tracking-tight">
      <span className="grid h-7 w-7 place-items-center rounded-md bg-[var(--ink)] text-[var(--paper)]"><Trophy size={15} /></span>
      typearena
    </Link>
    <nav className="hidden items-center gap-6 text-sm text-[var(--muted)] sm:flex">
      <NavLink to="/" className={({ isActive }) => isActive ? "text-[var(--ink)]" : "hover:text-[var(--ink)]"}>type</NavLink>
      <NavLink to="/race" className={({ isActive }) => isActive ? "text-[var(--ink)]" : "hover:text-[var(--ink)]"}>race</NavLink>
    </nav>
    <div className="flex items-center gap-2">
      <button aria-label="Toggle theme" onClick={onToggleTheme} className="icon-button">
        {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
      </button>
      {enabled && (user ? <button onClick={() => void signOutUser()} className="user-chip" title="Sign out">
        {user.photoURL ? <img src={user.photoURL} alt="" /> : <span>{user.displayName?.slice(0, 1) ?? "U"}</span>}
        <span className="hidden sm:inline">{user.displayName?.split(" ")[0] ?? "profile"}</span>
      </button> : <button onClick={() => void signIn()} className="quiet-button">sign in</button>)}
    </div>
  </header>;
}
