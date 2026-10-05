# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-10-05T09:50:37.254Z
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
[2026-10-05 18:47:37] AUTO_FIX static audit:skia-memory start
[2026-10-05 18:47:39] AUTO_FIX audit:skia-memory PASS
[2026-10-05 18:47:39] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-10-05 18:47:58] AUTO_FIX baseline reset pid=27053 gl=3.7MB pss=207.2MB
[2026-10-05 18:47:58] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-10-05 18:48:19] VERIFY PASS pid=27314 gl=6MB pss=248.4MB views=14
[2026-10-05 18:48:19] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":965.8,"views":401,"lastGlMb":67.8,"hardCeiling":true}
[2026-10-05 18:48:20] HANDOFF packed -> outbox/cursor-incident-handoff.md (Kim Team Lead triage)
[2026-10-05 18:50:34] INVESTIGATION start reason=mem_anomaly
[2026-10-05 18:50:34] INVESTIGATION alert=[2026-10-05 18:47:37] GL_HARD_CEILING gl=67.8 pss=965.8 views=401
[2026-10-05 18:50:35] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20261005-185034.log
[2026-10-05 18:50:36] INVESTIGATION mem from timeline gl=6MB pss=248.4MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20261005-185034.log
```

## Recent incidents

```
[2026-10-05 17:26:08] VIEWS_NATIVE_ADVISORY views=385 native_heap=443.2 pss=792.6 gl=39 (node/list retention ? pre-hardceiling early warn)
[2026-10-05 17:42:31] VIEWS_NATIVE_ADVISORY views=389 native_heap=442.4 pss=789.8 gl=37 (node/list retention ? pre-hardceiling early warn)
[2026-10-05 17:58:48] VIEWS_NATIVE_ADVISORY views=389 native_heap=445 pss=767.9 gl=37 (node/list retention ? pre-hardceiling early warn)
[2026-10-05 18:15:11] VIEWS_NATIVE_ADVISORY views=940 native_heap=458.6 pss=788.7 gl=19.8 (node/list retention ? pre-hardceiling early warn)
[2026-10-05 18:47:37] GL_HARD_CEILING gl=67.8 pss=965.8 views=401
[2026-10-05 18:47:37] REFIX_REQUESTED gl_critical_active_hub
```

## Crash signature (tail)

```
10-05 18:49:05.972  1668  1710 I ActivityManager: Changes in 10296 19 to 11, 0 to 384
10-05 18:49:05.983  1668  2501 I ActivityManager: Changes in 10296 11 to 19, 384 to 0
10-05 18:49:07.144  1668  1710 I ActivityManager: Changes in 10296 19 to 11, 0 to 384
10-05 18:49:07.150  1668  3854 I ActivityManager: Changes in 10296 11 to 19, 384 to 0
10-05 18:50:29.979 27314 27473 I ReactNativeJS: [MEM] hubSkiaNativeReclaim epoch=1 reason=hub_inbound_drone_end
10-05 18:50:29.984 27314 27473 I ReactNativeJS: [MEM] backdropRemount peak skip reason=hub_inbound_drone_end
10-05 18:50:29.984 27314 27473 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=manual hermes_mb=64 detail=hub_inbound_drone_end
10-05 18:50:29.985 27314 27473 I ReactNativeJS: [MEM] runPlanetHubPostSkiaPeakReclaimPass reason=hub_inbound_drone_end keep=arcadia_prime gpuLayers=skia_inbound_drone_trail,skia_nebula_backdrop
10-05 18:50:30.741 27314 27473 I ReactNativeJS: [MEM] hubSkiaNativeReclaim epoch=2 reason=hub_inbound_vfx_cleared
10-05 18:50:30.743 27314 27473 I ReactNativeJS: [MEM] backdropRemount peak skip reason=hub_inbound_vfx_cleared
10-05 18:50:30.743 27314 27473 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=manual hermes_mb=64 detail=hub_inbound_vfx_cleared
10-05 18:50:30.743 27314 27473 I ReactNativeJS: [MEM] runPlanetHubPostSkiaPeakReclaimPass reason=hub_inbound_vfx_cleared keep=arcadia_prime gpuLayers=-
10-05 18:50:32.498 27314 27473 I ReactNativeJS: [MEM] deferredNativeReclaim stage=planet_hub listeners=2
10-05 18:50:33.157 27314 27473 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=manual hermes_mb=64 detail=hub_dodge_overlay_unmount_debounce
10-05 18:50:33.858 27314 27473 I ReactNativeJS: [MEM] hubSkiaNativeReclaim epoch=3 reason=hub_inbound_vfx_cleared:inbound_settle
10-05 18:50:33.860 27314 27473 I ReactNativeJS: [MEM] runSoftNativeReclaimPass reason=hub_inbound_vfx_cleared:inbound_settle nebulaBefore=1
10-05 18:50:33.860 27314 27473 I ReactNativeJS: [MEM] runPlanetHubSoftNativeReclaimPass reason=hub_inbound_vfx_cleared:inbound_settle keep=arcadia_prime gpuLayers=- bypassCoalesce=1
10-05 18:50:33.861 27314 27473 I ReactNativeJS: [MEM] hubInboundSettleReclaim reason=hub_inbound_vfx_cleared after_ms=3096 softRan=1
10-05 18:50:35.409 27314 27473 I ReactNativeJS: [MEM] deferredNativeReclaim stage=planet_hub listeners=2

```

## mem-timeline (tail)

```csv
﻿iso_time,pid,pss_mb,rss_mb,gl_mb,egl_mb,graphics_mb,native_heap_mb,java_heap_mb,threads,views,delta_pss_mb,delta_gl_mb,note
2026-10-05 16:05:25,32281,830.9,933.6,41.7,40.7,82.3,441.4,71.5,,407,40.8,-0.2,PSS_SPIKE review=graphics+native
2026-10-05 16:21:16,32281,804,906.8,37,19.8,56.8,456.5,47.6,,389,-26.9,-4.7,
2026-10-05 16:37:34,32281,798.5,901.4,37,19.8,56.8,447.7,42.2,,389,-5.5,0,
2026-10-05 16:53:52,32281,814.4,916.3,37,19.8,56.8,451,51,,386,15.9,0,
2026-10-05 17:10:06,32281,794.6,891.1,37,19.8,56.8,446,41.1,,386,-19.8,0,
2026-10-05 17:25:55,32281,792.6,889.2,39,19.8,58.8,443.2,41.6,,385,-2,2,
2026-10-05 17:42:19,32281,789.8,882.1,37,19.8,56.8,442.4,41.2,,389,-2.8,-2,
2026-10-05 17:58:39,32281,767.9,860.3,37,19.8,56.8,445,24.8,,389,-21.9,0,
2026-10-05 18:15:01,32281,788.7,878.4,19.8,19.8,39.6,458.6,46.5,,940,20.8,-17.2,GL_RECOVERED idle_ok
2026-10-05 18:31:13,32281,847,936.1,20.7,19.8,40.5,494.9,45.7,,103,58.3,0.9,PSS_SPIKE review=graphics+native
2026-10-05 18:47:29,32281,965.8,1046.9,67.8,19.8,87.6,542.3,54.3,,401,118.8,47.1,HUB_ACTIVATION gl_mount_ok
2026-10-05 18:48:19,27314,248.4,,6,,,,,,14,,,POST_REMEDIATION_VERIFY_OK
```
