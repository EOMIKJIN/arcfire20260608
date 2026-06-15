# ArcCore Balance Ops Audit

Generated: 2026-06-15T00:23:10.272Z

**Overall:** PASS

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

- deltaId: 2026-06-14-1781435091651
- Whale/F2P: 3.476036662892076 (ok)

## Level-band drift

- band_early: gap 10% (warn) → adjust_multiplier
- band_mid_early: gap 10% (warn) → adjust_multiplier
- band_mid: gap 10% (warn) → adjust_multiplier
- band_late: gap 10% (warn) → adjust_multiplier

## 학습 인사이트 (자동)

- [ok] No actionable drift or contract violations detected → **continue_3h_monitor**

## 타임라인

- CSV: `tools/balance-ops-audit/reports/timeline.csv`
- 학습 상태: `tools/balance-ops-audit/reports/learning-state.json`
- 스냅샷 수: 2
