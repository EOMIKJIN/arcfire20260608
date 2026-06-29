# ArcCore Economy Fabric — 김경제 분석·개선 로드맵

> **원칙**: 운영 **실물 데이터**(교역 재고·수송 정산·공격 피해)가 먼저이고, 5대 스탯(R,P,D,T,E)은 그 결과를 **반영·정규화**하는 계층.  
> **구현 정본**: `src/arcCore/economy/planetEconomyFabric.ts`

---

## 1. 현재 아크코어 경제 축 (21행성)

| 레이어 | 정본 | 역할 |
|--------|------|------|
| 일일 배치 | `runArcCoreDailyOpsBatch` · `ArcCoreDailyOpsSubCore` | 12:00 KST 1회 |
| 무역소 진열 | `tradePortCatalogPolicy` · zone/level CSV | weapon·equipment·capital·tg 혼합 |
| 교역 tg_* | `tradeRouteRegistry` · planet assignments | 생산지/수요지 17무역소 |
| 시장 재고·가격 | `planetTradeMarketStore` | stock·convoy·player 채널 |
| 수송 정산 | `runArcTransportTradePass` · `arcConvoyTradePlanner` | temp bank 수익 |
| 5대 스탯 | `planetCoreRuntimeStore` | AsyncStorage 정본 |
| 공격→스탯 | `applyPlanetAttackCoreDamage` | 드론 등 즉시 Δ |
| R(자원) | `runPlanetEnergyCorePass` | 광물 CSV→R (일 1회) |
| 마스터 밸런스 | `deriveMasterBalanceCoreTargets` | **레벨링 CSV→스탯 목표** (운영과 분리) |

---

## 2. 효율적인 부분 (유지)

1. **일 1회 수렴** — 가격·AABS·overlay ingest 고빈도 금지 준수.
2. **tg 교역 파이프** — supply/demand 배정·거리·수송비·convoy 정산 **실물 흐름** 존재.
3. **Table-First** — `planet_trade_route_profile` · assignments · attack damage CSV.
4. **명령 버스** — `AiEconomySubCore` 무역소 bulk 단일 주체.
5. **공격→스탯** — 드론(`arc_inbound_drone_impact`) 방어·기술 Δ 파이프라인 완성.

---

## 3. 비효율·단절 (개선 대상)

| # | 문제 | 현재 | 목표 |
|---|------|------|------|
| A | **스탯↔무역 재고** | `buildSupplyEntry` pseudoRandom+밴드만 | R·P·운영 윈도우→`supplyStockScale` |
| B | **스탯 목표 역방향** | `deriveMasterBalanceCoreTargets`가 레벨링만 | 운영 스냅샷이 **보조 입력** (일 1회 캡) |
| C | **공격 순환고리** | D↓만 즉시, 생산↓ 없음 | D/P 피해→fabric 윈도우→일일 재고·(후속) P |
| D | **무역소 vs tg** | 카탈로그·교역 시장 **병렬** | Fabric이 **공통 행성 경제 스냅샷** 제공 |
| E | **관측·학습** | balance-ops는 정적 감사 | fabric `window`·`lastDailyReconcile` KPI |
| F | **TDI·15단계 R&D** | 문서만 (`_000_Arcfire_Planet_Final_Master_Plan`) | Fabric 슬롯으로 후속 페이즈 |

---

## 4. 데이터 흐름 (목표 순환)

```text
[운영 실물]
  수송 정산(convoy) · 교역 재고 변동 · 드론/공격 피해
        ↓ recordPlanetEconomy*Signal (24h window)
[Economy Fabric window]
        ↓ runPlanetEconomyFabricDailyPass (일 1회)
[supplyStockScale · reconcile 메타]
        ↓ rebuildPlanetTradeMarket · syncTradePortCatalog
[무역소·교역 UI 실물]
        ↓ (이미 구현) applyPlanetAttackCoreDamage
[5대 스탯 R,P,D,T,E] ← runPlanetEnergyCorePass(R) · masterBalance(레벨링)
```

**우선순위**: 위 화살표 **위에서 아래** (실물→스탯). 레벨링 목표는 **최대 변화 캡**만.

---

## 5. 1차 기반 작업 (2026-06-15 완료)

- `planetEconomyFabric.ts` — window 누적·일일 reconcile·`supplyStockScale`
- `detail.economyFabric` — `planetCoreMetricTypes`
- 드론 피해 → `recordPlanetEconomyAttackSignal`
- convoy 정산 → `recordPlanetEconomyConvoySettlement`
- 플레이어 매매 → `recordPlanetEconomyPlayerTrade` (`trade.tsx` 성공 시)
- 생산지 stock ← `resolvePlanetSupplyStockScale`
- 일일 배치 → `runPlanetEconomyFabricDailyPass` (R·P nudge ±2/일, `supplyStockScale`) → `runPlayScenarioEconomyPass` 전

---

## 6. 페이즈 2~4 (권장)

| 페이즈 | 내용 | 산출 |
|--------|------|------|
| **P2** | fabric reconcile → **P·R 소폭 nudge** (일 1회 ±2, 캡) | 스탯이 실물 뒤따라가기 | ✅ `runPlanetEconomyFabricDailyPass` |
| **P3** | 생산지 카탈로그 **SKU 수**를 zone+stockScale 연동 | 진열 다양성=생산력 | ✅ `listMineralIdsForPlanetCatalog` |
| **P4** | 17무역소 convoy·profit **집계 KPI** → `audit:balance-ops` | 김경제 3h 보고 |
| **P5** | TDI·R&D 스킬트리 → fabric `development` 슬롯 | 기획 문서 연동 |

---

## 7. 검증

```bash
npm run audit:balance-ops
npx tsc --noEmit -p tsconfig.client.json
```

드론 피해 후: `detail.economyFabric.window.attackDefenseLoss` 증가 → 다음 12:00 배치 후 `supplyStockScale` 하락 → 생산지 `stock` 감소.

---

## 8. 5대 스탯 연결 매트릭스 (드론·공격 **배제**)

> **질문**: 경제 실물 중 스탯에 아직 안 묶인 것 — **어떤 스탯에** · **개발 가능성**?

### 8-1. 현재 스탯을 **갱신하는** 경로 (공격 제외)

| 경로 | 대상 스탯 | 입력 데이터 | 주기 |
|------|-----------|-------------|------|
| `runPlanetEnergyCorePass` | **R** | 광물 CSV·은하 집계·소행성 궤도 | 일 1회 |
| `runGlobalPlanetMasterBalancePass` | R,P,D,T,E | `planet_leveling_progression` 목표 | 일 1회 |
| `runPlanetEnvironmentDiversityPass` | R,P,D,T,E | 성계 다양성·전투 궤도 시그널 | 일 1회 |
| `planetDevelopmentAccStore` → diversity | R,P,D,T,E | **궤도 NPC 수송선** 체류/위상 (연출 트래픽) | ~84s 패스 |
| `runPlayScenarioEconomyPass` | — (메타만) | `detail.masterBalance` 시나리오 필드 | 부트·일일 |
| `runPlanetEconomyFabricDailyPass` | **R,P** | convoy·플레이어 무역·공격 윈도우 | 일 1회 |
| `planetDefenseSatelliteLevel` | — | `detail.defenseSatellite.level` (**D 스칼라 무관**) | 업그레이드 시 |

**레벨링 CSV → 스탯**과 **광물 → R**은 연결됨. **교역·convoy·플레이어 매매**는 fabric window → **일 1회 R/P nudge**로 연결됨(즉시 스탯 변동 아님).

### 8-2. 실물 운영 데이터 (스탯 미연결)

| 실물 | 저장 위치 | 스탯 연동 | 비고 |
|------|-----------|-----------|------|
| tg 생산지 **재고·가격** | `planetTradeMarketStore` | ❌ | `supplyStockScale`만 **읽기**(스탯→재고) |
| **Arc convoy** 정산·수익 | `arcCoreTransportFleetBankStore` + fabric window | **R,P** (일 1회 nudge) | 행성별 profit·출하량 |
| **플레이어** 무역소 매수/매도 | fabric window + stock delta | **R,P** (일 1회 nudge) | 재고는 즉시 |
| 무역소 **진열 SKU** | `tradePortCatalogPolicy` | **R** (광물 슬롯) | zone + `supplyStockScale` |
| 존 **광물 진열** | `listMineralIdsForPlanetCatalog` | **R** (간접) | 스케일×zone 풀 |
| **채굴** 세션 보상 | player inventory / mining driver | ❌ | 행성 R 무관 |
| 방위위성 **레벨** | `detail.defenseSatellite` | ❌ | D 스칼라 분리 |
| Macro SIM overlay | category mul | ❌ | 글로벌 가격만 |

### 8-3. 스탯별 — 연결 **가능** 후보 (공격 없이)

| 스탯 | 연결 후보 (실물→스탯) | 권장 스탯 의미 |
|------|----------------------|----------------|
| **R** | 생산지 tg **재고 합** · convoy **출하량** · 플레이어 매도량 · 채굴(행성 소속) | 자원·생산·수출 |
| **P** | 수요지 **매입·convoy 유입** · 무역소 **거래 횟수** · 궤도 **체류 트래픽**(이미 부분) | 인구·상업·유동 |
| **D** | 방위위성 레벨 · (전투 궤도는 diversity에만) | 방어·군사 |
| **T** | zone **기술 tier** 진열 수 · 무기/장비 SKU 가용 | 연구·기술 |
| **E** | 채굴·산업 부하(후순위) · diversity 환경 패스(이미) | 환경 |

### 8-4. 개발 가능성 검토 (김경제 권장 순)

| ID | 작업 | 연결 | 난이도 | 일 1회 준수 | 비고 |
|----|------|------|--------|-------------|------|
| **S1** | fabric window: **플레이어 매매** 누적 (`trade.tsx` → record) | R↑ 매도·생산, P↑ 거래량 | **S** | ✅ | 훅 2곳 |
| **S2** | fabric 일일 reconcile → **R·P 소폭 nudge** (convoy·매매·재고만) | R,P | **S** | ✅ | 공격 항목 제외 가능 |
| **S3** | 생산지 **재고 합** 스냅샷 → reconcile **R 힌트** | R | **S** | ✅ | `getPlanetTradeMarketListings` |
| **M1** | `supplyStockScale` ← **R·P 스냅샷** (공격 penalty 제거 옵션) | 재고←스탯 | **S** | ✅ | 이미 반쯤 구현 |
| **M2** | 방위위성 **level ↔ D** 양방향 (레벨업 시 D+nudge, D 하한→캡) | D | **M** | 업그레이드·일일 캡 | detail만 있던 문제 해소 |
| **M3** | 진열 **광물 SKU 수** = `f(R, zone)` not zone alone | R,T | **M** | ✅ | `listMineralIdsForPlanetCatalog` |
| **M4** | convoy **행성별 profit** → `detail.economyFabric` KPI + R nudge | R,P | **M** | ✅ | temp bank는 글로벌 |
| **L1** | 채굴 세션 → **행성 R** (planetId 기준 누적) | R | **L** | tick 금지·세션 종료 1회 | mining driver 연동 |
| **L2** | `masterBalance` 목표를 **운영 스냅샷 보조**로만 (레벨링 캡) | 전체 | **L** | ✅ | `deriveMasterBalance` 개편 |
| **XL** | TDI·15단계 R&D → `detail.development` | T,E,P | **XL** | 문서·UI 선행 | 기획 슬롯 |

**즉시 착수 권장 (공격 배제)**: **S1 → S2 → S3** — fabric window 확장 + 일 1회 R/P nudge. 드론 없이도 convoy·무역 실물이 스탯을 **뒤따라가게** 만든다.

### 8-5. 의도적으로 **연결 보류**

| 항목 | 사유 |
|------|------|
| Macro SIM overlay → 스탯 | 글로벌 코호트·가격만 — 행성 스탯과 단위 불일치 |
| `globalEngageHpMul` | 전투 밸런스 전역 — 행성 5대와 별 축 |
| 실시간 매매 → 즉시 스탯 | v4.0 고빈도 금지 — **일 1회 nudge**만 |
| 드론·`attackDamage` → 생산 | 사용자 요청으로 **이번 범위 배제** |

---

## 9. 유지비·거래수수료 루프 (2026-06-15)

### 9-1. 자금 흐름 (금고 3분리)

```text
수송선단 convoy → arcCoreTransportFleetBank (중립 경제·RED 소속 연출)
RED 행성 유지비·무역 수수료(5%) → arcCoreVault
BLUE 행성 유지비·무역 수수료(5%) → blueTeamSharedVault
플레이어 소유 행성 유지비 → player.credits (일 1회)
무역 수수료 플레이어 몫(5%) → 행성 풀 → 1일 1회 지갑
중립·플레이어클랜 점유 행성 수수료(팩션 몫) → arcCoreVault 폴백
```

레거시 `arcfire_arc_core_temp_bank_v1` → 부팅 시 txn 종류별 분할 마이그레이션.

| 키 | 기본값 | 의미 |
|----|--------|------|
| `transport_fleet_seed_credits` | 500000 | 수송선단 금고 시드 |
| `arc_core_vault_seed_credits` | 100000 | 아크코어(RED) 금고 시드 |
| `blue_team_vault_seed_credits` | 100000 | 블루팀 금고 시드 |
| `allow_negative_vault_balance` | true | SIM용; **유지비는 spendUpToBalance로 0 캡** |
| `upkeep_fixed_credits_per_planet` | 800 | [보완 #2] 행성 1개당 일 유지비 고정 |
| `trade_fee_rate_pct` | 10 | 거래 총액 대비 수수료 |
| `trade_fee_player_wallet_share_pct` | 5 | 플레이어 일일 지급 풀 |
| `trade_fee_arc_immediate_share_pct` | 5 | 팩션 금고 즉시 적립 |

### 9-2. 코드 위치

| 모듈 | 역할 |
|------|------|
| `planetUpkeepPolicy.ts` | CSV 정본·유지비·수수료·금고 시드 |
| `resolveFactionVault.ts` | RED/BLUE 행성 → 금고 라우팅 |
| `arcCoreTransportFleetBankStore.ts` | 수송선단 금고 |
| `arcCoreVaultStore.ts` | 아크코어(RED) 금고 |
| `blueTeamSharedVaultStore.ts` | 블루팀 공용 금고 |
| `applyPlanetTradeTransactionFee.ts` | 무역 시 ledger·은행 분배 |
| `planetTradeFeeLedgerStore.ts` | 행성별 수수료 풀 AsyncStorage |
| `runArcCorePlanetUpkeepDailyPass.ts` | 일 1회 유지비·지갑 지급 |
| `runArcCoreDailyOpsBatch.ts` | 배치 말미 연동 |
| `trade.tsx` | 매수/매도 시 수수료 적용 |

### 9-3. 수송선단 convoy 버그·회계 (2026-06-29 수정 · 학습 기록)

**확인된 버그 (실측·코드)**

| # | 증상 | 원인 | 수정 |
|---|------|------|------|
| B1 | ledger `convoyGrossCredits`가 일 cap(45k) **수백~수천 배** 초과 | `planetTradeFeeLedger` **미 hydrate** 상태에서 하역 정산 → cap 검사 **스킵** + fee·gross **무제한 누적** | `canRunConvoyTradeSettlement()` — fleet bank **· ledger 둘 다 hydrate 후**만 정산 |
| B2 | txn 최근 120건 **전부 `convoy_buy`**, 하역 0 | cap 포화(`room≤0`) 후 **매입은 계속**·하역은 **화물 폐기**(환불·profit 없음) | **적재 게이트**: 수요지 `resolveConvoyDemandGrossRoomCredits` ≤0 이면 **route·적재 스킵** |
| B3 | cap 초과 ledger 잔존 시 **당일 영구 하역 불가** | B1로 쌓인 gross가 cap 대비 비정상 | hydrate 시 `healConvoyGrossLedgerBucketsOverDailyCap` — cap 초과 convoy gross **당일 0으로 복구** |

**의도적 설계 (버그 아님 · 2026-06-29 갱신)**

- 수송선단 금고: **매입 전액 출금(`convoy_buy`)** · 하역 **`convoy_trade_margin` 입금 → `convoy_transport`(연료·기타) 출금 → `convoy_arc_core_share` 출금** · fleet 순유지 = **순마진의 (100−arc_share)%** (기본 90%).
- **순마진 arc_share%**(기본 10%) → **`useArcCoreVaultStore`** (`convoy_net_margin_share`).
- 운송비 = `computeTradeRouteTransportCostPerUnit` × 하역 qty · note에 연료/기타 비율(`convoy_transport_fuel_share_pct` / `ops_share_pct`) 표시.
- `price_elasticity=0` · 일 1회 배치 · 순마진 플래너(손실 경로 제외) 유지.

**선택한 안정화 (1안 B+α, 회계 2안 미적용)**

- cap·ledger 정합 + **못 팔 수요지에는 사지 않음** — 기존 순마진·수수료·일 cap 정책 **유지**.
- `convoy_demand_daily_gross_cap_credits`·cargo bounds **CSV 변경 없음** (필요 시 Kim balance-ops 후속).

**정본 모듈**: `convoyDemandGrossRoom.ts` · `convoyGrossLedgerHeal.ts` · `runArcTransportTradePass.ts` · `arcConvoyTradePlanner.ts` · `planetTradeFeeLedgerStore.ts`(hydrate heal).

**재발 방지 체크리스트**

1. convoy 정산 경로 추가 시 **ledger hydrate 게이트** 필수.
2. **적재 전** 목적지 `demandRoom` 확인.
3. UI/감사: `convoy_cap_reject` audit·`totalInflow/outflow` vs txn 120 한도 교차.
4. **store ↔ economy 순환 import 금지** — heal은 `convoyGrossLedgerHeal.ts` 분리.

**1회 reseed (2026-06-29)**: `reseedArcCoreConvoyFleetBank.ts` — B1~B3 이전 **−2천만대 fleet bank** → 시드 500k · convoy ledger·RAM 화물 클리어 · 플래그 `arcfire_convoy_fleet_economy_reseed_20260629_v1` (기기당 1회). **계정 초기화와 무관.**

### 9-4. 수송선단 전수 재점검 (2026-06-29 · B1~B3 수정 후)

**점검 범위**: `runArcTransportTradePass` · `arcConvoyTradePlanner` · `convoyDemandGrossRoom` · `runArcCoreConvoyDailySettlementPass` · `planetTradeFeeLedgerStore` · `applyPlanetTradeTransactionFee` · `AiNpcSubCore`(dwell) · `AiEconomySubCore`(hydrate) · `synthFrontierConvoyTradeBridge` · `planetEconomyFabric` · CSV 정책.

**B1~B3 수정 검증 — PASS**

| 항목 | 상태 |
|------|------|
| ledger 미 hydrate 정산 차단 | `canRunConvoyTradeSettlement()` 적용 |
| 적재 전 수요 room 게이트 | `planArcConvoyRouteAtSupply` |
| cap 초과 ledger heal | `healConvoyGrossLedgerBucketsOverDailyCap` on hydrate |
| cap 거절 audit | `convoy_cap_reject` |

**추가 이슈 (수정 전 · 우선순위)**

| ID | 등급 | 문제 | 영향 |
|----|------|------|------|
| R1 | **P1** | `AiNpcSubCore.pickNextPlanetId` — `gatherDirectivePlanetId`가 **화물 목적지(`cargoDest`)보다 우선** | gather 중 적재 화물 **하역 불가·체류 반복** |
| R2 | **P1** | `shipCargoById` **RAM 전용** — 앱 종료·크래시 후 `convoy_buy`만 잔존 | **매입원금 영구 손실**(profit 없음) |
| R3 | **P2** | 하역 시 cap으로 `unloadQty` 축소 시 **매입은 전량·profit만 비율** | plan 시점 room과 **레이스** 시 원금 일부 손실 |
| S1 | **P2** | `convoy_demand_daily_gross_cap_credits=45000` vs **17 공급지 + 궤도 dwell** | cap 포화 시 **일일 정산·backfill 실패** (`no_route`/`load_failed`) — 설계 긴장 |
| S2 | **P2** | UI `fleetVault` = **raw balance** (조정 잔액·순마진 누적 미표시) | −2천만 **오해** (회계 설계와 UI 불일치) |
| S3 | **P2** | `txn_history_limit=120` — 최근 txn만 | 감사는 **`totalInflow/outflow` 정본** |
| S4 | **P2** | convoy 수수료 10% → **팩션 금고 적립**, fleet bank **미차감** | 의도적 SIM(거래량 기반 fiscal) — 문서화됨 |
| S5 | **P3** | `convoy_daily_min_trade_qty=2` — room 1개분만 남으면 route **스킵** | 당일 minQty 미달 |

**의도적 설계 (변경 불필요)**

- 순마진-only 금고 회계 · 3금고 분리 · fleet→팩션 자동 이전 없음 · `price_elasticity=0` · 손실 route 플래너 제외.

**다음 개선 권장 (안정·최소 diff)**

1. **R1** — `cargoDest` 있으면 gather보다 **목적지 우선** (`pickNextPlanetId` 1줄 순서).
2. **R2** — in-flight cargo **경량 persist** 또는 부트 시 orphan buy **audit** (대규모 회계 변경 없음).
3. **S2** — 경제 UI에 **조정 잔액·당일 순마진** 보조 표기 (선택).
4. **S1** — Kim `audit:balance-ops` 후 cap CSV 조정 **또는** daily pass만 cap 완화 (정책).

**재발 방지**

- convoy 경로 PR → hydrate 게이트 · demand room · `npm run audit:balance-ops` · headless convoy sim 복구(`tools/audit-convoy-coverage.mjs` TS import 깨짐).

### 9-3. 되는 것 / 안 되는 것

| ✅ 구현됨 | ❌ 아직 없음 |
|-----------|-------------|
| convoy → **수송선단 금고** (팩션 금고와 분리) | 수송선단→팩션 **자동 이전** (의도적 미구현) |
| RED·BLUE 각 금고 유지비·수수료 | 미납 시 점령 상실·스탯 패널티 |
| 금고 마이너스 잔고 허용(SIM) | **유지비는 0까지만** (`spendUpToBalance`) |
| 무역 10% 수수료·5%+5% 분배 | 무역소 외 경로(채굴 직판 등) 수수료 |
| 소유 행성 무역 수수료 풀 → 1일 1회 지갑 | 수수료가 5대 스탯(R,P…)에 직접 반영 |
| 잔고·은행 부족 시 `upkeep_shortfall` 로그 | Macro SIM·overlay와 유지비 연동 |
| **중립 행성 수수료 → arccore_vault** | [보완 #3] |

유지비 인구 입력: `planetCoreRuntimeStore.population` (없으면 `planets.csv` 시드).

---

## 11. 경제 초기 설계 보완 (2026-06-16)

> AsyncStorage + CSV 시드 + 12:00 KST 배치 구조 유지. 상세 구현은 각 모듈 `// [보완 #n]` 주석.

### 11-1. [보완 #1] 일일 배치 타이밍 · `arcfire_arc_core_daily_ops_v1`

| 항목 | 규칙 |
|------|------|
| **lastBatchDate** | `lastBatchDayKey`와 동일 KST `YYYY-MM-DD` — 배치 완료 시 AsyncStorage 기록 |
| **오늘 미실행** | `lastBatchDate !== today`이면 `ArcCoreDailyOpsSubCore` probe에서 **즉시** `runArcCoreDailyOpsBatch()` |
| **누락 보정** | 앱 꺼짐 등으로 `lastBatchDate < today` → 다음 실행 시 **12:00 대기 없이** 1회 보정 |
| **첫 가입 당일** | `lastBatchDate` 없음 + `player.createdAt` 당일 → 배치 **스킵**(CSV 시드 유지) |
| **가입 다음날** | `lastBatchDate` 없음 + 가입일 < 오늘 → 누락 보정 **즉시** |
| **정상 스케줄** | 가입 다음날 이후 당일 첫 배치는 **12:00 KST** 이후 (`arc_core_daily_ops_policy.csv`) |

코드: `arcCoreDailyOpsPolicy.shouldRunArcCoreDailyBatch` · `arcCoreDailyOpsState` · `ArcCoreDailyOpsSubCore`.

### 11-2. [보완 #2] 유지비 800 cr/일 · 행성 1개당

| 항목 | 값 |
|------|-----|
| 일 유지비 | **800 cr/행성** 고정 (`upkeep_fixed_credits_per_planet=800`) — P=50% 기준 설계, **P 변동 무시**(추후 동적) |
| BLUE 행성 | `blue_vault` (블루팀 공용 금고) |
| RED 행성 | `arccore_vault` |
| 중립 행성 | `arccore_vault` (폴백) |
| 잔고 부족 | `spendUpToBalance` — **0까지만** 차감, `upkeep_shortfall` txn 로그 (행성 패널티 추후) |
| 플레이어 소유 | `player.credits` (기존) |

CSV: `tables/balance/arc_core_planet_upkeep_policy.csv` · `runArcCorePlanetUpkeepDailyPass.ts`.

### 11-3. [보완 #3] 수수료 귀속 · 금고 키

| 점유 | 금고 키 | 스토어 |
|------|---------|--------|
| BLUE | `blue_vault` | `blueTeamSharedVaultStore` |
| RED | `arccore_vault` | `arcCoreVaultStore` |
| **중립** | `arccore_vault` | 플레이어·convoy 수수료 **전부** 아크코어 금고 |
| 플레이어 클랜 | `arccore_vault` | 수수료 폴백 |

분기 정본: `getVaultKeyByFaction(faction)` · `resolveTradeFeeFactionVault` (`resolveFactionVault.ts`).

### 11-4. [보완 #4] PGP(행성 총생산)

**식**: `PGP = (R+P+D+T+E)/5 × 3,375 BMU` (0..100 스탯; 정수화 `sum×3375/10`).  
**검증**: 전 스탯 50 → **84,375 BMU**.

| 항목 | 규칙 |
|------|------|
| 재계산 | **12:00 KST 배치만** (`runPlanetPgpDailyPass`) — 실시간 없음 |
| 저장 | `arcfire_planet_core_runtime_v1` — `byPlanetId[].pgp` + 플랫 키 `planet_{planetId}_pgp` |
| UI | 배치 저장값 우선, 없으면 레거시 즉시 계산 폴백 |

코드: `planetPgpModel.ts` · `runPlanetPgpDailyPass.ts` · `planetCoreRuntimeStore` persist.

---

## 10. 외부 평가·히스토리

타이틀 비교·운영 효율성 **종합 평가 리포트**는 `docs/economy-evaluation/`에 날짜별 보관.

- 인덱스: [economy-evaluation/README.md](./economy-evaluation/README.md)
- 1차 (2026-06-15): [2026-06-15-arccore-economy-evaluation.md](./economy-evaluation/2026-06-15-arccore-economy-evaluation.md)

