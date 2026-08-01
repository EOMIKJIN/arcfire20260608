# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-08-01T13:00:52.953Z
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
[2026-08-01 21:57:20] AUTO_FIX static audit:skia-memory start
[2026-08-01 21:57:23] AUTO_FIX audit:skia-memory PASS
[2026-08-01 21:57:23] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-08-01 21:57:42] AUTO_FIX baseline reset pid=7103 gl=6MB pss=199.1MB
[2026-08-01 21:57:42] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-08-01 21:58:03] VERIFY PASS pid=7103 gl=8.5MB pss=556.8MB views=99
[2026-08-01 21:58:03] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":954.7,"views":575,"lastGlMb":133.8,"hardCeiling":true}
[2026-08-01 21:58:04] HANDOFF packed -> outbox/cursor-incident-handoff.md (Kim Team Lead triage)
[2026-08-01 22:00:50] INVESTIGATION start reason=mem_anomaly
[2026-08-01 22:00:50] INVESTIGATION alert=[2026-08-01 21:57:20] GL_HARD_CEILING gl=133.8 pss=954.7 views=575
[2026-08-01 22:00:51] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260801-220050.log
[2026-08-01 22:00:52] INVESTIGATION mem from timeline gl=8.5MB pss=556.8MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260801-220050.log
```

## Recent incidents

```
[2026-08-01 20:40:04] VIEWS_NATIVE_ADVISORY views=581 native_heap=327.9 pss=784.7 gl=140.2 (node/list retention ??pre-hardceiling early warn)
[2026-08-01 20:55:32] VIEWS_NATIVE_ADVISORY views=581 native_heap=327.9 pss=784.7 gl=140.2 (node/list retention ??pre-hardceiling early warn)
[2026-08-01 21:26:27] PSS_SOFT_CEILING pss=823.1 gl=36.3 views=369 native_reclaim_advisory
[2026-08-01 21:41:54] PSS_SOFT_CEILING pss=936.5 gl=130 views=575 native_reclaim_advisory
[2026-08-01 21:57:20] GL_HARD_CEILING gl=133.8 pss=954.7 views=575
[2026-08-01 21:57:20] REFIX_REQUESTED gl_critical_active_hub
```

## Crash signature (tail)

```
08-01 21:59:18.678  7476  7569 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=deep_reclaim hermes_mb=28 detail=ingress_after_hub_combat
08-01 21:59:18.678  7476  7569 I ReactNativeJS: [MEM] runGalaxyMapResidentDeepReclaimPass reason=ingress_after_hub_combat hubSkia=true
08-01 21:59:18.678  7476  7569 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=ingress_reclaim hermes_mb=28 detail=after_hub_combat
08-01 21:59:18.679  7476  7569 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_focus hermes_mb=28
08-01 21:59:18.735  7476  7569 I ReactNativeJS: [MEM] consumeGalaxyMapIngressReclaim kind=after_hub_combat fresco=true
08-01 21:59:20.779  7476  7569 I ReactNativeJS: [MEM] deferredNativeReclaim stage=planet_hub listeners=2
08-01 21:59:20.779  7476  7569 I ReactNativeJS: [MEM] deferredNativeReclaim stage=galaxy_map listeners=2
08-01 21:59:22.687  7476  7569 I ReactNativeJS: [MEM] hubSkiaNativeReclaim epoch=4 reason=galaxy_map_post_ingress_settle
08-01 21:59:22.687  7476  7569 I ReactNativeJS: [MEM] runStageNativeReclaimPass stage=galaxy_map reason=galaxy_map_post_ingress_settle immediate=0
08-01 21:59:22.688  7476  7569 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=deep_reclaim hermes_mb=36 detail=galaxy_map_post_ingress_settle
08-01 21:59:22.688  7476  7569 I ReactNativeJS: [MEM] runGalaxyMapResidentDeepReclaimPass reason=galaxy_map_post_ingress_settle hubSkia=true
08-01 21:59:24.218  7476  7569 I ReactNativeJS: [MEM] deferredNativeReclaim stage=galaxy_map listeners=2
08-01 21:59:58.673  1861 18059 I ActivityManager: Changes in 10107 19 to 5, 0 to 144
08-01 22:00:03.686  7476  7569 I ReactNativeJS: [MEM] hubSkiaNativeReclaim epoch=5 reason=galaxy_map_post_ingress_followup
08-01 22:00:03.687  7476  7569 I ReactNativeJS: [MEM] runStageNativeReclaimPass stage=galaxy_map reason=galaxy_map_post_ingress_followup immediate=0
08-01 22:00:03.687  7476  7569 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=deep_reclaim hermes_mb=36 detail=galaxy_map_post_ingress_followup
08-01 22:00:03.687  7476  7569 I ReactNativeJS: [MEM] runGalaxyMapResidentDeepReclaimPass reason=galaxy_map_post_ingress_followup hubSkia=true
08-01 22:00:04.741  1861  1904 I ActivityManager: Changes in 10107 5 to 15, 144 to 0
08-01 22:00:05.211  7476  7569 I ReactNativeJS: [MEM] deferredNativeReclaim stage=galaxy_map listeners=2

```

## mem-timeline (tail)

```csv
﻿iso_time,pid,pss_mb,rss_mb,gl_mb,egl_mb,graphics_mb,native_heap_mb,java_heap_mb,threads,views,delta_pss_mb,delta_gl_mb,note
2026-08-01 19:07:20,29412,791.8,918,142.2,19.8,162.1,324.9,58.9,,591,6.3,2,
2026-08-01 19:22:45,29412,784,911.3,140.2,19.8,160.1,326.4,52.4,,581,-7.8,-2,
2026-08-01 19:38:10,29412,780,907.4,140.2,19.8,160.1,326.1,48.7,,581,-4,0,
2026-08-01 19:53:35,29412,783.5,910.1,142.2,19.8,162.1,327,50.1,,581,3.5,2,
2026-08-01 20:09:00,29412,785.6,913.4,140.2,19.8,160.1,327.5,54.7,,581,2.1,-2,
2026-08-01 20:24:25,29412,783.5,911.4,142.2,19.8,162.1,327.8,49.8,,581,-2.1,2,
2026-08-01 20:39:59,29412,784.7,912.6,140.2,19.8,160.1,327.9,53.4,,581,1.2,-2,
2026-08-01 21:10:55,29412,739.4,862.4,14.9,19.8,34.7,402.8,49.7,,229,-45.3,-125.3,GL_RECOVERED idle_ok
2026-08-01 21:26:22,29412,823.1,951.6,36.3,19.8,56.1,423.4,60.6,,369,83.7,21.4,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-08-01 21:41:47,29412,936.5,1072.4,130,19.8,149.9,460.7,51.5,,575,113.4,93.7,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-08-01 21:57:14,29412,954.7,1090.7,133.8,19.8,153.6,465.6,56.8,,575,18.2,3.8,
2026-08-01 21:58:03,7103,556.8,,8.5,,,,,,99,,,POST_REMEDIATION_VERIFY_OK
```
