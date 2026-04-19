"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageSquare, TrendingUp, Settings, Compass, Trophy, Search, ArrowRight } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard",   icon: Home,          label: "Dashboard" },
  { href: "/explore",     icon: Compass,       label: "Explore" },
  { href: "/chat",        icon: MessageSquare, label: "Chat + Book" },
  { href: "/progress",    icon: TrendingUp,    label: "Progress" },
  { href: "/leaderboard", icon: Trophy,        label: "Leaderboard" },
  { href: "/settings",    icon: Settings,      label: "Settings" },
];

const SUBJECTS = [
  { emoji: "🧬", name: "Biology",   curriculum: "IGCSE", mastery: 78 },
  { emoji: "⚗️", name: "Chemistry", curriculum: "IGCSE", mastery: 41 },
  { emoji: "∫",  name: "Maths",     curriculum: "IGCSE", mastery: 22 },
];

const CHAPTERS: Record<string, { num: string; title: string; topics: number; mastery: number }[]> = {
  Biology: [
    { num: "01", title: "Characteristics of Living Organisms", topics: 6,  mastery: 95 },
    { num: "02", title: "Cells",                                topics: 5,  mastery: 84 },
    { num: "03", title: "Movement in and out of Cells",         topics: 4,  mastery: 78 },
    { num: "04", title: "Enzymes",                              topics: 5,  mastery: 71 },
    { num: "05", title: "Nutrition in Plants",                  topics: 6,  mastery: 55 },
    { num: "06", title: "Nutrition in Humans",                  topics: 7,  mastery: 44 },
    { num: "07", title: "Transport in Plants",                  topics: 5,  mastery: 32 },
    { num: "08", title: "Transport in Humans",                  topics: 8,  mastery: 18 },
    { num: "09", title: "Gas Exchange",                         topics: 5,  mastery: 0  },
    { num: "10", title: "Diseases",                             topics: 6,  mastery: 0  },
  ],
  Chemistry: [
    { num: "01", title: "States of Matter",                     topics: 5,  mastery: 72 },
    { num: "02", title: "Atomic Structure",                     topics: 4,  mastery: 60 },
    { num: "03", title: "Chemical Bonding",                     topics: 6,  mastery: 48 },
    { num: "04", title: "Stoichiometry",                        topics: 5,  mastery: 35 },
    { num: "05", title: "Electrochemistry",                     topics: 5,  mastery: 12 },
    { num: "06", title: "Chemical Energetics",                  topics: 4,  mastery: 0  },
  ],
  Maths: [
    { num: "01", title: "Number",                               topics: 7,  mastery: 80 },
    { num: "02", title: "Algebra",                              topics: 8,  mastery: 55 },
    { num: "03", title: "Geometry",                             topics: 6,  mastery: 30 },
    { num: "04", title: "Statistics & Probability",             topics: 5,  mastery: 0  },
  ],
};

function Pbar({ pct, color = "var(--color-accent)", h = 4 }: { pct: number; color?: string; h?: number }) {
  return (
    <div style={{ height: h, borderRadius: 999, background: "var(--color-border-default)", overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 999, transition: "width 0.9s cubic-bezier(0.16,1,0.3,1)" }} />
    </div>
  );
}

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-bright))",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 800, color: "var(--color-void)",
      }}>L</div>
      <span style={{ fontSize: 17, fontWeight: 800 }}>
        Linh<span style={{ color: "var(--color-accent)" }}>IQ</span>
      </span>
    </div>
  );
}

export default function ExplorePage() {
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [activeSubject, setActiveSubject] = useState("Biology");

  const chapters = CHAPTERS[activeSubject] || [];
  const filtered = chapters.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()));

  const masteryColor = (pct: number) =>
    pct >= 70 ? "var(--color-teal)" : pct >= 40 ? "var(--color-accent)" : pct > 0 ? "var(--color-gold)" : "var(--color-border-default)";

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--color-base)" }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0, borderRight: "1px solid var(--color-border-subtle)",
        background: "var(--color-void)", display: "flex", flexDirection: "column",
        position: "sticky", top: 0, height: "100vh",
      }}
        className="hidden md:flex"
      >
        <div style={{ padding: "18px 18px 14px", borderBottom: "1px solid var(--color-border-subtle)" }}>
          <Logo />
        </div>
        <nav style={{ padding: 10, flex: 1 }}>
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link key={href} href={href} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                borderRadius: "var(--radius-md)", marginBottom: 2,
                background: active ? "var(--color-accent-soft)" : "transparent",
                color: active ? "var(--color-accent)" : "var(--color-text-muted)",
                fontSize: 13, fontWeight: active ? 600 : 500,
                border: active ? "1px solid var(--color-accent-border)" : "1px solid transparent",
                transition: "all 120ms", textDecoration: "none",
              }}>
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: "32px 40px", overflowY: "auto" }} className="px-5 md:px-10">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>Explore</h1>
            <p style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>Browse and study by chapter &amp; topic</p>
          </div>
        </div>

        {/* Subject tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }} className="overflow-x-auto scrollbar-hide">
          {SUBJECTS.map((s) => {
            const active = activeSubject === s.name;
            return (
              <button key={s.name} onClick={() => setActiveSubject(s.name)} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "8px 16px",
                borderRadius: "var(--radius-md)", border: "none", cursor: "pointer", flexShrink: 0,
                background: active ? "var(--color-accent)" : "var(--color-surface)",
                color: active ? "var(--color-void)" : "var(--color-text-secondary)",
                fontWeight: 600, fontSize: 13, fontFamily: "inherit",
                border: active ? "none" : "1px solid var(--color-border-subtle)",
                transition: "all 150ms",
              }}>
                <span>{s.emoji}</span> {s.name}
                <span style={{
                  fontSize: 11, padding: "1px 7px", borderRadius: 999,
                  background: active ? "rgba(0,0,0,0.2)" : "var(--color-elevated)",
                  color: active ? "rgba(0,0,0,0.7)" : "var(--color-text-muted)",
                }}>{s.mastery}%</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div style={{
          display: "flex", gap: 10, alignItems: "center",
          background: "var(--color-surface)", border: "1px solid var(--color-border-default)",
          borderRadius: "var(--radius-md)", padding: "10px 14px", marginBottom: 24,
        }}>
          <Search size={16} color="var(--color-text-muted)" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chapters or topics..."
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              fontSize: 14, color: "var(--color-text-primary)", fontFamily: "inherit",
            }}
          />
        </div>

        {/* Chapter list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((ch) => {
            const col = masteryColor(ch.mastery);
            return (
              <Link key={ch.num} href="/chat" style={{
                display: "flex", alignItems: "center", gap: 16,
                padding: "16px 20px", borderRadius: "var(--radius-lg)",
                background: "var(--color-surface)",
                border: `1px solid ${ch.mastery >= 70 ? "rgba(61,214,140,0.2)" : "var(--color-border-subtle)"}`,
                cursor: "pointer", transition: "all 150ms", textDecoration: "none",
              }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--color-accent-border)";
                  (e.currentTarget as HTMLElement).style.background = "rgba(93,184,112,0.04)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = ch.mastery >= 70 ? "rgba(61,214,140,0.2)" : "var(--color-border-subtle)";
                  (e.currentTarget as HTMLElement).style.background = "var(--color-surface)";
                }}
              >
                {/* Chapter number */}
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: ch.mastery >= 70 ? "rgba(61,214,140,0.12)" : ch.mastery >= 40 ? "var(--color-accent-soft)" : "var(--color-elevated)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700, color: col,
                }}>{ch.num}</div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <p style={{ fontWeight: 600, fontSize: 14, color: ch.mastery === 0 ? "var(--color-text-secondary)" : "var(--color-text-primary)" }}>
                      {ch.title}
                    </p>
                    {ch.mastery >= 70 && (
                      <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, background: "rgba(61,214,140,0.12)", color: "var(--color-teal)", fontWeight: 700 }}>✓ Mastered</span>
                    )}
                    {ch.mastery > 0 && ch.mastery < 70 && (
                      <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, background: "var(--color-accent-soft)", color: "var(--color-accent)", fontWeight: 700 }}>In progress</span>
                    )}
                    {ch.mastery === 0 && (
                      <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, background: "var(--color-elevated)", color: "var(--color-text-muted)", fontWeight: 700 }}>Not started</span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ flex: 1 }}><Pbar pct={ch.mastery} color={col} /></div>
                    <span style={{ fontSize: 11, color: "var(--color-text-muted)", flexShrink: 0 }}>{ch.topics} topics</span>
                  </div>
                </div>

                {/* Mastery + arrow */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: col }}>
                    {ch.mastery > 0 ? `${ch.mastery}%` : "—"}
                  </span>
                  <div style={{
                    width: 30, height: 30, borderRadius: 8, background: "var(--color-elevated)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <ArrowRight size={14} color="var(--color-text-muted)" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden" style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-around", height: 64,
        background: "rgba(13,16,12,0.95)", backdropFilter: "blur(16px)",
        borderTop: "1px solid var(--color-border-subtle)",
      }}>
        {[
          { href: "/dashboard", icon: Home, label: "Home" },
          { href: "/explore",   icon: Compass, label: "Explore" },
          { href: "/chat",      icon: MessageSquare, label: "Chat" },
          { href: "/progress",  icon: TrendingUp, label: "Progress" },
          { href: "/leaderboard", icon: Trophy, label: "Ranks" },
        ].map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 12px",
              color: active ? "var(--color-accent)" : "var(--color-text-muted)", textDecoration: "none",
            }}>
              <Icon size={20} />
              <span style={{ fontSize: 10, fontWeight: 500 }}>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
