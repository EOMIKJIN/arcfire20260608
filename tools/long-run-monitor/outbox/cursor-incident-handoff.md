# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-07-30T00:01:16.087Z
triggerReason: gl_critical_active_hub
refixPayload: (none)

## Mandatory agent action (P0)

1. `arcfire-bug-debug-workflow.mdc` — logcat/crash·remediation VERIFY FAIL 근거로 원인 특정.
2. Skia·허브·STAGE 관련이면 `arcfire-skia-memory-lifecycle.mdc` + `npm run audit:skia-memory`.
3. 코드 수정 후 `npx tsc --noEmit -p tsconfig.client.json`.
4. 런타임 재확인: `manual-mem-snapshot.ps1` 또는 mem-timeline VERIFY PASS 추이.
5. 완료 시 `node tools/long-run-monitor/ack-incident-handoff.cjs` 실행.

## Recent remediation

```
[2026-07-30 08:14:10] INFO VIEWS_NATIVE_ADVISORY views=576 native_heap=276.4 pss=780.4 gl=125.3 -> no restart (native_heap/views �?조기 경보; 리스??가?�화 ?��? 추적)
[2026-07-30 08:29:36] INFO VIEWS_NATIVE_ADVISORY views=577 native_heap=276.5 pss=776.7 gl=123.4 -> no restart (native_heap/views �?조기 경보; 리스??가?�화 ?��? 추적)
[2026-07-30 08:45:01] INFO VIEWS_NATIVE_ADVISORY views=577 native_heap=273.5 pss=779 gl=125.5 -> no restart (native_heap/views �?조기 경보; 리스??가?�화 ?��? 추적)
[2026-07-30 09:00:27] INCIDENT GL_HARD_CEILING gl=131.1 pss=1001.9 views=578 -> immediate remediation (OOM imminent)
[2026-07-30 09:00:27] REFIX_REQUESTED gl_critical_active_hub -> gl-leak-refix-requested.flag
[2026-07-30 09:00:27] AUTO_FIX static audit:skia-memory start
[2026-07-30 09:00:30] AUTO_FIX audit:skia-memory PASS
[2026-07-30 09:00:30] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-07-30 09:00:55] AUTO_FIX baseline reset pid=29392 gl=6MB pss=210.6MB
[2026-07-30 09:00:55] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-07-30 09:01:15] VERIFY PASS pid=29392 gl=8.5MB pss=710.7MB views=99
[2026-07-30 09:01:15] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":1001.9,"views":578,"lastGlMb":131.1,"hardCeiling":true}
```

## Recent incidents

```
[2026-07-30 08:14:10] VIEWS_NATIVE_ADVISORY views=576 native_heap=276.4 pss=780.4 gl=125.3 (node/list retention ??pre-hardceiling early warn)
[2026-07-30 08:14:13] DAILY_8AM_REPORT 2026-07-30 08:14:13 KST
[2026-07-30 08:14:13] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260730-0800.md verdict=OK
[2026-07-30 08:29:36] VIEWS_NATIVE_ADVISORY views=577 native_heap=276.5 pss=776.7 gl=123.4 (node/list retention ??pre-hardceiling early warn)
[2026-07-30 08:45:01] VIEWS_NATIVE_ADVISORY views=577 native_heap=273.5 pss=779 gl=125.5 (node/list retention ??pre-hardceiling early warn)
[2026-07-30 09:00:27] REFIX_REQUESTED gl_critical_active_hub
```

## Crash signature (tail)

```
07-30 09:01:02.521 29392 29494 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog planets=1 items=68 origin=arc_core_policy', 'trade_port_planet_resync'
07-30 09:01:02.530 29392 29494 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog planets=1 items=66 origin=arc_core_policy', 'trade_port_planet_resync'
07-30 09:01:02.541 29392 29494 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog planets=1 items=91 origin=arc_core_policy', 'trade_port_planet_resync'
07-30 09:01:02.549 29392 29494 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog planets=1 items=89 origin=arc_core_policy', 'trade_port_planet_resync'
07-30 09:01:02.558 29392 29494 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog planets=1 items=91 origin=arc_core_policy', 'trade_port_planet_resync'
07-30 09:01:02.567 29392 29494 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog planets=1 items=89 origin=arc_core_policy', 'trade_port_planet_resync'
07-30 09:01:02.578 29392 29494 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog planets=1 items=49 origin=arc_core_policy', 'trade_port_planet_resync'
07-30 09:01:02.587 29392 29494 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog planets=1 items=89 origin=arc_core_policy', 'trade_port_planet_resync'
07-30 09:01:02.597 29392 29494 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog planets=1 items=68 origin=arc_core_policy', 'trade_port_planet_resync'
07-30 09:01:02.605 29392 29494 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog planets=1 items=91 origin=arc_core_policy', 'trade_port_planet_resync'
07-30 09:01:02.615 29392 29494 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog planets=1 items=89 origin=arc_core_policy', 'trade_port_planet_resync'
07-30 09:01:02.625 29392 29494 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog planets=1 items=91 origin=arc_core_policy', 'trade_port_planet_resync'
07-30 09:01:02.634 29392 29494 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog planets=1 items=91 origin=arc_core_policy', 'trade_port_planet_resync'
07-30 09:01:02.642 29392 29494 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog planets=1 items=91 origin=arc_core_policy', 'trade_port_planet_resync'
07-30 09:01:02.653 29392 29494 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog planets=1 items=91 origin=arc_core_policy', 'trade_port_planet_resync'
07-30 09:01:02.662 29392 29494 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog planets=1 items=93 origin=arc_core_policy', 'trade_port_planet_resync'
07-30 09:01:02.671 29392 29494 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog planets=1 items=46 origin=arc_core_policy', 'trade_port_planet_resync'
07-30 09:01:03.066 29392 29494 I ReactNativeJS: [title-diag] catchUp=1379ms probe=1ms dailyBatchJoin=0ms
07-30 09:01:03.526 29392 29494 I ReactNativeJS: [ArcCore/RTDB] boot sync skip (offline)

```

## mem-timeline (tail)

```csv
﻿iso_time,pid,pss_mb,rss_mb,gl_mb,egl_mb,graphics_mb,native_heap_mb,java_heap_mb,threads,views,delta_pss_mb,delta_gl_mb,note
2026-07-30 06:26:12,8590,801.7,738.8,125.3,19.8,145.2,289,44.9,,576,1.1,0,
2026-07-30 06:41:37,8590,786.4,723.6,125.3,19.8,145.2,289.6,40.6,,576,-15.3,0,
2026-07-30 06:57:02,8590,785.3,722.7,125.3,19.8,145.2,289.2,40.4,,576,-1.1,0,
2026-07-30 07:12:27,8590,791.6,729.1,125.3,19.8,145.2,293.7,50.4,,576,6.3,0,
2026-07-30 07:27:51,8590,809.3,732.5,125.3,19.8,145.2,276.1,69.9,,576,17.7,0,
2026-07-30 07:43:16,8590,799.8,722.7,125.3,19.8,145.2,276.3,60.1,,576,-9.5,0,
2026-07-30 07:58:40,8590,782.6,706,125.3,19.8,145.2,275.4,45.8,,576,-17.2,0,
2026-07-30 08:14:05,8590,780.4,702.9,125.3,19.8,145.2,276.4,41.6,,576,-2.2,0,
2026-07-30 08:29:30,8590,776.7,698.8,123.4,19.8,143.2,276.5,39,,577,-3.7,-1.9,
2026-07-30 08:44:56,8590,779,697.4,125.5,19.8,145.3,273.5,38.6,,577,2.3,2.1,
2026-07-30 09:00:21,8590,1001.9,549.5,131.1,19.8,150.9,165.8,41.3,,578,222.9,5.6,PSS_SPIKE review=graphics+native
2026-07-30 09:01:15,29392,710.7,,8.5,,,,,,99,,,POST_REMEDIATION_VERIFY_OK
```
