# Arcfire daily 08:00 KST auto report (mandatory perpetual)

Generated (KST): 2026-07-03 08:00:02
Package: com.arcfire.online

## Runtime

| pid | PSS (MB) | GL (MB) | Views |
|-----|----------|---------|-------|
| 10002 | 688.2 | 34 | 387 |

## mem-timeline (since DAILY_8AM_REPORT)

```csv
2026-07-03 00:25:45,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-07-03 00:40:45,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-07-03 00:55:46,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-07-03 01:10:46,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-07-03 01:25:46,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-07-03 01:40:47,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-07-03 01:55:47,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-07-03 02:10:48,4540,792.9,931.6,136.4,19.8,156.3,385.9,33.2,,451,,,
2026-07-03 02:26:14,4540,673.3,811.5,12.1,19.8,31.9,392.3,45.2,,99,,,
2026-07-03 02:41:43,4540,677.2,817.2,11.9,19.8,31.8,393.1,42.6,,99,3.9,-0.2,
2026-07-03 02:57:05,4540,783.7,924.8,59.8,19.8,79.6,438.2,41.1,,480,106.5,47.9,HUB_ACTIVATION gl_mount_ok
2026-07-03 03:12:32,4540,892.4,1032.9,136.2,19.8,156,466.6,42.3,,570,108.7,76.4,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-07-03 03:28:00,4540,1083.9,1218.1,144.6,19.8,164.4,625.5,32.4,,560,191.5,8.4,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-07-03 03:43:26,4540,918.7,1031.3,15.5,22,37.5,631.2,47,,15,-165.2,-129.1,GL_RECOVERED idle_ok
2026-07-03 03:58:54,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-07-03 04:13:54,10002,586.3,717.7,9.1,19.8,28.9,318.8,40.3,,99,,,
2026-07-03 04:29:17,10002,683,818.4,32.2,19.8,52.1,351.7,48.6,,367,,,
2026-07-03 04:44:37,10002,668.9,807.1,32.2,19.8,52.1,348.2,31.8,,364,-14.1,0,
2026-07-03 04:59:57,10002,687.6,825.9,32.2,19.8,52.1,355.3,38,,371,18.7,0,
2026-07-03 05:15:16,10002,683.3,821.1,33.2,19.8,53.1,350.2,36.3,,368,-4.3,1,
2026-07-03 05:30:35,10002,686.9,824.8,33.2,20,53.2,352.5,39.2,,364,3.6,0,
2026-07-03 05:45:55,10002,709.3,846.6,33.9,40.7,74.5,358.5,37.4,,365,22.4,0.7,
2026-07-03 06:01:14,10002,699.1,836.6,34,40.7,74.7,358.3,34.7,,372,-10.2,0.1,
2026-07-03 06:16:33,10002,694.2,832,33.7,34.3,68,354.8,44,,392,-4.9,-0.3,
2026-07-03 06:31:51,10002,682,819.8,33.6,34.3,67.9,349.8,35.9,,388,-12.2,-0.1,
2026-07-03 06:47:10,10002,674.1,812.1,33.4,19.8,53.2,356.2,36,,367,-7.9,-0.2,
2026-07-03 07:02:28,10002,674.9,812.9,33.4,19.8,53.2,356.1,36.9,,367,0.8,0,
2026-07-03 07:17:47,10002,665.1,803.6,33.4,19.8,53.2,352.6,30.2,,367,-9.8,0,
2026-07-03 07:33:05,10002,678.6,818.2,33.4,19.8,53.2,358,39.3,,367,13.5,0,
2026-07-03 07:48:23,10002,664.2,806.1,33.4,19.8,53.2,357.5,27.4,,359,-14.4,0,
```

## incidents.log (tail)

```
[2026-07-02 08:11:25] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260702-0800.md verdict=OK
[2026-07-02 08:13:27] DAILY_8AM_REPORT 2026-07-02 08:13:27 KST
[2026-07-02 08:13:27] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260702-0800.md verdict=OK
[2026-07-02 14:44:18] PSS_SOFT_CEILING pss=818.8 gl=44.3 views=396 native_reclaim_advisory
[2026-07-02 15:14:57] PSS_SOFT_CEILING pss=829.5 gl=48.2 views=392 native_reclaim_advisory
[2026-07-02 15:30:19] PSS_SOFT_CEILING pss=896.6 gl=126.9 views=358 native_reclaim_advisory
[2026-07-02 15:45:39] PSS_SOFT_CEILING pss=890.3 gl=127.2 views=358 native_reclaim_advisory
[2026-07-02 16:00:56] PSS_SOFT_CEILING pss=912 gl=127.8 views=367 native_reclaim_advisory
[2026-07-02 16:16:14] PSS_SOFT_CEILING pss=874 gl=109.5 views=540 native_reclaim_advisory
[2026-07-02 16:31:34] PSS_SOFT_CEILING pss=900.2 gl=115.1 views=435 native_reclaim_advisory
[2026-07-02 16:46:57] PSS_SOFT_CEILING pss=898.5 gl=117.1 views=365 native_reclaim_advisory
[2026-07-02 17:02:23] PSS_SOFT_CEILING pss=917.4 gl=115.3 views=387 native_reclaim_advisory
[2026-07-02 17:17:42] PSS_SOFT_CEILING pss=893.8 gl=117.1 views=367 native_reclaim_advisory
[2026-07-02 17:33:00] PSS_SOFT_CEILING pss=927.3 gl=115.7 views=364 native_reclaim_advisory
[2026-07-02 17:48:19] PSS_SOFT_CEILING pss=919.9 gl=117.1 views=367 native_reclaim_advisory
[2026-07-02 18:03:38] PSS_SOFT_CEILING pss=921.3 gl=125 views=571 native_reclaim_advisory
[2026-07-02 18:18:58] PSS_SOFT_CEILING pss=815.5 gl=41.5 views=375 native_reclaim_advisory
[2026-07-02 18:34:17] PSS_SOFT_CEILING pss=856.1 gl=34.6 views=387 native_reclaim_advisory
[2026-07-02 18:49:35] PSS_SOFT_CEILING pss=836.5 gl=36 views=378 native_reclaim_advisory
[2026-07-02 20:06:30] PSS_SOFT_CEILING pss=885.5 gl=37 views=392 native_reclaim_advisory
[2026-07-02 20:21:51] PSS_SOFT_CEILING pss=886.4 gl=37 views=375 native_reclaim_advisory
[2026-07-02 20:37:13] PSS_SOFT_CEILING pss=915 gl=35.2 views=390 native_reclaim_advisory
[2026-07-03 02:10:57] GL_ELEVATED mounting_or_insufficient_samples gl=136.4 pss=792.9 views=451 restart_held
[2026-07-03 03:12:38] PSS_SOFT_CEILING pss=892.4 gl=136.2 views=570 native_reclaim_advisory
[2026-07-03 08:00:00] DAILY_8AM_REPORT 2026-07-03 08:00:00 KST
```

## remediation.log (tail)

```
[2026-07-01 23:14:06] INFO GL_ELEVATED mounting_or_insufficient_samples gl=115.4 pss=789.4 views=389 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-07-01 23:26:54] INFO GL_ELEVATED mounting_or_insufficient_samples gl=115 pss=783.6 views=387 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-07-02 14:44:18] INFO PSS_SOFT_CEILING pss=818.8 gl=44.3 views=396 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-02 15:14:57] INFO PSS_SOFT_CEILING pss=829.5 gl=48.2 views=392 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-02 15:30:19] INFO PSS_SOFT_CEILING pss=896.6 gl=126.9 views=358 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-02 15:45:39] INFO PSS_SOFT_CEILING pss=890.3 gl=127.2 views=358 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-02 16:00:56] INFO PSS_SOFT_CEILING pss=912 gl=127.8 views=367 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-02 16:16:14] INFO PSS_SOFT_CEILING pss=874 gl=109.5 views=540 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-02 16:31:34] INFO PSS_SOFT_CEILING pss=900.2 gl=115.1 views=435 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
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
```

## mem-alerts.log (tail)

```
[2026-07-01 20:07:11] GL +27.5MB views=361 (PSS 15.7MB) ??active hub
[2026-07-01 21:54:39] GL +109.7MB views=362 (PSS 137.7MB) ??active hub
[2026-07-01 23:42:14] CRITICAL process not running ??check crash-*.log
[2026-07-01 23:57:15] CRITICAL process not running ??check crash-*.log
[2026-07-02 00:12:16] CRITICAL process not running ??check crash-*.log
[2026-07-02 14:13:35] PSS +100.7MB GL 19.5MB views=103
[2026-07-02 15:30:13] GL +78.7MB views=358 (PSS 67.1MB) ??active hub
[2026-07-02 18:34:12] PSS +40.6MB GL 34.6MB views=387
[2026-07-02 19:04:53] GL +88.7MB views=564 (PSS 133.9MB) ??active hub
[2026-07-02 21:23:12] CRITICAL process not running ??check crash-*.log
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

