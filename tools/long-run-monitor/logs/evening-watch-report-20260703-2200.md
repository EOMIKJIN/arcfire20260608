# Arcfire intensive watch 16:00??2:00 KST ??22:00 comprehensive report

Generated (KST): 2026-07-03 22:00:04
Package: `com.arcfire.online`
Timeline marker: `INTENSIVE_WATCH_1600_START`

## 1. Runtime snapshot

**APP_NOT_RUNNING**

**Verdict:** OK

## 2. Memory trend (since marker)

| Metric | Value |
|--------|-------|
| Samples | 20 |
| PSS min / max / last | 646.6 / 705 / 678.5 MB |
| PSS floor drift (last-first) | 19.6 MB |
| GL min / max / last | 42 / 46.9 / 44.5 MB |
| Views max / last | 383 / 383 |
| GL_RECOVERED events | 0 |
| PSS_SPIKE events | 0 |

### mem-timeline tail (30 rows)

```csv
2026-07-03 16:04:03,,,,,,,,,,,,INTENSIVE_WATCH_1600_START
2026-07-03 16:04:11,16676,658.9,812.1,42,19.8,61.8,340.1,43.9,,361,,,
2026-07-03 16:19:36,16676,667.5,818.3,46.2,19.8,66,348.7,30.1,,359,8.6,4.2,
2026-07-03 16:34:55,16676,684,838.1,44.3,19.8,64.2,351.2,40,,366,16.5,-1.9,
2026-07-03 16:50:14,16676,683.8,836,44.5,30.2,74.7,343.8,34,,362,-0.2,0.2,
2026-07-03 17:05:32,16676,705,857.3,44.5,34.3,78.9,349.2,47.3,,380,21.2,0,
2026-07-03 17:20:52,16676,702.3,854.6,46.9,40.7,87.6,347.6,41.4,,378,-2.7,2.4,
2026-07-03 17:36:10,16676,686.7,832.3,44.9,40.7,85.6,342.5,42.6,,360,-15.6,-2,
2026-07-03 17:51:29,16676,659.4,803.4,44.3,19.8,64.1,347.2,36.7,,359,-27.3,-0.6,
2026-07-03 18:06:49,16676,659.3,803.2,44.3,19.8,64.1,347.2,39.9,,362,-0.1,0,
2026-07-03 18:22:10,16676,646.6,789.4,46.3,19.8,66.1,340.4,32.3,,358,-12.7,2,
2026-07-03 18:37:27,16676,661.6,802.1,44.3,19.8,64.1,341.1,46.9,,366,15,-2,
2026-07-03 18:52:46,16676,650.9,791.5,44.3,19.8,64.1,349,28.2,,362,-10.7,0,
2026-07-03 19:08:05,16676,652.7,793.4,44.3,19.8,64.1,344.5,33.8,,362,1.8,0,
2026-07-03 19:23:25,16676,656.2,797,44.3,19.8,64.1,346.1,35.7,,362,3.5,0,
2026-07-03 19:38:43,16676,660.4,801.2,44.3,19.8,64.1,347.1,38.1,,362,4.2,0,
2026-07-03 19:54:01,16676,649.4,790.3,44.3,19.8,64.1,344.4,29.4,,362,-11,0,
2026-07-03 20:09:19,16676,655.8,796.9,44.3,19.8,64.2,345.7,33.7,,368,6.4,0,
2026-07-03 20:24:37,16676,678,818.8,44.5,34.3,78.8,346.8,38.9,,383,22.2,0.2,
2026-07-03 20:39:58,16676,673.4,814.1,44.5,34.3,78.8,351.4,28.8,,381,-4.6,0,
2026-07-03 20:55:16,16676,678.5,819.3,44.5,34.3,78.8,353.2,31.6,,383,5.1,0,
2026-07-03 21:10:34,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-07-03 21:25:34,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-07-03 21:40:34,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-07-03 21:55:33,,,,,,,,,,,PROCESS_NOT_RUNNING
```

## 3. Incidents & remediation (tail)

### incidents
```
[2026-07-03 08:04:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md verdict=OK
[2026-07-03 08:06:06] DAILY_8AM_REPORT 2026-07-03 08:06:06 KST
[2026-07-03 08:06:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md verdict=OK
[2026-07-03 08:08:07] DAILY_8AM_REPORT 2026-07-03 08:08:07 KST
[2026-07-03 08:08:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md verdict=OK
[2026-07-03 08:10:09] DAILY_8AM_REPORT 2026-07-03 08:10:09 KST
[2026-07-03 08:10:09] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md verdict=OK
[2026-07-03 08:12:11] DAILY_8AM_REPORT 2026-07-03 08:12:11 KST
[2026-07-03 08:12:11] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md verdict=OK
[2026-07-03 08:14:12] DAILY_8AM_REPORT 2026-07-03 08:14:12 KST
[2026-07-03 08:14:12] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md verdict=OK
[2026-07-03 09:51:12] PSS_SOFT_CEILING pss=852.1 gl=133.2 views=564 native_reclaim_advisory
[2026-07-03 11:32:39] EVENING_WATCH_6PM_START 2026-07-03 11:32 KST watch until 18:00 integrated report + ArcCore balance-ops
[2026-07-03 14:27:12] GL_ELEVATED mounting_or_insufficient_samples gl=137.8 pss=726.8 views=557 restart_held
[2026-07-03 14:42:40] GL_ELEVATED mounting_or_insufficient_samples gl=139.8 pss=734.3 views=557 restart_held
[2026-07-03 14:57:59] GL_ELEVATED mounting_or_insufficient_samples gl=141.8 pss=707.7 views=557 restart_held
[2026-07-03 16:04:03] INTENSIVE_WATCH_1600_START KST intensive watch 16:00-22:00
[2026-07-03 16:04:08] AFTERNOON_WATCH_START 2026-07-03 16:04:08 KST
[2026-07-03 18:00:02] EVENING_WATCH_6PM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\evening-watch-report-20260703-1800.md
[2026-07-03 18:07:35] BALANCE_OPS_6PM D:\arcfire20260607\tools\long-run-monitor\logs\balance-ops-20260703-1800.log
```

### remediation
```
[2026-07-02 16:46:57] INFO PSS_SOFT_CEILING pss=898.5 gl=117.1 views=365 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-02 17:02:23] INFO PSS_SOFT_CEILING pss=917.4 gl=115.3 views=387 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-02 17:17:42] INFO PSS_SOFT_CEILING pss=893.8 gl=117.1 views=367 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-02 17:33:00] INFO PSS_SOFT_CEILING pss=927.3 gl=115.7 views=364 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-02 17:48:19] INFO PSS_SOFT_CEILING pss=919.9 gl=117.1 views=367 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-02 18:03:38] INFO PSS_SOFT_CEILING pss=921.3 gl=125 views=571 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-02 18:18:58] INFO PSS_SOFT_CEILING pss=815.5 gl=41.5 views=375 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-02 18:34:17] INFO PSS_SOFT_CEILING pss=856.1 gl=34.6 views=387 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-02 18:49:35] INFO PSS_SOFT_CEILING pss=836.5 gl=36 views=378 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-02 19:04:58] INFO GL_HARD_CEILING_RECORD_ONLY gl=124.7 pss=970.4 views=564 (monitor-paused ??no incident/refix spam)
[2026-07-02 20:06:30] INFO PSS_SOFT_CEILING pss=885.5 gl=37 views=392 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-02 20:21:51] INFO PSS_SOFT_CEILING pss=886.4 gl=37 views=375 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-02 20:37:13] INFO PSS_SOFT_CEILING pss=915 gl=35.2 views=390 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-03 02:10:57] INFO GL_ELEVATED mounting_or_insufficient_samples gl=136.4 pss=792.9 views=451 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-07-03 03:12:38] INFO PSS_SOFT_CEILING pss=892.4 gl=136.2 views=570 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-03 03:28:11] INFO GL_HARD_CEILING_RECORD_ONLY gl=144.6 pss=1083.9 views=560 (monitor-paused ??no incident/refix spam)
[2026-07-03 09:51:12] INFO PSS_SOFT_CEILING pss=852.1 gl=133.2 views=564 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-03 14:27:12] INFO GL_ELEVATED mounting_or_insufficient_samples gl=137.8 pss=726.8 views=557 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-07-03 14:42:40] INFO GL_ELEVATED mounting_or_insufficient_samples gl=139.8 pss=734.3 views=557 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-07-03 14:57:59] INFO GL_ELEVATED mounting_or_insufficient_samples gl=141.8 pss=707.7 views=557 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
```

### mem-alerts
```
[2026-07-03 00:10:45] CRITICAL process not running ??check crash-*.log
[2026-07-03 00:25:45] CRITICAL process not running ??check crash-*.log
[2026-07-03 00:40:45] CRITICAL process not running ??check crash-*.log
[2026-07-03 00:55:46] CRITICAL process not running ??check crash-*.log
[2026-07-03 01:10:46] CRITICAL process not running ??check crash-*.log
[2026-07-03 01:25:46] CRITICAL process not running ??check crash-*.log
[2026-07-03 01:40:47] CRITICAL process not running ??check crash-*.log
[2026-07-03 01:55:47] CRITICAL process not running ??check crash-*.log
[2026-07-03 03:12:32] GL +76.4MB views=570 (PSS 108.7MB) ??active hub
[2026-07-03 03:28:00] GL +8.4MB views=560 (PSS 191.5MB) ??active hub
[2026-07-03 03:58:54] CRITICAL process not running ??check crash-*.log
[2026-07-03 09:51:07] GL +98.6MB views=564 (PSS 157.9MB) ??active hub
[2026-07-03 14:27:06] GL +104.2MB views=557 (PSS 159.3MB) ??active hub
[2026-07-03 15:13:18] CRITICAL process not running ??check crash-*.log
[2026-07-03 15:28:20] CRITICAL process not running ??check crash-*.log
[2026-07-03 15:43:21] CRITICAL process not running ??check crash-*.log
[2026-07-03 21:10:34] CRITICAL process not running ??check crash-*.log
[2026-07-03 21:25:34] CRITICAL process not running ??check crash-*.log
[2026-07-03 21:40:34] CRITICAL process not running ??check crash-*.log
[2026-07-03 21:55:33] CRITICAL process not running ??check crash-*.log
```

## 4. Retention audit

- **latest-retention-audit:** `PASS` ??`tools/memory-profiler/reports/latest-retention-audit.md`

## 5. Management / optimization gaps (known + watch window)

| # | Gap | Status |
|---|-----|--------|
| 1 | SUB-STAGE blur / route_blur release (Views 558) | patched / release soak pending |
| 2 | Metro HMR / galaxy dispose loop / PSS spike | devMetroReloadGuard / release verify |
| 3 | hub_periodic backdrop remount / native_heap floor | skipBackdropRemount / 60m floor |
| 4 | audit:memory:all PASS vs runtime PSS floor drift | static PASS / runtime FAIL |
| 5 | retention audit NO_DATA / route_blur snapshot | playtest snapshot missing |
| 6 | monitor-paused / auto-fix OFF | record-only by design |
| 7 | central bank + convoy 30% / mem audit gap | daily batch AsyncStorage only |
| 8 | planet ownership deedOwnerClanId persist | purge/reset linkage check |
| 9 | Galaxy map contested ring / AppState | worklet freeze patch |
| 10 | CHAT_REPORT_PENDING / session hook | schedule-6pm standalone |

## 6. Potential risks (18:00 assessment)

- **PSS floor creep** without GL spike ??native_heap / Fresco / ingress reclaim race (P1).
- **Views ??50** after Metro reload ??duplicate planet hub tree until cold restart.
- **PID_CHANGE** during soak ??baseline 鍮꾧탳 ?쒓끝; timeline marker ?꾩닔.
- **Uncommitted dev stack** (ownership쨌central bank쨌native reclaim) ??6/30 handoff ?鍮??뚭? ?щ? watch.
- **Retention NO_DATA** ??STAGE ?꾪솚 ?뚯닔 PASS/FAIL ?먯젙 遺덇?.

## 7. Future content / feature add ??memory watch focus

| Area | Pre-dev gate | Post-dev gate |
|------|--------------|---------------|
| Skia / Canvas / Reanimated | arcfire-skia-memory-lifecycle 짠1-2 | audit:skia-memory + GL mtrack 짹15MB |
| STAGE / Modal / SUB-STAGE | hubSubStageNavRef blur 寃뚯씠??| SUB-STAGE ?뺣났 5??+ route_blur snapshot |
| arcCore daily batch / economy | onBoot ?숆린 ?⑥뒪 湲덉? | audit:balance-ops + native floor 30m |
| New AsyncStorage store | purgeLocalAccountData ?곕룞 | mem-post-dev-recheck handoff |
| Galaxy map / worldmap | worklet contract | audit:worklet-contract + galaxy round-trip GL |
| Planet hub UI plate / i18n | zero tick loop | Views idle 짹20 |

## 8. Kim Team Lead ??recommended actions

1. **OK** - evening soak stable; continue floor trend watch.
2. Release 鍮뚮뱶?먯꽌 Metro HMR ?쒖쇅 soak 2h ??PSS floor쨌Views 380 ?댄븯 ?뺤씤.
3. `npm run audit:memory:retention` + route_blur ?ㅻ깄??1????NO_DATA ?댁냼.
4. ?좉퇋 湲곕뒫(以묒븰??됀룹냼?좉텒) merge ??`mem-post-dev-recheck` handoff.


---

## 9. ArcCore economy system (balance-ops)

- **Overall:** WARN
- **Whale/F2P ratio:** 3.119195108748942 (critical if >=8)
- **Daily batch contract:** v4.0 section 10 ??12:00 KST single batch (see balance-ops report)
- **Price elasticity:** 0 (realtime disabled)
- **Planet fiscal max fee/upkeep:** 3×

### balance-ops excerpt (head)
```
# ArcCore Balance Ops Audit

Generated: 2026-07-03T09:07:35.139Z

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

- band_early: gap 950% (critical) → code_change · weapon_median_vs_band_cph_window
- band_mid_early: gap 5837.5% (critical) → code_change · weapon_median_vs_band_cph_window
- band_mid: gap 7502.8% (critical) → code_change · weapon_median_vs_band_cph_window
- band_late: gap 21074% (critical) → code_change · weapon_median_vs_band_cph_window

## 학습 인사이트 (자동)

- [warn] Planet fiscal WARN — max fee/upkeep 3× gini=0.288 → **monitor_fiscal_closed_loop**

## 권장 다음 조치 (우선순위)

1. monitor_fiscal_closed_loop — Planet fiscal WARN — max fee/upkeep 3× gini=0.288

---

# 행성 경제 3h 전수 검사

Generated: 2026-07-03T09:07:34.007Z
KST day: 2026-07-03
**Overall:** WARN

## 시스템 동작 (헤드리스 convoy + CSV 유지비 예측)

- Convoy 일일: ran=true ok=18 fail=1 demandCovered=19
- 수송선단 금고: 566,811 cr
```

## 10. ArcCore RED planet development automation

| Contract | Status | Reference |
|----------|--------|-----------|
| 60s wall tick job complete | wired | `ArcCoreDailyOpsSubCore` -> `runArcCorePlanetDevWallTick` |
| RED-only allocator | policy CSV | `arc_core_planet_dev_investment_policy.csv` |
| Vault funding (real spend) | arc_core_vault | `planetDevelopmentFunding.ts` |
| Central bank -> budget pool | daily 33% slice | `runArcCoreCentralBankExpenditurePass` |
| Player RED stay/dev block | gate | `planetTerritoryPlayerAccess.ts` |
| World axis purge preserve | RED runtime kept | `arcCoreWorldPlanetRuntimePreservation.ts` |
| Device-local world (no cloud sync) | by design | `planetCoreRuntimeStore` no uid |

**Watch KPI (22:00):**
- No onBoot synchronous full-planet dev pass (batch/tick only)
- Budget ledger AsyncStorage bounded; no tick persist storm
- RED eligible planets <=10; zero-allocation eligible list in wall tick
- After account purge: RED dev preserved, player BLUE reset

## 11. Abnormal memory occupation (focused analysis)

| Signal | Count (since INTENSIVE_WATCH_1600_START) | Assessment |
|--------|------------------------------|------------|
| GL_SPIKE | 0 | hub Skia / nebula / combat footprint |
| GL_RECOVERED | 0 | idle reclaim OK if >0 after spike |
| PSS soft/spike | 0 | native / graphics pressure |
| PROCESS_NOT_RUNNING | 4 | clean exit if no crash tail |
| Samples | 24 | 15m interval target ~24/window |

> **WARN** ??repeated PROCESS_NOT_RUNNING: verify adb cable / app killed manually vs crash.

## 12. Immediate action matrix (22:00)

| Severity | Trigger | Action |
|----------|---------|--------|
| P0 | PSS>=950 or 3x GL_SPIKE | auto-remediation ON -> force-stop + handoff |
| P0 | FATAL/SIGSEGV crash | logcat capture + kim-team-lead code fix |
| P1 | PSS floor +40MB no GL spike | native reclaim / ingress audit |
| P1 | balance-ops convoy fail | core_prime route ??economy watch |
| P2 | level-band gap CRITICAL | static backlog ??not runtime blocker |

