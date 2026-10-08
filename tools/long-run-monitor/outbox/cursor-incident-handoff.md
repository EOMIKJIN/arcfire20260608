# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-10-08T15:03:32.477Z
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
[2026-10-08 23:59:09] AUTO_FIX static audit:skia-memory start
[2026-10-08 23:59:12] AUTO_FIX audit:skia-memory PASS
[2026-10-08 23:59:12] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-10-08 23:59:28] AUTO_FIX baseline reset pid=31460 gl=2.7MB pss=323MB
[2026-10-08 23:59:28] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-10-08 23:59:49] VERIFY PASS pid=31460 gl=17.9MB pss=577MB views=99
[2026-10-08 23:59:49] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":1054.4,"views":387,"lastGlMb":344.7,"hardCeiling":true}
[2026-10-08 23:59:51] HANDOFF packed -> outbox/cursor-incident-handoff.md (Kim Team Lead triage)
[2026-10-09 00:03:29] INVESTIGATION start reason=mem_anomaly
[2026-10-09 00:03:29] INVESTIGATION alert=[2026-10-08 23:59:09] GL_HARD_CEILING gl=344.7 pss=1054.4 views=387
[2026-10-09 00:03:30] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20261009-000329.log
[2026-10-09 00:03:32] INVESTIGATION mem from timeline gl=17.9MB pss=577MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20261009-000329.log
```

## Recent incidents

```
[2026-10-08 22:56:16] INVESTIGATION_TRIGGERED mem_anomaly
[2026-10-08 23:38:03] GL_HARD_CEILING gl=294.6 pss=1009.5 views=377
[2026-10-08 23:38:03] REFIX_REQUESTED gl_critical_active_hub
[2026-10-08 23:43:07] INVESTIGATION_TRIGGERED mem_anomaly
[2026-10-08 23:59:09] GL_HARD_CEILING gl=344.7 pss=1054.4 views=387
[2026-10-08 23:59:09] REFIX_REQUESTED gl_critical_active_hub
```

## Crash signature (tail)

```
10-09 00:03:25.081 31460 31555 I ReactNativeJS: [MEM] native heap purge ok=true
10-09 00:03:26.024 31460 31555 I ReactNativeJS: [MEM] native heap purge ok=true
10-09 00:03:26.608 31460 31555 I ReactNativeJS: [MEM] deferredNativeReclaim stage=planet_hub listeners=2
10-09 00:03:27.226 31460 31555 I ReactNativeJS: '[arc-hitch] tick', 'ai_npc_subcore', 53
10-09 00:03:27.498 31460 31555 I ReactNativeJS: '[arc-hitch] tick', 'ai_npc_subcore', 58
10-09 00:03:27.560 31460 31555 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=manual hermes_mb=60 detail=hub_dodge_overlay_unmount_debounce
10-09 00:03:27.693 31460 31555 I ReactNativeJS: '[arc-hitch] settle', 'convoy_plan', 34
10-09 00:03:27.767 31460 31555 I ReactNativeJS: '[arc-hitch] tick', 'ai_npc_subcore', 42
10-09 00:03:28.175 31460 31555 I ReactNativeJS: [MEM] hubSkiaNativeReclaim epoch=3 reason=hub_inbound_vfx_cleared:inbound_settle
10-09 00:03:28.180 31460 31555 I ReactNativeJS: [MEM] runSoftNativeReclaimPass reason=hub_inbound_vfx_cleared:inbound_settle nebulaBefore=1
10-09 00:03:28.181 31460 31555 I ReactNativeJS: [MEM] runPlanetHubSoftNativeReclaimPass reason=hub_inbound_vfx_cleared:inbound_settle keep=arcadia_prime gpuLayers=- bypassCoalesce=1
10-09 00:03:28.183 31460 31555 I ReactNativeJS: [MEM] hubInboundSettleReclaim reason=hub_inbound_vfx_cleared after_ms=3096 softRan=1
10-09 00:03:28.539 31460 31555 I ReactNativeJS: '[arc-hitch] tick', 'ai_npc_subcore', 50
10-09 00:03:29.333 31460 31555 I ReactNativeJS: '[arc-hitch] tick', 'ai_npc_subcore', 43
10-09 00:03:29.741 31460 31555 I ReactNativeJS: [MEM] deferredNativeReclaim stage=planet_hub listeners=2
10-09 00:03:30.122 31460 31555 I ReactNativeJS: '[arc-hitch] tick', 'ai_npc_subcore', 49
10-09 00:03:30.389 31460 31555 I ReactNativeJS: '[arc-hitch] tick', 'ai_npc_subcore', 50
10-09 00:03:30.661 31460 31555 I ReactNativeJS: '[arc-hitch] tick', 'arc_core_spy_subcore', 33
10-09 00:03:31.391 31460 31555 I ReactNativeJS: '[arc-hitch] tick', 'ai_npc_subcore', 51

```

## mem-timeline (tail)

```csv
﻿iso_time,pid,pss_mb,rss_mb,gl_mb,egl_mb,graphics_mb,native_heap_mb,java_heap_mb,threads,views,delta_pss_mb,delta_gl_mb,note
2026-10-08 21:46:50,18710,919.5,1063.7,106.3,28,134.3,474.5,35,,388,167.7,58.7,GL_SPIKE suspect=hub_idle_skia_inbound_or_nebula
2026-10-08 22:02:53,18710,947.5,1090.2,90.5,28,118.4,477.5,47.3,,388,28,-15.8,GL_RECOVERED idle_ok
2026-10-08 22:18:55,18710,932.6,1075.6,62.5,43.3,105.8,463.1,42.1,,402,-14.9,-28,GL_RECOVERED idle_ok
2026-10-08 22:34:53,18710,901.4,1044.4,52.5,28,80.4,454.1,37.6,,387,-31.2,-10,GL_RECOVERED idle_ok
2026-10-08 22:51:02,18710,954.6,1097.7,55.3,43.3,98.6,475.1,45.7,,394,53.2,2.8,PSS_SPIKE review=graphics+native
2026-10-08 22:51:50,23639,520.2,,17.9,,,,,,99,,,POST_REMEDIATION_VERIFY_OK
2026-10-08 23:06:40,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-10-08 23:21:40,25922,520.7,652.6,17.8,19.8,37.6,280.4,42.5,,99,,,
2026-10-08 23:37:52,27318,1009.5,1142.5,294.6,43.3,337.9,417.3,37.5,,377,,,
2026-10-08 23:43:01,28266,497.8,,5.4,,,,,,110,,,POST_REMEDIATION_VERIFY_OK
2026-10-08 23:59:01,29253,1054.4,1192.5,344.7,28,372.7,435.1,40,,387,,,
2026-10-08 23:59:49,31460,577,,17.9,,,,,,99,,,POST_REMEDIATION_VERIFY_OK
```
