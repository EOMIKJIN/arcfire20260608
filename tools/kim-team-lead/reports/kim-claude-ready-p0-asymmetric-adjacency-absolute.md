# 김클로드 착수 — 중립 인접 비대칭 P0 **절대 최우선** (status_quo 앞단 돌파)

> **배정**: 김팀장 (Cursor 본창) · **2026-07-28**  
> **대표님 재지시**: 블루(아이언크로스)에 근접한 **중립·분쟁** 행성 — **인근 맞닿은 레드가 없으면** 높은 확률로 블루 점령. 이 우선순위를 **항상 제일 높게**. 수차례 지시했으나 현 구현이 미달.  
> **김클로드 즉시 착수** · handoff **PENDING** · **git commit 금지**  
> **task_id**: `p0-asymmetric-adjacency-absolute-20260728`

---

## [pss-pre-dev]

```text
[pss-pre-dev] hot_path=territorial_pass_1h · alloc=보급카운트·모드1회(roll 전) · cache=없음
[pss-pre-dev] stage=arcCore_territorial · risk=P1(틱금지)·planetId하드코딩금지
[pss-pre-dev] verdict=PASS — NEUTRAL+비대칭만 battle강제·CSV가중치행무단변경금지
```

---

## 0. 대표님 정본 (이번에도 동일 · 최상위)

| # | 규칙 |
|---|------|
| 1 | **중립** hold + **분쟁**(contestedZone) + **1홉에 한쪽 팩션만** 인접 → 그 팩션 점령 **고확률** |
| 2 | 예: 아이언(BLUE)만 맞닿고 **레드 성계 0** → **블루 점령 고확률** |
| 3 | 이 규칙은 **항상 스택 최상위(절대 P0)** — `rollDecision`/`status_quo`/geo-flank CSV보다 **앞** |
| 4 | **전 중립·분쟁 범용** · `planetId` 하드코딩 금지 |

### 헬리오스 그래프 사실 (보고용 · 코드 분기 금지)

`helios` 연결: `iron_cross`(BLUE) · `omega_station`(RED) · `titan_gate`(NEUTRAL) · `perseus`(RED).  
시드 그대로면 **블루·레드 둘 다 인접** → 본 P0(비대칭) **미적용**(접전=`blue_red`).  
본 task는 **「레드 0일 때」** 규칙을 **절대 최우선으로 배선**하는 것. 헬리오스가 시드상 양쪽 인접인 점은 문서·테스트 주석으로만 명시(별도 밸런스 CSV 변경은 **기존값 재확인 대상 · 본 task 금지**).

---

## 1. 현재 결함 (왜 「최우선」이 깨지는가)

| # | 결함 | 위치 |
|---|------|------|
| A | `rollDecision`이 **supply/P0보다 먼저** → `status_quo` 30%면 battle·우세 **미진입** | `runTerritorialCombatPassForPlanet` |
| B | docs §6-3이 명시: 「P2가 P0보다 바깥」= **대표님 지시 위반 문서화** | strategy MD |
| C | effectiveMode는 battle 안에서만 | 동일 |

---

## 2. 수정 1안 (고정)

**조건**: `holdSide === 'NEUTRAL'` && `policy.contestedZone === true` && 보급 비대칭(`blue>0 xor red>0`).

| 단계 | 동작 |
|------|------|
| 1 | INDEPENDENT 분기 **이후**, `rollDecision` **이전**에 `supplyAdjacency` 계산 |
| 2 | 비대칭이면 **`decision`을 `battle`로 강제**(status_quo / neutral_declare **스킵**) |
| 3 | `effectiveCombatMode` = `resolveEffectiveTerritorialCombatMode` → `blue_neutral`/`red_neutral` |
| 4 | 기존 `resolveBinaryDominantHoldTarget` + `dominantSideWeightPct`(없으면 **70** 폴백) |
| 5 | 대칭(둘 다>0) 또는 고립(둘 다0) → **기존** `rollDecision` + 기존 effective/P1 경로 **유지** |

**CSV**: `battleWeightPct`/`statusQuoWeightPct` **행 수치 무단 변경 금지**. 강제 battle은 **런타임 분기만**.

---

## 3. 범위 (M0~M4)

| # | 내용 |
|---|------|
| **M0** | strategy §6-2/§6-3 — P0는 **rollDecision보다 앞**. 「P2가 P0보다 바깥」문구 **삭제·정정**. 헬리오스=시드상 양쪽 인접 시 본 P0 미적용 1줄 |
| **M1** | `runTerritorialCombatPassForPlanet`: NEUTRAL+contested면 roll **전** adjacency → 비대칭 시 battle 강제 |
| **M2** | DEV 로그: `P0 absolute asymmetric → force battle effective=…` |
| **M3** | unit: (1) 중립+블루만 → roll 없이 battle·effective blue_neutral (2) 중립+레드만 → red_neutral (3) 둘 다 → rollDecision 경로 유지(강제 없음) (4) contestedZone=false면 강제 없음 (5) planetId 하드코딩 분기 없음 |
| **M4** | 기존 `resolveEffectiveTerritorialCombatMode`·geo-flank·stack consistency 회귀 PASS |

### 금지

- `if (planetId==='helios_core')`  
- CSV 기존행 가중치·combatMode 무단 변경  
- FrontPressure/Skia/일일배치 대공사  
- git commit / 완료 선언  

---

## 4. handoff

```text
status=PENDING
task_id=p0-asymmetric-adjacency-absolute-20260728
[pss-pre-dev] 3줄
변경 파일 · tsc · unit · 「roll 전 비대칭→battle 강제」증명
commit 금지
```
