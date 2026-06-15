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
| `allow_negative_vault_balance` | true | 금고 마이너스 허용 |
| `upkeep_base_credits` | 200 | 행성 유지비 기본 |
| `upkeep_per_population_credit` | 12 | 인구 스칼라(0–100) 1당 추가 |
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

### 9-3. 되는 것 / 안 되는 것

| ✅ 구현됨 | ❌ 아직 없음 |
|-----------|-------------|
| convoy → **수송선단 금고** (팩션 금고와 분리) | 수송선단→팩션 **자동 이전** (의도적 미구현) |
| RED·BLUE 각 금고 유지비·수수료 | 미납 시 점령 상실·스탯 패널티 |
| 금고 마이너스 잔고 허용 | 오프라인 플레이어(uid 없음) 유지비 |
| 무역 10% 수수료·5%+5% 분배 | 무역소 외 경로(채굴 직판 등) 수수료 |
| 소유 행성 무역 수수료 풀 → 1일 1회 지갑 | 수수료가 5대 스탯(R,P…)에 직접 반영 |
| 잔고·은행 부족 시 실패 기록(강제 차감 없음) | Macro SIM·overlay와 유지비 연동 |

유지비 인구 입력: `planetCoreRuntimeStore.population` (없으면 `planets.csv` 시드).

---

## 10. 외부 평가·히스토리

타이틀 비교·운영 효율성 **종합 평가 리포트**는 `docs/economy-evaluation/`에 날짜별 보관.

- 인덱스: [economy-evaluation/README.md](./economy-evaluation/README.md)
- 1차 (2026-06-15): [2026-06-15-arccore-economy-evaluation.md](./economy-evaluation/2026-06-15-arccore-economy-evaluation.md)

