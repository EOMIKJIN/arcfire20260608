# Arcfire daily 08:00 KST auto report (mandatory perpetual)

Generated (KST): 2026-07-24 08:00:02
Package: com.arcfire.online

## Runtime

| pid | PSS (MB) | GL (MB) | Views |
|-----|----------|---------|-------|
| 18955 | 726.8 | 28.2 | 351 |

## mem-timeline (since DAILY_8AM_REPORT)

```csv
2026-07-24 00:21:00,18955,688.7,637.2,31,19.8,50.8,282.7,31.9,,370,-8.9,0,
2026-07-24 00:36:26,18955,699,647.6,31,19.8,50.8,283,41.7,,374,10.3,0,
2026-07-24 00:51:52,18955,697.5,649.9,31,19.8,50.8,287.1,40.1,,374,-1.5,0,
2026-07-24 01:07:19,18955,694.9,647,31,19.8,50.8,284.4,39.2,,374,-2.6,0,
2026-07-24 01:22:44,18955,719.2,671.7,31,19.8,50.8,293.7,54.6,,374,24.3,0,
2026-07-24 01:38:09,18955,721.8,674.4,31,19.8,50.8,294.9,54.9,,374,2.6,0,
2026-07-24 01:53:37,18955,705.3,657.8,34,19.8,53.9,294.7,34.7,,370,-16.5,3,
2026-07-24 02:09:03,18955,702.9,655.5,32.1,19.8,52,293.8,34.6,,366,-2.4,-1.9,
2026-07-24 02:24:28,18955,702.5,655.6,32.1,19.8,52,293.1,43.5,,370,-0.4,0,
2026-07-24 02:39:54,18955,689,641,32.1,19.8,52,289.6,34.6,,370,-13.5,0,
2026-07-24 02:55:19,18955,709.1,661.1,34.4,34.3,68.7,293.3,34,,383,20.1,2.3,
2026-07-24 03:10:45,18955,710.7,662.8,34.1,19.8,54,305.2,37.7,,363,1.6,-0.3,
2026-07-24 03:26:12,18955,696,647,30.1,19.8,49.9,291.6,39,,367,-14.7,-4,
2026-07-24 03:41:39,18955,699.1,650,32.1,19.8,52,293.2,37.6,,367,3.1,2,
2026-07-24 03:57:07,18955,698.4,649.3,32.1,19.8,52,294.8,34.5,,371,-0.7,0,
2026-07-24 04:12:33,18955,696.5,647.3,32.1,19.8,52,293.9,33.2,,367,-1.9,0,
2026-07-24 04:27:58,18955,701.7,648.8,34.1,19.8,54,292.5,33.7,,367,5.2,2,
2026-07-24 04:43:24,18955,711.9,659,34.1,19.8,54,296.1,39.5,,367,10.2,0,
2026-07-24 04:58:51,18955,712.5,663.3,32.1,19.8,52,302.9,38.5,,367,0.6,-2,
2026-07-24 05:14:17,18955,724.1,674,34.1,20,54.1,306.9,42.8,,371,11.6,2,
2026-07-24 05:29:43,18955,729.1,679.9,32.8,40.7,73.4,296.3,39,,370,5,-1.3,
2026-07-24 05:45:09,18955,730.8,681.4,32.4,34.3,66.7,300,42.8,,392,1.7,-0.4,
2026-07-24 06:00:34,18955,705.9,656.5,32.1,19.8,52,295.5,36.7,,358,-24.9,-0.3,
2026-07-24 06:16:01,18955,718.8,669.4,32.1,19.8,52,302.1,42.7,,358,12.9,0,
2026-07-24 06:31:28,18955,739.9,690.5,34.9,40.7,75.6,305,33.8,,375,21.1,2.8,
2026-07-24 06:46:55,18955,720.2,670.8,34.3,19.8,54.1,302.1,38.3,,351,-19.7,-0.6,
2026-07-24 07:02:21,18955,716.3,667.1,34.3,19.8,54.1,300.2,36.3,,358,-3.9,0,
2026-07-24 07:17:47,18955,720.4,671.1,32.3,19.8,52.1,306.1,36,,358,4.1,-2,
2026-07-24 07:33:12,18955,713.3,663.7,32.3,19.8,52.1,299.8,34.9,,356,-7.1,0,
2026-07-24 07:48:39,18955,713.7,664,32.3,19.8,52.1,298.6,36.3,,358,0.4,0,
```

## incidents.log (tail)

```
[2026-07-23 14:34:03] VIEWS_NATIVE_ADVISORY views=554 native_heap=162.6 pss=681.6 gl=109.9 (node/list retention ??pre-hardceiling early warn)
[2026-07-23 14:49:29] VIEWS_NATIVE_ADVISORY views=554 native_heap=163.8 pss=680.4 gl=107.8 (node/list retention ??pre-hardceiling early warn)
[2026-07-23 15:04:56] VIEWS_NATIVE_ADVISORY views=554 native_heap=164.6 pss=677.7 gl=107.8 (node/list retention ??pre-hardceiling early warn)
[2026-07-23 15:20:22] VIEWS_NATIVE_ADVISORY views=554 native_heap=164.5 pss=675 gl=107.8 (node/list retention ??pre-hardceiling early warn)
[2026-07-23 15:35:48] VIEWS_NATIVE_ADVISORY views=554 native_heap=164.9 pss=676.6 gl=107.8 (node/list retention ??pre-hardceiling early warn)
[2026-07-23 15:51:15] PSS_SOFT_CEILING pss=808.8 gl=125.2 views=390 native_reclaim_advisory
[2026-07-23 16:06:42] GL_ELEVATED mounting_or_insufficient_samples gl=124.9 pss=763.3 views=369 restart_held
[2026-07-23 16:22:08] GL_ELEVATED mounting_or_insufficient_samples gl=125.1 pss=785 views=386 restart_held
[2026-07-23 16:37:35] GL_ELEVATED mounting_or_insufficient_samples gl=124.9 pss=771.3 views=369 restart_held
[2026-07-23 16:53:01] GL_ELEVATED mounting_or_insufficient_samples gl=125.1 pss=776.1 views=390 restart_held
[2026-07-23 17:08:28] GL_ELEVATED mounting_or_insufficient_samples gl=124.9 pss=751.6 views=369 restart_held
[2026-07-23 17:23:55] GL_ELEVATED mounting_or_insufficient_samples gl=124.9 pss=746.8 views=371 restart_held
[2026-07-23 17:39:21] GL_ELEVATED mounting_or_insufficient_samples gl=125.2 pss=767.3 views=398 restart_held
[2026-07-23 17:54:47] GL_ELEVATED mounting_or_insufficient_samples gl=125.1 pss=743.7 views=373 restart_held
[2026-07-23 18:10:15] GL_ELEVATED mounting_or_insufficient_samples gl=125.4 pss=756.5 views=375 restart_held
[2026-07-23 18:25:40] GL_ELEVATED mounting_or_insufficient_samples gl=125.8 pss=771.3 views=391 restart_held
[2026-07-23 18:41:06] GL_ELEVATED mounting_or_insufficient_samples gl=125.2 pss=749.1 views=366 restart_held
[2026-07-23 18:56:32] GL_ELEVATED mounting_or_insufficient_samples gl=125.2 pss=743.8 views=370 restart_held
[2026-07-23 19:11:59] GL_ELEVATED mounting_or_insufficient_samples gl=125.2 pss=750.6 views=370 restart_held
[2026-07-23 19:27:26] GL_ELEVATED mounting_or_insufficient_samples gl=127.2 pss=752.3 views=391 restart_held
[2026-07-23 19:42:52] GL_ELEVATED mounting_or_insufficient_samples gl=127.4 pss=766.7 views=379 restart_held
[2026-07-23 19:58:21] GL_ELEVATED mounting_or_insufficient_samples gl=125.2 pss=749.1 views=370 restart_held
[2026-07-23 20:13:48] GL_ELEVATED mounting_or_insufficient_samples gl=127.2 pss=757.8 views=370 restart_held
[2026-07-23 20:29:16] PSS_SOFT_CEILING pss=865.2 gl=193.9 views=553 native_reclaim_advisory
[2026-07-24 08:00:00] DAILY_8AM_REPORT 2026-07-24 08:00:00 KST
```

## remediation.log (tail)

```
[2026-07-23 14:18:37] INFO VIEWS_NATIVE_ADVISORY views=554 native_heap=188.3 pss=676.9 gl=107.8 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-23 14:34:03] INFO VIEWS_NATIVE_ADVISORY views=554 native_heap=162.6 pss=681.6 gl=109.9 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-23 14:49:29] INFO VIEWS_NATIVE_ADVISORY views=554 native_heap=163.8 pss=680.4 gl=107.8 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-23 15:04:56] INFO VIEWS_NATIVE_ADVISORY views=554 native_heap=164.6 pss=677.7 gl=107.8 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-23 15:20:22] INFO VIEWS_NATIVE_ADVISORY views=554 native_heap=164.5 pss=675 gl=107.8 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-23 15:35:48] INFO VIEWS_NATIVE_ADVISORY views=554 native_heap=164.9 pss=676.6 gl=107.8 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-23 15:51:15] INFO PSS_SOFT_CEILING pss=808.8 gl=125.2 views=390 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-23 16:06:42] INFO GL_ELEVATED mounting_or_insufficient_samples gl=124.9 pss=763.3 views=369 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-07-23 16:22:08] INFO GL_ELEVATED mounting_or_insufficient_samples gl=125.1 pss=785 views=386 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-07-23 16:37:35] INFO GL_ELEVATED mounting_or_insufficient_samples gl=124.9 pss=771.3 views=369 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-07-23 16:53:01] INFO GL_ELEVATED mounting_or_insufficient_samples gl=125.1 pss=776.1 views=390 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-07-23 17:08:28] INFO GL_ELEVATED mounting_or_insufficient_samples gl=124.9 pss=751.6 views=369 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-07-23 17:23:55] INFO GL_ELEVATED mounting_or_insufficient_samples gl=124.9 pss=746.8 views=371 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-07-23 17:39:21] INFO GL_ELEVATED mounting_or_insufficient_samples gl=125.2 pss=767.3 views=398 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-07-23 17:54:47] INFO GL_ELEVATED mounting_or_insufficient_samples gl=125.1 pss=743.7 views=373 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-07-23 18:10:15] INFO GL_ELEVATED mounting_or_insufficient_samples gl=125.4 pss=756.5 views=375 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-07-23 18:25:40] INFO GL_ELEVATED mounting_or_insufficient_samples gl=125.8 pss=771.3 views=391 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-07-23 18:41:06] INFO GL_ELEVATED mounting_or_insufficient_samples gl=125.2 pss=749.1 views=366 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-07-23 18:56:32] INFO GL_ELEVATED mounting_or_insufficient_samples gl=125.2 pss=743.8 views=370 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-07-23 19:11:59] INFO GL_ELEVATED mounting_or_insufficient_samples gl=125.2 pss=750.6 views=370 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-07-23 19:27:26] INFO GL_ELEVATED mounting_or_insufficient_samples gl=127.2 pss=752.3 views=391 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-07-23 19:42:52] INFO GL_ELEVATED mounting_or_insufficient_samples gl=127.4 pss=766.7 views=379 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-07-23 19:58:21] INFO GL_ELEVATED mounting_or_insufficient_samples gl=125.2 pss=749.1 views=370 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-07-23 20:13:48] INFO GL_ELEVATED mounting_or_insufficient_samples gl=127.2 pss=757.8 views=370 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-07-23 20:29:16] INFO PSS_SOFT_CEILING pss=865.2 gl=193.9 views=553 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
```

## mem-alerts.log (tail)

```
[2026-07-21 07:42:59] GL +104.5MB views=561 (PSS 120.2MB) ??active hub
[2026-07-21 07:58:28] PSS +86.2MB GL 152.9MB views=559
[2026-07-21 08:29:24] PSS +79.7MB GL 142MB views=559
[2026-07-21 11:19:43] GL +106.5MB views=559 (PSS 140MB) ??active hub
[2026-07-21 15:57:39] GL +94.6MB views=559 (PSS 78.3MB) ??active hub
[2026-07-21 18:47:29] GL +90.5MB views=554 (PSS 116.5MB) ??active hub
[2026-07-21 19:49:14] PSS +43.4MB GL 16.2MB views=99
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
```

## KPI (overnight window)

| Metric | Count |
|--------|-------|
| GL_HARD_CEILING incidents | 40 |
| Crash / PROCESS_DEATH | 95 |
| Auto app relaunch | 40 |

## Action items for Kim Team Lead

1. GL_HARD_CEILING or 3x GL_SPIKE ??P0 hub Skia audit (see overnight-watch handoff).
2. SIGSEGV/FATAL ??arcfire-bug-debug-workflow + logcat tail in latest crash-*.log.
3. Stair-step floor rise without crash ??today's dev P0 list in overnight-watch handoff.

