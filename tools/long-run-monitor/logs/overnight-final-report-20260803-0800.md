# Arcfire daily 08:00 KST auto report (mandatory perpetual)

Generated (KST): 2026-08-03 08:00:04
Package: com.arcfire.online

## Runtime

| pid | PSS (MB) | GL (MB) | Views |
|-----|----------|---------|-------|
| 29281 | 843 | 130.1 | 579 |

## mem-timeline (since DAILY_8AM_REPORT)

```csv
2026-08-03 00:28:55,29281,683.8,819.1,32.4,19.8,52.2,347.1,47.9,,365,-17.5,-6.1,GL_RECOVERED idle_ok
2026-08-03 00:44:21,29281,696.2,833,36.5,19.8,56.3,361.4,43.3,,355,12.4,4.1,
2026-08-03 00:59:47,29281,688.5,825.1,36.5,19.8,56.3,349,47.8,,362,-7.7,0,
2026-08-03 01:15:12,29281,676.6,813.2,32.2,19.8,52,349.2,39.3,,362,-11.9,-4.3,
2026-08-03 01:30:38,29281,686.3,822.3,36.5,19.8,56.3,348,44.7,,360,9.7,4.3,
2026-08-03 01:46:04,29281,688.3,824.4,38.5,19.8,58.3,351.9,40.5,,362,2,2,
2026-08-03 02:01:30,29281,675.3,811.1,32.4,19.8,52.2,349.9,35.1,,355,-13,-6.1,GL_RECOVERED idle_ok
2026-08-03 02:16:57,29281,681,817.2,32.3,19.8,52.1,352,38.1,,362,5.7,-0.1,
2026-08-03 02:32:22,29281,699.7,835.8,36.6,19.8,56.4,363,41.2,,355,18.7,4.3,
2026-08-03 02:47:49,29281,692.3,828.4,36.6,19.8,56.4,357.9,38.2,,355,-7.4,0,
2026-08-03 03:03:11,29281,700.4,836.6,38.6,19.8,58.5,363.9,37.4,,368,8.1,2,
2026-08-03 03:18:37,29281,713.1,849.3,37.3,40.7,77.9,359.3,35.2,,393,12.7,-1.3,
2026-08-03 03:34:04,29281,710.8,847,38.9,34.3,73.2,355.7,40.6,,382,-2.3,1.6,
2026-08-03 03:49:29,29281,693.2,829.5,36.6,19.8,56.4,352.7,42,,361,-17.6,-2.3,
2026-08-03 04:04:55,29281,690.7,827,38.6,19.8,58.4,353.7,36.4,,368,-2.5,2,
2026-08-03 04:20:21,29281,692.6,828.7,32.5,19.8,52.4,357.8,39.3,,371,1.9,-6.1,GL_RECOVERED idle_ok
2026-08-03 04:35:47,29281,691.7,827.9,38.6,19.8,58.4,353.8,35,,366,-0.9,6.1,
2026-08-03 04:51:13,29281,691.7,827.9,34.5,19.8,54.4,355,37.4,,361,0,-4.1,
2026-08-03 05:06:38,29281,705,841.2,38.6,19.8,58.5,356.1,45.4,,368,13.3,4.1,
2026-08-03 05:22:04,29281,730.7,866.7,41.3,40.7,81.9,368.6,34.4,,379,25.7,2.7,
2026-08-03 05:37:30,29281,731.1,867.1,39.3,40.7,79.9,361.2,43.9,,377,0.4,-2,
2026-08-03 05:52:56,29281,696.8,832.8,36.6,19.8,56.4,357.4,36,,368,-34.3,-2.7,
2026-08-03 06:08:22,29281,695.7,831.8,36.6,19.8,56.4,356.9,34.7,,368,-1.1,0,
2026-08-03 06:23:47,29281,699.2,835.3,32.5,19.8,52.4,357.5,41.5,,368,3.5,-4.1,
2026-08-03 06:39:15,29281,708,844,38.6,19.8,58.4,359.7,40.8,,371,8.8,6.1,
2026-08-03 06:54:41,29281,713.6,849.3,36.6,19.8,56.4,367.2,41.1,,368,5.6,-2,
2026-08-03 07:10:06,29281,727.1,862.8,37.2,28,65.2,367,45.5,,371,13.5,0.6,
2026-08-03 07:25:33,29281,706.7,842.9,32.5,19.8,52.4,360.3,44.5,,368,-20.4,-4.7,
2026-08-03 07:40:59,29281,705,841.2,32.5,19.8,52.4,365.3,37.3,,368,-1.7,0,
2026-08-03 07:56:27,29281,702,838.2,34.5,19.8,54.4,360.3,37.1,,368,-3,2,
```

## incidents.log (tail)

```
[2026-08-02 15:58:55] PSS_SOFT_CEILING pss=871 gl=138 views=579 native_reclaim_advisory
[2026-08-02 16:14:18] PSS_SOFT_CEILING pss=858 gl=138 views=579 native_reclaim_advisory
[2026-08-02 16:29:44] VIEWS_NATIVE_ADVISORY views=374 native_heap=433.1 pss=743.2 gl=34.8 (node/list retention ??pre-hardceiling early warn)
[2026-08-02 16:45:11] VIEWS_NATIVE_ADVISORY views=391 native_heap=434 pss=736.9 gl=34.2 (node/list retention ??pre-hardceiling early warn)
[2026-08-02 17:00:41] PSS_SOFT_CEILING pss=866.8 gl=131.1 views=577 native_reclaim_advisory
[2026-08-02 17:16:09] PSS_SOFT_CEILING pss=900.3 gl=134.9 views=577 native_reclaim_advisory
[2026-08-02 17:31:38] PSS_SOFT_CEILING pss=852.1 gl=118.7 views=582 native_reclaim_advisory
[2026-08-02 17:47:04] PSS_SOFT_CEILING pss=853.8 gl=118.7 views=582 native_reclaim_advisory
[2026-08-02 18:02:36] PSS_SOFT_CEILING pss=847.9 gl=116.7 views=582 native_reclaim_advisory
[2026-08-02 18:18:05] PSS_SOFT_CEILING pss=929.5 gl=135.1 views=581 native_reclaim_advisory
[2026-08-02 18:33:35] PSS_SOFT_CEILING pss=896.5 gl=139.1 views=581 native_reclaim_advisory
[2026-08-02 18:49:01] PSS_SOFT_CEILING pss=918.3 gl=136.1 views=581 native_reclaim_advisory
[2026-08-02 19:04:31] PSS_SOFT_CEILING pss=899.8 gl=136.1 views=581 native_reclaim_advisory
[2026-08-02 19:35:28] VIEWS_NATIVE_ADVISORY views=581 native_heap=356 pss=789.9 gl=133.7 (node/list retention ??pre-hardceiling early warn)
[2026-08-02 19:50:55] PSS_SOFT_CEILING pss=800.1 gl=135.7 views=581 native_reclaim_advisory
[2026-08-02 20:06:22] VIEWS_NATIVE_ADVISORY views=581 native_heap=350.5 pss=782.5 gl=131.7 (node/list retention ??pre-hardceiling early warn)
[2026-08-02 20:21:47] VIEWS_NATIVE_ADVISORY views=581 native_heap=350.6 pss=786.6 gl=131.7 (node/list retention ??pre-hardceiling early warn)
[2026-08-02 20:37:17] VIEWS_NATIVE_ADVISORY views=581 native_heap=350.2 pss=784.8 gl=131.7 (node/list retention ??pre-hardceiling early warn)
[2026-08-02 20:52:42] VIEWS_NATIVE_ADVISORY views=576 native_heap=351.1 pss=763.7 gl=117.6 (node/list retention ??pre-hardceiling early warn)
[2026-08-02 21:08:08] VIEWS_NATIVE_ADVISORY views=576 native_heap=350.7 pss=763.6 gl=115.5 (node/list retention ??pre-hardceiling early warn)
[2026-08-02 21:23:40] VIEWS_NATIVE_ADVISORY views=576 native_heap=350.3 pss=764.6 gl=115.5 (node/list retention ??pre-hardceiling early warn)
[2026-08-02 21:39:07] VIEWS_NATIVE_ADVISORY views=576 native_heap=350.6 pss=762.6 gl=115.5 (node/list retention ??pre-hardceiling early warn)
[2026-08-02 21:54:33] VIEWS_NATIVE_ADVISORY views=576 native_heap=351.3 pss=762.8 gl=115.5 (node/list retention ??pre-hardceiling early warn)
[2026-08-02 22:09:59] VIEWS_NATIVE_ADVISORY views=576 native_heap=351.4 pss=770.8 gl=115.5 (node/list retention ??pre-hardceiling early warn)
[2026-08-03 08:00:00] DAILY_8AM_REPORT 2026-08-03 08:00:00 KST
```

## remediation.log (tail)

```
[2026-08-02 15:43:27] INFO PSS_SOFT_CEILING pss=876.7 gl=142.1 views=579 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-02 15:58:55] INFO PSS_SOFT_CEILING pss=871 gl=138 views=579 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-02 16:14:18] INFO PSS_SOFT_CEILING pss=858 gl=138 views=579 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-02 16:29:44] INFO VIEWS_NATIVE_ADVISORY views=374 native_heap=433.1 pss=743.2 gl=34.8 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-02 16:45:11] INFO VIEWS_NATIVE_ADVISORY views=391 native_heap=434 pss=736.9 gl=34.2 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-02 17:00:41] INFO PSS_SOFT_CEILING pss=866.8 gl=131.1 views=577 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-02 17:16:09] INFO PSS_SOFT_CEILING pss=900.3 gl=134.9 views=577 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-02 17:31:38] INFO PSS_SOFT_CEILING pss=852.1 gl=118.7 views=582 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-02 17:47:04] INFO PSS_SOFT_CEILING pss=853.8 gl=118.7 views=582 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-02 18:02:36] INFO PSS_SOFT_CEILING pss=847.9 gl=116.7 views=582 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-02 18:18:05] INFO PSS_SOFT_CEILING pss=929.5 gl=135.1 views=581 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-02 18:33:35] INFO PSS_SOFT_CEILING pss=896.5 gl=139.1 views=581 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-02 18:49:01] INFO PSS_SOFT_CEILING pss=918.3 gl=136.1 views=581 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-02 19:04:31] INFO PSS_SOFT_CEILING pss=899.8 gl=136.1 views=581 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-02 19:35:28] INFO VIEWS_NATIVE_ADVISORY views=581 native_heap=356 pss=789.9 gl=133.7 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-02 19:50:55] INFO PSS_SOFT_CEILING pss=800.1 gl=135.7 views=581 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-02 20:06:22] INFO VIEWS_NATIVE_ADVISORY views=581 native_heap=350.5 pss=782.5 gl=131.7 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-02 20:21:47] INFO VIEWS_NATIVE_ADVISORY views=581 native_heap=350.6 pss=786.6 gl=131.7 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-02 20:37:17] INFO VIEWS_NATIVE_ADVISORY views=581 native_heap=350.2 pss=784.8 gl=131.7 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-02 20:52:42] INFO VIEWS_NATIVE_ADVISORY views=576 native_heap=351.1 pss=763.7 gl=117.6 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-02 21:08:08] INFO VIEWS_NATIVE_ADVISORY views=576 native_heap=350.7 pss=763.6 gl=115.5 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-02 21:23:40] INFO VIEWS_NATIVE_ADVISORY views=576 native_heap=350.3 pss=764.6 gl=115.5 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-02 21:39:07] INFO VIEWS_NATIVE_ADVISORY views=576 native_heap=350.6 pss=762.6 gl=115.5 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-02 21:54:33] INFO VIEWS_NATIVE_ADVISORY views=576 native_heap=351.3 pss=762.8 gl=115.5 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-02 22:09:59] INFO VIEWS_NATIVE_ADVISORY views=576 native_heap=351.4 pss=770.8 gl=115.5 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
```

## mem-alerts.log (tail)

```
[2026-07-31 13:35:00] PSS +74.8MB GL 47.5MB views=367
[2026-08-01 06:49:50] GL +8.5MB views=386 (PSS 25.5MB) ??active hub
[2026-08-01 08:53:14] CRITICAL process not running ??check crash-*.log
[2026-08-01 09:08:14] CRITICAL process not running ??check crash-*.log
[2026-08-01 09:23:15] CRITICAL process not running ??check crash-*.log
[2026-08-01 09:38:16] CRITICAL process not running ??check crash-*.log
[2026-08-01 09:53:17] CRITICAL process not running ??check crash-*.log
[2026-08-01 10:08:17] CRITICAL process not running ??check crash-*.log
[2026-08-01 10:23:18] CRITICAL process not running ??check crash-*.log
[2026-08-01 10:38:18] CRITICAL process not running ??check crash-*.log
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
```

## KPI (overnight window)

| Metric | Count |
|--------|-------|
| GL_HARD_CEILING incidents | 45 |
| Crash / PROCESS_DEATH | 95 |
| Auto app relaunch | 46 |

## Action items for Kim Team Lead

1. GL_HARD_CEILING or 3x GL_SPIKE ??P0 hub Skia audit (see overnight-watch handoff).
2. SIGSEGV/FATAL ??arcfire-bug-debug-workflow + logcat tail in latest crash-*.log.
3. Stair-step floor rise without crash ??today's dev P0 list in overnight-watch handoff.

