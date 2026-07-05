# Arcfire daily 08:00 KST auto report (mandatory perpetual)

Generated (KST): 2026-07-05 08:00:03
Package: com.arcfire.online

## Runtime

| pid | PSS (MB) | GL (MB) | Views |
|-----|----------|---------|-------|
| 29883 | 963.1 | 154.1 | 374 |

## mem-timeline (since DAILY_8AM_REPORT)

```csv
2026-07-05 00:28:50,29883,831.9,958.4,51.4,40.7,92,423.1,40.1,,322,115.5,11.4,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-07-05 00:44:10,29883,900.3,1026.6,148.9,19.8,168.7,444.5,32.9,,374,68.4,97.5,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-07-05 00:59:34,29883,920.5,1048.2,153.4,34.3,187.7,436.5,40.9,,389,20.2,4.5,
2026-07-05 01:15:03,29883,911.4,1039.3,149.2,19.8,169.1,438.3,48.3,,371,-9.1,-4.2,
2026-07-05 01:30:23,29883,905,1032.9,151.2,19.8,171.1,444.6,33.6,,367,-6.4,2,
2026-07-05 01:45:42,29883,901.1,1029.4,149.4,19.8,169.2,441.8,34.3,,371,-3.9,-1.8,
2026-07-05 02:01:01,29883,905.6,1033.6,151.4,19.8,171.2,442.9,34.9,,370,4.5,2,
2026-07-05 02:16:20,29883,926.5,1054.9,156,40.7,196.7,439.7,33.3,,374,20.9,4.6,
2026-07-05 02:31:39,29883,926.3,1054.7,153.6,34.3,187.9,442.5,38.7,,388,-0.2,-2.4,
2026-07-05 02:46:58,29883,902.2,1030.7,149.4,19.8,169.2,439.3,36.1,,367,-24.1,-4.2,
2026-07-05 03:02:17,29883,905.1,1033.6,149.4,19.8,169.2,444.1,33.8,,370,2.9,0,
2026-07-05 03:17:36,29883,912.8,1041.3,149.4,19.8,169.2,444,40.9,,369,7.7,0,
2026-07-05 03:32:56,29883,941.1,1069.5,154,40.7,194.7,452.7,34.7,,373,28.3,4.6,
2026-07-05 03:48:16,29883,927.1,1055.6,153.6,34.3,187.9,441.8,37.6,,379,-14,-0.4,
2026-07-05 04:03:35,29883,905.7,1034.1,151.4,19.8,171.2,439.9,34.3,,370,-21.4,-2.2,
2026-07-05 04:18:53,29883,917.3,1045.7,149.4,19.8,169.2,447.6,39.6,,366,11.6,-2,
2026-07-05 04:34:12,29883,918.7,1047.2,149.4,19.8,169.2,447.8,40.3,,370,1.4,0,
2026-07-05 04:49:31,29883,942.5,1070.2,154,40.7,194.7,453,31.8,,385,23.8,4.6,
2026-07-05 05:04:50,29883,919.5,1047.8,149.4,19.8,169.2,450.7,36.5,,366,-23,-4.6,
2026-07-05 05:20:09,29883,915.6,1044,149.4,19.8,169.2,446.1,36.6,,392,-3.9,0,
2026-07-05 05:35:28,29883,916.9,1045.3,149.4,19.8,169.2,445.8,37.7,,369,1.3,0,
2026-07-05 05:50:48,29883,929.2,1057.4,151.9,20,171.9,453.8,38.7,,370,12.3,2.5,
2026-07-05 06:06:08,29883,931.4,1059.7,153.6,34.3,187.9,446.3,31.9,,384,2.2,1.7,
2026-07-05 06:21:29,29883,923,1051.2,151.4,19.8,171.2,453.3,32.7,,366,-8.4,-2.2,
2026-07-05 06:36:48,29883,925.5,1053.7,149.4,19.8,169.2,453.4,36.5,,371,2.5,-2,
2026-07-05 06:52:07,29883,929.2,1057.4,149.5,19.8,169.3,453.4,39.7,,371,3.7,0.1,
2026-07-05 07:07:27,29883,949.2,1077.4,153.8,34.3,188.1,458.6,35.2,,393,20,4.3,
2026-07-05 07:22:45,29883,922.9,1051,149.5,19.8,169.3,448.1,37.6,,367,-26.3,-4.3,
2026-07-05 07:38:05,29883,934.5,1062.9,149.5,19.8,169.3,457.9,39,,370,11.6,0,
2026-07-05 07:53:23,29883,938.1,1066.1,149.5,19.8,169.3,464.6,35,,371,3.6,0,
```

## incidents.log (tail)

```
[2026-07-05 02:01:06] PSS_SOFT_CEILING pss=905.6 gl=151.4 views=370 native_reclaim_advisory
[2026-07-05 02:16:25] PSS_SOFT_CEILING pss=926.5 gl=156 views=374 native_reclaim_advisory
[2026-07-05 02:31:44] PSS_SOFT_CEILING pss=926.3 gl=153.6 views=388 native_reclaim_advisory
[2026-07-05 02:47:03] PSS_SOFT_CEILING pss=902.2 gl=149.4 views=367 native_reclaim_advisory
[2026-07-05 03:02:22] PSS_SOFT_CEILING pss=905.1 gl=149.4 views=370 native_reclaim_advisory
[2026-07-05 03:17:41] PSS_SOFT_CEILING pss=912.8 gl=149.4 views=369 native_reclaim_advisory
[2026-07-05 03:33:01] PSS_SOFT_CEILING pss=941.1 gl=154 views=373 native_reclaim_advisory
[2026-07-05 03:48:20] PSS_SOFT_CEILING pss=927.1 gl=153.6 views=379 native_reclaim_advisory
[2026-07-05 04:03:39] PSS_SOFT_CEILING pss=905.7 gl=151.4 views=370 native_reclaim_advisory
[2026-07-05 04:18:58] PSS_SOFT_CEILING pss=917.3 gl=149.4 views=366 native_reclaim_advisory
[2026-07-05 04:34:17] PSS_SOFT_CEILING pss=918.7 gl=149.4 views=370 native_reclaim_advisory
[2026-07-05 04:49:36] PSS_SOFT_CEILING pss=942.5 gl=154 views=385 native_reclaim_advisory
[2026-07-05 05:04:54] PSS_SOFT_CEILING pss=919.5 gl=149.4 views=366 native_reclaim_advisory
[2026-07-05 05:20:13] PSS_SOFT_CEILING pss=915.6 gl=149.4 views=392 native_reclaim_advisory
[2026-07-05 05:35:34] PSS_SOFT_CEILING pss=916.9 gl=149.4 views=369 native_reclaim_advisory
[2026-07-05 05:50:54] PSS_SOFT_CEILING pss=929.2 gl=151.9 views=370 native_reclaim_advisory
[2026-07-05 06:06:13] PSS_SOFT_CEILING pss=931.4 gl=153.6 views=384 native_reclaim_advisory
[2026-07-05 06:21:33] PSS_SOFT_CEILING pss=923 gl=151.4 views=366 native_reclaim_advisory
[2026-07-05 06:36:52] PSS_SOFT_CEILING pss=925.5 gl=149.4 views=371 native_reclaim_advisory
[2026-07-05 06:52:12] PSS_SOFT_CEILING pss=929.2 gl=149.5 views=371 native_reclaim_advisory
[2026-07-05 07:07:31] PSS_SOFT_CEILING pss=949.2 gl=153.8 views=393 native_reclaim_advisory
[2026-07-05 07:22:50] PSS_SOFT_CEILING pss=922.9 gl=149.5 views=367 native_reclaim_advisory
[2026-07-05 07:38:09] PSS_SOFT_CEILING pss=934.5 gl=149.5 views=370 native_reclaim_advisory
[2026-07-05 07:53:28] PSS_SOFT_CEILING pss=938.1 gl=149.5 views=371 native_reclaim_advisory
[2026-07-05 08:00:00] DAILY_8AM_REPORT 2026-07-05 08:00:00 KST
```

## remediation.log (tail)

```
[2026-07-05 01:45:47] INFO PSS_SOFT_CEILING pss=901.1 gl=149.4 views=371 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-05 02:01:06] INFO PSS_SOFT_CEILING pss=905.6 gl=151.4 views=370 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-05 02:16:25] INFO PSS_SOFT_CEILING pss=926.5 gl=156 views=374 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-05 02:31:44] INFO PSS_SOFT_CEILING pss=926.3 gl=153.6 views=388 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-05 02:47:03] INFO PSS_SOFT_CEILING pss=902.2 gl=149.4 views=367 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-05 03:02:22] INFO PSS_SOFT_CEILING pss=905.1 gl=149.4 views=370 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-05 03:17:41] INFO PSS_SOFT_CEILING pss=912.8 gl=149.4 views=369 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-05 03:33:01] INFO PSS_SOFT_CEILING pss=941.1 gl=154 views=373 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-05 03:48:20] INFO PSS_SOFT_CEILING pss=927.1 gl=153.6 views=379 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-05 04:03:39] INFO PSS_SOFT_CEILING pss=905.7 gl=151.4 views=370 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-05 04:18:58] INFO PSS_SOFT_CEILING pss=917.3 gl=149.4 views=366 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-05 04:34:17] INFO PSS_SOFT_CEILING pss=918.7 gl=149.4 views=370 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-05 04:49:36] INFO PSS_SOFT_CEILING pss=942.5 gl=154 views=385 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-05 05:04:54] INFO PSS_SOFT_CEILING pss=919.5 gl=149.4 views=366 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-05 05:20:13] INFO PSS_SOFT_CEILING pss=915.6 gl=149.4 views=392 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-05 05:35:34] INFO PSS_SOFT_CEILING pss=916.9 gl=149.4 views=369 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-05 05:50:54] INFO PSS_SOFT_CEILING pss=929.2 gl=151.9 views=370 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-05 06:06:13] INFO PSS_SOFT_CEILING pss=931.4 gl=153.6 views=384 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-05 06:21:33] INFO PSS_SOFT_CEILING pss=923 gl=151.4 views=366 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-05 06:36:53] INFO PSS_SOFT_CEILING pss=925.5 gl=149.4 views=371 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-05 06:52:12] INFO PSS_SOFT_CEILING pss=929.2 gl=149.5 views=371 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-05 07:07:31] INFO PSS_SOFT_CEILING pss=949.2 gl=153.8 views=393 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-05 07:22:50] INFO PSS_SOFT_CEILING pss=922.9 gl=149.5 views=367 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-05 07:38:09] INFO PSS_SOFT_CEILING pss=934.5 gl=149.5 views=370 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-05 07:53:28] INFO PSS_SOFT_CEILING pss=938.1 gl=149.5 views=371 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
```

## mem-alerts.log (tail)

```
[2026-07-03 14:27:06] GL +104.2MB views=557 (PSS 159.3MB) ??active hub
[2026-07-03 15:13:18] CRITICAL process not running ??check crash-*.log
[2026-07-03 15:28:20] CRITICAL process not running ??check crash-*.log
[2026-07-03 15:43:21] CRITICAL process not running ??check crash-*.log
[2026-07-03 21:10:34] CRITICAL process not running ??check crash-*.log
[2026-07-03 21:25:34] CRITICAL process not running ??check crash-*.log
[2026-07-03 21:40:34] CRITICAL process not running ??check crash-*.log
[2026-07-03 21:55:33] CRITICAL process not running ??check crash-*.log
[2026-07-03 22:10:33] CRITICAL process not running ??check crash-*.log
[2026-07-03 22:25:33] CRITICAL process not running ??check crash-*.log
[2026-07-03 22:40:33] CRITICAL process not running ??check crash-*.log
[2026-07-03 22:55:33] CRITICAL process not running ??check crash-*.log
[2026-07-03 23:10:33] CRITICAL process not running ??check crash-*.log
[2026-07-03 23:25:34] CRITICAL process not running ??check crash-*.log
[2026-07-04 00:11:19] GL +109.7MB views=557 (PSS 151.3MB) ??active hub
[2026-07-04 08:06:14] PSS +45.7MB GL 35.9MB views=370
[2026-07-04 10:39:30] GL +111MB views=557 (PSS 103.2MB) ??active hub
[2026-07-04 13:28:14] CRITICAL process not running ??check crash-*.log
[2026-07-04 15:15:29] CRITICAL process not running ??check crash-*.log
[2026-07-04 17:33:42] PSS +47.4MB GL 51.2MB views=398
[2026-07-04 20:53:18] PSS +50.3MB GL 24.5MB views=369
[2026-07-04 21:24:14] PSS +40.5MB GL 26.3MB views=385
[2026-07-04 21:39:44] GL +16.1MB views=389 (PSS -11.7MB) ??active hub
[2026-07-05 00:28:50] GL +11.4MB views=322 (PSS 115.5MB) ??active hub
[2026-07-05 00:44:10] GL +97.5MB views=374 (PSS 68.4MB) ??active hub
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

