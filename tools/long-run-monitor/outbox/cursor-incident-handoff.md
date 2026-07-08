# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-07-08T11:35:32.949Z
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
[2026-07-08 20:33:43] AUTO_FIX static audit:skia-memory start
[2026-07-08 20:33:46] AUTO_FIX audit:skia-memory PASS
[2026-07-08 20:33:46] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-07-08 20:34:04] AUTO_FIX baseline reset pid=17391 gl=6MB pss=196.7MB
[2026-07-08 20:34:04] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-07-08 20:34:26] VERIFY PASS pid=17391 gl=6MB pss=208.5MB views=14
[2026-07-08 20:34:26] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":962.9,"views":559,"lastGlMb":118.1,"hardCeiling":true}
[2026-07-08 20:34:27] HANDOFF packed -> outbox/cursor-incident-handoff.md (Kim Team Lead triage)
[2026-07-08 20:35:30] INVESTIGATION start reason=mem_anomaly
[2026-07-08 20:35:30] INVESTIGATION alert=[2026-07-08 20:33:43] GL_HARD_CEILING gl=118.1 pss=962.9 views=559
[2026-07-08 20:35:31] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260708-203530.log
[2026-07-08 20:35:32] INVESTIGATION mem from timeline gl=6MB pss=208.5MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260708-203530.log
```

## Recent incidents

```
[2026-07-08 19:32:08] PSS_SOFT_CEILING pss=832.5 gl=43.6 views=393 native_reclaim_advisory
[2026-07-08 19:47:31] PSS_SOFT_CEILING pss=847.8 gl=47.6 views=383 native_reclaim_advisory
[2026-07-08 20:02:54] PSS_SOFT_CEILING pss=849.9 gl=47.6 views=378 native_reclaim_advisory
[2026-07-08 20:18:18] PSS_SOFT_CEILING pss=841 gl=48 views=393 native_reclaim_advisory
[2026-07-08 20:33:43] GL_HARD_CEILING gl=118.1 pss=962.9 views=559
[2026-07-08 20:33:43] REFIX_REQUESTED gl_critical_active_hub
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
2026-07-08 17:59:37,32172,733,680.7,31.5,19.8,51.3,328.5,32.1,,360,-24.6,0.8,
2026-07-08 18:15:04,32172,735.8,683.1,32.5,19.8,52.3,331.3,30.8,,358,2.8,1,
2026-07-08 18:30:27,32172,728.4,675.9,29.1,19.8,48.9,327.4,30.1,,354,-7.4,-3.4,
2026-07-08 18:45:51,32172,758.2,709.3,31.3,34.3,65.6,339.9,31.2,,381,29.8,2.2,
2026-07-08 19:01:14,32172,740.3,691.6,31,19.8,50.9,337.2,30.6,,356,-17.9,-0.3,
2026-07-08 19:16:40,32172,748.5,699.8,34.3,19.8,54.2,337.6,33.6,,356,8.2,3.3,
2026-07-08 19:32:03,32172,832.5,782.6,43.6,34.3,77.9,392.6,38.6,,393,84,9.3,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-07-08 19:47:26,32172,847.8,797.9,47.6,34.3,81.9,388,53.1,,383,15.3,4,
2026-07-08 20:02:49,32172,849.9,800.1,47.6,34.3,81.9,389.6,53.4,,378,2.1,0,
2026-07-08 20:18:12,32172,841,789.6,48,40.7,88.7,397.2,27.9,,393,-8.9,0.4,
2026-07-08 20:33:36,32172,962.9,939,118.1,19.8,138,490.3,35.8,,559,121.9,70.1,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-07-08 20:34:26,17391,208.5,,6,,,,,,14,,,POST_REMEDIATION_VERIFY_OK
```
