"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import {
  DARK_THEME,
  LIGHT_THEME,
  getServerThemeSnapshot,
  getThemeSnapshot,
  setTheme,
  subscribeTheme,
} from "@/lib/theme";

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot);

  function toggleTheme() {
    setTheme(theme === DARK_THEME ? LIGHT_THEME : DARK_THEME);
  }

  const label = theme === DARK_THEME ? "Passer au thème clair" : "Passer au thème sombre";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="btn btn-square btn-ghost btn-sm"
      aria-label={label}
      title={label}
    >
      {theme === DARK_THEME ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
