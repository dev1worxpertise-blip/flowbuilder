import { create } from "zustand";

export type ThemeMode = "light" | "dark";

interface ThemeState {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = "flowbuilder_theme";

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  // Also check legacy gallery key if present
  const legacy = localStorage.getItem("flowbuilder_gallery_theme");
  if (legacy === "light" || legacy === "dark") return legacy;
  return "light"; // Default to Worxpertise Light
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getInitialTheme(),
  setTheme: (theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
      localStorage.setItem("flowbuilder_gallery_theme", theme);
      if (typeof document !== "undefined") {
        if (theme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    } catch {}
    set({ theme });
  },
  toggleTheme: () => {
    set((state) => {
      const next = state.theme === "light" ? "dark" : "light";
      try {
        localStorage.setItem(STORAGE_KEY, next);
        localStorage.setItem("flowbuilder_gallery_theme", next);
        if (typeof document !== "undefined") {
          if (next === "dark") {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }
      } catch {}
      return { theme: next };
    });
  },
}));
