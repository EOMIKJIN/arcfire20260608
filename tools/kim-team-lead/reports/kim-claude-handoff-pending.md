# 김클로드 → 김팀장 검수 handoff

> **정본 프로세스**: `docs/KIM_TEAM_LEAD_AGENT.md` §김클로드 검수 게이트 · `CLAUDE.md` §김팀장 최종 승인  
> **김클로드** = Anthropic Claude Code (Cursor ✱ 패널 · 터미널 `claude`)

---

## ✅ REVIEWED — crimson_base effective≠runtimeGraph LogBox 원인 수정(R1b) · 김클로드 → 김팀장

### 김팀장 검수 (본창 · 2026-08-02 · 대표님 「검수하라」· Composer/글록 검수만)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS** |
| **task_id** | `territorial-effective-graph-mismatch-warn-20260802` |
| 원인 진단 (템플릿 blue_red 단측 고착) | **AGREE** |
| R1b: contested 단측 → `*_neutral` | **AGREE** — graph와 정합 · warn 삭제 아님 |
| R1 both→blue_red · NEUTRAL P0 · contestedZone=false | **AGREE** — 회귀 유지 |
| 테스트 9/9b + stash 판별력 | **AGREE** |
| Maginot/CSV/warn 제거 금지 | **AGREE** |
| self-check (김팀장 재실행) | `tsx --test` PASS · `tsc` PASS |
| soft | 단측+템플릿 blue_red는 quick combat→binary dominance로 경로 변경(의도된 정합). 실기 crimson_base LogBox 1회 확인 권장 |
| 커밋 | 대표님 지시 시 (Composer 커밋 금지) |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED` → `IDLE` 가능** |
| **updated** | 2026-08-02 (김팀장 검수 PASS) |

---

## 📋 PENDING (archived) — crimson_base R1b · 김클로드 원문

```text
status=PENDING (archived → REVIEWED 2026-08-02)
task_id=territorial-effective-graph-mismatch-warn-20260802
verdict=김클로드 구현 — READY 권장 1안(R1b) 그대로. warn 삭제 아님, effective 산출을 graph에 정합.
code_changes=YES — resolveEffectiveTerritorialCombatMode.ts(1) + 동명 test.ts(신규 2케이스 + 기존 2건 설명 갱신)
commit 금지(당시)
```

### 원인 · 수정 (김클로드 요약)

비중립+contestedZone 단측 인접 시 policy blue_red 고착 → R1b로 `red_neutral`/`blue_neutral`. warn은 조건 소멸로 미표시. 테스트 9/9b·stash FAIL 증명.

---

## ✅ REVIEWED — 독립국 maintained 알림 「중립」 오표기 최소 패치 · 김클로드 → 김팀장

### 김팀장 검수 (본창 · 2026-08-02 · 대표님 「검수하라」· Composer/글록 검수만)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS** |
| **task_id** | `territorial-independent-maintained-alert-20260802` |
| sideKey `independent` 분기 | **AGREE** — blue/red 외 전부 폴백 제거 |
| battle → `maintained.independentBody` | **AGREE** — 템플릿 ``.${sideKey}Body`` |
| diplomatic → `diplomaticBody` (neutralBody 아님) | **AGREE** — `sideKey!=='neutral'` 경로 |
| i18n ko/en independentBody | **AGREE** — blue/red 동일 패턴 |
| 범위 | **AGREE** — 판정/홀드/CSV/Maginot 무변경 |
| self-check | 김팀장 재실행 `tsc` — 아래 결과 |
| soft | 실기 드라코 방어 유지 알림 1회 확인 권장 |
| 커밋 | Opus API 복구 후 또는 대표님 지시 시 (Composer 커밋 금지) |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED` → `IDLE` 가능** |
| **updated** | 2026-08-02 (김팀장 검수 PASS) |

---

## 📋 PENDING (archived) — 독립국 maintained 알림 · 김클로드 원문

```text
status=PENDING (archived → REVIEWED 2026-08-02)
task_id=territorial-independent-maintained-alert-20260802
verdict=김클로드 구현 — READY 최소 범위(sideKey·i18n) 그대로, 판정/홀드/CSV 무변경
code_changes=YES — showTerritorialOccupationChangeAlert.ts(1) · i18n ko.ts/en.ts(각 1줄)
commit 금지(당시)
```

**배정 경위**: READY 1순위=Opus, 2순위=김클로드(Opus API 불가 시). 대표님 「김클로드가 진행」로 착수.

### 원인 · 수정 (김클로드)

`sideKey`에 `independent` 분기 + `maintained.independentBody` i18n. battle는 independentBody, diplomatic는 diplomaticBody. 판정/홀드/CSV 무변경.

### self-check (김클로드)

```
npx tsc --noEmit -p tsconfig.client.json   → PASS(에러 0)
```

### soft

- 실기 알림 문구 노출 확인 권장.

---

## 📋 PENDING — 은하계 지도 성계이동 3건 · 김클로드 (김팀장 검수: ①②③ AGREE · 잔여 1건 FAIL)

### 김팀장 검수 (본창 · 2026-08-02 · 대표님 「검수만 하라」)

| 항목 | 결과 |
|------|------|
| **verdict** | **CONDITIONAL** — 김클로드 ①②③ **AGREE** · **잔여 동일축 1건 FAIL** (유료 Opus 패치 대기) |
| **task_id** | `worldmap-transit-duplicate-move-fix-20260802` |
| ① AppState active `isMoving` 강제 해제 제거 | **AGREE** — 중복 `doMoveAlongPath` 경합 차단. `hubNavGate.reset`·제스처 rearm 유지 OK |
| ② 일반 도착 `moveToSystem`+`persist` 애니메이션 전 커밋 | **AGREE** — 조우전은 애니 후 `begin`/전투 진입 유지 |
| ③ blur cleanup `!landed → finalize…` 제거 | **AGREE** — `moveToSystem`→`currentPlanetId=null` 정상과 충돌. logcat 원복 설명 일치 |
| **잔여 FAIL** | `persistGalaxyMapSessionOnBackground` → 여전히 `resumePlayerToLastHubPlanet`. 조기 커밋 후 AppState `inactive`/`background` 시 **③과 동일 허브 원복**. 수정안: `systemId && !planetId`면 persist만, hub resume 스킵 (`galaxyMapSessionResume.ts`) |
| self-check (재실행) | 김클로드 트리 기준 `tsc` PASS · `audit:memory` 37/37 PASS — **잔여 FAIL로 완료·커밋 선언 보류** |
| soft | 실기 이동·착륙 · 조우전 · 주기 `app_background` 근본은 범위 밖 |
| 다음 | **Opus(김팀장)** 로 잔여 1건 패치 후 `REVIEWED`/`IDLE` · 커밋은 대표님 지시 시 |

| 필드 | 값 |
|------|-----|
| **status** | **`PENDING`** (잔여 FAIL — Composer 코드 수정·PASS 선언 금지) |
| **updated** | 2026-08-02 (김팀장 검수 CONDITIONAL) |

---

## 📋 PENDING (김클로드 원문 요지) — 은하계 지도 성계이동 3건

```text
status=PENDING
task_id=worldmap-transit-duplicate-move-fix-20260802
verdict=김클로드 자체진단 — 3건 모두 원인 특정·수정 완료. ③이 "로딩 나타나며 여전히 이동 안 됨" 증상의 실제 근본 원인.
code_changes=YES — app/(game)/worldmap.tsx (① AppState active 2줄 제거 ② doMoveAlongPath 커밋순서 재배치 ③ blur cleanup 강제원복 로직 제거)
commit 금지
```

### 배경 (대표님 실측, 2026-08-02, 순차 보고 3건)

1. 「전함 마크이동도 두번반복되는 버그가 있다. 어제이후 생긴것이다.」→ 버그① 수정.
2. 「모두 수정하라」→ 이전 턴에 진단만 하고 미뤄뒀던 도착 커밋 유실 버그도 이어서 수정 → 버그② 수정.
3. ①·②를 고친 뒤에도 「이동시 로딩이 나타나면서 여전히 이동이 안된다. 로딩이 나타나는 이유부터 전수검사」→ **실기 adb logcat을 직접 떠서 전수검사**, `system_change` 이벤트가 `arcadia→vega_outpost→arcadia→...` 패턴으로 반복되는 걸 확인 → 추적 결과 **버그②가 의도치 않게 노출시킨 기존 경합이 버그③, 이게 실제 근본 원인**.

`worldmap.tsx`·`galaxyMapSessionResume.ts`에 **미커밋 상태로 김팀장이 작업 중인 변경**(hubNavGate/mapInteractionReady 「고착」 회귀 대응, 코드 주석상 2026-08-02)이 있어, 그 변경분을 기반으로 진단·수정.

---

## 버그① 전함 마크 2회 중복 이동

### [pss-pre-dev]

```text
[pss-pre-dev] hot_path=없음(AppState 'active' 이벤트 콜백 — 포그라운드 복귀 시 1회) ·
              alloc=0(라인 삭제만, 신규 객체 없음) · cache=해당없음
[pss-pre-dev] stage=galaxy_map STAGE2 이동(doMoveAlongPath) · Skia 비접촉 · risk=P1(락 로직만, 렌더/틱 무관)
[pss-pre-dev] verdict=PASS — 기존 fallback 타이머(SHIP_TRANSIT_DURATION_MS+40ms)가 이미 자연 해제를 보장하므로
              이 2줄 제거로 새로 stuck 되는 경로 없음(아래 근거)
```

### 원인 (파일:줄 근거)

`worldmap.tsx:652-665`(김팀장 미커밋분) — 포그라운드 복귀(`AppState` `next==='active'`) 시마다:
```ts
hubNavGate.reset();
setIsMoving(false);
isMovingRef.current = false;   // ← 문제의 2줄(제거 대상)
armGalaxyMapScrollGestures();
```
이 무조건 실행됨. 그런데 `doMoveAlongPath()`(`worldmap.tsx:1359`)는 홉 애니메이션 대기를 **fallback 타이머로 항상 자체 해제**(`transitFallbackTimerRef.current = setTimeout(..., SHIP_TRANSIT_DURATION_MS+40)` → `settleTransitWait(true)`)하므로, 정상 진행 중인 이동이 "영구 stuck"이 되는 경우는 원래 없음 — 단, **백그라운드 중 JS 타이머가 스로틀돼 지연**될 수 있어, 그 사이 `next==='active'`가 먼저 도착하면 이 핸들러가 **아직 살아있는 `doMoveAlongPath` 실행 도중** `isMovingRef.current`를 강제로 `false`로 되돌림. 이 순간 대표님이 재탭하면 `handleMove()`의 게이트(`if (isMovingRef.current || isMoving) return;`)를 통과해 **두 번째 `doMoveAlongPath`가 첫 번째와 동시에 실행** — 둘 다 같은 `moveProgress`/`setShipTransit`를 건드려 전함 마크 이동 애니메이션이 중복 재생됨.

### 수정

`hubNavGate.reset()`·`armGalaxyMapScrollGestures()`는 유지(게이트/제스처 고착 방지, 이동 락과 무관한 별개 계약). `setIsMoving(false); isMovingRef.current = false;` 2줄만 제거 — 이동 락은 `doMoveAlongPath` 자신의 fallback 타이머·`finally`에만 맡김.

---

## 버그② 이동 후 도착 커밋 유실(아르카디아에 그대로 남음)

### [pss-pre-dev]

```text
[pss-pre-dev] hot_path=없음(탭당 1회 실행되는 doMoveAlongPath, 렌더/틱 루프 아님) · alloc=0(기존 호출 재배치만) · cache=해당없음
[pss-pre-dev] stage=galaxy_map STAGE2 이동 커밋 순서만 · Skia 비접촉 · risk=P2(전투 조우 분기 동작 유지 여부가 핵심 검증 포인트)
[pss-pre-dev] verdict=PASS — 조우전 분기(begin/selectSystem/navigateToCombatAfterTeardown)는 순서·가드 100% 동일 유지, 일반 도착 분기만 애니메이션 앞으로 이동
```

### 원인

`doMoveAlongPath()`가 좌표 커밋(`moveToSystem`+`persist`)을 **홉 애니메이션(3초/홉) 전부가 끝난 뒤**에만 실행하고 있었음. 애니메이션 대기 도중 `app_background`→JS 리로드/프로세스 재시작(2~10분 간격으로 반복되는 현상, 별도 미해결)이 끼어들면 `isMountedRef`/`isFocusedRef`가 꺼져 `allFinished=false`로 함수가 조용히 `return`돼 커밋이 통째로 유실됨.

### 수정

일반 도착(조우전 아닌 경우)의 `moveToSystem`+`markVisited`+미션 오브젝티브+`persist()`를 **연료 차감 직후, 애니메이션 루프 진입 전**으로 이동. 조우전 분기는 `willEncounter`(순수 확률 롤)만 미리 계산해두고, 실제 `begin()`/`navigateToCombatAfterTeardown()` 호출은 기존과 동일하게 애니메이션 뒤 `allFinished` 확인 후에만 실행 — 조우전 타이밍·확률·가드 전부 동작 변경 없음.

---

## 버그③(진짜 근본 원인) — blur cleanup의 "착륙 안 함→강제 원복"이 버그②가 만든 커밋을 매번 되돌림

①·②만으로는 안 고쳐져서 adb logcat을 직접 떠 `system_change` 이벤트를 시간순 추적 — `route_blur` → `system_change detail=arcadia` → `system_change detail=vega_outpost` 클러스터가 반복 발생하는 걸 확인(즉 arcadia→vega_outpost로 이동했다가 곧바로 다시 arcadia로 되돌아감).

### [pss-pre-dev]

```text
[pss-pre-dev] hot_path=없음(useFocusEffect cleanup — blur/deps 재실행 시 1회) · alloc=0(코드 제거만) · cache=해당없음
[pss-pre-dev] stage=galaxy_map STAGE2 blur 처리 · Skia 비접촉 · risk=P1(명시적 「마지막 허브로 복귀」 버튼 경로는 무변경 확인)
[pss-pre-dev] verdict=PASS — 제거 대상 로직은 2026-08-02 신설분(미커밋)이라 커밋된 기존 계약을 되돌리는 게 아님
```

### 원인 (파일:줄 근거)

`worldmap.tsx:675-678`(김팀장 미커밋분, 신설) — `useFocusEffect`(652행) cleanup에서:
```ts
const landed = usePlayerStore.getState().player?.currentPlanetId;
if (!landed) {
  finalizeGalaxyMapSessionForExit({ persist: true });  // → resumePlayerToLastHubPlanet → 아르카디아로 강제 이동
}
```
`playerStore.ts:633`의 `moveToSystem()`은 항상 `currentPlanetId: null`을 세팅한다(주석: "moveToSystem은 currentPlanetId를 null로 두므로"). 버그②로 `moveToSystem()`이 **애니메이션 전**에 먼저 실행되도록 바뀌면서, "성계 이동 성공 직후 아직 어디에도 착륙 안 한, 완전히 정상적인 상태"에서도 `!landed`가 **항상 참**이 됨. 이 상태에서 `useFocusEffect`가 cleanup을 타는 순간(진짜 화면 이탈이 아니어도 deps `[armGalaxyMapScrollGestures, hubNavGate]` 재평가·재포커스 등으로도 발동 가능) `finalizeGalaxyMapSessionForExit()` → `resumePlayerToLastHubPlanet()`이 실행되어 방금 커밋된 목적지를 **매번 아르카디아로 되돌림**. `releaseGalaxyMapStageMemory()`도 같이 호출돼 이게 "로딩화면"으로 보이는 것도 설명됨.

이 `!landed` 안전망 자체가 **틀린 전제**였다 — "착륙 안 함(currentPlanetId=null)"을 "이상 상태(이동이 중간에 끊김)"의 신호로 썼지만, moveToSystem 이후엔 착륙하기 전까지 항상 null인 게 **정상**이라 이상 상태와 구분이 안 됨. 리로드 도중 유실 방지는 이미 버그②의 조기 커밋(moveToSystem+persist)이 담당하므로 이 안전망은 불필요.

### 수정

`worldmap.tsx:675-678`(신설분) 제거 — cleanup은 `appSub.remove(); worldmapInternalNavRef.current = false;`만 수행. 명시적 「마지막 허브로 복귀」 버튼(`handleReturnToLastHub`, 427행)과 타이틀 복귀(`handleExitToTitle`)의 `finalizeGalaxyMapSessionForExit` 호출은 그대로 유지 — **의도적/명시적 사용자 행동에서만** 발동하도록 범위를 좁힘.

### self-check (3건 공통, 최종 상태 기준)

```
npx tsc --noEmit -p tsconfig.client.json   → PASS(에러 0)
npm run audit:memory                        → PASS 37/37 (+ skia-worklet 20/20)
```

### soft(실기 미확인, 3건 공통)

- 유닛 테스트 미작성 — `worldmap.tsx`는 RN 컴포넌트(react-native-gesture-handler·reanimated 등 다중 import)라 `tsx --test` 실행 불가(기존 제약, 이 파일 전체가 원래 테스트 커버리지 없음).
- 버그③ 제거로 "화면을 이탈했는데 착륙도 안 하고 아무 복귀 로직도 없는" 진짜 이상 상태(예: 리로드 자체가 실패하는 극단 케이스)에 대한 안전망이 약해질 가능성은 이론상 있음 — 다만 버그②의 조기 커밋이 이미 정상 이동을 원자적으로 보존하므로 실질적 리스크는 낮다고 판단.
- 조우전 발동 케이스(버그② 변경분) 실기 회귀 확인은 여전히 권장(발생 빈도 낮음).
- 근본 원인인 `app_background` 자체가 왜 2~10분 간격으로 반복되는지는 여전히 미해결(OS/기기 레벨, 범위 밖) — 이번 3건은 그 리로드가 나더라도 "성계 이동" 기능 자체가 깨지지 않도록 하는 수정.

**git commit 안 함** — 김팀장(Cursor 본창) 검수 요청.

---

## ✅ REVIEWED — 은하계 지도 native_heap·PSS 분석 재검수 + remount 쿨다운 영속 · 김클로드

### 김팀장 검수 (본창 Cursor · 2026-08-01 · 대표님 「검수하라」)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS** (분석 PARTIAL 수용 · 코드 1건 유지) |
| **task_id** | `worldmap-native-heap-pss-audit-recheck-20260801` |
| 스테이지 | **AGREE** — 17:34~21:05 `galaxy_map_periodic*` · 허브 드론 로그 전무 |
| native_heap 본축 | **AGREE** — floor→21:57 native Δ+137.7 · PSS Δ+170 (≈81%) |
| GPU onRelease | **AGREE(무해·미수정)** — 진단 카운트 전용 · 이중 dispose SIGSEGV 위험 → 주입 금지 정정 OK |
| 21:10 사건 | **AGREE** — `app_background`→`Running "main" rootTag:41`(PID 29412) JS 루트 리로드 로그 실측 |
| remount | **AGREE** — 21:12:22 `hubBackdropNativeRemount epoch=1`(쿨다운 무력) → 21:13~ skip 정상 |
| 코드 | `runDeepNativeReclaimPass.ts`만 — AsyncStorage `arcfire_hub_backdrop_remount_cooldown_v1` 영속 · 판정 로직 무변경 |
| self-check | 김팀장 재실행 `tsc` PASS · `audit:native-reclaim` 20/20 PASS |
| soft | ① READY 원문은 코드금지였으나 김클로드 세션 「안정 개선 가능 시 진행」으로 범위 확대 — 패치는 좁아 **유지** · ② 지도 수시간 GL~140 floor·`app_background→JS리로드` 근본 원인은 **미해결**(증상 완화) · ③ hydrate 경합 fail-open · ④ 키는 월드축(계정 purge 비대상) OK |
| 커밋 | 대표님 지시 시 |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED` → `IDLE` 가능** |
| **updated** | 2026-08-01 (김팀장 검수 PASS) |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-worldmap-native-heap-pss-audit-recheck.md` |

---

## 📋 PENDING (archived) — 은하계 지도 native_heap 재검수 · 김클로드 원문

```text
status=PENDING (archived → REVIEWED 2026-08-01)
task_id=worldmap-native-heap-pss-audit-recheck-20260801
verdict=PARTIAL + code(cooldown persist)
commit 금지(당시)
```

### 재검수 판정표 (김클로드)

| 항목 | 판정 |
|------|------|
| 스테이지 17:34~21:05=지도 | AGREE |
| native_heap 본축 | AGREE |
| GPU release no-op | PARTIAL→DISAGREE(무해) · 코드 미변경 |
| remount cooldown / JS 리로드 | AGREE · 원인 재정의 |
| 김팀장 1안 | 수정제안(리로드 경계) |
| territorial 무관 | DISAGREE(무관) |

(상세 근거·코드 설명은 아래 archived 본문.)

---

## ✅ REVIEWED — 마지노선(N≤5)·외부팩션(F2·F4) 국가보급·전황 진동(M0~M8) · 김클로드

### 김팀장 검수 (본창 Cursor · 2026-08-01 · 대표님 「검수하라」)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS** (김팀장 보정 1건 포함) — READY M0~M5·M7·M8 충족 · M6 soft |
| **task_id** | `maginot-external-faction-supply-oscillation-20260801` |
| M1~M3 | 21코어 N집계 · hard/support/cool · reclaim 판정(보급선·COOL 게이트) · F2\|F4=라벨(NEUTRAL/INDEPENDENT 아님) |
| M4 | `runTerritorialCombatPass` 배선 · HARD→`*_neutral`+`hardFinalOccupyPct` · SUPPORT battle 가산 · envelope와 holdSide 배타 |
| **김팀장 보정** | HARD인데 `rollDecision≠battle`이면 **battle 강제** + HARD 시 **전술 역전 스킵** — due 최종 수복이 `P(battle)×0.8`로 붕괴하던 계약 위반 수정 |
| M5 | 연결수&lt;3 + HARD+인접≥1 → 80% 강제 unit · planetId 하드코딩 없음 |
| M6 | ActivePool HARD 전선 가산 — soft 미착수(후속) |
| M7 | 신규 `arc_core_maginot_external_supply_policy.csv` only · territorial combat 기존행 **diff 없음** |
| M8 | maginot 11 · envelope/eligibility/governor 회귀 · **tsc PASS** |
| soft | 실기 N≤5 미네르바 수복 로그 · F2\|F4는 기계적 점유 연동 없이 문서/정책 라벨 · operationMeta defenderSide 라벨 부정확(기능 무영향) |
| 커밋 | 대표님 지시 시 |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED` → `IDLE` 가능** |
| **updated** | 2026-08-01 (김팀장 검수 PASS + 보정) |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-maginot-external-faction-supply-oscillation.md` |

---

## 📋 PENDING (archived) — 마지노선·외부보급 · 김클로드 구현 원문

```text
status=PENDING (archived → REVIEWED 2026-08-01)
task_id=maginot-external-faction-supply-oscillation-20260801
verdict=PASS (김팀장 · battle강제+전술역전스킵 보정)
commit 금지(당시)
```

| 필드 | 값 |
|------|-----|
| **status** | **`PENDING`(archived)** |
| **updated** | 2026-08-01 (김클로드 구현) |
| **task_id** | `maginot-external-faction-supply-oscillation-20260801` |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-maginot-external-faction-supply-oscillation.md` |

### [pss-pre-dev]

```text
[pss-pre-dev] hot_path=territorial due 1회 · N집계 O(21) dirty/캐시 · alloc=밴드해석1회 · cache=hold-revision
[pss-pre-dev] stage=arcCore territorial · Skia/UI 무관 · risk=P1(틱금지)·P6(persist불필요·파생만)
[pss-pre-dev] verdict=PASS — onBoot 전은하 스캔 금지 · 21코어 hold 카운트만 · 기존 CSV combat 행 무단변경 금지
```

### 구현 요약 (M0~M8)

| M | 내용 | 파일 |
|---|------|------|
| M0 | `docs/strategy/…` §6-5 신설(진동 밴드·F1-F4·§6-4 envelope와 우선순위 다이어그램 갱신) | `docs/strategy/ARC_CORE_TACTICAL_AUTOMATION_AND_GALAXY_STRATEGY.md` |
| M1 | `listScenarioCorePlanetIds()`(21코어, synth 제외, occupation seed CSV 정본) + `countFactionSystemsInCore(holds, side)` — 독립국·순수중립은 어느 N에도 미포함 | `resolveMaginotExternalSupply.ts`(신규) |
| M2 | `resolveMaginotBand({n, floorSystems, paritySystems})` → `'hard'\|'support'\|'cool'`. N≤5 hard·N≥10 cool·그 사이 support. 블루·레드 완전 대칭(동일 함수, side 파라미터 없음 — 호출측이 각자 N으로 독립 호출) | 상동 |
| M3 | `resolveMaginotReclaimDecision` — 반대(수복시도)측 밴드+보급선(≥1)만 보고 판정. **HARD**: `forceHardReclaim=true` → 호출측이 `effectiveCombatMode`를 (수복측)_neutral로 강제하고 `dominantSideWeightPct`를 CSV `hardFinalOccupyPct`(기본 80%)로 오버라이드 — §6-4 envelope에서 이미 검증된 `resolveBinaryDominantHoldTarget` 경로를 100% 재사용(신규 확률 메커니즘 없음, 실패 시 기존 홀더 유지가 자연히 성립). **SUPPORT**: `supportBattleWeightBoostPct`(기본 15)만 가산 | 상동 |
| M4 | `runTerritorialCombatPassForPlanet`에 배선 — supplyAdjacency 계산 직후(§6-4 envelope보다 먼저) N밴드·reclaim 판정 → rollDecision 가중치(SUPPORT) → `effectiveCombatMode`/`dominantSideWeightPct` 오버라이드(HARD). `envelopeDominantOverridePct`와 마지노선 오버라이드는 holdSide 조건이 서로 배타(envelope=NEUTRAL 전용·마지노선=BLUE/RED 전용)라 `??`로 안전하게 결합 | `runTerritorialCombatPass.ts` |
| M5 | 미네르바급(연결수<3, 3포위 STRONG 구조적 불가) 실측 재현 테스트 — HARD+아군인접=2면 여전히 80% 강제 수복 발동함을 직접 증명. `if (planetId==='minerva_deep')` 없음(정적 grep 테스트) | `resolveMaginotExternalSupply.test.ts` #8 |
| M6 | **선택 항목 — soft로 미착수.** ActivePool 승격 우선순위에 "HARD 약세측 전선" 가산은 범위가 커 이번엔 보류. `contestedPoolGovernor.ts` 기존 티어(중립 최우선, 2 tasks 전)와 충돌 없이 별도 가산항 추가하는 방향을 권장 — §6-5 문서·본 handoff에 후속 과제로 기록 | 미착수(문서만) |
| M7 | 신규 `tables/balance/arc_core_maginot_external_supply_policy.csv`(corePlanetCountScope=scenario21·floorSystems=5·paritySystems=10·hardFinalOccupyPct=80·minAdjacentFriendlyForReclaim=1·supportBattleWeightBoostPct=15·externalFactionCodes=F2\|F4) + `arcCoreMaginotExternalSupplyPolicy.ts` O(1) 로더 | 신규 CSV·로더 |
| M8 | unit 11케이스 신규 + 기존 territorial 11개 테스트 파일 전체 회귀 PASS + `tsc` PASS | 아래 self-check |

### HARD 80% 근거 (수식·가중)

새 확률 메커니즘을 만들지 않고 **기존에 검증된 binary-dominance 경로**(`resolveBinaryDominantHoldTarget`, §6-4 envelope 작업에서 이미 unit으로 증명됨)를 재사용한다: `effectiveCombatMode`를 (수복측)_neutral로 강제하면 `dominant = 수복측`, `dominantWins = Math.random()*100 < dominantSideWeightPct`. `dominantSideWeightPct`를 `hardFinalOccupyPct`(CSV 80)로 오버라이드하므로 **이 due에서 수복측이 이길 확률이 정확히 80%**이고, 지면(20%) 기존 홀더가 그대로 유지된다(코드: `resolveBinaryDominantHoldTarget`의 `if (dominantWins) return dominant; if (holdSide !== 'NEUTRAL') return holdSide;`). fleet/quickCombat 경로를 타지 않아 함대 구성과 무관하게 확률이 보장된다.

### 미네르바급 검증 (연결수<3 갭 해소)

`resolveSupplyEnvelope.test.ts`류 3포위(§6-4)는 연결 수 3 미만인 성계(예: 연결 2개)에서 구조적으로 STRONG이 될 수 없다 — `resolveMaginotExternalSupply.test.ts` #8이 이 정확한 상황(연결<3, envelope='none')에서도 마지노선 HARD+아군인접≥1이면 여전히 80% 강제 수복이 발동함을 직접 증명한다.

### self-check 결과

```
npx tsc --noEmit -p tsconfig.client.json                              → PASS(에러 0)
npx tsx --test resolveMaginotExternalSupply.test.ts                    → PASS 11/11(신규, 미네르바급·대칭·배선 확인 포함)
npx tsx --test resolveSupplyEnvelope.test.ts                           → PASS 12/12(회귀)
npx tsx --test resolveEffectiveTerritorialCombatMode.test.ts           → PASS 15/15(회귀)
npx tsx --test contestedEligibility.test.ts                            → PASS 11/11(회귀)
npx tsx --test contestedPoolGovernor.test.ts                           → PASS 11/11(회귀)
npx tsx --test contestedActivePool.test.ts                             → PASS 5/5(회귀)
npx tsx --test geoFlankHeliosTitanOccupation.test.ts                   → PASS 7/7(회귀)
npx tsx --test territorialStackConsistency.test.ts                     → PASS 6/6(회귀)
npx tsx --test territorialSupplyLine.test.ts                           → PASS 16/16(회귀)
npx tsx --test frontPressureIndex.test.ts                              → PASS 5/5(회귀)
npx tsx --test seedPlanetOccupationFromBalance.test.ts                 → PASS(회귀)
npx tsx --test planetHoldReleasePolicy.test.ts                         → PASS 6/6(회귀)
```

### 회귀 판별력 검증

`runTerritorialCombatPass.ts`의 마지노선 배선을 `git stash`로 일시 되돌려 정적 테스트 #11이 **FAIL**(HARD여도 effectiveCombatMode/dominant% 강제 오버라이드 없음) 확인 → `git stash pop` 복원 후 **PASS** 재확인.

### CSV / 기존값 변경 여부

`arc_core_territorial_combat_policy.csv`(정적 5행) · `arc_core_supply_envelope_policy.csv`(§6-4, 유지) · `faction_political_relations.csv` · `planet_occupation_seeds.csv` · `planet_trade_route_profile.csv` **전부 git diff 없음**. 신규 CSV(`arc_core_maginot_external_supply_policy.csv`) 1개만 추가, `build:balance-tables` 반영 완료. `if (planetId==='minerva_deep'|'iron_remnant')` 류 하드코딩 없음(정적 grep 테스트로 고정). 외부팩션은 `galaxyRouteFactionPolicy.ts`의 실제 F2(`trade_coalition`)·F4(`miners_guild`) 코드를 CSV 라벨로만 참조 — `NEUTRAL`/`INDEPENDENT` 치환 없음.

### 리스크 · soft(실기 미확인) · 해석적 결정

- **M6 미착수**(위 표 참고) — ActivePool 승격 가산은 다음 세션 후속 과제.
- **operationMeta 감사 필드 소폭 부정확** — 기존 `resolveAttackerDefenderSides`의 `blue_neutral`/`red_neutral` 분기는 원래 "진짜 NEUTRAL hold"만 가정하고 설계돼 있어, 마지노선이 이 모드를 BLUE/RED-hold에 강제로 씌우면 `operationMeta.defenderSide`가 실제 이전 홀더 대신 `'NEUTRAL'`로 기록될 수 있음(순수 로그/감사 필드 — 실제 점유 판정 로직인 `resolveBinaryDominantHoldTarget`은 `holdSide`를 직접 받아 정확하게 처리하므로 **기능에는 영향 없음**). 원한다면 후속으로 `resolveAttackerDefenderSides`를 확장해 정확한 라벨을 남길 수 있음.
- **실기 미확인**: 실제로 N이 5 이하로 떨어졌을 때 다음 due에서 80% 근처로 수복되는지, N이 10 이상 회복됐을 때 외부보급이 정말 감쇠하는지는 unit·정적 검증만 — 확률 기반이라 여러 due 표본 필요(20분 간격 due 특성상 실기 검증에 시간이 걸림).
- CSV 수치(`floorSystems=5`·`paritySystems=10`·`hardFinalOccupyPct=80`·`supportBattleWeightBoostPct=15`)는 대표님 정본 문서의 기본값을 그대로 채택 — 실기 체감 후 조정은 CSV만 바꾸면 됨.

**git commit 안 함** — 김팀장(Cursor 본창) 검수·커밋 요청.

---

## ✅ REVIEWED — 보급 3성계 포위 점령 우세·중립화=내부 반란 우선(M0~M7) · 김클로드

### 김팀장 검수 (본창 Cursor · 2026-08-01 · 대표님 「검수하라」)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS** — READY M0~M7 충족 · 아이언 `neutral_declare` 회귀 경로 차단(동측 STRONG) |
| **task_id** | `supply-envelope-occupy-rebellion-neutral-20260801` |
| M1~M4 | `resolveSupplyEnvelope` · 가중치 보정 · dominate 88% · BLUE+STRONG → neutral_declare=0 |
| M5 | 반란 일일패스 `envelopeRebellionOverthrowMul` 최종 mul만 · wealth CSV 무변경 |
| M6 | 신규 `arc_core_supply_envelope_policy.csv` only · territorial combat 기존행 **diff 없음** |
| M7 | envelope 12 · effective/eligibility/governor/ActivePool 회귀 · **tsc PASS** |
| soft | NEUTRAL+STRONG due 1회 점유 기대≈0.69(78%×88%) — READY 「≥0.75 권장」보다 약간 낮음 · CSV boost/occupy만으로 상향 가능 · 실기 순차 1바퀴 로그 확인 권장 |
| 커밋 | 대표님 지시 시 |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED` → `IDLE` 가능** |
| **updated** | 2026-08-01 (김팀장 검수 PASS) |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-supply-envelope-occupy-rebellion-neutral.md` |

---

## 📋 PENDING (archived) — 보급 3성계 포위 · 김클로드 구현 원문

```text
status=PENDING (archived → REVIEWED 2026-08-01)
task_id=supply-envelope-occupy-rebellion-neutral-20260801
verdict=PASS (김팀장)
commit 금지(당시)
```

### [pss-pre-dev]

```text
[pss-pre-dev] hot_path=territorial_pass due 1회(이미 있음) · alloc=보급카운트 O(인접)·가중치 해석 1회 · cache=없음(기존 revision 재사용)
[pss-pre-dev] stage=arcCore territorial + (선택) rebellion daily 배치 가산만 · Skia/UI 무관 · risk=P1·기존값CSV무단변경
[pss-pre-dev] verdict=PASS — rollDecision/effectiveMode/반란 일일패스에 연결 · onBoot 동기 전수 금지 · planetId 하드코딩 금지
```

### 구현 요약 (M0~M7)

| M | 내용 | 파일 |
|---|------|------|
| M0 | `docs/strategy/…` §6-4 신설(스택 내 위치 다이어그램·CSV 무변경 명시) + 코드 주석(아래 M2/M3) | `docs/strategy/ARC_CORE_TACTICAL_AUTOMATION_AND_GALAXY_STRATEGY.md` |
| M1 | 순수 `resolveSupplyEnvelope({adjacency, threshold})` → `'blue_strong'\|'red_strong'\|'none'`. threshold(기본 3) 이상 인접 + 반대 팩션 인접 0. 연결 수<3인 성계는 구조적으로 STRONG 불가(자연 폴백) | `resolveSupplyEnvelope.ts`(신규) |
| M2 | `applySupplyEnvelopeDecisionWeights` — NEUTRAL+STRONG(A)이면 battle 상향+status_quo 하향(neutral_declare는 NEUTRAL hold에 실질 no-op이라 미조정), BLUE/RED hold+동측 STRONG(B)이면 neutral_declare에 `envelopeNeutralDeclareMul`(기본 0) 적용 · 제거분은 status_quo가 흡수. `runTerritorialCombatPassForPlanet`에서 `supplyAdjacency` 계산을 rollDecision **이전**으로 이동(기존엔 battle 진입 후에만 계산돼 있었음)해 재사용 | `resolveSupplyEnvelope.ts`·`runTerritorialCombatPass.ts` |
| M3 | `resolveSupplyEnvelopeDominantOverridePct` — NEUTRAL+STRONG일 때만 `dominantSideWeightPct`를 CSV `occupyHighWeightPct`(기본 88)로 오버라이드. `policyForDominance`(policy 얕은 복제)로만 적용, CSV 정적행 자체는 무변경 | 상동 |
| M4 | 아이언크로스 회귀 재현 테스트로 직접 증명(BLUE hold+blueEnv=3·redEnv=0 → neutral_declare 가중 0, status_quo 42로 흡수) | `resolveSupplyEnvelope.test.ts` #6 |
| M5(선택) | `runPlanetRebellionResolutionDailyPass.ts` — 동측 STRONG hold의 반란 전복 확률에 `envelopeRebellionOverthrowMul`(기본 1.35)을 최종 `factionMul`에만 곱함. wealth 곡선(`overthrowBaseProbAtDanger` 등) 자체는 무변경. `isPlanetContestedZone` 스킵(정적 5행)은 그대로 유지 — 동적 편입(iron_remnant 등)만 이 가산의 실질 대상 | `runPlanetRebellionResolutionDailyPass.ts` |
| M6 | 신규 `tables/balance/arc_core_supply_envelope_policy.csv`(단일 행, envelopeMinSystems=3·occupyHighWeightPct=88·envelopeBattleWeightBoostPct=20·envelopeNeutralDeclareMul=0·envelopeRebellionOverthrowMul=1.35) + `arcCoreSupplyEnvelopePolicy.ts` 로더(O(1) 캐시). 로직이 `runTerritorialCombatPassForPlanet`(모든 ActivePool planetId 공용 진입점) 안에 있어 CSV 정적행·동적 편입(iron_remnant 등) **전부 자동 적용** — 별도 분기 없음 | 신규 CSV·`arcCoreSupplyEnvelopePolicy.ts` |
| M7 | unit 25케이스 신규 + 기존 territorial 10개 테스트 파일 전체 회귀 PASS + `tsc` PASS | 아래 self-check |

### 아이언크로스 회귀 방지 (수용 기준 핵심)

`resolveSupplyEnvelope.test.ts` #6 — BLUE hold + blueEnv=3·redEnv=0(STRONG)이면 `neutral_declare` 가중치가 CSV 12%에서 **0**으로 억제되고 그만큼 `status_quo`가 흡수(30→42)함을 직접 assert. 정적 배선 테스트(#11)로 `runTerritorialCombatPass.ts`가 이 보정값을 실제 `rollDecision`에 전달하는지도 확인.

### self-check 결과

```
npx tsc --noEmit -p tsconfig.client.json                              → PASS(에러 0)
npx tsx --test resolveSupplyEnvelope.test.ts                           → PASS 12/12(신규, 아이언 회귀 재현 포함)
npx tsx --test resolveEffectiveTerritorialCombatMode.test.ts           → PASS 15/15(회귀)
npx tsx --test contestedEligibility.test.ts                            → PASS 11/11(회귀)
npx tsx --test contestedPoolGovernor.test.ts                           → PASS 11/11(회귀)
npx tsx --test contestedActivePool.test.ts                             → PASS 5/5(회귀)
npx tsx --test geoFlankHeliosTitanOccupation.test.ts                   → PASS 7/7(회귀)
npx tsx --test territorialStackConsistency.test.ts                     → PASS 6/6(회귀)
npx tsx --test territorialSupplyLine.test.ts                           → PASS 16/16(회귀)
npx tsx --test frontPressureIndex.test.ts                              → PASS 5/5(회귀)
npx tsx --test seedPlanetOccupationFromBalance.test.ts                 → PASS(회귀)
npx tsx --test planetHoldReleasePolicy.test.ts                         → PASS 6/6(회귀)
```

### 회귀 판별력 검증

`runTerritorialCombatPass.ts`의 envelope 배선을 `git stash`로 일시 되돌려 정적 테스트 #11이 **FAIL**(rollDecision이 여전히 CSV 원본 가중치만 사용) 확인 → `git stash pop` 복원 후 **PASS** 재확인.

### CSV / 기존값 변경 여부

`arc_core_territorial_combat_policy.csv`(정적 5행 battle/neutral/statusQuo/combatMode) **git diff 없음**. `faction_political_relations.csv`·`planet_occupation_seeds.csv` 무변경. wealth/반란 곡선 CSV(`overthrowBaseProbAtDanger` 등) 무변경 — M5는 최종 `factionMul`에만 배율을 곱함. 신규 CSV(`arc_core_supply_envelope_policy.csv`) 1개만 추가, `build:balance-tables` 반영 완료. `if (planetId === 'iron_remnant')` 류 하드코딩 없음(정적 grep 테스트로 고정).

### 리스크 · soft(실기 미확인)

- 실기 1바퀴 순차(20분 간격)에서 실제로 NEUTRAL+3포위가 다음 due에 고확률 점유되는지, iron_remnant류가 실제로 neutral_declare에서 안전한지는 unit·정적 검증만 — 실기 로그(`[territorial] ... 보급포위 envelope=...`) 확인은 김팀장/대표님 몫.
- M5(반란 가산)는 "선택" 항목으로 구현했으나, `isPlanetContestedZone`이 CSV 정적 5행만 스킵하고 동적 편입은 스킵하지 않는다는 기존 동작을 그대로 활용 — 새로 만든 조건 분기 없음(기존 계약 재사용).
- `occupyHighWeightPct`(88%)·`envelopeBattleWeightBoostPct`(20)·`envelopeRebellionOverthrowMul`(1.35) 등 신규 CSV 수치는 대표님 정본 문서의 기본값을 그대로 채택 — 실기 체감 후 조정 필요 시 CSV 값만 바꾸면 됨(코드 변경 불필요).

**git commit 안 함** — 김팀장(Cursor 본창) 검수·커밋 요청.

---

## ✅ REVIEWED — 분쟁 ActivePool·UI 정합 수정(M0~M6) · 김클로드

### 김팀장 검수 (본창 Cursor · 2026-07-31 · 대표님 「검수하라」)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS** — READY M0~M6 충족 · 대표님 지적(SAFE인데 목록/링 잔존 · iron_remnant 우선 승격) 해소 |
| **task_id** | `contested-active-pool-ui-fix-20260731` |
| M1~M2 | suspend 오버레이 + `listTerritorialCombatPolicies` 단일 필터 → 캠페인·예고 링 파생 반영 |
| M4 | `PROMOTE_TIER` strategic_neutral 최우선 · 1b 테스트(iron vs eternal_throne) |
| M5 | 후보 우주 = occupation seed + 해금 `synth_*` |
| M6 | `contestedActivePool` 5 · governor/eligibility · territorial 회귀 · **tsc PASS** |
| CSV | `arc_core_territorial_combat_policy.csv` **무변경**(런타임 suspend만) |
| **검수 수정** | `arcCoreTerritorialCombatPolicy.ts` — `getPlanetOccupationSeedRow` import를 함수 선언 **앞**으로 정리(모듈 중간 import) |
| soft | `getTerritorialCombatPolicy`·`listContestedZoneSystemIds`/`isContestedZoneSystemId`는 suspend 비인지(시드·설계 조회용 · UI 예고는 preview 경로) · 실기 Shadow 링 사라짐 확인 권장 |
| 커밋 | 대표님 지시 시 |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED` → `IDLE` 가능** |
| **updated** | 2026-07-31 (김팀장 검수 PASS) |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-contested-active-pool-ui-fix.md` |
| **선행** | `contested-eligibility-pool-governor-20260731` |

---

## 📋 PENDING (archived) — ActivePool·UI 정합 · 김클로드 구현 원문

```text
status=PENDING (archived → REVIEWED 2026-07-31)
task_id=contested-active-pool-ui-fix-20260731
verdict=PASS (김팀장)
commit 금지(당시)
```

### [pss-pre-dev]

```text
[pss-pre-dev] hot_path=territorial dirty rebalance 1회 · ActivePool revision 캐시 · alloc=후보 bounded
[pss-pre-dev] stage=arcCore territorial + worldmap preview 읽기만 · Skia 무관 · risk=P1·P6
[pss-pre-dev] verdict=PASS — onBoot 동기 전수 금지 · CSV 정적 행 파일 삭제 금지 · suspend/ActivePool 필터만
```

### 구현 요약 (M0~M6)

| M | 내용 | 파일 |
|---|------|------|
| M0 | 소비처 표(아래) | 본 항목 |
| M1 | `setSuspendedStaticPlanetIds`/`isSuspendedStaticPlanetId`(신규) — SAFE로 판정된 CSV 정적행을 담는 런타임 오버레이(파일 무변경, in-memory·revision 추적, persist 불필요한 파생 캐시) | `dynamicContestedZoneStore.ts` |
| M2 | **ActivePool 정본 단일화** — `listTerritorialCombatPolicies()`가 suspend된 CSV 정적행을 결과에서 제외하도록 필터 추가(dynamic SAFE 항목은 기존 거버너가 이미 store remove하므로 별도 처리 불필요). `listTerritorialCombatPoliciesForCampaign`·`resolveContestedZonePreviewSystemIds`는 전부 이 함수 파생이라 **단일 지점 수정으로 캠페인 due·지도 예고 링에 자동 반영** — 섀도우 SAFE면 링에도 안 뜸 | `arcCoreTerritorialCombatPolicy.ts`(캐시 키에 suspend revision 결합) |
| M3 | 캠페인 due: Active 목록 자체에 SAFE가 없는 게 정본(M2) — 기존 M2(이전 task) 스킵 루프는 **안전망으로 그대로 유지**(이중 방어, 코드 변경 없음) | 변경 없음(`runTerritorialCombatPass.ts`) |
| M4 | **min8 우선순위 하드 티어 신설** — `PROMOTE_TIER_BY_CLASSIFICATION`(strategic_neutral=0 최우선 · front=1 · independent_front=2)를 점수보다 먼저 비교해 정렬. 점수만으로는 보너스(연속+15·최근전투+10)가 겹치면 FRONT가 STRATEGIC_NEUTRAL 기본값을 역전할 수 있어 "중립 후보 있으면 무조건 먼저"를 못 지켰던 문제를 하드 티어로 해결. `scoreContestedEligibilityCandidate`도 STRATEGIC_NEUTRAL=120(FRONT 100보다 높게) 갱신(문서 일관성용, 강제는 티어가 담당) | `contestedPoolGovernor.ts` |
| M5 | 승격 후보 우주 확장 — 21코어(occupation seed) **+ 현재 해금된 synth 프론티어 성계**(`worldStore.unlockedSystemIds` 중 `synth_*`, 대표 planetId=`systems[id].planets[0]`). 대부분 NEUTRAL 시작(`seedSynthFrontierNeutralHold`)이라 "외곽 국경 중립" 후보 풀이 넓어져 FRONT 땜빵 없이도 min8을 채우기 쉬워짐 | `contestedPoolGovernorSync.ts`(`buildSystemUniverse`) |
| M6 | unit 16케이스 신규(이번 task) + 기존 territorial 10개 테스트 파일 전체 회귀 PASS + `tsc` PASS | 아래 self-check |

### M0 — 소비처 표

| 경로 | 역할 | 이번 task 영향 |
|------|------|----------------|
| `arcCoreTerritorialCombatPolicy.ts`(`listTerritorialCombatPolicies`) | ActivePool 정본 | suspend 필터 추가(단일 지점) |
| `listTerritorialCombatPoliciesForCampaign` | 캠페인 due 후보 목록 | `listTerritorialCombatPolicies()` 파생이라 자동 반영, 캐시 키만 suspend revision 포함하도록 갱신 |
| `resolveContestedZonePreviewSystemIds.ts` | 지도 예고 링 | 무변경(파생 자동 반영) — 직접 unit 테스트로 shadow_nexus 미표시 확인 |
| `contestedPoolGovernorSync.ts`(`rebalanceContestedPoolsNow`) | rebalance 오케스트레이션 | 그룹 루프 종료 후 `safeStaticPlanetIds` 집계해 `setSuspendedStaticPlanetIds` 1회 호출. 그룹 목록은 **원본 CSV**에서 뽑도록 변경(정적 5행이 전부 동시 SAFE로 suspend돼도 그룹 자체가 사라져 재평가 기회를 잃지 않게) |
| `dynamicContestedZoneStore.ts` | suspend 오버레이 저장소 | 신규 3함수 추가, zustand 의존 없음(순환참조 안전) |
| `getTerritorialCombatPolicy(planetId)` (단일 조회) | 시드 reconcile(`isTerritorialProcessPlanet` 등)·기존 테스트가 CSV 설계값 그대로 기대 | **의도적으로 미변경** — Active 목록(List) 함수만 suspend-aware, 단일 lookup은 "정책 존재 여부(설계 사실)"라는 별개 의미라 손대면 시드 reconcile·geoFlank/seed 테스트가 깨짐(scope 경계로 판단) |

### self-check 결과

```
npx tsc --noEmit -p tsconfig.client.json                              → PASS(에러 0)
npx tsx --test contestedActivePool.test.ts                             → PASS 5/5(신규 — ActivePool·지도 링·CSV 파일 보존)
npx tsx --test contestedPoolGovernor.test.ts                           → PASS 11/11(4 신규 티어케이스 포함)
npx tsx --test contestedEligibility.test.ts                            → PASS 11/11(회귀)
npx tsx --test resolveEffectiveTerritorialCombatMode.test.ts           → PASS 15/15(회귀)
npx tsx --test geoFlankHeliosTitanOccupation.test.ts                   → PASS 7/7(회귀)
npx tsx --test territorialStackConsistency.test.ts                     → PASS 6/6(회귀)
npx tsx --test territorialSupplyLine.test.ts                           → PASS 16/16(회귀)
npx tsx --test frontPressureIndex.test.ts                              → PASS 5/5(회귀)
npx tsx --test seedPlanetOccupationFromBalance.test.ts                 → PASS(회귀)
npx tsx --test planetHoldReleasePolicy.test.ts                         → PASS 6/6(회귀)
```

### 회귀 판별력 검증

- M2(ActivePool suspend 필터)를 임시로 되돌려 `contestedActivePool.test.ts`가 **FAIL**(suspend해도 목록에 남음) 확인 → 복원 후 **PASS**.
- M4(하드 티어)를 임시로 점수-only 정렬로 되돌려 `contestedPoolGovernor.test.ts` 1b가 **정확히 iron_remnant를 승격**하는 실패로 재현(대표님이 지적한 바로 그 버그) 확인 → 복원 후 **PASS**.

### CSV / 기존값 변경 여부

`arc_core_territorial_combat_policy.csv`(정적 5행) **git diff 없음** — CSV 원본 파일에 shadow_market 등 정적행이 그대로 남아있음을 테스트로 직접 확인(`contestedActivePool.test.ts` #4, 파일 텍스트 read). `faction_political_relations.csv`·`planet_occupation_seeds.csv` 무변경. 신규 CSV 추가 없음(이전 task의 `arc_core_contested_pool_policy.csv`만 유지, 이번엔 수치 변경 없음).

### 리스크 · soft(실기 미확인) · 참고

- 이번 세션 중 `contestedPoolGovernorSync.ts`에 **외부(김팀장/훅)가 이미 추가해 둔** "stepMax로 1회에 min/max 미도달 시 dirty 재마킹" 로직(A안 수렴 보정)을 발견 — 손대지 않고 그 위에 M1~M5를 얹었음. 이 로직 덕분에 min8 도달까지 여러 패스에 걸쳐 자동으로 재시도됨(제 예상 리스크였던 "step 상한 도달 후 고착" 문제가 이미 해결돼 있었음).
- 실기 미확인: 실제 기기에서 섀도우 넥서스가 지도 링·캠페인에서 사라지는지, min8 보충이 실제로 중립(예: eternal_throne/genesis_origin/해금 synth)만으로 채워지는지는 unit·정적 검증만.
- `getTerritorialCombatPolicy` 단일 조회는 의도적으로 suspend 비인지 상태로 남김(위 M0 표 근거) — 김팀장 검수 시 이 경계가 제품 의도와 맞는지 확인 요청.

**git commit 안 함** — 김팀장(Cursor 본창) 검수·커밋 요청.

---

## ✅ REVIEWED — 분쟁지역 Eligibility·풀 거버너(A안, M0~M7) · 김클로드

### 김팀장 검수 (본창 Cursor · 2026-07-31 · 대표님 「검수하라」)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS** — READY M0~M7 충족 · A안 min8 수렴 **1건 검수 중 수정** |
| **task_id** | `contested-eligibility-pool-governor-20260731` |
| M1 | SAFE/FRONT/중립/독립국 분류 · 섀도우 RED 완포위 → `safe_hinterland` 테스트 |
| M2 | SAFE 스킵 + `advanceTerritorialCampaignCursorForSkip`(due 창 미소비) |
| M3~M5 | 풀 거버너 순수 plan · CSV 정적 강등 금지 · demote/쿨다운 · 신규 CSV min8/max12/step2 |
| M6 | dirty rebalance · purge 시 `arc_*` 보존 · onBoot 동기 전수 없음 |
| M7 | tsc PASS · eligibility/governor + territorial 회귀 PASS |
| CSV | `arc_core_territorial_combat_policy.csv` **무변경** · `arc_core_contested_pool_policy.csv` **추가만** |
| **검수 수정** | `contestedPoolGovernorSync.ts` — stepMax로 1회에 min/max 미달 시 **dirty 재마킹**(5→7 고착 방지, A안 8 수렴) |
| 커밋 | 대표님 지시 시 · soft: 실기 로그(`[territorial] SAFE 스킵` / `풀 거버너 승격`) 확인 권장 |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED` → `IDLE` 가능** |
| **updated** | 2026-07-31 (김팀장 검수 PASS) |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-contested-eligibility-pool-governor.md` |

---

## 📋 PENDING (archived) — 분쟁 Eligibility 거버너 · 김클로드 구현 원문

```text
status=PENDING (archived → REVIEWED 2026-07-31)
task_id=contested-eligibility-pool-governor-20260731
```

| 필드 | 값 |
|------|-----|
| **status** | archived |
| **updated** | 2026-07-31 (김클로드 구현) |
| **task_id** | `contested-eligibility-pool-governor-20260731` |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-contested-eligibility-pool-governor.md` |

### [pss-pre-dev]

```text
[pss-pre-dev] hot_path=territorial rebalance(캠페인1바퀴·hold변경 dirty) 1회 · alloc=후보스코어 bounded(21계) · cache=revision+adjacency
[pss-pre-dev] stage=arcCore territorial only · Skia/UI 무관 · risk=P1(빈도)·P6(persist coalesce)
[pss-pre-dev] verdict=PASS — onBoot 동기 전은하 스캔 금지 · SAFE 스킵+거버너만 · 기존 pass 스택 유지
```

### 구현 요약 (M0~M7)

| M | 내용 | 파일 |
|---|------|------|
| M0 | 소비처 표(아래) — policy list·campaign state·dynamic store·probe/pass 진입점·purge. 전 repo 스캔 없이 READY §1 힌트 경로만 확인 | 본 항목 |
| M1 | 순수 `classifyContestedEligibility`/`resolveContestedEligibilityForSystem` — SAFE_HINTERLAND(BLUE/RED hold+적대 인접 0, `hasAdjacentHostileFactionSystem` 재사용)·ELIGIBLE_FRONT(양쪽 인접, holdSide 무관)·ELIGIBLE_STRATEGIC_NEUTRAL(NEUTRAL+한쪽만)·ELIGIBLE_INDEPENDENT_FRONT(INDEPENDENT+적대 인접)·INELIGIBLE. **섀도우 넥서스 RED 완포위 실측 재현 테스트로 safe 확인**(수용기준 1) | `contestedEligibility.ts`(신규)·`.test.ts` |
| M2 | 캠페인 due 판정에서 SAFE면 판정 0회 스킵 — `advanceTerritorialCampaignCursorForSkip`(신규, `lastPassAtMs` 불변·`nextPreviewOrderIndex`만 전진)로 같은 pass 내 다음 ELIGIBLE로 즉시 재시도(빈 슬롯 정지 금지), 그룹 길이만큼만 시도(무한루프 방지) | `arcCoreTerritorialCombatState.ts`·`runTerritorialCombatPass.ts` |
| M3 | ActivePool = (CSV enabled·contestedZone 행 ∪ dynamic 항목) − SAFE. `planContestedPoolRebalance`(순수) — N<min이면 승격, N>max면 강등, **CSV 정적행은 강등 대상에서 원천 제외**(파일 삭제 금지·SAFE는 M2 스킵으로만 제외) | `contestedPoolGovernor.ts`(신규) |
| M4 | 승격 스코어: FRONT=100·STRATEGIC_NEUTRAL=60·**INDEPENDENT_FRONT=80(문서 미명시 — front/strategic_neutral 중간값 채택, soft)**·Active 1홉 연속 +15·플레이어 최근 전투 +10(`isWaveCombatCooldownActive` 재사용). 동점은 planetId 사전순 결정적. `promoteDynamicContestedZone` 재사용(템플릿 합성) — **NEUTRAL 승격의 initial combatMode는 별도 곡선 없이 템플릿 기본값(blue_red) 유지**: 기존 P0(2026-07-28)가 매 패스 런타임 인접으로 재계산하므로 정적 초기값이 무의미해짐(문서 "추가 밸런스 곡선 금지"와 일치). `source` 태그 `arc_frontline`/`arc_strategic_neutral`(INDEPENDENT_FRONT도 `arc_frontline`로 태깅, soft) | `contestedPoolGovernorSync.ts`(신규, glue) |
| M5 | 강등: CSV 정적은 파일 무변경(스킵 게이트만) · 동적(arc_*·player 무관)은 `demoteDynamicContestedZone`(신규)로 store remove + `recentlyDemoted` 쿨다운 기록. 쿨다운 = `cooldownLaps × 현재 활성 정책 수 × passIntervalSec`(신규 CSV `arc_core_contested_pool_policy.csv`: min8/max12/step2/cooldownLaps2) | `dynamicContestedZoneStore.ts`(확장)·`arcCoreContestedPoolPolicy.ts`(신규 로더)·신규 CSV |
| M6 | 주기: onBoot 동기 전수 스캔 없음 — `markContestedPoolDirty()`를 `applyArcCoreTerritorialHold`/`claimPlanetOwnershipByPurchase`/purge-pipeline 3곳(기존 `invalidateFrontPressure` 호출부와 동일 지점)에 추가, `runTerritorialCombatPass()`가 매 probe에서 `rebalanceContestedPoolsIfDirty()`로 dirty일 때만 1회 실행. **계정 purge 계약 변경**: `resetDynamicContestedZonesForAccountPurge`가 이제 `source` 접두 `arc_`(거버너 승격)는 **보존**, `player_wave*`만 기존대로 제거(월드축 vs 플레이어 귀속 진행 분리) | `dynamicContestedZoneStore.ts`·`clanWarFoundationStore.ts`(3곳)·`runTerritorialCombatPass.ts` |
| M7 | unit 27케이스(신규) + 기존 territorial 9개 테스트 파일 전체 회귀 PASS + `tsc` PASS | 아래 self-check |

### M0 — 소비처 표

| 경로 | 역할 | 이번 task 영향 |
|------|------|----------------|
| `arcCoreTerritorialCombatPolicy.ts`(`listTerritorialCombatPolicies`/`ForCampaign`) | CSV+dynamic 병합 정책 목록 | **무변경**(M3가 `listTerritorialCombatPolicies()` 결과를 읽기만) |
| `arcCoreTerritorialCombatState.ts` | 캠페인 순차 due·커서 | `advanceTerritorialCampaignCursorForSkip` 신규 함수만 추가 |
| `dynamicContestedZoneStore.ts` | 동적 편입 저장(AsyncStorage) | `demoteDynamicContestedZone`·`isRecentlyDemoted`·`pruneExpiredRecentlyDemoted`·dirty 플래그 3종 추가, purge 로직 변경(M6) |
| `runTerritorialCombatPass.ts` | 판정 스택 진입점 | 캠페인 루프에 SAFE 스킵 + dirty rebalance 호출 추가. **내부 P0/R1/전술역전 로직 무변경** |
| `localAccountReset.ts`(purge) | `resetDynamicContestedZonesForAccountPurge` 호출 | 함수 시그니처 무변경, 내부 동작만 변경(arc_* 보존) — 호출측 무수정 |
| `waveCombatCooldownStore.ts`(`isWaveCombatCooldownActive`) | 최근 전투 신호 | 읽기만(M4 스코어링) |
| `factionPoliticalRelations.ts`/`territorialSupplyLine.ts` | 적대관계·인접 카운트 | 읽기만(재사용, 신규 로직 없음) |

### self-check 결과

```
npx tsc --noEmit -p tsconfig.client.json                              → PASS(에러 0)
npx tsx --test contestedEligibility.test.ts                            → PASS 11/11(신규, 섀도우 완포위 실측 재현 포함)
npx tsx --test contestedPoolGovernor.test.ts                           → PASS 8/8(신규, 순수 로직)
npx tsx --test resolveEffectiveTerritorialCombatMode.test.ts           → PASS 15/15(회귀)
npx tsx --test geoFlankHeliosTitanOccupation.test.ts                   → PASS 7/7(회귀)
npx tsx --test territorialStackConsistency.test.ts                     → PASS 6/6(회귀)
npx tsx --test territorialSupplyLine.test.ts                           → PASS 16/16(회귀)
npx tsx --test frontPressureIndex.test.ts                              → PASS 5/5(회귀)
npx tsx --test seedPlanetOccupationFromBalance.test.ts                 → PASS(회귀, 동적 캠페인 순번 무관)
npx tsx --test planetHoldReleasePolicy.test.ts                         → PASS 6/6(회귀, purge 무관 확인)
```

### 회귀 판별력 검증

M2/M6 배선(`runTerritorialCombatPass.ts`)을 `git stash`로 일시 되돌려 정적 배선 테스트가 **FAIL**(SAFE 스킵/dirty rebalance 호출부 부재) 확인 → `git stash pop` 복원 후 **PASS** 재확인. 풀 거버너 순수 로직(`contestedPoolGovernor.test.ts`)은 승격/강등 목록의 구체적 내용·길이·순서를 assert(에러 유무만 체크 아님)해 트리비얼 통과가 아님.

### CSV / 기존값 변경 여부

`arc_core_territorial_combat_policy.csv`(정적 5행 combatMode/가중치/passInterval) **무변경**(git diff 없음). `faction_political_relations.csv`·`planet_occupation_seeds.csv` **무변경**(읽기만). 신규 추가만: `tables/balance/arc_core_contested_pool_policy.csv`(poolMin=8/poolMax=12/stepMax=2/cooldownLaps=2) — `npm run build:balance-tables`로 generated 반영 완료(자동 CSV→TS 파이프라인, 별도 배선 불필요). `planetId==='shadow_market'` 류 하드코딩 없음(정적 grep 테스트로 고정).

### 리스크 · soft(실기 미확인) · 해석적 결정

- **INDEPENDENT_FRONT 스코어(+80)** — READY M4 표에 명시 없음. front(100)/strategic_neutral(60) 중간값을 안전 기본으로 채택. 실제 게임플레이 체감상 우선순위 조정 필요하면 `contestedPoolGovernor.ts`의 `scoreContestedEligibilityCandidate` 한 줄만 수정하면 됨(밸런스 CSV화는 이번 범위 밖).
- **쿨다운 산식**(`cooldownLaps × 활성정책수 × passIntervalSec`)은 "캠페인 2바퀴"의 근사치 — 실제 캠페인 길이(8~12 변동)를 그때그때 반영해 재계산하므로 풀이 커질수록 쿨다운도 길어짐(의도된 근사, 별도 상수 하드코딩 아님).
- **실기 미확인**: 부트 후 실제 기기에서 ActivePool이 실제로 8까지 자동 채워지는지, 섀도우 넥서스가 실제로 로테이션에서 스킵되는지는 unit·정적 검증만 — 실기 로그(`[territorial] ... SAFE(완포위) 스킵`/`풀 거버너 승격`) 확인은 김팀장/대표님 몫.
- `eligible_independent_front` 승격이 `runIndependentHoldInvasionJudgment`(기존, 미변경)에 판정 기회를 부여하는 유일한 경로임을 코드 추적으로 확인(정책 없는 행성은애초 `runTerritorialCombatPassForPlanet` 진입 자체가 안 됨) — 부수 효과지만 의도된 것으로 판단, 문제 시 M4 스코어를 낮춰 억제 가능.
- 계정 purge 계약 변경(arc_* 보존)은 `localAccountReset.ts` 호출부 코드 변경 없이 내부 동작만 바뀜 — 김팀장 검수 시 실제 purge 흐름(로그인 계정 초기화)에서 arc_frontline 항목이 남는지 실기 확인 권장.

**git commit 안 함** — 김팀장(Cursor 본창) 검수·커밋 요청.

---

## ✅ REVIEWED — omega_hub `combatMode` 프로세스 충돌 재수정(M0~M5) · 김클로드

### 김팀장 검수 (본창 Cursor · 2026-07-30 · 대표님 「검수하라」)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS** — READY R1~R5·M0~M5 충족 · 검수 중 코드 수정 없음 |
| **task_id** | `omega-combatmode-runtime-conflict-20260729` |
| M1 | BLUE/RED hold + contested + 양쪽 인접 → `effective=blue_red` (R1) · NEUTRAL P0 회귀 유지 |
| M2 | early `policy vs graph` warn 제거 · battle 경로에서 `effective vs runtimeGraph`만 비교(R4) |
| M3 | unit 15케이스 PASS(오메가 재현 7·7b 포함) · 하드코딩 없음 |
| M4 | geoFlank 7/7 · stackConsistency 6/6 회귀 PASS |
| M5 | `tsc --noEmit -p tsconfig.client.json` PASS |
| CSV | `omega_hub` `blue_neutral` **무변경**(런타임 effective만) |
| 커밋 | 일부 daily snapshot에 포함됐을 수 있음 · 추가 커밋은 대표님 지시 시 |
| soft | 실기 1패스(RED attacker 실측) 미확인 · warn은 battle 진입 시에만(status_quo면 무관) |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED` → `IDLE` 가능** |
| **updated** | 2026-07-30 (김팀장 검수 PASS) |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-omega-combatmode-runtime-conflict.md` |

### 검수 메모

- 재발 핵심(BLUE 홀드 + CSV `blue_neutral` → RED 배제) **코드상 해소**: `effective=blue_red` → `attacker=RED, defender=BLUE`.
- 「참고용 경고」 오진 경로 제거됨 — 최종 effective가 runtime과 같으면 warn 없음.

---

## 📋 PENDING (archived) — omega combatMode 재수정 · 김클로드 구현 원문

```text
status=PENDING→REVIEWED
task_id=omega-combatmode-runtime-conflict-20260729
verdict=PASS (김팀장 2026-07-30)
commit 금지(검수 시)
재발원인: P0(NEUTRAL 전용)는 BLUE/RED hold가 되면 CSV combatMode가 영구 고정 → 양쪽 인접(접전)이어도 반대편이 battle에서 배제. 이전 조치는 warn 문구 완화·INDEPENDENT skip만 손대 실효 모드는 안 고쳐 재발.
실측대응: BLUE(또는 RED) hold + 블루·레드 둘 다 인접(contestedZone) → effective=blue_red(holdSide 무관, R1 신설)
self-check: tsc=PASS · unit=territorial 전체 PASS(신규 9케이스 포함)
```

| 필드 | 값 |
|------|-----|
| **status** | ~~PENDING~~ → **REVIEWED** |
| **updated** | 2026-07-29 (김클로드 구현) |
| **task_id** | `omega-combatmode-runtime-conflict-20260729` |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-omega-combatmode-runtime-conflict.md` |

### [pss-pre-dev]

```text
[pss-pre-dev] hot_path=territorial_pass 1행성 · alloc=adjacency·effective 1회 · cache=세션 warn Set
[pss-pre-dev] stage=arcCore_territorial · risk=P1(틱금지)·CSV기존행무단변경금지
[pss-pre-dev] verdict=PASS — effectiveMode만 런타임 접전 정렬·planetId 하드코딩 금지
```

### 재발 원인 (3줄)

`resolveEffectiveTerritorialCombatMode`의 P0는 **NEUTRAL hold 전용**이라, omega_hub가 한 번 BLUE 점유가 되면 CSV `blue_neutral`이 **영구 고정**돼 타이탄(RED) 인접이 있어도 매 battle에서 RED가 배제됐다(`resolveAttackerDefenderSides(BLUE, blue_neutral)` → attacker=NEUTRAL/defender=BLUE, RED 진입 불가). 이전 조치는 DEV 경고 문구를 "참고용"으로 완화하고 INDEPENDENT hold의 그래프 검증만 skip해 **드라코 독립국 경고만 해소**했을 뿐, 이 실효 모드 고착 자체는 손대지 않아 오메가에서 그대로 재발했다.

### 구현 요약 (M0~M5)

| M | 내용 | 파일 |
|---|------|------|
| M0 | READY §0~§1 요약(위 재발 원인 3줄) · 소비처 확인: `resolveEffectiveTerritorialCombatMode`(핵심 수정) · `runTerritorialCombatPassForPlanet`(배선) · `inferTerritorialCombatModeFromGraph`(런타임 그래프 참고, 재사용만·중복 로직 없음) | 본 항목 |
| M1 | **R1 신설** — `contestedZone && hasBlue && hasRed`면 **holdSide 무관** `effective='blue_red'`. NEUTRAL hold의 기존 P0(2026-07-28, contestedZone 무관 "양쪽>0→blue_red")는 **그대로 보존**(회귀 없음) — R1은 BLUE/RED(비중립) hold에만 새로 추가된 분기. `planetId` 미입력 구조 유지(하드코딩 불가) | `resolveEffectiveTerritorialCombatMode.ts` |
| M2 | `runTerritorialCombatPassForPlanet` — 이미 배선된 `effectiveCombatMode` 호출부에 `contestedZone: policy.contestedZone` 인자 추가. **R4**: 독립국 분기 직후에 있던 옛 조기 그래프 경고(`policy.combatMode` vs runtimeGraph, effective 계산 전)를 **삭제**하고, `effectiveCombatMode` 계산 직후(battle 경로 진입 지점)로 이동해 **`effectiveCombatMode` vs runtimeGraph**를 비교하도록 정정 — 최종 effective가 런타임과 일치하면 경고 없음(이전엔 CSV 원본만 비교해 effective가 이미 맞아도 계속 오탐 경고가 났음) | `runTerritorialCombatPass.ts` |
| M3 | unit 9케이스 신규: (7)오메가 실측 재현(BLUE hold+blue_neutral CSV+양쪽인접→blue_red) (7b)RED hold도 동일 (7c)contestedZone=false면 R1 미적용(비중립 CSV 유지) (7d)contestedZone=false+NEUTRAL+양쪽인접은 기존 P0 경로로 여전히 blue_red(회귀 없음 고정) (8)R4 배선 정적확인(옛 조기경고 제거+새 위치가 effectiveCombatMode 사용) + 기존 1~6c 케이스 `contestedZone` 파라미터 추가 갱신 | `resolveEffectiveTerritorialCombatMode.test.ts` · `territorialStackConsistency.test.ts`(호출부 갱신) |
| M4 | 기존 geo-flank·P0·stack-consistency·supplyLine·frontPressure 회귀 테스트 전부 재실행 PASS(신규 로직이 기존 케이스에 영향 없음 확인) | — |
| M5 | self-check(아래) 전부 PASS | — |

### 회귀 판별력 검증

M1(R1) 핵심 수정을 `git stash`로 일시 되돌려 신규 테스트 7번이 **FAIL**(`actual: 'blue_neutral', expected: 'blue_red'` — 오메가 재발 시나리오 그대로 재현) 확인 → `git stash pop` 복원 후 **PASS** 재확인. 트리비얼 통과 아님.

### self-check 결과

```
npx tsc --noEmit -p tsconfig.client.json                                → PASS(에러 0)
npx tsx --test resolveEffectiveTerritorialCombatMode.test.ts            → PASS 15/15(9 신규 포함)
npx tsx --test geoFlankHeliosTitanOccupation.test.ts                    → PASS 7/7(회귀)
npx tsx --test territorialStackConsistency.test.ts                      → PASS 6/6(회귀)
npx tsx --test territorialSupplyLine.test.ts                            → PASS 16/16(회귀)
npx tsx --test frontPressureIndex.test.ts                               → PASS 5/5(회귀)
```

### CSV / 기존값 변경 여부

`arc_core_territorial_combat_policy.csv`(omega_hub `blue_neutral` 포함 전 행) **git diff 없음** — 런타임 effective만 조정, CSV `combatMode`/가중치/`dominantSideWeightPct` 등 전부 무변경. `planetId==='omega_hub'` 류 하드코딩 없음(6b 회귀 테스트로 고정).

### 리스크 · soft(실기 미확인)

- 실기(오메가 실제 1패스 battle 진입 시 RED가 attacker로 잡히는지·`[territorial] omega_hub 최종 effective=... != runtimeGraph=...` 경고가 실제로 사라지는지)는 **미확인** — unit·정적 검증만.
- R1은 `policy.contestedZone`에 의존하는데, 현재 CSV 전 행이 `contestedZone=true`라 실질적으로 전부 적용됨(향후 비분쟁 고정 행이 추가되면 R1 미적용 — 의도된 게이트).
- 독립국(INDEPENDENT) 침공 분기는 이 리졸버를 아예 거치지 않음(제어 흐름상 항상 그 전에 return) — 변경·영향 없음, 회귀 테스트(territorialStackConsistency #2)로 재확인.

**git commit 안 함** — 김팀장(Cursor 본창) 검수·커밋 요청.

---

## ✅ REVIEWED — 정식 서비스 성계 개방·세대 리셋(M0~M6) · 김클로드

### 김팀장 검수 (본창 Cursor · 2026-07-29 · 대표님 「검수하라」)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS** — READY M0~M6 충족 · 검수 중 코드 수정 없음 |
| **task_id** | `service-launch-world-expansion-reset-20260729` |
| M1 | `resolveWorldExpansionHardReset` — gen/epoch mismatch · `null`→hardReset · `undefined`→false(안전) |
| M2~M3 | `preserveAlreadyUnlocked=false` 시 targetCount 축소 · 일상 `true`면 기존 unlock 보존(테스트 a/a-대조/b) |
| M4 | `clearSynthFrontierNeutralHold` — 순수 neutral만 삭제 · 21코어/분쟁 hold 비대상 |
| M5~M6 | schedule 11/11 · resetDetection 5/5 · `tsc --noEmit -p tsconfig.client.json` PASS |
| CSV | `world_expansion_timing_policy`·territorial **무변경** (epoch=`2026-06-26` gen=`2` 유지) |
| 커밋 | **미커밋** — 대표님 지시 시 김팀장 커밋 |
| soft | 실기 hardReset 미확인 · Sync 경로 applied 캐시 1틱 지연 가능 · 결함 C(정책 캐시 하이드레이트 Sync 미배선) 후속 P1 · async `syncArcCoreGlobalWorldExpansion` dead 유지 |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED` → `IDLE` 가능** |
| **updated** | 2026-07-29 (김팀장 검수 PASS) |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-service-launch-world-expansion-reset.md` |

### 검수 메모

- 핵심 레버(세대 bump → 초과 synth 잠금 → epoch 재개방) **코드상 성립**.
- 정식일 반영은 여전히 **운영 체크리스트**(epochDayKey·resetGeneration·RTDB) — 본 패치는 레버만.
- handoff M0 표기 `epochDayKey=2026-06-01`은 오기 · 실 CSV는 **`2026-06-26`**.

---

## 📋 PENDING (archived) — 정식 서비스 성계 개방·세대 리셋 · 김클로드 구현 원문

```text
status=PENDING→REVIEWED
task_id=service-launch-world-expansion-reset-20260729
verdict=PASS (김팀장 2026-07-29)
commit 금지(검수 시)
```

| 필드 | 값 |
|------|-----|
| **status** | ~~PENDING~~ → **REVIEWED** |
| **updated** | 2026-07-29 (김클로드 구현) |
| **task_id** | `service-launch-world-expansion-reset-20260729` |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-service-launch-world-expansion-reset.md` |
| **prompt** | `tools/kim-team-lead/reports/kim-claude-task-prompt-latest.txt` |

### [pss-pre-dev]

```text
[pss-pre-dev] hot_path=부트·일일배치1회 sync · alloc=reconcile시 unlocked배열1회 · cache=정책캐시·applied상태
[pss-pre-dev] stage=worldmap unlock 집합 · risk=P6(persist)·세대리셋시대량 remove
[pss-pre-dev] verdict=PASS — 틱/루프 신규 없음 · gen mismatch 때만 강제 reconcile · 21코어·분쟁 CSV 무단변경 없음
```

### 확정된 근본 원인 (재확인)

`buildDeterministicGlobalSynthUnlockSchedule`가 `alreadyUnlockedSynthIds`를 **`maxSynthUnlockCount` 체크 없이** schedule 접두로 무조건 밀어넣어, `targetCount`가 줄어도(세대 리셋) 결과 집합이 절대 줄어들지 않았음(결함 A). `syncArcCoreGlobalWorldExpansionSync`(실제 호출되는 유일한 경로 — 아래 M0 참고)는 `resetGeneration`을 **쓰기만** 하고 비교하지 않았음(결함 B) — 즉 세대 bump 레버 자체가 무의미했다.

### 구현 요약 (M0~M6)

| M | 내용 | 파일 |
|---|------|------|
| M0 | 소비처·저장키 표(아래) — **`syncArcCoreGlobalWorldExpansion`(async)은 실제로 어디서도 호출되지 않는 죽은 함수**임을 확인(진짜 호출부는 전부 `...Sync`). 이 사실이 hardReset 감지 설계(동기 캐시 필요)의 핵심 전제 | 아래 표 |
| M1 | `resolveWorldExpansionHardReset(applied, policy)` 신설(순수 함수, 신규 파일) — `applied` 없음(과거 기록 無+정책 存) 또는 `resetGeneration`/`epochDayKey` 불일치 → `hardReset=true`. 동기 호출 경로는 모듈 로드 시 백그라운드로 미리 읽어둔 인메모리 캐시(`appliedStateCache`)로 비교(레이스 시 안전 기본값 `false`, 다음 호출에서 자기 교정) — 비동기 경로는 항상 `await`로 실측 비교 | `src/arcCore/worldExpansionGlobalResetDetection.ts`(신규) · `syncArcCoreGlobalWorldExpansion.ts` |
| M2 | `hardReset=true`면 `buildGlobalSynthUnlockTargetIds(..., preserveAlreadyUnlocked=false)` — 접두 고정을 끄고 baseline+결정적 pick만으로 `targetCount`개를 순수 계산 → `reconcileGlobalSynthUnlocks`가 초과분을 정확히 remove | `worldExpansionGlobalSchedule.ts`(`preserveAlreadyUnlocked` 신규 파라미터, 기본 `true`=기존 동작) |
| M3 | `hardReset=false`(일상)면 `preserveAlreadyUnlocked=true`(기본값) — 기존 증분 접두 유지, 이미 연 성계가 되돌아가지 않음. 신규 unit(a-대조)으로 고정 | 상동 |
| M4 | `removed`(잠긴 synth) 각각에 대해 `clearSynthFrontierNeutralHold(planetId)` 신규 스토어 액션 호출 — `seedSynthFrontierNeutralHold`가 만든 **순수 neutral 자리표만** 제거(`kind==='neutral' && occupierClanId==='neutral'` 가드), player_home·독립국·클랜 점유는 절대 안 건드림. 21코어·BLUE/RED 시드 planetHolds는 애초에 `removed`(synth_* 한정)에 없으므로 무관 | `src/store/clanWarFoundationStore.ts`(`clearSynthFrontierNeutralHold` 신규 액션) · `syncArcCoreGlobalWorldExpansion.ts`(`clearRemovedSynthFrontierHolds` 헬퍼, 양쪽 sync 함수에서 호출) |
| M5 | unit 11케이스: (a) 세대bump→5개가 targetCount(2)로 축소 (a-대조) preserve=true면 5개 그대로(회귀 금지 고정) (b) 세대동일+1일→기존 유지+1개만 추가 (c) epoch전날→targetCount=0→빈 스케줄(hardReset 무관) (d) GAMEPLAY_SYSTEM_IDS는 스케줄 결과물에 안 나옴 (d-2) worldStore.ts 소스에 21코어 baseline 제외 필터가 실제 있는지 정적 확인 + `resolveWorldExpansionHardReset` 5케이스(mismatch 3종·일치·미하이드레이트) | `worldExpansionGlobalSchedule.test.ts`(확장) · `worldExpansionGlobalResetDetection.test.ts`(신규) |
| M6 | self-check(아래) 전부 PASS | — |

### M0 — 소비처·저장키 표

| 항목 | 역할 | 비고 |
|------|------|------|
| `arcfire_world_expansion_global_applied_v1`(AsyncStorage) | 직전 sync 결과({resetGeneration,epochDayKey,targetCount,lastSyncedAtMs}) | 이번에 **처음으로 실제 비교 대상**이 됨(M1) |
| `arcfire_world_expansion_global_policy_v1`(AsyncStorage) | RTDB origin 정책 캐시(`rtdbPolicyOverride` 하이드레이트) | **운영 주의**: `hydrateWorldExpansionGlobalPolicyCache()`는 여전히 미사용(dead) 비동기 함수 `syncArcCoreGlobalWorldExpansion`에서만 호출됨 — 실제(동기) 경로는 RTDB 캐시를 부트 시 하이드레이트하지 않음(결함 C, 본 task 범위 밖·후속 P1로 남김). RTDB `ingestRtdbWorldExpansionMasterState`가 라이브 세션 중 직접 override를 세팅하므로 정상 운영 중엔 큰 문제 없으나, "재시작 직후·RTDB 접속 전" 창에서는 CSV 폴백을 씀 |
| `tables/balance/world_expansion_timing_policy.csv` | CSV 폴백 정책(`globalScheduleEnabled/epochDayKey/resetGeneration/systemsPerDay`) | **읽기만**, 값 변경 없음(현재 `epochDayKey=2026-06-26` · `resetGeneration=2`) |
| `arcfire_world_v1`(worldStore AsyncStorage) | `unlockedSystemIds`/`systems`/`synthColonizationPhaseByPlanetId` | `reconcileGlobalSynthUnlocks`가 갱신(기존 함수, 변경 없음 — 이미 baseline 21코어 보존 로직 있음을 재확인) |
| clanWarFoundationDb(로컬 영속) | `planetHolds` | 신규 `clearSynthFrontierNeutralHold` 액션이 removed synth 자리표만 정리 |
| `WorldExpansionSubCore.onBoot()` | 부트 1회 호출 — `syncArcCoreGlobalWorldExpansionSync()` | `arcCoreHub.start()`가 `bootReady`(월드스토어 hydrate 포함 병렬 로드 완료) 이후에만 실행돼 `world.loaded` 보장됨 — 모듈 로드 시 시작한 applied-state 백그라운드 하이드레이트가 이 시점까지 끝날 여유 확보 |
| `tryArcCoreWorldDailyUnlock()`(`worldExpansionDailyUnlock.ts`) | 일일 운영 배치(`runArcCoreDailyOpsBatch`)에서 호출 | 반환값(`added.length>0`) 사용 — 시그니처 변경 없음(하위호환) |
| `localAccountReset.ts`(계정 초기화) | 초기화 후 `syncArcCoreGlobalWorldExpansionSync()` 재호출 | 변경 없음 |
| `fetchArcCoreRtdbOnce.ts`(RTDB ingest) | ingest 성공 후 `syncArcCoreGlobalWorldExpansionSync()` | 변경 없음 |
| `syncArcCoreGlobalWorldExpansion`(async, export) | **실사용처 0곳 확인**(재확인용 죽은 함수) | M1 로직은 정확성을 위해 여기서도 `await`로 실측 비교하도록 구현했지만, 실제 앱에서 호출되지 않으므로 이 함수의 hardReset 판정은 현재 아무 데도 영향 없음 — 향후 배선 여부는 본 task 범위 밖 |

### self-check 결과

```
npx tsc --noEmit -p tsconfig.client.json                              → PASS(에러 0)
npx tsx src/arcCore/worldExpansionGlobalSchedule.test.ts               → PASS 11/11(5 기존+6 신규)
npx tsx src/arcCore/worldExpansionGlobalResetDetection.test.ts         → PASS 5/5(신규)
```

### 회귀 판별력 검증

M2 핵심 수정(`preserveAlreadyUnlocked`)을 `git stash`로 일시 되돌려 (a) 테스트가 **FAIL**(`5 !== 2`, 정확히 결함 A 재현) 확인 → `git stash pop` 복원 후 **PASS** 재확인. 트리비얼 통과 아님.

### CSV / 기존값 변경 여부

`tables/balance/world_expansion_timing_policy.csv`(`epochDayKey`/`resetGeneration` 등) **무변경** — 현재 값 그대로 유지, 실제 "정식일" 확정은 본 task 밖(김팀장/대표님 승인 후 운영 반영). `arc_core_territorial_combat_policy.csv`·21코어 시드 CSV **무변경**. combatMode/가중치/passInterval **무변경**.

### 운영 체크리스트 (§4, 실행은 김팀장/운영 — 코드 레버는 이미 동작하게 완료)

```text
[ ] epochDayKey = 정식 시작일(KST YYYY-MM-DD)
[ ] resetGeneration = 이전 값 + 1
[ ] systemsPerDay = 1 · globalScheduleEnabled = true
[ ] build:balance-tables
[ ] RTDB worldExpansion/master/state 동일 값 publish (캐시 덮어쓰기)
[ ] 기존 기기: 부트/일일배치 후 synth unlock 수 == 경과일치 · 21코어 유지
[ ] 분쟁 3~5행성 로테이션·hold 시드 회귀 없음(본 task 무변경 확인)
```

### 리스크 · soft(실기 미확인)

- 실기(실제 기기 재시작 → hardReset 발동 → synth 잠금·hold 정리) 체감은 **미확인** — unit·정적 검증만.
- 동기 경로의 "미하이드레이트 시 안전 기본값 false" 레이스는 이론상 최초 부트 딱 1회 hardReset 판정을 1틱 늦출 수 있음(다음 호출에서 자기 교정) — `arcCoreHub.start()`가 `bootReady`(world hydrate 완료) 이후에만 실행되는 기존 부트 시퀀스상 실제 발생 가능성은 낮음.
- 정책 캐시(RTDB AsyncStorage) 하이드레이트 미배선(결함 C)은 **본 task 범위 밖**으로 남김 — 위 M0 표에 운영 주의로 기록.
- `syncArcCoreGlobalWorldExpansion`(async) 자체가 dead code — 삭제 여부는 김팀장 판단(본 task는 로직만 정합화, 삭제는 별건 "가비지 코드" 정리로 남김).

**git commit 안 함** — 김팀장(Cursor 본창) 검수·커밋 요청.

---

## ✅ REVIEWED — 성계 노드라인 전수검사·연동 재검증(M0~M6) · 김클로드

### 김팀장 검수 (본창 Cursor · 2026-07-28 · 대표님 「김클로드 작업도 완료됬다 재검수하라」)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS** — READY M0~M6 충족 · 검수 중 코드 수정 없음 |
| **task_id** | `system-node-graph-full-reaudit-20260728` |
| M0 | 소비처 표 OK · `runPlanetEnvironmentDiversityPass` GALAXY 일관(수정 불필요) |
| M1 | `audit-system-connections-full` asymmetric=[] · heliosPerseusDirect=false · withoutStarRows=[] |
| M2 | 정본 5홉·`omega↔draco` 유지 · planets.csv 키 엣지 실측 OK |
| M3 | `capSystemGraphMaxDegree` Pass1 tier0 keep · map-vs-csv drop/extra=[] |
| M4 | `build:content-tables`에 `sync-star-system-connections-from-planets.mjs` 편입 확인 · build 주석 OK |
| M5~M6 | `systemNodeGraphRegression` 7/7 PASS · supplyLine·geoFlank·stackConsistency 회귀 PASS · tsc PASS |
| CSV | combatMode/가중치 **무변경**(본 task) · star/planets는 선행 sync 계열 |
| 커밋 | **미커밋** — 대표님 지시 시 김팀장 커밋 |
| soft | 실기 월드맵 미확인 · 앱 완전 재시작 권장(`GALAXY_SYSTEMS_PRECOMPUTED` 모듈 캐시) |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED` → 이어서 `IDLE` 가능** |
| **updated** | 2026-07-28 (김팀장 검수 PASS) |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-system-node-graph-full-reaudit.md` |
| **prompt** | `tools/kim-team-lead/reports/kim-claude-task-prompt-latest.txt` |
| **선행(재검증 대상)** | `SYSTEM_NODE_GRAPH_FULL_SYNC_20260728.md` · `HELIOS_PERSEUS_EDGE_REMOVAL_20260728.md` |

### [pss-pre-dev]

```text
[pss-pre-dev] hot_path=galaxy_graph_gen·부트 · alloc=프리컴퓨트1회 · cache=GALAXY_SYSTEMS_PRECOMPUTED
[pss-pre-dev] stage=worldmap+territorial · risk=P1·이중그래프
[pss-pre-dev] verdict=PASS — CSV=지도 플레이엣지 일치·숏컷/비대칭 수정·틱금지
```

### 재검증 결론 — 김팀장 초안 주장 5개 전부 **실측 확인**(맹신 없이 재검증)

| 초안 주장 | 재검증 방법 | 결과 |
|-----------|-------------|------|
| helios↔perseus 직접 엣지 삭제 | `audit-system-connections-full.mjs` `heliosPerseusDirect` | **false**(없음) 확인 |
| draco↔sirius 대칭 | 동일 audit `asymmetricPlanets`/`asymmetricGenerated` | **[]**(비대칭 0) 확인 |
| star_system_connections.csv 21성계 전량 동기 | `starCoverage.withoutStarRows` | **[]**(21개 전부 star 행 보유) 확인 |
| galaxy100 tier0 보존(플레이↔플레이 무손실) | `audit-map-vs-csv-connections.mjs` + 코드 리뷰(`capSystemGraphMaxDegree` Pass1이 tier0을 maxDegree/교차 무시하고 무조건 keep) | drop=**[]** · extra=**[]** 확인, 코드도 실제 그렇게 구현됨 |
| `sync-star-system-connections-from-planets.mjs` 신설 | 파일 존재 확인 | 존재하나 **`build:content-tables`에 미편입**(진짜 빌드 함정 잔존) — **이번 task에서 M4로 수정** |

### 구현 요약 (M0~M6)

| M | 내용 | 파일 |
|---|------|------|
| M0 | 노드 소비처 전수 표 재작성(아래 표) — 초안이 놓친 신규 소비처 2곳 추가 발견(`runPlanetEnvironmentDiversityPass.ts`) | 본 handoff 하단 표 |
| M1 | `audit-system-connections-full.mjs` + `audit-map-vs-csv-connections.mjs` 실행 — **둘 다 FAIL 없음**(수정 불필요, 초안이 이미 정상 상태로 만들어 놓음) | 변경 없음(검증만) |
| M2 | 정본 항로 5홉 엣지(헬→오메→뉴에덴→베가→드라코→페르) 전부 유효·양방향 확인, `omega_station↔draco_nebula` 정상 1홉 유지 확인 | `systemNodeGraphRegression.test.ts` 3·4번 |
| M3 | `capSystemGraphMaxDegree` tier0 보존 계약 — 코드 리뷰(Pass1 무조건 keep) + 실측(drop/extra=0) 이중 확인. 회귀 아님 — 수정 불필요 | 변경 없음(검증만) |
| M4 | **실제 수정** — `sync-star-system-connections-from-planets.mjs`를 `build:content-tables`에 편입(`patch-planets-en.mjs`·`sync-synth-ownership-into-item-defs.mjs` 이후, `build-content-from-csv.mjs` 직전 — planets.csv 최종 확정 후 star CSV 재생성 후 빌드). `build-content-from-csv.mjs`에 "star CSV는 planets 파생·수동 부분편집 금지" 1줄 주석 추가 | `package.json`(`build:content-tables` 스크립트) · `tools/content-tables/build-content-from-csv.mjs`(주석) |
| M5 | `npm run build:content-tables` + `npm run gen:galaxy-graph` 재실행 → 두 audit 재실행 **PASS**(diff 0), `npx tsc --noEmit` **PASS** | 재생성물: `star_system_connections.csv`·`csvSystems.ts`·`galaxySystems100.generated.ts`(git diff는 초안의 기존 미커밋 수정과 동일 계열 — 새 회귀 없음, 아래 확인 참고) |
| M6 | `systemNodeGraphRegression.test.ts` 7케이스: helios-perseus 직접없음, sirius-draco 대칭, 정본5홉, omega-draco 정상유지, 전역비대칭0, **tier0 drop/extra=0**(플레이↔플레이 이동=분쟁그래프 동일), star CSV 21성계 전량 | `src/galaxyMap/systemNodeGraphRegression.test.ts`(신규) |

### M0 — 노드 소비처 전수 표

| 경로 | 그래프 | 확인 |
|------|--------|------|
| `worldStore.systems`(worldmap.tsx·GalaxyMapSystemsSvg·findShortestUnlockedSystemPath) | `GALAXY_SYSTEMS_PRECOMPUTED`(galaxy100) | import 직접 확인 |
| `resolvePlanetSystemPosition.ts` / `resolvePlanetById.ts` | GALAXY 우선 + STAR 폴백(순환참조 방지 주석 명시) | 소스 확인 |
| `territorialSupplyLine.ts`(`listAdjacentSystemIds`) / `territorialCombatGraph.ts` / FrontPressure | `STAR_SYSTEMS_FROM_CSV`(csvSystems, planets.csv 파생) | import 직접 확인 |
| `worldExpansionFrontier.ts` / `worldExpansionUnlockDispatch.ts` / `worldExpansionFreshStartSeed.ts` / `coreOpenGameplayPlanets.ts` | `GAMEPLAY_SYSTEM_IDS`/`GALAXY_SYSTEMS`(월드 확장 synth 프런티어) | import 직접 확인 |
| `mineralDepositModel.ts` | `GALAXY_SYSTEMS`(좌표·자원 배치, 그래프 순회 아님) | import 직접 확인 |
| **`runPlanetEnvironmentDiversityPass.ts`**(초안 표에 없던 소비처, 이번에 발견) | `useWorldStore`(GALAXY 계열) — 현재 성계·연결 성계 주변 행성 리밸런스 | grep으로 신규 발견, GALAXY축과 일관 사용 중이라 **수정 불필요**(누락 발견만) |
| `data/systems.ts`(`STAR_SYSTEMS`) | `STAR_SYSTEMS_FROM_CSV` 단순 재노출 | 소스 확인 |

### 완료 게이트 결과

```text
audit-system-connections-full → asymmetric=0 · heliosPerseusDirect=false · planetsVsGenerated=[]
audit-map-vs-csv-connections → dropped=[] · extra=[]
정본항로 헬→오메→뉴에덴→베가→드라코→페르 = OK(엣지 5개 양방향 확인)
tsc PASS · build:content-tables 재실행(sync 스크립트 편입 후) · gen:galaxy-graph 재실행 기록 완료
build 파이프라인 star sync 편입 = **이번 task에서 완료**(이전엔 미편입 — 진짜 발견된 잔여 결함)
```

### 회귀 판별력 검증

`systemNodeGraphRegression.test.ts`의 6번(tier0 drop/extra) 테스트는 생성물(`galaxySystems100.generated.ts`)에서 `iron_cross→new_eden` tier0 엣지 하나를 일시 제거해 **FAIL**(`actual: ['iron_cross->new_eden']`) 확인 → `npm run gen:galaxy-graph` 재생성으로 복원 후 **PASS** 재확인. 트리비얼 통과 아님.

### self-check 결과

```
npx tsc --noEmit -p tsconfig.client.json                    → PASS(에러 0)
node tools/debug/audit-system-connections-full.mjs           → PASS(FAIL 없음)
node tools/debug/audit-map-vs-csv-connections.mjs             → PASS(dropped=[]·extra=[])
npx tsx --test src/galaxyMap/systemNodeGraphRegression.test.ts → PASS 7/7(신규)
npx tsx --test src/arcCore/territorial/territorialSupplyLine.test.ts → PASS(회귀, STAR_SYSTEMS 소비처 무관)
npx tsx --test src/arcCore/territorial/geoFlankHeliosTitanOccupation.test.ts → PASS(회귀)
npx tsx --test src/arcCore/territorial/territorialStackConsistency.test.ts → PASS(회귀)
```

### CSV / 기존값 변경 여부

`combatMode`/가중치 CSV **무변경**. `planets.csv`·`star_system_connections.csv`는 **초안(김팀장 이전 세션)이 이미 수정한 값 그대로**(이번 task에서 값 자체를 추가 변경하지 않음) — 이번 재실행으로 재생성된 `star_system_connections.csv`/`csvSystems.ts`/`galaxySystems100.generated.ts`의 git diff는 초안이 만든 수정과 동일 계열(helios-perseus 제거·sirius-draco 대칭·tier0 복원)이며 신규 회귀 없음(audit·unit 전부 diff 0 확인). 정상 1홉(`helios↔omega`/`omega↔draco`/`draco↔perseus` 등) **삭제 없음**. synth 배치 알고리즘 무변경. Skia/STAGE 무관.

### 참고 — 동시 진행 중인 별건 변경(무관, 미개입)

세션 중 `src/arcCore/territorial/territorialCombatGraph.ts`가 외부(김팀장/훅)에 의해 별도로 수정됨(`resolveAdjacentSystemFactionPresence`가 런타임 holds 인자를 받도록 확장 — 본 task와 무관한 territorial 판정 개선). 본 task는 이 파일을 건드리지 않았고, tsc·회귀 테스트로 상호 충돌 없음만 확인.

### 리스크 · soft(실기 미확인)

- 앱 완전 재시작 권장(초안 경고 유지) — `GALAXY_SYSTEMS_PRECOMPUTED`/`STAR_SYSTEMS` 모듈 캐시 특성상, 실기(월드맵 렌더·이동·분쟁 판정 실제 화면) 확인은 **미실시**(정적 데이터·audit·unit만).
- M4(빌드 파이프라인 편입)가 유일한 실질 코드/설정 변경 — 나머지는 초안 상태 재검증(대부분 이미 정상). 향후 `planets.csv`를 손으로 고치고 빌드를 돌리면 이제 자동으로 `star_system_connections.csv`까지 갱신되므로, "부분 3성계만 기재" 재발 가능성이 구조적으로 낮아짐.

**git commit 안 함** — 김팀장(Cursor 본창) 검수·커밋 요청.

---
## ✅ REVIEWED — ArcCore 분쟁·점령 스택 일관성·효율 최적화(M0~M4) · 김클로드

### 김팀장 검수 (본창 Cursor · 2026-07-28 · 대표님 「김클로드 작업 끝 검수하라」)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS** — READY M0~M4 충족 · 검수 중 코드 수정 없음 |
| M0 | strategy §6-3 파이프라인·P0~P4·감사 교차참조 OK |
| M1 | `DRACO_FRONT_CAMPAIGN_PLANET_ORDER` 삭제 · CSV `campaignOrder` 주석 OK · src 잔존 없음(테스트 문자열만) |
| M2 | policy/campaign revision 캐시 · `setMem` 3곳 bump · dyn Set O(1) · `invalidate` 클리어 OK |
| M3 | 시드 owner 모듈 1회 인덱스 · DEV warn 세션당 systemId 1회 · 판정 로직 무변경 OK |
| M4 | `territorialStackConsistency` 6/6 PASS · P0 resolver 회귀 10/10 PASS |
| CSV | 본 task 수치/가중치 **무변경**(helios/titan CSV diff는 직전 geo-flank 미커밋) |
| 게이트 | `tsc` PASS · unit PASS |
| 커밋 | **미커밋** — 대표님 지시 시 김팀장 커밋 |
| soft | M5 미착수(지시 범위) · 실기 힙/CPU 미프로파일 · warn Set 모듈 전역(로그용만) |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED`** |
| **updated** | 2026-07-28 (김팀장 검수) · 2026-07-28(김클로드 구현) |
| **task_id** | `territorial-stack-consistency-opt-20260728` |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-territorial-stack-consistency-opt.md` |
| **audit** | `tools/kim-team-lead/reports/TERRITORIAL_STACK_CONSISTENCY_AUDIT_20260728.md` |
| **범위** | M0~M4 · **M5 미착수**(다음 회차 가능) |

### [pss-pre-dev]

```text
[pss-pre-dev] hot_path=territorial_probe_60s·pass_1h · alloc=정책목록캐시·시드인덱스1회 · cache=revision
[pss-pre-dev] stage=arcCore_territorial · risk=P1(틱전량재스캔금지)·P6(persist빈도유지)
[pss-pre-dev] verdict=PASS — 밸런스CSV수치무단변경금지·순수캐시/데드코드/문서·회귀테스트
```

**git commit 안 함** — 대표님 지시 시 김팀장 커밋.

---

## ✅ REVIEWED — 중립 점령 런타임 인접(보급) P0(M0~M5) · 김클로드

### 김팀장 검수 (본창 Cursor · 2026-07-28 · 대표님 「검수하라」)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS** — READY 핵심(중립+한쪽만 인접→우세 축) 충족 · 검수 중 코드 수정 없음 |
| M0 | strategy §6-2 · geo-flank와 충돌 시 **런타임 P0 우선** 명시 OK |
| M1 | `resolveEffectiveTerritorialCombatMode` 순수함수 · planetId 없음 · 블루만/레드만/둘다/고립 OK |
| M2 | battle 경로 attacker·binary·holdTarget·dominant 전부 `effectiveCombatMode` · meta에 policyCombatMode OK |
| M3 | blue_red 공격자 확정과 이중 충돌 없음(주석) OK |
| M4 | unit 10/10 PASS · 타이탄 CSV red_neutral+블루만→`blue_neutral` · 배선 grep OK |
| M5 | §6-2에 geo-flank=접전/고립 폴백 명시 OK |
| CSV | 본 task로 combatMode/가중치 **추가 변경 없음**(런타임 오버라이드만) |
| 게이트 | `tsc` PASS · unit PASS |
| 커밋 | **미커밋** — 대표님 지시 시 김팀장 커밋 |
| soft | 고립(둘다0)은 READY의 status_quo 강제 대신 **CSV P1 폴백**(허용 범위) · 실기 1h 미확인 · P0는 **battle 분기**에서만 적용(status_quo면 여전히 미진입) |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED`** |
| **updated** | 2026-07-28 (김팀장 검수) · 2026-07-28(김클로드 구현) |
| **task_id** | `neutral-adjacency-occupation-priority-20260728` |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-neutral-adjacency-occupation-priority.md` |

### [pss-pre-dev]

```text
[pss-pre-dev] hot_path=territorial_pass_1h · alloc=보급카운트O(인접)·모드해석1회 · cache=없음
[pss-pre-dev] stage=arcCore_territorial · risk=P1(틱추가금지)·planetId하드코딩금지
[pss-pre-dev] verdict=PASS — NEUTRAL hold에서만 effectiveMode 해석·CSV행무단변경금지(런타임오버라이드)
```

### 김클로드 구현 요약 (ARCHIVE)

- M1: `resolveEffectiveTerritorialCombatMode.ts`
- M2: `runTerritorialCombatPass.ts` effective 배선
- M4: unit 10 · M0/M5 strategy §6-2

---

## ✅ REVIEWED — 계정 초기화 시 소유권 성계 중립화(M0~M5) · 김클로드

### 김팀장 검수 (본창 Cursor · 2026-07-28 · 대표님 「클로드 김 작업 검수하라」)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS** — READY M0~M5 충족 · 검수 중 코드 수정 없음 |
| M0 | 시드복원≠중립화 · 시리우스 `red_territory` · `purge_all_non_ai` 과잉 — 원인 서술 OK |
| M1 | `player_independent` → `neutral`+`neutralizedAt`+deed/home 클리어 · CSV 시드 복원 우회 OK |
| M2 | `purge_all_non_ai` → 플레이어 유래만 · 국가 시드 hold 보존(iron_remnant 테스트) OK |
| M3 | purge_account→시드파이프→purge_all_non_ai 연타 후에도 neutral 유지 OK |
| M4 | unit 6케이스 PASS · 하드코딩 grep OK · 시리우스 재구매 `red_territory` 아님 |
| M5 | dissolve 동일 중립화 · FrontPressure invalidate(occupier 변경 시) OK |
| 게이트 | `tsc` PASS · `planetHoldReleasePolicy.test.ts` PASS |
| 커밋 | **미커밋** — 대표님 지시 시 김팀장 커밋 |
| soft | 실기 미확인 · `homePlayerUid`는 uid 일치 시에만 null(정상 purge 경로 OK) · clans 맵 non-ai 삭제 범위는 별건 · nebula purge 구멍은 **본 task 범위 외**(이전 재검수 P0) |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED`** |
| **updated** | 2026-07-28 (김팀장 검수) · 2026-07-28(김클로드 구현) |
| **task_id** | `account-purge-ownership-neutralize-20260728` |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-account-purge-ownership-neutralize.md` |
| **요청자** | 대표님 점검 → 김팀장 READY → 김클로드 착수 |

### [pss-pre-dev]

```text
[pss-pre-dev] hot_path=계정purge1회 · alloc=holds맵부분갱신 · cache=없음
[pss-pre-dev] stage=타이틀복귀전 · risk=P6(persist1회)·ArcCore월드축오삭제금지
[pss-pre-dev] verdict=PASS — 틱/루프추가금지·player_independent해제만·시드팩션영토진행보존
```

### 김클로드 구현 요약 (ARCHIVE)

- M1: `planetHoldReleasePolicy` 독립국→중립화
- M2: `purge_all_non_ai` 플레이어 유래만
- M4: unit 6 · M5 dissolve+FrontPressure
- 변경: `planetHoldReleasePolicy.ts` · `clanWarFoundationStore.ts` · 신규 test

---

## ✅ REVIEWED — 헬리오스·타이탄 게이트 지리 우세 점령(M0~M5) · 김클로드

### 김팀장 검수 (본창 Cursor · 2026-07-28 · 대표님 「검수하라」)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS** — READY M0~M5 충족 · 검수 중 코드 수정 없음 |
| M0 | `docs/strategy/…` §6-1 geo-flank 실구현 표(순차4·5·combatMode·지리 근거) · §6 제안과 구분 OK |
| M1 | CSV `helios_core` blue_neutral 70% order4 · `titan_ruins` red_neutral 70% order5 · omega/shadow/draco **기존행 무변경** · seeds **미변경** |
| M2 | generated 정책 2행 · `draco_front` 길이 5 · 순번 1…5 단위테스트 OK |
| M3 | 동적 `sirius_border` 첫 슬롯 **4→6** · 리셋 후 정적 길이 **5** assertion 갱신 OK |
| M4 | `geoFlankHeliosTitanOccupation.test.ts` 정책·순서·회귀·하드코딩 grep PASS |
| M5 | iron_cross→helios BLUE 보급 · shadow_nexus→titan_gate RED 보급 병행 PASS |
| 게이트 | `tsc` PASS · unit(geoFlank+seed) PASS · (김클로드 self-check: build:balance-tables · audit:memory:all) |
| 커밋 | **미커밋** — 대표님 지시 시 김팀장 커밋 |
| soft | 실기 1h territorial 체감 미확인 · 로테이션 5→6 희석(handoff 리스크 동의) · 70% 상향은 대표님 확인 후 |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED`** |
| **updated** | 2026-07-28 (김팀장 검수) · 2026-07-28(김클로드 구현) |
| **task_id** | `geo-flank-helios-titan-occupation-20260728` |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-geo-flank-helios-titan-occupation.md` |
| **요청자** | 대표님 기획 → 김팀장 REFLECTABLE → 김클로드 착수 |

### [pss-pre-dev]

```text
[pss-pre-dev] hot_path=territorial_pass_1h · alloc=정책Map부트1회 · cache=policy_O1
[pss-pre-dev] stage=arcCore_territorial · risk=P1(틱추가금지)·부트동기패스금지
[pss-pre-dev] verdict=PASS — CSV행추가+로더/캠페인정렬·planetId하드코딩분기금지
```

### 김클로드 구현 요약 (ARCHIVE)

- M0: strategy §6-1 실구현 표
- M1: policy CSV +2행 (헬리오스 블루70%·타이탄 레드70%)
- M2~M4: build · 동적 order 6 · unit+하드코딩 금지
- M5: 보급 병행 2케이스
- 변경: CSV · generated · seed 테스트 · geoFlank 테스트 · strategy 문서

---

## ✅ REVIEWED — 은하 지도 플레이어 독립국 국가명 라벨 (M0~M4) · 김클로드

### 김팀장 검수 (본창 Cursor · 2026-07-27 · 대표님 「검수하라」)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS** — READY M0~M4 충족 · 검수 중 코드 수정 없음 |
| M0 | 원인=`MIN_LABEL_COMPONENT_AREA_PX2` 공용 적용 → 소형 independent skip · 단위테스트 재현 근거 OK |
| M1 | `MIN_LABEL_COMPONENT_AREA_INDEPENDENT_PX2=0` · blue/red 12_000 **유지** |
| M2 | `buildOccupationLabels` 위치식 무수정 · `TERRITORY_LABEL` 공용 유지 |
| M3 | i18n/`worldmap.tsx` 무수정 |
| M4 | unit 3케이스 PASS · import→`mapFactionSideCore` (tsx 테스트용·동작 동일) OK |
| 게이트 | `tsc` PASS · unit PASS |
| 커밋 | **미커밋** — 대표님 지시 시 김팀장 커밋 |
| soft | 실기(월드맵) 미확인 · 극소 셀에서도 라벨 표시(의도) |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED`** |
| **updated** | 2026-07-27 (김팀장 검수) · 2026-07-27(김클로드 구현) |
| **task_id** | `galaxy-map-independent-nation-label-20260727` |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-galaxy-map-independent-nation-label.md` |

### [pss-pre-dev]
```
[pss-pre-dev] hot_path=worldmap_useMemo_1회 · alloc=라벨배열N개상한 · cache=voronoi모델기존
[pss-pre-dev] stage=galaxy_map · risk=P1(틱금지)·P3(memo deps)
[pss-pre-dev] verdict=PASS — 렌더/틱 신규루프금지·기존 occupationLabels 파이프라인확장만
```

---

## 📦 ARCHIVE — 김클로드 원문 (독립국 국가명 라벨 · status→REVIEWED)

| 필드 | 값 |
|------|-----|
| **status** | ~~PENDING~~ → **REVIEWED** (상단 참조) |
| **updated** | 2026-07-27 (김클로드) |
| **task_id** | `galaxy-map-independent-nation-label-20260727` |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-galaxy-map-independent-nation-label.md` |

### M0~M4 요약 (김클로드)
- M0: 면적 게이트로 independent 1성계 skip
- M1: independent만 하한 0
- M2~M3: 위치·폰트·i18n 기존 유지
- M4: unit 3 + mapFactionSideCore import

---

## ✅ REVIEWED — 아크코어 수송선단 체류 튕김·부자연 회전 (M0~M4) · 김클로드

### 김팀장 검수 (본창 Cursor · 2026-07-27 · 대표님 「검수하라」)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS** — READY M0~M2·M4 충족 · M3 미착수(허용) · 검수 중 코드 수정 없음 |
| M0 | `publishSnapshot`의 `orbitAngleRad+=`·`readPlanetOrbitClockMs` 제거 · worklet 단일 적분 |
| M1 | dwelling 반경 재할당 삭제 · entering 시작 시 `orbitRadiusPx`/`orbitAngleRad` 확정 |
| M2 | `orbitAng += (phaseEl0+dt)*rate` · unit 3케이스 PASS(재-pack 연속) |
| M3 | 타원 각속도 — **미착수**(선택·기존값 재확인 대상) OK |
| M4 | AiNpc / worklets / SkiaLayer 계약 주석 OK |
| 게이트 | `tsc` PASS · unit PASS · `audit:worklet-contract` PASS |
| 커밋 | **미커밋** — 대표님 지시 시 김팀장 커밋 |
| soft | 실기 30초+ 미확인 · wall(`phaseElapsedSec`) vs orbit SharedValue(`dt`) 잔여 드리프트 가능 · M3 후속 |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED`** |
| **updated** | 2026-07-27 (김팀장 검수) · 2026-07-27(김클로드 구현) |
| **task_id** | `arc-transport-dwell-jank-20260727` |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-arc-transport-dwell-jank.md` |

### [pss-pre-dev]
```
[pss-pre-dev] hot_path=orbit_worklet_60fps·snapshot_0.25s · alloc=flat재팩시점만 · cache=arcPackSig
[pss-pre-dev] stage=planet_hub_orbit · risk=P1(이중적분)·P3(전함재팩동기화)
[pss-pre-dev] verdict=PASS — 틱당 신규할당금지·sync/적분 단일화만
```

---

## 📦 ARCHIVE — 김클로드 원문 (수송 체류 튕김 · status→REVIEWED)

| 필드 | 값 |
|------|-----|
| **status** | ~~PENDING~~ → **REVIEWED** (상단 참조) |
| **updated** | 2026-07-27 (김클로드) |
| **task_id** | `arc-transport-dwell-jank-20260727` |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-arc-transport-dwell-jank.md` |

### M0~M4 요약 (김클로드)
- M0: JS 이중적분 삭제 · worklet-only
- M1: dwelling 반경 점프 제거
- M2: phaseEl 앵커 공식 + unit test
- M3: 미착수 · M4: 주석

---

## ✅ REVIEWED — 점령·중립화·소유권 후 「국가」표시 연동 (M0~M5) · 김클로드

### 김팀장 검수 (본창 Cursor · 2026-07-27 · 대표님 「김팀장 검수시작」)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS** — READY M0~M5 충족 · 검수 중 코드 수정 없음 |
| M0 | Core/글루 분리 · `resolveMapFactionSideFromClanId` 재사용 · independent=`worldmap.territory.nation.independent` |
| M1 | strip ko/en + reprefix · neutral→접두 제거 |
| M2 | `resolvePlanetTableDescription` 반환 직전 단일 주입 OK |
| M3 | C1~C7 코드추적+단위테스트 근거 수용 |
| M4 | `occupierFactionLabelKo` independent→동일 i18n 키 |
| M5 | unit 10케이스 PASS |
| P3 | Overlay `planetDescription` memo에 hold deps 추가 확인 |
| 게이트 | `tsc` PASS · unit PASS · `planets.csv` diff 없음 |
| 커밋 | **미커밋** — 대표님 지시 시 김팀장 커밋 |
| soft | 실기(시리우스) 미확인 · stage 설명에도 접두 신규 부착(의도적·되돌리기 용이) · hold 미시드 시 neutral로 접두 제거 가능(시드 파이프라인 전제) |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED`** |
| **updated** | 2026-07-27 (김팀장 검수) · 2026-07-27(김클로드 구현) |
| **task_id** | `planet-nation-display-sync-20260727` |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-planet-nation-display-sync.md` |

### [pss-pre-dev]
```
[pss-pre-dev] hot_path=행성정보오버레이오픈·스냅샷1회 · alloc=문자열치환1회 · cache=hold키미사용금지
[pss-pre-dev] stage=dispose불필요(순수표시) · risk=P3(설명memo시hold미포함)·P1(틱경로금지)
[pss-pre-dev] verdict=PASS — CSV기존값불변·런타임접두만재작성·틱/persist추가금지
```

---

## 📦 ARCHIVE — 김클로드 원문 (국가 표시 연동 · status→REVIEWED)

| 필드 | 값 |
|------|-----|
| **status** | ~~PENDING~~ → **REVIEWED** (상단 참조) |
| **updated** | 2026-07-27 (김클로드) |
| **task_id** | `planet-nation-display-sync-20260727` |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-planet-nation-display-sync.md` |
| **요청자** | 대표님 — 시리우스 점령→중립화→소유권 구매 후 국경 OK · 행성정보 `[국가:…]` CSV 고정 |

### M0~M5 요약 (김클로드)

- M0~M1: `resolvePlanetRuntimeNationDisplay(Core)` · strip/reprefix
- M2: `resolvePlanetTableDescription` 단일 주입
- M3~M4: C1~C7 · 점유 팩션 independent 라벨 정렬 · Overlay hold deps
- M5: unit 10 PASS · csv 무수정 · commit 안 함

---

## ✅ REVIEWED — 허브 10초 리스폰 삭제 · 30분 재개대기 범용 (M0~M4) · 김클로드

### 김팀장 검수 (본창 Cursor · 2026-07-27)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS** — ready M0~M4 충족 · 검수 중 소수정정 1건 |
| M0 | `RESPAWN_DELAY`·`respawnDestroyedAgents`·스케줄 전량 삭제 · repo 잔존 grep 0 |
| M1 | 블루 승+플레이어 참전 시 `markWaveCombatVictoryCooldown` · 30분 상수 유지 |
| M2 | `enemyFleetEntered`에 `!isWaveCombatCooldownActive` · 진행 중 웨이브는 게이트 밖 |
| M3 | 웨이브 정합 코드 추적 OK · 실기 soft |
| M4 | 스토어·컨트롤러 헤더 계약 주석 OK |
| **검수 수정** | 웨이브 **중간** 클리어마다 mark → 패배해도 30분 잔존 위험 → **허브·최종웨이브만** mark |
| 게이트 | `tsc` PASS · `audit:memory:all` PASS |
| 커밋 | **미커밋** — 대표님 지시 시 김팀장 커밋 |
| soft | 실기(드라코) 미확인 · `respawnAtWallRef` 필드 잔존(항상 null) |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED`** |
| **updated** | 2026-07-27 (김팀장 검수) · 2026-07-27(김클로드 구현) |
| **task_id** | `hub-combat-cooldown-universal-20260727` |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-hub-combat-cooldown-universal.md` |

### [pss-pre-dev]
```
[pss-pre-dev] hot_path=교전종료1회·쿨다운조회sync · alloc=틱당리스폰예약금지 · cache=waveCombatCooldown_O1_Map
[pss-pre-dev] stage=planet_hub_combat·account_purge연동유지 · risk=P1(틱할당금지)·P6(persist저빈도)
[pss-pre-dev] verdict=PASS — 10초 리스폰 루프 제거·쿨다운은 이벤트1회 mark만
```

---

## 📦 ARCHIVE — 김클로드 원문 (허브 쿨다운 · status→REVIEWED)

| 필드 | 값 |
|------|-----|
| **status** | ~~PENDING~~ → **REVIEWED** (상단 참조) |
| **updated** | 2026-07-27 (김클로드) |
| **task_id** | `hub-combat-cooldown-universal-20260727` |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-hub-combat-cooldown-universal.md` |

### M0~M4 요약 (김클로드)

- M0: RESPAWN 10초·`respawnDestroyedAgents` 삭제 · resume도 null 고정
- M1: 허브 블루 승+플레이어 mark (검수에서 최종웨이브 게이트 추가)
- M2: `enemyFleetEntered` 쿨다운 게이트
- M3~M4: 웨이브 정합·주석
- 패배 쿨다운: 미확장(승리만)

---

## ✅ REVIEWED — 전선 압박(FrontPressure)·공격 전술 자동전환 (M0~M6) · 김클로드

### 김팀장 검수 (본창 Cursor · 2026-07-26 · 대표님 「끝나면 자동 검수」)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS** — ready M0~M6 충족 · 코드 수정 없음 |
| M0 | 독립국·blue_red 양쪽 supply mul 전달 · 시리우스형/공격자 보급 단위 테스트 OK |
| M1 | `arc_core_front_pressure_policy.csv` + generated + loader · territorial policy **무수정** |
| M2~M3 | `frontPressureIndex` O(1) 캐시 · holds 인자 주입(RN 비의존) · invalidate 2경로 · planetId 하드코딩 없음 |
| M4 | `isTerritorialPassDueForPlanet` + window 카운터 bounded · aggressive→2 · 캠페인 미적용(허용) |
| M5 | supply/battleWeight aggressive 가산 · cap 존중 |
| M6 | `FRONT_PRESSURE_TACTICS_v0.md` OK |
| M7 | 미착수(선택·명시 OK) |
| 게이트 | `tsc` PASS · `audit:memory:all` PASS · unit tests PASS |
| 커밋 | **미커밋** — 대표님 지시 시 김팀장 커밋 |
| soft | invalidate 일부 경로 TTL 의존 · `passIntervalMulAggressive` 미배선(CSV=1) · 실기 미확인 |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED`** |
| **updated** | 2026-07-26 (김팀장 검수) · 2026-07-26(김클로드 구현) |
| **task_id** | `front-pressure-tactics-20260726` |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-front-pressure-tactics.md` |

### [pss-pre-dev]
```
[pss-pre-dev] hot_path=holds변경1회·territorial_pass게이트 · alloc=틱당금지·dirty성계만 · cache=FrontPressure_O1_Map
[pss-pre-dev] stage=월드축(ArcCore)·purge분류명시 · risk=P1(틱금지)·P3(holds invalidate)
[pss-pre-dev] verdict=PASS — 60s probe에서 전은하 재스캔 금지·자세는 이벤트 재계산만
```

---

## 📦 ARCHIVE — 김클로드 원문 (FrontPressure · status→REVIEWED)

| 필드 | 값 |
|------|-----|
| **status** | ~~PENDING~~ → **REVIEWED** (상단 참조) |
| **updated** | 2026-07-26 (김클로드) |
| **task_id** | `front-pressure-tactics-20260726` |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-front-pressure-tactics.md` |
| **문서** | `docs/strategy/FRONT_PRESSURE_TACTICS_v0.md`(M6 신규) · `docs/strategy/ARC_CORE_TACTICAL_AUTOMATION_AND_GALAXY_STRATEGY.md`(교차) |
| **요청자** | 대표님 「김클로드가 개발」→ 김팀장 배정 → "@김클로드 ... M0~M6 구현" |

### [pss-pre-dev]

```text
[pss-pre-dev] hot_path=holds변경1회·territorial_pass게이트 · alloc=틱당금지·dirty성계만 · cache=FrontPressure_O1_Map
[pss-pre-dev] stage=월드축(ArcCore)·purge분류명시 · risk=P1(틱금지)·P3(holds invalidate)
[pss-pre-dev] verdict=PASS — 60s probe에서 전은하 재스캔 금지·자세는 이벤트 재계산만
```

### M0 — 보급 mul 배선 검증: **이미 정상, 갭 없음**

`resolveTerritorialQuickCombat`가 일반·독립국 경로 모두 supply 전달 — 누락 없음. 시리우스형 고립·공격자 보급 단위 테스트 추가.

### M1 — Table-First

`tables/balance/arc_core_front_pressure_policy.csv` → generated + `arcCoreFrontPressurePolicy.ts`. 기존 territorial combat policy **무수정**.

### M2~M3 — FrontPressure 모듈

`frontPressureIndex.ts` — holds 주입·캐시·invalidate(`applyArcCoreTerritorialHold`·`claimPlanetOwnershipByPurchase`).

### M4 — battlesPerInterval

창 단위 카운터 · aggressive=2 · 캠페인 그룹 미적용.

### M5 — 보급 연동

aggressive 시 defender supply·battleWeight 가산(캡 존중).

### M6 — 문서

`docs/strategy/FRONT_PRESSURE_TACTICS_v0.md`.

### M7 — **미착수** (선택·명시)

### self-check (김클로드)

- [x] tsc · audit:memory:all · build:balance-tables · unit tests · commit 안 함

### 리스크·주의 (김클로드)

invalidate 일부 경로 TTL 의존 · 캠페인 battlesPerInterval 미적용 · 실기 미확인.

---

## ✅ REVIEWED — 아크코어 판테온 12좌 · 잔해 유물 (M1~M6) · 김클로드

### 김팀장 검수 (본창 Cursor · 2026-07-24 ~23:05 KST)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS** — ready M1~M6 충족 · 검수 중 소수정정 2건 |
| M1 | world_nodes 13 · relics 12 · item_defs `relic_seat_*` · registry O(1) Map OK |
| M2 | Trade 미등록 · Attack 등록·`onWallTick` 없음 · displayName 신명 12 · 등록 수 12 |
| M3 | salvage 5% · 미해금 좌만 · 인벤+unlockGod+alert · 실행 1회 |
| M4 | codex store · purge · backup keys · hydrate OK |
| M5 | `relicLore` overlay · trade 탭(unsellable) 열람 · 맵 비노출 · 선택 도감 패널 생략(허용) |
| M6 | stub만 — **검수 수정**: 도감 해금≠전점유 오판 → `return false` 고정 |
| 기타 수정 | `ArcCoreAttackSubCore` 「미등록」주석 정정 |
| 게이트 | `tsc` PASS · `audit:memory:all` PASS (재실행) |
| 커밋 | **미커밋** — 대표님 지시 시 김팀장 커밋 |
| soft | `allowedPlanetPool`/`dropWeight` CSV 미강제(MVP) · 실기 salvage 미확인 |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED`** |
| **updated** | 2026-07-24 (김팀장 검수) · 2026-07-24(김클로드 구현) |
| **task_id** | `arc-core-pantheon-relics-20260724` |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-arc-core-pantheon-relics.md` |

### [pss-pre-dev]
```
[pss-pre-dev] hot_path=salvage실행1회드롭·허브wall_tick(등록수유지) · alloc=틱당신규금지·codex는이벤트시만 · cache=world_nodes·relics_O1_Map
[pss-pre-dev] stage=planet_hub_wreck·account_purge · risk=P1(틱금지)·P6(persist코얼레싱)
[pss-pre-dev] verdict=PASS — Attack onWallTick 비활성·맵상시마커금지·전행성폴링금지
```

---

## 📦 ARCHIVE — 김클로드 원문 (판테온 · status→REVIEWED)

| 필드 | 값 |
|------|-----|
| **status** | ~~PENDING~~ → **REVIEWED** (상단 참조) |
| **updated** | 2026-07-24 (김클로드) |
| **task_id** | `arc-core-pantheon-relics-20260724` |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-arc-core-pantheon-relics.md` |
| **기획** | `docs/ARC_CORE_SUBCORE_PANTHEON_OPTIMIZATION_PLAN.md` |
| **요청자** | 대표님 「김클로드가 해당 전체 내용 개발」→ 김팀장 배정 → "@김클로드 ... M1~M6 전체 구현" |

### [pss-pre-dev]

```text
[pss-pre-dev] hot_path=salvage실행1회드롭·허브wall_tick(등록수유지) · alloc=틱당신규금지·codex는이벤트시만 · cache=world_nodes·relics_O1_Map
[pss-pre-dev] stage=planet_hub_wreck·account_purge · risk=P1(틱금지)·P6(persist코얼레싱)
[pss-pre-dev] verdict=PASS — Attack onWallTick 비활성·맵상시마커금지·전행성폴링금지
```

### M1 — Table-First

- `tables/content/arc_core_world_nodes.csv`(신규, 13행: prime 1 + subcore 12) · `tables/content/arc_core_pantheon_relics.csv`(신규, 12행) — `npm run build:content-tables`로 `src/data/generated/csvArcCoreWorldNodes.ts`·`csvArcCorePantheonRelics.ts` 생성 확인(기존 `buildAiClanRegistry` 패턴 그대로 `build-content-from-csv.mjs`에 함수 2개 추가).
- `tables/content/item_defs.csv`에 `relic_seat_*` 12행 추가(기존 행 무수정) — `category=luxury`(기존 enum 내), `kind=misc`, `type=pantheon_relic`, `tradeable=false`·`sellable=false`·`nonRepurchase=true`(계정당 1회 확정 해금과 정합), `attrsJson={"pantheonGodId":"..."}`.
- `src/types/index.ts`에 `ArcCoreWorldNodeRow`·`ArcCorePantheonRelicRow` 타입 추가.
- 레지스트리(모듈 레벨 Map 1회, 틱당 재구성 없음): `src/arcCore/pantheon/arcCoreWorldNodeRegistry.ts`(`getArcCoreWorldNodeByGodId`/`listArcCoreSubcoreNodes`) · `arcCorePantheonRelicRegistry.ts`(`getArcCorePantheonRelicByGodId`/`getArcCorePantheonRelicByItemId`/`listArcCorePantheonRelics`).
- 외곽 배치·비문은 ready 문서 §1 표 그대로(신명 12 ↔ subCoreId ↔ systemId/planetId) — planetId/systemId 직서는 CSV·레지스트리에만 존재, `loreBodyKo`엔 성계 별칭(EN)+방위만(예: "남쪽 어딘가 '유령 에너지 벨트'") — 실 id 비노출.

### M2 — 서브코어 12개 재편

- `AiTradePortLevelPolicySubCore` — **파일 유지(삭제 안 함)**, `@deprecated` 주석 추가 + `registerDefaultArcSubCores`에서 등록 제거. 이유: `tools/memory-audit/run-resident-set-audit.cjs`가 이 파일 경로를 직접 `read()`해서 onBoot 내용을 검사하므로 삭제 시 감사 스크립트가 깨짐 — ready 문서의 "삭제 **또는** deprecated" 중 안전한 쪽 선택.
- `ArcCoreAttackSubCore` 등록 추가 — `onWallTick` **정의하지 않음**(등록 전과 동일하게 완전 inert, onBoot 정책 워밍만 기존 유지).
- `registerDefaultArcSubCores.ts` 등록 수 — Trade 제거 + Attack 추가로 **12개 그대로**(코드로 직접 카운트 확인: `registerSubCore` 호출 12줄).
- 12개 전부 `displayName` → 신명(ready §1 표) 반영: 크로노스·아레스·테미스·헤르메스·아폴론·닉스·가이아·플루토스·아테나·이리스·아스트라이아·야누스. `id`는 전부 기존 유지(코드 SubCore 물리 이전 없음, 아폴론=`arc_inbound_drone_subcore` 그대로).

### M3 — 잔해 수색 → 유물

- `src/game/planetSalvageSearch.ts` `pickSalvageLootItemId` 확장(신규 병렬 함수 아님, 기존 함수 그대로 확장) — 저확률(`RELIC_DROP_PCT=5`, ≤5% MVP 상수) 해시 판정 통과 시 `listArcCorePantheonRelics()`에서 **아직 미해금(codex 기준) 좌만** 후보로 결정적 해시 선택, 실패/전부해금이면 기존 광물 풀로 그대로 폴백.
- 판정은 salvage 버튼 `onPress` 콜백(`app/(game)/planet.tsx` 기존 핸들러) 내 **1회만** — interval/틱/전행성 스캔 없음(신규 코드 없음, 기존 단일 호출 지점 그대로 재사용).
- 획득 시 `useArcCorePantheonCodexStore.getState().unlockGod(godId, revealLevelDefault)` + `showArcAlert('유물을 회수했다', '{신명}의 흔적을 발견했다.')` — 해금 직후만 표시(재획득 없음, `unlockGod`이 이미 해금된 god는 no-op).

### M4 — `arcCorePantheonCodexStore`

- `src/arcCore/pantheon/arcCorePantheonCodexStore.ts` — AsyncStorage 키 `arcfire_arc_core_pantheon_codex_v1`. API 스펙대로 `hydrate`·`unlockGod`·`isUnlocked`·`listUnlocked`·`resetForAccountPurge`.
- persist: `unlockGod` 성공(신규 해금) 시에만 `persistLocal()` 1회 — 이미 해금된 god 재호출은 상태변경·persist 둘 다 no-op(틱 없는 저빈도 이벤트라 이 가드가 곧 코얼레싱).
- 부트 hydrate: `src/firebase/gameSaveBackup/applyLocalGameSaveSnapshot.ts`의 `reloadAllLocalGameSaveStores()`(부트·클라우드 복구 공용 경로, 기존 `useArcCoreSpyExpelledStore.loadLocal()` 바로 옆)에 추가.
- 클라우드 백업 포함: `gameSaveBackupKeys.ts`의 `PLAYER_GAME_SAVE_BACKUP_KEYS`에 키 추가(안 하면 기기 변경 시 유물 진행 소실 — 계정 귀속 요구사항과 배치돼 추가함, ready 문서에 명시는 없었으나 기존 계정귀속 스토어 전부 이 목록에 있어 동일 패턴 적용).
- `src/account/localAccountReset.ts` `purgeLocalAccountData`에 `resetForAccountPurge()` 호출 추가(계정 초기화 시 도감도 함께 리셋).

### M5 — UI (최소)

- 신규 `ArcOverlayKind: 'relicLore'` + `ArcOverlayRelicLoreEntry`(`src/ui/overlay/arcOverlayStore.ts`) + `presentRelicLoreOverlay(godNameKo, loreBodyKo)` + `RelicLoreOverlayContent.tsx`(`ArcOverlayCard` 사용, 신명·비문만 — 좌표·기술id 없음) + `ArcOverlayHost.tsx`·`tacticalOverlayRollout.ts` 배선.
- 진입점: `app/(game)/trade.tsx` `handleSell` 최상단 — 탭한 아이템이 `getArcCorePantheonRelicByItemId()`에 걸리면(= relic) 기존 판매 플로우 전부 건너뛰고 lore 오버레이만 띄우고 `return`(유물은 `tradeable=false`라 원래도 판매 대상이 아니었음 — 판매 시도 대신 열람으로 대체).
- (선택 항목이던) 선술집/설정 도감 목록 패널은 **범위에서 제외** — ready 문서에 "(선택)"으로 명시돼 있어 이번엔 구현 안 함.
- 월드맵·허브 HUD 노출 없음(건드린 파일 없음).

### M6 — 최종 게이트 stub

- `src/arcCore/pantheon/arcCoreFinalGateStub.ts` — `onArcCoreWorldNodesAllPlayerOwned(): boolean` 순수 함수(부수효과 없음, **어디서도 호출 안 함** — 자리만). `ArcCoreFinalGateFlag = 'pending'|'armed'|'triggered'` 타입만 예약, 실제 저장/전이 로직 없음. 스토리모드·전체 리셋 코드 없음.

### 변경 파일

**신규**: `tables/content/arc_core_world_nodes.csv` · `tables/content/arc_core_pantheon_relics.csv` · `src/arcCore/pantheon/{arcCoreWorldNodeRegistry,arcCorePantheonRelicRegistry,arcCorePantheonCodexStore,arcCoreFinalGateStub}.ts` · `src/ui/overlay/content/RelicLoreOverlayContent.tsx` · (generated) `src/data/generated/{csvArcCoreWorldNodes,csvArcCorePantheonRelics}.ts`

**수정**: `src/types/index.ts` · `tables/content/item_defs.csv`(+12행) · `tools/content-tables/build-content-from-csv.mjs` · `src/data/generated/index.ts`(generated) · `src/arcCore/subcores/{AiTradePortLevelPolicySubCore,registerDefaultArcSubCores,ArcCoreDailyOpsSubCore,ArcCoreTerritorialCombatSubCore,AiAabsSubCore,AiNpcSubCore,ArcInboundDroneSubCore,ArcCoreSpySubCore,AiPlanetsSubCore,AiEconomySubCore,ArcCoreAttackSubCore,ArcNewsBoardSubCore,ArcPlanetNebulaSubCore,WorldExpansionSubCore}.ts` · `src/game/planetSalvageSearch.ts` · `app/(game)/planet.tsx` · `src/firebase/gameSaveBackup/{applyLocalGameSaveSnapshot,gameSaveBackupKeys}.ts` · `src/account/localAccountReset.ts` · `src/ui/overlay/{arcOverlayStore,tacticalOverlayRollout,ArcOverlayHost}.tsx` · `app/(game)/trade.tsx`

### 등록 SubCore 12개 (id · displayName)

1. `arc_core_daily_ops_subcore` · 크로노스 · 일일 운영
2. `arc_core_territorial_combat_subcore` · 아레스 · 접전지역 전투
3. `ai_aabs_subcore` · 테미스 · 능동 밸런싱
4. `ai_npc_subcore` · 헤르메스 · 궤도 수송
5. `arc_inbound_drone_subcore` · 아폴론 · 인바운드 드론
6. `arc_core_spy_subcore` · 닉스 · 스파이
7. `ai_planets_subcore` · 가이아 · 행성 코어
8. `economy_subcore` · 플루토스 · 무역소·경제
9. `arc_attack_subcore` · 아테나 · 통합 공격(등록·틱 비활성)
10. `arc_news_board_subcore` · 이리스 · 공지 보드
11. `arc_planet_nebula_subcore` · 아스트라이아 · 성운
12. `world_expansion_subcore` · 야누스 · 월드 확장

### self-check

- [x] `npx tsc --noEmit -p tsconfig.client.json` — PASS
- [x] `npm run audit:memory:all` — 전부 PASS(37/37 · skia-worklet 20/20 · worklet-contract PASS · native-reclaim 20/20 · resident-set 7/7 · hot-path hits=0) — `resident-set` 감사가 `AiTradePortLevelPolicySubCore.ts` 파일 존재를 전제하는데 파일을 지우지 않아 문제 없이 PASS
- [x] `npm run build:content-tables` — PASS(item_defs.csv 287 data rows·기존 npc-fleet/mission-quest-placements 감사 전부 PASS 동반 재확인)
- [x] git commit **안 함**

### 리스크

- **Attack 틱 미활성 확인**: `ArcCoreAttackSubCore.ts`에 `onWallTick` 미정의 — grep으로 재확인 완료, 등록해도 허브 게임루프에 새 틱 작업 없음.
- **맵 스포일러 없음**: `worldmap.tsx`·허브 HUD 어느 파일도 건드리지 않음 — 거점 마커·신명 상시 표시 코드 자체가 없음.
- 실기 미확인 — 잔해 수색 시 실제로(낮은 확률이지만) 유물이 나오는지, 인벤에서 유물 탭 시 lore 카드가 정상 표시되는지, 계정 초기화 후 도감이 실제로 비는지는 디바이스 확인 필요.
- `RELIC_DROP_PCT=5`·`dropWeight=10`(전 좌 동일) 등은 전부 CSV/상수 기반 MVP 단순화 — ready 문서가 명시적으로 허용한 범위.
- Phase D(허브 틱 옵트인·Attack 디스패치 수렴)는 이번 범위 밖, 손대지 않음.

---

## ✅ REVIEWED — 미발견 성계 별빛 레이어 · 김클로드

### 김팀장 검수 (본창 Cursor · 2026-07-24 ~12:35 KST)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS** — ready 명세 준수 · 게이트 PASS |
| 신규 | `GalaxyMapUndiscoveredStarlightSvg.tsx` — hash 희소 SHOW_PCT=36 · 색3×opacity5 버킷 · Path 배칭 · Circle/라벨/라인 없음 · Math.random 없음 |
| 배선 | `worldmap.tsx` Voronoi 아래 · SystemsSvg 위 · `hiddenUndiscoveredSystems`만 전달 · visible 목록 미편입 |
| 메모리 | Path 최대 15개 · 성계당 UI 노드 없음 · `toScreen` useCallback 안정 |
| 누락 | handoff PENDING 미작성(김클로드) — 김팀장이 본 검수로 갈음 |
| 게이트 | tsc PASS · audit:memory:all PASS |
| 커밋 | 미커밋 유지 — 대표님 지시 시 김팀장 커밋 |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED`** |
| **updated** | 2026-07-24 (김팀장 검수) · 2026-07-24(김클로드 구현) |
| **task_id** | `galaxy-undiscovered-starlight-20260724` |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-undiscovered-starlight.md` |

### [pss-pre-dev]
```
[pss-pre-dev] hot_path=worldmap Svg 마운트·해금 변경 시 Path 재작성 · alloc=스타일별 Path≤15 · cache=없음
[pss-pre-dev] stage=galaxy_map · risk=P1/P2 회피(배칭) · verdict=PASS
```

---
## ⏳ PENDING — 미발견 성계 별빛 레이어

| 필드 | 값 |
|------|-----|
| **status** | **`PENDING`** |
| **updated** | 2026-07-24 (김클로드) |
| **task_id** | `galaxy-undiscovered-starlight-20260724` |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-undiscovered-starlight.md` |
| **요청자** | 김팀장(Cursor 본창) 배정 — 대표님 지시(은하 암흑 미발견 성계를 별빛(도트)으로 표시 · 메모리 리스크 없이 · 미발견↔미발견 라인 숨김) → 권장 1안 |

### [pss-pre-dev]

```text
[pss-pre-dev] hot_path=worldmap Svg 마운트·해금 목록 변경 시 1회 Path 재작성 · alloc=스타일별 Path d 문자열 소수 · cache=없음(시스템 좌표는 기존 systems)
[pss-pre-dev] stage=galaxy_map only · dispose=Svg 언마운트와 동일 · risk=P1(성계당 Circle 금지)·P2(Views)
[pss-pre-dev] verdict=PASS — 단일/소수 Path 배칭+해시 희소만 허용 · N개 Circle/라벨/edge REDESIGN
```

### 구현 내용

명세(`kim-claude-ready-undiscovered-starlight.md`) 권장 1안 그대로 구현 — 성계당 노드 없이 `systemId` 결정적 해시(FNV-1a)로 (a) 표시 여부(`hash%100 < 36`, 약 36% 희소) (b) 색 3종(cool white/blue-cyan) (c) opacity 5단(0.06~0.45)을 골라, **색×opacity 조합별로 SVG `<Path>` 1개**에 `M x y l0.01 0` 짧은 세그먼트를 배칭(`strokeLinecap="round"`로 점처럼 렌더) — 최대 3×5=15개 Path만 생성되며 시스템 수(수백)와 무관하게 상한이 걸림. `Math.random` 없음 — 매 렌더 동일 결과.

`hiddenUndiscoveredSystems`(기존 값 그대로, `visibleSystemsList`에 합치지 않음)를 `GalaxyMapTerritoryVoronoiSvg`와 `GalaxyMapSystemsSvg` 사이에 배치 — 별빛이 기존 노드에 가리지 않게.

### 변경 파일
- `src/galaxyMap/GalaxyMapUndiscoveredStarlightSvg.tsx` (신규)
- `app/(game)/worldmap.tsx` (import 1줄 + `<Svg>` 자식 1개 삽입)

### 범위 밖(명세대로 손 안 댐)
- Skia Canvas/Worklet 없음 · `visibleSystemsList` 편입 없음 · 미발견↔미발견 connection 없음 · 터치/패널/이름/i18n 없음 · deferred tile/direction prewarm 로직 변경 없음.

### self-check
- [x] `npx tsc --noEmit -p tsconfig.client.json` — PASS
- [x] `npm run audit:memory:all` — 전부 PASS(37/37 · skia-worklet 20/20 · worklet-contract PASS · native-reclaim 20/20 · resident-set 7/7 · hot-path hits=0)
- [x] git commit **안 함**

### 리스크
- Path 스타일 버킷 수 = 색(3) × opacity(5) = 최대 15개로 고정 상한 — 시스템 수 증가와 무관하게 View/Path 개수 안 늘어남.
- 실기 미확인 — 은하 지도 진입 시 미발견 영역에 흐린 도트가 실제로 보이는지, 기존 Voronoi/노드 레이어와 겹칠 때 시각적으로 자연스러운지 확인 필요.

---

## ✅ REVIEWED — (1) FinalizerDaemon SIGSEGV 검증 + (2) GL_HARD_CEILING 재조사 · 김클로드

### 김팀장 검수 (본창 Cursor · 2026-07-23 08:19 KST)

| 항목 | 결과 |
|------|------|
| **verdict** | **① PASS · ② PASS(조건부)** — 코드 변경 없음, handoff 진단 수용. 다음 구현은 아래 P0 |
| ① SIGSEGV | `scheduleSkPictureDispose` no-op · Picture React-frame만 교체 · 크래시 로그(`225007`) 스택 일치 — **추가 조치 불필요** |
| ② 가설 기각 | 웨이브마다 remount / 회수 트리거 부재 / presentation Set 덮어쓰기 — 코드 대조 **기각 타당** (`Set<fn>` · `hub_combat_orbit_end` · 세션 단위 orbit active) |
| ② 보완(김팀장) | 「배선 완전·네이티브만」은 **조기 단정**. 07-23 08시 실측: 지도 idle에서 soft만 돌고 **`galaxy_map_post_ingress`/`periodic_deep` 로그 미관측**, ingress는 **`releaseGpuLayers: false`**, Views **555·GL~147** 고착(지도 baseline Views~350·GL~49). soft 무력 + deep 미실행이 **관리 갭**으로 남음 |
| **다음 P0(구현)** | (a) deep 미실행 원인(`isMoving` skip·focus reset) 수정 (b) `after_hub_combat`/`from_planet_hub` ingress에서 GPU release 또는 settle 직후 deep 1회 (c) Views 555 허브 트리 잔존 여부 — **김클로드 또는 김팀장 Opus 구현 후 재 PENDING** |
| 게이트 | 본 항목 코드 diff 없음 · 김클로드 self-check(tsc·audit:memory:all) 수용 |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED`** |
| **updated** | 2026-07-23 (김팀장 검수) · 2026-07-23(김클로드) |
| **task_id** | `memory-handling-verify-and-gl-leak-reinvestigate-20260723` |
| **요청자** | 대표님 — "현재 김팀장이 분석한 메모리 처리문제를 확인하고 지금 수정작업진행하라" → 두 갈래 확인 후 "GL 리텐션 누수(미해결) 쪽으로 진행"으로 답변 |

### (1) FinalizerDaemon SIGSEGV 크래시 수정 — 검증 결과: **완료·정상**

- 근거 로그 직접 대조: `tools/long-run-monitor/logs/crash-20260722-225007-capture.log`(SIGSEGV tid=FinalizerDaemon, `SkiaDomView.finalize→PictureProp::~→JsiSkPicture::~`) — 김팀장 commit `300de54`(2026-07-23 00:01 KST) 코드 주석의 timestamp·스택과 정확히 일치.
- `src/game/skia/skiaMemoryLifecycle.ts` 전체 재확인 — `scheduleSkPictureDispose`는 no-op, `dropSkPictureReactFrame`/`commitSkPictureReactFrame` 모두 React state 교체만 하고 수동 dispose 없음. 2026-06-17 SkImage 크래시 때 확립된 "manual dispose 금지, native finalizer에 수명 위임" 규칙을 SkPicture로 정확히 확장한 것.
- `PlanetEdenRaidOrbitSkiaCombat.tsx` 동일 커밋 diff도 함께 확인 — 주석·근거 일치, 로직 충돌 없음.
- **우회 경로 전수 검색**(`safeSkiaDispose`/`.dispose()` 전체 grep) — 남아있는 모든 수동 dispose 호출은 `<Picture>`에 넘겨진 적 없는 객체(draw 실패로 즉시 버려지는 picture, pooled `SkPath`, `PictureRecorder`)뿐 — 크래시 경로(JsiDomNode에 바인딩된 SkPicture)를 우회하는 곳 없음.
- 게이트 재실행: `npx tsc --noEmit -p tsconfig.client.json` PASS · `npm run audit:memory:all` 전부 PASS(37/37 · skia-worklet 20/20 · worklet-contract PASS · native-reclaim 20/20 · resident-set 7/7 · hot-path hits=0).
- **결론**: 이 항목은 이미 완료된 수정이며 제 검증 결과 추가 조치 불필요.

### (2) GL_HARD_CEILING 잔류 누수 — 재조사 결과: **근본원인 미확정, 기존 결론과 동일**

`tools/long-run-monitor/logs/gl-leak-refix-requested.flag`(07-22 23:37:37 발생, `suspect=hub_skia_orbit_nebula_combat`, gl=203.4MB·pss=1028.5MB·views=553)가 (1)의 크래시 수정 커밋(00:01 KST) **이후**에도 오늘 아침 06:50~07:52 동일 패턴(`GL_SPIKE suspect=hub_skia_orbit_nebula_combat`, GL +92.9MB, 이후 미회복)으로 재발 — `tools/long-run-monitor/logs/overnight-final-report-20260723-0800.md` 확인. 즉 **크래시 수정과 GL 누수는 서로 다른 문제**이며, 크래시 수정이 GL 누수를 해결하지 못했음을 실측으로 확인.

**이번에 새로 확인/기각한 가설**:
1. ~~"vega_base 자동전투 루프가 웨이브마다(~10초) `PlanetEdenRaidOrbitSkiaCombat`를 마운트/언마운트 반복 → GC-finalizer-only 수명주기(위 크래시 수정으로 manual dispose 폴백까지 사라짐)와 겹쳐 회수가 GC 타이밍에 못 따라간다"~~ — **기각**: `app/(game)/planet.tsx:682-684` 주석으로 `capitalCombatOrbitActive`가 웨이브 디펜스 런 9웨이브 내내 `true`로 고정됨을 코드로 확인 — 웨이브마다 마운트/언마운트가 아니라 **세션(런) 단위 1회**만 마운트/언마운트. 마운트 빈도는 처음 가정보다 훨씬 낮음.
2. ~~"전투 종료 후 회수 트리거 자체가 없다(route_blur/planet_change에만 걸려있다)"~~ — **기각**: `planet.tsx:710-717`에 이미 `capitalCombatOrbitActive: true→false` 전이를 감지해 `schedulePlanetHubPostSkiaPeakReclaim(pid, 'hub_combat_orbit_end')`를 호출하는 전용 effect가 존재. 이 함수(`runPlanetHubPostSkiaPeakReclaimPass.ts`)는 2×rAF+32ms+`InteractionManager` 지연 후 `runCombatSkiaPresentationReclaim`+`signalHubSkiaNativeReclaim`+성운 프로필 prune+memo 캐시 compact+Fresco bitmap trim+백드롭 remount를 실행하고 **90초 뒤 동일 패스를 한 번 더**(`followup_90s`) 돈다 — 이미 상당히 정교한 다층 회수 체계.
3. ~~"`combatSkiaPresentationReclaim`의 Set 등록이 덮어써져 일부 콜백이 누락된다"~~(과거 handoff 기록상 한때 실제 버그였던 항목) — **기각**: `src/combat/combatSkiaPresentationReclaim.ts` 현재 코드는 `Set<fn>` 기반 다중 등록으로 정상 구현돼 있음(과거 버그는 이미 수정된 상태).

**남은 상태**: JS/TS 레벨의 등록·트리거·캐시 정리 체계는 세 가설을 기각하고도 남을 만큼 이미 촘촘하게 구현돼 있음 — 이번 재조사로 "명백한 배선 누락형 버그"는 찾지 못했습니다. 이 이슈는 2026-07-10부터 최소 3차례(`aurora-hub-native-heap-hard-ceiling-20260707`, `galaxy-map-gl-residual-on-hub-reentry-20260708`, 그리고 오늘 이 항목) 반복 조사됐고 매번 "방어적 안전판만 추가, 근본 leak 미확정"으로 마무리됐습니다. 남은 가능성은 JS 코드 리뷰로는 확인 불가능한 네이티브 레벨(RN-Skia Android `GrContext`/EGL 리소스 캐시가 JS 참조 해제 이후에도 즉시 GPU 드라이버 메모리를 반납하지 않는 것 등)일 가능성이 높다고 판단합니다.

### 코드 변경

**없음** — 이번 세션은 (1) 검증 (2) 재조사 모두 read-only. 리스크 있는 아키텍처 변경(예: combat-orbit을 nebula backdrop처럼 상시 마운트+상태만 토글하는 방식으로 바꾸는 것)은 실기 검증 없이 이 반복적으로 실패해온 이슈에 또 하나의 미확정 "반쪽 패치"를 얹는 것이라 판단해 진행하지 않았습니다.

### self-check

- [x] `npx tsc --noEmit -p tsconfig.client.json` — PASS (변경 없음)
- [x] `npm run audit:memory:all` — 전부 PASS(37/37 · skia-worklet 20/20 · worklet-contract PASS · native-reclaim 20/20 · resident-set 7/7 · hot-path hits=0)
- [x] git commit **안 함**

### 리스크·주의

- GL 누수는 여전히 미해결 — 다음 재발 시에도 자동 재시작(모니터 remediation)으로 서비스 영향은 제한적이나, 재시작 빈도 자체가 사용자 경험 저하.
- 다음 단계로 제안: (a) 실기(Android Studio GPU/Memory Profiler)로 vega_base 웨이브런 종료 전후 실제 GL 텍스처/서페이스 반납 여부 직접 관찰, 또는 (b) `runPlanetHubPostSkiaPeakReclaimPass` 실행 전후 `[MEM]` 로그에 실측 GL MB(현재는 `gpuLayers` id 목록만 찍음, 바이트 수치 없음)를 추가해 다음 재발 로그캣에서 "회수 패스가 돌긴 도는데 효과가 없다" vs "애초에 패스 자체가 트리거 안 됐다"를 구분 — 우선순위는 대표님/김팀장 판단 필요.

### 정정 (2026-07-23, 대표님 확인) — `suspect=hub_skia_orbit_nebula_combat` 태그는 이번 건 오귀속

07-23 06:50~08:23 구간(views=555 완전 고정, gl/pss만 완만히 우상향) 관련해 대표님께 실기 상태를 여쭤본 결과 — **디바이스는 이 시간 내내 전투 없이 은하계 지도맵 화면에서 액션 없이 대기 중**이었음. 즉 모니터의 `hub_skia_orbit_nebula_combat` 자동 추정 태그는 이번 재발엔 틀렸고, 실제로는 위 `galaxy-map-gl-residual-on-hub-reentry-20260708`(PENDING, 미착수) 항목과 같은 계열(worldmap 화면 자체 체류 중 축적) 가능성이 높음 — 다만 이번엔 "허브 재진입 후 잔류"가 아니라 **worldmap 화면에 계속 머무르는 동안** gl/pss가 완만히 우상향한 것이라 07-08 진단(재진입 시 회수 누락)과도 정확히 같은 패턴은 아님. 위 (2) 섹션의 combat-orbit 관련 가설(마운트 빈도·회수 트리거·pool 정리)은 **이번 재발과는 무관한 것으로 정정** — combat 관련 코드 경로는 이번 재발에 관여하지 않았을 가능성이 높음.

**대표님 안내**: 현재 김팀장이 이 건을 직접 수정 중 — 김클로드는 추가 조사·구현 중단하고 김팀장 수정 완료 후 검수만 진행.

### 김클로드 검수 (2026-07-23) — 김팀장 구현(작업트리, 미커밋) 대상

**verdict: PASS**

- **대상 파일**: `app/(game)/worldmap.tsx` · `src/game/nativeReclaim/{galaxyMapIngressReclaim,index,processMemoryBudgetPolicy,runGalaxyMapResidentDeepReclaimPass}.ts` · `src/game/devMemoryProfileBridge.ts`(신규 이벤트 타입 `deep_reclaim`만 추가). `src/arcCore/{syncArcCoreGlobalWorldExpansion,worldExpansionGlobalSchedule}.ts`는 `git diff`로 실제 내용 변경 0바이트 확인(CRLF 개행 메타데이터 경고만) — 이번 fix와 무관.
- **근본원인 대응 확인**: 김팀장이 08:19 검수에서 지적한 관리 갭(① ingress가 `releaseGpuLayers:false`로 호출돼 허브 GPU layer 레지스트리 잔존분을 안 걷음 ② 90초 단일 followup이 `isMoving`이면 그 자리에서 통째로 증발 — 재시도 없음)을 정확히 그 두 지점에서 수정:
  - `consumeGalaxyMapIngressReclaim`: soft-only(`releaseGpuLayers:false`) → `runGalaxyMapResidentDeepReclaimPass(..., {reclaimHubSkia:true})`(deep=GPU layer 해제+Fresco trim) 전환.
  - `worldmap.tsx` focus effect: 90초 단일 followup → 4초 settle + 45초 followup 2단, 각각 `scheduleDeepWhenIdle`로 `isMoving` 시 15초 간격 최대 4회 재시도 후 강제 1회 실행(`_forced`) — 무한 증발 경로 차단.
- **`stage==='planet_hub'`에서만 `signalHubSkiaNativeReclaim`을 호출하는 `runStageNativeReclaimPass`의 기존 게이트**(07-08 진단에서 이미 지적됐던 지점)를 건드리지 않고, `runGalaxyMapResidentDeepReclaimPass`에서 `stage:'galaxy_map'`이어도 별도로 직접 `signalHubSkiaNativeReclaim`을 호출하도록 우회 — 공유 함수의 다른 호출부(허브 자체 blur 등)에 영향 없는 수술적 수정. `signalHubSkiaNativeReclaim`은 Set 기반 pub-sub+try/catch라 구독자 없을 때도 안전한 no-op임을 코드로 확인.
- **호출부 3곳**(`worldmap.tsx` ×2, `galaxyMapIngressReclaim.ts` ×1) 전부 신규 3번째 `opts` 파라미터로 정확히 갱신됨 — 시그니처 불일치 없음.
- **타이머 누수 없음**: `pendingDeepRetryTimers` 배열에 전부 push 후 effect cleanup에서 일괄 clear, `isFocusedRef.current` 가드로 unfocus 후 재귀 재시도 안 함.
- **게이트**: `npx tsc --noEmit -p tsconfig.client.json` PASS · `npm run audit:memory:all` 전부 PASS(37/37 · skia-worklet 20/20 · worklet-contract PASS · native-reclaim 20/20 · resident-set 7/7 · hot-path hits=0).
- **리스크**: 낮음 — 전부 기존에 검증된 reclaim 프리미티브(`runGalaxyMapResidentDeepReclaimPass`/`signalHubSkiaNativeReclaim`/`trimNativeBitmapCachesAsync`) 재사용, 신규 Skia/GPU 로직 없음. `isMoving` 중엔 deep을 계속 미루므로 이동 중 프레임 드랍 유발 가능성도 낮음.
- **미확인(실기 필요)**: 다음 vega_base/전투→지도 진입 또는 장시간 지도 체류 시나리오에서 `mem-timeline.csv` GL/Views가 baseline(~49MB/~350)까지 실제로 떨어지는지 — 코드 리뷰로는 "의도한 대로 실행될 것"까지만 확인 가능, 실측 확인은 김경제 모니터 다음 주기 관측 권장.
- 커밋 여부는 기존 프로토콜대로 김팀장 판단.

---

## ✅ REVIEWED(진짜 원인) — "이어하기" 버튼 탭 직후 2~3초 완전 정지 — 근본원인 특정·수정 · 김클로드

### 김팀장 검수 (본창 Cursor · 2026-07-19)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS — 승인 + 김팀장 보완 조치 추가** |
| r3 검증 | `handleStart` 이어하기 분기의 `buildCsvStaticIndexesFull()` 동기 선실행 → `setContinueFlowActive(true)` 선반전 + 2프레임 yield — 김팀장 독립 분석과 동일 결론, diff 일치 |
| r2 검증 | `navPending` 즉시 스피너 + catch-up `setTimeout(400)` InteractionManager 대기열 분리 — 승인 |
| **김팀장 보완(같은 턴)** | 탭 이벤트 자체가 부트 직후 catch-up 체인에 막히는 잔여 원인 제거 — ① `applyOfflineCatchUpWallClockChunked`(서브코어별 매크로태스크 yield) 신설·적용 ② `runArcCoreDailyOpsBatch` 패스 그룹 사이 `yieldJsThread()` 삽입(정오 이후 첫 부팅 수 초 블록 해소) ③ `runTerritorialCombatPass` 행성별 yield. 신규: `src/arcCore/schedule/yieldJsThread.ts` |
| [pss-pre-dev] | hot_path=부트 1회·일 1회 배치 alloc=틱당 신규 객체 없음(스케줄링만 변경) cache=변경 없음 · stage=해당 없음 risk=P1 해당 없음 · verdict=PASS |
| 게이트 | tsc PASS · `audit:memory:all` 전부 PASS(37/37·20/20·worklet·reclaim 20/20·resident 7/7·hot-path 0) · `audit:balance-ops` 배치 계약 OK(WARN=기존 fiscal 모니터 항목) |
| tools/debug 잔여물 | `_layout_0715.tsx`·`_layout_0719.tsx`(김팀장 디버그 스냅샷, 전체 tsc 깨뜨림) 삭제 완료 |
| 실기 검증 | 대표님 확인 대기 — 이어하기 탭 즉시 로딩화면·타이틀 탭 무반응 소멸 여부 |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED`** |
| **updated** | 2026-07-19 (김팀장 검수·보완) · 2026-07-19(3차 김클로드) |
| **task_id** | `title-continue-button-synchronous-freeze-20260719-r3` |
| **요청자** | 대표님 — "이어하기 버튼이 클릭시 바로 반응하지않고 2~3초간 멈춰있다고 몇번 이야기하는데 그부분에 대해 왜 분석을 진행하지 않나?? 재 분석후 수정하라" |
| **정정** | 1·2차는 **신규 계정** 경로(타이틀→인트로)와 부트 타이밍을 다뤘음. 이번에 지적하신 **"이어하기"(기존 계정, `introSeen=true`) 버튼**은 이번에 처음으로 전용 분석함 — 별개의 진짜 원인이 있었음. |

### 근본원인 (코드로 확정 — 이번엔 추측 아님)

`app/index.tsx`의 `handleStart`(이어하기 분기)가 호출 순서상 **무거운 동기 작업을 화면 갱신보다 먼저** 실행하고 있었음:

```js
if (!getActiveMission()) initTutorialStory();          // 1) 동기, 가벼움
prewarmPromiseRef.current = runContinueSessionPrewarm() // 2) 호출 즉시 내부 동기부가 실행됨
  .catch(() => {});
setContinueFlowActive(true);                             // 3) 로딩화면 표시 — 이게 제일 늦게 실행됨
```

`runContinueSessionPrewarm()`(`src/game/continueSessionPrewarm.ts`)은 `async` 함수라 `await`하지 않고 호출만 해도, **첫 `await` 지점 전까지는 그 자리에서 그대로 동기 실행**됩니다. 그 함수의 첫 줄이 바로:

```js
export async function runContinueSessionPrewarm() {
  await measureBootPhase('continue_prewarm_start', 'continue_prewarm_end', async () => {
    buildCsvStaticIndexesFull();   // ← 첫 await 전, 완전 동기. 여기서 멈춤.
    await yieldToUi();             // 첫 yield 지점
    ...
```

`buildCsvStaticIndexesFull()`(`src/game/buildCsvStaticIndexes.ts`)은 세션당 1회, **아이템 카탈로그 로드 + 광물 매장지 인덱스 + 밸런스 오버레이 재로드**를 전부 동기로 수행합니다(주석에도 "이어하기·행성 허브 등 — full tier"로 명시돼 있어 가벼운 작업이 아님을 이미 알고 있었음). 이게 `setContinueFlowActive(true)`보다 **먼저** 실행되니, 탭한 순간부터 이 함수가 끝날 때까지 리액트가 로딩화면조차 못 그리고 **화면이 완전히 멈춥니다** — 정확히 "탭해도 2~3초 멈춰있다"는 증상 그 자체입니다. 1·2차에서 고친 것(부트 타이밍·InteractionManager 경합·신규계정 시각피드백)과는 완전히 다른, 이 분기 고유의 원인이었습니다.

### 수정 내용

`app/index.tsx` — 순서를 뒤집었습니다: `setContinueFlowActive(true)`를 **제일 먼저** 실행해 로딩화면을 즉시 그리고, 프레임을 2번 넘겨(`yieldToUi()` — 기존 `continueSessionPrewarm.ts`에 있던 헬퍼를 export해서 재사용) 리액트가 실제로 페인트를 마친 뒤에야 `initTutorialStory()`·`runContinueSessionPrewarm()`(그리고 그 안의 `buildCsvStaticIndexesFull()`)을 실행하도록 재배치했습니다. 무거운 작업 자체는 그대로 — **실행 순서만 "화면 갱신 → 무거운 작업"으로 뒤집은 것**이라 로직 변경 리스크는 낮습니다.

- `src/game/continueSessionPrewarm.ts`: 내부 전용이던 `yieldToUi()`를 `export`로 변경(신규 로직 없음).
- `app/index.tsx`: `yieldToUi` import 추가, `handleStart`의 이어하기 분기 순서 재배치.

### self-check

- [x] `npx tsc --noEmit -p tsconfig.client.json` — 내가 수정한 파일(`app/index.tsx`·`src/game/continueSessionPrewarm.ts`) 기준 **에러 없음**(grep으로 파일명 필터링 확인). 다만 프로젝트 전체 tsc는 현재 **`tools/debug/_layout_0715.tsx`·`_layout_0719.tsx`**(미추적 파일, 상대경로가 깨진 `_layout.tsx` 스냅샷 — `tools/debug/_title_stall_capture.txt` 등 정황상 김팀장이 이 버그를 실기로 디버깅하며 남긴 캡처로 보임) 때문에 전체 실행은 실패 상태입니다. 제 변경과 무관하고, 진행 중인 작업물일 수 있어 임의로 건드리지 않았습니다 — 검수 시 확인 부탁드립니다.
- [x] `npm run audit:memory:all` — **전부 PASS**(37/37 · skia-worklet 20/20 · worklet-contract PASS · native-reclaim 20/20 · resident-set 7/7 · hot-path hits=0) — tsc와 달리 프로젝트 전체를 컴파일하지 않아 영향 없음.
- [x] git commit **안 함**

### 리스크·주의

- 실기 미확인 — "이어하기" 탭 즉시 로딩화면이 뜨고, 그 뒤로 진행되는지 확인 필요.
- `tools/debug/_layout_07*.tsx` 정리(또는 tsconfig exclude에 `tools/debug/` 추가)는 이번 범위 밖 — 김팀장 작업물일 가능성이 있어 별도 확인 필요.

---

## ✅ REVIEWED(후속 수정) — 타이틀 버튼 "탭해도 무반응" 잔여 원인 추가 조치 · 김클로드

### 김팀장 검수 (본창 Cursor · 2026-07-19)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS — 승인 (수정 없음)** · 잔여 JS 점유 원인은 위 3차 항목의 김팀장 보완(청크화)으로 마감 |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED`** |
| **updated** | 2026-07-19 (김팀장 검수) · 2026-07-19(2차 김클로드) |
| **task_id** | `title-postbootsettled-catchup-block-regression-20260719-r2` |
| **요청자** | 대표님 — 1차 수정(아래, REVIEWED PASS) 이후 "버튼이 반응을 안한다... 이전과 다른 버그이다. 이부분이 문제가 된 것이다"로 별도 재지적 |

### 1차 수정 이후에도 남아있던 것

1차는 "버튼이 활성화되기까지 오래 걸림"은 확실히 고쳤지만(`postBootSettled` 즉시 true), 대표님이 지적하신 "탭해도 무반응"은 **1차가 다루던 것과 별개로 두 가지가 더 있었음**:

1. **탭 직후 시각적 피드백이 원래 없었음(기존부터)**: `handleStart`의 신규계정·`introSeen` 안 된 계정 분기(`app/index.tsx`)는 `titleNavLockRef.current=true`만 세팅하고 `runStageNavAfterTeardown`을 호출하는데, 이 함수 자체가 rAF 2회+idle-wait(`InteractionManager` 또는 최대 2.5초 상한)+rAF 2회+64ms 순서로 **버튼 모양이 그대로인 채** 최대 2.5초+ 걸려서야 실제 화면 전환이 일어남. 그 사이 유저가 "안 눌렸나?" 하고 재탭하면 `titleNavLockRef` 때문에 조용히 무시됨 — 이게 "탭해도 무반응"으로 보였을 가능성이 큼. (`continueFlowActive` 분기는 이미 즉시 로딩화면으로 바뀌어서 이 문제가 없었음 — 신규계정 분기만 빠져있었음.)
2. **1차 수정 자체가 만든 잔여 경합 가능성**: 1차에서 catch-up을 `InteractionManager.runAfterInteractions`로 옮겼는데, 타이틀 버튼의 `runStageNavAfterTeardown`도 내부적으로 **같은 `InteractionManager` 대기열**을 씀(`stageNavGate.ts`의 `runStageUiAfterIdle`). 버튼이 빨리 활성화되도록 고친 만큼 유저가 더 빨리 탭하게 됐고, 그 타이밍에 catch-up 콜백도 막 대기열에서 실행될 수 있어 여전히 경합 여지가 남아있었음.

### 수정 내용

- **`app/index.tsx`**: `navPending` state 신설 — `handleStart`의 신규계정/미완료계정 분기에서 `titleNavLockRef.current=true` 직후 `setNavPending(true)`로 **탭 즉시** 버튼을 로딩 스피너로 전환(`continueFlowActive` 분기와 동일한 즉각 피드백을 이 분기에도 적용). 버튼 `disabled`·스피너 조건에 `navPending` 추가.
- **`app/_layout.tsx`**: catch-up 지연 방식을 `InteractionManager.runAfterInteractions` → **`setTimeout(fn, 400)`**로 교체(부트 효과·포그라운드 복귀 효과 둘 다) — 타이틀 화면 자체 네비게이션이 쓰는 `InteractionManager` 대기열과 완전히 분리해 경합 가능성 자체를 없앰. 서브코어 자체 `onBoot()` 프로브(`ArcCoreDailyOpsSubCore`·`ArcCoreTerritorialCombatSubCore`)는 원래대로 `InteractionManager` 유지(이번 변경과 무관, 재진입 가드(`passRunning`)로 중복 실행도 안전).

### self-check

- [x] `npx tsc --noEmit -p tsconfig.client.json` — **PASS**
- [x] `npm run audit:memory:all` — **전부 PASS**(memory 37/37 · skia-worklet 20/20 · worklet-contract PASS · native-reclaim 20/20 · resident-set 7/7 · hot-path hits=0)
- [x] git commit **안 함**

### 리스크·주의

- 실기 미확인 — 특히 **신규 계정(최초 실행) 탭 직후 즉시 스피너로 바뀌는지**, 그리고 **버튼 활성화 직후 바로 연타해도 두 번째 탭이 무시만 되고 화면이 이상해지지 않는지** 확인 필요.
- `ARC_CORE_CATCH_UP_DEFER_MS=400`은 임의값 — 실기에서 여전히 탭과 경합하면 늘리는 방향으로 조정.

---

## ✅ REVIEWED — 타이틀 화면 로딩 몇배 증가·버튼 무반응 회귀 수정 · 김클로드

### 김팀장 검수 (본창 Cursor · 2026-07-19)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS — 승인 (수정 없음)** |
| 근본원인 검증 | 김팀장이 당일 추가한 `postBootSettled` await 게이트가 ①로딩 수 배 증가 ②`Promise.race` 12초 상한 후에도 백그라운드 catch-up이 JS 스레드 점유 → 탭 무반응 재발 — diff·코드로 재확인. 서브코어 `onBoot()`의 검증된 `InteractionManager.runAfterInteractions` 패턴으로 통일한 것이 타당 |
| diff 전수 확인 | `app/_layout.tsx` 2곳(부트·포그라운드 복귀) InteractionManager 이관 + `catchUpTask.cancel()` 클린업 · `appBootStore`/`index.tsx`/`localAccountReset.ts`의 `postBootSettled` 용례 유지 — handoff 기술과 일치 |
| 잔여 리스크 | catch-up 실행 도중 탭이 들어오면 해당 sync 패스 길이만큼 지연 가능(기존 서브코어 프로브와 동일 수준) — 실기에서 `[title-diag] catchUp=..ms` 로그로 확인 예정 |
| 게이트 재실행 | `npx tsc --noEmit -p tsconfig.client.json` PASS · `npm run audit:memory:all` 전부 PASS(37/37 · skia 20/20 · worklet PASS · reclaim 20/20 · resident 7/7 · hot-path 0) |
| 실기 검증 | 미실시 — 대표님 실기에서 ①버튼 활성화 속도 복원 ②활성화 직후 탭 반응 ③백그라운드 복귀 ④`[title-diag]` 로그로 catch-up 실행 확인 |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED`** |
| **updated** | 2026-07-19 (김팀장 검수) · 2026-07-19 (김클로드 작성) |
| **task_id** | `title-postbootsettled-catchup-block-regression-20260719` |
| **요청자** | 대표님 — "현재 시작화면 로딩(시작버튼)이 이전보다 몇배 늘어나고 버튼 활성화시 바로 클릭이 안되는 오류가 발생중이다. 현재 김팀장이 수정중인데 바로 수정이 안되고 있다... 완전히 수정하라" |
| **선행 분석** | 같은 대화에서 먼저 "분석만" 진행 — git diff로 원인 확정 후 이번에 실제 수정. 분석 결과를 그대로 handoff에 남김(아래) |

### 근본원인 (git diff로 확정)

오늘(2026-07-19) 김팀장이 **다른** 버그("버튼 보이는데 탭해도 무반응")를 고치려고 `app/_layout.tsx`·`src/store/appBootStore.ts`에 `postBootSettled` 게이트를 추가했는데, 이게 두 증상을 **동시에** 유발했음:

1. **로딩 몇 배 증가**: 타이틀 버튼이 `bootReady` 하나만 보던 걸(이전 정상 동작), 오늘부터 `bootReady && postBootSettled`로 바뀌었고 `postBootSettled`는 아크코어 벽시계 catch-up(`applyArcCoreWallClockCatchUpFromPersistedGap` — 최대 48시간분 오프라인 경과를 일괄 반영)과 영토전 probe(`requestTerritorialCombatProbeAfterCatchUp` — 5단계 hydrate+combat pass)를 **`await`로 다 기다린 뒤에야** true가 되도록 바뀌었음(`Promise.race`로 12초 상한은 있었지만, 정상 케이스에서도 이전엔 없던 대기가 새로 생김).
2. **버튼 활성화돼도 클릭 무반응(재발)**: 애초에 고치려던 증상 그 자체 — `Promise.race([작업, 12초 타임아웃])`은 진 쪽 프라미스를 취소하지 않아서, 12초 상한에 걸리면 `postBootSettled=true`(버튼 활성화)로 바뀌어도 무거운 catch-up 작업이 백그라운드에서 계속 JS 스레드를 점유 중이라 그 순간 탭하면 그대로 무반응 — 고치려던 버그가 형태만 바뀌어 남아있었음.

**중요 발견**: 이 프로젝트에는 이미 정확히 같은 문제(무거운 부트 후속 작업이 JS 스레드를 점유해 화면이 멈추는 것)를 해결한 **검증된 패턴**이 있었음 — `ArcCoreDailyOpsSubCore.onBoot()`·`ArcCoreTerritorialCombatSubCore.onBoot()`가 이미 `InteractionManager.runAfterInteractions()`로 무거운 프로브를 감싸서 "현재 인터랙션과 경합 안 할 때만" 실행하고 있음(주석: "부트 프레임 차단 금지... 정오 이후 부팅 시 무거운 경제·코어 배치가 JS 스레드를 점유해 시작 화면이 멈추는 회귀 방지"). 오늘 추가된 코드만 이 패턴을 안 쓰고 `await`+`Promise.race`로 직접 막았던 게 회귀 원인.

### 수정 내용

`app/_layout.tsx` 2곳(①`bootReady` 효과, ②`AppState` 포그라운드 복귀 효과) — 기존 검증된 패턴과 동일하게 통일:

- `postBootSettled`를 catch-up 완료 대기 없이 **`bootReady`와 거의 동시에 즉시 `true`**로 설정(이전 정상 동작과 동일 타이밍으로 복원).
- 벽시계 catch-up + territorial probe는 `InteractionManager.runAfterInteractions(...)`로 넘겨, 현재 진행 중인 탭/인터랙션이 없을 때만 백그라운드로 실행 — 서브코어 자체 `onBoot()`와 동일한 방어 패턴.
- `Promise.race`+12초 타임아웃 제거(더 이상 버튼을 막지 않으므로 상한 자체가 불필요 — 실패해도 `try/catch`로 무시하고 다음 기회에 재시도되는 건 기존과 동일).
- `postBootSettled` 자체는 **삭제하지 않고 유지** — `src/account/localAccountReset.ts`(계정 초기화 후 타이틀 복귀 시 `InteractionManager.runAfterInteractions`로 올바르게 쓰고 있음)의 기존 용례는 이번 수정과 무관하게 그대로 둠.

### self-check

- [x] `npx tsc --noEmit -p tsconfig.client.json` — **PASS**
- [x] `npm run audit:memory:all` — **전부 PASS**(memory 37/37 · skia-worklet 20/20 · worklet-contract PASS · native-reclaim 20/20 · resident-set 7/7 · hot-path hits=0)
- [x] git commit **안 함**

### 리스크·주의

- **실기 미확인**(에뮬레이터/디바이스 없음) — 아래 확인 필요:
  1. 타이틀 화면 진입 시 버튼이 예전(오늘 이전) 속도로 빠르게 활성화되는지
  2. 활성화 직후 즉시 탭해도 정상 반응하는지(오래 앱을 안 켰던 계정 포함 — catch-up 대상량이 큰 케이스가 재현 조건에 더 유리)
  3. 앱을 백그라운드로 오래 뒀다가 복귀할 때도 동일하게 정상인지(②구간)
  4. 벽시계 catch-up·영토전 probe 자체가 어쨌든 실행은 되는지(`__DEV__`일 때 `[title-diag] catchUp=...ms probe=...ms` 로그로 확인 가능 — 실행 시점만 늦춰졌을 뿐 스킵되면 안 됨)
- `postBootSettled=true`를 즉시 세팅하는 방식이 "실제 입력 가능=버튼 표시" 원칙(주석 의도)에서 살짝 벗어난 것처럼 보일 수 있으나, `InteractionManager.runAfterInteractions`가 정확히 "탭 등 진행 중인 인터랙션이 없을 때만" 실행을 보장하므로 실질적으로는 동일한 보호를 더 가벼운 방식(캐치업 자체를 안 막고 경합만 피함)으로 달성한 것.

---

## ✅ REVIEWED — 최초 게임시작 인트로 "화면 한번 나왔다 스킵/재시작" 버그 수정 · 김클로드

### 김팀장 검수 (본창 Cursor · 2026-07-17)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS — 승인 (수정 없음)** |
| 근본원인 검증 | `!hadLocalAccountMeta` 분기만 `setCloudRestorePending(true/false)` 누락 — 바로 아래 `hadLocalAccountMeta:true` 분기와 비대칭이었음을 코드로 재확인. `titleInteractive`가 이 값으로 버튼을 잠그므로 stale `player=null` 라우팅 → 뒤늦은 `setPlayer()` 개입 시나리오와 증상 일치 |
| 예외 안전성 | `tryRestorePlayerFromCloud`는 내부 try/catch로 **절대 throw하지 않음**(`firestore.ts:159-162`) → pending=true로 영구 잠기는 경로 없음. 신규 계정(캐시·클라우드 모두 없음)은 서버 왕복 없이 즉시 `no_cloud_account` 반환이라 버튼 잠금 체감 지연도 거의 없음 |
| cancelled 경로 | `if (cancelled) return`으로 pending이 남는 케이스는 기존 true-분기와 동일 패턴(언마운트/deps 재실행 시 자연 해소) — 신규 리스크 아님 |
| 메모리 | 부트 1회 경로 상태 2회 갱신뿐 — 틱/루프 할당 없음 |
| tsc | `npx tsc --noEmit -p tsconfig.client.json` PASS (재실행 확인) |
| 실기 검증 | 미실시 — 완전초기화 재테스트 사이클의 재설치 시나리오에서 확인 예정 |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED`** |
| **updated** | 2026-07-17 (김팀장 검수) · 2026-07-17 (김클로드 작성) |
| **task_id** | `title-cloud-restore-intro-flash-race-20260717` |
| **요청자** | 대표님 — "최초 게임시작시 스토리 진행시 인류는 인공지능... 으로 시작되는 화면이 한번 나오다가 스킵되고 정상적으로 다시 시작되는 버그" |

### 근본원인 (코드로 확인)

`app/index.tsx`의 타이틀 화면 클라우드 복원 판정 로직(125-183행)에서, 로컬 계정 메타가 없는 경우(`!hadLocalAccountMeta` — 신규 설치·재설치 등) 분기(153-164행, 수정 전)만 유독 `setCloudRestorePending(true)`를 안 부르고 있었습니다. 같은 함수의 `hadLocalAccountMeta: true` 분기(166행)는 정상적으로 `true`→(대기)→`false`로 감싸는데, 이 분기만 비대칭이었습니다.

`titleInteractive = bootReady && hydrated && !cloudRestorePending`(99행)이 이 값으로 [게임 시작] 버튼 활성화를 결정하므로, 이 분기에서는 **Firestore `tryRestorePlayerFromCloud` 판정이 끝나기 전에도 버튼이 눌립니다.** 이때:

1. `handleStart`(185행)가 `player` 스냅샷을 읽는데, 판정이 아직 안 끝나 `player`가 `null`인 상태라 "신규 계정" 분기로 확정 — `NEW_ACCOUNT_INTRO_ROUTE`(`/intro?sceneId=intro01&flow=preNickname`)로 라우팅해 인트로 1페이지("인류는 인공지능...")를 띄웁니다.
2. 잠시 후 백그라운드에서 돌던 클라우드 복원이 완료되면 `usePlayerStore.getState().setPlayer(result.player)` + `bootstrapPlayerAfterCloudRestore(...)`가 **인트로 화면이 이미 마운트된 상태에서** 전역 player/world 상태를 큼직하게 갈아치웁니다.
3. 이 타이밍(재설치·클라우드에 기존 진행분이 있는 계정 등)에서 "인트로 1페이지가 잠깐 보였다가, 뭔가에 끊기고, 다시 처음부터 정상적으로 재생"되는 게 보고된 증상과 일치합니다.

### 수정

`app/index.tsx`의 `!hadLocalAccountMeta` 분기에 `setCloudRestorePending(true)`(호출 전)·`setCloudRestorePending(false)`(호출 후) 2줄 추가 — 바로 아래 `hadLocalAccountMeta: true` 분기와 완전히 대칭되도록 맞췄습니다. 이제 두 분기 모두 클라우드 판정이 끝날 때까지 [게임 시작] 버튼이 잠기므로, `handleStart`가 stale `player=null` 스냅샷으로 라우팅을 확정한 뒤 뒤늦게 진짜 player가 끼어드는 창구 자체가 사라집니다.

### self-check

- [x] `npx tsc --noEmit -p tsconfig.client.json` — **PASS**
- [x] git commit **안 함**

### 리스크·주의

- **실기 미확인** — 재설치(로컬 데이터 삭제 후 같은 계정으로 재접속) 시나리오로 재현·검증 필요(에뮬레이터/디바이스 미보유). 진짜 신규 계정(클라우드에도 데이터 없음)은 버튼이 잠깐 더 길게 비활성 상태로 보일 수 있으나(Firestore 왕복 1회), 신규 계정은 원래도 `tryRestorePlayerFromCloud`가 즉시 `not_found`류로 끝나 체감 지연은 거의 없을 것으로 예상됩니다.
- 이 수정은 레이스 윈도우를 없애는 것 — 정확히 어떤 리렌더/리마운트 경로로 "화면이 끊겼다 재시작"되는 시각효과가 나오는지까지는 재현 없이 100% 특정하지 못했지만, 원인이 되는 stale-snapshot 라우팅 자체는 확실히 막힙니다.

---

## ✅ REVIEWED — eternal_throne 웨이브 디펜스 진입 트리거 + 마지막 웨이브 보스 게이트 · 김클로드

### 김팀장 검수 (본창 Cursor · 2026-07-17)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS — 승인 (수정 없음)** |
| diff 전수 확인 | `planet.tsx`(하드코딩 `isTestBed`→CSV `mainStageCombatVariant` 기반 `waveDefenseEnabled`) · `useWaveDefenseController.ts`(rename만, 로직 동일) · `arcCoreShadowBossClone.ts`(최종 웨이브 게이트, `getState()` 동기 read만) · `PlanetEdenRaidTestLayer.tsx`(리빌 최종 웨이브 게이트 + endgame_boss 스폰 레이아웃) · amendment §2·§3 — 전부 handoff 기술과 일치 |
| 메모리·핫패스 | `resolvePlanetMainStageCombatVariant`는 모듈 Map O(1) 조회(렌더당 할당 없음) · 전투 경로 네트워크 호출 없음 · `npm run audit:memory:all` 전부 PASS (재실행 확인) |
| tsc | `npx tsc --noEmit -p tsconfig.client.json` PASS (재실행 확인) |
| vega_base 회귀 | `arcCoreShadowBossClone` 본진 행성 가드로 무영향 · draco_wave 트리거 동작 동일 (정적 확인) |
| 잔여 과제 | ①(Firestore `arc_core_shadow_*` 쓰기 권한 — 자기 uid만 허용 규칙) **미해결·별도 P1** · ②(닉네임 미러 통일) 저우선 · ③(진입 트리거 부재)은 **본 작업으로 해소** |
| 실기 검증 | 미실시 — 대표님 완전초기화 후 재테스트 사이클에서 handoff 기재 시나리오 1~6 확인 예정 |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED`** |
| **updated** | 2026-07-17 (김팀장 검수) · 2026-07-13 (김클로드 작성) |
| **task_id** | `arccore-shadow-eternal-throne-wave-trigger-20260713` |
| **요청자** | 대표님 — 2차 검수 지적 ③(진입 트리거 부재)에 "웨이브 전투룰로 전투를 시작하는 것은? 전 행성의 기본 전투룰은 웨이브 전투룰이다"로 재검토 지시 → plan mode 승인 → "웨이브 전투룰 그대로 재사용, 마지막 웨이브만 보스 적용" 확정 |
| **선행** | 위 2차 검수(`review-arccore-shadow-pairing-20260713-r2`) 지적 ③에 대한 실제 코드 수정. ①(Firestore 쓰기 권한)·②(닉네임 미러 우회)는 이번 범위 밖, 여전히 미해결로 남아있음 |

### 검토 결과 — 재확인한 사실관계

`tables/balance/planet_hostile_red_progression.csv`에 `mainStageCombatVariant` 컬럼이 이미 있고 `vega_base=draco_wave`, `eternal_throne=endgame_boss`(zoneIndex=20, amendment 문구와 일치)로 **서로 다른 값**이 이미 채워져 있었음. 그런데 `useWaveDefenseController`를 트리거하는 `isTestBed: planet?.id === 'vega_base'`(`planet.tsx:954`)는 이 컬럼을 안 읽고 행성 id 문자열을 하드코딩한 것이었음 — eternal_throne이 전투 진입 자체가 안 되던 근본 원인. 대표님이 "웨이브 전투룰이 기본"이라고 하셔서, `draco_wave`뿐 아니라 `endgame_boss`도 같은 웨이브 디펜스 엔진을 타도록 하는 것으로 확정.

**로직상 문제 2건 확인**(둘 다 이번에 같이 수정, 대표님 "그대로 재사용" 지시의 자연스러운 연장으로 판단):
1. `resolveArcCoreShadowBossOverride`가 웨이브 번호를 안 봐서, 그대로 뒀으면 9웨이브 전부의 red 슬롯0에 복제 보스가 반복 등장했을 것(1웨이브부터 범용 침입자 대신 보스 등장 — "최종 보스전" 서사와 안 맞음).
2. 리빌(닉네임 공개) 트리거도 웨이브 번호를 안 봐서, 그대로 뒀으면 **1웨이브만 이겨도 짝 유저 닉네임이 공개**됐을 것.

### 수정 내용

- **`app/(game)/planet.tsx`**: `resolvePlanetMainStageCombatVariant`(기존 함수, `PlanetEdenRaidTestLayer.tsx`에서 이미 쓰던 것 재사용) import 추가. `useWaveDefenseController`의 `isTestBed: planet?.id === 'vega_base'`(문자열 하드코딩) → `waveDefenseEnabled: variant === 'draco_wave' || variant === 'endgame_boss'`(테이블 기반)로 교체.
- **`src/game/waveDefense/useWaveDefenseController.ts`**: prop `isTestBed` → `waveDefenseEnabled`로 rename(eternal_throne은 QA 테스트베드가 아니라 실제 엔드게임 콘텐츠라 이름이 오해 소지 있었음). 로직(10초 지연 트리거·9웨이브 루프·`endRun`)은 완전히 그대로, 이름·주석만 갱신.
- **`src/arcCore/shadow/arcCoreShadowBossClone.ts`**: `resolveArcCoreShadowBossOverride`에 게이트 추가 — 웨이브 디펜스가 해당 행성에서 `active`하면 `waveIndex >= WAVE_DEFENSE_MAX_WAVES`(9)일 때만 통과, 그 전 웨이브는 `null` 반환(기존 CSV 범용 침입자 그대로 스폰). 기존 게이트(본진 행성·슬롯0·스냅샷 보유)는 안 건드림.
- **`src/components/planet/PlanetEdenRaidTestLayer.tsx`**:
  - `maybeTriggerArcCoreShadowRevealOnCombatVictory` 호출부에 동일한 "마지막 웨이브 또는 비-웨이브전투"게이트 추가(`useWaveDefenseStore`/`WAVE_DEFENSE_MAX_WAVES` 신규 import 1개만 추가, `useWaveDefenseStore`는 이미 이 파일에서 쓰던 것).
  - `resolveDuelSpawnVariantForPlanet`의 `draco_wave` 전용 고정 스폰 레이아웃 분기에 `endgame_boss`도 포함(스폰 방식 일관성).
- **`.cursor/rules/arcfire-shadow-pairing-amendment.mdc`**: §2·§3에 웨이브 디펜스 재사용·마지막 웨이브 게이트 내용 반영(정본 문서-구현 동기화).

### self-check

- [x] `npx tsc --noEmit -p tsconfig.client.json` — **PASS**
- [x] `npm run audit:memory:all` — **전부 PASS**(memory 37/37 · skia-worklet 20/20 · worklet-contract PASS · native-reclaim 20/20 · resident-set 7/7 · hot-path hits=0)
- [x] git commit **안 함**

### 리스크·주의 — combat 핵심 로직 변경이라 실기 검증 중요

- **실기 미확인**(에뮬레이터/디바이스 미보유) — 아래 시나리오 전부 대표님 확인 필요:
  1. `eternal_throne` 착륙 → 10초 후 웨이브1 자동 시작(vega_base와 동일 패턴인지)
  2. 웨이브 1~8: 복제 보스 안 나오고 범용 침입자만, 리빌 알럿 안 뜨는지
  3. 웨이브 9: 슬롯0에 짝 유저 기함 스펙 적용 + 위장명(`아크코어 근원체`) 표시
  4. 웨이브 9 승리 시점에만 닉네임 공개 알럿 1회
  5. **`vega_base` 회귀 없는지** — `arcCoreShadowBossClone.ts` 게이트가 `combatPlanetId !== ARC_CORE_SHADOW_HOME_BASE_PLANET_ID`에서 이미 걸러지므로 vega_base엔 영향 없어야 함(정적 코드로는 확인, 실기 재확인 권장)
  6. 스냅샷 미보유(미페어·오프라인) 상태로 웨이브9 도달 시 CSV 폴백 정상 동작
- **①(Firestore 쓰기 권한)·②(닉네임 전체프로필 읽기)는 이번 작업 범위 밖** — 2차 검수 기록 그대로 유효, 별도 조치 필요.
- `buildWaveDefenseEnemyFleet`(범용 침입자 생성 로직) 자체는 미변경 — 웨이브 1-8 난이도·구성은 vega_base와 동일 공식.

---

## 🔵 REVIEW ONLY(코드 변경 없음) — 아크코어 섀도우 페어링 2차 검수(확장분 포함) · 김클로드

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEW`** — 코드 변경 없음, 검수 의견만 |
| **updated** | 2026-07-13(2차) |
| **task_id** | `review-arccore-shadow-pairing-20260713-r2` |
| **요청자** | 대표님 — "김팀장이 구현 내용 재검토 실시" |
| **전제** | 1차 검수(아래 `review-arccore-shadow-pairing-20260713`) 이후 김팀장이 **"복제 전함 보스" 기능을 크게 확장**함(전함 스냅샷 publish/fetch, `arc_core_shadow_profiles/{uid}` 미러, 본진 red 리드 슬롯 주입) — amendment §16-A도 이 내용으로 갱신됨. 1차 지적 3건 중 어디까지 해소됐는지 재확인. |

### 1차 지적 재확인

**① Firestore 쓰기 권한 무방비 — 미해결, 오히려 심각도 상승.** `firestore.rules`는 여전히 그대로(`arc_core_shadow_*` 전부 `allow read, write: if true`, auth 조건도 없음). 1차 때는 "페어링 장부 조작" 정도였는데, 이번 확장으로 **`arc_core_shadow_profiles/{uid}`에 전투 스탯 스냅샷(`maxHp`·`attackBonus`·`damageDiceBonus`·이동속도 등)을 아무나 직접 덮어쓸 수 있게** 됐습니다. `parseArcCoreShadowShipSnapshot`(`arcCoreShadowShipSnapshot.ts:176-235`)이 타입 체크·일부 `Math.max` 하한은 두지만 **상한 클램프가 전혀 없어서**, 변조 클라이언트가 예컨대 `combat.maxHp: 999999999` 나 `combat.attackBonus: 999999`를 남의 uid 문서에 심으면 그 사람이 겪는 "핵심 플레이"(본진 보스전)가 즉시 무적이거나 즉사시키는 보스로 바뀝니다. 즉 1차의 "장부 조작" 리스크가 이번 확장으로 "**다른 실제 유저의 엔드게임 전투를 직접 망가뜨릴 수 있는**" 리스크로 격상됐습니다. `game_save_backups`에 이미 있는 `request.auth.uid == uid` 패턴을 `arc_core_shadow_pairs`·`arc_core_shadow_profiles`·`arc_core_shadow_pool`에도 적용하는 걸 강하게 권합니다(최소한 각자 자기 uid 문서만 쓰게).

**② 짝 유저 데이터 미러 우회 — 부분 해소.** 새 스냅샷(전함 스펙) 쪽은 스펙대로 `arc_core_shadow_profiles/{uid}` 미러를 통해서만 오갑니다(`publishArcCoreShadowShipProfile`/`fetchArcCoreShadowShipProfile`) — 잘 지켜졌습니다. 다만 `fetchArcCoreShadowNickname()`은 여전히 `users/{uid}` 전체 문서를 직접 `getDoc`합니다(변경 없음). §1의 "닉네임 등 공개 안전 필드는 단발 getDoc 허용"과 §2의 "확장 데이터는 미러로만, 전체 프로필 직접 참조 금지"를 같이 읽으면 — 닉네임 자체는 v1 허용 범위로 봐도 되겠지만, 굳이 전체 문서를 당겨올 필요 없이 이제 존재하는 `arc_core_shadow_profiles`에 닉네임도 같이 넣어서 그쪽만 읽으면 되므로, 기왕 미러가 생긴 김에 통일하는 걸 권합니다(우선순위는 낮음).

**③ 리빌·보스 진입 트리거 도달 불가능 — 미해결, 이번 확장으로 비중이 커짐.** 코드 배선(`resolveArcCoreShadowBossOverride`가 `initAgents`의 red 슬롯0 생성 경로(`PlanetEdenRaidTestLayer.tsx:2354`)에 정확히 연결됨)은 확인했고 잘 만들어져 있습니다. 그런데 `eternal_throne`에 배치된 함장 3명(`npc_ai_captains.csv` 100-102행, `npc_cpt_enemy_eternity_01/02/03`)이 **여전히 `operationalState=general`**이고(테이블 자체는 이번에도 안 바뀜), `app/(game)/planet.tsx`·`src/game/planetHub/` 어디에도 `eternal_throne` 언급이 없습니다 — `vega_base`류 강제 테스트베드 트리거도 없습니다. 표준 전투 진입 판정(`hasEnemyFleetEnteredPlanetOrbit`)은 `operationalState==='combat'`만 인정하므로, **지금 게임 상태로는 플레이어가 본진에서 전투를 시작할 방법이 여전히 안 보입니다.** amendment 자체가 이 기능을 "핵심 실제 플레이(핵심 플레이)"라고 부르는데, 그 핵심이 아직 발동 지점이 없는 셈이라 — 이번 확장분(스냅샷 시스템 전체)이 지금은 도달 불가능한 코드입니다. 있다면 제가 못 찾은 것이니 확인 부탁드립니다.

### 신규 확인 사항 (확장분 자체 품질)

- `buildLocalArcCoreShadowShipSnapshot`(자기 기함 스냅샷 빌드) → `publishArcCoreShadowShipProfile`(publish) → `fetchArcCoreShadowShipProfile`(짝 유저 fetch, 부트당 1회, `runArcCoreShadowPairingPass.ts`의 `syncShadowShipProfilesOnce`) → `resolveArcCoreShadowBossOverride`(전투 스폰 시 zustand 동기 read만, 네트워크 없음) → `initAgents` red 슬롯0 주입까지 **엔드투엔드로 실제 연결돼 있음을 코드로 확인**. 전투 경로 자체에는 네트워크 호출이 없다는 설계 의도(§16-A)도 지켜짐.
- 스냅샷 미보유(미페어·오프라인·fetch 실패) 시 `resolveArcCoreShadowBossOverride`가 `null`을 반환해 기존 CSV 보스로 자연 폴백 — 안전.
- i18n 신규 키(`arcCoreShadow.boss.concealedName`) ko/en 둘 다 존재.
- `npx tsc --noEmit -p tsconfig.client.json` 전체 PASS(확장분 포함, 에러 없음).

### 결론

코드 완성도 자체는 높습니다(파이프라인 연결, 폴백, 타입 안전 전부 확인). 다만 **①(쓰기 권한)과 ③(진입 트리거 부재)는 여전히 미해결**이고, 특히 ①은 이번 확장으로 "다른 실유저 엔드게임 전투 결과를 원격으로 조작 가능"이라는 더 구체적이고 심각한 형태가 됐습니다. 실서비스 노출 전에 최소 ①(자기 uid만 쓰기 허용 규칙)과 ③(본진 전투 진입 경로) 둘 다 확정 필요.

---

## 🔵 REVIEW ONLY(코드 변경 없음) — 아크코어 섀도우 페어링(김팀장 구현) 검수 의견 · 김클로드

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEW`** — 이 항목은 제가 코드를 고친 게 아니라 **김팀장 작업물을 검수한 의견**입니다 |
| **updated** | 2026-07-13 |
| **task_id** | `review-arccore-shadow-pairing-20260713` |
| **요청자** | 대표님 — "현재 김팀장 쪽에서 아크코어 섀도우 페어링 구현 작업이 진행되었다. 전체 작업에 대해 철저하게 검수하라. (코드 보완부분 중점)" |
| **범위** | `.cursor/rules/arcfire-shadow-pairing-amendment.mdc`, `src/firebase/arcCoreShadowPairing.ts`, `src/store/arcCoreShadowIdentityStore.ts`, `src/arcCore/shadow/*.ts`, 연동부(`app/_layout.tsx`·`onboardingPilotRegistration.ts`·`PlanetEdenRaidTestLayer.tsx`·`localAccountReset.ts`), i18n 2개 키. 전부 **미커밋 상태**(git status 미추적/수정) — 아직 handoff 기록도 없었음. |

### 결론 요약

핵심 매칭 로직(대기열 트랜잭션)·boot 비동기 규율·계정초기화 제외 처리는 잘 만들어졌습니다. 다만 **③이 가장 심각**하고, 나머지는 "완성 전 스텁/설계 의도와 실제 구현의 괴리" 성격입니다.

### ① [높음] `arc_core_shadow_pairs/{uid}` · `arc_core_shadow_pool/waiting` — Firestore 쓰기 권한 무방비

`firestore.rules`를 직접 확인한 결과, 이 두 컬렉션은 프로젝트 공통 와일드카드 `allow read, write: if true`(그나마 `request.auth != null` 조건도 없음) 하나로만 걸려 있습니다. 반면 이미 존재하는 `users/{uid}/game_save_backups/**` 규칙은 `request.auth.uid == uid`로 **본인 문서만** 쓰게 막아뒀습니다 — 즉 "본인 uid만 쓰기 허용" 패턴이 이 프로젝트에 이미 있는데 섀도우 페어링에는 적용 안 됨.

`ensureArcCoreShadowPairing(uid)`가 `uid`를 내부에서 `getCurrentUser()`로 강제하지 않고 인자로 받기 때문에, 그리고 규칙상 아무나 아무 uid 문서에 쓸 수 있기 때문에 — 변조 클라이언트가 `arc_core_shadow_pairs/{다른유저uid}`에 직접 `setDoc`으로 임의 `shadowUid`를 덮어써서 **타 유저의 페어 관계를 조작/훼손**할 수 있습니다(트랜잭션 로직 자체를 완전히 우회 가능). 대기열 문서(`arc_core_shadow_pool/waiting`)도 마찬가지로 스팸/오염이 가능합니다. 헌법 수정안 §16-A가 "공개 안전 필드만", "일회성 상호 매칭"이라고 신중하게 스코프를 좁혀놨는데, 정작 쓰기 자체엔 그 신중함에 걸맞은 서버측 강제가 전혀 없습니다.

**제안**: `game_save_backups`와 동일한 패턴으로 `arc_core_shadow_pairs/{uid}`에 `request.auth.uid == uid` 규칙 추가(자기 자신의 페어 문서만 쓰기 허용 — 상대방 페어 문서는 트랜잭션 안에서 같이 쓰는 구조라 규칙 설계를 조금 더 고민 필요할 수 있음, 예: Cloud Function 경유 또는 "상대 문서엔 자기 uid를 shadowUid로 넣는 것만" 허용하는 조건식).

### ② [중간] 짝 유저 닉네임 읽기가 수정안 자기 조항(§2)을 벗어남

`fetchArcCoreShadowNickname()`(`src/firebase/arcCoreShadowPairing.ts:117-129`)이 `users/{uid}` **전체 문서**를 `getDoc`으로 읽습니다. 그런데 수정안 §2 "확장" 조항은 "짝 유저 데이터 노출은 `arc_core_shadow_profiles/{uid}` 공개 안전 미러 문서를 통해서만 확장한다(**전체 프로필 직접 참조 금지**)"라고 명시돼 있습니다 — 지금 코드는 정확히 그 금지된 방식(전체 프로필 직접 참조)으로 닉네임만 골라 씁니다. UI엔 닉네임만 노출되지만, 네트워크 상으로는 상대방 `users/{uid}` 문서 전체(`isAdmin` 포함)가 클라이언트에 도달합니다. `arc_core_shadow_profiles/{uid}` 미러 문서 자체가 아직 존재하지 않는 것으로 보아, 이건 "1차 스코프 축소"였을 가능성이 있지만 — 수정안 문구와 명백히 어긋나므로 김팀장·대표님 확인 필요.

### ③ [중간, 미완성 가능성] 리빌 트리거 자체가 현재 도달 불가능할 수 있음

`eternal_throne`에 배치된 NPC 함장 3명(`npc_cpt_enemy_eternity_01/02/03`, `npc_ai_captains.csv` 100-102행)을 확인했는데 **`operationalState = general`**입니다(`combat`이 아님). 기존 전투 트리거 판정 `hasEnemyFleetEnteredPlanetOrbit()`(`planetHubConstants.ts`)은 `operationalState !== 'combat'`이면 무시하도록 돼 있어서, 이 함장들은 지금 상태로는 궤도 진입 판정에 안 걸립니다. `eternal_throne`은 `vega_base` 같은 웨이브디펜스 테스트베드 플래그도 없습니다. 즉 **현재 게임 상태로는 플레이어가 `eternal_throne`에서 전투에 진입할 방법 자체가 안 보입니다** — 있다면 제가 못 찾은 것이니 확인 부탁드리고, 없다면 `maybeTriggerArcCoreShadowRevealOnCombatVictory` 배선 자체는 맞게 돼 있어도 실제로는 아직 발동 불가능한 "완성 전" 상태입니다(엔드게임 보스전 콘텐츠가 별도로 더 필요).

### 잘 되어 있는 부분 (참고용)

- 트랜잭션 매칭 로직(대기열 확인→상호 페어 원자적 기록→자기자신 페어링 방지 가드)은 Firestore 트랜잭션 재시도 의미론에 맞게 정확히 짜여 있음.
- boot·온보딩 연동 전부 `void`/`setTimeout` 기반 fire-and-forget — CLAUDE.md 부트 동기 실행 금지 규칙 위반 없음. `onSnapshot`·주기 폴링도 없음(수정안 §1 준수).
- `arcCoreShadowIdentityStore`가 `purgeLocalAccountData`에서 의도적으로 제외됐다는 주석·실제 코드 둘 다 확인 — 계정초기화 후에도 유지된다는 설계와 일치.
- i18n 키(`arcCoreShadow.reveal.*`) ko/en 둘 다 존재, `npx tsc --noEmit -p tsconfig.client.json` 전체 PASS(신규 파일 포함 타입 에러 없음).

### 확인 안 한 것 (제 검수 범위 밖)

- `arc_core_shadow_profiles/{uid}` 미러 문서 스키마·구현 여부(존재 자체를 못 찾음 — ②와 연결).
- 실기(디바이스) 상에서 실제 페어링 완료·리빌 알럿 동작은 미확인(정적 코드 검토만 수행).
- 테스트 코드 없음(신규 기능 전체) — 필요 여부는 팀 판단.

---

## 🟡 PENDING(신규 기능, UI만·테이블 재사용) — 무역소 전함 구매창 상단 이미지 슬롯 추가 · 김클로드

| 필드 | 값 |
|------|-----|
| **status** | **`PENDING`** |
| **updated** | 2026-07-12 |
| **task_id** | `trade-ship-purchase-portrait-slot-20260712` |
| **요청자** | 대표님 — "무역소 Buy 탭 > Ships 탭에서 전함 카드 클릭 시 뜨는 구매 정보창 최상단에 정사각형(현재 레이아웃 최대) 이미지 영역을 확보하고, 이미지 준비중 텍스트만 표시... 기존 상품 테이블에서 호출하는 테이블 기반 작업이어야 함(하드코딩·신규 테이블 생성 금지). Starter Fighter Mk.I는 이미 에셋 있음 — 연결" |

### 구현 내용

기존에 이미 존재하던 "전함 id → `npc_ai_ships.csv`의 `portraitImageAssetKey` → asset require()" 체인(조선소 화면 `app/(game)/shipyard.tsx`에서 이미 쓰던 것과 완전히 동일한 테이블·리졸버)을 무역소 구매창에도 그대로 연결. **신규 테이블·신규 CSV 컬럼·이미지 매핑 하드코딩 전부 없음** — 기존 `src/game/npcCapitalShipPortraitAssets.ts`(전함 id→require 맵, `ship_001.png` 등 이미 등록돼 있던 것 그대로)를 재사용만 함.

- `src/ui/overlay/content/ShipPurchasePortraitSlot.tsx`(신규) — 헤더 바로 아래 카드 전폭 정사각형(`aspectRatio: 1`) 슬롯. `getNpcCapitalShip(npcCapitalShipId)?.portraitImageAssetKey` → `resolveNpcCapitalShipPortraitSource()`로 이미지 있으면 `resizeMode="contain"`으로 표시, 없으면 "이미지 준비중" 텍스트만 표시(`PlanetInfoPortraitSlot.tsx`의 filled/empty 이중 상태 패턴 그대로 재사용, 정사각형만 다름).
- `src/ui/overlay/arcOverlayStore.ts` — `ArcOverlayTradeQuantityEntry`에 `npcCapitalShipId?: string | null` 필드 추가(전함 구매일 때만 채워짐 → 무기/장비/일반 아이템 구매창은 기존과 완전히 동일, 이미지 슬롯 자체가 안 뜸).
- `src/ui/overlay/content/TradeQuantityOverlayContent.tsx` — `ArcOverlayCard`의 기존 `panelBleedPrefix` 슬롯(행성정보창에서 이미 쓰던 것과 동일 메커니즘)에 `entry.npcCapitalShipId`가 있을 때만 `ShipPurchasePortraitSlot` 연결.
- `app/(game)/trade.tsx` `handleBuy` — 기존에 `onConfirm` 안에서만 계산하던 `capitalShipNpcId`(`itemDef.attrs.npcCapitalShipId`, `type==='capital_ship'`일 때만)를 함수 상단으로 끌어올려 `presentArcOverlayTradeQuantity` 호출 시 `npcCapitalShipId`로 같이 전달 — 중복 계산 제거, 로직 변경 없음.
- `src/i18n/locales/ko.ts`·`en.ts` — `tradeQty.shipImagePending`("이미지 준비중"/"Image coming soon")·`tradeQty.shipImageA11y` 2개 키 추가.

**Starter Fighter Mk.I 확인**: `capital_ship_Player_npc_red_fleet_1` → `attrs.npcCapitalShipId = "Player_npc_red_fleet_1"` → `npc_ai_ships.csv` 해당 행 `portraitImageAssetKey = "assets/images/ship/ship_001.png"` → 이미 `npcCapitalShipPortraitAssets.ts`에 등록돼 있어 실제 이미지로 표시됨. 그 외 전함(맵에 미등록된 `portraitImageAssetKey`)은 "이미지 준비중"으로 표시 — 이후 이미지 추가 시 `npcCapitalShipPortraitAssets.ts`의 맵에 한 줄만 추가하면 자동 반영(테이블 값은 이미 대부분 채워져 있어 별도 CSV 작업 불필요).

### ⚠️ 후속 수정(같은 턴) — 스크롤 레이아웃 버그

최초 구현은 이미지 슬롯을 `ArcOverlayCard`의 `panelBleedPrefix`(스크롤 밖 고정 영역, 행성정보창과 동일 메커니즘)로 붙였는데, 대표님이 즉시 "Description 영역만 스크롤되어 화면 아래에 너무 작게 표시된다"고 지적. 원인: 정사각형 이미지(카드 폭만큼 높이도 큼)가 헤더·메타 정보·푸터와 함께 카드의 **고정** 영역을 차지해버려서, bounded 카드 높이 안에서 ScrollView(설명·Tips·수량)에 남는 공간이 거의 없어짐 — 행성정보창 이미지(가로가 세로보다 훨씬 긴 배너형)에서는 안 생기던 문제가 정사각형이라 크게 불거짐.

**수정**: `panelBleedPrefix` 사용을 제거하고, 이미지 슬롯을 `children`(=ScrollView 내부)의 **첫 항목**으로 이동 — 이미지·설명·Tips·수량이 전부 하나의 스크롤 영역 안에서 함께 움직임(`TradeQuantityOverlayContent.tsx` `styles.shipPortraitSection` 신설). `panelPrefix`(단가·재고·수요·보유 메타 행)는 그대로 고정 유지 — 크기가 작아 원인이 아니었음, 다른 구매창(무기/장비/아이템) 동작에 영향 없도록 최소 변경. 이미지는 이제 카드 좌우 패딩만큼 안쪽으로 들어가지만(기존 bleed는 카드 폭 끝까지) 여전히 정사각형·최상단·스크롤 가능.

### self-check

- [x] `npx tsc --noEmit -p tsconfig.client.json` — **PASS**(두 차례 모두)
- [ ] `npm run audit:memory:all` — 해당 없음(Skia/STAGE dispose 무관, 순수 RN Image/View UI 추가)
- [x] git commit **안 함**

### 리스크·주의

- 실기 미확인 — 무역소 Buy > Ships 탭에서 실제로 카드 눌러서 정사각형 슬롯·"이미지 준비중" 텍스트·Starter Fighter Mk.I 실제 이미지 표시·전체 스크롤 동작을 눈으로 확인 필요.
- 무기/장비/일반 아이템 구매창·판매(sell) 모달은 `npcCapitalShipId`가 항상 null이라 기존 레이아웃과 100% 동일 — 회귀 리스크 낮음.

---

## 🟡 PENDING(1줄 실질 수정 + 전면 재검수) — 웨이브전투 진입/웨이브전환/종료 메모리 할당·해제 전수 재검수 · 김클로드

| 필드 | 값 |
|------|-----|
| **status** | **`PENDING`** |
| **updated** | 2026-07-11 02:40 KST |
| **task_id** | `wave-defense-combat-entry-exit-memory-audit-20260711` |
| **요청자** | 대표님 — "전투 전환 상황에 대해 모두 재검수하고, 일괄적인 전투 진입과 해제에 대한 메모리 할당및 해제 부분도 집중검사하라... 웨이브전투 중심으로 집중 검수하라... 수정사항이 있다면 수정작업도 바로 진행하라" |
| **선행작업** | 바로 위 `hub-activation-gl-views-spike-rootcause-20260710`(REVIEWED PASS) — vega_base 자동전투가 GL 급증의 트리거임을 확인한 작업의 후속. 이번엔 그 전투 자체의 진입→웨이브전환(9회)→종료 전 구간 메모리 수명을 전수 검사 |

### 검사 범위·방법

Explore 에이전트 2개(①웨이브디펜스 상태기계 entry→9웨이브→exit 추적 ②Skia/GPU 리소스 할당·해제 대칭성 감사)를 병렬로 돌렸으나 **세션 한도로 둘 다 중도 실패** — 이후 전부 직접 코드로 재확인하며 진행. 아래는 전부 파일:라인 직접 대조 완료.

### 확인 결과 — 정상 동작 중인 것 (버그 아님, 이미 잘 구현돼 있음)

1. **런 전체 종료(9웨이브 완주/패배)**: `useWaveDefenseController.ts` `endRun()` → `active=false` → `app/(game)/planet.tsx`의 `capitalCombatOrbitActive`가 false로 → `PlanetCapitalCombatRoot`(`src/game/planetCapitalCombatIntegration.tsx:60-62`)가 `<Binder>` 서브트리 전체를 실제로 **React 언마운트**시킴 → `PlanetEdenRaidOrbitSkiaCombat.tsx`의 언마운트 cleanup(950줄 파일 전수 확인)이 정확히 실행됨: `missileTrail`·`novaHead`·`diamond` 3개 Path 풀 전부 `drainSkPathPool` (라인 950-952, 최초 훑어봤을 때 앞 2줄을 놓쳐 "누락 아닌가" 의심했다가 재확인해서 배제), `novaTangentStable`·`thrusterLenSmooth` clear, `dropSkPictureReactFrame`, `reclaimCombatSkiaModuleCaches()`(모듈 전역 Paint·SkColor 캐시·PictureRecorder까지) 순서대로 실행. **완전함.**
2. **웨이브 전환(9회, 런 안에서는 Canvas 리마운트 없음)**: `waveDefenseStore.ts`의 `waveGenKey`가 `setWave()`마다 증가 → `PlanetEdenRaidTestLayer.tsx:2649-2704`의 reseed effect가 `waveGenKey` 변화를 감지해 매 웨이브 `missilesRef`·missileHitFxRef·respawn 상태 등을 명시적으로 리셋하고, `clearCapitalRealtimeCombatPresentationCaches()`(= `runCombatSkiaPresentationReclaim()`)를 호출해 Skia 모듈 캐시·live picture frame을 회수함. **완전함.**
3. **전투 중(9웨이브 내내) 주기적 안전판**: `app/(game)/planet.tsx:794-810`에 `HUB_COMBAT_SAFE_RECLAIM_INTERVAL_MS`(3분) 간격 `setInterval`이 이미 존재 — 처음엔 `runPlanetHubCombatSafeReclaimPass` 호출부를 못 찾아 "죽은 코드(orphaned)"로 오판했으나, `app/(game)/planet.tsx`가 `src/` 밖(Expo Router `app/` 디렉토리)이라 제 첫 grep 범위가 놓친 것 — 재검색으로 정상 존재·정상 배선 확인. 가드 조건(`periodicReclaimSuppressedRef`, 라인 671-678·797-800)도 이중부정이라 처음엔 반대로 읽었으나, "웨이브 모드에서는 phase==='combat'(실제 교전 프레임) 동안만 다른 5분/15분 reclaim을 skip하고, 그 skip 구간에서만 combat-safe reclaim이 대신 돈다"는 의도와 정확히 일치함(오독 정정 완료).

### 확인 결과 — 실제 수정한 것 (1건)

**`runPlanetHubCombatSafeReclaimPass`(`src/game/nativeReclaim/runPlanetHubCombatSafeReclaimPass.ts`)의 회수 범위가 좁았음.** 이 함수 자체는 정상 배선돼 있었지만(위 3번), 내부적으로는 `runCombatSkiaPresentationReclaim()`(Skia 캐시)과 `trimNativeBitmapCachesAsync()`(Fresco)만 호출 — 함수 docblock이 명시한 "mid-frame에 안전한 것만 골랐다"는 설계 의도 자체는 맞지만, **정작 `nativeReclaimBootstrap.ts`에 stage='combat' 리스너로 이미 등록돼 있던 `prunePlanetNebulaProfilesLru`/`compactPlanetMemoRegistryShells`(둘 다 순수 JS, Skia/GPU 호출 없음 — mid-frame 안전 기준에 부합)는 빠져 있었음**. 이 두 함수는 `runStageNativeReclaimPass`(스테이지 **이탈** 시점)를 통해서만 실제로 호출되고 있었고, 전투 중에는 한 번도 안 불림.

**실제 발생 가능한 문제**: 허브를 여러 번 순회(허브 순회, 이미 CLAUDE.md에 READY 항목으로 등록된 이슈)하다가 vega_base 같은 곳에서 장시간(9웨이브) 자동전투에 들어가면, 이전에 들렀던 다른 행성들의 nebula profile이 route_blur 없이 전투 내내(15분+) 계속 상주 — 오늘(2026-07-10) 재시동 #2의 시그니처(GL은 평탄인데 PSS/native_heap만 +281MB 급등, 07-07 인시던트와 동일 패턴)와 부합하는 후보.

**수정**: `runPlanetHubCombatSafeReclaimPass()`에 `prunePlanetNebulaProfilesLru(NEBULA_PROFILE_KEEP_ON_HUB_BLUR)` + `compactPlanetMemoRegistryShells()` 2줄 추가. 둘 다 이미 다른 곳(`runStageNativeReclaimPass.ts`)에서 검증된 함수 재사용 — 새 로직 없음, mid-frame 안전 기준(Skia/GPU 미호출)에 부합.

### self-check

- [x] `npx tsc --noEmit -p tsconfig.client.json` — **PASS**
- [x] `npm run audit:memory:all` — **전부 PASS**(memory 37/37 · skia-worklet 20/20 · worklet-contract PASS · native-reclaim 20/20 · resident-set 7/7 · hot-path hits=0)
- [x] git commit **안 함**

### 리스크·주의

- 이번 변경 1줄 추가는 이미 검증된 함수(`prunePlanetNebulaProfilesLru`·`compactPlanetMemoRegistryShells`) 재사용이라 신규 로직 리스크는 낮음. 다만 **실기(디바이스) 검증은 아직 안 함** — 다음 vega_base 장시간 전투 재현 때 `mem-timeline.csv`에서 restart #2류 패턴(GL 평탄, PSS/native_heap만 급등)이 줄어드는지 확인 필요.
- 이번 조사에서 새로운 코드 버그는 이 1건 외에 발견 못 함 — 나머지(런 종료 언마운트, 웨이브 전환 리셋, 3분 주기 안전판)는 전부 이미 올바르게 구현돼 있었음. 두 Explore 에이전트가 세션 한도로 중도 실패해 제가 직접 대체 검증했는데, 시간 관계상 `CapitalRealtimeCombatOrbitView.tsx`/`capitalRealtimeBridge.ts`/`planetCapitalCombatHeavyUi.tsx`(전투 HUD·오버레이 쪽) 세 파일은 이번 패스에서 깊이 못 봄 — 필요시 후속 조사 대상.
- 제가 조사 중 스스로 두 번 오판했다가 재확인 후 정정한 부분을 위에 그대로 남겨뒀습니다(①풀 드레인 누락 오판 ②`runPlanetHubCombatSafeReclaimPass` orphaned 오판) — 검수 시 제 최종 결론(둘 다 정상이었음)만 보시면 됩니다.

---

## 🟡 PENDING(분석+계측만, 코드 로직 변경 없음) — HUB_ACTIVATION GL/Views 급증 근본원인 + GPU 레이어 계측 추가 · 김클로드

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED`** · **verdict PASS** (김팀장 2026-07-10 21:55 KST) |
| **updated** | 2026-07-10 21:15 KST |
| **task_id** | `hub-activation-gl-views-spike-rootcause-20260710` |
| **요청자** | 대표님 — "메모리 관련된 비정상적 오류(김팀장 개발분량)는 완전히 수정되었나?" → "오늘 발생한 문제인가?" → "결론적으로 메모리 관련된 문제는 시기와 발생건수 기타 작업에 최우선으로 수정한다" → "집중 분석하라" |
| **트리거** | `tools/long-run-monitor` 실측: 오늘(2026-07-10) `GL_HARD_CEILING` 강제재시동 2회(19:57:54, 20:44:58) — `outbox/cursor-incident-handoff.md`에 3번째(21:01:05) 추가 발생 확인 |

### 근본원인 (Explore 에이전트 2개 병렬 + 직접 코드 재검증으로 확정)

**vega_base(웨이브 디펜스 테스트베드) 자동전투 트리거가 원인 체인의 시작점** — `app/(game)/planet.tsx:954` `isTestBed: planet?.id === 'vega_base'` → `src/game/waveDefense/useWaveDefenseController.ts:53-73`: 착륙 후 **플레이어 입력 없이 10초 뒤 자동으로** `startRun()` + 9웨이브(`WAVE_DEFENSE_MAX_WAVES=9`, 웨이브당 최대 동시 적 12기) 전투 시작. 이게 `capitalCombatOrbitActive`를 true로 바꾸며 평소 전투 중에만 마운트되는 Skia 캔버스 스택(`PlanetEdenRaidOrbitSkiaCombat`·전투용 `SkiaPlanetNebulaShaderBackdrop`·드론 웨이브 겹치면 `PlanetHubInboundDroneSkiaTrailLayer`까지 최대 3개 동시)이 실제로 마운트되고, 9웨이브가 자동으로 이어지며 모니터 폴링 간격(~15분) 내내 지속 — `mem-timeline.csv`의 `HUB_ACTIVATION gl_mount_ok`(19:57:49, 20:29:23) 패턴과 정확히 일치.

**대표님 확인 완료**: vega_base 자동전투 트리거 자체는 **의도된 QA/테스트 기능으로 유지** — "자동시작은 유지, GL 원인만 우선 수정"으로 스코프 확정. 따라서 이번 작업은 **트리거·전투 로직은 건드리지 않고**, 왜 그 상태에서 GL이 80~130MB나 튀는지 원인만 좁혀서 파는 것으로 한정.

**2건의 강제재시동은 서로 다른 성격**(로그 델타 재검증):
- **#1(19:57:54)**: GL 19.9→120.7MB, views 99→568 — 모니터 자체 룰(허브 활성 중 GL≥80MB면 무조건 강제재시동)에 걸림. 콤뱃 Skia 마운트 비용이 그대로 원인.
- **#2(20:44:58)**: 같은 창에서 GL은 +32.4MB뿐인데 PSS는 +281.2MB — GL/텍스처가 아니라 **native_heap 쪽 누적**(9웨이브 동안 적 함대 spawn/teardown 반복, 혹은 기존 07-08 문서화된 잔여 native_heap 이슈)이 주범으로 추정 — **별개 원인, 이번 계측 범위 밖**.

### 코드로 배제 확인한 것 (80~130MB GL의 원인이 아님)

- 콤뱃/드론트레일 Canvas 크기는 `PLANET_MAIN_ORBIT_SCENE_SIZE = 320`(320×320px) — 픽셀 버퍼 자체는 수백KB급, 80~130MB를 설명 못함.
- 콤뱃에서 `useImage`로 로드하는 이펙트 이미지 2개(`color_dodge_02.png`, `tail_fire_02.png`)는 소형 스프라이트 — 대형 텍스처 아님.
- `_combatPictureRecorder`는 모듈 전역 싱글턴으로 이미 재사용 중(`PlanetEdenRaidOrbitSkiaCombat.tsx:281-285`) — "매 프레임 PictureRecorder 신규 생성" 패턴의 누수 아님.
- `commitSkPictureReactFrame`은 커밋마다 직전 프레임 1장만 dispose 예약 — 무한 누적 큐가 아님(정상 동작).

### 남은 가설 (코드로 확정 못 함 — 런타임 계측 필요, 이번 작업의 이유)

콤뱃 활성 시 최대 3개의 **독립된** `<Canvas>`(콤뱃 궤도·전투용 성운 백드롭·드론 트레일)가 동시 마운트될 수 있음. react-native-skia는 `<Canvas>`마다 별도 GPU 리소스 컨텍스트(Ganesh GrContext)를 잡는 경우가 흔하고, 이 컨텍스트당 고정 오버헤드(셰이더 캐시·리소스 캐시 예산 등)가 픽셀 데이터와 무관하게 수십MB 단위일 수 있음 — 3개 동시 마운트 시 관측된 100~130MB 범위와 맞아떨어짐. **단, 이건 코드 정적분석만으로 확정할 수 없는 가설**이라 실기 계측이 필요.

### 이번에 한 것 — 계측 추가만 (렌더링/디스포즈 로직 변경 없음)

기존에 `SkiaPlanetNebulaShaderBackdrop.tsx`만 `registerGpuLayer`/`unregisterGpuLayer`(`src/game/planetStageGpuSupervisor.ts`)에 등록하고 있었고 콤뱃·드론트레일은 등록 안 하고 있어 `debugPlanetGpuLayerSnapshot()`으로 "지금 몇 개의 Canvas가 동시에 떠 있는지" 확인이 불가능했음. 아래 4개 파일에 **카운트 전용, 부작용 없는** 계측만 추가:

- `PlanetEdenRaidOrbitSkiaCombat.tsx`: mount/unmount에 `registerGpuLayer('skia_combat_orbit','T0')`/`unregisterGpuLayer` 추가.
- `PlanetHubInboundDroneSkiaTrailLayer.tsx`: 동일하게 `'skia_inbound_drone_trail'` 등록.
- `runPlanetHubSoftNativeReclaimPass.ts`·`runPlanetHubPostSkiaPeakReclaimPass.ts`: 기존 `[MEM]` 로그 라인에 `gpuLayers=...` 필드 추가 — `debugPlanetGpuLayerSnapshot()` 결과를 그대로 찍음.

다음에 vega_base에서 자동전투가 다시 발생하면, logcat의 `[MEM] runPlanetHub*ReclaimPass ... gpuLayers=skia_nebula_backdrop,skia_combat_orbit,skia_inbound_drone_trail` 같은 라인으로 **동시 마운트된 Canvas 개수를 실측**할 수 있음 — 이게 3개 동시 마운트로 확인되면 "Canvas 통합(여러 `<Canvas>`를 하나로 합치기)"이 다음 단계의 구체적 수정안이 되고, 1개뿐인데도 GL이 크면 다른 원인(예: Android GL 드라이버 측 별도 요인)을 다시 찾아야 함 — 즉 다음 조치를 코드가 아니라 **데이터로 결정**하기 위한 계측.

### self-check

- [x] `npx tsc --noEmit -p tsconfig.client.json` — **PASS**
- [x] `npm run audit:memory:all` — **전부 PASS**(memory 37/37 · skia-worklet 20/20 · worklet-contract PASS · native-reclaim 20/20 · resident-set 7/7 · hot-path hits=0)
- [x] git commit **안 함**

### 리스크·주의

- 이번 변경은 `registerGpuLayer`/`unregisterGpuLayer`(이미 존재하는 기존 API) 호출 추가와 `console.log` 필드 추가뿐 — 렌더링·디스포즈 타이밍·전투 로직에는 손 안 댐. `__DEV__` 가드 안에서만 로그가 찍히므로 릴리스 빌드 영향 없음.
- **아직 실제 GL 원인 수정은 안 됨** — 이번 건은 원인을 좁히기 위한 계측 1단계. Canvas 통합 등 실제 구조 변경은 계측 데이터 확보 후 별도 작업으로 진행 예정(대표님 재확인 필요할 가능성 높음 — 콤뱃 렌더링 코드라 리스크 있는 변경).
- 재시동 #2(native_heap 급등, GL 평탄)는 이번 계측 범위 밖 — 07-08 문서화된 잔여 이슈와 겹칠 가능성, 별도로 다뤄야 함.
- `outbox/cursor-incident-handoff.md`에 21:01:05 세 번째 `GL_HARD_CEILING`(gl=120.9, pss=1075.4)이 추가로 찍혀 있음 — 김팀장 쪽에서 진행 중인 `skiaPictureFrameRegistry.ts`(우연히도 이번 조사와 같은 파일들을 건드리는 별도 diff, 미커밋) 관련 회귀인지 무관한 재발인지는 미확인 — 검수 시 확인 부탁.

### 확인해야 할 것 (김팀장)

1. 이 계측 diff 자체(`registerGpuLayer` 호출 위치·로그 필드) 검토.
2. 다음 vega_base 자동전투 사이클에서 `gpuLayers=` 로그 실측 → Canvas 동시 마운트 개수 확인.
3. 진행 중이신 `skiaPictureFrameRegistry.ts` 관련 diff와 이번 계측 diff가 충돌 없이 공존하는지 확인(현재 둘 다 워킹트리에 공존, self-check 전부 PASS 확인함).

### 김팀장 검수 (2026-07-10 21:55 KST)

| 항목 | 결과 |
|------|------|
| **근본원인 분석** | **PASS(타당)** — vega_base 자동 웨이브 → combat Skia 3 Canvas 동시 마운트 → GL 80~130MB spike. #2 재시동(native_heap)은 별개 축으로 분리 OK. |
| **계측 `registerGpuLayer`** | **PASS** — combat·drone mount/unmount 쌍 대칭 · nebula와 동일 패턴 · Map만 유지(onRelease 없음=카운트 전용) · **누수 없음** |
| **reclaim 로그 `gpuLayers=`** | **PASS** — soft/postSkiaPeak `__DEV__` 한정 · `debugPlanetGpuLayerSnapshot()` 정본 |
| **SkPicture registry 공존** | **PASS** — `runCombatSkiaPresentationReclaim` → `invalidateAllSkPictureFrames()` 선행 · combat/drone `dropSkPictureReactFrame`+registry 등록 · reclaim과 계측 충돌 없음 |
| **실제 GL 수정** | **미착수(의도)** — 계측 1단계만 · Canvas 통합은 `gpuLayers=` 실측 후 별도 task |
| **tsc · audit:memory:all** | **PASS** (김팀장 재실행 21:55 KST) |
| **검수 중 정리** | drone `flushPicture` 중복 `if` 1건 merge 잔재 → 김팀장 정리 |

**verdict: PASS(조건부)** — 계측·분석 OK · GL 구조 수정은 실측 데이터 후 2단계.

**[kim-claude-review] 2026-07-10 hub-activation-gl-views-spike PASS(조건부) — GPU layer 계측 · vega_base 원인분석 · skiaPicture registry 공존 OK · Canvas 통합 대기**

---

## 🟡 PENDING(3차 재구현 — 재검수 필요) — 은하계 지도 드롭다운 재이동 오작동 + GL/Views 급증 원인 수정 · 김클로드

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED`** · **verdict PASS** (김팀장 2026-07-10 21:55 KST) |
| **updated** | 2026-07-10 21:05 KST |
| **task_id** | `worldmap-dropdown-move-relock-hitarea-fix-20260710` |
| **요청자** | 대표님 — 최초 보고 → "드롭다운으로 해결할 수 없나?" → "겹침 회피 로직으로 다시 구현하라" + "메뉴영역만 하위 클릭 안 되게" → (2차 결과물에 "성계 왼쪽이 아니라 오른쪽이라니까!!") → "겹침 회피 로직은 쓰지 말고, 메뉴 버튼 아래 인터랙션 되는 요소를 비활성 시키는 작업으로" |
| **진행방식** | plan mode(1차) → 대표님 승인 → 구현·김팀장 REVIEWED(PASS, 1차) → 대표님 재검토 요청 → 겹침 회피 4방향 반전(2차) → 대표님이 좌측 반전에 반대 → **오른쪽 고정 + 하부 노드 탭 비활성화(3차, 최종)** |

### ⚠️ 버그 B 수정 방식이 세 번 바뀌었습니다 — 최종은 3차입니다 (김팀장 재검수는 3차 기준으로)

- **1차(김팀장 REVIEWED·PASS 처리됨)**: 메뉴를 지도 레이어에서 완전히 빼서 하단 고정 패널로 이동. 겹침은 구조적으로 불가능해지지만 "노드 옆에 뜨는 드롭다운" UX 포기 — 대표님이 이 트레이드오프에 재검토 요청.
- **2차(폐기)**: 드롭다운(노드 앵커)을 유지하되 right→left→below→above 순으로 안 겹치는 방향을 자동 탐색해 반전. 대표님이 "왼쪽으로 가면 안 된다, 오른쪽 기준"이라고 명확히 반대 — 폐기.
- **3차(최종, 이번 갱신)**: **위치는 항상 성계 노드 오른쪽으로 고정**(반전 없음, 김팀장 원안과 동일). 대신 메뉴가 떠 있는 동안 그 사각형에 걸치는 성계 노드는 지도 쪽 탭 판정(`handleMapTapAt`)에서 아예 제외 — "메뉴 버튼 아래 인터랙션 요소를 비활성화"하는 대표님 지시를 그대로 구현.

### 확정된 두 근본 원인 (코드로 직접 검증)

**버그 A — `doMoveAlongPath` 레이스 컨디션**(`app/(game)/worldmap.tsx`): 이동 애니메이션 종료 시 `setIsMoving(false)`가 `moveToSystem`/`persist()`/`selectSystem(targetSystem.id)` 처리보다 **먼저** 실행되던 구조. 그 사이 창구에 지도가 다시 탭 가능해져, 사용자가 새 목적지를 탭해도 나중에 실행되는 `selectSystem(targetSystem.id)`가 그 선택을 도착지점으로 조용히 되돌림 → `selectedSystem.id === player.currentSystemId`가 다시 참이 되어 "이미 도착" 분기가 실행되고 현재 지점에 착륙 — 정확히 보고된 증상.

**버그 B — 드롭다운 메뉴가 인접 성계 노드의 탭 영역을 가림**(`src/galaxyMap/GalaxyMapSystemActionMenu.tsx`): 메뉴가 지도의 팬 가능한 콘텐츠 좌표 레이어 **안에** 렌더링되어(`toScreen(selectedSystem.position)` 앵커), 도착 즉시 자동으로 다시 뜨는 이 불투명 메뉴(약 124×138px, 여백 없이 3버튼이 전체를 채움)가 현재 위치 바로 옆 인접 노드를 물리적으로 덮어버림. 사용자가 다음 목적지를 탭해도 지도 제스처가 아니라 메뉴의 "이동/착륙" 버튼이 먼저 잡아서 또 현재 지점 착륙 실행. 이 메뉴가 대체한 기존 `ArcButton`은 지도 하단 고정 패널 안에 있어 이런 겹침이 원천적으로 없었음 — 신규 회귀.

**GL·Views 급증**: `handleMove`/`handleCombat` 모두 기존 STAGE2 dispose 경로(`navigateToPlanetHubAfterTeardown`)를 그대로 호출 — dispose 우회·신규 누수는 발견 안 됨(`galaxyMapStageSession.ts` 미변경 확인). 다만 이 세션에서 이미 문서화된 두 미해결 잔여 비용(`galaxy-map-gl-residual-on-hub-reentry-20260708`, `multi-hub-hop-gl-hard-ceiling-restart-20260708`)이 버그 A·B 때문에 "의도한 이동 1회"가 실제로는 잘못된 착륙→재시도의 추가 STAGE 전환을 여러 번 유발해 훨씬 자주 누적되는 것으로 추정 — 새 누수가 아니라 기존 잔여 비용의 증폭. 이건 합리적 추론이며 재측정으로 별도 검증한 건 아님(수정 후 실기 확인 필요).

### 수정 내용 (최종, 3차)

**① `app/(game)/worldmap.tsx` `doMoveAlongPath`** — (1~3차 공통, 변경 없음) 홉 애니메이션 루프부터 마지막 `selectSystem`/`setShowPanel`까지 전체를 `try { ... } finally { if (isMountedRef.current) setIsMoving(false); }`로 감싸, 중단/전투조우/정상완료 세 종료 경로 전부에서 잠금이 정확히 한 번만·비동기 꼬리까지 유지된 뒤 해제되도록 함. 마지막 `selectSystem(targetSystem.id)`에 `useWorldStore.getState().selectedSystemId === null` 방어 가드.

**② 메뉴 배치 — 오른쪽 고정 + 하부 노드 탭 명시적 비활성화 (최종)**
- `GalaxyMapSystemActionMenu.tsx`: 좌표 앵커 절대배치(세로 3행 드롭다운, 김팀장 원안)를 그대로 유지. `side` prop(`'right'|'left'|'below'|'above'`)과 위치 계산 공식(`resolveMenuTopLeft`)·크기 상수(`MENU_WIDTH`·`MENU_ITEM_HEIGHT`·`MENU_ANCHOR_OFFSET_X/Y`)는 export 상태로 남겨둠(범용 유틸이라 삭제 안 함) — 단 `worldmap.tsx`에서는 이제 `side: 'right'` **고정값만** 사용, 반전 로직 전부 제거.
- `worldmap.tsx`: `activeMenuRectRef`(맵 콘텐츠 좌표계 사각형) 신설 — 메뉴가 실제로 화면에 떠 있는 동안(`showPanel && selectedSystem`)만 `resolveMenuTopLeft('right', ...)` 기준 사각형을 채우고, 안 떠 있으면 `null`. `handleMapTapAt`(지도 자체 수동 히트테스트, `touchTargetsRef` 순회)에서 **이 사각형에 걸치는 성계 노드는 후보에서 아예 제외** — 메뉴 버튼이 이미 그 자리 터치를 가로채는 것과 별개로, 지도 쪽 판정 자체도 명시적으로 비활성화해 GestureDetector Tap과 TouchableOpacity가 같은 터치에 동시 반응할 여지를 원천 차단. 대표님이 지시하신 "메뉴 버튼 아래 인터랙션 요소 비활성화" 요구사항을 문자 그대로 구현 — 겹침 회피(위치 반전)는 사용하지 않음.
- 하단 고정 패널(`panelActions`)·`PANEL_H`는 148 유지(1차의 196 확장은 이미 되돌려짐).
- 앞서 2차에서 추가했던 `rectOverlapsCircle`(겹침 판정용)은 더 이상 안 쓰여 삭제.

**건드리지 않음**: `galaxyMapStageSession.ts`·`combatSkiaPresentationReclaim.ts` 등 STAGE dispose 내부 — 원인 아님 확인. `systemActionMenuItems`/`handleMove`/`handlePlanetInfo`/`handleCombat` 로직은 전부 그대로.

### self-check (3차, 최종)

- [x] `npx tsc --noEmit -p tsconfig.client.json` — **PASS**
- [x] `npm run audit:memory:all` — **전부 PASS**(memory 37/37 · **skia-worklet 20/20**(아래 참고) · worklet-contract PASS · native-reclaim 20/20 · resident-set 7/7 · hot-path hits=0)
- [x] git commit **안 함**

### ⚠️ 별개 발견(제 작업과 무관, 사전 존재) — `audit:skia-memory` FAIL 2건

`PlanetEdenRaidOrbitSkiaCombat.tsx`·`SkiaPlanetNebulaShaderBackdrop.tsx` 둘 다 최종 수정시각이 제 작업 시작보다 **2시간 이상 이전**(제가 이번 세션에서 손댄 적 없음, 확인 완료)인데, `audit:skia-memory`가 18/20으로 실패 중임을 이번 self-check 도중 우연히 발견. 원인: 두 파일 모두 `scheduleSkPictureDispose` 식별자가 사라짐(다른 필수 식별자 `pictureFlushRafRef`·`combatSkiaLoopsActiveRef`·`skiaLoopsActiveRef`는 존재) — `skiaMemoryLifecycle.ts`(공용 헬퍼)엔 이 함수가 여전히 있는데 두 소비 파일에서 호출부만 없어진 상태. 진행 중인 별도 작업(김팀장 측?)의 중간 상태로 추정 — 제가 임의로 손대지 않았습니다. 검수 시 확인 부탁드립니다.

### 수동 smoke 체크리스트 (대표님 실기 확인 필요, 3차 기준)

1. 인접 성계로 이동 → 도착 → 1초 이내 다른 성계 탭 → 실제로 그 방향 이동 시작하는지(현재/도착 지점 재착륙 안 하는지) 8~10회 반복
2. "이동중..." 라벨이 도착 직후 정착까지 끊김 없이 유지되는지
3. 메뉴가 항상 성계 노드 **오른쪽**에 뜨는지(왼쪽·위·아래로 안 옮겨지는지)
4. 메뉴가 우연히 다른 성계 노드 위를 덮는 상황을 재현해서, 그 아래 노드를 탭했을 때 **메뉴 버튼이 반응하거나(의도한 동작) 아무 반응도 없어야** 하고, **가려진 노드가 선택되면 안 됨**(activeMenuRectRef 비활성화 확인)
5. 이동→착륙→이동 15~20회 빠르게 반복 — 고착·오작동 없는지
6. (선택) 반복 중 `tools/long-run-monitor` gl_mb·views 급증 빈도가 수정 전 대비 줄었는지 비교

### ⚠️ 아래 김팀장 검수는 1차(패널 이동안) 기준 — 3차(오른쪽 고정+탭 비활성화)로 재검수 필요

버그 A·`scheduleSkPictureDispose` 오탐 관련 판정은 여전히 유효(변경 없음). **"버그 B — 메뉴 hit-area 겹침" 행과 "검수 메모 1"만 3차 최종 구현 기준으로 다시 봐주세요** — 지금은 하단 패널이 아니라 지도 위 오른쪽 고정 드롭다운 + `activeMenuRectRef` 기반 하부 노드 탭 비활성화 방식입니다.

### 김팀장 검수 (2026-07-10 21:55 KST · 3차 최종)

| 항목 | 결과 |
|------|------|
| **버그 A — isMoving 레이스** | **PASS** — `try/finally` + `isMovingRef` 선점(연료 차감 전) · Kim Team Lead 보완 포함 |
| **버그 B — hit-area (3차)** | **PASS** — 노드 **오른쪽 고정** 드롭다운 · `activeMenuRectRef` + 메뉴 rect 내 탭 early-return · 노드 중심 in-rect 제외 |
| **중복 클릭** | **PASS** — [착륙/전투] `hubNavGate` · [이동] `isMovingRef` 동기 잠금 |
| **메모리** | **PASS** — RN View만 · 패널/이동 시 언마운트 · Skia/타이머 추가 없음 |
| **STAGE dispose** | **PASS** — 기존 teardown 경로 유지 |
| **tsc · audit:memory:all** | **PASS** (21:55 KST 재실행) |
| **실기 smoke** | handoff §6항 — 대표님 확인 권장 |

**verdict: PASS**

**[kim-claude-review] 2026-07-10 worldmap-dropdown-3rd PASS — 오른쪽 고정+activeMenuRectRef · isMovingRef 연타방지 · tsc+audit PASS · smoke 대기**

### 김팀장 검수 (2026-07-10 20:31 KST, 1차 기준 — 위 참고)

| 항목 | 결과 |
|------|------|
| **버그 A — isMoving 레이스** | **PASS** — `doMoveAlongPath` 전체를 `try/finally`로 감싸 `persist`·`selectSystem`·미션 처리까지 잠금 유지. 조기 `setIsMoving(false)` 제거 확인. `selectedSystemId === null`일 때만 `selectSystem(target)` 이중 방어 OK. |
| **버그 B — 메뉴 hit-area 겹침** | **PASS** — 지도 팬 레이어 내 `selectedSystemMenuAnchor`/좌표 앵커 드롭다운 **완전 제거**. `GalaxyMapSystemActionMenu` → 하단 고정 `panelActions` flex 가로 3버튼(`PANEL_H` 196). 인접 노드 탭 물리적 차단 구조적으로 해소. |
| **핸들러·분기** | **PASS** — `handleMove`/`handlePlanetInfo`/`handleCombat` · 레드 영토 `resolvePlayerPlanetStayBlock` · `isRedOccupiedPlanet` 전투 게이트 · `hubNavGate`/`isMoving` 차단 유지. |
| **STAGE dispose** | **PASS** — `galaxyMapStageSession.ts` 미변경 · 기존 `navigateToPlanetHubAfterTeardown`/`navigateToCombatAfterTeardown` 경로 그대로. |
| **tsc** | **PASS** |
| **audit:memory** | **PASS** (37/37) |
| **audit:worklet-contract** | **PASS** |
| **audit:native-reclaim** | **PASS** (20/20) |
| **audit:resident-set** | **PASS** (7/7) |
| **audit:hot-path** | **PASS** (hits=0) |
| **audit:skia-memory** | **PASS** (20/20) — 런타임 dispose는 `dropSkPictureReactFrame`/`commitSkPictureReactFrame`(내부 `scheduleSkPictureDispose`)로 **이미 구현됨**. Kim Claude self-check 시점 audit가 직접 문자열만 검사해 18/20 **오탐** → `run-skia-worklet-memory-audit.cjs` `usesSkPictureDispose()` 래퍼 인정 규칙 반영 후 **20/20 PASS** (2026-07-10 20:39 KST 재실행). |
| **커밋** | 미실행 (대표님 지시 시) |
| **실기 smoke** | handoff §5항 — 대표님 1회 확인 권장(재이동 오작동·15~20회 왕복) |

**검수 메모**:
1. **UI 형태 변경** — 성계 옆 세로 드롭다운 → 하단 패널 가로 3버튼. 겹침 방지 trade-off로 타당; 대표님 선호(노드 높이 정렬)와 다르면 smoke 후 재조정 가능.
2. **GL/Views** — 코드상 신규 누수 없음. 오작동→잘못된 착륙 반복이 줄면 기존 잔여 floor 비용 **증폭**만 완화될 가능성(실측 대기).
3. **Skia audit** — 런타임 버그 아님 · audit 규칙 갱신으로 **20/20 PASS** 확인.

**verdict: PASS** — 코드·정적 게이트 전부 OK · smoke 5항만 대기.

**[kim-claude-review] 2026-07-10 worldmap-dropdown-move-relock-hitarea-fix PASS — try/finally isMoving · 패널 메뉴 재배치 · tsc+audit:memory:all(20/20 skia) PASS · smoke 대기**

---

## 🟡 PENDING — 플레이어 독립국가(녹색 국경) M1+M2 구현 완료 · 김클로드

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED`** · **verdict PASS** (김팀장 2026-07-09 21:50 KST) |
| **updated** | 2026-07-09 12:42 KST |
| **task_id** | `player-independent-nation-m1-m2-20260707` |
| **명세** | `docs/PLAYER_INDEPENDENT_NATION_IMPLEMENTATION_SPEC.md` · `tools/kim-team-lead/reports/kim-claude-ready-player-independent-nation.md` |

### 추가 보완 — 독립국 표기 형식 (대표님 요청, 명세 이후 추가)

패널 라인이 처음엔 `독립국 · {클랜명}`(예: "독립국 · 엄스 함대")이었는데, 대표님이 `{닉네임} 독립국`(예: "엄스 독립국") 형식을 요청 → 반영 완료.
- `formatClanPlateDisplayName.ts`에 `stripSoloClanFleetSuffix` 신설 — 솔로 클랜명("{닉네임} 함대")에서 "함대" 접미어만 제거해 순수 닉네임 추출.
- `resolvePlanetHubOwnershipPlate`(`planetOwnershipModel.ts`) — `isIndependent`일 때만 `clanName`에 이 strip을 적용(다른 kind는 기존 클랜명 그대로 유지).
- i18n `worldmap.panel.independent`: `'독립국 · {name}'` → `'{name} 독립국'`(ko), `'Independent Nation · {name}'` → `'{name} Independent Nation'`(en).
- self-check: `tsc` PASS · `audit:memory:all` PASS(재실행 완료).

**추가 반영(지도 라벨까지 확장)**: 위 "범위 한정"에서 지적했던 지도 위 성계 라벨 문제 — 대표님이 "싱글플레이 게임이라 유저들의 국가가 공유되지 않는다"고 확인해주셔서, 여러 플레이어의 독립국이 한 지도에 동시에 뜨는 시나리오 자체가 없다는 게 확정됨(세이브당 독립국 소유자는 항상 본인 1명뿐). 그래서 라벨 파이프라인 구조 변경 없이 **`territoryNationLabels.independent`를 정적 문자열 대신 `player.nickname`으로 채워** 지도 라벨도 "{닉네임} 독립국"으로 통일(`worldmap.tsx`, `worldmap.territory.nation.independent` i18n 키를 `{name}` 파라미터 받도록 수정). self-check 재실행 PASS.
| **요청자** | 대표님 지시 — 명세 정본 그대로 M1+M2 구현 |

### 구현 요약

소유권 증서 구매 시 행성이 블루/레드 국가 occupier로 강제되던 것을 **플레이어(솔로 클랜) 자신이 occupier**가 되도록 변경 — 녹색 국경·채움의 **독립국(`independent`)** side 신설. M1(코어: side·kind·구매·reconcile 보호) + M2(지도 Voronoi 국경·채움·라벨·허브 플레이트) 전부 구현.

### M1 — 코어

- **M1-A** `src/galaxyMap/mapFactionSideCore.ts`: `MapFactionSide`에 `'independent'` 추가. `resolveMapFactionSideFromClanIdPure`에 "플레이어 유래 clanId → independent" 판정을 **megaFactionId 체크보다 먼저** 삽입(솔로 클랜이 출신국 megaFactionId를 유지해도 블루로 오판정되지 않도록). `isPlayerOriginatedClanId`를 그대로 import하면 `planetOwnershipModel.ts`와 순환참조가 생겨(그쪽이 이 파일을 import) **인라인 재구현**(`isPlayerOriginatedClanIdInline`)으로 회피. `resolveMapFactionBorderColor`에 `#3FBF6B` 녹색 추가.
- **M1-B** `tables/balance/clan_map_faction_color_policy.csv`: **신규 행만 추가**(`clan_prefix,solo_clan_,#3FBF6B,95,...`) — priority 95로 mega_faction(70) 행보다 우선시켜, 솔로 클랜의 **채움색**(`resolveClanMapDisplayColor`, 국경색과 별도 시스템)도 megaFactionId와 무관하게 녹색이 되도록 함. 이거 없으면 국경선은 녹색인데 영역 채움은 블루로 보이는 불일치 발생 — 실제 테스트해보지 않았다면 놓치기 쉬운 지점이라 특히 확인 권장.
- **M1-C** `src/types/index.ts`: `PlanetHoldKind`에 `'player_independent'` 추가.
- **M1-D** `src/store/clanWarFoundationStore.ts` `claimPlanetOwnershipByPurchase`: `occupierClanId: nationOccupierId` → `occupierClanId: clanId`, `kind` → 무조건 `'player_independent'`. `deedOwnerClanId: clanId`는 기존값 유지(역마이그레이션 함정 회피 조건 그대로 충족).
- **M1-E** `src/arcCore/balance/seedPlanetOccupationFromBalance.ts`: `shouldSkipOccupationSeedReconcile`에 `kind === 'player_independent'` 보호 추가(1차 방어) + `shouldRestoreNationSeedOccupier`에도 동일 보호 추가(2차 방어, 이중 안전장치) — 명세에서 지목한 두 지점 모두 반영.
- **M1-F** `resolveTerritorialSideForHold`는 M1-A 반영만으로 자동 동작 확인(occupier 경유) — 코드 수정 불요.

### M2 — 지도·UI

- **M2-A/B** `buildGalaxyBlueRedVoronoiBorders.ts`: `VoronoiSiteSide`·`GalaxyVoronoiBorderSegment.kind`에 `'independent'` 추가. 국경 분기 — **independent가 걸리면 상대(블루/레드/중립) 무관 항상 녹색 우선**(명세 1차 구현 지침 그대로: "independent가 포함된 모든 국경 = 녹색"). `chainAndChamferGalaxyBorders.ts`의 타입 플러밍도 동반 수정.
- **M2-C** `buildGalaxyTerritoryVoronoi.ts`: 채움(fill)은 기존 `factionSide !== 'neutral'` 조건이 이미 범용이라 자동 커버됨. **라벨**(`buildOccupationLabels`)은 기존에 blue/red만 집계하던 `cellMetrics`가 independent를 누락하고 있어서(라벨이 전혀 안 뜸) 별도 반영 필요했음 — `cellMetrics` 타입·집계 조건·라벨 push 3곳 모두 수정. `resolveBorderStyle`(이 파일 자체의 별도 국경 스타일 함수, M2-B의 것과 다른 함수)도 **sideA/sideB 순서에 따라 색이 뒤바뀌는 버그**가 있어(예: red+independent 순서면 red색 반환) independent 우선 분기를 맨 앞에 추가해 순서 무관하게 고정.
- **M2-D** 허브 플레이트: `PlanetHubOwnershipPlate`에 `isIndependent` 필드 추가(`resolvePlanetHubOwnershipPlate`). `worldmap.tsx`의 패널 라인에 `독립국 · {name}` 분기 추가, 지도 위 성계 라벨(`territoryNationLabels`)에도 independent 항목 추가. i18n(ko/en) `worldmap.panel.independent` · `worldmap.territory.nation.independent` 신규 키. `megaFactionNationPolicy.ts`의 `resolveNationDisplayNameForMapSide`도 independent 대응 확장(향후 재사용 대비).
- **M2-E(선택, 구현함)** 기존에 이미 구매됐던 hold(occupier=국가 시드, deedOwner=플레이어 — 현재까지의 "블루 소유" 표현 방식)를 독립국으로 **1회성·idempotent 전환**하는 패스(`migrateExistingPlayerDeedHoldsToIndependentAll`) 신설, `planetOccupationSeedPipeline.ts`(부팅·AI 동기화 후처리 공용 파이프라인)에 편입 — 대표님이 이미 구매해둔 행성이 있어도 다음 부팅 시 자동으로 녹색 전환됨.

### 명세에 없었지만 빌드 중 발견해 수정한 것 (1건)

`src/clanWar/planetTerritoryPlayerAccess.ts`(RED 점령지 체류·개발 차단 — "플레이어 영토 접근" 게이트)의 `resolveTerritorialSideForPlanet` 반환 타입이 `'blue'|'red'|'neutral'`로 좁게 하드코딩되어 있어 `tsc`에서 컴파일 에러 발생 — `MapFactionSide`로 타입만 넓힘(로직 변경 없음, `=== 'red'` 체크라 independent는 자동으로 차단 안 됨 — 정상).

### self-check

- [x] `npm run build:balance-tables` — **PASS**(101 tables 생성, CSV 신규 행 반영 확인)
- [x] `npx tsc --noEmit -p tsconfig.client.json` — **PASS**(위 1건 수정 후)
- [x] `npm run audit:memory:all` — **PASS**(memory 37/37 · skia-worklet 20/20 · worklet-contract PASS · native-reclaim 20/20 · resident-set 7/7 · hot-path hits=0)
- [x] git commit **안 함**

### diff 범위 (17개 파일 + build 산출물)

```
src/types/index.ts
src/galaxyMap/mapFactionSideCore.ts
src/galaxyMap/buildGalaxyBlueRedVoronoiBorders.ts
src/galaxyMap/buildGalaxyTerritoryVoronoi.ts
src/galaxyMap/chainAndChamferGalaxyBorders.ts
src/galaxyMap/GalaxyMapTerritoryOccupationLabelsSvg.tsx
src/clanWar/planetOwnershipModel.ts
src/clanWar/planetOccupationSeedPipeline.ts
src/clanWar/planetTerritoryPlayerAccess.ts   (명세外, tsc 에러로 발견해 수정)
src/store/clanWarFoundationStore.ts
src/arcCore/balance/seedPlanetOccupationFromBalance.ts
src/world/megaFactionNationPolicy.ts
src/i18n/locales/ko.ts
src/i18n/locales/en.ts
app/(game)/worldmap.tsx
tables/balance/clan_map_faction_color_policy.csv
src/data/balance/generated/**                 (build:balance-tables 산출물 — 직접 수정 안 함)
```

**참고**: `build:balance-tables` 실행 중 이번 작업과 무관한 신규 CSV 5개(`csvArcCoreContestedZoneAftermathPolicy` 등)의 generated 산출물도 함께 생성됨(untracked였던 CSV들이 이번에 처음 빌드됨) — 제가 만든 CSV 아님, 기존 저장소에 있던 미빌드 상태였던 것으로 보임. 김팀장 diff 검수 시 이 부분은 이번 작업과 분리해서 봐주시면 됩니다.

### 미착수·건드리지 않음 (명세 준수)

- **M3(외교·전투)**: `faction_diplomacy_policy.csv`·`resolveTerritorialDiplomacyRelation`·ArcCore 접전 연동 — 전혀 착수 안 함(명세 지시대로 2차 task).
- `planetOwnershipDeedPricing`/v5 가격 곡선, Skia 전투·STAGE dispose, `planet_occupation_seeds.csv` 기존 행 — 전부 미변경.
- `src/arcCore/rebellion/applyRebellionOverthrowHold.ts`(반란 전복 — 모든 점유 kind를 중립화하는 별도 메커닉)는 `player_home`도 동일하게 무방비로 전복 대상이라, `player_independent`도 같은 취급을 받도록 **의도적으로 손대지 않음**(기존 설계와의 일관성 — 대칭 취급이 오히려 맞다고 판단, 다른 의견 있으면 알려주세요).

### 수동 smoke 체크리스트 (명세 §6, 대표님 확인 필요 — 코드 검증만으론 확정 불가)

1. 블루 영토 행성 무역소에서 소유권 구매 → worldmap 해당 성계 **녹색 채움·녹색 국경**
2. 허브 진입 시 클랜 플레이트 **독립국** 표기 확인
3. 앱 재시작·12:00 KST 배치 후에도 **블루로 복구되지 않음** 확인(M1-E 검증)
4. 이미 구매해둔 기존 행성이 있다면, 재시작 후 자동으로 녹색 전환되는지 확인(M2-E 검증)

### 김팀장 검수 (2026-07-09 21:50 KST)

| 항목 | 결과 |
|------|------|
| M1 코어 | **PASS** — `independent` side · `#3FBF6B` · `player_independent` kind · 구매 occupier=clanId · reconcile 이중 보호 |
| M1-B CSV | **PASS** — `solo_clan_` 신규 행만 추가(priority 95) · blue/red 기존 행 미변경 |
| M2 지도·UI | **PASS** — Voronoi 국경 independent 우선 녹색 · 채움·라벨 · `{name} 독립국` i18n · M2-E 부팅 마이그레이션 |
| 역마이그레이션 | **PASS** — occupier·deedOwner 둘 다 player clanId · `migratePlanetHoldOwnershipSplit` 분기 회피 |
| M3·금지 범위 | **PASS** — 외교 CSV·Skia·`planet_occupation_seeds` 기존 행 미착수 |
| tsc | **PASS** |
| audit:memory:all | **PASS** (37/37 · skia 20/20 · worklet · native-reclaim 20/20 · resident-set 7/7 · hot-path 0) |
| **커밋** | 미실행 (대표님 지시 시) |
| mem-post-dev-recheck | **배정** — 김경제 handoff 갱신 권장 |

**verdict: PASS**

**검수 메모**:
1. **채움색 일치** — `clan_prefix,solo_clan_,#3FBF6B,95`로 megaFactionId(블루)와 무관하게 영역 채움 녹색 — 국경만 녹색인 불일치 방지 OK.
2. **파이프라인 순서** — `seed` → `ownershipSplit` → `migrateExistingPlayerDeedHoldsToIndependentAll` — 기존 구매 hold(occupier=국가·deed=플레이어) 전환 경로 정합.
3. **총사령관 side** — `mapOccupierToGovernorSide`가 independent→`NEUTRAL` 반환(의도 미명시). M1/M2 범위外 · M3 또는 별도 과제로 검토 가능.
4. **실기 smoke** — handoff §6 4항(구매→녹색·플레이트·배치 후 유지·기존 hold 전환) 대표님 1회 확인 권장.

**[kim-claude-review] 2026-07-09 player-independent-nation-m1-m2 PASS — M1+M2+표기 · tsc+audit PASS · smoke 4항 대기**

---

## ✅ REVIEWED — 저장구조 심층 재검수 + 쓰레기 코드 정리 · 김클로드

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED`** · **verdict PASS** (김팀장 2026-07-08 22:43 KST) |
| **updated** | 2026-07-08 22:43 KST |
| **task_id** | `save-structure-deep-audit-cleanup-20260708` |
| **요청자** | 대표님 — "플레이어 계정 정보와 파이어스토어 DB, 로컬스마트폰의 저장데이터등을 심층분석해서 설계와 구조에 리스크가 없는지, 또한 쓰레기 파일이나 코드 DB들이 남아있는지 재확인 검수하라" |

### 조사 방법

Explore 에이전트 3개를 병렬로 돌려 확인: ① AsyncStorage 54개 키 전수(플레이어 백업 목록 20개 vs 나머지 34개) 커버리지 대조, ② 마이그레이션·레거시 잔재 실사용 여부, ③ Firestore 백업 정리(prune) 로직의 orphan 데이터 리스크. 각 에이전트 보고 중 핵심 주장(죽은 코드 grep 결과, 총사령관 스토어 헤더 주석 등)은 제가 직접 재검증 완료.

### 1) Firestore 백업 주기 — 6시간으로 재통일 (되돌림)

지난 조치로 30분 주기로 줄였었는데, 대표님 최종 지침("파이어스토어 주기를 6시간으로 통일하라")에 따라 원복. 계기: Explore 조사에서 30분 주기가 `GAME_SAVE_BACKUP_MAX_PER_UID=28`과 어긋나 **실질 보관기간이 7일→약 14시간으로 줄고, 쓰기/읽기량이 약 12배 늘어나는** 비용 문제를 확인했음 — 대표님이 강조하신 "효율적 통일" 원칙과 정면으로 배치되는 부작용이었음. `gameSaveBackupContract.ts` 1줄만 원복.

### 2) AsyncStorage 54개 키 커버리지 — 갭 없음, 모순 1건 해소

플레이어 백업 대상 20개 키 전부 실사용 확인(죽은 참조 없음), 누락된 플레이어 데이터도 없음. 유일한 모순 — **`arcfire_planet_governor_assignments_v1`**(행성 총사령관 배정)이 파일 헤더 주석("ArcCore 영토 상태, 계정 purge 제외")과 달리 백업/복원 대상 목록에 포함되어 있었음. 대표님 확인: **"현재는 아크코어가 자동 배정, 플레이어는 배정 불가 — 향후 소유권 기능확장으로 플레이어가 총사령관(행성소유자)이 될 수 있음"** → 현재 시점 기준 ArcCore 자율 상태가 맞으므로 `gameSaveBackupKeys.ts`의 `PLAYER_GAME_SAVE_BACKUP_KEYS`에서 **제거**(purge 제외와 일치시킴). **주의**: 향후 소유권 기능 구현 시 이 판단을 재검토해야 함 — 플레이어가 총사령관이 되는 시점부터는 해당 행성 배정은 다시 플레이어 귀속으로 바뀌어야 할 수 있음.

### 3) 마이그레이션/레거시 잔재 — 확정 죽은 코드 2건 삭제

대표님 정의("중복구현이거나 완전히 사용될 가능성조차 없는 코드")에 맞춰 즉시 삭제 처리(grep으로 호출부 0건 직접 재검증 완료):
- `useArcCoreTempBankStore`(`src/store/factionVault/arcCoreVaultStore.ts`) — deprecated alias, 사용처 0
- `consumeFreshStartFlag()`(`src/firebase/auth.ts`) — deprecated 함수, 실호출 0(참조하던 주석 1곳도 `consumeFreshStartForTitle()`로 정정)

**삭제 보류(미구현과 구분)** — 아래는 "아직 사용될 가능성이 있는" 코드라 대표님 기준상 쓰레기가 아님, 그대로 유지:
- `LEGACY_MODULE_PAIRS`(dev_laboratory→dev_research_lab 등)·`reconcileDefenseSatelliteDevRecordOnLanding`·`migrateLegacyArcCoreTempBankOnce`·`reseedCorruptConvoyFleetEconomyOnce` — 전부 "매 부팅 실행되지만 조건 안 맞으면 스스로 스킵"하는 자체-스로틀 방식. 아직 마이그레이션 안 된 구세이브가 이론상 존재할 수 있어(2~3주 전 코드) 완전히 쓰일 가능성이 없다고 단정 불가.
- `isLegacyArcCoreMissileNotice`(tavernBoardStore) — 오래된 공지 필터링, 자연 소멸(20개 캡) 예정이라 마찬가지로 보류.

### 4) Firestore 백업 prune — orphan 리스크 1건 확인(수정 안 함, 보고만)

정상 만료/초과삭제 경로는 청크 서브컬렉션도 같이 지워지도록 이미 정상 구현됨(문제없음). 다만 **"청크 쓰기 성공 직후, 메타데이터 문서 쓰기 전에 앱이 죽는" 좁은 케이스**에서 생기는 고아 청크는 이를 나중에 찾아 지우는 스윕 로직이 전무해 영구 방치됨(발생 확률 낮음, 발생 시 복구 불가). 이번 범위에서는 수정하지 않음 — 필요시 별도 orphan-sweep 작업으로 다룰 것을 제안.

### self-check

- [x] `npx tsc --noEmit -p tsconfig.client.json` — **PASS** (매 변경 후 재확인)
- [x] `npm run audit:memory:all` — **PASS**(죽은 코드 삭제분까지 전부 포함해 재실행 완료 — memory 37/37 · skia-worklet 20/20 · worklet-contract PASS · native-reclaim 20/20 · resident-set 7/7 · hot-path hits=0)
- [x] diff 범위: `gameSaveBackupContract.ts`(1줄), `gameSaveBackupKeys.ts`(1줄 제거), `arcCoreVaultStore.ts`(3줄 제거), `firebase/auth.ts`(deprecated 함수+주석 정리)
- [x] git commit **안 함**

---

## ✅ REVIEWED — planetCoreRuntime 파싱 실패 시 조용한 전체 리셋 수정(근본 버그) · 김클로드

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED`** · **verdict PASS** (김팀장 2026-07-08 22:17 KST) |
| **updated** | 2026-07-08 22:17 KST |
| **task_id** | `planet-core-runtime-corrupt-parse-cloud-recover-20260708` |
| **요청자** | 대표님 — "재설치하기 전에 근본 버그(파싱 실패 시 조용히 전체 리셋되는 부분) 이 부분을 집중적으로 수정하라" |

### 배경 — 왜 위성이 "전부" 사라졌는지의 최종 원인

지난 대화에서 확인: 방위위성뿐 아니라 757개 행성 전체의 `detail.development`가 로컬에 통째로 없었던 이유는 개별 유실이 아니라 **`planetCoreRuntimeStore`의 로컬 파싱 로직이 JSON.parse 실패 시 경고 하나 없이 전체를 CSV 기본값으로 되돌리는 구조**였기 때문. 이 앱이 메모리압으로 하루 여러 번 강제종료(`am force-stop`)되는 것을 이번 세션 내내 확인했으므로, 저장 파일 쓰기 도중 강제종료 → 파일 손상 → 다음 부팅 파싱 실패 → 전체 리셋, 이 흐름이 가장 유력.

### 구현 내용 — `src/store/planetCoreRuntimeStore.ts` (단일 파일, +68/-2줄)

1. **`parseStoragePayload`가 `corrupted: boolean` 플래그를 추가로 반환** — `raw === null`(최초무데이터, 정상)과 `raw`는 있는데 `JSON.parse` 자체가 실패(손상)를 구분. 기존엔 두 경우 모두 조용히 같은 빈 기본값을 반환해 구분이 불가능했음.
2. **손상 감지 시 손상된 원본을 별도 키(`arcfire_planet_core_runtime_corrupt_stash_v1`)에 보관**(`stashCorruptedPlanetCoreRuntimePayload`) — 포렌식·수동복구 여지를 남김. 실패해도 부팅에 영향 없는 best-effort.
3. **손상 감지 시에만(=드문 경우에만) 최신 Firestore 백업에서 이 키(`arcfire_planet_core_runtime_v1`) 단건만 복구 시도**(`tryRecoverPlanetCoreRuntimeFromCloudBackup`) — 계정 전체 스냅샷 복원이 아니라 **이 한 스토어만** 선별 복구. `resolveGameSaveBackupUid`(클라이언트 자기 uid, admin 자격증명 불필요) → `listGameSaveBackupsForUid(uid, 1)`(최신 1건만) → `fetchGameSaveBackupDoc` → 그 안의 `snapshot['arcfire_planet_core_runtime_v1']`만 재파싱해서 사용.
4. 복구 성공 시 즉시 로컬에도 다시 저장(`persistStoragePayload`)해서 다음 부팅부터는 클라우드 조회 없이 정상 동작 — 자가치유.
5. 복구 실패(오프라인·백업 없음·타임아웃 등) 시 기존 동작(빈 기본값)으로 그대로 진행 — **부팅을 막거나 지연시키지 않음**.

### 왜 이전에 보류했던 "③ 부팅 시 Firestore 대조"와 다른가

③은 **매 부팅마다** 클라우드와 대조하는 설계라 리스크가 커서 보류했었음. 이번 것은 **로컬 파싱이 실제로 실패했을 때만**(정상 부팅에서는 100% 발동 안 함) 발동하는 훨씬 좁은 범위라, 정상 케이스에는 코드 경로 자체가 실행되지 않아 리스크가 낮음. 대표님이 요청하신 "이 부분을 집중적으로"에 정확히 맞춘 좁은 수정.

### 순환참조 회피

`planetCoreRuntimeStore.ts` → `gameSaveBackupService.ts` → `applyLocalGameSaveSnapshot.ts` → `planetCoreRuntimeStore.ts`로 되돌아오는 순환참조가 있어, 정적 import 대신 **동적 `await import()`** 사용(이 파일에 이미 있던 `runLegacyPlanetDevModuleMigrationAll`의 기존 패턴과 동일한 방식으로 회피).

### self-check

- [x] `npx tsc --noEmit -p tsconfig.client.json` — **PASS**
- [x] `npm run audit:memory:all` — **PASS** (memory 37/37 · skia-worklet 20/20 · worklet-contract PASS · native-reclaim 20/20 · resident-set 7/7 · hot-path hits=0)
- [x] diff 범위: `git diff HEAD --stat` 확인 결과 `src/store/planetCoreRuntimeStore.ts` **1개 파일**만(+68/-2)
- [x] git commit **안 함**

### 리스크·주의 (김팀장 검수 시 반드시 확인)

- **부팅 경로(`bootstrapFromWorldAsync`) 변경 포함** — 이 프로젝트에서 반복적으로 "민감 구간"으로 지적된 영역이라, 대표님께도 "부팅 시퀀스는 별도 신중 검토 필요"라고 안내했던 부분. 다만 정상(비손상) 케이스는 분기 자체를 안 타므로 기존 동작과 100% 동일 — **정상 부팅 성능/동작 변화 없음**은 코드상 확인됨.
- 실기 시뮬레이션(의도적으로 로컬 JSON을 손상시켜 실제 복구 동작 확인)은 **미실시** — 정적 검증만 완료. 실제 손상 재현 테스트는 QA 환경에서 한 번 검증 권장.
- `listGameSaveBackupsForUid`/`fetchGameSaveBackupDoc`는 각각 6초/12초 자체 타임아웃 내장(기존 서비스 코드) — 손상 감지 시 최악의 경우 부팅이 최대 ~18초 지연될 수 있음(드문 케이스에 한함, 정상 부팅엔 영향 없음).
- 대표님이 이전에 "재설치해서 테스트"하겠다고 하신 방위위성 재설치는 **이 수정이 검수·배포된 이후에** 진행하시는 걸 권장(안 그러면 같은 이유로 또 사라질 위험이 있었던 부분을 이번에 막은 것이므로).

### 김팀장 검수 (2026-07-08 22:17 KST)

| 항목 | 결과 |
|------|------|
| 근본 원인 | **PASS** — `parseStoragePayload` catch 시 `corrupted` 미구분·빈 baseline → `mergeWorldWithDisk` 전체 CSV 리셋. force-stop 중 coalesce persist와 정합 |
| 수정 범위 | **PASS** — `planetCoreRuntimeStore.ts` 단일 파일(+68/-2). 정상 부팅(`corrupted:false`)은 기존 경로 100% 동일 |
| 손상 분기 | **PASS** — stash → cloud 단건 복구 → `mergeWorldWithDisk` → 성공 시 `persistStoragePayload` 자가치유 |
| 순환참조 | **PASS** — `gameSaveBackupService` 동적 import, 기존 migration 패턴과 동일 |
| 부트 지연 | **PASS(조건부)** — 손상 시에만 Firestore 6s+12s 타임아웃 가능. 정상 부팅 무영향 |
| tsc | **PASS** |
| audit:memory:all | **PASS** (37/37 · skia 20/20 · worklet · native-reclaim 20/20 · resident-set 7/7 · hot-path 0) |

**잔여 리스크(완료 선언 아님 · 후속):**
- JSON.parse는 성공했지만 `byPlanetId`가 비어 있는 **부분 손상**은 `corrupted:false` → 복구 분기 미진입(기존과 동일한 silent reset). 후속: `raw` 존재 + `byPlanetId` 비어 있음 + 이전 stash/백업 대조 검토.
- **이미 리셋된 데이터**는 본 패치로 소급 복구 불가(대표님 「예」 확인). 앞으로만 방어.
- 손상 재현 QA(의도적 truncate → cloud recover) **미실시** — 배포 전 1회 권장.

**verdict: PASS** — 근본 버그(조용한 전체 리셋) 대응으로 승인. ② 백업 30분과 함께 Metro `r` 후 방위위성 재설치 권장.

---

## ✅ REVIEWED — 게임 저장 Firestore 백업 강화(② 단일 주기) · 김클로드 · ③ 설계안 보류

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED`** · **verdict PASS(②)** / **③ HOLD** (김팀장 2026-07-08 22:17 KST) |
| **updated** | 2026-07-08 22:17 KST |
| **task_id** | `game-save-backup-hardening-20260708` |
| **요청자** | 대표님 — 방위위성 전체 소실 사후 "플레이어의 모든 게임 저장기록이 파이어스토어에 저장되어 안전하게 유지되는게 맞다..." → 이후 "데이터를 자주 백업하지 않아도 모든 데이터가 같은 주기에 같은 시점에 100% 완전 복구가 되면 된다... 더 중요한 데이터와 덜 중요한 데이터 구분없이 파이어베이스를 절약하는 차원에서 효율적으로 통일하라"(최종 지침으로 ① 되돌림) |

**⚠️ 설계 변경 이력 — ①(시설완료 즉시 백업)은 구현 후 대표님 지침으로 되돌림.** 최초 ①+②로 구현했으나, 대표님이 "중요도 구분 없이 통일 + Firestore 비용 절약"을 최종 지침으로 주셔서 ①(방위위성 등 완료 이벤트만 즉시 백업하는 특수경로)을 제거하고 **② 단일 주기(30분)만 전 데이터에 동일 적용**하는 구조로 최종 확정. 아래 "구현 완료" 섹션은 이 최종 상태 기준.

### 배경 — 실기 조사로 확인된 근본 갭 (방위위성 소실 건과 직결)

adb로 기기 AsyncStorage(`RKStorage`)를 직접 pull해 확인한 결과, 757개 행성 전체에서 `detail.development`(byModuleId)가 **완전히 부재** — 로컬에도 소실 흔적조차 없었음. 코드 추적 결과 다음 구조적 갭 확인:

1. `GAME_SAVE_BACKUP_MIN_INTERVAL_MS`가 **6시간**이었음 — 이 세션 내내 확인된 하루 여러 번의 강제 재시동(GL_HARD_CEILING 등) 빈도를 감안하면, 로컬 설치 후 6시간 내 재시동되면 Firestore에 한 번도 반영 안 된 채 유실 가능.
2. Firestore 백업은 `scheduled`(6h 간격) 외에는 **admin이 명시적으로 트리거하는 복구 경로**로만 읽힘 — 정상 부팅에서는 Firestore를 전혀 조회하지 않아, 클라우드에 최신 데이터가 있어도 로컬이 비었으면 그냥 빈 채로 시작됨.
3. 업로드 실패는 `catch(() => {/* offline — Firestore queue */})`로 조용히 삼켜짐 — 실패가 반복돼도 드러나지 않음.

대표님께 3개 조치(①즉시 백업 트리거 ②주기 단축 ③부팅 시 Firestore 대조)를 제안드렸고, ③은 부팅 시퀀스(이 프로젝트에서 반복적으로 "민감 구간"으로 확인된 영역)를 건드리는 리스크가 있어 **①+②만 우선 구현**, ③은 설계안만 정리하기로 확정.

### 구현 완료 (② 단일 주기 — 최종)

**② 예약 백업 간격 단축** — `gameSaveBackupContract.ts`
- `GAME_SAVE_BACKUP_MIN_INTERVAL_MS`: 6시간 → **30분**
- 이 하나의 주기가 `PLAYER_GAME_SAVE_BACKUP_KEYS`(인벤토리·미션·계정정보·행성개발·방위위성 등 20개 키) **전체를 한 스냅샷으로 묶어서** 업로드(`collectLocalGameSaveSnapshot`) — 항목별 중요도 구분 없이 동일 주기·동일 시점에 전량 백업되므로, 복구 시 그 시점 기준 100% 일관된 전체 복구가 됨.

**되돌린 것 (① 폐기)** — 방위위성 등 "완료" 이벤트에만 별도 즉시-백업 경로를 추가했던 `triggerFacilityCompleteGameSaveBackup`/`scheduleUrgentGameSaveBackupAfterFacilityComplete`/`GameSaveBackupReason.facility_complete`를 전부 제거. 대표님 지침("중요도 구분 없이 통일해서 Firestore 절약")에 따라 이벤트별 특수 트리거 없이 **하나의 예약 주기로만** 처리.

CLAUDE.md 절대금지(`onSnapshot`/실시간 동기화 없음, 경제/AABS 고빈도 실행 금지)에 저촉되지 않음 — 여전히 단발·예약 Firestore write일 뿐, push 기반 realtime이나 게임 루프 고빈도 처리가 아님.

**잔여 리스크(대표님께 명시적으로 공유 완료)**: 예약 주기(30분) 이전에 강제 재시동이 발생하면 그 사이의 변경분은 유실 가능 — 대표님도 "그전에 유실되지 않아야 하는 건 당연하다"고 하셨으나 이는 로컬 저장 자체의 신뢰성(coalesce 즉시 flush 등, 이번 change 범위 밖) 영역이라 별개로 관리 필요. 30분 간격은 과거 6시간 대비 유실 가능 구간을 12배 줄인 것이지 완전히 없앤 것은 아님.

### 설계안 — ③ 부팅 시 Firestore 대조 (구현 보류, 승인 필요)

**목표**: 로컬 `arcfire_planet_core_runtime_v1`이 비정상적으로 비어있거나(이번 사건처럼) 오래됐을 때, 매 부팅마다 최신 Firestore 백업과 대조해 안전망 역할.

**제안 설계 (초안)**:
1. `bootstrapFromWorldAsync`(또는 그 이후 별도 단계)에서 로컬 하이드레이션 완료 후, `fetchGameSaveBackupDoc`으로 **최신 백업 1건만** 조회(목록 전체 조회 아님 — 비용 최소화).
2. **전체 스냅샷 덮어쓰기 금지** — `arcfire_planet_core_runtime_v1` 키만 선별 비교: 백업의 `byPlanetId[planetId].detail.development`가 존재하는데 로컬은 없는 행성만 골라 그 부분만 병합 적용(현재 확인된 정확한 실패 패턴을 정조준).
3. 병합 판단 기준은 `updatedAtMs`/`detail.development` 존재 여부 우선 — "최신"을 시간 비교만으로 판단하면 로컬이 실제로 더 최신인데 클라우드가 오래된 스냅샷을 덮어쓸 위험이 있어, **"로컬에 아예 없는데 클라우드엔 있다"는 경우만** 채워 넣는 보수적 병합으로 제한.
4. 실패해도 부팅을 막지 않음(best-effort, timeout 후 로컬만으로 진행) — 부팅 지연·행 방지가 최우선.

**리스크**: 부팅 시퀀스는 이 프로젝트에서 여러 차례 "민감 구간"으로 지적된 영역(초기화 지연·행 이슈 이력)이라, 병합 로직 버그 시 오히려 새로운 부팅 문제를 만들 수 있음 — 별도 세션에서 충분한 시간을 두고 김팀장 리뷰 후 구현 권장.

### self-check (② 최종 — ① 되돌린 이후 재검증)

- [x] `npx tsc --noEmit -p tsconfig.client.json` — **PASS**
- [x] `npm run audit:memory:all` — **PASS** (memory 37/37 · skia-worklet 20/20 · worklet-contract PASS · native-reclaim 20/20 · resident-set 7/7 · hot-path hits=0)
- [x] diff 범위: `git diff HEAD` 확인 결과 **`gameSaveBackupContract.ts` 1개 파일, 1줄**(간격 상수)만 최종 남음 — `scheduleGameSaveBackup.ts`·`planetFacilityLevelApplied.ts`는 ① 되돌리면서 원본과 완전히 동일한 상태로 복귀 확인
- [x] git commit **안 함**

### 별개 확인 요청 (이전 handoff 항목 관련)

방위위성 소실의 실제 트리거(김팀장 작업 중 admin 복원 실행 여부)는 여전히 미확인 — `npm run admin:game-save:list -- --uid 519f756a7517ac11`로 백업 이력 확인 부탁드립니다(Firebase Admin 자격증명 필요해 김클로드 쪽에서 직접 조회 불가).

### 별도 요청 사항 (금번 대화에서 대표님이 언급, 미착수)

- "블루팀(스텔리움연합) 점유지역 행성은 아크코어 자동개발 대상에서 제외, 데이터 삭제 금지" — 기존 `player-independent-nation-m1-m2` 스펙과의 관계 확인 필요(중복/누락 점검 후 반영 여부 판단 요망).

### 추가 — 전체 저장구조 재검토 (대표님 요청, 코드 변경 없음 · 결론만)

대표님이 "플레이 기록·미션·행성개발(방위위성)·레벨업·보유아이템 등 모든 데이터가 안전하게 지속되는 구조인지 재확인" 요청 → 백업 대상 키(`gameSaveBackupKeys.ts` `PLAYER_GAME_SAVE_BACKUP_KEYS` 20개) 전수 대조 + `localAccountReset.ts` 계정 완전삭제 로직까지 확인 완료.

**결론: 분류 경계 자체는 이미 정확했다.** 미션·행성개발(방위위성 포함)·레벨업·아이템·스킬·함장 등 플레이어 직접 액션 항목은 전부 백업 대상에 이미 포함되어 있었고, ArcCore RED 금고·수송선단 금고·중앙은행·일일배치 상태 등 "아크코어가 주체인" 항목은 이미 전부 제외되어 있었다(`resetLocalPlanetCoreRuntimeForAccountPurge`가 RED 슬롯 스냅샷→복원 방식으로 완전삭제 시에도 RED 쪽을 보존하는 것까지 코드 레벨로 확인). 오늘 위성이 사라진 근본 원인은 분류 오류가 아니라 위 ①+②로 고친 **백업 반영 타이밍(6시간 지연 + 정상 부팅 시 미조회)** 문제였고, 같은 취약점을 미션·레벨업·아이템 등 다른 모든 항목도 공유하고 있었으므로 ①+② 수정으로 전체가 함께 보강됨.

**경계 판단 보류했던 2건 → 대표님 확인으로 해소:**
- `arcfire_blue_team_shared_vault_v1`(블루팀 공용 금고) — "블루팀도 플레이어 금고가 아닌 이상 종속될 필요 없고 아크코어 종속 관리로 둬도 된다"(대표님) → **백업 대상 추가 불필요, 현행(제외) 유지 확정.**
- `arcfire_planet_trade_fee_ledger_v1`(일일 수수료 정산 풀) — 플레이어 직접 액션이 아닌 시스템 정산 버킷 → 마찬가지로 **현행(제외) 유지.**

**핵심 원칙 확정(향후 신규 스토어 추가 시 적용)**: "플레이어가 직접 액션한 진행 내용"만 계정 귀속·백업 대상. 이름에 "블루팀"이 들어가도 플레이어 개인 지갑이 아니면(공용/시스템 관리 buckets) 계정 귀속 불필요.

---

- [x] git commit **안 함**

### 김팀장 검수 (2026-07-08 22:43 KST)

| 항목 | 결과 |
|------|------|
| ① 백업 6h 재통일 | **PASS** — `6h × MAX_PER_UID(28) = 7일` 보관과 정합. 30분이면 ~14시간만 보관·쓰기 12배 증가 — 대표님 「6시간 통일」 지침과 일치 |
| ② 총사령관 키 제거 | **PASS** — `arcfire_planet_governor_assignments_v1`는 ArcCore 자율 배정·purge 제외와 일치. 향후 플레이어 소유권 확장 시 재검토 필요(김클로드 주석 동의) |
| ③ 죽은 코드 삭제 | **PASS** — `useArcCoreTempBankStore`·`consumeFreshStartFlag` grep 0건. `auth.ts` 주석 `consumeFreshStartForTitle`로 정정 |
| ④ orphan 청크 | **HOLD(보고만)** — 청크 성공 후 메타 쓰기 전 crash 시 고아 가능. 별도 sweep 과제 |
| tsc | **PASS** |
| audit:memory:all | **PASS** (37/37 · skia 20/20 · worklet · native-reclaim 20/20 · resident-set 7/7 · hot-path 0) |

**verdict: PASS** — 저장 분류·비용 정합 수정만. P0 `planetCoreRuntimeStore` 손상 복구와 병행 적용 권장.

---

## ✅ REVIEWED — 방위위성 전체 소실(byModuleId/legacy 분기) · 김클로드

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED`** · **verdict PASS(조건부)** (김팀장 2026-07-08 22:43 KST) |
| **updated** | 2026-07-08 22:43 KST |
| **task_id** | `defense-satellite-vanish-byModuleId-legacy-fix-20260708` |
| **요청자** | 대표님 — "최근 김팀장 작업이 원인인지, 아크코어 주기설정변경이 원인인지 몰라도 방위위성들이 갑자기 모두 사라졌다. 원인을 철저하게 분석해 복구하고 수정하라" |

### 근본 원인 (확정)

`src/game/planetDevelopment/planetDefenseSatelliteRuntime.ts`의 (수정 전) `readDefenseSatelliteDetailFromPlanet`가 **`development.byModuleId.defense_satellite`가 존재하기만 하면(설치값 무관) 그대로 신뢰**하고, legacy `detail.defenseSatellite`는 byModuleId가 아예 없을 때만 참조하는 구조였음:

```ts
// 수정 전 (요약)
if (fromModule && fromModule.version === 1) return fromModule;   // installed:false 여도 그대로 반환
const legacy = runtime?.detail?.defenseSatellite;
if (legacy?.version === 1) return legacy;
```

→ **byModuleId 쪽이 `{installed:false}`(빈 기본값)로 존재하는데 legacy 쪽에 실제 설치 이력(`installed:true`)이 남아있는 행성**은 무조건 "미설치"로 읽힘 — 게임 내 모든 방위위성 표시·전투 판정·궤도 월드오브젝트가 이 단일 함수를 거치므로, 이 분기가 한번 어긋나면 **모든 행성의 방위위성이 동시에 사라진 것처럼 보임**(대표님이 보고한 증상과 정확히 일치).

byModuleId가 이렇게 "존재하지만 빈 값"이 되는 경로는 여러 곳에서 가능함(`ensurePlanetCoreRuntimeForDev`의 기본 초기화, 스토어 재부트 시 기본값 채움 등) — 즉 **트리거는 김팀장의 최근 작업일 수도, 재부팅(이번 세션에서 반복 확인된 GL_HARD_CEILING 강제 재시동 포함)일 수도 있으나, 실제로 증상을 유발한 코드는 이 읽기 함수의 설계 결함**이라는 결론. `아크코어 주기설정변경`(예: `planet_defense_satellite_policy.csv` policy_version 1→2, 2026-06-29 커밋) 자체는 min/max 위성 수를 바꾼 의도된 밸런스 변경이며 이번 소실 증상의 직접 원인은 아님(확인 완료 — CSV는 현재 uncommitted diff 없음, 9일 전 커밋).

### 확인 — 김팀장 최근 작업(uncommitted)이 이미 이 문제를 겨냥한 수정 중이었음

`planetDefenseSatelliteRuntime.ts`·`planetDefenseSatelliteDevelopment.ts`·`syncPlanetHubDevelopmentOnLanding.ts` 3개 파일이 이미 **uncommitted 상태로 병합 로직 수정 중**이었음(주석: "byModuleId만 installed:false인데 legacy installed:true → 궤도 위성 0기 회귀 방지"). 로직 검증 결과 **OR 병합(`installed = moduleDetail.installed || legacyDetail.installed`) 자체는 정확** — 김클로드가 이어받아 아래 갭 2곳을 마저 메우고 self-check까지 완료.

### 김클로드 추가 조치 (이번 작업)

1. **복구 범위 확대** (`planetFacilityLegacyMigration.ts` `migrateLegacyPlanetDevModulesForPlanet`) — 기존에는 `reconcileDefenseSatelliteDevRecordOnLanding`이 **착륙한 행성 1곳만** 복구했음(플레이어가 재방문해야만 복구). 부트마다 전 행성을 순회하는 기존 `migrateLegacyPlanetDevModulesAll()` 파이프라인 안에 이 reconcile을 편입 — **다음 앱 부팅 시 방문 여부와 무관하게 전 행성 일괄 복구**되도록 확장.
2. **동일 버그의 중복 구현 2곳 발견 및 수정** — 공유 병합 함수(`readDefenseSatelliteDetailFromCoreDetail`)를 거치지 않고 **같은 `byModule ?? legacy` 버그 패턴을 각자 복제**하고 있던 코드:
   - `src/ui/overlay/content/PlanetDefenseSatelliteDevContent.tsx:49` — 방위위성 개발 오버레이의 재렌더 트리거 키(`defenseRev`). 실제 표시 데이터는 `buildDefenseSatelliteDevSnapshot`(정상 경로)라 화면 자체는 안전했으나, 이 revision key가 legacy만 바뀐 변경을 놓쳐 재렌더/틱 갱신이 씹힐 수 있었음.
   - `src/game/planetHub/planetHubStoreMemoRevisions.ts` `planetHubDefenseSatelliteMemoRev` — **더 중대**: 이 함수가 `src/worldObjects/planetWorldObjectsListCache.ts`의 월드오브젝트(궤도 위성 오브젝트 포함) 캐시 무효화 키로 직접 쓰임. byModuleId만 보고 legacy 변화를 놓치면, 착륙 시 강제 invalidate(`syncPlanetHubDevelopmentOnLanding`)가 없는 경로(허브 체류 중 실시간 갱신 등)에서는 캐시가 갱신되지 않아 위성이 화면에 반영 안 될 여지가 있었음.
   둘 다 공유 함수 `readDefenseSatelliteDetailFromCoreDetail` 호출로 교체 — 향후 병합 로직이 또 갈라질 여지 자체를 제거.

### 최종 수정 파일 (6개)

- `src/game/planetDevelopment/planetDefenseSatelliteRuntime.ts` (김팀장 기존 작업 — 검증만)
- `src/systems/planetaryDefense/planetDefenseSatelliteDevelopment.ts` (김팀장 기존 작업 — 검증만)
- `src/game/planetDevelopment/syncPlanetHubDevelopmentOnLanding.ts` (김팀장 기존 작업 — 검증만)
- `src/game/planetDevelopment/planetFacilityLegacyMigration.ts` (김클로드 추가 — 전 행성 복구 편입)
- `src/game/planetHub/planetHubStoreMemoRevisions.ts` (김클로드 추가 — 중복 로직 제거)
- `src/ui/overlay/content/PlanetDefenseSatelliteDevContent.tsx` (김클로드 추가 — 중복 로직 제거)

### self-check

- [x] `npx tsc --noEmit -p tsconfig.client.json` — **PASS** (에러 없음)
- [x] `npm run audit:memory:all` — **PASS** (memory 37/37 · skia-worklet 20/20 · worklet-contract PASS · native-reclaim 20/20 · resident-set 7/7 · hot-path hits=0)
- [x] git commit **안 함**

### 복구 관련 안내 (중요 — 대표님 확인 필요)

- 이 수정은 **읽기·캐시 로직 복구**다 — byModuleId/legacy 중 "true"가 하나라도 있으면 즉시 정상 표시된다. 즉, **legacy 필드에 실제 설치 이력이 남아있는 행성은 다음 부팅(또는 재착륙) 즉시 위성이 재표시**된다.
- 단, **만약 특정 행성이 byModuleId·legacy 양쪽 모두 `installed:false`로 이미 덮어써진 상태라면(진짜 데이터 유실)** 이번 수정으로는 복구 불가 — 그 경우 Firebase 세이브 백업(`src/firebase/gameSaveBackup/`) 스냅샷에서 해당 시점 이전 데이터 확인이 필요할 수 있음(대표님 실기 확인 후 필요 시 별도 요청 바람).
- **런타임 검증 미완료** — 정적 분석·self-check 게이트만 통과했고, 실기(다음 부팅 후 방위위성 재표시 여부)는 대표님 확인이 필요.

### 김팀장 검수 (2026-07-08 22:43 KST)

| 항목 | 결과 |
|------|------|
| 근본 원인 | **PASS** — byModuleId `installed:false` 우선 → legacy `installed:true` 무시. 증상(전 행성 동시 소실)과 정합 |
| 병합 읽기 | **PASS** — `readDefenseSatelliteDetailFromCoreDetail` 단일 경로로 memo rev·오버레이·월드오브젝트 캐시 통일 |
| 부트 일괄 복구 | **PASS** — `migrateLegacyPlanetDevModulesForPlanet`에 reconcile 편입 → 착륙 없이 전 행성(legacy 잔존 시) |
| planetCore 손상 | **별도 P0** — JSON.parse 실패 전체 리셋은 본 handoff와 별개. P0 패치와 함께 배포 필수 |
| 데이터 복구 한계 | **확인** — 양쪽 `installed:false`면 복구 불가(대표님 「예」). legacy 잔존 행성만 자동 복구 |
| tsc · audit:memory:all | **PASS** |

**verdict: PASS(조건부)** — 코드·원인 분석 승인. **실기 1회**(부팅 후 legacy 잔존 행성 위성 재표시) + P0 planetCore 패치 Metro `r` 동시 반영 권장.

---

## ✅ REVIEWED — 허브 순회 native_heap 누적 · 권장 A안(A1+A2) · 김클로드

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED`** · **verdict PASS** (김팀장 2026-07-08) |
| **updated** | 2026-07-08 10:47 KST |
| **task_id** | `hub-hop-native-heap-fix-a-plan-20260708` |
| **assigned_by** | 김팀장 — 전반 분석 완료 후 대표님 지시(권장 A안) |
| **명세** | `tools/kim-team-lead/reports/kim-claude-ready-hub-hop-native-heap-fix.md` |

### 구현 내역

**A1 — `src/components/planet/PlanetNebulaImageBackdrop.tsx`**
- `backgroundImageSource`·`nebulaBakedImageSource` 두 `<Image>` 모두에 `resizeMethod="resize"` 추가
- 각 `style`에 명시적 `{ width: size, height: size }` 추가(기존 `styles.layer`의 `width/height:'100%'` 위에 덮어써 우선 적용) — Android 디코드 시 1024×1024 풀 디코드 대신 뷰포트 `size` 기준 다운샘플 유도
- `resizeMode="cover"`·크로스페이드 시각은 변경 없음(레이아웃/opacity 로직 불변)

**A2 — `src/game/nativeReclaim/runPlanetChangeNativeReclaimLight.ts`**
- `arcfire-native-memory`의 `trimNativeBitmapCachesAsync` import 추가
- 기존 3단계(combat skia reclaim·nebula profile prune·memo compact) 뒤에 `void trimNativeBitmapCachesAsync().then(...)` 추가 — ingress 정본 패턴(`runPlanetHubIngressReclaimPass.ts`)과 동일하게 비동기·non-blocking
- DEV 로그에 `fresco=${result.frescoCleared}` 반영(기존 로그를 `.then()` 안으로 통합, 별도 로그 중복 없음)

### self-check (김클로드)

- [x] `npx tsc --noEmit -p tsconfig.client.json` — **PASS**
- [x] `npm run audit:memory:all` — **PASS** (memory 37/37 · skia 20/20 · worklet · native-reclaim 20/20 · resident-set 7/7 · hot-path 0)

### 김팀장 검수 (본창 Cursor)

| 항목 | 결과 |
|------|------|
| diff·계약 | **PASS** — A1/A2 명세 2파일만 · Skia/worklet/STAGE 계약 위반 없음 |
| A1 호출 경로 | **PASS** — `planetHubSubcomponents.tsx` `size={nebulaBackdropSize}` (뷰포트 크기) 전달 확인 |
| A2 호출 경로 | **PASS** — `planetMainStageSession.ts` `planet_change` → `runPlanetChangeNativeReclaimLight` 배선 유지 |
| audit 재실행 | **tsc PASS** · **audit:memory:all PASS** (37/37 · skia 20/20 · worklet · native-reclaim 20/20 · hot-path 0) |
| **커밋** | 미실행 (대표님 지시 시) |
| mem-post-dev-recheck | **배정** — 김경제 handoff 갱신 권장 |

**verdict**: `PASS`

**검수 메모**:
1. **A1** — 1024 풀 디코드 → `nebulaBackdropSize` 기준 다운샘플. worldmap↔hub 왕복(대표님 재현 경로)에 직접 효과 — **가장 큰 레버**.
2. **A2** — in-hub `planet_change` Fresco trim 공백 메움. ingress 정본과 동일 `void trim...then()` 패턴.
3. **한계** — Skia `useImage` 성운 사본·Fresco 캐시 상한 plateau는 A안 범위外(명세대로). **실기**: 은하계 3+ 행성 순회 후 native_heap floor +40MB 이내 확인 권장.
4. **반영** — Metro **`r` 리로드**만으로 충분(네이티브 재빌드 불요).

**[kim-claude-review] 2026-07-08 hub-hop-native-heap-fix-a-plan PASS — A1 resizeMethod+size · A2 planet_change fresco trim · tsc+audit PASS · 실기 native_heap 재측정 대기**

---

## 🔴 PENDING — 행성허브 3곳+ 순회 시 재시동(하드실링 실시간 재현) · 김클로드 (진단 완료 → **A안 READY로 이관**)

| 필드 | 값 |
|------|-----|
| **status** | `PENDING` (실시간 인시던트로 확증 — 코드 수정은 승인 후) |
| **updated** | 2026-07-08 10:10 KST |
| **task_id** | `multi-hub-hop-gl-hard-ceiling-restart-20260708` |
| **요청자** | 대표님 — "은하계 지도상에서 여러 행성 허브 3개 이상을 돌아다니면 결국 재시동되는(메모리 위험) 상태" |
| **관련** | 직전 항목 `galaxy-map-gl-residual-on-hub-reentry-20260708`(은하계 지도 체류 GL 잔류)와 같은 계열 — 부분적으로 원인 중첩 |

### 실시간 확증 — 조사 도중 정확히 재현됨

```
09:46:15  pss=920.7  gl=122.9  native_heap=424.2  views=377
10:01:40  pss=959.9  gl=45.3   native_heap=494.3  views=404   ← GL_HARD_CEILING 발동
10:01:48  [INCIDENT] GL_HARD_CEILING gl=45.3 pss=959.9 views=404 → 즉시 remediation(OOM 임박 판단)
10:01:50  [AUTO_FIX] app relaunch reason=gl_critical_active_hub
10:02:09  baseline reset pid=23222 gl=6MB pss=190.8MB
10:02:30  VERIFY PASS pid=23222 gl=5.1MB pss=458MB views=82
```

대표님이 보고한 증상이 조사 도중 **실제로 자동 재시동을 유발**했다(모니터가 950MB 하드 예산 초과로 판단, 자동 relaunch 완료 — 현재 앱은 정상 기동 상태, pid 23222).

**중요 — 이번 트리거는 GL 자체가 아니라 native_heap 급등**: 같은 구간에서 `gl_mb`는 오히려 122.9→45.3으로 **하락**했는데(모니터가 `GL_RECOVERED idle_ok`로 오라벨링) `native_heap_mb`는 424.2→494.3으로 **15분 새 +70MB 급증**하며 pss가 950MB 하드 예산을 넘음. 즉 "GL_HARD_CEILING"이라는 인시던트명과 달리 실제 주범은 native_heap 쪽.

### 코드 추적 — native_heap 급증 후보

1. **행성 허브 배경 성운("베이크 PNG")이 이중 디코드 경로를 가짐**:
   - `SkiaPlanetNebulaShaderBackdrop.tsx:134-135` — `useImage()`(Skia GL 텍스처 관리, `nebulaBakedImageSource`/`backgroundImageSource` 둘 다)
   - `PlanetNebulaImageBackdrop.tsx:44-57` — 동일 소스를 RN `<Image>`(Fresco/native_heap)로 **별도 디코드**(크로스페이드용, `planetHubSubcomponents.tsx:586,610` 두 곳에서 마운트)
   - 즉 허브 진입마다 같은 성운 아트가 **Skia 텍스처 + Fresco 비트맵** 두 벌로 메모리에 올라갈 수 있는 구조.
2. **베이크 PNG 실측 용량** — `assets/images/nebula/baked/*.png` 21개, 파일당 **820KB~980KB**(압축). 디코드 시 raw bitmap은 통상 5~15배 팽창 — 장당 수 MB~10MB+ 예상(정본 실측은 기기 프로파일러 필요).
3. **`resolvePlanetNebulaBakedSource`**(`src/game/planetNebulaBakedAssets.ts`) — 정본 21행성은 전용 PNG, synth/미개척 행성은 zone별 폴백 풀(안전 4장/중립 8장/pvp 6장/엔드게임 3장)에서 **행성 id 해시로 결정론적 선택**. 폴백이라도 zone 내 여러 장 중 하나이므로, 서로 다른 행성 3곳을 순회하면 서로 다른 이미지 2~3장이 동시에 디코드될 가능성이 높음(모두 같은 이미지로 수렴할 보장 없음).
4. **인그레스 측 회수 설계가 "이전 허브 정리"를 하지 않음** — `runPlanetHubIngressReclaimPass`(`src/game/nativeReclaim/runPlanetHubIngressReclaimPass.ts:27-33`)는 새 허브 마운트를 방해하지 않으려고 **의도적으로** `reclaimHubSkia: false, releaseGpuLayers: false`를 넘김(직전 handoff 항목에서도 지적한 지점). 결과적으로 "떠나온 이전 행성의 배경 텍스처/비트맵을 강제로 내리는 지점"이 STAGE1↔STAGE2 전환 어디에도 없고, 오직 Skia/Fresco 자체의 소스-키 기반 캐시 재사용·GC 타이밍에만 의존 — 방문한 행성이 다양할수록(=서로 다른 소스 캐시 엔트리가 늘어날수록) 이 의존이 깨지고 상주량이 쌓일 여지가 커짐.
5. `hubRnBackdropRemountGen`(`planetHubSubcomponents.tsx:393-407`) 기반 강제 리마운트는 **"주기 deep reclaim"** 시점에만 발동 — 행성→행성 이동(허브 진입) 시점에는 발동 안 함.

### 결론 (진단 한정, 수정 없음)

- 직전 항목(은하계 지도 GL 잔류, +87MB 정체)과 이번 항목(다중 허브 순회 native_heap 급증)은 **같은 구조적 원인**을 공유: STAGE2→STAGE1 전환 시 "새 STAGE 마운트를 방해하지 않기 위해 이전 STAGE 자원 강제회수를 의도적으로 생략"하는 설계가, 정작 "여러 개의 서로 다른 콘텐츠(여러 성계 GL / 여러 행성 배경 이미지)를 반복 방문"하는 시나리오에서는 각 방문분이 회수 없이 누적되는 역효과를 냄.
- 이번 native_heap +70MB의 **정확한 단일 원인(이중 디코드 vs 폴백 풀 다양성 vs 다른 native 할당)은 기기 프로파일러 없이 코드 추적만으로 100% 특정 불가** — 위 1~5번은 확인된 구조적 후보이며 확률 순으로 나열한 것.
- **코드 수정 미착수**(대표님 요청이 "추가 검토"였으므로 진단에 한정). 수정 시 승인 필요 후보:
  (a) 허브 진입 시 "이전 planetId의 성운 배경 텍스처/비트맵" 명시적 언마운트·trim 스텝 추가(`runPlanetHubIngressReclaimPass`에 keep=[신규 planetId]로 이전 소스 evict),
  (b) Skia/RN 이중 디코드 중 하나로 단일화(크로스페이드 필요 없는 경로에서),
  (c) 폴백 풀 다양성 축소 또는 zone당 1장으로 통일(방문 성계 다양성과 무관하게 캐시 재사용률 100% 보장).

### 참고

- 대응 relaunch는 모니터 자동 remediation이 정상 수행 완료(정상 기동 확인, VERIFY PASS). 사용자 조치 불필요.
- 직전 handoff 항목 `galaxy-map-gl-residual-on-hub-reentry-20260708`과 함께 김팀장 검토 시 묶어서 판단 권장(원인 계열 동일).

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

## 🟡 PENDING — 은하계 지도맵 GL 잔류(worldmap→hub 회수 누락) · 김클로드 (분석 완료, 수정 미착수)

| 필드 | 값 |
|------|-----|
| **status** | `PENDING` (진단 완료 — 코드 수정은 승인 후 진행) |
| **updated** | 2026-07-08 09:52 KST |
| **task_id** | `galaxy-map-gl-residual-on-hub-reentry-20260708` |
| **요청자** | 대표님 — "은하계 지도맵에서 머무르다 행성허브로 들어가면 메모리가 해제되어야 하는데 여전히 높게 유지된다" |

### 실측 근거 (`tools/long-run-monitor/logs/mem-timeline.csv`, `incidents.log`)

```
08:14:02  gl=35.8MB  pss=837.0  views=399   (베이스라인)
08:29:23  gl=135.8MB pss=935.2  views=581   GL_SPIKE (+100MB, +182 views)
08:44:43  gl=147.9MB pss=941.5  views=560
09:00:06  gl=147.9MB pss=941.1  views=560   (변화없음 — 정체)
09:15:31  gl=122.8MB pss=916.9  views=375   GL_RECOVERED(모니터 라벨) — views는 베이스라인 근접 회복하지만 GL은 아님
09:30:51  gl=122.9MB pss=906.0  views=373
09:46:15  gl=122.9MB pss=920.7  views=377   (09:15 이후 30분간 122.8~122.9MB 고정 — 추가 회수 없음)
```

**모니터의 `GL_RECOVERED idle_ok` 라벨은 오판정** — 추세가 하락했다는 것만 보고 베이스라인 복귀 여부는 안 봄. 실제로는 148MB → 123MB로 부분 회수(views는 거의 완전 회복) 후 **베이스라인(35.8MB) 대비 +87MB가 30분 이상 고정 잔류** — 대표님이 보고한 "은하계 지도 체류 중 GL+100MB → 행성허브 재착륙 후 미해제" 증상과 정확히 일치. views 폭증분(+182)이 GL 스파이크와 동시에 뜨고 동시에 대부분 빠진 패턴은 Skia/전투(`hub_skia_orbit_nebula_combat`, 모니터 자동 추정 태그)보다는 **네이티브 View 개수 자체가 늘어나는 렌더 소스**(= 은하계 지도의 `react-native-svg` 노드)에 더 부합.

### 코드 추적 결과 (처리과정 확인)

1. **`app/(game)/worldmap.tsx` `navigateToPlanetHubAfterTeardown`** — `router.replace('/(game)/planet')` 직전 `releaseWorldmapSessionFloor({reason:'route_blur'})` → `releaseGalaxyMapStageMemoryFull` 호출 확인(정상 배선).
2. **`src/game/galaxyMapStageSession.ts` `runGalaxyMapReleaseCore(route_blur)`** — nebula prune·heavyUi abort·memo invalidate·drone campaign trim·Fresco bitmap trim(`trimNativeBitmapCachesAsync`)·`runStageNativeReclaimPass({stage:'galaxy_map'})`까지는 수행.
3. **그러나 `runStageNativeReclaimPass`(`src/game/nativeReclaim/runStageNativeReclaimPass.ts:47`)의 `signalHubSkiaNativeReclaim(...)`는 `opts.stage === 'planet_hub'`일 때만 호출** — `stage: 'galaxy_map'`으로 부르는 worldmap 이탈 경로에서는 애초에 대상 밖. (그리고 이 함수 자체도 이름 그대로 "허브 Skia" 전용이라 은하계 지도 자체 렌더 소스와는 무관.)
4. **허브 재착륙측 `runPlanetHubIngressReclaimPass`(`src/game/nativeReclaim/runPlanetHubIngressReclaimPass.ts:27-33`)는 명시적으로 `reclaimHubSkia: false, releaseGpuLayers: false`를 넘김** — 주석 그대로 "hub Skia mount 전/직후 PSS floor 정리; hub Skia tear-down 은 하지 않는다"로, **허브 자신의 Skia를 보존하기 위한 의도된 설계**. 즉 STAGE2→STAGE1 전환 양쪽 모두에서 "은하계 지도 자체가 렌더한 네이티브 뷰/그래픽 메모리를 강제로 회수하는 지점"이 구조적으로 존재하지 않음.
5. **은하계 지도의 실제 렌더 소스**: `worldmap.tsx`는 Skia Canvas가 아니라 `react-native-svg`(`<Svg>` + `GalaxyMapSystemsSvg`/`GalaxyMapTerritoryVoronoiSvg`/`GalaxyMapTerritoryOccupationLabelsSvg`)를 사용. `GalaxyMapSystemsSvg.tsx:177` `systems.map(...)` — **비가상화 렌더**로 unlock된 성계 수만큼 SVG 노드(원+라벨+아이콘)가 그대로 생성됨. "1일 1성계개방" 설계상 unlock 성계 수는 시간이 갈수록 단조 증가하므로, 지도 체류 시 생성되는 네이티브 뷰 총량도 게임 진행에 따라 계속 늘어나는 구조.
6. `releaseAllPlanetGpuLayers`(worldmap 이탈 시 호출됨)는 이름과 달리 `planetStageGpuSupervisor.ts`의 **"허브측" GPU 레이어 레지스트리** 전용(`registerGpuLayer(onRelease) → releaseAllPlanetGpuLayers`) — 은하계 지도 SVG 트리와 무관.

### 결론

- STAGE1↔STAGE2 dispose 레지스트리(이전 라이프사이클 감사에서 "정상"으로 확인됐던 3계층: `registerPlanetSessionResource`/`galaxyMapStageSession`/`nativeReclaimRegistry`)는 모두 **Skia(@shopify/react-native-skia) + Fresco 비트맵 캐시**를 대상으로 설계된 것이고, `react-native-svg` 기반 은하계 지도 자체의 네이티브 View/그래픽 메모리는 이 계약 범위 밖 — 감사 사각지대.
- 실측상 GL은 스파이크 후 부분 회수(148→123MB)만 되고 이후 30분+ 고정 잔류 — "완전 미해제"는 아니고 "불완전 회수 후 정체"가 정확한 표현.
- **코드 수정은 진행하지 않음** — 진단 요청("처리과정을 확인하라")에 한정. 수정 방향 후보(승인 필요): (a) `runStageNativeReclaimPass(stage:'galaxy_map')`에 SVG 트리 전용 회수 스텝 추가, (b) `GalaxyMapSystemsSvg`에 화면 밖/미선택 성계 가상화 적용, (c) worldmap route_blur 시 지도 언마운트 후 명시적 GC/trimMemory 유도. 어느 쪽이든 "1일 1성계개방"으로 unlock 수가 계속 느는 구조라 (b)가 근본 해결에 가장 가까움.

### 미완/보류

- 위 3안 중 실제 수정 미착수 — 대표님/김팀장 우선순위 지시 대기.
- `hub_skia_orbit_nebula_combat`(모니터 자동 추정 태그)가 실제로 오귀속인지, 아니면 08:29 시점에 실제로 허브+전투 동시 활성이었는지는 로그캣 원본까지는 대조 안 함(현재 timeline/incidents만 근거).

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
