---
id: LIQ-207
title: Progress v2 — real data + calendar heatmap
phase: 2
priority: P1
estimate: 3d
status: Backlog
depends_on: []
blocks: []
tags: [backend, frontend, analytics]
---

# LIQ-207 — Progress v2

## Problem

Progress page tại [apps/web/src/app/progress/page.tsx:33](../../../apps/web/src/app/progress/page.tsx#L33) vẫn dùng **`mockWeekly()`** — không phải data thật. Không có calendar heatmap (hiệu quả chứng minh cho retention).

GitHub-style contribution heatmap = proven UX cho habit tracking (Duolingo, Strava).

## User story

> Là học sinh, em muốn nhìn calendar 365 ngày của em, thấy mỗi ô là 1 ngày học bao nhiêu phút — dễ dàng thấy được streak và nhịp độ.

## Acceptance criteria

- [ ] Replace `mockWeekly()` bằng real aggregation từ `StudySession.date`
- [ ] Weekly bar chart: 7 cột (T2-CN) với tổng phút, TZ-aware
- [ ] GitHub-style heatmap: 52 tuần x 7 ngày, color intensity theo daily study minutes
- [ ] Tooltip on cell: "April 15 — 45 min · Biology, Chemistry"
- [ ] Aggregated views: today / this week / this month / this year
- [ ] Per-subject breakdown pie or stacked bar
- [ ] Streak indicator: current streak + longest streak
- [ ] Best day of week, best hour of day insights
- [ ] Export data: CSV button (for power users / parents)

## Technical approach

### Backend aggregation

Extend `apps/api/src/modules/progress/progress.service.ts`:

```ts
async getDailyHistory(userId, fromDate, toDate) {
  // GROUP BY date(StudySession.date) with subject breakdown
  return prisma.$queryRaw`
    SELECT 
      DATE(date AT TIME ZONE ${tz}) as day,
      SUM("durationMin") as total,
      jsonb_agg(DISTINCT "subjectId") as subjects
    FROM "StudySession"
    WHERE "userId" = ${userId}
      AND date >= ${fromDate}
      AND date < ${toDate}
    GROUP BY day
    ORDER BY day
  `;
}

async getWeeklyBreakdown(userId) {
  // last 7 days (TZ-aware)
  // return { days: [{ day: "Mon", min: 45 }, ...] }
}

async getInsights(userId) {
  // best day of week (most minutes avg)
  // best hour (if we track session start time)
  // current streak (consecutive days with >= 1 session)
  // longest streak ever
}
```

### Frontend

Refactor [progress/page.tsx](../../../apps/web/src/app/progress/page.tsx):
- Delete `mockWeekly`
- Add `DailyHeatmap` component using simple CSS grid or lightweight lib (no `react-calendar-heatmap` dep — build ours)
- New `InsightsCard` with 3-4 stats

Heatmap component:
```tsx
<div className="grid grid-flow-col grid-rows-7 gap-1">
  {days.map(d => (
    <div 
      key={d.date}
      className="w-3 h-3 rounded-sm"
      style={{ background: intensityColor(d.min) }}
      title={`${d.date} — ${d.min}min`}
    />
  ))}
</div>
```

Intensity scale: 0, 1-15, 16-30, 31-60, 60+ min → 5 shades

## API design

```ts
GET /progress/history/daily?from=ISO&to=ISO  → [{ day, totalMin, subjects[] }]
GET /progress/weekly                         → { days: [{ day, min }], total }
GET /progress/insights                       → { currentStreak, longestStreak, bestDow, bestHour }
```

## UI notes

- Heatmap on desktop: 52 weeks visible, mobile: scroll horizontally last 12 weeks
- Colors: match `--color-accent` for highest intensity, subtle gray for empty
- Month labels above columns
- Day-of-week labels left
- Responsive: collapse to last 12 weeks on narrow screens

## Testing

- Unit: aggregation correct across DST transitions
- Integration: streak calculation (consecutive days)
- Visual: heatmap renders correctly for user with/without data
- Edge: first-time user (0 sessions) — graceful empty state

## Out of scope

- Compare with friends (Phase 3, LIQ-301)
- Goals setting per day (beyond `studyGoal`) — future
- Time of day heatmap (24x7) — nice-to-have if data supports

## References

- GitHub contribution graph for layout inspiration
- Related to LIQ-103 parent report aggregation (shared service methods)
