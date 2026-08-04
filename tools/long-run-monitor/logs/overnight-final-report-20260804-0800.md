# Arcfire daily 08:00 KST auto report (mandatory perpetual)

Generated (KST): 2026-08-04 08:00:03
Package: com.arcfire.online

## Runtime

| pid | PSS (MB) | GL (MB) | Views |
|-----|----------|---------|-------|
| 16033 | 721.9 | 9.5 | 99 |

## mem-timeline (since DAILY_8AM_REPORT)

```csv
2026-08-04 00:27:41,23589,824.5,963.9,115.7,19.8,135.5,390.2,49.4,,580,-3.2,0,
2026-08-04 00:43:08,23589,824.5,963.6,117.7,19.8,137.5,385.5,44.5,,580,0,2,
2026-08-04 00:58:34,23589,823.5,962,117.7,19.8,137.5,386.3,41.4,,581,-1,0,
2026-08-04 01:14:00,23589,827.4,966.1,115.7,19.8,135.5,387,46.3,,581,3.9,-2,
2026-08-04 01:29:27,23589,828.6,967.2,115.7,19.8,135.5,386.2,48.4,,602,1.2,0,
2026-08-04 01:44:55,23589,860.9,999.5,115.7,19.8,135.5,411.6,55.6,,581,32.3,0,
2026-08-04 02:00:23,23589,852,990.5,115.7,19.8,135.5,385.1,77.9,,581,-8.9,0,
2026-08-04 02:15:51,23589,819,955.9,115.7,19.8,135.5,386.8,43.9,,578,-33,0,
2026-08-04 02:31:16,23589,809.8,946.8,115.7,19.8,135.5,385.2,36.3,,578,-9.2,0,
2026-08-04 02:46:43,23589,815,952,115.7,19.8,135.5,386.5,40.1,,578,5.2,0,
2026-08-04 03:02:07,23589,817.2,954.3,115.7,19.8,135.5,387.6,41.4,,578,2.2,0,
2026-08-04 03:17:32,23589,821.7,958.9,115.7,19.8,135.5,387.9,45.8,,578,4.5,0,
2026-08-04 03:32:57,23589,814.1,951.3,115.7,19.8,135.5,386.9,39.3,,578,-7.6,0,
2026-08-04 03:48:25,23589,825,961.5,115.7,19.8,135.5,386.7,49.3,,578,10.9,0,
2026-08-04 04:03:49,23589,816.7,953.5,115.7,19.8,135.5,391.2,37.6,,578,-8.3,0,
2026-08-04 04:19:15,23589,709.5,563.6,115.6,19.8,135.5,164.6,38.1,,578,-107.2,-0.1,
2026-08-04 04:34:41,23589,708.8,563.6,115.6,19.8,135.5,165.8,37.8,,578,-0.7,0,
2026-08-04 04:50:07,23589,704.3,560.2,115.6,19.8,135.5,165,35,,578,-4.5,0,
2026-08-04 05:05:33,23589,706.9,565.7,115.6,19.8,135.5,166.1,36.3,,578,2.6,0,
2026-08-04 05:20:59,23589,706.4,567.9,115.6,19.8,135.5,167.1,36.9,,578,-0.5,0,
2026-08-04 05:36:25,23589,707.3,569,115.6,19.8,135.5,166.7,38.4,,578,0.9,0,
2026-08-04 05:51:50,23589,707.2,569.5,115.6,19.8,135.5,166.7,38.4,,578,-0.1,0,
2026-08-04 06:07:17,23589,704.2,566.8,117.7,19.8,137.5,166.9,33.4,,578,-3,2.1,
2026-08-04 06:22:44,23589,740.2,611.5,115.6,19.8,135.5,180,64.8,,578,36,-2.1,
2026-08-04 06:38:07,23589,726.2,598,115.6,19.8,135.5,172.6,58.9,,578,-14,0,
2026-08-04 06:53:33,23589,746.9,641.7,123.8,19.8,143.6,191.7,64.2,,596,20.7,8.2,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-08-04 07:09:06,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-08-04 07:24:06,16033,535.8,674.7,7.1,19.8,26.9,255.8,39.3,,99,,,
2026-08-04 07:39:37,16033,487.6,628.1,27.8,19.8,47.7,184.7,68.5,,15,,,
2026-08-04 07:55:16,16033,727.3,867.8,9.5,19.8,29.3,379.3,57.6,,99,239.7,-18.3,PSS_SPIKE review=graphics+native
```

## incidents.log (tail)

```
[2026-08-04 00:58:40] PSS_SOFT_CEILING pss=823.5 gl=117.7 views=581 native_reclaim_advisory
[2026-08-04 01:14:06] PSS_SOFT_CEILING pss=827.4 gl=115.7 views=581 native_reclaim_advisory
[2026-08-04 01:29:34] PSS_SOFT_CEILING pss=828.6 gl=115.7 views=602 native_reclaim_advisory
[2026-08-04 01:45:02] PSS_SOFT_CEILING pss=860.9 gl=115.7 views=581 native_reclaim_advisory
[2026-08-04 02:00:31] PSS_SOFT_CEILING pss=852 gl=115.7 views=581 native_reclaim_advisory
[2026-08-04 02:15:56] PSS_SOFT_CEILING pss=819 gl=115.7 views=578 native_reclaim_advisory
[2026-08-04 02:31:22] PSS_SOFT_CEILING pss=809.8 gl=115.7 views=578 native_reclaim_advisory
[2026-08-04 02:46:48] PSS_SOFT_CEILING pss=815 gl=115.7 views=578 native_reclaim_advisory
[2026-08-04 03:02:12] PSS_SOFT_CEILING pss=817.2 gl=115.7 views=578 native_reclaim_advisory
[2026-08-04 03:17:38] PSS_SOFT_CEILING pss=821.7 gl=115.7 views=578 native_reclaim_advisory
[2026-08-04 03:33:03] PSS_SOFT_CEILING pss=814.1 gl=115.7 views=578 native_reclaim_advisory
[2026-08-04 03:48:30] PSS_SOFT_CEILING pss=825 gl=115.7 views=578 native_reclaim_advisory
[2026-08-04 04:03:55] PSS_SOFT_CEILING pss=816.7 gl=115.7 views=578 native_reclaim_advisory
[2026-08-04 04:19:21] VIEWS_NATIVE_ADVISORY views=578 native_heap=164.6 pss=709.5 gl=115.6 (node/list retention ??pre-hardceiling early warn)
[2026-08-04 04:34:47] VIEWS_NATIVE_ADVISORY views=578 native_heap=165.8 pss=708.8 gl=115.6 (node/list retention ??pre-hardceiling early warn)
[2026-08-04 04:50:12] VIEWS_NATIVE_ADVISORY views=578 native_heap=165 pss=704.3 gl=115.6 (node/list retention ??pre-hardceiling early warn)
[2026-08-04 05:05:38] VIEWS_NATIVE_ADVISORY views=578 native_heap=166.1 pss=706.9 gl=115.6 (node/list retention ??pre-hardceiling early warn)
[2026-08-04 05:21:04] VIEWS_NATIVE_ADVISORY views=578 native_heap=167.1 pss=706.4 gl=115.6 (node/list retention ??pre-hardceiling early warn)
[2026-08-04 05:36:31] VIEWS_NATIVE_ADVISORY views=578 native_heap=166.7 pss=707.3 gl=115.6 (node/list retention ??pre-hardceiling early warn)
[2026-08-04 05:51:56] VIEWS_NATIVE_ADVISORY views=578 native_heap=166.7 pss=707.2 gl=115.6 (node/list retention ??pre-hardceiling early warn)
[2026-08-04 06:07:23] VIEWS_NATIVE_ADVISORY views=578 native_heap=166.9 pss=704.2 gl=117.7 (node/list retention ??pre-hardceiling early warn)
[2026-08-04 06:22:49] VIEWS_NATIVE_ADVISORY views=578 native_heap=180 pss=740.2 gl=115.6 (node/list retention ??pre-hardceiling early warn)
[2026-08-04 06:38:13] VIEWS_NATIVE_ADVISORY views=578 native_heap=172.6 pss=726.2 gl=115.6 (node/list retention ??pre-hardceiling early warn)
[2026-08-04 06:53:40] VIEWS_NATIVE_ADVISORY views=596 native_heap=191.7 pss=746.9 gl=123.8 (node/list retention ??pre-hardceiling early warn)
[2026-08-04 08:00:00] DAILY_8AM_REPORT 2026-08-04 08:00:00 KST
```

## remediation.log (tail)

```
[2026-08-04 00:43:14] INFO PSS_SOFT_CEILING pss=824.5 gl=117.7 views=580 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-04 00:58:40] INFO PSS_SOFT_CEILING pss=823.5 gl=117.7 views=581 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-04 01:14:06] INFO PSS_SOFT_CEILING pss=827.4 gl=115.7 views=581 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-04 01:29:34] INFO PSS_SOFT_CEILING pss=828.6 gl=115.7 views=602 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-04 01:45:02] INFO PSS_SOFT_CEILING pss=860.9 gl=115.7 views=581 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-04 02:00:31] INFO PSS_SOFT_CEILING pss=852 gl=115.7 views=581 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-04 02:15:56] INFO PSS_SOFT_CEILING pss=819 gl=115.7 views=578 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-04 02:31:22] INFO PSS_SOFT_CEILING pss=809.8 gl=115.7 views=578 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-04 02:46:48] INFO PSS_SOFT_CEILING pss=815 gl=115.7 views=578 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-04 03:02:12] INFO PSS_SOFT_CEILING pss=817.2 gl=115.7 views=578 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-04 03:17:38] INFO PSS_SOFT_CEILING pss=821.7 gl=115.7 views=578 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-04 03:33:03] INFO PSS_SOFT_CEILING pss=814.1 gl=115.7 views=578 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-04 03:48:30] INFO PSS_SOFT_CEILING pss=825 gl=115.7 views=578 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-04 04:03:55] INFO PSS_SOFT_CEILING pss=816.7 gl=115.7 views=578 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-04 04:19:21] INFO VIEWS_NATIVE_ADVISORY views=578 native_heap=164.6 pss=709.5 gl=115.6 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-04 04:34:47] INFO VIEWS_NATIVE_ADVISORY views=578 native_heap=165.8 pss=708.8 gl=115.6 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-04 04:50:12] INFO VIEWS_NATIVE_ADVISORY views=578 native_heap=165 pss=704.3 gl=115.6 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-04 05:05:38] INFO VIEWS_NATIVE_ADVISORY views=578 native_heap=166.1 pss=706.9 gl=115.6 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-04 05:21:04] INFO VIEWS_NATIVE_ADVISORY views=578 native_heap=167.1 pss=706.4 gl=115.6 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-04 05:36:31] INFO VIEWS_NATIVE_ADVISORY views=578 native_heap=166.7 pss=707.3 gl=115.6 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-04 05:51:56] INFO VIEWS_NATIVE_ADVISORY views=578 native_heap=166.7 pss=707.2 gl=115.6 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-04 06:07:23] INFO VIEWS_NATIVE_ADVISORY views=578 native_heap=166.9 pss=704.2 gl=117.7 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-04 06:22:49] INFO VIEWS_NATIVE_ADVISORY views=578 native_heap=180 pss=740.2 gl=115.6 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-04 06:38:13] INFO VIEWS_NATIVE_ADVISORY views=578 native_heap=172.6 pss=726.2 gl=115.6 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-04 06:53:40] INFO VIEWS_NATIVE_ADVISORY views=596 native_heap=191.7 pss=746.9 gl=123.8 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
```

## mem-alerts.log (tail)

```
[2026-08-01 10:53:24] CRITICAL process not running ??check crash-*.log
[2026-08-01 11:39:22] GL +87.4MB views=585 (PSS 135.8MB) ??active hub
[2026-08-01 12:25:50] GL +96.5MB views=580 (PSS 136.7MB) ??active hub
[2026-08-01 14:13:51] GL +16.2MB views=580 (PSS 19.5MB) ??active hub
[2026-08-01 16:17:19] GL +31.3MB views=586 (PSS 35.8MB) ??active hub
[2026-08-01 18:21:05] GL +17.5MB views=581 (PSS 31.1MB) ??active hub
[2026-08-01 21:26:22] GL +21.4MB views=369 (PSS 83.7MB) ??active hub
[2026-08-01 21:41:47] GL +93.7MB views=575 (PSS 113.4MB) ??active hub
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

