# Arcfire

Generated (KST): 2026-06-26 17:00:02
Package: com.arcfire.online

## Runtime

| pid | PSS (MB) | GL (MB) | Views |
|-----|----------|---------|-------|
| 30549 | 590.2 | 23.9 | 287 |

## mem-timeline (since AFTERNOON_WATCH_START)

```csv
2026-06-26 13:05:16,30549,716,486,122.4,19.8,142.2,133.4,30.3,,922,-4,0,
2026-06-26 13:15:31,30549,715.7,395.4,122.4,19.8,142.2,72.7,34.1,,922,-0.3,0,
2026-06-26 13:25:47,30549,723.2,521.7,122.4,19.8,142.2,168.8,36,,922,7.5,0,
2026-06-26 13:31:42,30549,703.2,471.7,122.4,19.8,142.2,133.2,24.6,,922,-20,0,
2026-06-26 13:36:04,30549,715.5,483.2,122.4,19.8,142.2,135.9,33,,922,12.3,0,
2026-06-26 13:46:21,30549,727.9,518.6,124,19.8,143.8,154.1,38.5,,922,12.4,1.6,
2026-06-26 13:56:38,30549,727.1,518.2,124,19.8,143.8,153.5,38.7,,922,-0.8,0,
2026-06-26 14:01:59,30549,707.4,497.7,124,19.8,143.8,149.3,23.5,,922,-19.7,0,
2026-06-26 14:06:54,30549,721.3,510.9,124,19.8,143.8,153.1,33,,922,13.9,0,
2026-06-26 14:17:11,30549,728.1,518.1,124,19.8,143.8,154.6,38.3,,922,6.8,0,
2026-06-26 14:27:28,30549,729.2,437.7,124,19.8,143.8,93.3,41,,922,1.1,0,
2026-06-26 14:32:21,30549,709.4,418.4,124,19.8,143.8,89.3,25.6,,922,-19.8,0,
2026-06-26 14:37:46,30549,722.5,432.1,124,19.8,143.8,91.2,37.1,,922,13.1,0,
2026-06-26 14:48:03,30549,720.1,450.3,124,19.8,143.9,110.4,30.3,,922,-2.4,0,
2026-06-26 14:58:19,30549,738.8,469.8,124,19.8,143.9,114.8,45.2,,922,18.7,0,
2026-06-26 15:02:38,30549,715.8,446.4,124,19.8,143.9,110.1,26.2,,922,-23,0,
2026-06-26 15:08:36,30549,721.6,452.5,124,19.8,143.9,112.4,29.5,,922,5.8,0,
2026-06-26 15:18:53,30549,718.3,449.3,124,19.8,143.9,112.3,26.3,,922,-3.3,0,
2026-06-26 15:29:16,30549,719.9,451.3,124,19.8,143.9,112.8,27.4,,922,1.6,0,
2026-06-26 15:32:53,30549,717.6,449.4,124,19.8,143.9,113,26.2,,922,-2.3,0,
2026-06-26 15:39:32,30549,736.1,466.7,124,19.8,143.9,116.8,40.8,,922,18.5,0,
2026-06-26 15:49:49,30549,793.5,653.2,131,40.7,171.6,234.5,41.2,,313,57.4,7,PSS_SPIKE review=graphics+native
2026-06-26 16:00:11,30549,620.5,525.5,35.3,19.8,55.1,209.9,32.1,,293,-173,-95.7,GL_RECOVERED idle_ok
2026-06-26 16:03:10,30549,611.9,517,35.3,19.8,55.1,209.3,24,,287,-8.6,0,
2026-06-26 16:10:32,30549,614.3,520.3,31.2,19.8,51,210.8,29.6,,287,2.4,-4.1,
2026-06-26 16:20:51,30549,617.7,530.4,34.9,19.8,54.7,211.6,32.2,,287,3.4,3.7,
2026-06-26 16:31:07,30549,607.1,520.3,34.9,19.8,54.7,210.3,23.8,,287,-10.6,0,
2026-06-26 16:33:26,30549,611.5,524.7,34.9,19.8,54.7,211.2,27.6,,287,4.4,0,
2026-06-26 16:41:23,30549,607.8,521.9,34.9,19.8,54.7,210.3,28.8,,287,-3.7,0,
2026-06-26 16:51:41,30549,597.7,514.3,25.9,19.8,45.7,211,33,,287,-10.1,-9,GL_RECOVERED idle_ok
```

## incidents.log (tail)

```
[2026-06-26 12:31:05] AFTERNOON_WATCH_START 2026-06-26 12:31:05 KST
[2026-06-26 03:34:37] AFTERNOON_WATCH_5PM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\afternoon-watch-report-20260626-1700.md
[2026-06-26 13:01:30] GL_ELEVATED mounting_or_insufficient_samples gl=122.4 pss=720 views=922 restart_held
[2026-06-26 13:05:20] GL_ELEVATED mounting_or_insufficient_samples gl=122.4 pss=716 views=922 restart_held
[2026-06-26 13:15:35] GL_ELEVATED mounting_or_insufficient_samples gl=122.4 pss=715.7 views=922 restart_held
[2026-06-26 13:25:51] GL_ELEVATED mounting_or_insufficient_samples gl=122.4 pss=723.2 views=922 restart_held
[2026-06-26 13:31:47] GL_ELEVATED mounting_or_insufficient_samples gl=122.4 pss=703.2 views=922 restart_held
[2026-06-26 13:36:08] GL_ELEVATED mounting_or_insufficient_samples gl=122.4 pss=715.5 views=922 restart_held
[2026-06-26 13:46:26] GL_ELEVATED mounting_or_insufficient_samples gl=124 pss=727.9 views=922 restart_held
[2026-06-26 13:56:42] GL_ELEVATED mounting_or_insufficient_samples gl=124 pss=727.1 views=922 restart_held
[2026-06-26 14:02:10] GL_ELEVATED mounting_or_insufficient_samples gl=124 pss=707.4 views=922 restart_held
[2026-06-26 14:06:58] GL_ELEVATED mounting_or_insufficient_samples gl=124 pss=721.3 views=922 restart_held
[2026-06-26 14:17:16] GL_ELEVATED mounting_or_insufficient_samples gl=124 pss=728.1 views=922 restart_held
[2026-06-26 14:27:33] GL_ELEVATED mounting_or_insufficient_samples gl=124 pss=729.2 views=922 restart_held
[2026-06-26 14:32:25] GL_ELEVATED mounting_or_insufficient_samples gl=124 pss=709.4 views=922 restart_held
[2026-06-26 14:37:50] GL_ELEVATED mounting_or_insufficient_samples gl=124 pss=722.5 views=922 restart_held
[2026-06-26 14:48:07] GL_ELEVATED mounting_or_insufficient_samples gl=124 pss=720.1 views=922 restart_held
[2026-06-26 14:58:24] GL_ELEVATED mounting_or_insufficient_samples gl=124 pss=738.8 views=922 restart_held
[2026-06-26 15:02:42] GL_ELEVATED mounting_or_insufficient_samples gl=124 pss=715.8 views=922 restart_held
[2026-06-26 15:08:41] GL_ELEVATED mounting_or_insufficient_samples gl=124 pss=721.6 views=922 restart_held
[2026-06-26 15:19:03] GL_ELEVATED mounting_or_insufficient_samples gl=124 pss=718.3 views=922 restart_held
[2026-06-26 15:29:20] GL_ELEVATED mounting_or_insufficient_samples gl=124 pss=719.9 views=922 restart_held
[2026-06-26 15:32:57] GL_ELEVATED mounting_or_insufficient_samples gl=124 pss=717.6 views=922 restart_held
[2026-06-26 15:39:36] GL_ELEVATED mounting_or_insufficient_samples gl=124 pss=736.1 views=922 restart_held
[2026-06-26 15:49:55] GL_ELEVATED mounting_or_insufficient_samples gl=131 pss=793.5 views=313 restart_held
```

## remediation.log (tail)

```
[2026-06-26 11:51:01] INFO PSS_SOFT_CEILING pss=871.5 gl=127.4 views=928 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-26 11:53:06] INFO PSS_SOFT_CEILING pss=928.3 gl=141.2 views=317 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-26 13:01:30] INFO GL_ELEVATED mounting_or_insufficient_samples gl=122.4 pss=720 views=922 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-26 13:05:20] INFO GL_ELEVATED mounting_or_insufficient_samples gl=122.4 pss=716 views=922 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-26 13:15:35] INFO GL_ELEVATED mounting_or_insufficient_samples gl=122.4 pss=715.7 views=922 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-26 13:25:51] INFO GL_ELEVATED mounting_or_insufficient_samples gl=122.4 pss=723.2 views=922 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-26 13:31:47] INFO GL_ELEVATED mounting_or_insufficient_samples gl=122.4 pss=703.2 views=922 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-26 13:36:08] INFO GL_ELEVATED mounting_or_insufficient_samples gl=122.4 pss=715.5 views=922 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-26 13:46:26] INFO GL_ELEVATED mounting_or_insufficient_samples gl=124 pss=727.9 views=922 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-26 13:56:42] INFO GL_ELEVATED mounting_or_insufficient_samples gl=124 pss=727.1 views=922 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-26 14:02:10] INFO GL_ELEVATED mounting_or_insufficient_samples gl=124 pss=707.4 views=922 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-26 14:06:58] INFO GL_ELEVATED mounting_or_insufficient_samples gl=124 pss=721.3 views=922 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-26 14:17:16] INFO GL_ELEVATED mounting_or_insufficient_samples gl=124 pss=728.1 views=922 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-26 14:27:33] INFO GL_ELEVATED mounting_or_insufficient_samples gl=124 pss=729.2 views=922 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-26 14:32:25] INFO GL_ELEVATED mounting_or_insufficient_samples gl=124 pss=709.4 views=922 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-26 14:37:50] INFO GL_ELEVATED mounting_or_insufficient_samples gl=124 pss=722.5 views=922 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-26 14:48:07] INFO GL_ELEVATED mounting_or_insufficient_samples gl=124 pss=720.1 views=922 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-26 14:58:24] INFO GL_ELEVATED mounting_or_insufficient_samples gl=124 pss=738.8 views=922 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-26 15:02:42] INFO GL_ELEVATED mounting_or_insufficient_samples gl=124 pss=715.8 views=922 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-26 15:08:41] INFO GL_ELEVATED mounting_or_insufficient_samples gl=124 pss=721.6 views=922 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-26 15:19:03] INFO GL_ELEVATED mounting_or_insufficient_samples gl=124 pss=718.3 views=922 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-26 15:29:20] INFO GL_ELEVATED mounting_or_insufficient_samples gl=124 pss=719.9 views=922 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-26 15:32:57] INFO GL_ELEVATED mounting_or_insufficient_samples gl=124 pss=717.6 views=922 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-26 15:39:36] INFO GL_ELEVATED mounting_or_insufficient_samples gl=124 pss=736.1 views=922 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-26 15:49:55] INFO GL_ELEVATED mounting_or_insufficient_samples gl=131 pss=793.5 views=313 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
```

## mem-alerts.log (tail)

```
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
[2026-06-26 08:16:46] PSS +41.1MB GL 56.2MB views=297
[2026-06-26 09:38:59] GL +184MB views=923 (PSS 201.7MB) ??active hub
[2026-06-26 09:57:44] GL +18.4MB views=289 (PSS 25MB) ??active hub
[2026-06-26 10:59:38] CRITICAL process not running ??check crash-*.log
[2026-06-26 11:01:47] CRITICAL process not running ??check crash-*.log
[2026-06-26 11:22:05] GL +109.9MB views=311 (PSS 239.2MB) ??active hub
[2026-06-26 11:40:35] GL +98.8MB views=928 (PSS 103.7MB) ??active hub
[2026-06-26 11:53:01] GL +13.8MB views=317 (PSS 56.8MB) ??active hub
[2026-06-26 12:01:16] CRITICAL process not running ??check crash-*.log
[2026-06-26 12:03:26] CRITICAL process not running ??check crash-*.log
[2026-06-26 13:01:26] GL +93.9MB views=922 (PSS 127.9MB) ??active hub
[2026-06-26 15:49:49] PSS +57.4MB GL 131MB views=313
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

