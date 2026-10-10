# 김팀장 → 김플레이 수정 요청 — 적 완전포위 고립 거점이 분쟁 로테이션에서 빠짐

- **status**: REVIEWED · 반영 완료(미커밋) — 김플레이 2026-10-10
- **verdict**: **AGREE** (원인) · **PARTIAL** (수정안 범위)

## 0. 김플레이 재검수·반영

- 원인 재현: `contestedEligibility.ts` 48행 `adjBlue && adjRed` — BLUE hold + RED만 인접은 `ineligible`. 기존 테스트 6이 이 동작을 「스펙 리터럴」로 고정하고 있었음(설계 §0 미포함 → 누락 판단 동의).
- 수정안 범위 정정: 1안의 `hasAdjacentHostile AND 아군 인접 0` 은 **RED hold + 독립국만 인접**(테스트 7)까지 전선으로 끌어들임 — 블루·레드 분쟁 로테이션 대상이 아님. 그래서 **상대 진영(BLUE↔RED)이 1홉에 맞닿을 때만** 전선으로 했다.
  - `(holdSide=BLUE && adjRed) || (holdSide=RED && adjBlue)` → `eligible_front`
- 신규 class 없음: `eligible_front` 재사용 → 거버너 점수(+100)·하드게이트·UI 변경 없음. 「레드 공격 1순위」 상향 티어는 별도 판단 필요(지금은 front와 동일).
- 테스트: 6 기대값 변경(ineligible→eligible_front) · 6b crimson 실측(RED 4 · 아군 0) · 6c RED hold+BLUE만(대칭) 추가. 7(독립국만) ineligible 유지.
- 회귀: contestedEligibility · contestedPoolGovernor · contestedActivePool · contestedZoneHardGate · territorialStackConsistency **전부 PASS** · `tsc -p tsconfig.client.json` 0.
- 실기 적용: 거버너 dirty 플래그가 앱 시작 시 `true`(`dynamicContestedZoneStore.ts:55`) → 재시작 후 첫 territorial pass에서 재분류 · 승격. 마이그레이션 불필요.
- 미확인(범위 밖 유지): §5-4 반란 패스로 이 거점이 넘어갈 수 있는지.
- **작성**: 김팀장 · 2026-10-10 20:16 KST · 코드 수정 없음 (분석만)
- **요청자**: 대표님
- **축**: arcCore territorial 분쟁 풀 거버너 → 김플레이 담당 (팀원 배정 금지 영역)

## 1. 증상 (대표님 실기)

`crimson_base` 체류 1시간+ 동안 분쟁·전투 없음. 출발해도 판정 대상이 아님.

## 2. 실측 근거 (기기 RKStorage 읽기 전용 사본 · 20:09 KST)

| 항목 | 값 |
|---|---|
| `player.currentPlanetId` | `crimson_base` |
| `crimson_base` 점유 | **BLUE** (`balance_seed_faction_blue`, `player_annex` 13:42) |
| 1홉 이웃 4곳 | `sirius_border` · `perseus_memorial` · `dark_haven` · `blood_station` — **전부 RED** |
| 동적 분쟁 목록 | 위 이웃 4곳만. `crimson_base` 없음. CSV 정적 행도 없음 |
| `draco_front` 풀 | Active 4 < `poolMin` 8 → 자격만 있으면 바로 승격될 상황 |
| `crimson_base` 마지막 패스 | 14:16 `status_quo` (그 뒤 6시간 판정 없음) |

## 3. 원인

`src/arcCore/territorial/contestedEligibility.ts` `classifyContestedEligibility`:

- `eligible_front` = 이웃에 **BLUE·RED 둘 다** (`adjBlue && adjRed`) — 자기 hold 색은 보지 않음
- BLUE hold + 이웃 RED만 → front 아님 · 중립/독립국 아님 → **`ineligible`**
- 결과: 거버너(`contestedPoolGovernorSync.ts`)가 승격 후보로 보지 않음 → 로테이션·NPC 자동전·체류 웨이브 모두 없음

"원래 레드 지역(크림슨)" 같은 시드 기반 제외 조건은 **없음** (확인 완료 — 게이트는 `occupationCombatEnabled` · 수도 금지 · eligibility 분류 3개뿐).

설계 정본 `kim-claude-ready-contested-eligibility-pool-governor.md` §0(A안 2026-07-31)도 이 경우를 다루지 않음. 의도된 제외가 아니라 **누락**으로 판단.

## 4. 수정 요청 (1안)

`classifyContestedEligibility` 에 **적 포위 고립 거점** 분류를 추가해 전선으로 취급:

```text
holdSide ∈ {BLUE, RED} AND hasAdjacentHostile AND 아군 인접 0  → eligible_front (또는 신규 eligible_enclave)
```

- SAFE 판정(적대 인접 0) 우선순위는 그대로 유지
- 승격 티어는 front와 같거나 그 위 — "레드 공격 1순위" 체감(대표님 의견)
- 공격 측 보급선 조건은 이미 충족(RED 이웃 4)

## 5. 확인 요청

1. 위 1안 적용 여부 · 신규 class 이름 여부는 김플레이 판단
2. 단위 테스트 추가: BLUE 고립 + 이웃 RED 4 → eligible (crimson 실측 재현)
3. 기존 테스트 회귀: `contestedEligibility.test.ts` · `contestedPoolGovernor.test.ts` · `contestedActivePool.test.ts` · `territorialStackConsistency.test.ts`
4. 별도 미확인: `runPlanetRebellionResolutionDailyPass` 로 이 거점이 넘어갈 수 있는지 (이번 조사 범위 밖)

```text
[pss-pre-dev] hot_path=분류 순수 함수 · 거버너 rebalance(hold dirty 시 1회) — 틱 경로 아님
[pss-pre-dev] alloc=분기 1개 추가 · 신규 객체 없음 · persist 변화 없음
[pss-pre-dev] verdict=PASS — 거버너 호출 빈도·onBoot 경로 변경 시 REDESIGN
```
