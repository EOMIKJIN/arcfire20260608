# Tactical UI Rollout Readiness Audit

Generated: 2026-08-05T15:16:56.860Z

| Severity | Count |
|----------|-------|
| FAIL | 0 |
| WARN | 6 |
| INFO | 2 |

## FAIL (전면 교체 전 해소)

_None_

## WARN (kind별 전환 시 처리)

- `src/components/LevelUpModal.tsx` · legacy-modal-bypass: ArcOverlayHost 우회 가능 — 전면 교체 전 삭제 또는 @deprecated 유지 + import 0 확인
- `src/ui/overlay/content/PlanetInfoPortraitSlot.tsx` · known-theme-gap: tactical bleed 슬롯 — phosphor border/bg 하드코딩 (전환 시 visualTheme 필요)
- `src/ui/heavyUiDataSession/HeavyUiOverlayShell.tsx` · known-theme-gap: loading/error — phosphorAccent 고정 (tactical kind 확대 시 수정)
- `src/ui/overlay/ArcOverlayCard.tsx` · known-theme-gap: tactical = phosphor base + override merge — 전면 교체 시 exclusive style set 검토
- `src/ui/overlay/ArcOverlayTitleHeader.tsx` · known-theme-gap: subtitle 색 — tactical 전용 토큰 미분리
- `src/ui/heavyUiDataSession/index.ts` · heavy-ui-no-visualTheme: HeavyUiOverlayShell visualTheme 미전달 — kind 롤아웃 시 추가

## INFO

- baseline frozen: 2026-06-18
- tactical enabled kinds: planetEconomyInfo (preview flag)
