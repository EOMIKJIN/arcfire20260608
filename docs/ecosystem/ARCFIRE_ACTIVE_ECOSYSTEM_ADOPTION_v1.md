# ARCFIRE Active Ecosystem v1.0 — 적용 가능 항목만 추출 (중복 제거판)

> **원본 검토 문서**: [`../ARCFIRE_ACTIVE_ECOSYSTEM_SPEC_v1_0.md`](../ARCFIRE_ACTIVE_ECOSYSTEM_SPEC_v1_0.md)  
> **작성**: 2026-06-26  
> **상태**: **검토·1차 메모리 감사 완료 — 구현 대기(확장만, 신규 엔진 없음)**  
> **원칙**: **중복 시스템 금지** · 유사 개념 **이중 추가 금지** · `.cursor/rules/arcfire-memory-leak-audit-first.mdc` 1순위

---

## 0. 결론 (한 줄)

원본 명세의 **「살아있는 은하계」 체감** 중, **이미 구현된 ArcCore 축을 확장하면 되는 것**만 채택한다.  
**`ArcBotEcosystemEngine` · `BotEconomyLedger` · `PlanetEconomyVitality` · Firebase RTDB · 봇 점령전 자동 소유권 변경** 은 **채택하지 않는다** (기존 `planetEconomyFabric` · `AiNpcSubCore` · `planet_holds` · v4.0 헌법과 중복·충돌).

---

## 1. 1차 메모리·누적·누수 리스크 검토 (원본 명세 대상)

| # | 원본 제안 | 리스크 등급 | 판정 |
|---|-----------|-------------|------|
| M1 | **`ArcBotEcosystemEngine` 신규 총괄 + 5개 서브매니저** | 🔴 높음 | **거부** — `arcCoreHub`·4 SubCore와 **이중 아키텍처**. 부트·배치 진입점 분열 → 2026-06-16 부트 OOM 회귀 패턴 |
| M2 | **앱 시작 시 오프라인 봇/수송선단 전수 시뮬** (§2-2 #1) | 🔴 높음 | **조건부만** — `InteractionManager`·**일 1회 배치 또는 허브 진입 1회**로 제한. 동기 부트·7일×100로×21행성 루프 **금지** (목표 200ms는 배치 청크+yield 필수) |
| M3 | **`TradeFleetState[]` 100개 영속 배열** | 🟡 중간 | **거부(별도 store)** — `runArcCoreConvoyDailySettlementPass`·`recordPlanetEconomyConvoySettlement`로 **집계만**. 개별 fleet 객체 상시 유지 **금지** |
| M4 | **`BotCombatState` per-bot HP/미션 사이클** | 🟡 중간 | **거부** — 실시간/오프라인 전투 시뮬은 STAGE3 전용. 허브는 **연출 스냅샷만** (v4.0 §6-2 최대 5척) |
| M5 | **일일 배치 +5 패스 추가** (§9) | 🟡 중간 | **확장만** — `runPlanetEconomyFabricDailyPass`·`runArcCoreConvoyDailySettlementPass` **내부 보강**. pass **5개 신규 파일 금지** |
| M6 | **`PlanetEconomyVitality` + 효과(수수료·드랍)** | 🔴 높음 | **거부** — `planetEconomyFabric.lastDailyReconcile.supplyStockScale`·AABS·`economyPriceOverlay`와 **삼중 보정**. PEV는 fabric **별칭 문서화**로 충분 |
| M7 | **AiNpcSubCore 역할별 연출 확장** (§7) | 🟢 낮음 | **채택(제한)** — `npc_ai_ships.csv` 파라미터만. **함선 수·스냅샷 4Hz·최대 5척** 유지 |
| M8 | **Firebase RTDB `/arcfire/global_overlay`** (§8-2) | 🔴 높음 | **거부** — v4.0 `onSnapshot`/실시간 금지·`ingestBalanceOverlayDeltaIfPending` **일 1회** 정본. RTDB = 중복 + Spark read 낭비 |
| M9 | **`daily_rewards` Firestore 쓰기** (§8-1) | 🟡 중간 | **보류** — player scope·purge 연동 설계 전 **미구현**. fabric window로 **로컬 pending** 먼저 |
| M10 | **Stage 1 Skia 수송 방향성 연출** (§4-4) | 🟡 중간 | **보류** — Skia Zero-Allocation·`audit:skia-memory` **선행**. 현 RN 마커·기존 궤도 트래픽 유지 |
| M11 | **§10 bot→5대 스탯 일일 nudge 중복** | 🟡 중간 | **거부** — `runPlanetEnergyCorePass`·`runPlanetEconomyFabricDailyPass`(±2 캡)와 **이중 nudge** |
| M12 | **AsyncStorage 봇 상태 50KB** (§13) | 🟢 낮음 | **불필요** — fabric detail·faction vault·`planetCoreRuntimeStore`에 **이미 분산**. 신규 키 **금지** |

**1차 게이트 (채택 항목 구현 시 필수)**  
`npm run audit:memory:all` · 부트·배치 경로 **동기 장시간 루프 없음** · 김경제 **`mem-post-dev-recheck`** · Skia 변경 시 GL mtrack Δ ±15MB.

---

## 2. 설계 보강 (채택 범위만)

### 2-1. 단일 수렴점 (신규 엔진 대신)

```text
ArcCoreHub (기존)
├── AiNpcSubCore          ← 궤도 연출·수송 체류 (visual + dwell command)
├── AiEconomySubCore      ← 무역소·convoy·transport settle
├── ArcCoreDailyOpsSubCore ← 12:00 배치 · fabric reconcile · convoy daily
└── (선택) ArcCoreTerritorialCombatSubCore ← 접전 자동전투 (별도 로드맵)

❌ ArcBotEcosystemEngine / Bot*Manager / BotEconomyLedger — 추가하지 않음
```

### 2-2. 「경제 활력」= Economy Fabric (용어 통일)

| 원본 PEV 필드 | 기존 정본 | 조치 |
|---------------|-----------|------|
| `economyVitalityScore` | `economyFabric.lastDailyReconcile.supplyStockScale` (0.35~1.65) | **동일 개념** — UI 문구만 「활력/재고 배율」 |
| `tradeFleetArrivalCount` | `fabric.window.convoyTrips` / convoy daily pass | **집계 reuse** |
| `botCombatCycleCount` | (없음) | **미도입** — territorial pass 또는 news 연출만 |
| `tradePortFeeDiscount` | `applyPlanetTradeTransactionFee` · trade policy | **기존 수수료 경로** |
| `weaponDropRateBonus` | AABS `dropWeight` · 일 1회 | **PEV 별도 bonus 금지** |

### 2-3. 점유·이권 (v4.0 vs 원본 충돌 해소)

| 원본 §5 봇 점령전 | 현행 v4.0 | 채택 |
|------------------|-----------|------|
| BLUE/RED force 누적 → `changePlanetOwner` | **플레이어 `planet_holds` 단발 merge** · AI 팩션 **연출용 시드** | **봇 자동 소유권 변경 거부** |
| `PLAYER` 점령전 Stage3 | 행성 로컬 점유(무역소 증서 구매) | **기존 governor/ holds 유지** |
| `occupationCombatEnabled` | `planet_occupation_seeds.csv` + `seedPlanetOccupationFromBalance` | **CSV·접전 모드(`territorialCombatGraph`)만** — 일일 force 정산 **미구현** |

### 2-4. 타이밍 계약 (메모리 안전)

원본 §2-2 3타이밍 중 **아래만 허용**:

1. **`runArcCoreDailyOpsBatch` 내부** — convoy·fabric reconcile (이미 있음)  
2. **행성 허브 진입 1회** — `capturePlanetEconomyOperationalSnapshot` 수준 **읽기 전용** UI  
3. ~~앱 시작 전수 오프라인 시뮬~~ → **배치 미실행 catch-up만** `ArcCoreDailyOpsSubCore.probeDailyBatch` (기존)

**금지**: `setInterval` · render/tick 내 생태계 연산 · 거래/틱마다 AsyncStorage.

---

## 3. 중복 매핑表 (원본 → 현행 → 조치)

| 원본 § | 모듈/개념 | 현행 정본 | 조치 |
|--------|-----------|-----------|------|
| 2 | ArcBotEcosystemEngine | `ArcCoreHub` + SubCores | **신규 생성 ❌** |
| 3 | BotFleetManager | `AiNpcSubCore` · STAGE3 combat | **연출·접전 로드맵만** |
| 4 | BotTradeFleetManager | `runArcTransportTradePass` · `runArcCoreConvoyDailySettlementPass` · `AiNpcSubCore` | **기능 ✅ 이미 있음** — fleet state store ❌ |
| 5 | BotPlanetOccupationEngine | `planet_holds` · `seedPlanetOccupationFromBalance` · `territorial/` | **자동 점유 변경 ❌** · 시드·색상 UI ⭕ |
| 6 | BotEconomyLedger / PEV | `planetEconomyFabric.ts` | **PEV 레이어 ❌** · fabric 확장 ⭕ |
| 7 | AiNpcSubCore 고도화 | `npc_ai_ships.csv` · 4Hz snapshot | **CSV 역할 파라미터 ⭕** (함량 상한 유지) |
| 8 | Firebase RTDB overlay | `economyPriceOverlayStore` · SIM delta ingest | **RTDB ❌** |
| 9 | 배치 +5 pass | `runArcCoreDailyOpsBatch` (fabric·convoy·upkeep…) | **기존 pass 보강 ⭕** · +5 파일 ❌ |
| 10 | bot→5대 스탯 nudge | `runPlanetEnergyCorePass` · fabric ±2 | **중복 nudge ❌** |
| 11 | Stage1/2 UX | `PlanetEconomyInfoOverlay` · worldmap | **문구·스냅샷 ⭕** · 대형 HUD 보류 |
| 12 | Phase 1~4 로드맵 | `ARC_CORE_ECONOMY_FABRIC.md` Phase 2~4 | **fabric·territorial 우선** |

---

## 4. 적용 가능 항목만 (구현 backlog)

### A. 즉시 가능 · 중복 없음 (P1)

| ID | 내용 | 터치 파일 (확장만) | 메모리 메모 |
|----|------|---------------------|-------------|
| A1 | **수송·교역 실물 → fabric window** (원본 §4 효과) | `recordPlanetEconomyConvoySettlement` (✅) · convoy daily | hot path persist 없음 |
| A2 | **허브 「오늘의 운영」1줄** — convoy trips · trade gross · supply scale | `planetEconomyInfoSnapshot` · overlay content | 진입 1회 read |
| A3 | **`npc_ai_ships.csv` `npcMode` → 궤도 dwell/phase 차등** | `AiNpcSubCore` · table registry | 5척·4Hz·change-key gate 유지 |
| A4 | **은하 지도 진영 외곽선** — `planet_occupation_seeds` + holds | `worldmap.tsx` · `clan_map_faction_color_policy` | 정적 CSV·store read |
| A5 | **접전 알림 copy** — `alertLabelKo` · news board | `ArcNewsBoardSubCore` · seeds CSV | tick publish 금지 |

### B. fabric 보강 · 명세 아이디어 흡수 (P2 · 설계 확정 후)

| ID | 내용 | 금지 |
|----|------|------|
| B1 | fabric reconcile에 **「활력 등급」UI 라벨** (침체/보통/활황) — `supplyStockScale` 구간 매핑 | PEV 별도 store · AABS 이중 적용 |
| B2 | convoy daily 결과 **행성별 windowSummary** fabric에 merge (이미 window 있음) | 100 fleet 객체 |
| B3 | **`occupationCombatEnabled=true` 행성**만 territorial/news 후보 (CSV 게이트) | BotPlanetOccupationEngine |

### C. 보류 · 별도 헌법·Skia 게이트 (P3)

| ID | 내용 | 선행 조건 |
|----|------|-----------|
| C1 | 오프라인 「N시간 은하계」 요약 Modal | fabric reconcile diff · **배치 catch-up 후 1회** |
| C2 | Skia 수송 방향 궤도 | `audit:skia-memory` PASS |
| C3 | 유저 행성 **일일 크레딧 pending** | player purge · Firestore schema · **daily_rewards ❌ until spec** |

---

## 5. 명시적 비채택 목록 (이중 추가 방지)

다음은 **구현하지 않음** — 원본 명세 참고용으로만 보관:

1. `src/arcCore/ecosystem/ArcBotEcosystemEngine.ts` 및 하위 5파일 트리  
2. `PlanetEconomyVitality` / `BotEconomyLedger` / `PlanetEconomyState` **별도 Zustand·AsyncStorage**  
3. `BotCombatState` · per-bot credits · 오프라인 combat cycle loop  
4. `TradeFleetState[]` 100개 상시 시뮬 + transit progress tick  
5. `runBotCombatCycleSettlementPass` · `runTradeFleetArrivalSettlementPass` · `runPlanetOccupationBattlePass` · `runPlanetEconomyVitalityComputePass` · `runPlayerDailyPlanetIncomePass` (**신규 5 pass**)  
6. Firebase **RTDB** `global_overlay` · `onValue`  
7. Firestore **`daily_rewards`** (purge·player scope 미정)  
8. 봇 force 기반 **`changePlanetOwner(BLUE|RED)`** 자동 점유  
9. PEV 기반 **실시간** 무역가·드랍율 micro-adjust  
10. `applyBotEcosystemEffectsToStats` — 5대 스탯 **추가** 일일 nudge  

---

## 6. 권장 구현 순서 (중복 없는 최소 경로)

```text
Phase A (P1) — 문서·UI·CSV만
  A3 npcMode 연출 → A4 worldmap 색 → A2 economy overlay 한 줄 → A5 news copy

Phase B (P2) — fabric 용어·등급 UI (PEV 신규 store 없음)
  B1 vitality label mapping → B2 convoy→window (audit:balance-ops)

Phase C — territorial / learning / Skia (별도 정본)
  ARC_CORE_TACTICAL_* · SUSTAINABLE_LEARNING (DORMANT) · Skia gate
```

**완료 Definition of Done (각 Phase)**  
`tsc` · `audit:balance-ops` · `audit:memory:all` · 김경제 `mem-post-dev-recheck` · (Skia 시) GL mtrack.

---

## 7. 관련 정본 (구현 시 읽을 순서)

1. `docs/ARC_CORE_ECONOMY_FABRIC.md`  
2. `src/arcCore/economy/planetEconomyFabric.ts`  
3. `src/arcCore/economy/runArcCoreConvoyDailySettlementPass.ts`  
4. `src/arcCore/subcores/AiNpcSubCore.ts`  
5. `src/arcCore/balance/seedPlanetOccupationFromBalance.ts`  
6. `.cursor/rules/arcfire-memory-leak-audit-first.mdc`  
7. 원본 (전체): `docs/ARCFIRE_ACTIVE_ECOSYSTEM_SPEC_v1_0.md`

---

*본 문서는 원본 v1.0 **검토 산출물**이며, 코드 변경 없이 적용 범위만 한정한다.*
