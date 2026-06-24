# Arcfire 3h state watch report (KST)

Generated (KST): 2026-06-24 13:00:07
Package: com.arcfire.online

## Runtime

| pid | PSS (MB) | GL (MB) | Views |
|-----|----------|---------|-------|
| 820 | 796.4 | 33.9 | 289 |

## mem-timeline (since STATE_WATCH_3H_START)

```csv
2026-06-24 08:39:42,12104,637.5,774.6,43.6,19.8,63.4,332.2,33.4,,375,12.9,3.4,
2026-06-24 08:49:48,12104,789.6,926.6,54.2,40.7,94.8,416.1,37.9,,390,152.1,10.6,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-06-24 08:59:55,12104,753.4,886,43.5,19.8,63.3,405.8,33.3,,362,-36.2,-10.7,GL_RECOVERED idle_ok
2026-06-24 09:10:03,12104,790.7,924.1,50.1,19.8,69.9,428.7,39.1,,1210,37.3,6.6,
2026-06-24 09:20:08,12104,829.1,605.5,144,19.8,163.8,234.2,19.6,,900,38.4,93.9,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-06-24 09:30:15,12104,854.8,863.5,36,19.8,55.8,491.8,26.1,,402,25.7,-108,GL_RECOVERED idle_ok
2026-06-24 09:40:20,12104,879.8,889.3,63.2,19.8,83.1,494.7,28.3,,296,25,27.2,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-06-24 09:50:25,12104,900.5,906.6,55.1,19.8,74.9,495,34.8,,319,20.7,-8.1,GL_RECOVERED idle_ok
2026-06-24 09:57:52,12104,1118.1,1102,113,40.7,153.6,577.5,67.8,,297,217.6,57.9,GL_SPIKE suspect=hub_skia MANUAL
2026-06-24 10:00:31,12104,1082.7,1066.6,120.6,40.7,161.3,572.5,32.4,,293,-35.4,7.6,
2026-06-24 10:01:19,21100,364.4,,4.4,,,,,,13,,,POST_REMEDIATION_VERIFY_OK
2026-06-24 10:11:20,21100,518.2,639.9,9,19.8,28.9,260.6,28.9,,98,,,
2026-06-24 10:21:25,21100,543,656.9,9,19.8,28.9,273.9,41.5,,98,24.8,0,
2026-06-24 10:31:30,21100,816,932.5,133,40.7,173.6,369.1,37.8,,284,273,124,HUB_ACTIVATION gl_mount_ok
2026-06-24 10:41:38,21100,959.9,1075.1,226.6,19.8,246.4,443,35.1,,293,143.9,93.6,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-06-24 10:42:25,23327,362,,4.4,,,,,,13,,,POST_REMEDIATION_VERIFY_OK
2026-06-24 10:52:27,23327,513.8,627.8,7,19.8,26.8,259.2,25.5,,98,,,
2026-06-24 11:02:33,23327,540.1,654.1,7,19.8,26.8,255.4,42.6,,98,26.3,0,
2026-06-24 11:12:38,23327,757,875.6,46.5,19.8,66.3,397,29.4,,290,216.9,39.5,HUB_ACTIVATION gl_mount_ok
2026-06-24 11:22:43,23327,833.5,948.8,47.5,19.8,67.3,429.8,70.8,,302,76.5,1,PSS_SPIKE review=graphics+native
2026-06-24 11:32:50,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-06-24 11:42:51,26224,790.1,907.7,121.4,40.7,162.1,374.6,28.2,,284,,,
2026-06-24 11:52:56,26224,948.1,1061.8,216.1,19.8,236,452,39,,388,,,
2026-06-24 11:53:42,26927,355.7,,4.4,,,,,,13,,,POST_REMEDIATION_VERIFY_OK
2026-06-24 12:03:44,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-06-24 12:13:44,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-06-24 12:23:45,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-06-24 12:33:46,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-06-24 12:43:46,820,202.9,293,4.6,53.7,58.3,13.4,26.7,,14,,,
2026-06-24 12:53:53,820,768.3,888.1,33.9,19.8,53.7,449.4,31.8,,290,,,
```

## incidents.log (tail)

```
[2026-06-24 00:56:48] PLAYTEST_MILESTONE solar_port_idle_overnight_until_8am_opus
[2026-06-24 01:06:14] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-24 09:20:13] GL_ELEVATED mounting_or_insufficient_samples gl=144 pss=829.1 views=900 restart_held
[2026-06-24 09:58:13] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-24 09:58:44] STATE_WATCH_3H_START 2026-06-24 09:58:43 KST
[2026-06-24 10:00:36] GL_HARD_CEILING gl=120.6 pss=1082.7 views=293
[2026-06-24 10:00:36] REFIX_REQUESTED gl_critical_active_hub
[2026-06-24 10:31:36] GL_ELEVATED mounting_or_insufficient_samples gl=133 pss=816 views=284 restart_held
[2026-06-24 10:41:43] GL_HARD_CEILING gl=226.6 pss=959.9 views=293
[2026-06-24 10:41:43] REFIX_REQUESTED gl_critical_active_hub
[2026-06-24 10:41:59] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-24 11:22:49] PSS_SOFT_CEILING pss=833.5 gl=47.5 views=302 native_reclaim_advisory
[2026-06-24 11:34:10] PROCESS_EXIT clean (no recent crash signature) ??relaunch skipped
[2026-06-24 11:42:55] GL_ELEVATED mounting_or_insufficient_samples gl=121.4 pss=790.1 views=284 restart_held
[2026-06-24 11:53:01] GL_HARD_CEILING gl=216.1 pss=948.1 views=388
[2026-06-24 11:53:01] REFIX_REQUESTED gl_critical_active_hub
[2026-06-24 11:53:07] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-24 12:04:26] PROCESS_EXIT clean (no recent crash signature) ??relaunch skipped
[2026-06-24 12:09:32] PROCESS_EXIT clean (no recent crash signature) ??relaunch skipped
[2026-06-24 12:14:38] PROCESS_EXIT clean (no recent crash signature) ??relaunch skipped
[2026-06-24 12:19:45] PROCESS_EXIT clean (no recent crash signature) ??relaunch skipped
[2026-06-24 12:24:49] PROCESS_EXIT clean (no recent crash signature) ??relaunch skipped
[2026-06-24 12:29:54] PROCESS_EXIT clean (no recent crash signature) ??relaunch skipped
[2026-06-24 12:34:59] PROCESS_EXIT clean (no recent crash signature) ??relaunch skipped
[2026-06-24 12:40:04] PROCESS_EXIT clean (no recent crash signature) ??relaunch skipped
```

## remediation.log (tail)

```
[2026-06-24 11:53:01] INCIDENT GL_HARD_CEILING gl=216.1 pss=948.1 views=388 -> immediate remediation (OOM imminent)
[2026-06-24 11:53:01] REFIX_REQUESTED gl_critical_active_hub -> gl-leak-refix-requested.flag
[2026-06-24 11:53:01] AUTO_FIX static audit:skia-memory start
[2026-06-24 11:53:03] AUTO_FIX audit:skia-memory PASS
[2026-06-24 11:53:03] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-06-24 11:53:05] INVESTIGATION start reason=mem_hard_ceiling_playtest
[2026-06-24 11:53:05] INVESTIGATION alert=[2026-06-24 11:53:05] [MEM_HARD_CEILING] pss=948.1MB gl=216.1MB
[2026-06-24 11:53:07] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260624-115305.log
[2026-06-24 11:53:07] INVESTIGATION mem snapshot gl=MB pss=MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260624-115305.log
[2026-06-24 11:53:07] packed D:\arcfire20260607\tools\long-run-monitor\outbox\cursor-incident-handoff.md
[2026-06-24 11:53:07] INVESTIGATION trigger -> .cursor/trigger-incident-auto-fix.json
[2026-06-24 11:53:07] INVESTIGATION done reason=mem_hard_ceiling_playtest
[2026-06-24 11:53:20] AUTO_FIX baseline reset pid=26927 gl=6MB pss=217.5MB
[2026-06-24 11:53:20] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-06-24 11:53:42] VERIFY PASS pid=26927 gl=4.4MB pss=355.7MB views=13
[2026-06-24 11:53:42] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":948.1,"views":388,"lastGlMb":216.1,"hardCeiling":true}
[2026-06-24 11:53:43] HANDOFF packed -> outbox/cursor-incident-handoff.md (Kim Team Lead triage)
[2026-06-24 12:04:26] INFO PROCESS_EXIT clean (no recent crash) -> relaunch skipped (manual close / verification safe)
[2026-06-24 12:09:32] INFO PROCESS_EXIT clean (no recent crash) -> relaunch skipped (manual close / verification safe)
[2026-06-24 12:14:38] INFO PROCESS_EXIT clean (no recent crash) -> relaunch skipped (manual close / verification safe)
[2026-06-24 12:19:45] INFO PROCESS_EXIT clean (no recent crash) -> relaunch skipped (manual close / verification safe)
[2026-06-24 12:24:49] INFO PROCESS_EXIT clean (no recent crash) -> relaunch skipped (manual close / verification safe)
[2026-06-24 12:29:54] INFO PROCESS_EXIT clean (no recent crash) -> relaunch skipped (manual close / verification safe)
[2026-06-24 12:34:59] INFO PROCESS_EXIT clean (no recent crash) -> relaunch skipped (manual close / verification safe)
[2026-06-24 12:40:04] INFO PROCESS_EXIT clean (no recent crash) -> relaunch skipped (manual close / verification safe)
```

## mem-alerts.log (tail)

```
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
[2026-06-24 08:49:48] GL +10.6MB views=390 (PSS 152.1MB) ??active hub
[2026-06-24 09:20:08] GL +93.9MB views=900 (PSS 38.4MB) ??active hub
[2026-06-24 09:40:20] GL +27.2MB views=296 (PSS 25MB) ??active hub
[2026-06-24 10:41:38] GL +93.6MB views=293 (PSS 143.9MB) ??active hub
[2026-06-24 11:22:43] PSS +76.5MB GL 47.5MB views=302
[2026-06-24 11:32:50] CRITICAL process not running ??check crash-*.log
[2026-06-24 12:03:44] CRITICAL process not running ??check crash-*.log
[2026-06-24 12:13:44] CRITICAL process not running ??check crash-*.log
[2026-06-24 12:23:45] CRITICAL process not running ??check crash-*.log
[2026-06-24 12:33:46] CRITICAL process not running ??check crash-*.log
```

## KPI (overnight window)

| Metric | Count |
|--------|-------|
| GL_HARD_CEILING incidents | 19 |
| Crash / PROCESS_DEATH | 86 |
| Auto app relaunch | 19 |

## Action items for Kim Team Lead

1. GL_HARD_CEILING or 3x GL_SPIKE ??P0 hub Skia audit (see overnight-watch handoff).
2. SIGSEGV/FATAL ??arcfire-bug-debug-workflow + logcat tail in latest crash-*.log.
3. Stair-step floor rise without crash ??today's dev P0 list in overnight-watch handoff.

