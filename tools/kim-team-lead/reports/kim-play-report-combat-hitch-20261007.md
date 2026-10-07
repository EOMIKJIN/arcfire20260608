# 김플레이 → 김팀장 보고 — 전투 중 수 초 간격 「탁탁」 끊김 (코드 전수 조사)

- **작성**: 김플레이 · 2026-10-07
- **지시**: 대표님 「이동중 전투·웨이브 전투에서 FPS는 30 이상인데, 몇 초 간격으로 전함 마크 이동과 전투가 순간적으로 끊긴다. 코드상 전수 정밀 조사 후 김팀장에게 보고」
- **범위**: 조사·보고만. **코드 수정 없음.** 전투 틱·Skia는 `HOLD_WAVE_COMBAT_FPS_20260918.md` HOLD 대상이라 수정 여부·순서는 김팀장·대표님 판단.
- **status**: `REVIEWED` (김팀장 2026-10-07 12:53 · §6~§11 검수 · 리스크 2건은 김클로드 `combat-hitch-review-risks-20261007`) · 이전 PENDING은 §10 검수 대기였음

## verdict (김팀장)

분석은 코드와 맞다. 반영한 것:

- R4 — 격추 저장은 1.5초로 묶고, 전투 시작·종료에서만 바로 쓴다. 계정 초기화는 대기 타이머를 끊는다.
- R1 — 미사일 궤적 점과 반환 객체를 재사용하고, 기록용 rect는 크기만 갱신한다. SkPicture 수동 dispose는 넣지 않았다.
- R5 — 웨이브 `active` 동안 수송 스냅샷 발행을 건너뛴다. 교전이 끝나면 다음 250ms에 한 번 반영한다.
- 진단 — 개발 빌드에서 240ms 창의 최장 프레임이 50ms 이상이면 `[combat-hitch] longFrameMs` 한 줄.

보류:

- R2 33ms 클램프는 그대로다. 풀면 멈춤이 점프로 바뀌므로 대표님 확인 전 바꾸지 않는다.
- R3 HUD에 최장 프레임 숫자를 상시 그리지는 않았다. 로그로만 본다.
- R6 두 번째 Picture, R7 게임 루프 정지는 이번 패치에 넣지 않았다.

---

## 0. 결론 (요약)

평균 FPS는 정상인데 **가끔 한 프레임이 100ms 안팎으로 길어지는 현상**이다. 원인은 한 가지가 아니라 겹친다.

1. **주 원인 (이동·웨이브 공통)** — 전투 궤도 렌더가 **매 프레임 새 SkPicture + 새 XYWHRect(네이티브 객체)** 를 만들고, 수동 해제가 금지돼 있어 **Hermes GC·Finalizer가 몰아서 회수**한다. 여기에 미사일 궤적 경로가 **프레임마다 수백 개의 `{x,y}` 객체**를 만든다. 회수가 몇 초마다 한 번에 일어나며 JS 스레드가 멈춘다. 코드에도 이미 「3~5초 주기 Hermes/Finalizer」라는 주석이 남아 있다.
2. **증폭기 (공통)** — 시뮬 루프가 프레임 시간을 **33ms로 자른다**. JS가 100ms 멈추면 시뮬은 33ms만 진행하고 나머지는 버려진다. 그래서 끊김이 「건너뜀」이 아니라 **「정지」** 로 보인다.
3. **FPS 표시가 끊김을 숨긴다** — HUD FPS는 240ms 이상 구간 평균이라 100ms 한 프레임은 숫자에 거의 안 잡힌다. 「30fps 이상인데 끊긴다」는 체감과 일치한다.
4. **격추마다 동기 작업 (공통)** — 격추 1회마다 NPC 함장 진행 **전체 레코드 JSON 직렬화 + AsyncStorage 저장**을 즉시 한다. 이동 전투는 플레이어 격추 시 `combat.tsx` 전체 리렌더까지 붙는다.
5. **웨이브 전용** — 허브 `planet.tsx`가 전투 중에도 살아 있고, NPC 수송선 phase가 바뀔 때마다(12척 → 수 초 간격) **`planet.tsx` 전체 리렌더**가 일어난다.

---

## 1. 원인 순위 (근거 file:line · 모두 직접 확인)

### R1. 매 프레임 SkPicture 생성 + Finalizer 전용 회수 — 공통 · 최유력

| 근거 | 내용 |
|---|---|
| `src/components/planet/PlanetEdenRaidOrbitSkiaCombat.tsx:781-782` | 매 기록마다 `recorder.beginRecording(Skia.XYWHRect(0,0,orbitSize,orbitSize))` — **XYWHRect 네이티브 객체 매 프레임 신규** (recorder 자체는 재사용) |
| 같은 파일 `:1048` | `recorder.finishRecordingAsPicture()` — **SkPicture 매 프레임 신규** |
| 같은 파일 `:1129-1145` | 시뮬 postStep마다 `pushFrame` → 다음 rAF에서 `flushPictureToReact` → `setPicture` (매 프레임 React 커밋) |
| `src/game/skia/skiaMemoryLifecycle.ts:25-60` | `scheduleSkPictureDispose`는 no-op. 2026-07-22 FinalizerDaemon SIGSEGV 이후 **수동 dispose 금지** → 회수는 GC Finalizer에만 의존 |
| `src/combat/transitCombatParallaxPlan.ts:31-38` | 기존 주석: 「120ms Picture+setState가 60Hz 궤도 Picture와 겹쳐 **Hermes/Finalizer 3~5초 주기**」 → 그래서 320ms 커밋 하한을 둠. **같은 현상이 궤도 Picture 단독으로도 남아 있다**는 뜻 |

**JS 쓰레기 (GC 주기를 앞당김)**:

- `PlanetEdenRaidOrbitSkiaCombat.tsx:448-513` `makeMissileTrailPath` — 미사일 1발당 `quadBezier`를 n+2회 호출하고, 호출마다 새 `{x,y}`를 만든다. 반환값도 새 객체다. 미사일 수 × 세그먼트 수만큼 **매 프레임 수백 개**.
- `:1187-1259` — 렌더마다 아군 라벨 `<View><Text>`와 **인라인 style 배열·transform 객체**를 새로 만든다. 매 프레임 React reconcile과 네이티브 뷰 prop 갱신이 일어난다 (아군 수만큼).

### R2. 33ms dt 클램프 — 끊김을 「정지」로 바꾸는 증폭기 · 공통

- `src/components/planet/PlanetEdenRaidTestLayer.tsx:3216-3219` — `const dt = Math.min(33, rawDt);`
- JS가 120ms 멈추면 시뮬은 33ms만 전진한다. 함선·미사일이 **그 자리에 멈췄다가** 다시 움직인다. 대표님 체감 「마크 이동과 전투가 탁탁 끊김」과 정확히 일치.
- 이것만 고치면 끊김은 「살짝 점프」로 바뀌지만 **멈춤 자체는 남는다.** 근본은 R1·R3·R4.

### R3. FPS 측정이 평균이라 스파이크를 못 본다 · 진단 문제

- `PlanetEdenRaidTestLayer.tsx:4033-4040` — 샘플 20개 이상이고 240ms 이상 지났을 때 평균만 갱신한다.
- 이번 증상은 **평균 FPS가 아니라 최장 프레임(rawDt 최대값)** 으로 봐야 잡힌다.

### R4. 격추 1회마다 동기 직렬화·저장 · 공통

- `PlanetEdenRaidTestLayer.tsx:2173-2179` `finalizeShipDestroyed` — `owner.captainId`가 있으면 (적·아군 불문) `grantCaptainDelta` 후 **즉시** `void s.persistNpcCaptainProgress()`.
- `src/store/npcCaptainProgressStore.ts:126-132` — `JSON.stringify({ records })` 로 **함장 전체 레코드** 직렬화 + `AsyncStorage.setItem`. 디바운스 없음. `dirty` 플래그는 있으나 격추마다 다시 켜진다.
- `npcCaptainProgressStore.ts:158-171` — 격추마다 `records` 전체 얕은 복사 + zustand `set`.
- 웨이브는 격추가 1~수 초 간격이라 **「몇 초 간격」 주기와 맞는다.**
- 클라우드 동기(`userCloudSyncSchedule.ts`)는 최소 120초 간격이라 이번 주기와는 무관.
- **이동 전투 추가분**: `TestLayer:2165-2170` 플레이어 격추마다 `addExp` → `playerStore.ts:1034` `set({ player: 새 객체 })` → `app/(game)/combat.tsx:99` `usePlayerStore(s => s.player)` 구독 때문에 **`combat.tsx` 전체 리렌더**. 웨이브는 `addExp`를 건너뛰므로 해당 없음.

### R5. 웨이브 전용 — 전투 중 허브 `planet.tsx` 리렌더

- `src/arcCore/subcores/AiNpcSubCore.ts:62-75, 241-311` — 250ms마다 구조 키 문자열을 만들고, phase·행성·반경이 바뀌면 `useArcNpcTrafficStore.setSnapshot`.
- `app/(game)/planet.tsx:658-659` — `captains`·`ships` 구독. 수송선 12척이 진입·체류·이탈을 반복하므로 **phase 변경이 수 초 간격**이다. 그때마다 거대한 `planet.tsx`가 리렌더된다. **웨이브 전투 중에도 멈추지 않는다.**
- 같은 위치 4Hz 키 문자열 생성은 소량의 GC 쓰레기다.

### R6. 두 번째 Picture Canvas — 모드별

- **이동 전투**: `TransitCombatSkiaParallaxBackdrop` 틱 120ms·커밋 ≥320ms (`transitCombatParallaxPlan.ts`) → 초당 약 3장의 추가 SkPicture가 같은 Finalizer 큐에 쌓인다.
- **웨이브**: 허브 성운 `SkiaPlanetNebulaShaderBackdrop` dodge 폴링 200ms (FX 활성 시 50ms). 서브에이전트 조사 결과이며 **줄 번호는 재확인 권장** (`:265-312` 보고).

### R7. 전투와 무관하게 계속 도는 JS 작업 · 공통 · 보조

- `src/engine/GameLoop.ts:35-46` — 전투 시뮬 rAF와 **별도의 두 번째 rAF**가 매 프레임 `arcCoreHub` 전 서브코어·프로세스 `_advanceWallClock` 을 돈다 (`ArcCoreHub.ts:131-138`). 전투 중 일시정지 없음.
- `src/arcCore/subcores/ArcCoreSpySubCore.ts:99` — 그 행성에 스파이가 있으면 **매 프레임** `spyIds.join(',')` 문자열을 새로 만든다. 펄스(정책 주기, 약 8초)마다 `applyPlanetAttackCoreDamage` → `planetCoreRuntimeStore` 1.5초 코얼레싱 후 **전 행성 `JSON.stringify`** (`planetCoreRuntimeStore.ts:318`). 스파이 있는 행성에서만 발생.
- `PlanetEdenRaidTestLayer.tsx:4271-4292` — HUD 120ms 타이머. 일정 stride마다 `buildCombatHudLogSnapshot`이 문자열을 만든다. **로그 접힘 상태여도** 만든다.
- `app/(game)/planet.tsx:918-934` — 2초마다 시설 7종 완료 체크. 진행 중 작업이 없으면 가볍다 (낮음).

---

## 2. 모드별 정리

| 원인 | 이동 전투 | 웨이브 전투 |
|---|---|---|
| R1 매 프레임 Picture·JS 쓰레기 | O | O |
| R2 33ms 클램프 (정지로 보임) | O | O |
| R4 격추마다 함장 진행 저장 | O | O (격추 잦음 → 더 큼) |
| R4 `addExp` → `combat.tsx` 리렌더 | O | X |
| R5 `planet.tsx` 리렌더 | X | O |
| R6 두 번째 Picture Canvas | 시차 배경 | 허브 성운 dodge |
| R7 gameLoop·스파이·HUD | O | O |

---

## 3. 수정 방향 제안 (김팀장 판단용 · 1안 순서)

HOLD 문서의 1안(기록 경로 Zero-Alloc)과 같은 방향이다. 재지시가 있을 때 아래 순서를 권한다.

1. **먼저 계측 (DEV 전용, 동작 변경 없음)** — 시뮬 루프에서 `rawDt > 50ms`인 프레임을 시각·직전 이벤트(격추·publish·persist)와 함께 기록한다. 원인 R1 vs R4 vs R5 비중을 실측으로 확정한다. Perfetto로 `FinalizerDaemon`·Hermes GC 구간을 겹쳐 보면 R1이 바로 판정된다.
2. **R4 격추 저장 코얼레싱** — 격추 때는 `grantCaptainDelta`만 하고 저장은 **전투 종료 1회** 또는 1.5초 디바운스로 묶는다 (`createFactionVaultStore`·planetCore와 같은 패턴). 가장 작고 안전한 수정이다.
3. **R1 JS 쓰레기 제거** — `quadBezier`에 출력 scratch를 넘기고, `makeMissileTrailPath` 반환 객체를 재사용한다. `beginRecording`용 rect를 사전 할당한다 (`_thrusterSrcRect`와 같은 패턴). 라벨 style 객체를 줄인다. SkPicture 자체는 불변 객체라 재사용이 안 된다. 프레임당 1장은 남으므로 **나머지 쓰레기를 줄여 GC 주기·길이를 줄이는 것**이 현실적이다.
4. **R5 전투 중 허브 리렌더 차단** — `capitalCombatOrbitActive` 동안 NPC 스냅샷 publish를 보류했다가 종료 시 1회 반영한다. 또는 `planet.tsx` 구독을 전투 중 고정한다.
5. **R2 클램프 재검토** — 멈춤 대신 따라잡기(예: 상한 100ms를 33ms 서브스텝으로 나눔)로 바꿀지는 **체감 정책 결정**이다. 대표님 확인 사항.
6. **R3 HUD** — FPS 옆에 최근 2초 최장 프레임(ms)을 함께 표시하면 이후 검증이 쉬워진다 (DEV).

**게이트 (수정 시)**: `audit:skia-memory` · `audit:worklet-contract` · `tsc` · GL mtrack Δ ±15MB. Picture 수동 dispose 재도입은 **금지 유지** (SIGSEGV 이력).

---

## 4. 검증 방법 (실기)

- 재현: 이동 전투 1회, 웨이브 1~3웨이브. 각 2분.
- `adb logcat` 에서 위 1번 DEV 계측 로그로 long frame 시각을 수집하고, 격추·publish 시각과 겹치는지 본다.
- 수정 전후 **long frame(>50ms) 횟수/분** 비교. 평균 FPS는 판정 기준으로 쓰지 않는다.

## 5. 조사 한계

- 실기 프로파일 없이 코드만으로 판단했다. R1은 기존 주석·구조로 확신도가 높다. R4·R5의 비중은 계측 전까지 추정이다.
- R6 허브 성운 dodge 폴링 줄 번호, 결투 결과 폴링(`useCapitalRealtimeDuelOutcome.ts` 90ms)과 `CombatStanceRow` 250ms 는 서브에이전트 보고 기준이며 본인 재확인 전이다.
- 김플레이는 게임 본체를 수정하지 않는다. 위 수정은 전부 김팀장 영역이다.

---

## 6. 대표님 결정 (10:17) · 실시간 협의 기록

**대표님**: 「기본적인 해결방법으로 해결 후, 상태를 보고 판단하자. 김팀장 작업 중이니 실시간 협의하며 수정하고, 끝나면 재검수.」

- **R2 33ms 클램프는 손대지 않는다.** 기본 해결 후 실기 상태를 보고 대표님이 판단.
- 김팀장이 10:14~10:16에 기본 해결을 이미 반영했다. 김플레이는 **중복 수정하지 않고** 검수했다.

### 6-1. 김팀장 반영분 검수 (김플레이 · 10:24)

| 항목 | 파일 | 판정 |
|---|---|---|
| 격추 저장 1.5초 묶기 + 전투 시작·종료 flush | `npcCaptainProgressStore.ts` · `TestLayer:2184, 3055, 3371` | PASS. 저장 중 새 격추는 `dirty` 재확인으로 다시 예약됨. 초기화 시 타이머 해제 OK. (참고: `setItem` 실패 시 그 회차 dirty가 사라짐 — 낮음, 기존과 비슷) |
| 궤적 좌표·결과 객체 재사용 (`writeQuadBezier` · `TRAIL_OUT`) | `PlanetEdenRaidOrbitSkiaCombat.tsx:204-528` | PASS. 결과는 같은 반복(822~919) 안에서만 읽음 → 공유 객체 안전 |
| 기록 rect 사전 할당 (`_recordRect.setXYWH`) | 같은 파일 `:797-799` · reclaim `:693` | PASS. 기존 `_thrusterSrcRect`와 같은 패턴 |
| 웨이브 중 NPC 스냅샷 발행 보류 | `AiNpcSubCore.ts:241-254` | **조건부 PASS → 김플레이 보강 1건(아래)**. 행성 이탈·전환 시 `useWaveDefenseController:87-90` 정리에서 `reset` → 영구 정지 없음 확인 |
| DEV 긴 프레임 로그 `[combat-hitch] longFrameMs` | `TestLayer:3213, 3226, 4047-4051` | PASS. `__DEV__` 한정 · 할당 없음 |

### 6-2. 김플레이 보강 (협의 · 김팀장 확인 요청)

- **문제**: 웨이브 중 발행이 멈추면 store 함선 객체는 옛 phase로 남는다. 그런데 `syncLivePhaseElapsedToPublishedShips`는 매 프레임 **새 phase의 경과초**를 그 객체에 덮어쓴다. 허브 궤도 트래픽은 웨이브 중에도 배경(`PlanetStageBackground`)에 그려진다. 그래서 다른 이유(근처 표 행·정보 행 변경)로 재-pack이 일어나면 진입을 마친 배가 **가장자리로 되돌아가 다시 진입하는 튐**이 생긴다.
- **수정 (`AiNpcSubCore.ts:349-350`, 2줄)**: published 쪽 `phase`·`planetId`가 live와 다르면 경과초를 쓰지 않는다. worklet은 `phaseP`를 1로 막으므로(`planetOrbitHubWorklets.ts:54`) 경과초가 멈춰 있어도 끝 위치에서 자연스럽게 머문다. 웨이브가 끝나면 다음 250ms 발행이 한 번에 맞춘다.
- `[pss-pre-dev] hot_path=매 프레임 alloc=0 risk=P1 verdict=PASS`

### 6-3. 아직 남은 항목 (김팀장 판단 · 기본 해결 범위 밖일 수 있음)

| 항목 | 위치 | 비고 |
|---|---|---|
| 아군 라벨 RN 노드·style 객체 매 프레임 재생성 | `PlanetEdenRaidOrbitSkiaCombat.tsx` 라벨 블록 | 아군 수만큼. 실기 longFrame 로그 보고 결정 권장 |
| 이동 전투: 격추마다 `addExp` → `combat.tsx` 전체 리렌더 | `TestLayer` `finalizeShipDestroyed` · `combat.tsx:99` | 웨이브는 해당 없음 |
| 스파이 있는 행성: 매 프레임 `spyIds.join(',')` | `ArcCoreSpySubCore.ts:99` | 스파이 있을 때만 |
| HUD 로그 접힘 상태에서도 문자열 생성 | `TestLayer:4280-4290` | 낮음 |

### 6-4. 게이트 (10:24 · 김팀장 반영분 + 김플레이 보강 합산)

`tsc -p tsconfig.client.json` PASS · `audit:skia-memory` 31/31 · `audit:worklet-contract` 7/7 · `audit:memory:all` (hot-path hits=0) PASS. GL mtrack 실측과 실기 longFrame 로그는 미실시.

### 6-5. 다음 단계

1. 실기에서 이동 전투 1회, 웨이브 1~3웨이브 플레이 후 Metro 로그 `[combat-hitch] longFrameMs` 를 수집한다 (김팀장 반영분은 JS만이라 **앱 리로드 `r`** 로 충분).
2. 50ms 이상 긴 프레임이 여전히 주기적이면 6-3 라벨 항목, 그다음 R2 클램프 정책을 대표님께 다시 묻는다.
3. 김팀장이 6-3을 추가 반영하면 김플레이가 재검수한다.

**status**: `PENDING` (김팀장 — 6-2 보강 확인 · 6-3 착수 여부)

---

## 7. 최종 재검수 (김플레이 · 11:31 · 대표님 「김팀장 작업 끝 · 검수 후 판단」)

**목표 (대표님)**: 전투 **중** 이동 애니메이션·전투 진행에 비주얼 끊김이 없어야 한다. 시작·종료 시점의 처리 렉은 용인한다.

- 10:24 이후 `src/`·`app/` 코드 변경 없음, 커밋 없음 → 김팀장 최종분 = 6-1에서 검수한 반영분 + 6-2 보강.
- 게이트 재확인: 6-4와 동일 (tsc · skia 31/31 · worklet 7/7 · hot-path 0).

### 7-1. 판정: **부분 달성 — 목표 달성 미확정**

반영분은 「몇 초 간격」 끊김의 큰 원인 두 개(R4 격추 저장, R5 웨이브 중 허브 리렌더)를 직접 제거했다. R1 JS 쓰레기도 줄였다. 하지만 아래 전투 **중** 원인이 남아 있어 「끊김 없음」이라고 판정할 수 없다. 실기 `[combat-hitch]` 로그도 아직 없다.

### 7-2. 이번 재검수에서 새로 찾은 전투 중 원인

| # | 원인 | 근거 | 영향 | 수정 난이도 |
|---|---|---|---|---|
| N1 | **전투 중 3분마다 렌더 캐시 전량 폐기** | `planet.tsx:1108-1125` → `runPlanetHubCombatSafeReclaimPass.ts:27-31` → `runCombatSkiaPresentationReclaim` → `PlanetEdenRaidOrbitSkiaCombat.tsx:677-694` (색 캐시·scratch Paint·recorder·rect 폐기) + Fresco trim + 성운 LRU prune | **웨이브** 진행 중 3분마다 1회. 다음 프레임이 Paint·recorder·색 파싱(JSI)을 전부 다시 만든다. 이 캐시들은 크기가 고정이라 회수 이득이 거의 없다 | 낮음 — 전투 궤도가 살아 있는 동안에는 전투 렌더 캐시 폐기를 건너뛴다 |
| N2 | **VFX 예산이 FPS 30 기준선에서 켜졌다 꺼졌다 함** | `PlanetEdenRaidOrbitSkiaCombat.tsx:280-322` `resolveCombatOrbitVfxBudget` — `fpsNow < 30`이면 레이저 글로우 OFF·궤적 세그먼트 75%, 히스테리시스 없음. `fpsRef`는 240ms마다 갱신 | 대표님 실측 「30fps 이상」 근처에서 240ms 단위로 **레이저 글로우가 깜빡이고 궤적 해상도가 바뀐다** → 「탁탁」 체감에 섞일 수 있음 | 낮음 — 내려갈 때 30 미만, 올라올 때 34 이상 등 상태 유지형으로 |
| N3 | 웨이브: 성운 dodge Picture가 피격 FX 동안 **50ms(20Hz)** 로 추가 커밋 | `SkiaPlanetNebulaShaderBackdrop.tsx:27, 270-296` | 궤도 Picture 60장/초에 20장/초가 더해져 Finalizer 큐 +33% | 중간 — 궤도 Picture에 dodge를 합치거나 커밋 간격 상향 |

### 7-3. 6-3에서 이월 (여전히 남음)

| 항목 | 모드 | 비고 |
|---|---|---|
| 아군 라벨 RN 노드·style 객체 매 프레임 재생성 (`:1187-1259` 블록) | 공통 | 매 프레임 React reconcile + 네이티브 prop 갱신 |
| 레이저 발사 중 함선마다 매 프레임 객체 4개 (`buildLaserBolt` · `clampPointToward` · `laserMuzzleFromAgent`) · VFX 예산 객체 1개 | 공통 | GC 쓰레기. N2 수정 시 예산 객체 3개를 상수로 두면 함께 해결 |
| 플레이어 격추마다 `addExp` → `combat.tsx` 전체 리렌더 | 이동 | `combat.tsx:99` `s.player` 구독 |
| 스파이 행성 매 프레임 `spyIds.join(',')` | 공통 | 스파이 있을 때만 |

### 7-4. 구조 한계 (HOLD 범위 · 수정 후에도 남음)

- 매 프레임 SkPicture 1장 + React `setPicture` + Finalizer 회수 구조(R1)는 그대로다. 쓰레기를 줄이면 GC 정지가 짧아지고 드물어지지만 **0이 되지는 않는다.** 그래도 끊김이 남으면 다음 단계는 렌더 경로 구조 변경(HOLD 해제 필요)이다.
- R2 33ms 클램프: 위 수정 후 실측을 보고 대표님 판단.

### 7-5. 권장 순서

1. **N1·N2 즉시 수정** (작고 안전, 전투 중 끊김에 직접 해당)
2. 라벨 블록 · 레이저 객체 · `combat.tsx` 리렌더 정리
3. **릴리즈 빌드**로 실측: 이동 전투 1회 + 웨이브 3웨이브. 디버그 빌드는 JS가 몇 배 느려 판정 기준으로 쓰지 않는다. 판정용으로는 `[combat-hitch]` 로그를 릴리즈에서도 볼 수 있게 할지 김팀장이 결정해야 한다 (현재 `__DEV__` 한정).
4. 50ms 이상 긴 프레임이 분당 1회 이하이면 목표 달성. 그 이상이면 N3 → R2 → 구조 변경 순으로 대표님께 상정.

### 7-6. N1·N2 수정 (김플레이 · 대표님 지시 「김플레이가 바로 수정 후 인계」)

**N1 재확인 — 생각보다 컸다**: `runCombatSkiaPresentationReclaim`은 첫 줄에서 `invalidateAllSkPictureFrames()`를 부른다. 웨이브 3분 주기 정리 때 **전투 Picture가 null이 되어 한 프레임 빈 화면**이 되고, 성운 dodge Picture도 함께 버려진다. 이어서 Paint·recorder·색 캐시와 피격 FX maskfilter·Paint(`planetSkiaHitFxContract.ts:116-136`)를 전부 다시 만든다.

| 파일 | 변경 |
|---|---|
| `src/combat/combatSkiaPresentationReclaim.ts` | `markCombatOrbitPresenting()` (마운트 카운트, 해제 함수 반환·중복 해제 방지) · `isCombatOrbitPresenting()` 추가 |
| `src/components/planet/PlanetEdenRaidOrbitSkiaCombat.tsx` | GPU 레이어 등록 effect에서 마운트 시 표시 등록·VFX 단계 초기화, 언마운트 시 해제. 언마운트 정리(16ms 뒤 `reclaimCombatSkiaModuleCaches`)는 그대로 |
| `src/game/nativeReclaim/runPlanetHubCombatSafeReclaimPass.ts` | 전투 궤도가 화면에 있으면 `runCombatSkiaPresentationReclaim` 건너뜀. Fresco trim·성운 LRU·memo shell 정리는 그대로. 전투 시작 전 호출(`runPlanetHubPreCombatReclaimPass`)은 마운트 전이라 그대로 회수 |
| 같은 파일 (N2) | `resolveCombatOrbitVfxBudget` — 미사일 축(진입 28/40, 복귀 24 미만/34 미만)·fps 축(진입 30 미만/25 미만, 복귀 34 이상/28 이상)을 따로 유지하고 큰 단계를 쓴다. 반환은 고정 객체 3개(`Object.freeze`) → 매 프레임 객체 할당 0. 기존 진입 임계·단계별 값은 그대로 |

- `planet.tsx`는 건드리지 않았다.
- `[pss-pre-dev] hot_path=VFX 예산 매 프레임(할당 0) · 3분 패스 카운터 조회 alloc=0 cache=전투 표시 중 렌더 캐시 유지(고정 크기)·언마운트 회수 risk=P1,P7 verdict=PASS`
- 게이트: `tsc` PASS · `audit:skia-memory` 31/31 · `audit:worklet-contract` PASS · `audit:memory:all` PASS (native-reclaim 20/20 · resident-set 7/7 · hot-path 0). GL mtrack·실기 미측정.
- 반영: JS만 → **앱 리로드 `r`**.

### 7-7. 남은 것 (김팀장)

7-3 이월 항목 (아군 라벨 블록 · 레이저 객체 · `combat.tsx` 리렌더 · 스파이 join)과 N3 (성운 dodge 20Hz Picture), 그리고 R2 33ms 클램프 판단은 실측 후에 한다.

**status (7절 시점)**: `PENDING` (김팀장 — 6-2·7-6 김플레이 수정 검수 · 7-7 착수 여부)

---

## 8. 이동중 전투 핵심 재파악 (김플레이 · 대표님 「이동중 전투가 큰 원인 포인트. 웨이브도 없고 파괴도 없다」)

격추 저장(R4)·웨이브 발행(R5)·N1 웨이브 주기 회수는 **이동중 전투에 해당 없음**. 이동중 전투에서 실제로 도는 일만 다시 셌다.

### 8-1. 배제

| 후보 | 결과 | 근거 |
|---|---|---|
| worldmap 잔존 | 없음 | `worldmap.tsx:549` `router.replace('/(game)/combat')` |
| 인바운드 드론 서브코어 | 이동 중 정지 | `ArcInboundDroneSubCore` — 허브 브리지 `simActive`/`renderEligible` 게이트 |
| 행성개발 감시 | 주기 아님 | `planetDevJobRealtimeWatch.ts:133-160` 완료 시각 1회 `setTimeout` |
| 클라우드 동기 | 최소 120초 | `userCloudSyncSchedule.ts` |
| 패럴랙스 배경 별·구름 이동 | 계단 안 보임 | 구름 1.15~1.7px/s · 별 0.28px/s (`transitCombatParallaxPlan.ts:31-46`) → 320ms당 0.5px 남짓 |

### 8-2. 핵심 (1순위) — 매 프레임 SkPicture가 GC 때 한꺼번에 해제됨

- 궤도 렌더는 시뮬 스텝마다 `recordCombatOrbitPicture` → 다음 rAF에 `setPicture(next)` (`PlanetEdenRaidOrbitSkiaCombat.tsx:1187-1202`, `skiaMemoryLifecycle.ts:53-60`). **초당 약 60개 Picture 호스트 객체**. 이동중 전투도 같은 시뮬 엔진(`combat.tsx:4` · `PlanetEdenRaidTestLayer`)이다.
- 옛 Picture는 수동 dispose 금지(SIGSEGV 이력)라 **Hermes GC가 걷을 때까지 네이티브 메모리를 쥔다**.
- RN Skia **1.2.3**은 Picture 네이티브 크기를 Hermes에 알리지 않는다 (`node_modules/@shopify/react-native-skia/cpp`에 external memory 보고 없음). 그래서 GC는 JS 할당량에만 맞춰 돌고, 돌 때 **쌓인 Picture finalizer가 한 번에** 실행된다.
- 시뮬 rAF가 JS 스레드라 그 순간 **전함 마크·전투가 같이 멈춘다** (`dt = min(33, rawDt)`라 멈춘 시간은 버려짐).
- 이미 같은 증상을 코드가 기록하고 있다: `transitCombatParallaxPlan.ts:35` 「궤도 전투 Picture(60Hz)와 겹쳐 Hermes/Finalizer가 3~5초 주기로 걷는다」. 당시 조치는 **배경 Picture만 320ms로 줄였고**, 60Hz 궤도 Picture는 그대로다.
- 이동중 전투가 더 심한 이유(추정): 같은 엔진 위에 **풀스크린 두 번째 Skia 캔버스**(768px 베이크 + Screen 블렌드 구름 3장 + 별 52개, 네이티브 그리기는 UI 스레드)가 얹혀 Picture가 하나 더 돈다. 웨이브·파괴가 없어도 둘 다 항상 돈다.
- 그 밖에 매 프레임 JS 쓰레기(라벨 `<View><Text>` 재생성 `:1246-1316`, 레코딩 캔버스 호스트 객체)가 GC 주기를 앞당긴다.

### 8-3. 2순위 — AiNpc 4~6초 위상 전환

`AiNpcSubCore` 진입 4.2~5.8s · 출발 4~5.6s · 체류 종료 시 `economy_transport_dwell_settled` → `settleArcTransportDwellTrade`(비동기, 내부 동기 덩어리 + persist). 이동 중에도 전역 `GameLoop`로 돈다. 주기가 「몇 초」와 겹치므로 실측에서 GC와 구분해야 한다.

### 8-4. 실측 판별용 계측 (김플레이 추가 · DEV 전용)

`PlanetEdenRaidTestLayer.tsx` 김팀장 프로브에 Hermes GC 카운터를 붙였다. 240ms FPS 창마다 `HermesInternal.getInstrumentedStats()`로 기준값을 갱신하고, 50ms 이상 긴 프레임이 있으면 그 창의 GC 횟수·시간을 함께 찍는다.

```
[combat-hitch] longFrameMs 84 fps 41 gcΔ 1 gcTimeΔ 63
```

- 긴 프레임마다 `gcΔ ≥ 1`이고 `gcTimeΔ`가 긴 프레임 길이에 가까우면 → **8-2 확정**.
- `gcΔ 0`이면 → GC 아님. 8-3 AiNpc 위상·정산 또는 UI 스레드(GPU) 쪽.
- `__DEV__` 전용, 릴리즈 영향 없음. 창마다 통계 객체 1개(DEV만).
- `[pss-pre-dev] hot_path=DEV 240ms 창 1회 alloc=프레임당 0 cache=없음 risk=없음 verdict=PASS`
- 게이트: `tsc` PASS · `audit:skia-memory` 31/31 · `audit:worklet-contract` PASS.

### 8-5. 8-2 확정 시 수정 방향 (HOLD 범위 · 김팀장·대표님 판단)

1. 궤도 Picture 커밋 주기를 낮추는 건 불가 — 전함 이동이 계단이 된다.
2. **Picture 없는 그리기 경로** — 궤도 렌더를 Reanimated SharedValue + 고정 `<Path>` 몇 개(팀·종류별)로 바꾸고, 스텝마다 **같은 SkPath를 rewind 후 다시 채움**. 매 프레임 호스트 객체 0. Skia 헌법 §2 표준 패턴과 같다. 범위가 커서 김팀장 착수 결정 필요.
3. 단기 완화 — 라벨 `<View><Text>`는 값이 바뀔 때만 다시 만들기, 배경 캔버스 커밋 간격 추가 확대(구름 이동이 작아 1s도 계단 안 보임) 검토.

**status (8절 시점)**: `PENDING` (김팀장 — 8-4 실측으로 8-2 확정 여부 · 8-5 착수 결정 · 6-2·7-6 검수)

---

## 9. 실측 확정 (김플레이 · 2026-10-07 11:54~12:13 · 개발 빌드 · 192.168.45.197)

**8-2(GC)는 기각. 진범은 수송선 교역 경로 계산 `planArcConvoyRouteAtSupply`(동기 ~1초, 개발 빌드).**

### 9-1. 1차 측정 (GC 카운터)

- 이동중 전투 11:57:15 · :29 · :35 · :45 — 1.0~1.1초 정지, 6~14초 간격.
- 같은 순간 SurfaceFlinger `queueBuffer max=1099/1000/1133/1082ms` — 앱 창 전체가 멈춤.
- 정지 창의 GC 시간은 80~90ms(10% 미만) → GC 아님. JS 동기 작업.

### 9-2. 2차 측정 (`[arc-hitch]` 계측)

| 시각 | `convoy_plan` | 전투 정지 `longFrameMs` |
|---|---|---|
| 12:12:17 | 832 | 865 |
| 12:12:24 | 964 | 978 |
| 12:12:29 | 957 | 972 |
| 12:12:31 | 253 | 267 |
| 12:12:34 | 131 | 142 |
| 12:12:37 | 1018 | 1031 |

전투 정지 6건 전부가 직전 `convoy_plan`과 10~30ms 차이로 일치. 경로: `AiNpcSubCore` 체류 종료 → `economy_transport_dwell_settled` → `AiEconomySubCore` → `settleArcTransportDwellTrade` → (`ensureConvoyRamCargoRestored` await 뒤) `planArcConvoyRouteAtSupply` 동기 실행 (`runArcTransportTradePass.ts:224-231`). 허브·은하지도에서도 2~5초마다 130~1330ms로 계속 돈다.

### 9-3. 부수 발견 — `arc_core_spy_subcore` 틱

허브·은하지도에서 **0.4~1초마다 150~260ms** 틱 (`[arc-hitch] tick arc_core_spy_subcore`). 이번 이동중 전투 구간엔 없었으나 허브 전투·허브 체감 끊김의 별도 원인. 후속 조사 대상.

### 9-4. 다음

`planArcConvoyRouteAtSupply` 내부 핫스팟 후보(미확정):

- `listConvoySourceRoutesAtPlanet` — tgId마다 `listTradeRouteItems().find()` 2회 (`tradeRouteRegistry.ts:188,192`)
- `resolveSystemPositionForPlanetId` (거리, 수요지마다 2회 · `applyTradeRouteNetProfitPerUnit`에서 운송비 재계산 중복)
- `resolveTradeRouteNpcSellUnit` · `resolveTradeRouteMarketListing` (수요지·생산지 시세)

결과를 바꾸지 않는 인덱스·중복 제거로 고친다. 경제 런타임이라 김팀장 확인 필요. 계측 `[arc-hitch]`는 `__DEV__` 전용 (`ArcCoreHub.ts` · `ArcCoreCommandBus.ts` · `runArcTransportTradePass.ts`).

**status (9절 시점)**: `PENDING` (김팀장 — 9-2 확정 원인 확인 · 수정 주체 결정)

---

## 10. 수정 반영 (김플레이 · 대표님 선택 「김플레이가 한 번 더 계측 후 결과 보존 최적화 → 김팀장 인계」)

### 10-1. 추가 계측 결과 (`[arc-hitch] plan` 구간 분해 · DEV 전용)

한 번에 1498ms 걸린 계획의 구간: room 901 · destGate 406 · cost 152 · sell 28 · buy·stock ≈0 · 수요지 최대 200곳.

- **room**: `resolveConvoyDemandGrossRoomCredits` → `planetAttackKstDayKey()`가 호출마다 `new Intl.DateTimeFormat`을 만든다. Android Hermes에서 이 생성이 비싸다. 이것이 가장 큰 원인이다.
- **destGate**: `isPlanetConvoyTradeEnabled`를 수요지마다 반복한다.
- **cost**: 운송비를 두 번 계산한다(`applyTradeRouteNetProfitPerUnit` 안에서 한 번 더).

### 10-2. 수정 (결과값 불변)

| 파일 | 변경 |
|---|---|
| `src/arcCore/planetAttack/planetAttackKstDayKey.ts` | `Intl.DateTimeFormat`을 모듈에서 1회만 만든다. 반환 문자열은 같다. |
| `src/arcCore/economy/arcConvoyTradePlanner.ts` | 계획 1회 안에서 수요지별 `isPlanetConvoyTradeEnabled` 결과와 수요 여유 금액을 Map 스크래치에 캐시한다(호출 시작 시 `clear`). 운송비를 1회 계산하고 `applyTradeRouteNetProfitPerUnit`과 같은 식 `max(min, floor(gross) - cost)`으로 순이익을 낸다. `minNetProfitPerUnit`은 호출당 1회 읽는다. DEV 전용 `[arc-hitch] plan` 구간 계측. |
| `ArcCoreHub.ts` · `ArcCoreCommandBus.ts` · `runArcTransportTradePass.ts` | `__DEV__` 전용 `[arc-hitch]` 계측만 있다. 릴리즈 경로는 바뀌지 않았다. |

같은 패턴으로 호출마다 `new Intl.DateTimeFormat`을 만드는 곳(고치지 않고 기록만 함): `captainPersonalMissionOffer.ts:50` · `arcCoreDailyOpsPolicy.ts:91,98,110` · `barPatronageTables.ts:343`.

### 10-3. 이동중 전투 배경 구름 (대표님 지시 · 2026-10-07)

대표님 지시: 「구름 성운이 화면 안에서 갱신되거나 깜박이며 생기면 안 된다. 화면을 완전히 벗어난 뒤에만 다시 나와야 한다. `space_cd03.png`는 빼고 2장으로 흐르게 하라.」

- 원인: 감김 주기가 스프라이트 크기 × 0.92여서 스프라이트보다 짧았다. 그래서 구름이 아직 화면 안에 있을 때 반대편으로 순간이동했다.
- `transitCombatParallaxPlan.ts`
  - `resolveTransitCloudWrapPeriod`를 지우고 `resolveTransitCloudTravelPeriod`로 바꿨다. 대각선 경로에서 스프라이트가 화면을 완전히 벗어나는 거리의 2배에 여백 24px×2를 더한 값이다.
  - 원점은 화면 중앙 기준 `u ∈ [-period/2, period/2)`이고, `oy = u × 기울기`다.
  - `TRANSIT_SPACE_CD_COUNT`를 3에서 2로 줄였다.
- `transitCombatParallaxAssets.ts`: `space_cd03.png` require를 뺐다. png 파일은 남겨 두었다.
- `TransitCombatSkiaParallaxBackdrop.tsx`: `cloud2` `useImage`를 지우고 이미지 ref를 2개로 줄였다. 새 할당은 없다.
- 테스트: 360×800 · 1080×2340 · 1080×1080 캔버스에서 각 레이어가 감기기 직전과 직후에 화면과 겹치지 않는지 확인한다(`transitCombatParallaxPlan.test.ts` PASS).
- `[existing-value-change] transitCombatParallaxPlan.ts 구름 감김 주기 sprite×0.92→화면 이탈 거리 기반 · 구름 장수 3→2 · 대표님 지시`

### 10-4. 게이트

```text
[pss-pre-dev] hot_path=호송 계획(정박 종료 이벤트당 1회) · 구름 원점(프레임당 숫자 계산) alloc=스크래치 Map 2개 모듈 1회·호출마다 clear / 구름 무할당 cache=수요지 키·계획 1회 범위
[pss-pre-dev] stage=STAGE 3 이동중 전투 Skia 배경 — useImage 1개 감소, dispose 경로 동일 risk=P1(빈도 낮음)
[pss-pre-dev] verdict=PASS
```

tsc PASS · `audit:skia-memory` 31/31 · `audit:worklet-contract` PASS · `audit:memory:all` PASS. 처음 돌릴 때 `native-reclaim`이 리포트 파일 쓰기 잠금(`UNKNOWN open`)으로 한 번 실패했고, 재실행하니 20/20이었다. 실기 확인 전이다.

### 10-5. 남은 일

- **실기 확인**: 앱 리로드 후 이동중 전투에서 `[arc-hitch] plan`·`[combat-hitch]`가 줄었는지, 구름이 화면 안에서 생기지 않는지 본다.
- **별건**: 허브·은하지도에서 `arc_core_spy_subcore` 틱이 0.4~1초마다 100~260ms 걸린다. 허브 끊김의 다른 원인 후보이며 아직 조사하지 않았다.
- R2 33ms 클램프는 대표님 판단 대기. 6-2·7-6 수정은 김팀장 검수 대기.

**status (10절 시점)**: `PENDING` (김팀장 — 10-2 경제 런타임 수정 검수 · 10-3 구름 수정 검수 · 커밋)

---

## 11. 최종 전수 재검수 (김플레이 · 12:39 · 대표님 「끊김·구름 거의 안정 — 리스크·누락·최적화 확인」)

### 11-1. 발견해서 고친 것

| # | 문제 | 조치 |
|---|---|---|
| F1 | **회귀**: DEV 계측이 맨 `__DEV__`를 읽는다. node 헤드리스 감사(`planet-economy-3h-audit` → `convoy-headless-sim`)에서 `ReferenceError: __DEV__ is not defined`가 나서 `audit:balance-ops`가 FAIL했다. 앱 런타임에는 영향이 없다. | `ArcCoreCommandBus.ts` · `arcConvoyTradePlanner.ts` · `runArcTransportTradePass.ts`에 모듈 상수 `ARC_HITCH_DEV = typeof __DEV__ !== 'undefined' && __DEV__`를 두었다. `ArcCoreHub.ts`는 같은 가드를 인라인으로 넣었다. 기존 `tryEnqueueStelliumColonize`의 관례와 같다. 다시 돌리니 balance-ops가 WARN으로 돌아왔다(HEAD 기준선과 같고, 남은 것은 기존 fiscal 경고 1건). |
| F2 | 하역 정산 `resolveArcConvoyUnloadSettlement`도 운송비를 두 번 계산했다(`applyTradeRouteNetProfitPerUnit` 안에서 한 번 더). | 같은 식으로 1회만 계산한다. 결과는 같다(gross ≤ 0이면 0). 이제 쓰지 않는 import를 지웠다. |
| F3 | 구름 위상 주석이 옛 기하학 기준(「살짝 겹침」)으로 남아 있었다. | 「0.5 = 화면 중앙에서 시작, 0 = 화면 밖에서 들어온다」로 고쳤다. |

### 11-2. 확인만 함 (문제 없음)

- **결과 불변**: 캐시한 `isPlanetConvoyTradeEnabled`와 수요 여유 금액은 계획 1회(동기) 안에서 바뀌지 않는다. `ledger.ensureDay`는 첫 호출에서만 날짜를 넘기고 그 뒤에는 아무것도 하지 않으므로 캐시해도 같다. 순이익 식은 `applyTradeRouteNetProfitPerUnit`과 1:1이다(gross > 0이 앞에서 보장된다).
- **호출 경로**: `planArcConvoyRouteAtSupply`를 부르는 곳은 정박 정산과 일일 왕복 백필 두 곳뿐이다. 이중 계획은 없다.
- **릴리즈 경로**: 계측은 전부 DEV 전용이다. 릴리즈에서 남는 것은 수요지마다 `devNow()` 몇 번(0 반환)뿐이라 무시할 수준이다.
- **구름**: 레이어 2개와 이미지 2장의 인덱스 순환을 확인했다. `useImage` 2개는 수동 dispose 없이 훅이 수명을 관리한다. Picture 이중 recorder와 120ms 틱 구조는 그대로다. 각 레이어는 시간의 약 94~98% 동안 화면 안에 있어 빈 하늘이 길게 생기지 않는다.
- **남은 `new Intl.DateTimeFormat`**: `formatArcCoreOpsDayKey`·`arcCoreOpsMinutesOfDay`는 60초 탐침과 배치에서만 부른다. `kstDayKeyFromMs`는 허브 INFO useMemo에서 함장 수만큼 부른다. `barPatronageTables.kstDayKey`도 있다. 지금은 끊김 원인 빈도가 아니다. 김팀장 판단에 맡겨 같은 모듈 캐시 패턴을 권장한다.

### 11-3. 게이트

tsc PASS · `transitCombatParallaxPlan.test.ts` PASS · `src/arcCore/economy/*.test.ts` 7개 PASS · `audit:balance-ops` WARN(기준선과 같음) · `audit:skia-memory` 31/31 · `audit:worklet-contract` PASS · `audit:native-reclaim` 20/20 · `audit:resident-set` 7/7 · `audit:hot-path` hits=0 · `audit:memory` 37/37.
`audit:memory:all`을 연속으로 돌리면 Windows 리포트 파일 쓰기 잠금(`UNKNOWN open`)으로 중간에 끊긴다. 하위 감사를 하나씩 돌리니 전부 PASS였다. 코드 문제가 아니다.

**status (11절 시점)**: 김팀장 §12에서 REVIEWED. 헤더가 정본.

## 12. 김팀장 검수 (2026-10-07)

§6-2 phase 가드, §7-6 교전 중 렌더 캐시 유지·VFX 히스테리시스, §8-4 DEV GC 로그, §10 Intl 1회·수요지 캐시·운송비 1회·구름 2장, §11 `__DEV__` 가드는 코드와 맞다. 유지한다. 33ms 클램프와 SkPicture 수동 해제는 그대로다.

넘긴 리스크:

- R-A 자정 첫 계획의 수요 잔여가 어제 장부에 고정될 수 있다.
- R-B 스파이 없음이면 조회가 매 프레임이고, phase가 바뀔 때 전 함장 인덱스를 다시 만든다.

상세·수정 범위: `tools/kim-team-lead/reports/kim-claude-ready-combat-hitch-risks-20261007.md`  
인계: `kim-claude-handoff-pending.md` `task_id=combat-hitch-review-risks-20261007` `status=PENDING`
