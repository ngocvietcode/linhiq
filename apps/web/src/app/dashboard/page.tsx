"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, AuthProvider } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Bell, 
  Home, 
  MessageSquare, 
  TrendingUp, 
  Settings, 
  ChevronRight,
  Flame,
  ArrowRight
} from "lucide-react";

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
      <div className="min-h-screen flex items-center justify-center bg-bg-void">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const firstName = user.name?.split(" ")[0] || "Student";
  const hours = new Date().getHours();
  const greeting = hours < 12 ? "Good morning" : hours < 18 ? "Good afternoon" : "Good evening";
  const greetingEmoji = hours < 18 ? "☀️" : "🌙";

  return (
    <div className="min-h-screen bg-bg-void flex flex-col md:flex-row font-sans">
      
      {/* SIDEBAR (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border-subtle bg-bg-base/50 p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-3 text-text-primary mb-12">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center font-bold text-accent">L</div>
          <span className="font-semibold text-lg tracking-tight">LinhIQ</span>
        </div>
        
        <nav className="flex-1 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-accent text-white font-medium shadow-accent-glow">
            <Home className="w-5 h-5" /> Home
          </button>
          <button onClick={() => startChat()} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-colors font-medium">
            <MessageSquare className="w-5 h-5" /> Chat
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-colors font-medium">
            <TrendingUp className="w-5 h-5" /> Progress
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-colors font-medium">
            <Settings className="w-5 h-5" /> Settings
          </button>
        </nav>

        <div className="mt-auto">
          <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-text-muted hover:text-danger transition-colors">
            Sign out
          </button>
        </div>
      </aside>

      {/* TOP NAV (Mobile + Shared) */}
      <div className="flex-1 flex flex-col pb-20 md:pb-0 relative">
        <nav className="md:hidden flex items-center justify-between p-4 sticky top-0 bg-bg-void/80 backdrop-blur-md z-10 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center font-bold text-accent text-xs">L</div>
            <span className="font-semibold text-text-primary">LinhIQ</span>
          </div>
          <div className="flex items-center gap-4">
            <Bell className="w-5 h-5 text-text-secondary" />
            <div className="text-sm font-medium text-text-secondary">{firstName} ▾</div>
          </div>
        </nav>

        {/* MAIN CONTENT RUNWAY */}
        <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full space-y-8">
          
          {/* GREETING */}
          <header className="pt-2 md:pt-4">
            <h1 className="text-text-primary text-2xl md:text-3xl font-semibold tracking-tight">
              {greeting}, {firstName}. {greetingEmoji}
            </h1>
            <p className="text-text-secondary mt-1 max-w-md">
              Ready to crush those exams? Let&apos;s pick up where you left off.
            </p>
          </header>

          {/* CONTINUE HERO BLOCK */}
          {overview?.subjects && overview.subjects.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">Continue learning</h2>
              <div 
                onClick={() => startChat(overview.subjects[0]?.id)}
                className="group relative overflow-hidden bg-bg-surface border border-border-subtle rounded-2xl p-6 cursor-pointer hover:border-accent/40 transition-all hover:-translate-y-0.5 hover:shadow-glow"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-bg-elevated">
                  <div className="h-full bg-accent" style={{ width: '78%' }} />
                </div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">{overview.subjects[0]?.iconEmoji || "📚"}</span>
                      <span className="text-sm font-medium px-2 py-0.5 rounded bg-bg-base text-text-secondary">
                        {overview.subjects[0]?.name} · {overview.subjects[0]?.curriculum}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-text-primary mb-1">Chapter 7: Transport in Humans</h3>
                    <p className="text-sm text-text-muted">78% complete</p>
                  </div>
                  <Button variant="ghost" className="text-text-primary mt-2">
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </section>
          )}

          {/* SUBJECTS GRID */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider">Your Subjects</h2>
              <Button variant="ghost" size="sm" className="text-accent text-xs p-0 px-2 h-auto hover:bg-transparent">See all <ChevronRight className="w-3 h-3 ml-1" /></Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {overview?.subjects?.slice(0, 3).map((subject) => {
                const masteryPct = Math.round((subject.overallMastery || 0) * 100);
                return (
                  <Card 
                    key={subject.id} 
                    onClick={() => startChat(subject.id)}
                    className="cursor-pointer hover:border-accent/40 transition-colors group p-5 bg-bg-base"
                  >
                    <div className="text-3xl mb-3 bg-bg-surface w-12 h-12 flex items-center justify-center rounded-xl shadow-sm border border-border-subtle">
                      {subject.iconEmoji}
                    </div>
                    <h3 className="font-semibold text-text-primary">{subject.name}</h3>
                    
                    <div className="mt-4 flex items-center gap-2">
                      <div className="flex-1 bg-border-subtle h-1.5 rounded-full overflow-hidden">
                        <div className="bg-text-secondary h-full rounded-full transition-all" style={{ width: `${masteryPct}%` }} />
                      </div>
                      <span className="text-xs font-mono text-text-muted">{masteryPct}%</span>
                    </div>
                    <div className="mt-3 text-xs text-accent font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                      Start <ArrowRight className="w-3 h-3 ml-1" />
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* RECENT SESSIONS */}
            <section>
              <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-4">Recent Sessions</h2>
              <div className="space-y-3">
                {sessions.slice(0, 3).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => router.push(`/chat/${s.id}`)}
                    className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-bg-surface border border-transparent hover:border-border-subtle transition-all text-left"
                  >
                    <div className="text-2xl w-10 h-10 flex items-center justify-center bg-bg-base rounded-lg border border-border-subtle">
                      {s.subject?.iconEmoji || "💬"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-text-primary truncate">
                        {s.title || "Open Conversation"}
                      </h4>
                      <p className="text-xs text-text-muted mt-0.5 border-b border-transparent inline-block">
                        {s.subject?.name || "General"} · {new Date(s.updatedAt).toLocaleDateString(undefined, { weekday: 'short' })}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* STREAK */}
            <section>
              <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-4">Today&apos;s Streak</h2>
              <Card className="p-5 bg-gradient-to-br from-bg-base to-bg-surface">
                <div className="flex items-center gap-3 text-warning mb-4">
                  <Flame className="w-6 h-6 fill-warning" />
                  <span className="font-semibold">{overview?.streakDays || 0}-day streak · Keep it up!</span>
                </div>
                <div className="flex justify-between items-center px-1">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
                    const isActive = i < (overview?.streakDays || 0);
                    return (
                      <div key={i} className="flex flex-col items-center gap-2">
                        <span className="text-xs text-text-muted font-medium">{day}</span>
                        <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-warning shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-border-subtle'}`} />
                      </div>
                    );
                  })}
                </div>
              </Card>
            </section>
          </div>

        </main>

        {/* BOTTOM NAV (Mobile Only) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-surface/90 backdrop-blur-md border-t border-border-subtle p-3 flex justify-around items-center z-20 pb-safe">
          <button className="flex flex-col items-center gap-1 text-accent">
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button onClick={() => startChat()} className="flex flex-col items-center gap-1 text-text-muted hover:text-text-primary">
            <MessageSquare className="w-5 h-5" />
            <span className="text-[10px] font-medium">Chat</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-text-muted hover:text-text-primary">
            <TrendingUp className="w-5 h-5" />
            <span className="text-[10px] font-medium">Progress</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-text-muted hover:text-text-primary">
            <Settings className="w-5 h-5" />
            <span className="text-[10px] font-medium">Settings</span>
          </button>
        </nav>
      </div>
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
