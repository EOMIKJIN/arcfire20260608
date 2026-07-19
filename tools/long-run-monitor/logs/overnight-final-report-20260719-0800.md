# Arcfire daily 08:00 KST auto report (mandatory perpetual)

Generated (KST): 2026-07-19 08:00:02
Package: com.arcfire.online

## Runtime

| pid | PSS (MB) | GL (MB) | Views |
|-----|----------|---------|-------|
| 8697 | 788 | 115.2 | 550 |

## mem-timeline (since DAILY_8AM_REPORT)

```csv
2026-07-19 00:15:41,8697,812.4,788.6,113.5,19.8,133.3,318.4,40.4,,550,-11.6,-20.2,GL_RECOVERED idle_ok
2026-07-19 00:31:06,8697,780,652.8,115.2,19.8,135.1,246.5,38.1,,550,-32.4,1.7,
2026-07-19 00:46:30,8697,785,668,115.2,19.8,135.1,248,42.7,,550,5,0,
2026-07-19 01:01:55,8697,780.8,666.8,115.2,19.8,135.1,247.3,38.4,,550,-4.2,0,
2026-07-19 01:17:20,8697,786.1,679.1,115.2,19.8,135.1,249.6,39.2,,550,5.3,0,
2026-07-19 01:32:46,8697,813.1,689.2,115.2,19.8,135.1,250.1,54.6,,550,27,0,
2026-07-19 01:48:11,8697,802.2,678.7,115.2,19.8,135.1,235.9,53.6,,550,-10.9,0,
2026-07-19 02:19:01,8697,790.3,645.1,115.2,19.8,135.1,213.8,42.7,,550,-11.9,0,
2026-07-19 02:34:27,8697,797.4,635.1,115.2,19.8,135.1,198.2,55.5,,550,7.1,0,
2026-07-19 02:49:51,8697,783.1,621.1,119.3,19.8,139.1,197.8,37.9,,550,-14.3,4.1,
2026-07-19 03:05:18,8697,789.3,627.5,115.2,19.8,135.1,198.1,47.9,,550,6.2,-4.1,
2026-07-19 03:20:44,8697,781.7,621.1,115.2,19.8,135.1,196.6,42.7,,550,-7.6,0,
2026-07-19 03:36:09,8697,773.1,612.7,115.2,19.8,135.1,197.7,32.9,,550,-8.6,0,
2026-07-19 03:51:33,8697,773.7,613.5,115.2,19.8,135.1,198.4,33.4,,550,0.6,0,
2026-07-19 04:06:59,8697,773.5,613.5,115.2,19.8,135.1,197.6,33.8,,550,-0.2,0,
2026-07-19 04:22:23,8697,774.6,614.7,115.2,19.8,135.1,198.4,33.9,,550,1.1,0,
2026-07-19 04:37:49,8697,789.4,629.8,117.4,19.8,137.2,207.3,38,,550,14.8,2.2,
2026-07-19 04:53:15,8697,783,623.5,115.4,19.8,135.2,197.5,45.7,,550,-6.4,-2,
2026-07-19 05:08:40,8697,789.5,630,115.4,19.8,135.2,198.1,51.4,,550,6.5,0,
2026-07-19 05:24:05,8697,781.6,624.9,115.2,19.8,135.1,202.3,41.4,,551,-7.9,-0.2,
2026-07-19 05:39:30,8697,790,633.4,117.4,19.8,137.2,200.8,48.6,,551,8.4,2.2,
2026-07-19 05:54:55,8697,780.2,623.7,115.4,19.8,135.2,201.2,40.6,,551,-9.8,-2,
2026-07-19 06:10:21,8697,777.1,620.8,115.4,19.8,135.2,201.1,37.7,,551,-3.1,0,
2026-07-19 06:25:46,8697,787.8,632.9,115.2,19.8,135.1,202.3,47.9,,550,10.7,-0.2,
2026-07-19 06:41:11,8697,774.6,619.4,115.2,19.8,135.1,201.3,36.4,,550,-13.2,0,
2026-07-19 06:56:35,8697,779.2,624.2,115.2,19.8,135.1,202.6,40,,550,4.6,0,
2026-07-19 07:12:01,8697,795.5,640.6,115.2,19.8,135.1,202.4,56.2,,550,16.3,0,
2026-07-19 07:27:26,8697,773.7,618.9,115.2,19.8,135.1,202.2,34.9,,550,-21.8,0,
2026-07-19 07:42:50,8697,771.2,616.6,115.2,19.8,135.1,202.1,32.5,,550,-2.5,0,
2026-07-19 07:58:19,8697,792.9,638.5,115.2,19.8,135.1,208.2,48.3,,550,21.7,0,
```

## incidents.log (tail)

```
[2026-07-19 02:03:42] PSS_SOFT_CEILING pss=802.2 gl=115.2 views=550 native_reclaim_advisory
[2026-07-19 02:19:07] VIEWS_NATIVE_ADVISORY views=550 native_heap=213.8 pss=790.3 gl=115.2 (node/list retention ??pre-hardceiling early warn)
[2026-07-19 02:34:32] VIEWS_NATIVE_ADVISORY views=550 native_heap=198.2 pss=797.4 gl=115.2 (node/list retention ??pre-hardceiling early warn)
[2026-07-19 02:49:58] VIEWS_NATIVE_ADVISORY views=550 native_heap=197.8 pss=783.1 gl=119.3 (node/list retention ??pre-hardceiling early warn)
[2026-07-19 03:05:23] VIEWS_NATIVE_ADVISORY views=550 native_heap=198.1 pss=789.3 gl=115.2 (node/list retention ??pre-hardceiling early warn)
[2026-07-19 03:20:49] VIEWS_NATIVE_ADVISORY views=550 native_heap=196.6 pss=781.7 gl=115.2 (node/list retention ??pre-hardceiling early warn)
[2026-07-19 03:36:14] VIEWS_NATIVE_ADVISORY views=550 native_heap=197.7 pss=773.1 gl=115.2 (node/list retention ??pre-hardceiling early warn)
[2026-07-19 03:51:40] VIEWS_NATIVE_ADVISORY views=550 native_heap=198.4 pss=773.7 gl=115.2 (node/list retention ??pre-hardceiling early warn)
[2026-07-19 04:07:04] VIEWS_NATIVE_ADVISORY views=550 native_heap=197.6 pss=773.5 gl=115.2 (node/list retention ??pre-hardceiling early warn)
[2026-07-19 04:22:30] VIEWS_NATIVE_ADVISORY views=550 native_heap=198.4 pss=774.6 gl=115.2 (node/list retention ??pre-hardceiling early warn)
[2026-07-19 04:37:56] VIEWS_NATIVE_ADVISORY views=550 native_heap=207.3 pss=789.4 gl=117.4 (node/list retention ??pre-hardceiling early warn)
[2026-07-19 04:53:21] VIEWS_NATIVE_ADVISORY views=550 native_heap=197.5 pss=783 gl=115.4 (node/list retention ??pre-hardceiling early warn)
[2026-07-19 05:08:46] VIEWS_NATIVE_ADVISORY views=550 native_heap=198.1 pss=789.5 gl=115.4 (node/list retention ??pre-hardceiling early warn)
[2026-07-19 05:24:10] VIEWS_NATIVE_ADVISORY views=551 native_heap=202.3 pss=781.6 gl=115.2 (node/list retention ??pre-hardceiling early warn)
[2026-07-19 05:39:36] VIEWS_NATIVE_ADVISORY views=551 native_heap=200.8 pss=790 gl=117.4 (node/list retention ??pre-hardceiling early warn)
[2026-07-19 05:55:02] VIEWS_NATIVE_ADVISORY views=551 native_heap=201.2 pss=780.2 gl=115.4 (node/list retention ??pre-hardceiling early warn)
[2026-07-19 06:10:27] VIEWS_NATIVE_ADVISORY views=551 native_heap=201.1 pss=777.1 gl=115.4 (node/list retention ??pre-hardceiling early warn)
[2026-07-19 06:25:52] VIEWS_NATIVE_ADVISORY views=550 native_heap=202.3 pss=787.8 gl=115.2 (node/list retention ??pre-hardceiling early warn)
[2026-07-19 06:41:16] VIEWS_NATIVE_ADVISORY views=550 native_heap=201.3 pss=774.6 gl=115.2 (node/list retention ??pre-hardceiling early warn)
[2026-07-19 06:56:41] VIEWS_NATIVE_ADVISORY views=550 native_heap=202.6 pss=779.2 gl=115.2 (node/list retention ??pre-hardceiling early warn)
[2026-07-19 07:12:06] VIEWS_NATIVE_ADVISORY views=550 native_heap=202.4 pss=795.5 gl=115.2 (node/list retention ??pre-hardceiling early warn)
[2026-07-19 07:27:31] VIEWS_NATIVE_ADVISORY views=550 native_heap=202.2 pss=773.7 gl=115.2 (node/list retention ??pre-hardceiling early warn)
[2026-07-19 07:42:56] VIEWS_NATIVE_ADVISORY views=550 native_heap=202.1 pss=771.2 gl=115.2 (node/list retention ??pre-hardceiling early warn)
[2026-07-19 07:58:26] VIEWS_NATIVE_ADVISORY views=550 native_heap=208.2 pss=792.9 gl=115.2 (node/list retention ??pre-hardceiling early warn)
[2026-07-19 08:00:00] DAILY_8AM_REPORT 2026-07-19 08:00:00 KST
```

## remediation.log (tail)

```
[2026-07-19 01:48:16] INFO PSS_SOFT_CEILING pss=802.2 gl=115.2 views=550 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-19 02:03:42] INFO PSS_SOFT_CEILING pss=802.2 gl=115.2 views=550 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-19 02:19:07] INFO VIEWS_NATIVE_ADVISORY views=550 native_heap=213.8 pss=790.3 gl=115.2 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-19 02:34:32] INFO VIEWS_NATIVE_ADVISORY views=550 native_heap=198.2 pss=797.4 gl=115.2 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-19 02:49:58] INFO VIEWS_NATIVE_ADVISORY views=550 native_heap=197.8 pss=783.1 gl=119.3 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-19 03:05:23] INFO VIEWS_NATIVE_ADVISORY views=550 native_heap=198.1 pss=789.3 gl=115.2 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-19 03:20:49] INFO VIEWS_NATIVE_ADVISORY views=550 native_heap=196.6 pss=781.7 gl=115.2 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-19 03:36:14] INFO VIEWS_NATIVE_ADVISORY views=550 native_heap=197.7 pss=773.1 gl=115.2 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-19 03:51:40] INFO VIEWS_NATIVE_ADVISORY views=550 native_heap=198.4 pss=773.7 gl=115.2 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-19 04:07:04] INFO VIEWS_NATIVE_ADVISORY views=550 native_heap=197.6 pss=773.5 gl=115.2 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-19 04:22:30] INFO VIEWS_NATIVE_ADVISORY views=550 native_heap=198.4 pss=774.6 gl=115.2 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-19 04:37:56] INFO VIEWS_NATIVE_ADVISORY views=550 native_heap=207.3 pss=789.4 gl=117.4 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-19 04:53:21] INFO VIEWS_NATIVE_ADVISORY views=550 native_heap=197.5 pss=783 gl=115.4 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-19 05:08:46] INFO VIEWS_NATIVE_ADVISORY views=550 native_heap=198.1 pss=789.5 gl=115.4 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-19 05:24:10] INFO VIEWS_NATIVE_ADVISORY views=551 native_heap=202.3 pss=781.6 gl=115.2 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-19 05:39:36] INFO VIEWS_NATIVE_ADVISORY views=551 native_heap=200.8 pss=790 gl=117.4 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-19 05:55:02] INFO VIEWS_NATIVE_ADVISORY views=551 native_heap=201.2 pss=780.2 gl=115.4 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-19 06:10:27] INFO VIEWS_NATIVE_ADVISORY views=551 native_heap=201.1 pss=777.1 gl=115.4 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-19 06:25:52] INFO VIEWS_NATIVE_ADVISORY views=550 native_heap=202.3 pss=787.8 gl=115.2 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-19 06:41:16] INFO VIEWS_NATIVE_ADVISORY views=550 native_heap=201.3 pss=774.6 gl=115.2 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-19 06:56:41] INFO VIEWS_NATIVE_ADVISORY views=550 native_heap=202.6 pss=779.2 gl=115.2 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-19 07:12:06] INFO VIEWS_NATIVE_ADVISORY views=550 native_heap=202.4 pss=795.5 gl=115.2 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-19 07:27:31] INFO VIEWS_NATIVE_ADVISORY views=550 native_heap=202.2 pss=773.7 gl=115.2 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-19 07:42:56] INFO VIEWS_NATIVE_ADVISORY views=550 native_heap=202.1 pss=771.2 gl=115.2 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-19 07:58:26] INFO VIEWS_NATIVE_ADVISORY views=550 native_heap=208.2 pss=792.9 gl=115.2 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
```

## mem-alerts.log (tail)

```
[2026-07-11 10:51:45] GL +82.9MB views=579 (PSS 75.2MB) ??active hub
[2026-07-11 11:53:27] PSS +69.3MB GL 44.5MB views=512
[2026-07-11 12:08:59] GL +12.7MB views=378 (PSS -8.9MB) ??active hub
[2026-07-11 15:28:39] GL +11.8MB views=346 (PSS 0.3MB) ??active hub
[2026-07-11 21:22:44] GL +22.3MB views=358 (PSS 39.5MB) ??active hub
[2026-07-11 21:53:32] PSS +59.8MB GL 46.2MB views=317
[2026-07-11 22:09:02] GL +9.4MB views=374 (PSS -4.3MB) ??active hub
[2026-07-11 23:57:17] GL +16.2MB views=373 (PSS 40.9MB) ??active hub
[2026-07-12 01:45:10] PSS +42MB GL 47.5MB views=399
[2026-07-12 06:06:21] PSS +41.8MB GL 46.8MB views=400
[2026-07-12 14:17:52] GL +27.3MB views=374 (PSS 75.9MB) ??active hub
[2026-07-12 16:36:09] GL +8.7MB views=379 (PSS 17.9MB) ??active hub
[2026-07-12 16:51:33] GL +11.7MB views=375 (PSS -38.6MB) ??active hub
[2026-07-12 20:11:44] CRITICAL process not running ??check crash-*.log
[2026-07-12 20:58:38] PSS +48.8MB GL 44.5MB views=373
[2026-07-12 21:29:27] GL +17.2MB views=370 (PSS 25.2MB) ??active hub
[2026-07-13 00:34:34] GL +83.4MB views=559 (PSS 84.9MB) ??active hub
[2026-07-13 01:05:37] GL +9.6MB views=577 (PSS -7.9MB) ??active hub
[2026-07-13 11:36:06] GL +102.5MB views=560 (PSS 122.9MB) ??active hub
[2026-07-13 14:09:57] CRITICAL process not running ??check crash-*.log
[2026-07-13 14:25:00] CRITICAL process not running ??check crash-*.log
[2026-07-17 12:02:18] CRITICAL process not running ??check crash-*.log
[2026-07-18 06:31:47] CRITICAL process not running ??check crash-*.log
[2026-07-18 12:41:32] GL +125.9MB views=549 (PSS 166.7MB) ??active hub
[2026-07-19 00:00:15] GL +96.3MB views=550 (PSS 143.6MB) ??active hub
```

## KPI (overnight window)

| Metric | Count |
|--------|-------|
| GL_HARD_CEILING incidents | 35 |
| Crash / PROCESS_DEATH | 95 |
| Auto app relaunch | 35 |

## Action items for Kim Team Lead

1. GL_HARD_CEILING or 3x GL_SPIKE ??P0 hub Skia audit (see overnight-watch handoff).
2. SIGSEGV/FATAL ??arcfire-bug-debug-workflow + logcat tail in latest crash-*.log.
3. Stair-step floor rise without crash ??today's dev P0 list in overnight-watch handoff.

