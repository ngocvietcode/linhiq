---
id: LIQ-304
title: Native mobile app (Expo / React Native)
phase: 3
priority: P2
estimate: 20d
status: Backlog
depends_on: []
blocks: [LIQ-305]
tags: [mobile, frontend, infrastructure]
---

# LIQ-304 — Native Mobile App

## Problem

75%+ teen VN chủ yếu dùng mobile. Web-only là ceiling cho growth:
- Không có push notification tốt (web push limited trên iOS)
- Không có app icon trên home screen
- Không có offline capability thật sự (LIQ-305)
- Không có in-app purchase cho PRO tier
- App Store / Play Store listing = discovery channel quan trọng

## User story

> Là học sinh, em muốn tải app LinhIQ từ App Store, mở bằng icon trên home screen, nhận push notification cả khi app đóng — trải nghiệm như Duolingo/TikTok.

## Acceptance criteria

- [ ] Expo (React Native) setup as new `apps/mobile` in monorepo
- [ ] Reuse `@linhiq/validators`, `@linhiq/types` packages
- [ ] Share API client layer with web (extract into `packages/api-client`)
- [ ] Core screens ported: login, dashboard, chat, progress, reader, settings
- [ ] Push notifications via Expo Push / FCM / APNS
- [ ] Deep links (linhiq.app://chat/:id)
- [ ] In-app purchase for PRO tier via RevenueCat
- [ ] Light mode + dark mode support matching web design tokens
- [ ] Haptic feedback on key actions
- [ ] Camera integration for LIQ-101 (image tutoring) feels native
- [ ] Voice recording (LIQ-202) uses native APIs
- [ ] Offline base shell (app opens when no network)
- [ ] Android + iOS submitted to stores

## Technical approach

### Setup

```bash
cd apps && npx create-expo-app mobile --template
# Add workspace link to pnpm-workspace.yaml
```

Use Expo Router (file-based) to mirror Next.js routing.

Shared package extraction:
```
packages/
  api-client/     # fetch wrapper, types
  validators/     # existing
  types/          # existing
  design-tokens/  # new: colors/spacing as TS constants consumed by web + mobile
```

### Design system adaptation

Current web uses CSS vars (`--color-accent`). Mobile: use same token values via JS constants. Consider [Tamagui](https://tamagui.dev/) or [NativeWind](https://www.nativewind.dev/) to unify Tailwind-like styling.

### Core screen port effort

- Auth: ~1d
- Dashboard: ~2d
- Chat (including streaming SSE): ~3d (use `eventsource-parser` RN-compatible)
- Reader (PDF viewer): ~3d (different from web — use `react-native-pdf`)
- Progress: ~2d
- Settings: ~1d
- Onboarding: ~2d
- IAP integration: ~2d
- Push setup: ~1d
- Testing + build: ~3d

### Distribution

- iOS: TestFlight → App Store Review (1-2 week)
- Android: Internal testing → Play Store
- OTA updates via Expo Updates for urgent JS fixes

## Testing

- E2E via Detox or Maestro
- Test on physical iPhone SE (small), iPhone 15, Samsung mid-range, Pixel
- Accessibility: VoiceOver + TalkBack
- Network: offline mode, slow 3G, airplane mode

## Out of scope

- Apple Watch / Wear OS companion
- Tablet-optimized layouts (use responsive patterns for now)
- Widget (home screen widget for streak) — nice post-launch addition

## References

- [Expo docs](https://docs.expo.dev/)
- [RevenueCat](https://www.revenuecat.com/) for IAP
- [Expo Router](https://docs.expo.dev/router/introduction/)
