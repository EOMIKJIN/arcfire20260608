# Arcfire release soak final report until 2026-06-25 18:00:00

Generated (KST): 2026-06-25 17:58:53
Package: com.arcfire.online

## Runtime

| pid | PSS (MB) | GL (MB) | Views |
|-----|----------|---------|-------|
| 26076 | 709.9 | 39.2 | 342 |

## mem-timeline (since RELEASE_SOAK_UNTIL_18H_20260625)

```csv
2026-06-25 14:19:24,30675,618.7,615,164.2,19.8,184,204.6,21.7,,278,186.6,88.5,GL_DELTA background_or_transition
2026-06-25 14:23:03,30675,506.3,502.9,62.3,40.7,102.9,173,22,,283,-112.4,-101.9,GL_RECOVERED idle_ok
2026-06-25 14:29:29,30675,499.3,495.9,62.5,40.7,103.2,170,17.4,,279,-7,0.2,
2026-06-25 14:39:35,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-06-25 14:49:35,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-06-25 14:53:09,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-06-25 14:59:36,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-06-25 15:09:36,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-06-25 15:19:37,17737,527.2,637.6,57,40.7,97.6,287.5,16.7,,279,,,
2026-06-25 15:23:10,17737,535.9,646.8,59,40.7,99.7,288.6,21.8,,279,,,
2026-06-25 15:29:43,17737,676.6,787.3,156.9,40.4,197.3,331.2,22.7,,53,140.7,97.9,GL_DELTA background_or_transition
2026-06-25 15:39:53,17737,538.9,649.9,45.4,19.8,65.3,320.6,21.6,,292,-137.7,-111.5,GL_RECOVERED idle_ok
2026-06-25 15:49:59,19255,602.1,724.7,114.5,19.8,134.3,323.2,20.4,,51,,,
2026-06-25 15:53:15,19255,763.6,886.4,210.5,19.8,230.4,382.9,27.6,,936,,,
2026-06-25 16:00:05,19255,627.9,750.2,44.7,40.7,85.4,400.3,20.4,,279,-135.7,-165.8,GL_RECOVERED idle_ok
2026-06-25 16:10:11,19255,814.6,936.9,252.1,19.8,271.9,393.3,24.1,,936,186.7,207.4,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-06-25 16:20:16,19255,622.3,713.7,44.1,40.7,84.8,380,27.4,,305,-192.3,-208,GL_RECOVERED idle_ok
2026-06-25 16:23:22,19255,604.1,690.5,44.1,40.7,84.8,377.1,24,,301,-18.2,0,
2026-06-25 16:30:24,19255,637.2,657.1,57.6,40.7,98.3,350.7,16.1,,279,33.1,13.5,GL_DELTA background_or_transition
2026-06-25 16:40:30,19255,623.5,644,58.3,19.8,78.2,348.9,19.9,,295,-13.7,0.7,
2026-06-25 16:50:37,19255,770.2,833.5,170.1,40.7,210.8,394.3,20.3,,355,146.7,111.8,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-06-25 16:53:30,19255,621.8,685.2,60.2,34.3,94.5,366.4,14.8,,281,-148.4,-109.9,GL_RECOVERED idle_ok
2026-06-25 17:00:42,19255,582.1,657.5,58.5,40.7,99.2,326,20.8,,275,-39.7,-1.7,
2026-06-25 17:10:47,19255,733,808.9,159.6,19.8,179.4,397.7,21,,283,150.9,101.1,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-06-25 17:20:53,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-06-25 17:23:35,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-06-25 17:30:54,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-06-25 17:40:54,26076,609.3,729.3,30.1,19.8,49.9,308.2,32.8,,404,,,
2026-06-25 17:51:01,26076,744.3,868.8,36,40.7,76.7,394.7,39,,356,,,
2026-06-25 17:53:36,26076,716.8,841.4,37.4,19.8,57.2,389.2,37.2,,347,-27.5,1.4,
```

## incidents.log (tail)

```
[2026-06-25 00:22:01] PSS_SOFT_CEILING pss=819.1 gl=50.3 views=305 native_reclaim_advisory
[2026-06-25 00:32:10] PSS_SOFT_CEILING pss=821.5 gl=39.6 views=342 native_reclaim_advisory
[2026-06-25 00:49:55] PSS_SOFT_CEILING pss=802.9 gl=39.4 views=318 native_reclaim_advisory
[2026-06-25 00:52:22] PSS_SOFT_CEILING pss=801.5 gl=39.3 views=310 native_reclaim_advisory
[2026-06-25 01:22:38] PSS_SOFT_CEILING pss=805 gl=39.9 views=328 native_reclaim_advisory
[2026-06-25 08:16:14] PSS_SOFT_CEILING pss=800.1 gl=39.9 views=352 native_reclaim_advisory
[2026-06-25 08:51:20] GL_HARD_CEILING gl=228.9 pss=991.1 views=947
[2026-06-25 08:51:20] REFIX_REQUESTED gl_critical_active_hub
[2026-06-25 08:51:21] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-25 09:22:07] GL_ELEVATED mounting_or_insufficient_samples gl=143.8 pss=491.1 views=291 restart_held
[2026-06-25 09:22:36] PLAYTEST_MILESTONE release_build_test_start_20260625
[2026-06-25 10:32:00] PLAYTEST_MILESTONE release_soak_watch_until_14h_kst1400
[] PLAYTEST_MILESTONE release_soak_watch_until_14h marker=RELEASE_SOAK_UNTIL_14H_20260625
[2026-06-25 10:32:12] PLAYTEST_MILESTONE release_soak_watch_until_14h marker=RELEASE_SOAK_UNTIL_14H_20260625
[2026-06-25 10:32:56] PLAYTEST_MILESTONE release_soak_watch_until_14h marker=RELEASE_SOAK_UNTIL_14H_20260625
[2026-06-25 11:17:46] GL_ELEVATED mounting_or_insufficient_samples gl=144.3 pss=563.8 views=932 restart_held
[2026-06-25 11:22:32] GL_ELEVATED mounting_or_insufficient_samples gl=140.3 pss=521.6 views=932 restart_held
[2026-06-25 14:18:30] PLAYTEST_MILESTONE release_soak_watch_extended_until_18h_kst
[2026-06-25 14:18:24] PLAYTEST_MILESTONE release_soak_watch_until marker=RELEASE_SOAK_UNTIL_18H_20260625 end=2026-06-25 18:00:00
[2026-06-25 14:32:07] INVESTIGATION_TRIGGERED arcfire_crash_playtest
[2026-06-25 15:40:35] INVESTIGATION_TRIGGERED arcfire_crash_playtest
[2026-06-25 15:53:20] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-25 16:10:27] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-25 16:50:41] GL_ELEVATED mounting_or_insufficient_samples gl=170.1 pss=770.2 views=355 restart_held
[2026-06-25 17:10:52] GL_ELEVATED mounting_or_insufficient_samples gl=159.6 pss=733 views=283 restart_held
```

## remediation.log (tail)

```
[2026-06-25 15:40:37] INVESTIGATION audit:skia-memory completed (paused mode static gate)
[2026-06-25 15:40:37] INVESTIGATION done reason=arcfire_crash_playtest
[2026-06-25 15:40:38] INVESTIGATION throttled reason=arcfire_crash_playtest (duplicate within window)
[2026-06-25 15:53:19] INVESTIGATION start reason=mem_hard_ceiling_playtest
[2026-06-25 15:53:19] INVESTIGATION alert=[2026-06-25 15:53:19] [MEM_HARD_CEILING] pss=763.6MB gl=210.5MB
[2026-06-25 15:53:20] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260625-155319.log
[2026-06-25 15:53:20] INVESTIGATION mem snapshot gl=210.5MB pss=751.6MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260625-155319.log
[2026-06-25 15:53:20] packed D:\arcfire20260607\tools\long-run-monitor\outbox\cursor-incident-handoff.md
[2026-06-25 15:53:20] INVESTIGATION trigger -> .cursor/trigger-incident-auto-fix.json
[2026-06-25 15:53:20] INVESTIGATION code-fix handoff only (monitor-paused ??no app relaunch)
[2026-06-25 15:53:20] INFO GL_HARD_CEILING_RECORD_ONLY gl=210.5 pss=763.6 views=936 (monitor-paused ??no incident/refix spam)
[2026-06-25 15:53:22] INVESTIGATION audit:skia-memory completed (paused mode static gate)
[2026-06-25 15:53:22] INVESTIGATION done reason=mem_hard_ceiling_playtest
[2026-06-25 16:10:15] INFO GL_HARD_CEILING_RECORD_ONLY gl=252.1 pss=814.6 views=936 (monitor-paused ??no incident/refix spam)
[2026-06-25 16:10:23] INVESTIGATION start reason=mem_hard_ceiling_playtest
[2026-06-25 16:10:24] INVESTIGATION alert=[2026-06-25 16:10:23] [MEM_HARD_CEILING] pss=814.6MB gl=252.1MB
[2026-06-25 16:10:26] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260625-161024.log
[2026-06-25 16:10:27] INVESTIGATION mem snapshot gl=228.4MB pss=821.3MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260625-161024.log
[2026-06-25 16:10:27] packed D:\arcfire20260607\tools\long-run-monitor\outbox\cursor-incident-handoff.md
[2026-06-25 16:10:27] INVESTIGATION trigger -> .cursor/trigger-incident-auto-fix.json
[2026-06-25 16:10:27] INVESTIGATION code-fix handoff only (monitor-paused ??no app relaunch)
[2026-06-25 16:10:29] INVESTIGATION audit:skia-memory completed (paused mode static gate)
[2026-06-25 16:10:29] INVESTIGATION done reason=mem_hard_ceiling_playtest
[2026-06-25 16:50:41] INFO GL_ELEVATED mounting_or_insufficient_samples gl=170.1 pss=770.2 views=355 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-25 17:10:52] INFO GL_ELEVATED mounting_or_insufficient_samples gl=159.6 pss=733 views=283 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
```

## mem-alerts.log (tail)

```
[2026-06-24 21:30:10] PSS +178MB GL 39.5MB views=294
[2026-06-24 22:19:17] GL +8.4MB views=301 (PSS -4.3MB) ??active hub
[2026-06-24 22:30:46] GL +105.3MB views=297 (PSS 142.1MB) ??active hub
[2026-06-24 23:01:05] GL +11.3MB views=284 (PSS 104.6MB) ??active hub
[2026-06-25 00:11:49] PSS +45.4MB GL 43.8MB views=315
[2026-06-25 08:51:13] GL +189.6MB views=947 (PSS 237.1MB) ??active hub
[2026-06-25 08:56:30] CRITICAL process not running ??check crash-*.log
[2026-06-25 09:06:30] CRITICAL process not running ??check crash-*.log
[2026-06-25 09:46:47] GL +10.1MB views=285 (PSS 24.6MB) ??active hub
[2026-06-25 10:27:14] PSS +77.7MB GL 50.4MB views=280
[2026-06-25 10:37:19] GL +11.9MB views=280 (PSS 2.7MB) ??active hub
[2026-06-25 11:17:42] GL +83.8MB views=932 (PSS 104.5MB) ??active hub
[2026-06-25 11:47:59] GL +16.2MB views=284 (PSS 12.1MB) ??active hub
[2026-06-25 14:09:19] GL +29.3MB views=299 (PSS -0.8MB) ??active hub
[2026-06-25 14:39:35] CRITICAL process not running ??check crash-*.log
[2026-06-25 14:49:35] CRITICAL process not running ??check crash-*.log
[2026-06-25 14:53:09] CRITICAL process not running ??check crash-*.log
[2026-06-25 14:59:36] CRITICAL process not running ??check crash-*.log
[2026-06-25 15:09:36] CRITICAL process not running ??check crash-*.log
[2026-06-25 16:10:11] GL +207.4MB views=936 (PSS 186.7MB) ??active hub
[2026-06-25 16:50:37] GL +111.8MB views=355 (PSS 146.7MB) ??active hub
[2026-06-25 17:10:47] GL +101.1MB views=283 (PSS 150.9MB) ??active hub
[2026-06-25 17:20:53] CRITICAL process not running ??check crash-*.log
[2026-06-25 17:23:35] CRITICAL process not running ??check crash-*.log
[2026-06-25 17:30:54] CRITICAL process not running ??check crash-*.log
```

## KPI (overnight window)

| Metric | Count |
|--------|-------|
| GL_HARD_CEILING incidents | 22 |
| Crash / PROCESS_DEATH | 89 |
| Auto app relaunch | 22 |

## Action items for Kim Team Lead

1. GL_HARD_CEILING or 3x GL_SPIKE ??P0 hub Skia audit (see overnight-watch handoff).
2. SIGSEGV/FATAL ??arcfire-bug-debug-workflow + logcat tail in latest crash-*.log.
3. Stair-step floor rise without crash ??today's dev P0 list in overnight-watch handoff.

