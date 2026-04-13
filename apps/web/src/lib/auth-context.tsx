"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { api } from "@/lib/api";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Add global listeners for auto token refresh
  useEffect(() => {
    const handleTokenRefreshed = ((e: CustomEvent<string>) => {
      setToken(e.detail);
    }) as EventListener;

    const handleSessionExpired = () => {
      logout();
    };

    window.addEventListener('token_refreshed', handleTokenRefreshed);
    window.addEventListener('session_expired', handleSessionExpired);

    return () => {
      window.removeEventListener('token_refreshed', handleTokenRefreshed);
      window.removeEventListener('session_expired', handleSessionExpired);
    };
  }, []);

  // Restore session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("linhiq_token");
    if (savedToken) {
      setToken(savedToken);
      api<User>("/auth/me", { token: savedToken })
        .then(setUser)
        .catch(() => {
          localStorage.removeItem("linhiq_token");
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api<{ user: User; accessToken: string }>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    setUser(result.user);
    setToken(result.accessToken);
    localStorage.setItem("linhiq_token", result.accessToken);
  }, []);

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      const result = await api<{ user: User; accessToken: string }>(
        "/auth/register",
        {
          method: "POST",
          body: { email, password, name, role: "STUDENT" },
        }
      );
      setUser(result.user);
      setToken(result.accessToken);
      localStorage.setItem("linhiq_token", result.accessToken);
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await api("/auth/logout", { method: "POST", token: localStorage.getItem("linhiq_token") || undefined });
    } catch {
      // Ignore API errors gracefully on logout
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem("linhiq_token");
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
