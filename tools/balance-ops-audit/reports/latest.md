# ArcCore Balance Ops Audit

Generated: 2026-10-11T02:33:49.052Z

**Overall:** WARN
**Mode:** CI contract-only (planet-economy headless skipped)

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

- [warn] Planet fiscal WARN — max fee/upkeep 2.99× gini=0.251 → **monitor_fiscal_closed_loop**

## 권장 다음 조치 (우선순위)

1. monitor_fiscal_closed_loop — Planet fiscal WARN — max fee/upkeep 2.99× gini=0.251

---

# 행성 경제 3h 검사 — CI contract-only skip

GitHub Actions / `ARC_BALANCE_OPS_CI=1` — React Native headless 경로 미실행.
전수 검사: 로컬 `npm run audit:planet-economy-3h` · 김팀장 `audit:team-lead:daily`.

## 타임라인

- CSV: `tools/balance-ops-audit/reports/timeline.csv`
- 학습 상태: `tools/balance-ops-audit/reports/learning-state.json`
- 스냅샷 수: 48
