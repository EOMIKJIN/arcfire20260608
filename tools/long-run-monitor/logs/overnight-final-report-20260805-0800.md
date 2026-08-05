# Arcfire daily 08:00 KST auto report (mandatory perpetual)

Generated (KST): 2026-08-05 08:00:03
Package: com.arcfire.online

## Runtime

| pid | PSS (MB) | GL (MB) | Views |
|-----|----------|---------|-------|
| 24475 | 672.6 | 47 | 373 |

## mem-timeline (since DAILY_8AM_REPORT)

```csv
2026-08-05 00:24:24,24475,777.8,908.4,155.9,19.8,175.7,325.3,45.9,,581,,,
2026-08-05 00:39:57,24475,687.5,823.7,34.3,19.8,54.1,349,42.7,,354,,,
2026-08-05 00:55:24,24475,723.6,862.1,34.6,34.3,68.9,359.5,44.9,,382,36.1,0.3,
2026-08-05 01:10:51,24475,716.8,855.5,32.3,19.8,52.1,358.7,46.6,,361,-6.8,-2.3,
2026-08-05 01:26:16,24475,759.1,897.4,36.5,19.8,56.3,367.2,70.4,,362,42.3,4.2,PSS_SPIKE review=graphics+native
2026-08-05 01:41:42,24475,733.8,872.2,34.5,19.8,54.3,356.7,57.1,,362,-25.3,-2,
2026-08-05 01:57:09,24475,725.9,864.3,34.5,19.8,54.3,355.9,52,,362,-7.9,0,
2026-08-05 02:12:35,24475,722.1,860.5,34.5,19.8,54.3,362.7,41,,355,-3.8,0,
2026-08-05 02:28:02,24475,712.3,854.3,34.5,19.8,54.3,368.8,36.7,,362,-9.8,0,
2026-08-05 02:43:30,24475,716.9,859.2,34.7,34.3,69,359.7,39.5,,375,4.6,0.2,
2026-08-05 02:58:57,24475,700.1,842.4,34.5,19.8,54.3,357.2,39.2,,362,-16.8,-0.2,
2026-08-05 03:14:23,24475,704.7,847,34.5,19.8,54.3,360.1,43.6,,373,4.6,0,
2026-08-05 03:29:50,24475,703.4,846.5,34.5,19.8,54.3,358.2,45.3,,371,-1.3,0,
2026-08-05 03:45:16,24475,722.1,862.3,34.5,19.8,54.3,370.7,47.7,,371,18.7,0,
2026-08-05 04:00:43,24475,721.5,861.7,34.7,34.3,69,360.3,42.5,,386,-0.6,0.2,
2026-08-05 04:16:10,24475,714.7,855,34.5,19.8,54.3,372.1,38.3,,367,-6.8,-0.2,
2026-08-05 04:31:37,24475,720.4,860.8,34.5,19.8,54.3,374.9,40.6,,375,5.7,0,
2026-08-05 04:47:04,24475,705.1,845.6,32.4,19.8,52.2,362.6,39.2,,369,-15.3,-2.1,
2026-08-05 05:02:31,24475,712.2,852.8,36.5,19.8,56.3,365.5,38.9,,367,7.1,4.1,
2026-08-05 05:17:58,24475,713,853.6,34.5,19.8,54.3,362,44.9,,371,0.8,-2,
2026-08-05 05:33:21,24475,751.8,892.4,34.5,19.8,54.3,375.2,68.3,,374,38.8,0,
2026-08-05 05:48:48,24475,742.7,883.4,34.7,34.3,69,366.4,53.1,,386,-9.1,0.2,
2026-08-05 06:04:15,24475,743.4,884.1,34.5,19.8,54.3,376.8,57.9,,370,0.7,-0.2,
2026-08-05 06:19:42,24475,756.7,899.3,36.8,34.3,71.1,371.8,60.4,,395,13.3,2.3,
2026-08-05 06:35:09,24475,739.6,882,34.5,19.8,54.3,371.1,60.1,,374,-17.1,-2.3,
2026-08-05 06:50:36,24475,738.8,881.2,34.8,28,62.8,372.5,48.5,,375,-0.8,0.3,
2026-08-05 07:06:07,24475,723.6,866.1,34.5,19.8,54.3,373.3,40.8,,374,-15.2,-0.3,
2026-08-05 07:21:35,24475,666.2,516.2,38.1,40.7,78.8,128.7,37.4,,381,-57.4,3.6,
2026-08-05 07:37:01,24475,679.2,627.2,51,19.8,70.8,226.6,40.4,,377,13,12.9,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-08-05 07:52:28,24475,690.3,638.4,51.3,34.3,85.6,230.2,33.1,,392,11.1,0.3,
```

## incidents.log (tail)

```
[2026-08-04 18:28:58] PSS_SOFT_CEILING pss=857 gl=53.6 views=369 native_reclaim_advisory
[2026-08-04 18:44:25] PSS_SOFT_CEILING pss=855.3 gl=53.6 views=367 native_reclaim_advisory
[2026-08-04 18:59:52] PSS_SOFT_CEILING pss=868 gl=49.5 views=367 native_reclaim_advisory
[2026-08-04 19:15:19] PSS_SOFT_CEILING pss=873.3 gl=54.2 views=375 native_reclaim_advisory
[2026-08-04 19:30:45] PSS_SOFT_CEILING pss=857.7 gl=53.6 views=367 native_reclaim_advisory
[2026-08-04 19:46:10] PSS_SOFT_CEILING pss=858.4 gl=49.7 views=367 native_reclaim_advisory
[2026-08-04 20:01:37] PSS_SOFT_CEILING pss=850 gl=49.7 views=365 native_reclaim_advisory
[2026-08-04 20:17:04] PSS_SOFT_CEILING pss=827.1 gl=53.7 views=367 native_reclaim_advisory
[2026-08-04 20:32:31] PSS_SOFT_CEILING pss=824.9 gl=53.7 views=367 native_reclaim_advisory
[2026-08-04 20:47:58] PSS_SOFT_CEILING pss=822.4 gl=53.7 views=360 native_reclaim_advisory
[2026-08-04 21:03:24] PSS_SOFT_CEILING pss=839.2 gl=54.1 views=380 native_reclaim_advisory
[2026-08-04 21:18:50] PSS_SOFT_CEILING pss=817.4 gl=53.9 views=361 native_reclaim_advisory
[2026-08-04 21:34:16] PSS_SOFT_CEILING pss=822.6 gl=53.9 views=361 native_reclaim_advisory
[2026-08-04 21:49:44] PSS_SOFT_CEILING pss=826.3 gl=53.9 views=361 native_reclaim_advisory
[2026-08-04 22:05:11] PSS_SOFT_CEILING pss=827.1 gl=49.8 views=361 native_reclaim_advisory
[2026-08-04 22:20:45] PSS_SOFT_CEILING pss=936.3 gl=128.3 views=576 native_reclaim_advisory
[2026-08-04 22:36:12] PSS_SOFT_CEILING pss=927.9 gl=128.3 views=576 native_reclaim_advisory
[2026-08-04 22:51:39] PSS_SOFT_CEILING pss=939.2 gl=128.3 views=576 native_reclaim_advisory
[2026-08-04 23:07:05] PSS_SOFT_CEILING pss=934.5 gl=128.3 views=576 native_reclaim_advisory
[2026-08-04 23:22:31] PSS_SOFT_CEILING pss=940.5 gl=112.1 views=581 native_reclaim_advisory
[2026-08-04 23:38:00] PSS_SOFT_CEILING pss=934.4 gl=112.1 views=581 native_reclaim_advisory
[2026-08-04 23:53:28] PSS_SOFT_CEILING pss=933.9 gl=112.1 views=602 native_reclaim_advisory
[2026-08-05 00:09:00] PSS_SOFT_CEILING pss=928.7 gl=112.3 views=581 native_reclaim_advisory
[2026-08-05 00:24:31] VIEWS_NATIVE_ADVISORY views=581 native_heap=325.3 pss=777.8 gl=155.9 (node/list retention ??pre-hardceiling early warn)
[2026-08-05 08:00:00] DAILY_8AM_REPORT 2026-08-05 08:00:00 KST
```

## remediation.log (tail)

```
[2026-08-04 18:13:33] INFO PSS_SOFT_CEILING pss=862.6 gl=53.6 views=367 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-04 18:28:58] INFO PSS_SOFT_CEILING pss=857 gl=53.6 views=369 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-04 18:44:25] INFO PSS_SOFT_CEILING pss=855.3 gl=53.6 views=367 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-04 18:59:52] INFO PSS_SOFT_CEILING pss=868 gl=49.5 views=367 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-04 19:15:19] INFO PSS_SOFT_CEILING pss=873.3 gl=54.2 views=375 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-04 19:30:45] INFO PSS_SOFT_CEILING pss=857.7 gl=53.6 views=367 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-04 19:46:10] INFO PSS_SOFT_CEILING pss=858.4 gl=49.7 views=367 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-04 20:01:37] INFO PSS_SOFT_CEILING pss=850 gl=49.7 views=365 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-04 20:17:04] INFO PSS_SOFT_CEILING pss=827.1 gl=53.7 views=367 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-04 20:32:31] INFO PSS_SOFT_CEILING pss=824.9 gl=53.7 views=367 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-04 20:47:58] INFO PSS_SOFT_CEILING pss=822.4 gl=53.7 views=360 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-04 21:03:24] INFO PSS_SOFT_CEILING pss=839.2 gl=54.1 views=380 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-04 21:18:50] INFO PSS_SOFT_CEILING pss=817.4 gl=53.9 views=361 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-04 21:34:16] INFO PSS_SOFT_CEILING pss=822.6 gl=53.9 views=361 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-04 21:49:44] INFO PSS_SOFT_CEILING pss=826.3 gl=53.9 views=361 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-04 22:05:11] INFO PSS_SOFT_CEILING pss=827.1 gl=49.8 views=361 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-04 22:20:45] INFO PSS_SOFT_CEILING pss=936.3 gl=128.3 views=576 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-04 22:36:12] INFO PSS_SOFT_CEILING pss=927.9 gl=128.3 views=576 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-04 22:51:39] INFO PSS_SOFT_CEILING pss=939.2 gl=128.3 views=576 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-04 23:07:05] INFO PSS_SOFT_CEILING pss=934.5 gl=128.3 views=576 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-04 23:22:31] INFO PSS_SOFT_CEILING pss=940.5 gl=112.1 views=581 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-04 23:38:00] INFO PSS_SOFT_CEILING pss=934.4 gl=112.1 views=581 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-04 23:53:28] INFO PSS_SOFT_CEILING pss=933.9 gl=112.1 views=602 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-05 00:09:00] INFO PSS_SOFT_CEILING pss=928.7 gl=112.3 views=581 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-05 00:24:31] INFO VIEWS_NATIVE_ADVISORY views=581 native_heap=325.3 pss=777.8 gl=155.9 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
```

## mem-alerts.log (tail)

```
[2026-08-02 01:18:53] GL +14.4MB views=575 (PSS 51.7MB) ??active hub
[2026-08-02 10:04:10] GL +14.6MB views=578 (PSS 19.2MB) ??active hub
[2026-08-02 13:25:06] CRITICAL process not running ??check crash-*.log
[2026-08-02 13:40:06] CRITICAL process not running ??check crash-*.log
[2026-08-02 14:56:59] GL +102.5MB views=579 (PSS 90.6MB) ??active hub
[2026-08-02 17:00:32] GL +96.9MB views=577 (PSS 129.9MB) ??active hub
[2026-08-02 18:17:59] GL +18.4MB views=581 (PSS 81.6MB) ??active hub
[2026-08-03 08:11:54] GL +99.4MB views=579 (PSS 56.5MB) ??active hub
[2026-08-03 09:13:47] PSS +137.8MB GL 130.2MB views=578
[2026-08-03 15:09:20] GL +9.1MB views=739 (PSS 20.3MB) ??active hub
[2026-08-03 15:24:53] GL +19.4MB views=578 (PSS 4.9MB) ??active hub
[2026-08-03 15:55:59] PSS +222.3MB GL 113.1MB views=581
[2026-08-03 16:58:47] PSS +301.1MB GL 36.8MB views=410
[2026-08-03 23:41:22] GL +94.8MB views=580 (PSS 142.4MB) ??active hub
[2026-08-04 06:53:33] GL +8.2MB views=596 (PSS 20.7MB) ??active hub
[2026-08-04 07:09:06] CRITICAL process not running ??check crash-*.log
[2026-08-04 07:55:16] PSS +239.7MB GL 9.5MB views=99
[2026-08-04 08:41:51] CRITICAL process not running ??check crash-*.log
[2026-08-04 09:43:24] PSS +48.9MB GL 28.3MB views=371
[2026-08-04 10:29:47] GL +130.4MB views=579 (PSS 156.3MB) ??active hub
[2026-08-04 15:23:17] GL +92.9MB views=577 (PSS 129.6MB) ??active hub
[2026-08-04 17:27:09] GL +10.6MB views=369 (PSS 102MB) ??active hub
[2026-08-04 22:20:40] GL +78.5MB views=576 (PSS 109.2MB) ??active hub
[2026-08-05 01:26:16] PSS +42.3MB GL 36.5MB views=362
[2026-08-05 07:37:01] GL +12.9MB views=377 (PSS 13MB) ??active hub
```

## KPI (overnight window)

| Metric | Count |
|--------|-------|
| GL_HARD_CEILING incidents | 46 |
| Crash / PROCESS_DEATH | 95 |
| Auto app relaunch | 47 |

## Action items for Kim Team Lead

1. GL_HARD_CEILING or 3x GL_SPIKE ??P0 hub Skia audit (see overnight-watch handoff).
2. SIGSEGV/FATAL ??arcfire-bug-debug-workflow + logcat tail in latest crash-*.log.
3. Stair-step floor rise without crash ??today's dev P0 list in overnight-watch handoff.

