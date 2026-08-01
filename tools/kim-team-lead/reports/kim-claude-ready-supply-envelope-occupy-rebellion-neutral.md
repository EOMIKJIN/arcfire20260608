# 김클로드 착수 — 보급 3성계 포위 점령 우세 · 중립화=내부 반란 우선 (기존 분쟁 스택 연결)

> **배정**: 김팀장 (Cursor 본창) · **2026-08-01**  
> **대표님 지시**:  
> 1. 블루 보급선이 **3성계로 둘러싼** 지역이면 **다음 순차 분쟁 패스**에서 **높은 확률로 블루 점유**로 바뀌어야 함 (레드 대칭).  
> 2. 반대로 **3성계로 둘러싸인 지역이 중립화**된다면, 그 원인은 **내부 반란**이 가장 크게 작동해야 함 (분쟁 `neutral_declare` 난사 금지).  
> **선행 관측**: 아이언크로스(`iron_remnant`) — 동적 ActivePool 편입 후 `__dynamic_default__`의 `neutral_declare` 12%로 BLUE→NEUTRAL 2회 (2026-07-31 실기기 ops). 보급 포위와 무관한 분쟁 중립선포가 블루 영토를 깎은 사례.  
> **김팀장 검토 판정**: **기존 기반에 연결 고도화 가능 (PASS)** — 신규 틱/부트 전수 금지 · 아래 1안만.  
> **김클로드 즉시 착수** · 완료 후 `kim-claude-handoff-pending.md` **PENDING** · **git commit 금지**  
> **task_id**: `supply-envelope-occupy-rebellion-neutral-20260801`

---

## [pss-pre-dev]

```text
[pss-pre-dev] hot_path=territorial_pass due 1회(이미 있음) · alloc=보급카운트 O(인접)·가중치 해석 1회 · cache=없음(또는 revision 기존)
[pss-pre-dev] stage=arcCore territorial + (선택) rebellion daily 배치 가산만 · Skia/UI 무관 · risk=P1·기존값CSV무단변경
[pss-pre-dev] verdict=PASS — rollDecision/effectiveMode/반란 일일패스에 연결 · onBoot 동기 전수 금지 · planetId 하드코딩 금지
```

---

## 0. 김팀장 기반 검토 (대표님께 요약용 · 구현 정본)

### 0-1. 이미 있는 축 (재사용 필수)

| 축 | 경로 | 역할 |
|----|------|------|
| 보급 카운트 | `territorialSupplyLine.countAdjacentFriendlySystems` | 1홉 아군 성계 수 (블루/레드 각각) |
| 실효 combatMode | `resolveEffectiveTerritorialCombatMode` | 중립+한쪽 인접 → `blue_neutral`/`red_neutral` · 우세 `dominantSideWeightPct`(≈70) |
| 순차 분쟁 | `runTerritorialCombatPass` + campaign `draco_front` | due 시 `rollDecision` → battle / **neutral_declare** / status_quo |
| ActivePool | `listTerritorialCombatPolicies` + 동적 편입 | 편입된 행성만 패스 대상 |
| 내부 반란 | `runPlanetRebellionResolutionDailyPass` → `applyRebellionOverthrowHold` | 일 1회 · hold 중립화 · `source=rebellion_overthrow` |
| SAFE | `contestedEligibility` SAFE_HINTERLAND | 적대 인접=0이면 분쟁 판정 스킵(반란은 유지) |

### 0-2. 갭 (이번 task가 메움)

| # | 현상 | 갭 |
|---|------|-----|
| G1 | 중립+보급≥1이면 이미 `blue_neutral` 70% | **「3성계」강도**가 없음 — 1개나 3개나 동일 70% |
| G2 | `rollDecision`이 보급과 무관 | battle 전에 **neutral_declare 12%**가 먼저 나와 **포위 점령 기회를 가로챔** (아이언 사례) |
| G3 | BLUE hold + 다수 블루 보급이어도 `neutral_declare` 가능 | 대표님: 그런 중립화는 **반란**이 주원인이어야 함 → 분쟁 중립선포 **억제** 필요 |
| G4 | 반란 패스는 contested/wealth 기반 | 「보급 3포위」가 반란 쪽 **가산**으로 명시되지 않음(선택 M) |

### 0-3. 연결 가능 여부

**가능.** 새 서브코어/틱 없이:

1. due 패스 진입 직후(이미 계산하는) `supplyAdjacency`로 **포위 등급(envelope)** 산출  
2. `rollDecision` **가중치 런타임 보정**(CSV 정적행 무단 변경 대신 **신규 policy CSV** 또는 순수 상수 모듈 — Table-First 권장)  
3. battle 진입 시 envelope≥3·반대=0이면 `dominantSideWeightPct` **상향**(고확률 점유)  
4. envelope≥3인 비중립 hold의 `neutral_declare` **차단/극소** → 중립화는 반란 일일패스 경로로만 실질 발생

---

## 1. 제품 1안 (고정)

### 정의 — Supply Envelope

```text
blueEnv = countAdjacentFriendlySystems(systemId, BLUE)
redEnv  = countAdjacentFriendlySystems(systemId, RED)
threshold = 3  (CSV: envelopeMinSystems, 기본 3)

BLUE_ENVELOPE_STRONG = blueEnv >= threshold && redEnv === 0
RED_ENVELOPE_STRONG  = redEnv  >= threshold && blueEnv === 0
```

- **성계 연결 수 &lt; 3**인 행성은 STRONG 불가(자연 폴백 — 기존 P0 ≥1 인접 규칙 유지).  
- planetId 하드코딩 금지. 아이언(연결 4: minerva/new_eden/helios/titan)은 블루 3+레드0일 때 STRONG 예시.

### A. 다음 순차 분쟁 — 고확률 점유

| 조건 | 동작 |
|------|------|
| `holdSide === 'NEUTRAL'` AND `BLUE_ENVELOPE_STRONG` | effective=`blue_neutral` 유지/강제 · **이번 due에서 battle 가중 상향 + status_quo/neutral_declare 하향** · `dominantSideWeightPct` → **occupyHighPct**(기본 **88**, CSV) |
| `holdSide === 'NEUTRAL'` AND `RED_ENVELOPE_STRONG` | 대칭 (`red_neutral` · 동일 %) |
| 그 외 중립 | **기존** `resolveEffectiveTerritorialCombatMode` P0/P1 그대로(≥1 인접 70% 등) |

「높은 확률」= due 1회 기준 **점유 성공 기대 ≥ ~0.75** 권장  
(예: battle 진입률↑ × dominate 88%). 정확한 수치는 CSV로만 조정.

### B. 포위 지역 중립화 = 내부 반란 우선

| 조건 | 분쟁 패스 | 반란 패스 |
|------|-----------|-----------|
| hold ∈ {BLUE,RED} AND 동측 `ENVELOPE_STRONG` (반대 보급 0) | **`neutral_declare` 가중 = 0**(또는 CSV `envelopeNeutralDeclareMul=0`)** — 분쟁으로 중립화 금지 | 기존 `runPlanetRebellionResolutionDailyPass` **유지** · (M5) envelope 시 overthrow 확률 **가산 배율**만 Table-First |
| hold ∈ {BLUE,RED} AND 반대 보급 &gt; 0 (전선) | 기존 `neutral_declare` CSV 가중 유지(전선 혼전 허용) | 기존 |
| SAFE_HINTERLAND | 이미 분쟁 스킵 — 반란만 (기존) | 기존 |

아이언 회귀 방지: 블루 포위 STRONG인 동안 **분쟁 `neutral_declare`로 BLUE→NEUTRAL 불가**. 중립화하려면 반란 overthrow(또는 전선에서 적 보급이 생긴 뒤의 기존 분쟁)만.

### C. CSV / 기존값

| 대상 | 조치 |
|------|------|
| `arc_core_territorial_combat_policy.csv` 기존 행 | **battle/neutral/statusQuo/combatMode 무단 변경 금지** |
| **신규** `tables/balance/arc_core_supply_envelope_policy.csv` (권장) | `envelopeMinSystems=3`, `occupyHighWeightPct=88`, `envelopeBattleWeightBoostPct`, `envelopeNeutralDeclareMul=0`, `envelopeRebellionOverthrowMul`(선택) — `build:balance-tables` 연동 |
| 반란 wealth CSV | 기존행 무단 변경 금지 · mul만 신규 키 또는 envelope CSV에 둠 |

---

## 2. 범위 (M0~M7)

### ✅ 김클로드

| # | 내용 |
|---|------|
| **M0** | 본 READY §0~1을 `docs/strategy/` 또는 territorial 주석 5~10줄로 교차참조(짧게). SAFE·P0 인접·envelope 우선순위 한 줄. |
| **M1** | 순수 함수 `resolveSupplyEnvelope` (또는 동등) — 입력 `{blue,red,threshold}` → `'blue_strong'\|'red_strong'\|'none'`. 단위테스트. |
| **M2** | `rollDecision` 직전/내부 — envelope에 따라 **가중치 보정**(battle↑, neutral_declare×mul, status_quo↓). 보정은 순수 함수로 분리해 테스트. **CSV 정적행 숫자 직접 수정 금지**. |
| **M3** | NEUTRAL + STRONG → battle 시 `dominantSideWeightPct`를 `occupyHighWeightPct`로 오버라이드(`resolveBinaryDominantHoldTarget` 입력). |
| **M4** | BLUE/RED hold + 동측 STRONG → **`neutral_declare` 결과 자체 금지**(롤에서 가중 0 또는 decision 재맵 → status_quo/battle). ops `ext`에 `envelopeSuppressedNeutralDeclare=true` 등 디버그 필드(선택). |
| **M5** | (권장) 반란 일일패스: STRONG 포위 행성 overthrow 성공 배율 `envelopeRebellionOverthrowMul`(기본 1.25~1.5, CSV). **wealth 곡선 기존값 변경 금지**. contestedZone 여부와 무관하게 hold 있는 행성만. |
| **M6** | 신규 CSV + generated + registry O(1). `__dynamic_default__` 포함 **모든** ActivePool 행성에 런타임 적용(아이언 동적 편입 포함). |
| **M7** | unit: (1) 중립+blueEnv=3+red=0 → due mock에서 블루 점유 고확률(고정 RNG 또는 가중치 assert) (2) BLUE+blueEnv=3+red=0 → neutral_declare 불가 (3) BLUE+blueEnv=3+red≥1 → neutral_declare 기존 가능(전선) (4) red 대칭 1건 (5) 연결&lt;3 성계는 STRONG 불가 (6) planetId 하드코딩 grep 0 (7) 기존 `resolveEffectiveTerritorialCombatMode`·eligibility·governor·ActivePool 회귀 PASS · `tsc` PASS |

### ❌ 금지

- `if (planetId === 'iron_remnant')` 등 하드코딩  
- 기존 territorial combat policy **행 수치·combatMode 무단 변경**  
- onBoot 전 은하 envelope 스캔 · 새 `setInterval`  
- SAFE/Eligibility/풀 min8 계약 파기  
- Skia/STAGE UI · git commit · 「완료」선언  

---

## 3. 구현 힌트

| 파일 | 역할 |
|------|------|
| `runTerritorialCombatPass.ts` | supplyAdjacency 직후 envelope → rollDecision 보정 → dominate pct 오버라이드 |
| `territorialSupplyLine.ts` | 카운트 재사용(수정 최소화) |
| (신규) `resolveSupplyEnvelope.ts` + `.test.ts` | 순수 · tsx --test |
| (신규) `tables/balance/arc_core_supply_envelope_policy.csv` + generated | Table-First |
| `runPlanetRebellionResolutionDailyPass.ts` | M5 mul만(얇게) |
| `applyRebellionOverthrowHold.ts` | 가능하면 무수정(이미 중립화 정본) |

우선순위 스택 (충돌 시):

```text
SAFE_HINTERLAND 스킵(기존)
  → Supply Envelope STRONG (본 task A/B)
    → resolveEffectiveTerritorialCombatMode P0 (기존 ≥1)
      → CSV combatMode / rollDecision 기본값
```

---

## 4. self-check (김클로드)

```bash
npx tsc --noEmit -p tsconfig.client.json
npx tsx --test src/arcCore/territorial/resolveSupplyEnvelope.test.ts
npx tsx --test src/arcCore/territorial/resolveEffectiveTerritorialCombatMode.test.ts
npx tsx --test src/arcCore/territorial/contestedEligibility.test.ts
npx tsx --test src/arcCore/territorial/contestedPoolGovernor.test.ts
npx tsx --test src/arcCore/territorial/contestedActivePool.test.ts
# + M7에서 추가한 envelope×rollDecision 테스트
```

handoff: `[pss-pre-dev]` 3줄 · M0~M7 · 아이언 회귀(STRONG 시 neutral_declare 0) · soft(실기 순차 1바퀴) · **commit 안 함**.

---

## 5. 김팀장 검수 포인트

- [ ] NEUTRAL + 블루 3포위·레드 0 → 다음 due에서 블루 점유 **고확률**(가중·dominant CSV 근거)
- [ ] BLUE + 블루 3포위·레드 0 → 분쟁 `neutral_declare` **불가** · 중립화는 반란 경로
- [ ] 전선(반대 보급&gt;0)에서는 기존 neutral_declare 유지
- [ ] 기존 territorial CSV 행 git diff 없음(신규 envelope CSV만)
- [ ] planetId 하드코딩 없음 · tsc·unit PASS · commit 없음
