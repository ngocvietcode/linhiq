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
export interface AdminUsersListParams {
  q?: string;
  role?: "STUDENT" | "ADMIN" | "PARENT";
  status?: "active" | "banned" | "all";
  page?: number;
  pageSize?: number;
  sortBy?: "name" | "email" | "role" | "createdAt";
  sortDir?: "asc" | "desc";
}

function buildQuery(p: AdminUsersListParams = {}): string {
  const params = new URLSearchParams();
  Object.entries(p).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  });
  const s = params.toString();
  return s ? `?${s}` : "";
}

export const adminUsers = {
  list: (token: string, params?: AdminUsersListParams) =>
    req<AdminUsersListResponse>(`/admin/users${buildQuery(params)}`, token),
  get: (token: string, id: string) =>
    req<{ data: AdminUserDetail }>(`/admin/users/${id}`, token),
  create: (token: string, body: AdminCreateUserBody) =>
    req<{ data: AdminUser }>("/admin/users", token, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (token: string, id: string, body: Partial<AdminCreateUserBody>) =>
    req<{ data: AdminUser }>(`/admin/users/${id}`, token, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  ban: (token: string, id: string) =>
    req<{ data: AdminUser }>(`/admin/users/${id}/ban`, token, { method: "POST" }),
  unban: (token: string, id: string) =>
    req<{ data: AdminUser }>(`/admin/users/${id}/unban`, token, { method: "POST" }),
  resetPassword: (token: string, id: string, password?: string) =>
    req<{ data: { tempPassword: string } }>(
      `/admin/users/${id}/reset-password`,
      token,
      { method: "POST", body: JSON.stringify(password ? { password } : {}) },
    ),
  delete: (token: string, id: string) =>
    req<{ success: boolean }>(`/admin/users/${id}`, token, { method: "DELETE" }),
  bulkDelete: (token: string, ids: string[]) =>
    req<{ data: { deleted: number; skipped: number } }>(
      `/admin/users/bulk-delete`,
      token,
      { method: "POST", body: JSON.stringify({ ids }) },
    ),
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
export interface AdminSessionsListParams {
  q?: string;
  mode?: "SUBJECT" | "OPEN";
  subjectId?: string;
  userId?: string;
  hasMessages?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: "updatedAt" | "createdAt";
  sortDir?: "asc" | "desc";
}

export const adminSessions = {
  list: (token: string, params?: AdminSessionsListParams) =>
    req<AdminSessionsListResponse>(`/admin/chat-sessions${buildQuery(params as any)}`, token),
  get: (token: string, id: string) =>
    req<{ data: AdminSessionDetail }>(`/admin/chat-sessions/${id}`, token),
  delete: (token: string, id: string) =>
    req<{ success: boolean }>(`/admin/chat-sessions/${id}`, token, { method: "DELETE" }),
  bulkDelete: (token: string, ids: string[]) =>
    req<{ data: { deleted: number } }>(`/admin/chat-sessions/bulk-delete`, token, {
      method: "POST",
      body: JSON.stringify({ ids }),
    }),
  stats: (token: string) =>
    req<{ data: AdminSessionStats }>("/admin/chat-sessions/stats", token),
};

// ── Types ─────────────────────────────────────────────────────────
export type UserRole = "STUDENT" | "ADMIN" | "PARENT";

export interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  isActive: boolean;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt?: string;
  studentProfile?: {
    streakDays: number;
    lastStudyAt: string | null;
    curriculum: string;
  } | null;
  _count?: { chatSessions: number; quizAttempts: number };
}

export interface AdminUserDetail extends AdminUser {
  googleId?: string | null;
  studentProfile?:
    | (AdminUser["studentProfile"] & {
        timezone: string;
        studyGoal: number;
        enrollments: {
          id: string;
          subject: { id: string; name: string; iconEmoji: string };
        }[];
      })
    | null;
  chatSessions: {
    id: string;
    title: string | null;
    mode: string;
    createdAt: string;
    updatedAt: string;
    subject: { name: string; iconEmoji: string } | null;
    _count: { messages: number };
  }[];
  parentLinks: { id: string; child: { id: string; name: string; email: string } }[];
  childLinks: { id: string; parent: { id: string; name: string; email: string } }[];
}

export interface AdminUsersListResponse {
  success: boolean;
  data: AdminUser[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  counts: { all: number; STUDENT: number; ADMIN: number; PARENT: number };
}

export interface AdminCreateUserBody {
  email: string;
  name: string;
  role: UserRole;
  password: string;
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
  liteLlmUrl?: string;
  liteLlmApiKey?: string;
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

export type ChatMode = "SUBJECT" | "OPEN";

export interface AdminSession {
  id: string;
  title: string | null;
  mode: ChatMode;
  hintLevel: string;
  createdAt: string;
  updatedAt: string;
  endedAt: string | null;
  user: { id: string; name: string | null; email: string; avatarUrl: string | null };
  subject: { id: string; name: string; iconEmoji: string } | null;
  _count: { messages: number };
  topicStats?: {
    academic: number;
    general: number;
    hobbies: number;
    life: number;
    redirected: number;
    totalMsg: number;
  } | null;
}

export interface AdminMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
  hintLevel: string | null;
  imageUrl: string | null;
  modelUsed: string | null;
  tokensUsed: number | null;
  ragSources: string[];
  safeCategory: string | null;
  wasRedirected: boolean;
}

export interface AdminSessionDetail extends AdminSession {
  user: AdminSession["user"] & { role: string };
  topicStats: AdminSession["topicStats"];
  messages: AdminMessage[];
  _count: { messages: number };
}

export interface AdminSessionsListResponse {
  success: boolean;
  data: AdminSession[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  counts: { all: number; SUBJECT: number; OPEN: number };
}

export interface AdminSessionStats {
  totalSessions: number;
  totalMessages: number;
  recent24h: number;
  topSubjects: { subject: { id: string; name: string; iconEmoji: string } | null; count: number }[];
}
