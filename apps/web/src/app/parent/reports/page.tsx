"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ParentReportPage() {
  const router = useRouter();

  useEffect(() => {
    document.documentElement.classList.add("parent-mode");
    return () => {
      document.documentElement.classList.remove("parent-mode");
    };
  }, []);

  return (
    <div className="min-h-screen bg-bg-void flex flex-col font-sans text-text-primary pb-10">
      
      {/* HEADER */}
      <header className="border-b border-border-subtle bg-bg-base sticky top-0 z-10 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/parent')} className="text-text-secondary hover:text-text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-semibold text-[15px] leading-tight text-text-primary">Minh&apos;s Weekly Report</h1>
            <p className="text-xs text-text-muted">Week of Mar 31 – Apr 6, 2026</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full p-4 sm:p-6 space-y-6">

        {/* Study Hours */}
        <section className="bg-bg-base border border-border-default rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-6">Study hours</h2>
          
          <div className="flex items-end justify-between gap-1 h-32 w-full border-b border-border-subtle pb-2 relative">
            <div className="absolute top-0 left-0 w-full border-t border-dashed border-border-subtle opacity-50" />
            <div className="absolute top-1/2 left-0 w-full border-t border-dashed border-border-subtle opacity-50" />
            
            {[
              { d: 'Mon', v: 40 },
              { d: 'Tue', v: 0 },
              { d: 'Wed', v: 80 },
              { d: 'Thu', v: 40 },
              { d: 'Fri', v: 80 },
              { d: 'Sat', v: 0 },
              { d: 'Sun', v: 50 },
            ].map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 z-10 h-full justify-end">
                <div className="w-full max-w-[24px] bg-accent/80 rounded-sm hover:bg-accent transition-colors" style={{ height: `${day.v}%` }} />
                <span className="text-[11px] font-medium text-text-muted">{day.d}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Subject Breakdown */}
        <section className="bg-bg-base border border-border-default rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Subject breakdown</h2>
          <div className="space-y-4">
            {[
              { name: 'Biology', time: '5h 20min', pct: 64, color: 'bg-[#10B981]' },
              { name: 'Chemistry', time: '2h 10min', pct: 26, color: 'bg-[#3B82F6]' },
              { name: 'Mathematics', time: '50min', pct: 10, color: 'bg-[#F59E0B]' },
            ].map(s => (
              <div key={s.name} className="flex items-center gap-4">
                <span className="w-24 text-[13px] font-medium">{s.name}</span>
                <div className="flex-1 bg-border-subtle h-2 rounded-full overflow-hidden shrink-1">
                  <div className={`h-full ${s.color} rounded-full`} style={{ width: `${s.pct}%` }} />
                </div>
                <div className="w-32 flex justify-between text-[13px]">
                  <span className="font-medium">{s.time}</span>
                  <span className="text-text-muted">{s.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Topics Studied */}
        <section className="bg-bg-base border border-border-default rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Topics studied this week</h2>
          
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🧬</span>
                <h3 className="font-semibold text-text-primary">Biology</h3>
              </div>
              <ul className="space-y-2 ml-8">
                <li className="text-[13px] text-text-secondary flex gap-2"><span className="text-text-muted">·</span> <span className="font-medium text-text-primary">Transport in Humans (2h 10min)</span> — NEW topic</li>
                <li className="text-[13px] text-text-secondary flex gap-2"><span className="text-text-muted">·</span> <span>Osmosis deep dive (1h 40min)</span> — Reviewed</li>
                <li className="text-[13px] text-text-secondary flex gap-2"><span className="text-text-muted">·</span> <span>Cell quiz (30min)</span> — Scored 8/10</li>
              </ul>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">⚗️</span>
                <h3 className="font-semibold text-text-primary">Chemistry</h3>
              </div>
              <ul className="space-y-2 ml-8">
                <li className="text-[13px] text-text-secondary flex gap-2"><span className="text-text-muted">·</span> <span className="font-medium text-text-primary">Ionic vs Covalent Bonding (1h 20min)</span></li>
                <li className="text-[13px] text-text-secondary flex gap-2"><span className="text-text-muted">·</span> <span>Periodic Table review (50min)</span></li>
              </ul>
            </div>
          </div>
        </section>

        {/* AI Insight */}
        <section className="bg-bg-surface border border-accent/20 rounded-2xl p-6 shadow-[0_0_15px_rgba(99,102,241,0.05)] border-l-4 border-l-accent">
          <h2 className="text-sm font-semibold text-accent uppercase tracking-wider mb-2">AI conversation summary</h2>
          <p className="text-[14px] text-text-primary font-medium mb-3">47 questions asked this week. Key topics:</p>
          <ul className="list-disc pl-5 space-y-1 text-[13px] text-text-secondary mb-4">
            <li>Osmosis & water potential (12 questions)</li>
            <li>Blood circulation (8 questions)</li>
            <li>Ionic bonding (7 questions)</li>
          </ul>
          <div className="bg-bg-elevated p-3 rounded-lg border border-border-default text-[13px] text-text-primary italic">
            "Minh often asks follow-up questions after getting hints — showing good persistence." ✨
          </div>
        </section>

        {/* Strengths & Weaknesses */}
        <div className="grid sm:grid-cols-2 gap-6">
          <section className="bg-bg-base border border-[#10B981]/30 rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-[#10B981] uppercase tracking-wider mb-4">What Minh knows well</h2>
            <ul className="space-y-2 text-[13px] text-text-primary">
              <li className="flex items-center gap-2">✅ Osmosis and water potential</li>
              <li className="flex items-center gap-2">✅ Cell structure and function</li>
              <li className="flex items-center gap-2">✅ Enzyme activity</li>
            </ul>
          </section>

          <section className="bg-bg-base border border-[#F59E0B]/30 rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-[#F59E0B] uppercase tracking-wider mb-4">Areas to strengthen</h2>
            <ul className="space-y-2 text-[13px] text-text-primary">
              <li className="flex gap-2">⚠️ Photosynthesis (only 55% correct)</li>
              <li className="flex gap-2">⚠️ Mathematics overall (only 2 sessions this week)</li>
            </ul>
          </section>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
          <Button variant="secondary" className="w-full sm:flex-1 bg-bg-base shadow-sm">
            <Download className="w-4 h-4 mr-2" /> Download PDF Report
          </Button>
          <Button variant="secondary" className="w-full sm:flex-1 bg-bg-base shadow-sm">
            <Share className="w-4 h-4 mr-2" /> Share with teacher
          </Button>
        </div>

      </main>
    </div>
  );
}
