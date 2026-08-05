# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-08-05T06:57:37.863Z
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
[2026-08-05 15:52:50] AUTO_FIX static audit:skia-memory start
[2026-08-05 15:52:52] AUTO_FIX audit:skia-memory PASS
[2026-08-05 15:52:52] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-08-05 15:53:11] AUTO_FIX baseline reset pid=25612 gl=6MB pss=199.6MB
[2026-08-05 15:53:11] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-08-05 15:53:31] VERIFY PASS pid=25612 gl=10MB pss=714.2MB views=229
[2026-08-05 15:53:31] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":999.1,"views":399,"lastGlMb":43.1,"hardCeiling":true}
[2026-08-05 15:53:32] HANDOFF packed -> outbox/cursor-incident-handoff.md (Kim Team Lead triage)
[2026-08-05 15:57:33] INVESTIGATION start reason=mem_anomaly
[2026-08-05 15:57:33] INVESTIGATION alert=[2026-08-05 15:52:50] GL_HARD_CEILING gl=43.1 pss=999.1 views=399
[2026-08-05 15:57:35] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260805-155733.log
[2026-08-05 15:57:37] INVESTIGATION mem from timeline gl=10MB pss=714.2MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260805-155733.log
```

## Recent incidents

```
[2026-08-05 08:14:17] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260805-0800.md verdict=OK
[2026-08-05 13:02:01] PSS_SOFT_CEILING pss=801.7 gl=42.5 views=375 native_reclaim_advisory
[2026-08-05 14:19:42] PSS_SOFT_CEILING pss=864.6 gl=31.6 views=362 native_reclaim_advisory
[2026-08-05 15:06:19] PSS_SOFT_CEILING pss=949.4 gl=72.4 views=463 native_reclaim_advisory
[2026-08-05 15:52:50] GL_HARD_CEILING gl=43.1 pss=999.1 views=399
[2026-08-05 15:52:50] REFIX_REQUESTED gl_critical_active_hub
```

## Crash signature (tail)

```
08-02 02:01:46.041 18187 18290 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog planets=1 items=91 origin=arc_core_policy', 'trade_port_planet_resync'
08-02 02:01:46.052 18187 18290 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog planets=1 items=93 origin=arc_core_policy', 'trade_port_planet_resync'
08-02 02:01:46.064 18187 18290 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog planets=1 items=46 origin=arc_core_policy', 'trade_port_planet_resync'
08-02 02:01:46.234 18187 18290 I ReactNativeJS: [ArcCore/RTDB] boot sync skip (offline)
08-02 02:01:51.652  1861  4391 I ActivityManager: Changes in 10251 3 to 6, 184 to 0
08-02 02:01:58.249 18187 18290 I ReactNativeJS: [MEM] planet_main_stage_hub mount
08-02 02:01:58.250 18187 18290 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_focus hermes_mb=28 detail=arcadia_prime
08-02 02:01:58.268 18187 18290 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog planets=1 items=42 origin=arc_core_policy', 'trade_port_planet_resync'
08-02 02:01:58.364 18187 18290 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_focus hermes_mb=28
08-02 02:02:02.582 18187 18290 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=manual hermes_mb=28 detail=departure_preflight_arcadia_prime
08-02 02:02:02.586 18187 18290 I ReactNativeJS: [MEM] hubSkiaNativeReclaim epoch=1 reason=galaxy_departure_after_combat
08-02 02:02:02.589 18187 18290 I ReactNativeJS: [MEM] runStageNativeReclaimPass stage=planet_hub reason=galaxy_departure_after_combat immediate=0
08-02 02:02:02.589 18187 18290 I ReactNativeJS: [MEM] teardownPlanetHubCombatForGalaxyDeparture planet=arcadia_prime
08-02 02:02:03.093 18187 18290 I ReactNativeJS: [MEM] hubSkiaNativeReclaim epoch=2 reason=route_blur
08-02 02:02:03.094 18187 18290 I ReactNativeJS: [MEM] runStageNativeReclaimPass stage=planet_hub reason=route_blur immediate=0
08-02 02:02:03.096 18187 18290 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32 detail=arcadia_prime
08-02 02:02:03.097 18187 18290 I ReactNativeJS: [MEM] releasePlanetMainStageSession dedupe route_blur:arcadia_prime
08-02 02:02:03.097 18187 18290 I ReactNativeJS: [MEM] planet_main_stage_hub disposed
08-02 02:02:03.120 18187 18290 I ReactNativeJS: [MEM] galaxy_map mount

```

## mem-timeline (tail)

```csv
﻿iso_time,pid,pss_mb,rss_mb,gl_mb,egl_mb,graphics_mb,native_heap_mb,java_heap_mb,threads,views,delta_pss_mb,delta_gl_mb,note
2026-08-05 13:17:23,17821,731.6,873.5,12.6,19.8,32.4,396.6,46.2,,99,-70.1,-29.9,GL_RECOVERED idle_ok
2026-08-05 13:32:52,17821,658,802.9,12.7,22,34.7,355.1,56.8,,15,-73.6,0.1,
2026-08-05 13:48:30,17821,812.6,958.5,12.5,19.8,32.4,465.7,47.1,,99,154.6,-0.2,PSS_SPIKE review=graphics+native
2026-08-05 14:04:03,17821,943.8,1089.8,11.9,19.8,31.7,589,55.5,,99,131.2,-0.6,PSS_SPIKE review=graphics+native
2026-08-05 14:19:35,17821,864.6,1001,31.6,19.8,51.5,501.4,72.1,,362,-79.2,19.7,HUB_ACTIVATION gl_mount_ok
2026-08-05 14:35:12,17821,859.2,967.2,16.3,19.8,36.1,534.4,51.1,,99,-5.4,-15.3,GL_RECOVERED idle_ok
2026-08-05 14:50:46,17821,847.7,956.4,16.3,19.8,36.1,523.8,48.7,,99,-11.5,0,
2026-08-05 15:06:14,17821,949.4,1058.4,72.4,19.8,92.3,559.6,39.7,,463,101.7,56.1,HUB_ACTIVATION gl_mount_ok
2026-08-05 15:21:48,17821,895.2,997,23.8,19.8,43.6,551.5,47.9,,99,-54.2,-48.6,GL_RECOVERED idle_ok
2026-08-05 15:37:16,17821,896.9,998.4,23.8,19.8,43.6,558.8,42.5,,99,1.7,0,
2026-08-05 15:52:44,17821,999.1,1011.3,43.1,34.3,77.4,525.6,43.6,,399,102.2,19.3,HUB_ACTIVATION gl_mount_ok
2026-08-05 15:53:31,25612,714.2,,10,,,,,,229,,,POST_REMEDIATION_VERIFY_OK
```
