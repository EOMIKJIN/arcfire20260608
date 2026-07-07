# Arcfire daily 08:00 KST auto report (mandatory perpetual)

Generated (KST): 2026-07-07 08:00:03
Package: com.arcfire.online

## Runtime

| pid | PSS (MB) | GL (MB) | Views |
|-----|----------|---------|-------|
| 12334 | 794 | 66.1 | 363 |

## mem-timeline (since DAILY_8AM_REPORT)

```csv
2026-07-07 00:25:19,12334,750,622.8,45.3,19.8,65.1,274.4,39.1,,360,-20.9,-10.7,GL_RECOVERED idle_ok
2026-07-07 00:40:46,12334,764.9,605.4,61.6,19.8,81.4,255.4,48.6,,353,14.9,16.3,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-07-07 00:56:17,12334,760.5,580.2,61.7,19.8,81.6,226.9,37.1,,366,-4.4,0.1,
2026-07-07 01:11:42,12334,754.4,574.1,61.7,19.8,81.6,227.6,31.7,,366,-6.1,0,
2026-07-07 01:27:08,12334,755.3,577.5,63.7,19.8,83.6,229.9,27.7,,355,0.9,2,
2026-07-07 01:42:34,12334,767.3,589.5,61.7,19.8,81.6,234.8,36.6,,363,12,-2,
2026-07-07 01:58:01,12334,770.2,592.6,63.9,19.8,83.7,238.8,32.8,,366,2.9,2.2,
2026-07-07 02:13:26,12334,763.7,586.1,61.9,19.8,81.7,229.6,36.7,,363,-6.5,-2,
2026-07-07 02:28:54,12334,772.1,594.5,61.9,19.8,81.7,241.4,32.9,,355,8.4,0,
2026-07-07 02:44:16,12334,760.9,583.4,62,19.8,81.8,236.1,27.1,,362,-11.2,0.1,
2026-07-07 02:59:38,12334,780.2,602.9,64,19.8,83.8,243.1,36.7,,362,19.3,2,
2026-07-07 03:15:00,12334,757.8,580.6,62,19.8,81.8,232.6,26.5,,357,-22.4,-2,
2026-07-07 03:30:21,12334,768.1,591,64,19.8,83.8,232.1,35,,349,10.3,2,
2026-07-07 03:45:42,12334,765.6,588.6,68.1,19.8,87.9,231.7,28.1,,347,-2.5,4.1,
2026-07-07 04:01:03,12334,759.8,582.8,62,19.8,81.8,232.9,26.6,,353,-5.8,-6.1,GL_RECOVERED idle_ok
2026-07-07 04:16:23,12334,773.6,596.6,66.1,19.8,85.9,236.5,32.1,,361,13.8,4.1,
2026-07-07 04:31:42,12334,767.6,590.6,66.1,19.8,85.9,236.6,25.5,,357,-6,0,
2026-07-07 04:47:02,12334,772.7,595.8,66.1,19.8,85.9,234.8,32,,360,5.1,0,
2026-07-07 05:02:21,12334,771,594.1,66.1,19.8,85.9,236.4,28.1,,361,-1.7,0,
2026-07-07 05:17:42,12334,788.4,611.5,66.2,20,86.2,246.4,34.5,,360,17.4,0.1,
2026-07-07 05:33:01,12334,795.7,618.4,66.7,40.7,107.3,240.6,25.9,,374,7.3,0.5,
2026-07-07 05:48:21,12334,807.4,630.1,66.7,40.7,107.3,252.8,25.1,,372,11.7,0,
2026-07-07 06:03:41,12334,805.6,629.8,66.3,34.3,100.6,250.2,32.8,,389,-1.8,-0.4,
2026-07-07 06:19:03,12334,778.7,603.1,66.1,19.8,85.9,238.3,29.1,,356,-26.9,-0.2,
2026-07-07 06:34:24,12334,795.2,619.6,68.1,19.8,87.9,251.7,30.1,,356,16.5,2,
2026-07-07 06:49:44,12334,780.6,605,66.1,19.8,85.9,240,29,,363,-14.6,-2,
2026-07-07 07:05:04,12334,791.3,615.9,66.1,19.8,85.9,247.6,32.1,,360,10.7,0,
2026-07-07 07:20:20,12334,811.8,636.3,66.3,34.3,100.6,258.2,26.7,,381,20.5,0.2,
2026-07-07 07:35:39,12334,791.3,615.7,62,19.8,81.8,255.4,27.9,,361,-20.5,-4.3,
2026-07-07 07:51:00,12334,792.5,617.1,66.1,19.8,85.9,254.4,25.8,,360,1.2,4.1,
```

## incidents.log (tail)

```
[2026-07-06 02:54:07] PSS_SOFT_CEILING pss=832.6 gl=146.6 views=384 native_reclaim_advisory
[2026-07-06 03:09:29] PSS_SOFT_CEILING pss=826.5 gl=144.6 views=381 native_reclaim_advisory
[2026-07-06 03:24:51] GL_HARD_CEILING gl=218.4 pss=914.2 views=558
[2026-07-06 03:24:51] REFIX_REQUESTED gl_critical_active_hub
[2026-07-06 03:28:58] INVESTIGATION_TRIGGERED mem_anomaly
[2026-07-06 08:00:00] DAILY_8AM_REPORT 2026-07-06 08:00:00 KST
[2026-07-06 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
[2026-07-06 08:02:04] DAILY_8AM_REPORT 2026-07-06 08:02:04 KST
[2026-07-06 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
[2026-07-06 08:04:06] DAILY_8AM_REPORT 2026-07-06 08:04:06 KST
[2026-07-06 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
[2026-07-06 08:06:07] DAILY_8AM_REPORT 2026-07-06 08:06:07 KST
[2026-07-06 08:06:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
[2026-07-06 08:08:08] DAILY_8AM_REPORT 2026-07-06 08:08:08 KST
[2026-07-06 08:08:08] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
[2026-07-06 08:10:10] DAILY_8AM_REPORT 2026-07-06 08:10:10 KST
[2026-07-06 08:10:10] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
[2026-07-06 08:12:11] DAILY_8AM_REPORT 2026-07-06 08:12:11 KST
[2026-07-06 08:12:11] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
[2026-07-06 08:14:12] DAILY_8AM_REPORT 2026-07-06 08:14:12 KST
[2026-07-06 08:14:12] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
[2026-07-07 05:48:26] PSS_SOFT_CEILING pss=807.4 gl=66.7 views=372 native_reclaim_advisory
[2026-07-07 06:03:48] PSS_SOFT_CEILING pss=805.6 gl=66.3 views=389 native_reclaim_advisory
[2026-07-07 07:20:24] PSS_SOFT_CEILING pss=811.8 gl=66.3 views=381 native_reclaim_advisory
[2026-07-07 08:00:00] DAILY_8AM_REPORT 2026-07-07 08:00:00 KST
```

## remediation.log (tail)

```
[2026-07-06 02:08:03] INFO PSS_SOFT_CEILING pss=847.4 gl=144.6 views=380 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-06 02:23:23] INFO PSS_SOFT_CEILING pss=835.6 gl=144.6 views=392 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-06 02:38:46] INFO PSS_SOFT_CEILING pss=832.5 gl=146.6 views=388 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-06 02:54:07] INFO PSS_SOFT_CEILING pss=832.6 gl=146.6 views=384 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-06 03:09:29] INFO PSS_SOFT_CEILING pss=826.5 gl=144.6 views=381 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-06 03:24:51] INCIDENT GL_HARD_CEILING gl=218.4 pss=914.2 views=558 -> immediate remediation (OOM imminent)
[2026-07-06 03:24:51] REFIX_REQUESTED gl_critical_active_hub -> gl-leak-refix-requested.flag
[2026-07-06 03:24:51] AUTO_FIX static audit:skia-memory start
[2026-07-06 03:24:54] AUTO_FIX audit:skia-memory PASS
[2026-07-06 03:24:54] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-07-06 03:25:11] AUTO_FIX baseline reset pid=12334 gl=6MB pss=187.8MB
[2026-07-06 03:25:11] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-07-06 03:25:33] VERIFY PASS pid=12334 gl=8.5MB pss=629MB views=99
[2026-07-06 03:25:33] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":914.2,"views":558,"lastGlMb":218.4,"hardCeiling":true}
[2026-07-06 03:25:34] HANDOFF packed -> outbox/cursor-incident-handoff.md (Kim Team Lead triage)
[2026-07-06 03:28:54] INVESTIGATION start reason=mem_anomaly
[2026-07-06 03:28:54] INVESTIGATION alert=[2026-07-06 03:24:51] GL_HARD_CEILING gl=218.4 pss=914.2 views=558
[2026-07-06 03:28:55] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260706-032854.log
[2026-07-06 03:28:57] INVESTIGATION mem from timeline gl=8.5MB pss=629MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260706-032854.log
[2026-07-06 03:28:57] packed D:\arcfire20260607\tools\long-run-monitor\outbox\cursor-incident-handoff.md
[2026-07-06 03:28:58] INVESTIGATION trigger -> .cursor/trigger-incident-auto-fix.json
[2026-07-06 03:28:58] INVESTIGATION done reason=mem_anomaly
[2026-07-07 05:48:26] INFO PSS_SOFT_CEILING pss=807.4 gl=66.7 views=372 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-07 06:03:48] INFO PSS_SOFT_CEILING pss=805.6 gl=66.3 views=389 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-07 07:20:24] INFO PSS_SOFT_CEILING pss=811.8 gl=66.3 views=381 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
```

## mem-alerts.log (tail)

```
[2026-07-04 17:33:42] PSS +47.4MB GL 51.2MB views=398
[2026-07-04 20:53:18] PSS +50.3MB GL 24.5MB views=369
[2026-07-04 21:24:14] PSS +40.5MB GL 26.3MB views=385
[2026-07-04 21:39:44] GL +16.1MB views=389 (PSS -11.7MB) ??active hub
[2026-07-05 00:28:50] GL +11.4MB views=322 (PSS 115.5MB) ??active hub
[2026-07-05 00:44:10] GL +97.5MB views=374 (PSS 68.4MB) ??active hub
[2026-07-05 09:41:30] PSS +55MB GL 30.1MB views=369
[2026-07-05 09:56:51] PSS +95.1MB GL 35.3MB views=372
[2026-07-05 10:12:21] GL +93.8MB views=323 (PSS 247.9MB) ??active hub
[2026-07-05 11:45:12] GL +117MB views=559 (PSS 165.8MB) ??active hub
[2026-07-05 13:02:12] GL +16.6MB views=366 (PSS 17.5MB) ??active hub
[2026-07-05 14:49:40] GL +81.6MB views=567 (PSS 115.9MB) ??active hub
[2026-07-05 16:52:27] GL +107.6MB views=371 (PSS 114.1MB) ??active hub
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
```

## KPI (overnight window)

| Metric | Count |
|--------|-------|
| GL_HARD_CEILING incidents | 27 |
| Crash / PROCESS_DEATH | 95 |
| Auto app relaunch | 27 |

## Action items for Kim Team Lead

1. GL_HARD_CEILING or 3x GL_SPIKE ??P0 hub Skia audit (see overnight-watch handoff).
2. SIGSEGV/FATAL ??arcfire-bug-debug-workflow + logcat tail in latest crash-*.log.
3. Stair-step floor rise without crash ??today's dev P0 list in overnight-watch handoff.

