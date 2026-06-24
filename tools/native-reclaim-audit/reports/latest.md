# Native Reclaim — Content & Image Stability Audit

Generated: 2026-06-24T02:32:44.447Z

**Result:** PASS (20/20 checks)

## Passed

- [x] planet_change uses light reclaim (no hub Skia tear-down)
- [x] route_blur full reclaim with keepPlanetIds
- [x] clearCapital does NOT run full stage reclaim (hub-safe)
- [x] nebula profile re-hydrate on planet hub entry
- [x] hub Skia reclaim gated by reclaimHubSkia flag
- [x] no Image.clearMemoryCache in reclaim modules
- [x] Skia nebula hideUntilImagesReady + RN fallback on image lost
- [x] hub native reclaim signal subscribed (release path)
- [x] galaxy route_blur native reclaim wired
- [x] SkImage manual dispose forbidden (SIGSEGV guard)
- [x] planet_change light reclaim prunes previous planet only
- [x] combat Skia module cache reclaim registered
- [x] native reclaim bootstrap installed at app boot
- [x] soft native reclaim pass (PSS 800 zone)
- [x] planet core persist dirty-skip (no redundant JSON sync)
- [x] deep native reclaim pass (Fresco trim + hub remount)
- [x] hub backdrop remount signal subscribed
- [x] arcfire-native-memory expo module present
- [x] PGP daily pass marks planet core dirty before persist
- [x] deferred nebula reclaim respects keepPlanetIds

## Manual soak checklist (device)

1. 행성 허브 진입 — 성운·배경 이미지 3초 내 표시 (hideUntilImagesReady)
2. 허브 → 은하맵 → 허브 5회 — 성운 소실·검은 화면 없음
3. 행성 A → B 착륙 — 성운/배경 즉시 교체, 스킵 없음
4. 전투 진입·퇴장 — 함선/미사일 렌더 정상
5. mem-timeline — blur 후 PSS floor 하락 또는 재진입 spike 후 회수