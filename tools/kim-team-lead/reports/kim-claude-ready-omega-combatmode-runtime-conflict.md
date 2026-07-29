# 김클로드 착수 — omega_hub `combatMode` **프로세스 충돌** 재수정 (재발)

> **배정**: 김팀장 (Cursor 본창) · **2026-07-29 23:45 KST**  
> **대표님 지시**: `[territorial] omega_hub combatMode=… != runtimeGraph=…` — **전에 「단순 로그」가 아니었던 이슈**. 충돌 여부 확인 후 **왜 재발했는지** 밝히고 **재수정**.  
> **김팀장 실측 결론**: **프로세스 충돌 = TRUE** (경고는 증상). 이전 패치는 경고 문구·INDEPENDENT skip만 손대 **전투 실효 모드를 고치지 않아 재발**.  
> **김클로드 즉시 착수** · handoff **PENDING** · **git commit 금지**  
> **task_id**: `omega-combatmode-runtime-conflict-20260729`

---

## [pss-pre-dev]

```text
[pss-pre-dev] hot_path=territorial_pass 1행성 · alloc=adjacency·effective 1회 · cache=세션 warn Set
[pss-pre-dev] stage=arcCore_territorial · risk=P1(틱금지)·CSV기존행무단변경금지
[pss-pre-dev] verdict=PASS — effectiveMode만 런타임 접전 정렬·planetId 하드코딩 금지
```

---

## 0. 실측 (2026-07-29 기기 RKStorage)

| 축 | 값 |
|----|-----|
| `omega_hub` hold | **BLUE** (`balance_seed_faction_blue`) |
| `omega_station` 1홉 | `new_eden` **BLUE** · `helios` **BLUE** · `titan_gate` **RED** · `draco_nebula` INDEPENDENT(팩션 미가산) |
| CSV `combatMode` | **`blue_neutral`** |
| `runtimeGraph` (infer) | **`blue_red`** (블루·레드 둘 다 인접) |
| DEV 로그 | `combatMode=blue_neutral != runtimeGraph=blue_red` **재발 중**(오늘 23:43 logcat) |

### 왜 「단순 로그」가 아닌가 (전투 경로)

`holdSide === 'BLUE'`이면 `resolveEffectiveTerritorialCombatMode`는 **CSV를 그대로** 씀(P0는 NEUTRAL만).

→ `effectiveCombatMode = blue_neutral`  
→ `resolveAttackerDefenderSides(BLUE, blue_neutral)` = **`attacker=NEUTRAL`, `defender=BLUE`**  
→ **인접 RED(`titan_gate`)는 재탈환 전투에 진입 불가** — 접전 전선인데 블루↔중립 이중구조로 고착.

즉 경고는 **잘못된 실효 모드**를 가리키는 신호다. 로그만 끄면 **분쟁 프로세스 붕괴가 남는다.**

---

## 1. 왜 「수정」이 재발했는가 (근본)

| 이전 조치 | 결과 |
|-----------|------|
| 경고 문구를 「참고용 · 시드 미사용 · NEUTRAL 우세는 P0」로 완화 | **오진 고착** — 팀/대표가 「로그 무시」로 읽음 |
| INDEPENDENT hold면 graph 검증 **스킵** | 드라코 독립국 경고만 해소 · **오메가 BLUE 홀드 미해결** |
| P0(`resolveEffectiveTerritorialCombatMode`) = **NEUTRAL hold 전용** | 오메가가 한 번 BLUE가 되면 CSV `blue_neutral`이 **영구 고정** → RED 인접이 있어도 접전 불가 |
| geo-flank CSV `blue_neutral` 유지 | 의도(블루 우세 외교)와 **런타임 양쪽 인접 접전**이 충돌 — 런타임 쪽이 져야 함 |

**재발 조건**: 오메가 BLUE 점유 + 타이탄(RED) 1홉 유지 → 매 세션 1회 동일 warn + **매 battle에서 RED 배제**.

---

## 2. 제품 1안 (고정 · 김팀장)

대표님 정본과 정합: **1홉에 블루·레드가 모두 있으면 접전(`blue_red`)**. CSV `blue_neutral`/`red_neutral`은 **한쪽만 인접·고립·NEUTRAL 폴백**용.

| # | 규칙 |
|---|------|
| R1 | `contestedZone` 행성에서 런타임 1홉 **hasBlue && hasRed** → **`effectiveCombatMode = 'blue_red'`** — **holdSide가 BLUE/RED/NEUTRAL이어도** 적용 (INDEPENDENT는 기존 별도 분기 유지) |
| R2 | hasBlue xor hasRed → 기존 P0(NEUTRAL) / 비중립이면 CSV 유지(현행과 정합) |
| R3 | 양쪽 0 → CSV `policy.combatMode` 폴백 |
| R4 | DEV: mismatch warn은 **`policy` vs `effective`(최종)** 만. 최종이 runtime과 같으면 **경고 금지**. 「참고용」완화 문구 **삭제·정정** |
| R5 | **CSV 기존행 `combatMode`/`dominant*` 무단 변경 금지** — 런타임 effective만 |

오메가 효과: BLUE 점유 + titan RED 인접 → battle 시 **RED가 attacker 가능**(blue_red 경로).

---

## 3. 범위 (M0~M5)

### ✅ 김클로드

| # | 내용 |
|---|------|
| **M0** | 본 READY §0~§1을 handoff에 요약(재발 원인 3줄). 소비처: `resolveEffectiveTerritorialCombatMode` · `runTerritorialCombatPassForPlanet` · `inferTerritorialCombatModeFromGraph` |
| **M1** | effective 해석 확장: **양쪽 인접이면 holdSide 무관 `blue_red`**. 순수 함수 시그니처에 adjacency(또는 hasBlue/hasRed) 입력 — `planetId` 하드코딩 금지. 단위 테스트로 고정 |
| **M2** | `runTerritorialCombatPassForPlanet`: battle 경로가 **확장된 effective**만 사용(이미 effective 경유면 배선만 확인). graph warn을 **최종 effective 기준**으로 정리(R4) |
| **M3** | unit: (a) BLUE hold + blue&red adj → effective `blue_red` (b) NEUTRAL + blue만 → `blue_neutral` (c) RED hold + blue&red → `blue_red` (d) INDEPENDENT 분기는 기존 skip 유지 (e) CSV 행 값 무단변경 없음 정적/테스트 |
| **M4** | 기존 geo-flank·P0 비대칭·stack 회귀 테스트 PASS |
| **M5** | `tsc` · 관련 `npx tsx` territorial 테스트 PASS · handoff PENDING |

### ❌ 금지

- `if (planetId === 'omega_hub')` 하드코딩  
- `arc_core_territorial_combat_policy.csv` 기존 `combatMode`/가중치 **변경**(기존값 재확인 대상 — 본 task 밖)  
- warn만 `console` 삭제하고 effective 미수정  
- FrontPressure/Skia/일일배치 대공사 · **git commit / 완료 선언**

---

## 4. 정본 파일

| 파일 | 역할 |
|------|------|
| `src/arcCore/territorial/resolveEffectiveTerritorialCombatMode.ts` (+test) | R1~R3 핵심 |
| `src/arcCore/territorial/runTerritorialCombatPass.ts` | M2 warn·effective 배선 |
| `src/arcCore/territorial/territorialCombatGraph.ts` | infer는 참고·재사용 가능(중복 로직 금지 시 export presence) |

---

## 5. 완료 handoff 형식

```text
status=PENDING
task_id=omega-combatmode-runtime-conflict-20260729
verdict=(김팀장 검수 대기)
commit 금지
재발원인: …
실측대응: BLUE+양쪽인접 → effective blue_red
self-check: tsc= · unit=
```

대표님께 **「김팀장(Cursor 본창) 검수 요청」** 안내.
