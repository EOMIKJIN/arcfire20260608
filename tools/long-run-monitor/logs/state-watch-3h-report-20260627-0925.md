# Arcfire 3h state watch report (KST)

Generated (KST): 2026-06-27 12:26:19
Package: com.arcfire.online

## Runtime

| pid | PSS (MB) | GL (MB) | Views |
|-----|----------|---------|-------|
| 19294 | 739.1 | 51.7 | 443 |

## mem-timeline (since STATE_WATCH_3H_START)

```csv
2026-06-27 08:51:42,20142,923.1,689.2,44.1,19.8,64,361.2,25.7,,392,-121.8,-110.9,GL_RECOVERED idle_ok
2026-06-27 09:02:01,20142,946.4,687.6,42.8,40.7,83.4,342.4,22.6,,397,23.3,-1.3,
2026-06-27 09:12:19,20142,933.6,656.4,42.1,19.8,62,316.9,35,,377,-12.8,-0.7,
2026-06-27 09:14:02,20142,922.6,645.4,42.1,19.8,62,308.2,32.9,,373,-11,0,
2026-06-27 09:22:37,20142,1043.3,970.2,149.4,19.8,169.3,493.1,30.3,,545,120.7,107.3,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-06-27 09:25:35,20142,1095.5,1023.4,155.9,19.8,175.7,519.8,30.8,,347,52.2,6.5,PLAYTEST_MILESTONE:mem_fix_3h_soak_start_20260627
2026-06-27 09:25:38,20142,946,874,41,19.8,60.8,491.8,24.4,,347,-149.5,-114.9,PROFILE_SNAP stage=unknown event=manual id=20260627-092537-911
2026-06-27 09:33:01,20142,1116.8,1044.5,156,19.8,175.9,545,37.1,,385,170.8,115,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-06-27 09:43:29,9967,695.8,830.5,22.3,34.3,56.6,374.5,36.7,,393,,,
2026-06-27 09:44:19,9967,677.7,816.7,22.1,19.8,41.9,370.1,35.2,,368,,,
2026-06-27 09:53:45,9967,679,821.4,22.1,19.8,41.9,371,34.3,,376,1.3,0,
2026-06-27 10:04:03,9967,726.6,870.1,26.9,40.7,67.5,378.9,44,,409,47.6,4.8,PSS_SPIKE review=graphics+native
2026-06-27 10:14:19,9967,786.2,931,39.2,40.7,79.9,427.7,35.7,,322,59.6,12.3,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-06-27 10:14:34,9967,786,930.8,39.2,40.7,79.9,434.6,28.5,,322,-0.2,0,
2026-06-27 10:24:37,9967,783.2,928.1,47,40.7,87.6,428.1,30.7,,322,-2.8,7.8,
2026-06-27 10:34:54,9967,930.9,1075.5,152.7,19.8,172.6,485.3,36.3,,553,147.7,105.7,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-06-27 10:44:53,9967,473.7,398.6,62,22,84,96.4,40.6,,23,-457.2,-90.7,GL_RECOVERED idle_ok
2026-06-27 10:45:12,9967,603.6,530.8,61.9,19.8,81.8,196.9,24.9,,21,129.9,-0.1,PSS_SPIKE review=graphics+native
2026-06-27 10:55:39,9967,934.7,873.5,156.7,19.8,176.5,413.5,25.4,,575,331.1,94.8,HUB_ACTIVATION gl_mount_ok
2026-06-27 11:06:01,9967,953.9,893.2,152.6,19.8,172.5,424.9,37.6,,575,19.2,-4.1,
2026-06-27 11:15:27,9967,807.7,747.3,40.1,19.8,60,403.5,31.3,,388,-146.2,-112.5,GL_RECOVERED idle_ok
2026-06-27 11:16:27,9967,811.8,751.4,42.1,19.8,62,403,33.3,,388,4.1,2,
2026-06-27 11:26:50,9967,852.5,793.9,46.5,34.3,80.8,414.6,38.5,,403,40.7,4.4,PSS_SPIKE review=graphics+native
2026-06-27 11:37:11,9967,840,781.7,46.3,19.8,66.1,416.8,33,,389,-12.5,-0.2,
2026-06-27 11:45:51,9967,873.1,815.6,47.2,30.2,77.4,429.8,34.9,,392,33.1,0.9,
2026-06-27 11:47:29,9967,849,791.5,49,19.8,68.8,420.7,28,,393,-24.1,1.8,
2026-06-27 11:57:52,9967,713.3,655.9,38.5,19.8,58.3,288.4,49.3,,31,-135.7,-10.5,GL_RECOVERED idle_ok
2026-06-27 12:08:14,19294,687.8,808.3,41.5,19.8,61.3,347.4,30.2,,432,,,
2026-06-27 12:16:12,19294,552.3,673.4,24.4,19.8,44.2,218.6,45.5,,15,,,
2026-06-27 12:18:40,19294,730.3,851.4,41.4,19.8,61.2,363.6,30.7,,432,178,17,HUB_ACTIVATION gl_mount_ok
```

## incidents.log (tail)

```
[2026-06-27 07:39:51] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-27 07:50:15] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
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
```

## remediation.log (tail)

```
[2026-06-27 11:06:07] INFO GL_HARD_CEILING_RECORD_ONLY gl=152.6 pss=953.9 views=575 (monitor-paused ??no incident/refix spam)
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
```

## mem-alerts.log (tail)

```
[2026-06-26 17:53:37] CRITICAL process not running ??check crash-*.log
[2026-06-26 19:15:40] PSS +44.2MB GL 19.5MB views=99
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

