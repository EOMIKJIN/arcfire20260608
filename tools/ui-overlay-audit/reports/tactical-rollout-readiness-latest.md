# Tactical UI Rollout Readiness Audit

Generated: 2026-06-24T00:16:50.742Z

| Severity | Count |
|----------|-------|
| FAIL | 0 |
| WARN | 9 |
| INFO | 10 |

## FAIL (전면 교체 전 해소)

_None_

## WARN (kind별 전환 시 처리)

- `src/components/LevelUpModal.tsx` · legacy-modal-bypass: ArcOverlayHost 우회 가능 — 전면 교체 전 삭제 또는 @deprecated 유지 + import 0 확인
- `src/ui/overlay/content/PlanetInfoPortraitSlot.tsx` · known-theme-gap: tactical bleed 슬롯 — phosphor border/bg 하드코딩 (전환 시 visualTheme 필요)
- `src/ui/heavyUiDataSession/HeavyUiOverlayShell.tsx` · known-theme-gap: loading/error — phosphorAccent 고정 (tactical kind 확대 시 수정)
- `src/ui/overlay/ArcOverlayCard.tsx` · known-theme-gap: tactical = phosphor base + override merge — 전면 교체 시 exclusive style set 검토
- `src/ui/overlay/ArcOverlayTitleHeader.tsx` · known-theme-gap: subtitle 색 — tactical 전용 토큰 미분리
- `src/ui/heavyUiDataSession/index.ts` · heavy-ui-no-visualTheme: HeavyUiOverlayShell visualTheme 미전달 — kind 롤아웃 시 추가
- `src/ui/overlay/content/PlanetDevelopmentListContent.tsx` · heavy-ui-no-visualTheme: HeavyUiOverlayShell visualTheme 미전달 — kind 롤아웃 시 추가
- `src/ui/overlay/content/PlanetDevelopmentOverlayContent.tsx` · heavy-ui-no-visualTheme: HeavyUiOverlayShell visualTheme 미전달 — kind 롤아웃 시 추가
- `src/ui/overlay/content/PlanetGenericFacilityDevContent.tsx` · heavy-ui-no-visualTheme: HeavyUiOverlayShell visualTheme 미전달 — kind 롤아웃 시 추가

## INFO

- pending migration: planetDevelopment (src/ui/overlay/content/PlanetDevelopmentOverlayContent.tsx) — phosphor only, visualTheme 미연결
- pending migration: settings (src/ui/overlay/content/SettingsOverlayContent.tsx) — phosphor only, visualTheme 미연결
- pending migration: bmShop (src/ui/overlay/content/BmShopOverlayContent.tsx) — phosphor only, visualTheme 미연결
- pending migration: tradeQuantity (src/ui/overlay/content/TradeQuantityOverlayContent.tsx) — phosphor only, visualTheme 미연결
- pending migration: alert (src/ui/overlay/content/AlertOverlayContent.tsx) — phosphor only, visualTheme 미연결
- pending migration: levelUp (src/ui/overlay/content/LevelUpOverlayContent.tsx) — phosphor only, visualTheme 미연결
- pending migration: reward (src/ui/overlay/content/RewardOverlayContent.tsx) — phosphor only, visualTheme 미연결
- pending migration: waveResult (src/ui/overlay/content/WaveResultOverlayContent.tsx) — phosphor only, visualTheme 미연결
- baseline frozen: 2026-06-18
- tactical enabled kinds: planetEconomyInfo (preview flag)
