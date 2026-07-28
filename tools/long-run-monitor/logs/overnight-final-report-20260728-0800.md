# Arcfire daily 08:00 KST auto report (mandatory perpetual)

Generated (KST): 2026-07-28 08:00:02
Package: com.arcfire.online

## Runtime

| pid | PSS (MB) | GL (MB) | Views |
|-----|----------|---------|-------|
| 14983 | 594.1 | 10.6 | 99 |

## mem-timeline (since DAILY_8AM_REPORT)

```csv
2026-07-28 00:26:33,14983,723.2,855.4,106.2,19.8,126,334.8,45.8,,572,-9.3,0,
2026-07-28 00:41:58,14983,739.2,871.5,109.1,19.8,128.9,334.1,52.8,,572,16,2.9,
2026-07-28 00:57:23,14983,744.7,877.1,109.1,19.8,128.9,334.5,56.9,,572,5.5,0,
2026-07-28 01:12:48,14983,738,870.7,109.1,19.8,128.9,333,51.7,,572,-6.7,0,
2026-07-28 01:28:12,14983,738.6,870.9,109.1,19.8,128.9,333,53.5,,572,0.6,0,
2026-07-28 01:43:37,14983,734.8,866.9,109.1,19.8,128.9,333.2,49.4,,572,-3.8,0,
2026-07-28 01:59:01,14983,729.9,862,109.1,19.8,128.9,332.4,45.1,,572,-4.9,0,
2026-07-28 02:14:25,14983,728.3,858.8,111.1,19.8,130.9,337.1,55.8,,572,-1.6,2,
2026-07-28 02:29:49,14983,695.9,826.5,109.1,19.8,128.9,328.6,42.8,,572,-32.4,-2,
2026-07-28 02:45:13,14983,706.7,837.4,109.1,19.8,128.9,327.4,56.3,,572,10.8,0,
2026-07-28 03:00:38,14983,709.4,840.1,109.1,19.8,128.9,327,59.6,,572,2.7,0,
2026-07-28 03:16:03,14983,702.1,832.7,109.1,19.8,128.9,327.5,51.6,,572,-7.3,0,
2026-07-28 03:31:30,14983,712.3,842.5,111.1,19.8,130.9,327.6,59,,572,10.2,2,
2026-07-28 03:46:55,14983,641.3,618.7,111.1,19.8,130.9,208.6,43.2,,572,-71,0,
2026-07-28 04:02:19,14983,639.2,601.5,111.1,19.8,130.9,200.7,41.4,,572,-2.1,0,
2026-07-28 04:17:43,14983,639.7,602.1,109.1,19.8,128.9,200.6,43.7,,572,0.5,-2,
2026-07-28 04:33:09,14983,635.6,598.6,109.1,19.8,128.9,200.8,40.2,,572,-4.1,0,
2026-07-28 04:48:33,14983,636.3,576.6,109.2,19.8,129,184.7,39.6,,572,0.7,0.1,
2026-07-28 05:04:04,14983,562.2,634.1,9.8,19.8,29.7,284.3,42.9,,99,-74.1,-99.4,GL_RECOVERED idle_ok
2026-07-28 05:19:28,14983,771.7,841.4,153.9,19.8,173.7,349.2,51.6,,572,209.5,144.1,HUB_ACTIVATION gl_mount_ok
2026-07-28 05:34:58,14983,746,815.6,153.9,19.8,173.7,334.7,39.8,,572,-25.7,0,
2026-07-28 05:50:22,14983,580.1,650.1,8.7,19.8,28.6,322.9,46.8,,99,-165.9,-145.2,GL_RECOVERED idle_ok
2026-07-28 06:05:49,14983,592.9,662.9,8.7,19.8,28.6,325.2,45,,99,12.8,0,
2026-07-28 06:21:14,14983,584.2,653.8,8.7,19.8,28.6,319.7,41.4,,99,-8.7,0,
2026-07-28 06:36:37,14983,581.1,651.3,8.7,19.8,28.6,314.2,41,,99,-3.1,0,
2026-07-28 06:52:03,14983,585.1,655.6,9.6,19.8,29.4,314.4,41.9,,99,4,0.9,
2026-07-28 07:07:35,14983,590.5,661,9.6,19.8,29.4,312.8,48.5,,99,5.4,0,
2026-07-28 07:22:59,14983,597.4,666.9,9.6,19.8,29.4,313.9,51.5,,99,6.9,0,
2026-07-28 07:38:24,14983,598.7,668.2,9.6,19.8,29.4,313,53.5,,99,1.3,0,
2026-07-28 07:53:48,14983,600.9,670.2,10.6,19.8,30.4,313,54.2,,99,2.2,1,
```

## incidents.log (tail)

```
[2026-07-27 23:25:01] VIEWS_NATIVE_ADVISORY views=572 native_heap=321.9 pss=732.5 gl=125.4 (node/list retention ??pre-hardceiling early warn)
[2026-07-27 23:40:25] VIEWS_NATIVE_ADVISORY views=572 native_heap=322 pss=732.9 gl=125.4 (node/list retention ??pre-hardceiling early warn)
[2026-07-27 23:55:50] VIEWS_NATIVE_ADVISORY views=572 native_heap=322.3 pss=737.1 gl=125.4 (node/list retention ??pre-hardceiling early warn)
[2026-07-28 00:11:14] VIEWS_NATIVE_ADVISORY views=572 native_heap=340.9 pss=732.5 gl=106.2 (node/list retention ??pre-hardceiling early warn)
[2026-07-28 00:26:38] VIEWS_NATIVE_ADVISORY views=572 native_heap=334.8 pss=723.2 gl=106.2 (node/list retention ??pre-hardceiling early warn)
[2026-07-28 00:42:04] VIEWS_NATIVE_ADVISORY views=572 native_heap=334.1 pss=739.2 gl=109.1 (node/list retention ??pre-hardceiling early warn)
[2026-07-28 00:57:29] VIEWS_NATIVE_ADVISORY views=572 native_heap=334.5 pss=744.7 gl=109.1 (node/list retention ??pre-hardceiling early warn)
[2026-07-28 01:12:53] VIEWS_NATIVE_ADVISORY views=572 native_heap=333 pss=738 gl=109.1 (node/list retention ??pre-hardceiling early warn)
[2026-07-28 01:28:18] VIEWS_NATIVE_ADVISORY views=572 native_heap=333 pss=738.6 gl=109.1 (node/list retention ??pre-hardceiling early warn)
[2026-07-28 01:43:42] VIEWS_NATIVE_ADVISORY views=572 native_heap=333.2 pss=734.8 gl=109.1 (node/list retention ??pre-hardceiling early warn)
[2026-07-28 01:59:06] VIEWS_NATIVE_ADVISORY views=572 native_heap=332.4 pss=729.9 gl=109.1 (node/list retention ??pre-hardceiling early warn)
[2026-07-28 02:14:30] VIEWS_NATIVE_ADVISORY views=572 native_heap=337.1 pss=728.3 gl=111.1 (node/list retention ??pre-hardceiling early warn)
[2026-07-28 02:29:54] VIEWS_NATIVE_ADVISORY views=572 native_heap=328.6 pss=695.9 gl=109.1 (node/list retention ??pre-hardceiling early warn)
[2026-07-28 02:45:19] VIEWS_NATIVE_ADVISORY views=572 native_heap=327.4 pss=706.7 gl=109.1 (node/list retention ??pre-hardceiling early warn)
[2026-07-28 03:00:43] VIEWS_NATIVE_ADVISORY views=572 native_heap=327 pss=709.4 gl=109.1 (node/list retention ??pre-hardceiling early warn)
[2026-07-28 03:16:11] VIEWS_NATIVE_ADVISORY views=572 native_heap=327.5 pss=702.1 gl=109.1 (node/list retention ??pre-hardceiling early warn)
[2026-07-28 03:31:36] VIEWS_NATIVE_ADVISORY views=572 native_heap=327.6 pss=712.3 gl=111.1 (node/list retention ??pre-hardceiling early warn)
[2026-07-28 03:47:01] VIEWS_NATIVE_ADVISORY views=572 native_heap=208.6 pss=641.3 gl=111.1 (node/list retention ??pre-hardceiling early warn)
[2026-07-28 04:02:24] VIEWS_NATIVE_ADVISORY views=572 native_heap=200.7 pss=639.2 gl=111.1 (node/list retention ??pre-hardceiling early warn)
[2026-07-28 04:17:50] VIEWS_NATIVE_ADVISORY views=572 native_heap=200.6 pss=639.7 gl=109.1 (node/list retention ??pre-hardceiling early warn)
[2026-07-28 04:33:14] VIEWS_NATIVE_ADVISORY views=572 native_heap=200.8 pss=635.6 gl=109.1 (node/list retention ??pre-hardceiling early warn)
[2026-07-28 04:48:38] VIEWS_NATIVE_ADVISORY views=572 native_heap=184.7 pss=636.3 gl=109.2 (node/list retention ??pre-hardceiling early warn)
[2026-07-28 05:19:34] VIEWS_NATIVE_ADVISORY views=572 native_heap=349.2 pss=771.7 gl=153.9 (node/list retention ??pre-hardceiling early warn)
[2026-07-28 05:35:05] VIEWS_NATIVE_ADVISORY views=572 native_heap=334.7 pss=746 gl=153.9 (node/list retention ??pre-hardceiling early warn)
[2026-07-28 08:00:00] DAILY_8AM_REPORT 2026-07-28 08:00:00 KST
```

## remediation.log (tail)

```
[2026-07-27 23:09:35] INFO VIEWS_NATIVE_ADVISORY views=572 native_heap=321.9 pss=739 gl=125.4 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-27 23:25:01] INFO VIEWS_NATIVE_ADVISORY views=572 native_heap=321.9 pss=732.5 gl=125.4 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-27 23:40:25] INFO VIEWS_NATIVE_ADVISORY views=572 native_heap=322 pss=732.9 gl=125.4 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-27 23:55:50] INFO VIEWS_NATIVE_ADVISORY views=572 native_heap=322.3 pss=737.1 gl=125.4 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-28 00:11:14] INFO VIEWS_NATIVE_ADVISORY views=572 native_heap=340.9 pss=732.5 gl=106.2 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-28 00:26:38] INFO VIEWS_NATIVE_ADVISORY views=572 native_heap=334.8 pss=723.2 gl=106.2 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-28 00:42:04] INFO VIEWS_NATIVE_ADVISORY views=572 native_heap=334.1 pss=739.2 gl=109.1 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-28 00:57:29] INFO VIEWS_NATIVE_ADVISORY views=572 native_heap=334.5 pss=744.7 gl=109.1 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-28 01:12:53] INFO VIEWS_NATIVE_ADVISORY views=572 native_heap=333 pss=738 gl=109.1 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-28 01:28:18] INFO VIEWS_NATIVE_ADVISORY views=572 native_heap=333 pss=738.6 gl=109.1 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-28 01:43:42] INFO VIEWS_NATIVE_ADVISORY views=572 native_heap=333.2 pss=734.8 gl=109.1 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-28 01:59:06] INFO VIEWS_NATIVE_ADVISORY views=572 native_heap=332.4 pss=729.9 gl=109.1 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-28 02:14:30] INFO VIEWS_NATIVE_ADVISORY views=572 native_heap=337.1 pss=728.3 gl=111.1 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-28 02:29:54] INFO VIEWS_NATIVE_ADVISORY views=572 native_heap=328.6 pss=695.9 gl=109.1 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-28 02:45:19] INFO VIEWS_NATIVE_ADVISORY views=572 native_heap=327.4 pss=706.7 gl=109.1 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-28 03:00:43] INFO VIEWS_NATIVE_ADVISORY views=572 native_heap=327 pss=709.4 gl=109.1 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-28 03:16:11] INFO VIEWS_NATIVE_ADVISORY views=572 native_heap=327.5 pss=702.1 gl=109.1 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-28 03:31:36] INFO VIEWS_NATIVE_ADVISORY views=572 native_heap=327.6 pss=712.3 gl=111.1 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-28 03:47:01] INFO VIEWS_NATIVE_ADVISORY views=572 native_heap=208.6 pss=641.3 gl=111.1 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-28 04:02:24] INFO VIEWS_NATIVE_ADVISORY views=572 native_heap=200.7 pss=639.2 gl=111.1 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-28 04:17:50] INFO VIEWS_NATIVE_ADVISORY views=572 native_heap=200.6 pss=639.7 gl=109.1 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-28 04:33:14] INFO VIEWS_NATIVE_ADVISORY views=572 native_heap=200.8 pss=635.6 gl=109.1 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-28 04:48:38] INFO VIEWS_NATIVE_ADVISORY views=572 native_heap=184.7 pss=636.3 gl=109.2 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-28 05:19:34] INFO VIEWS_NATIVE_ADVISORY views=572 native_heap=349.2 pss=771.7 gl=153.9 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-28 05:35:05] INFO VIEWS_NATIVE_ADVISORY views=572 native_heap=334.7 pss=746 gl=153.9 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
```

## mem-alerts.log (tail)

```
[2026-07-26 04:17:57] CRITICAL process not running ??check crash-*.log
[2026-07-26 04:32:58] CRITICAL process not running ??check crash-*.log
[2026-07-26 04:47:59] CRITICAL process not running ??check crash-*.log
[2026-07-26 05:02:59] CRITICAL process not running ??check crash-*.log
[2026-07-26 05:17:59] CRITICAL process not running ??check crash-*.log
[2026-07-26 05:32:59] CRITICAL process not running ??check crash-*.log
[2026-07-26 05:48:00] CRITICAL process not running ??check crash-*.log
[2026-07-26 06:03:00] CRITICAL process not running ??check crash-*.log
[2026-07-26 06:18:00] CRITICAL process not running ??check crash-*.log
[2026-07-26 06:33:00] CRITICAL process not running ??check crash-*.log
[2026-07-26 06:48:01] CRITICAL process not running ??check crash-*.log
[2026-07-26 07:03:01] CRITICAL process not running ??check crash-*.log
[2026-07-26 07:18:01] CRITICAL process not running ??check crash-*.log
[2026-07-26 07:33:02] CRITICAL process not running ??check crash-*.log
[2026-07-26 07:48:03] CRITICAL process not running ??check crash-*.log
[2026-07-26 08:03:04] CRITICAL process not running ??check crash-*.log
[2026-07-26 16:17:41] GL +103.5MB views=572 (PSS 128.8MB) ??active hub
[2026-07-27 00:32:40] CRITICAL process not running ??check crash-*.log
[2026-07-27 09:16:35] CRITICAL process not running ??check crash-*.log
[2026-07-27 09:31:37] CRITICAL process not running ??check crash-*.log
[2026-07-27 11:03:46] PSS +95.8MB GL 27.8MB views=99
[2026-07-27 12:21:55] PSS +105.9MB GL 47.8MB views=351
[2026-07-27 15:57:40] GL +91.8MB views=569 (PSS 111.8MB) ??active hub
[2026-07-27 20:19:44] GL +92.4MB views=570 (PSS 128.1MB) ??active hub
[2026-07-27 20:35:13] PSS +40.8MB GL 119MB views=572
```

## KPI (overnight window)

| Metric | Count |
|--------|-------|
| GL_HARD_CEILING incidents | 42 |
| Crash / PROCESS_DEATH | 95 |
| Auto app relaunch | 42 |

## Action items for Kim Team Lead

1. GL_HARD_CEILING or 3x GL_SPIKE ??P0 hub Skia audit (see overnight-watch handoff).
2. SIGSEGV/FATAL ??arcfire-bug-debug-workflow + logcat tail in latest crash-*.log.
3. Stair-step floor rise without crash ??today's dev P0 list in overnight-watch handoff.

