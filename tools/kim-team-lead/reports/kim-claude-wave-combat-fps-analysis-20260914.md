# 웨이브 전투 FPS 저하 — 김클로드 독립 재검수 (분석 전용, 패치 없음)

```text
status=ANALYSIS_ONLY
task_id=wave-combat-fps-analysis-20260914
kind=RE_VERIFICATION (CLAUDE.md 「김팀장 지시 재검수」)
code_changes=NO
commit=FORBIDDEN
author=김클로드 (Claude Sonnet 4.6 via Cursor)
date=2026-09-14
session=2차 (1차 미완 보완·확장판)
```

```text
[pss-pre-dev] hot_path=조사만 — 코드 읽기 + git diff/stat + npx tsx 실행만, 런타임 삽입 없음
[pss-pre-dev] alloc=신규 없음 (분석 전용)
[pss-pre-dev] cache=신규 없음
[pss-pre-dev] stage=해당 없음 (분석 전용)
[pss-pre-dev] risk=P0(원인 특정 전) — 패치는 다음 턴
[pss-pre-dev] verdict=PASS — 분석 전용, 코드 무변경
```

---

## 0. 결론 먼저

**김팀장 §1-3(Type C 적 로드아웃이 특수FX AoE 로켓을 확정 장착)을 AGREE — 폴백 경로 직접 추적으로 확정도 한 단계 높였다.** 추가로 `git show HEAD:capitalWeaponImpact.ts` 직접 비교로 HEAD→working tree 변경점을 명확히 분리했으며, `npx tsx` 실측으로 L1/L2/L5 A/B/C 전 패턴을 확인해 §1-6을 실데이터로 완성했다.

**§1-5(근접 8연사 신규 여부) — DISAGREE 확정**: `git diff HEAD -- src/game/combatWeaponSlots.ts` 출력 없음으로 완전히 닫았다.

---

## 1. 김팀장 §1 항목별 재검수

### 1-1. 플레이어 기본무기 → 특수FX/크래프트 기각 — **AGREE**

`weapon_special_fx_policy.csv` 생성 TS(`csvWeaponSpecialFxPolicy.ts`) 34행 전체를 대조:
- `w_laser_heavy_01` → 행 없음
- `w_missile_guided_triple_01` → 행 없음
- `w_missile_arc_005` → 행 없음 (closeRange 기본무기)

세 종 모두 `familyKind: laser` 또는 `missile`이므로 `isCraftFamilyWeapon` 경로에 안 걸리고 `capitalCraftPool` 스폰 없음. **기각 근거 충분.**

단, `tickPlayerAutoCombatSkills`는 `playerAgent?.alive` 게이트만 있어 무조건 호출됨(§1-4 참조). 스킬 0개 시 비용 아래 상세.

---

### 1-2/1-3. Type C 로드아웃 + `w_laser_arc_012` 특수FX — **AGREE (근거 심화)**

**코드 직접 추적:**
`hostileEnemyWeaponLoadoutFromBalance.ts:129-142` — Type C (pattern=2):
```typescript
laserWeaponId: pickHostileWeaponByFamily(
  'rocket',
  level,
  policyWeaponId('type_c_rocket_weapon_id', 'w_laser_arc_012'),  // ← L1 폴백
),
```

`pickHostileWeaponByFamily(63-81)` 동작 추적:
- `requiredLevel <= cap`인 rocket이 **하나도 없으면** `bestId`가 초기 `fallbackWeaponId` 그대로 반환
- Rocket 패밀리 requiredLevel 목록: `w_missile_arc_005`=L2, `w_laser_arc_007`=L4, `w_laser_arc_012`=L6 (나머지 비슷)
- **L1 cap=1에서 rocket requiredLevel≤1은 존재 안 함 → 커브 매칭 자체가 안 되고 폴백 `w_laser_arc_012`가 100% 확정**

**npx tsx 실측 (L1/L2/L5):**

| 레벨 | 패턴 | laserWeaponId (requiredLv) | missileWeaponId (requiredLv) |
|------|------|---------------------------|------------------------------|
| **L1** | A | `w_laser_light_01` (L1, 레이저, 무FX) | `w_laser_arc_007` (L4, 로켓10연사, **무FX**) |
| **L1** | B | `w_laser_light_01` (L1, 레이저, 무FX) | `w_missile_standard_01` (L1, 미사일, 무FX) |
| **L1** | C | **`w_laser_arc_012`** (L6, 로켓→레이저슬롯, **second_burst AoE**) | `w_missile_standard_01` (L1, 미사일, 무FX) |
| L2 | C | `w_missile_arc_005` (L2, 로켓→레이저슬롯, **무FX**) | `w_missile_standard_01` (L1) |
| **L5** | A | **`w_laser_arc_011`** (L5, cutting beam, **FX markMs=800**) | `w_laser_arc_007` (L4, 로켓10연사, 무FX) |
| **L5** | B | **`w_laser_arc_011`** (L5, cutting beam, **FX**) | **`w_missile_arc_009`** (L4, 파편, **AoE 36px**) |
| **L5** | C | `w_laser_arc_007` (L4, 로켓→레이저슬롯, 무FX) | **`w_missile_arc_009`** (L4, 파편, **AoE 36px**) |

**`w_laser_arc_012` FX 정책 (`csvWeaponSpecialFxPolicy.ts` 확인):**
- `profileId: "second_burst"`, `aoeRadiusPx: 24`, `markMs: 800`, `tintHex: "#F97316"`, `iconKind: "shard"`

**레이저 슬롯 발사 경로 (`PlanetEdenRaidTestLayer.tsx:3444-3503` 확인):**
- 레이저는 즉시 1회 타격(프로젝타일 없음)
- **HEAD vs 현재 diff 확인**: `git show HEAD:PlanetEdenRaidTestLayer.tsx`에서 `laserFx`, `applySpecialWeapon*` 검색 → **출력 없음** = HEAD에는 레이저 경로에 FX/AoE 코드가 전혀 없었음
- 현재 working tree:
  ```typescript
  const laserFx = getWeaponSpecialFxPolicy(ag.laserWeaponId);  // NEW
  ...
  if (laserFx) {
    applySpecialWeaponStatusOnAgent(other, laserFx, elapsed);  // NEW: 상태이상(틴트)
    applySpecialWeaponAoeAroundPoint({                          // NEW: O(N) AoE 스캔
      owner: ag, agents, impactPoint: {x: other.x, y: other.y},
      weaponId: ag.laserWeaponId, skipAgentId: other.id, ...
    });
  }
  ```
- **12연사 로켓이 레이저에서 나가지 않는다**: `w_laser_arc_012`의 `salvoCount=12`는 레이저 경로에서 무시됨. 즉시 1타격 후 FX만.

**Type C 레이저 hit당 신규 비용:**
1. `getWeaponSpecialFxPolicy` → O(1) 캐시 (무비용)
2. `applySpecialWeaponStatusOnAgent` → O(1) (틴트/slowMul 설정)
3. `applySpecialWeaponAoeAroundPoint` → **O(N=agents수) 스캔**
   - `aoeRadiusPx=24` 범위 내 적 각각에 `resolveAttackOutcome` + `rollDamage` + `applyIncomingDamage`
4. `statusTintUntilMs = elapsed + 800ms` 설정 → **그 후 800ms 동안 매 프레임 Skia에서 틴트 원 추가 그림**

**결론:** §1-3 AGREE. L1에서 6적 중 2명(Type C × 2)이 레이저 hit마다 O(N) AoE를 트리거 + 800ms 틴트 렌더. **L2에서는 `w_missile_arc_005`(무FX)로 전환되어 오히려 L1보다 싸짐** — 이 점은 §1-6과 연계해 중요.

---

### 1-4. 상시 루프 — **PARTIAL (항목별 세분화)**

| 항목 | 판정 | 근거 (파일:줄) |
|------|------|----------------|
| `tickPlayerAutoCombatSkills` | **AGREE, NEW, but cheap** | `git show HEAD:PlanetEdenRaidTestLayer.tsx`에서 `tickPlayerAutoCombatSkills` 미검색 → HEAD에 없음. 현재 `~3079`에 무조건 호출. `playerAutoCombatSkills.ts` 내부 읽음: 스킬 0개 시 모든 `if (auto.empDrainPct > 0)` 등 조건이 즉시 false → 함수 전체에서 allocations 없음. 10개 비교 정도의 overhead. **단독으론 10fps 설명 불가, 중첩 기여만** |
| `tickCapitalCrafts` 16칸 | **DISAGREE(이번 재현 무관)** | HEAD에 없음(NEW). 단 pool 16슬롯 `if (!c.alive) continue` 16회 = 사실상 0비용. 플레이어/L1적 모두 drone/carrier 없음 → 풀 항상 비어있어 craft 인터셉트 루프도 0비용 |
| `writeCapitalHeavyTurnLaw` per agent | **NEW, negligible** | HEAD에 없음(확인). `capitalHeavyTurnLaw.ts` 읽음: `~8개 산술연산`만, new/alloc 없음. 7에이전트 × 60fps = 420호출/s지만 microsecond 이하 |
| `propagateFleetTempoFromLeads` | **NEW, interval-gated** | HEAD에 없음. 단 `elapsed >= nextTempoJudgeAtRef.current`로 게이팅되어 매 rAF 실행 아님 |
| `agents.filter(a=>a.alive).length` (~3134) | **기존(HEAD에서 확인)** | `git show HEAD:PlanetEdenRaidTestLayer.tsx \| Select-String "agents.filter"` → 검색됨. **김팀장 "신규 아님" AGREE** |
| Skia `statusTint` 원 그리기 (~872) | **NEW 런타임 비용** | HEAD에서 `laserFx`/`applySpecialWeapon*` 없었으므로 statusTintUntilMs가 실제로 설정되지 않았음. working tree에서는 Type C 레이저 hit + AoE hit 이후 800ms동안 **hit된 각 에이전트마다 매 프레임** `draw.circle(ag.x, ag.y, ALLY_MARK_HALF+3.2, ...)` 추가 실행 (`PlanetEdenRaidOrbitSkiaCombat.tsx:870-893`). 2 Type C × 2-5 AoE victims × 800ms = 레이저 1회 hit마다 최대 ~5에이전트 × 800ms × 60fps = **24,000 추가 draw.circle 호출** |
| `resolveCapitalWeaponImpact` 신규 policy 체크 | **NEW, hit-time** | `git show HEAD:capitalWeaponImpact.ts` 확인: HEAD의 `resolveCapitalWeaponImpact`는 nova_aoe/spread_circle/그외 3갈래뿐, policy 조회·AoE 없음. 현재 non-spread 미사일 hit에도 `getWeaponSpecialFxPolicy` + 조건부 `applySpecialWeaponAoeAroundPoint` 추가. L1에서는 Type A/B/C 미사일이 모두 무FX → 추가 비용 없음 |
| HEAD `applySpreadCircleDamage` vs working tree | **기존 spread비용 동일** | HEAD 버전 확인: spread_circle 루프 자체는 있었음(policy 없음). `w_missile_arc_005`(CloseRange, 무FX)는 HEAD와 working tree 모두 policy=null → 동일 비용. `w_laser_arc_007`(Type A 로켓미사일, 무FX)도 동일 |

---

### 1-5. 적 근접 8연사 (`w_missile_arc_005`) — **DISAGREE, 신규 아님 확정**

```powershell
git diff HEAD -- src/game/combatWeaponSlots.ts
# 출력 없음
```
`DEFAULT_CLOSE_RANGE_WEAPON_ID = 'w_missile_arc_005'`는 이번 작업트리에서 한 글자도 변경 안 됨. HEAD부터 있던 기존 상수. 이번 회귀와 무관.

추가 확인: `w_missile_arc_005`는 `csvWeaponSpecialFxPolicy` 행 없음 → `applySpreadCircleDamage`에서 `policy=null` → HEAD와 동일한 O(N) spread 스캔만, 신규 AoE 루프 없음.

---

### 1-6. 후반 행성 (L5+) — **보완: 실측으로 확인**

위 `npx tsx` 실측 결과:

**L5에서의 FX 상황 (매우 심각):**
- **A, B 레이저 = `w_laser_arc_011`** (cutting_beam FX, `tintHex="#F43F5E"`, `markMs=800`) → 6적 중 **4명**(A×2 + B×2)이 레이저 hit마다 `applySpecialWeaponStatusOnAgent` 호출 → 틴트 800ms
  - `aoeRadiusPx=0` → `applySpecialWeaponAoeAroundPoint`는 호출 안 됨 (aoeRadiusPx≤0이면 즉시 return)
- **B, C 미사일 = `w_missile_arc_009`** (shrapnel AoE, `aoeRadiusPx=36`, spread_circle):
  - `applySpreadCircleDamage`: O(N) spread 루프 + **정책 있음** → 각 victim에 `applySpecialWeaponStatusOnAgent`
  - `policy.aoeRadiusPx=36 > spreadR`(resolveRocketImpactHitRadiusPx) 여부 미확인이나, 36px AoE는 spread 반경보다 클 가능성이 높음 → `applySpecialWeaponAoeAroundPoint` **두 번째 O(N) 스캔** 추가
  - 4연사로 추정 → 4 rockets × O(N) × 2(double scan) per volley

**L1 vs L5 비교:**

| 수준 | FX 레이저 | FX 미사일 | 전체 비용 |
|------|-----------|-----------|-----------|
| L1 | 2명 Type C (AoE 24px) | 없음 | 낮음 |
| L2 | **없음** (Type C → w_missile_arc_005 무FX) | 없음 | **더 낮음** |
| L5 | **4명 A+B** (cutting beam 틴트) | **4명 B+C** (shrapnel double scan) | **매우 높음** |

> **대표님께 드리는 질문**: 재현이 아르카디아(L1)였는지, 더 높은 행성에서도 동일하게 느린지 확인 필요. L5+라면 §1-3만으로는 부족하고, `w_missile_arc_009` double scan이 주원인일 수 있음.

---

## 2. 김팀장이 놓친 것 (이번 재검수에서 추가 확인)

### 2-1. Skia 틴트 렌더 per-frame 비용 (NEW 확정)

`PlanetEdenRaidOrbitSkiaCombat.tsx:870-893` 확인:
```typescript
const tinted = tMs < ag.statusTintUntilMs && ag.statusTintHex.length > 0;
...
if (tinted) {
  draw.circle(ag.x, ag.y, ALLY_MARK_HALF + 3.2, hullStroke, 'stroke', 1.35, 0.7);
  // iconKind별 추가 선 그리기
}
```
HEAD에서는 FX가 설정되지 않아 `tinted=false`였음. working tree에서는 AoE 히트 이후 800ms 동안 **피격 에이전트마다 매 프레임** 추가 draw.circle 실행. **이 비용은 hit-time이 아니라 per-frame 연속 비용** → 김팀장이 FX 판정 코스트만 언급하고 **렌더 per-frame 비용을 따로 명시하지 않은 것이 놓친 부분.**

### 2-2. HEAD `capitalWeaponImpact.ts`와 비교 (근거 심화)

`git show HEAD:capitalWeaponImpact.ts` 직접 확인: HEAD `applySpreadCircleDamage`는 policy 조회 없음 → FX 없는 rocket hit에서 추가 비용 없음. 현재 working tree의 추가 비용은 **FX가 있는 rocket hit에서만** 발생. L1 Type A(`w_laser_arc_007`, 무FX)는 HEAD와 동일 비용 — 김팀장이 "이건 HEAD에도 있음"은 CORRECT이지만 "FX rocket에서 double scan 추가"는 미언급.

### 2-3. L2가 L1보다 오히려 싸다 (새 발견)

실측 결과, L2에서 Type C는 `w_missile_arc_005`(무FX)로 전환 → 레이저 AoE 사라짐. **단순히 레벨 올린다고 FPS가 나빠지는 것이 아니라, L1(폴백) → L2(무FX rocket) → L5(FX 다수)의 비선형 패턴**임. 이 점은 재현 행성 특정에 유용.

---

## 3. 원인 순위 (플레이어 기본무기 제약 유지)

**L1(아르카디아) 기준:**
1. **(최유력)** Type C 레이저 `w_laser_arc_012` hit → `applySpecialWeaponAoeAroundPoint` O(N) 신규 추가 + 800ms Skia 틴트 per-frame 비용 → **확정(코드+git 이중 확인)**
2. `tickPlayerAutoCombatSkills` + `writeCapitalHeavyTurnLaw` 등 신규 루프 합산 → 단독으론 작지만 1번과 중첩 기여
3. Skia 틴트 draw.circle per-frame 연속 비용 (1번의 결과, 아직 실기 미측정)

**L5+ 기준:**
1. B+C 미사일 `w_missile_arc_009` double-scan per impact (AoE 36px second pass) → 4명 × salvo 연사 수 × O(N) × 2
2. A+B 레이저 `w_laser_arc_011` → 4명 레이저 hit마다 statusTint, 틴트 per-frame
3. Skia 틴트 agents 수 누적 (최대 6명 동시)

---

## 4. 실기로 가를 질문

1. **재현 행성이 아르카디아(L1)인지, L5+ 행성도 포함인지** — L5+라면 `w_missile_arc_009` double-scan이 추가 원인. L1만이면 §1-3이 전부.
2. **FPS 저하가 교전 직후부터인지, 아니면 첫 Type C 레이저 hit 이후부터 심해지는지** — 틴트 per-frame 비용이 주원인이라면 첫 레이저 AoE 이후 점진적 저하 패턴일 것.

---

## 5. 패치 1안 (제안만 — 구현하지 않음)

**방향 A (최소 범위 · 권장):**
`hostile_enemy_weapon_loadout_policy.csv`에 `type_c_rocket_fallback_weapon_id` **신규 행** 추가 (값=`w_laser_arc_007`, 무FX 로켓). `resolveHostileEnemyWeaponLoadout` Type C 분기에서 rocket 커브 매칭 실패(폴백 발동) 시 FX 없는 ID로 대체. `w_laser_arc_012` CSV 자체는 그대로 유지.
→ **CSV 기존 확정값 변경이 아닌 신규 행 추가**이므로 `arcfire-existing-value-change-confirm.mdc` 재확인 불필요.

**방향 B (더 넓은 수정, 조건부):**
레이저 hit 경로에서 `policy.aoeRadiusPx > 0` 시에만 `applySpecialWeaponAoeAroundPoint` 호출 (현재도 그렇게 되어 있음). 추가로 `applySpecialWeaponAoeAroundPoint` 내 에이전트 스캔을 특수FX 없는 레이저 무기에서는 skip → `laserWeaponId` 슬롯에서 rocket-family FX는 non-AoE 버전 ID 사용 정책으로 정리.

**L5+ 대응 추가:**
`w_missile_arc_009`(shrapnel)의 second-scan (`applySpreadCircleDamage` 내 `if (policy && policy.aoeRadiusPx > spreadR)` 조건)이 실제로 double scan을 유발하는지 `resolveRocketImpactHitRadiusPx('w_missile_arc_009')` vs 36 비교 필요 → 김팀장이 확인 후 필요 시 outer AoE radius cap 적용 검토.

> **기존 CSV 확정값(`second_burst` FX, `w_missile_arc_009` AoE 36 등) 변경 시 `arcfire-existing-value-change-confirm.mdc` 재확인 필요.**

---

## 6. 이번에 하지 않은 것

- 코드·CSV 전부 무변경, git commit 없음
- `src/` · `app/` · `tables/` diff 없음
- 전 repo 스캔 없음 (§2 지정 파일만)
- 패치 구현 없음 — 대표님 승인 후 김팀장

**END** — 2026-09-14 2차 보완판 · 김클로드 재검수

---

## 7. 대표님 정정 · 2026-09-14 00:33 (김팀장 추록)

대표님: 아르카디아는 **블루·전투 없음**. 재현은 **베가 전초기지(`vega_base`)**. **성계와 무관, 전투만 켜지면** 프레임이 좋지 않음.

| 항목 | 값 |
|------|-----|
| 행성 | `vega_base` · 성계 `vega_outpost` |
| targetCombatLevel | **3** |
| 웨이브 | `draco_wave` · 동시 적 3→6→**12** 캡 |

**L3 적 픽 (특수FX 없음):**

| 패턴 | 레이저 | 미사일 |
|------|--------|--------|
| A | `w_laser_arc_004` 무FX | `w_missile_arc_005` 로켓 8 무FX |
| B | `w_laser_arc_004` 무FX | `w_missile_standard_01` 1 무FX |
| C | `w_missile_arc_005` 로켓을 레이저로 무FX | `w_missile_standard_01` 1 무FX |

전원 근접 `w_missile_arc_005` 8연사는 기존값.

**판정 수정:** L1 Type C `w_laser_arc_012` 특수FX는 **이번 재현 축이 아님**(아르카디아 전투 없음). 베가 L3에도 적 특수FX가 없음. 「어느 성계든 전투만 하면 느림」→ **행성 곡선/특수FX가 1순위가 아니라, STAGE3 상시 신규 패키지가 공통 원인.**

### 7-1. 대표님 추가 · 1웨이브부터 저하 (2026-09-14 00:38)

웨이브 1 적함 = **3척** (`waveDefenseEnemyCount`). 6·12척 스케일·후반 FX는 재현에 **필요 없음**.

전투 세션이 켜진 **첫 웨이브부터** 상시 루프(`tickPlayerAutoCombatSkills` · `tickCapitalCrafts` · 착탄 정책 분기 · TestLayer +941)가 돈다. 1안은 웨이브 캡/L1 폴백이 아니라 **전투 rAF 시작 순간부터** 빈 틱·신규 분기를 줄이는 것.

L5+에서는 특수FX가 **위에 겹침**(더 나쁨). 공통 바닥은 상시 루프.

### 7-2. 김팀장 보완 (2026-09-14) — 연출 불변

전수검사 후 **시각·이펙트·무기 정책 CSV는 손대지 않음.** 베가 1웨이브 rAF 할당만 제거.

| 조치 | 파일 | 연출 영향 |
|------|------|-----------|
| 스킬 0이면 `tickPlayerAutoCombatSkills` 생략 | `playerAutoCombatSkills.ts` + TestLayer | 없음 (빈 틱) |
| 크래프트 0이면 틱·요격·`quadBezier` new 생략 | TestLayer | 없음 (베가 기본무기 풀 비어 있음) |
| `agents.filter`/`some` 4회 → 1회 카운트 | TestLayer | 없음 |
| `prevPts` 매 프레임 `{x,y}` new → in-place | TestLayer | 없음 |
| 이동 clamp `{x,y}` 2개/함 → 스칼라 | TestLayer | 궤도 클램프 수식 동일 |

`tsc` PASS · `playerAutoCombatSkills.test.ts` 5 PASS.
