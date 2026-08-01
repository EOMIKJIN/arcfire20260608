# Arcfire daily 08:00 KST auto report (mandatory perpetual)

Generated (KST): 2026-08-01 08:00:02
Package: com.arcfire.online

## Runtime

| pid | PSS (MB) | GL (MB) | Views |
|-----|----------|---------|-------|
| 12785 | 657.8 | 31.2 | 361 |

## mem-timeline (since DAILY_8AM_REPORT)

```csv
2026-07-31 23:52:56,12785,824.9,955.3,126,19.8,145.8,390.7,47.2,,577,4.5,2,
2026-08-01 00:08:22,12785,812.4,940.4,106,19.8,125.9,399.3,47.7,,577,-12.5,-20,GL_RECOVERED idle_ok
2026-08-01 00:23:49,12785,809.4,938.3,107.8,19.8,127.6,402.3,40.9,,577,-3,1.8,
2026-08-01 00:39:20,12785,815,943.8,107.8,19.8,127.6,402.4,44.8,,577,5.6,0,
2026-08-01 00:54:47,12785,825.1,953,107.8,19.8,127.6,402.8,47.1,,580,10.1,0,
2026-08-01 01:10:13,12785,823.1,951.1,107.8,19.8,127.6,402.8,45.3,,579,-2,0,
2026-08-01 01:25:39,12785,827.2,955.1,107.8,19.8,127.6,404.3,47.2,,579,4.1,0,
2026-08-01 01:41:06,12785,821,949.5,107.8,19.8,127.6,404.9,41.1,,579,-6.2,0,
2026-08-01 01:56:32,12785,832.1,960.6,109.8,19.8,129.6,404,50.9,,579,11.1,2,
2026-08-01 02:12:00,12785,820.7,949,107.8,19.8,127.6,404.3,41.6,,579,-11.4,-2,
2026-08-01 02:27:26,12785,725.3,576.1,107.8,19.8,127.6,187.2,31.7,,579,-95.4,0,
2026-08-01 02:42:52,12785,726.1,591.5,107.8,19.8,127.6,197.5,37.4,,579,0.8,0,
2026-08-01 02:58:18,12785,729.5,604.6,107.8,19.8,127.6,206.5,41.3,,576,3.4,0,
2026-08-01 03:13:44,12785,729.8,606.4,107.8,19.8,127.6,206.4,42.2,,576,0.3,0,
2026-08-01 03:29:11,12785,724,600.7,109.8,19.8,129.6,206.7,34,,597,-5.8,2,
2026-08-01 03:44:37,12785,723.9,600.1,107.8,19.8,127.6,206.6,35.4,,576,-0.1,-2,
2026-08-01 04:00:04,12785,724.7,602.9,107.8,19.8,127.6,206.6,36.6,,576,0.8,0,
2026-08-01 04:15:30,12785,726.5,605.1,107.8,19.8,127.6,206.4,39.7,,576,1.8,0,
2026-08-01 04:30:56,12785,721.5,601,107.8,19.8,127.6,207.1,34.6,,576,-5,0,
2026-08-01 04:46:23,12785,728.8,608.3,107.8,19.8,127.6,206.8,42,,576,7.3,0,
2026-08-01 05:01:49,12785,722.2,602.6,107.8,19.8,127.6,207.3,35.8,,579,-6.6,0,
2026-08-01 05:32:43,12785,732.3,614.2,107.8,19.8,127.6,209.3,48.2,,580,10.1,0,
2026-08-01 05:48:10,12785,734.6,616.6,109.8,19.8,129.6,209,48.5,,580,2.3,2,
2026-08-01 06:03:33,12785,722.8,605,107.8,19.8,127.6,208.6,39.2,,580,-11.8,-2,
2026-08-01 06:18:58,12785,721.1,600.5,109.8,19.8,129.6,208.9,34.1,,585,-1.7,2,
2026-08-01 06:34:24,12785,716.8,627.2,36.6,19.8,56.4,255.2,61.6,,361,-4.3,-73.2,GL_RECOVERED idle_ok
2026-08-01 06:49:50,12785,742.3,634.6,45.1,40.7,85.7,246.5,44.6,,386,25.5,8.5,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-08-01 07:05:16,12785,659.6,619.1,33.4,19.8,53.2,241.7,41.1,,361,-82.7,-11.7,GL_RECOVERED idle_ok
2026-08-01 07:20:41,12785,684.6,647.3,40.7,34.3,75,249.1,36.3,,368,25,7.3,
2026-08-01 07:51:31,12785,664.9,627.7,35.3,19.8,55.1,249.1,37.3,,354,-19.7,-5.4,GL_RECOVERED idle_ok
```

## incidents.log (tail)

```
[2026-08-01 00:23:56] PSS_SOFT_CEILING pss=809.4 gl=107.8 views=577 native_reclaim_advisory
[2026-08-01 00:39:26] PSS_SOFT_CEILING pss=815 gl=107.8 views=577 native_reclaim_advisory
[2026-08-01 00:54:52] PSS_SOFT_CEILING pss=825.1 gl=107.8 views=580 native_reclaim_advisory
[2026-08-01 01:10:19] PSS_SOFT_CEILING pss=823.1 gl=107.8 views=579 native_reclaim_advisory
[2026-08-01 01:25:46] PSS_SOFT_CEILING pss=827.2 gl=107.8 views=579 native_reclaim_advisory
[2026-08-01 01:41:12] PSS_SOFT_CEILING pss=821 gl=107.8 views=579 native_reclaim_advisory
[2026-08-01 01:56:38] PSS_SOFT_CEILING pss=832.1 gl=109.8 views=579 native_reclaim_advisory
[2026-08-01 02:12:05] PSS_SOFT_CEILING pss=820.7 gl=107.8 views=579 native_reclaim_advisory
[2026-08-01 02:27:31] VIEWS_NATIVE_ADVISORY views=579 native_heap=187.2 pss=725.3 gl=107.8 (node/list retention ??pre-hardceiling early warn)
[2026-08-01 02:42:57] VIEWS_NATIVE_ADVISORY views=579 native_heap=197.5 pss=726.1 gl=107.8 (node/list retention ??pre-hardceiling early warn)
[2026-08-01 02:58:24] VIEWS_NATIVE_ADVISORY views=576 native_heap=206.5 pss=729.5 gl=107.8 (node/list retention ??pre-hardceiling early warn)
[2026-08-01 03:13:51] VIEWS_NATIVE_ADVISORY views=576 native_heap=206.4 pss=729.8 gl=107.8 (node/list retention ??pre-hardceiling early warn)
[2026-08-01 03:29:16] VIEWS_NATIVE_ADVISORY views=597 native_heap=206.7 pss=724 gl=109.8 (node/list retention ??pre-hardceiling early warn)
[2026-08-01 03:44:43] VIEWS_NATIVE_ADVISORY views=576 native_heap=206.6 pss=723.9 gl=107.8 (node/list retention ??pre-hardceiling early warn)
[2026-08-01 04:00:10] VIEWS_NATIVE_ADVISORY views=576 native_heap=206.6 pss=724.7 gl=107.8 (node/list retention ??pre-hardceiling early warn)
[2026-08-01 04:15:35] VIEWS_NATIVE_ADVISORY views=576 native_heap=206.4 pss=726.5 gl=107.8 (node/list retention ??pre-hardceiling early warn)
[2026-08-01 04:31:03] VIEWS_NATIVE_ADVISORY views=576 native_heap=207.1 pss=721.5 gl=107.8 (node/list retention ??pre-hardceiling early warn)
[2026-08-01 04:46:29] VIEWS_NATIVE_ADVISORY views=576 native_heap=206.8 pss=728.8 gl=107.8 (node/list retention ??pre-hardceiling early warn)
[2026-08-01 05:01:54] VIEWS_NATIVE_ADVISORY views=579 native_heap=207.3 pss=722.2 gl=107.8 (node/list retention ??pre-hardceiling early warn)
[2026-08-01 05:17:21] VIEWS_NATIVE_ADVISORY views=579 native_heap=207.3 pss=722.2 gl=107.8 (node/list retention ??pre-hardceiling early warn)
[2026-08-01 05:32:50] VIEWS_NATIVE_ADVISORY views=580 native_heap=209.3 pss=732.3 gl=107.8 (node/list retention ??pre-hardceiling early warn)
[2026-08-01 05:48:15] VIEWS_NATIVE_ADVISORY views=580 native_heap=209 pss=734.6 gl=109.8 (node/list retention ??pre-hardceiling early warn)
[2026-08-01 06:03:38] VIEWS_NATIVE_ADVISORY views=580 native_heap=208.6 pss=722.8 gl=107.8 (node/list retention ??pre-hardceiling early warn)
[2026-08-01 06:19:04] VIEWS_NATIVE_ADVISORY views=585 native_heap=208.9 pss=721.1 gl=109.8 (node/list retention ??pre-hardceiling early warn)
[2026-08-01 08:00:00] DAILY_8AM_REPORT 2026-08-01 08:00:00 KST
```

## remediation.log (tail)

```
[2026-08-01 00:08:28] INFO PSS_SOFT_CEILING pss=812.4 gl=106 views=577 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-01 00:23:56] INFO PSS_SOFT_CEILING pss=809.4 gl=107.8 views=577 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-01 00:39:26] INFO PSS_SOFT_CEILING pss=815 gl=107.8 views=577 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-01 00:54:52] INFO PSS_SOFT_CEILING pss=825.1 gl=107.8 views=580 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-01 01:10:19] INFO PSS_SOFT_CEILING pss=823.1 gl=107.8 views=579 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-01 01:25:46] INFO PSS_SOFT_CEILING pss=827.2 gl=107.8 views=579 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-01 01:41:12] INFO PSS_SOFT_CEILING pss=821 gl=107.8 views=579 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-01 01:56:38] INFO PSS_SOFT_CEILING pss=832.1 gl=109.8 views=579 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-01 02:12:05] INFO PSS_SOFT_CEILING pss=820.7 gl=107.8 views=579 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-01 02:27:31] INFO VIEWS_NATIVE_ADVISORY views=579 native_heap=187.2 pss=725.3 gl=107.8 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-01 02:42:57] INFO VIEWS_NATIVE_ADVISORY views=579 native_heap=197.5 pss=726.1 gl=107.8 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-01 02:58:24] INFO VIEWS_NATIVE_ADVISORY views=576 native_heap=206.5 pss=729.5 gl=107.8 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-01 03:13:51] INFO VIEWS_NATIVE_ADVISORY views=576 native_heap=206.4 pss=729.8 gl=107.8 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-01 03:29:16] INFO VIEWS_NATIVE_ADVISORY views=597 native_heap=206.7 pss=724 gl=109.8 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-01 03:44:43] INFO VIEWS_NATIVE_ADVISORY views=576 native_heap=206.6 pss=723.9 gl=107.8 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-01 04:00:10] INFO VIEWS_NATIVE_ADVISORY views=576 native_heap=206.6 pss=724.7 gl=107.8 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-01 04:15:35] INFO VIEWS_NATIVE_ADVISORY views=576 native_heap=206.4 pss=726.5 gl=107.8 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-01 04:31:03] INFO VIEWS_NATIVE_ADVISORY views=576 native_heap=207.1 pss=721.5 gl=107.8 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-01 04:46:29] INFO VIEWS_NATIVE_ADVISORY views=576 native_heap=206.8 pss=728.8 gl=107.8 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-01 05:01:54] INFO VIEWS_NATIVE_ADVISORY views=579 native_heap=207.3 pss=722.2 gl=107.8 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-01 05:17:21] INFO VIEWS_NATIVE_ADVISORY views=579 native_heap=207.3 pss=722.2 gl=107.8 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-01 05:32:50] INFO VIEWS_NATIVE_ADVISORY views=580 native_heap=209.3 pss=732.3 gl=107.8 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-01 05:48:15] INFO VIEWS_NATIVE_ADVISORY views=580 native_heap=209 pss=734.6 gl=109.8 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-01 06:03:38] INFO VIEWS_NATIVE_ADVISORY views=580 native_heap=208.6 pss=722.8 gl=107.8 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-01 06:19:04] INFO VIEWS_NATIVE_ADVISORY views=585 native_heap=208.9 pss=721.1 gl=109.8 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
```

## mem-alerts.log (tail)

```
[2026-07-27 12:21:55] PSS +105.9MB GL 47.8MB views=351
[2026-07-27 15:57:40] GL +91.8MB views=569 (PSS 111.8MB) ??active hub
[2026-07-27 20:19:44] GL +92.4MB views=570 (PSS 128.1MB) ??active hub
[2026-07-27 20:35:13] PSS +40.8MB GL 119MB views=572
[2026-07-28 13:02:04] PSS +140.6MB GL 125.4MB views=572
[2026-07-28 14:50:00] PSS +168.3MB GL 122.1MB views=572
[2026-07-28 15:21:37] GL +87.4MB views=572 (PSS 117.9MB) ??active hub
[2026-07-28 18:42:10] CRITICAL process not running ??check crash-*.log
[2026-07-28 20:45:03] PSS +63.6MB GL 100.4MB views=644
[2026-07-28 21:00:35] GL +25.6MB views=572 (PSS 226.9MB) ??active hub
[2026-07-29 11:09:25] PSS +65.7MB GL 49.6MB views=353
[2026-07-29 12:11:08] GL +100.4MB views=577 (PSS 132.8MB) ??active hub
[2026-07-29 17:04:11] PSS +49.2MB GL 44.4MB views=366
[2026-07-29 22:28:05] GL +118.1MB views=577 (PSS 132.6MB) ??active hub
[2026-07-29 22:59:03] CRITICAL process not running ??check crash-*.log
[2026-07-30 00:00:33] PSS +120.8MB GL 123.1MB views=577
[2026-07-30 00:31:29] GL +15.5MB views=575 (PSS 18.1MB) ??active hub
[2026-07-30 09:00:21] PSS +222.9MB GL 131.1MB views=578
[2026-07-30 14:09:53] GL +10.1MB views=575 (PSS 19.7MB) ??active hub
[2026-07-30 15:27:02] PSS +99.3MB GL 39.8MB views=318
[2026-07-30 15:57:54] PSS +41.2MB GL 46.3MB views=375
[2026-07-30 20:35:52] GL +97.1MB views=577 (PSS 129.5MB) ??active hub
[2026-07-31 08:41:34] PSS +239.2MB GL 20.7MB views=99
[2026-07-31 13:35:00] PSS +74.8MB GL 47.5MB views=367
[2026-08-01 06:49:50] GL +8.5MB views=386 (PSS 25.5MB) ??active hub
```

## KPI (overnight window)

| Metric | Count |
|--------|-------|
| GL_HARD_CEILING incidents | 44 |
| Crash / PROCESS_DEATH | 95 |
| Auto app relaunch | 45 |

## Action items for Kim Team Lead

1. GL_HARD_CEILING or 3x GL_SPIKE ??P0 hub Skia audit (see overnight-watch handoff).
2. SIGSEGV/FATAL ??arcfire-bug-debug-workflow + logcat tail in latest crash-*.log.
3. Stair-step floor rise without crash ??today's dev P0 list in overnight-watch handoff.

