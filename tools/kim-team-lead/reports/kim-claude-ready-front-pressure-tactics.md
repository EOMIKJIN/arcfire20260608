# 김클로드 착수 — 전선 압박(FrontPressure) · 공격 전술 자동 전환

> **배정**: 김팀장 (Cursor 본창) · **2026-07-26** · 대표님 지시: **김클로드가 개발**  
> **검토 결론**: 가능·효율적 — 보급→전투 mul은 기존 배선 있음 · 갭은 **구조→자세→빈도**  
> **교차**: `docs/strategy/ARC_CORE_TACTICAL_AUTOMATION_AND_GALAXY_STRATEGY.md` · `src/arcCore/territorial/*`  
> **완료 후**: `kim-claude-handoff-pending.md` 상단 **PENDING** · **git commit 금지**  
> **task_id**: `front-pressure-tactics-20260726`

---

## [pss-pre-dev] (코딩 전 필수)

```text
[pss-pre-dev] hot_path=holds변경1회·territorial_pass게이트 · alloc=틱당금지·dirty성계만 · cache=FrontPressure_O1_Map
[pss-pre-dev] stage=월드축(ArcCore)·purge분류명시 · risk=P1(틱금지)·P3(holds invalidate)
[pss-pre-dev] verdict=PASS — 60s probe에서 전은하 재스캔 금지·자세는 이벤트 재계산만
```

---

## 0. 시나리오 (대표님 · 드라코 전선)

| 위치 | 성계 | 점유 | 의미 |
|------|------|------|------|
| 좌(연결) | `vega_outpost` / `vega_base` | BLUE(스텔리움) | 아군 거점 |
| 축 | `draco_nebula` | 분쟁/가변 | 전선 |
| 우(연결) | `sirius` / `sirius_border` | **플레이어 독립국(INDEPENDENT)** | 압박 대상 |
| 상(연결) | `perseus` | RED · 동팩션 보급 | 적 거점 |

시리우스 인접: `draco_nebula` · `perseus` · `crimson_zone` — 적대 이웃 ≥2면 **flanked/aggressive** 후보.  
**행성 id 하드코딩으로 전술 분기 금지** — 일반 그래프+holds 식으로 시리우스 시나리오가 **자연히** 걸리게 할 것.

---

## 1. 범위 / 비범위

### ✅ 이번 구현 (김클로드 · Phase 0+1)

| # | 축 | 요약 |
|---|-----|------|
| M0 | 검증 | 보급 mul이 독립국·다인접 시나리오에서 quick combat에 실제로 곱해지는지 unit/로그 확인·갭 수정 |
| M1 | Table-First | `tables/balance/arc_core_front_pressure_policy.csv` (+ build) |
| M2 | FrontPressure | `hostileNeighborCount` · `friendlySupplyCount` · posture `defensive\|normal\|aggressive` |
| M3 | Invalidate | `planet_holds`/점유 변경 시에만 재계산 (probe 전량 스캔 금지) |
| M4 | 빈도 | aggressive 시 **동일 passInterval 창에서 전투 판정 최대 2회** (`battlesPerInterval`) — 「시간당 1→2」 |
| M5 | 보급 연동 | 기존 `resolveTerritorialSupplyContext` 유지·누락 경로 보강 · (선택) aggressive 시 bonus 캡/배율 CSV |
| M6 | 문서 1페이지 | `docs/strategy/` 또는 territorial README에 자세·빈도 계약 요약 |

### ❌ 이번 금지

- STAGE `useWaveDefenseController` 주기 개편(착륙 웨이브 ≠ 접전 pass)
- 신규 SubCore 등록 · Attack `onWallTick` 활성
- 전성계 eligibility 전면(strategy Phase 풀구현) — **M7 선택만**
- 매 60s 전은하 holds 순회
- git commit / 「완료」선언
- 시리우스·드라코 **if (planetId===…)** 하드코딩 전술

### ⭕ 선택 (시간 되면 · 없으면 handoff에 명시)

| M7 | 1홉 AttackEligibility stub — aggressive 성계에서만 인접 적 거점 후보 가산 (기존 `listAdjacentSystemIds`) |

---

## 2. M1 — CSV (Table-First)

`tables/balance/arc_core_front_pressure_policy.csv` (컬럼 가칭 · 합의 후 고정):

| 컬럼 | 예 | 의미 |
|------|-----|------|
| `policyId` | `default_v1` | |
| `hostileNeighborMinAggressive` | `2` | 이 이상이면 aggressive |
| `hostileNeighborMinFlanked` | `3` | (로그/UI용 플래그) |
| `battlesPerIntervalNormal` | `1` | |
| `battlesPerIntervalAggressive` | `2` | **요청 1항** |
| `passIntervalMulAggressive` | `1` | 1 유지 권장(빈도만 2회). 0.5는 이중 적용 주의 |
| `supplyBonusMulAggressive` | `1.0`~`1.15` | 캡은 기존 `supplyBonusCapPct` 존중 |
| `battleWeightBonusPctAggressive` | `0`~`8` | 공세 시 battle 가중(상한 명시) |
| `notesKo` | | |

`npm run build:balance-tables` (프로젝트 관례에 맞춤) → generated + policy loader O(1).

기존 `arc_core_territorial_combat_policy.csv`의 `passIntervalSec` / supply 컬럼 **기존값 무단 변경 금지** (기존값 재확인 규칙). 새 레버는 front_pressure CSV에만.

---

## 3. M2~M3 — FrontPressure 모듈

경로 제안: `src/arcCore/tactical/frontPressureIndex.ts` (또는 `territorial/frontPressureIndex.ts`)

```ts
// 개념 API
type FrontPosture = 'defensive' | 'normal' | 'aggressive';
type FrontPressureSnapshot = {
  systemId: string;
  hostileNeighborCount: number;
  friendlySupplyCount: number;
  posture: FrontPosture;
  battlesPerInterval: number;
};

recomputeFrontPressureForSystem(systemId, holds): FrontPressureSnapshot
invalidateFrontPressure(systemIds?: string[]): void  // holds 변경 시
getFrontPressure(systemId): FrontPressureSnapshot     // 캐시 히트
```

재사용:

- `listAdjacentSystemIds` (`territorialSupplyLine.ts`)
- `resolveHoldFactionSide` / `getFactionRelation` / `hasAdjacentHostileFactionSystem`
- `countAdjacentFriendlySystems`

**Invalidate 배선**: `clanWarFoundationStore` 또는 holds 적용 경로(`applyArcCoreTerritorialHold` 등)에서 **변경된 systemId(+인접)** 만 invalidate.  
probe/`runTerritorialCombatPass` 입구에서 **캐시 miss일 때만** 재계산.

월드 축: 계정 purge 대상 **아님**(ArcCore 환경). 주석으로 분류 명시.

---

## 4. M4 — 시간당 2회 (접전 pass)

현행:

- `passIntervalSec` 동안 planet/campaign **lastPass**로 1회 게이트 (`arcCoreTerritorialCombatState.ts` · `runTerritorialCombatPass.ts`)

목표 (aggressive인 **대상 성계/행성**):

- 같은 `passIntervalSec` 창에서 **최대 `battlesPerIntervalAggressive`(2)회** 전투 판정 허용
- 구현 권장: `passCountInWindow` 또는 `lastPassAtMs[]` bounded(길이≤2) — unbounded 배열 금지
- campaign `draco_front` 순차 로직과 충돌 시:  
  - **우선** 행성별 interval 카운터에 battlesPerInterval 적용  
  - 캠페인 그룹이 있으면 「그룹 interval당 처리 슬롯」을 posture에 따라 1→2로 늘리는 쪽이 단순하면 그 1안만

STAGE 웨이브 디펜스(`WAVE_DEFENSE_*`) **손대지 말 것**.

---

## 5. M0·M5 — 보급이 전투에 유리하게

이미 `resolveTerritorialQuickCombat({ attackerSupplyMul, defenderSupplyMul })` 경로 존재.

의무:

1. 독립국 방어 경로·일반 blue_red 경로 모두 supply 전달되는지 재확인 (누락 시 패치)
2. 단위 테스트 추가/확장 (`territorialSupplyLine.test.ts` 패턴):  
   - 시리우스형: INDEPENDENT 방어 + 인접 RED≥2 + 인접 friendly 0 → defender mul &lt; 1 (고립)  
   - 공격자 RED가 perseus 등 동팩션 인접 있으면 attacker mul ≥ 1  
3. aggressive 시 `supplyBonusMulAggressive`는 **cap 내에서만** 추가 가산(기존값 덮어쓰기 금지)

---

## 6. M6 — 문서

`docs/strategy/FRONT_PRESSURE_TACTICS_v0.md` (짧게):

- 용어: FrontPressure · posture · battlesPerInterval  
- 시리우스 시나리오 예시 표  
- STAGE 웨이브와 비동일 명시  
- strategy 본문서 Phase와 연결

---

## 7. Self-check

```bash
npx tsc --noEmit -p tsconfig.client.json
npm run audit:memory:all
# balance CSV build
npm run build:balance-tables
# 관련 테스트
npx tsx --test src/arcCore/territorial/territorialSupplyLine.test.ts
# FrontPressure 테스트 신규 시 동일 실행
```

handoff 기록:

- 변경 파일 · posture 임계 · battlesPerInterval 동작  
- invalidate 호출 지점  
- `[pss-pre-dev]` 3줄  
- M7 했는지 여부  
- 시리우스 id 하드코딩 없음 확인

---

## 8. 완료 시 김클로드

1. `kim-claude-handoff-pending.md` 맨 위 **PENDING**  
2. `task_id=front-pressure-tactics-20260726` · ready = 본 파일  
3. 대표님께 **김팀장 검수 요청**  
4. **commit 금지**

---

## 9. 김팀장 검수 포인트

- holds 변경 때만 재계산 · probe 전량 스캔 없음  
- aggressive → interval당 2회  
- supply mul 전투 반영 + 테스트  
- 기존 territorial policy 숫자 무단 변경 없음  
- tsc · audit:memory:all PASS
