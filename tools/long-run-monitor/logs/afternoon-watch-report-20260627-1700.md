# Arcfire

Generated (KST): 2026-06-27 17:04:28
Package: com.arcfire.online

## Runtime

| pid | PSS (MB) | GL (MB) | Views |
|-----|----------|---------|-------|
| 20481 | 804 | 34.2 | 384 |

## mem-timeline (since AFTERNOON_WATCH_START)

```csv
2026-06-27 13:17:03,20481,670.8,730,20.5,19.8,40.3,353,45,,15,-91.5,-35.4,GL_RECOVERED idle_ok
2026-06-27 13:21:17,20481,883.5,661.9,90.2,19.8,110,320,21.2,,465,212.7,69.7,HUB_ACTIVATION gl_mount_ok
2026-06-27 13:31:37,20481,712.2,504,33.7,20,53.6,222.7,22.1,,384,-171.3,-56.5,GL_RECOVERED idle_ok
2026-06-27 13:41:56,20481,736.7,534.4,33.2,19.8,53,228.9,40,,392,24.5,-0.5,
2026-06-27 13:47:32,20481,735.8,533.3,35.1,19.8,55,229.3,33.6,,376,-0.9,1.9,
2026-06-27 13:52:14,20481,736.9,534.6,33.2,19.8,53,232.2,31.5,,389,1.1,-1.9,
2026-06-27 14:02:39,20481,783.5,598.9,40,40.7,80.7,251.8,35.2,,411,46.6,6.8,PSS_SPIKE review=graphics+native
2026-06-27 14:12:56,20481,762.1,577.8,43.5,19.8,63.4,248,34,,372,-21.4,3.5,
2026-06-27 14:17:56,20481,779.3,594.7,44.1,40.7,84.8,252.8,26.2,,389,17.2,0.6,
2026-06-27 14:23:13,20481,779.4,594.9,43.8,34.3,78.1,250.7,34.9,,413,0.1,-0.3,
2026-06-27 14:33:29,20481,751.7,564.3,34.2,19.8,54,249.5,37.7,,400,-27.7,-9.6,GL_RECOVERED idle_ok
2026-06-27 14:43:47,20481,773.7,586.6,34.4,34.3,68.7,259.9,38.3,,422,22,0.2,
2026-06-27 14:48:13,20481,787.1,599.7,34.8,40.7,75.5,256.8,47.8,,401,13.4,0.4,
2026-06-27 14:54:04,20481,773.2,585.6,36.2,19.8,56,262.4,51.9,,392,-13.9,1.4,
2026-06-27 15:04:23,20481,763.1,579,34.4,34.3,68.8,263,33.3,,425,-10.1,-1.8,
2026-06-27 15:14:41,20481,748.3,564.3,34.2,19.8,54,264.4,35.8,,404,-14.8,-0.2,
2026-06-27 15:18:30,20481,772.3,589.6,34.5,34.3,68.8,268.6,41.9,,401,24,0.3,
2026-06-27 15:24:58,20481,768.5,585.8,34.5,34.3,68.8,269.7,36.7,,417,-3.8,0,
2026-06-27 15:35:15,20481,770.5,587.9,36.2,19.8,56,273.1,48.1,,404,2,1.7,
2026-06-27 15:45:33,20481,779.7,597.1,34.4,34.3,68.7,275.4,41.7,,429,9.2,-1.8,
2026-06-27 15:48:48,20481,774.8,591.9,34.4,34.3,68.7,275.5,37.9,,405,-4.9,0,
2026-06-27 15:55:51,20481,774.8,591.5,34.2,19.8,54,275,56,,368,0,-0.2,
2026-06-27 16:06:08,20481,777.2,593.5,34.4,34.3,68.7,279.7,38.5,,391,2.4,0.2,
2026-06-27 16:16:25,20481,770.1,582.2,34.2,19.8,54,284.9,43.5,,372,-7.1,-0.2,
2026-06-27 16:19:05,20481,776.3,588.5,34.2,19.8,54,281.9,52.9,,383,6.2,0,
2026-06-27 16:26:43,20481,786.6,593.8,34.4,34.3,68.7,288.8,41.6,,385,10.3,0.2,
2026-06-27 16:37:00,20481,770.4,561.7,34.2,19.8,54,272.4,42.8,,372,-16.2,-0.2,
2026-06-27 16:47:20,20481,783.7,574,34.3,30.2,64.6,273.6,44.6,,379,13.3,0.1,
2026-06-27 16:49:22,20481,795,585.4,34.2,19.8,54,278.1,61.9,,376,11.3,-0.1,
2026-06-27 16:57:37,20481,791.8,582.4,34.2,19.8,54,276.5,59.6,,374,-3.2,0,
```

## incidents.log (tail)

```
[2026-06-27 08:00:19] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-27 08:10:43] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-27 08:21:08] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-27 08:31:12] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-27 08:41:36] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-27 08:51:48] PSS_SOFT_CEILING pss=923.1 gl=44.1 views=392 native_reclaim_advisory
[2026-06-27 09:02:06] PSS_SOFT_CEILING pss=946.4 gl=42.8 views=397 native_reclaim_advisory
[2026-06-27 09:12:24] PSS_SOFT_CEILING pss=933.6 gl=42.1 views=377 native_reclaim_advisory
[2026-06-27 09:14:06] PSS_SOFT_CEILING pss=922.6 gl=42.1 views=373 native_reclaim_advisory
[2026-06-27 09:23:03] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-27 09:25:33] PLAYTEST_MILESTONE mem_fix_3h_soak_start_20260627
[2026-06-27 09:25:59] STATE_WATCH_3H_START 2026-06-27 09:25:58 KST
[2026-06-27 09:33:28] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-27 10:34:58] PSS_SOFT_CEILING pss=930.9 gl=152.7 views=553 native_reclaim_advisory
[2026-06-27 10:55:45] PSS_SOFT_CEILING pss=934.7 gl=156.7 views=575 native_reclaim_advisory
[2026-06-27 11:06:20] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-27 11:15:33] PSS_SOFT_CEILING pss=807.7 gl=40.1 views=388 native_reclaim_advisory
[2026-06-27 11:16:32] PSS_SOFT_CEILING pss=811.8 gl=42.1 views=388 native_reclaim_advisory
[2026-06-27 11:26:56] PSS_SOFT_CEILING pss=852.5 gl=46.5 views=403 native_reclaim_advisory
[2026-06-27 11:37:16] PSS_SOFT_CEILING pss=840 gl=46.3 views=389 native_reclaim_advisory
[2026-06-27 11:45:58] PSS_SOFT_CEILING pss=873.1 gl=47.2 views=392 native_reclaim_advisory
[2026-06-27 11:47:36] PSS_SOFT_CEILING pss=849 gl=49 views=393 native_reclaim_advisory
[2026-06-27 11:58:09] INVESTIGATION_TRIGGERED arcfire_crash_playtest
[2026-06-27 13:21:22] PSS_SOFT_CEILING pss=883.5 gl=90.2 views=465 native_reclaim_advisory
[2026-06-27 08:00:05] AFTERNOON_WATCH_5PM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\afternoon-watch-report-20260627-1700.md
```

## remediation.log (tail)

```
[2026-06-27 11:06:17] INVESTIGATION start reason=mem_hard_ceiling_playtest
[2026-06-27 11:06:17] INVESTIGATION alert=[2026-06-27 11:06:17] [MEM_HARD_CEILING] pss=953.9MB gl=152.6MB
[2026-06-27 11:06:19] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260627-110617.log
[2026-06-27 11:06:20] INVESTIGATION mem snapshot gl=152.6MB pss=950.7MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260627-110617.log
[2026-06-27 11:06:20] packed D:\arcfire20260607\tools\long-run-monitor\outbox\cursor-incident-handoff.md
[2026-06-27 11:06:20] INVESTIGATION trigger -> .cursor/trigger-incident-auto-fix.json
[2026-06-27 11:06:20] INVESTIGATION code-fix handoff only (monitor-paused ??no app relaunch)
[2026-06-27 11:06:23] INVESTIGATION audit:skia-memory completed (paused mode static gate)
[2026-06-27 11:06:23] INVESTIGATION done reason=mem_hard_ceiling_playtest
[2026-06-27 11:15:33] INFO PSS_SOFT_CEILING pss=807.7 gl=40.1 views=388 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-27 11:16:32] INFO PSS_SOFT_CEILING pss=811.8 gl=42.1 views=388 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-27 11:26:56] INFO PSS_SOFT_CEILING pss=852.5 gl=46.5 views=403 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-27 11:37:16] INFO PSS_SOFT_CEILING pss=840 gl=46.3 views=389 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-27 11:45:58] INFO PSS_SOFT_CEILING pss=873.1 gl=47.2 views=392 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-27 11:47:36] INFO PSS_SOFT_CEILING pss=849 gl=49 views=393 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-27 11:58:07] INVESTIGATION start reason=arcfire_crash_playtest
[2026-06-27 11:58:07] INVESTIGATION alert=[2026-06-27 11:58:07] [ARCFIRE_CRASH age=0.2m] 06-27 11:57:53.268  9967 16572 F libc    : Fatal signal 11 (SIGSEGV), cod
[2026-06-27 11:58:08] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260627-115807.log
[2026-06-27 11:58:08] INVESTIGATION mem snapshot gl=MB pss=MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260627-115807.log
[2026-06-27 11:58:09] packed D:\arcfire20260607\tools\long-run-monitor\outbox\cursor-incident-handoff.md
[2026-06-27 11:58:09] INVESTIGATION trigger -> .cursor/trigger-incident-auto-fix.json
[2026-06-27 11:58:09] INVESTIGATION code-fix handoff only (monitor-paused ??no app relaunch)
[2026-06-27 11:58:11] INVESTIGATION audit:skia-memory completed (paused mode static gate)
[2026-06-27 11:58:11] INVESTIGATION done reason=arcfire_crash_playtest
[2026-06-27 13:21:22] INFO PSS_SOFT_CEILING pss=883.5 gl=90.2 views=465 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
```

## mem-alerts.log (tail)

```
[2026-06-26 20:58:30] GL +93.5MB views=928 (PSS 144.6MB) ??active hub
[2026-06-26 21:29:46] GL +99.1MB views=948 (PSS 182.1MB) ??active hub
[2026-06-26 21:40:04] PSS +131.7MB GL 145.1MB views=972
[2026-06-26 22:41:57] GL +9.2MB views=963 (PSS 89.2MB) ??active hub
[2026-06-27 00:15:19] GL +107.2MB views=951 (PSS 131.4MB) ??active hub
[2026-06-27 00:35:57] GL +114.5MB views=950 (PSS 170MB) ??active hub
[2026-06-27 00:46:17] GL +8.2MB views=950 (PSS 11.9MB) ??active hub
[2026-06-27 01:38:20] GL +12.3MB views=301 (PSS 61.8MB) ??active hub
[2026-06-27 02:09:30] GL +13.5MB views=377 (PSS 108.9MB) ??active hub
[2026-06-27 02:20:15] PSS +52.6MB GL 46.4MB views=465
[2026-06-27 02:30:36] GL +13.8MB views=322 (PSS 193.8MB) ??active hub
[2026-06-27 02:51:20] GL +87.3MB views=392 (PSS 115.7MB) ??active hub
[2026-06-27 04:41:19] PSS +41.2MB GL 51.8MB views=415
[2026-06-27 07:43:05] PSS +42.2MB GL 51.8MB views=387
[2026-06-27 08:41:20] GL +91.6MB views=545 (PSS 38.6MB) ??active hub
[2026-06-27 08:43:41] GL +12.2MB views=545 (PSS -5.5MB) ??active hub
[2026-06-27 09:22:37] GL +107.3MB views=545 (PSS 120.7MB) ??active hub
[2026-06-27 09:33:01] GL +115MB views=385 (PSS 170.8MB) ??active hub
[2026-06-27 10:04:03] PSS +47.6MB GL 26.9MB views=409
[2026-06-27 10:14:19] GL +12.3MB views=322 (PSS 59.6MB) ??active hub
[2026-06-27 10:34:54] GL +105.7MB views=553 (PSS 147.7MB) ??active hub
[2026-06-27 10:45:12] PSS +129.9MB GL 61.9MB views=21
[2026-06-27 11:26:50] PSS +40.7MB GL 46.5MB views=403
[2026-06-27 13:11:00] GL +11.7MB views=376 (PSS 35.9MB) ??active hub
[2026-06-27 14:02:39] PSS +46.6MB GL 40MB views=411
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

