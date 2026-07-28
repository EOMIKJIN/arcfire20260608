# 김클로드 착수 — 헬리오스·타이탄 게이트 지리 우세 점령(전술 고도화)

> **배정**: 김팀장 (Cursor 본창) · **2026-07-28 04:49 KST**  
> **대표님 기획**: 분쟁 전선에서  
> - **헬리오스** — 아이언 크로스(블루) 인접 · 적(레드) 직보급·직공격 축이 약한 지리적 위치 → **블루 우월 점령**  
> - **타이탄 게이트** — 레드 권역(섀도우 넥서스 축) 인접 · 블루 직보급 축이 약한 위치 → **레드 우월 점령**  
> 순차 점령지 결정 시 이 지리 영향이 **높은 가중**으로 반영되도록 전술 고도화.  
> **김팀장 검토 결론**: **REFLECTABLE** (기존 프로세스와 충돌 없음 · Table-First CSV로 반영)  
> **김클로드 즉시 착수** · 완료 후 handoff **PENDING** · **git commit 금지**  
> **task_id**: `geo-flank-helios-titan-occupation-20260728`

---

## [pss-pre-dev]

```text
[pss-pre-dev] hot_path=territorial_pass_1h · alloc=정책Map부트1회 · cache=policy_O1
[pss-pre-dev] stage=arcCore_territorial · risk=P1(틱추가금지)·부트동기패스금지
[pss-pre-dev] verdict=PASS — CSV행추가+로더/캠페인정렬·planetId하드코딩분기금지
```

---

## 0. 김팀장 검토 요약 (코드·기획 정합)

### 0-1. 지리 (systems 연결)

| 성계 | 행성 | 인접(발췌) | 시드 점유 | 기획 우세 |
|------|------|------------|-----------|-----------|
| `helios` | `helios_core` | **iron_cross(BLUE)** · omega · titan · perseus | NEUTRAL | **BLUE** |
| `titan_gate` | `titan_ruins` | iron_cross · omega · helios · **shadow_nexus(RED 분쟁축)** | NEUTRAL | **RED** |

대표님 말씀의 「상대 적국의 직접 공격·보급을 받지 않는 연결」은 **절대 0인접**이 아니라, 전선상 **주력 측방(플랭크) 거점**으로 해석한다(헬리오스=블루 아이언 측방, 타이탄=레드 섀도우 축). 코드에 행성 id 분기 없이 **정책 CSV의 combatMode·우세확률**로 표현한다.

### 0-2. 기존 프로세스 (이미 있는 레버) — **충돌 없음**

| 축 | 현행 | 본 기획과의 관계 |
|----|------|------------------|
| 순차 점령 | `draco_front` · `campaignOrder` · 1h에 1행성 (`arcCoreTerritorialCombatState`) | **동일 캠페인에 행 추가**로 순차 확장 |
| 우세 점령 | `combatMode=blue_neutral`/`red_neutral` + `dominantSideWeightPct`(오메가 70%·섀도우 70%) | **동일 패턴**을 헬리오스/타이탄에 적용 |
| 보급 | `territorialSupplyLine` 1홉 런타임 holds | 유지 — 지리 우세와 **병행**(블루가 아이언 보유 시 헬리오스 보급 가산 등) |
| FrontPressure | 적대/아군 인접 일반 그래프 | **무수정** — 행성 id 하드코딩 없음 |
| 동적 분쟁 | `__dynamic_default__` → 정적 `campaignOrder` max 뒤에 합류 | 정적 4·5 추가 시 동적은 6+로 밀림 — **테스트 갱신** |
| 일일배치·가격탄력 | 별축 | **무관** |

**하드코딩 금지**: `if (planetId==='helios_core')` 등 TS 분기 **금지**.  
`DRACO_FRONT_CAMPAIGN_PLANET_ORDER` 상수(미사용 dead)는 CSV가 정본 — 필요 시 주석만·또는 CSV 정렬에 맞춰 정리(선택).

### 0-3. 기존값 변경

| 대상 | 조치 |
|------|------|
| `omega_hub`/`shadow_market`/`draco_haven` 기존 행 | **무단 변경 금지** |
| `helios_core`/`titan_ruins` | **신규 policy 행 추가** (기존값 재확인 불필요) |
| `planet_occupation_seeds` contestedZone | **가능하면 미변경**(분쟁 표기는 policy `contestedZone=true`로 충분). 시드도 true로 맞출 경우 → handoff에 명시 후 김팀장/대표님 재확인 |

---

## 1. 범위 (M0~M5)

### ✅ 김클로드

| # | 내용 |
|---|------|
| **M0** | 문서 1페이지 — 지리·레버 매핑(본 READY §0)을 `docs/strategy/`에 짧은 메모로 남기거나 territorial README/주석에 교차참조 |
| **M1** | `tables/balance/arc_core_territorial_combat_policy.csv`에 **신규 2행**: |
| | `helios_core` — `enabled=true`, `contestedZone=true`, `combatMode=blue_neutral`, `dominantSideWeightPct=70`(오메가와 동일), `campaignGroup=draco_front`, `campaignOrder=4`, 보급 페널티/보너스·가중치는 오메가/섀도우와 **동일 수치 복제**(기존값 무단 변경 아님·신규 행) |
| | `titan_ruins` — 동일하되 `combatMode=red_neutral`, `dominantSideWeightPct=70`, `campaignOrder=5` |
| **M2** | `npm run build:balance-tables` · 로더/캠페인 `listTerritorialCombatPoliciesForCampaign('draco_front')`에 4·5 포함 확인 |
| **M3** | 동적 분쟁 테스트(`seedPlanetOccupationFromBalance.test.ts` 등 campaignOrder=4 가정) **갱신** — 정적 max가 5가 되면 동적 첫 슬롯은 6 |
| **M4** | 단위테스트 — helios 정책=`blue_neutral`/dominant 70 · titan=`red_neutral`/70 · 순차 order 1…5(기존 3 + 신규 2) · **planetId 하드코딩 전투 분기 없음** |
| **M5** | (선택) 보급 비대칭 시나리오 테스트 — iron_cross=BLUE·perseus=RED일 때 헬리오스 중립 공격자 후보에 블루 보급>0 (기존 supply API) — 우세 combatMode와 병행 설명만 |

### ❌ 금지

- TS에 helios/titan 전용 `if` 우세 로직
- omega/shadow/draco **기존 CSV 행** 수치 변경
- FrontPressure·일일배치·가격 탄력 경로 손대기
- Skia / STAGE UI 대공사
- git commit / 「완료」선언

---

## 2. 권장 CSV 초안 (정본은 김클로드가 기존 행 포맷에 맞춰 기입)

```text
helios_core,helios,true,true,3600,58,12,30,8,12,blue_neutral,draco_front,4,70,35,6,18,헬리오스,draco_front 순차4·블루우세70%·아이언측방
titan_ruins,titan_gate,true,true,3600,58,12,30,8,12,red_neutral,draco_front,5,70,35,6,18,타이탄 게이트,draco_front 순차5·레드우세70%·섀도우축
```

(`dominantSideWeightPct`를 70→80 등으로 올릴지는 **이번 1안=70 고정**. 변경 원하면 handoff에 제안만.)

---

## 3. 게이트

```bash
npm run build:balance-tables
npx tsc --noEmit -p tsconfig.client.json
npx tsx --test src/arcCore/balance/seedPlanetOccupationFromBalance.test.ts
npx tsx --test <신규·관련 territorial 테스트>
npm run audit:memory:all
```

---

## 4. handoff

status=`PENDING` · task_id=`geo-flank-helios-titan-occupation-20260728` · M1 CSV 행 · 캠페인 길이·동적 order 테스트 결과 · 기존행 무수정 확인 · commit 금지
