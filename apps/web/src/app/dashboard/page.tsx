"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AuthProvider } from "@/lib/auth-context";
import { api } from "@/lib/api";

interface SubjectProgress {
  id: string;
  name: string;
  curriculum: string;
  iconEmoji: string;
  description: string | null;
  totalTopics: number;
  masteredTopics: number;
  overallMastery: number; // 0.0 to 1.0
}

interface ProgressOverview {
  streakDays: number;
  studyTimeMin: number;
  subjects: SubjectProgress[];
}

interface SessionPreview {
  id: string;
  title: string | null;
  updatedAt: string;
  subject: {
    id: string;
    iconEmoji: string;
    name: string;
  };
  messages: { content: string }[];
}

function DashboardContent() {
  const router = useRouter();
  const { user, token, isLoading, logout } = useAuth();
  const [overview, setOverview] = useState<ProgressOverview | null>(null);
  const [sessions, setSessions] = useState<SessionPreview[]>([]);
  const [creating, setCreating] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!token) return;
    // Fetch overview and assign to object
    api<ProgressOverview>("/progress/overview", { token }).then(setOverview).catch(console.error);
    api<SessionPreview[]>("/chat/sessions", { token }).then(setSessions).catch(console.error);
  }, [token]);

  async function startChat(subjectId?: string) {
    if (!token || creating) return;
    setCreating(subjectId || 'open');
    try {
      const body = subjectId && subjectId !== "undefined" ? { subjectId } : {};
      const session = await api<{ id: string }>("/chat/sessions", {
        method: "POST",
        body,
        token,
      });
      router.push(`/chat/${session.id}`);
    } catch (err) {
      console.error(err);
      setCreating(null);
    }
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="animate-spin h-8 w-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  const subjectColors: Record<string, string> = {
    Biology: "bg-success/10 border-success/30 hover:border-success/60 text-success",
    Mathematics: "bg-accent/10 border-accent/30 hover:border-accent/60 text-accent",
    Chemistry: "bg-warning/10 border-warning/30 hover:border-warning/60 text-warning",
  };

  return (
    <div className="min-h-screen bg-bg-primary font-sans">
      {/* Top Nav */}
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 bg-bg-primary/80 backdrop-blur z-10">
        <h1 className="text-xl font-bold tracking-tight">
          <span className="text-accent">Linh</span>IQ
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-text-secondary">
            {user.name || user.email}
          </span>
          <button
            onClick={logout}
            className="text-sm text-text-muted hover:text-red-400 transition-colors px-3 py-1.5 rounded-md hover:bg-red-500/10"
          >
            Sign out
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Header & Stats Banner */}
        <div className="mb-10">
          <h2 className="text-3xl font-semibold mb-2">
            Welcome back, {user.name?.split(" ")[0] || "Student"} 👋
          </h2>
          <p className="text-text-secondary">
            Here's your learning progress. Consistency is key!
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-bg-card border border-border p-4 rounded-xl flex flex-col justify-center">
              <span className="text-text-muted text-xs uppercase tracking-wider mb-1">🔥 Current Streak</span>
              <span className="text-2xl font-bold text-accent">{overview?.streakDays || 0} Days</span>
            </div>
            <div className="bg-bg-card border border-border p-4 rounded-xl flex flex-col justify-center">
              <span className="text-text-muted text-xs uppercase tracking-wider mb-1">⏱️ Study Time</span>
              <span className="text-2xl font-bold text-success">
                {overview?.studyTimeMin ? `${Math.floor(overview.studyTimeMin / 60)}h ${overview.studyTimeMin % 60}m` : '0m'}
              </span>
            </div>
            <div className="bg-bg-card border border-border p-4 rounded-xl flex flex-col justify-center">
              <span className="text-text-muted text-xs uppercase tracking-wider mb-1">🏆 Topics Mastered</span>
              <span className="text-2xl font-bold text-warning">
                {overview?.subjects?.reduce((sum, s) => sum + s.masteredTopics, 0) || 0}
              </span>
            </div>
            <div className="bg-bg-card border border-border p-4 rounded-xl flex flex-col justify-center">
              <span className="text-text-muted text-xs uppercase tracking-wider mb-1">🗣️ Open Chat</span>
              <button 
                onClick={() => startChat()} 
                className="mt-1 text-sm bg-accent/20 text-accent font-medium py-1.5 px-3 rounded-lg hover:bg-accent/30 transition-colors w-max"
              >
                Chat with Linh →
              </button>
            </div>
          </div>
        </div>

        {/* Subjects Grid */}
        <h3 className="text-lg font-medium mb-4 text-text-primary">Target Subjects</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {overview?.subjects?.map((subject) => {
            const masteryPct = Math.round((subject.overallMastery || 0) * 100);
            return (
              <button
                key={subject.id}
                onClick={() => startChat(subject.id)}
                disabled={creating === subject.id}
                className={`bg-bg-card border ${subjectColors[subject.name]?.split(' ')[1] || "border-border"} 
                           rounded-2xl p-5 text-left transition-all duration-300 relative group
                           hover:scale-[1.02] hover:-translate-y-1 hover:shadow-xl hover:shadow-accent/5 active:scale-[0.98]
                           disabled:opacity-50 disabled:cursor-wait`}
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="text-4xl bg-bg-primary p-2 rounded-xl border border-border shadow-sm">{subject.iconEmoji}</span>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-bg-primary border border-border text-text-secondary">
                    {subject.curriculum}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold mb-1">{subject.name}</h3>
                <p className="text-sm text-text-muted mb-5 line-clamp-2 min-h-[40px]">{subject.description}</p>
                
                {/* Progress Bar Container */}
                <div className="w-full bg-bg-primary rounded-full h-2 mb-2 overflow-hidden border border-border/50">
                  <div 
                    className="bg-accent h-2 rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${masteryPct}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs font-medium text-text-secondary">
                    {subject.masteredTopics}/{subject.totalTopics} Mastered
                  </span>
                  <span className="text-sm font-bold text-accent">
                    {masteryPct}%
                  </span>
                </div>

                <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-2xl`} />
              </button>
            );
          })}
        </div>

        {/* Recent Sessions */}
        {sessions.length > 0 && (
          <div className="mb-12">
            <h3 className="text-lg font-medium mb-4 text-text-primary flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
              Recent Activity
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sessions.slice(0, 4).map((s) => (
                <button
                  key={s.id}
                  onClick={() => router.push(`/chat/${s.id}`)}
                  className="bg-bg-card border border-border rounded-xl px-4 py-4
                             flex items-center gap-4 hover:border-accent/40 hover:bg-accent/5 transition-all
                             text-left group"
                >
                  <div className="bg-bg-primary w-10 h-10 rounded-full flex items-center justify-center text-xl border border-border group-hover:border-accent/20">
                    {s.subject?.iconEmoji || "💬"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-text-primary group-hover:text-accent transition-colors">
                      {s.title || (s.subject ? s.subject.name : "Open Chat")}
                    </p>
                    <p className="text-xs text-text-muted truncate mt-0.5">
                      {s.messages[0]?.content || "Started a new session"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase text-text-muted font-medium mb-1">
                      {new Date(s.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-accent opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                      →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}
