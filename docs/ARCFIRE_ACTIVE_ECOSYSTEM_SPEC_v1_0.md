# 아크코어 능동형 아크파이어 생태계 구축 명세서 v1.0

> **문서명**: ARCFIRE_ACTIVE_ECOSYSTEM_SPEC_v1.0  
> **작성일**: 2026-06-26  
> **문서 상태**: 검토 완료 — 구현 제안안  
> **적용 범위 정본 (중복 제거)**: [`ecosystem/ARCFIRE_ACTIVE_ECOSYSTEM_ADOPTION_v1.md`](./ecosystem/ARCFIRE_ACTIVE_ECOSYSTEM_ADOPTION_v1.md) — **신규 엔진·PEV·RTDB는 비채택**  
> **참조 정본**: `Arcfire_Master_Spec_v4.0`, `ArcCore_AABS_Final_Spec_v2.2`, `_000_Arcfire_Planet_Final_Master_Plan.md`, `ARC_CORE_ECONOMY_FABRIC.md`  
> **저장 경로**: `docs/ecosystem/ARCFIRE_ACTIVE_ECOSYSTEM_SPEC_v1.0.md`

---

## 0. 개요 및 설계 철학

### 0-1. 목표

현재 ArcCore 시스템은 **일 1회(12:00 KST) 배치 처리** 원칙하에 밸런스 보정에 집중되어 있다.  
본 명세서는 이 구조를 유지하면서, **봇(AI NPC)들이 실제로 경제 활동을 하고, 전투로 행성 이권을 경쟁하며, 수송선단이 무역로를 순환**하는 **살아있는 은하계 생태계**를 로컬-퍼스트(Local-AI-First) 원칙으로 구현하는 방안을 제시한다.

### 0-2. 핵심 설계 원칙 (기존 헌법 준수)

| 원칙 | 내용 | 이 문서에서의 적용 |
|------|------|--------------------|
| **Local-AI-First** | 모든 시뮬레이션은 클라이언트 로컬 ArcCore 처리 | Firebase에는 결과 스냅샷만 단발성 기록 |
| **일 1회 배치** | 경제·밸런스 재배치는 12:00 KST 1회 | 봇 활동 결과 정산도 배치 시점에 통합 |
| **Table-First** | CSV 정본 수정 금지, GlobalMultiplier만 조정 | 봇 행동 정책도 CSV 정의 |
| **Safe-Drift ±15%** | 보정폭 1회 5%, 누적 ±15% 이내 | 봇 경제 수익도 이 범위 내에서만 영향 |
| **Firebase 무료 한도** | Firestore 읽기 5만/일, 쓰기 2만/일 | 봇 상태는 로컬만 — 유저 결과만 단발 기록 |

### 0-3. Firebase 무료 한도 전략

```
Firebase Spark(무료) 기준:
  Firestore: 읽기 50,000/일, 쓰기 20,000/일, 삭제 20,000/일
  Realtime Database: 동시 접속 100, 저장 1GB, 다운로드 10GB/월

→ 봇 AI 상태를 Firestore/RTDB에 저장하면 즉시 한도 초과.
→ 봇은 100% AsyncStorage(로컬)에서만 상태 관리.
→ Firebase RTDB는 '유저 행성 점유 결과' 단 1개 문서만 업데이트.
→ 실시간 리슨(onSnapshot)은 절대 금지. 단발성 get/set만.
```

---

## 1. 생태계 전체 구조도

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ArcCore 근원 마스터 (로컬 클라이언트)              │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────┐ │
│  │ AiNpcSubCore     │  │ AiEconomySubCore  │  │ArcCoreDailyOps     │ │
│  │ (궤도 트래픽/    │  │ (무역로 순환/     │  │SubCore             │ │
│  │  전투함장 연출)  │  │  시장 가격 관리)  │  │(12:00 배치 정산)   │ │
│  └────────┬─────────┘  └────────┬──────────┘  └────────┬───────────┘ │
│           │                     │                       │             │
│  ┌────────▼─────────────────────▼───────────────────────▼───────────┐│
│  │              ArcBotEcosystemEngine (신규)                         ││
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐ ││
│  │  │ BotFleetMgr │  │ BotTradeFleet│  │ BotPlanetOccupation     │ ││
│  │  │ (전투봇 관리)│  │ Mgr(수송선단)│  │ Engine(행성 이권 전투)  │ ││
│  │  └─────────────┘  └──────────────┘  └─────────────────────────┘ ││
│  └───────────────────────────────────────────────────────────────────┘│
│                                    │                                   │
│              ┌─────────────────────▼──────────────────────┐           │
│              │   planetCoreRuntimeStore (Zustand)          │           │
│              │   + AsyncStorage (로컬 영속 캐시)           │           │
│              └─────────────────────────────────────────────┘           │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │ 단발성 set (12:00 배치 또는 유저 액션)
                          ┌────────▼──────────┐
                          │  Firebase Firestore│
                          │  arcfire_player_v1 │
                          │  /{uid}/planet_holds│
                          └───────────────────┘
```

---

## 2. ArcBotEcosystemEngine — 핵심 신규 모듈

### 2-1. 모듈 위치 및 역할

```
src/arcCore/ecosystem/
├── ArcBotEcosystemEngine.ts       ← 생태계 총괄 엔진 (진입점)
├── BotFleetManager.ts             ← 전투봇 함대 시뮬레이터
├── BotTradeFleetManager.ts        ← 수송선단 순환 시뮬레이터
├── BotPlanetOccupationEngine.ts   ← 행성 이권 전투 엔진
├── BotEconomyLedger.ts            ← 봇 경제 수익/지출 장부
└── BotEcosystemPolicy.ts          ← 정책 CSV 로더 (Table-First)
```

### 2-2. 구동 원칙

```typescript
// 봇 생태계는 3가지 타이밍에만 계산된다:
// 1. 앱 시작 시 — 오프라인 경과 시간 분 단위 시뮬레이션
// 2. 12:00 배치 시 — runArcCoreDailyOpsBatch() 내에서 통합 정산
// 3. 유저가 해당 행성 허브 진입 시 — 행성 현황 로컬 계산

// 절대 금지: 타이머/setInterval로 봇 상태를 수십 초 단위로 갱신하는 것
// → OOM 및 배터리 소모 유발
```

---

## 3. BotFleetManager — 전투봇 함대 시뮬레이터

### 3-1. 봇 유형 정의 (aiVirtualPlayerDensity.csv 기반)

| planetType | baseCount | combatShare | tradeShare | exploreShare |
|------------|-----------|-------------|------------|--------------|
| safe | 4 | 40% | 35% | 25% |
| neutral | 6 | 45% | 35% | 20% |
| pvp | 8 | 55% | 25% | 20% |
| endgame | 6 | 50% | 30% | 20% |

### 3-2. 봇 행동 사이클 (오프라인 경과 시간 기반)

```typescript
interface BotCombatState {
  botId: string;
  planetId: string;
  zoneIndex: number;
  role: 'combat' | 'trade' | 'explore';
  currentHp: number;
  creditsEarned: number;
  lastActionTimestamp: number;
  missionCyclePhase: 'approach' | 'combat' | 'loot' | 'retreat' | 'dwell';
}

// 오프라인 경과 시간 기반 시뮬레이션
function simulateBotOfflineProgress(
  bot: BotCombatState,
  elapsedMs: number
): BotCombatState {
  // planet_leveling_progression.csv 기반 전투 주기 계산
  // 1전투당 평균 targetEngageSec(32초) 기준
  const combatCyclesCompleted = Math.floor(elapsedMs / (32_000 + 15_000));
  
  // play_scenario_zone_planets.csv 기반 보상 계산
  const rewardPerCycle = getZoneRewardPerCombat(bot.zoneIndex);
  bot.creditsEarned += combatCyclesCompleted * rewardPerCycle;
  
  return bot;
}
```

### 3-3. 봇 수익 계산 정책

전투봇의 수익은 `planet_leveling_progression.csv`의 `targetCreditsEarned`와 `combatsInZone` 기반으로 산출한다.

```
봇 1회 전투 수익 = targetCreditsEarned / combatsInZone * proficiencyMultiplier(봇레벨)
봇 일일 전투 사이클 = min(실제 경과 전투수, 행성별 일일 최대 캡)
```

**중요**: 봇 수익은 실제 크레딧 발행이 아니라 **행성 경제 활력 지표(PlanetEconomyVitality)**에만 반영된다. 실제 크레딧은 유저만 보유한다.

---

## 4. BotTradeFleetManager — 수송선단 순환 시뮬레이터

### 4-1. 수송선단 정의 (capital_ship_instance_class.csv 기반)

`npcMode = "transport"` 인 함선이 수송선단을 구성한다.

```typescript
interface TradeFleetState {
  fleetId: string;
  shipClass: 'Freighter' | 'Hauler' | 'Tanker';
  currentPlanetId: string;
  destinationPlanetId: string;
  cargoType: string; // trade_route_planet_supply_assignments.csv 기반
  cargoValue: number;
  transitProgressPct: number; // 0~100
  departureTimestamp: number;
  expectedArrivalTimestamp: number;
  status: 'docked' | 'in_transit' | 'under_attack';
}
```

### 4-2. 무역로 순환 로직

`trade_route_planet_supply_assignments.csv` (100개 공급-수요 쌍) 기반으로 수송선단이 행성 간을 순환한다.

```typescript
// 수송선단 시뮬레이션 (앱 시작 시 오프라인 경과 계산)
function simulateTradeFleetProgress(
  fleet: TradeFleetState,
  currentTimestamp: number
): TradeFleetState {
  const elapsed = currentTimestamp - fleet.departureTimestamp;
  const totalTransitMs = fleet.expectedArrivalTimestamp - fleet.departureTimestamp;
  
  fleet.transitProgressPct = Math.min(100, (elapsed / totalTransitMs) * 100);
  
  if (fleet.transitProgressPct >= 100) {
    // 도착 처리: 행성 경제 활력 증가
    applyTradeArrivalEffect(fleet);
    // 다음 목적지 배정
    fleet = assignNextDestination(fleet);
  }
  
  return fleet;
}

// transit 시간 기준: trade_route_transport_policy.csv
// (예: 인접 행성 2시간, 2존 거리 4시간, 최대 12시간)
```

### 4-3. 수송선단 습격 이벤트 (BotFleetManager 연동)

```typescript
// arc_core_planet_attack_level_policy.csv 기반 습격 확률
function checkTransitAttackRisk(
  fleet: TradeFleetState,
  zoneIndex: number
): boolean {
  const attackPolicy = getAttackPolicy(zoneIndex);
  // transit_encounter_mul 적용
  const attackChance = BASE_ATTACK_CHANCE * attackPolicy.transit_encounter_mul;
  return Math.random() < attackChance;
}

// 습격 결과:
// - 방어 성공: 수송선단 계속 운항, 소량 화물 손실
// - 방어 실패: 화물 전량 손실, 행성 경제 활력 -5%
// → planet_defense_satellite_policy.csv의 intercept 능력 반영
```

### 4-4. UI 연출 (Stage 1 궤도 트래픽)

```
수송선단은 Stage 1 허브에서 AiNpcSubCore를 통해 궤도 트래픽으로 표시된다.
- 렌더링: 최대 5대 동시 (200MB 메모리 예산 준수)
- 표시: "‹수송› [화물명]" 레이블
- 진행률: Skia 궤도 애니메이션으로 표현 (이동 방향성 있음)
```

---

## 5. BotPlanetOccupationEngine — 행성 이권 전투 엔진

### 5-1. 점유 시스템 개요

`planet_occupation_seeds.csv`에 정의된 21개 행성은 초기 진영(BLUE/RED/NEUTRAL)이 배정되어 있다. 봇 전투함대가 주기적으로 이 점유권을 경쟁한다.

```typescript
interface PlanetOccupationState {
  planetId: string;
  currentOwner: 'BLUE' | 'RED' | 'NEUTRAL' | 'PLAYER';
  occupationCombatEnabled: boolean;
  
  // 진영별 전투력 축적 (일일 배치 시 정산)
  blueForceAccumulated: number;
  redForceAccumulated: number;
  
  // 행성 수익 귀속 (TDI 기반)
  dailyIncomeRateBluePct: number; // 0~100
  dailyIncomeRateRedPct: number;
  
  // 방어 위성 상태 (planet_defense_satellite_policy.csv 연동)
  defenseIntercetPct: number;
  lastBattleTimestamp: number;
  ownershipChangedAt: number | null;
}
```

### 5-2. 봇 전투 사이클 (일일 배치 정산)

```typescript
// runArcCoreDailyOpsBatch() 내부에서 호출
function runPlanetOccupationBattlePass(): void {
  const planets = getAllOccupationEnabledPlanets(); // occupationCombatEnabled = true
  
  for (const planet of planets) {
    // 1. 오프라인 기간 동안 각 진영 봇이 누적한 전투력 집계
    const blueForce = computeBotForceForFaction('BLUE', planet.zoneIndex);
    const redForce = computeBotForceForFaction('RED', planet.zoneIndex);
    
    // 2. 방어 위성 보정 적용 (현재 소유 진영에게 방어 보너스)
    const defBonus = planet.defenseIntercetPct / 100; // 0~0.75
    const ownerForce = planet.currentOwner === 'BLUE'
      ? blueForce * (1 + defBonus)
      : redForce * (1 + defBonus);
    const attackerForce = planet.currentOwner === 'BLUE' ? redForce : blueForce;
    
    // 3. 점유권 변경 판정 (공격자가 수비자의 1.3배 이상이면 점령)
    if (attackerForce > ownerForce * 1.3) {
      changePlanetOwner(planet, blueForce > redForce ? 'BLUE' : 'RED');
      // → 유저가 해당 행성 보유 중이면 알림 큐에 추가
    }
    
    // 4. 수익 귀속 비율 업데이트
    const totalForce = blueForce + redForce;
    planet.dailyIncomeRateBluePct = Math.round((blueForce / totalForce) * 100);
    planet.dailyIncomeRateRedPct = 100 - planet.dailyIncomeRateBluePct;
  }
}
```

### 5-3. 행성 수익 분배 (TDI 연동)

```typescript
// 유저가 행성 점유 시 수익 계산
function calculatePlayerPlanetDailyIncome(
  planetId: string,
  playerTdi: number // 0~100
): number {
  const planet = getPlanetOccupationState(planetId);
  
  // TDI 기반 생산량 배율 (_000_Arcfire_Planet_Final_Master_Plan.md §3)
  const tdiMultiplier = getTdiIncomeMultiplier(playerTdi);
  // TDI 0-20: 1.0x, 21-40: 1.5x, 41-60: 2.5x, 61-80: 4.0x, 81-100: 7.0x
  
  // 행성 유지비 차감 (arc_core_planet_upkeep_policy.csv: 800 Cr/일)
  const upkeepCost = PLANET_DAILY_UPKEEP_CR;
  
  // 진영 점유 비율 반영
  const ownershipFactor = planet.currentOwner === 'PLAYER' ? 1.0
    : planet.dailyIncomeRateBluePct / 100; // 연합 점유면 비율만큼
  
  return Math.max(0, BASE_PLANET_INCOME * tdiMultiplier * ownershipFactor - upkeepCost);
}
```

### 5-4. 유저가 직접 점령전 참여

유저는 Stage 3 전투에서 해당 행성의 점령 전투를 직접 수행할 수 있다.

```
점령전 진입 조건:
  - occupationCombatEnabled = true (planet_occupation_seeds.csv)
  - 유저 파일럿 레벨 ≥ planet의 targetCombatLevel
  
점령전 결과:
  - 승리: PLAYER 소유로 변경 → arcfire_player_v1/{uid}/planet_holds 단발 기록
  - 패배: 현 소유자 유지, 봇 방어력 소폭 증가
  
유저 점유 혜택:
  - 무역소 수수료 인하 (trade_route_economy_policy.csv 기준)
  - 일일 수익 크레딧 자동 적립 (다음 접속 시 수령)
  - 방어 위성 업그레이드 권한 (planet_defense_satellite_level_policy.csv)
```

---

## 6. BotEconomyLedger — 행성 경제 활력 시스템

### 6-1. 행성 경제 활력 지표 (PlanetEconomyVitality)

봇들의 활동을 실제 크레딧 발행 없이 **행성 경제 활력(PEV)**로 수렴시키는 추상화 레이어.

```typescript
interface PlanetEconomyState {
  planetId: string;
  zoneIndex: number;
  
  // 경제 활력 지표 (0.5 ~ 2.0, 기본 1.0)
  economyVitalityScore: number;
  
  // 활력 구성 요소
  tradeFleetArrivalCount: number;    // 당일 수송선단 도착 횟수
  botCombatCycleCount: number;       // 당일 봇 전투 횟수
  botMiningYieldEstimate: number;    // 당일 봇 채굴 추정량
  
  // 활력이 유저에게 미치는 효과
  tradePortFeeDiscount: number;      // 무역소 수수료 할인 (0~0.15)
  weaponDropRateBonus: number;       // 장비 드랍율 보너스 (0~0.1)
  mineralYieldBonus: number;         // 채굴 보너스 (0~0.1)
  
  lastComputedAt: string; // ISO timestamp
}
```

### 6-2. 경제 활력 계산 (일일 배치)

```typescript
function computePlanetEconomyVitality(planetId: string): number {
  const state = getPlanetEconomyState(planetId);
  const policy = getZonePolicy(state.zoneIndex); // economy_sim_macro_policy.csv
  
  // 수송선단 기여
  const tradeScore = Math.min(state.tradeFleetArrivalCount / 3, 1.0) * 0.4;
  
  // 전투봇 기여
  const combatScore = Math.min(state.botCombatCycleCount / 10, 1.0) * 0.35;
  
  // 채굴봇 기여
  const miningScore = Math.min(state.botMiningYieldEstimate / 100, 1.0) * 0.25;
  
  // 합산 (0.5 ~ 1.5 범위 클램핑)
  const raw = 0.5 + (tradeScore + combatScore + miningScore) * 1.0;
  return Math.min(1.5, Math.max(0.5, raw));
}
```

### 6-3. 활력 효과가 유저 플레이에 반영되는 방식

```
PEV < 0.7  : "경제 침체" — 무역소 매입가 -10%, 드랍율 저하
PEV 0.7~1.0: "보통"     — 기본값 적용
PEV 1.0~1.3: "활황"     — 무역소 매입가 +5%, 드랍율 +5%
PEV > 1.3  : "대호황"   — 무역소 매입가 +10%, 드랍율 +10%, 특수 미션 해금

→ 유저에게는 "이 행성은 현재 [활황] 상태입니다" 형태의 텍스트로 표시
→ AABS Safe-Drift 정책 범위(±15%) 내에서만 효과 적용
```

---

## 7. 서브코어 확장: AiNpcSubCore 행동 패턴 고도화

### 7-1. 현재 구조 (Stage 1 궤도 트래픽만)

현재 `AiNpcSubCore`는 STAGE 1 허브에서 최대 5대의 AI 전함을 궤도 트래픽으로 연출하는 것에 집중되어 있다.

### 7-2. 고도화 방향 — 역할 분리 연출

```typescript
// npc_ai_ships.csv의 npcMode 기반 역할별 연출
type NpcBehaviorRole = 
  | 'patrol'      // 전투함장: 행성 궤도 순찰, 위협적 움직임
  | 'transport'   // 수송선단: 특정 방향으로 일정 속도 이동
  | 'mining'      // 채굴봇: 행성 근처 저속 선회
  | 'sentry';     // 요새 수비: 고정 궤도 대기

// 각 역할별 ArcTraffic 파라미터 차별화
function getBehaviorParams(role: NpcBehaviorRole): ArcTrafficParams {
  return {
    patrol:    { dwellRadPerSec: 0.8, phaseMul: 1, speedVariance: 0.3 },
    transport: { dwellRadPerSec: 0.3, phaseMul: 3, speedVariance: 0.05 },
    mining:    { dwellRadPerSec: 0.5, phaseMul: 2, speedVariance: 0.1 },
    sentry:    { dwellRadPerSec: 0.1, phaseMul: 4, speedVariance: 0.0 },
  }[role];
}
```

### 7-3. 전투함장 배치 정책 연동

`capital_ship_combat_level_class.csv` 기반으로 행성 존 레벨에 맞는 함급이 배치된다.

```typescript
// 유저가 행성에 진입할 때 해당 존의 적절한 함급 결정
function selectNpcShipForZone(zoneIndex: number): NpcShipDefinition {
  const levelClass = getCombatLevelClass(zoneIndex);
  // expRewardMin/Max 범위의 함선 중 loadoutProfile에 맞는 함선 선택
  return pickWeightedShip(levelClass.shipClass, levelClass.tierBand);
}
```

---

## 8. Firebase 활용 설계 (무료 한도 내)

### 8-1. Firebase Firestore 사용 범위 (기존 정책 유지)

```
✅ 허용:
  - arcfire_player_v1/{uid}           : 유저 프로필 (단발 get/set)
  - arcfire_player_v1/{uid}/planet_holds : 행성 점유 결과 (단발 merge update)
  - arcfire_player_v1/{uid}/daily_rewards : 일일 수익 대기 크레딧 (배치 후 1회 기록)

❌ 금지:
  - 봇 AI 상태 저장 (모두 AsyncStorage 로컬)
  - 행성 경제 활력 실시간 동기화
  - 수송선단 위치 Firestore 저장
```

### 8-2. Firebase Realtime Database 활용 (신규 — 제한적)

Firebase RTDB는 다음 **단 1가지 용도**로만 사용한다.

```
용도: 아크코어 글로벌 오버레이 동기화
  - 경로: /arcfire/global_overlay
  - 내용: dynamic_overlay.csv의 멀티플라이어 값 (6개 키)
  - 업데이트 주기: 운영자가 수동으로 1회/일 설정
  - 유저 클라이언트: 앱 시작 시 1회 onValue 읽기 후 로컬 캐싱

예시 데이터:
{
  "expReward": 1.03,
  "creditReward": 1.00,
  "tradeIncome": 1.00,
  "dropWeight": 1.00,
  "miningYield": 1.00,
  "combatDifficulty": 1.00
}

→ 읽기: 유저 1인 기준 앱 시작 시 1회 = 1 read
→ 1,000명 동시 접속 시 1,000 reads → Spark 무료 한도 50,000/일 내 충분히 수용
→ 쓰기: 운영자 1인 1회/일 = 1 write → 무시 가능 수준
```

### 8-3. 일일 Firebase 사용량 예측 (유저 1,000명 기준)

| 작업 | reads/유저 | writes/유저 | 일일 합계 reads | 일일 합계 writes |
|------|-----------|------------|----------------|-----------------|
| 앱 시작 프로필 로드 | 1 | 0 | 1,000 | 0 |
| 행성 점유 결과 기록 | 0 | 최대 3 | 0 | 3,000 |
| 일일 수익 대기 기록 | 0 | 1 | 0 | 1,000 |
| RTDB 오버레이 읽기 | 1 | 0 | 1,000 | 0 |
| BM 구매 | 0 | 최대 2 | 0 | 2,000 |
| **합계** | **2** | **6** | **2,000** | **6,000** |
| **Spark 한도** | — | — | **50,000** | **20,000** |
| **여유율** | — | — | **96% 여유** | **70% 여유** |

---

## 9. runArcCoreDailyOpsBatch() 확장 명세

기존 배치 실행 순서에 생태계 패스를 추가한다.

```typescript
async function runArcCoreDailyOpsBatch(): Promise<void> {
  // 기존 패스 (순서 유지)
  await runPlanetEnergyCorePass();
  await runPlanetEnvironmentDiversityPass();
  await runGlobalPlanetMasterBalancePass();
  await runPlayScenarioEconomyPass();
  await runMarketPricePass();
  await runAabsAlignmentPass();
  
  // ── 신규: 생태계 패스 ──────────────────────────────────────
  await runBotCombatCycleSettlementPass();      // 봇 전투 결과 정산
  await runTradeFleetArrivalSettlementPass();   // 수송선단 도착 정산
  await runPlanetOccupationBattlePass();        // 행성 점령전 결과 판정
  await runPlanetEconomyVitalityComputePass();  // 행성 경제 활력 재계산
  await runPlayerDailyPlanetIncomePass();       // 유저 행성 수익 크레딧 적립
  // ────────────────────────────────────────────────────────────
  
  await tryArcCoreWorldDailyUnlock();
  
  // 배치 완료 플래그 (AsyncStorage)
  await AsyncStorage.setItem('arcfire_arc_core_daily_ops_v1', todayKey);
}
```

---

## 10. 행성 스탯(5대 속성) 연동

`_000_Arcfire_Planet_Final_Master_Plan.md`의 5대 속성과 생태계 시스템의 연동 방식.

| 속성 | 봇 생태계 연동 | 효과 |
|------|--------------|------|
| **자원** | BotTradeFleetManager 수익 → 행성 자원 증가 | 유지비 감소, 무역 이익 향상 |
| **인구** | 봇 채굴 활동량 → 행성 인구 간접 증가 | 채굴 보너스 상승 |
| **방어** | BotPlanetOccupationEngine 점령전 → 방어 소모 | 방어 위성 파괴 시 방어 스탯 감소 |
| **기술** | 봇 탐사 활동 → 기술 스탯 미세 증가 | 장비 드랍 티어 향상 |
| **환경** | 봇 채굴 과다 시 환경 스탯 감소 | 자원 재생 주기 지연 |

### 10-1. 5대 속성 자동 조정 (배치 패스 내)

```typescript
// runPlanetEnergyCorePass() 내부 확장
function applyBotEcosystemEffectsToStats(planetId: string): void {
  const ecosystemState = getBotEcosystemSummary(planetId);
  const stats = getPlanetStats(planetId);
  
  // 수송선단 도착 → 자원 증가 (최대 +2/일)
  stats.resource = Math.min(15, stats.resource + 
    Math.floor(ecosystemState.tradeFleetArrivalCount / 2));
  
  // 점령전 방어 실패 → 방어 스탯 감소
  if (ecosystemState.defenseBreached) {
    stats.defense = Math.max(0, stats.defense - 1);
  }
  
  // 과다 채굴 → 환경 스탯 감소 (채굴량이 임계치 초과 시)
  if (ecosystemState.botMiningYieldEstimate > MINING_OVERLOAD_THRESHOLD) {
    stats.environment = Math.max(0, stats.environment - 1);
  }
  
  savePlanetStats(planetId, stats);
}
```

---

## 11. 유저 경험 연출 — "살아있는 은하계" 시각화

### 11-1. Stage 1 허브 — 생태계 현황 표시

```
행성 허브 진입 시 표시되는 정보:
  ┌─────────────────────────────────────────────┐
  │  [아르카디아 프라임]                          │
  │  소유: 블루 진영  |  경제 상태: 🟢 활황       │
  │                                              │
  │  궤도 트래픽:                                │
  │  ▸ [수송] 화물선 "파르테논"  → 솔라 항구 중  │
  │  ▸ [순찰] 구축함 "썬더호크" — 경계 중        │
  │  ▸ [채굴] 광업함 "드릴러-3" — 소행성대 작업 중│
  │                                              │
  │  오늘의 전황:                                │
  │  - 레드 진영이 Zone 7에서 교전 중            │
  │  - 수송선단 3편 도착 완료                    │
  └─────────────────────────────────────────────┘
```

### 11-2. Stage 2 은하 지도 — 진영 세력도 표시

```
clan_map_faction_color_policy.csv 기반 색상 표시:
  BLUE 점유 행성: 파란색 외곽선
  RED 점유 행성:  빨간색 외곽선  
  PLAYER 점유:    금색 외곽선
  
  세력 변화 알림:
  - "⚔️ Zone 12에서 점령전이 발생했습니다"
  - "📦 수송선단이 오메가 스테이션에 도착했습니다"
```

### 11-3. 오프라인 보상 화면 (앱 재시작 시)

```
앱 시작 시 오프라인 경과 계산 후 표시:
  ┌─────────────────────────────────────────────┐
  │  ⏰ 8시간 동안 은하계가 움직였습니다          │
  │                                              │
  │  ✅ 수송선단 2편 도착 → 자원 +4              │
  │  ⚔️ 점령전 발생 — Zone 9 현상유지            │
  │  💰 행성 수익: +24,000 Cr 수령 대기 중       │
  │                                              │
  │  [수령하기]                                  │
  └─────────────────────────────────────────────┘
```

---

## 12. 구현 로드맵

### Phase 1 — 기반 구조 (2주)

| 작업 | 파일 | 우선순위 |
|------|------|--------|
| `ArcBotEcosystemEngine.ts` 골격 생성 | `src/arcCore/ecosystem/` | 🔴 필수 |
| `BotEcosystemPolicy.ts` CSV 로더 구현 | aiVirtualPlayerDensity.csv 파싱 | 🔴 필수 |
| `BotEconomyLedger.ts` 기본 구조 | AsyncStorage 스키마 정의 | 🔴 필수 |
| `runArcCoreDailyOpsBatch()` 확장 | 신규 패스 5개 추가 | 🔴 필수 |

### Phase 2 — 수송선단 시뮬레이션 (2주)

| 작업 | 파일 | 우선순위 |
|------|------|--------|
| `BotTradeFleetManager.ts` 구현 | trade_route_planet_supply_assignments.csv 100개 룰 | 🟡 중요 |
| 오프라인 경과 시간 계산 로직 | `simulateTradeFleetProgress()` | 🟡 중요 |
| Stage 1 궤도 트래픽 역할 분리 연출 | AiNpcSubCore 확장 | 🟡 중요 |

### Phase 3 — 봇 전투 및 점령전 (2주)

| 작업 | 파일 | 우선순위 |
|------|------|--------|
| `BotFleetManager.ts` 구현 | planet_leveling_progression.csv 기반 수익 계산 | 🟡 중요 |
| `BotPlanetOccupationEngine.ts` 구현 | planet_occupation_seeds.csv 21개 행성 | 🟡 중요 |
| 유저 점령전 진입 Flow | Stage 3 Combat 연동 | 🟢 권장 |

### Phase 4 — 행성 스탯 연동 및 UX (2주)

| 작업 | 파일 | 우선순위 |
|------|------|--------|
| 5대 속성 자동 조정 로직 | `runPlanetEnergyCorePass()` 확장 | 🟡 중요 |
| 오프라인 보상 화면 UI | Stage 0 또는 Stage 1 Modal | 🟢 권장 |
| Firebase RTDB 글로벌 오버레이 연동 | `/arcfire/global_overlay` | 🟢 권장 |
| 생태계 현황 Stage 1 HUD | 행성 허브 정보 표시 | 🟢 권장 |

---

## 13. 제약 사항 및 주의점 (헌법 준수)

### 절대 금지 (기존 15대 헌법 추가)

```
Rule 16: BotEcosystemEngine의 어떤 계산도 렌더링 루프(rAF/postStepRef) 안에서 실행 금지.
         모든 생태계 연산은 배치 패스 또는 앱 시작 시 1회 실행으로 제한.

Rule 17: 봇 상태(BotCombatState, TradeFleetState, PlanetOccupationState)를
         Firebase Firestore 또는 RTDB에 저장 금지. AsyncStorage 로컬만 사용.

Rule 18: 행성 경제 활력(PEV)의 유저 영향 범위는 AABS Safe-Drift ±15% 캡을 초과할 수 없다.
         PEV 효과가 GlobalMultiplier와 중복 적용될 경우 합산이 1.3을 초과하지 않도록 클램핑.

Rule 19: 봇 전투 결과가 유저의 실제 크레딧 잔액을 직접 증감시키는 로직 작성 금지.
         봇 수익은 PlanetEconomyVitality를 통해서만 간접 영향.
```

### 구현 전 검토 필요 항목

1. **메모리 예산**: `BotTradeFleetState` 배열(100개 무역로)이 STAGE 1 200MB 예산 초과 여부 검증 필요
2. **AsyncStorage 용량**: 21개 행성 × 생태계 상태 데이터 = 예상 50KB 이내 (수용 가능)
3. **오프라인 계산 시간**: 앱 시작 시 오프라인 기간 최대 7일 기준 계산 복잡도 측정 필요 (목표: 200ms 이내)
4. **planet_occupation_seeds.csv `occupationCombatEnabled`**: 현재 `false`인 arcadia_prime 등은 봇 점령전 제외 처리 필수

---

## 14. 핵심 CSV 연동 매핑 요약

| CSV 파일 | 활용 모듈 | 용도 |
|----------|-----------|------|
| `aiVirtualPlayerDensity.csv` | BotFleetManager | 행성 유형별 봇 수 및 역할 비율 |
| `planet_occupation_seeds.csv` | BotPlanetOccupationEngine | 21개 행성 초기 점유 및 전투 활성화 여부 |
| `planet_leveling_progression.csv` | BotFleetManager | 봇 전투 사이클당 수익 기준 |
| `trade_route_planet_supply_assignments.csv` | BotTradeFleetManager | 100개 공급-수요 무역 쌍 |
| `trade_route_transport_policy.csv` | BotTradeFleetManager | 수송 시간 정책 |
| `arc_core_planet_attack_level_policy.csv` | BotPlanetOccupationEngine | 행성 공격 강도 배율 |
| `planet_defense_satellite_level_policy.csv` | BotPlanetOccupationEngine | 방어 위성 방어율 |
| `arc_core_planet_upkeep_policy.csv` | BotEconomyLedger | 행성 일일 유지비 |
| `dynamic_overlay.csv` | 전체 생태계 | 글로벌 배율 오버레이 |
| `capital_ship_combat_level_class.csv` | AiNpcSubCore | 존 레벨별 적정 함급 선택 |
| `capital_ship_instance_class.csv` | BotFleetManager/TradeFleetManager | 전투함/수송함 분류 |
| `economy_sim_macro_policy.csv` | BotEconomyLedger | F2P 최적 플레이 시간 등 거시 경제 파라미터 |
| `planet_attack_core_damage.csv` | BotPlanetOccupationEngine | 점령전 행성 스탯 피해량 |
| `clan_map_faction_color_policy.csv` | UI 연출 | 진영별 색상 표시 |

---

## 15. 결론

본 명세서는 **Firebase 무료 한도를 초과하지 않으면서**, **기존 Local-AI-First 원칙과 헌법(15대 금지)을 완전히 준수**하는 범위 내에서 살아있는 은하계 생태계를 구현하는 방안을 제시한다.

핵심 요약:
- **봇 연산은 100% 로컬** (AsyncStorage + planetMemoCache)
- **Firebase는 유저 결과 단발 기록만** (읽기 2,000/일, 쓰기 6,000/일 — 무료 한도 대비 96% 여유)
- **생태계 정산은 일 1회 배치** (12:00 KST runArcCoreDailyOpsBatch 통합)
- **유저 체감**: 행성에 돌아올 때마다 전황이 바뀌고, 수송선단이 이동하며, 수익이 쌓여있는 "살아있는 우주"

---

*ARCFIRE_ACTIVE_ECOSYSTEM_SPEC_v1.0.md*  
*생성일: 2026-06-26*  
*저장 경로: `docs/ecosystem/ARCFIRE_ACTIVE_ECOSYSTEM_SPEC_v1.0.md`*
