# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-10-08T14:59:50.588Z
triggerReason: gl_critical_active_hub
refixPayload: (none)

## Mandatory agent action (P0)

1. `arcfire-bug-debug-workflow.mdc` — logcat/crash·remediation VERIFY FAIL 근거로 원인 특정.
2. Skia·허브·STAGE 관련이면 `arcfire-skia-memory-lifecycle.mdc` + `npm run audit:skia-memory`.
3. 코드 수정 후 `npx tsc --noEmit -p tsconfig.client.json`.
4. 런타임 재확인: `manual-mem-snapshot.ps1` 또는 mem-timeline VERIFY PASS 추이.
5. 완료 시 `node tools/long-run-monitor/ack-incident-handoff.cjs` 실행.

## Recent remediation

```
[2026-10-08 23:43:07] packed D:\arcfire20260607\tools\long-run-monitor\outbox\cursor-incident-handoff.md
[2026-10-08 23:43:07] INVESTIGATION trigger -> .cursor/trigger-incident-auto-fix.json
[2026-10-08 23:43:07] INVESTIGATION done reason=mem_anomaly
[2026-10-08 23:59:09] INCIDENT GL_HARD_CEILING gl=344.7 pss=1054.4 views=387 -> immediate remediation (OOM imminent)
[2026-10-08 23:59:09] REFIX_REQUESTED gl_critical_active_hub -> gl-leak-refix-requested.flag
[2026-10-08 23:59:09] AUTO_FIX static audit:skia-memory start
[2026-10-08 23:59:12] AUTO_FIX audit:skia-memory PASS
[2026-10-08 23:59:12] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-10-08 23:59:28] AUTO_FIX baseline reset pid=31460 gl=2.7MB pss=323MB
[2026-10-08 23:59:28] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-10-08 23:59:49] VERIFY PASS pid=31460 gl=17.9MB pss=577MB views=99
[2026-10-08 23:59:49] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":1054.4,"views":387,"lastGlMb":344.7,"hardCeiling":true}
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
10-08 23:59:30.981 31460 31555 W ReactNativeJS: 'This method is deprecated (as well as all React Native Firebase namespaced API) and will be removed in the next major release as part of move to match Firebase Web modular SDK API. Please see migration guide for more details: https://rnfirebase.io/migrating-to-v22 Please use `getApp()` instead.', { [Stack] name: 'Stack' }
10-08 23:59:31.002 31460 31555 W ReactNativeJS: 'This method is deprecated (as well as all React Native Firebase namespaced API) and will be removed in the next major release as part of move to match Firebase Web modular SDK API. Please see migration guide for more details: https://rnfirebase.io/migrating-to-v22 Please use `getApp()` instead.', { [Stack] name: 'Stack' }
10-08 23:59:31.005 31460 31555 W ReactNativeJS: 'This method is deprecated (as well as all React Native Firebase namespaced API) and will be removed in the next major release as part of move to match Firebase Web modular SDK API. Please see migration guide for more details: https://rnfirebase.io/migrating-to-v22. Method called was `logEvent`. Please use `logEvent()` instead.', { [Stack] name: 'Stack' }
10-08 23:59:31.230  1986  2030 I ActivityManager: Start proc 31701:com.samsung.android.privacydashboard/u0a107 for content provider {com.samsung.android.privacydashboard/com.samsung.android.privacydashboard.provider.PermissionAccessInformationContentProvider}
10-08 23:59:31.300  1986  2954 I ActivityManager: Changes in 10107 20 to 19, 0 to 384
10-08 23:59:31.434  1986  2877 I ActivityManager: Changes in 10107 19 to 5, 384 to 400
10-08 23:59:32.770 31460 31555 I ReactNativeJS: [boot-perf] root_layout total=3986ms | layout_effect_start+2241ms → csv_indexes_start(minimal)+1ms → csv_indexes_end(minimal)+12ms → storage_load_start+134ms → storage_load_end+1565ms → boot_ready+33ms
10-08 23:59:35.127 31460 31555 I ReactNativeJS: [ArcCore/WorldExpansion] global sync(sync) gen=2 epoch=2026-06-26 target=105 +1 -0 hardReset=false
10-08 23:59:36.532  1986  2030 I ActivityManager: Start proc 31739:com.samsung.android.dqagent/1000 for broadcast {com.samsung.android.dqagent/com.samsung.android.dqagent.receiver.DQADataReceiver}
10-08 23:59:36.831  1986  2941 I ActivityManager: Killing 13412:com.samsung.cmh/5004 (adj 985): empty #25
10-08 23:59:37.447 31460 31555 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog x152 calls(합산) planets=152 origin=arc_core_policy', 'trade_port_planet_resync'
10-08 23:59:39.281 31460 31555 I ReactNativeJS: '[arc-hitch] tick', 'arc_core_spy_subcore', 227
10-08 23:59:39.369  1986  2028 I ActivityManager: Changes in 10107 5 to 15, 400 to 256
10-08 23:59:39.413 31460 31555 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog x28 calls(합산) planets=28 origin=arc_core_policy', 'trade_port_planet_resync'
10-08 23:59:40.530 31460 31555 I ReactNativeJS: [ArcCore/Convoy] heal convoy gross over cap planets=66 cap=45000
10-08 23:59:40.550 31460 31555 I ReactNativeJS: [title-diag] catchUp=1250ms probe=1ms
10-08 23:59:43.105 31460 31555 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog x104 calls(합산) planets=104 origin=arc_core_policy', 'trade_port_planet_resync'
10-08 23:59:43.125 31460 31555 I ReactNativeJS: [ArcCore/Learning] RTDB global merge entries=14
10-08 23:59:43.130 31460 31555 I ReactNativeJS: [ArcCore/RTDB] boot sync ok pack=2026-06-26-1782444492960 global=true

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
