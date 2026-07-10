# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-07-10T12:01:48.391Z
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
[2026-07-10 20:45:40] VERIFY PASS pid=12074 gl=8.5MB pss=594.3MB views=99
[2026-07-10 20:45:40] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":973.2,"views":561,"lastGlMb":130.3,"hardCeiling":true}
[2026-07-10 20:45:41] HANDOFF packed -> outbox/cursor-incident-handoff.md (Kim Team Lead triage)
[2026-07-10 21:01:05] INCIDENT GL_HARD_CEILING gl=120.9 pss=1075.4 views=561 -> immediate remediation (OOM imminent)
[2026-07-10 21:01:05] REFIX_REQUESTED gl_critical_active_hub -> gl-leak-refix-requested.flag
[2026-07-10 21:01:05] AUTO_FIX static audit:skia-memory start
[2026-07-10 21:01:07] AUTO_FIX audit:skia-memory PASS
[2026-07-10 21:01:07] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-07-10 21:01:25] AUTO_FIX baseline reset pid=12768 gl=4.4MB pss=367.2MB
[2026-07-10 21:01:25] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-07-10 21:01:48] VERIFY PASS pid=12768 gl=8.5MB pss=554.8MB views=99
[2026-07-10 21:01:48] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":1075.4,"views":561,"lastGlMb":120.9,"hardCeiling":true}
```

## Recent incidents

```
[2026-07-10 19:57:55] REFIX_REQUESTED gl_critical_active_hub
[2026-07-10 20:29:31] VIEWS_NATIVE_ADVISORY views=577 native_heap=316.7 pss=692 gl=97.9 (node/list retention ??pre-hardceiling early warn)
[2026-07-10 20:44:58] GL_HARD_CEILING gl=130.3 pss=973.2 views=561
[2026-07-10 20:44:58] REFIX_REQUESTED gl_critical_active_hub
[2026-07-10 21:01:05] GL_HARD_CEILING gl=120.9 pss=1075.4 views=561
[2026-07-10 21:01:05] REFIX_REQUESTED gl_critical_active_hub
```

## Crash signature (tail)

```
07-10 21:01:30.647 12768 12871 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog planets=1 items=68 origin=arc_core_policy', 'trade_port_planet_resync'
07-10 21:01:30.661 12768 12871 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog planets=1 items=49 origin=arc_core_policy', 'trade_port_planet_resync'
07-10 21:01:30.672 12768 12871 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog planets=1 items=68 origin=arc_core_policy', 'trade_port_planet_resync'
07-10 21:01:30.685 12768 12871 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog planets=1 items=68 origin=arc_core_policy', 'trade_port_planet_resync'
07-10 21:01:30.697 12768 12871 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog planets=1 items=66 origin=arc_core_policy', 'trade_port_planet_resync'
07-10 21:01:30.710 12768 12871 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog planets=1 items=91 origin=arc_core_policy', 'trade_port_planet_resync'
07-10 21:01:30.721 12768 12871 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog planets=1 items=89 origin=arc_core_policy', 'trade_port_planet_resync'
07-10 21:01:30.732 12768 12871 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog planets=1 items=91 origin=arc_core_policy', 'trade_port_planet_resync'
07-10 21:01:30.743 12768 12871 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog planets=1 items=89 origin=arc_core_policy', 'trade_port_planet_resync'
07-10 21:01:30.756 12768 12871 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog planets=1 items=49 origin=arc_core_policy', 'trade_port_planet_resync'
07-10 21:01:30.767 12768 12871 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog planets=1 items=89 origin=arc_core_policy', 'trade_port_planet_resync'
07-10 21:01:30.779 12768 12871 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog planets=1 items=68 origin=arc_core_policy', 'trade_port_planet_resync'
07-10 21:01:30.790 12768 12871 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog planets=1 items=91 origin=arc_core_policy', 'trade_port_planet_resync'
07-10 21:01:32.383 12768 12871 I ReactNativeJS: [ArcCore/RTDB] boot sync skip (offline)
07-10 21:01:33.883 12768 12871 W ReactNativeJS: This method is deprecated (as well as all React Native Firebase namespaced API) and will be removed in the next major release as part of move to match Firebase Web modular SDK API. Please see migration guide for more details: https://rnfirebase.io/migrating-to-v22. Method called was `FieldValue`. Please use `FieldValue` instead.
07-10 21:01:33.883 12768 12871 W ReactNativeJS: This method is deprecated (as well as all React Native Firebase namespaced API) and will be removed in the next major release as part of move to match Firebase Web modular SDK API. Please see migration guide for more details: https://rnfirebase.io/migrating-to-v22. Method called was `delete`. Please use `deleteField()` instead.
07-10 21:01:33.883 12768 12871 W ReactNativeJS: This method is deprecated (as well as all React Native Firebase namespaced API) and will be removed in the next major release as part of move to match Firebase Web modular SDK API. Please see migration guide for more details: https://rnfirebase.io/migrating-to-v22. Method called was `FieldValue`. Please use `FieldValue` instead.
07-10 21:01:33.883 12768 12871 W ReactNativeJS: This method is deprecated (as well as all React Native Firebase namespaced API) and will be removed in the next major release as part of move to match Firebase Web modular SDK API. Please see migration guide for more details: https://rnfirebase.io/migrating-to-v22. Method called was `serverTimestamp`. Please use `serverTimestamp()` instead.
07-10 21:01:37.823  1875  3973 I ActivityManager: Changes in 99002 3 to 10, 184 to 0

```

## mem-timeline (tail)

```csv
﻿iso_time,pid,pss_mb,rss_mb,gl_mb,egl_mb,graphics_mb,native_heap_mb,java_heap_mb,threads,views,delta_pss_mb,delta_gl_mb,note
2026-07-10 18:56:17,6004,674.4,815.4,38.7,19.8,58.5,335.8,40.9,,339,-4.2,-0.3,
2026-07-10 19:11:39,6004,709.7,850.9,39.6,40.7,80.2,341,42.5,,368,35.3,0.9,
2026-07-10 19:26:59,6004,785.1,925.5,124.1,19.8,143.9,367.5,25.8,,567,75.4,84.5,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-07-10 19:42:22,6004,697.8,834.8,19.9,19.8,39.7,392.3,42.9,,99,-87.3,-104.2,GL_RECOVERED idle_ok
2026-07-10 19:57:49,6004,971,1027,120.7,19.8,140.5,557.4,38.6,,568,273.2,100.8,HUB_ACTIVATION gl_mount_ok
2026-07-10 19:58:36,10538,570.6,,8.4,,,,,,99,,,POST_REMEDIATION_VERIFY_OK
2026-07-10 20:13:58,10538,531.1,658.6,9.2,19.8,29,253.7,40.3,,99,,,
2026-07-10 20:29:23,10538,692,822.6,97.9,19.8,117.8,316.7,42.6,,577,160.9,88.7,HUB_ACTIVATION gl_mount_ok
2026-07-10 20:44:53,10538,973.2,1102.9,130.3,19.8,150.1,560.5,42.9,,561,281.2,32.4,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-07-10 20:45:40,12074,594.3,,8.5,,,,,,99,,,POST_REMEDIATION_VERIFY_OK
2026-07-10 21:01:00,12074,1075.4,1207.1,120.9,19.8,140.7,618.8,52.9,,561,,,
2026-07-10 21:01:48,12768,554.8,,8.5,,,,,,99,,,POST_REMEDIATION_VERIFY_OK
```
