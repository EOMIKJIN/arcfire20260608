# Arcfire release build watch ??4h report (KST)

Generated (KST): 2026-06-23 14:42:38
Package: com.arcfire.online

## Runtime

**APP_NOT_RUNNING** at report time.

## mem-timeline (since RELEASE_BUILD_WATCH_START_2026-06-23)

```csv
2026-06-23 10:42:38,31582,323.9,376.5,37.1,34.3,71.4,78.9,16.4,,318,,,RELEASE_BUILD_WATCH_START_2026-06-23
2026-06-23 10:42:42,31582,331.6,386.6,37.1,34.3,71.4,80.5,18.3,,306,,,
2026-06-23 11:12:49,31582,298.3,353.9,30.4,,30.4,85.5,19.5,,293,-33.3,-6.7,GL_RECOVERED idle_ok
2026-06-23 11:42:59,31582,342.7,416.3,47,40.7,87.7,86.4,24.7,,310,44.4,16.6,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-06-23 12:13:05,31582,471.2,554,145.8,19.8,165.6,160,21.8,,284,128.5,98.8,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-06-23 12:43:08,31582,411.3,495.1,134.8,19.8,154.6,119,22.4,,281,-59.9,-11,GL_RECOVERED idle_ok
2026-06-23 13:13:14,31582,428.3,512.6,145.3,19.8,165.1,125.1,22.4,,293,17,10.5,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-06-23 13:43:18,12357,495.8,619.8,130.4,19.8,150.3,200,18.2,,937,,,
2026-06-23 14:13:24,15220,201.4,318.1,10.2,19.8,30,42.3,22.5,,93,,,
```

## incidents.log (tail)

```
[2026-06-21 23:30:30] GL_ELEVATED mounting_or_insufficient_samples gl=139.5 pss=751.4 views=934 restart_held
[2026-06-21 23:30:34] GL_ELEVATED mounting_or_insufficient_samples gl=139.5 pss=751.4 views=934 restart_held
[2026-06-21 23:30:38] GL_ELEVATED mounting_or_insufficient_samples gl=139.5 pss=751.4 views=934 restart_held
[2026-06-21 23:30:41] GL_ELEVATED mounting_or_insufficient_samples gl=139.5 pss=751.4 views=934 restart_held
[2026-06-21 23:30:46] GL_ELEVATED mounting_or_insufficient_samples gl=139.5 pss=754.3 views=934 restart_held
[2026-06-21 23:30:57] GL_ELEVATED mounting_or_insufficient_samples gl=139.5 pss=754.4 views=934 restart_held
[2026-06-21 23:31:02] GL_ELEVATED mounting_or_insufficient_samples gl=139.5 pss=754.1 views=934 restart_held
[2026-06-21 23:31:08] GL_ELEVATED mounting_or_insufficient_samples gl=136.8 pss=752 views=942 restart_held
[2026-06-21 23:31:13] GL_ELEVATED mounting_or_insufficient_samples gl=167.5 pss=820.7 views=294 restart_held
[2026-06-22 00:03:26] GL_ELEVATED mounting_or_insufficient_samples gl=121.7 pss=733.3 views=933 restart_held
[2026-06-22 00:03:31] GL_ELEVATED mounting_or_insufficient_samples gl=119 pss=704.8 views=933 restart_held
[2026-06-22 00:03:34] GL_HARD_CEILING gl=227.3 pss=811.7 views=942
[2026-06-22 00:03:34] REFIX_REQUESTED gl_critical_active_hub
[2026-06-22 00:04:40] GL_ELEVATED mounting_or_insufficient_samples gl=119.8 pss=731.3 views=942 restart_held
[2026-06-22 00:04:45] GL_ELEVATED mounting_or_insufficient_samples gl=151.4 pss=762.2 views=287 restart_held
[2026-06-22 00:04:59] GL_HARD_CEILING gl=218.1 pss=853.4 views=934
[2026-06-22 00:04:59] REFIX_REQUESTED gl_critical_active_hub
[2026-06-22 13:05:18] GL_ELEVATED mounting_or_insufficient_samples gl=140.6 pss=749.6 views=933 restart_held
[2026-06-22 20:36:16] GL_ELEVATED mounting_or_insufficient_samples gl=152.1 pss=885.1 views=943 restart_held
[2026-06-22 23:30:35] GL_HARD_CEILING gl=152.4 pss=1029.9 views=929
[2026-06-22 23:30:35] REFIX_REQUESTED gl_critical_active_hub
[2026-06-23 12:13:08] GL_ELEVATED mounting_or_insufficient_samples gl=145.8 pss=471.2 views=284 restart_held
[2026-06-23 12:43:14] GL_ELEVATED mounting_or_insufficient_samples gl=134.8 pss=411.3 views=281 restart_held
[2026-06-23 13:13:18] GL_ELEVATED mounting_or_insufficient_samples gl=145.3 pss=428.3 views=293 restart_held
[2026-06-23 13:43:24] GL_ELEVATED mounting_or_insufficient_samples gl=130.4 pss=495.8 views=937 restart_held
```

## remediation.log (tail)

```
[2026-06-22 00:04:59] REFIX_REQUESTED gl_critical_active_hub -> gl-leak-refix-requested.flag
[2026-06-22 00:04:59] AUTO_FIX static audit:skia-memory start
[2026-06-22 00:05:01] AUTO_FIX audit:skia-memory PASS
[2026-06-22 00:05:01] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-06-22 00:05:17] AUTO_FIX baseline reset pid=11428 gl=3.7MB pss=208.5MB
[2026-06-22 00:05:17] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-06-22 00:05:38] VERIFY PASS pid=11428 gl=3.7MB pss=384.8MB views=13
[2026-06-22 00:05:38] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":853.4,"views":934,"lastGlMb":218.1,"hardCeiling":true}
[2026-06-22 00:05:39] HANDOFF packed -> outbox/cursor-incident-handoff.md (Kim Team Lead triage)
[2026-06-22 13:05:18] INFO GL_ELEVATED mounting_or_insufficient_samples gl=140.6 pss=749.6 views=933 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-22 20:36:16] INFO GL_ELEVATED mounting_or_insufficient_samples gl=152.1 pss=885.1 views=943 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-22 23:30:35] INCIDENT GL_HARD_CEILING gl=152.4 pss=1029.9 views=929 -> immediate remediation (OOM imminent)
[2026-06-22 23:30:35] REFIX_REQUESTED gl_critical_active_hub -> gl-leak-refix-requested.flag
[2026-06-22 23:30:35] AUTO_FIX static audit:skia-memory start
[2026-06-22 23:30:38] AUTO_FIX audit:skia-memory PASS
[2026-06-22 23:30:38] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-06-22 23:30:57] AUTO_FIX baseline reset pid=21849 gl=6MB pss=206.1MB
[2026-06-22 23:30:57] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-06-22 23:31:19] VERIFY PASS pid=21849 gl=4.4MB pss=390.1MB views=15
[2026-06-22 23:31:19] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":1029.9,"views":929,"lastGlMb":152.4,"hardCeiling":true}
[2026-06-22 23:31:19] HANDOFF packed -> outbox/cursor-incident-handoff.md (Kim Team Lead triage)
[2026-06-23 12:13:08] INFO GL_ELEVATED mounting_or_insufficient_samples gl=145.8 pss=471.2 views=284 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-23 12:43:14] INFO GL_ELEVATED mounting_or_insufficient_samples gl=134.8 pss=411.3 views=281 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-23 13:13:18] INFO GL_ELEVATED mounting_or_insufficient_samples gl=145.3 pss=428.3 views=293 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-23 13:43:24] INFO GL_ELEVATED mounting_or_insufficient_samples gl=130.4 pss=495.8 views=937 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
```

## mem-alerts.log (tail)

```
[2026-06-22 00:13:48] GL +24.6MB views=412 (PSS 36MB) ??active hub
[2026-06-22 00:15:30] PSS +153.6MB GL 35.2MB views=15
[2026-06-22 00:16:04] PSS +172.6MB GL 35.2MB views=98
[2026-06-22 01:03:33] CRITICAL process not running ??check crash-*.log
[2026-06-22 09:34:45] PSS +70.3MB GL 51.9MB views=298
[2026-06-22 10:04:50] CRITICAL process not running ??check crash-*.log
[2026-06-22 13:05:14] GL +91.6MB views=933 (PSS 86.6MB) ??active hub
[2026-06-22 16:35:43] PSS +62.4MB GL 50.9MB views=309
[2026-06-22 17:05:47] CRITICAL process not running ??check crash-*.log
[2026-06-22 18:29:38] CRITICAL process not running ??check crash-*.log
[2026-06-22 18:35:57] CRITICAL process not running ??check crash-*.log
[2026-06-22 19:36:01] GL +31MB views=363 (PSS 103.5MB) ??active hub
[2026-06-22 20:36:09] GL +95.5MB views=943 (PSS 85.3MB) ??active hub
[2026-06-22 23:00:27] PSS +44.5MB GL 61.7MB views=347
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
```

## KPI (overnight window)

| Metric | Count |
|--------|-------|
| GL_HARD_CEILING incidents | 9 |
| Crash / PROCESS_DEATH | 74 |
| Auto app relaunch | 16 |

## Action items for Kim Team Lead

1. GL_HARD_CEILING or 3x GL_SPIKE ??P0 hub Skia audit (see overnight-watch handoff).
2. SIGSEGV/FATAL ??arcfire-bug-debug-workflow + logcat tail in latest crash-*.log.
3. Stair-step floor rise without crash ??today's dev P0 list in overnight-watch handoff.

