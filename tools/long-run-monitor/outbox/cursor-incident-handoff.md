# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-07-05T18:28:57.397Z
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
[2026-07-06 03:24:51] AUTO_FIX static audit:skia-memory start
[2026-07-06 03:24:54] AUTO_FIX audit:skia-memory PASS
[2026-07-06 03:24:54] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-07-06 03:25:11] AUTO_FIX baseline reset pid=12334 gl=6MB pss=187.8MB
[2026-07-06 03:25:11] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-07-06 03:25:33] VERIFY PASS pid=12334 gl=8.5MB pss=629MB views=99
[2026-07-06 03:25:33] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":914.2,"views":558,"lastGlMb":218.4,"hardCeiling":true}
[2026-07-06 03:25:34] HANDOFF packed -> outbox/cursor-incident-handoff.md (Kim Team Lead triage)
[2026-07-06 03:28:54] INVESTIGATION start reason=mem_anomaly
[2026-07-06 03:28:54] INVESTIGATION alert=[2026-07-06 03:24:51] GL_HARD_CEILING gl=218.4 pss=914.2 views=558
[2026-07-06 03:28:55] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260706-032854.log
[2026-07-06 03:28:57] INVESTIGATION mem from timeline gl=8.5MB pss=629MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260706-032854.log
```

## Recent incidents

```
[2026-07-06 02:23:23] PSS_SOFT_CEILING pss=835.6 gl=144.6 views=392 native_reclaim_advisory
[2026-07-06 02:38:46] PSS_SOFT_CEILING pss=832.5 gl=146.6 views=388 native_reclaim_advisory
[2026-07-06 02:54:07] PSS_SOFT_CEILING pss=832.6 gl=146.6 views=384 native_reclaim_advisory
[2026-07-06 03:09:29] PSS_SOFT_CEILING pss=826.5 gl=144.6 views=381 native_reclaim_advisory
[2026-07-06 03:24:51] GL_HARD_CEILING gl=218.4 pss=914.2 views=558
[2026-07-06 03:24:51] REFIX_REQUESTED gl_critical_active_hub
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
2026-07-06 00:51:00,24957,623.5,552.6,42.5,34.3,76.8,211.7,33.4,,394,7.4,0.2,
2026-07-06 01:06:26,24957,608.5,538.2,42.3,19.8,62.1,214.9,30.5,,368,-15,-0.2,
2026-07-06 01:21:51,24957,892.6,846.5,152.6,40.7,193.3,328.2,48,,334,284.1,110.3,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-07-06 01:37:18,24957,856.3,811,146.6,19.8,166.4,341.1,65.7,,388,-36.3,-6,GL_RECOVERED idle_ok
2026-07-06 01:52:38,24957,845.3,800.2,146.6,19.8,166.4,342.3,49,,388,-11,0,
2026-07-06 02:07:58,24957,847.4,802.5,144.6,19.8,164.4,333.4,61.8,,380,2.1,-2,
2026-07-06 02:23:19,24957,835.6,790.8,144.6,19.8,164.4,336.2,46.8,,392,-11.8,0,
2026-07-06 02:38:39,24957,832.5,787.9,146.6,19.8,166.4,335,43,,388,-3.1,2,
2026-07-06 02:54:01,24957,832.6,789.1,146.6,19.8,166.4,341.2,37.5,,384,0.1,0,
2026-07-06 03:09:23,24957,826.5,782.9,144.6,19.8,164.4,343,30.9,,381,-6.1,-2,
2026-07-06 03:24:44,24957,914.2,864.7,218.4,19.8,238.2,355.8,33.3,,558,87.7,73.8,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-07-06 03:25:33,12334,629,,8.5,,,,,,99,,,POST_REMEDIATION_VERIFY_OK
```
