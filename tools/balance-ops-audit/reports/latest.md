# ArcCore Balance Ops Audit

Generated: 2026-09-23T15:01:48.153Z

**Overall:** FAIL


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

- band_early: gap 950% (critical) → code_change · weapon_median_vs_band_cph_window
- band_mid_early: gap 5837.5% (critical) → code_change · weapon_median_vs_band_cph_window
- band_mid: gap 7502.8% (critical) → code_change · weapon_median_vs_band_cph_window
- band_late: gap 21074% (critical) → code_change · weapon_median_vs_band_cph_window

## 학습 인사이트 (자동)

- [warn] Planet fiscal WARN — max fee/upkeep 3.09× gini=0.379 → **monitor_fiscal_closed_loop**

## 권장 다음 조치 (우선순위)

1. monitor_fiscal_closed_loop — Planet fiscal WARN — max fee/upkeep 3.09× gini=0.379

---

# 행성 경제 3h 검사 FAIL

Error: Transform failed with 1 error:
D:\arcfire20260607\node_modules\react-native\index.js:14:7: ERROR: Unexpected "typeof"
    at failureErrorWithLog (D:\arcfire20260607\node_modules\esbuild\lib\main.js:1748:15)
    at D:\arcfire20260607\node_modules\esbuild\lib\main.js:1017:50
    at responseCallbacks.<computed> (D:\arcfire20260607\node_modules\esbuild\lib\main.js:884:9)
    at handleIncomingPacket (D:\arcfire20260607\node_modules\esbuild\lib\main.js:939:12)
    at Socket.readFromStdout (D:\arcfire20260607\node_modules\esbuild\lib\main.js:862:7)
    at Socket.emit (node:events:508:28)
    at addChunk (node:internal/streams/readable:559:12)
    at readableAddChunkPushByteMode (node:internal/streams/readable:510:3)
    at Readable.push (node:internal/streams/readable:390:5)
    at Pipe.onStreamRead (node:internal/stream_base_commons:189:23) {
  name: 'TransformError'
}

## 타임라인

- CSV: `tools/balance-ops-audit/reports/timeline.csv`
- 학습 상태: `tools/balance-ops-audit/reports/learning-state.json`
- 스냅샷 수: 48
