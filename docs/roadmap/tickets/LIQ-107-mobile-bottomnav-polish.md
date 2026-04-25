---
id: LIQ-107
title: Mobile BottomNav polish + safe-area
phase: 1
priority: P0
estimate: 1d
status: Backlog
depends_on: []
blocks: []
tags: [frontend, mobile, ux, a11y]
---

# LIQ-107 — Mobile BottomNav polish

## Problem

Current mobile navigation: `NAV_ITEMS` defined in multiple pages ([dashboard/page.tsx:37-42](../../../apps/web/src/app/dashboard/page.tsx#L37-L42), [progress/page.tsx:38-43](../../../apps/web/src/app/progress/page.tsx#L38-L43), chat, etc.) — **duplicated**, không có safe-area cho iOS notch, hit targets có thể < 44px.

Mobile-first là core của thị trường VN teen (75%+ penetration). Nav kém = bounce rate cao.

## User story

> Là học sinh dùng iPhone 15 Pro, em muốn bottom nav không bị đè lên bởi home indicator, và mỗi tap target đủ to để không bấm nhầm.

## Acceptance criteria

- [ ] Extract `BottomNav` thành shared component `apps/web/src/components/layout/BottomNav.tsx`
- [ ] Remove duplicated `NAV_ITEMS` array từ 4+ pages — import từ 1 chỗ
- [ ] Safe-area inset: `padding-bottom: env(safe-area-inset-bottom)`
- [ ] Hit target: min 44px x 44px (iOS HIG), 48dp (Material)
- [ ] Active tab: visual indicator (pill bg hoặc dot beneath icon)
- [ ] Haptic feedback on tap (Vibration API, 10ms)
- [ ] Backdrop blur khi scroll behind nav
- [ ] Hide nav khi typing in chat (focus input → slide down)
- [ ] Nav items ordering: Home, Chat, Progress, Settings (4 items — reasonable for thumb zone)
- [ ] Reader pages ẩn BottomNav (fullscreen immersive)

## Technical approach

### Shared component

```tsx
// apps/web/src/components/layout/BottomNav.tsx
import { Home, MessageSquare, TrendingUp, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const NAV_ITEMS = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/chat", icon: MessageSquare, label: "Chat" },
  { href: "/progress", icon: TrendingUp, label: "Progress" },
  { href: "/settings", icon: Settings, label: "Settings" },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t backdrop-blur"
      style={{
        background: "rgba(23,23,23,0.85)",
        borderColor: "var(--color-border-subtle)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
      aria-label="Primary navigation"
    >
      <ul className="grid grid-cols-4">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href}>
              <Link
                href={href}
                className="flex flex-col items-center gap-1 py-2 min-h-[56px]"
                style={{ color: active ? "var(--color-accent)" : "var(--color-text-muted)" }}
                onClick={() => navigator.vibrate?.(10)}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={22} />
                <span className="text-[11px] font-medium">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```

Global Tailwind config — ensure `safe-area-inset-*` works. Next.js 16 viewport meta:
```tsx
// apps/web/src/app/layout.tsx
export const viewport = { viewportFit: "cover" };
```

### Refactor

Replace bottom nav JSX in each page with `<BottomNav />` — delete the duplicated arrays.

### Hide on chat focus

Chat page: Track `inputFocused` state. Pass via layout context or just `display: none` when focused.

## UI notes

- Desktop (md+) unchanged — sidebar remains
- Animation: slide-down when hiding (`translate-y-full` + transition)
- Active indicator: small pill `width: 24px, height: 3px` under icon, rounded, accent color

## Testing

- Visual: iPhone SE, iPhone 15 Pro Max, Galaxy S24, iPad
- A11y: VoiceOver/TalkBack read labels, focus order correct
- Verify hit area with `:active` pseudo-state devtools

## Out of scope

- Gesture nav (swipe between tabs) — maybe Phase 2
- Nav badges for notifications — depends on LIQ-105

## References

- [Apple HIG — Tab Bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
- [Safe Area CSS](https://developer.mozilla.org/en-US/docs/Web/CSS/env)
