# Arcfire

Generated (KST): 2026-06-28 22:00:02
Package: com.arcfire.online

## Runtime

| pid | PSS (MB) | GL (MB) | Views |
|-----|----------|---------|-------|
| 15084 | 568.6 | 12.2 | 99 |

## mem-timeline (since EVENING_WATCH_START)

```csv
2026-06-28 18:06:14,30973,707,777.5,34.5,19.8,54.3,393.7,29.1,,374,-8.6,0,
2026-06-28 18:16:32,30973,721.2,792,34.5,19.8,54.3,396,35.3,,383,14.2,0,
2026-06-28 18:26:50,30973,712.5,783.4,34.8,34.3,69.1,396.6,28.2,,394,-8.7,0.3,
2026-06-28 18:32:53,30973,705.2,776.2,36.5,19.8,56.3,400,30.3,,379,-7.3,1.7,
2026-06-28 18:37:11,30973,708.7,779.8,36.5,20,56.4,402.3,31.6,,375,3.5,0,
2026-06-28 18:47:31,30973,741.7,812.9,50.9,40.7,91.6,400.6,30.6,,380,33,14.4,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-06-28 18:57:53,30973,715.4,786.2,48.4,19.8,68.3,404,29.7,,375,-26.3,-2.5,
2026-06-28 19:03:12,30973,738,808.7,51.1,40.7,91.7,404.7,28.9,,394,22.6,2.7,
2026-06-28 19:08:17,30973,712.6,783.4,48.4,19.8,68.3,400.6,34.4,,375,-25.4,-2.7,
2026-06-28 19:18:37,30973,758.5,825.4,51,39.7,90.6,434.4,29.1,,150,45.9,2.6,PSS_SPIKE review=graphics+native
2026-06-28 19:28:59,30973,791.8,820.1,52.3,40.7,92.9,431.5,32.7,,572,33.3,1.3,
2026-06-28 19:33:34,30973,845.8,860.2,114.4,19.8,134.2,439.9,26.7,,632,54,62.1,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-06-28 19:39:23,30973,976.3,927.4,159.5,19.8,179.4,482.1,22,,632,130.5,45.1,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-06-28 19:49:47,30973,984,935,159.5,19.8,179.4,482.9,28.9,,632,7.7,0,
2026-06-28 20:00:06,10107,659.1,775.6,43.3,19.8,63.1,330.3,29.7,,375,,,
2026-06-28 20:03:51,10107,687.7,803.7,43.5,34.3,77.8,340.2,32.1,,398,,,
2026-06-28 20:10:23,10107,669.2,786.3,32.3,19.8,52.1,339.3,37.5,,374,-18.5,-11.2,GL_RECOVERED idle_ok
2026-06-28 20:20:40,10107,673,790.2,32.3,19.8,52.1,341.7,32,,375,3.8,0,
2026-06-28 20:30:57,10107,685.2,807.4,32.6,34.3,66.9,341.2,35.1,,400,12.2,0.3,
2026-06-28 20:34:10,10107,679.6,801.3,32.3,19.8,52.1,343.8,42.5,,382,-5.6,-0.3,
2026-06-28 20:41:15,10107,699,820.7,35.1,40.7,75.7,351.1,30.3,,385,19.4,2.8,
2026-06-28 20:51:36,10107,686.5,808.4,34.7,19.8,54.5,352,37,,370,-12.5,-0.4,
2026-06-28 21:01:54,10107,679.1,801,36.7,19.8,56.6,350.7,30.3,,378,-7.4,2,
2026-06-28 21:04:28,10107,708.9,830.8,35.4,40.7,76,352.9,37.9,,399,29.8,-1.3,
2026-06-28 21:12:13,10107,677.6,798.6,34.7,19.8,54.5,351.4,34.4,,376,-31.3,-0.7,
2026-06-28 21:22:36,10107,784.7,900.6,108.8,19.8,128.6,389,31.1,,567,107.1,74.1,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-06-28 21:33:00,15084,666.6,796.4,43.9,40.7,84.5,339.8,23.6,,383,,,
2026-06-28 21:34:52,15084,643.3,773.1,43.3,19.8,63.1,333.8,26.8,,374,,,
2026-06-28 21:43:18,15084,599.8,730.1,16.9,19.8,36.7,330.4,25,,99,-43.5,-26.4,GL_RECOVERED idle_ok
2026-06-28 21:53:43,15084,441.2,486.1,11.2,19.8,31,206.1,16.5,,13,-158.6,-5.7,GL_RECOVERED idle_ok
```

## incidents.log (tail)

```
[2026-06-28 08:57:16] AFTERNOON_WATCH_START 2026-06-28 08:57:16 KST
[2026-06-28 08:57:26] PSS_SOFT_CEILING pss=814.4 gl=36.6 views=405 native_reclaim_advisory
[2026-06-28 08:59:15] PSS_SOFT_CEILING pss=834.1 gl=37.3 views=400 native_reclaim_advisory
[2026-06-28 09:02:56] DAILY_8AM_REPORT 2026-06-28 09:02:56 KST
[2026-06-28 09:02:56] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260628-0800.md verdict=CRITICAL
[2026-06-28 09:19:54] PSS_SOFT_CEILING pss=909.3 gl=149.6 views=555 native_reclaim_advisory
[2026-06-28 09:27:45] PSS_SOFT_CEILING pss=877.1 gl=127.5 views=574 native_reclaim_advisory
[2026-06-28 09:30:17] PSS_SOFT_CEILING pss=884.6 gl=127.5 views=555 native_reclaim_advisory
[2026-06-28 10:01:22] PSS_SOFT_CEILING pss=812.5 gl=47.4 views=466 native_reclaim_advisory
[2026-06-28 10:11:41] PSS_SOFT_CEILING pss=814.9 gl=36.5 views=372 native_reclaim_advisory
[2026-06-28 10:22:00] PSS_SOFT_CEILING pss=860.4 gl=38.2 views=460 native_reclaim_advisory
[2026-06-28 10:32:20] PSS_SOFT_CEILING pss=852.2 gl=44.1 views=493 native_reclaim_advisory
[2026-06-28 10:42:43] PSS_SOFT_CEILING pss=817 gl=42.7 views=432 native_reclaim_advisory
[2026-06-28 14:18:55] PSS_SOFT_CEILING pss=876.5 gl=36 views=328 native_reclaim_advisory
[2026-06-28 14:29:14] PSS_SOFT_CEILING pss=939 gl=54.7 views=420 native_reclaim_advisory
[2026-06-28 15:00:19] PSS_SOFT_CEILING pss=870.6 gl=40 views=352 native_reclaim_advisory
[2026-06-28 15:00:56] PSS_SOFT_CEILING pss=836 gl=39.4 views=326 native_reclaim_advisory
[2026-06-28 15:52:02] PSS_SOFT_CEILING pss=913 gl=59.2 views=332 native_reclaim_advisory
[2026-06-28 16:44:18] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-28 17:47:03] EVENING_WATCH_START user-request until-22:00-KST report-scheduled
[2026-06-28 19:33:38] PSS_SOFT_CEILING pss=845.8 gl=114.4 views=632 native_reclaim_advisory
[2026-06-28 19:39:36] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-28 19:50:02] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-28 21:14:43] INVESTIGATION_TRIGGERED mem_anomaly
[2026-06-28 21:22:44] GL_ELEVATED mounting_or_insufficient_samples gl=108.8 pss=784.7 views=567 restart_held
```

## remediation.log (tail)

```
[2026-06-28 19:39:35] INVESTIGATION mem snapshot gl=161.5MB pss=980.7MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260628-193934.log
[2026-06-28 19:39:35] packed D:\arcfire20260607\tools\long-run-monitor\outbox\cursor-incident-handoff.md
[2026-06-28 19:39:36] INVESTIGATION trigger -> .cursor/trigger-incident-auto-fix.json
[2026-06-28 19:39:36] INVESTIGATION code-fix handoff only (monitor-paused ??no app relaunch)
[2026-06-28 19:39:38] INVESTIGATION audit:skia-memory completed (paused mode static gate)
[2026-06-28 19:39:38] INVESTIGATION done reason=mem_hard_ceiling_playtest
[2026-06-28 19:49:59] INVESTIGATION start reason=mem_hard_ceiling_playtest
[2026-06-28 19:49:59] INVESTIGATION alert=[2026-06-28 19:49:59] [MEM_HARD_CEILING] pss=984MB gl=159.5MB
[2026-06-28 19:50:01] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260628-194959.log
[2026-06-28 19:50:01] INVESTIGATION mem snapshot gl=159.5MB pss=980.6MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260628-194959.log
[2026-06-28 19:50:02] packed D:\arcfire20260607\tools\long-run-monitor\outbox\cursor-incident-handoff.md
[2026-06-28 19:50:02] INVESTIGATION trigger -> .cursor/trigger-incident-auto-fix.json
[2026-06-28 19:50:02] INVESTIGATION code-fix handoff only (monitor-paused ??no app relaunch)
[2026-06-28 19:50:04] INVESTIGATION audit:skia-memory completed (paused mode static gate)
[2026-06-28 19:50:04] INVESTIGATION done reason=mem_hard_ceiling_playtest
[2026-06-28 21:14:40] INVESTIGATION start reason=mem_anomaly
[2026-06-28 21:14:41] INVESTIGATION alert=[2026-06-25 08:51:20] GL_HARD_CEILING gl=228.9 pss=991.1 views=947
[2026-06-28 21:14:41] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260628-211441.log
[2026-06-28 21:14:42] INVESTIGATION mem snapshot gl=35.3MB pss=704.8MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260628-211441.log
[2026-06-28 21:14:43] packed D:\arcfire20260607\tools\long-run-monitor\outbox\cursor-incident-handoff.md
[2026-06-28 21:14:43] INVESTIGATION trigger -> .cursor/trigger-incident-auto-fix.json
[2026-06-28 21:14:43] INVESTIGATION code-fix handoff only (monitor-paused ??no app relaunch)
[2026-06-28 21:14:47] INVESTIGATION audit:skia-memory completed (paused mode static gate)
[2026-06-28 21:14:47] INVESTIGATION done reason=mem_anomaly
[2026-06-28 21:22:44] INFO GL_ELEVATED mounting_or_insufficient_samples gl=108.8 pss=784.7 views=567 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
```

## mem-alerts.log (tail)

```
[2026-06-27 23:41:57] PSS +77.5MB GL 142.8MB views=547
[2026-06-27 23:43:14] CRITICAL process not running ??check crash-*.log
[2026-06-27 23:54:43] CRITICAL process not running ??check crash-*.log
[2026-06-28 05:02:28] PSS +42.4MB GL 37.3MB views=428
[2026-06-28 09:09:29] GL +8.5MB views=385 (PSS -43.1MB) ??active hub
[2026-06-28 09:19:49] GL +103.8MB views=555 (PSS 118.3MB) ??active hub
[2026-06-28 10:01:18] GL +14.4MB views=466 (PSS 28.7MB) ??active hub
[2026-06-28 10:21:54] PSS +45.5MB GL 38.2MB views=460
[2026-06-28 11:13:41] CRITICAL process not running ??check crash-*.log
[2026-06-28 11:23:42] CRITICAL process not running ??check crash-*.log
[2026-06-28 12:56:10] PSS +266.9MB GL 13.4MB views=107
[2026-06-28 14:29:08] GL +18.7MB views=420 (PSS 62.5MB) ??active hub
[2026-06-28 14:30:51] CRITICAL process not running ??check crash-*.log
[2026-06-28 15:00:12] GL +17.5MB views=352 (PSS 82.5MB) ??active hub
[2026-06-28 15:21:00] PSS +108.3MB GL 33.3MB views=99
[2026-06-28 16:31:50] PSS +152.1MB GL 22.3MB views=235
[2026-06-28 16:54:32] CRITICAL process not running ??check crash-*.log
[2026-06-28 17:02:17] CRITICAL process not running ??check crash-*.log
[2026-06-28 17:04:34] CRITICAL process not running ??check crash-*.log
[2026-06-28 17:55:56] PSS +131.6MB GL 41.4MB views=379
[2026-06-28 18:47:31] GL +14.4MB views=380 (PSS 33MB) ??active hub
[2026-06-28 19:18:37] PSS +45.9MB GL 51MB views=150
[2026-06-28 19:33:34] GL +62.1MB views=632 (PSS 54MB) ??active hub
[2026-06-28 19:39:23] GL +45.1MB views=632 (PSS 130.5MB) ??active hub
[2026-06-28 21:22:36] GL +74.1MB views=567 (PSS 107.1MB) ??active hub
```

## KPI (overnight window)

| Metric | Count |
|--------|-------|
| GL_HARD_CEILING incidents | 22 |
| Crash / PROCESS_DEATH | 95 |
| Auto app relaunch | 22 |

## Action items for Kim Team Lead

1. GL_HARD_CEILING or 3x GL_SPIKE ??P0 hub Skia audit (see overnight-watch handoff).
2. SIGSEGV/FATAL ??arcfire-bug-debug-workflow + logcat tail in latest crash-*.log.
3. Stair-step floor rise without crash ??today's dev P0 list in overnight-watch handoff.

