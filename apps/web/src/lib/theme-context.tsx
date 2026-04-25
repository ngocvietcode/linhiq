"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export type Theme = "dark" | "light" | "system";
export type Accent = "blue" | "slate" | "sage" | "wine";

interface ThemeContextType {
  theme: Theme;
  accent: Accent;
  resolvedTheme: "dark" | "light";
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  setAccent: (a: Accent) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

function getSystemTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(theme: Theme): "dark" | "light" {
  if (theme === "system") return getSystemTheme();
  return theme;
}

function applyTheme(resolved: "dark" | "light") {
  const html = document.documentElement;
  html.classList.remove("dark", "light");
  html.classList.add(resolved);
  // Scholar v1.0 colors
  const bg = resolved === "light" ? "#F7F5F0" : "#111318";
  const color = resolved === "light" ? "#1A1814" : "#E8E4DC";
  document.body.style.backgroundColor = bg;
  document.body.style.color = color;
}

function applyAccent(accent: Accent) {
  const html = document.documentElement;
  if (accent === "blue") {
    html.removeAttribute("data-accent");
  } else {
    html.setAttribute("data-accent", accent);
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [accent, setAccentState] = useState<Accent>("blue");

  const resolvedTheme = resolveTheme(theme);

  useEffect(() => {
    const savedTheme = (localStorage.getItem("linhiq_theme") as Theme | null) ?? "light";
    const savedAccent = (localStorage.getItem("linhiq_accent") as Accent | null) ?? "blue";
    setThemeState(savedTheme);
    setAccentState(savedAccent);
    applyTheme(resolveTheme(savedTheme));
    applyAccent(savedAccent);

    if (savedTheme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme(resolveTheme("system"));
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem("linhiq_theme", t);
    applyTheme(resolveTheme(t));
  }, []);

  const toggleTheme = useCallback(() => {
    const next: Theme = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(next);
  }, [resolvedTheme, setTheme]);

  const setAccent = useCallback((a: Accent) => {
    setAccentState(a);
    localStorage.setItem("linhiq_accent", a);
    applyAccent(a);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, accent, resolvedTheme, setTheme, toggleTheme, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

// Scholar v1.0: Light-first theme script
export const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('linhiq_theme') || 'light';
    var resolved = t === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : t;
    document.documentElement.classList.add(resolved);
    document.body && (document.body.style.backgroundColor = resolved === 'light' ? '#F7F5F0' : '#111318');
    document.body && (document.body.style.color = resolved === 'light' ? '#1A1814' : '#E8E4DC');
    var a = localStorage.getItem('linhiq_accent');
    if (a && a !== 'blue') document.documentElement.setAttribute('data-accent', a);
  } catch(e){}
})();
`;
