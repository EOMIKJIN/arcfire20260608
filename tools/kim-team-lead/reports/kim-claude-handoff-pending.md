# 김클로드 → 김팀장 검수 handoff

> **정본 프로세스**: `docs/KIM_TEAM_LEAD_AGENT.md` §김클로드 검수 게이트 · `CLAUDE.md` §김팀장 최종 승인  
> **김클로드** = Anthropic Claude Code (Cursor ✱ 패널 · 터미널 `claude`)

---

## 🟢 READY — 플레이어 독립국가(녹색 국경) · 김클로드 착수 대기

| 필드 | 값 |
|------|-----|
| **status** | **`READY`** (구현 대기 — 대표님 지시 시 김클로드 착수) |
| **updated** | 2026-07-07 18:10 KST |
| **task_id** | `player-independent-nation-m1-m2-20260707` |
| **assigned_by** | 김팀장 (Cursor 본창) — 분석·명세 패키징 완료 |

### 착수 문서 (필독 순서)

1. **`tools/kim-team-lead/reports/kim-claude-ready-player-independent-nation.md`** — 작업 요약·복사용 지시문
2. **`docs/PLAYER_INDEPENDENT_NATION_IMPLEMENTATION_SPEC.md`** — M1~M3 상세 명세·파일 체크리스트·테스트

### 대표님 → 김클로드 복사 지시

```text
@김클로드 docs/PLAYER_INDEPENDENT_NATION_IMPLEMENTATION_SPEC.md 와 tools/kim-team-lead/reports/kim-claude-ready-player-independent-nation.md 를 읽고 M1+M2 구현해. 완료 후 kim-claude-handoff-pending.md status=PENDING. 커밋 금지.
```

### 범위

- **M1+M2**: independent side · 구매 occupier 전환 · reconcile 보호 · 녹색 Voronoi·허브 플레이트
- **M3 보류**: faction_diplomacy CSV · ArcCore 접전 (2차 task)

김클로드 완료 시 본 파일 상단 **READY** 블록 아래에 **PENDING** handoff 추가 · 김팀장 검수.

---

## 🟡 PENDING — 오로라 관측국 재시작 인시던트(native_heap 주도) · 김클로드

| 필드 | 값 |
|------|-----|
| **status** | `PENDING` |
| **updated** | 2026-07-07 21:55 KST |
| **kim_claude_session** | Claude Code (VSCode) |
| **assigned_by** | 사용자 직접 지시 — 방금 발생한 재시작(오로라/synth_002_p 허브) 원인 확인 요청 |
| **task_id** | `aurora-hub-native-heap-hard-ceiling-20260707` |

### 사용자 지시 배경

"오로라 관측국"(=`synth_002_p`, phase3 정착완료 명칭) 허브 체류 중 앱이 자동 재시작됨. 재시작 직전 상태·이상 유무 확인 요청.

### 조사 결과 — 모니터 로그 대조

- 21:43:25 `GL_HARD_CEILING gl=110.4 pss=993.5 views=464` → 자동 relaunch, 21:44:07 정상 복구 검증됨(pid 27487, gl=8.6MB·pss=505.2MB·views=99).
- **이번 인시던트는 오늘까지의 GL 전용 수정(콤뱃-세이프 reclaim 등)과 다른 축**: `mem-timeline.csv` 대조 결과 21:27:48(views=19) → 21:43:16(views=464, `PSS_SPIKE review=graphics+native`) 15분 사이 **GL은 110.4→110.4로 거의 그대로**인데 **native_heap_mb가 259.8→503.1(+243)·views가 19→464(+445)** 로 급증 — GL 축은 기존 fix가 억제 중임을 재확인, 이번엔 native_heap/views 축이 하드실링을 유발.
- 실기 logcat은 이번에도 프로덕션 빌드라 `[MEM]` JS 로그 없음(206바이트, ActivityManager 노이즈뿐) — 원인은 코드 레벨 추론으로 접근.

### 작업 요약

`runPlanetHubCombatSafeReclaimPass`(전투 중에도 도는 3분 안전판, 어제 신설)에 **Fresco 비트맵 캐시 트림**(`trimNativeBitmapCachesAsync`)을 추가. 이 함수는 현재 마운트된 Image가 참조 중인 비트맵은 안 건드리고 "안 쓰는 재사용 풀"만 비우는 것으로 판단(RN Image key 리마운트가 아님) — dodge overlay 강제 해제·RN 백드롭 remount처럼 전투 중 화면 끊김 위험이 있는 나머지는 여전히 제외.

**중요 — 완전한 원인 규명은 아님**: 이 fix는 native_heap 증가분 중 Fresco 비트맵 캐시가 원인인 부분만 겨냥한다. **views가 19→464로 급증한 부분**(순수 네이티브 View 개수)은 비트맵 캐시 트림과는 별개 축이라 이 fix로 해결된다는 보장이 없음 — 어떤 컴포넌트가 그렇게 많은 뷰를 마운트하는지는 프로덕션 빌드 로그 부재로 특정 못함. 실측(다음 유사 상황에서 views 추이) 필요.

### 변경 파일
- `src/game/nativeReclaim/runPlanetHubCombatSafeReclaimPass.ts` — `trimNativeBitmapCachesAsync()` 호출 추가.

### self-check
- [x] `npx tsc --noEmit -p tsconfig.client.json` — clean
- [x] `npm run audit:memory:all` — memory 37/37 · skia-worklet 20/20 · worklet-contract PASS · native-reclaim 20/20 · resident-set 7/7 · hot-path 0 hits

### 리스크·주의
- Fresco "안 쓰는 캐시만 비운다"는 판단은 TS 브릿지 시그니처 기반 추론이고 네이티브(Android) 쪽 실제 구현은 직접 못 봤음 — 실기 확인 시 화면 끊김 없는지 같이 봐야 함.
- **views 급증 원인 미규명** — 별도 조사 필요(어떤 화면/리스트가 그렇게 많은 뷰를 마운트하는지).
- git commit 안 함.

### 미완·보류
- views 19→464 급증의 정확한 소스 특정 — 이번 범위 밖(로그 부재로 코드 리뷰만으로는 확정 어려움).
- 위 대표님 지시 대기 중인 `player-independent-nation-m1-m2-20260707`(READY)는 이번 작업과 무관 — 아직 미착수.

---

## ✅ REVIEWED — timer-optimization-p1 (이전 사이클)

| 필드 | 값 |
|------|-----|
| **status** | `REVIEWED` · **verdict PASS** (김팀장 2026-07-07) |
| **updated** | 2026-07-07 11:20 KST |
| **kim_claude_session** | Claude Code (VSCode) |
| **assigned_by** | 사용자 직접 지시 — 타이머 검수(이전 사이클)에서 나온 P1 최적화 진행 지시 |
| **task_id** | `timer-optimization-p1-20260707` |

## 사용자 지시 배경 (2026-07-07 · 타이머 P1 최적화 진행)

이전 사이클(`drone-fx-timer-memory-regression-audit-20260707`, 분석 전용)에서 찾은 P1 2건 중 실행 지시.

### 작업 요약

**1) 행성개발 오버레이 3곳 — 활성 작업 없을 때도 500ms 타이머가 무조건 돌던 것 게이트 추가**
`PlanetDevelopmentListContent.tsx`(정답 패턴, `hasActiveJob` 게이트 기존 보유)와 동일하게 나머지 3곳도 `snapshot.isInstalling || snapshot.isUpgrading`(또는 세션 데이터 기반 동등 조건)일 때만 500ms 폴링이 돌도록 수정:
- `src/ui/overlay/content/PlanetOrbitShipyardDevContent.tsx` — `buildOrbitShipyardDevSnapshot` 결과로 게이트, `useEffect` 순서를 스냅샷 계산 이후로 재배치.
- `src/ui/overlay/content/PlanetDefenseSatelliteDevContent.tsx` — 동일 패턴(`buildDefenseSatelliteDevSnapshot`).
- `src/ui/overlay/content/PlanetGenericFacilityDevContent.tsx` — `session.data` 로딩이 `tick` 부트스트랩과 얽혀있어, `sessionConfig`/`session` 선언을 effect보다 앞으로 옮기고 `session.data.snapshot.isInstalling/isUpgrading`로 게이트.

**2) 허브 전투 중 서브초 타이머 통합 — battle-ready tick(100ms)+blink(180ms)를 setInterval 1개로**
`src/game/planetHub/usePlanetHubBattleReady.ts` — 두 타이머가 이미 동일 활성조건(`intervalActive`)을 쓰고 있어서, 100ms tick 콜백 안에 blink용 누적 경과(`blinkAccumMsRef`, ms 단위)를 같이 세서 180ms 도달 시 자체적으로 토글하도록 통합. tick·blink 각각의 실제 주기(100ms/180ms)는 그대로 유지 — 등록되는 `setInterval` 개수만 2→1로 축소.

**보류(이번엔 손 안 댐)**: 전투 engagement poll(250ms, `planetCapitalCombatHeavyUi.tsx`)까지 합치는 건 서로 다른 파일·다른 활성조건(`sim` 존재 여부 vs `msLeft>0`)이라 공유 티커를 새로 만들어야 하는 더 큰 구조변경 — 이번 P1 범위에서 제외, 필요시 별도 진행.

### 변경 파일
- `src/ui/overlay/content/PlanetOrbitShipyardDevContent.tsx`
- `src/ui/overlay/content/PlanetDefenseSatelliteDevContent.tsx`
- `src/ui/overlay/content/PlanetGenericFacilityDevContent.tsx`
- `src/game/planetHub/usePlanetHubBattleReady.ts`

### self-check (김클로드가 실행한 것)
- [x] `npx tsc --noEmit -p tsconfig.client.json` — clean
- [x] `npm run audit:memory:all` — memory 37/37 · skia-worklet 20/20 · worklet-contract PASS · native-reclaim 20/20 · resident-set 7/7 · hot-path 0 hits

### 리스크·주의 (3줄 이내)
- 세 오버레이 모두 "게이트 추가"만 했고 타이머가 하는 일(진행률 재계산·재렌더) 자체는 안 건드림 — 활성 작업 없을 때 폴링을 멈추는 것뿐이라 회귀 위험 낮음.
- `PlanetGenericFacilityDevContent.tsx`는 `session.data`가 아직 null인 초기 로딩 구간엔 `hasActiveJob=false`라 인터벌이 안 도는데, 최초 로딩 자체는 `useHeavyUiDataSession`이 `tick`과 무관하게 자체 처리하므로 문제 없음(같은 패턴의 `PlanetDevelopmentListContent.tsx`가 이미 이렇게 동작 중).
- git commit 안 함.

### 미완·보류
- engagement poll(250ms) 통합은 범위 밖 — 필요 시 별도 태스크.
- P2 항목(worldmap 5분 reclaim 중복, `IdleSessionRestartGuard` 60s)은 미착수.

---

## 김팀장 검수 (본창 Cursor · timer-optimization-p1-20260707)

| 항목 | 결과 |
|------|------|
| diff·계약 | **PASS** — 시설 3곳 `hasActiveJob` 게이트 = `PlanetDevelopmentListContent` 동일 · `useEffect` cleanup `clearInterval` · battle-ready `usePlanetHubInterval`+`registerPlanetSessionResource` 유지 |
| tick·blink 통합 | **PASS** — setInterval 2→1 · blink 180ms는 100ms tick 누적(±20ms 시각 drift, 허용) · `intervalActive` 게이트·planetId dispose unchanged |
| 메모리 회귀 | **PASS** — hot-path 0 · reclaim·드론 publish key·PictureRecorder 등 기존 최적화 diff 범위 밖 |
| audit 재실행 | **tsc PASS** · **audit:memory:all PASS** (37/37 · skia 20/20 · worklet · native-reclaim · resident-set · hot-path 0) |
| **커밋** | 미실행 (김클로드·김팀장 공통 정책 — 대표님 지시 시) |
| mem-post-dev-recheck | **배정** — 김경제 handoff 갱신 권장 |

**verdict**: `PASS`

**검수 메모**:
1. P1 두 건 범위 내 구현 확인 — engagement 250ms는 handoff대로 보류 OK.
2. `PlanetGenericFacilityDevContent` — `session.data` null 구간 폴링 off는 list 패턴과 동일, `useHeavyUiDataSession` 부트스트랩과 충돌 없음.
3. **실기 smoke** — (a) 시설 업그레이드 중 진행률 갱신 (b) 웨이브 battle-ready 카운트·blink — 각 1회 권장.

**[kim-claude-review] 2026-07-07 timer-optimization-p1 PASS — facility hasActiveJob×3 · battle-ready tick+blink merge · tsc+audit PASS**

---

## 사용자 지시 배경 (2026-07-07 · 3종 검수, 이전 사이클)

(1) 직전 작업(드론 폭발 이펙트·파괴시점 관련, `inboundEndOrbitMs` 도입) 검수, (2) 게임 내 작동 중인 타이머 일괄 검수 + 비효율 최적화 가능성 분석, (3) 어제까지의 메모리 최적화 작업에 변경사항(회귀)이 생겼는지 검수. 전부 read-only 분석 요청 — 코드 수정 없음.

### (1) 드론 폭발/파괴시점 작업 검수 — **문제 없음**

`git diff` 대조 확인(`inboundDroneKinematics.ts`·`runInboundDroneInterceptPass.ts`·`ArcInboundDroneSubCore.ts`·`PlanetHubInboundDroneLayer.tsx`·`inboundDroneSkiaTrail.ts`): 신규 `ArcInboundDrone.inboundEndOrbitMs` 필드로 드론이 파괴/충돌된 정확한 orbit 시각에 위치를 고정 → FX 스폰 좌표·트레일 패킹·kinematics 진행률 계산이 전부 이 값을 일관되게 참조하도록 정리됨. 기존 fallback 경로(저장된 elapsed·start 역산) 유지돼 하위호환. `tsc` clean·`audit:memory:all` 전체 PASS 재확인 — 문제 없음.

**참고(범위 밖 발견)**: 같은 diff 범위에 무관해 보이는 변경 3건도 같이 포함돼 있었음 — `runArcCoreInstanceMissionDailyPass.ts`(선술집 보드 동기화 함수 추가), `planetHubFacilityGates.ts`(`missionStore` 정적 import를 순환참조 회피용 `require()`로 변경 — 구조적으론 순환참조 자체를 없애는 게 더 정공법이나 급한 건 아님), `transitCombatSession.ts`(미션 클리어 대화 트리거 추가). 드론 작업과 무관해 보여 검수 범위 밖으로 두고 목록만 남김.

### (2) 게임 내 타이머 일괄 검수 (Explore 에이전트 1개)

기존에 이미 파악·조치된 것(허브 5분/15분/3분 reclaim, 2s 시설개발 완료 폴, battle-ready tick/blink, 일일배치 60s 게이트, 영토전투 60s 게이트, 뉴스보드·성운생태 24h 미션)은 재조사 안 하고 **그 외 전부**를 새로 훑음.

**P1 — 최적화 가치 있음**
- `PlanetOrbitShipyardDevContent.tsx:55` · `PlanetGenericFacilityDevContent.tsx:322` · `PlanetDefenseSatelliteDevContent.tsx:55` — 500ms 폴링 타이머 3개가 **활성 작업 여부 게이트 없이** 오버레이 열려있는 내내 무조건 도는 중. 같은 계열의 `PlanetDevelopmentListContent.tsx:57`은 이미 `hasActiveJob` 게이트가 있어 정답 패턴이 바로 옆에 있음 — 3곳에 그대로 복사 적용 가능한 낮은 리스크 수정.
- 허브에서 전투 진행 중일 때 **100ms(battle-ready tick)·180ms(blink)·250ms(engagement poll)** 서브초 타이머 3개가 동시에 개별 `setInterval`로 돎 — 하나의 공유 티커로 합치면 전투 중 JS 스레드 wake-up이 대략 1/3로 줄어듦.

**P2 — 경미**
- `worldmap.tsx`의 5분 soft reclaim이 `planet.tsx`의 5분 soft reclaim과 **같은 주기·같은 패턴을 화면별로 중복 구현** — 개념적으로 하나의 "포커스된 화면의 주기 reclaim"으로 공유 가능.
- `IdleSessionRestartGuard.tsx:92` — 60초 유휴 체크 타이머가 **앱 전체 수명 동안** 정지 조건 없이 계속 돎(콜백 자체는 가벼움) — AppState 이벤트 기반으로 바꾸면 완전히 없앨 수 있는 종류.

**확인됨(문제 없음)**: 미사일/드론 dodge FX(50ms)·전투 HUD(120ms)·듀얼 전멸판정(90ms)·채굴 드라이버(500ms, elapsed 기반 캐치업+2s UI 스로틀) — 전부 이미 적절히 게이트·스코프됨.

**사소한 발견**: `AiNpcSubCore.ts:81`의 `registerTimedMission`(`npc_birth_and_transport_build`)은 주석은 "상시 순찰"처럼 읽히지만 실제로는 `repeat` 플래그가 없는 **1회성** 미션 — 실제 순찰 유지는 서브코어의 `onWallTick`이 담당. 기능 버그는 아니고 주석·네이밍 혼동.

### (3) 메모리 최적화 작업 회귀 여부 검수 — **회귀 없음**

어제까지 적용한 6건(은하그래프 빌드타임 프리컴파일 `GALAXY_SYSTEMS_PRECOMPUTED`·드론 trail `PictureRecorder` 재사용 `recorderRef`·`combatSkiaPresentationReclaim` Set 다중구독·월드확장 방향균형+증분 스케줄·오버레이 STAGE-이탈 정리 `resolvePendingArcOverlaysForStageExit`·허브 3분 combat-safe reclaim) 전부 grep으로 현재 파일에 그대로 남아있음을 확인 — 최근 드론/미션 작업과 겹치는 파일이 없어 충돌·되돌림 없음. `tsc` clean·`audit:memory:all` PASS 재확인.

### 리스크·주의
- 이번 턴은 전부 분석만 — 코드 수정 없음. P1 두 건은 위험도 낮은 수정 후보로 판단되나 실행은 지시 대기.
- git commit 안 함.

---

## 김팀장 검수 (본창 Cursor · worldmap-black-screen-post-wave-defense-20260706)

| 항목 | 결과 |
|------|------|
| diff·계약 위반 | **PASS** — `ArcOverlayHost` 루트 잔존 P1과 일치 · `onClose` 선행 후 `dismissAll` · STAGE 이탈 공통 경로 1곳 |
| gauge composition 교차 | **충돌 없음** — overlay 정리는 `planet.tsx` navigation 경로만 · gauge intent/batch는 `runArcCoreDailyOpsBatch` 축 |
| audit 재실행 | **tsc PASS** · **audit:memory:all PASS** (37/37 · hot-path 0) |
| **커밋** | **김팀장만** (대표님 명시 요청 시) |
| mem-post-dev-recheck | **배정** — 김경제 handoff 갱신 |

**verdict**: `PASS`

**검수 메모**:
1. **근본원인 타당** — 웨이브 결과 오버레이 미닫힘 + 루트 `ArcOverlayHost`가 STAGE 전환 후에도 스택 유지 → worldmap 가림. `resolvePendingArcOverlaysForStageExit`가 reward/waveResult `onClose` 선행으로 보상 유실 방지.
2. **호출 위치** — `beginPlanetHubSuspendingNavigation` 최상단(출발·시설·타이틀 공통) + ingame dialog `dismiss()` — 배정 diff와 일치.
3. **잔여** — 대화 `onDismiss` 비동기 엣지케이스는 handoff대로 범위外 · **실기 재현**(결과창 안 닫고 출발 → worldmap 정상) 권장.

**[kim-claude-review] 2026-07-06 worldmap-black-screen-post-wave-defense PASS — resolvePendingArcOverlaysForStageExit · tsc+audit PASS · 실기 재현 대기**

---

## 김팀장 검수 (본창 Cursor · planet-core-gauge-composition-20260706)

| 필드 | 값 |
|------|-----|
| **task_id** | `planet-core-gauge-composition-20260706` |
| **verdict** | `PASS` |

### 작업 요약 (김팀장 구현 완료)
Aurora(`synth_002_p`) 등 synth 행성 **>10% 일일 스탯 급등** 원인 — `ensureUnlockedWorldPlanetsInCoreRuntime`의 flat-50 baseline **덮어쓰기** + `SYNTH_PLANET_CORE_SEED=50` autogen. **단일 gauge composition** 아키텍처로 수렴:

- **genesis per-planet** — `planet_resource_genesis.csv` 정본 (`resolvePlanetGenesisCoreGauge`)
- **일일 배치 intent** — Energy / Environment / MasterBalance / Equilibrium → `pushPlanetCoreGaugeIntent`
- **단일 apply** — `runPlanetCoreGaugeCompositionApplyPass` — ArcCore+dev 합산 **1.5%/metric cap** (`planet_core_gauge_composition_policy.csv`)
- **P0 제거** — synth ensureUnlocked gauge replace 삭제 · autogen flat-50 → genesis per planet

### 변경 파일 (핵심)
| 파일 | 내용 |
|------|------|
| `tables/balance/planet_core_gauge_composition_policy.csv` | pct cap 1.5% |
| `src/arcCore/planetCore/planetCoreGaugeIntent.ts` | 배치 intent 누적 |
| `src/arcCore/planetCore/planetCoreGaugeCompositionModel.ts` | base/share 분해·cap apply |
| `src/arcCore/planetCore/runPlanetCoreGaugeCompositionApplyPass.ts` | 일 1회 단일 patch |
| `src/store/planetCoreRuntimeStore.ts` | ensureUnlocked synth replace 제거 · genesis seed |
| `src/store/worldStore.ts` | synth autogen genesis per planet |
| `runPlanetEnergyCorePass` / `runPlanetEnvironmentDiversityPass` / `runGlobalPlanetMasterBalancePass` / `runPlanetCoreStatEquilibriumPass` | intent 연동 |
| `runArcCoreDailyOpsBatch.ts` | `beginPlanetCoreGaugeIntentBatch` → passes → composition apply → statOpsTrend commit |

### audit
- [x] `npx tsc --noEmit -p tsconfig.client.json` — PASS
- [x] `npm run audit:memory:all` — 37/37 · skia 20/20 · worklet · native-reclaim · hot-path 0

### 리스크·주의
- **legacy flat-50 세이브** — `mergeWorldWithDisk`의 `applyGenesisCoreSeed` + genesis realign rev가 1회 보정 · 이미 진행 중 gauge는 composition 초기 분해(`resolveInitialGaugeComposition`)로 점진 수렴.
- **Equilibrium `max_daily_stat_gain_per_metric=4`** — 배치 중에는 intent만 push · **최종 cap은 composition 1.5%**가 우선.
- **런타임** — Aurora 등 synth 1일 배치 후 Δ ≤1.5%/metric 실측 권장(대표님/김경제).

**[kim-team-lead] 2026-07-06 planet-core-gauge-composition PASS — genesis 단일원 · intent batch · pct cap apply · ensureUnlocked flat-50 제거 · tsc+audit PASS**

---

베가 전초기지 웨이브 전투 종료 → 인게임 대화창을 한동안(수 분) 방치 → 확인 버튼을 누르고 출발 → **은하계 지도가 검은 화면으로 뜸(당시 실시간 재현 중)**.

### 조사 (Explore 에이전트 1개 + 라이브 로그·모니터 대조)
- **오늘 오전의 `galaxy100.ts` 프리컴파일 변경은 원인 아님** — 생성 파일 757개 성계 전부 무결성 확인(끊긴 connections·빈 planets 없음), `vega_outpost`(vega_base의 소속 성계) 정상. 디스크 영속 상태도 `systems` 그래프 자체는 안 건드리고 `unlockedSystemIds` 등만 필터링 — 손상 경로 아님.
- **라이브 모니터 로그에서 결정적 단서 확보**: 신고 시점 직후 03:24:51 `GL_HARD_CEILING`(gl=218.4, pss=914.2, **views=558**) → 자동 relaunch로 이미 복구됨(pid 12334). 재현 당시 사용자가 "은하지도"에 있다고 했는데 views가 허브 전투급으로 높았던 점이 단서.
- **근본원인(가장 유력)**: `ArcOverlayHost`/`IngameDialogHost`(`app/_layout.tsx`)는 **루트 레이아웃 레벨의 전역 싱글턴**이라 STAGE(`Stack.Screen`) 전환과 무관하게 계속 마운트 상태 유지. 웨이브 종료 대화(`ingame_dialog_wave_defense_end`) 확인 후 뜨는 **`presentWaveResultOverlay`(웨이브 결과창)를 사용자가 직접 닫지 않고 바로 "출발"을 누르면**, 이 오버레이가 `arcOverlayStore` 스택에 그대로 남은 채 STAGE가 은하지도로 전환됨 — 오늘 앞선 라이프사이클 감사에서 이미 짚었던 "STAGE 이탈 시 오버레이 강제 정리 경로 없음"(P1) 항목이 실제로 터진 사례로 판단.
- `dismissAllArcOverlays()`가 이미 존재했지만 **어떤 STAGE 이탈 핸들러에서도 호출되지 않고 있었음**(감사 리포트 기존 지적과 일치).

### 작업 요약
STAGE 1(행성 허브) 이탈 공통 지점(`beginPlanetHubSuspendingNavigation` — 출발·시설 이동·타이틀 복귀 전부 경유)에서 오버레이·인게임 대화 강제 정리를 추가. 단, 그냥 `dismissAll()`만 하면 `waveResult`/`reward`/`levelUp` 오버레이의 `onClose`(경험치 지급·웨이브 스토어 reset 등)가 안 불려 **보상이 유실**되는 걸 발견해서, 새 함수로 그 부수효과를 먼저 실행한 뒤 스택을 비우도록 구현.

### 변경 파일
- `src/ui/overlay/arcOverlayStore.ts` — `resolvePendingArcOverlaysForStageExit()` 신설. 스택의 `levelUp`/`reward`/`waveResult` 항목은 `onClose()`를 먼저 호출(보상 지급 등 부수효과 보존)한 뒤 `dismissAll()`로 스택을 비움. `alert`/`narrative`/`tradeQuantity` 등 나머지 종류는 onClose 없이 그냥 제거(사용자 선택 없는 상태라 안전).
- `app/(game)/planet.tsx` — `beginPlanetHubSuspendingNavigation`(출발·시설 이동·타이틀 복귀 공통 경로) 최상단에서 `resolvePendingArcOverlaysForStageExit()` + (열려있으면) `useIngameDialogStore.getState().dismiss()` 호출.

### self-check (김클로드가 실행한 것)
- [x] `npx tsc --noEmit -p tsconfig.client.json` — clean
- [x] `npm run audit:memory:all` — memory 37/37 · skia-worklet 20/20 · worklet-contract PASS · native-reclaim 20/20 · resident-set 7/7 · hot-path 0 hits

### 리스크·주의 (3줄 이내)
- **잔여 엣지케이스**: 인게임 대화(`IngameDialogHost`)가 아직 열려있는 상태에서 강제 `dismiss()`하면 `onDismiss` 콜백이 비동기(await 포함)라, 그 콜백이 **새 오버레이를 여는 경우**(예: 이 웨이브 종료 대화 자체) STAGE 전환 이후에 새로 뜰 여지가 이론상 남음 — 이번 신고 시나리오(대화는 이미 확인 완료 후 출발)에는 해당 안 되지만, 완전히 막으려면 다이얼로그 스토어 자체를 동기화하는 별도 작업 필요(이번 범위 밖).
- 자동 모니터가 이미 앱을 강제 재시작해 사용자의 즉시 증상은 해소됐을 가능성 높음 — 재현 재확인 필요.
- git commit 안 함.

### 미완·보류
- 실기기 재현 확인(리로드 후 동일 시나리오 — 웨이브 종료 → 결과창 안 닫고 바로 출발 → 은하지도 정상 렌더 확인) 필요.
- 위 "다이얼로그 아직 열림" 엣지케이스는 재발 시 별도 작업.

---

## 사용자 지시 배경 (2026-07-05 · 부팅 시 은하지도 로딩 구조개선)

"은하계 지도 로딩(차원항로 진입 시퀀스용으로 설계된 부분)이 왜 시작 부팅에 들어가 있는지" 문의 → 감사 리포트 P0#1 관련. 구조개선 가능 여부 검토 후 안전한 부분은 진행 지시.

### 검토 결과 (Explore 에이전트 1개 병렬 조사 포함)

- **"위치만 지연 계산"은 안전하지 않음** — `capSystemGraphMaxDegree`(연결선 확정 단계)가 완화된 좌표로 거리·교차 판정을 하므로 **좌표와 연결그래프가 순차 결합**돼 있음. `computeGalaxyTransitFuelQuote`·`tradeRouteTransportCost`·`syncNpcAiClanTerritoryFromGalaxy`(Continue 탭 시 실행) 등 실제 게임로직이 지도 화면을 열기 전에도 좌표를 읽음 — "지도 열 때만 계산"으로 미루면 이 경로들에서 여전히 일찍 트리거되거나, 트리거 안 되면 그래프 자체가 없어 에러.
- **대신 "빌드타임에 한 번만 계산해 정적 파일로 굳히기"가 안전** — `buildGalaxySystems100()`은 고정 시드(`mulberry32(20260415)`)·정적 입력(`STAR_SYSTEMS`)만 쓰는 순수 함수라 결과가 항상 같음. 기존 CSV 밸런스 테이블도 이미 이 방식(빌드타임 코드젠 → 정적 `.ts` import)이라 같은 컨벤션.
- **부수 발견**: 같은 프로세스 안에서는 100% 결정적이지만, **서로 다른 프로세스 실행 간에는 부동소수점 최종 좌표가 미세하게(약 0.0005) 갈릴 수 있음**(V8 JIT 타이밍에 따른 200회 반복 시뮬레이션 누적 오차로 추정 — 연결그래프 자체는 영향 없음, 확인함). 오늘 처음 발견한, 원래부터 있던 특성. 빌드타임에 하나로 고정하면 오히려 전 기기가 **완전히 동일한 은하 그래프**를 갖게 되어 이 잠재적 불일치도 같이 해소됨.

### 작업 요약
`buildGalaxySystems100()`의 결과(760개 중 활성 757개 성계)를 빌드타임에 1회 계산해 정적 파일로 굳히고, 런타임(`galaxy100.ts`)은 그 결과만 재노출하도록 변경. 함수 자체·다른 export(`GAMEPLAY_SYSTEM_IDS` 등)는 그대로 — 소비하는 쪽 코드는 전혀 안 건드림(같은 이름 `GALAXY_SYSTEMS`, 같은 타입, 같은 값).

### 변경 파일
- `tools/galaxy-graph/generate-galaxy-systems.ts` (신규) — `buildGalaxySystems100()`을 실행해 결과를 정적 `.ts`로 직렬화하는 생성기. 실행: `npx tsx tools/galaxy-graph/generate-galaxy-systems.ts` (또는 `npm run gen:galaxy-graph`).
- `src/data/generated/galaxySystems100.generated.ts` (신규, AUTO-GENERATED) — 프리컴파일된 757개 성계 데이터.
- `src/data/galaxy100.ts` — `export const GALAXY_SYSTEMS = buildGalaxySystems100()`(매 부팅 실행) → `GALAXY_SYSTEMS_PRECOMPUTED` import로 교체. `buildGalaxySystems100()` 함수 자체는 생성기 전용으로 계속 export.
- `package.json` — `gen:galaxy-graph` 스크립트 신설, `postinstall`·`prestart`·`preandroid`에 연결(밸런스 테이블과 동일하게 `STAR_SYSTEMS` 변경 시 자동 재생성).

### self-check (김클로드가 실행한 것)
- [x] `npx tsc --noEmit -p tsconfig.client.json` — clean
- [x] `npm run audit:memory:all` — memory 37/37 · skia-worklet 20/20 · worklet-contract PASS · native-reclaim 20/20 · **resident-set 7/7** · hot-path 0 hits
- [x] `npx tsx src/arcCore/worldExpansionGlobalSchedule.test.ts` — 기존 5개 테스트 전부 PASS(정확히 `synth_002` 등 동일 그래프 확인)
- [x] 임시 검증(작업 후 삭제): 새 정적 파일과 그 시점의 런타임 재계산 결과를 deepEqual 대조 — 좌표는 위에 적은 프로세스간 부동소수점 미세오차 확인(연결그래프는 동일), 정적 파일 자체는 생성 시점 실행 결과 그대로 정확히 반영됨.

### 리스크·주의 (3줄 이내)
- **STAR_SYSTEMS(src/data/systems) 수정 시 반드시 `npm run gen:galaxy-graph` 재실행 필요** — 안 하면 정적 파일이 stale해짐. `postinstall`/`prestart`/`preandroid`에 걸어놔서 일반적인 개발 흐름에선 자동 반영되나, 수동으로 CSV/코드만 고치고 바로 커밋하면 놓칠 수 있음 — 김팀장 검수 시 확인 권장.
- 프로세스간 부동소수점 미세오차 발견은 이번 fix로 오히려 해소되는 방향(전 기기 동일 그래프) — 회귀 아님.
- git commit 안 함. `src/data/generated/galaxySystems100.generated.ts`는 신규 untracked 파일 — 커밋 시 포함 필요.

### 미완·보류
- 감사 리포트의 P0#2(미개방 성계까지 포함해 전체 행성 코어 런타임을 부팅마다 구축)·P0#3(계정 초기화 후 재부팅 미실행)은 이번 범위 밖 — 별도 진행 여부 확인 필요.

---

## 김팀장 검수 (본창 Cursor · memory-loading-optimization-refactor-20260705)

| 항목 | 결과 |
|------|------|
| diff·계약 위반 | **PASS** — Table-First 코드젠 컨벤션 · `GALAXY_SYSTEMS` API 동일 · 소비처 무변경 |
| audit 재실행 | **tsc PASS** · **audit:memory:all PASS** (37/37 · resident-set 7/7) · **audit:dev-process-gate PASS** · **worldExpansion test 5/5** |
| **커밋** | **김팀장만** (대표님 명시 요청 시) |
| mem-post-dev-recheck | **배정** — 김경제 handoff 갱신 |

**verdict**: `PASS`

**심층 검수 (10축 요약)**:
1. **범위** — P0#1(부팅 sync O(n²) 제거)만 구현 · P0#2·P0#3 **미포함**(handoff 보류 동의).
2. **부트·로딩** — `buildGalaxySystems100()` 런타임 모듈 init **제거** → `GALAXY_SYSTEMS_PRECOMPUTED` import · 757 systems · `synth_002` connections=3 확인.
3. **STAGE·dispose** — 변경 없음 · 회귀 없음.
4. **계정 라이프사이클** — 변경 없음.
5. **Skia·native** — 변경 없음.
6. **arcCore** — world-expansion 테스트 동일 그래프(`synth_002` 등) PASS.
7. **코드젠** — `tools/galaxy-graph/generate-galaxy-systems.ts` · `npm run gen:galaxy-graph` · `postinstall`/`prestart`/`preandroid` 연동 OK.
8. **정적 게이트** — 전 항목 PASS.
9. **런타임** — 부팅 체감·타이틀→허브 **대표님 실측** 권장(정적 import parse 1회 vs O(n²) 제거 — net 이득 예상).
10. **감시** — 김경제 `mem-post-dev-recheck` 배정.

**검수 메모**:
- **순환 import(생성기)**: generator가 `galaxy100.buildGalaxySystems100()` 호출 · 런타임은 precomputed만 — 안전.
- **stale 위험**: `galaxy100.ts` 알고리즘/`STAR_SYSTEMS` 변경 시 `gen:galaxy-graph` 필수 — hook으로 대부분 자동 · **커밋 전 generated 포함** 확인.
- **dev tradeoff**: `prestart`마다 codegen 1회(O(n²)) — **앱 부팅이 아닌 Metro 시작** 비용 · 수용.
- **untracked**: `galaxySystems100.generated.ts` · `tools/galaxy-graph/` · 커밋 시 포함.

**[kim-claude-review] 2026-07-05 memory-loading-optimization-refactor PASS — galaxy precompile codegen · P0#1 boot fix · tsc+audit PASS · 부팅 체감 실측 대기**

---

## 사용자 지시 배경 (2026-07-05 · 전체 라이프사이클 감사)

향후 콘텐츠·기능 확장을 고려해 부팅→STAGE 전환→계정 삭제/재생성까지 전체 흐름의 메모리 해제·기타 리스크를 집중 점검 요청. 이중구현·죽은 코드도 같이 확인 요청. Explore 에이전트 4개(부팅/STAGE dispose/계정 라이프사이클/확장성) 병렬 실행 후 종합.

**전체 보고서(아티팩트)**: https://claude.ai/code/artifact/5118b9f6-4c8c-4f7b-bda7-070d5b6cf80e

### 요약 (P0 3건 · P1 8건 · P2 6건 · 확인됨 다수)

**P0**
1. `src/data/galaxy100.ts:534` `relaxGalaxyMinDistance()` — 760개 성계 O(n²)×200회 좌표 재배치가 **모듈 로드 시 동기 실행**(React 렌더 전, boot-perf 마커 밖) — "멈춘 듯한" 체감 지연의 최유력 원인.
2. `src/store/planetCoreRuntimeStore.ts:277-305,436-453` — 미개방 성계까지 포함해 전체 760개 행성 코어 런타임을 부팅마다 구축(일 1개씩만 여는 설계인데도).
3. `app/(game)/planet.tsx:1345-1352` `navigateToTitle()` — 계정 초기화 후 **전체 부팅 재부트스트랩이 안 일어남**(in-place router.replace, RootLayout 미언마운트) — 명시적으로 안 지운 스토어/서브코어는 이전 계정 상태를 그대로 물려받음.

**P1 (요약)**: `initGuestAuth()` 네트워크 대기가 로컬 하이드레이션보다 앞섬 · `useDisposableRegistry`(spec 강제)가 실호출처 0건(툴링 사각지대) · STAGE 이탈 시 오버레이 강제 정리(`dismissAllArcOverlays`) 미호출 · `planetNebulaStore`(백업 대상인데 리셋 경로 없음) · `planetGovernorAssignmentStore`(계정 purge 제외 주석 vs 백업 키 목록 등록 — 분류 불일치) · `ZONE_MAX=21` 조용한 클램프(콘텐츠 확장 시 숨은 함정) · `TARGET_TOTAL=760`(10배 확장 시 O(n²) 배치 비용 동반 상승) · 부팅 중복 호출 2건(`bootstrapFromWorldAsync` 3회, clan sync 2회).

**P2 (요약)**: `buildCsvStaticIndexes()` 죽은 코드 · whole-store reset 3종 미사용(`itemLedgerStore`/`accountProfileStore`/`skillDbStore`) · deprecated 재-export shim 잔존 · 단일슬롯 레지스트리 2건 더(`galaxyMapScrollLifecycle.ts`/`orbitClockMsBridge.ts`, 오늘 고친 버그와 동일 모양이나 위험도 낮음) · `drawPlanetFlameBurstOnSkCanvas`가 같은 파일의 `cachedSkColor()` 안 씀 · bootReady 플래그 2중 추적.

**확인됨(정상)**: STAGE1/STAGE2/네이티브reclaim 레지스트리 3계층 분리 건강 · 오늘 추가한 3개 reclaim 주기 상호배제 확인 · watchdog 타이밍 가정 여전히 유효 · "베이스라인부터 재계산 후 롤백" 안티패턴은 오늘 고친 world-expansion 건 외 다른 곳에 없음 · CSV/밸런스 테이블은 이미 빌드타임 코드젠(런타임 파싱 없음).

### 리스크·주의
- 이번 턴은 **분석·보고만** — 코드 수정 없음. P0 3건은 실제 수정 시 각각 별도 태스크로 김팀장 승인 필요(특히 3번은 "재부팅 강제 vs 리셋함수 완전성 재검증" 중 방향 결정 필요).
- git commit 안 함.

### 미완·보류
- 우선순위 확인 후 항목별 진행 방식 사용자 결정 대기.

---

## 사용자 지시 배경 (2026-07-05 · combat-safe reclaim 적용 후 실측)

리로드 후 베가 전초기지 웨이브 전투 실측: GL은 30분+ 동안 47.9→47.9→48.8로 사실상 고정(3분 안전판 효과 확인됨). 그런데 **`native_heap_mb`가 408.5→428.4→468.8로 30분간 +60MB 계속 상승** — GL과 별개 축이라 사용자가 이 부분 집중 원인파악·수정 지시.

## 김클로드 작성 (작업 종료 시 · status=`PENDING`으로 변경)

### 작업 요약
Explore 에이전트 2개(전투 sim 렌더링 / 허브 사운드·햅틱·네이티브모듈)를 병렬로 돌려 교차검증 — **고빈도(root cause) 확정**: `PlanetHubInboundDroneSkiaTrailLayer.tsx`의 `recordInboundDroneVfxPicture`가 드론·히트FX가 하나라도 활성일 때마다(~48ms 주기, 초당 약 20회) `Skia.PictureRecorder()`를 **매번 새로 생성**하고 있었음. `SkPictureRecorder`는 `dispose()` 메서드 자체가 없어(타입 정의 확인) JS GC가 finalizer를 통해 지연 회수할 때까지 native(JSI) 쪽에 그대로 남음 — 드론 침공이 계속되는 장시간 웨이브 세션 동안 초당 20개씩 고아 객체가 쌓이는 구조. 같은 파일 주석(L162-163)에 이미 "idle 상태에서는 recorder를 아예 안 만든다"는 수정 이력이 있어("장시간 네이티브 JSI finalizer 지연 누적 원인" — 팀이 이미 이 패턴 자체를 위험군으로 알고 있었음), 이번엔 **활성 상태(정확히 지금 문제가 된 경우)** 쪽이 빠져있었던 것.

같은 파일 안에 이미 정본 패턴(`pathPoolRef`/`trailPaintRef` — 컴포넌트 수명 동안 1개만 만들어 재사용)이 있었고, 형제 파일 `PlanetEdenRaidOrbitSkiaCombat.tsx`의 `_combatPictureRecorder`/`getCombatPictureRecorder()`도 동일하게 "1개 만들어 매 프레임 `beginRecording()`만 다시 호출" 방식이라, 이번 fix는 그 기존 컨벤션을 그대로 따라간 것 — 새로운 패턴 도입 아님.

### 변경 파일
- `src/components/planet/PlanetHubInboundDroneSkiaTrailLayer.tsx`
  - `recordInboundDroneVfxPicture` 시그니처에 `recorder` 파라미터 추가, 함수 내부에서 `Skia.PictureRecorder()` 직접 생성하던 걸 제거하고 전달받은 recorder의 `beginRecording()`만 재사용.
  - 컴포넌트에 `recorderRef`(컴포넌트 수명 ref) 신설 — `trailPaintRef`와 동일하게 lazy 초기화(최초 1회만 `Skia.PictureRecorder()` 생성) 후 매 flush마다 재사용.
  - 언마운트 cleanup에 `safeSkiaDispose(recorderRef.current)` 추가(기존 `pathPoolRef`/`trailPaintRef` 해제 순서 바로 뒤) — `_combatPictureRecorder` 정리와 동일하게 `dispose?: () => void`로 캐스팅해 no-op 안전 처리.

### self-check (김클로드가 실행한 것)
- [x] `npx tsc --noEmit -p tsconfig.client.json` — clean
- [x] `npm run audit:skia-memory` — 20/20 PASS
- [x] `npm run audit:memory:all` — memory 37/37 · skia-worklet 20/20 · worklet-contract PASS · native-reclaim 20/20 · resident-set 7/7 · hot-path 0 hits

### 리스크·주의 (3줄 이내)
- **재사용 패턴은 이 코드베이스에 이미 검증된 컨벤션**(`_combatPictureRecorder`가 동일하게 매 프레임 `beginRecording()` 재호출) — 새 위험 도입 아님, 안전 확신 높음.
- 이번 fix로 native_heap 상승이 "이 recorder 하나"로 전부 설명되는지는 실측 전까지 100% 확정 아님 — 병렬 조사에서 사운드·햅틱·타이머·이미지·네이티브모듈은 전부 배제 확인됐고, 이 recorder가 유일하게 남은 "초당 반복 native 할당" 지점이었음(수렴 증거는 강함).
- git commit 안 함.

### 미완·보류
- **런타임 재실측 필요** — 리로드 후 베가 전초기지에서 다시 장시간 웨이브 진행하며 `native_heap_mb` 추이 확인. 이번에도 계속 오르면 다른 축(예: Reanimated 내부, Hermes 힙 파편화 등)을 더 봐야 함.

---

## 김팀장 검수 (본창 Cursor · hub-inbound-drone-picturerecorder-leak-20260705)

| 항목 | 결과 |
|------|------|
| diff·계약 위반 | **PASS** — PictureRecorder 1회 lazy·재사용 · `_combatPictureRecorder` 동일 컨벤션 · unmount dispose |
| audit 재실행 | **tsc PASS** · **audit:skia-memory 20/20 PASS** |
| **커밋** | **김팀장만** (대표님 명시 요청 시) |
| mem-post-dev-recheck | **배정** — 김경제 handoff 갱신 |

**verdict**: `PASS`

**검수 메모**:
1. **근본원인 타당** — 활성 드론/히트FX flush마다 `Skia.PictureRecorder()` 신규 생성(~48ms) → `dispose()` 없음 → JSI finalizer 지연 → `native_heap_mb` +60MB/30m 실측과 일치. idle 경로(L166-176)는 기존대로 recorder 미생성 유지.
2. **수정 패턴** — `recorderRef` lazy 1회 + `beginRecording()` 재호출만 · `finishRecordingAsPicture()` 산출 `SkPicture`는 기존 `scheduleSkPictureDispose(prev)` 경로 유지 · unmount `safeSkiaDispose(recorderRef)` — `PlanetEdenRaidOrbitSkiaCombat`/`SkiaPlanetNebulaShaderBackdrop` 정본과 동일.
3. **Skia 헌법** — 루프 내 `Make()`/`Paint()` 신규 없음 · Path pool `rewind()` 유지 · audit:skia-memory PASS.
4. **실측** — 베가 웨이브 장시간 `native_heap_mb` floor 추이 재확인 권장(대표님/김경제).

**[kim-claude-review] 2026-07-05 hub-inbound-drone-picturerecorder-leak PASS — recorder reuse · tsc+audit:skia-memory PASS · native_heap 재실측 대기**

---

## 사용자 지시 배경 (2026-07-05 16:52 KST 자동재시작 인시던트)

`GL_HARD_CEILING gl=160.2 pss=972.1 views=371` → 자동 relaunch(정상 복구 확인됨). 오늘 같은 패턴(`suspect=hub_skia_orbit_nebula_combat`)이 하루 6번(09:56·10:12·11:45·13:02·14:49·16:52) 발생. 분석 결과 **오늘 이미 고친 두 건(idle GL floor·웨이브 디펜스 inter-wave 공백)과는 별개로, "전투 orbit 진행 중"에는 5분 soft·15분 deep 주기 reclaim이 통째로 skip되고 그걸 대체할 안전판이 전혀 없어, 단일 인카운터가 길게 이어지면 PSS가 무제한으로 쌓이다 하드실링(950MB)을 그냥 넘겨버릴 수 있는 구조적 gap**임을 확인·보고 → 사용자가 이 gap을 고치는 작업 진행 지시.

## 김클로드 작성 (작업 종료 시 · status=`PENDING`으로 변경)

### 작업 요약
전투 orbit 활성 "중"에만 도는 별도의 안전(safe) reclaim 주기(3분)를 신설. 기존 5분 soft·15분 deep 주기는 mid-frame Skia/worklet 레이스 회피를 위해 전투 중 전면 skip하는 게 맞다고 보고 그 설계는 유지 — 대신 그 skip 구간 동안에도 안전하게 돌 수 있는 부분(module Path/Paint/maskfilter 캐시 trim, `runCombatSkiaPresentationReclaim` 하나)만 별도 타이머로 뽑아 전투 중에도 계속 돌게 함.

**중요 — 확정된 단일 근본원인은 못 찾음**: `skColorCache`·`_teamFlameTintCache`·`_mfCache`(마스크필터, sigma 기반 키) 등 combat Skia 모듈 캐시들을 추적했으나, 실제 호출부(`drawPlanetFlameBurstOnSkCanvas` 등)에서 쓰는 `scaleMul`/`baseSpec`이 전부 고정 상수라 키 공간이 작아(대략 10여개 이하) 무한 증가 소스로 보기 어려움. 그래서 "정확히 뭐가 새는지 고치기"보다 **"전투 중엔 아무것도 안 돈다"는 구조적 gap 자체를 닫는 안전판**으로 접근함 — 실측(김팀장/사용자)으로 실제 GL 추이가 개선되는지 확인 필요.

### 변경 파일
- `src/game/nativeReclaim/processMemoryBudgetPolicy.ts` — `HUB_COMBAT_SAFE_RECLAIM_INTERVAL_MS = 3분` 신설.
- `src/game/nativeReclaim/runPlanetHubCombatSafeReclaimPass.ts` (신규) — `runCombatSkiaPresentationReclaim()`만 호출하는 얇은 wrapper. `signalHubSkiaNativeReclaim`(dodge overlay 강제 해제·전투 중 시각적 끊김 위험) · Fresco trim · RN 백드롭 remount는 **의도적으로 제외**.
- `src/game/nativeReclaim/index.ts` — 위 신규 함수·상수 barrel export 추가.
- `app/(game)/planet.tsx` — 기존 5분/15분 주기 effect 옆에 3번째 주기 effect 신설. 게이트는 `periodicReclaimSuppressedRef.current`(기존 두 주기가 "전투 중이면 skip"하는 바로 그 플래그)를 **반대로 사용** — "전투 중일 때만" 돈다. `arcInboundFlyingDroneCountRef` 체크는 없음(이 안전판은 드론 여부와 무관하게 전투 orbit 자체를 게이트로 씀).

### self-check (김클로드가 실행한 것)
- [x] `npx tsc --noEmit -p tsconfig.client.json` — clean
- [x] `npm run audit:skia-memory` — 20/20 PASS
- [x] `npm run audit:memory:all` — memory 37/37 · skia-worklet 20/20 · worklet-contract PASS · native-reclaim 20/20 · resident-set 7/7 · hot-path 0 hits

### 리스크·주의 (3줄 이내)
- **근본원인 미확정** — 위에 적었듯 캐시 키 공간 조사로는 무한증가 소스를 못 찾았음. 이 fix는 "혹시 뭐가 쌓이든 3분마다 안전하게 비운다"는 방어적 안전판이지 원인 제거가 아님 — 다음 인시던트에서도 재발하면 다른 각도(예: sim 쪽 배열/버퍼, native_heap 자체)로 더 파야 함.
- `runCombatSkiaPresentationReclaim()`은 이미 hub idle soft pass에서 매일 수백 번 검증되며 쓰이던 안전한 함수라 재사용 자체의 리스크는 낮음 — dodge overlay·Fresco·RN remount를 안 건드린 것도 기존 "mid-frame 위험군" 구분을 그대로 따름.
- git commit 안 함.

### 미완·보류
- 런타임 실측 필요(다음 유사 인카운터에서 GL이 실제로 덜 쌓이는지) — 기기 필요, 김팀장/사용자 확인 권장.
- 근본원인을 더 정밀하게 찾으려면 sim 버퍼(missiles/hitFx 배열)·native_heap 쪽까지 넓혀서 봐야 함 — 이번 범위 밖.

---

## 김팀장 검수 (본창 Cursor · hub-combat-in-progress-safety-valve-20260705)

| 항목 | 결과 |
|------|------|
| diff·계약 위반 | **PASS** — 3분 combat-safe 주기 · inverse gate · session dispose · mid-frame 위험군 제외 |
| audit 재실행 | **tsc PASS** · **audit:memory:all PASS** (37/37 · native-reclaim 20/20 · hot-path 0) |
| **커밋** | **김팀장만** (대표님 명시 요청 시) |
| mem-post-dev-recheck | **배정** — 김경제 handoff 갱신 |

**verdict**: `PASS`

**검수 메모**:
1. **안전판(본 태스크)** — `HUB_COMBAT_SAFE_RECLAIM_INTERVAL_MS`(3분) + `periodicReclaimSuppressedRef` **반전 게이트** → 전투 orbit 진행 중에만 `runPlanetHubCombatSafeReclaimPass` → `runCombatSkiaPresentationReclaim`만. dodge/Fresco/remount 제외 — 기존 mid-frame 레이스 회피 설계 유지.
2. **동봉 diff(웨이브 메모리 축 · 상호 보완)** — handoff 본문外이나 working tree에 함께 있음: `combatSkiaPresentationReclaim` **Set 다중 등록**(hit-fx+module 캐시 둘 다 reclaim — 이전 단일 fn 덮어쓰기 버그 수정) · 웨이브 `phase==='combat'`만 soft/deep skip · `hub_wave_inter_wave` post-Skia peak · `PlanetEdenRaidTestLayer` waveReseed 캐시 clear · post-Skia 90s followup. 전부 웨이브/전투 GL 누적 방어 축 — **PASS**.
3. **신규 파일** — `runPlanetHubCombatSafeReclaimPass.ts` 아직 untracked → 커밋 시 반드시 포함.
4. **한계** — 방어적 안전판(근본 leak 미확정). 장시간 단일 combat phase GL 추이는 **실기/김경제 soak** 권장.

**[kim-claude-review] 2026-07-05 hub-combat-in-progress-safety-valve PASS — 3m combat-safe reclaim · reclaim Set fix · wave inter-wave · tsc+audit PASS · GL mtrack 실측 대기**

---

## 사용자 지시 배경 (2026-07-05 · 성계개방 방향 편중 문제)

사용자가 "1일 1성계개방"이 동서남북 중 한쪽만 계속 개방되고 다른 방향은 오래 안 열리는 것 아니냐고 문의 → 김클로드가 코드 확인 후 **실제로 그런 구조적 편중이 있음을 확인·보고** → 사용자가 "가장 안정적인 규칙으로 선별해서 코드작업 개시, 단 **현재 개방된 성계가 미개척으로 회귀하는 일만 없으면 됨**"이라고 지시.

### 확인된 문제 2가지 (수정 전)
1. **미개척 되돌림 위험(치명적)** — `buildDeterministicGlobalSynthUnlockSchedule`가 매 호출마다 baseline부터 전체 스케줄을 재계산하고, `reconcileGlobalSynthUnlocks`가 diff로 "목표 집합에 없는 건 강제 롤백"(unlockedSystemIds 제거 + 성계 상태 초기화 + 식민화 phase 삭제)까지 하는 구조라, 선택 알고리즘을 조금만 바꿔도 이미 열린 성계가 되돌아갈 수 있었음.
2. **방향 편중(실측 확인)** — 임시 검증 스크립트로 확인한 결과, 기존 순수 사전순(lexicographic-min) 방식은 확장(미발견) 노드 200개 중 **north=165(전량) · east=38 · south=0 · west=0**로 극단적으로 쏠림. 원인은 방향별 클러스터가 그래프상 서로/base·legacy와 직접 연결이 거의 없어서(관문 브릿지가 그래프 생성 후 degree-cap 단계에서 소실된 것으로 추정), 프론티어가 비면 "아무 성계나" 강제로 여는 기존 폴백이 매번 같은(처음 걸리는) 방향만 재시드하고, 한번 진입한 클러스터가 내부 인접만으로 165개를 다 소진할 때까지 다른 방향은 전혀 안 열렸음.

## 김클로드 작성 (작업 종료 시 · status=`PENDING`으로 변경)

### 작업 요약
(1) 성계개방 스케줄을 "매번 baseline부터 전체 재계산" 방식에서 "현재 실제로 열려있는 성계를 고정 접두사로 두고 부족한 만큼만 새로 뽑는" 증분 방식으로 변경 — 정상 진행(일일 배치·부팅 동기화) 경로에서 기존 개방분이 목표 집합에서 빠지는 경우가 원천적으로 없어짐(reconcile의 되돌림 로직 자체는 안 건드림 — `resetGeneration` 같은 명시적 전체 리셋 레버는 그대로 남되, 일반 진행 중엔 절대 발동 안 함).
(2) 확장(미발견) 단계 선택 규칙을 "사전순 최소" 단일 규칙에서 "매 pick마다 현재 개방 수가 가장 적은 방향(N/E/S/W)부터 시도 → 그 방향에 인접 프론티어 후보 있으면 그걸, 없으면 그 방향 노드를 직접 시드 → 그래도 없으면(방향 전체 소진) 다음으로 적은 방향" 방식으로 교체. 레거시(1~79번) 우선 소진 순서는 안 건드림(사용자 우려 대상이 아님).

### 변경 파일
- `src/arcCore/worldExpansionFrontier.ts`
  - `pickDirectionBalancedExpansion` 신설 — 방향별 개방 수 오름차순으로 순회하며 (조직적 프론티어 → 직접 시드) 순으로 pick. 기존 "프론티어 비면 아무 성계나" 폴백을 대체하는 게 아니라 **그 강제선택을 방향 인지형으로 정밀화**한 것(완전히 새로운 동작 아님).
  - `pickDeterministicSynthFrontierCandidate`의 expansion 분기만 교체, legacy 분기·최종 안전 폴백은 미변경.
- `src/arcCore/worldExpansionGlobalSchedule.ts`
  - `buildDeterministicGlobalSynthUnlockSchedule`에 `alreadyUnlockedSynthIds` 파라미터 추가(기본값 `[]`, 기존 호출부·테스트 하위호환) — 이미 열린 성계를 schedule 앞부분에 고정하고 부족분만 새로 pick.
  - `buildGlobalSynthUnlockTargetIds`도 동일 파라미터 추가해 전달.
- `src/arcCore/syncArcCoreGlobalWorldExpansion.ts`
  - `syncArcCoreGlobalWorldExpansion`·`syncArcCoreGlobalWorldExpansionSync` 양쪽 호출부에서 `world.unlockedSystemIds`의 synth만 필터링해 `alreadyUnlockedSynthIds`로 전달.

### self-check (김클로드가 실행한 것)
- [x] `npx tsc --noEmit -p tsconfig.client.json` — clean
- [x] `npm run audit:memory:all` — memory 37/37 · skia-worklet 20/20 · worklet-contract PASS · native-reclaim 20/20 · resident-set 7/7 · hot-path 0 hits
- [x] `npx tsx src/arcCore/worldExpansionGlobalSchedule.test.ts` — 기존 5개 테스트 전부 PASS(수정 전과 동일 결과 — 하위호환 확인)
- [x] 임시 검증 스크립트(작업 후 삭제) 3건 실행 결과:
  - **되돌림 없음**: 1~120일차를 매일 순차 호출(전날 결과를 `alreadyUnlockedSynthIds`로 재투입)하며 이전 스케줄이 항상 접두사로 그대로 유지됨을 확인
  - **방향 균형**: 확장 200개 pick 결과 `{north:51, east:51, south:51, west:50}`(수정 전 `{north:165, east:38, south:0, west:0}` 대비 극적 개선)
  - **완전 소진**: 전체 736개 synth 요청 시 정확히 736개에서 멈추고(무한루프 없음) 중복 없이 전량 커버 확인

### 리스크·주의 (3줄 이내)
- **`resetGeneration`/`epochDayKey` 변경 시의 기존 "초과 개방 강제 롤백" 레버가 정상 진행 경로에서는 더 이상 발동하지 않게 됨** — 이건 사용자 지시("절대 회귀 없어야 함")와 정확히 일치하는 의도된 변경이지만, 향후 팀이 "완전 리셋"이 실제로 필요한 상황이 오면 이 경로로는 안 되고 별도 조치가 필요함(문서화만 해둠, 코드로 막지는 않음 — `reconcileGlobalSynthUnlocks` 자체는 안 건드렸음).
- 방향 판정은 좌표 재계산 없이 **synth ordinal 산술**(`(ord - legacyCount - 1) % 4`)로 복원 — `galaxy100.ts`의 `buildExpansionSpiderPositions`가 `cluster = i % 4`로 배치하는 것과 동일 산식임을 코드로 대조 확인했으나, 그래프 생성 로직이 나중에 바뀌면 이 산식도 같이 갱신 필요.
- git commit 안 함.

### 미완·보류
- 근본 원인으로 추정한 "방향별 관문 브릿지가 degree-cap 단계에서 소실"은 `galaxy100.ts`(그래프 생성) 쪽 이슈로 보이나, 이번 수정 범위 밖이라 **건드리지 않음** — 이번 fix는 그 결과(편중)를 선택 알고리즘 레벨에서 상쇄하는 방식이라 원인 자체를 고친 게 아님. 필요하면 별도로 `galaxy100.ts`의 degree-cap/게이트웨이 연결 로직을 검토 권장.
- 런타임 실측(실제 기기에서 여러 날 경과 후 방향별 개방 분포)은 시간이 걸려 못함 — 위 검증은 순수 함수 레벨 시뮬레이션.

---

## 김팀장 검수 (본창 Cursor · world-expansion-direction-balance-20260705)

| 항목 | 결과 |
|------|------|
| diff·계약 위반 | **PASS** — 증분 스케줄(`alreadyUnlockedSynthIds` 접두 고정) · 방향 균형 pick · sync 양 경로 전달 |
| audit 재실행 | **tsc PASS** · **audit:memory:all PASS** (37/37 · hot-path 0) · **unit test 5/5 PASS** |
| **커밋** | **김팀장만** (대표님 명시 요청 시) |
| mem-post-dev-recheck | **배정** — 김경제 handoff 갱신 |

**verdict**: `PASS`

**검수 메모**:
1. **미개척 회귀 방지** — `buildDeterministicGlobalSynthUnlockSchedule`가 `alreadyUnlockedSynthIds`를 schedule 접두로 고정 → `syncArcCoreGlobalWorldExpansion(Sync)`가 `world.unlockedSystemIds` synth를 전달. 정상 진행 경로에서 reconcile `toRemove` 발동 조건 제거 — 대표님 지시(「개방된 성계 미개척 회귀 금지」) 충족.
2. **방향 편중** — `pickDirectionBalancedExpansion`: 개방 수 최소 방향 우선 → organic frontier → reseed. `resolveExpansionDirection` 산식이 `galaxy100.ts` `cluster = i % 4`와 일치 확인.
3. **성능** — reseed 시 `Object.keys(systems)` O(N)은 **일 1회 배치·부트 sync** 한정 호출 — tick/렌더 경로 아님 · arcCore 배치 계약 OK.
4. **잔존 리스크** — `resetGeneration`/epoch 변경 시 reconcile 롤백 레버는 유지(의도). `galaxy100` degree-cap 브릿지 소실은 별도 태스크(김클로드 보류 동의).

**런타임**: 실제 기기에서 다일 경과 후 N/E/S/W 분포 실측 — 대표님/김경제 권장(순 함수 검증만으로는 충분하지만 장기 soak 권장).

**[kim-claude-review] 2026-07-05 world-expansion-direction-balance PASS — incremental schedule prefix · direction-balanced pick · tsc+audit+test PASS**

---

## 김팀장 검수·배정 (2026-07-05 · 아크코어 inbound publish 핫패스)

**배경**: 웨이브 전투 handoff(`wave-combat-mem-20260705`) **PASS** 후, 김클로드·김팀장 메모리 분석에 남은 **ArcCore tick→Zustand publish** 축을 김팀장이 코드 대조 검수함.

### 김팀장 검수 요약 (수정 필요 → 김클로드 배정)

| # | 항목 | 판정 | 조치 |
|---|------|------|------|
| A1 | **`ArcInboundDroneSubCore.publishCampaignSnapshot` publish key** | **수정 필요 P0** | key에 `inboundElapsedSec`(×4 floor) 포함 → **250ms마다 key 변경** → `.map({...d})` clone + `planet.tsx` 리렌더. UI측 `buildInboundDronePackSig`는 **elapsed 제외** 설계(주석 L72) — **SubCore key와 불일치** |
| A2 | **`syncRenderSnapshot` force 경로** | **확인·최소 diff** | STAGE exit/trim 시 1회 clone OK. `lastPublishedKey=null` 후 무조건 set — force 의도 유지, **sim tick 경로와 분리**만 확인 |
| A3 | **`trimArcInboundDroneCampaignsForStageExit`** | **조치 불필요** | 이미 `planetMainStageSession`·`galaxyMapStageSession` 연동 · `ArcInboundDroneSubCore.trimCampaignsForStageExit` 구현됨 |
| A4 | **`investment_tick_enabled=false`** | **조치 보류** | CSV 잠금 유지(김팀장 구조 결정 전 re-enable 금지). 60s probe early-return만 — 본 태스크 범위外 |
| A5 | **`AiNpcSubCore.publishSnapshot` 패턴** | **참조 정본** | phase·planetId·radius만 key — 연속 각도/elapsed 제외. inbound도 동일 계약 적용 |

**근거 코드**:
- `src/arcCore/subcores/ArcInboundDroneSubCore.ts` L329–345 — key에 elapsed 포함
- `src/components/planet/planetOrbitInboundDroneWorklets.ts` L72–83 — `buildInboundDronePackSig` elapsed 제외
- `src/components/planet/PlanetHubInboundDroneLayer.tsx` — worklet이 `startOrbitMs`+orbit clock으로 위치 적분 → **store elapsed 고주기 갱신 불필요**

**목표**: inbound 드론 활성 중 Zustand publish를 **phase·hp·spawn·duration·angle 변경 시에만** 발화. sim 내부 `inboundElapsedSec` 갱신(요격·dwell)은 유지.

**범위**: `src/arcCore/subcores/ArcInboundDroneSubCore.ts` (+ 필요 시 store/setSnapshot 계약 주석). **investment tick CSV·DailyOps·모니터 수정 금지.**

**완료 시**: status → `PENDING` · self-check · **git commit 금지**.

### 구현 가이드 (김클로드)

1. `publishCampaignSnapshot` key를 `buildInboundDronePackSig`와 **동일 필드**(id, phase, duration, angle, hp)로 정렬. **elapsed/dwellSec는 key 제외**.
2. phase=`inbound` 동안 sim tick은 campaign 메모리만 갱신 — publish skip 시 worklet 위치는 기존 anchor+orbit clock으로 충분한지 **PlanetHubInboundDroneLayer** 호출 경로 확인.
3. phase 전환(destroyed/impacted)·hp 변화·신규 spawn 시에는 **반드시 publish** (FX/trail 트리거).
4. 메모리 1순위: `.cursor/rules/arcfire-memory-leak-audit-first.mdc` · 틱 GC 규율(김팀장 §주기·틱).
5. `npx tsc` · `npm run audit:memory:all` · ArcCore tick 변경 시 hot-path 0 hits 확인.

---

## 김클로드 작성 (작업 종료 시 · status=`PENDING`으로 변경)

### 작업 요약
A1 지시대로 `publishCampaignSnapshot`의 key를 `buildInboundDronePackSig`(worklet 계약)와 정렬 — elapsed/dwell을 key에서 완전히 제거하고 `id·phase·duration·angle·hp`만 사용. A2는 코드 변경 없이 분리 확인만 완료. A3·A4는 배정대로 손대지 않음.

### 변경 파일
- `src/arcCore/subcores/ArcInboundDroneSubCore.ts`
  - `publishCampaignSnapshot`의 key 조합에서 `Math.floor(d.inboundElapsedSec*4)`(inbound)·`Math.round(d.inboundElapsedSec*10)`(그 외)를 제거하고 `d.inboundDurationSec.toFixed(3)`·`d.approachAngleRad.toFixed(4)`로 교체(phase 분기 불필요해져 단일 루프로 단순화). `hp`는 유지(피격 반응·HP 표기용). 신규 spawn은 기존대로 `campaign.drones.length`가 key 앞부분에 있어 그대로 감지됨.
  - `SNAPSHOT_INTERVAL_SEC=0.25`(250ms) 자체는 안 건드림 — 문제는 그 주기 자체가 아니라 그 주기마다 key가 무조건 바뀌어 스로틀이 사실상 무력화되어 있던 것(교체 전 key가 250ms마다 반드시 변경되는 구조였음). 이번 수정으로 실제 변화(phase/hp/spawn) 없으면 스킵됨.

### self-check (김클로드가 실행한 것)
- [x] `npx tsc --noEmit -p tsconfig.client.json` — clean
- [x] `npm run audit:memory:all` — memory 37/37 · skia-worklet 20/20 · worklet-contract PASS · native-reclaim 20/20 · resident-set 7/7 · **hot-path 0 hits**
- [x] inbound 드론 활성 중 publish 빈도 감소 코드 경로 — `PlanetHubInboundDroneLayer.tsx`의 `inboundPackSig`/`trailPackSig`(둘 다 `buildInboundDronePackSig` 기반, elapsed 제외)로 `packInboundDronesToFloat32`/트레일 패킹이 이미 게이트되어 있음을 확인. 다만 그 바깥의 `useLayoutEffect` 본체(스폰 anchor 등록·hit-fx 감지·prevPhase 추적·Set cleanup)는 zustand publish가 있을 때마다(구독 컴포넌트 리렌더 시) 매번 실행됐음 — 이번 SubCore key 수정으로 이 리렌더 자체가 실질 변화 시에만 발생하도록 줄어듦. worklet 위치 애니메이션은 `startOrbitMsByIdRef`(드론별 1회 캐시) + 실시간 orbit clock으로 계산되므로 publish 빈도와 무관 — 확인 완료(A2 관련 확인 사항).

### 리스크·주의 (3줄 이내)
- key에서 `hp`는 그대로 두었음 — 전투 중 매 프레임 hp가 바뀌는 상황이면 여전히 자주 publish될 수 있으나, 이건 실제 상태 변화(피격)라 스킵하면 안 되는 케이스라 의도대로 둠. 드론은 전투 유닛이 아니라 침공 오브젝트라 hp 변화 빈도 자체는 낮을 것으로 추정(요격 시 1회성 감소 위주) — 런타임 확인 권장.
- `d.inboundDurationSec`/`d.approachAngleRad`는 spawnDrone에서 1회만 설정되고 이후 안 바뀌는 것을 코드로 확인(재할당 지점 없음) — key에 넣어도 사실상 상수라 안전.
- git commit 안 함.

### 미완·보류
- 없음 — A1 구현·A2 확인 모두 완료. 런타임 실측(허브에서 드론 웨이브 진행 중 리렌더/publish 빈도 감소 체감)은 기기 필요 — 김팀장/사용자 확인 권장.

---

## 김팀장 검수 (본창 Cursor · PENDING 후)

| 항목 | 결과 |
|------|------|
| diff·계약 위반 | **PASS** — key가 `buildInboundDronePackSig`+`hp`와 정렬 · elapsed/dwell 제거 · `syncRenderSnapshot` force 경로 유지(A2) |
| audit 재실행 | **tsc PASS** · **audit:memory:all PASS** (37/37 · hot-path 0) |
| **커밋** | **김팀장만** (사용자 명시 요청 시) |
| mem-post-dev-recheck | **배정** — 김경제 handoff 갱신 |

**verdict**: `PASS`

**검수 메모**:
1. **A1** — `publishCampaignSnapshot` key에서 `inboundElapsedSec` 분기 제거 → `id·phase·duration·angle·hp` 단일 루프. 250ms tick은 유지하되 **변화 없으면 skip** — 배정 의도 일치.
2. **A2** — `syncRenderSnapshot` STAGE exit/trim force clone 경로 미변경 · sim tick publish와 분리 OK.
3. **hp in key** — 요격·피격 시 publish 필요 · 침공 드론 hp 변화 빈도 낮음(김클로드 리스크 동의).

**런타임**: inbound 웨이브 진행 중 `planet.tsx` 리렌더/publish 빈도 감소 — 사용자/김경제 실측 권장.

**[kim-claude-review] 2026-07-05 arccore-inbound-publish PASS — elapsed-free publish key · tsc+audit PASS**

---

<details>
<summary>이전 사이클 — wave-combat-mem-20260705 (2026-07-05 PASS)</summary>

| 필드 | 값 |
|------|-----|
| **task_id** | `wave-combat-mem-20260705` |
| **verdict** | `PASS` |

## 김팀장 배정 (2026-07-05 · 웨이브 전투 메모리 누적·설계 수정)

**목표**: 웨이브 디펜스(허브 전투 orbit) 구간에서 PSS/GL이 장시간 누적되어 모니터 **PSS≥950 강제 relaunch**가 발생하는 설계·회수 gap을 코드로 수정한다.  
**범위**: `src/` · `app/(game)/planet.tsx` — **모니터 스크립트(`tools/long-run-monitor/`) 수정은 본 태스크 제외** (김팀장 별도).

**완료 시**: 본 파일 **status → `PENDING`**, 변경 파일·self-check·리스크 기록 → 사용자에게 「김팀장(Cursor 본창) 검수 요청」 안내. **git commit 금지.**

---

### 1) 인시던트·분석 요약 (김팀장·김클로드 read-only 분석 통합)

#### 2026-07-05 09:10 KST — idle GL floor (김팀장 FIX_APPLIED 완료)
- PSS 967 / GL 154 / views 389 → auto relaunch → VERIFY OK
- **원인**: idle 구간 soft reclaim이 Skia sticky dodge·백드롭 remount 미연결 → GL 149MB 장시간 고착
- **조치 완료** (김팀장, working tree): `signalHubSkiaNativeReclaim` 5분 soft · postSkiaPeak + 90s followup · inbound-only drone skip
- **검수**: tsc PASS · audit:skia-memory 20/20 · audit:memory:all 37/37

#### 2026-07-05 10:12:29 KST — **웨이브 전투 중 PSS hard ceiling** (본 태스크 P0)
- **크래시 아님** — `gl_critical_active_hub` → PSS **1039.3 ≥ 950MB** → auto relaunch (pid 21199→23480)
- mem-timeline: `GL_SPIKE suspect=hub_skia_orbit_nebula_combat` · dPSS=**+247.9** · dGL=**+93.8** (15분)
- 직전: 09:56 PSS 791 → 10:12 PSS 1039 (세션 floor ~790MB + 전투 spike)
- GL 129MB · views 323 · logcat `incident-logcat-20260705-101253.log` **empty**
- 근거: `tools/long-run-monitor/logs/remediation.log` L1882–1898 · `mem-timeline.csv` L15675–15677

**판정**: idle GL gap은 부분 해결됨. **웨이브 연속 전투 세션**에서 reclaim 백스톱이 막혀 PSS가 950+까지 상승 — **구조적 설계 gap**.

---

### 2) 근본 설계 gap (김클로드가 수정할 핵심)

| # | gap | 근거 |
|---|-----|------|
| G1 | **`capitalCombatOrbitActive` 동안 5분/15분 soft·deep reclaim 전면 skip** | `planet.tsx` L707–729 — `capitalCombatOrbitActiveRef.current` 이면 return |
| G2 | **웨이브 디펜스 전체 런 동안 `enemyFleetEntered=true` 유지** → orbit이 거의 끊기지 않음 | `planet.tsx` L562–570 `waveDefenseActiveHere` OR 조건 |
| G3 | **웨이브 간 `cleared` 2.6s 구간에도 orbit active** — `battleReadyMsLeft`는 최초 진입 1회만 리셋 | `usePlanetHubBattleReady.ts` L37–48 · `useWaveDefenseController.ts` `WAVE_DEFENSE_BETWEEN_WAVE_MS=2600` |
| G4 | **`hub_combat_orbit_end` reclaim은 orbit false 전환 시에만** — 9웨이브 연속 중에는 미발화 | `planet.tsx` L657–664 |
| G5 | **`endRun` 후에도 overlay/대사 동안 `reset()` 지연** — orbit 종료·reclaim 추가 지연 | `handleWaveDefenseRunEnded` → dialog → `presentWaveResultOverlay` → `onClose`에서 `reset()` |
| G6 | **waveGenKey 재시드는 JS 버퍼만 클리어** — Skia Path pool / presentation reclaim은 wave 전환 시 미호출 | `PlanetEdenRaidTestLayer.tsx` L2646–2702 vs `runCombatSkiaPresentationReclaim` |

---

### 3) 수정 방향 (김클로드 구현 가이드 — 최소 diff · 계약 준수)

**메모리 1순위**: `.cursor/rules/arcfire-memory-leak-audit-first.mdc` · Skia `.cursor/rules/arcfire-skia-memory-lifecycle.mdc`  
**worklet**: `runOnUI(useCallback)` 금지 · dispose는 JS 클린업만 · mid-frame Canvas unmount 금지

#### A. 웨이브 간(inter-wave) reclaim 훅 (권장 P0)
- `waveDefenseStore.phase === 'cleared'` 진입 시 `schedulePlanetHubPostSkiaPeakReclaim(pid, 'hub_wave_inter_wave')` 1회
- 구현 위치 후보: `planet.tsx` (wave phase subscribe) 또는 `useWaveDefenseController` (planetId 전달 필요)
- **2.6s cleared 구간** — sim은 idle/cleared, Skia peak 종료로 간주 가능. Worklet race 회피 위해 기존 `schedulePlanetHubPostSkiaPeakReclaim` 재사용

#### B. reclaim skip 게이트 정밀화 (권장 P0)
- 5분 soft / 15분 deep skip 조건을 **`capitalCombatOrbitActive` 단독** → **`waveDefense phase === 'combat'`** 또는 **sim stepping active** 로 좁히기 검토
- cleared · countdown · ended 구간에는 soft reclaim 허용 (inbound drone flying count > 0 이면 기존 skip 유지)
- **전투 mid-frame** soft reclaim 금지 — phase 전환·cleared 타이머 경계에서만

#### C. 웨이브 run 종료 reclaim (권장 P1)
- `endRun('win'|'lose')` 직후 또는 `phase === 'ended'` 시 reclaim 스케줄 (`hub_wave_run_end`)
- overlay/dialog 전 **`active=false`** 이미 설정됨 — `enemyFleetEntered` false 전환과 reclaim 타이밍 정렬 확인
- 필요 시 `handleWaveDefenseRunEnded` **앞단**에서 경량 reclaim (대사는 유지)

#### D. waveGenKey 재시드 + Skia presentation (권장 P1)
- `PlanetEdenRaidTestLayer` wave reseed effect(L2649+) 끝에서 **`runCombatSkiaPresentationReclaim()`** 또는 등록된 pool rewind 호출 검토
- Canvas 리마운트 없이 JS/native presentation floor만 회수

#### E. 금지·범위 외
- 모니터 PSS≥950 combat hold (`check-and-remediate.ps1`) — **본 태스크 제외**
- `planetMainStageLayout` 상수 변경 금지
- 전투 sim 물리 루프 구조 대개편 금지 — reclaim·게이트만

---

### 4) 참조 파일 (우선 읽기)

| 파일 | 역할 |
|------|------|
| `app/(game)/planet.tsx` | reclaim interval · postSkiaPeak · waveDefense wiring |
| `src/game/planetHub/usePlanetHubBattleReady.ts` | `capitalCombatOrbitActive` 정의 |
| `src/game/waveDefense/useWaveDefenseController.ts` | 웨이브 phase·between-wave 2.6s |
| `src/game/waveDefense/waveDefenseStore.ts` | phase: idle/countdown/combat/cleared/ended |
| `src/game/nativeReclaim/runPlanetHubPostSkiaPeakReclaimPass.ts` | peak 종료 reclaim (김팀장 90s followup 포함) |
| `src/game/nativeReclaim/runPlanetHubSoftNativeReclaimPass.ts` | 5분 soft + signalHubSkiaNativeReclaim |
| `src/components/planet/PlanetEdenRaidTestLayer.tsx` | waveGenKey reseed · setPhase('cleared') |
| `src/game/planetCapitalCombatIntegration.tsx` | combat lazy mount (active=false unmount OK 확인됨) |

---

### 5) 수용 기준 (김클로드 self-check · 김팀장 재검수)

- [ ] 웨이브 **cleared** 구간 또는 wave 종료 시 reclaim이 **실제 코드 경로**로 연결됨 (no-op 아님)
- [ ] **combat mid-frame**에 soft reclaim이 돌지 않음 (race/SIGSEGV 방지)
- [ ] `npx tsc --noEmit -p tsconfig.client.json` PASS
- [ ] Skia/Reanimated 변경 시 `npm run audit:skia-memory` PASS
- [ ] STAGE/reclaim 변경 시 `npm run audit:memory:all` PASS
- [ ] handoff에 **변경 파일 목록** · **메모리 조사 1~3줄** · **잔여 리스크** 기록

**런타임 검증** (김팀장·사용자): vega_base 웨이브 디펜스 3웨이브+ → 웨이브 간·종료 후 GL mtrack Δ ±15MB · PSS가 950 직전까지 계단 상승하지 않음.

---

## 김클로드 작성 (작업 종료 시 · status=`PENDING`으로 변경)

### 작업 요약
배정된 G1~G6 중 A·B·D를 구현. C는 별도 코드 불필요(기존 G4 훅이 이미 처리, 근거는 아래 4번). 구현 중 **웨이브와 무관한 기존 버그(F)**를 하나 발견해 같이 고침 — combat Skia reclaim 콜백이 single-slot 레지스트리라 두 번째 등록이 첫 번째를 덮어써 Paint/PictureRecorder 캐시가 회수 경로에서 통째로 빠져 있었음.

### 변경 파일
- `app/(game)/planet.tsx`
  - `waveDefensePhase` 구독 추가 (`useWaveDefenseStore((s) => s.phase)`)
  - **A**: `prevWaveDefensePhaseRef` 신설 — `waveDefenseActiveHere`일 때 phase가 `cleared`로 전환되는 매 순간 `schedulePlanetHubPostSkiaPeakReclaim(pid, 'hub_wave_inter_wave')` 1회 발화
  - **B**: `periodicReclaimSuppressedRef` 신설 — 웨이브 세션 중엔 `phase==='combat'`일 때만 5분 soft·15분 deep 주기 reclaim을 skip, `cleared/countdown/ended`는 허용(비웨이브 전투는 기존 `capitalCombatOrbitActive` 전체 skip 그대로 유지). 두 `setInterval` 콜백의 `capitalCombatOrbitActiveRef.current` 체크를 `periodicReclaimSuppressedRef.current`로 교체
- `src/combat/combatSkiaPresentationReclaim.ts` (**F**, 신규 발견 버그 수정)
  - `registerCombatSkiaPresentationReclaim`이 단일 변수(`reclaimFn`)만 유지해 `PlanetEdenRaidOrbitSkiaCombat.tsx`의 두 번째 등록(`disposePlanetSkiaHitFxModuleCaches`)이 첫 번째(`reclaimCombatSkiaModuleCaches` — skColorCache·teamFlameTint·SK_PAINT_STROKE/FILL·thrusterFlamePaint·combatPictureRecorder)를 덮어써서, 이 파일이 존재한 이래 `runCombatSkiaPresentationReclaim()`을 호출해도 Paint/PictureRecorder 계열은 **한 번도 회수된 적이 없었음**. `Set<fn>` 기반 다중 구독으로 교체 — 등록된 모든 콜백이 실행되도록 수정. 호출부(hub soft/deep reclaim, 이번에 추가한 D)는 변경 없음
- `src/components/planet/PlanetEdenRaidTestLayer.tsx` (**D**)
  - waveGenKey 재시드 effect에서 `waveReseed`일 때만 (초기 마운트 제외) 기존 import된 `clearCapitalRealtimeCombatPresentationCaches()` 호출 추가 — F 수정 덕분에 이제 실제로 Path/Paint·hit-fx 캐시 전체가 웨이브 전환마다 회수됨

### self-check (김클로드가 실행한 것)
- [x] `npx tsc --noEmit -p tsconfig.client.json` — clean
- [x] `npm run audit:skia-memory` — 20/20 PASS
- [x] `npm run audit:memory:all` — memory 37/37 · skia-worklet 20/20 · worklet-contract PASS · native-reclaim 20/20 · resident-set 7/7 · hot-path 0 hits, 전체 PASS

### 리스크·주의 (3줄 이내)
- **F(레지스트리 버그) 수정으로 이번에 처음 실제로 도는 dispose 경로**라 런타임 실측(웨이브 3+ 진행 중 GL mtrack)에서 예상보다 큰 폭 하락이 나올 수 있음 — 회귀 아니라 그동안 안 돌던 회수가 정상 작동하는 것.
- B의 skip 조건은 `waveDefenseActiveHere` 세션에만 좁혔고, 일반(비웨이브) capitalCombatOrbitActive 전투 경로는 전혀 손대지 않음 — 그쪽 회귀 없음.
- git commit 안 함. F는 배정 범위(`src/`) 안이지만 wave-defense 전용 파일은 아니므로 diff 검수 시 별도로 표시해둠.

### 미완·보류
- C(웨이브 run 종료 reclaim)는 별도 구현 안 함: `endRun()`이 `active:false`를 즉시 세팅 → `enemyFleetEntered`→`capitalCombatOrbitActive` false 전환 → 기존 G4 `hub_combat_orbit_end` 훅(`planet.tsx` L657대)이 이미 발화함. `handleWaveDefenseRunEnded`/`reset()` 지연(G5)은 이 reclaim 발화 타이밍에 영향 없음(리스너들은 값 세팅 순간 반응, 대사창 표시와 무관) — 별도 확인만 하고 코드 추가 안 함.
- 런타임 실측(vega_base 웨이브 3+, GL mtrack Δ, PSS 950 근접 여부)은 기기 필요 — 김팀장/사용자 확인 요청.

---

## 김팀장 검수 (본창 Cursor · status=`REVIEWED` 후 `IDLE`로)

| 항목 | 결과 |
|------|------|
| diff·계약 위반 | **PASS** — A·B·D·F 모두 배정 의도 일치 · worklet/Skia 루프 mid-frame reclaim 없음 · layout 상수 미변경 |
| audit 재실행 | **tsc PASS** · **audit:skia-memory 20/20** · **audit:memory:all PASS** (37/37 · worklet · native-reclaim · hot-path 0) |
| G4/C (run 종료) | **PASS** — `endRun`→`active:false`→`hub_combat_orbit_end` 기존 훅으로 충분 (별도 코드 불필요 동의) |
| **F (레지스트리 버그)** | **PASS** — `PlanetEdenRaidOrbitSkiaCombat` module-level 2등록 모두 `Set` 순회 확인 · hub reclaim·wave reseed 경로 실효 |
| **커밋** | **김팀장만** (사용자 명시 요청 시) |
| mem-post-dev-recheck | **배정** — 김경제 handoff `[mem-post-dev-recheck]` 갱신 |

**verdict**: `PASS`

**검수 메모**:
1. **A** `hub_wave_inter_wave` — `phase→cleared` edge만 발화 · `waveDefenseActiveHere`·routeFocused 게이트 OK · `schedulePlanetHubPostSkiaPeakReclaim` 재사용(Worklet race 회피).
2. **B** `periodicReclaimSuppressedRef` — 웨이브 세션=`combat`만 skip · cleared/countdown/ended에서 5/15분 soft·deep 허용 · 비웨이브는 `capitalCombatOrbitActive` 유지.
3. **D** waveGenKey reseed 시 `clearCapitalRealtimeCombatPresentationCaches()` — F 수정 후 실제 Paint/Path pool 회수 연결됨.
4. **F** 단일-slot 덮어쓰기 버그 — 그동안 hub soft/deep·postSkiaPeak의 `runCombatSkiaPresentationReclaim()`이 hit-fx 쪽만 실행됐을 가능성 높음 · 이번 수정이 10:12급 누적의 **잠재 2차 원인** 제거.

**잔여 (런타임)**:
- vega_base 웨이브 3+ · GL mtrack Δ ±15MB · PSS 950 근접 여부 — **사용자/김경제 실측 대기**
- 모니터 PSS≥950 combat hold — **범위 외** (김팀장 별도)

**[kim-claude-review] 2026-07-05 wave-combat-mem PASS — inter-wave reclaim · phase-gated periodic · reclaim registry fix · tsc+audit PASS · GL mtrack 실측 대기**

</details>

---

<details>
<summary>이전 사이클 (2026-07-05 idle GL · 2026-07-04 safe-scope) — 참고</summary>

### idle GL floor FIX_APPLIED (김팀장 2026-07-05)
1. `runPlanetHubSoftNativeReclaimPass` — 5분 `signalHubSkiaNativeReclaim`
2. `runPlanetHubPostSkiaPeakReclaimPass` — peak 후 backdrop remount + 90s followup
3. `planet.tsx` — inbound-only drone skip (`arcInboundFlyingDroneCount`)

**verdict**: FIX_APPLIED · tsc+skia-memory PASS · GL mtrack 실측 대기

### 2026-07-04 safe-scope PASS
`_layout.tsx` 들여쓰기 · `investment_tick_enabled=false` · balance-tables 재빌드

</details>
