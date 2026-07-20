# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-07-20T08:37:09.489Z
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
[2026-07-20 17:32:29] AUTO_FIX static audit:skia-memory start
[2026-07-20 17:32:32] AUTO_FIX audit:skia-memory PASS
[2026-07-20 17:32:32] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-07-20 17:32:49] AUTO_FIX baseline reset pid=7743 gl=5.9MB pss=325.3MB
[2026-07-20 17:32:49] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-07-20 17:33:10] VERIFY PASS pid=7743 gl=8.7MB pss=635.9MB views=99
[2026-07-20 17:33:10] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":983.2,"views":571,"lastGlMb":137.4,"hardCeiling":true}
[2026-07-20 17:33:11] HANDOFF packed -> outbox/cursor-incident-handoff.md (Kim Team Lead triage)
[2026-07-20 17:37:06] INVESTIGATION start reason=mem_anomaly
[2026-07-20 17:37:06] INVESTIGATION alert=[2026-07-20 17:32:29] GL_HARD_CEILING gl=137.4 pss=983.2 views=571
[2026-07-20 17:37:07] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260720-173706.log
[2026-07-20 17:37:09] INVESTIGATION mem from timeline gl=8.7MB pss=635.9MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260720-173706.log
```

## Recent incidents

```
[2026-07-20 13:56:25] PSS_SOFT_CEILING pss=814.7 gl=115.8 views=569 native_reclaim_advisory
[2026-07-20 16:46:14] PSS_SOFT_CEILING pss=845.2 gl=50.2 views=312 native_reclaim_advisory
[2026-07-20 17:01:38] PSS_SOFT_CEILING pss=854.2 gl=59.8 views=494 native_reclaim_advisory
[2026-07-20 17:17:03] PSS_SOFT_CEILING pss=849.9 gl=59.8 views=361 native_reclaim_advisory
[2026-07-20 17:32:29] GL_HARD_CEILING gl=137.4 pss=983.2 views=571
[2026-07-20 17:32:29] REFIX_REQUESTED gl_critical_active_hub
```

## Crash signature (tail)

```
07-17 20:53:26.468 16902 17002 I ReactNativeJS: [intro-diag] MOUNT scene=intro01 flow=preNickname
07-17 20:53:26.468 16902 17002 I ReactNativeJS: [intro-diag] page=0 seg=0
07-17 20:53:26.468 16902 17002 I ReactNativeJS: [intro-diag] player=null
07-17 20:53:27.677 16902 17002 I ReactNativeJS: [ArcCore/RTDB] boot sync skip (offline)
07-17 20:54:00.615 16902 17002 I ReactNativeJS: [intro-diag] CinematicScene text change len=57 pageKey=1
07-17 20:54:00.615 16902 17002 I ReactNativeJS: [intro-diag] fade restart pageKey=1
07-17 20:54:00.620 16902 17002 I ReactNativeJS: [intro-diag] page=1 seg=0
07-17 20:54:04.152 16902 17002 I ReactNativeJS: [intro-diag] CinematicScene text change len=63 pageKey=2
07-17 20:54:04.152 16902 17002 I ReactNativeJS: [intro-diag] fade restart pageKey=2
07-17 20:54:04.155 16902 17002 I ReactNativeJS: [intro-diag] page=2 seg=0
07-17 20:54:08.453 16902 17002 I ReactNativeJS: [intro-diag] CinematicScene text change len=65 pageKey=3
07-17 20:54:08.453 16902 17002 I ReactNativeJS: [intro-diag] fade restart pageKey=3
07-17 20:54:08.457 16902 17002 I ReactNativeJS: [intro-diag] page=3 seg=0
07-17 20:54:12.550 16902 17002 I ReactNativeJS: [intro-diag] CinematicScene text change len=39 pageKey=4
07-17 20:54:12.550 16902 17002 I ReactNativeJS: [intro-diag] fade restart pageKey=4
07-17 20:54:12.554 16902 17002 I ReactNativeJS: [intro-diag] page=4 seg=0
07-17 20:54:15.838 16902 17002 I ReactNativeJS: [intro-diag] UNMOUNT
07-17 20:54:15.838 16902 17002 I ReactNativeJS: [intro-diag] StageShell(intro) UNMOUNT
07-17 20:54:15.839 16902 17002 I ReactNativeJS: [intro-diag] CinematicScene UNMOUNT pageKey=0

```

## mem-timeline (tail)

```csv
﻿iso_time,pid,pss_mb,rss_mb,gl_mb,egl_mb,graphics_mb,native_heap_mb,java_heap_mb,threads,views,delta_pss_mb,delta_gl_mb,note
2026-07-20 14:58:08,25277,715.6,726.8,31.5,19.8,51.4,338.5,33.8,,361,9.4,6.1,
2026-07-20 15:13:33,25277,712.9,724.2,29.5,19.8,49.4,334,37.5,,354,-2.7,-2,
2026-07-20 15:29:00,25277,719.9,731,31.5,19.8,51.4,339.8,36.3,,354,7,2,
2026-07-20 15:44:25,25277,723.7,734.9,29.5,19.8,49.4,345.5,36.4,,361,3.8,-2,
2026-07-20 15:59:52,25277,748.2,759.3,30.2,40.7,70.8,343.8,40.6,,384,24.5,0.7,
2026-07-20 16:15:17,25277,726.3,735.9,29.5,19.8,49.4,340.2,42.3,,361,-21.9,-0.7,
2026-07-20 16:30:42,25277,727.8,738.4,29.5,19.8,49.4,346.8,37.9,,354,1.5,0,
2026-07-20 16:46:08,25277,845.2,860,50.2,40.7,90.8,399.9,30.6,,312,117.4,20.7,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-07-20 17:01:33,25277,854.2,869.4,59.8,19.8,79.7,418.8,41.5,,494,9,9.6,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-07-20 17:16:58,25277,849.9,865.2,59.8,19.8,79.7,410.1,48.6,,361,-4.3,0,
2026-07-20 17:32:21,25277,983.2,486.9,137.4,19.8,157.2,154.1,15.7,,571,133.3,77.6,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-07-20 17:33:10,7743,635.9,,8.7,,,,,,99,,,POST_REMEDIATION_VERIFY_OK
```
