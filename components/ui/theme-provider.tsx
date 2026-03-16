"use client";

import { createContext, useContext, useEffect } from "react";

// Theme is permanently locked to dark mode. toggleTheme is a no-op kept for
// interface compatibility with any remaining imports of useTheme.
const ThemeContext = createContext<{ theme: "dark"; toggleTheme: () => void }>({
  theme: "dark",
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Clear any stored light preference and ensure dark class is always applied
    localStorage.removeItem("steadfast-theme");
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <ThemeContext value={{ theme: "dark", toggleTheme: () => {} }}>
      {children}
    </ThemeContext>
  );
}
