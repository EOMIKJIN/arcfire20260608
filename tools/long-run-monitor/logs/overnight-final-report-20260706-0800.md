# Arcfire daily 08:00 KST auto report (mandatory perpetual)

Generated (KST): 2026-07-06 08:00:02
Package: com.arcfire.online

## Runtime

| pid | PSS (MB) | GL (MB) | Views |
|-----|----------|---------|-------|
| 12334 | 565 | 31.9 | 99 |

## mem-timeline (since DAILY_8AM_REPORT)

```csv
2026-07-06 00:35:36,24957,616.1,542.1,42.3,19.8,62.1,208.5,39.5,,370,-45.7,-4,
2026-07-06 00:51:00,24957,623.5,552.6,42.5,34.3,76.8,211.7,33.4,,394,7.4,0.2,
2026-07-06 01:06:26,24957,608.5,538.2,42.3,19.8,62.1,214.9,30.5,,368,-15,-0.2,
2026-07-06 01:21:51,24957,892.6,846.5,152.6,40.7,193.3,328.2,48,,334,284.1,110.3,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-07-06 01:37:18,24957,856.3,811,146.6,19.8,166.4,341.1,65.7,,388,-36.3,-6,GL_RECOVERED idle_ok
2026-07-06 01:52:38,24957,845.3,800.2,146.6,19.8,166.4,342.3,49,,388,-11,0,
2026-07-06 02:07:58,24957,847.4,802.5,144.6,19.8,164.4,333.4,61.8,,380,2.1,-2,
2026-07-06 02:23:19,24957,835.6,790.8,144.6,19.8,164.4,336.2,46.8,,392,-11.8,0,
2026-07-06 02:38:39,24957,832.5,787.9,146.6,19.8,166.4,335,43,,388,-3.1,2,
2026-07-06 02:54:01,24957,832.6,789.1,146.6,19.8,166.4,341.2,37.5,,384,0.1,0,
2026-07-06 03:09:23,24957,826.5,782.9,144.6,19.8,164.4,343,30.9,,381,-6.1,-2,
2026-07-06 03:24:44,24957,914.2,864.7,218.4,19.8,238.2,355.8,33.3,,558,87.7,73.8,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-07-06 03:25:33,12334,629,,8.5,,,,,,99,,,POST_REMEDIATION_VERIFY_OK
2026-07-06 03:40:52,12334,720.1,857,49.8,40.7,90.5,370.2,29.9,,325,,,
2026-07-06 03:56:15,12334,756.1,892.8,38.8,19.8,58.6,407.8,61.1,,383,36,-11,GL_RECOVERED idle_ok
2026-07-06 04:11:38,12334,665.8,804.4,31,19.8,50.8,348.1,36.4,,99,-90.3,-7.8,GL_RECOVERED idle_ok
2026-07-06 04:26:59,12334,672.4,810.8,32,19.8,51.8,357.8,38.6,,99,6.6,1,
2026-07-06 04:42:20,12334,666.1,804.5,32,19.8,51.8,351.4,37.4,,99,-6.3,0,
2026-07-06 04:57:41,12334,675,813.6,32,19.8,51.8,353.5,44.2,,99,8.9,0,
2026-07-06 05:13:02,12334,683.1,821.8,32,19.8,51.8,354.4,38.9,,99,8.1,0,
2026-07-06 05:28:29,12334,679.3,818,32,19.8,51.8,347.6,39.9,,99,-3.8,0,
2026-07-06 05:43:49,12334,688.2,826.9,32,19.8,51.8,348.4,46.3,,99,8.9,0,
2026-07-06 05:59:10,12334,687.4,826.4,31.9,19.8,51.8,348.6,45.8,,99,-0.8,-0.1,
2026-07-06 06:14:32,12334,696.2,834.9,31.9,19.8,51.8,360.6,47.3,,99,8.8,0,
2026-07-06 06:29:53,12334,570.7,374.3,31.9,19.8,51.7,113.6,26.9,,99,-125.5,0,
2026-07-06 06:45:14,12334,577.6,386.2,31.9,19.8,51.7,116.6,33.2,,99,6.9,0,
2026-07-06 07:00:34,12334,577.9,386.7,31.9,19.8,51.7,116.6,33.7,,99,0.3,0,
2026-07-06 07:15:55,12334,576.2,390.7,31.9,19.8,51.7,116.7,37.4,,99,-1.7,0,
2026-07-06 07:31:17,12334,567.9,392.8,31.9,19.8,51.7,129.2,27.3,,99,-8.3,0,
2026-07-06 07:46:39,12334,565,390,31.9,19.8,51.7,124.5,29.2,,99,-2.9,0,
```

## incidents.log (tail)

```
[2026-07-05 17:39:23] PSS_SOFT_CEILING pss=864.6 gl=48.8 views=296 native_reclaim_advisory
[2026-07-05 17:54:46] PSS_SOFT_CEILING pss=883.1 gl=50 views=344 native_reclaim_advisory
[2026-07-05 18:10:10] PSS_SOFT_CEILING pss=905.8 gl=50.3 views=394 native_reclaim_advisory
[2026-07-05 18:25:31] GL_HARD_CEILING gl=154.2 pss=1074.1 views=559
[2026-07-05 18:25:31] REFIX_REQUESTED gl_critical_active_hub
[2026-07-05 18:30:32] INVESTIGATION_TRIGGERED mem_anomaly
[2026-07-05 19:27:49] PSS_SOFT_CEILING pss=838.9 gl=138.4 views=324 native_reclaim_advisory
[2026-07-05 19:43:13] PSS_SOFT_CEILING pss=821.5 gl=120.3 views=374 native_reclaim_advisory
[2026-07-05 19:58:34] PSS_SOFT_CEILING pss=871.5 gl=125 views=378 native_reclaim_advisory
[2026-07-05 20:13:57] PSS_SOFT_CEILING pss=843.6 gl=122.4 views=374 native_reclaim_advisory
[2026-07-05 20:29:20] PSS_SOFT_CEILING pss=859.3 gl=124.9 views=396 native_reclaim_advisory
[2026-07-05 20:44:49] PSS_SOFT_CEILING pss=834.6 gl=124.7 views=375 native_reclaim_advisory
[2026-07-05 21:31:01] PSS_SOFT_CEILING pss=907.2 gl=159.2 views=388 native_reclaim_advisory
[2026-07-06 01:21:58] PSS_SOFT_CEILING pss=892.6 gl=152.6 views=334 native_reclaim_advisory
[2026-07-06 01:37:23] PSS_SOFT_CEILING pss=856.3 gl=146.6 views=388 native_reclaim_advisory
[2026-07-06 01:52:43] PSS_SOFT_CEILING pss=845.3 gl=146.6 views=388 native_reclaim_advisory
[2026-07-06 02:08:03] PSS_SOFT_CEILING pss=847.4 gl=144.6 views=380 native_reclaim_advisory
[2026-07-06 02:23:23] PSS_SOFT_CEILING pss=835.6 gl=144.6 views=392 native_reclaim_advisory
[2026-07-06 02:38:46] PSS_SOFT_CEILING pss=832.5 gl=146.6 views=388 native_reclaim_advisory
[2026-07-06 02:54:07] PSS_SOFT_CEILING pss=832.6 gl=146.6 views=384 native_reclaim_advisory
[2026-07-06 03:09:29] PSS_SOFT_CEILING pss=826.5 gl=144.6 views=381 native_reclaim_advisory
[2026-07-06 03:24:51] GL_HARD_CEILING gl=218.4 pss=914.2 views=558
[2026-07-06 03:24:51] REFIX_REQUESTED gl_critical_active_hub
[2026-07-06 03:28:58] INVESTIGATION_TRIGGERED mem_anomaly
[2026-07-06 08:00:00] DAILY_8AM_REPORT 2026-07-06 08:00:00 KST
```

## remediation.log (tail)

```
[2026-07-06 01:21:58] INFO PSS_SOFT_CEILING pss=892.6 gl=152.6 views=334 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-06 01:37:23] INFO PSS_SOFT_CEILING pss=856.3 gl=146.6 views=388 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-06 01:52:43] INFO PSS_SOFT_CEILING pss=845.3 gl=146.6 views=388 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
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
```

## mem-alerts.log (tail)

```
[2026-07-04 13:28:14] CRITICAL process not running ??check crash-*.log
[2026-07-04 15:15:29] CRITICAL process not running ??check crash-*.log
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

