# Arcfire daily 08:00 KST auto report (mandatory perpetual)

Generated (KST): 2026-07-25 08:00:02
Package: com.arcfire.online

## Runtime

| pid | PSS (MB) | GL (MB) | Views |
|-----|----------|---------|-------|
| 3290 | 825.7 | 40.5 | 349 |

## mem-timeline (since DAILY_8AM_REPORT)

```csv
2026-07-25 00:19:18,3290,835,907.4,55.2,40.7,95.9,440.3,47.4,,378,30.9,0.4,
2026-07-25 00:34:44,3290,819.7,890.6,55,19.8,74.8,442.4,48.2,,353,-15.3,-0.2,
2026-07-25 00:50:12,3290,824.1,896.1,52.9,23.9,76.8,441.7,49.8,,371,4.4,-2.1,
2026-07-25 01:05:39,3290,837.7,909.3,55,19.8,74.8,451.2,56.8,,362,13.6,2.1,
2026-07-25 01:21:06,3290,816.9,888.5,55,19.8,74.8,437.5,53.1,,363,-20.8,0,
2026-07-25 01:36:32,3290,820.9,892.5,57,19.8,76.8,449,47.6,,362,4,2,
2026-07-25 01:51:59,3290,830.3,902.2,55,19.8,74.8,451.1,59.7,,362,9.4,-2,
2026-07-25 02:07:26,3290,836.9,908.9,55.6,40.7,96.2,448.8,51.6,,376,6.6,0.6,
2026-07-25 02:22:52,3290,810.1,881.9,55,19.8,74.8,443.8,52.4,,362,-26.8,-0.6,
2026-07-25 02:38:20,3290,816.9,888.8,55.1,34.3,89.5,439.6,48,,373,6.8,0.1,
2026-07-25 02:53:46,3290,820.3,892.1,55,19.8,74.8,449.8,55.6,,362,3.4,-0.1,
2026-07-25 03:09:13,3290,796.4,867.8,55,19.8,74.8,439.4,43.9,,342,-23.9,0,
2026-07-25 03:24:43,3290,837.5,907.5,47.8,40.7,88.5,461.8,46.5,,313,41.1,-7.2,PSS_SPIKE review=graphics+native
2026-07-25 03:40:15,3290,821.6,860.8,41.5,40.7,82.1,446.8,49.6,,369,-15.9,-6.3,GL_RECOVERED idle_ok
2026-07-25 03:55:46,3290,789.8,829,40.9,19.8,60.7,436.9,44.8,,350,-31.8,-0.6,
2026-07-25 04:11:22,3290,823.7,857.6,41.2,40.7,81.9,444.6,44.6,,373,33.9,0.3,
2026-07-25 04:26:53,3290,804.3,697.4,38.5,19.8,58.3,311,53.6,,350,-19.4,-2.7,
2026-07-25 04:42:27,3290,794.1,682.5,39.8,19.8,59.6,300.4,48.3,,342,-10.2,1.3,
2026-07-25 04:57:55,3290,834.5,722.9,35.7,19.8,55.5,309.2,81.4,,342,40.4,-4.1,PSS_SPIKE review=graphics+native
2026-07-25 05:13:21,3290,826.9,715.2,40.4,40.7,81,306,52.5,,366,-7.6,4.7,
2026-07-25 05:28:48,3290,834.7,717.4,42.1,40.7,82.8,307.8,51.6,,364,7.8,1.7,
2026-07-25 05:44:17,3290,790.7,673.5,36.4,19.8,56.3,295.6,45.4,,350,-44,-5.7,GL_RECOVERED idle_ok
2026-07-25 05:59:42,3290,802.5,685.3,40.5,19.8,60.3,298.9,49.2,,350,11.8,4.1,
2026-07-25 06:15:07,3290,817.1,700.6,40.5,19.8,60.3,311.4,51.6,,356,14.6,0,
2026-07-25 06:30:34,3290,822,705.7,40.5,19.8,60.3,311.3,56.4,,356,4.9,0,
2026-07-25 06:46:01,3290,837.1,721,40.7,34.3,75,301.9,65.3,,375,15.1,0.2,
2026-07-25 07:01:29,3290,840.8,724.7,43.1,40.7,83.8,307.8,54,,369,3.7,2.4,
2026-07-25 07:16:56,3290,835.4,719.3,41.1,40.7,81.8,310.4,47.5,,365,-5.4,-2,
2026-07-25 07:32:23,3290,810.4,694.7,42.5,19.8,62.3,299.6,52.2,,356,-25,1.4,
2026-07-25 07:47:49,3290,820.2,704.5,36.4,19.8,56.3,304.1,62.6,,356,9.8,-6.1,GL_RECOVERED idle_ok
```

## incidents.log (tail)

```
[2026-07-25 01:21:11] PSS_SOFT_CEILING pss=816.9 gl=55 views=363 native_reclaim_advisory
[2026-07-25 01:36:38] PSS_SOFT_CEILING pss=820.9 gl=57 views=362 native_reclaim_advisory
[2026-07-25 01:52:05] PSS_SOFT_CEILING pss=830.3 gl=55 views=362 native_reclaim_advisory
[2026-07-25 02:07:31] PSS_SOFT_CEILING pss=836.9 gl=55.6 views=376 native_reclaim_advisory
[2026-07-25 02:22:58] PSS_SOFT_CEILING pss=810.1 gl=55 views=362 native_reclaim_advisory
[2026-07-25 02:38:25] PSS_SOFT_CEILING pss=816.9 gl=55.1 views=373 native_reclaim_advisory
[2026-07-25 02:53:53] PSS_SOFT_CEILING pss=820.3 gl=55 views=362 native_reclaim_advisory
[2026-07-25 03:09:19] VIEWS_NATIVE_ADVISORY views=342 native_heap=439.4 pss=796.4 gl=55 (node/list retention ??pre-hardceiling early warn)
[2026-07-25 03:24:50] PSS_SOFT_CEILING pss=837.5 gl=47.8 views=313 native_reclaim_advisory
[2026-07-25 03:40:21] PSS_SOFT_CEILING pss=821.6 gl=41.5 views=369 native_reclaim_advisory
[2026-07-25 03:55:53] VIEWS_NATIVE_ADVISORY views=350 native_heap=436.9 pss=789.8 gl=40.9 (node/list retention ??pre-hardceiling early warn)
[2026-07-25 04:11:28] PSS_SOFT_CEILING pss=823.7 gl=41.2 views=373 native_reclaim_advisory
[2026-07-25 04:26:59] PSS_SOFT_CEILING pss=804.3 gl=38.5 views=350 native_reclaim_advisory
[2026-07-25 04:58:01] PSS_SOFT_CEILING pss=834.5 gl=35.7 views=342 native_reclaim_advisory
[2026-07-25 05:13:27] PSS_SOFT_CEILING pss=826.9 gl=40.4 views=366 native_reclaim_advisory
[2026-07-25 05:28:55] PSS_SOFT_CEILING pss=834.7 gl=42.1 views=364 native_reclaim_advisory
[2026-07-25 05:59:48] PSS_SOFT_CEILING pss=802.5 gl=40.5 views=350 native_reclaim_advisory
[2026-07-25 06:15:13] PSS_SOFT_CEILING pss=817.1 gl=40.5 views=356 native_reclaim_advisory
[2026-07-25 06:30:40] PSS_SOFT_CEILING pss=822 gl=40.5 views=356 native_reclaim_advisory
[2026-07-25 06:46:08] PSS_SOFT_CEILING pss=837.1 gl=40.7 views=375 native_reclaim_advisory
[2026-07-25 07:01:34] PSS_SOFT_CEILING pss=840.8 gl=43.1 views=369 native_reclaim_advisory
[2026-07-25 07:17:04] PSS_SOFT_CEILING pss=835.4 gl=41.1 views=365 native_reclaim_advisory
[2026-07-25 07:32:29] PSS_SOFT_CEILING pss=810.4 gl=42.5 views=356 native_reclaim_advisory
[2026-07-25 07:47:55] PSS_SOFT_CEILING pss=820.2 gl=36.4 views=356 native_reclaim_advisory
[2026-07-25 08:00:00] DAILY_8AM_REPORT 2026-07-25 08:00:00 KST
```

## remediation.log (tail)

```
[2026-07-25 01:05:45] INFO PSS_SOFT_CEILING pss=837.7 gl=55 views=362 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-25 01:21:11] INFO PSS_SOFT_CEILING pss=816.9 gl=55 views=363 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-25 01:36:38] INFO PSS_SOFT_CEILING pss=820.9 gl=57 views=362 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-25 01:52:05] INFO PSS_SOFT_CEILING pss=830.3 gl=55 views=362 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-25 02:07:31] INFO PSS_SOFT_CEILING pss=836.9 gl=55.6 views=376 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-25 02:22:58] INFO PSS_SOFT_CEILING pss=810.1 gl=55 views=362 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-25 02:38:25] INFO PSS_SOFT_CEILING pss=816.9 gl=55.1 views=373 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-25 02:53:53] INFO PSS_SOFT_CEILING pss=820.3 gl=55 views=362 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-25 03:09:19] INFO VIEWS_NATIVE_ADVISORY views=342 native_heap=439.4 pss=796.4 gl=55 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-25 03:24:50] INFO PSS_SOFT_CEILING pss=837.5 gl=47.8 views=313 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-25 03:40:21] INFO PSS_SOFT_CEILING pss=821.6 gl=41.5 views=369 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-25 03:55:53] INFO VIEWS_NATIVE_ADVISORY views=350 native_heap=436.9 pss=789.8 gl=40.9 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-25 04:11:28] INFO PSS_SOFT_CEILING pss=823.7 gl=41.2 views=373 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-25 04:26:59] INFO PSS_SOFT_CEILING pss=804.3 gl=38.5 views=350 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-25 04:58:01] INFO PSS_SOFT_CEILING pss=834.5 gl=35.7 views=342 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-25 05:13:27] INFO PSS_SOFT_CEILING pss=826.9 gl=40.4 views=366 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-25 05:28:55] INFO PSS_SOFT_CEILING pss=834.7 gl=42.1 views=364 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-25 05:59:48] INFO PSS_SOFT_CEILING pss=802.5 gl=40.5 views=350 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-25 06:15:13] INFO PSS_SOFT_CEILING pss=817.1 gl=40.5 views=356 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-25 06:30:40] INFO PSS_SOFT_CEILING pss=822 gl=40.5 views=356 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-25 06:46:08] INFO PSS_SOFT_CEILING pss=837.1 gl=40.7 views=375 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-25 07:01:34] INFO PSS_SOFT_CEILING pss=840.8 gl=43.1 views=369 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-25 07:17:04] INFO PSS_SOFT_CEILING pss=835.4 gl=41.1 views=365 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-25 07:32:29] INFO PSS_SOFT_CEILING pss=810.4 gl=42.5 views=356 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-25 07:47:55] INFO PSS_SOFT_CEILING pss=820.2 gl=36.4 views=356 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
```

## mem-alerts.log (tail)

```
[2026-07-21 21:52:45] PSS +54.9MB GL 126.8MB views=553
[2026-07-22 10:13:29] PSS +60.3MB GL 45.7MB views=314
[2026-07-22 10:28:55] GL +10.1MB views=395 (PSS 68.9MB) ??active hub
[2026-07-22 11:46:11] PSS +121.8MB GL 52.3MB views=379
[2026-07-22 12:01:40] GL +91.1MB views=553 (PSS 83.7MB) ??active hub
[2026-07-22 14:36:41] GL +95MB views=553 (PSS 111.1MB) ??active hub
[2026-07-22 16:09:37] CRITICAL process not running ??check crash-*.log
[2026-07-22 18:59:21] PSS +66.6MB GL 44MB views=325
[2026-07-22 20:01:19] GL +8.6MB views=317 (PSS 76.4MB) ??active hub
[2026-07-22 20:32:22] PSS +101.7MB GL 44.6MB views=317
[2026-07-22 22:05:06] GL +103.6MB views=553 (PSS 146MB) ??active hub
[2026-07-22 22:51:40] CRITICAL process not running ??check crash-*.log
[2026-07-22 23:37:32] GL +65.4MB views=553 (PSS 119MB) ??active hub
[2026-07-23 06:50:27] GL +92.9MB views=555 (PSS 121.4MB) ??active hub
[2026-07-23 08:23:25] GL +20.2MB views=555 (PSS 28MB) ??active hub
[2026-07-23 09:09:45] GL +19.1MB views=555 (PSS 47.7MB) ??active hub
[2026-07-23 15:51:09] GL +17.4MB views=390 (PSS 132.2MB) ??active hub
[2026-07-23 20:29:11] GL +66.7MB views=553 (PSS 107.4MB) ??active hub
[2026-07-24 09:36:41] GL +97.8MB views=555 (PSS 113.5MB) ??active hub
[2026-07-24 12:43:22] PSS +140.4MB GL 158.2MB views=578
[2026-07-24 14:31:34] GL +89MB views=571 (PSS 50.9MB) ??active hub
[2026-07-24 17:52:30] GL +29.7MB views=570 (PSS 26.5MB) ??active hub
[2026-07-24 20:11:38] GL +105.1MB views=334 (PSS 170.7MB) ??active hub
[2026-07-25 03:24:43] PSS +41.1MB GL 47.8MB views=313
[2026-07-25 04:57:55] PSS +40.4MB GL 35.7MB views=342
```

## KPI (overnight window)

| Metric | Count |
|--------|-------|
| GL_HARD_CEILING incidents | 41 |
| Crash / PROCESS_DEATH | 95 |
| Auto app relaunch | 41 |

## Action items for Kim Team Lead

1. GL_HARD_CEILING or 3x GL_SPIKE ??P0 hub Skia audit (see overnight-watch handoff).
2. SIGSEGV/FATAL ??arcfire-bug-debug-workflow + logcat tail in latest crash-*.log.
3. Stair-step floor rise without crash ??today's dev P0 list in overnight-watch handoff.

