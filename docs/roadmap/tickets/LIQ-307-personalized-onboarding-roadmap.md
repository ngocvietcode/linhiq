---
id: LIQ-307
title: Personalized onboarding roadmap visualization
phase: 3
priority: P2
estimate: 4d
status: Backlog
depends_on: [LIQ-104, LIQ-204]
blocks: []
tags: [frontend, ux, onboarding]
---

# LIQ-307 — Personalized Onboarding Roadmap

## Problem

Sau khi diagnostic (LIQ-104) và set exam (LIQ-204), học sinh chưa có "wow moment" — chưa thấy hành trình học tập của mình. Roadmap.sh style visual = powerful first impression.

## User story

> Sau khi onboarding, em muốn thấy lộ trình học tập cá nhân của em dưới dạng sơ đồ nhánh — topic nào em đã ok, topic nào next, topic gốc cần nắm trước.

## Acceptance criteria

- [ ] Auto-generated roadmap after diagnostic + exam setup
- [ ] Visual: node graph by topic, edges = prerequisite dependencies
- [ ] Nodes color-coded: mastered (green), in progress (blue), next up (accent), locked (gray)
- [ ] Click node → topic details + "Start learning" CTA
- [ ] Zoom + pan interactions
- [ ] Re-generates when mastery changes significantly
- [ ] Export as PNG (nice social share)
- [ ] Mobile: vertical scroll simplified version

## Technical approach

### Data

Need to model prerequisites. Extend existing `Topic`:
```prisma
model Topic {
  // existing
  prerequisites String[]  // topic IDs
  // or normalize:
}

model TopicPrerequisite {
  topicId       String
  prerequisiteId String
  @@id([topicId, prerequisiteId])
}
```

Seed prerequisites per curriculum (human-curated with AI assist).

### Frontend

Library: [reactflow](https://reactflow.dev/) for graph visualization.

```tsx
const nodes = topics.map(t => ({
  id: t.id,
  data: { label: t.name, mastery: t.mastery },
  position: computePosition(t), // topological layout
}));
const edges = prerequisites.map(p => ({
  id: `${p.from}-${p.to}`,
  source: p.from,
  target: p.to,
}));
```

Auto-layout using [dagre](https://github.com/dagrejs/dagre) or [elkjs](https://github.com/kieler/elkjs).

## API design

```ts
GET /roadmap/:subjectId
  → { nodes: [{ topicId, name, mastery, unlocked }], edges: [{from, to}] }
```

## UI notes

- Roadmap.sh-inspired clean lines
- Node card: emoji/icon, name, mastery %, small progress ring
- Path highlighting: hover node → ancestors/descendants highlighted

## Testing

- Visual: mixed subjects with 30+ topics render legibly
- Perf: large graph doesn't jank
- Mobile fallback works

## Out of scope

- AI dynamic "suggest next topic" beyond prerequisite order — future
- Collaborative roadmap (compare with peers) — tie to LIQ-303

## References

- [roadmap.sh visuals](https://roadmap.sh/)
- [ReactFlow](https://reactflow.dev/)
