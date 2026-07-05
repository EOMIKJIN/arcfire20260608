# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-07-05T09:30:31.808Z
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
[2026-07-05 18:25:32] AUTO_FIX static audit:skia-memory start
[2026-07-05 18:25:34] AUTO_FIX audit:skia-memory PASS
[2026-07-05 18:25:34] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-07-05 18:25:51] AUTO_FIX baseline reset pid=15875 gl=6MB pss=202.7MB
[2026-07-05 18:25:51] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-07-05 18:26:12] VERIFY PASS pid=15875 gl=4.4MB pss=390.9MB views=15
[2026-07-05 18:26:12] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":1074.1,"views":559,"lastGlMb":154.2,"hardCeiling":true}
[2026-07-05 18:26:13] HANDOFF packed -> outbox/cursor-incident-handoff.md (Kim Team Lead triage)
[2026-07-05 18:30:29] INVESTIGATION start reason=mem_anomaly
[2026-07-05 18:30:29] INVESTIGATION alert=[2026-07-05 18:25:31] GL_HARD_CEILING gl=154.2 pss=1074.1 views=559
[2026-07-05 18:30:30] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260705-183029.log
[2026-07-05 18:30:31] INVESTIGATION mem from timeline gl=4.4MB pss=390.9MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260705-183029.log
```

## Recent incidents

```
[2026-07-05 16:55:00] INVESTIGATION_TRIGGERED mem_anomaly
[2026-07-05 17:39:23] PSS_SOFT_CEILING pss=864.6 gl=48.8 views=296 native_reclaim_advisory
[2026-07-05 17:54:46] PSS_SOFT_CEILING pss=883.1 gl=50 views=344 native_reclaim_advisory
[2026-07-05 18:10:10] PSS_SOFT_CEILING pss=905.8 gl=50.3 views=394 native_reclaim_advisory
[2026-07-05 18:25:31] GL_HARD_CEILING gl=154.2 pss=1074.1 views=559
[2026-07-05 18:25:31] REFIX_REQUESTED gl_critical_active_hub
```

## Crash signature (tail)

```
07-03 19:46:43.899  1822  2705 I ActivityManager: Changes in 10108 10 to 10, 128 to 0
07-03 19:46:43.923  1822  1949 I ActivityManager: Start proc 25967:com.android.providers.calendar/u0a115 for broadcast {com.android.providers.calendar/com.android.providers.calendar.CalendarProviderBroadcastReceiver}
07-03 19:46:43.924  1822  1949 I ActivityManager: ProcessObserver broadcast disabled
07-03 19:46:43.992  1822  4347 I ActivityManager: Changes in 99003 19 to 8, 0 to 128
07-03 19:46:44.010  1822  4231 I ActivityManager: Changes in 99003 8 to 10, 128 to 0
07-03 19:46:44.057  1822  3326 I ActivityManager: Changes in 10115 19 to 11, 0 to 128
07-03 19:46:44.138  1822  2741 I ActivityManager: Changes in 10115 11 to 19, 128 to 0
07-03 19:46:44.157  1822  4347 I ActivityManager: Changes in 99003 19 to 5, 0 to 184
07-03 19:46:50.208  1822  1947 I ActivityManager: Changes in 5009 5 to 15, 144 to 0
07-03 19:46:59.221  1822  2705 I ActivityManager: Changes in 99003 5 to 10, 184 to 0
07-03 19:47:10.209  1822  1948 I ActivityManager: Killing 21034:com.google.android.partnersetup/u0a243 (adj 905): empty #25
07-03 19:49:26.795  1822  4319 I ActivityManager: Changes in 99003 19 to 5, 0 to 184
07-03 19:49:41.843  1822  4319 I ActivityManager: Changes in 99003 5 to 10, 184 to 0
07-03 19:50:29.948 16676 17289 I ReactNativeJS: [MEM] runSoftNativeReclaimPass reason=hub_periodic_soft nebulaBefore=1
07-03 19:50:29.951 16676 17289 I ReactNativeJS: [MEM] runPlanetHubSoftNativeReclaimPass reason=hub_periodic_soft keep=synth_002_p
07-03 19:50:31.497 16676 17289 I ReactNativeJS: [MEM] deferredNativeReclaim stage=planet_hub listeners=2
07-03 19:55:29.956 16676 17289 I ReactNativeJS: [MEM] runSoftNativeReclaimPass reason=hub_periodic_soft nebulaBefore=1
07-03 19:55:29.956 16676 17289 I ReactNativeJS: [MEM] runPlanetHubSoftNativeReclaimPass reason=hub_periodic_soft keep=synth_002_p
07-03 19:55:31.501 16676 17289 I ReactNativeJS: [MEM] deferredNativeReclaim stage=planet_hub listeners=2

```

## mem-timeline (tail)

```csv
﻿iso_time,pid,pss_mb,rss_mb,gl_mb,egl_mb,graphics_mb,native_heap_mb,java_heap_mb,threads,views,delta_pss_mb,delta_gl_mb,note
2026-07-05 16:06:24,30836,882.9,930,141.4,40.7,182,360.5,48.8,,394,3.6,0,
2026-07-05 16:21:45,30836,658.5,723,30.4,19.8,50.3,316.5,65.3,,15,-224.4,-111,GL_RECOVERED idle_ok
2026-07-05 16:37:07,30836,858,925.8,52.6,19.8,72.5,497.7,42.5,,342,199.5,22.2,HUB_ACTIVATION gl_mount_ok
2026-07-05 16:52:27,30836,972.1,1037.4,160.2,19.8,180,505.6,35.7,,371,114.1,107.6,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-07-05 16:53:15,12437,380.7,,5.9,,,,,,15,,,POST_REMEDIATION_VERIFY_OK
2026-07-05 17:08:37,12437,768.8,907,47.9,40.7,88.6,408.5,33.1,,296,,,
2026-07-05 17:23:57,12437,780.6,918.8,47.9,19.8,67.8,428.4,41.9,,349,11.8,0,
2026-07-05 17:39:18,12437,864.6,1002.2,48.8,40.7,89.5,468.8,37.9,,296,84,0.9,PSS_SPIKE review=graphics+native
2026-07-05 17:54:38,12437,883.1,1021.1,50,20,70,494.9,41.8,,344,18.5,1.2,
2026-07-05 18:10:05,12437,905.8,1042.6,50.3,34.3,84.6,491,43.5,,394,22.7,0.3,
2026-07-05 18:25:27,12437,1074.1,1209.1,154.2,19.8,174,568.1,39.7,,559,168.3,103.9,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-07-05 18:26:12,15875,390.9,,4.4,,,,,,15,,,POST_REMEDIATION_VERIFY_OK
```
