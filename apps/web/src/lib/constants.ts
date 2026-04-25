import { Home, MessageSquare, TrendingUp, Settings, type LucideIcon } from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   Shared navigation items — single source of truth
   Used by: AppShell sidebar, BottomNav, mobile headers
   ═══════════════════════════════════════════════════════════ */

export interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/chat", icon: MessageSquare, label: "Chat" },
  { href: "/progress", icon: TrendingUp, label: "Progress" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

/* ═══════════════════════════════════════════════════════════
   Subject icon mapping — Lucide icons replace emoji
   ═══════════════════════════════════════════════════════════ */
export const SUBJECT_ICONS: Record<string, string> = {
  // Science
  Biology: "Dna",
  Chemistry: "FlaskConical",
  Physics: "Atom",
  Science: "Microscope",
  // Maths
  Mathematics: "Calculator",
  "Further Mathematics": "Sigma",
  "Toán": "Calculator",
  // Languages
  English: "Languages",
  "Tiếng Anh": "Languages",
  IELTS: "BookOpen",
  TOEIC: "BookOpen",
  // Humanities
  History: "Landmark",
  Geography: "Globe",
  Economics: "BarChart3",
  // Tech
  "Computer Science": "Code",
  ICT: "Monitor",
  // Vietnamese
  "Ngữ văn": "BookText",
  "Khoa học Tự nhiên": "Microscope",
  "Toán thi Đại học": "Calculator",
};
