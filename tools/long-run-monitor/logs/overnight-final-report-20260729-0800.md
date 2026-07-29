# Arcfire daily 08:00 KST auto report (mandatory perpetual)

Generated (KST): 2026-07-29 08:00:02
Package: com.arcfire.online

## Runtime

| pid | PSS (MB) | GL (MB) | Views |
|-----|----------|---------|-------|
| 9150 | 679 | 110.1 | 578 |

## mem-timeline (since DAILY_8AM_REPORT)

```csv
2026-07-29 00:21:57,9150,742.1,864,109,19.8,128.8,367.9,43.9,,579,3.3,0,
2026-07-29 00:37:21,9150,761,883.9,109,19.8,128.8,383.4,45.9,,579,18.9,0,
2026-07-29 00:52:47,9150,758,881,114.2,19.8,134,371.3,45.2,,579,-3,5.2,
2026-07-29 01:08:13,9150,754.6,877.7,110.2,19.8,130,370.6,46.6,,579,-3.4,-4,
2026-07-29 01:23:36,9150,753.6,876.7,110.3,19.8,130.1,371,45.1,,579,-1,0.1,
2026-07-29 01:39:01,9150,751.2,874.3,110.3,19.8,130.1,370.4,43.1,,579,-2.4,0,
2026-07-29 01:54:26,9150,752.7,875.9,112.3,19.8,132.1,371.2,41.7,,579,1.5,2,
2026-07-29 02:09:50,9150,751.7,874.8,110.3,19.8,130.1,370.7,43.2,,579,-1,-2,
2026-07-29 02:25:15,9150,747.5,870.7,110.3,19.8,130.1,370.5,39.1,,579,-4.2,0,
2026-07-29 02:40:38,9150,733.3,836.6,110.3,19.8,130.1,368.7,42.8,,579,-14.2,0,
2026-07-29 02:56:03,9150,712.2,745.6,112.3,19.8,132.1,300.3,38.4,,579,-21.1,2,
2026-07-29 03:11:29,9150,686.5,662.6,110.3,19.8,130.1,247.1,36,,579,-25.7,-2,
2026-07-29 03:26:55,9150,694,669.6,110.3,19.8,130.1,246,44,,579,7.5,0,
2026-07-29 03:42:19,9150,694.4,670.2,112.3,19.8,132.1,245.8,42.9,,579,0.4,2,
2026-07-29 03:57:45,9150,679.2,622.9,109,19.8,128.8,223.5,35.5,,580,-15.2,-3.3,
2026-07-29 04:13:11,9150,683.7,627.4,109,19.8,128.8,223.9,39.4,,580,4.5,0,
2026-07-29 04:28:38,9150,680.2,622.6,109,19.8,128.8,222.8,35.8,,580,-3.5,0,
2026-07-29 04:44:03,9150,683,613.4,110.1,19.8,130,209.5,38.9,,580,2.8,1.1,
2026-07-29 04:59:28,9150,692,624.4,110.1,19.8,130,211,51.2,,580,9,0,
2026-07-29 05:14:53,9150,695.5,605.6,110.1,19.8,130,194.4,55,,580,3.5,0,
2026-07-29 05:30:14,9150,690.1,600.3,112.1,19.8,132,195.7,50.6,,580,-5.4,2,
2026-07-29 05:45:38,9150,684.2,595.4,109,19.8,128.8,194.6,45,,579,-5.9,-3.1,
2026-07-29 06:01:04,9150,676.8,588.2,109,19.8,128.8,195.1,37.1,,579,-7.4,0,
2026-07-29 06:16:27,9150,681.4,592.6,109,19.8,128.8,194.2,42.4,,579,4.6,0,
2026-07-29 06:31:51,9150,675.7,587,109,19.8,128.8,194.6,36.1,,579,-5.7,0,
2026-07-29 06:47:16,9150,676.1,587.4,110.1,19.8,130,195.1,35.4,,578,0.4,1.1,
2026-07-29 07:02:41,9150,680.1,591.5,110.1,19.8,130,194.7,39.7,,578,4,0,
2026-07-29 07:18:09,9150,678.3,589.8,110.1,19.8,130,194.9,37.9,,578,-1.8,0,
2026-07-29 07:33:33,9150,681.9,593.4,110.1,19.8,130,195.3,41,,578,3.6,0,
2026-07-29 07:48:58,9150,682.6,591.9,112.1,19.8,132,192.7,40.4,,578,0.7,2,
```

## incidents.log (tail)

```
[2026-07-29 01:54:31] VIEWS_NATIVE_ADVISORY views=579 native_heap=371.2 pss=752.7 gl=112.3 (node/list retention ??pre-hardceiling early warn)
[2026-07-29 02:09:56] VIEWS_NATIVE_ADVISORY views=579 native_heap=370.7 pss=751.7 gl=110.3 (node/list retention ??pre-hardceiling early warn)
[2026-07-29 02:25:21] VIEWS_NATIVE_ADVISORY views=579 native_heap=370.5 pss=747.5 gl=110.3 (node/list retention ??pre-hardceiling early warn)
[2026-07-29 02:40:44] VIEWS_NATIVE_ADVISORY views=579 native_heap=368.7 pss=733.3 gl=110.3 (node/list retention ??pre-hardceiling early warn)
[2026-07-29 02:56:09] VIEWS_NATIVE_ADVISORY views=579 native_heap=300.3 pss=712.2 gl=112.3 (node/list retention ??pre-hardceiling early warn)
[2026-07-29 03:11:34] VIEWS_NATIVE_ADVISORY views=579 native_heap=247.1 pss=686.5 gl=110.3 (node/list retention ??pre-hardceiling early warn)
[2026-07-29 03:27:00] VIEWS_NATIVE_ADVISORY views=579 native_heap=246 pss=694 gl=110.3 (node/list retention ??pre-hardceiling early warn)
[2026-07-29 03:42:25] VIEWS_NATIVE_ADVISORY views=579 native_heap=245.8 pss=694.4 gl=112.3 (node/list retention ??pre-hardceiling early warn)
[2026-07-29 03:57:50] VIEWS_NATIVE_ADVISORY views=580 native_heap=223.5 pss=679.2 gl=109 (node/list retention ??pre-hardceiling early warn)
[2026-07-29 04:13:18] VIEWS_NATIVE_ADVISORY views=580 native_heap=223.9 pss=683.7 gl=109 (node/list retention ??pre-hardceiling early warn)
[2026-07-29 04:28:44] VIEWS_NATIVE_ADVISORY views=580 native_heap=222.8 pss=680.2 gl=109 (node/list retention ??pre-hardceiling early warn)
[2026-07-29 04:44:08] VIEWS_NATIVE_ADVISORY views=580 native_heap=209.5 pss=683 gl=110.1 (node/list retention ??pre-hardceiling early warn)
[2026-07-29 04:59:34] VIEWS_NATIVE_ADVISORY views=580 native_heap=211 pss=692 gl=110.1 (node/list retention ??pre-hardceiling early warn)
[2026-07-29 05:14:59] VIEWS_NATIVE_ADVISORY views=580 native_heap=194.4 pss=695.5 gl=110.1 (node/list retention ??pre-hardceiling early warn)
[2026-07-29 05:30:19] VIEWS_NATIVE_ADVISORY views=580 native_heap=195.7 pss=690.1 gl=112.1 (node/list retention ??pre-hardceiling early warn)
[2026-07-29 05:45:45] VIEWS_NATIVE_ADVISORY views=579 native_heap=194.6 pss=684.2 gl=109 (node/list retention ??pre-hardceiling early warn)
[2026-07-29 06:01:09] VIEWS_NATIVE_ADVISORY views=579 native_heap=195.1 pss=676.8 gl=109 (node/list retention ??pre-hardceiling early warn)
[2026-07-29 06:16:32] VIEWS_NATIVE_ADVISORY views=579 native_heap=194.2 pss=681.4 gl=109 (node/list retention ??pre-hardceiling early warn)
[2026-07-29 06:31:57] VIEWS_NATIVE_ADVISORY views=579 native_heap=194.6 pss=675.7 gl=109 (node/list retention ??pre-hardceiling early warn)
[2026-07-29 06:47:21] VIEWS_NATIVE_ADVISORY views=578 native_heap=195.1 pss=676.1 gl=110.1 (node/list retention ??pre-hardceiling early warn)
[2026-07-29 07:02:50] VIEWS_NATIVE_ADVISORY views=578 native_heap=194.7 pss=680.1 gl=110.1 (node/list retention ??pre-hardceiling early warn)
[2026-07-29 07:18:15] VIEWS_NATIVE_ADVISORY views=578 native_heap=194.9 pss=678.3 gl=110.1 (node/list retention ??pre-hardceiling early warn)
[2026-07-29 07:33:39] VIEWS_NATIVE_ADVISORY views=578 native_heap=195.3 pss=681.9 gl=110.1 (node/list retention ??pre-hardceiling early warn)
[2026-07-29 07:49:05] VIEWS_NATIVE_ADVISORY views=578 native_heap=192.7 pss=682.6 gl=112.1 (node/list retention ??pre-hardceiling early warn)
[2026-07-29 08:00:00] DAILY_8AM_REPORT 2026-07-29 08:00:00 KST
```

## remediation.log (tail)

```
[2026-07-29 01:39:06] INFO VIEWS_NATIVE_ADVISORY views=579 native_heap=370.4 pss=751.2 gl=110.3 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-29 01:54:31] INFO VIEWS_NATIVE_ADVISORY views=579 native_heap=371.2 pss=752.7 gl=112.3 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-29 02:09:56] INFO VIEWS_NATIVE_ADVISORY views=579 native_heap=370.7 pss=751.7 gl=110.3 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-29 02:25:21] INFO VIEWS_NATIVE_ADVISORY views=579 native_heap=370.5 pss=747.5 gl=110.3 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-29 02:40:44] INFO VIEWS_NATIVE_ADVISORY views=579 native_heap=368.7 pss=733.3 gl=110.3 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-29 02:56:09] INFO VIEWS_NATIVE_ADVISORY views=579 native_heap=300.3 pss=712.2 gl=112.3 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-29 03:11:34] INFO VIEWS_NATIVE_ADVISORY views=579 native_heap=247.1 pss=686.5 gl=110.3 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-29 03:27:00] INFO VIEWS_NATIVE_ADVISORY views=579 native_heap=246 pss=694 gl=110.3 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-29 03:42:25] INFO VIEWS_NATIVE_ADVISORY views=579 native_heap=245.8 pss=694.4 gl=112.3 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-29 03:57:50] INFO VIEWS_NATIVE_ADVISORY views=580 native_heap=223.5 pss=679.2 gl=109 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-29 04:13:18] INFO VIEWS_NATIVE_ADVISORY views=580 native_heap=223.9 pss=683.7 gl=109 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-29 04:28:44] INFO VIEWS_NATIVE_ADVISORY views=580 native_heap=222.8 pss=680.2 gl=109 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-29 04:44:08] INFO VIEWS_NATIVE_ADVISORY views=580 native_heap=209.5 pss=683 gl=110.1 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-29 04:59:34] INFO VIEWS_NATIVE_ADVISORY views=580 native_heap=211 pss=692 gl=110.1 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-29 05:14:59] INFO VIEWS_NATIVE_ADVISORY views=580 native_heap=194.4 pss=695.5 gl=110.1 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-29 05:30:19] INFO VIEWS_NATIVE_ADVISORY views=580 native_heap=195.7 pss=690.1 gl=112.1 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-29 05:45:45] INFO VIEWS_NATIVE_ADVISORY views=579 native_heap=194.6 pss=684.2 gl=109 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-29 06:01:09] INFO VIEWS_NATIVE_ADVISORY views=579 native_heap=195.1 pss=676.8 gl=109 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-29 06:16:32] INFO VIEWS_NATIVE_ADVISORY views=579 native_heap=194.2 pss=681.4 gl=109 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-29 06:31:57] INFO VIEWS_NATIVE_ADVISORY views=579 native_heap=194.6 pss=675.7 gl=109 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-29 06:47:21] INFO VIEWS_NATIVE_ADVISORY views=578 native_heap=195.1 pss=676.1 gl=110.1 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-29 07:02:50] INFO VIEWS_NATIVE_ADVISORY views=578 native_heap=194.7 pss=680.1 gl=110.1 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-29 07:18:15] INFO VIEWS_NATIVE_ADVISORY views=578 native_heap=194.9 pss=678.3 gl=110.1 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-29 07:33:39] INFO VIEWS_NATIVE_ADVISORY views=578 native_heap=195.3 pss=681.9 gl=110.1 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-07-29 07:49:05] INFO VIEWS_NATIVE_ADVISORY views=578 native_heap=192.7 pss=682.6 gl=112.1 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
```

## mem-alerts.log (tail)

```
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
[2026-07-28 13:02:04] PSS +140.6MB GL 125.4MB views=572
[2026-07-28 14:50:00] PSS +168.3MB GL 122.1MB views=572
[2026-07-28 15:21:37] GL +87.4MB views=572 (PSS 117.9MB) ??active hub
[2026-07-28 18:42:10] CRITICAL process not running ??check crash-*.log
[2026-07-28 20:45:03] PSS +63.6MB GL 100.4MB views=644
[2026-07-28 21:00:35] GL +25.6MB views=572 (PSS 226.9MB) ??active hub
```

## KPI (overnight window)

| Metric | Count |
|--------|-------|
| GL_HARD_CEILING incidents | 44 |
| Crash / PROCESS_DEATH | 95 |
| Auto app relaunch | 44 |

## Action items for Kim Team Lead

1. GL_HARD_CEILING or 3x GL_SPIKE ??P0 hub Skia audit (see overnight-watch handoff).
2. SIGSEGV/FATAL ??arcfire-bug-debug-workflow + logcat tail in latest crash-*.log.
3. Stair-step floor rise without crash ??today's dev P0 list in overnight-watch handoff.

