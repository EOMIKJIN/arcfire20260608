# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-07-28T12:03:24.370Z
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
[2026-07-28 21:00:40] AUTO_FIX static audit:skia-memory start
[2026-07-28 21:00:42] AUTO_FIX audit:skia-memory PASS
[2026-07-28 21:00:42] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-07-28 21:00:59] AUTO_FIX baseline reset pid=8652 gl=6MB pss=206.8MB
[2026-07-28 21:01:00] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-07-28 21:01:21] VERIFY PASS pid=8652 gl=8.5MB pss=613.4MB views=99
[2026-07-28 21:01:21] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":1024.3,"views":572,"lastGlMb":126,"hardCeiling":true}
[2026-07-28 21:01:22] HANDOFF packed -> outbox/cursor-incident-handoff.md (Kim Team Lead triage)
[2026-07-28 21:03:20] INVESTIGATION start reason=mem_anomaly
[2026-07-28 21:03:20] INVESTIGATION alert=[2026-07-28 21:00:40] GL_HARD_CEILING gl=126 pss=1024.3 views=572
[2026-07-28 21:03:22] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260728-210320.log
[2026-07-28 21:03:24] INVESTIGATION mem from timeline gl=8.5MB pss=613.4MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260728-210320.log
```

## Recent incidents

```
[2026-07-28 19:58:54] VIEWS_NATIVE_ADVISORY views=572 native_heap=315.9 pss=734.8 gl=127.5 (node/list retention ??pre-hardceiling early warn)
[2026-07-28 20:14:19] VIEWS_NATIVE_ADVISORY views=572 native_heap=315.9 pss=734 gl=125.5 (node/list retention ??pre-hardceiling early warn)
[2026-07-28 20:29:44] VIEWS_NATIVE_ADVISORY views=572 native_heap=316.2 pss=733.8 gl=125.5 (node/list retention ??pre-hardceiling early warn)
[2026-07-28 20:45:09] VIEWS_NATIVE_ADVISORY views=644 native_heap=351.9 pss=797.4 gl=100.4 (node/list retention ??pre-hardceiling early warn)
[2026-07-28 21:00:40] GL_HARD_CEILING gl=126 pss=1024.3 views=572
[2026-07-28 21:00:40] REFIX_REQUESTED gl_critical_active_hub
```

## Crash signature (tail)

```
07-28 21:01:54.776  8652  8764 I ReactNativeJS: [MEM] hubSkiaNativeReclaim epoch=5 reason=ingress_after_hub_combat
07-28 21:01:54.776  8652  8764 I ReactNativeJS: [MEM] runStageNativeReclaimPass stage=galaxy_map reason=ingress_after_hub_combat immediate=0
07-28 21:01:54.778  8652  8764 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=deep_reclaim hermes_mb=36 detail=ingress_after_hub_combat
07-28 21:01:54.778  8652  8764 I ReactNativeJS: [MEM] runGalaxyMapResidentDeepReclaimPass reason=ingress_after_hub_combat hubSkia=true
07-28 21:01:54.779  8652  8764 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=ingress_reclaim hermes_mb=36 detail=after_hub_combat
07-28 21:01:54.779  8652  8764 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_focus hermes_mb=36
07-28 21:01:54.809  8652  8764 I ReactNativeJS: [MEM] consumeGalaxyMapIngressReclaim kind=after_hub_combat fresco=true
07-28 21:01:58.242  8652  8764 I ReactNativeJS: [MEM] deferredNativeReclaim stage=planet_hub listeners=2
07-28 21:01:58.243  8652  8764 I ReactNativeJS: [MEM] deferredNativeReclaim stage=galaxy_map listeners=2
07-28 21:01:58.787  8652  8764 I ReactNativeJS: [MEM] hubSkiaNativeReclaim epoch=6 reason=galaxy_map_post_ingress_settle
07-28 21:01:58.787  8652  8764 I ReactNativeJS: [MEM] runStageNativeReclaimPass stage=galaxy_map reason=galaxy_map_post_ingress_settle immediate=0
07-28 21:01:58.788  8652  8764 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=deep_reclaim hermes_mb=40 detail=galaxy_map_post_ingress_settle
07-28 21:01:58.789  8652  8764 I ReactNativeJS: [MEM] runGalaxyMapResidentDeepReclaimPass reason=galaxy_map_post_ingress_settle hubSkia=true
07-28 21:02:00.317  8652  8764 I ReactNativeJS: [MEM] deferredNativeReclaim stage=galaxy_map listeners=2
07-28 21:02:39.787  8652  8764 I ReactNativeJS: [MEM] hubSkiaNativeReclaim epoch=7 reason=galaxy_map_post_ingress_followup
07-28 21:02:39.787  8652  8764 I ReactNativeJS: [MEM] runStageNativeReclaimPass stage=galaxy_map reason=galaxy_map_post_ingress_followup immediate=0
07-28 21:02:39.788  8652  8764 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=deep_reclaim hermes_mb=40 detail=galaxy_map_post_ingress_followup
07-28 21:02:39.788  8652  8764 I ReactNativeJS: [MEM] runGalaxyMapResidentDeepReclaimPass reason=galaxy_map_post_ingress_followup hubSkia=true
07-28 21:02:41.311  8652  8764 I ReactNativeJS: [MEM] deferredNativeReclaim stage=galaxy_map listeners=2

```

## mem-timeline (tail)

```csv
﻿iso_time,pid,pss_mb,rss_mb,gl_mb,egl_mb,graphics_mb,native_heap_mb,java_heap_mb,threads,views,delta_pss_mb,delta_gl_mb,note
2026-07-28 18:26:40,27017,785.2,827.5,114.5,19.8,134.3,375.8,44.6,,572,14.7,0,
2026-07-28 18:42:10,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-07-28 18:57:10,1710,744.2,868.7,127.6,19.8,147.4,319.9,47.9,,572,,,
2026-07-28 19:12:35,1710,758,883.6,125.6,19.8,145.4,316.4,68.2,,572,,,
2026-07-28 19:27:59,1710,730.8,857.1,125.6,19.8,145.4,313.4,42.5,,572,-27.2,0,
2026-07-28 19:43:25,1710,735.8,863.7,125.5,19.8,145.4,315.2,45.9,,572,5,-0.1,
2026-07-28 19:58:49,1710,734.8,863.2,127.5,19.8,147.4,315.9,42.1,,572,-1,2,
2026-07-28 20:14:13,1710,734,860.7,125.5,19.8,145.4,315.9,42.1,,572,-0.8,-2,
2026-07-28 20:29:38,1710,733.8,859.5,125.5,19.8,145.4,316.2,42.2,,572,-0.2,0,
2026-07-28 20:45:03,1710,797.4,926.1,100.4,66.1,166.6,351.9,47.3,,644,63.6,-25.1,PSS_SPIKE review=graphics+native
2026-07-28 21:00:35,1710,1024.3,1151.1,126,19.8,145.8,558,44.9,,572,226.9,25.6,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-07-28 21:01:21,8652,613.4,,8.5,,,,,,99,,,POST_REMEDIATION_VERIFY_OK
```
