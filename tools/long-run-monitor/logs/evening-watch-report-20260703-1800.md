# Arcfire evening watch 18:00 KST comprehensive report

Generated (KST): 2026-07-03 18:00:00
Package: `com.arcfire.online`
Timeline marker: `EVENING_WATCH_6PM_START`

## 1. Runtime snapshot

| pid | PSS (MB) | GL (MB) | Views |
|-----|----------|---------|-------|
| 16676 | 679.2 | 46.9 | 368 |

**Verdict:** OK

## 2. Memory trend (since marker)

| Metric | Value |
|--------|-------|
| Samples | 169 |
| PSS min / max / last | 354.4 / 1083.9 / 659.4 MB |
| PSS floor drift (last-first) | -18 MB |
| GL min / max / last | 5.3 / 151 / 44.3 MB |
| Views max / last | 571 / 359 |
| GL_RECOVERED events | 10 |
| PSS_SPIKE events | 3 |

> **VIEWS_RETAINED** ??duplicate RN tree suspected (max views 571).

### mem-timeline tail (30 rows)

```csv
2026-07-03 11:23:16,1499,555.5,505.1,31.4,19.8,51.2,169.2,37,,362,,,
2026-07-03 11:32:39,,,,,,,,,,,,EVENING_WATCH_6PM_START
2026-07-03 11:32:42,,,,,,,,,,,,EVENING_WATCH_6PM_START
2026-07-03 11:38:35,1499,563.2,514.5,31.5,19.8,51.4,172.1,40,,341,7.7,0.1,
2026-07-03 11:53:54,1499,577.3,529.3,33.5,19.8,53.4,173.7,39.2,,341,14.1,2,
2026-07-03 12:09:15,1499,594.2,549.6,31.8,19.8,51.6,180.5,48.9,,364,16.9,-1.7,
2026-07-03 12:24:34,1499,578.4,533.5,33.6,19.8,53.4,181.8,30,,364,-15.8,1.8,
2026-07-03 12:39:53,1499,566.6,521.7,33.6,19.8,53.4,171.2,32.6,,360,-11.8,0,
2026-07-03 12:55:12,1499,566.5,521,35.6,19.8,55.4,176.8,28,,368,-0.1,2,
2026-07-03 13:10:30,1499,555.6,510,35.6,19.8,55.4,174.8,26.5,,368,-10.9,0,
2026-07-03 13:25:49,1499,561.2,515.2,33.6,19.8,53.4,178.2,29.5,,364,5.6,-2,
2026-07-03 13:41:10,1499,561.1,515.3,33.6,19.8,53.4,179.9,27.2,,368,-0.1,0,
2026-07-03 13:56:29,1499,555.9,507.9,33.6,19.8,53.4,176.6,23.7,,368,-5.2,0,
2026-07-03 14:11:48,1499,567.5,520.4,33.6,19.8,53.4,184.8,27.5,,386,11.6,0,
2026-07-03 14:27:06,1499,726.8,685.8,137.8,19.8,157.7,232.4,40.8,,557,159.3,104.2,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-07-03 14:42:35,1499,734.3,631.5,139.8,19.8,159.7,204.7,48.1,,557,7.5,2,
2026-07-03 14:57:55,1499,707.7,604.2,141.8,19.8,161.7,180.1,39.9,,557,-26.6,2,
2026-07-03 15:13:18,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-07-03 15:28:20,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-07-03 15:43:21,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-07-03 15:58:21,16676,354.4,474.6,8.1,52.9,61,127.3,13.7,,13,,,
2026-07-03 16:04:03,,,,,,,,,,,,INTENSIVE_WATCH_1600_START
2026-07-03 16:04:11,16676,658.9,812.1,42,19.8,61.8,340.1,43.9,,361,,,
2026-07-03 16:19:36,16676,667.5,818.3,46.2,19.8,66,348.7,30.1,,359,8.6,4.2,
2026-07-03 16:34:55,16676,684,838.1,44.3,19.8,64.2,351.2,40,,366,16.5,-1.9,
2026-07-03 16:50:14,16676,683.8,836,44.5,30.2,74.7,343.8,34,,362,-0.2,0.2,
2026-07-03 17:05:32,16676,705,857.3,44.5,34.3,78.9,349.2,47.3,,380,21.2,0,
2026-07-03 17:20:52,16676,702.3,854.6,46.9,40.7,87.6,347.6,41.4,,378,-2.7,2.4,
2026-07-03 17:36:10,16676,686.7,832.3,44.9,40.7,85.6,342.5,42.6,,360,-15.6,-2,
2026-07-03 17:51:29,16676,659.4,803.4,44.3,19.8,64.1,347.2,36.7,,359,-27.3,-0.6,
```

## 3. Incidents & remediation (tail)

### incidents
```
[2026-07-03 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md verdict=OK
[2026-07-03 08:04:05] DAILY_8AM_REPORT 2026-07-03 08:04:05 KST
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
[2026-07-02 21:38:14] CRITICAL process not running ??check crash-*.log
[2026-07-02 21:53:14] CRITICAL process not running ??check crash-*.log
[2026-07-02 23:25:13] CRITICAL process not running ??check crash-*.log
[2026-07-02 23:40:13] CRITICAL process not running ??check crash-*.log
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

