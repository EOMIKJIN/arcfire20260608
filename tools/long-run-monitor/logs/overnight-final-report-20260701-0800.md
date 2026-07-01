# Arcfire daily 08:00 KST auto report (mandatory perpetual)

Generated (KST): 2026-07-01 08:00:02
Package: com.arcfire.online

## Runtime

| pid | PSS (MB) | GL (MB) | Views |
|-----|----------|---------|-------|
| 23575 | 694.1 | 29.5 | 368 |

## mem-timeline (since DAILY_8AM_REPORT)

```csv
2026-07-01 00:27:19,23575,656.4,787.8,32.3,19.8,52.1,344.8,42.3,,369,,,
2026-07-01 00:42:43,23575,696.5,824.2,22,34.3,56.3,372,43.4,,378,40.1,-10.3,PSS_SPIKE review=graphics+native
2026-07-01 00:58:04,23575,694,823.5,27.7,34.3,62,369.1,35.8,,390,-2.5,5.7,
2026-07-01 01:13:22,23575,702.4,831.9,28,40.7,68.7,369.4,38.1,,387,8.4,0.3,
2026-07-01 01:28:40,23575,680.9,810.7,27.4,20,47.4,367.5,44.1,,370,-21.5,-0.6,
2026-07-01 01:44:00,23575,669.3,799.1,27.4,19.8,47.3,367.2,40.9,,370,-11.6,0,
2026-07-01 01:59:18,23575,674.5,804.6,27.4,19.8,47.3,375.4,41.8,,370,5.2,0,
2026-07-01 02:14:37,23575,652.7,782.8,27.4,19.8,47.2,372.3,22.8,,370,-21.8,0,
2026-07-01 02:29:56,23575,656.6,786.9,27.4,19.8,47.2,367.2,31.3,,367,3.9,0,
2026-07-01 02:45:15,23575,661.8,791.8,27.4,19.8,47.2,366.2,39,,367,5.2,0,
2026-07-01 03:00:33,23575,676.8,806.8,27.6,34.3,61.9,372.2,32.8,,379,15,0.2,
2026-07-01 03:15:51,23575,687.9,817.7,28,40.7,68.7,373.2,36,,385,11.1,0.4,
2026-07-01 03:31:09,23575,665.9,796.5,27.4,19.8,47.2,376.1,32.8,,371,-22,-0.6,
2026-07-01 03:46:27,23575,673.1,803.7,27.4,19.8,47.2,374.3,41.3,,370,7.2,0,
2026-07-01 04:01:47,23575,663,793.7,27.4,19.8,47.2,368.9,36,,370,-10.1,0,
2026-07-01 04:17:05,23575,663.8,794.5,27.4,19.8,47.2,370.7,34.3,,366,0.8,0,
2026-07-01 04:32:23,23575,668.1,798.6,29.4,19.8,49.2,370.3,36.2,,372,4.3,2,
2026-07-01 04:47:43,23575,659.7,790.9,27.4,19.8,47.2,369.9,31,,370,-8.4,-2,
2026-07-01 05:03:03,23575,676.1,806.8,29.4,19.8,49.2,377.2,37.4,,368,16.4,2,
2026-07-01 05:18:23,23575,679.5,810,27.5,30.2,57.8,377.3,31.7,,375,3.4,-1.9,
2026-07-01 05:33:41,23575,700.5,830.2,29.7,34.3,64,382.7,39.6,,393,21,2.2,
2026-07-01 05:48:58,23575,692.3,822,28.1,40.7,68.8,373.6,35,,388,-8.2,-1.6,
2026-07-01 06:04:17,23575,697.9,827.7,28.1,40.7,68.8,378.7,34.9,,377,5.6,0,
2026-07-01 06:19:35,23575,681.7,811.6,29.5,19.8,49.4,382.5,33.6,,371,-16.2,1.4,
2026-07-01 06:34:55,23575,689,818.9,27.5,19.8,47.4,383.9,41.2,,366,7.3,-2,
2026-07-01 06:50:15,23575,679.6,809.3,27.5,19.8,47.4,378.2,37.3,,371,-9.4,0,
2026-07-01 07:05:33,23575,676.1,805.9,27.5,19.8,47.4,377.4,33.7,,371,-3.5,0,
2026-07-01 07:20:51,23575,678.1,805.7,27.5,19.8,47.4,377.3,33.3,,367,2,0,
2026-07-01 07:36:10,23575,687.1,815.9,27.5,19.8,47.4,385.2,35.4,,366,9,0,
2026-07-01 07:51:28,23575,688.2,817,27.5,19.8,47.4,387.5,33.2,,371,1.1,0,
```

## incidents.log (tail)

```
[2026-06-30 10:39:34] PSS_SOFT_CEILING pss=912.9 gl=149.3 views=371 native_reclaim_advisory
[2026-06-30 12:00:00] EVENING_WATCH_1200_REPORT_READY d:\arcfire20260607\tools\long-run-monitor\logs\evening-watch-report-20260630-1200.md
[2026-06-30 13:58:57] PSS_SOFT_CEILING pss=805.7 gl=131.7 views=383 native_reclaim_advisory
[2026-06-30 14:14:16] PSS_SOFT_CEILING pss=818.2 gl=131.9 views=395 native_reclaim_advisory
[2026-06-30 16:16:49] PSS_SOFT_CEILING pss=808.4 gl=145.6 views=366 native_reclaim_advisory
[2026-06-30 16:32:06] PSS_SOFT_CEILING pss=820 gl=141.5 views=367 native_reclaim_advisory
[2026-06-30 16:47:24] PSS_SOFT_CEILING pss=800.8 gl=142.1 views=372 native_reclaim_advisory
[2026-06-30 17:02:41] GL_ELEVATED mounting_or_insufficient_samples gl=141.5 pss=734.2 views=370 restart_held
[2026-06-30 17:18:01] GL_ELEVATED mounting_or_insufficient_samples gl=141.5 pss=748.5 views=374 restart_held
[2026-06-30 17:33:19] GL_ELEVATED mounting_or_insufficient_samples gl=143.5 pss=751.8 views=367 restart_held
[2026-06-30 17:48:37] GL_ELEVATED mounting_or_insufficient_samples gl=143.5 pss=750.8 views=367 restart_held
[2026-06-30 18:03:55] GL_ELEVATED mounting_or_insufficient_samples gl=142.1 pss=782.2 views=384 restart_held
[2026-06-30 18:34:33] GL_ELEVATED mounting_or_insufficient_samples gl=111.5 pss=750.2 views=381 restart_held
[2026-06-30 18:49:51] GL_ELEVATED mounting_or_insufficient_samples gl=111 pss=731.7 views=373 restart_held
[2026-06-30 19:05:10] GL_ELEVATED mounting_or_insufficient_samples gl=113 pss=746.3 views=374 restart_held
[2026-06-30 19:20:28] GL_ELEVATED mounting_or_insufficient_samples gl=111.1 pss=751.3 views=369 restart_held
[2026-06-30 19:51:11] PSS_SOFT_CEILING pss=924.1 gl=124.8 views=558 native_reclaim_advisory
[2026-06-30 20:06:39] PSS_SOFT_CEILING pss=803.1 gl=139.7 views=365 native_reclaim_advisory
[2026-06-30 21:23:29] PSS_SOFT_CEILING pss=913.8 gl=147.7 views=383 native_reclaim_advisory
[2026-06-30 22:40:00] PSS_SOFT_CEILING pss=831.2 gl=39.7 views=369 native_reclaim_advisory
[2026-06-30 22:55:20] PSS_SOFT_CEILING pss=847.9 gl=37.8 views=369 native_reclaim_advisory
[2026-06-30 23:10:46] PSS_SOFT_CEILING pss=852.9 gl=37.9 views=370 native_reclaim_advisory
[2026-06-30 23:26:03] PSS_SOFT_CEILING pss=863.7 gl=37.9 views=369 native_reclaim_advisory
[2026-06-30 23:56:43] PSS_SOFT_CEILING pss=880.8 gl=148.8 views=374 native_reclaim_advisory
[2026-07-01 08:00:00] DAILY_8AM_REPORT 2026-07-01 08:00:00 KST
```

## remediation.log (tail)

```
[2026-06-30 10:39:34] INFO PSS_SOFT_CEILING pss=912.9 gl=149.3 views=371 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-30 13:58:57] INFO PSS_SOFT_CEILING pss=805.7 gl=131.7 views=383 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-30 14:14:16] INFO PSS_SOFT_CEILING pss=818.2 gl=131.9 views=395 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-30 16:16:49] INFO PSS_SOFT_CEILING pss=808.4 gl=145.6 views=366 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-30 16:32:06] INFO PSS_SOFT_CEILING pss=820 gl=141.5 views=367 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-30 16:47:24] INFO PSS_SOFT_CEILING pss=800.8 gl=142.1 views=372 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-30 17:02:41] INFO GL_ELEVATED mounting_or_insufficient_samples gl=141.5 pss=734.2 views=370 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-30 17:18:01] INFO GL_ELEVATED mounting_or_insufficient_samples gl=141.5 pss=748.5 views=374 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-30 17:33:19] INFO GL_ELEVATED mounting_or_insufficient_samples gl=143.5 pss=751.8 views=367 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-30 17:48:37] INFO GL_ELEVATED mounting_or_insufficient_samples gl=143.5 pss=750.8 views=367 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-30 18:03:55] INFO GL_ELEVATED mounting_or_insufficient_samples gl=142.1 pss=782.2 views=384 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-30 18:19:14] INFO GL_HARD_CEILING_RECORD_ONLY gl=208.4 pss=855.1 views=395 (monitor-paused ??no incident/refix spam)
[2026-06-30 18:34:33] INFO GL_ELEVATED mounting_or_insufficient_samples gl=111.5 pss=750.2 views=381 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-30 18:49:51] INFO GL_ELEVATED mounting_or_insufficient_samples gl=111 pss=731.7 views=373 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-30 19:05:10] INFO GL_ELEVATED mounting_or_insufficient_samples gl=113 pss=746.3 views=374 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-30 19:20:28] INFO GL_ELEVATED mounting_or_insufficient_samples gl=111.1 pss=751.3 views=369 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-30 19:51:11] INFO PSS_SOFT_CEILING pss=924.1 gl=124.8 views=558 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-30 20:06:39] INFO PSS_SOFT_CEILING pss=803.1 gl=139.7 views=365 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-30 20:22:07] INFO GL_HARD_CEILING_RECORD_ONLY gl=201.7 pss=1041.3 views=359 (monitor-paused ??no incident/refix spam)
[2026-06-30 21:23:29] INFO PSS_SOFT_CEILING pss=913.8 gl=147.7 views=383 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-30 22:40:00] INFO PSS_SOFT_CEILING pss=831.2 gl=39.7 views=369 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-30 22:55:20] INFO PSS_SOFT_CEILING pss=847.9 gl=37.8 views=369 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-30 23:10:46] INFO PSS_SOFT_CEILING pss=852.9 gl=37.9 views=370 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-30 23:26:03] INFO PSS_SOFT_CEILING pss=863.7 gl=37.9 views=369 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-30 23:56:43] INFO PSS_SOFT_CEILING pss=880.8 gl=148.8 views=374 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
```

## mem-alerts.log (tail)

```
[2026-06-29 14:01:10] GL +103.9MB views=557 (PSS 114.8MB) ??active hub
[2026-06-29 14:47:13] CRITICAL process not running ??check crash-*.log
[2026-06-29 15:02:13] CRITICAL process not running ??check crash-*.log
[2026-06-29 16:03:20] CRITICAL process not running ??check crash-*.log
[2026-06-29 16:18:21] CRITICAL process not running ??check crash-*.log
[2026-06-29 21:39:57] GL +98.1MB views=574 (PSS 34.3MB) ??active hub
[2026-06-29 22:10:37] GL +114.7MB views=566 (PSS 136.2MB) ??active hub
[2026-06-29 23:27:09] GL +11.9MB views=381 (PSS 33.5MB) ??active hub
[2026-06-29 23:57:51] GL +9.8MB views=378 (PSS -1.3MB) ??active hub
[2026-06-30 00:13:16] GL +102MB views=565 (PSS 182.5MB) ??active hub
[2026-06-30 00:43:53] GL +8.6MB views=488 (PSS 22MB) ??active hub
[2026-06-30 01:29:54] GL +13.4MB views=378 (PSS 9.7MB) ??active hub
[2026-06-30 02:00:39] PSS +214.6MB GL 25.9MB views=371
[2026-06-30 09:24:51] CRITICAL process not running ??check crash-*.log
[2026-06-30 10:24:08] PSS +43.3MB GL 39.5MB views=375
[2026-06-30 10:39:28] GL +109.8MB views=371 (PSS 69.5MB) ??active hub
[2026-06-30 12:26:49] GL +18.2MB views=379 (PSS 27.6MB) ??active hub
[2026-06-30 13:43:30] GL +16.1MB views=375 (PSS -12.3MB) ??active hub
[2026-06-30 13:58:53] GL +83.2MB views=383 (PSS 89.6MB) ??active hub
[2026-06-30 16:16:45] GL +112.7MB views=366 (PSS 181.8MB) ??active hub
[2026-06-30 18:19:09] GL +66.3MB views=395 (PSS 72.9MB) ??active hub
[2026-06-30 19:51:03] GL +89.6MB views=558 (PSS 217.9MB) ??active hub
[2026-06-30 21:38:46] CRITICAL process not running ??check crash-*.log
[2026-06-30 22:39:55] PSS +43.9MB GL 39.7MB views=369
[2026-07-01 00:42:43] PSS +40.1MB GL 22MB views=378
```

## KPI (overnight window)

| Metric | Count |
|--------|-------|
| GL_HARD_CEILING incidents | 22 |
| Crash / PROCESS_DEATH | 95 |
| Auto app relaunch | 22 |

## Action items for Kim Team Lead

1. GL_HARD_CEILING or 3x GL_SPIKE ??P0 hub Skia audit (see overnight-watch handoff).
2. SIGSEGV/FATAL ??arcfire-bug-debug-workflow + logcat tail in latest crash-*.log.
3. Stair-step floor rise without crash ??today's dev P0 list in overnight-watch handoff.

