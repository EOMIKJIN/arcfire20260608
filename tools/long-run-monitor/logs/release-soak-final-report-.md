# Arcfire release soak ??final report until 14:00 KST

Generated (KST): 2026-06-25 13:52:31
Package: com.arcfire.online

## Runtime

| pid | PSS (MB) | GL (MB) | Views |
|-----|----------|---------|-------|
| 30675 | 408.2 | 45.5 | 284 |

## mem-timeline (since RELEASE_SOAK_UNTIL_14H_20260625)

```csv
,,,,,,,,,,,RELEASE_SOAK_UNTIL_14H_20260625
2026-06-25 10:32:12,,,,,,,,,,,RELEASE_SOAK_UNTIL_14H_20260625
2026-06-25 10:32:56,,,,,,,,,,,,RELEASE_SOAK_UNTIL_14H_20260625
2026-06-25 10:37:19,30675,455.9,573.5,62.3,40.7,102.9,172.7,22.7,,280,2.7,11.9,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-06-25 10:47:26,30675,453,572.9,57.6,19.8,77.5,203.3,24.8,,280,-2.9,-4.7,
2026-06-25 10:52:21,30675,442.1,562.6,57.6,19.8,77.5,199.4,22.4,,280,-10.9,0,
2026-06-25 10:57:31,30675,439.5,559.9,58.3,19.8,78.2,199.7,18.7,,280,-2.6,0.7,
2026-06-25 11:07:37,30675,459.3,579.7,60.5,30.2,90.7,201.7,23.7,,291,19.8,2.2,
2026-06-25 11:17:42,30675,563.8,683.6,144.3,19.8,164.2,240,21,,932,104.5,83.8,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-06-25 11:22:27,30675,521.6,622.3,140.3,19.8,160.1,235.2,20.7,,932,-42.2,-4,
2026-06-25 11:27:47,30675,411.8,512.3,44,19.8,63.9,219.6,20.6,,288,-109.8,-96.3,GL_RECOVERED idle_ok
2026-06-25 11:37:53,30675,411.1,512.1,44.1,19.8,64,217.3,22.5,,288,-0.7,0.1,
2026-06-25 11:47:59,30675,423.2,524.3,60.3,19.8,80.1,216.1,19.4,,284,12.1,16.2,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-06-25 11:52:33,30675,412.2,513.5,54.7,19.8,74.6,213.4,16,,282,-11,-5.6,GL_RECOVERED idle_ok
2026-06-25 11:58:05,30675,449.6,550.9,44.7,40.7,85.3,232.7,20.7,,289,37.4,-10,GL_RECOVERED idle_ok
2026-06-25 12:08:12,30675,425.5,526.9,46.2,19.8,66,231.4,16.9,,288,-24.1,1.5,
2026-06-25 12:18:17,30675,427.5,528.9,47.6,19.8,67.4,232,16.9,,288,2,1.4,
2026-06-25 12:22:39,30675,423.8,481.8,45.5,19.8,65.4,192.2,20.7,,284,-3.7,-2.1,
2026-06-25 12:28:23,30675,425.4,483.2,47.8,19.8,67.6,193,19.4,,288,1.6,2.3,
2026-06-25 12:38:28,30675,406.4,464.3,45.8,19.8,65.6,193.1,17.7,,288,-19,-2,
2026-06-25 12:48:33,30675,409.3,467.2,45.5,19.8,65.4,193.7,21.5,,288,2.9,-0.3,
2026-06-25 12:52:45,30675,411.5,469.4,47.5,19.8,67.4,193,22.5,,284,2.2,2,
2026-06-25 12:58:39,30675,405,463,45.8,19.8,65.6,194,16.8,,288,-6.5,-1.7,
2026-06-25 13:08:44,30675,408.9,465.6,45.8,19.8,65.6,193.6,20.4,,286,3.9,0,
2026-06-25 13:18:49,30675,412.2,468.6,47.5,19.8,67.4,194,21.1,,288,3.3,1.7,
2026-06-25 13:22:51,30675,409.5,465.9,45.5,19.8,65.4,193.2,21,,284,-2.7,-2,
2026-06-25 13:28:55,30675,406.7,463,45.8,19.8,65.6,194.1,16.8,,288,-2.8,0.3,
2026-06-25 13:39:00,30675,420.2,458.5,45.7,34.3,80.1,175.1,17,,301,13.5,-0.1,
2026-06-25 13:49:07,30675,427.6,465.7,47.8,34.3,82.1,175.4,21.3,,313,7.4,2.1,
```

## incidents.log (tail)

```
[2026-06-24 23:19:33] PSS_SOFT_CEILING pss=803.5 gl=38.5 views=301 native_reclaim_advisory
[2026-06-24 23:21:23] PSS_SOFT_CEILING pss=813.3 gl=38.5 views=297 native_reclaim_advisory
[2026-06-24 23:41:38] PSS_SOFT_CEILING pss=854.3 gl=128 views=947 native_reclaim_advisory
[2026-06-24 23:49:40] PSS_SOFT_CEILING pss=816.1 gl=50.5 views=334 native_reclaim_advisory
[2026-06-24 23:51:43] PSS_SOFT_CEILING pss=802.2 gl=50.4 views=328 native_reclaim_advisory
[2026-06-25 00:01:48] PSS_SOFT_CEILING pss=807.4 gl=50.2 views=305 native_reclaim_advisory
[2026-06-25 00:11:54] PSS_SOFT_CEILING pss=852.8 gl=43.8 views=315 native_reclaim_advisory
[2026-06-25 00:19:47] PSS_SOFT_CEILING pss=817.1 gl=50.3 views=313 native_reclaim_advisory
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
```

## remediation.log (tail)

```
[2026-06-25 00:32:10] INFO PSS_SOFT_CEILING pss=821.5 gl=39.6 views=342 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-25 00:49:55] INFO PSS_SOFT_CEILING pss=802.9 gl=39.4 views=318 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-25 00:52:22] INFO PSS_SOFT_CEILING pss=801.5 gl=39.3 views=310 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-25 01:22:38] INFO PSS_SOFT_CEILING pss=805 gl=39.9 views=328 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-25 08:16:14] INFO PSS_SOFT_CEILING pss=800.1 gl=39.9 views=352 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-25 08:51:20] INVESTIGATION start reason=mem_hard_ceiling_playtest
[2026-06-25 08:51:20] INVESTIGATION alert=[2026-06-25 08:51:20] [MEM_HARD_CEILING] pss=991.1MB gl=228.9MB
[2026-06-25 08:51:20] INCIDENT GL_HARD_CEILING gl=228.9 pss=991.1 views=947 -> immediate remediation (OOM imminent)
[2026-06-25 08:51:20] REFIX_REQUESTED gl_critical_active_hub -> gl-leak-refix-requested.flag
[2026-06-25 08:51:20] AUTO_FIX static audit:skia-memory start
[2026-06-25 08:51:21] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260625-085120.log
[2026-06-25 08:51:21] INVESTIGATION mem snapshot gl=228.9MB pss=980MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260625-085120.log
[2026-06-25 08:51:21] packed D:\arcfire20260607\tools\long-run-monitor\outbox\cursor-incident-handoff.md
[2026-06-25 08:51:21] INVESTIGATION trigger -> .cursor/trigger-incident-auto-fix.json
[2026-06-25 08:51:21] INVESTIGATION done reason=mem_hard_ceiling_playtest
[2026-06-25 08:51:22] AUTO_FIX audit:skia-memory PASS
[2026-06-25 08:51:22] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-06-25 08:51:40] AUTO_FIX baseline reset pid=25974 gl=3.7MB pss=362MB
[2026-06-25 08:51:40] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-06-25 08:52:01] VERIFY PASS pid=25974 gl=3.7MB pss=361.2MB views=13
[2026-06-25 08:52:01] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":991.1,"views":947,"lastGlMb":228.9,"hardCeiling":true}
[2026-06-25 08:52:01] HANDOFF packed -> outbox/cursor-incident-handoff.md (Kim Team Lead triage)
[2026-06-25 09:22:07] INFO GL_ELEVATED mounting_or_insufficient_samples gl=143.8 pss=491.1 views=291 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-25 11:17:46] INFO GL_ELEVATED mounting_or_insufficient_samples gl=144.3 pss=563.8 views=932 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-25 11:22:32] INFO GL_ELEVATED mounting_or_insufficient_samples gl=140.3 pss=521.6 views=932 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
```

## mem-alerts.log (tail)

```
[2026-06-24 12:13:44] CRITICAL process not running ??check crash-*.log
[2026-06-24 12:23:45] CRITICAL process not running ??check crash-*.log
[2026-06-24 12:33:46] CRITICAL process not running ??check crash-*.log
[2026-06-24 13:24:10] PSS +40.3MB GL 40MB views=303
[2026-06-24 17:16:14] PSS +47.3MB GL 38.9MB views=285
[2026-06-24 17:26:20] GL +196.2MB views=945 (PSS 228.6MB) ??active hub
[2026-06-24 17:37:10] CRITICAL process not running ??check crash-*.log
[2026-06-24 18:07:23] GL +91.3MB views=945 (PSS 149.9MB) ??active hub
[2026-06-24 19:38:20] PSS +88.6MB GL 43.5MB views=288
[2026-06-24 20:09:16] PSS +41MB GL 34.2MB views=326
[2026-06-24 20:39:32] PSS +75MB GL 23.6MB views=321
[2026-06-24 20:49:41] GL +18.5MB views=301 (PSS 32MB) ??active hub
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
```

## KPI (overnight window)

| Metric | Count |
|--------|-------|
| GL_HARD_CEILING incidents | 22 |
| Crash / PROCESS_DEATH | 87 |
| Auto app relaunch | 22 |

## Action items for Kim Team Lead

1. GL_HARD_CEILING or 3x GL_SPIKE ??P0 hub Skia audit (see overnight-watch handoff).
2. SIGSEGV/FATAL ??arcfire-bug-debug-workflow + logcat tail in latest crash-*.log.
3. Stair-step floor rise without crash ??today's dev P0 list in overnight-watch handoff.

