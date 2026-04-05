"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  BarChart2, 
  MessageSquare, 
  Settings, 
  LayoutDashboard,
  AlertTriangle,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ParentHomePage() {
  const router = useRouter();

  useEffect(() => {
    document.documentElement.classList.add("parent-mode");
    return () => {
      document.documentElement.classList.remove("parent-mode");
    };
  }, []);

  return (
    <div className="min-h-screen bg-bg-void flex flex-col font-sans text-text-primary">
      
      {/* HEADER */}
      <header className="border-b border-border-subtle bg-bg-base sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center font-bold text-accent">L</div>
          <span className="font-semibold text-lg tracking-tight">LinhIQ Parent</span>
        </div>
        <div className="text-sm font-medium text-text-secondary">
          Mr. Hung ▾
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-6 sm:p-8 md:py-12">
        <div className="mb-10">
          <h1 className="text-2xl sm:text-3xl font-semibold mb-2">👋 Good morning, Mr. Hung.</h1>
          <p className="text-text-secondary text-lg">Here&apos;s how Minh is doing this week.</p>
        </div>

        {/* SUMMARY CARD */}
        <div className="bg-bg-base border border-border-default rounded-2xl p-6 sm:p-8 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-8 border-b border-border-subtle pb-6">
            <div>
              <h2 className="font-semibold text-lg">Minh</h2>
              <p className="text-text-secondary text-sm">IGCSE Year 10</p>
            </div>
            <Button variant="secondary" onClick={() => router.push('/parent/reports')} className="hidden sm:flex">
              View Detailed Report →
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-sm font-medium text-text-muted mb-1 flex items-center gap-2">⏱ Study Time</div>
              <div className="text-2xl font-bold flex items-end gap-2">
                8h 20m <span className="text-sm text-success mb-1">↑ 23%</span>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-text-muted mb-1 flex items-center gap-2">💬 Questions</div>
              <div className="text-2xl font-bold">47 <span className="text-text-secondary text-sm font-medium">asked</span></div>
            </div>
            <div>
              <div className="text-sm font-medium text-text-muted mb-1 flex items-center gap-2">🎯 Accuracy</div>
              <div className="text-2xl font-bold">78% <span className="text-text-secondary text-sm font-medium">correct</span></div>
            </div>
            <div>
              <div className="text-sm font-medium text-text-muted mb-1 flex items-center gap-2">🔥 Streak</div>
              <div className="text-2xl font-bold">7 <span className="text-text-secondary text-sm font-medium">days active</span></div>
            </div>
          </div>
          <Button variant="secondary" onClick={() => router.push('/parent/reports')} className="w-full mt-8 sm:hidden">
            View Detailed Report →
          </Button>
        </div>

        {/* SUBJECT OVERVIEW */}
        <h3 className="text-lg font-semibold mb-4 text-text-primary">Subject overview</h3>
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {[
            { name: 'Biology', pct: 78, status: 'Good progress', emoji: '🧬', color: 'bg-[#10B981]' },
            { name: 'Chemistry', pct: 62, status: 'Steady', emoji: '⚗️', color: 'bg-[#3B82F6]' },
            { name: 'Maths', pct: 41, status: 'Needs focus', emoji: '∫', color: 'bg-[#F59E0B]' },
          ].map(s => (
            <div key={s.name} className="bg-bg-base border border-border-default rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{s.emoji}</span>
                <span className="font-semibold">{s.name}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1 bg-border-subtle h-2 rounded-full overflow-hidden mr-3">
                  <div className={`h-full ${s.color} rounded-full`} style={{ width: `${s.pct}%` }} />
                </div>
                <span className="text-sm font-bold">{s.pct}%</span>
              </div>
              <p className="text-sm text-text-secondary">{s.status}</p>
            </div>
          ))}
        </div>

        {/* ATTENTION NEEDED */}
        <h3 className="text-lg font-semibold mb-4 text-text-primary">Attention needed</h3>
        <div className="bg-bg-base border-l-4 border-l-[#F59E0B] border border-border-default rounded-xl p-5 shadow-sm mb-8 flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-[#F59E0B] shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-text-primary">Minh hasn&apos;t studied Chemistry in 3 days.</p>
            <p className="text-text-secondary text-sm mt-1">The Chemistry exam is in 18 days. Consider reminding him to review Ionic Bonding.</p>
          </div>
        </div>

        {/* RECENT ACTIVITY */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">Recent activity</h3>
          <button className="text-sm font-medium text-accent hover:underline flex items-center">
            View full history <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
        <div className="bg-bg-base border border-border-default rounded-xl overflow-hidden shadow-sm">
          <div className="divide-y divide-border-subtle">
            {[
              { day: 'Today', sub: 'Biology', time: '55min', desc: 'Studied Transport in Humans' },
              { day: 'Today', sub: 'Biology', time: '25min', desc: 'Asked about osmosis (5 Qs)' },
              { day: 'Monday', sub: 'Chemistry', time: '40min', desc: 'Studied Ionic Bonding' },
              { day: 'Sunday', sub: 'Biology', time: '30min', desc: 'Completed quiz — 8/10 correct' },
            ].map((act, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center py-4 px-6 gap-2 sm:gap-6 hover:bg-bg-surface transition-colors">
                <div className="w-20 text-sm font-medium text-text-primary">{act.day}</div>
                <div className="w-32 text-sm text-text-secondary flex justify-between">
                  <span>{act.sub}</span> <span>{act.time}</span>
                </div>
                <div className="flex-1 text-sm text-text-primary sm:border-l sm:border-border-default sm:pl-6">{act.desc}</div>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* BOTTOM NAV */}
      <footer className="border-t border-border-subtle bg-bg-base py-3 flex justify-around items-center px-6 mt-auto">
        <button className="flex flex-col items-center gap-1 text-accent">
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-medium">Overview</span>
        </button>
        <button onClick={() => router.push('/parent/reports')} className="flex flex-col items-center gap-1 text-text-muted hover:text-text-primary">
          <BarChart2 className="w-5 h-5" />
          <span className="text-[10px] font-medium">Reports</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-text-muted hover:text-text-primary">
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px] font-medium">Messages</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-text-muted hover:text-text-primary">
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-medium">Settings</span>
        </button>
      </footer>
    </div>
  );
}
