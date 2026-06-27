# 김경제 → 김팀장 Handoff

> **작성**: 김경제 에이전트 (`@김경제`) — 작업 완료·테스트 후 갱신  
> **검수**: 김팀장 에이전트 (`@김팀장`) — `npm run audit:team-lead:daily`

## [관측] 2026-06-27 17:04 KST — 오후 감시 · 17:00 자동보고

- **김경제 감시**: watch-30m PID **30408** · report-watch PID **26380** · auto-fix=OFF(record-only)
- **mem-monitor**: **OK** (PSS 788.3MB · GL 34.2MB · Views 368 · pid=20481)
- **report**: `D:\arcfire20260607\tools\long-run-monitor\logs\afternoon-watch-report-20260627-1700.md`
- **latest summary**: `tools/long-run-monitor/logs/DAILY_5PM_REPORT_LATEST.md`
- **timeline marker**: AFTERNOON_WATCH_START
- **incidents (actionable tail)**: 10
  - [2026-06-27 10:34:58] PSS_SOFT_CEILING pss=930.9 gl=152.7 views=553 native_reclaim_advisory
  - [2026-06-27 10:55:45] PSS_SOFT_CEILING pss=934.7 gl=156.7 views=575 native_reclaim_advisory
  - [2026-06-27 11:15:33] PSS_SOFT_CEILING pss=807.7 gl=40.1 views=388 native_reclaim_advisory
  - [2026-06-27 11:16:32] PSS_SOFT_CEILING pss=811.8 gl=42.1 views=388 native_reclaim_advisory
  - [2026-06-27 11:26:56] PSS_SOFT_CEILING pss=852.5 gl=46.5 views=403 native_reclaim_advisory
  - [2026-06-27 11:37:16] PSS_SOFT_CEILING pss=840 gl=46.3 views=389 native_reclaim_advisory
  - [2026-06-27 11:45:58] PSS_SOFT_CEILING pss=873.1 gl=47.2 views=392 native_reclaim_advisory
  - [2026-06-27 11:47:36] PSS_SOFT_CEILING pss=849 gl=49 views=393 native_reclaim_advisory
  - [2026-06-27 13:21:22] PSS_SOFT_CEILING pss=883.5 gl=90.2 views=465 native_reclaim_advisory
  - [2026-06-27 08:00:05] AFTERNOON_WATCH_5PM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\afternoon-watch-report-20260627-1700.md
- **권장(김팀장 1안)**: afternoon soak OK — review mem-timeline floor

> status: monitor-ok · 17:00 KST 자동보고 완료

## 작업 요약

- **일자 (KST)**: 2026-06-18
- **범위**: ① 전함 풀강 스펙·가치 추산 데이터화 · ② 행성 유지비 개발도 비례화(기반작업)
- **상태**: ready-for-review

---

## 작업 ② 행성 유지비 개발도 비례화 (기반작업 — 적용 가능한 부분 선작업)

### 요구 → 현황 검증

- 모든 행성 유지비 일일 계산: **기존 구현됨**(`runArcCorePlanetUpkeepDailyPass`, 일 1회). 단 **정액 800cr·개발도 무시**였음 → 이번에 개발도 비례 가산.
- 홈/플레이어 소유 행성 → 플레이어 가상금고 수익 입금: **기존 구현됨**(`takePlayerWalletPendingForPlanets` → `addCredits`, 거래수수료 player wallet share). 변경 없음·기반 확인.
- 유지비 ∝ 개발도, 수익에서 차감: **방위위성(유일한 구현 완료 개발 엔티티)** 레벨별 1일 유지비를 산술 정의해 반영.

### 변경 파일

- `tables/balance/planet_defense_satellite_level_policy.csv` — `dailyUpkeepCredits` 컬럼 추가. 곡선 `round(100·lv·(1+0.12·(lv-1)))` → L1=100 … L10=2080.
- `tables/balance/arc_core_planet_upkeep_policy.csv` — `upkeep_development_scaling_enabled=true` 추가, version 2→3.
- `src/arcCore/balance/planetDefenseSatelliteLevelPolicy.ts` — row 타입·파서에 `dailyUpkeepCredits`, 접근자 `resolveDefenseSatelliteDailyUpkeepCredits(level)`.
- `src/arcCore/economy/planetDevelopmentUpkeep.ts` (신규) — 행성 개발 엔티티 유지비 집계(현재 방위위성, 확장 슬롯). 일일 배치·스냅샷 전용.
- `src/arcCore/economy/planetUpkeepPolicy.ts` — `developmentScalingEnabled` 정책, `computePlanetDailyUpkeepCredits(devUpkeep, policy)` = 베이스+개발 가산.
- `src/arcCore/economy/runArcCorePlanetUpkeepDailyPass.ts` — 행성별 dev 유지비 합산 후 차감(배치 내부, 부트경로 미접촉).
- `src/game/planetHub/planetEconomyInfoSnapshot.ts` — 표시 유지비도 개발도 반영(호출처 1줄).

### 산식·차감 흐름

- 행성 1일 유지비 = `upkeep_fixed_credits_per_planet(800)` + Σ(개발 엔티티 레벨 유지비).
- 예: 방위위성 L10 행성 = 800 + 2080 = **2880cr/일**. 플레이어 소유는 플레이어 지갑, 팩션 점령은 해당 금고에서 차감(`spendUpToBalance` 0캡).
- 수익(거래수수료) → 일부 player wallet/금고 입금은 기존 경로 유지 → 유지비는 동일 배치에서 차감되어 **순수익 = 수익 − 유지비** 구조 성립.

### 한계·후속 (정직 고지)

- `dev_energy_plant` 등 나머지 개발 엔티티는 **미구현(catalog enabled=false)** → 유지비 0. `planetDevelopmentUpkeep.ts`에 슬롯만 추가하면 즉시 합산(기반 완료).
- 방위위성 비용(install/upgrade)은 여전히 TEST 1cr — 적정가 재설정은 별도 작업.
- dailyUpkeep 곡선·800 베이스는 **1차 산술값**. 실제 행성 수익 데이터와 대조한 튜닝은 후속(최종 행성 수익 계산 기능 구현 후).

### 추가/변경 파일

- `tools/ship-upgrade-value/run-ship-upgrade-value.ts` (신규) — 풀강 스펙·가치 추산 도구. RN 자산(`*.png`) headless 스텁 후 레지스트리·가격 정본 동적 import.
- `tables/balance/capital_ship_max_upgrade_value.csv` (신규·GENERATED) — 정본 산출 테이블 (223척, ownable 플래그 포함).
- `tools/ship-upgrade-value/reports/latest.md` (신규) — 사람이 읽는 요약.
- `package.json` — `"sim:ship-upgrade-value"` 스크립트 추가.
- `src/arcCore/balance/capitalShipPerformancePricing.ts` — `scoreCapitalCombatStats(combat)` export 추가(가격 정본 점수 재사용, combatPerformanceScore가 이를 호출하도록 리팩터). 동작 불변.

### 산식 (정본 재사용)

- 풀강 적용: `ShipPerformanceCalculator.applyMineralUpgradeToShipPerformance` (HP/실드 가산·무기 데미지 damageDice.bonus·쿨다운 배수·선회 배수).
- 성능지수 가치: 무역소 가격 정본 `scoreCapitalCombatStats` (HP·실드·armor·DPR·attackBonus 가중).
- 전투력 지수: `EHP×DPS/1000` (쿨다운·실드 반영, 가격모델 미반영분 보완 — 전투밸런스 주축).
- 광물 투자 환산: 풀강 총 ore = `qty×N(N+1)/2` → `mining_sell_price_policy.csv` 환산 = **204,720 cr** (전함 무관 동일).
- 최종 추산 가치 = 무역소 기준가 + 광물 투자 크레딧.

## 김경제 완료 게이트

- [x] `npm run audit:balance-ops` PASS (Overall: PASS)
- [x] `npm run audit:balance` PASS (12/12)
- [x] `npx tsc --noEmit -p tsconfig.client.json` (exit 0)
- [x] 산출물 생성 확인 (`sim:ship-upgrade-value` exit 0 · 223척)

## KPI·감사 스냅샷

- balance-ops: **PASS**
- 풀강 평균(보유 23척): 성능지수 **+142.1%**, 전투력(EHP×DPS) **+1344.6%**
- 풀강 전투력 상위: 팬텀 레전드/슈퍼캐피털/드레드노트(ranger 계열 상위) · 강화 수혜율 최고: 생존포드·기본 정찰함(저베이스).
- 권장 조치 1안: 광물 투자비가 전함 무관 정액(204,720cr)이라 **저티어 전함의 투자 대비 가치 상승폭이 과대** → 경제 밸런스에서 **티어별 광물 sink 차등**(고티어 비용 가중) 검토. 단, 본 작업은 데이터화까지이며 수치 조정은 별도 합의 후 진행.

## 김팀장 연동 대기

> 김팀장이 **코드 연동·정리**할 항목만 `- [ ]` 로 적는다. 없으면 「_(연동 대기 없음)_」. 완료 시 `[x]`.

- [ ] (검토) `capitalShipPerformancePricing.ts`의 `scoreCapitalCombatStats` export 1건 — 가격 정본 모듈 최소 변경. 동작 불변이나 비경제 코드 정리/네이밍 컨벤션 확인 요망.
- [ ] (선택) `capital_ship_max_upgrade_value.csv`를 build/generated 파이프라인에 연동할지(현재는 도구 산출 정적 CSV·런타임 미참조) 정책 결정.
- [ ] (정보) 전투밸런스 적용 시: 본 표의 `fullCombatPower`/`combatPowerGainPct`를 적 NPC(웨이브) 난이도·HP 배율과 대조. 선회/사거리 강화는 본 지수 미반영(별도 시뮬 필요).
- [ ] (검토·②) `planetEconomyInfoSnapshot.ts`(planetHub UI 스냅샷) 호출처 1줄 수정 — 표시 유지비 개발도 반영. UI 영향 경미하나 김팀장 확인 요망.
- [ ] (정보·②) 유지비 부족분(shortfall)은 현재 로그만(행성 패널티 미구현) — 개발도 비례로 부족분 빈도↑ 가능. 패널티 정책은 후속 합의.
- [ ] (정보·②) `[econ-boot-audit]` 부트경로 격리 OK — 신규 dev 유지비 집계는 `runArcCorePlanetUpkeepDailyPass`(배치)·info 스냅샷에서만 호출, onBoot 동기경로 미접촉. tsc·balance-ops·balance PASS.

## 비고

- 사거리(`weapon_range_flat`) 강화는 calculator v1에서 미적용 상태 → 전투력 지수에도 미반영. 후속 보완 시 표 재생성 필요.
- 데이터 재생성: `npm run sim:ship-upgrade-value`.

_(김팀장 검수 코멘트·반려 사유는 아래에 기록)_

---

## [김팀장 지시 · 2026-06-18] 행성개발 v2.0 × 무역소·경제 구조 검토 요청

> **원칙**: 행성개발 적용으로 SKU·배치·수수료 등 **세분화**는 가능하나, **zone 17/21 무역소·교역 SKU 분배·일일 배치(AABS/convoy) 큰 골격은 변경 금지**.

### 김경제 검토 과제 (우선)

1. **이중 기준 맵** — `planets.csv hasTradePort` vs `dev_trade_port` 설치 vs `listPlanetIdsWithTradePort()` (김팀장: CSV∪dev로 통합 연동 완료, SIM 재검증 요망)
2. **무역소 SKU “사라짐” 회귀** — Lv1 `unlockSkuCount=5` + `applyTradePortDevCatalogGate`가 zone 정본(교역·무기·장비·전함) 대비 과도 축소였음 → **parity Lv**(카탈로그 규모 커버 최소 Lv) 도입. **Kim: zone별 parity Lv·수수료율이 SIM KPI(F2P/Dolphin/Whale) 내인지 확인**
3. **배치 항목** — `syncTradePortCatalogFromBalance`·`trade_route_planet_supply_assignments.csv`·`runMarketPricePass`가 dev-only 행성을 누락하지 않는지 전 행성 diff
4. **Arcadia (`arcadia_prime`)** — CSV 3시설 true; 시드 후 무역 탭 SKU 수 = 행성개발 전 zone 정본과 동일한지 스냅샷 비교
5. **미연동(P1)** — `stockLimit`/`supplyStockScale`(facility Lv) ↔ `planetEconomyFabric`/`planetTradeMarketStore` — 큰 구조 변경 없이 게이트만 추가할 설계안

### 김팀장 1차 조치 (코드 · 2026-06-18)

- `planetFacilityCsvLegacySeed.ts` — CSV `hasTradePort|hasShipyard|hasTavern` → dev 모듈 1회 시드
- `planetTradePortParity.ts` — CSV 무역 행성 SKU 하한(parity Lv)
- `planetTradePortRuntimeBridge` — 실효 Lv = max(설치 Lv, parity)
- `listPlanetIdsWithTradePort()` — CSV ∪ dev 설치

### 김경제 산출물 요청

- [ ] `npm run audit:balance-ops` + arcadia_prime SKU diff 리포트 (before/after parity)
- [ ] `sim:economy` KPI 변동 ±5% 이내 여부 (Whale/F2P ratio critical 유지)
- [ ] `facility_trade_port_level_policy.csv` Lv1 TEST 값(5 SKU) — **신규 개척 행성 전용**으로 명시할지, zone band별 Lv1 floor 제안
- [ ] handoff 본 섹션에 **PASS/FAIL** 및 CSV 수정안만 제출 (코드는 김팀장 연동)

---

## [2026-06-19] 행성개발 집계 허브 v2.3 — 5대 지표·비용 효율

**상태**: `ready-for-review` · `audit:balance-ops` PASS · `tsc` PASS

### 큰 방향 (2층)

| 층 | 역할 |
|---|---|
| **1층 모듈** | 무역소 수수료·고급무기 가중, 조선소 티어/광물캡, 방위전투, 연구소 RD, 선술집 현상금 등 **시설 고유 보상** |
| **2층 집계** | `planetDevelopmentLevelBenefits.ts` — 레벨업 **5대 지표 즉시 상승** + **T·집계레벨 비용/유지비 효율** + **TDI→PGP** |

### 정본 CSV

- `planet_development_aggregate_policy.csv` — 비용·유지비 효율 상한, 레벨업 nudge 비율, TDI→PGP 계수
- `facility_upgrade_levels.csv` — 일일 nudge + `tdi_contribution_formula` (이제 코드 소비)

### 밸런스 스냅샷 (정책 기본값)

| 항목 | 중반 (T30·시설합15Lv) | 맥스 (T100·전시설Lv10) |
|---|---|---|
| 업그레이드 비용 할인 | ~14% | **25%** (cap) |
| 개발 유지비 절감 | ~12% | **15%** (cap) |
| TDI 점수 | ~40 | **~135** |
| TDI PGP 가산 | ~3,200 BMU | **~10,800 BMU** |

### 김경제 후속 튜닝 제안

- [ ] `facility_*_level_policy.csv` TEST 1cr → 실제 곡선 (비용 효율과 역학 검증)
- [ ] `sim:economy` — TDI PGP 가산이 Whale/F2P ratio critical(≥8) 유발 여부
- [ ] `level_up_stat_nudge_daily_fraction` 1.0 → 일일+즉시 이중 상승 속도 SIM

---

---

## [관측] 2026-06-24 21:17 KST — 메모리 우선순위 · 감시 재개

- **mem-monitor**: WARN (PSS ~670–850MB · Native Heap **~336–470MB** 주 원인)
- **조치(김팀장)**: `runPlanetHubSoftNativeReclaimPass` — 허브 **5분** soft reclaim (worldmap 대칭) · 15분 deep 유지
- **감시**: watch-30m PID **15280** OK · snapshot `mem_priority_watch_2115`
- **다음 샘플**: ~21:39 (30m) · soft reclaim 첫 tick ~5분 후(앱 리로드 후)
- **권장**: 아르카디아 체류 soak — PSS 850+ 재발 시 알림

## [관측] 2026-06-24 20:41 KST — 아르카디아 체류 · **WARN→CRITICAL**

- **mem-monitor**: **CRITICAL** (PSS 1GB 육박 반복)
- **mem-profile / retention**: NO_DATA (스냅샷만 · arcadia_hub 20:40)
- **profile 구간**: `2026-06-24 20:36` heartbeat · `20:39` mem-timeline · STAGE **planet_hub (arcadia)**
- **실측 (PID 20679)**:
  - **20:36** PSS **971.4MB** / GL **139.9MB** / views 296 ← **하드실링(950MB) 근접**
  - **20:39** PSS 847.3MB / GL 23.6MB / views 321 (`PSS_SOFT_CEILING`)
  - **20:40** PSS **~819MB** / GL 25MB / views 298 / **Native Heap ~470MB** (주 원인)
- **당일 피크**: 19:15 PSS **1078.7MB** · 19:38 **1009.4MB** (hard-ceiling incident)
- **감시**: watch-30m PID **15280** 가동 중 · 마일스톤 `arcadia_idle_watch_until_11am_20260625`
- **권장(김팀장 1안)**: Native Heap ~470MB 누적 — 허브 체류 floor 상승. `ingress reclaim`·`planetHubIngressReclaim`·고빈도 persist/틱 할당 재점검. PSS≥950 재발 시 **은하맵 왕복 1회**로 blur reclaim 유도(플레이 중단 최소).

> status: **ready-for-team-lead-action** · 감시 **2026-06-25 11:00 KST**까지 유지

## [관측] 2026-06-26 12:30 KST — 오후 감시 **재가동** (17:00 자동보고 예약)

- **김경제 감시**: `restart-afternoon-watch.ps1` 실행 · watch-30m + report-watch **재기동**
- **monitor-paused**: **ON** (기록만 · 플레이 중 force-stop 없음)
- **adb**: 192.168.45.197:37573 · 앱 PID **30549** (12:23 기준)
- **mem-monitor**: **WARN** (최근 PSS **588–928MB** · GL spike 141MB @11:53 · 12:01 PROCESS_NOT_RUNNING 후 재기동)
- **ArcCore learning**: `arc-core:learning:verify` PASS · RTDB policy `2026-06-26-1782444492960` 배포
- **17:00 KST**: `schedule-5pm-kim-auto-report.ps1` 백그라운드 예약 → `kim-economy-handoff.md` + `afternoon-watch-report-*.md`
- **권장(김팀장 1안)**: 오전 PSS 900+ soft-ceiling 반복 — 오후 soak에서 floor 추이만 관측(record-only). CRITICAL(PSS≥950) 시 P0.

## [관측] 2026-06-26 03:34 KST — 오후 감시 · 17:00 자동보고

- **김경제 감시**: watch-30m PID **30408** · report-watch PID **13748** · auto-fix=OFF(record-only)
- **mem-monitor**: **OK** (PSS 590.1MB · GL 23.0MB · Views 311 · pid=30549)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\afternoon-watch-report-20260626-1700.md
- **timeline marker**: AFTERNOON_WATCH_START
- **incidents (actionable tail)**: 1
  - [2026-06-26 12:31:05] AFTERNOON_WATCH_START 2026-06-26 12:31:05 KST
- **ArcCore learning**: arc-core:learning:verify PASS · RTDB policy 2026-06-26
- **권장(김팀장 1안)**: afternoon soak OK — check RTDB dailyKpi

> status: monitor-ok · 감시 유지

## [관측] 2026-06-26 08:00 KST — 오후 감시 · 17:00 자동보고

- **김경제 감시**: watch-30m PID **30408** · report-watch PID **26380** · auto-fix=OFF(record-only)
- **mem-monitor**: **OK** (PSS 594.7MB · GL 25.9MB · Views 287 · pid=30549)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\afternoon-watch-report-20260626-1700.md
- **timeline marker**: AFTERNOON_WATCH_START
- **incidents (actionable tail)**: 0
  - (none)
- **ArcCore learning**: arc-core:learning:verify PASS · RTDB policy 2026-06-26
- **권장(김팀장 1안)**: afternoon soak OK — check RTDB dailyKpi

> status: monitor-ok · 감시 유지

## [관측] 2026-06-27 08:00 KST — 오후 감시 · 17:00 자동보고

- **김경제 감시**: watch-30m PID **30408** · report-watch PID **26380** · auto-fix=OFF(record-only)
- **mem-monitor**: **OK** (PSS 789.7MB · GL 36.2MB · Views 368 · pid=20481)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\afternoon-watch-report-20260627-1700.md
- **timeline marker**: AFTERNOON_WATCH_START
- **incidents (actionable tail)**: 0
  - (none)
- **ArcCore learning**: arc-core:learning:verify PASS · RTDB policy 2026-06-26
- **권장(김팀장 1안)**: afternoon soak OK — check RTDB dailyKpi

> status: monitor-ok · 감시 유지

## [관측] _(김경제 갱신 템플릿 — 최신 항목을 위에 추가)_

- **일자**:
- **mem-monitor**: OK|WARN|CRITICAL
- **mem-profile / retention**: PASS|FAIL|NO_DATA (verdict · failures · flags)
- **profile 구간**: (profile-timeline 타임스탬프 · STAGE)
- **권장(김팀장 1안)**:

> retention **FAIL** → `status: ready-for-team-lead-action` · 김팀장 본 세션 P1 수정 · 수정 후 `[mem-profile-fix]` 기록

