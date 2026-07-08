# Arcfire daily 08:00 KST auto report (mandatory perpetual)

Generated (KST): 2026-07-08 08:00:02
Package: com.arcfire.online

## Runtime

| pid | PSS (MB) | GL (MB) | Views |
|-----|----------|---------|-------|
| 27487 | 825.7 | 35.2 | 380 |

## mem-timeline (since DAILY_8AM_REPORT)

```csv
2026-07-08 00:33:42,27487,795.7,819.6,34.8,20,54.8,411.1,43.2,,382,-26.8,-11.6,GL_RECOVERED idle_ok
2026-07-08 00:49:03,27487,808,826.4,37,19.8,56.8,407.7,41.6,,380,12.3,2.2,
2026-07-08 01:04:24,27487,820.1,827.6,34.9,19.8,54.8,412.9,42.8,,370,12.1,-2.1,
2026-07-08 01:19:46,27487,808.4,816.5,34.9,19.8,54.8,410.5,35,,376,-11.7,0,
2026-07-08 01:35:06,27487,811.2,819.3,34.9,19.8,54.8,412.4,35.4,,381,2.8,0,
2026-07-08 01:50:26,27487,820.2,827.9,35.5,40.7,76.2,407.8,30.7,,401,9,0.6,
2026-07-08 02:05:46,27487,792.1,782,30.8,19.8,50.7,394.6,33.5,,376,-28.1,-4.7,
2026-07-08 02:21:07,27487,780.9,770.8,30.8,19.8,50.7,386.2,34,,372,-11.2,0,
2026-07-08 02:36:27,27487,801.7,786,39.2,20,59.2,395.5,32.8,,378,20.8,8.4,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-07-08 02:51:47,27487,803.2,787.5,35.3,34.3,69.6,383.9,34.8,,401,1.5,-3.9,
2026-07-08 03:07:06,27487,790.5,774.5,35,19.8,54.9,388.8,34,,379,-12.7,-0.3,
2026-07-08 03:22:27,27487,792.4,776.4,31,19.8,50.8,396.4,32,,383,1.9,-4,
2026-07-08 03:37:48,27487,812.6,796.6,35.7,40.7,76.3,392.1,30.1,,403,20.2,4.7,
2026-07-08 03:53:12,27487,808.6,796.2,35,19.8,54.9,400.3,42.2,,378,-4,-0.7,
2026-07-08 04:08:33,27487,806.9,794.5,37,19.8,56.9,399.8,38.4,,378,-1.7,2,
2026-07-08 04:23:57,27487,792.3,779.9,31,19.8,50.8,389.1,39.9,,379,-14.6,-6,GL_RECOVERED idle_ok
2026-07-08 04:39:17,27487,832.1,819.8,39.3,34.3,73.6,403.2,42.4,,385,39.8,8.3,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-07-08 04:54:37,27487,823.2,810.9,35,19.8,54.9,403.6,51,,383,-8.9,-4.3,
2026-07-08 05:09:57,27487,815.6,803,35.2,19.8,55,392.4,54.5,,378,-7.6,0.2,
2026-07-08 05:25:18,27487,813.4,800.9,35.3,20,55.3,400.7,43,,389,-2.2,0.1,
2026-07-08 05:40:37,27487,805.4,792.8,35.2,19.8,55,393.7,41.7,,382,-8,-0.1,
2026-07-08 05:55:58,27487,821.7,809.2,35.2,19.8,55,399.2,51.9,,386,16.3,0,
2026-07-08 06:11:19,27487,814.6,802.1,33.1,19.8,52.9,407.3,38.4,,383,-7.1,-2.1,
2026-07-08 06:26:40,27487,838.5,825.3,35.8,40.7,76.5,400.1,51.5,,403,23.9,2.7,
2026-07-08 06:42:01,27487,814.5,801.4,35.2,19.8,55,394.3,54,,384,-24,-0.6,
2026-07-08 06:57:23,27487,821.8,808.8,37.2,19.8,57,409,44,,387,7.3,2,
2026-07-08 07:12:43,27487,826.8,813.8,35.2,19.8,55,408,51.6,,388,5,-2,
2026-07-08 07:28:03,27487,851.8,838.8,35.8,40.7,76.5,405.2,57.5,,389,25,0.6,
2026-07-08 07:43:22,27487,821.6,808.6,33.1,19.8,52.9,406.7,48.6,,383,-30.2,-2.7,
2026-07-08 07:58:42,27487,818.6,805.5,35.2,19.8,55,409.8,39.5,,384,-3,2.1,
```

## incidents.log (tail)

```
[2026-07-08 00:49:08] PSS_SOFT_CEILING pss=808 gl=37 views=380 native_reclaim_advisory
[2026-07-08 01:04:31] PSS_SOFT_CEILING pss=820.1 gl=34.9 views=370 native_reclaim_advisory
[2026-07-08 01:19:51] PSS_SOFT_CEILING pss=808.4 gl=34.9 views=376 native_reclaim_advisory
[2026-07-08 01:35:11] PSS_SOFT_CEILING pss=811.2 gl=34.9 views=381 native_reclaim_advisory
[2026-07-08 01:50:31] PSS_SOFT_CEILING pss=820.2 gl=35.5 views=401 native_reclaim_advisory
[2026-07-08 02:36:32] PSS_SOFT_CEILING pss=801.7 gl=39.2 views=378 native_reclaim_advisory
[2026-07-08 02:51:52] PSS_SOFT_CEILING pss=803.2 gl=35.3 views=401 native_reclaim_advisory
[2026-07-08 03:37:53] PSS_SOFT_CEILING pss=812.6 gl=35.7 views=403 native_reclaim_advisory
[2026-07-08 03:53:17] PSS_SOFT_CEILING pss=808.6 gl=35 views=378 native_reclaim_advisory
[2026-07-08 04:08:41] PSS_SOFT_CEILING pss=806.9 gl=37 views=378 native_reclaim_advisory
[2026-07-08 04:39:23] PSS_SOFT_CEILING pss=832.1 gl=39.3 views=385 native_reclaim_advisory
[2026-07-08 04:54:42] PSS_SOFT_CEILING pss=823.2 gl=35 views=383 native_reclaim_advisory
[2026-07-08 05:10:02] PSS_SOFT_CEILING pss=815.6 gl=35.2 views=378 native_reclaim_advisory
[2026-07-08 05:25:22] PSS_SOFT_CEILING pss=813.4 gl=35.3 views=389 native_reclaim_advisory
[2026-07-08 05:40:42] PSS_SOFT_CEILING pss=805.4 gl=35.2 views=382 native_reclaim_advisory
[2026-07-08 05:56:03] PSS_SOFT_CEILING pss=821.7 gl=35.2 views=386 native_reclaim_advisory
[2026-07-08 06:11:25] PSS_SOFT_CEILING pss=814.6 gl=33.1 views=383 native_reclaim_advisory
[2026-07-08 06:26:45] PSS_SOFT_CEILING pss=838.5 gl=35.8 views=403 native_reclaim_advisory
[2026-07-08 06:42:07] PSS_SOFT_CEILING pss=814.5 gl=35.2 views=384 native_reclaim_advisory
[2026-07-08 06:57:27] PSS_SOFT_CEILING pss=821.8 gl=37.2 views=387 native_reclaim_advisory
[2026-07-08 07:12:48] PSS_SOFT_CEILING pss=826.8 gl=35.2 views=388 native_reclaim_advisory
[2026-07-08 07:28:08] PSS_SOFT_CEILING pss=851.8 gl=35.8 views=389 native_reclaim_advisory
[2026-07-08 07:43:27] PSS_SOFT_CEILING pss=821.6 gl=33.1 views=383 native_reclaim_advisory
[2026-07-08 07:58:47] PSS_SOFT_CEILING pss=818.6 gl=35.2 views=384 native_reclaim_advisory
[2026-07-08 08:00:00] DAILY_8AM_REPORT 2026-07-08 08:00:00 KST
```

## remediation.log (tail)

```
[2026-07-08 00:18:27] INFO PSS_SOFT_CEILING pss=822.5 gl=46.4 views=395 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-08 00:49:08] INFO PSS_SOFT_CEILING pss=808 gl=37 views=380 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-08 01:04:31] INFO PSS_SOFT_CEILING pss=820.1 gl=34.9 views=370 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-08 01:19:51] INFO PSS_SOFT_CEILING pss=808.4 gl=34.9 views=376 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-08 01:35:11] INFO PSS_SOFT_CEILING pss=811.2 gl=34.9 views=381 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-08 01:50:31] INFO PSS_SOFT_CEILING pss=820.2 gl=35.5 views=401 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-08 02:36:32] INFO PSS_SOFT_CEILING pss=801.7 gl=39.2 views=378 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-08 02:51:52] INFO PSS_SOFT_CEILING pss=803.2 gl=35.3 views=401 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-08 03:37:53] INFO PSS_SOFT_CEILING pss=812.6 gl=35.7 views=403 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-08 03:53:17] INFO PSS_SOFT_CEILING pss=808.6 gl=35 views=378 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-08 04:08:41] INFO PSS_SOFT_CEILING pss=806.9 gl=37 views=378 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-08 04:39:23] INFO PSS_SOFT_CEILING pss=832.1 gl=39.3 views=385 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-08 04:54:42] INFO PSS_SOFT_CEILING pss=823.2 gl=35 views=383 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-08 05:10:02] INFO PSS_SOFT_CEILING pss=815.6 gl=35.2 views=378 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-08 05:25:22] INFO PSS_SOFT_CEILING pss=813.4 gl=35.3 views=389 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-08 05:40:42] INFO PSS_SOFT_CEILING pss=805.4 gl=35.2 views=382 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-08 05:56:03] INFO PSS_SOFT_CEILING pss=821.7 gl=35.2 views=386 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-08 06:11:25] INFO PSS_SOFT_CEILING pss=814.6 gl=33.1 views=383 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-08 06:26:45] INFO PSS_SOFT_CEILING pss=838.5 gl=35.8 views=403 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-08 06:42:07] INFO PSS_SOFT_CEILING pss=814.5 gl=35.2 views=384 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-08 06:57:27] INFO PSS_SOFT_CEILING pss=821.8 gl=37.2 views=387 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-08 07:12:48] INFO PSS_SOFT_CEILING pss=826.8 gl=35.2 views=388 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-08 07:28:08] INFO PSS_SOFT_CEILING pss=851.8 gl=35.8 views=389 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-08 07:43:27] INFO PSS_SOFT_CEILING pss=821.6 gl=33.1 views=383 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-08 07:58:47] INFO PSS_SOFT_CEILING pss=818.6 gl=35.2 views=384 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
```

## mem-alerts.log (tail)

```
[2026-07-05 17:39:18] PSS +84MB GL 48.8MB views=296
[2026-07-05 18:25:27] GL +103.9MB views=559 (PSS 168.3MB) ??active hub
[2026-07-05 19:58:29] PSS +50MB GL 125MB views=378
[2026-07-05 21:15:34] GL +9.8MB views=370 (PSS -35.3MB) ??active hub
[2026-07-05 21:30:56] GL +113.2MB views=388 (PSS 157.2MB) ??active hub
[2026-07-05 22:01:52] PSS +220.6MB GL 117.4MB views=99
[2026-07-05 23:03:30] GL +10.5MB views=362 (PSS 46.7MB) ??active hub
[2026-07-06 00:20:15] GL +12.1MB views=379 (PSS 10.5MB) ??active hub
[2026-07-06 01:21:51] GL +110.3MB views=334 (PSS 284.1MB) ??active hub
[2026-07-06 03:24:44] GL +73.8MB views=558 (PSS 87.7MB) ??active hub
[2026-07-06 23:54:32] PSS +40.4MB GL 49.9MB views=399
[2026-07-07 00:40:46] GL +16.3MB views=353 (PSS 14.9MB) ??active hub
[2026-07-07 10:09:43] PSS +92.9MB GL 36.4MB views=349
[2026-07-07 11:42:02] GL +107.5MB views=558 (PSS 157MB) ??active hub
[2026-07-07 13:30:34] GL +105.1MB views=558 (PSS 160.3MB) ??active hub
[2026-07-07 14:31:57] GL +10.1MB views=377 (PSS 9.6MB) ??active hub
[2026-07-07 15:02:45] GL +10.7MB views=378 (PSS 34.3MB) ??active hub
[2026-07-07 17:52:05] GL +107.7MB views=559 (PSS 200.1MB) ??active hub
[2026-07-07 21:12:25] PSS +60.6MB GL 113.1MB views=383
[2026-07-07 21:43:16] PSS +274.2MB GL 110.4MB views=464
[2026-07-07 22:45:44] GL +21.5MB views=347 (PSS 32.5MB) ??active hub
[2026-07-07 23:16:40] PSS +184.4MB GL 26.4MB views=350
[2026-07-07 23:32:04] GL +20.4MB views=368 (PSS 52.8MB) ??active hub
[2026-07-08 02:36:27] GL +8.4MB views=378 (PSS 20.8MB) ??active hub
[2026-07-08 04:39:17] GL +8.3MB views=385 (PSS 39.8MB) ??active hub
```

## KPI (overnight window)

| Metric | Count |
|--------|-------|
| GL_HARD_CEILING incidents | 29 |
| Crash / PROCESS_DEATH | 95 |
| Auto app relaunch | 29 |

## Action items for Kim Team Lead

1. GL_HARD_CEILING or 3x GL_SPIKE ??P0 hub Skia audit (see overnight-watch handoff).
2. SIGSEGV/FATAL ??arcfire-bug-debug-workflow + logcat tail in latest crash-*.log.
3. Stair-step floor rise without crash ??today's dev P0 list in overnight-watch handoff.

