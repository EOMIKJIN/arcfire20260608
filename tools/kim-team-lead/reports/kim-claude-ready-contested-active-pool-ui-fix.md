# 김클로드 착수 — 분쟁 ActivePool·UI 정합 수정 (SAFE 제외 · min8 외곽 중립 우선)

> **배정**: 김팀장 (Cursor 본창) · **2026-07-31**  
> **대표님 지시**:  
> - 레드(우군)로 완포위된 후방(예: 섀도우 넥서스)은 **분쟁지역에서 제외**되어야 함  
> - min 8 부족분은 **외곽 중립지역을 분쟁지역화**하여 채움  
> - 국경 변동 시 분쟁지역이 **추가·삭제**되어야 함 (판정 스킵만으로는 부족)  
> **선행 분석**: 김팀장 2026-07-31 — 전투 판정 SAFE 스킵은 PASS, **목록·지도 표기 삭제 FAIL**, min8 승격이 `iron_remnant`(BLUE 점유)를 중립보다 우선 → 제품 의도 FAIL  
> **김클로드 즉시 착수** · 완료 후 `kim-claude-handoff-pending.md` **PENDING** · **git commit 금지**  
> **task_id**: `contested-active-pool-ui-fix-20260731`  
> **선행 task**: `contested-eligibility-pool-governor-20260731` (부분 성공 — 본 task가 제품 정합 완성)

---

## [pss-pre-dev]

```text
[pss-pre-dev] hot_path=territorial dirty rebalance 1회 · ActivePool revision 캐시 · alloc=후보 bounded
[pss-pre-dev] stage=arcCore territorial + worldmap preview 읽기만 · Skia 무관 · risk=P1·P6
[pss-pre-dev] verdict=PASS — onBoot 동기 전수 금지 · CSV 정적 행 파일 삭제 금지 · suspend/ActivePool 필터만
```

---

## 0. 개선 가능 여부

**가능.** 구조 변경은 중간 규모이나 기존 Eligibility·거버너·dynamic store 위에 얹으면 됨.

| 결함 | 현재 | 목표 |
|------|------|------|
| SAFE 섀도우 | 판정만 스킵 · CSV·캠페인·지도에 **잔류** | ActivePool에서 **제외** · 지도 링 **미표시** · 로테이션 **미포함** |
| min8 보충 | FRONT(+100) > 중립(+60) → `iron_remnant` 먼저 | **외곽 NEUTRAL 우선** (`eligible_strategic_neutral` 최우선) |
| 후보 우주 | `planet_occupation_seeds`만 | **해금된 성계**(코어+unlocked synth) 포함 |
| 정본 | CSV ∪ dynamic − (런타임 스킵) | **단일 ActiveContestedPool** = 정책/지도/커서 공통 |

---

## 1. 실측 근거 (수정 필수)

```text
10:47~17:27  shadow_market SAFE(완포위) 스킵 — 판정 0회   ← 전투만 제외
08:32        풀 거버너 승격: iron_remnant eligible_front     ← 점유 전선 우선(의도 위반)
08:32/08:35  eternal_throne / genesis_origin strategic_neutral
```

`resolveContestedZonePreviewSystemIds` / `listTerritorialCombatPoliciesForCampaign`이 SAFE를 걸러내지 않음.

---

## 2. 제품 1안 (고정)

1. **SAFE_HINTERLAND** = 분쟁지역 **아님** (반란만).  
2. ActivePool·캠페인 due·지도 예고 링 = **동일 Active 집합**.  
3. min8 부족 시 promote 우선순위:  
   - **1순위** `eligible_strategic_neutral` (외곽/국경 인접 중립)  
   - **2순위** `eligible_front` (맞닿은 전선 — 이미 점유된 후방 블루/레드 행성보다 중립 우선)  
   - **3순위** `eligible_independent_front`  
4. CSV 정적 행 **파일 삭제 금지** — `runtimeSuspended` / Active 필터로만 제외.  
5. 점유 BLUE/RED 성계를 min8 “땜빵”으로 올리는 것은 **금지에 가깝게** — 전선 FRONT라도 **NEUTRAL 후보가 있으면 중립만** 승격.  
6. stepMax≤2 · pool 8~12 · dirty 재마킹(미달 시) 유지.

---

## 3. 범위 (M0~M6)

### ✅ 김클로드

| # | 내용 |
|---|------|
| **M0** | 소비처 표: policy list · campaign due · preview UI · governor sync · dynamic store. |
| **M1** | **ActiveContestedPool API** (신규 또는 기존 확장): `listActiveContestedPolicies()` / `listActiveContestedSystemIds()` = enabled·contested ∩ **NOT SAFE**. CSV 정적 SAFE도 여기서 제외. |
| **M2** | `listTerritorialCombatPoliciesForCampaign` · `resolveContestedZonePreviewSystemIds` · (해당 시) `isContestedZoneSystemId`가 **Active만** 사용. 지도에서 섀도우 SAFE면 링 0. |
| **M3** | 캠페인 due: SAFE면 스킵뿐 아니라 **Active 목록에 애초에 없음**이 정본. 기존 skip 루프는 안전망으로 유지 가능. |
| **M4** | **min8 스코어 개정**: `strategic_neutral` ≥ 120 (또는 FRONT보다 높게). FRONT는 min 보충 후보에서 **NEUTRAL 없을 때만**. 단위테스트: N=5·섀도우 SAFE·중립 후보 있음 → promote에 `iron_remnant` **없어야** 함 · 중립만. |
| **M5** | 후보 우주: occupation seeds **+** worldStore 해금 synth(가능하면). 엔드존 블랙리스트 유지 시 CSV/상수로. |
| **M6** | 테스트 + tsc + 기존 territorial 회귀 · handoff PENDING. 실기 soft: 섀도우 링 소멸 · min8 중립 승격 로그. |

### ❌ 금지

- `arc_core_territorial_combat_policy.csv` 정적 5행 **삭제·combatMode/가중치 무단 변경**  
- 반란 패스 변경 · Skia · onBoot 전은하 동기 스캔  
- **git commit / 완료 선언**

---

## 4. 권장 파일

| 파일 | 역할 |
|------|------|
| `contestedEligibility.ts` / `contestedPoolGovernor.ts` | 스코어·Active 정의 |
| `contestedPoolGovernorSync.ts` | 후보 우주·promote 소스 |
| `arcCoreTerritorialCombatPolicy.ts` | Active 필터 API |
| `resolveContestedZonePreviewSystemIds.ts` | 지도 링 = Active만 |
| `runTerritorialCombatPass.ts` | due가 Active 목록 기준 |
| `dynamicContestedZoneStore.ts` | suspend 목록(정적 SAFE) 필요 시 |
| `*.test.ts` | 섀도우 Active 제외 · min8 중립 우선 |

---

## 5. DoD

1. `shadow_market` SAFE일 때: ActivePool·캠페인·`resolveContestedZonePreviewSystemIds`에 **미포함**.  
2. min8 부족 + 중립 후보 존재 → promote에 **점유 FRONT(iron 등) 없음**.  
3. N∈[8,12], step≤2, dirty 미달 재마킹 유지.  
4. CSV 정적 파일 행 유지.  
5. tsc + unit PASS.  
6. handoff PENDING + `[pss-pre-dev]` 3줄.

---

## 6. 김클로드 붙여넣기

```text
@김클로드 tools/kim-team-lead/reports/kim-claude-ready-contested-active-pool-ui-fix.md 를 읽고
task_id=contested-active-pool-ui-fix-20260731 구현해.
핵심: SAFE(섀도우 등)는 판정 스킵만이 아니라 ActivePool·지도 링·캠페인에서 제외.
min8 부족분은 외곽 중립(eligible_strategic_neutral) 우선 — iron_remnant 같은 점유 FRONT로 땜빵 금지.
CSV 정적행 파일 삭제 금지. 커밋 금지.
완료 후 kim-claude-handoff-pending.md PENDING + [pss-pre-dev]. 김팀장 검수 요청.
```
