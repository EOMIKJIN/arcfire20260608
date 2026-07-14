# Arcfire daily 08:00 KST auto report (mandatory perpetual)

Generated (KST): 2026-07-13 08:00:02
Package: com.arcfire.online

## Runtime

| pid | PSS (MB) | GL (MB) | Views |
|-----|----------|---------|-------|
| 3031 | 730.2 | 16.3 | 99 |

## mem-timeline (since DAILY_8AM_REPORT)

```csv
2026-07-13 00:19:09,3031,795.2,913.6,46.4,40.7,87,446.1,45.3,,351,43.8,25.5,HUB_ACTIVATION gl_mount_ok
2026-07-13 00:34:34,3031,880.1,998.7,129.8,19.8,149.7,471.3,43.9,,559,84.9,83.4,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-07-13 00:50:01,3031,896.5,1016.4,129.8,19.8,149.7,476.5,51.1,,559,16.4,0,
2026-07-13 01:05:37,3031,888.6,1008.6,139.4,19.8,159.2,472.7,51.5,,577,-7.9,9.6,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-07-13 01:21:09,3031,784.4,904.5,38.6,19.8,58.5,472.8,41.6,,351,-104.2,-100.8,GL_RECOVERED idle_ok
2026-07-13 01:36:34,3031,796.9,917,38.8,19.8,58.6,476.2,44,,358,12.5,0.2,
2026-07-13 01:52:02,3031,825.7,945.9,40.8,19.8,60.6,486.1,47.9,,358,28.8,2,
2026-07-13 02:07:33,3031,773.2,893.4,16.7,19.8,36.6,479,39.7,,99,-52.5,-24.1,GL_RECOVERED idle_ok
2026-07-13 02:22:56,3031,755,875,15.3,19.8,35.2,462.4,40.7,,99,-18.2,-1.4,
2026-07-13 02:38:18,3031,774.3,894.3,15.3,19.8,35.2,479.6,39.3,,99,19.3,0,
2026-07-13 02:53:39,3031,727.8,582.3,15.3,19.8,35.1,234.9,31.2,,99,-46.5,0,
2026-07-13 03:09:00,3031,730.5,587.4,15.3,19.8,35.1,237.1,33.9,,99,2.7,0,
2026-07-13 03:24:21,3031,734,601.9,16.3,19.8,36.1,246.8,36.3,,99,3.5,1,
2026-07-13 03:39:43,3031,736.6,604.4,16.3,19.8,36.1,247.3,39.4,,99,2.6,0,
2026-07-13 03:55:04,3031,732.7,600.5,16.3,19.8,36.1,247.2,35.5,,99,-3.9,0,
2026-07-13 04:10:26,3031,726.4,597.9,16.4,19.8,36.3,250.3,28.1,,120,-6.3,0.1,
2026-07-13 04:25:52,3031,731.3,603.1,16.3,19.8,36.1,250.7,32.8,,99,4.9,-0.1,
2026-07-13 04:41:13,3031,745.2,615.8,16.3,19.8,36.1,259.1,52.5,,99,13.9,0,
2026-07-13 04:56:34,3031,723.8,595.5,16.3,19.8,36.1,252,53.8,,99,-21.4,0,
2026-07-13 05:11:56,3031,708.2,582.1,16.3,19.8,36.1,263.1,30,,99,-15.6,0,
2026-07-13 05:27:18,3031,705.3,578.5,16.3,19.8,36.1,256.1,32.9,,99,-2.9,0,
2026-07-13 05:42:39,3031,705.6,579.9,16.3,19.8,36.1,256.2,34,,99,0.3,0,
2026-07-13 05:58:00,3031,701.2,575.6,16.3,19.8,36.1,256.2,29.9,,99,-4.4,0,
2026-07-13 06:13:21,3031,704.3,578.8,16.3,19.8,36.1,255.6,33.8,,99,3.1,0,
2026-07-13 06:28:42,3031,700.1,575.4,16.3,19.8,36.1,256.3,29.8,,99,-4.2,0,
2026-07-13 06:44:05,3031,717.1,592.4,16.3,19.8,36.1,255.7,48.3,,99,17,0,
2026-07-13 06:59:28,3031,716.5,591.9,16.3,19.8,36.1,255.6,47.6,,99,-0.6,0,
2026-07-13 07:14:49,3031,714.2,583,16.3,19.8,36.1,255,45.6,,99,-2.3,0,
2026-07-13 07:30:12,3031,711.4,580.1,16.3,19.8,36.1,254.9,42.9,,99,-2.8,0,
2026-07-13 07:45:33,3031,734.5,603.2,16.3,19.8,36.1,269.6,58,,99,23.1,0,
```

## incidents.log (tail)

```
[2026-07-12 08:12:11] DAILY_8AM_REPORT 2026-07-12 08:12:11 KST
[2026-07-12 08:12:11] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260712-0800.md verdict=OK
[2026-07-12 08:14:14] DAILY_8AM_REPORT 2026-07-12 08:14:14 KST
[2026-07-12 08:14:14] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260712-0800.md verdict=OK
[2026-07-12 12:15:12] PSS_SOFT_CEILING pss=804.6 gl=46.4 views=403 native_reclaim_advisory
[2026-07-12 12:30:33] PSS_SOFT_CEILING pss=811.7 gl=46.7 views=383 native_reclaim_advisory
[2026-07-12 14:48:41] PSS_SOFT_CEILING pss=811.3 gl=55.3 views=392 native_reclaim_advisory
[2026-07-12 17:53:15] PSS_SOFT_CEILING pss=823.5 gl=59 views=391 native_reclaim_advisory
[2026-07-12 18:08:35] PSS_SOFT_CEILING pss=800.2 gl=58.3 views=373 native_reclaim_advisory
[2026-07-12 18:39:18] PSS_SOFT_CEILING pss=804 gl=58.3 views=377 native_reclaim_advisory
[2026-07-12 18:54:43] PSS_SOFT_CEILING pss=819.5 gl=58.3 views=377 native_reclaim_advisory
[2026-07-12 19:10:08] PSS_SOFT_CEILING pss=802.1 gl=58.5 views=380 native_reclaim_advisory
[2026-07-12 19:25:35] PSS_SOFT_CEILING pss=806.6 gl=58.5 views=377 native_reclaim_advisory
[2026-07-12 19:56:24] PSS_SOFT_CEILING pss=817.4 gl=63.1 views=384 native_reclaim_advisory
[2026-07-12 21:14:08] VIEWS_NATIVE_ADVISORY views=452 native_heap=389 pss=738.8 gl=33.4 (node/list retention ??pre-hardceiling early warn)
[2026-07-12 23:01:58] VIEWS_NATIVE_ADVISORY views=453 native_heap=381.4 pss=729.7 gl=57.6 (node/list retention ??pre-hardceiling early warn)
[2026-07-12 23:48:11] VIEWS_NATIVE_ADVISORY views=367 native_heap=423.2 pss=729.8 gl=44.9 (node/list retention ??pre-hardceiling early warn)
[2026-07-13 00:19:14] VIEWS_NATIVE_ADVISORY views=351 native_heap=446.1 pss=795.2 gl=46.4 (node/list retention ??pre-hardceiling early warn)
[2026-07-13 00:34:40] PSS_SOFT_CEILING pss=880.1 gl=129.8 views=559 native_reclaim_advisory
[2026-07-13 00:50:12] PSS_SOFT_CEILING pss=896.5 gl=129.8 views=559 native_reclaim_advisory
[2026-07-13 01:05:44] PSS_SOFT_CEILING pss=888.6 gl=139.4 views=577 native_reclaim_advisory
[2026-07-13 01:21:14] VIEWS_NATIVE_ADVISORY views=351 native_heap=472.8 pss=784.4 gl=38.6 (node/list retention ??pre-hardceiling early warn)
[2026-07-13 01:36:40] VIEWS_NATIVE_ADVISORY views=358 native_heap=476.2 pss=796.9 gl=38.8 (node/list retention ??pre-hardceiling early warn)
[2026-07-13 01:52:10] PSS_SOFT_CEILING pss=825.7 gl=40.8 views=358 native_reclaim_advisory
[2026-07-13 08:00:00] DAILY_8AM_REPORT 2026-07-13 08:00:00 KST
```

## remediation.log (tail)

```
[2026-07-10 23:35:59] INFO PSS_SOFT_CEILING pss=821.2 gl=31.8 views=379 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-10 23:51:26] INFO PSS_SOFT_CEILING pss=809.9 gl=27.7 views=379 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-11 10:51:51] INFO PSS_SOFT_CEILING pss=813.8 gl=120.3 views=579 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-11 11:07:15] INFO VIEWS_NATIVE_ADVISORY views=562 native_heap=314.4 pss=737 gl=137.9 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-11 11:53:33] INFO VIEWS_NATIVE_ADVISORY views=512 native_heap=358.5 pss=716.4 gl=44.5 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-12 12:15:12] INFO PSS_SOFT_CEILING pss=804.6 gl=46.4 views=403 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-12 12:30:33] INFO PSS_SOFT_CEILING pss=811.7 gl=46.7 views=383 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-12 14:48:41] INFO PSS_SOFT_CEILING pss=811.3 gl=55.3 views=392 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-12 17:53:15] INFO PSS_SOFT_CEILING pss=823.5 gl=59 views=391 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-12 18:08:35] INFO PSS_SOFT_CEILING pss=800.2 gl=58.3 views=373 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-12 18:39:18] INFO PSS_SOFT_CEILING pss=804 gl=58.3 views=377 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-12 18:54:43] INFO PSS_SOFT_CEILING pss=819.5 gl=58.3 views=377 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-12 19:10:08] INFO PSS_SOFT_CEILING pss=802.1 gl=58.5 views=380 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-12 19:25:35] INFO PSS_SOFT_CEILING pss=806.6 gl=58.5 views=377 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-12 19:56:24] INFO PSS_SOFT_CEILING pss=817.4 gl=63.1 views=384 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-12 21:14:08] INFO VIEWS_NATIVE_ADVISORY views=452 native_heap=389 pss=738.8 gl=33.4 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-12 23:01:58] INFO VIEWS_NATIVE_ADVISORY views=453 native_heap=381.4 pss=729.7 gl=57.6 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-12 23:48:11] INFO VIEWS_NATIVE_ADVISORY views=367 native_heap=423.2 pss=729.8 gl=44.9 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-13 00:19:14] INFO VIEWS_NATIVE_ADVISORY views=351 native_heap=446.1 pss=795.2 gl=46.4 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-13 00:34:40] INFO PSS_SOFT_CEILING pss=880.1 gl=129.8 views=559 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-13 00:50:12] INFO PSS_SOFT_CEILING pss=896.5 gl=129.8 views=559 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-13 01:05:44] INFO PSS_SOFT_CEILING pss=888.6 gl=139.4 views=577 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-13 01:21:14] INFO VIEWS_NATIVE_ADVISORY views=351 native_heap=472.8 pss=784.4 gl=38.6 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-13 01:36:40] INFO VIEWS_NATIVE_ADVISORY views=358 native_heap=476.2 pss=796.9 gl=38.8 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-13 01:52:10] INFO PSS_SOFT_CEILING pss=825.7 gl=40.8 views=358 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
```

## mem-alerts.log (tail)

```
[2026-07-10 19:26:59] GL +84.5MB views=567 (PSS 75.4MB) ??active hub
[2026-07-10 20:44:53] GL +32.4MB views=561 (PSS 281.2MB) ??active hub
[2026-07-10 22:03:18] PSS +73.7MB GL 42.6MB views=382
[2026-07-10 22:34:11] PSS +106.7MB GL 40MB views=380
[2026-07-11 00:37:43] GL +9.2MB views=379 (PSS 29MB) ??active hub
[2026-07-11 05:44:45] PSS +44MB GL 30.1MB views=409
[2026-07-11 09:50:15] GL +11.3MB views=384 (PSS 50.9MB) ??active hub
[2026-07-11 10:51:45] GL +82.9MB views=579 (PSS 75.2MB) ??active hub
[2026-07-11 11:53:27] PSS +69.3MB GL 44.5MB views=512
[2026-07-11 12:08:59] GL +12.7MB views=378 (PSS -8.9MB) ??active hub
[2026-07-11 15:28:39] GL +11.8MB views=346 (PSS 0.3MB) ??active hub
[2026-07-11 21:22:44] GL +22.3MB views=358 (PSS 39.5MB) ??active hub
[2026-07-11 21:53:32] PSS +59.8MB GL 46.2MB views=317
[2026-07-11 22:09:02] GL +9.4MB views=374 (PSS -4.3MB) ??active hub
[2026-07-11 23:57:17] GL +16.2MB views=373 (PSS 40.9MB) ??active hub
[2026-07-12 01:45:10] PSS +42MB GL 47.5MB views=399
[2026-07-12 06:06:21] PSS +41.8MB GL 46.8MB views=400
[2026-07-12 14:17:52] GL +27.3MB views=374 (PSS 75.9MB) ??active hub
[2026-07-12 16:36:09] GL +8.7MB views=379 (PSS 17.9MB) ??active hub
[2026-07-12 16:51:33] GL +11.7MB views=375 (PSS -38.6MB) ??active hub
[2026-07-12 20:11:44] CRITICAL process not running ??check crash-*.log
[2026-07-12 20:58:38] PSS +48.8MB GL 44.5MB views=373
[2026-07-12 21:29:27] GL +17.2MB views=370 (PSS 25.2MB) ??active hub
[2026-07-13 00:34:34] GL +83.4MB views=559 (PSS 84.9MB) ??active hub
[2026-07-13 01:05:37] GL +9.6MB views=577 (PSS -7.9MB) ??active hub
```

## KPI (overnight window)

| Metric | Count |
|--------|-------|
| GL_HARD_CEILING incidents | 35 |
| Crash / PROCESS_DEATH | 95 |
| Auto app relaunch | 35 |

## Action items for Kim Team Lead

1. GL_HARD_CEILING or 3x GL_SPIKE ??P0 hub Skia audit (see overnight-watch handoff).
2. SIGSEGV/FATAL ??arcfire-bug-debug-workflow + logcat tail in latest crash-*.log.
3. Stair-step floor rise without crash ??today's dev P0 list in overnight-watch handoff.

