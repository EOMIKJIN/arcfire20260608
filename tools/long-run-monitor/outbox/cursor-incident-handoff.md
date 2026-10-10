# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-10-10T05:08:46.794Z
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
[2026-10-10 14:06:29] AUTO_FIX static audit:skia-memory start
[2026-10-10 14:06:33] AUTO_FIX audit:skia-memory PASS
[2026-10-10 14:06:33] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-10-10 14:06:51] AUTO_FIX baseline reset pid=10203 gl=2.7MB pss=187.6MB
[2026-10-10 14:06:51] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-10-10 14:07:12] VERIFY PASS pid=10203 gl=2.7MB pss=373.6MB views=14
[2026-10-10 14:07:12] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":991.9,"views":338,"lastGlMb":61.4,"hardCeiling":true}
[2026-10-10 14:07:13] HANDOFF packed -> outbox/cursor-incident-handoff.md (Kim Team Lead triage)
[2026-10-10 14:08:44] INVESTIGATION start reason=mem_anomaly
[2026-10-10 14:08:44] INVESTIGATION alert=[2026-10-10 14:06:29] GL_HARD_CEILING gl=61.4 pss=991.9 views=338
[2026-10-10 14:08:44] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20261010-140844.log
[2026-10-10 14:08:46] INVESTIGATION mem from timeline gl=2.7MB pss=373.6MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20261010-140844.log
```

## Recent incidents

```
[2026-10-10 12:46:14] PSS_SOFT_CEILING pss=839.3 gl=38.5 views=426 native_reclaim_advisory
[2026-10-10 13:02:08] PSS_SOFT_CEILING pss=824.3 gl=98 views=361 native_reclaim_advisory
[2026-10-10 13:34:32] VIEWS_NATIVE_ADVISORY views=411 native_heap=420.4 pss=798.7 gl=39.9 (node/list retention ? pre-hardceiling early warn)
[2026-10-10 13:50:35] PSS_SOFT_CEILING pss=825 gl=43.4 views=430 native_reclaim_advisory
[2026-10-10 14:06:29] GL_HARD_CEILING gl=61.4 pss=991.9 views=338
[2026-10-10 14:06:29] REFIX_REQUESTED gl_critical_active_hub
```

## Crash signature (tail)

```
10-10 14:07:09.137 10203 10323 I ReactNativeJS: Running "main" with {"rootTag":1,"initialProps":{},"fabric":true}
10-10 14:07:10.934 10203 10323 W ReactNativeJS: [expo-av]: Expo AV has been deprecated and will be removed in SDK 54. Use the `expo-audio` and `expo-video` packages to replace the required functionality.
10-10 14:07:12.326 10203 10323 W ReactNativeJS: Deep imports from the 'react-native' package are deprecated ('react-native/Libraries/Utilities/DevLoadingView'). Source: D:\arcfire20260607\src\game\devLoadingViewSuppress.ts 18:19
10-10 14:07:13.480 10203 10323 W ReactNativeJS: This method is deprecated (as well as all React Native Firebase namespaced API) and will be removed in the next major release as part of move to match Firebase Web modular SDK API. Please see migration guide for more details: https://rnfirebase.io/migrating-to-v22 Please use `getApp()` instead.
10-10 14:07:13.507 10203 10323 W ReactNativeJS: This method is deprecated (as well as all React Native Firebase namespaced API) and will be removed in the next major release as part of move to match Firebase Web modular SDK API. Please see migration guide for more details: https://rnfirebase.io/migrating-to-v22 Please use `getApp()` instead.
10-10 14:07:13.510 10203 10323 W ReactNativeJS: This method is deprecated (as well as all React Native Firebase namespaced API) and will be removed in the next major release as part of move to match Firebase Web modular SDK API. Please see migration guide for more details: https://rnfirebase.io/migrating-to-v22. Method called was `logEvent`. Please use `logEvent()` instead.
10-10 14:07:14.825 10203 10323 I ReactNativeJS: [boot-perf] root_layout total=3643ms | layout_effect_start+2338ms → csv_indexes_start(minimal)+0ms → csv_indexes_end(minimal)+9ms → storage_load_start+83ms → storage_load_end+1180ms → boot_ready+33ms
10-10 14:07:16.466 10203 10323 I ReactNativeJS: [ArcCore/WorldExpansion] global sync(sync) gen=2 epoch=2026-06-26 target=107 +1 -0 hardReset=false
10-10 14:07:17.786 10203 10323 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog x152 calls(합산) planets=152 origin=arc_core_policy', 'trade_port_planet_resync'
10-10 14:07:19.134 10203 10323 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog x28 calls(합산) planets=28 origin=arc_core_policy', 'trade_port_planet_resync'
10-10 14:07:19.379 10203 10323 I ReactNativeJS: [territorial] 동적 분쟁지역 편입: dark_haven (dark_rift) source=arc_frontline
10-10 14:07:19.380 10203 10323 I ReactNativeJS: [territorial] 풀 거버너 승격: dark_haven(dark_rift) class=eligible_front score=115
10-10 14:07:19.394 10203 10323 I ReactNativeJS: [territorial] crimson_base 체류 중 분쟁 차례 → 플레이어 웨이브 이관 (패스 미완료)
10-10 14:07:19.413 10203 10323 I ReactNativeJS: [ArcCore/Convoy] heal convoy gross over cap planets=85 cap=45000
10-10 14:07:21.099 10203 10323 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog x104 calls(합산) planets=104 origin=arc_core_policy', 'trade_port_planet_resync'
10-10 14:07:21.906 10203 10323 I ReactNativeJS: [title-diag] catchUp=2767ms probe=24ms
10-10 14:07:22.199 10203 10323 I ReactNativeJS: [ArcCore/Learning] RTDB global merge entries=14
10-10 14:07:22.205 10203 10323 I ReactNativeJS: [ArcCore/RTDB] boot sync ok pack=2026-06-26-1782444492960 global=true
10-10 14:08:19.108 10203 10323 I ReactNativeJS: [arc-hitch-min] tick:arc_core_spy_subcore=1/200/200 tick:ai_aabs_subcore=1/34/34 plan:convoy_route=1/39/39 settle:convoy_plan=1/41/41

```

## mem-timeline (tail)

```csv
﻿iso_time,pid,pss_mb,rss_mb,gl_mb,egl_mb,graphics_mb,native_heap_mb,java_heap_mb,threads,views,delta_pss_mb,delta_gl_mb,note
2026-10-10 11:26:30,11963,473.7,591.4,41.1,43.3,84.4,180.2,39.2,,447,-38.3,-6.9,GL_RECOVERED idle_ok
2026-10-10 11:42:21,24712,513.7,663.5,88.6,28,116.5,195.2,29.2,,332,,,
2026-10-10 11:58:02,24712,438.3,543.1,52,43.3,95.4,169.2,30.3,,412,,,
2026-10-10 12:13:56,1201,175.4,281.5,2.7,61.7,64.4,10.6,11.8,,11,,,
2026-10-10 12:30:13,1201,839.8,981.5,36.5,43.3,79.8,482.3,33.1,,419,,,
2026-10-10 12:46:07,1201,839.3,982.5,38.5,43.3,81.8,462,34.8,,426,-0.5,2,
2026-10-10 13:01:59,5380,824.3,965.7,98,35.2,133.2,410.9,36.3,,361,,,
2026-10-10 13:18:03,7777,790.3,930.6,54.2,43.3,97.5,401.1,45.6,,428,,,
2026-10-10 13:34:20,7777,798.7,941.5,39.9,43.3,83.2,420.4,48.3,,411,,,
2026-10-10 13:50:26,7777,825,965.5,43.4,43.3,86.8,435.6,47.8,,430,26.3,3.5,
2026-10-10 14:06:21,7777,991.9,1131.2,61.4,43.3,104.7,574.3,37.9,,338,166.9,18,GL_SPIKE suspect=hub_idle_skia_inbound_or_nebula
2026-10-10 14:07:12,10203,373.6,,2.7,,,,,,14,,,POST_REMEDIATION_VERIFY_OK
```
