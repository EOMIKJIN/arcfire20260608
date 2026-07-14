# Arcfire daily 08:00 KST auto report (mandatory perpetual)

Generated (KST): 2026-07-12 08:00:02
Package: com.arcfire.online

## Runtime

| pid | PSS (MB) | GL (MB) | Views |
|-----|----------|---------|-------|
| 14204 | 762.9 | 50.3 | 382 |

## mem-timeline (since DAILY_8AM_REPORT)

```csv
2026-07-12 00:28:05,14204,727.1,718.9,56.1,19.8,76,327.1,35.1,,380,3.7,-2,
2026-07-12 00:43:26,14204,733,724.5,45.2,19.8,65,336.8,39.6,,380,5.9,-10.9,GL_RECOVERED idle_ok
2026-07-12 00:58:47,14204,723.7,715.2,45.2,19.8,65,329.9,37.2,,380,-9.3,0,
2026-07-12 01:14:18,14204,741,732.8,45.2,19.8,65,347.6,41.5,,380,17.3,0,
2026-07-12 01:29:47,14204,715,706.9,45.2,19.8,65,326.7,32.4,,379,-26,0,
2026-07-12 01:45:10,14204,757,748.3,47.5,40.7,88.1,339.4,37.3,,399,42,2.3,PSS_SPIKE review=graphics+native
2026-07-12 02:00:38,14204,732.3,723.7,45.3,34.3,79.6,329.6,31.5,,393,-24.7,-2.2,
2026-07-12 02:15:59,14204,726.4,718,46.1,19.8,66,337.2,30.9,,381,-5.9,0.8,
2026-07-12 02:31:21,14204,748.7,740.4,46.8,40.7,87.4,337.3,31.4,,393,22.3,0.7,
2026-07-12 02:46:42,14204,732.8,724.5,46.1,19.8,66,337.8,35.9,,381,-15.9,-0.7,
2026-07-12 03:02:05,14204,722.4,714.1,46.1,19.8,66,328.9,34.1,,374,-10.4,0,
2026-07-12 03:17:26,14204,757.6,749.1,46.8,40.7,87.4,342.3,33.9,,385,35.2,0.7,
2026-07-12 03:32:47,14204,728.4,719.9,46.1,19.8,66,331.2,36.6,,376,-29.2,-0.7,
2026-07-12 03:48:08,14204,732.8,724.2,48.2,19.8,68,331.5,38,,380,4.4,2.1,
2026-07-12 04:03:29,14204,745.8,737.3,46.4,34.3,80.7,335.1,34,,401,13,-1.8,
2026-07-12 04:18:52,14204,740.6,731.1,46.1,19.8,66,346.6,30.5,,376,-5.2,-0.3,
2026-07-12 04:34:16,14204,732.6,723.1,42.1,19.8,61.9,342.5,30.7,,376,-8,-4,
2026-07-12 04:49:37,14204,733.8,724.4,48.2,19.8,68,335.1,32,,380,1.2,6.1,
2026-07-12 05:04:59,14204,757.5,748,46.8,40.7,87.4,342.7,28.6,,385,23.7,-1.4,
2026-07-12 05:20:18,14204,740.4,730.9,46.1,19.8,66,336.3,38.2,,376,-17.1,-0.7,
2026-07-12 05:35:39,14204,750.7,741.3,48.1,19.8,68,334.1,51.2,,381,10.3,2,
2026-07-12 05:50:59,14204,755.3,745.9,48.1,19.8,68,334.8,51.4,,381,4.6,0,
2026-07-12 06:06:21,14204,797.1,787.7,46.8,40.7,87.4,351.5,57.4,,400,41.8,-1.3,PSS_SPIKE review=graphics+native
2026-07-12 06:21:42,14204,766.5,757.1,46.1,19.8,66,346.9,52.2,,373,-30.6,-0.7,
2026-07-12 06:37:03,14204,763.7,754.4,46.1,19.8,66,348.5,47.2,,377,-2.8,0,
2026-07-12 06:52:25,14204,753.5,744.1,46.1,19.8,66,346.5,38.3,,377,-10.2,0,
2026-07-12 07:07:46,14204,772.9,763.6,46.4,34.3,80.7,351.7,37.6,,402,19.4,0.3,
2026-07-12 07:23:08,14204,758.4,749.1,46.1,19.8,66,353.3,35.2,,377,-14.5,-0.3,
2026-07-12 07:38:23,14204,752.9,743.6,46.1,19.8,66,352.4,30.1,,377,-5.5,0,
2026-07-12 07:53:43,14204,762.4,753.1,48.1,19.8,68,350.2,39.5,,377,9.5,2,
```

## incidents.log (tail)

```
[2026-07-10 22:49:41] PSS_SOFT_CEILING pss=823.9 gl=36.1 views=382 native_reclaim_advisory
[2026-07-10 23:05:06] PSS_SOFT_CEILING pss=844.5 gl=42.8 views=379 native_reclaim_advisory
[2026-07-10 23:20:31] PSS_SOFT_CEILING pss=845.4 gl=32.4 views=391 native_reclaim_advisory
[2026-07-10 23:35:59] PSS_SOFT_CEILING pss=821.2 gl=31.8 views=379 native_reclaim_advisory
[2026-07-10 23:51:26] PSS_SOFT_CEILING pss=809.9 gl=27.7 views=379 native_reclaim_advisory
[2026-07-11 08:00:00] DAILY_8AM_REPORT 2026-07-11 08:00:00 KST
[2026-07-11 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
[2026-07-11 08:02:05] DAILY_8AM_REPORT 2026-07-11 08:02:05 KST
[2026-07-11 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
[2026-07-11 08:04:06] DAILY_8AM_REPORT 2026-07-11 08:04:06 KST
[2026-07-11 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
[2026-07-11 08:06:09] DAILY_8AM_REPORT 2026-07-11 08:06:09 KST
[2026-07-11 08:06:09] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
[2026-07-11 08:08:12] DAILY_8AM_REPORT 2026-07-11 08:08:12 KST
[2026-07-11 08:08:12] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
[2026-07-11 08:10:13] DAILY_8AM_REPORT 2026-07-11 08:10:13 KST
[2026-07-11 08:10:13] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
[2026-07-11 08:12:16] DAILY_8AM_REPORT 2026-07-11 08:12:16 KST
[2026-07-11 08:12:16] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
[2026-07-11 08:14:17] DAILY_8AM_REPORT 2026-07-11 08:14:17 KST
[2026-07-11 08:14:17] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
[2026-07-11 10:51:51] PSS_SOFT_CEILING pss=813.8 gl=120.3 views=579 native_reclaim_advisory
[2026-07-11 11:07:15] VIEWS_NATIVE_ADVISORY views=562 native_heap=314.4 pss=737 gl=137.9 (node/list retention ??pre-hardceiling early warn)
[2026-07-11 11:53:33] VIEWS_NATIVE_ADVISORY views=512 native_heap=358.5 pss=716.4 gl=44.5 (node/list retention ??pre-hardceiling early warn)
[2026-07-12 08:00:00] DAILY_8AM_REPORT 2026-07-12 08:00:00 KST
```

## remediation.log (tail)

```
[2026-07-10 20:45:00] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-07-10 20:45:19] AUTO_FIX baseline reset pid=12074 gl=5.9MB pss=465.1MB
[2026-07-10 20:45:19] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-07-10 20:45:40] VERIFY PASS pid=12074 gl=8.5MB pss=594.3MB views=99
[2026-07-10 20:45:40] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":973.2,"views":561,"lastGlMb":130.3,"hardCeiling":true}
[2026-07-10 20:45:41] HANDOFF packed -> outbox/cursor-incident-handoff.md (Kim Team Lead triage)
[2026-07-10 21:01:05] INCIDENT GL_HARD_CEILING gl=120.9 pss=1075.4 views=561 -> immediate remediation (OOM imminent)
[2026-07-10 21:01:05] REFIX_REQUESTED gl_critical_active_hub -> gl-leak-refix-requested.flag
[2026-07-10 21:01:05] AUTO_FIX static audit:skia-memory start
[2026-07-10 21:01:07] AUTO_FIX audit:skia-memory PASS
[2026-07-10 21:01:07] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-07-10 21:01:25] AUTO_FIX baseline reset pid=12768 gl=4.4MB pss=367.2MB
[2026-07-10 21:01:25] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-07-10 21:01:48] VERIFY PASS pid=12768 gl=8.5MB pss=554.8MB views=99
[2026-07-10 21:01:48] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":1075.4,"views":561,"lastGlMb":120.9,"hardCeiling":true}
[2026-07-10 21:01:48] HANDOFF packed -> outbox/cursor-incident-handoff.md (Kim Team Lead triage)
[2026-07-10 22:34:16] INFO PSS_SOFT_CEILING pss=845.5 gl=40 views=380 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-10 22:49:41] INFO PSS_SOFT_CEILING pss=823.9 gl=36.1 views=382 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-10 23:05:06] INFO PSS_SOFT_CEILING pss=844.5 gl=42.8 views=379 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-10 23:20:31] INFO PSS_SOFT_CEILING pss=845.4 gl=32.4 views=391 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-10 23:35:59] INFO PSS_SOFT_CEILING pss=821.2 gl=31.8 views=379 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-10 23:51:26] INFO PSS_SOFT_CEILING pss=809.9 gl=27.7 views=379 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-11 10:51:51] INFO PSS_SOFT_CEILING pss=813.8 gl=120.3 views=579 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-11 11:07:15] INFO VIEWS_NATIVE_ADVISORY views=562 native_heap=314.4 pss=737 gl=137.9 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-11 11:53:33] INFO VIEWS_NATIVE_ADVISORY views=512 native_heap=358.5 pss=716.4 gl=44.5 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
```

## mem-alerts.log (tail)

```
[2026-07-09 09:23:14] GL +90.4MB views=559 (PSS 95.9MB) ??active hub
[2026-07-09 11:11:08] GL +88.1MB views=567 (PSS 67.3MB) ??active hub
[2026-07-09 11:42:05] PSS +80.8MB GL 15.2MB views=99
[2026-07-09 13:14:27] GL +23.3MB views=559 (PSS 24.8MB) ??active hub
[2026-07-09 17:05:24] PSS +65.4MB GL 14.6MB views=99
[2026-07-09 18:53:22] GL +8.5MB views=379 (PSS -3.3MB) ??active hub
[2026-07-09 21:43:06] PSS +100.6MB GL 16.9MB views=99
[2026-07-10 00:01:58] GL +11.1MB views=464 (PSS 24.3MB) ??active hub
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

