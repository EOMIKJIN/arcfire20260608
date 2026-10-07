# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-10-06T16:24:36.593Z
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
[2026-10-07 01:22:28] AUTO_FIX static audit:skia-memory start
[2026-10-07 01:22:30] AUTO_FIX audit:skia-memory PASS
[2026-10-07 01:22:30] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-10-07 01:22:48] AUTO_FIX baseline reset pid=16215 gl=6MB pss=202.3MB
[2026-10-07 01:22:49] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-10-07 01:23:09] VERIFY PASS pid=16215 gl=8.5MB pss=702.1MB views=103
[2026-10-07 01:23:09] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":1052.4,"views":323,"lastGlMb":44.7,"hardCeiling":true}
[2026-10-07 01:23:12] HANDOFF packed -> outbox/cursor-incident-handoff.md (Kim Team Lead triage)
[2026-10-07 01:24:32] INVESTIGATION start reason=mem_anomaly
[2026-10-07 01:24:32] INVESTIGATION alert=[2026-10-07 01:22:26] GL_HARD_CEILING gl=44.7 pss=1052.4 views=323
[2026-10-07 01:24:32] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20261007-012432.log
[2026-10-07 01:24:36] INVESTIGATION mem from timeline gl=8.5MB pss=702.1MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20261007-012432.log
```

## Recent incidents

```
[2026-10-06 19:50:56] PSS_SOFT_CEILING pss=875.2 gl=41 views=389 native_reclaim_advisory
[2026-10-06 20:07:09] PSS_SOFT_CEILING pss=834.5 gl=46.4 views=392 native_reclaim_advisory
[2026-10-06 20:23:26] PSS_SOFT_CEILING pss=815.4 gl=40 views=383 native_reclaim_advisory
[2026-10-07 01:05:54] VIEWS_NATIVE_ADVISORY views=382 native_heap=468.1 pss=782.5 gl=30.2 (node/list retention ? pre-hardceiling early warn)
[2026-10-07 01:22:26] GL_HARD_CEILING gl=44.7 pss=1052.4 views=323
[2026-10-07 01:22:28] REFIX_REQUESTED gl_critical_active_hub
```

## Crash signature (tail)

```
10-07 01:22:30.851  1668  3963 W ActivityManager: pid 4498 com.samsung.android.honeyboard sent binder code 9 with flags 1 and got error -32
10-07 01:22:33.280  1668  2416 W ActivityManager: registerReceiverWithFeature: no app for null
10-07 01:22:33.377  1668  1711 I ActivityManager: Start proc 16215:com.arcfire.online/u0a1080 for next-top-activity {com.arcfire.online/com.arcfire.online.MainActivity}
10-07 01:22:33.444  1668  2502 I ActivityManager: Changes in 11080 19 to 2, 0 to 511
10-07 01:22:34.805  1668  1703 I ActivityManager: Changes in 10147 2 to 5, 511 to 440
10-07 01:22:51.059 16215 16331 I ReactNativeJS: Bridgeless mode is enabled
10-07 01:22:51.353 16215 16331 I ReactNativeJS: Running "main" with {"rootTag":11,"initialProps":{},"fabric":true}
10-07 01:22:55.813 16215 16331 W ReactNativeJS: 'This method is deprecated (as well as all React Native Firebase namespaced API) and will be removed in the next major release as part of move to match Firebase Web modular SDK API. Please see migration guide for more details: https://rnfirebase.io/migrating-to-v22 Please use `getApp()` instead.', { [Component Stack] name: 'Component Stack' }
10-07 01:22:55.852 16215 16331 W ReactNativeJS: 'This method is deprecated (as well as all React Native Firebase namespaced API) and will be removed in the next major release as part of move to match Firebase Web modular SDK API. Please see migration guide for more details: https://rnfirebase.io/migrating-to-v22 Please use `getApp()` instead.', { [Component Stack] name: 'Component Stack' }
10-07 01:22:55.870 16215 16331 W ReactNativeJS: 'This method is deprecated (as well as all React Native Firebase namespaced API) and will be removed in the next major release as part of move to match Firebase Web modular SDK API. Please see migration guide for more details: https://rnfirebase.io/migrating-to-v22. Method called was `logEvent`. Please use `logEvent()` instead.', { [Component Stack] name: 'Component Stack' }
10-07 01:22:57.384 16215 16331 I ReactNativeJS: [boot-perf] root_layout total=3990ms | layout_effect_start+2487ms → csv_indexes_start(minimal)+0ms → csv_indexes_end(minimal)+22ms → storage_load_start+136ms → storage_load_end+1305ms → boot_ready+39ms
10-07 01:23:00.331 16215 16331 I ReactNativeJS: [ArcCore/WorldExpansion] global sync(sync) gen=2 epoch=2026-06-26 target=104 +1 -0 hardReset=false
10-07 01:23:02.815 16215 16331 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog x152 calls(합산) planets=152 origin=arc_core_policy', 'trade_port_planet_resync'
10-07 01:23:04.734 16215 16331 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog x28 calls(합산) planets=28 origin=arc_core_policy', 'trade_port_planet_resync'
10-07 01:23:05.021 16215 16331 I ReactNativeJS: [ArcCore/Convoy] heal convoy gross over cap planets=38 cap=45000
10-07 01:23:07.870 16215 16331 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog x104 calls(합산) planets=104 origin=arc_core_policy', 'trade_port_planet_resync'
10-07 01:23:09.276 16215 16331 I ReactNativeJS: [ArcCore/Learning] RTDB global merge entries=14
10-07 01:23:09.279 16215 16331 I ReactNativeJS: [ArcCore/RTDB] boot sync ok pack=2026-06-26-1782444492960 global=true
10-07 01:23:09.288 16215 16331 I ReactNativeJS: [title-diag] catchUp=4555ms probe=1ms

```

## mem-timeline (tail)

```csv
﻿iso_time,pid,pss_mb,rss_mb,gl_mb,egl_mb,graphics_mb,native_heap_mb,java_heap_mb,threads,views,delta_pss_mb,delta_gl_mb,note
2026-10-06 22:48:12,28552,440.7,567.8,13.1,19.8,32.9,171.6,33,,13,-0.2,0,
2026-10-06 23:04:24,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-10-06 23:19:24,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-10-06 23:34:25,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-10-06 23:49:25,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-10-07 00:04:27,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-10-07 00:19:29,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-10-07 00:34:29,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-10-07 00:49:29,11347,710.5,810,13.5,19.8,33.3,458.1,28.1,,103,,,
2026-10-07 01:05:38,11347,782.5,886.9,30.2,19.8,50,468.1,38.6,,382,,,
2026-10-07 01:22:11,11347,1052.4,1141.8,44.7,19.8,64.5,618.7,124,,323,269.9,14.5,GL_SPIKE suspect=hub_idle_skia_inbound_or_nebula
2026-10-07 01:23:09,16215,702.1,,8.5,,,,,,103,,,POST_REMEDIATION_VERIFY_OK
```
