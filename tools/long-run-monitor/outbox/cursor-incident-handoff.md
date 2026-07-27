# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-07-27T02:37:28.147Z
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
[2026-07-27 11:34:54] AUTO_FIX static audit:skia-memory start
[2026-07-27 11:34:56] AUTO_FIX audit:skia-memory PASS
[2026-07-27 11:34:56] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-07-27 11:35:14] AUTO_FIX baseline reset pid=24122 gl=6MB pss=186MB
[2026-07-27 11:35:14] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-07-27 11:35:35] VERIFY PASS pid=24122 gl=10.6MB pss=609.4MB views=120
[2026-07-27 11:35:35] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":957.4,"views":326,"lastGlMb":53.5,"hardCeiling":true}
[2026-07-27 11:35:37] HANDOFF packed -> outbox/cursor-incident-handoff.md (Kim Team Lead triage)
[2026-07-27 11:37:24] INVESTIGATION start reason=mem_anomaly
[2026-07-27 11:37:24] INVESTIGATION alert=[2026-07-27 11:34:53] GL_HARD_CEILING gl=53.5 pss=957.4 views=326
[2026-07-27 11:37:26] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260727-113724.log
[2026-07-27 11:37:27] INVESTIGATION mem from timeline gl=10.6MB pss=609.4MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260727-113724.log
```

## Recent incidents

```
[2026-07-27 09:16:35] DAILY_8AM_REPORT_FAIL D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260727-0800.md MEMINFO_ERROR — Command failed: adb shell pidof com.arcfire.online
[2026-07-27 09:46:45] PSS_SOFT_CEILING pss=828.6 gl=134.1 views=573 native_reclaim_advisory
[2026-07-27 10:02:11] PSS_SOFT_CEILING pss=826.1 gl=134.1 views=573 native_reclaim_advisory
[2026-07-27 10:17:36] PSS_SOFT_CEILING pss=817.4 gl=134.1 views=573 native_reclaim_advisory
[2026-07-27 11:34:53] GL_HARD_CEILING gl=53.5 pss=957.4 views=326
[2026-07-27 11:34:54] REFIX_REQUESTED gl_critical_active_hub
```

## Crash signature (tail)

```
07-27 11:36:28.429 24122 24235 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=manual hermes_mb=36 detail=hub_wave_inter_wave
07-27 11:36:28.429 24122 24235 I ReactNativeJS: [MEM] runPlanetHubPostSkiaPeakReclaimPass reason=hub_wave_inter_wave keep=sirius_border gpuLayers=skia_nebula_backdrop,skia_combat_orbit
07-27 11:36:30.058 24122 24235 I ReactNativeJS: [MEM] deferredNativeReclaim stage=planet_hub listeners=2
07-27 11:37:07.420  1861  1898 I ActivityManager: Changes in 10147 5 to 2, 184 to 255
07-27 11:37:08.118  1861  1898 I ActivityManager: Changes in 11073 2 to 15, 255 to 128
07-27 11:37:08.174  1861  2542 I ActivityManager: Changes in 99002 19 to 10, 0 to 128
07-27 11:37:08.241  1861  2607 I ActivityManager: Changes in 99002 15 to 15, 128 to 0
07-27 11:37:08.241  1861  2607 I ActivityManager: Changes in 11073 15 to 15, 128 to 0
07-27 11:37:08.290 24122 24235 I ReactNativeJS: [MEM] runSoftNativeReclaimPass reason=app_background nebulaBefore=1
07-27 11:37:08.300 24122 24235 I ReactNativeJS: [MEM] runSoftNativeReclaimPass reason=hub_background nebulaBefore=1
07-27 11:37:08.674 24122 24235 I ReactNativeJS: [MEM] runDeepNativeReclaimPass reason=hub_background fresco=true
07-27 11:37:08.803  1861  1898 I ActivityManager: Killing 24122:com.arcfire.online/u0a1073 (adj 900): remove task
07-27 11:37:09.053  1861  1898 W ActivityManager: setHasOverlayUi called on unknown pid: 24122
07-27 11:37:10.865  1861  1906 I ActivityManager: Start proc 24418:com.arcfire.online/u0a1073 for activelaunch {com.arcfire.online/com.arcfire.online.MainActivity}
07-27 11:37:10.865  1861  1906 I ActivityManager: ProcessObserver broadcast disabled
07-27 11:37:11.887  1861  2886 I ActivityManager: Changes in 99002 19 to 3, 0 to 184
07-27 11:37:11.887  1861  2886 I ActivityManager: Changes in 11073 19 to 2, 0 to 255
07-27 11:37:12.088  1861  1898 I ActivityManager: Changes in 10147 2 to 5, 255 to 184
07-27 11:37:22.226  1861  2525 I ActivityManager: Changes in 99002 3 to 10, 184 to 0

```

## mem-timeline (tail)

```csv
﻿iso_time,pid,pss_mb,rss_mb,gl_mb,egl_mb,graphics_mb,native_heap_mb,java_heap_mb,threads,views,delta_pss_mb,delta_gl_mb,note
2026-07-27 00:32:40,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-07-27 09:16:35,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-07-27 09:31:37,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-07-27 09:46:38,17709,828.6,968.6,134.1,19.8,154,405.4,50.6,,573,,,
2026-07-27 10:02:06,17709,826.1,966,134.1,19.8,154,413.1,41.2,,573,,,
2026-07-27 10:17:31,17709,817.4,961.5,134.1,19.8,154,401.7,44.2,,573,-8.7,0,
2026-07-27 10:32:56,21109,717.9,866.3,53.5,40.7,94.2,364.5,37.4,,309,,,
2026-07-27 10:48:22,21109,718,868.1,49.9,40.7,90.6,387.1,33.2,,306,,,
2026-07-27 11:03:46,21109,813.8,942.8,27.8,19.8,47.6,524.2,57.4,,99,95.8,-22.1,PSS_SPIKE review=graphics+native
2026-07-27 11:19:13,21109,699.5,826.7,27.8,19.8,47.6,423.3,41.3,,99,-114.3,0,
2026-07-27 11:34:47,21109,957.4,1082.3,53.5,40.7,94.1,583,47.7,,326,257.9,25.7,HUB_ACTIVATION gl_mount_ok
2026-07-27 11:35:35,24122,609.4,,10.6,,,,,,120,,,POST_REMEDIATION_VERIFY_OK
```
