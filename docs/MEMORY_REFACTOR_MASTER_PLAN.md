# Arcfire Memory Refactor — Master Plan (Implementation Tracker)

> **Status**: Phase 0–5 코드·정적 게이트 완료 (2026-06-27). **런타임 KPI**는 release soak + ledger로 별도 검증.

## 정적 검증 (2026-06-27)
| 게이트 | 결과 |
|--------|------|
| `npx tsc --noEmit -p tsconfig.client.json` | PASS |
| `npm run audit:memory:all` | PASS (memory 32/32 · skia 20/20 · worklet · native-reclaim · resident-set 7/7 · hot-path 0 hits) |
| `npm run audit:memory-budget-ledger` | 실행 OK — **baseline soak 미개선** (pid 31346 PSS p50 937.9MB, Native p50 565.5MB) |

## Phase 0 — 관측·게이트
- [x] `devMemoryProfileBridge` — `EXPO_PUBLIC_ARCFIRE_MEM_PROFILE=1` release 마커
- [x] `audit-idle-hub-floor.ps1` — `SKIP_NOT_IDLE_HUB` (views spread >80)
- [x] `build-arc-memory-budget-ledger.ps1` + `npm run audit:memory-budget-ledger`
- [x] `npm run audit:stage-transition-memory`

## Phase 1 — Resident Set & Lazy Boot
- [x] `src/arcCore/memory/` — Governor + ResidentSetRegistry
- [x] `AiTradePortLevelPolicySubCore` — onBoot catalog sync 제거
- [x] `AiEconomySubCore` — boot `skipCatalog: true`
- [x] `planet.tsx` / `worldmap.tsx` — warm hooks

## Phase 2 — STAGE 전환
- [x] `stageTransitionPhaseGate.ts`
- [x] `scheduleStageNavigateAfterDrain` ← `usePlanetStageSession` frozen navigate
- [x] `planet.tsx` P0-F `capitalCombatOrbitActiveRef` → useLayoutEffect

## Phase 3 — Hot Path
- [x] `npm run audit:hot-path`
- [x] mining persist coalesce (기존 `miningPlayerPersist.ts`)

## Phase 4 — Ingress / Native step
- [x] Hub Skia 2-stage arm (`hubSkiaArmReady` + 2×rAF)

## Phase 5 — CI gates
- [x] `npm run audit:resident-set`
- [x] `audit:memory:all` 확장

## 완료 게이트 (매 release soak)
```bash
npx tsc --noEmit -p tsconfig.client.json
npm run audit:memory:all
npm run audit:memory-budget-ledger
```

## KPI 목표
| 지표 | 목표 |
|------|------|
| PSS p50 (3h) | ≤750MB |
| PSS p99 | ≤900MB |
| Native 3h drift | ≤+30MB |
| hub↔worldmap Native Δ | ≤+30MB/회 |

Release soak 빌드: `EXPO_PUBLIC_ARCFIRE_MEM_PROFILE=1` 로 `[MEM_PROFILE]` + retention audit 활성.
