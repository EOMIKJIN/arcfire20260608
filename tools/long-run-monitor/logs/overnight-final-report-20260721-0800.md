# Arcfire daily 08:00 KST auto report (mandatory perpetual)

Generated (KST): 2026-07-21 08:00:02
Package: com.arcfire.online

## Runtime

| pid | PSS (MB) | GL (MB) | Views |
|-----|----------|---------|-------|
| 29524 | 939.5 | 156.9 | 559 |

## mem-timeline (since DAILY_8AM_REPORT)

```csv
2026-07-21 00:31:00,29524,583.4,,8.5,,,,,,99,,,POST_REMEDIATION_VERIFY_OK
2026-07-21 00:46:20,29524,516.1,644.1,8.5,19.8,28.3,240.4,32,,99,,,
2026-07-21 01:01:48,29524,778.3,910.8,53.9,40.7,94.6,393.4,46.6,,312,262.2,45.4,HUB_ACTIVATION gl_mount_ok
2026-07-21 01:17:14,29524,772,904.8,60.5,40.7,101.2,397,32.5,,329,-6.3,6.6,
2026-07-21 01:32:40,29524,788.9,921.7,51.8,40.7,92.5,413.9,39.8,,392,16.9,-8.7,GL_RECOVERED idle_ok
2026-07-21 01:48:05,29524,785.7,918.8,51.2,19.8,71.1,412.2,52.9,,377,-3.2,-0.6,
2026-07-21 02:03:31,29524,790.6,918.2,49.2,19.8,69,415.8,45.1,,377,4.9,-2,
2026-07-21 02:18:56,29524,797.9,925.7,50.2,19.8,70.1,417.5,44.3,,377,7.3,1,
2026-07-21 02:34:21,29524,764.7,895.7,50.2,19.8,70,418,23.9,,377,-33.2,0,
2026-07-21 02:49:46,29524,778.6,909.5,52.5,19.8,72.3,414.1,41.2,,381,13.9,2.3,
2026-07-21 03:05:12,29524,766.3,897.2,52.5,19.8,72.3,411.6,35.4,,374,-12.3,0,
2026-07-21 03:20:38,29524,769.6,901.2,52.5,19.8,72.3,419.3,35.5,,378,3.3,0,
2026-07-21 03:36:02,29524,759,890.7,50.4,19.8,70.3,414.1,36.2,,378,-10.6,-2.1,
2026-07-21 03:51:27,29524,775.2,906.9,50.4,19.8,70.3,418,52.6,,374,16.2,0,
2026-07-21 04:06:53,29524,714.8,695.4,50.7,34.3,85,299.7,48.7,,403,-60.4,0.3,
2026-07-21 04:22:19,29524,702.9,683.4,50.4,19.8,70.3,298.6,49,,378,-11.9,-0.3,
2026-07-21 04:37:44,29524,696.4,676.9,50.4,19.8,70.3,295.6,44.9,,374,-6.5,0,
2026-07-21 04:53:10,29524,709.8,690.3,50.4,19.8,70.3,304.5,49.3,,374,13.4,0,
2026-07-21 05:08:36,29524,702,682.6,50.4,19.8,70.3,298.3,47,,374,-7.8,0,
2026-07-21 05:24:01,29524,717.8,698.3,53.1,40.7,93.7,299.8,37.9,,381,15.8,2.7,
2026-07-21 05:39:27,29524,694.9,675.4,52.4,19.8,72.3,296.6,39.2,,378,-22.9,-0.7,
2026-07-21 05:54:51,29524,715.8,695.7,52.7,34.3,87,302.5,39.5,,403,20.9,0.3,
2026-07-21 06:10:15,29524,700.3,679.8,50.4,19.8,70.3,297.6,44,,378,-15.5,-2.3,
2026-07-21 06:25:41,29524,710.6,690.1,50.7,34.3,85,301.9,35.2,,403,10.3,0.3,
2026-07-21 06:41:07,29524,695,674.3,50.4,19.8,70.3,306.4,37.8,,378,-15.6,-0.3,
2026-07-21 06:56:35,29524,716.4,695.7,54.7,34.3,89,301.6,44.8,,395,21.4,4.3,
2026-07-21 07:12:01,29524,828.5,819.8,150,19.8,169.9,351.2,32.9,,560,112.1,95.3,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-07-21 07:27:27,29524,743.1,742.3,52.5,40.7,93.2,340.9,33.4,,307,-85.4,-97.5,GL_RECOVERED idle_ok
2026-07-21 07:42:59,29524,863.3,938.8,157,19.9,176.9,412.1,46.9,,561,120.2,104.5,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-07-21 07:58:28,29524,949.5,1025.3,152.9,19.8,172.7,495.8,46.6,,559,86.2,-4.1,PSS_SPIKE review=graphics+native
```

## incidents.log (tail)

```
[2026-07-20 19:52:25] VIEWS_NATIVE_ADVISORY views=373 native_heap=475.9 pss=778.4 gl=53 (node/list retention ??pre-hardceiling early warn)
[2026-07-20 20:07:52] PSS_SOFT_CEILING pss=808.1 gl=51.7 views=402 native_reclaim_advisory
[2026-07-20 20:23:18] PSS_SOFT_CEILING pss=898.4 gl=147.5 views=560 native_reclaim_advisory
[2026-07-20 20:38:47] PSS_SOFT_CEILING pss=809.5 gl=55.4 views=402 native_reclaim_advisory
[2026-07-20 20:54:13] VIEWS_NATIVE_ADVISORY views=377 native_heap=459.2 pss=793.1 gl=52.8 (node/list retention ??pre-hardceiling early warn)
[2026-07-20 21:09:39] VIEWS_NATIVE_ADVISORY views=386 native_heap=451.5 pss=774.6 gl=41.8 (node/list retention ??pre-hardceiling early warn)
[2026-07-20 21:25:04] PSS_SOFT_CEILING pss=800.2 gl=55.9 views=386 native_reclaim_advisory
[2026-07-20 21:40:30] VIEWS_NATIVE_ADVISORY views=386 native_heap=470.6 pss=780.5 gl=43 (node/list retention ??pre-hardceiling early warn)
[2026-07-20 21:55:56] VIEWS_NATIVE_ADVISORY views=386 native_heap=470.1 pss=775.7 gl=43 (node/list retention ??pre-hardceiling early warn)
[2026-07-20 22:11:22] PSS_SOFT_CEILING pss=906.3 gl=140.3 views=560 native_reclaim_advisory
[2026-07-20 22:26:52] PSS_SOFT_CEILING pss=928.4 gl=130.4 views=567 native_reclaim_advisory
[2026-07-20 22:42:18] PSS_SOFT_CEILING pss=940.4 gl=132.4 views=567 native_reclaim_advisory
[2026-07-20 22:57:44] PSS_SOFT_CEILING pss=931.8 gl=132.4 views=567 native_reclaim_advisory
[2026-07-20 23:13:08] PSS_SOFT_CEILING pss=931.5 gl=130.4 views=567 native_reclaim_advisory
[2026-07-20 23:28:34] PSS_SOFT_CEILING pss=934.5 gl=130.4 views=567 native_reclaim_advisory
[2026-07-20 23:44:01] PSS_SOFT_CEILING pss=930.7 gl=130.4 views=567 native_reclaim_advisory
[2026-07-20 23:59:27] PSS_SOFT_CEILING pss=926.7 gl=130.5 views=567 native_reclaim_advisory
[2026-07-21 00:14:53] PSS_SOFT_CEILING pss=938.1 gl=131.4 views=567 native_reclaim_advisory
[2026-07-21 00:30:19] GL_HARD_CEILING gl=132.4 pss=953.6 views=567
[2026-07-21 00:30:19] REFIX_REQUESTED gl_critical_active_hub
[2026-07-21 00:34:49] INVESTIGATION_TRIGGERED mem_anomaly
[2026-07-21 07:12:07] PSS_SOFT_CEILING pss=828.5 gl=150 views=560 native_reclaim_advisory
[2026-07-21 07:43:05] PSS_SOFT_CEILING pss=863.3 gl=157 views=561 native_reclaim_advisory
[2026-07-21 07:58:34] PSS_SOFT_CEILING pss=949.5 gl=152.9 views=559 native_reclaim_advisory
[2026-07-21 08:00:00] DAILY_8AM_REPORT 2026-07-21 08:00:00 KST
```

## remediation.log (tail)

```
[2026-07-20 23:13:08] INFO PSS_SOFT_CEILING pss=931.5 gl=130.4 views=567 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-20 23:28:34] INFO PSS_SOFT_CEILING pss=934.5 gl=130.4 views=567 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-20 23:44:01] INFO PSS_SOFT_CEILING pss=930.7 gl=130.4 views=567 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-20 23:59:27] INFO PSS_SOFT_CEILING pss=926.7 gl=130.5 views=567 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-21 00:14:53] INFO PSS_SOFT_CEILING pss=938.1 gl=131.4 views=567 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-21 00:30:19] INCIDENT GL_HARD_CEILING gl=132.4 pss=953.6 views=567 -> immediate remediation (OOM imminent)
[2026-07-21 00:30:19] REFIX_REQUESTED gl_critical_active_hub -> gl-leak-refix-requested.flag
[2026-07-21 00:30:19] AUTO_FIX static audit:skia-memory start
[2026-07-21 00:30:20] AUTO_FIX audit:skia-memory PASS
[2026-07-21 00:30:20] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-07-21 00:30:39] AUTO_FIX baseline reset pid=29524 gl=5.9MB pss=473.6MB
[2026-07-21 00:30:39] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-07-21 00:31:00] VERIFY PASS pid=29524 gl=8.5MB pss=583.4MB views=99
[2026-07-21 00:31:00] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":953.6,"views":567,"lastGlMb":132.4,"hardCeiling":true}
[2026-07-21 00:31:01] HANDOFF packed -> outbox/cursor-incident-handoff.md (Kim Team Lead triage)
[2026-07-21 00:34:47] INVESTIGATION start reason=mem_anomaly
[2026-07-21 00:34:47] INVESTIGATION alert=[2026-07-21 00:30:19] GL_HARD_CEILING gl=132.4 pss=953.6 views=567
[2026-07-21 00:34:48] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260721-003447.log
[2026-07-21 00:34:49] INVESTIGATION mem from timeline gl=8.5MB pss=583.4MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260721-003447.log
[2026-07-21 00:34:49] packed D:\arcfire20260607\tools\long-run-monitor\outbox\cursor-incident-handoff.md
[2026-07-21 00:34:49] INVESTIGATION trigger -> .cursor/trigger-incident-auto-fix.json
[2026-07-21 00:34:49] INVESTIGATION done reason=mem_anomaly
[2026-07-21 07:12:07] INFO PSS_SOFT_CEILING pss=828.5 gl=150 views=560 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-21 07:43:05] INFO PSS_SOFT_CEILING pss=863.3 gl=157 views=561 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-21 07:58:34] INFO PSS_SOFT_CEILING pss=949.5 gl=152.9 views=559 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
```

## mem-alerts.log (tail)

```
[2026-07-19 11:45:19] CRITICAL process not running ??check crash-*.log
[2026-07-19 12:00:19] CRITICAL process not running ??check crash-*.log
[2026-07-19 12:15:20] CRITICAL process not running ??check crash-*.log
[2026-07-19 12:30:20] CRITICAL process not running ??check crash-*.log
[2026-07-19 15:04:08] GL +87.4MB views=569 (PSS 119.6MB) ??active hub
[2026-07-19 15:35:09] CRITICAL process not running ??check crash-*.log
[2026-07-19 16:05:42] CRITICAL process not running ??check crash-*.log
[2026-07-19 16:20:43] CRITICAL process not running ??check crash-*.log
[2026-07-19 17:22:19] CRITICAL process not running ??check crash-*.log
[2026-07-19 20:57:58] PSS +88.6MB GL 40.5MB views=365
[2026-07-19 22:45:59] GL +86.2MB views=549 (PSS 67.2MB) ??active hub
[2026-07-19 23:47:51] PSS +54.6MB GL 42.6MB views=535
[2026-07-20 00:18:42] GL +88.9MB views=567 (PSS 87.3MB) ??active hub
[2026-07-20 12:23:45] GL +10.7MB views=359 (PSS 42.9MB) ??active hub
[2026-07-20 13:40:52] GL +79.9MB views=712 (PSS 75.5MB) ??active hub
[2026-07-20 16:46:08] GL +20.7MB views=312 (PSS 117.4MB) ??active hub
[2026-07-20 17:01:33] GL +9.6MB views=494 (PSS 9MB) ??active hub
[2026-07-20 17:32:21] GL +77.6MB views=571 (PSS 133.3MB) ??active hub
[2026-07-20 19:21:28] GL +123.2MB views=559 (PSS 160.7MB) ??active hub
[2026-07-20 20:23:12] GL +95.8MB views=560 (PSS 90.3MB) ??active hub
[2026-07-20 21:24:59] GL +14.1MB views=386 (PSS 25.6MB) ??active hub
[2026-07-20 22:11:16] GL +97.3MB views=560 (PSS 130.6MB) ??active hub
[2026-07-21 07:12:01] GL +95.3MB views=560 (PSS 112.1MB) ??active hub
[2026-07-21 07:42:59] GL +104.5MB views=561 (PSS 120.2MB) ??active hub
[2026-07-21 07:58:28] PSS +86.2MB GL 152.9MB views=559
```

## KPI (overnight window)

| Metric | Count |
|--------|-------|
| GL_HARD_CEILING incidents | 37 |
| Crash / PROCESS_DEATH | 95 |
| Auto app relaunch | 37 |

## Action items for Kim Team Lead

1. GL_HARD_CEILING or 3x GL_SPIKE ??P0 hub Skia audit (see overnight-watch handoff).
2. SIGSEGV/FATAL ??arcfire-bug-debug-workflow + logcat tail in latest crash-*.log.
3. Stair-step floor rise without crash ??today's dev P0 list in overnight-watch handoff.

