"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const saved = localStorage.getItem("linhiq_theme") as Theme | null;
    const resolved = saved === "light" ? "light" : "dark";
    setThemeState(resolved);
    applyTheme(resolved);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem("linhiq_theme", t);
    applyTheme(t);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function applyTheme(t: Theme) {
  const html = document.documentElement;
  html.classList.remove("dark", "light");
  html.classList.add(t);
  const bodyBg = t === "light" ? "#ffffff" : "#0D100C";
  const bodyColor = t === "light" ? "#1A2018" : "#ECF0E8";
  document.body.style.backgroundColor = bodyBg;
  document.body.style.color = bodyColor;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('linhiq_theme');
    var resolved = t === 'light' ? 'light' : 'dark';
    document.documentElement.classList.add(resolved);
    document.body && (document.body.style.backgroundColor = resolved === 'light' ? '#ffffff' : '#0D100C');
  } catch(e){}
})();
`;
