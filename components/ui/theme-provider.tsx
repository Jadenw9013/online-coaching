"use client";

import { createContext, useContext, useCallback, useRef, useSyncExternalStore } from "react";

type Theme = "dark" | "light";

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
}>({
  theme: "dark",
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function getSnapshot(): Theme {
  return localStorage.getItem("steadfast-theme") === "light" ? "light" : "dark";
}

function getServerSnapshot(): Theme {
  return "dark";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const listenerRef = useRef<(() => void) | null>(null);

  const subscribe = useCallback((callback: () => void) => {
    listenerRef.current = callback;
    return () => {
      listenerRef.current = null;
    };
  }, []);

  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    localStorage.setItem("steadfast-theme", next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    listenerRef.current?.();
  }, [theme]);

  return (
    <ThemeContext value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext>
  );
}
