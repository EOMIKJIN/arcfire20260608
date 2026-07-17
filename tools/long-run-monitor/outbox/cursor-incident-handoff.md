# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-07-17T02:32:14.837Z
triggerReason: mem_anomaly
refixPayload: (none)

## Mandatory agent action (P0)

1. `arcfire-bug-debug-workflow.mdc` — logcat/crash·remediation VERIFY FAIL 근거로 원인 특정.
2. Skia·허브·STAGE 관련이면 `arcfire-skia-memory-lifecycle.mdc` + `npm run audit:skia-memory`.
3. 코드 수정 후 `npx tsc --noEmit -p tsconfig.client.json`.
4. 런타임 재확인: `manual-mem-snapshot.ps1` 또는 mem-timeline VERIFY PASS 추이.
5. 완료 시 `node tools/long-run-monitor/ack-incident-handoff.cjs` 실행.

## Recent remediation

```
[2026-07-13 11:05:28] INFO PSS_SOFT_CEILING pss=814.4 gl=43.4 views=380 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-13 11:20:50] INFO PSS_SOFT_CEILING pss=806.8 gl=43.4 views=396 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-13 11:36:12] INFO PSS_SOFT_CEILING pss=929.7 gl=145.9 views=560 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-13 11:51:37] INFO PSS_SOFT_CEILING pss=943.9 gl=145.9 views=560 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-13 12:07:01] INFO PSS_SOFT_CEILING pss=943.7 gl=145.9 views=560 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-13 12:22:23] INFO PSS_SOFT_CEILING pss=934.1 gl=145.9 views=560 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-13 12:37:44] INFO PSS_SOFT_CEILING pss=935.7 gl=147.9 views=560 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-17 11:31:25] INFO VIEWS_NATIVE_ADVISORY views=556 native_heap=98.3 pss=433.2 gl=135.2 -> no restart (native_heap/views �?조기 경보; 리스??가?�화 ?��? 추적)
[2026-07-17 11:32:12] INVESTIGATION start reason=mem_anomaly
[2026-07-17 11:32:12] INVESTIGATION alert=[2026-07-10 21:01:05] GL_HARD_CEILING gl=120.9 pss=1075.4 views=561
[2026-07-17 11:32:12] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260717-113212.log
[2026-07-17 11:32:14] INVESTIGATION mem from timeline gl=135.2MB pss=433.2MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260717-113212.log
```

## Recent incidents

```
[2026-07-13 12:07:01] PSS_SOFT_CEILING pss=943.7 gl=145.9 views=560 native_reclaim_advisory
[2026-07-13 12:22:23] PSS_SOFT_CEILING pss=934.1 gl=145.9 views=560 native_reclaim_advisory
[2026-07-13 12:37:44] PSS_SOFT_CEILING pss=935.7 gl=147.9 views=560 native_reclaim_advisory
[2026-07-17 11:31:15] DAILY_8AM_REPORT 2026-07-17 11:31:15 KST
[2026-07-17 11:31:15] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260717-0800.md verdict=OK
[2026-07-17 11:31:25] VIEWS_NATIVE_ADVISORY views=556 native_heap=98.3 pss=433.2 gl=135.2 (node/list retention ??pre-hardceiling early warn)
```

## Crash signature (tail)

```
--------- beginning of system
07-17 11:32:14.097  1875  1924 I ActivityManager: Changes in 10108 10 to 10, 0 to 128
07-17 11:32:14.100  1875  4091 I ActivityManager: Changes in 10108 10 to 10, 128 to 0

```

## mem-timeline (tail)

```csv
﻿iso_time,pid,pss_mb,rss_mb,gl_mb,egl_mb,graphics_mb,native_heap_mb,java_heap_mb,threads,views,delta_pss_mb,delta_gl_mb,note
2026-07-13 11:51:33,3031,943.9,739.7,145.9,19.8,165.8,278.1,49.3,,560,14.2,0,
2026-07-13 12:06:56,3031,943.7,738.8,145.9,19.8,165.8,277.3,49.5,,560,-0.2,0,
2026-07-13 12:22:17,3031,934.1,729.2,145.9,19.8,165.8,276.3,40.8,,560,-9.6,0,
2026-07-13 12:37:40,3031,935.7,730.8,147.9,19.8,167.8,276.3,39.9,,560,1.6,2,
2026-07-13 12:53:01,10420,651.7,779.5,36,19.8,55.8,307.9,53.4,,364,,,
2026-07-13 13:08:25,10420,668.7,798.1,36,19.8,55.8,329.6,45.2,,371,,,
2026-07-13 13:23:48,10420,667.2,796.5,36,19.8,55.8,323.9,43.7,,371,-1.5,0,
2026-07-13 13:39:12,10420,691.8,821.1,37,30.2,67.2,326.9,45.4,,379,24.6,1,
2026-07-13 13:54:36,10420,691.3,820.7,36.8,19.8,56.7,333.7,44.9,,371,-0.5,-0.2,
2026-07-13 14:09:57,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-07-13 14:25:00,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-07-17 11:31:15,6307,433.2,492.9,135.2,19.8,155,98.3,48.5,,556,,,
```
