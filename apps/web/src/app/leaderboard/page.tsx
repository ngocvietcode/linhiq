"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageSquare, TrendingUp, Settings, Compass, Trophy, Users } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard",   icon: Home,          label: "Dashboard" },
  { href: "/explore",     icon: Compass,       label: "Explore" },
  { href: "/chat",        icon: MessageSquare, label: "Chat + Book" },
  { href: "/progress",    icon: TrendingUp,    label: "Progress" },
  { href: "/leaderboard", icon: Trophy,        label: "Leaderboard" },
  { href: "/settings",    icon: Settings,      label: "Settings" },
];

const FRIENDS = [
  { rank: 1, name: "An Nguyen",    avatar: "A", streak: 14, points: 2840, badge: "🏆", isMe: false, subjects: "Biology, Chem" },
  { rank: 2, name: "Minh Nguyen",  avatar: "M", streak: 7,  points: 2210, badge: "🥈", isMe: true,  subjects: "Biology, Chem, Maths" },
  { rank: 3, name: "Linh Tran",    avatar: "L", streak: 11, points: 1980, badge: "🥉", isMe: false, subjects: "Physics, Maths" },
  { rank: 4, name: "Huy Le",       avatar: "H", streak: 3,  points: 1450, badge: null, isMe: false, subjects: "Chemistry" },
  { rank: 5, name: "Mai Pham",     avatar: "P", streak: 5,  points: 1230, badge: null, isMe: false, subjects: "Biology, Economics" },
];

const POINTS_BREAKDOWN = [
  { action: "Correct answer",       pts: "+10 pts" },
  { action: "Key term earned",      pts: "+25 pts" },
  { action: "Daily goal met",       pts: "+50 pts" },
  { action: "Streak bonus (7d)",    pts: "+100 pts" },
  { action: "Quiz perfect score",   pts: "+150 pts" },
  { action: "Chapter mastered",     pts: "+200 pts" },
];

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

export default function LeaderboardPage() {
  const pathname = usePathname();
  const [tab, setTab] = useState<"friends" | "global" | "subject">("friends");

  const podiumOrder = [FRIENDS[1], FRIENDS[0], FRIENDS[2]];
  const podiumHeights = [90, 120, 70];
  const podiumColors = ["rgba(192,192,192,0.15)", "rgba(255,215,0,0.15)", "rgba(205,127,50,0.15)"];
  const podiumBorderColors = ["#C0C0C030", "#FFD70030", "#CD7F3230"];

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
        <div style={{ maxWidth: 680 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>Leaderboard</h1>
              <p style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>Week of April 14–20, 2026</p>
            </div>
            <button style={{
              padding: "8px 16px", borderRadius: "var(--radius-md)",
              background: "var(--color-surface)", border: "1px solid var(--color-border-subtle)",
              fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit",
            }}>
              <Users size={14} color="var(--color-text-muted)" /> Invite friends
            </button>
          </div>

          {/* Tabs */}
          <div style={{
            display: "flex", background: "var(--color-surface)", padding: 4,
            borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-subtle)",
            gap: 2, marginBottom: 24, width: "fit-content",
          }}>
            {(["friends", "global", "subject"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: "7px 16px", borderRadius: "var(--radius-sm)",
                background: tab === t ? "var(--color-elevated)" : "transparent",
                border: tab === t ? "1px solid var(--color-border-default)" : "1px solid transparent",
                color: tab === t ? "var(--color-text-primary)" : "var(--color-text-muted)",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                fontFamily: "inherit", textTransform: "capitalize",
              }}>{t}</button>
            ))}
          </div>

          {/* Top 3 podium */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 12, marginBottom: 32, padding: "24px 0" }}>
            {podiumOrder.map((f, i) => (
              <div key={f.rank} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: "50%",
                  background: f.isMe ? "linear-gradient(135deg, var(--color-accent), var(--color-accent-bright))" : "var(--color-elevated)",
                  border: f.isMe ? "2px solid var(--color-accent)" : "2px solid var(--color-border-default)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, fontWeight: 800,
                  color: f.isMe ? "var(--color-void)" : "var(--color-text-secondary)",
                  boxShadow: f.isMe ? "0 0 16px var(--color-accent-glow)" : "none",
                }}>{f.avatar}</div>
                <p style={{ fontSize: 12, fontWeight: 700, color: f.isMe ? "var(--color-accent)" : "var(--color-text-primary)", maxWidth: 80, textAlign: "center", lineHeight: 1.3 }}>
                  {f.name.split(" ")[0]}
                </p>
                <p style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{f.points.toLocaleString()} pts</p>
                <div style={{
                  width: 72, height: podiumHeights[i], borderRadius: "6px 6px 0 0",
                  background: podiumColors[i], border: `1px solid ${podiumBorderColors[i]}`,
                  display: "flex", alignItems: "flex-start", justifyContent: "center",
                  paddingTop: 8, fontSize: 22,
                }}>{f.badge}</div>
              </div>
            ))}
          </div>

          {/* Full list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
            {FRIENDS.map((f) => (
              <div key={f.rank} style={{
                display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
                borderRadius: "var(--radius-lg)",
                background: f.isMe ? "var(--color-accent-soft)" : "var(--color-surface)",
                border: f.isMe ? "1px solid var(--color-accent-border)" : "1px solid var(--color-border-subtle)",
              }}>
                <span style={{
                  width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 800,
                  color: f.rank === 1 ? "#FFD700" : f.rank === 2 ? "#C0C0C0" : f.rank === 3 ? "#CD7F32" : "var(--color-text-muted)",
                  background: f.rank <= 3 ? "var(--color-elevated)" : "transparent",
                }}>{f.rank}</span>

                <div style={{
                  width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                  background: f.isMe ? "linear-gradient(135deg, var(--color-accent), var(--color-accent-bright))" : "var(--color-elevated)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontWeight: 700,
                  color: f.isMe ? "var(--color-void)" : "var(--color-text-secondary)",
                  border: f.isMe ? "2px solid var(--color-accent)" : "none",
                }}>{f.avatar}</div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <p style={{ fontWeight: f.isMe ? 700 : 600, fontSize: 14, color: f.isMe ? "var(--color-accent)" : "var(--color-text-primary)" }}>
                      {f.name} {f.isMe && <span style={{ fontSize: 11, color: "var(--color-text-muted)", fontWeight: 400 }}>(you)</span>}
                    </p>
                    {f.badge && <span>{f.badge}</span>}
                  </div>
                  <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{f.subjects} · 🔥 {f.streak}-day streak</p>
                </div>

                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 15, fontWeight: 800, color: f.isMe ? "var(--color-accent)" : "var(--color-text-primary)" }}>
                    {f.points.toLocaleString()}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--color-text-muted)" }}>points</p>
                </div>
              </div>
            ))}
          </div>

          {/* Points breakdown */}
          <div style={{ padding: "20px", borderRadius: "var(--radius-lg)", background: "var(--color-surface)", border: "1px solid var(--color-border-subtle)" }}>
            <p style={{ fontWeight: 700, marginBottom: 14, fontSize: 14 }}>How points are earned</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {POINTS_BREAKDOWN.map((p) => (
                <div key={p.action} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>{p.action}</span>
                  <span style={{ fontWeight: 700, color: "var(--color-accent)" }}>{p.pts}</span>
                </div>
              ))}
            </div>
          </div>
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
