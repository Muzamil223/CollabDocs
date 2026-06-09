"use client";

import { useState, useEffect, useCallback } from "react";

const THEME_KEY = "collab_theme";

export function getInitialTheme() {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return "dark";
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

/**
 * Global light/dark theme hook. Persists to localStorage and toggles the
 * `dark` class on <html> so Tailwind `dark:` variants and CSS variables flip.
 */
export function useTheme() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const initial = getInitialTheme();
    setTheme(initial);
    applyTheme(initial);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem(THEME_KEY, next);
      applyTheme(next);
      return next;
    });
  }, []);

  return { theme, toggleTheme, isDark: theme === "dark" };
}
