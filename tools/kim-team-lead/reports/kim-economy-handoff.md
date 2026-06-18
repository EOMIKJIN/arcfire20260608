# 김경제 → 김팀장 Handoff

> **작성**: 김경제 에이전트 (`@김경제`) — 작업 완료·테스트 후 갱신  
> **검수**: 김팀장 에이전트 (`@김팀장`) — `npm run audit:team-lead:daily`

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

_(김팀장 검수 코멘트·반려 사유는 아래에 이어서 기록)_
