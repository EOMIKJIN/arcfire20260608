# Arcfire daily 08:00 KST auto report (mandatory perpetual)

Generated (KST): 2026-08-08 08:00:02
Package: com.arcfire.online

## Runtime

| pid | PSS (MB) | GL (MB) | Views |
|-----|----------|---------|-------|
| 21451 | 518.4 | 7.8 | 368 |

## mem-timeline (since DAILY_8AM_REPORT)

```csv
2026-08-08 00:29:04,19660,594.2,736.1,15.1,19.8,34.9,258.9,84.9,,17,,,
2026-08-08 00:44:39,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-08-08 00:59:40,21451,574.3,711,28.2,19.8,48.1,286.3,30.5,,347,,,
2026-08-08 01:15:05,21451,667,810,40.3,34.3,74.6,326.9,47.5,,374,,,
2026-08-08 01:30:31,21451,649.6,793.7,38,19.8,57.9,323.5,44.8,,347,-17.4,-2.3,
2026-08-08 01:45:59,21451,664.1,808.3,36,19.8,55.9,333.5,46,,347,14.5,-2,
2026-08-08 02:01:24,21451,671.4,815.7,34,19.8,53.8,337.2,47.5,,347,7.3,-2,
2026-08-08 02:16:51,21451,657.9,802.3,38,19.8,57.9,322.3,41.7,,347,-13.5,4,
2026-08-08 02:32:17,21451,662.8,807,36,19.8,55.9,338.6,33.2,,347,4.9,-2,
2026-08-08 02:47:42,21451,684.2,828.5,40.7,40.7,81.3,333,34.6,,374,21.4,4.7,
2026-08-08 03:03:08,21451,648.7,793.4,34.2,19.8,54.1,326.5,41.3,,367,-35.5,-6.5,GL_RECOVERED idle_ok
2026-08-08 03:18:38,21451,658,802.6,36.5,34.3,70.8,326.3,38.7,,384,9.3,2.3,
2026-08-08 03:34:03,21451,633.5,777.9,36.3,19.8,56.1,321.8,37.5,,365,-24.5,-0.2,
2026-08-08 03:49:29,21451,631,774,36.3,19.8,56.1,324.4,37.2,,365,-2.5,0,
2026-08-08 04:04:53,21451,620.1,763.1,36.3,19.8,56.1,323.4,31,,365,-10.9,0,
2026-08-08 04:20:19,21451,627.6,770.6,38.3,19.8,58.1,323.2,36.7,,365,7.5,2,
2026-08-08 04:35:45,21451,631,774,36.3,19.8,56.1,325.1,40.2,,365,3.4,-2,
2026-08-08 04:51:11,21451,654.5,797.6,40.6,34.3,75,331.4,38,,367,23.5,4.3,
2026-08-08 05:06:37,21451,663,806.1,42.6,34.3,76.9,330.6,44.8,,385,8.5,2,
2026-08-08 05:22:01,21451,630.3,773.4,36.3,19.8,56.1,324.3,38.9,,365,-32.7,-6.3,GL_RECOVERED idle_ok
2026-08-08 05:37:28,21451,646.3,789.6,36.3,19.8,56.1,325.4,52,,365,16,0,
2026-08-08 05:52:54,21451,653.8,797.1,36.3,19.8,56.1,338,46.8,,365,7.5,0,
2026-08-08 06:08:18,21451,662.6,806.1,40.6,34.3,74.9,334,41,,391,8.8,4.3,
2026-08-08 06:23:44,21451,632.7,776.1,36.3,19.8,56.1,328.6,35,,368,-29.9,-4.3,
2026-08-08 06:39:10,21451,640.3,783.8,38.3,19.8,58.1,327.7,40.7,,364,7.6,2,
2026-08-08 06:54:38,21451,640.4,783.8,36.3,19.8,56.1,327.1,42.2,,368,0.1,-2,
2026-08-08 07:10:04,21451,648.9,792.2,36.3,19.8,56.1,336.9,40.8,,368,8.5,0,
2026-08-08 07:25:30,21451,534.7,245.6,7.8,,7.8,13.3,24.9,,368,-114.2,-28.5,GL_RECOVERED idle_ok
2026-08-08 07:40:57,21451,540.8,255.2,7.8,,7.8,14.8,31.4,,368,6.1,0,
2026-08-08 07:56:24,21451,524.7,241.3,7.8,,7.8,15.1,31.5,,368,-16.1,0,
```

## incidents.log (tail)

```
[2026-08-05 18:59:22] VIEWS_NATIVE_ADVISORY views=367 native_heap=436.3 pss=796.1 gl=44 (node/list retention ??pre-hardceiling early warn)
[2026-08-05 19:14:56] PSS_SOFT_CEILING pss=814.5 gl=39.9 views=371 native_reclaim_advisory
[2026-08-05 19:30:25] PSS_SOFT_CEILING pss=826.4 gl=33 views=371 native_reclaim_advisory
[2026-08-05 19:45:55] PSS_SOFT_CEILING pss=838.3 gl=33 views=368 native_reclaim_advisory
[2026-08-06 00:24:33] PSS_SOFT_CEILING pss=811.8 gl=127.2 views=577 native_reclaim_advisory
[2026-08-06 02:28:39] PSS_SOFT_CEILING pss=811.8 gl=37.4 views=390 native_reclaim_advisory
[2026-08-06 04:47:45] PSS_SOFT_CEILING pss=801 gl=41.4 views=400 native_reclaim_advisory
[2026-08-06 06:35:50] PSS_SOFT_CEILING pss=810.9 gl=41.5 views=378 native_reclaim_advisory
[2026-08-06 08:00:00] DAILY_8AM_REPORT 2026-08-06 08:00:00 KST
[2026-08-06 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260806-0800.md verdict=WARN
[2026-08-06 08:02:06] DAILY_8AM_REPORT 2026-08-06 08:02:06 KST
[2026-08-06 08:02:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260806-0800.md verdict=WARN
[2026-08-06 08:04:08] DAILY_8AM_REPORT 2026-08-06 08:04:08 KST
[2026-08-06 08:04:08] DAILY_8AM_REPORT_FAIL D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260806-0800.md MEMINFO_ERROR ??Command failed: adb shell pidof com.arcfire.online
[2026-08-06 08:06:09] DAILY_8AM_REPORT 2026-08-06 08:06:09 KST
[2026-08-06 08:06:09] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260806-0800.md verdict=OK
[2026-08-06 08:08:10] DAILY_8AM_REPORT 2026-08-06 08:08:10 KST
[2026-08-06 08:08:10] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260806-0800.md verdict=OK
[2026-08-06 08:10:11] DAILY_8AM_REPORT 2026-08-06 08:10:11 KST
[2026-08-06 08:10:11] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260806-0800.md verdict=OK
[2026-08-06 08:12:14] DAILY_8AM_REPORT 2026-08-06 08:12:14 KST
[2026-08-06 08:12:14] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260806-0800.md verdict=OK
[2026-08-06 08:14:16] DAILY_8AM_REPORT 2026-08-06 08:14:16 KST
[2026-08-06 08:14:16] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260806-0800.md verdict=OK
[2026-08-08 08:00:00] DAILY_8AM_REPORT 2026-08-08 08:00:00 KST
```

## remediation.log (tail)

```
[2026-08-05 15:52:50] INCIDENT GL_HARD_CEILING gl=43.1 pss=999.1 views=399 -> immediate remediation (OOM imminent)
[2026-08-05 15:52:50] REFIX_REQUESTED gl_critical_active_hub -> gl-leak-refix-requested.flag
[2026-08-05 15:52:50] AUTO_FIX static audit:skia-memory start
[2026-08-05 15:52:52] AUTO_FIX audit:skia-memory PASS
[2026-08-05 15:52:52] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-08-05 15:53:11] AUTO_FIX baseline reset pid=25612 gl=6MB pss=199.6MB
[2026-08-05 15:53:11] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-08-05 15:53:31] VERIFY PASS pid=25612 gl=10MB pss=714.2MB views=229
[2026-08-05 15:53:31] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":999.1,"views":399,"lastGlMb":43.1,"hardCeiling":true}
[2026-08-05 15:53:32] HANDOFF packed -> outbox/cursor-incident-handoff.md (Kim Team Lead triage)
[2026-08-05 15:57:33] INVESTIGATION start reason=mem_anomaly
[2026-08-05 15:57:33] INVESTIGATION alert=[2026-08-05 15:52:50] GL_HARD_CEILING gl=43.1 pss=999.1 views=399
[2026-08-05 15:57:35] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260805-155733.log
[2026-08-05 15:57:37] INVESTIGATION mem from timeline gl=10MB pss=714.2MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260805-155733.log
[2026-08-05 15:57:38] packed D:\arcfire20260607\tools\long-run-monitor\outbox\cursor-incident-handoff.md
[2026-08-05 15:57:38] INVESTIGATION trigger -> .cursor/trigger-incident-auto-fix.json
[2026-08-05 15:57:38] INVESTIGATION done reason=mem_anomaly
[2026-08-05 18:59:22] INFO VIEWS_NATIVE_ADVISORY views=367 native_heap=436.3 pss=796.1 gl=44 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-05 19:14:56] INFO PSS_SOFT_CEILING pss=814.5 gl=39.9 views=371 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-05 19:30:25] INFO PSS_SOFT_CEILING pss=826.4 gl=33 views=371 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-05 19:45:55] INFO PSS_SOFT_CEILING pss=838.3 gl=33 views=368 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-06 00:24:33] INFO PSS_SOFT_CEILING pss=811.8 gl=127.2 views=577 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-06 02:28:39] INFO PSS_SOFT_CEILING pss=811.8 gl=37.4 views=390 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-06 04:47:45] INFO PSS_SOFT_CEILING pss=801 gl=41.4 views=400 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-06 06:35:50] INFO PSS_SOFT_CEILING pss=810.9 gl=41.5 views=378 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
```

## mem-alerts.log (tail)

```
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
[2026-08-05 13:48:30] PSS +154.6MB GL 12.5MB views=99
[2026-08-05 14:04:03] PSS +131.2MB GL 11.9MB views=99
[2026-08-05 17:41:44] GL +8.7MB views=384 (PSS 22.3MB) ??active hub
[2026-08-05 18:59:12] PSS +68.3MB GL 44MB views=367
[2026-08-06 00:24:25] GL +83.5MB views=577 (PSS 74.9MB) ??active hub
[2026-08-06 08:55:08] PSS +142.6MB GL 11.1MB views=252
[2026-08-06 09:10:40] PSS +64.8MB GL 10.9MB views=99
[2026-08-06 09:26:15] CRITICAL process not running ??check crash-*.log
[2026-08-06 12:31:29] CRITICAL process not running ??check crash-*.log
[2026-08-07 23:27:32] CRITICAL process not running ??check crash-*.log
[2026-08-08 00:44:39] CRITICAL process not running ??check crash-*.log
```

## KPI (overnight window)

| Metric | Count |
|--------|-------|
| GL_HARD_CEILING incidents | 47 |
| Crash / PROCESS_DEATH | 95 |
| Auto app relaunch | 48 |

## Action items for Kim Team Lead

1. GL_HARD_CEILING or 3x GL_SPIKE ??P0 hub Skia audit (see overnight-watch handoff).
2. SIGSEGV/FATAL ??arcfire-bug-debug-workflow + logcat tail in latest crash-*.log.
3. Stair-step floor rise without crash ??today's dev P0 list in overnight-watch handoff.

