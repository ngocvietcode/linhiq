"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, MessageSquare, TrendingUp, Settings } from "lucide-react";

export default function ProgressPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-bg-void flex flex-col md:flex-row font-sans">
      
      {/* SIDEBAR (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border-subtle bg-bg-base/50 p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-3 text-text-primary mb-12">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center font-bold text-accent">L</div>
          <span className="font-semibold text-lg tracking-tight">LinhIQ</span>
        </div>
        
        <nav className="flex-1 space-y-2">
          <button onClick={() => router.push("/dashboard")} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-colors font-medium">
            <Home className="w-5 h-5" /> Home
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-colors font-medium">
            <MessageSquare className="w-5 h-5" /> Chat
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-accent text-white font-medium shadow-accent-glow">
            <TrendingUp className="w-5 h-5" /> Progress
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-colors font-medium">
            <Settings className="w-5 h-5" /> Settings
          </button>
        </nav>
      </aside>

      {/* TOP NAV (Mobile + Shared) */}
      <div className="flex-1 flex flex-col pb-20 md:pb-0 relative">
        
        <nav className="md:hidden flex items-center justify-between p-4 sticky top-0 bg-bg-void/80 backdrop-blur-md z-10 border-b border-border-subtle">
          <span className="font-semibold text-text-primary text-lg">Progress</span>
        </nav>

        <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full space-y-8">
          
          <header className="flex items-center justify-between pt-2">
            <h1 className="text-2xl font-semibold text-text-primary">Progress</h1>
            <select className="bg-bg-surface border border-border-default rounded-lg px-3 py-2 text-sm font-medium text-text-secondary outline-none focus:border-accent">
              <option>This week ▾</option>
              <option>Last week</option>
            </select>
          </header>

          <section className="bg-bg-base border border-border-subtle rounded-2xl p-6">
            <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-6">Study time this week</h2>
            
            <div className="h-40 flex items-end gap-2 justify-between mt-8 relative">
              {/* Lines */}
              <div className="absolute inset-x-0 bottom-0 border-t border-border-subtle w-full" />
              <div className="absolute inset-x-0 bottom-10 border-t border-border-subtle/50 w-full" />
              <div className="absolute inset-x-0 bottom-20 border-t border-border-subtle/50 w-full" />
              
              {/* Labels y-axis */}
              <span className="absolute bottom-20 -left-6 text-[10px] text-text-muted">2h</span>
              <span className="absolute bottom-10 -left-6 text-[10px] text-text-muted">1h</span>
              <span className="absolute bottom-0 -left-6 text-[10px] text-text-muted">0h</span>

              {/* Bars */}
              {[
                { day: 'Mon', h: '40%' },
                { day: 'Tue', h: '5%' },
                { day: 'Wed', h: '60%' },
                { day: 'Thu', h: '25%' },
                { day: 'Fri', h: '80%' },
                { day: 'Sat', h: '0%' },
                { day: 'Sun', h: '30%' },
              ].map(d => (
                <div key={d.day} className="flex-1 max-w-[40px] flex flex-col items-center gap-3 z-10">
                  <div className="w-full bg-accent/20 rounded-sm relative group hover:bg-accent/40" style={{ height: d.h }}>
                    <div className="absolute bottom-0 left-0 right-0 bg-accent rounded-sm transition-all" style={{ height: '70%' }} />
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-bg-elevated px-2 py-1 rounded text-xs font-medium text-text-primary">
                      {d.h}
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-text-muted">{d.day}</span>
                </div>
              ))}
            </div>
            
            <div className="text-center mt-6">
              <span className="text-[15px] font-medium text-text-primary">Total: 8h 20min</span>
              <span className="text-[13px] font-medium text-success ml-2">↑ +23% from last week</span>
            </div>
          </section>

          <section className="bg-bg-base border border-border-subtle rounded-2xl p-6">
            <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-4 flex items-center justify-between">
              Topic mastery — Biology
              <div className="text-xs text-text-primary px-2 py-1 bg-bg-surface rounded-lg">🧬</div>
            </h2>
            <div className="space-y-4">
              {[
                { name: 'Characteristics of Living... ', pct: 95, status: '✅' },
                { name: 'Cells', pct: 84, status: '✅' },
                { name: 'Enzymes', pct: 78, status: '✅' },
                { name: 'Nutrition in Plants', pct: 55, status: '⚠️' },
                { name: 'Nutrition in Humans', pct: 44, status: '⚠️' },
                { name: 'Transport in Plants', pct: 32, status: '──' },
                { name: 'Transport in Humans', pct: 18, status: '──' },
                { name: 'Gas Exchange', pct: 0, status: '──' },
              ].map(t => (
                <div key={t.name} className="flex items-center gap-4 group">
                  <span className="w-6 text-center text-sm shrink-0">{t.status}</span>
                  <span className="w-48 text-[13px] font-medium text-text-primary truncate">{t.name}</span>
                  <div className="flex-1 bg-border-subtle h-2 rounded-full overflow-hidden shrink-1 max-w-[200px]">
                    <div 
                      className={`h-full rounded-full ${t.pct > 70 ? 'bg-success' : t.pct > 40 ? 'bg-warning' : 'bg-text-muted'}`}
                      style={{ width: `${t.pct}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-[13px] font-mono text-text-muted">{t.pct}%</span>
                </div>
              ))}
            </div>
          </section>

          <div className="grid md:grid-cols-2 gap-6">
            <section className="bg-bg-surface border border-warning/40 rounded-2xl p-6 shadow-[0_0_20px_rgba(245,158,11,0.05)] border-l-4 border-l-warning">
              <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-2">Weak areas to focus on</h2>
              <div className="flex items-start gap-3 mt-4">
                <span className="text-xl">⚠️</span>
                <div>
                  <h3 className="font-semibold text-text-primary mb-1">Nutrition in Plants</h3>
                  <p className="text-sm text-text-secondary leading-relaxed mb-4">
                    You&apos;ve asked 8 questions but still getting 45% correct. Let&apos;s drill photosynthesis.
                  </p>
                  <Button variant="secondary" size="sm" className="bg-bg-base">Study this now →</Button>
                </div>
              </div>
            </section>

            <section className="bg-bg-base border border-border-subtle rounded-2xl p-6">
              <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-4">Key terms earned (this week)</h2>
              <div className="flex flex-wrap gap-2">
                {['osmosis', 'semi-permeable', 'concentration gradient', 'chlorophyll', 'photosynthesis', 'active transport', '+14 more'].map(term => (
                  <span key={term} className="px-3 py-1.5 bg-success/10 text-success border border-success/20 rounded-md text-[13px] font-medium">
                    {term.startsWith('+') ? term : `[${term}]`}
                  </span>
                ))}
              </div>
            </section>
          </div>
        </main>

        {/* BOTTOM NAV (Mobile Only) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-surface/90 backdrop-blur-md border-t border-border-subtle p-3 flex justify-around items-center z-20 pb-safe">
          <button onClick={() => router.push("/dashboard")} className="flex flex-col items-center gap-1 text-text-muted hover:text-text-primary">
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-text-muted hover:text-text-primary">
            <MessageSquare className="w-5 h-5" />
            <span className="text-[10px] font-medium">Chat</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-accent">
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
