import { useEffect, useState } from "react";

type Theme = "light" | "dark";
const key = "typearena-theme";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem(key) as Theme | null) ?? "light");
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(key, theme);
  }, [theme]);
  return { theme, toggleTheme: () => setTheme((current) => current === "light" ? "dark" : "light") };
}
