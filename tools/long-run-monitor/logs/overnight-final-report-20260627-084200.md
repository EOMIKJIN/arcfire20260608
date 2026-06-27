# Arcfire watch interim report (08:00 KST manual - schedule target 2026-06-28)

Generated (KST): 2026-06-27 08:42:31
Package: com.arcfire.online

## Runtime

| pid | PSS (MB) | GL (MB) | Views |
|-----|----------|---------|-------|
| 20142 | 1038.4 | 142.8 | 545 |

## mem-timeline (since OVERNIGHT_WATCH_UNTIL_8AM)

```csv
2026-06-27 04:54:51,20142,957.1,1070.4,51.2,19.8,71,608.1,35.8,,372,-11.9,-0.6,
2026-06-27 05:05:10,20142,991.7,1093.6,51.8,40.7,92.5,608.3,47.1,,383,34.6,0.6,
2026-06-27 05:11:36,20142,998.3,1088.4,51.8,40.7,92.5,598.1,52.2,,411,6.6,0,
2026-06-27 05:15:29,20142,972.3,1062.5,51.2,19.8,71,597,48.7,,372,-26,-0.6,
2026-06-27 05:25:47,20142,1006.6,1096.8,53.8,40.7,94.5,609.8,45.4,,379,34.3,2.6,
2026-06-27 05:36:04,20142,975,1062.1,51.2,19.8,71,604.9,40.9,,376,-31.6,-2.6,
2026-06-27 05:41:53,20142,1004.4,1091.6,51.8,40.7,92.5,600.1,53.7,,413,29.4,0.6,
2026-06-27 05:46:21,20142,997.5,1084.7,53.2,20,73.1,608.2,58,,376,-6.9,1.4,
2026-06-27 05:56:38,20142,986.3,1073.6,51.2,19.8,71,604.9,52,,376,-11.2,-2,
2026-06-27 06:06:55,20142,988.3,1075.6,51.2,20,71.1,606.4,52.4,,380,2,0,
2026-06-27 06:12:11,20142,1002.5,1089.8,51.8,40.7,92.5,605.1,46.1,,395,14.2,0.6,
2026-06-27 06:17:15,20142,977.4,1064.7,51.2,19.8,71,606.9,40.6,,380,-25.1,-0.6,
2026-06-27 06:27:31,20142,976.6,1063.5,51.2,19.8,71,609.1,38.8,,380,-0.8,0,
2026-06-27 06:37:48,20142,987.3,1074.1,51.2,19.8,71,610.7,48.2,,381,10.7,0,
2026-06-27 06:42:31,20142,1001.2,1086.5,51.8,40.7,92.5,613.4,42.6,,396,13.9,0.6,
2026-06-27 06:48:07,20142,987.2,1068.6,51.2,19.8,71,616.8,42.8,,384,-14,-0.6,
2026-06-27 06:58:24,20142,997.4,1078.8,51.2,19.8,71,616.3,52.9,,380,10.2,0,
2026-06-27 07:08:42,20142,992.1,1075.8,51.2,19.8,71,621.8,44.2,,384,-5.3,0,
2026-06-27 07:12:48,20142,1012.2,1095.9,51.8,40.7,92.5,617.1,47.4,,391,20.1,0.6,
2026-06-27 07:18:59,20142,990.1,1076.9,51.2,19.8,71,621.1,45.2,,384,-22.1,-0.6,
2026-06-27 07:29:17,20142,990.9,1077.9,51.2,19.8,71,624.8,42.2,,388,0.8,0,
2026-06-27 07:39:34,20142,985,1072,51.2,19.8,71,620,40.8,,384,-5.9,0,
2026-06-27 07:43:05,20142,1027.2,1114.2,51.8,40.7,92.5,626.5,54.8,,387,42.2,0.6,PSS_SPIKE review=graphics+native
2026-06-27 07:49:51,20142,1001.4,1088.4,51.2,19.8,71,621.5,55.1,,388,-25.8,-0.6,
2026-06-27 08:00:08,20142,1006,1093,51.2,19.8,71,625.8,54.4,,386,4.6,0,
2026-06-27 08:10:25,20142,997.7,1084.7,53.2,19.8,73,624.3,45.3,,392,-8.3,2,
2026-06-27 08:13:24,20142,1032.2,1119.2,51.8,40.7,92.4,626.9,58.3,,385,34.5,-1.4,
2026-06-27 08:20:44,20142,1033.4,1120.4,51.4,34.3,85.7,632.5,60.1,,408,1.2,-0.4,
2026-06-27 08:31:03,20142,1011.8,1098.8,51.2,19.8,71,628.6,57.1,,392,-21.6,-0.2,
2026-06-27 08:41:20,20142,1050.4,964.9,142.8,19.8,162.6,477.2,44.2,,545,38.6,91.6,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
```

## incidents.log (tail)

```
[2026-06-27 04:34:19] PSS_SOFT_CEILING pss=943.7 gl=51.2 views=368 native_reclaim_advisory
[2026-06-27 04:41:36] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-27 04:55:00] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-27 05:05:25] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-27 05:15:49] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-27 05:25:54] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-27 05:36:18] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-27 05:46:43] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-27 05:56:47] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-27 06:07:12] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-27 06:17:36] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-27 06:27:40] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-27 06:38:05] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-27 06:48:29] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-27 06:58:33] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-27 07:08:58] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-27 07:19:22] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-27 07:29:26] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-27 07:39:51] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-27 07:50:15] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-27 08:00:19] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-27 08:10:43] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-27 08:21:08] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-27 08:31:12] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-27 08:41:36] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
```

## remediation.log (tail)

```
[2026-06-27 08:21:07] INVESTIGATION mem snapshot gl=51.2MB pss=1009.4MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260627-082106.log
[2026-06-27 08:21:08] packed D:\arcfire20260607\tools\long-run-monitor\outbox\cursor-incident-handoff.md
[2026-06-27 08:21:08] INVESTIGATION trigger -> .cursor/trigger-incident-auto-fix.json
[2026-06-27 08:21:08] INVESTIGATION code-fix handoff only (monitor-paused ??no app relaunch)
[2026-06-27 08:21:09] INVESTIGATION audit:skia-memory completed (paused mode static gate)
[2026-06-27 08:21:09] INVESTIGATION done reason=mem_hard_ceiling_playtest
[2026-06-27 08:31:10] INVESTIGATION start reason=mem_hard_ceiling_playtest
[2026-06-27 08:31:10] INVESTIGATION alert=[2026-06-27 08:31:10] [MEM_HARD_CEILING] pss=1011.8MB gl=51.2MB
[2026-06-27 08:31:11] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260627-083110.log
[2026-06-27 08:31:12] INVESTIGATION mem snapshot gl=51.2MB pss=1021.4MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260627-083110.log
[2026-06-27 08:31:12] packed D:\arcfire20260607\tools\long-run-monitor\outbox\cursor-incident-handoff.md
[2026-06-27 08:31:12] INVESTIGATION trigger -> .cursor/trigger-incident-auto-fix.json
[2026-06-27 08:31:12] INVESTIGATION code-fix handoff only (monitor-paused ??no app relaunch)
[2026-06-27 08:31:14] INVESTIGATION audit:skia-memory completed (paused mode static gate)
[2026-06-27 08:31:14] INVESTIGATION done reason=mem_hard_ceiling_playtest
[2026-06-27 08:41:25] INFO GL_HARD_CEILING_RECORD_ONLY gl=142.8 pss=1050.4 views=545 (monitor-paused ??no incident/refix spam)
[2026-06-27 08:41:34] INVESTIGATION start reason=mem_hard_ceiling_playtest
[2026-06-27 08:41:34] INVESTIGATION alert=[2026-06-27 08:41:34] [MEM_HARD_CEILING] pss=1050.4MB gl=142.8MB
[2026-06-27 08:41:35] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260627-084134.log
[2026-06-27 08:41:35] INVESTIGATION mem snapshot gl=142.8MB pss=1040.1MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260627-084134.log
[2026-06-27 08:41:36] packed D:\arcfire20260607\tools\long-run-monitor\outbox\cursor-incident-handoff.md
[2026-06-27 08:41:36] INVESTIGATION trigger -> .cursor/trigger-incident-auto-fix.json
[2026-06-27 08:41:36] INVESTIGATION code-fix handoff only (monitor-paused ??no app relaunch)
[2026-06-27 08:41:38] INVESTIGATION audit:skia-memory completed (paused mode static gate)
[2026-06-27 08:41:38] INVESTIGATION done reason=mem_hard_ceiling_playtest
```

## mem-alerts.log (tail)

```
[2026-06-26 11:40:35] GL +98.8MB views=928 (PSS 103.7MB) ??active hub
[2026-06-26 11:53:01] GL +13.8MB views=317 (PSS 56.8MB) ??active hub
[2026-06-26 12:01:16] CRITICAL process not running ??check crash-*.log
[2026-06-26 12:03:26] CRITICAL process not running ??check crash-*.log
[2026-06-26 13:01:26] GL +93.9MB views=922 (PSS 127.9MB) ??active hub
[2026-06-26 15:49:49] PSS +57.4MB GL 131MB views=313
[2026-06-26 17:02:01] GL +199.5MB views=928 (PSS 237MB) ??active hub
[2026-06-26 17:32:59] PSS +70.2MB GL 18MB views=98
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
```

## KPI (overnight window)

| Metric | Count |
|--------|-------|
| GL_HARD_CEILING incidents | 22 |
| Crash / PROCESS_DEATH | 94 |
| Auto app relaunch | 22 |

## Action items for Kim Team Lead

1. GL_HARD_CEILING or 3x GL_SPIKE ??P0 hub Skia audit (see overnight-watch handoff).
2. SIGSEGV/FATAL ??arcfire-bug-debug-workflow + logcat tail in latest crash-*.log.
3. Stair-step floor rise without crash ??today's dev P0 list in overnight-watch handoff.

