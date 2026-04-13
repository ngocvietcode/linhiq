const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4500/api";

async function req<T>(path: string, token: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...((opts.headers as Record<string, string>) || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message || `API ${res.status}`);
  }
  return res.json();
}

// ── Users ───────────────────────────────────────────────────────
export const adminUsers = {
  list:   (token: string) => req<{ data: AdminUser[] }>("/admin/users", token),
  get:    (token: string, id: string) => req<{ data: AdminUser }>(`/admin/users/${id}`, token),
  update: (token: string, id: string, body: Partial<AdminUser>) =>
    req<{ data: AdminUser }>(`/admin/users/${id}`, token, { method: "PATCH", body: JSON.stringify(body) }),
  ban:    (token: string, id: string) =>
    req<{ data: AdminUser }>(`/admin/users/${id}/ban`, token, { method: "POST" }),
  delete: (token: string, id: string) =>
    req<{ success: boolean }>(`/admin/users/${id}`, token, { method: "DELETE" }),
};

// ── Subjects ─────────────────────────────────────────────────────
export const adminSubjects = {
  list:   (token: string) => req<{ data: AdminSubject[] }>("/admin/subjects", token),
  get:    (token: string, id: string) => req<{ data: AdminSubjectDetail }>(`/admin/subjects/${id}`, token),
  create: (token: string, body: CreateSubjectBody) =>
    req<{ data: AdminSubject }>("/admin/subjects", token, { method: "POST", body: JSON.stringify(body) }),
  update: (token: string, id: string, body: Partial<CreateSubjectBody>) =>
    req<{ data: AdminSubject }>(`/admin/subjects/${id}`, token, { method: "PUT", body: JSON.stringify(body) }),
  delete: (token: string, id: string) =>
    req<{ success: boolean }>(`/admin/subjects/${id}`, token, { method: "DELETE" }),
};

// ── Settings ──────────────────────────────────────────────────────
export const adminSettings = {
  get:    (token: string) => req<{ data: SystemSetting }>("/admin/settings", token),
  updateProvider: (token: string, provider: string) =>
    req<{ data: SystemSetting }>("/admin/settings/provider", token, { method: "POST", body: JSON.stringify({ provider }) }),
};

// ── Analytics ─────────────────────────────────────────────────────
export const adminAnalytics = {
  overview: (token: string) => req<AnalyticsOverview>("/admin/analytics", token),
};

// ── Chat sessions ─────────────────────────────────────────────────
export const adminSessions = {
  list: (token: string) => req<{ sessions: AdminSession[] }>("/admin/chat-sessions", token),
};

// ── Types ─────────────────────────────────────────────────────────
export interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: "STUDENT" | "ADMIN" | "PARENT";
  createdAt: string;
  isBanned?: boolean;
  _count?: { chatSessions: number };
  studentProfile?: { streakDays: number; studyTimeMin: number } | null;
}

export interface AdminSubject {
  id: string;
  name: string;
  curriculum: string;
  description: string | null;
  iconEmoji: string;
  createdAt: string;
  _count: { documents: number; topics: number };
}

export interface AdminSubjectDetail extends AdminSubject {
  documents: { id: string; title: string; sourceType: string; createdAt: string }[];
  milestones: {
    id: string; title: string; orderIndex: number;
    topics: { id: string; name: string; orderIndex: number; chunks: { id: string }[] }[];
  }[];
}

export interface CreateSubjectBody {
  name: string;
  curriculum: "IGCSE" | "A_LEVEL" | "VN_GRADE_12" | "GENERAL";
  description?: string;
  iconEmoji?: string;
}

export interface SystemSetting {
  id: string;
  defaultAiProvider: string;
  updatedAt?: string;
}

export interface AnalyticsOverview {
  totalUsers: number;
  totalSessions: number;
  totalMessages: number;
  activeToday: number;
  weeklyGrowth: number;
  avgSessionLength: number;
}

export interface AdminSession {
  id: string;
  title: string | null;
  mode: string;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string | null; email: string };
  subject: { name: string; iconEmoji: string } | null;
  _count: { messages: number };
}
