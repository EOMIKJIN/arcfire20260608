# Arcfire Online — 아키텍처 전수 검사 보고서

**검사일**: 2026-06-08  
**대상**: `docs/Arcfire_RN_Architecture_Master_Spec(single).md` · `.cursor/rules/arcfire-online.mdc` · `AGENTS.md` · `src/` · `app/`  
**자동 감사**: `npm run audit:memory` PASS (20/20) · `npm run audit:daily` (functions/ tsc 제외 src·app 정상)

---

## 1. Executive Summary

| 영역 | 판정 | 요약 |
|------|------|------|
| 메모리·스테이지 계약 | **양호** | `useStageMemory`·`releasePlanetMainStageSession`·rAF/postStepRef 정리 경로 존재, 자동 감사 20/20 |
| 아크코어·마스터플랜 정합 | **부분 일치** | 일일 배치(`ArcCoreDailyOpsSubCore`)는 코드·커서 규칙에 반영됨. 마스터 스펙 v2.0은 **2026-05-25 정지**로 다수 드리프트 |
| 코드 파편화 | **주의** | `PlanetEdenRaidTestLayer.tsx` 146KB·레거시 SVG RAF 블록 잔존, deprecated API 다수, docs 3종 마스터 스펙 병존 |
| 보안·리스크 | **주의** | `local-guest` 관리자 폴백, 클라이언트 `isAdmin` 플래그, Firestore 전체 유저 번들 동기화 — [리스크 레지스터](./ARCHITECTURE_RISK_REGISTER.md) 참조 |

**권장 1안**: 마스터 스펙 **v2.1 구현 정본 절(§18)** 을 단일 진실 공급원으로 두고, 신규 작업은 `.cursor/rules` → 코드 → §18 순으로 맞춘다. 레거시 SVG·deprecated 심볼은 감사 티켓으로 순차 제거.

---

## 2. 마스터 스펙 vs 실제 코드 — 정밀 대조

### 2-1. 일치 (유지)

| 스펙 주장 | 코드 정본 |
|-----------|------------|
| Table-First, 부트 1회 인덱싱 | `buildCsvStaticIndexes()` — `app/_layout.tsx` |
| Session-Based Memory | `useStageMemory`, `usePlanetSubStageMemory`, `planetSessionRegistry` |
| `Navigation.replace()` | `audit:memory` — worldmap/combat/planet replace 검증 |
| Combat Skia 단일 렌더 | `PlanetEdenRaidOrbitSvg` → `PlanetEdenRaidOrbitSkiaCombat` only |
| `INFO_DISTANCE_SORT_INTERVAL_MS = 5000` | `app/(game)/planet.tsx` + cleanup `clearInterval` |
| Firestore = 실플레이어 영속 | `userDataSync`, `arcfire_player_v1` 로컬 + merge 동기화 |
| AABS 24h Observe→Analyze→Execute | `runDailyPolicyAlignment` — **`ArcCoreDailyOpsSubCore` 배치 내 호출** |

### 2-2. 드리프트 (스펙 수정 필요 — §18 반영)

| 스펙 (v2.0) | 실제 구현 | 심각도 |
|-------------|-----------|--------|
| `aiVirtualPlayerStore` / `AIVirtualPlayerSpawner` | **미구현**. 세계 밀도·궤도 연출은 `npc_ai_captains/ships` CSV + `AiNpcSubCore` 수송 + `nearbyOrbitPresenceSystem` | **문서** (기능은 대체 경로로 동작) |
| `staticTableStore.ts` | `src/game/buildCsvStaticIndexes.ts` + 모듈별 `getXxxIndex()` | 낮음 |
| `screens/planet.tsx` | Expo Router `app/(game)/planet.tsx` | 낮음 |
| `AiPlanetsSubCore` 고빈도 planet 패스 | **`ArcCoreDailyOpsSubCore` 일 1회** (`arc_core_daily_ops_policy.csv`) | **중** (스펙 §10-3 구식) |
| 체크리스트 P1 `AIVirtualPlayer*` 완료 [x] | 스토어·스포너 파일 없음 — **체크리스트 오표** | **문서** |
| `planet_asteroid_resource_cycle` 30s 주기 | 제거됨 → 일일 `runPlanetEnergyCorePass` | 중 |
| `AiEconomySubCore` 120s 경제 패스 | 제거됨 → 일일 `runPlayScenarioEconomyPass` | 중 |

### 2-3. 커서 규칙 vs AGENTS.md

| 항목 | arcfire-online.mdc | AGENTS.md | 조치 |
|------|-------------------|-----------|------|
| 일일 운영 배치 | ✅ 상세 | ✅ 요약 | 일치 |
| `AiPlanetsSubCore` 역할 | 부트스트랩 + 배치 분리 | “틱·시뮬 진입점” 문구 잔존 | AGENTS.md 수정 |
| 광물 R 패스 | 일일 배치 | 일일 배치 | 일치 |

---

## 3. 메모리 누수 전수 검사

### 3-1. 자동 계약 (PASS)

`tools/memory-audit/run-memory-audit.cjs` — replace, postStepRef, rAF cancel, useStageMemory, memo invalidation, 5000ms sort.

### 3-2. 수동 후보 (`audit:daily` setInterval 목록)

| 파일 | 패턴 | cleanup |
|------|------|---------|
| `app/(game)/planet.tsx` | battle ready, distance sort, stance poll | ✅ `clearInterval` / route·AppState 가드 |
| `PlanetEdenRaidTestLayer.tsx` | rAF combat loop, 120ms HUD tick | ✅ unmount·sim 교체 시 cancel |
| `PlanetEdenRaidOrbitSkiaCombat.tsx` | rAF | ✅ 플래그 + cancel |
| `SkiaPlanetNebulaShaderBackdrop.tsx` | setInterval | ✅ return cleanup |
| `useMiningDriver.ts` | setInterval | ✅ 훅 cleanup |
| `useCapitalRealtimeDuelOutcome.ts` | setInterval | ✅ cleanup 확인됨 |
| `TypewriterText.tsx` | setInterval | ✅ ref + cleanup |
| `ArcCoreHub.ts` | gameLoop subscribe, AppState | ✅ `stop()` 시 해제 |
| `app/_layout.tsx` | AppState ×2 | ✅ remove |

### 3-3. 잔여 리스크

1. **`PlanetEdenRaidTestLayer.tsx` (~146KB)** — 단일 파일에 시뮬+HUD+레거시 `PlanetEdenRaidOrbitSvgRafCombat`(~100줄, **미사용**). Skia 정본과 이중 유지 → 유지보수·번들 부담.
2. **행성 허브 `planet.tsx` (~102KB)** — UI·전투·궤도 혼재. `planetSessionRegistry` 패턴은 있으나 파일 자체 분할 권장(기능 변경 없이 추출만).
3. **오프라인 catch-up 48h 상한** — `ArcCoreHub.applyOfflineCatchUpWallClock` — 일일 1회 배치와 정합; 다중 일 배치 누락은 **의도적**(앱 미실행 시 전날 배치 스킵).

---

## 4. 코드 파편화·쓰레기 코드

| 유형 | 예시 | 권장 |
|------|------|------|
| Dead render path | `PlanetEdenRaidOrbitSvgRafCombat` in TestLayer | Skia 단일 규칙에 따라 **삭제 또는 `__DEV__` 가드 + 제거 일정 주석** |
| Deprecated re-export | `tempClanColors.ts`, `loadPlayerFromFirestore`, `isCapitalRealtimeCombatOrbitPlanet` | 호출처 0이면 삭제, 아니면 1회 마이그레이션 |
| 중복 마스터 문서 | `Arcfire_RN_Architecture_Master_Spec.md`, `(single)`, `(multi)` | **`(single)` + 본 감사서 + §18** 만 정본; multi는 아카이브 표기 |
| 생성 CSV TS 대용량 | `csvNpcCapitalShips.ts` 305KB | 정상(Table-First); **런타임 Map 1회** 준수 여부만 점검 |
| functions/ tsc 실패 | firebase-admin 미설치 | CI 분리 또는 devDependency — 클라이언트와 무관 |

---

## 5. 아크코어·게임 마스터플랜 정합

```
[벽시계 실시간]  AiNpcSubCore — 궤도·수송·planetDevelopmentAcc 누적
        ↓ 24h 관측
[정오 1회 배치]  ArcCoreDailyOpsSubCore
        → runPlanetEnergyCorePass
        → runPlanetEnvironmentDiversityPass
        → runGlobalPlanetMasterBalancePass
        → runPlayScenarioEconomyPass
        → runDailyPolicyAlignment (AABS)
        → tryArcCoreWorldDailyUnlock
```

- **커서 규칙·코드·밸런스 CSV** 일치.
- **마스터 스펙 §10-3·플로우차트** 는 고빈도 루프 전제 — **§18로 대체**.

---

## 6. 보안·운영 리스크 (요약)

상세·완화책: [`ARCHITECTURE_RISK_REGISTER.md`](./ARCHITECTURE_RISK_REGISTER.md)

| ID | 리스크 | 완화(현재/권장) |
|----|--------|----------------|
| R-01 | 클라이언트 `isAdmin` / `local-guest` admin | 프로덕션 빌드에서 guest 비활성·서버 Rules로 admin 필드 무시 |
| R-02 | `syncUserDataWithServer` 대용량 merge | 120s 스로틀 + planetCore `byPlanetId` FieldValue.delete 패턴 유지 |
| R-03 | RN Firebase namespaced API | `firestoreRefs` 모듈러 전환 진행 중 — 잔여 `.collection()` grep 0 목표 |
| R-04 | 스펙-코드 드리프트로 잘못된 구현 | §18 + `audit:memory` CI 유지 |
| R-05 | `PlanetEdenRaidTestLayer` God file | 시뮬/HUD/Skia 분리 백로그 |

---

## 7. 구조 업데이트 (문서 계층)

```
docs/
├── Arcfire_RN_Architecture_Master_Spec(single).md  ← 정책 정본 (v2.1 §18)
├── Arcfire_Architecture_Audit_2026-06-08.md      ← 본 보고서
├── ARCHITECTURE_RISK_REGISTER.md                 ← 리스크·방지책
├── 2.1.memory.md                                 ← 메모리 계약 상세
└── README_ARCHITECTURE.md                        ← 진입 인덱스

.cursor/rules/arcfire-online.mdc  ← 에이전트 실행 규칙 (코드와 동기)
AGENTS.md                         ← 요약 + 한계 고지
```

---

## 8. 재검사 체크리스트 (릴리스 전)

```bash
npm run audit:memory
npm run audit:daily
npx tsc --noEmit   # src·app
npm run build:content-tables
npm run build:balance-tables
```

- [ ] 실기기 10회 전투 루프 후 메모리 프로파일 (스펙 목표 200MB — **미실측**, P3 잔여)
- [ ] 마스터 스펙 §18과 신규 PR diff 대조
- [ ] `setInterval`/`rAF` 신규 도입 시 dispose 경로 필수

---

*다음 정기 감사: 일일 `audit:daily` + 분기별 본 문서 갱신.*
