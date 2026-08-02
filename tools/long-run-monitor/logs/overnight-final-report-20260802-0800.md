# Arcfire daily 08:00 KST auto report (mandatory perpetual)

Generated (KST): 2026-08-02 08:00:01
Package: com.arcfire.online

## Runtime

| pid | PSS (MB) | GL (MB) | Views |
|-----|----------|---------|-------|
| 18517 | 663.4 | 107.8 | 578 |

## mem-timeline (since DAILY_8AM_REPORT)

```csv
2026-08-02 00:17:07,7476,807.2,938.3,107.1,19.8,126.9,395.5,52.4,,577,21.2,1.8,
2026-08-02 00:32:33,7476,808,939,107.1,19.8,126.9,402.4,46.6,,580,0.8,0,
2026-08-02 00:48:00,7476,807.4,939.4,107.1,19.8,126.9,393.6,47.2,,580,-0.6,0,
2026-08-02 01:03:27,7476,806.6,938.6,107.1,19.8,126.9,395.5,43.5,,580,-0.8,0,
2026-08-02 01:18:53,7476,858.3,989.4,121.5,19.8,141.4,439,46.2,,575,51.7,14.4,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-08-02 01:34:26,7476,808.4,773.1,118.7,19.8,138.5,325.8,45.8,,591,-49.9,-2.8,
2026-08-02 01:49:52,15186,793.6,922.6,122.4,19.8,142.2,365.7,53.2,,574,,,
2026-08-02 02:05:34,18517,725.4,865.7,122.5,19.8,142.3,337.2,40.1,,574,,,
2026-08-02 02:21:00,18517,723.1,866.1,124.2,19.8,144.1,344,36.4,,574,,,
2026-08-02 02:36:25,18517,713.1,848.7,107.8,19.8,127.7,343.3,42.8,,577,-10,-16.4,GL_RECOVERED idle_ok
2026-08-02 02:51:52,18517,691.2,628.2,109.9,19.8,129.7,185.3,40.2,,577,-21.9,2.1,
2026-08-02 03:07:17,18517,688.8,624.4,107.8,19.8,127.7,186.4,39,,577,-2.4,-2.1,
2026-08-02 03:22:43,18517,700.7,633.8,111.9,19.8,131.7,185.8,49.7,,577,11.9,4.1,
2026-08-02 03:38:10,18517,696.4,629.9,107.9,19.8,127.7,186.4,48.8,,577,-4.3,-4,
2026-08-02 03:53:36,18517,686.4,619.9,107.9,19.8,127.7,187.1,38.1,,577,-10,0,
2026-08-02 04:09:06,18517,662,588.1,109.9,19.8,129.7,186.3,39.7,,583,-24.4,2,
2026-08-02 04:24:36,18517,657.1,583.1,107.9,19.8,127.7,187.8,35.1,,583,-4.9,-2,
2026-08-02 04:40:05,18517,662.1,588.3,107.9,19.8,127.7,187.8,39.5,,580,5,0,
2026-08-02 04:55:30,18517,659.9,586,109.9,19.8,129.7,188.5,34.7,,580,-2.2,2,
2026-08-02 05:10:56,18517,664.9,591.1,107.9,19.8,127.7,188.9,41.6,,577,5,-2,
2026-08-02 05:26:22,18517,663.6,589.9,107.9,19.8,127.7,189.2,39.6,,577,-1.3,0,
2026-08-02 05:41:48,18517,659.7,585.9,107.9,19.8,127.7,189.4,35.4,,577,-3.9,0,
2026-08-02 05:57:14,18517,670.2,596.5,109.9,19.8,129.7,189.4,43.7,,577,10.5,2,
2026-08-02 06:12:40,18517,669.7,595.8,107.8,19.8,127.7,190.6,44.2,,578,-0.5,-2.1,
2026-08-02 06:28:06,18517,660.2,586.4,107.8,19.8,127.7,190,34.9,,578,-9.5,0,
2026-08-02 06:43:32,18517,662.5,588.7,109.9,19.8,129.7,189.9,34.9,,578,2.3,2.1,
2026-08-02 06:58:57,18517,672.6,598.8,107.8,19.8,127.7,190.1,46.6,,578,10.1,-2.1,
2026-08-02 07:14:24,18517,670.4,594.9,107.8,19.8,127.7,189.6,43.3,,578,-2.2,0,
2026-08-02 07:29:51,18517,663,587.6,109.9,19.8,129.7,189.2,34.3,,578,-7.4,2.1,
2026-08-02 07:45:16,18517,668,592.4,109.9,19.8,129.7,190.5,38.1,,578,5,0,
```

## incidents.log (tail)

```
[2026-08-02 01:50:02] VIEWS_NATIVE_ADVISORY views=574 native_heap=365.7 pss=793.6 gl=122.4 (node/list retention ??pre-hardceiling early warn)
[2026-08-02 02:05:39] VIEWS_NATIVE_ADVISORY views=574 native_heap=337.2 pss=725.4 gl=122.5 (node/list retention ??pre-hardceiling early warn)
[2026-08-02 02:21:05] VIEWS_NATIVE_ADVISORY views=574 native_heap=344 pss=723.1 gl=124.2 (node/list retention ??pre-hardceiling early warn)
[2026-08-02 02:36:31] VIEWS_NATIVE_ADVISORY views=577 native_heap=343.3 pss=713.1 gl=107.8 (node/list retention ??pre-hardceiling early warn)
[2026-08-02 02:51:57] VIEWS_NATIVE_ADVISORY views=577 native_heap=185.3 pss=691.2 gl=109.9 (node/list retention ??pre-hardceiling early warn)
[2026-08-02 03:07:23] VIEWS_NATIVE_ADVISORY views=577 native_heap=186.4 pss=688.8 gl=107.8 (node/list retention ??pre-hardceiling early warn)
[2026-08-02 03:22:49] VIEWS_NATIVE_ADVISORY views=577 native_heap=185.8 pss=700.7 gl=111.9 (node/list retention ??pre-hardceiling early warn)
[2026-08-02 03:38:16] VIEWS_NATIVE_ADVISORY views=577 native_heap=186.4 pss=696.4 gl=107.9 (node/list retention ??pre-hardceiling early warn)
[2026-08-02 03:53:44] VIEWS_NATIVE_ADVISORY views=577 native_heap=187.1 pss=686.4 gl=107.9 (node/list retention ??pre-hardceiling early warn)
[2026-08-02 04:09:15] VIEWS_NATIVE_ADVISORY views=583 native_heap=186.3 pss=662 gl=109.9 (node/list retention ??pre-hardceiling early warn)
[2026-08-02 04:24:43] VIEWS_NATIVE_ADVISORY views=583 native_heap=187.8 pss=657.1 gl=107.9 (node/list retention ??pre-hardceiling early warn)
[2026-08-02 04:40:10] VIEWS_NATIVE_ADVISORY views=580 native_heap=187.8 pss=662.1 gl=107.9 (node/list retention ??pre-hardceiling early warn)
[2026-08-02 04:55:35] VIEWS_NATIVE_ADVISORY views=580 native_heap=188.5 pss=659.9 gl=109.9 (node/list retention ??pre-hardceiling early warn)
[2026-08-02 05:11:01] VIEWS_NATIVE_ADVISORY views=577 native_heap=188.9 pss=664.9 gl=107.9 (node/list retention ??pre-hardceiling early warn)
[2026-08-02 05:26:28] VIEWS_NATIVE_ADVISORY views=577 native_heap=189.2 pss=663.6 gl=107.9 (node/list retention ??pre-hardceiling early warn)
[2026-08-02 05:41:53] VIEWS_NATIVE_ADVISORY views=577 native_heap=189.4 pss=659.7 gl=107.9 (node/list retention ??pre-hardceiling early warn)
[2026-08-02 05:57:19] VIEWS_NATIVE_ADVISORY views=577 native_heap=189.4 pss=670.2 gl=109.9 (node/list retention ??pre-hardceiling early warn)
[2026-08-02 06:12:46] VIEWS_NATIVE_ADVISORY views=578 native_heap=190.6 pss=669.7 gl=107.8 (node/list retention ??pre-hardceiling early warn)
[2026-08-02 06:28:12] VIEWS_NATIVE_ADVISORY views=578 native_heap=190 pss=660.2 gl=107.8 (node/list retention ??pre-hardceiling early warn)
[2026-08-02 06:43:37] VIEWS_NATIVE_ADVISORY views=578 native_heap=189.9 pss=662.5 gl=109.9 (node/list retention ??pre-hardceiling early warn)
[2026-08-02 06:59:03] VIEWS_NATIVE_ADVISORY views=578 native_heap=190.1 pss=672.6 gl=107.8 (node/list retention ??pre-hardceiling early warn)
[2026-08-02 07:14:30] VIEWS_NATIVE_ADVISORY views=578 native_heap=189.6 pss=670.4 gl=107.8 (node/list retention ??pre-hardceiling early warn)
[2026-08-02 07:29:56] VIEWS_NATIVE_ADVISORY views=578 native_heap=189.2 pss=663 gl=109.9 (node/list retention ??pre-hardceiling early warn)
[2026-08-02 07:45:22] VIEWS_NATIVE_ADVISORY views=578 native_heap=190.5 pss=668 gl=109.9 (node/list retention ??pre-hardceiling early warn)
[2026-08-02 08:00:00] DAILY_8AM_REPORT 2026-08-02 08:00:00 KST
```

## remediation.log (tail)

```
[2026-08-02 01:34:31] INFO PSS_SOFT_CEILING pss=808.4 gl=118.7 views=591 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-08-02 01:50:02] INFO VIEWS_NATIVE_ADVISORY views=574 native_heap=365.7 pss=793.6 gl=122.4 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-02 02:05:39] INFO VIEWS_NATIVE_ADVISORY views=574 native_heap=337.2 pss=725.4 gl=122.5 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-02 02:21:05] INFO VIEWS_NATIVE_ADVISORY views=574 native_heap=344 pss=723.1 gl=124.2 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-02 02:36:31] INFO VIEWS_NATIVE_ADVISORY views=577 native_heap=343.3 pss=713.1 gl=107.8 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-02 02:51:57] INFO VIEWS_NATIVE_ADVISORY views=577 native_heap=185.3 pss=691.2 gl=109.9 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-02 03:07:23] INFO VIEWS_NATIVE_ADVISORY views=577 native_heap=186.4 pss=688.8 gl=107.8 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-02 03:22:49] INFO VIEWS_NATIVE_ADVISORY views=577 native_heap=185.8 pss=700.7 gl=111.9 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-02 03:38:16] INFO VIEWS_NATIVE_ADVISORY views=577 native_heap=186.4 pss=696.4 gl=107.9 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-02 03:53:44] INFO VIEWS_NATIVE_ADVISORY views=577 native_heap=187.1 pss=686.4 gl=107.9 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-02 04:09:15] INFO VIEWS_NATIVE_ADVISORY views=583 native_heap=186.3 pss=662 gl=109.9 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-02 04:24:43] INFO VIEWS_NATIVE_ADVISORY views=583 native_heap=187.8 pss=657.1 gl=107.9 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-02 04:40:10] INFO VIEWS_NATIVE_ADVISORY views=580 native_heap=187.8 pss=662.1 gl=107.9 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-02 04:55:35] INFO VIEWS_NATIVE_ADVISORY views=580 native_heap=188.5 pss=659.9 gl=109.9 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-02 05:11:01] INFO VIEWS_NATIVE_ADVISORY views=577 native_heap=188.9 pss=664.9 gl=107.9 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-02 05:26:28] INFO VIEWS_NATIVE_ADVISORY views=577 native_heap=189.2 pss=663.6 gl=107.9 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-02 05:41:53] INFO VIEWS_NATIVE_ADVISORY views=577 native_heap=189.4 pss=659.7 gl=107.9 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-02 05:57:19] INFO VIEWS_NATIVE_ADVISORY views=577 native_heap=189.4 pss=670.2 gl=109.9 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-02 06:12:46] INFO VIEWS_NATIVE_ADVISORY views=578 native_heap=190.6 pss=669.7 gl=107.8 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-02 06:28:12] INFO VIEWS_NATIVE_ADVISORY views=578 native_heap=190 pss=660.2 gl=107.8 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-02 06:43:37] INFO VIEWS_NATIVE_ADVISORY views=578 native_heap=189.9 pss=662.5 gl=109.9 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-02 06:59:03] INFO VIEWS_NATIVE_ADVISORY views=578 native_heap=190.1 pss=672.6 gl=107.8 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-02 07:14:30] INFO VIEWS_NATIVE_ADVISORY views=578 native_heap=189.6 pss=670.4 gl=107.8 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-02 07:29:56] INFO VIEWS_NATIVE_ADVISORY views=578 native_heap=189.2 pss=663 gl=109.9 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
[2026-08-02 07:45:22] INFO VIEWS_NATIVE_ADVISORY views=578 native_heap=190.5 pss=668 gl=109.9 -> no restart (native_heap/views 異?議곌린 寃쎈낫; 由ъ뒪??媛?곹솕 ?뚭? 異붿쟻)
```

## mem-alerts.log (tail)

```
[2026-07-30 09:00:21] PSS +222.9MB GL 131.1MB views=578
[2026-07-30 14:09:53] GL +10.1MB views=575 (PSS 19.7MB) ??active hub
[2026-07-30 15:27:02] PSS +99.3MB GL 39.8MB views=318
[2026-07-30 15:57:54] PSS +41.2MB GL 46.3MB views=375
[2026-07-30 20:35:52] GL +97.1MB views=577 (PSS 129.5MB) ??active hub
[2026-07-31 08:41:34] PSS +239.2MB GL 20.7MB views=99
[2026-07-31 13:35:00] PSS +74.8MB GL 47.5MB views=367
[2026-08-01 06:49:50] GL +8.5MB views=386 (PSS 25.5MB) ??active hub
[2026-08-01 08:53:14] CRITICAL process not running ??check crash-*.log
[2026-08-01 09:08:14] CRITICAL process not running ??check crash-*.log
[2026-08-01 09:23:15] CRITICAL process not running ??check crash-*.log
[2026-08-01 09:38:16] CRITICAL process not running ??check crash-*.log
[2026-08-01 09:53:17] CRITICAL process not running ??check crash-*.log
[2026-08-01 10:08:17] CRITICAL process not running ??check crash-*.log
[2026-08-01 10:23:18] CRITICAL process not running ??check crash-*.log
[2026-08-01 10:38:18] CRITICAL process not running ??check crash-*.log
[2026-08-01 10:53:24] CRITICAL process not running ??check crash-*.log
[2026-08-01 11:39:22] GL +87.4MB views=585 (PSS 135.8MB) ??active hub
[2026-08-01 12:25:50] GL +96.5MB views=580 (PSS 136.7MB) ??active hub
[2026-08-01 14:13:51] GL +16.2MB views=580 (PSS 19.5MB) ??active hub
[2026-08-01 16:17:19] GL +31.3MB views=586 (PSS 35.8MB) ??active hub
[2026-08-01 18:21:05] GL +17.5MB views=581 (PSS 31.1MB) ??active hub
[2026-08-01 21:26:22] GL +21.4MB views=369 (PSS 83.7MB) ??active hub
[2026-08-01 21:41:47] GL +93.7MB views=575 (PSS 113.4MB) ??active hub
[2026-08-02 01:18:53] GL +14.4MB views=575 (PSS 51.7MB) ??active hub
```

## KPI (overnight window)

| Metric | Count |
|--------|-------|
| GL_HARD_CEILING incidents | 45 |
| Crash / PROCESS_DEATH | 95 |
| Auto app relaunch | 46 |

## Action items for Kim Team Lead

1. GL_HARD_CEILING or 3x GL_SPIKE ??P0 hub Skia audit (see overnight-watch handoff).
2. SIGSEGV/FATAL ??arcfire-bug-debug-workflow + logcat tail in latest crash-*.log.
3. Stair-step floor rise without crash ??today's dev P0 list in overnight-watch handoff.

