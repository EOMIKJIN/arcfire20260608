# Arcfire daily 08:00 KST auto report (mandatory perpetual)

Generated (KST): 2026-07-23 08:00:02
Package: com.arcfire.online

## Runtime

| pid | PSS (MB) | GL (MB) | Views |
|-----|----------|---------|-------|
| 29361 | 805.8 | 131.3 | 555 |

## mem-timeline (since DAILY_8AM_REPORT)

```csv
2026-07-23 00:24:36,29361,751.5,886.6,50,19.8,69.8,385.2,49.8,,345,15.4,2,
2026-07-23 00:40:02,29361,778.8,914.1,49.9,40.7,90.6,388.8,45.7,,348,27.3,-0.1,
2026-07-23 00:55:29,29361,736.1,871.3,51.3,19.8,71.1,379.7,43.5,,345,-42.7,1.4,
2026-07-23 01:10:57,29361,722.6,858.1,45.2,19.8,65,373.8,42.1,,337,-13.5,-6.1,GL_RECOVERED idle_ok
2026-07-23 01:26:23,29361,734.3,868.1,51.4,19.8,71.2,377.5,49.1,,366,11.7,6.2,
2026-07-23 01:41:48,29361,762.3,896.6,49.7,34.3,84,380.5,65.9,,370,28,-1.7,
2026-07-23 01:57:13,29361,727,861.4,49.4,19.8,69.2,377.6,52,,345,-35.3,-0.3,
2026-07-23 02:12:39,29361,720.3,854.6,49.4,19.8,69.2,373.4,52.9,,345,-6.7,0,
2026-07-23 02:28:06,29361,672.4,801.9,49.4,19.8,69.2,373.7,43.3,,343,-47.9,0,
2026-07-23 02:43:31,29361,690.7,820.2,49.4,19.8,69.2,375.9,62.7,,337,18.3,0,
2026-07-23 02:58:56,29361,680,809.4,49.4,19.8,69.2,379.6,48.4,,345,-10.7,0,
2026-07-23 03:14:22,29361,684.9,814.3,49.4,19.8,69.2,379.8,51.5,,368,4.9,0,
2026-07-23 03:29:48,29361,686.1,813.6,49.4,19.8,69.2,386.9,43.4,,368,1.2,0,
2026-07-23 03:45:14,29361,682.6,813.5,51.4,19.8,71.2,381.2,47.8,,368,-3.5,2,
2026-07-23 04:00:40,29361,695.3,820.7,50,28,78,385,63.6,,375,12.7,-1.4,
2026-07-23 04:16:07,29361,669.1,794.7,47.3,19.8,67.2,381.1,52.2,,368,-26.2,-2.7,
2026-07-23 04:31:33,29361,707.9,673.6,50,40.7,90.7,250.8,58.6,,385,38.8,2.7,
2026-07-23 04:46:57,29361,672.1,637.6,49.4,19.8,69.2,237.8,56.9,,372,-35.8,-0.6,
2026-07-23 05:02:24,29361,684.3,649.8,49.7,34.3,84,243.9,47.5,,393,12.2,0.3,
2026-07-23 05:17:49,29361,696.4,661.8,50,40.7,90.7,246.7,49.8,,391,12.1,0.3,
2026-07-23 05:33:15,29361,669,634.5,49.4,19.8,69.2,241.3,48.4,,372,-27.4,-0.6,
2026-07-23 05:48:41,29361,661.1,626.6,49.4,19.8,69.2,239.6,41.3,,368,-7.9,0,
2026-07-23 06:04:10,29361,688.3,654.6,49.4,19.8,69.2,252.9,54.5,,344,27.2,0,
2026-07-23 06:19:37,29361,688.8,655.2,49.4,19.8,69.2,253.7,54.4,,351,0.5,0,
2026-07-23 06:35:02,29361,672,638.4,49.4,19.8,69.2,247.5,43.5,,351,-16.8,0,
2026-07-23 06:50:27,29361,793.4,762.7,142.3,19.8,162.1,279.4,40.8,,555,121.4,92.9,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-07-23 07:05:55,29361,799.3,768.7,142.3,19.8,162.1,279.8,45.8,,555,5.9,0,
2026-07-23 07:21:22,29361,814.4,782.8,144.3,19.8,164.1,279.8,58.4,,555,15.1,2,
2026-07-23 07:36:49,29361,805.1,773.5,144.1,19.8,163.9,276.7,51.4,,555,-9.3,-0.2,
2026-07-23 07:52:22,29361,807.1,774.6,146.1,19.8,165.9,276.6,51.4,,555,2,2,
```

## incidents.log (tail)

```
[2026-07-22 16:40:15] VIEWS_NATIVE_ADVISORY views=552 native_heap=310.7 pss=717.5 gl=124.2 (node/list retention ??pre-hardceiling early warn)
[2026-07-22 16:55:45] VIEWS_NATIVE_ADVISORY views=552 native_heap=311 pss=722.6 gl=124.2 (node/list retention ??pre-hardceiling early warn)
[2026-07-22 17:11:13] VIEWS_NATIVE_ADVISORY views=552 native_heap=310.8 pss=724.8 gl=124.2 (node/list retention ??pre-hardceiling early warn)
[2026-07-22 17:26:41] VIEWS_NATIVE_ADVISORY views=553 native_heap=312.1 pss=707.9 gl=107.8 (node/list retention ??pre-hardceiling early warn)
[2026-07-22 17:42:08] VIEWS_NATIVE_ADVISORY views=553 native_heap=312.9 pss=701.9 gl=107.8 (node/list retention ??pre-hardceiling early warn)
[2026-07-22 17:57:35] VIEWS_NATIVE_ADVISORY views=553 native_heap=312.9 pss=707 gl=109.8 (node/list retention ??pre-hardceiling early warn)
[2026-07-22 18:13:03] VIEWS_NATIVE_ADVISORY views=553 native_heap=312.6 pss=706.1 gl=107.8 (node/list retention ??pre-hardceiling early warn)
[2026-07-22 18:28:31] VIEWS_NATIVE_ADVISORY views=553 native_heap=313 pss=705 gl=109.8 (node/list retention ??pre-hardceiling early warn)
[2026-07-22 19:30:27] VIEWS_NATIVE_ADVISORY views=368 native_heap=420.1 pss=782.2 gl=46.8 (node/list retention ??pre-hardceiling early warn)
[2026-07-22 19:45:54] VIEWS_NATIVE_ADVISORY views=367 native_heap=421.1 pss=769.3 gl=48.8 (node/list retention ??pre-hardceiling early warn)
[2026-07-22 20:01:25] PSS_SOFT_CEILING pss=845.7 gl=57.4 views=317 native_reclaim_advisory
[2026-07-22 20:17:00] PSS_SOFT_CEILING pss=845.7 gl=57.4 views=317 native_reclaim_advisory
[2026-07-22 20:32:28] PSS_SOFT_CEILING pss=947.4 gl=44.6 views=317 native_reclaim_advisory
[2026-07-22 22:05:13] PSS_SOFT_CEILING pss=880.8 gl=154.8 views=553 native_reclaim_advisory
[2026-07-22 22:20:47] PSS_SOFT_CEILING pss=880.8 gl=154.8 views=553 native_reclaim_advisory
[2026-07-22 23:22:12] PSS_SOFT_CEILING pss=909.5 gl=138 views=349 native_reclaim_advisory
[2026-07-22 23:37:37] GL_HARD_CEILING gl=203.4 pss=1028.5 views=553
[2026-07-22 23:37:37] REFIX_REQUESTED gl_critical_active_hub
[2026-07-22 23:41:17] INVESTIGATION_TRIGGERED mem_anomaly
[2026-07-23 06:50:33] VIEWS_NATIVE_ADVISORY views=555 native_heap=279.4 pss=793.4 gl=142.3 (node/list retention ??pre-hardceiling early warn)
[2026-07-23 07:06:01] VIEWS_NATIVE_ADVISORY views=555 native_heap=279.8 pss=799.3 gl=142.3 (node/list retention ??pre-hardceiling early warn)
[2026-07-23 07:21:28] PSS_SOFT_CEILING pss=814.4 gl=144.3 views=555 native_reclaim_advisory
[2026-07-23 07:36:56] PSS_SOFT_CEILING pss=805.1 gl=144.1 views=555 native_reclaim_advisory
[2026-07-23 07:52:29] PSS_SOFT_CEILING pss=807.1 gl=146.1 views=555 native_reclaim_advisory
[2026-07-23 08:00:00] DAILY_8AM_REPORT 2026-07-23 08:00:00 KST
```

## remediation.log (tail)

```
[2026-07-22 22:05:13] INFO PSS_SOFT_CEILING pss=880.8 gl=154.8 views=553 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-22 22:20:47] INFO PSS_SOFT_CEILING pss=880.8 gl=154.8 views=553 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-22 23:22:12] INFO PSS_SOFT_CEILING pss=909.5 gl=138 views=349 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-22 23:37:37] INCIDENT GL_HARD_CEILING gl=203.4 pss=1028.5 views=553 -> immediate remediation (OOM imminent)
[2026-07-22 23:37:37] REFIX_REQUESTED gl_critical_active_hub -> gl-leak-refix-requested.flag
[2026-07-22 23:37:37] AUTO_FIX static audit:skia-memory start
[2026-07-22 23:37:39] AUTO_FIX audit:skia-memory PASS
[2026-07-22 23:37:39] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-07-22 23:37:57] AUTO_FIX baseline reset pid=29010 gl=6MB pss=196.8MB
[2026-07-22 23:37:57] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-07-22 23:38:18] VERIFY PASS pid=29010 gl=8.5MB pss=567.2MB views=99
[2026-07-22 23:38:18] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":1028.5,"views":553,"lastGlMb":203.4,"hardCeiling":true}
[2026-07-22 23:38:19] HANDOFF packed -> outbox/cursor-incident-handoff.md (Kim Team Lead triage)
[2026-07-22 23:41:14] INVESTIGATION start reason=mem_anomaly
[2026-07-22 23:41:14] INVESTIGATION alert=[2026-07-22 23:37:37] GL_HARD_CEILING gl=203.4 pss=1028.5 views=553
[2026-07-22 23:41:15] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260722-234114.log
[2026-07-22 23:41:16] INVESTIGATION mem from timeline gl=8.5MB pss=567.2MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260722-234114.log
[2026-07-22 23:41:17] packed D:\arcfire20260607\tools\long-run-monitor\outbox\cursor-incident-handoff.md
[2026-07-22 23:41:17] INVESTIGATION trigger -> .cursor/trigger-incident-auto-fix.json
[2026-07-22 23:41:17] INVESTIGATION done reason=mem_anomaly
[2026-07-23 06:50:33] INFO VIEWS_NATIVE_ADVISORY views=555 native_heap=279.4 pss=793.4 gl=142.3 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-23 07:06:01] INFO VIEWS_NATIVE_ADVISORY views=555 native_heap=279.8 pss=799.3 gl=142.3 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-23 07:21:28] INFO PSS_SOFT_CEILING pss=814.4 gl=144.3 views=555 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-23 07:36:56] INFO PSS_SOFT_CEILING pss=805.1 gl=144.1 views=555 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-23 07:52:29] INFO PSS_SOFT_CEILING pss=807.1 gl=146.1 views=555 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
```

## mem-alerts.log (tail)

```
[2026-07-20 20:23:12] GL +95.8MB views=560 (PSS 90.3MB) ??active hub
[2026-07-20 21:24:59] GL +14.1MB views=386 (PSS 25.6MB) ??active hub
[2026-07-20 22:11:16] GL +97.3MB views=560 (PSS 130.6MB) ??active hub
[2026-07-21 07:12:01] GL +95.3MB views=560 (PSS 112.1MB) ??active hub
[2026-07-21 07:42:59] GL +104.5MB views=561 (PSS 120.2MB) ??active hub
[2026-07-21 07:58:28] PSS +86.2MB GL 152.9MB views=559
[2026-07-21 08:29:24] PSS +79.7MB GL 142MB views=559
[2026-07-21 11:19:43] GL +106.5MB views=559 (PSS 140MB) ??active hub
[2026-07-21 15:57:39] GL +94.6MB views=559 (PSS 78.3MB) ??active hub
[2026-07-21 18:47:29] GL +90.5MB views=554 (PSS 116.5MB) ??active hub
[2026-07-21 19:49:14] PSS +43.4MB GL 16.2MB views=99
[2026-07-21 21:52:45] PSS +54.9MB GL 126.8MB views=553
[2026-07-22 10:13:29] PSS +60.3MB GL 45.7MB views=314
[2026-07-22 10:28:55] GL +10.1MB views=395 (PSS 68.9MB) ??active hub
[2026-07-22 11:46:11] PSS +121.8MB GL 52.3MB views=379
[2026-07-22 12:01:40] GL +91.1MB views=553 (PSS 83.7MB) ??active hub
[2026-07-22 14:36:41] GL +95MB views=553 (PSS 111.1MB) ??active hub
[2026-07-22 16:09:37] CRITICAL process not running ??check crash-*.log
[2026-07-22 18:59:21] PSS +66.6MB GL 44MB views=325
[2026-07-22 20:01:19] GL +8.6MB views=317 (PSS 76.4MB) ??active hub
[2026-07-22 20:32:22] PSS +101.7MB GL 44.6MB views=317
[2026-07-22 22:05:06] GL +103.6MB views=553 (PSS 146MB) ??active hub
[2026-07-22 22:51:40] CRITICAL process not running ??check crash-*.log
[2026-07-22 23:37:32] GL +65.4MB views=553 (PSS 119MB) ??active hub
[2026-07-23 06:50:27] GL +92.9MB views=555 (PSS 121.4MB) ??active hub
```

## KPI (overnight window)

| Metric | Count |
|--------|-------|
| GL_HARD_CEILING incidents | 40 |
| Crash / PROCESS_DEATH | 95 |
| Auto app relaunch | 40 |

## Action items for Kim Team Lead

1. GL_HARD_CEILING or 3x GL_SPIKE ??P0 hub Skia audit (see overnight-watch handoff).
2. SIGSEGV/FATAL ??arcfire-bug-debug-workflow + logcat tail in latest crash-*.log.
3. Stair-step floor rise without crash ??today's dev P0 list in overnight-watch handoff.

