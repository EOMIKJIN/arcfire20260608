# Arcfire daily 08:00 KST auto report (mandatory perpetual)

Generated (KST): 2026-07-02 08:05:21
Package: com.arcfire.online

## Runtime

| pid | PSS (MB) | GL (MB) | Views |
|-----|----------|---------|-------|
| 18681 | 629 | 37.8 | 368 |

## mem-timeline (since DAILY_8AM_REPORT)

```csv
2026-07-01 19:11:08,29266,644.1,516.9,43.6,19.8,63.4,200.4,24.2,,354,-10.5,0,
2026-07-01 19:20:55,29266,770.5,803,43.8,19.8,63.6,409.9,32.9,,358,126.4,0.2,PSS_SPIKE review=graphics+native
2026-07-01 19:36:16,29266,789.8,822.3,45.3,34.3,79.6,408.8,42.1,,383,19.3,1.5,
2026-07-01 19:41:25,29266,772.9,806.1,47.4,19.8,67.3,403.1,39.2,,362,-16.9,2.1,
2026-07-01 19:51:40,29266,744.5,754.3,17.3,19.8,37.1,396.2,45,,522,-28.4,-30.1,GL_RECOVERED idle_ok
2026-07-01 20:07:11,29266,760.2,681.7,44.8,19.8,64.6,323.6,27.2,,361,15.7,27.5,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-07-01 20:11:59,29266,768.6,690.2,46.9,19.8,66.7,322.5,32.3,,358,8.4,2.1,
2026-07-01 20:22:30,29266,766.7,689.4,47,19.8,66.9,321.2,26.8,,358,-1.9,0.1,
2026-07-01 20:37:55,29266,804,721.9,31.2,40.7,71.9,343.9,39.5,,390,37.3,-15.8,GL_RECOVERED idle_ok
2026-07-01 20:42:16,29266,805.2,723.1,31.4,40.7,72,348.8,35.7,,387,1.2,0.2,
2026-07-01 20:53:19,29266,782.5,701.3,30.7,19.8,50.6,347.1,37,,370,-22.7,-0.7,
2026-07-01 21:08:38,27429,805.3,929,42.6,30.2,72.9,403.7,54.8,,379,,,
2026-07-01 21:12:39,27429,760.3,888.4,44.7,19.8,64.5,393.3,39.4,,370,,,
2026-07-01 21:23:57,28942,659.4,781.6,43.6,19.8,63.5,319.5,41.5,,373,,,
2026-07-01 21:43:00,28942,697.4,725.8,39.8,34.3,74.1,293.9,44,,372,,,
2026-07-01 21:54:39,28942,835.1,800.2,149.5,19.8,169.3,260,53.7,,362,137.7,109.7,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-07-01 22:09:58,28942,862.4,829.5,148.8,19.8,168.6,318,32.6,,369,27.3,-0.7,
2026-07-01 22:13:18,28942,863.5,830.6,148.8,19.8,168.6,322.4,29.2,,370,1.1,0,
2026-07-01 22:25:19,28942,865.3,833,148.8,19.8,168.6,320.1,35.1,,369,1.8,0,
2026-07-01 22:29:36,28942,862.5,830.2,148.8,19.8,168.6,321.2,31.2,,369,-2.8,0,PSS_MGMT_BASELINE_2230
2026-07-01 22:40:39,28942,879,846.8,151,34.3,185.3,317,38.6,,382,16.5,2.2,
2026-07-01 22:43:38,28942,852.5,820.2,148.8,19.8,168.6,316.5,33,,373,-26.5,-2.2,
2026-07-01 22:56:00,28942,771,735.5,116.5,19.8,136.3,319.5,31.5,,367,-81.5,-32.3,GL_RECOVERED idle_ok
2026-07-01 23:11:26,28942,763.9,728.5,114.8,19.8,134.6,318.8,30.9,,366,-7.1,-1.7,
2026-07-01 23:14:00,28942,789.4,754,115.4,40.7,156,321.3,32.3,,389,25.5,0.6,
2026-07-01 23:26:49,28942,783.6,750.7,115,34.3,149.3,323.8,31.8,,387,-5.8,-0.4,
2026-07-01 23:30:02,28942,775.3,742.3,117,34.3,151.3,322.8,22.5,,381,-8.3,2,PSS_MGMT_RECHECK_WARN
2026-07-01 23:42:14,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-07-01 23:57:15,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-07-02 00:12:16,,,,,,,,,,,PROCESS_NOT_RUNNING
```

## incidents.log (tail)

```
[2026-07-01 08:14:14] DAILY_8AM_REPORT 2026-07-01 08:14:14 KST
[2026-07-01 08:14:14] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md verdict=OK
[2026-07-01 08:20:23] DAILY_8AM_REPORT 2026-07-01 08:20:23 KST
[2026-07-01 08:20:23] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md verdict=OK
[2026-07-01 08:22:10] GL_ELEVATED mounting_or_insufficient_samples gl=127 pss=742.9 views=558 restart_held
[2026-07-01 12:27:12] GL_ELEVATED mounting_or_insufficient_samples gl=145.4 pss=751.9 views=555 restart_held
[2026-07-01 13:13:12] GL_ELEVATED mounting_or_insufficient_samples gl=145.4 pss=764.6 views=556 restart_held
[2026-07-01 14:40:24] EVENING_WATCH_6PM_START 2026-07-01 14:40 KST ? watch until 18:00 comprehensive report
[2026-07-01 18:00:07] EVENING_WATCH_6PM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\evening-watch-report-20260701-1800.md
[2026-07-01 20:38:00] PSS_SOFT_CEILING pss=804 gl=31.2 views=390 native_reclaim_advisory
[2026-07-01 20:42:23] PSS_SOFT_CEILING pss=805.2 gl=31.4 views=387 native_reclaim_advisory
[2026-07-01 21:08:43] PSS_SOFT_CEILING pss=805.3 gl=42.6 views=379 native_reclaim_advisory
[2026-07-01 21:54:43] PSS_SOFT_CEILING pss=835.1 gl=149.5 views=362 native_reclaim_advisory
[2026-07-01 22:10:04] PSS_SOFT_CEILING pss=862.4 gl=148.8 views=369 native_reclaim_advisory
[2026-07-01 22:13:23] PSS_SOFT_CEILING pss=863.5 gl=148.8 views=370 native_reclaim_advisory
[2026-07-01 22:25:24] PSS_SOFT_CEILING pss=865.3 gl=148.8 views=369 native_reclaim_advisory
[2026-07-01 22:40:44] PSS_SOFT_CEILING pss=879 gl=151 views=382 native_reclaim_advisory
[2026-07-01 22:43:44] PSS_SOFT_CEILING pss=852.5 gl=148.8 views=373 native_reclaim_advisory
[2026-07-01 22:56:11] GL_ELEVATED mounting_or_insufficient_samples gl=116.5 pss=771 views=367 restart_held
[2026-07-01 23:11:31] GL_ELEVATED mounting_or_insufficient_samples gl=114.8 pss=763.9 views=366 restart_held
[2026-07-01 23:14:06] GL_ELEVATED mounting_or_insufficient_samples gl=115.4 pss=789.4 views=389 restart_held
[2026-07-01 23:26:54] GL_ELEVATED mounting_or_insufficient_samples gl=115 pss=783.6 views=387 restart_held
[2026-07-01 23:37:55] OVERNIGHT_EXCEPTION_SHUTDOWN resume_at_kst=2026-07-02 08:00:00 stopped=4 reason=user 2026-07-01 overnight exception - resume 08:00 KST
[2026-07-02 08:05:16] OVERNIGHT_EXCEPTION_RESUME full stack restart
[2026-07-02 08:05:18] DAILY_8AM_REPORT 2026-07-02 08:05:18 KST
```

## remediation.log (tail)

```
[2026-06-30 19:51:11] INFO PSS_SOFT_CEILING pss=924.1 gl=124.8 views=558 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-30 20:06:39] INFO PSS_SOFT_CEILING pss=803.1 gl=139.7 views=365 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-30 20:22:07] INFO GL_HARD_CEILING_RECORD_ONLY gl=201.7 pss=1041.3 views=359 (monitor-paused ??no incident/refix spam)
[2026-06-30 21:23:29] INFO PSS_SOFT_CEILING pss=913.8 gl=147.7 views=383 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-30 22:40:00] INFO PSS_SOFT_CEILING pss=831.2 gl=39.7 views=369 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-30 22:55:20] INFO PSS_SOFT_CEILING pss=847.9 gl=37.8 views=369 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-30 23:10:46] INFO PSS_SOFT_CEILING pss=852.9 gl=37.9 views=370 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-30 23:26:03] INFO PSS_SOFT_CEILING pss=863.7 gl=37.9 views=369 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-30 23:56:43] INFO PSS_SOFT_CEILING pss=880.8 gl=148.8 views=374 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-01 08:22:10] INFO GL_ELEVATED mounting_or_insufficient_samples gl=127 pss=742.9 views=558 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-07-01 12:27:12] INFO GL_ELEVATED mounting_or_insufficient_samples gl=145.4 pss=751.9 views=555 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-07-01 13:13:12] INFO GL_ELEVATED mounting_or_insufficient_samples gl=145.4 pss=764.6 views=556 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-07-01 20:38:00] INFO PSS_SOFT_CEILING pss=804 gl=31.2 views=390 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-01 20:42:23] INFO PSS_SOFT_CEILING pss=805.2 gl=31.4 views=387 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-01 21:08:43] INFO PSS_SOFT_CEILING pss=805.3 gl=42.6 views=379 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-01 21:54:43] INFO PSS_SOFT_CEILING pss=835.1 gl=149.5 views=362 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-01 22:10:04] INFO PSS_SOFT_CEILING pss=862.4 gl=148.8 views=369 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-01 22:13:23] INFO PSS_SOFT_CEILING pss=863.5 gl=148.8 views=370 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-01 22:25:24] INFO PSS_SOFT_CEILING pss=865.3 gl=148.8 views=369 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-01 22:40:44] INFO PSS_SOFT_CEILING pss=879 gl=151 views=382 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-01 22:43:44] INFO PSS_SOFT_CEILING pss=852.5 gl=148.8 views=373 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-01 22:56:11] INFO GL_ELEVATED mounting_or_insufficient_samples gl=116.5 pss=771 views=367 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-07-01 23:11:31] INFO GL_ELEVATED mounting_or_insufficient_samples gl=114.8 pss=763.9 views=366 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-07-01 23:14:06] INFO GL_ELEVATED mounting_or_insufficient_samples gl=115.4 pss=789.4 views=389 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-07-01 23:26:54] INFO GL_ELEVATED mounting_or_insufficient_samples gl=115 pss=783.6 views=387 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
```

## mem-alerts.log (tail)

```
[2026-06-30 01:29:54] GL +13.4MB views=378 (PSS 9.7MB) ??active hub
[2026-06-30 02:00:39] PSS +214.6MB GL 25.9MB views=371
[2026-06-30 09:24:51] CRITICAL process not running ??check crash-*.log
[2026-06-30 10:24:08] PSS +43.3MB GL 39.5MB views=375
[2026-06-30 10:39:28] GL +109.8MB views=371 (PSS 69.5MB) ??active hub
[2026-06-30 12:26:49] GL +18.2MB views=379 (PSS 27.6MB) ??active hub
[2026-06-30 13:43:30] GL +16.1MB views=375 (PSS -12.3MB) ??active hub
[2026-06-30 13:58:53] GL +83.2MB views=383 (PSS 89.6MB) ??active hub
[2026-06-30 16:16:45] GL +112.7MB views=366 (PSS 181.8MB) ??active hub
[2026-06-30 18:19:09] GL +66.3MB views=395 (PSS 72.9MB) ??active hub
[2026-06-30 19:51:03] GL +89.6MB views=558 (PSS 217.9MB) ??active hub
[2026-06-30 21:38:46] CRITICAL process not running ??check crash-*.log
[2026-06-30 22:39:55] PSS +43.9MB GL 39.7MB views=369
[2026-07-01 00:42:43] PSS +40.1MB GL 22MB views=378
[2026-07-01 08:22:05] GL +99.5MB views=558 (PSS 61.7MB) ??active hub
[2026-07-01 09:38:51] CRITICAL process not running ??check crash-*.log
[2026-07-01 12:27:05] GL +110.5MB views=555 (PSS 153.3MB) ??active hub
[2026-07-01 12:57:50] GL +11.4MB views=368 (PSS -17.8MB) ??active hub
[2026-07-01 13:13:08] GL +101.7MB views=556 (PSS 136.8MB) ??active hub
[2026-07-01 19:20:55] PSS +126.4MB GL 43.8MB views=358
[2026-07-01 20:07:11] GL +27.5MB views=361 (PSS 15.7MB) ??active hub
[2026-07-01 21:54:39] GL +109.7MB views=362 (PSS 137.7MB) ??active hub
[2026-07-01 23:42:14] CRITICAL process not running ??check crash-*.log
[2026-07-01 23:57:15] CRITICAL process not running ??check crash-*.log
[2026-07-02 00:12:16] CRITICAL process not running ??check crash-*.log
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

