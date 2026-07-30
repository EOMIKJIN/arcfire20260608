# Arcfire daily 08:00 KST auto report (mandatory perpetual)

Generated (KST): 2026-07-30 08:00:02
Package: com.arcfire.online

## Runtime

| pid | PSS (MB) | GL (MB) | Views |
|-----|----------|---------|-------|
| 8590 | 785.7 | 129.3 | 576 |

## mem-timeline (since DAILY_8AM_REPORT)

```csv
2026-07-30 00:31:29,8590,888.3,1015.8,140.5,19.8,160.4,446.7,51.9,,575,18.1,15.5,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-07-30 00:46:56,8590,894.4,1023.1,141.6,19.8,161.4,452.7,48,,585,6.1,1.1,
2026-07-30 01:02:22,8590,900.2,1028.9,143.6,19.8,163.4,449.8,49.7,,575,5.8,2,
2026-07-30 01:17:47,8590,892.6,1021.5,141.6,19.8,161.4,449,44.8,,575,-7.6,-2,
2026-07-30 01:33:12,8590,894.2,1023.2,141.6,19.8,161.4,449.5,45.9,,575,1.6,0,
2026-07-30 01:48:37,8590,896.2,1025.3,141.6,19.8,161.4,450.3,47.2,,575,2,0,
2026-07-30 02:04:01,8590,875.8,1004.8,125,19.8,144.8,451.4,42.2,,597,-20.4,-16.6,GL_RECOVERED idle_ok
2026-07-30 02:19:26,8590,878.8,1007.8,125,19.8,144.8,450.7,45.8,,576,3,0,
2026-07-30 02:34:51,8590,874.3,1003.3,125,19.8,144.8,450.1,40.8,,576,-4.5,0,
2026-07-30 02:50:15,8590,802.7,792.9,125.4,19.8,145.2,340.1,42,,576,-71.6,0.4,
2026-07-30 03:05:42,8590,801.5,790.3,129.4,19.8,149.2,339.6,39.1,,576,-1.2,4,
2026-07-30 03:21:11,8590,800.5,787.9,125.4,19.8,145.2,340.3,40.1,,576,-1,-4,
2026-07-30 03:36:35,8590,800.1,787.6,125.4,19.8,145.2,339.8,40,,576,-0.4,0,
2026-07-30 03:52:00,8590,798.7,785.2,125.4,19.8,145.2,340.3,38.6,,576,-1.4,0,
2026-07-30 04:07:24,8590,798.6,785.4,125.4,19.8,145.2,340.5,38.3,,576,-0.1,0,
2026-07-30 04:22:50,8590,805.5,791.9,125.4,19.8,145.2,339.9,45.2,,576,6.9,0,
2026-07-30 04:38:16,8590,805,789.7,127.4,19.8,147.2,339.9,42.6,,576,-0.5,2,
2026-07-30 04:53:40,8590,804,766.5,129.3,19.8,149.2,319.3,39.4,,576,-1,1.9,
2026-07-30 05:09:07,8590,807.5,770.1,125.3,19.8,145.2,318.8,47.5,,576,3.5,-4,
2026-07-30 05:24:31,8590,805,729.6,127.3,19.8,147.2,280.6,43.2,,576,-2.5,2,
2026-07-30 05:39:57,8590,805.6,730.2,129.3,19.8,149.2,281.5,40.9,,576,0.6,2,
2026-07-30 05:55:21,8590,802.8,727.4,125.3,19.8,145.2,281.4,42.1,,576,-2.8,-4,
2026-07-30 06:10:47,8590,800.6,725.5,125.3,19.8,145.2,281.3,40.2,,576,-2.2,0,
2026-07-30 06:26:12,8590,801.7,738.8,125.3,19.8,145.2,289,44.9,,576,1.1,0,
2026-07-30 06:41:37,8590,786.4,723.6,125.3,19.8,145.2,289.6,40.6,,576,-15.3,0,
2026-07-30 06:57:02,8590,785.3,722.7,125.3,19.8,145.2,289.2,40.4,,576,-1.1,0,
2026-07-30 07:12:27,8590,791.6,729.1,125.3,19.8,145.2,293.7,50.4,,576,6.3,0,
2026-07-30 07:27:51,8590,809.3,732.5,125.3,19.8,145.2,276.1,69.9,,576,17.7,0,
2026-07-30 07:43:16,8590,799.8,722.7,125.3,19.8,145.2,276.3,60.1,,576,-9.5,0,
2026-07-30 07:58:40,8590,782.6,706,125.3,19.8,145.2,275.4,45.8,,576,-17.2,0,
```

## incidents.log (tail)

```
[2026-07-30 02:04:06] PSS_SOFT_CEILING pss=875.8 gl=125 views=597 native_reclaim_advisory
[2026-07-30 02:19:31] PSS_SOFT_CEILING pss=878.8 gl=125 views=576 native_reclaim_advisory
[2026-07-30 02:34:56] PSS_SOFT_CEILING pss=874.3 gl=125 views=576 native_reclaim_advisory
[2026-07-30 02:50:22] PSS_SOFT_CEILING pss=802.7 gl=125.4 views=576 native_reclaim_advisory
[2026-07-30 03:05:47] PSS_SOFT_CEILING pss=801.5 gl=129.4 views=576 native_reclaim_advisory
[2026-07-30 03:21:16] PSS_SOFT_CEILING pss=800.5 gl=125.4 views=576 native_reclaim_advisory
[2026-07-30 03:36:40] PSS_SOFT_CEILING pss=800.1 gl=125.4 views=576 native_reclaim_advisory
[2026-07-30 03:52:05] VIEWS_NATIVE_ADVISORY views=576 native_heap=340.3 pss=798.7 gl=125.4 (node/list retention ??pre-hardceiling early warn)
[2026-07-30 04:07:30] VIEWS_NATIVE_ADVISORY views=576 native_heap=340.5 pss=798.6 gl=125.4 (node/list retention ??pre-hardceiling early warn)
[2026-07-30 04:22:55] PSS_SOFT_CEILING pss=805.5 gl=125.4 views=576 native_reclaim_advisory
[2026-07-30 04:38:21] PSS_SOFT_CEILING pss=805 gl=127.4 views=576 native_reclaim_advisory
[2026-07-30 04:53:46] PSS_SOFT_CEILING pss=804 gl=129.3 views=576 native_reclaim_advisory
[2026-07-30 05:09:12] PSS_SOFT_CEILING pss=807.5 gl=125.3 views=576 native_reclaim_advisory
[2026-07-30 05:24:37] PSS_SOFT_CEILING pss=805 gl=127.3 views=576 native_reclaim_advisory
[2026-07-30 05:40:02] PSS_SOFT_CEILING pss=805.6 gl=129.3 views=576 native_reclaim_advisory
[2026-07-30 05:55:27] PSS_SOFT_CEILING pss=802.8 gl=125.3 views=576 native_reclaim_advisory
[2026-07-30 06:10:52] PSS_SOFT_CEILING pss=800.6 gl=125.3 views=576 native_reclaim_advisory
[2026-07-30 06:26:17] PSS_SOFT_CEILING pss=801.7 gl=125.3 views=576 native_reclaim_advisory
[2026-07-30 06:41:43] VIEWS_NATIVE_ADVISORY views=576 native_heap=289.6 pss=786.4 gl=125.3 (node/list retention ??pre-hardceiling early warn)
[2026-07-30 06:57:07] VIEWS_NATIVE_ADVISORY views=576 native_heap=289.2 pss=785.3 gl=125.3 (node/list retention ??pre-hardceiling early warn)
[2026-07-30 07:12:32] VIEWS_NATIVE_ADVISORY views=576 native_heap=293.7 pss=791.6 gl=125.3 (node/list retention ??pre-hardceiling early warn)
[2026-07-30 07:27:56] PSS_SOFT_CEILING pss=809.3 gl=125.3 views=576 native_reclaim_advisory
[2026-07-30 07:43:20] VIEWS_NATIVE_ADVISORY views=576 native_heap=276.3 pss=799.8 gl=125.3 (node/list retention ??pre-hardceiling early warn)
[2026-07-30 07:58:46] VIEWS_NATIVE_ADVISORY views=576 native_heap=275.4 pss=782.6 gl=125.3 (node/list retention ??pre-hardceiling early warn)
[2026-07-30 08:00:00] DAILY_8AM_REPORT 2026-07-30 08:00:00 KST
```

## remediation.log (tail)

```
[2026-07-30 01:48:42] INFO PSS_SOFT_CEILING pss=896.2 gl=141.6 views=575 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-30 02:04:06] INFO PSS_SOFT_CEILING pss=875.8 gl=125 views=597 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-30 02:19:31] INFO PSS_SOFT_CEILING pss=878.8 gl=125 views=576 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-30 02:34:56] INFO PSS_SOFT_CEILING pss=874.3 gl=125 views=576 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-30 02:50:22] INFO PSS_SOFT_CEILING pss=802.7 gl=125.4 views=576 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-30 03:05:47] INFO PSS_SOFT_CEILING pss=801.5 gl=129.4 views=576 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-30 03:21:16] INFO PSS_SOFT_CEILING pss=800.5 gl=125.4 views=576 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-30 03:36:40] INFO PSS_SOFT_CEILING pss=800.1 gl=125.4 views=576 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-30 03:52:05] INFO VIEWS_NATIVE_ADVISORY views=576 native_heap=340.3 pss=798.7 gl=125.4 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-30 04:07:30] INFO VIEWS_NATIVE_ADVISORY views=576 native_heap=340.5 pss=798.6 gl=125.4 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-30 04:22:55] INFO PSS_SOFT_CEILING pss=805.5 gl=125.4 views=576 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-30 04:38:21] INFO PSS_SOFT_CEILING pss=805 gl=127.4 views=576 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-30 04:53:46] INFO PSS_SOFT_CEILING pss=804 gl=129.3 views=576 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-30 05:09:12] INFO PSS_SOFT_CEILING pss=807.5 gl=125.3 views=576 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-30 05:24:37] INFO PSS_SOFT_CEILING pss=805 gl=127.3 views=576 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-30 05:40:02] INFO PSS_SOFT_CEILING pss=805.6 gl=129.3 views=576 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-30 05:55:27] INFO PSS_SOFT_CEILING pss=802.8 gl=125.3 views=576 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-30 06:10:52] INFO PSS_SOFT_CEILING pss=800.6 gl=125.3 views=576 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-30 06:26:17] INFO PSS_SOFT_CEILING pss=801.7 gl=125.3 views=576 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-30 06:41:43] INFO VIEWS_NATIVE_ADVISORY views=576 native_heap=289.6 pss=786.4 gl=125.3 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-30 06:57:07] INFO VIEWS_NATIVE_ADVISORY views=576 native_heap=289.2 pss=785.3 gl=125.3 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-30 07:12:32] INFO VIEWS_NATIVE_ADVISORY views=576 native_heap=293.7 pss=791.6 gl=125.3 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-30 07:27:56] INFO PSS_SOFT_CEILING pss=809.3 gl=125.3 views=576 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-30 07:43:20] INFO VIEWS_NATIVE_ADVISORY views=576 native_heap=276.3 pss=799.8 gl=125.3 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-30 07:58:46] INFO VIEWS_NATIVE_ADVISORY views=576 native_heap=275.4 pss=782.6 gl=125.3 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
```

## mem-alerts.log (tail)

```
[2026-07-26 07:33:02] CRITICAL process not running ??check crash-*.log
[2026-07-26 07:48:03] CRITICAL process not running ??check crash-*.log
[2026-07-26 08:03:04] CRITICAL process not running ??check crash-*.log
[2026-07-26 16:17:41] GL +103.5MB views=572 (PSS 128.8MB) ??active hub
[2026-07-27 00:32:40] CRITICAL process not running ??check crash-*.log
[2026-07-27 09:16:35] CRITICAL process not running ??check crash-*.log
[2026-07-27 09:31:37] CRITICAL process not running ??check crash-*.log
[2026-07-27 11:03:46] PSS +95.8MB GL 27.8MB views=99
[2026-07-27 12:21:55] PSS +105.9MB GL 47.8MB views=351
[2026-07-27 15:57:40] GL +91.8MB views=569 (PSS 111.8MB) ??active hub
[2026-07-27 20:19:44] GL +92.4MB views=570 (PSS 128.1MB) ??active hub
[2026-07-27 20:35:13] PSS +40.8MB GL 119MB views=572
[2026-07-28 13:02:04] PSS +140.6MB GL 125.4MB views=572
[2026-07-28 14:50:00] PSS +168.3MB GL 122.1MB views=572
[2026-07-28 15:21:37] GL +87.4MB views=572 (PSS 117.9MB) ??active hub
[2026-07-28 18:42:10] CRITICAL process not running ??check crash-*.log
[2026-07-28 20:45:03] PSS +63.6MB GL 100.4MB views=644
[2026-07-28 21:00:35] GL +25.6MB views=572 (PSS 226.9MB) ??active hub
[2026-07-29 11:09:25] PSS +65.7MB GL 49.6MB views=353
[2026-07-29 12:11:08] GL +100.4MB views=577 (PSS 132.8MB) ??active hub
[2026-07-29 17:04:11] PSS +49.2MB GL 44.4MB views=366
[2026-07-29 22:28:05] GL +118.1MB views=577 (PSS 132.6MB) ??active hub
[2026-07-29 22:59:03] CRITICAL process not running ??check crash-*.log
[2026-07-30 00:00:33] PSS +120.8MB GL 123.1MB views=577
[2026-07-30 00:31:29] GL +15.5MB views=575 (PSS 18.1MB) ??active hub
```

## KPI (overnight window)

| Metric | Count |
|--------|-------|
| GL_HARD_CEILING incidents | 44 |
| Crash / PROCESS_DEATH | 95 |
| Auto app relaunch | 44 |

## Action items for Kim Team Lead

1. GL_HARD_CEILING or 3x GL_SPIKE ??P0 hub Skia audit (see overnight-watch handoff).
2. SIGSEGV/FATAL ??arcfire-bug-debug-workflow + logcat tail in latest crash-*.log.
3. Stair-step floor rise without crash ??today's dev P0 list in overnight-watch handoff.

