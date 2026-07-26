# 전선 압박(FrontPressure) 전술 자동 전환 v0

> **상태**: 구현 완료(Phase 0+1) · 2026-07-26  
> **ready**: `tools/kim-team-lead/reports/kim-claude-ready-front-pressure-tactics.md`  
> **교차**: `docs/strategy/ARC_CORE_TACTICAL_AUTOMATION_AND_GALAXY_STRATEGY.md` · `src/arcCore/territorial/*`

---

## 1. 용어

| 용어 | 의미 |
|------|------|
| **FrontPressure** | 성계 1곳의 "전선 압박 상태" 스냅샷 — 적대 인접 수·아군 보급 인접 수·자세·빈도 |
| **posture** | `defensive`(적대 인접 0·아군 보급 有) · `normal`(그 외) · `aggressive`(적대 인접 ≥ `hostileNeighborMinAggressive`) |
| **flanked** | 적대 인접 ≥ `hostileNeighborMinFlanked` — 로그/UI 참고 플래그, posture 판정과 별개 |
| **battlesPerInterval** | 같은 `passIntervalSec` 창에서 허용되는 최대 전투 판정 횟수(normal=1, aggressive=2) |

**STAGE 웨이브 디펜스와 무관** — `useWaveDefenseController`(착륙 후 웨이브 전투)는 이번 작업에서 손대지 않았다. FrontPressure는 전적으로 아크코어 접전(`runTerritorialCombatPass`) 축이다.

---

## 2. 시리우스 시나리오 예시

| 위치 | 성계 | 점유 | 의미 |
|------|------|------|------|
| 좌(연결) | `vega_outpost`/`vega_base` | BLUE | 아군 거점 |
| 축 | `draco_nebula` | 분쟁/가변 | 전선 |
| 우(연결) | `sirius`/`sirius_border` | **플레이어 독립국(INDEPENDENT)** | 압박 대상 |
| 상(연결) | `perseus` | RED(동팩션 보급) | 적 거점 |

`sirius`의 인접은 `draco_nebula`·`perseus`·`crimson_zone` 3곳(`tables/content/systems.csv`). `draco_nebula`·`perseus`가 모두 RED로 점유되면 `hostileNeighborCount=2` → `posture=aggressive` → 이 성계는 같은 passInterval 창에서 최대 2회까지 전투 판정이 돈다(기존 1회).

이 분기는 **행성 id 하드코딩이 아니라** 일반 그래프(`listAdjacentSystemIds`)+런타임 holds로만 결정된다 — 시리우스가 아닌 다른 어떤 성계라도 같은 조건(적대 인접 ≥2)이면 동일하게 aggressive가 된다.

---

## 3. 계약 요약

| 축 | 계약 |
|----|------|
| 계산 시점 | `getFrontPressure(systemId, holds)` — 캐시 히트 우선, miss일 때만 `recomputeFrontPressureForSystem` |
| invalidate | `applyArcCoreTerritorialHold`·`claimPlanetOwnershipByPurchase`(독립국 편입) — 변경된 systemId + 인접만 무효화 |
| 안전망 | 30분 TTL — invalidate 누락 방어용(전량 재스캔 아님, 조회된 systemId 1건만 재계산) |
| 60s probe | 전은하 재스캔 **없음** — probe는 due 판정만, FrontPressure는 그 안에서 캐시 조회 1회 |
| 빈도 게이트 | `isTerritorialPassDueForPlanet` — `windowStartMs`/`passCountInWindow`(bounded, 배열 아님)로 같은 창 내 최대 `battlesPerInterval`회 허용 |
| 보급 가산(선택 구현) | aggressive 시 방어측 supply powerMul에 `supplyBonusMulAggressive` 추가 가산, **기존 `supplyBonusCapPct` 캡 초과 금지** |
| battle 가중치 가산(선택 구현) | aggressive 시 `battleWeightPct`에 `battleWeightBonusPctAggressive`(CSV, 작은 값) 가산 |
| 정책 CSV | `tables/balance/arc_core_front_pressure_policy.csv` — 기존 `arc_core_territorial_combat_policy.csv` 수치는 무단 변경하지 않음(신규 레버는 front_pressure CSV에만) |
| purge | 월드 축(ArcCore 환경) — 계정 초기화 대상 **아님** |

---

## 4. 코드 위치

| 모듈 | 경로 |
|------|------|
| 정책 로더 | `src/arcCore/territorial/arcCoreFrontPressurePolicy.ts` |
| FrontPressure 계산·캐시 | `src/arcCore/territorial/frontPressureIndex.ts` |
| 빈도 상태(윈도우 카운터) | `src/arcCore/territorial/arcCoreTerritorialCombatState.ts` (`isTerritorialPassDueForPlanet`) |
| 배선 | `src/arcCore/territorial/runTerritorialCombatPass.ts` |
| invalidate 호출부 | `src/store/clanWarFoundationStore.ts` (`applyArcCoreTerritorialHold`·`claimPlanetOwnershipByPurchase`) |
| CSV | `tables/balance/arc_core_front_pressure_policy.csv` |
| 테스트 | `src/arcCore/territorial/frontPressureIndex.test.ts` · `territorialSupplyLine.test.ts`(M0 보급mul 시나리오 추가) |

---

## 5. 이번에 하지 않은 것

- 캠페인 그룹(`draco_front` 등) 자체의 「그룹 interval당 슬롯 2배」 확장 — 캠페인 로테이션은 성계 단위 카운터와 별개 메커니즘이라 이번 범위에서는 손대지 않음(캠페인에 속하지 않는 일반 정책 행에만 적용).
- M7(1홉 AttackEligibilityResolver stub) — 선택 항목, 이번 스프린트에서는 미착수.
- `ArcCoreAttackSubCore.onWallTick` 활성화 — 여전히 미정의(inert 유지).

---

## 6. 관련 문서

| 문서 | 관계 |
|------|------|
| `ARC_CORE_TACTICAL_AUTOMATION_AND_GALAXY_STRATEGY.md` | Phase 0~6 전체 로드맵 — 본 문서는 그중 Phase 0+1(FrontPressure)의 실제 구현 기록 |
| `tools/kim-team-lead/reports/kim-claude-ready-front-pressure-tactics.md` | 착수 지시 원본 |
