# Arcfire daily 08:00 KST auto report (mandatory perpetual)

Generated (KST): 2026-07-31 08:00:02
Package: com.arcfire.online

## Runtime

| pid | PSS (MB) | GL (MB) | Views |
|-----|----------|---------|-------|
| 29392 | 786.3 | 122.6 | 577 |

## mem-timeline (since DAILY_8AM_REPORT)

```csv
2026-07-31 00:27:28,29392,782.3,614.6,122.6,19.8,142.4,202.4,46.6,,576,-8.4,0,
2026-07-31 00:42:59,29392,776.5,608.4,122.6,19.8,142.4,204.9,37.5,,576,-5.8,0,
2026-07-31 00:58:24,29392,774.7,606.4,124.6,19.8,144.4,201.8,36.5,,576,-1.8,2,
2026-07-31 01:13:51,29392,781.1,612.8,122.6,19.8,142.4,202.2,44.9,,576,6.4,-2,
2026-07-31 01:29:17,29392,773.2,605.4,122.6,19.8,142.4,202,36.2,,576,-7.9,0,
2026-07-31 01:44:43,29392,792.2,624.4,122.6,19.8,142.4,201.3,55.7,,597,19,0,
2026-07-31 02:00:08,29392,782.2,614.5,126.6,19.8,146.4,202.3,40.8,,576,-10,4,
2026-07-31 02:15:34,29392,773.1,606.1,122.6,19.8,142.4,203.6,35.4,,575,-9.1,-4,
2026-07-31 02:30:59,29392,776.3,609.4,122.2,19.8,142.1,203.3,38.6,,576,3.2,-0.4,
2026-07-31 02:46:27,29392,777,608.9,123.2,19.8,143.1,203,37.8,,576,0.7,1,
2026-07-31 03:01:53,29392,781.9,614.3,127.3,19.8,147.1,203.7,38.8,,576,4.9,4.1,
2026-07-31 03:17:21,29392,774.6,607.1,123.2,19.8,143.1,203.6,36,,576,-7.3,-4.1,
2026-07-31 03:32:46,29392,800.8,632.9,123.2,19.8,143.1,204.2,61.1,,576,26.2,0,
2026-07-31 03:48:12,29392,795.9,628.5,124,19.8,143.8,203.8,56.2,,576,-4.9,0.8,
2026-07-31 04:03:37,29392,773.9,606.7,126,19.8,145.8,204.1,32,,576,-22,2,
2026-07-31 04:19:05,29392,778.3,611.1,124,19.8,143.8,203.6,39,,576,4.4,-2,
2026-07-31 04:34:30,29392,776.7,609.6,124,19.8,143.8,203.5,37.7,,576,-1.6,0,
2026-07-31 04:49:54,29392,777.5,610.2,124.1,19.8,144,203.3,38.4,,576,0.8,0.1,
2026-07-31 05:05:20,29392,779.2,610.9,124.1,19.8,144,204,38.1,,576,1.7,0,
2026-07-31 05:20:46,29392,779.2,610.8,124.1,19.8,144,203.9,38.4,,576,0,0,
2026-07-31 05:36:11,29392,779.4,610.6,124.1,19.8,144,203.1,39.1,,576,0.2,0,
2026-07-31 05:51:37,29392,777.3,609.3,124.1,19.8,144,203.6,37.4,,576,-2.1,0,
2026-07-31 06:07:02,29392,775.2,607.1,120.6,19.8,140.4,208.5,35.5,,577,-2.1,-3.5,
2026-07-31 06:22:29,29392,767.5,599.6,124.6,19.8,144.4,206.4,25.6,,577,-7.7,4,
2026-07-31 06:38:00,29392,785.4,617.6,120.6,19.8,140.4,206.7,47.4,,577,17.9,-4,
2026-07-31 06:53:27,29392,783.4,615.7,122.6,19.8,142.4,206.9,43.3,,577,-2,2,
2026-07-31 07:08:52,29392,800.9,632.9,124.6,19.8,144.4,207.7,54,,577,17.5,2,
2026-07-31 07:24:18,29392,790.4,622.4,122.6,19.8,142.4,204.1,49.4,,577,-10.5,-2,
2026-07-31 07:39:43,29392,787,618.9,122.6,19.8,142.4,203.9,45.5,,577,-3.4,0,
2026-07-31 07:55:10,29392,781.6,613.6,122.6,19.8,142.4,204.2,40.3,,577,-5.4,0,
```

## incidents.log (tail)

```
[2026-07-31 02:00:14] VIEWS_NATIVE_ADVISORY views=576 native_heap=202.3 pss=782.2 gl=126.6 (node/list retention ??pre-hardceiling early warn)
[2026-07-31 02:15:40] VIEWS_NATIVE_ADVISORY views=575 native_heap=203.6 pss=773.1 gl=122.6 (node/list retention ??pre-hardceiling early warn)
[2026-07-31 02:31:07] VIEWS_NATIVE_ADVISORY views=576 native_heap=203.3 pss=776.3 gl=122.2 (node/list retention ??pre-hardceiling early warn)
[2026-07-31 02:46:33] VIEWS_NATIVE_ADVISORY views=576 native_heap=203 pss=777 gl=123.2 (node/list retention ??pre-hardceiling early warn)
[2026-07-31 03:02:01] VIEWS_NATIVE_ADVISORY views=576 native_heap=203.7 pss=781.9 gl=127.3 (node/list retention ??pre-hardceiling early warn)
[2026-07-31 03:17:26] VIEWS_NATIVE_ADVISORY views=576 native_heap=203.6 pss=774.6 gl=123.2 (node/list retention ??pre-hardceiling early warn)
[2026-07-31 03:32:52] PSS_SOFT_CEILING pss=800.8 gl=123.2 views=576 native_reclaim_advisory
[2026-07-31 03:48:17] VIEWS_NATIVE_ADVISORY views=576 native_heap=203.8 pss=795.9 gl=124 (node/list retention ??pre-hardceiling early warn)
[2026-07-31 04:03:43] VIEWS_NATIVE_ADVISORY views=576 native_heap=204.1 pss=773.9 gl=126 (node/list retention ??pre-hardceiling early warn)
[2026-07-31 04:19:11] VIEWS_NATIVE_ADVISORY views=576 native_heap=203.6 pss=778.3 gl=124 (node/list retention ??pre-hardceiling early warn)
[2026-07-31 04:34:35] VIEWS_NATIVE_ADVISORY views=576 native_heap=203.5 pss=776.7 gl=124 (node/list retention ??pre-hardceiling early warn)
[2026-07-31 04:50:00] VIEWS_NATIVE_ADVISORY views=576 native_heap=203.3 pss=777.5 gl=124.1 (node/list retention ??pre-hardceiling early warn)
[2026-07-31 05:05:26] VIEWS_NATIVE_ADVISORY views=576 native_heap=204 pss=779.2 gl=124.1 (node/list retention ??pre-hardceiling early warn)
[2026-07-31 05:20:51] VIEWS_NATIVE_ADVISORY views=576 native_heap=203.9 pss=779.2 gl=124.1 (node/list retention ??pre-hardceiling early warn)
[2026-07-31 05:36:17] VIEWS_NATIVE_ADVISORY views=576 native_heap=203.1 pss=779.4 gl=124.1 (node/list retention ??pre-hardceiling early warn)
[2026-07-31 05:51:42] VIEWS_NATIVE_ADVISORY views=576 native_heap=203.6 pss=777.3 gl=124.1 (node/list retention ??pre-hardceiling early warn)
[2026-07-31 06:07:10] VIEWS_NATIVE_ADVISORY views=577 native_heap=208.5 pss=775.2 gl=120.6 (node/list retention ??pre-hardceiling early warn)
[2026-07-31 06:22:40] VIEWS_NATIVE_ADVISORY views=577 native_heap=206.4 pss=767.5 gl=124.6 (node/list retention ??pre-hardceiling early warn)
[2026-07-31 06:38:06] VIEWS_NATIVE_ADVISORY views=577 native_heap=206.7 pss=785.4 gl=120.6 (node/list retention ??pre-hardceiling early warn)
[2026-07-31 06:53:32] VIEWS_NATIVE_ADVISORY views=577 native_heap=206.9 pss=783.4 gl=122.6 (node/list retention ??pre-hardceiling early warn)
[2026-07-31 07:08:57] PSS_SOFT_CEILING pss=800.9 gl=124.6 views=577 native_reclaim_advisory
[2026-07-31 07:24:23] VIEWS_NATIVE_ADVISORY views=577 native_heap=204.1 pss=790.4 gl=122.6 (node/list retention ??pre-hardceiling early warn)
[2026-07-31 07:39:49] VIEWS_NATIVE_ADVISORY views=577 native_heap=203.9 pss=787 gl=122.6 (node/list retention ??pre-hardceiling early warn)
[2026-07-31 07:55:15] VIEWS_NATIVE_ADVISORY views=577 native_heap=204.2 pss=781.6 gl=122.6 (node/list retention ??pre-hardceiling early warn)
[2026-07-31 08:00:00] DAILY_8AM_REPORT 2026-07-31 08:00:00 KST
```

## remediation.log (tail)

```
[2026-07-31 01:44:48] INFO VIEWS_NATIVE_ADVISORY views=597 native_heap=201.3 pss=792.2 gl=122.6 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-31 02:00:14] INFO VIEWS_NATIVE_ADVISORY views=576 native_heap=202.3 pss=782.2 gl=126.6 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-31 02:15:40] INFO VIEWS_NATIVE_ADVISORY views=575 native_heap=203.6 pss=773.1 gl=122.6 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-31 02:31:07] INFO VIEWS_NATIVE_ADVISORY views=576 native_heap=203.3 pss=776.3 gl=122.2 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-31 02:46:33] INFO VIEWS_NATIVE_ADVISORY views=576 native_heap=203 pss=777 gl=123.2 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-31 03:02:01] INFO VIEWS_NATIVE_ADVISORY views=576 native_heap=203.7 pss=781.9 gl=127.3 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-31 03:17:26] INFO VIEWS_NATIVE_ADVISORY views=576 native_heap=203.6 pss=774.6 gl=123.2 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-31 03:32:52] INFO PSS_SOFT_CEILING pss=800.8 gl=123.2 views=576 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-31 03:48:17] INFO VIEWS_NATIVE_ADVISORY views=576 native_heap=203.8 pss=795.9 gl=124 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-31 04:03:43] INFO VIEWS_NATIVE_ADVISORY views=576 native_heap=204.1 pss=773.9 gl=126 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-31 04:19:11] INFO VIEWS_NATIVE_ADVISORY views=576 native_heap=203.6 pss=778.3 gl=124 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-31 04:34:35] INFO VIEWS_NATIVE_ADVISORY views=576 native_heap=203.5 pss=776.7 gl=124 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-31 04:50:00] INFO VIEWS_NATIVE_ADVISORY views=576 native_heap=203.3 pss=777.5 gl=124.1 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-31 05:05:26] INFO VIEWS_NATIVE_ADVISORY views=576 native_heap=204 pss=779.2 gl=124.1 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-31 05:20:51] INFO VIEWS_NATIVE_ADVISORY views=576 native_heap=203.9 pss=779.2 gl=124.1 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-31 05:36:17] INFO VIEWS_NATIVE_ADVISORY views=576 native_heap=203.1 pss=779.4 gl=124.1 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-31 05:51:42] INFO VIEWS_NATIVE_ADVISORY views=576 native_heap=203.6 pss=777.3 gl=124.1 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-31 06:07:10] INFO VIEWS_NATIVE_ADVISORY views=577 native_heap=208.5 pss=775.2 gl=120.6 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-31 06:22:40] INFO VIEWS_NATIVE_ADVISORY views=577 native_heap=206.4 pss=767.5 gl=124.6 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-31 06:38:06] INFO VIEWS_NATIVE_ADVISORY views=577 native_heap=206.7 pss=785.4 gl=120.6 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-31 06:53:32] INFO VIEWS_NATIVE_ADVISORY views=577 native_heap=206.9 pss=783.4 gl=122.6 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-31 07:08:57] INFO PSS_SOFT_CEILING pss=800.9 gl=124.6 views=577 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-31 07:24:23] INFO VIEWS_NATIVE_ADVISORY views=577 native_heap=204.1 pss=790.4 gl=122.6 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-31 07:39:49] INFO VIEWS_NATIVE_ADVISORY views=577 native_heap=203.9 pss=787 gl=122.6 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-31 07:55:15] INFO VIEWS_NATIVE_ADVISORY views=577 native_heap=204.2 pss=781.6 gl=122.6 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
```

## mem-alerts.log (tail)

```
[2026-07-27 09:16:35] CRITICAL process not running ??check crash-*.log
[2026-07-27 09:31:37] CRITICAL process not running ??check crash-*.log
[2026-07-27 11:03:46] PSS +95.8MB GL 27.8MB views=99
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

