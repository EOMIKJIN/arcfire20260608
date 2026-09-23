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

---

## Backlog — 후속 정리 항목 (급하지 않음, 다음 메모리 통합 수정 때 같이 처리)

> 2026-08-04 행성허브 아크코어 수송선단/전함체류 리팩토링 전수 정밀조사(김클로드) 결과.
> **긴급 이슈 없음** — 아래는 전부 로직 무변경 정리성 항목. 대표님 지시로 별도 보관, 다음 메모리 수정 세션에서 통합 처리.

- [ ] **`src/components/planet/arcOrbitPackEpoch.ts` 주석 정정** — `resolveArcOrbitPackElapsed`(43-44, 61-62행)가 매 재-pack마다 `new Map()` 2개를 새로 만드는데, 파일 상단 주석은 "할당: Map 갱신만"이라 실제 동작과 살짝 어긋남. 호출부(`PlanetHubOrbitSkiaLayer.tsx:158-165`)가 `arcPackSig` 변경 시에만 도는 `useLayoutEffect`로 게이트돼 있고 `arcShips` 자체가 Zustand 4Hz 퍼블리시에 묶여 있어 실질 빈도는 초당 최대 4회 — 동작엔 문제없음, 주석만 "새 Map 2개(소량, 4Hz 상한)"로 정정 권장.
- [ ] **오디트 스캐너 커버리지 확장** — `tools/memory-audit/run-skia-worklet-memory-audit.cjs`(`npm run audit:skia-memory`)가 하드코딩 7개 파일만 스캔. 2026-08-04 신설된 `src/components/planet/arcOrbitPackEpoch.ts` · `planetOrbitHubWorklets.ts` · `src/game/planetHubOrbitRenderBudget.ts`가 스캔 대상 목록에 없음 — 이 계열 파일 추가 시 자동 감시망 밖에서 회귀가 생길 수 있으므로, 스캔 대상 파일 목록에 위 3개(및 앞으로 추가되는 궤도 렌더링 관련 신규 파일) 등록 권장.
- [ ] **`appendSkiaDiamondPath` dead code 정리** — `src/components/planet/planetOrbitHubWorklets.ts:73`, 현재 호출부 0건(grep 확인). 지금은 무해하지만 향후 누군가 풀링 없이 프레임 루프에 재사용하면 Skia Make()-per-frame 위반이 될 수 있음 — 재사용 계획 없으면 삭제, 있으면 "매 프레임 호출 금지·풀링 필수" 주석 추가.

전수조사 상세 근거(파일:줄, 확인 방법)는 세션 기록 참고 — 필요 시 재조사 없이 위 3항목만 그대로 적용 가능한 수준으로 이미 위치까지 특정됨.
