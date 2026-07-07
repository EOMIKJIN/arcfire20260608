# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-07-07T12:48:00.031Z
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
[2026-07-07 21:43:26] AUTO_FIX static audit:skia-memory start
[2026-07-07 21:43:28] AUTO_FIX audit:skia-memory PASS
[2026-07-07 21:43:28] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-07-07 21:43:46] AUTO_FIX baseline reset pid=27487 gl=6MB pss=193.6MB
[2026-07-07 21:43:46] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-07-07 21:44:07] VERIFY PASS pid=27487 gl=8.6MB pss=505.2MB views=99
[2026-07-07 21:44:07] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":993.5,"views":464,"lastGlMb":110.4,"hardCeiling":true}
[2026-07-07 21:44:08] HANDOFF packed -> outbox/cursor-incident-handoff.md (Kim Team Lead triage)
[2026-07-07 21:47:56] INVESTIGATION start reason=mem_anomaly
[2026-07-07 21:47:56] INVESTIGATION alert=[2026-07-07 21:43:25] GL_HARD_CEILING gl=110.4 pss=993.5 views=464
[2026-07-07 21:47:58] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260707-214756.log
[2026-07-07 21:47:59] INVESTIGATION mem from timeline gl=8.6MB pss=505.2MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260707-214756.log
```

## Recent incidents

```
[2026-07-07 20:26:12] PSS_SOFT_CEILING pss=802.4 gl=129.3 views=363 native_reclaim_advisory
[2026-07-07 20:41:36] PSS_SOFT_CEILING pss=803.1 gl=123.3 views=367 native_reclaim_advisory
[2026-07-07 20:56:59] GL_ELEVATED mounting_or_insufficient_samples gl=110.5 pss=784.6 views=371 restart_held
[2026-07-07 21:12:30] PSS_SOFT_CEILING pss=845.2 gl=113.1 views=383 native_reclaim_advisory
[2026-07-07 21:43:25] GL_HARD_CEILING gl=110.4 pss=993.5 views=464
[2026-07-07 21:43:25] REFIX_REQUESTED gl_critical_active_hub
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
2026-07-07 19:09:12,395,798.2,781.2,127.3,19.8,147.2,329.1,36.4,,367,-13.7,-0.1,
2026-07-07 19:24:34,395,799.9,769.6,129.5,20,149.4,323.8,32.5,,373,1.7,2.2,
2026-07-07 19:39:57,395,809.1,778.9,123.3,19.8,143.1,318,52.5,,371,9.2,-6.2,GL_RECOVERED idle_ok
2026-07-07 19:55:19,395,844.5,813.9,128,40.7,168.6,326.8,51,,390,35.4,4.7,
2026-07-07 20:10:43,395,787.6,757.1,123.3,19.8,143.1,316.8,30.1,,365,-56.9,-4.7,
2026-07-07 20:26:06,395,802.4,771.8,129.3,19.8,149.2,322.6,32.9,,363,14.8,6,
2026-07-07 20:41:29,395,803.1,770.2,123.3,19.8,143.1,323.8,38.4,,367,0.7,-6,GL_RECOVERED idle_ok
2026-07-07 20:56:53,395,784.6,616.1,110.5,19.8,130.3,216.3,37.6,,371,-18.5,-12.8,GL_RECOVERED idle_ok
2026-07-07 21:12:25,395,845.2,677,113.1,40.7,153.8,247.1,36.5,,383,60.6,2.6,PSS_SPIKE review=graphics+native
2026-07-07 21:27:48,395,719.3,626.7,109.3,22,131.3,259.8,39.5,,19,-125.9,-3.8,
2026-07-07 21:43:16,395,993.5,982.8,110.4,19.8,130.2,503.1,43.4,,464,274.2,1.1,PSS_SPIKE review=graphics+native
2026-07-07 21:44:07,27487,505.2,,8.6,,,,,,99,,,POST_REMEDIATION_VERIFY_OK
```
