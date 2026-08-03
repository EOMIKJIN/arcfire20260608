# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-08-03T07:00:25.241Z
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
[2026-08-03 15:56:05] AUTO_FIX static audit:skia-memory start
[2026-08-03 15:56:07] AUTO_FIX audit:skia-memory PASS
[2026-08-03 15:56:07] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-08-03 15:56:25] AUTO_FIX baseline reset pid=15732 gl=6MB pss=200.2MB
[2026-08-03 15:56:25] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-08-03 15:56:45] VERIFY PASS pid=15732 gl=8.5MB pss=645.3MB views=99
[2026-08-03 15:56:45] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":1062.4,"views":581,"lastGlMb":113.1,"hardCeiling":true}
[2026-08-03 15:56:46] HANDOFF packed -> outbox/cursor-incident-handoff.md (Kim Team Lead triage)
[2026-08-03 16:00:21] INVESTIGATION start reason=mem_anomaly
[2026-08-03 16:00:21] INVESTIGATION alert=[2026-08-03 15:56:05] GL_HARD_CEILING gl=113.1 pss=1062.4 views=581
[2026-08-03 16:00:23] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260803-160021.log
[2026-08-03 16:00:24] INVESTIGATION mem from timeline gl=8.5MB pss=645.3MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260803-160021.log
```

## Recent incidents

```
[2026-08-03 14:53:53] PSS_SOFT_CEILING pss=838.1 gl=117.9 views=596 native_reclaim_advisory
[2026-08-03 15:09:26] PSS_SOFT_CEILING pss=858.4 gl=127 views=739 native_reclaim_advisory
[2026-08-03 15:25:00] PSS_SOFT_CEILING pss=863.3 gl=146.4 views=578 native_reclaim_advisory
[2026-08-03 15:40:33] PSS_SOFT_CEILING pss=840.1 gl=115.4 views=743 native_reclaim_advisory
[2026-08-03 15:56:05] GL_HARD_CEILING gl=113.1 pss=1062.4 views=581
[2026-08-03 15:56:05] REFIX_REQUESTED gl_critical_active_hub
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
2026-08-03 13:21:00,29281,872.3,877.3,132,19.8,151.9,402.9,39.4,,578,-11,-4.1,
2026-08-03 13:36:28,29281,879,884,136.1,19.8,155.9,403.1,41.9,,578,6.7,4.1,
2026-08-03 13:51:54,29281,874,880.2,132.1,19.8,151.9,403.1,42.5,,578,-5,-4,
2026-08-03 14:07:23,29281,853.8,859.9,134.1,19.8,153.9,402.9,21.7,,599,-20.2,2,
2026-08-03 14:22:51,29281,846.4,840.1,132,19.8,151.9,393.3,45,,578,-7.4,-2.1,
2026-08-03 14:38:16,29281,841.8,637.4,132.1,19.8,151.9,211.3,44.3,,578,-4.6,0.1,
2026-08-03 14:53:46,29281,838.1,653,117.9,19.8,137.7,234,41.1,,596,-3.7,-14.2,GL_RECOVERED idle_ok
2026-08-03 15:09:20,29281,858.4,656.4,127,19.8,146.8,219.9,48.9,,739,20.3,9.1,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-08-03 15:24:53,29281,863.3,663.3,146.4,19.8,166.2,218.1,36.3,,578,4.9,19.4,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-08-03 15:40:25,29281,840.1,642.7,115.4,19.8,135.2,224.6,38.6,,743,-23.2,-31,GL_RECOVERED idle_ok
2026-08-03 15:55:59,29281,1062.4,939.1,113.1,19.8,132.9,509.1,45.2,,581,222.3,-2.3,PSS_SPIKE review=graphics+native
2026-08-03 15:56:45,15732,645.3,,8.5,,,,,,99,,,POST_REMEDIATION_VERIFY_OK
```
