# ArcCore Balance Ops Audit

Generated: 2026-10-08T15:04:21.850Z

**Overall:** WARN


## 일 1회 배치 계약 (v4.0 §10)

- Policy CSV: OK — Asia/Seoul 12:00, window 24h
- 벽시계 24h 관측·수집 후 정오 1회 일괄 분석·재배치·밸런스·가격미세조정
- SubCore probe: `ArcCoreDailyOpsSubCore` 60s tick → `shouldRunArcCoreDailyBatch` → `runArcCoreDailyOpsBatch`
- Economy SIM ingest: 일일 배치 runMarketPricePass 내부만 (ingestBalanceOverlayDeltaIfPending)
- Price elasticity: 0 (realtime disabled: yes)

## 고빈도 밸런스 호출 스캔

- OK — daily-only passes confined to `runArcCoreDailyOpsBatch`

## Balance audit (`npm run audit:balance`)

exit: 0

## Economy SIM KPI

- deltaId: 2026-07-02-1782976813591
- Whale/F2P: 3.119195108748942 (ok)

## Level-band drift

- band_early: gap 5% (ok) → adjust_multiplier · weapon_median_vs_band_span_income
- band_mid_early: gap 493.8% (critical) → code_change · weapon_median_vs_band_span_income
- band_mid: gap 280.1% (critical) → code_change · weapon_median_vs_band_span_income
- band_late: gap 958.7% (critical) → code_change · weapon_median_vs_band_span_income

## 학습 인사이트 (자동)

- [warn] Planet fiscal WARN — max fee/upkeep 3.02× gini=0.297 → **monitor_fiscal_closed_loop**

## 권장 다음 조치 (우선순위)

1. monitor_fiscal_closed_loop — Planet fiscal WARN — max fee/upkeep 3.02× gini=0.297

---

# 행성 경제 3h 전수 검사

Generated: 2026-10-08T15:04:19.200Z
KST day: 2026-10-09
**Overall:** WARN

## 시스템 동작 (헤드리스 convoy + CSV 유지비 예측)

- Convoy 일일: ran=true ok=17 fail=2 demandCovered=18
- 수송선단 금고: 444,789 cr
- RED 금고 Δ(수수료·헤드리스): 92,016 cr
- Convoy 실패: nightfall_citadel, core_prime
- 유지비 예측(점유 시드): RED 일합 8000 cr · BLUE 일합 5600 cr · 점유 22행성
- 교역 행성 수익 발생: 19/19

## 행성 재정 KPI

- **Overall (fiscal):** WARN
- max fee/upkeep: **3.02×** · min: 0.08× · Gini: 0.297
- WARN 0 · FAIL 0 · deficit 5
- policy: warn≥20× fail≥50×

## 행성별 (교역 17)

| 행성 | 점유시드 | 유지비(일) | 팩션수수료 | fee/upkeep | 상태 |
|------|---------|-----------|----------|-----------|------|
| arcadia_prime | BLUE | 901 | 566 | 0.63× | deficit |
| solar_station | BLUE | 950 | 835 | 0.88× | deficit |
| minerva_deep | BLUE | 1560 | 4223 | 2.71× | OK |
| eden_city | BLUE | 1043 | 1352 | 1.3× | OK |
| iron_remnant | BLUE | 1605 | 4473 | 2.79× | OK |
| draco_haven | BLUE | 931 | 733 | 0.79× | deficit |
| omega_hub | RED | 1370 | 3172 | 2.32× | OK |
| helios_core | NEUTRAL | 1570 | 4278 | 2.72× | OK |
| sirius_border | RED | 1732 | 5180 | 2.99× | OK |
| perseus_memorial | RED | 1152 | 1958 | 1.7× | OK |
| crimson_base | RED | 1556 | 4202 | 2.7× | OK |
| dark_haven | RED | 1057 | 1429 | 1.35× | OK |
| blood_station | RED | 811 | 63 | 0.08× | deficit |
| shadow_market | NEUTRAL | 1750 | 5279 | 3.02× | OK |
| nightfall_citadel | RED | 1078 | 1545 | 1.43× | OK |
| core_prime | RED | 1075 | 1532 | 1.43× | OK |
| genesis_origin | NEUTRAL | 1115 | 1752 | 1.57× | OK |
| synth_002_p | — | 870 | 394 | 0.45× | deficit |
| synth_003_p | — | 1620 | 4561 | 2.82× | OK |

## 3h 델타

- 이전: 2026-10-07T15:04:19.435Z
- 팩션 수수료 합계 Δ: -755 cr

## 실기기 행성정보 팝업

- `금일 팩션 몫` = AsyncStorage `arcfire_planet_trade_fee_ledger_v1`
- 즉시: 플레이어/수송선 거래 · 12:00 KST: 일일 convoy+유지비 배치

## 타임라인

- CSV: `tools/balance-ops-audit/reports/timeline.csv`
- 학습 상태: `tools/balance-ops-audit/reports/learning-state.json`
- 스냅샷 수: 48
