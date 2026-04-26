"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

export interface ParentChild {
  id: string;
  name: string;
  email: string | null;
  username: string | null;
  avatarUrl: string | null;
  curriculum: string | null;
  streakDays: number;
  lastStudyAt: string | null;
  studyGoal: number;
  daysSinceLastStudy: number | null;
  inactive: boolean;
}

interface ParentContextValue {
  loading: boolean;
  children: ParentChild[];
  activeChild: ParentChild | null;
  activeChildId: string;
  setActiveChildId: (id: string) => void;
  refresh: () => Promise<void>;
}

const ParentContext = createContext<ParentContextValue | null>(null);
const STORAGE_KEY = "linhiq_parent_active_child";

export function ParentProvider({ children: subtree }: { children: ReactNode }) {
  const { token } = useAuth();
  const [list, setList] = useState<ParentChild[]>([]);
  const [activeChildId, setActiveChildIdState] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!token) return;
    try {
      const data = await api<ParentChild[]>("/parent/children", { token });
      setList(data);
      const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      const initial =
        (stored && data.find((c) => c.id === stored)?.id) || data[0]?.id || "";
      setActiveChildIdState(initial);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const setActiveChildId = (id: string) => {
    setActiveChildIdState(id);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, id);
  };

  const value = useMemo<ParentContextValue>(
    () => ({
      loading,
      children: list,
      activeChild: list.find((c) => c.id === activeChildId) ?? null,
      activeChildId,
      setActiveChildId,
      refresh: load,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loading, list, activeChildId],
  );

  return <ParentContext.Provider value={value}>{subtree}</ParentContext.Provider>;
}

export function useParentContext() {
  const ctx = useContext(ParentContext);
  if (!ctx) throw new Error("useParentContext must be used inside ParentProvider");
  return ctx;
}
