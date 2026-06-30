# Arcfire daily 08:00 KST auto report (mandatory perpetual)

Generated (KST): 2026-06-30 08:00:02
Package: com.arcfire.online

## Runtime

| pid | PSS (MB) | GL (MB) | Views |
|-----|----------|---------|-------|
| 23098 | 969.3 | 30.5 | 389 |

## mem-timeline (since DAILY_8AM_REPORT)

```csv
2026-06-30 00:28:35,23098,740.4,562.5,26.2,34.3,60.5,249.5,45,,389,-120.9,-123.8,GL_RECOVERED idle_ok
2026-06-30 00:43:53,23098,762.4,557.6,34.8,40.7,75.5,232.9,40.7,,488,22,8.6,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-06-30 00:59:12,23098,765.4,560.7,34.8,40.7,75.5,231.7,46.4,,385,3,0,
2026-06-30 01:14:32,23098,764.6,560.5,34.8,40.7,75.5,236.2,41,,405,-0.8,0,
2026-06-30 01:29:54,23098,774.3,731.5,48.2,19.8,68.1,371.6,41.1,,378,9.7,13.4,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-06-30 01:45:16,23098,692.4,651.3,20.9,19.8,40.8,314.5,28,,21,-81.9,-27.3,GL_RECOVERED idle_ok
2026-06-30 02:00:39,23098,907,863.4,25.9,19.8,45.7,482.6,43,,371,214.6,5,PSS_SPIKE review=graphics+native
2026-06-30 02:15:58,23098,917.7,874.2,30.3,19.8,50.1,488.3,35.4,,371,10.7,4.4,
2026-06-30 02:31:16,23098,934.4,891.5,30.3,19.8,50.1,490.8,42.8,,379,16.7,0,
2026-06-30 02:46:35,23098,940,897.2,30.3,19.8,50.1,486.7,52.5,,375,5.6,0,
2026-06-30 03:01:53,23098,933.3,891.2,30.3,19.8,50.1,492.9,42.6,,378,-6.7,0,
2026-06-30 03:17:11,23098,917.9,875.8,30.3,19.8,50.1,494.9,32.9,,379,-15.4,0,
2026-06-30 03:32:30,23098,920.7,878.8,30.3,19.8,50.1,501,37.4,,379,2.8,0,
2026-06-30 03:47:48,23098,943.7,901.8,30.9,40.7,71.5,497.3,41.9,,390,23,0.6,
2026-06-30 04:03:08,23098,952.8,910.8,32.9,40.7,73.5,502.9,42.9,,404,9.1,2,
2026-06-30 04:18:27,23098,949.6,908.3,30.5,34.3,64.8,504.5,47.2,,403,-3.2,-2.4,
2026-06-30 04:33:45,23098,947,894.6,30.4,30.2,60.6,497.7,46.2,,392,-2.6,-0.1,
2026-06-30 04:49:09,23098,934.9,882.8,30.2,19.8,50.1,498.8,43.6,,383,-12.1,-0.2,
2026-06-30 05:04:28,23098,942.1,881.9,30.2,19.8,50.1,504,45.2,,382,7.2,0,
2026-06-30 05:19:46,23098,945.1,883.9,30.2,19.8,50.1,504.2,47.2,,383,3,0,
2026-06-30 05:35:05,23098,952.1,890.9,30.2,19.8,50.1,510.8,47.1,,382,7,0,
2026-06-30 05:50:22,23098,951,856.8,30.2,19.8,50.1,476.1,47.4,,379,-1.1,0,
2026-06-30 06:05:41,23098,968.4,873.6,30.2,19.8,50.1,484.2,55.4,,378,17.4,0,
2026-06-30 06:20:59,23098,977.1,853.5,32.5,20,52.5,459.6,61.2,,379,8.7,2.3,
2026-06-30 06:36:22,23098,1002.2,878.7,32.9,40.7,73.5,466.9,57.4,,395,25.1,0.4,
2026-06-30 06:51:43,23098,982.8,859.2,32.5,34.3,66.8,466,45.4,,404,-19.4,-0.4,
2026-06-30 07:07:01,23098,973.6,850,30.2,19.8,50.1,464.4,53.8,,380,-9.2,-2.3,
2026-06-30 07:22:20,23098,967.5,843.5,32.2,19.8,52.1,474.7,62,,375,-6.1,2,
2026-06-30 07:37:40,23098,957.5,833.5,30.2,19.8,50.1,469.1,58.5,,382,-10,-2,
2026-06-30 07:53:00,23098,962.3,838.4,30.2,19.8,50.1,476.5,55.7,,378,4.8,0,
```

## incidents.log (tail)

```
[2026-06-29 13:30:39] PSS_SOFT_CEILING pss=914 gl=42.7 views=381 native_reclaim_advisory
[2026-06-29 13:45:57] PSS_SOFT_CEILING pss=907.1 gl=40.7 views=390 native_reclaim_advisory
[2026-06-29 15:32:45] PSS_SOFT_CEILING pss=830.8 gl=122.3 views=575 native_reclaim_advisory
[2026-06-29 15:48:06] PSS_SOFT_CEILING pss=831.8 gl=109.1 views=387 native_reclaim_advisory
[2026-06-29 20:38:43] GL_ELEVATED mounting_or_insufficient_samples gl=145.2 pss=790.6 views=361 restart_held
[2026-06-29 21:40:01] GL_ELEVATED mounting_or_insufficient_samples gl=138 pss=773.8 views=574 restart_held
[2026-06-29 22:10:42] PSS_SOFT_CEILING pss=813.6 gl=148.2 views=566 native_reclaim_advisory
[2026-06-29 22:25:59] GL_ELEVATED mounting_or_insufficient_samples gl=128.7 pss=775.7 views=565 restart_held
[2026-06-29 22:41:16] GL_ELEVATED mounting_or_insufficient_samples gl=128.7 pss=775.4 views=565 restart_held
[2026-06-29 22:56:33] GL_ELEVATED mounting_or_insufficient_samples gl=128.7 pss=763.1 views=565 restart_held
[2026-06-30 00:13:20] PSS_SOFT_CEILING pss=861.3 gl=150 views=565 native_reclaim_advisory
[2026-06-30 02:00:45] PSS_SOFT_CEILING pss=907 gl=25.9 views=371 native_reclaim_advisory
[2026-06-30 02:16:03] PSS_SOFT_CEILING pss=917.7 gl=30.3 views=371 native_reclaim_advisory
[2026-06-30 02:31:21] PSS_SOFT_CEILING pss=934.4 gl=30.3 views=379 native_reclaim_advisory
[2026-06-30 02:46:39] PSS_SOFT_CEILING pss=940 gl=30.3 views=375 native_reclaim_advisory
[2026-06-30 03:01:58] PSS_SOFT_CEILING pss=933.3 gl=30.3 views=378 native_reclaim_advisory
[2026-06-30 03:17:15] PSS_SOFT_CEILING pss=917.9 gl=30.3 views=379 native_reclaim_advisory
[2026-06-30 03:32:35] PSS_SOFT_CEILING pss=920.7 gl=30.3 views=379 native_reclaim_advisory
[2026-06-30 03:47:53] PSS_SOFT_CEILING pss=943.7 gl=30.9 views=390 native_reclaim_advisory
[2026-06-30 04:18:32] PSS_SOFT_CEILING pss=949.6 gl=30.5 views=403 native_reclaim_advisory
[2026-06-30 04:33:51] PSS_SOFT_CEILING pss=947 gl=30.4 views=392 native_reclaim_advisory
[2026-06-30 04:49:14] PSS_SOFT_CEILING pss=934.9 gl=30.2 views=383 native_reclaim_advisory
[2026-06-30 05:04:33] PSS_SOFT_CEILING pss=942.1 gl=30.2 views=382 native_reclaim_advisory
[2026-06-30 05:19:51] PSS_SOFT_CEILING pss=945.1 gl=30.2 views=383 native_reclaim_advisory
[2026-06-30 08:00:00] DAILY_8AM_REPORT 2026-06-30 08:00:00 KST
```

## remediation.log (tail)

```
[2026-06-29 21:40:01] INFO GL_ELEVATED mounting_or_insufficient_samples gl=138 pss=773.8 views=574 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-29 22:10:42] INFO PSS_SOFT_CEILING pss=813.6 gl=148.2 views=566 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-29 22:25:59] INFO GL_ELEVATED mounting_or_insufficient_samples gl=128.7 pss=775.7 views=565 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-29 22:41:16] INFO GL_ELEVATED mounting_or_insufficient_samples gl=128.7 pss=775.4 views=565 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-29 22:56:33] INFO GL_ELEVATED mounting_or_insufficient_samples gl=128.7 pss=763.1 views=565 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-30 00:13:20] INFO PSS_SOFT_CEILING pss=861.3 gl=150 views=565 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-30 02:00:45] INFO PSS_SOFT_CEILING pss=907 gl=25.9 views=371 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-30 02:16:03] INFO PSS_SOFT_CEILING pss=917.7 gl=30.3 views=371 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-30 02:31:21] INFO PSS_SOFT_CEILING pss=934.4 gl=30.3 views=379 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-30 02:46:39] INFO PSS_SOFT_CEILING pss=940 gl=30.3 views=375 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-30 03:01:58] INFO PSS_SOFT_CEILING pss=933.3 gl=30.3 views=378 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-30 03:17:15] INFO PSS_SOFT_CEILING pss=917.9 gl=30.3 views=379 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-30 03:32:35] INFO PSS_SOFT_CEILING pss=920.7 gl=30.3 views=379 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-30 03:47:53] INFO PSS_SOFT_CEILING pss=943.7 gl=30.9 views=390 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-30 04:03:14] INFO GL_HARD_CEILING_RECORD_ONLY gl=32.9 pss=952.8 views=404 (monitor-paused ??no incident/refix spam)
[2026-06-30 04:18:32] INFO PSS_SOFT_CEILING pss=949.6 gl=30.5 views=403 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-30 04:33:51] INFO PSS_SOFT_CEILING pss=947 gl=30.4 views=392 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-30 04:49:14] INFO PSS_SOFT_CEILING pss=934.9 gl=30.2 views=383 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-30 05:04:33] INFO PSS_SOFT_CEILING pss=942.1 gl=30.2 views=382 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-30 05:19:51] INFO PSS_SOFT_CEILING pss=945.1 gl=30.2 views=383 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-30 05:35:09] INFO GL_HARD_CEILING_RECORD_ONLY gl=30.2 pss=952.1 views=382 (monitor-paused ??no incident/refix spam)
[2026-06-30 06:05:45] INFO GL_HARD_CEILING_RECORD_ONLY gl=30.2 pss=968.4 views=378 (monitor-paused ??no incident/refix spam)
[2026-06-30 06:36:29] INFO GL_HARD_CEILING_RECORD_ONLY gl=32.9 pss=1002.2 views=395 (monitor-paused ??no incident/refix spam)
[2026-06-30 07:07:05] INFO GL_HARD_CEILING_RECORD_ONLY gl=30.2 pss=973.6 views=380 (monitor-paused ??no incident/refix spam)
[2026-06-30 07:37:45] INFO GL_HARD_CEILING_RECORD_ONLY gl=30.2 pss=957.5 views=382 (monitor-paused ??no incident/refix spam)
```

## mem-alerts.log (tail)

```
[2026-06-28 19:18:37] PSS +45.9MB GL 51MB views=150
[2026-06-28 19:33:34] GL +62.1MB views=632 (PSS 54MB) ??active hub
[2026-06-28 19:39:23] GL +45.1MB views=632 (PSS 130.5MB) ??active hub
[2026-06-28 21:22:36] GL +74.1MB views=567 (PSS 107.1MB) ??active hub
[2026-06-28 22:04:05] PSS +124.8MB GL 12.2MB views=99
[2026-06-28 22:27:46] CRITICAL process not running ??check crash-*.log
[2026-06-28 22:42:54] CRITICAL process not running ??check crash-*.log
[2026-06-28 23:44:14] GL +86.5MB views=385 (PSS 91.6MB) ??active hub
[2026-06-29 01:16:08] CRITICAL process not running ??check crash-*.log
[2026-06-29 08:39:34] GL +112.2MB views=556 (PSS 12.7MB) ??active hub
[2026-06-29 08:55:02] PSS +259.1MB GL 142.7MB views=475
[2026-06-29 09:25:40] GL +23.4MB views=377 (PSS 61.9MB) ??active hub
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

