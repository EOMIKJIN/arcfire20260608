# 김클로드 착수 — 분쟁지역 Eligibility · 풀 거버너 (A안 · min=8 자동 채움)

> **배정**: 김팀장 (Cursor 본창) · **2026-07-31**  
> **대표님 지시**:  
> - 우군으로 **완전 포위**된 분쟁성계(예: 섀도우 넥서스=레드 완포위)는 **반란 외 분쟁 판정 제외**  
> - 빈 자리를 **적·아군 맞닿은 전선** · **전략적 불리 중립**으로 채움  
> - 활성 분쟁 풀 크기 **min 8 ~ max 12**, 1회 조정 **±1~2**  
> - **A안 확정**: 시드 정적 분쟁이 5여도 **런타임이 전선에서 자동으로 8까지 채움**  
> **선행 설계**: 김팀장 2026-07-31 설계(대화) — 코드 미착수  
> **김클로드 즉시 착수** · 완료 후 `kim-claude-handoff-pending.md` **PENDING** · **git commit 금지**  
> **task_id**: `contested-eligibility-pool-governor-20260731`

---

## [pss-pre-dev]

```text
[pss-pre-dev] hot_path=territorial rebalance(캠페인1바퀴·hold변경 dirty) 1회 · alloc=후보스코어 bounded · cache=revision+adjacency
[pss-pre-dev] stage=arcCore territorial only · Skia/UI 무관 · risk=P1(빈도)·P6(persist coalesce)
[pss-pre-dev] verdict=PASS — onBoot 동기 전은하 스캔 금지 · SAFE 스킵+거버너만 · 기존 pass 스택 유지
```

---

## 0. 제품 1안 (고정 · A안)

| 축 | 규칙 |
|----|------|
| **SAFE_HINTERLAND** | `hold ∈ {BLUE,RED}` AND 1홉 **적대 팩션 인접=0** → 분쟁 로테이션 **제외**(반란 패스 유지) |
| **ELIGIBLE** | NOT SAFE AND (`adjBlue&&adjRed` OR 전략 중립 한쪽만 인접 OR 독립국+적대 인접) |
| **풀 크기** | `N ∈ [8, 12]` — **A안: N&lt;8이면 전선 후보에서 자동 promote로 8까지** |
| **1회 step** | demote+promote 합 **≤2** |
| **반란** | `runPlanetRebellionResolutionDailyPass` **손대지 않음** |
| **CSV 정적 행** | `arc_core_territorial_combat_policy.csv` **삭제·combatMode/가중치 무단 변경 금지** — 런타임 suspend/오버레이만 |

### INDEPENDENT 적대 판정

`tables/balance/faction_political_relations.csv` 정본:

- RED↔INDEPENDENT=`hostile` → RED hold + 독립국 인접만 있어도 **NOT SAFE**(전선 유지 가능)
- BLUE↔INDEPENDENT=`ally` → BLUE hold + 독립국만 인접이면 **SAFE 가능**(적대 팩션 없을 때)

하드코딩 금지 — relations 로더 재사용.

---

## 1. 현황 (반드시 이해할 것)

| 경로 | 역할 |
|------|------|
| `tables/balance/arc_core_territorial_combat_policy.csv` | 정적 분쟁 5 + `__dynamic_default__` 템플릿 |
| `src/arcCore/territorial/dynamicContestedZoneStore.ts` | 플레이어 웨이브 **편입만**(강등·전선 자동 채움 **없음**) |
| `src/arcCore/territorial/territorialCombatGraph.ts` | `resolveAdjacentSystemFactionPresence(holds)` |
| `src/arcCore/territorial/arcCoreTerritorialCombatPolicy.ts` | `listTerritorialCombatPoliciesForCampaign` |
| `src/arcCore/territorial/arcCoreTerritorialCombatState.ts` | 캠페인 순차 due |
| `src/arcCore/territorial/runTerritorialCombatPass.ts` | 판정 스택 — **내부 P0/R1/전술역전 로직 변경 최소화** |
| `docs/strategy/ARC_CORE_TACTICAL_AUTOMATION_AND_GALAXY_STRATEGY.md` §6-3 | 스택 실행 정본 |

**결함**: 섀도우가 레드 완포위여도 CSV `contestedZone=true`라 **20분 순차에 계속 들어감**.

---

## 2. 범위 (M0~M7)

### ✅ 김클로드

| # | 내용 |
|---|------|
| **M0** | 소비처 표 1장(handoff): policy list · campaign state · dynamic store · probe/pass 진입점 · purge. 전 repo 스캔 금지. |
| **M1** | 순수 함수 `classifyContestedEligibility({ planetId, systemId, holdSide, holds })` → `safe_hinterland` \| `eligible_front` \| `eligible_strategic_neutral` \| `eligible_independent_front` \| `ineligible`. 단위테스트: **섀도우 RED 완포위 → safe**. |
| **M2** | **게이트**: 캠페인 due 행성/로테이션 목록에서 SAFE면 **스킵**(판정 0회). CSV 행은 유지, runtime suspended 또는 ActivePool 필터. |
| **M3** | **풀 거버너**: ActivePool = (CSV contested ∪ dynamic) − SAFE. `N<8` → promote로 8 채움(A안). `N>12` → 전선점수 낮은 것부터 demote. 1회 step≤2. |
| **M4** | **Promote 선택**: 점수 — FRONT(`adjBlue&&adjRed`)+100 · STRATEGIC_NEUTRAL(한쪽만)+60 · Active 1홉 연속+15 · 플레이어 최근 전투+10. 동점 결정적(systemId). 템플릿 `__dynamic_default__`로 정책 합성. `source` 태그: `arc_frontline` / `arc_strategic_neutral`(플레이어 `player_wave*`와 구분). |
| **M5** | **Demote**: SAFE 지속 → Active 제외. CSV 정적은 **삭제 금지·suspend만**. 동적(`arc_*`·player)은 store remove. **쿨다운**(권장 2 캠페인 바퀴)으로 채터링 방지. |
| **M6** | **주기**: onBoot **동기 전수 금지**. hold 변경 dirty 또는 캠페인 1바퀴 후 1회 rebalance. persist coalesce. 월드축 권장 — **account purge 시 `arc_frontline` 편입은 유지**, `player_wave*`만 기존대로 purge(기존 `resetDynamicContestedZonesForAccountPurge` 계약 문서화). |
| **M7** | 단위테스트 + `tsc -p tsconfig.client.json` + 기존 territorial 테스트 회귀(geoFlank·stackConsistency·effectiveMode·seed dynamic) PASS · handoff PENDING |

### combatMode (신규 promote)

| 상황 | 초기 mode |
|------|-----------|
| adjBlue && adjRed | `blue_red` |
| NEUTRAL + RED만 | `red_neutral` (dominant 템플릿 70%) |
| NEUTRAL + BLUE만 | `blue_neutral` |
| 기타 | 템플릿 `blue_red` |

이후 NEUTRAL은 기존 `resolveEffectiveTerritorialCombatMode` P0가 덮어씀 — **추가 밸런스 곡선 금지**.

### ❌ 김클로드 금지

- CSV `battleWeightPct` / `passIntervalSec` / 기존 5행 `combatMode` **무단 변경**
- 반란 배율·정치관계 CSV 값 변경(읽기만)
- Skia / worldmap UI 대규모 / `onSnapshot` / 틱 신규 루프
- onBoot에서 전 행성 O(N) 동기 rebalance
- **git commit / 「완료」 선언**

### 기존값 변경

- 정적 분쟁 CSV 수치 **변경 없음**(suspend는 런타임).  
- 신규 balance CSV(풀 min/max/step) **추가만** 허용 — 기존 키 overwrite 금지.  
- 추가 시 `npm run build:balance-tables`(또는 프로젝트 관례 빌드) 후 generated 커밋은 **김팀장**.

---

## 3. 권장 파일 (힌트 · 강제 아님)

| 신규/확장 | 역할 |
|-----------|------|
| `src/arcCore/territorial/contestedEligibility.ts` (신규) | classify · score · rebalance 순수 로직 |
| `src/arcCore/territorial/contestedEligibility.test.ts` | M1·SAFE·min8·max12 |
| `tables/balance/arc_core_contested_pool_policy.csv` (신규) | `contested_pool_min=8`, `max=12`, `step_max=2`, cooldown 등 |
| `dynamicContestedZoneStore.ts` 확장 또는 형제 스토어 | `source`·suspend 목록·revision |
| `arcCoreTerritorialCombatPolicy.ts` | ActivePool 필터 연동 |
| `arcCoreTerritorialCombatState.ts` / `runTerritorialCombatPass.ts` | SAFE 스킵 · dirty 후 rebalance 트리거(최소) |

캠페인 cursor: 강등/스킵 시 **다음 ELIGIBLE로 진행**(빈 슬롯에서 정지 금지).

---

## 4. 수용 기준 (DoD)

1. 섀도우 RED 완포위 → 로테이션 **스킵/강등**, territorial battle 로그 없음(반란은 별개).  
2. 부트 후(지연 rebalance) ActivePool **N≥8**(A안) · 항상 **N≤12**.  
3. 1회 rebalance promote+demote **≤2**.  
4. CSV 정적 5행 **파일상 유지**.  
5. 기존 territorial unit 테스트 회귀 PASS + 신규 eligibility 테스트.  
6. `tsc --noEmit -p tsconfig.client.json` PASS.  
7. handoff에 `[pss-pre-dev]` 3줄 · 변경 파일 · self-check · **status=PENDING**.

---

## 5. 김클로드 붙여넣기 지시문

```text
@김클로드 tools/kim-team-lead/reports/kim-claude-ready-contested-eligibility-pool-governor.md 를 읽고
task_id=contested-eligibility-pool-governor-20260731 구현해.
대표님 A안: SAFE 완포위는 분쟁 제외, 풀 min8~max12, 런타임이 전선에서 8까지 자동 채움, 1회 ±1~2.
CSV 정적 분쟁 행 삭제·전투가중치 변경 금지. onBoot 동기 전수 금지. 커밋 금지.
완료 후 kim-claude-handoff-pending.md 상단 PENDING + [pss-pre-dev] 3줄. 김팀장 검수 요청.
```

---

## 6. 김팀장 검수 체크 (완료 후)

- [ ] SAFE 섀도우 스킵 단위테스트  
- [ ] N∈[8,12] · step≤2  
- [ ] CSV 정적 5행·omega R1·geoFlank 회귀  
- [ ] purge: player_wave만 리셋 / arc_frontline 월드축  
- [ ] tsc · territorial 테스트  
- [ ] verdict → REVIEWED (커밋은 대표님 지시 시)
