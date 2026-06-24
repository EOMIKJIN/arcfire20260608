# Arcfire watch ??final report (KST)

Generated (KST): 2026-06-24 08:00:00
Package: com.arcfire.online

## Runtime

| pid | PSS (MB) | GL (MB) | Views |
|-----|----------|---------|-------|
| 21407 | 895.9 | 54.9 | 315 |

## mem-timeline (since OVERNIGHT_WATCH_START)

```csv
2026-06-24 03:06:56,21407,876.8,889.4,54.6,19.8,74.5,487.4,25.9,,298,-5,0,
2026-06-24 03:17:01,21407,874.1,886.7,54.6,19.8,74.5,487.6,26.7,,302,-2.7,0,
2026-06-24 03:27:06,21407,899.9,912.5,55.3,40.7,95.9,489.7,28.7,,307,25.8,0.7,
2026-06-24 03:37:11,21407,872.6,885.5,54.6,19.8,74.5,487.4,29.3,,302,-27.3,-0.7,
2026-06-24 03:47:16,21407,871.1,884.1,54.6,19.8,74.5,491.3,27.9,,302,-1.5,0,
2026-06-24 03:57:21,21407,892.2,905,56.8,34.3,91.2,493.6,31.4,,321,21.1,2.2,
2026-06-24 04:07:26,21407,874.9,887.8,56.6,19.8,76.5,494.4,31.3,,302,-17.3,-0.2,
2026-06-24 04:17:32,21407,864.8,877.8,54.6,19.8,74.5,495.7,21.8,,306,-10.1,-2,
2026-06-24 04:27:37,21407,860.3,873.2,54.6,19.8,74.5,490.7,22.4,,302,-4.5,0,
2026-06-24 04:37:42,21407,865.1,878,54.6,19.8,74.5,489.5,27.9,,306,4.8,0,
2026-06-24 04:47:47,21407,888.3,901.3,54.9,34.3,89.2,491.8,33.6,,327,23.2,0.3,
2026-06-24 04:57:52,21407,880.9,893.8,56.6,19.8,76.5,497.3,33.1,,302,-7.4,1.7,
2026-06-24 05:07:57,21407,874.1,886.9,56.6,19.8,76.5,492.7,30.2,,306,-6.8,0,
2026-06-24 05:18:02,21407,882.7,895.6,56.6,19.8,76.5,496.5,34.8,,302,8.6,0,
2026-06-24 05:28:07,21407,877,889.9,54.6,19.8,74.5,493.7,33.7,,306,-5.7,-2,
2026-06-24 05:38:12,21407,884.9,897.7,54.9,34.3,89.2,491.9,28,,327,7.9,0.3,
2026-06-24 05:48:17,21407,875.5,888.3,56.6,19.8,76.5,495.8,27.2,,306,-9.4,1.7,
2026-06-24 05:58:22,21407,883.7,896.5,56.6,19.8,76.5,500.1,30.5,,306,8.2,0,
2026-06-24 06:08:27,21407,872.4,885.3,56.6,19.8,76.5,493,26.1,,306,-11.3,0,
2026-06-24 06:18:31,21407,886.7,899.6,56.6,19.8,76.5,500.3,32.6,,306,14.3,0,
2026-06-24 06:28:37,21407,893.3,906,54.9,34.3,89.2,498.3,28.3,,331,6.6,-1.7,
2026-06-24 06:38:42,21407,875.6,887.3,54.6,19.8,74.5,493.3,28.5,,306,-17.7,-0.3,
2026-06-24 06:48:47,21407,875.3,888.2,54.6,19.8,74.5,493.3,28.8,,298,-0.3,0,
2026-06-24 06:58:52,21407,879.5,888.9,54.6,19.8,74.5,496.5,29.6,,306,4.2,0,
2026-06-24 07:08:58,21407,879.5,889,56.6,19.8,76.5,493.6,29.6,,306,0,2,
2026-06-24 07:19:02,21407,903.2,912.9,54.9,34.3,89.2,501.1,33.4,,331,23.7,-1.7,
2026-06-24 07:29:08,21407,885.2,894.7,56.6,19.8,76.5,493.6,35,,306,-18,1.7,
2026-06-24 07:39:13,21407,883.7,893.7,54.6,19.8,74.5,496.3,33,,310,-1.5,-2,
2026-06-24 07:49:18,21407,892.9,903,56.6,19.8,76.5,498.9,37.4,,306,9.2,2,
2026-06-24 07:59:23,21407,897.5,907.8,54.6,19.8,74.5,502.6,39.4,,310,4.6,-2,
```

## incidents.log (tail)

```
[2026-06-23 17:59:18] REFIX_REQUESTED gl_critical_active_hub
[2026-06-23 18:09:23] GL_HARD_CEILING gl=224.6 pss=634.1 views=285
[2026-06-23 18:09:23] REFIX_REQUESTED gl_critical_active_hub
[2026-06-23 18:19:27] GL_HARD_CEILING gl=226.8 pss=648.6 views=306
[2026-06-23 18:19:27] REFIX_REQUESTED gl_critical_active_hub
[2026-06-23 18:39:06] SOAK_1H_END repeat_play_after_combat-20260623-173855 pid_changes=0 crashes=0 peak_gl=226.6 peak_pss=703
[2026-06-23 18:39:36] GL_ELEVATED mounting_or_insufficient_samples gl=102.6 pss=608.3 views=302 restart_held
[2026-06-23 19:40:05] GL_ELEVATED mounting_or_insufficient_samples gl=196.8 pss=684.5 views=292 restart_held
[2026-06-23 20:41:16] PLAYTEST_START playtest-20260623-204116 interval=10m paused=True
[2026-06-23 20:41:34] PLAYTEST_MILESTONE precision_monitor_transit_postflow_start
[2026-06-23 20:43:23] PLAYTEST_START playtest-20260623-204323 interval=10m paused=True
[2026-06-23 20:45:28] INVESTIGATION_TRIGGERED arcfire_crash_playtest
[2026-06-23 20:53:50] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-23 21:23:48] GL_ELEVATED mounting_or_insufficient_samples gl=145.5 pss=775.6 views=939 restart_held
[2026-06-23 21:38:17] PLAYTEST_MILESTONE arcadia_idle_2h_soak_start
[2026-06-23 21:40:57] PLAYTEST_MILESTONE arcadia_idle_codefix_applied
[2026-06-23 22:46:41] INVESTIGATION_TRIGGERED arcfire_crash_playtest
[2026-06-23 23:55:16] GL_ELEVATED mounting_or_insufficient_samples gl=80.4 pss=787.6 views=317 restart_held
[2026-06-24 00:05:22] GL_ELEVATED mounting_or_insufficient_samples gl=80.4 pss=795.6 views=320 restart_held
[2026-06-24 00:15:33] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-24 00:25:37] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-24 00:46:03] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-24 00:56:08] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-24 00:56:48] PLAYTEST_MILESTONE solar_port_idle_overnight_until_8am_opus
[2026-06-24 01:06:14] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
```

## remediation.log (tail)

```
[2026-06-24 00:46:03] packed D:\arcfire20260607\tools\long-run-monitor\outbox\cursor-incident-handoff.md
[2026-06-24 00:46:03] INVESTIGATION trigger -> .cursor/trigger-incident-auto-fix.json
[2026-06-24 00:46:03] INVESTIGATION code-fix handoff only (monitor-paused ??no app relaunch)
[2026-06-24 00:46:05] INVESTIGATION audit:skia-memory completed (paused mode static gate)
[2026-06-24 00:46:05] INVESTIGATION done reason=mem_hard_ceiling_playtest
[2026-06-24 00:55:48] INFO GL_HARD_CEILING_RECORD_ONLY gl=68.9 pss=1064.7 views=290 (monitor-paused ??no incident/refix spam)
[2026-06-24 00:56:06] INVESTIGATION start reason=mem_hard_ceiling_playtest
[2026-06-24 00:56:06] INVESTIGATION alert=[2026-06-24 00:56:06] [MEM_HARD_CEILING] pss=1064.7MB gl=68.9MB
[2026-06-24 00:56:08] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260624-005606.log
[2026-06-24 00:56:08] INVESTIGATION mem snapshot gl=70.9MB pss=1070.7MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260624-005606.log
[2026-06-24 00:56:08] packed D:\arcfire20260607\tools\long-run-monitor\outbox\cursor-incident-handoff.md
[2026-06-24 00:56:08] INVESTIGATION trigger -> .cursor/trigger-incident-auto-fix.json
[2026-06-24 00:56:08] INVESTIGATION code-fix handoff only (monitor-paused ??no app relaunch)
[2026-06-24 00:56:11] INVESTIGATION audit:skia-memory completed (paused mode static gate)
[2026-06-24 00:56:11] INVESTIGATION done reason=mem_hard_ceiling_playtest
[2026-06-24 00:57:11] INVESTIGATION throttled reason=mem_hard_ceiling_playtest (duplicate within window)
[2026-06-24 01:06:12] INVESTIGATION start reason=mem_hard_ceiling_playtest
[2026-06-24 01:06:12] INVESTIGATION alert=[2026-06-24 01:06:12] [MEM_HARD_CEILING] pss=1063.6MB gl=69.3MB
[2026-06-24 01:06:13] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260624-010612.log
[2026-06-24 01:06:13] INVESTIGATION mem snapshot gl=69.1MB pss=1047.1MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260624-010612.log
[2026-06-24 01:06:13] packed D:\arcfire20260607\tools\long-run-monitor\outbox\cursor-incident-handoff.md
[2026-06-24 01:06:14] INVESTIGATION trigger -> .cursor/trigger-incident-auto-fix.json
[2026-06-24 01:06:14] INVESTIGATION code-fix handoff only (monitor-paused ??no app relaunch)
[2026-06-24 01:06:17] INVESTIGATION audit:skia-memory completed (paused mode static gate)
[2026-06-24 01:06:17] INVESTIGATION done reason=mem_hard_ceiling_playtest
```

## mem-alerts.log (tail)

```
[2026-06-22 23:30:31] GL +91.3MB views=929 (PSS 126.8MB) ??active hub
[2026-06-23 00:31:25] PSS +122.2MB GL 55.9MB views=314
[2026-06-23 03:01:44] CRITICAL process not running ??check crash-*.log
[2026-06-23 03:04:36] CRITICAL process not running ??check crash-*.log
[2026-06-23 03:07:12] CRITICAL process not running ??check crash-*.log
[2026-06-23 04:01:48] GL +10.2MB views=293 (PSS -7.1MB) ??active hub
[2026-06-23 10:02:53] CRITICAL process not running ??check crash-*.log
[2026-06-23 10:05:40] CRITICAL process not running ??check crash-*.log
[2026-06-23 11:42:59] GL +16.6MB views=310 (PSS 44.4MB) ??active hub
[2026-06-23 12:13:05] GL +98.8MB views=284 (PSS 128.5MB) ??active hub
[2026-06-23 13:13:14] GL +10.5MB views=293 (PSS 17MB) ??active hub
[2026-06-23 14:43:28] CRITICAL process not running ??check crash-*.log
[2026-06-23 15:07:55] GL +126.6MB views=286 (PSS 177.2MB) ??active hub
[2026-06-23 16:58:45] GL +9.4MB views=289 (PSS 4.5MB) ??active hub
[2026-06-23 17:08:49] GL +8MB views=280 (PSS -13.3MB) ??active hub
[2026-06-23 19:09:45] GL +126.4MB views=282 (PSS 165.6MB) ??active hub
[2026-06-23 19:50:05] CRITICAL process not running ??check crash-*.log
[2026-06-23 20:30:25] GL +109.7MB views=957 (PSS 179.5MB) ??active hub
[2026-06-23 20:40:32] GL +9.9MB views=325 (PSS 105.2MB) ??active hub
[2026-06-23 22:24:11] GL +9.9MB views=302 (PSS 33.3MB) ??active hub
[2026-06-23 23:14:45] GL +10.9MB views=300 (PSS 56.8MB) ??active hub
[2026-06-23 23:34:57] PSS +61.3MB GL 46.6MB views=366
[2026-06-23 23:45:05] GL +33.2MB views=922 (PSS 26.6MB) ??active hub
[2026-06-24 00:15:23] GL +181.7MB views=951 (PSS 211.3MB) ??active hub
[2026-06-24 01:26:00] PSS +71.4MB GL 53.5MB views=298
```

## KPI (overnight window)

| Metric | Count |
|--------|-------|
| GL_HARD_CEILING incidents | 16 |
| Crash / PROCESS_DEATH | 77 |
| Auto app relaunch | 16 |

## Action items for Kim Team Lead

1. GL_HARD_CEILING or 3x GL_SPIKE ??P0 hub Skia audit (see overnight-watch handoff).
2. SIGSEGV/FATAL ??arcfire-bug-debug-workflow + logcat tail in latest crash-*.log.
3. Stair-step floor rise without crash ??today's dev P0 list in overnight-watch handoff.

