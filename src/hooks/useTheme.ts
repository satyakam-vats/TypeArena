import { useEffect, useState } from "react";

type Theme = "light" | "dark";
const key = "typearena-theme";

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(key) as Theme | null;
    if (stored === "light" || stored === "dark") return stored;
  } catch { /* private browsing */ }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(key, theme); } catch { /* ignore */ }
  }, [theme]);
  return { theme, toggleTheme: () => setTheme((current) => current === "light" ? "dark" : "light") };
}
