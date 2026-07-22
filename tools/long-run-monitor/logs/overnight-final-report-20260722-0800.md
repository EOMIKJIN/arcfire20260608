# Arcfire daily 08:00 KST auto report (mandatory perpetual)

Generated (KST): 2026-07-22 08:00:02
Package: com.arcfire.online

## Runtime

| pid | PSS (MB) | GL (MB) | Views |
|-----|----------|---------|-------|
| 20407 | 623.8 | 108.4 | 553 |

## mem-timeline (since DAILY_8AM_REPORT)

```csv
2026-07-22 00:27:10,20407,635.4,587.3,108.4,19.8,128.2,191.8,42.3,,553,7.7,1.8,
2026-07-22 00:42:36,20407,632.6,575.2,110.4,19.8,130.2,178.8,45.9,,553,-2.8,2,
2026-07-22 00:58:02,20407,629.8,572.5,108.4,19.8,128.2,177.1,46.1,,553,-2.8,-2,
2026-07-22 01:13:27,20407,634.5,577.5,108.4,19.8,128.2,176.6,51.6,,553,4.7,0,
2026-07-22 01:28:54,20407,627.7,570.4,108.4,19.8,128.2,177.5,43.1,,553,-6.8,0,
2026-07-22 01:44:20,20407,627.6,570.3,108.4,19.8,128.2,176.8,43.8,,553,-0.1,0,
2026-07-22 01:59:50,20407,633.4,576,108.4,19.8,128.2,185.3,47.7,,553,5.8,0,
2026-07-22 02:15:16,20407,645.4,588.6,108.4,19.8,128.2,177.6,59.5,,553,12,0,
2026-07-22 02:30:41,20407,636.4,579.8,110.4,19.8,130.2,177.6,49.3,,553,-9,2,
2026-07-22 02:46:06,20407,639.9,583.3,108.4,19.8,128.2,177.5,54.6,,553,3.5,-2,
2026-07-22 03:01:30,20407,638.3,582,110.4,19.8,130.2,177.7,52.4,,553,-1.6,2,
2026-07-22 03:16:55,20407,631.8,575.3,112.4,19.8,132.2,177.8,43.6,,553,-6.5,2,
2026-07-22 03:32:21,20407,639.3,582.8,108.4,19.8,128.2,186.7,46.1,,553,7.5,-4,
2026-07-22 03:47:46,20407,640.7,585.8,108.4,19.8,128.2,178.6,55.1,,553,1.4,0,
2026-07-22 04:03:12,20407,640.1,585.2,108.4,19.8,128.2,178.7,54.5,,553,-0.6,0,
2026-07-22 04:18:37,20407,655.2,598.5,108.4,19.8,128.2,178.9,67.4,,553,15.1,0,
2026-07-22 04:34:03,20407,636.6,580.5,108.4,19.8,128.2,178.7,49.7,,553,-18.6,0,
2026-07-22 04:49:30,20407,633.7,577.6,108.4,19.8,128.2,179,46.5,,553,-2.9,0,
2026-07-22 05:04:56,20407,632.6,574.8,108.3,19.8,128.2,178.8,44.9,,553,-1.1,-0.1,
2026-07-22 05:20:21,20407,629.2,571.1,110.4,19.8,130.2,178.6,39.3,,553,-3.4,2.1,
2026-07-22 05:35:47,20407,622.9,557.5,108.4,19.8,128.2,171.3,36,,553,-6.3,-2,
2026-07-22 05:51:12,20407,628.4,560.2,108.4,19.8,128.2,169.6,40.2,,553,5.5,0,
2026-07-22 06:06:38,20407,626,556.7,108.3,19.8,128.2,170.1,36.6,,553,-2.4,-0.1,
2026-07-22 06:22:04,20407,626.6,560.5,112.4,19.8,132.2,169.4,37,,553,0.6,4.1,
2026-07-22 06:37:30,20407,620.9,554.8,108.4,19.8,128.2,169.8,34.9,,553,-5.7,-4,
2026-07-22 06:52:54,20407,629.1,563,108.4,19.8,128.2,170,42.7,,553,8.2,0,
2026-07-22 07:08:20,20407,623.6,557.2,108.4,19.8,128.2,170,36.7,,553,-5.5,0,
2026-07-22 07:23:42,20407,622.2,555.9,108.4,19.8,128.2,169.2,36.5,,553,-1.4,0,
2026-07-22 07:39:07,20407,622,555.7,110.4,19.8,130.2,169.3,33.7,,553,-0.2,2,
2026-07-22 07:54:33,20407,652.9,586.5,112.4,19.8,132.2,170.2,61.8,,553,30.9,2,
```

## incidents.log (tail)

```
[2026-07-22 01:59:56] VIEWS_NATIVE_ADVISORY views=553 native_heap=185.3 pss=633.4 gl=108.4 (node/list retention ??pre-hardceiling early warn)
[2026-07-22 02:15:21] VIEWS_NATIVE_ADVISORY views=553 native_heap=177.6 pss=645.4 gl=108.4 (node/list retention ??pre-hardceiling early warn)
[2026-07-22 02:30:46] VIEWS_NATIVE_ADVISORY views=553 native_heap=177.6 pss=636.4 gl=110.4 (node/list retention ??pre-hardceiling early warn)
[2026-07-22 02:46:11] VIEWS_NATIVE_ADVISORY views=553 native_heap=177.5 pss=639.9 gl=108.4 (node/list retention ??pre-hardceiling early warn)
[2026-07-22 03:01:36] VIEWS_NATIVE_ADVISORY views=553 native_heap=177.7 pss=638.3 gl=110.4 (node/list retention ??pre-hardceiling early warn)
[2026-07-22 03:17:01] VIEWS_NATIVE_ADVISORY views=553 native_heap=177.8 pss=631.8 gl=112.4 (node/list retention ??pre-hardceiling early warn)
[2026-07-22 03:32:26] VIEWS_NATIVE_ADVISORY views=553 native_heap=186.7 pss=639.3 gl=108.4 (node/list retention ??pre-hardceiling early warn)
[2026-07-22 03:47:52] VIEWS_NATIVE_ADVISORY views=553 native_heap=178.6 pss=640.7 gl=108.4 (node/list retention ??pre-hardceiling early warn)
[2026-07-22 04:03:17] VIEWS_NATIVE_ADVISORY views=553 native_heap=178.7 pss=640.1 gl=108.4 (node/list retention ??pre-hardceiling early warn)
[2026-07-22 04:18:44] VIEWS_NATIVE_ADVISORY views=553 native_heap=178.9 pss=655.2 gl=108.4 (node/list retention ??pre-hardceiling early warn)
[2026-07-22 04:34:09] VIEWS_NATIVE_ADVISORY views=553 native_heap=178.7 pss=636.6 gl=108.4 (node/list retention ??pre-hardceiling early warn)
[2026-07-22 04:49:35] VIEWS_NATIVE_ADVISORY views=553 native_heap=179 pss=633.7 gl=108.4 (node/list retention ??pre-hardceiling early warn)
[2026-07-22 05:05:01] VIEWS_NATIVE_ADVISORY views=553 native_heap=178.8 pss=632.6 gl=108.3 (node/list retention ??pre-hardceiling early warn)
[2026-07-22 05:20:27] VIEWS_NATIVE_ADVISORY views=553 native_heap=178.6 pss=629.2 gl=110.4 (node/list retention ??pre-hardceiling early warn)
[2026-07-22 05:35:52] VIEWS_NATIVE_ADVISORY views=553 native_heap=171.3 pss=622.9 gl=108.4 (node/list retention ??pre-hardceiling early warn)
[2026-07-22 05:51:17] VIEWS_NATIVE_ADVISORY views=553 native_heap=169.6 pss=628.4 gl=108.4 (node/list retention ??pre-hardceiling early warn)
[2026-07-22 06:06:43] VIEWS_NATIVE_ADVISORY views=553 native_heap=170.1 pss=626 gl=108.3 (node/list retention ??pre-hardceiling early warn)
[2026-07-22 06:22:10] VIEWS_NATIVE_ADVISORY views=553 native_heap=169.4 pss=626.6 gl=112.4 (node/list retention ??pre-hardceiling early warn)
[2026-07-22 06:37:36] VIEWS_NATIVE_ADVISORY views=553 native_heap=169.8 pss=620.9 gl=108.4 (node/list retention ??pre-hardceiling early warn)
[2026-07-22 06:53:01] VIEWS_NATIVE_ADVISORY views=553 native_heap=170 pss=629.1 gl=108.4 (node/list retention ??pre-hardceiling early warn)
[2026-07-22 07:08:25] VIEWS_NATIVE_ADVISORY views=553 native_heap=170 pss=623.6 gl=108.4 (node/list retention ??pre-hardceiling early warn)
[2026-07-22 07:23:48] VIEWS_NATIVE_ADVISORY views=553 native_heap=169.2 pss=622.2 gl=108.4 (node/list retention ??pre-hardceiling early warn)
[2026-07-22 07:39:13] VIEWS_NATIVE_ADVISORY views=553 native_heap=169.3 pss=622 gl=110.4 (node/list retention ??pre-hardceiling early warn)
[2026-07-22 07:54:39] VIEWS_NATIVE_ADVISORY views=553 native_heap=170.2 pss=652.9 gl=112.4 (node/list retention ??pre-hardceiling early warn)
[2026-07-22 08:00:00] DAILY_8AM_REPORT 2026-07-22 08:00:00 KST
```

## remediation.log (tail)

```
[2026-07-22 01:44:26] INFO VIEWS_NATIVE_ADVISORY views=553 native_heap=176.8 pss=627.6 gl=108.4 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-22 01:59:56] INFO VIEWS_NATIVE_ADVISORY views=553 native_heap=185.3 pss=633.4 gl=108.4 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-22 02:15:21] INFO VIEWS_NATIVE_ADVISORY views=553 native_heap=177.6 pss=645.4 gl=108.4 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-22 02:30:46] INFO VIEWS_NATIVE_ADVISORY views=553 native_heap=177.6 pss=636.4 gl=110.4 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-22 02:46:11] INFO VIEWS_NATIVE_ADVISORY views=553 native_heap=177.5 pss=639.9 gl=108.4 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-22 03:01:36] INFO VIEWS_NATIVE_ADVISORY views=553 native_heap=177.7 pss=638.3 gl=110.4 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-22 03:17:01] INFO VIEWS_NATIVE_ADVISORY views=553 native_heap=177.8 pss=631.8 gl=112.4 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-22 03:32:26] INFO VIEWS_NATIVE_ADVISORY views=553 native_heap=186.7 pss=639.3 gl=108.4 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-22 03:47:52] INFO VIEWS_NATIVE_ADVISORY views=553 native_heap=178.6 pss=640.7 gl=108.4 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-22 04:03:17] INFO VIEWS_NATIVE_ADVISORY views=553 native_heap=178.7 pss=640.1 gl=108.4 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-22 04:18:44] INFO VIEWS_NATIVE_ADVISORY views=553 native_heap=178.9 pss=655.2 gl=108.4 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-22 04:34:09] INFO VIEWS_NATIVE_ADVISORY views=553 native_heap=178.7 pss=636.6 gl=108.4 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-22 04:49:35] INFO VIEWS_NATIVE_ADVISORY views=553 native_heap=179 pss=633.7 gl=108.4 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-22 05:05:01] INFO VIEWS_NATIVE_ADVISORY views=553 native_heap=178.8 pss=632.6 gl=108.3 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-22 05:20:27] INFO VIEWS_NATIVE_ADVISORY views=553 native_heap=178.6 pss=629.2 gl=110.4 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-22 05:35:52] INFO VIEWS_NATIVE_ADVISORY views=553 native_heap=171.3 pss=622.9 gl=108.4 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-22 05:51:17] INFO VIEWS_NATIVE_ADVISORY views=553 native_heap=169.6 pss=628.4 gl=108.4 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-22 06:06:43] INFO VIEWS_NATIVE_ADVISORY views=553 native_heap=170.1 pss=626 gl=108.3 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-22 06:22:10] INFO VIEWS_NATIVE_ADVISORY views=553 native_heap=169.4 pss=626.6 gl=112.4 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-22 06:37:36] INFO VIEWS_NATIVE_ADVISORY views=553 native_heap=169.8 pss=620.9 gl=108.4 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-22 06:53:01] INFO VIEWS_NATIVE_ADVISORY views=553 native_heap=170 pss=629.1 gl=108.4 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-22 07:08:25] INFO VIEWS_NATIVE_ADVISORY views=553 native_heap=170 pss=623.6 gl=108.4 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-22 07:23:48] INFO VIEWS_NATIVE_ADVISORY views=553 native_heap=169.2 pss=622.2 gl=108.4 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-22 07:39:13] INFO VIEWS_NATIVE_ADVISORY views=553 native_heap=169.3 pss=622 gl=110.4 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-22 07:54:39] INFO VIEWS_NATIVE_ADVISORY views=553 native_heap=170.2 pss=652.9 gl=112.4 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
```

## mem-alerts.log (tail)

```
[2026-07-19 16:05:42] CRITICAL process not running ??check crash-*.log
[2026-07-19 16:20:43] CRITICAL process not running ??check crash-*.log
[2026-07-19 17:22:19] CRITICAL process not running ??check crash-*.log
[2026-07-19 20:57:58] PSS +88.6MB GL 40.5MB views=365
[2026-07-19 22:45:59] GL +86.2MB views=549 (PSS 67.2MB) ??active hub
[2026-07-19 23:47:51] PSS +54.6MB GL 42.6MB views=535
[2026-07-20 00:18:42] GL +88.9MB views=567 (PSS 87.3MB) ??active hub
[2026-07-20 12:23:45] GL +10.7MB views=359 (PSS 42.9MB) ??active hub
[2026-07-20 13:40:52] GL +79.9MB views=712 (PSS 75.5MB) ??active hub
[2026-07-20 16:46:08] GL +20.7MB views=312 (PSS 117.4MB) ??active hub
[2026-07-20 17:01:33] GL +9.6MB views=494 (PSS 9MB) ??active hub
[2026-07-20 17:32:21] GL +77.6MB views=571 (PSS 133.3MB) ??active hub
[2026-07-20 19:21:28] GL +123.2MB views=559 (PSS 160.7MB) ??active hub
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
```

## KPI (overnight window)

| Metric | Count |
|--------|-------|
| GL_HARD_CEILING incidents | 38 |
| Crash / PROCESS_DEATH | 95 |
| Auto app relaunch | 38 |

## Action items for Kim Team Lead

1. GL_HARD_CEILING or 3x GL_SPIKE ??P0 hub Skia audit (see overnight-watch handoff).
2. SIGSEGV/FATAL ??arcfire-bug-debug-workflow + logcat tail in latest crash-*.log.
3. Stair-step floor rise without crash ??today's dev P0 list in overnight-watch handoff.

