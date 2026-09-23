# 4대 항로 수도 방위 우세 — 프로세스 설계 (v0.1)

> **상태**: 자동 프로세스 반영 · 플레이어 웨이브는 현행 유지 (대표님 2026-09-14)  
> **일자**: 2026-09-14  
> **담당**: 김팀장  
> **전제**: 기존 경제(일 1회 배치 · `price_elasticity=0` · 금고 5축) · 전술(보급 envelope · 마지노선 · 분쟁 풀 · WDI 반란) **유지**. 신규 서브코어 금지.

---

## 0. 한 줄 결론

수도는 **지방 행성과 같은 전선 노드가 아니다.**  
아군 1홉이 하나라도 남아 있으면 자동 침공·자동 중립선포·분쟁 풀 승격을 막고,  
포위가 열린 뒤에만 지방보다 **낮은 확률**로 점유/중립이 바뀌게 한다.  
반란은 막지 않되(내부 위협), 지방보다 **더 어렵다.**  
대상은 4대 항로 수도 **전부** — 블루/레드만이 아니라 남·북 수도 포함.

---

## 1. 현실·게임 정합 (대표님 지시)

| 현실 개념 | 게임 해석 |
|---|---|
| 수도는 점령지의 중심축 | 4대 항로 `centerPlanetId` — 이미 정본 |
| 지방 자금·군이 수도를 지킴 | 1홉 아군 수 + (2단계) 항로 동측 점유 수가 방위 배율 |
| 주변 아군이 다 떨어지기 전엔 침공 불가 | **포위문(siege gate)** — 아군 인접 ≥1 이면 자동 점유 변경 차단 |
| 설령 침공돼도 방어가 더 셈 | 포위가 열린 뒤에도 battle / `neutral_declare` / 반란 배율 < 1 |
| 반란은 예외(내부) | 반란 경로 **유지**. 다만 수도 배율로 지방보다 낮춤. 0 금지 |

뉴에덴 현재 그래프: 솔라·베가·아이언(아군 3) + 오메가(적 1).  
→ **포위문 닫힘**. 크림슨이 직접 맞닿아 있어도 자동 점유/중립화 대상이 되면 안 된다.

---

## 2. 적용 대상 (단일 식별 · 하드코딩 금지)

정본은 이미 있다. 새 planetId 목록을 만들지 않는다.

| 항로 | 국가 | planetId | 시드 점유 |
|---|---|---|---|
| 서 F1 | 스텔리움 연합 | `eden_city` | BLUE |
| 남 F2 | 머큐리움 연합 | `synth_706_p` | 프론티어(시드 행 없음 · 해금 후) |
| 동 F3 | 크림슨 레기온 | `core_prime` | RED |
| 북 F4 | 아우렐리움 길드 | `synth_732_p` | 프론티어(시드 행 없음 · 해금 후) |

게이트 함수: 기존 `isRouteCapitalPlanetId` / `listRouteCapitalPlanetIds()`  
(`GALAXY_ROUTE_POLICIES.*.centerPlanetId`).

`eden_city` / `core_prime` if문 금지. 남·북이 해금되면 **같은 규칙**이 자동 적용.

---

## 3. 무엇을 안 바꾸는가 (유지 계약)

| 유지 | 이유 |
|---|---|
| `runArcCoreDailyOpsBatch` 일 1회 · 부트 비동기 | 경제 부트경로 회귀 방지 |
| `price_elasticity=0` · 금고 5축 라우팅 | 수도 방위 ≠ 시세 |
| envelope 3성계 STRONG · `envelopeNeutralDeclareMul=0` | 아이언크로스 회귀 계약 |
| 마지노선 N≤5 HARD / F2·F4 외부보급 | 약세 팩션 수복 물리 |
| WDI 곡선 · `overthrow_base_prob_at_danger` **기존값** | 기존값 변경 재확인 대상 — 이번엔 안 건드림 |
| 분쟁 CSV 가중(드라코 58/12/30 등) | 지방·정적 전선 숫자 유지 |
| 플레이어 웨이브 승리 → RED 중립화 | 자동 프로세스가 아님 · 플레이어 주권 |
| `neutralizedAt` 의미 | 반란·플레이어 승리·독립국 purge 고착 유지 |
| 신규 서브코어 / 화면 `setInterval` | v4.0 · PSS |

기존 `capital_prime_bonus`(행성개발, `core_prime`만)도 **이번 설계에서 수정하지 않는다.**

---

## 4. 신규 레이어 — Capital Defense Context

기존 판정 **앞/옆**에 순수 함수 한 겹만 둔다.  
입력은 이미 territorial/반란 패스가 가진 `holds` + 1홉 인접 수. **새 틱·persist 없음.**

```text
resolveCapitalDefenseContext(planetId, systemId, holdSide, adjacency, holds)
  → not_capital
  | hold_defense     // 수도 + 현재 점유 유지 대상 + 포위문 닫힘
  | siege_open       // 수도 + 아군 인접 0 + 적 인접 ≥1
  | fallen_recapture // 수도가 이미 NEUTRAL/적 점유 · 본국 수복 보조만
```

### 4-1. 포위문 (siege gate) — 대표님 이론의 구현

`alliedAdjacent` = 수도 **현재 hold 동측**의 1홉 아군 성계 수  
(기존 `countAdjacentFriendlySystems` 재사용. BLUE/RED. F2/F4는 정치관계 보급 토큰이 열리면 동일 함수).

| 조건 | 모드 | 자동 프로세스 |
|---|---|---|
| 수도 아님 | `not_capital` | 현행 그대로 |
| `alliedAdjacent ≥ siegeGateAlliedMin`(제안 1) | `hold_defense` | 자동 침공·`neutral_declare`·풀 승격 **차단** |
| `alliedAdjacent === 0` 이고 `hostileAdjacent ≥ 1` | `siege_open` | 판정은 하되 수도 배율 적용 |
| `hostileAdjacent === 0` (완전 후방) | `hold_defense` | 차수 2인 동부 수도(`abyss`·`eternity`)도 안전 |
| 수도 hold가 본국이 아님(NEUTRAL/적/독립국) | `fallen_recapture` | 본국 수복만 보조 · 적 신규 점유는 여전히 배율 불리 |

**뉴에덴 지금**: allied=3, hostile=1 → `hold_defense`.  
오메가에 붙어 있어도 **자동으로 점유/중립이 바뀌면 안 된다.**

**코어 프라임**: `abyss`·`eternity`만 연결. 둘 다 동측이면 후방 수도. 둘 다 떨어지면 `siege_open`.

### 4-2. 반란은 포위문으로 막지 않는다

내부 전복은 「주변 아군이 지켜준다」와 별축.  
`hold_defense`여도 일일 반란 롤은 **실행**. 다만 `capitalRebellionOverthrowMul` < 1.

---

## 5. 기존 프로세스에 꽂는 위치 (코드 예정 · 지금은 계약만)

구현 시 **새 분기 산재 금지.** `applyCapitalDefenseTo*(ctx, x)` 한 모듈.

### 5-A. 영토 분쟁 패스 (`runTerritorialCombatPassForPlanet`)

지금: envelope → 마지노선 → `rollDecision` → battle / `neutral_declare` / status_quo.

보강 순서 (우선순위 위가 먼저):

1. 마지노선 HARD 수복 — **유지** (약세 팩션이 지방을 수복하는 물리. 수도 `hold_defense`면 HARD로도 수도를 뺏지 못함)
2. **수도 포위문** — `hold_defense`이면 `decision`을 `status_quo`로 고정, hold 변경 0. 알림 silent 또는 「수도 방위 유지」 1회 상한
3. envelope B (동측 STRONG → declare 0) — **유지** (포위문보다 약한 지방 규칙)
4. `siege_open`이면 CSV 가중 × 수도 배율 후 roll

`siege_open` 제안 배율 (신규 CSV, 기존 58/12/30 **행은 수정하지 않음**):

| 키 | 제안 | 효과 |
|---|---|---|
| `capitalNeutralDeclareMul` | **0.15** | 12% → 약 1.8% |
| `capitalBattleWeightMul` | **0.45** | 전투 진입 감소 |
| `capitalStatusQuoAbsorb` | true | 깎인 가중 → 현상 유지 |
| `capitalDefenderAdvantageBonusPct` | **+18** | 일단 전투 시 수비 우세 |
| `capitalAttackerDominantPenaltyPct` | **−20** | 공격측 dominance 하향 (바닥 0) |

마지노선 HARD가 **지방**을 수복하는 경로는 그대로.  
HARD가 **적 수도(`siege_open`)** 를 칠 때만 위 배율을 얹어, 마지노선이 수도를 한 방에 뒤집지 못하게 한다.

### 5-B. 분쟁 풀 거버너 (`contestedPoolGovernor`)

지금: min 8을 전선으로 채움 → 뉴에덴 점수 115(전선 100 + 오메가 인접 15)로 **수도가 땜빵 승격**.

보강:

- `hold_defense` 수도는 **승격 후보에서 제외** (`ineligible`과 동일 취급, 슬롯 안 먹음)
- 이미 동적 편입된 수도가 `hold_defense`면 **우선 강등**
- `siege_open`만 승격 가능. 점수는 지방 FRONT보다 낮게 (`capitalPoolScorePenalty` 제안 **−40**)

min 8은 아이언·베가·시리우스·해금 synth 중립 등으로 채운다. **수도로 min을 메우지 않는다.**

### 5-C. 하드게이트 (`resolveContestedZoneHardGate`)

`hold_defense` 수도 → `blocked: true`, reason 신설 `capital_ring_intact`.  
occupationCombat CSV는 바꾸지 않는다(아르카디아 OFF와 구분).

### 5-D. 시드 복구 (`shouldForceRestoreAllyHinterlandSeed`)

지금: 전투 ON + 적대 인접 → 후방 복구 거부. 뉴에덴은 오메가 때문에 **항상 거부**.

보강: 수도이고 `neutralizedAt` 없음이고 hold가 본국 시드가 아니면 **적대 인접이 있어도 본국 시드로 복구.**  
`neutralizedAt` 있는 함락 수도는 복구하지 않음 (반란·플레이어 승리·독립국 purge 계약).

### 5-E. 반란 일일 패스 (`runPlanetRebellionResolutionDailyPass`)

지금: CSV `contestedZone`만 skip. 수도 면제 없음. BLUE 배율 1.0 > RED 0.33.

보강 (기존 `overthrow_prob_mul_blue/red` **행 수정 없음**):

```text
finalMul = factionMul
         × envelopeRebellionMul          // 현행
         × capitalRebellionOverthrowMul  // 수도만, 제안 0.35
         × (hold_defense ? capitalRebellionRingMul : 1)  // 제안 0.55
```

뉴에덴(BLUE, 포위문 닫힘) 대략: `1.0 × 1.0 × 0.35 × 0.55 ≈ 0.19`  
지방 BLUE 위험 구간 12% 대비 수도는 **약 1/5.** 0은 아님.

RED 수도(`core_prime`)는 기존 0.33에 같은 수도 배율을 곱해 더 버티게.

동적 분쟁으로 승격돼도 반란 skip을 CSV contested에만 두는 현행은 유지.  
수도는 반란으로만 내부 붕괴 가능하게 남긴다.

### 5-F. 독립국 침공 판정

플레이어가 수도 증서를 산 경우: 포위문+배율은 **현재 홀더 보호**(위치 유지).  
함락 시 증서 소멸 계약은 유지.

### 5-G. 플레이어 웨이브

자동 프로세스 아님. **수도 방위 레이어를 적용하지 않는다.**  
RED 수도 웨이브 승리 중립화는 현행.

---

## 6. 경제와의 접점 (가격·금고 변경 없음)

지방 자금·군이 수도로 모인다는 개념은 **이미 있는 축을 읽기만** 한다.

| 단계 | 내용 | 이번 구현 |
|---|---|---|
| 0 (필수) | 1홉 아군 수 = 포위문 | 예 |
| 1 (권장) | 같은 항로(F코드) 동측 점유 성계 수 → `capitalProvincePowerMul` (1.0~1.25, 캡) | 일 1회 배치 또는 분쟁 패스 진입 시 1회 계산. persist 없음. bounded 4칸 캐시(수도 4) |
| 2 (후속) | 금고 이체·시세 | **안 함** |

`capitalProvincePowerMul`은 `capitalDefenderAdvantageBonusPct`에만 곱한다.  
무역 가격, 수수료, 금고 키를 바꾸지 않는다.

기존 `capital_prime_bonus=30`은 행성개발 가중 — 점유 판정과 별축. 그대로 둔다.

---

## 7. Table-First — 신규 CSV만 (기존 행 무변경)

제안 파일: `tables/balance/arc_core_capital_defense_policy.csv`  
envelope_policy와 같은 **단행 default_v1**.

| 컬럼 | 제안값 | 설명 |
|---|---|---|
| policyId | default_v1 | |
| enabled | true | |
| siegeGateAlliedMin | 1 | 아군 1홉 ≥1 이면 포위문 닫힘 |
| capitalNeutralDeclareMul | 0.15 | siege_open 시 declare 배율 |
| capitalBattleWeightMul | 0.45 | siege_open 시 battle 배율 |
| capitalStatusQuoAbsorb | true | 깎인 가중 → status_quo |
| capitalDefenderAdvantageBonusPct | 18 | 전투 수비 가산 |
| capitalAttackerDominantPenaltyPct | 20 | 공격 dominance 감(절대값, 적용 시 빼기) |
| capitalRebellionOverthrowMul | 0.35 | 반란 기본 수도 배율 |
| capitalRebellionRingMul | 0.55 | 포위문 닫힘일 때 추가 |
| capitalPoolPromoteBannedWhenRingIntact | true | |
| capitalPoolScorePenalty | 40 | siege_open 승격 감점 |
| capitalSeedRestoreIgnoresHostileAdj | true | neutralizedAt 없을 때만 |
| provincePowerMulMin | 1.00 | |
| provincePowerMulMax | 1.25 | |
| notesKo | 4대 항로 수도 방위 우세 | |

`build:balance-tables` 후 `getArcCoreCapitalDefensePolicy()` — envelope와 동일 캐시 패턴.  
부트 동기 전 행성 루프 금지.

---

## 8. 남·북 수도 (F2 / F4)

영토 자동전 본선은 아직 BLUE↔RED.  
남·북 수도는 해금 전 NEUTRAL 프론티어인 경우가 많다.

같은 Context를 쓴다.

- 해금+본국(또는 합법적 홀더) + 아군 링 → 풀 승격·자동 중립화 금지
- 점유 시드 행이 없어도 `isRouteCapitalPlanetId`면 게이트 동작
- F2/F4 전용 전쟁 규칙을 **이번 설계에서 신설하지 않음** (확장시스템 정본과 충돌 방지)
- 마지노선 F2/F4 외부보급은 **블루/레드 지방 수복**용으로 유지. 남·북 수도를 뺏는 지름길로 쓰지 않음

---

## 9. 함락 수도 수복 (`fallen_recapture`)

수도가 이미 중립/적 점유면 「현재 위치 유지」의 주체는 함락 정권이다.  
본국이 아군 링을 다시 붙이면 **기존 envelope A**(NEUTRAL+STRONG → 고확률 점유)로 수복.  
여기에 수도 가산 `capitalRecaptureBonusPct`(후속, 기본 0=미사용)만 예약.  
**적**이 함락 수도를 새로 먹는 것은 `siege_open` 배율로 계속 어렵게.

시드로 조용히 BLUE/RED를 되돌리지 않는다 (`neutralizedAt` 존중).

---

## 10. 메모리·PSS

```text
[pss-pre-dev] hot_path=일1회 반란 + 분쟁 due(기존 20m) alloc=인접수는 기존 계산 재사용 cache=정책 CSV 1행 + 수도4칸 파워
[pss-pre-dev] stage=hold persist 추가 없음 · 신규 store 없음 risk=P1(배치 경로만)
[pss-pre-dev] verdict=PASS — 구현 착수 시에도 틱/부트 전 행성 루프 없음
```

- 화면 전용 루프 없음
- `JSON.stringify` 추가 persist 없음
- 분쟁 패스가 이미 들고 있는 adjacency를 재사용

완료 게이트(구현 턴): `tsc` · `audit:memory:all` · 관련 unit  
(`resolveCapitalDefenseContext` · 뉴에덴 3아군1적 → hold_defense · 코어 후방 → hold_defense)

---

## 11. 구현 파일 (자동 프로세스 · 2026-09-14)

플레이어 웨이브는 미적용. 아래만 반영.

| 파일 | 역할 |
|---|---|
| `tables/balance/arc_core_capital_defense_policy.csv` | 신규 정본 |
| `src/arcCore/territorial/arcCoreCapitalDefensePolicy.ts` | CSV 로드 |
| `src/arcCore/territorial/resolveCapitalDefenseContext.ts` | 순수 판정 |
| `src/arcCore/territorial/applyCapitalDefenseAdjustments.ts` | 가중·반란·풀 적용 |
| `runTerritorialCombatPass.ts` · `contestedPoolGovernorSync.ts` · `contestedZoneHardGate.ts` · `runPlanetRebellionResolutionDailyPass.ts` · `seedPlanetOccupationFromBalance.ts` | 주입 |

금지: `planets.csv` zone 변경, occupation seed contested 플래그 무단 변경, 기존 rebellion/envelope 숫자 덮어쓰기. 플레이어 웨이브 경로(`planet.tsx`) 미적용.

---

## 12. 1안 수치 — 대표님 승인 (2026-09-14)

| # | 항목 | 결정 |
|---|---|---|
| 1 | 포위문: 아군 1홉 ≥1이면 자동 침공/중립선포 차단 | 승인 |
| 2 | 반란: 수도 배율 0.35 × 링 0.55 (막지 않음) | 승인 |
| 3 | 플레이어 직접 웨이브는 현행 유지 · 추후 밸런스 | 승인 |
| 4 | 기존 envelope/마지노선/WDI 행 값 유지 | 승인 |
