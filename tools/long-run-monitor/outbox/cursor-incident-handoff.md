# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-09-23T10:23:21.759Z
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
[2026-09-23 19:19:35] AUTO_FIX static audit:skia-memory start
[2026-09-23 19:19:36] AUTO_FIX audit:skia-memory PASS
[2026-09-23 19:19:36] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-09-23 19:19:56] AUTO_FIX baseline reset pid=22575 gl=6MB pss=192.3MB
[2026-09-23 19:19:56] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-09-23 19:20:19] VERIFY PASS pid=22575 gl=8.5MB pss=517.4MB views=101
[2026-09-23 19:20:24] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":979.3,"views":454,"lastGlMb":52.4,"hardCeiling":true}
[2026-09-23 19:20:29] HANDOFF packed -> outbox/cursor-incident-handoff.md (Kim Team Lead triage)
[2026-09-23 19:23:18] INVESTIGATION start reason=mem_anomaly
[2026-09-23 19:23:18] INVESTIGATION alert=[2026-09-23 19:19:34] GL_HARD_CEILING gl=52.4 pss=979.3 views=454
[2026-09-23 19:23:19] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260923-192318.log
[2026-09-23 19:23:21] INVESTIGATION mem from timeline gl=8.5MB pss=517.4MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260923-192318.log
```

## Recent incidents

```
[2026-09-23 08:00:00] DAILY_8AM_REPORT 2026-09-23 08:00:00 KST
[2026-09-23 08:00:00] DAILY_8AM_REPORT_FAIL D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260923-0800.md ADB_NO_DEVICE — 기기 미연결
[2026-09-23 08:00:00] DAILY_8AM_REPORT_FAIL D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260923-0800.md ADB_NO_DEVICE — 기기 미연결
[2026-09-23 15:37:24] PSS_SOFT_CEILING pss=841.1 gl=133.2 views=300 native_reclaim_advisory
[2026-09-23 19:19:34] GL_HARD_CEILING gl=52.4 pss=979.3 views=454
[2026-09-23 19:19:34] REFIX_REQUESTED gl_critical_active_hub
```

## Crash signature (tail)

```
09-22 16:55:21.930 10436 15003 I ReactNativeJS: [MEM] hubInboundSettleReclaim reason=hub_inbound_vfx_cleared after_ms=3096 softRan=1
09-22 16:55:23.487 10436 15003 I ReactNativeJS: [MEM] deferredNativeReclaim stage=planet_hub listeners=2
09-22 16:56:49.408 10436 15003 I ReactNativeJS: [MEM] hubSkiaNativeReclaim epoch=418 reason=hub_inbound_drone_end
09-22 16:56:49.410 10436 15003 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=manual hermes_mb=68 detail=hub_inbound_drone_end
09-22 16:56:49.410 10436 15003 I ReactNativeJS: [MEM] runPlanetHubPostSkiaPeakReclaimPass reason=hub_inbound_drone_end keep=synth_054_p gpuLayers=skia_inbound_drone_trail,skia_nebula_backdrop
09-22 16:56:50.908 10436 15003 I ReactNativeJS: [MEM] hubSkiaNativeReclaim epoch=419 reason=hub_inbound_vfx_cleared
09-22 16:56:50.912 10436 15003 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=manual hermes_mb=68 detail=hub_inbound_vfx_cleared
09-22 16:56:50.912 10436 15003 I ReactNativeJS: [MEM] runPlanetHubPostSkiaPeakReclaimPass reason=hub_inbound_vfx_cleared keep=synth_054_p gpuLayers=-
09-22 16:56:52.461 10436 15003 I ReactNativeJS: [MEM] deferredNativeReclaim stage=planet_hub listeners=2
09-22 16:56:52.495 10436 15003 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=manual hermes_mb=68 detail=hub_dodge_overlay_unmount_debounce
09-22 16:56:54.033 10436 15003 I ReactNativeJS: [MEM] hubSkiaNativeReclaim epoch=420 reason=hub_inbound_vfx_cleared:inbound_settle
09-22 16:56:54.034 10436 15003 I ReactNativeJS: [MEM] runSoftNativeReclaimPass reason=hub_inbound_vfx_cleared:inbound_settle nebulaBefore=1
09-22 16:56:54.035 10436 15003 I ReactNativeJS: [MEM] runPlanetHubSoftNativeReclaimPass reason=hub_inbound_vfx_cleared:inbound_settle keep=synth_054_p gpuLayers=- bypassCoalesce=1
09-22 16:56:54.036 10436 15003 I ReactNativeJS: [MEM] hubInboundSettleReclaim reason=hub_inbound_vfx_cleared after_ms=3096 softRan=1
09-22 16:56:55.581 10436 15003 I ReactNativeJS: [MEM] deferredNativeReclaim stage=planet_hub listeners=2
09-22 16:57:16.876  1668  1710 I ActivityManager: Changes in 99072 6 to 6, 256 to 384
09-22 16:57:16.877  1668  1710 I ActivityManager: Changes in 10275 6 to 6, 256 to 384
09-22 16:57:16.878  1668  3830 I ActivityManager: Changes in 99072 6 to 6, 384 to 256
09-22 16:57:16.878  1668  3830 I ActivityManager: Changes in 10275 6 to 6, 384 to 256

```

## mem-timeline (tail)

```csv
﻿iso_time,pid,pss_mb,rss_mb,gl_mb,egl_mb,graphics_mb,native_heap_mb,java_heap_mb,threads,views,delta_pss_mb,delta_gl_mb,note
2026-09-23 16:09:03,3817,878.9,944.1,147.4,19.8,167.2,424.4,44.7,,273,28.3,14.2,GL_DELTA background_or_transition
2026-09-23 16:24:57,3817,873.1,937.5,151.4,19.8,171.2,422.8,35.1,,276,-5.8,4,
2026-09-23 16:41:11,3817,849.3,896.9,122.8,19.8,142.7,412,39.5,,276,-23.8,-28.6,GL_RECOVERED idle_ok
2026-09-23 17:13:00,3817,853.7,849.2,132.6,19.8,152.4,362.4,35.8,,270,4.4,9.8,GL_DELTA background_or_transition
2026-09-23 17:28:40,3817,861.1,856.6,132.6,19.8,152.4,364,41.1,,270,7.4,0,
2026-09-23 17:44:20,3817,880,875.5,132.6,19.8,152.4,363.3,59.4,,270,18.9,0,
2026-09-23 18:00:06,3817,855.4,851,132.6,19.8,152.4,363.1,35.5,,273,-24.6,0,
2026-09-23 18:16:01,3817,831.7,814.8,132.6,19.8,152.4,354.7,36.2,,273,-23.7,0,
2026-09-23 18:47:53,3817,861.7,844.7,156.9,19.8,176.8,355.4,40.8,,273,30,24.3,GL_DELTA background_or_transition
2026-09-23 19:03:51,3817,856.8,770.8,156.9,19.8,176.7,298.3,34.3,,273,-4.9,0,
2026-09-23 19:19:27,3817,979.3,976.5,52.4,19.8,72.2,515.3,44.1,,454,122.5,-104.5,PSS_SPIKE review=graphics+native
2026-09-23 19:20:19,22575,517.4,,8.5,,,,,,101,,,POST_REMEDIATION_VERIFY_OK
```
