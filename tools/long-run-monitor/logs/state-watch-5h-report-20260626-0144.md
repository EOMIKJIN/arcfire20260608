# Arcfire 5h state watch report (KST) ??pre movement-crash test

Generated (KST): 2026-06-26 06:45:02
Package: com.arcfire.online

## Runtime

| pid | PSS (MB) | GL (MB) | Views |
|-----|----------|---------|-------|
| 31346 | 941.1 | 53.6 | 288 |

## mem-timeline (since STATE_WATCH_5H_START)

```csv
2026-06-26 04:18:28,31346,914.8,1035.3,53.6,19.8,73.4,556.9,36.3,,304,-2.2,0,
2026-06-26 04:20:13,31346,922.5,1043,53.6,19.8,73.4,559,41.6,,296,7.7,0,
2026-06-26 04:28:45,31346,921.3,1040.2,53.6,19.8,73.4,560.7,42,,304,-1.2,0,
2026-06-26 04:30:28,31346,923.6,1042.4,53.6,19.8,73.4,565.9,39.3,,296,2.3,0,
2026-06-26 04:39:02,31346,925.3,1044.2,53.6,19.8,73.4,563.4,43.2,,308,1.7,0,
2026-06-26 04:40:46,31346,952.8,1071.6,56.2,40.7,96.9,566.4,44,,311,27.5,2.6,
2026-06-26 04:49:19,31346,932.1,1051,53.6,20,73.6,565.5,47,,308,-20.7,-2.6,
2026-06-26 04:51:04,31346,947.7,1066.5,53.6,19.8,73.4,570,58.2,,292,15.6,0,
2026-06-26 04:59:36,31346,958.5,1077.3,57.9,34.3,92.2,570.6,49.7,,329,10.8,4.3,
2026-06-26 05:01:21,31346,931.6,1050.5,53.6,19.8,73.4,571.4,40.8,,292,-26.9,-4.3,
2026-06-26 05:09:51,31346,948.2,1066.5,53.6,19.8,73.4,570.7,57.1,,308,16.6,0,
2026-06-26 05:11:38,31346,946.4,1064.7,53.6,19.8,73.4,575.8,50.1,,296,-1.8,0,
2026-06-26 05:20:07,31346,947.1,1065.4,55.6,19.8,75.4,573.4,50.9,,308,0.7,2,
2026-06-26 05:21:56,31346,941.9,1060.1,53.6,19.8,73.4,576,44.9,,296,-5.2,-2,
2026-06-26 05:30:25,31346,941.9,1060.2,53.6,19.8,73.4,581.4,39,,312,0,0,
2026-06-26 05:32:13,31346,968.4,1087.2,56.2,40.7,96.9,584.1,39.8,,299,26.5,2.6,
2026-06-26 05:40:42,31346,935.4,1054.1,53.6,19.8,73.4,575.1,38.7,,312,-33,-2.6,
2026-06-26 05:42:30,31346,968,1086.7,53.8,34.3,88.1,578.8,53,,311,32.6,0.2,
2026-06-26 05:50:59,31346,978.2,1097,56.2,40.7,96.9,580.2,52.7,,335,10.2,2.4,
2026-06-26 05:52:47,31346,950.4,1069.2,53.6,19.8,73.4,576.2,52.3,,292,-27.8,-2.6,
2026-06-26 06:01:16,31346,951.9,1070.8,53.6,19.8,73.4,579.5,50.3,,312,1.5,0,
2026-06-26 06:03:04,31346,945.2,1064.1,55.6,19.8,75.4,582,38.8,,296,-6.7,2,
2026-06-26 06:11:33,31346,956.9,1075.9,53.6,19.8,73.4,584.9,49.1,,312,11.7,-2,
2026-06-26 06:13:21,31346,967.6,1086.6,55.6,19.8,75.4,589.2,53.7,,296,10.7,2,
2026-06-26 06:21:49,31346,957.6,1076.7,55.6,19.8,75.4,588.4,44.2,,316,-10,0,
2026-06-26 06:23:39,31346,959.3,1078.4,53.6,20,73.6,584,52.3,,296,1.7,-2,
2026-06-26 06:32:06,31346,938.1,1054.1,55.6,19.8,75.4,583.2,55.9,,316,-21.2,2,
2026-06-26 06:33:55,31346,946.6,1062.6,53.9,34.3,88.2,589,45.7,,317,8.5,-1.7,
2026-06-26 06:42:23,31346,970.9,1087,54.2,40.7,94.9,595.8,56.3,,325,24.3,0.3,
2026-06-26 06:44:13,31346,937.9,1054,55.6,19.8,75.4,585.6,52.6,,290,-33,1.4,
```

## incidents.log (tail)

```
[2026-06-26 04:28:49] PSS_SOFT_CEILING pss=921.3 gl=53.6 views=304 native_reclaim_advisory
[2026-06-26 04:30:33] PSS_SOFT_CEILING pss=923.6 gl=53.6 views=296 native_reclaim_advisory
[2026-06-26 04:39:07] PSS_SOFT_CEILING pss=925.3 gl=53.6 views=308 native_reclaim_advisory
[2026-06-26 04:41:08] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-26 04:49:23] PSS_SOFT_CEILING pss=932.1 gl=53.6 views=308 native_reclaim_advisory
[2026-06-26 04:51:08] PSS_SOFT_CEILING pss=947.7 gl=53.6 views=292 native_reclaim_advisory
[2026-06-26 04:59:54] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-26 05:01:25] PSS_SOFT_CEILING pss=931.6 gl=53.6 views=292 native_reclaim_advisory
[2026-06-26 05:09:56] PSS_SOFT_CEILING pss=948.2 gl=53.6 views=308 native_reclaim_advisory
[2026-06-26 05:11:42] PSS_SOFT_CEILING pss=946.4 gl=53.6 views=296 native_reclaim_advisory
[2026-06-26 05:20:12] PSS_SOFT_CEILING pss=947.1 gl=55.6 views=308 native_reclaim_advisory
[2026-06-26 05:22:01] PSS_SOFT_CEILING pss=941.9 gl=53.6 views=296 native_reclaim_advisory
[2026-06-26 05:30:29] PSS_SOFT_CEILING pss=941.9 gl=53.6 views=312 native_reclaim_advisory
[2026-06-26 05:32:20] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-26 05:40:46] PSS_SOFT_CEILING pss=935.4 gl=53.6 views=312 native_reclaim_advisory
[2026-06-26 05:42:44] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-26 05:51:10] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-26 06:01:34] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-26 06:03:08] PSS_SOFT_CEILING pss=945.2 gl=55.6 views=296 native_reclaim_advisory
[2026-06-26 06:11:38] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-26 06:22:02] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-26 06:32:12] PSS_SOFT_CEILING pss=938.1 gl=55.6 views=316 native_reclaim_advisory
[2026-06-26 06:34:00] PSS_SOFT_CEILING pss=946.6 gl=53.9 views=317 native_reclaim_advisory
[2026-06-26 06:42:47] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-26 06:44:19] PSS_SOFT_CEILING pss=937.9 gl=55.6 views=290 native_reclaim_advisory
```

## remediation.log (tail)

```
[2026-06-26 06:11:40] INVESTIGATION done reason=mem_hard_ceiling_playtest
[2026-06-26 06:13:40] INVESTIGATION throttled reason=mem_hard_ceiling_playtest (duplicate within window)
[2026-06-26 06:22:01] INVESTIGATION start reason=mem_hard_ceiling_playtest
[2026-06-26 06:22:01] INVESTIGATION alert=[2026-06-26 06:22:01] [MEM_HARD_CEILING] pss=957.6MB gl=55.6MB
[2026-06-26 06:22:02] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260626-062201.log
[2026-06-26 06:22:02] INVESTIGATION mem snapshot gl=53.6MB pss=960.8MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260626-062201.log
[2026-06-26 06:22:02] packed D:\arcfire20260607\tools\long-run-monitor\outbox\cursor-incident-handoff.md
[2026-06-26 06:22:02] INVESTIGATION trigger -> .cursor/trigger-incident-auto-fix.json
[2026-06-26 06:22:02] INVESTIGATION code-fix handoff only (monitor-paused ??no app relaunch)
[2026-06-26 06:22:04] INVESTIGATION audit:skia-memory completed (paused mode static gate)
[2026-06-26 06:22:04] INVESTIGATION done reason=mem_hard_ceiling_playtest
[2026-06-26 06:23:45] INVESTIGATION throttled reason=mem_hard_ceiling_playtest (duplicate within window)
[2026-06-26 06:32:12] INFO PSS_SOFT_CEILING pss=938.1 gl=55.6 views=316 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-26 06:34:00] INFO PSS_SOFT_CEILING pss=946.6 gl=53.9 views=317 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-26 06:42:28] INFO GL_HARD_CEILING_RECORD_ONLY gl=54.2 pss=970.9 views=325 (monitor-paused ??no incident/refix spam)
[2026-06-26 06:42:46] INVESTIGATION start reason=mem_hard_ceiling_playtest
[2026-06-26 06:42:46] INVESTIGATION alert=[2026-06-26 06:42:46] [MEM_HARD_CEILING] pss=970.9MB gl=54.2MB
[2026-06-26 06:42:46] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260626-064246.log
[2026-06-26 06:42:47] INVESTIGATION mem snapshot gl=53.6MB pss=953MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260626-064246.log
[2026-06-26 06:42:47] packed D:\arcfire20260607\tools\long-run-monitor\outbox\cursor-incident-handoff.md
[2026-06-26 06:42:47] INVESTIGATION trigger -> .cursor/trigger-incident-auto-fix.json
[2026-06-26 06:42:47] INVESTIGATION code-fix handoff only (monitor-paused ??no app relaunch)
[2026-06-26 06:42:49] INVESTIGATION audit:skia-memory completed (paused mode static gate)
[2026-06-26 06:42:49] INVESTIGATION done reason=mem_hard_ceiling_playtest
[2026-06-26 06:44:19] INFO PSS_SOFT_CEILING pss=937.9 gl=55.6 views=290 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
```

## mem-alerts.log (tail)

```
[2026-06-25 14:53:09] CRITICAL process not running ??check crash-*.log
[2026-06-25 14:59:36] CRITICAL process not running ??check crash-*.log
[2026-06-25 15:09:36] CRITICAL process not running ??check crash-*.log
[2026-06-25 16:10:11] GL +207.4MB views=936 (PSS 186.7MB) ??active hub
[2026-06-25 16:50:37] GL +111.8MB views=355 (PSS 146.7MB) ??active hub
[2026-06-25 17:10:47] GL +101.1MB views=283 (PSS 150.9MB) ??active hub
[2026-06-25 17:20:53] CRITICAL process not running ??check crash-*.log
[2026-06-25 17:23:35] CRITICAL process not running ??check crash-*.log
[2026-06-25 17:30:54] CRITICAL process not running ??check crash-*.log
[2026-06-25 18:31:28] PSS +135.3MB GL 39.2MB views=381
[2026-06-25 19:01:49] PSS +41.8MB GL 43.7MB views=325
[2026-06-25 19:11:56] PSS +40.8MB GL 44.4MB views=348
[2026-06-25 19:53:59] GL +23.8MB views=962 (PSS 34MB) ??active hub
[2026-06-25 20:12:34] PSS +41.5MB GL 36.3MB views=370
[2026-06-25 20:32:46] PSS +44.8MB GL 32.4MB views=521
[2026-06-25 20:42:53] GL +33.1MB views=284 (PSS 187MB) ??active hub
[2026-06-25 21:33:25] GL +14.2MB views=298 (PSS 30.5MB) ??active hub
[2026-06-25 21:43:31] GL +14.3MB views=302 (PSS 15MB) ??active hub
[2026-06-25 22:44:11] PSS +41.9MB GL 48.1MB views=316
[2026-06-25 22:54:16] GL +178.7MB views=932 (PSS 269MB) ??active hub
[2026-06-25 23:24:36] GL +16.8MB views=287 (PSS 69MB) ??active hub
[2026-06-26 00:55:03] CRITICAL process not running ??check crash-*.log
[2026-06-26 00:55:28] CRITICAL process not running ??check crash-*.log
[2026-06-26 01:44:13] GL +26.6MB views=282 (PSS 116.5MB) ??active hub
[2026-06-26 02:15:11] GL +13MB views=288 (PSS 51.9MB) ??active hub
```

## KPI (overnight window)

| Metric | Count |
|--------|-------|
| GL_HARD_CEILING incidents | 22 |
| Crash / PROCESS_DEATH | 92 |
| Auto app relaunch | 22 |

## Action items for Kim Team Lead

1. GL_HARD_CEILING or 3x GL_SPIKE ??P0 hub Skia audit (see overnight-watch handoff).
2. SIGSEGV/FATAL ??arcfire-bug-debug-workflow + logcat tail in latest crash-*.log.
3. Stair-step floor rise without crash ??today's dev P0 list in overnight-watch handoff.

