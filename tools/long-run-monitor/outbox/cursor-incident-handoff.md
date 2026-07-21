# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-07-20T23:32:33.458Z
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
[2026-07-21 08:29:29] AUTO_FIX static audit:skia-memory start
[2026-07-21 08:29:31] AUTO_FIX audit:skia-memory PASS
[2026-07-21 08:29:31] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-07-21 08:29:47] AUTO_FIX baseline reset pid=17868 gl=5.9MB pss=395.4MB
[2026-07-21 08:29:47] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-07-21 08:30:08] VERIFY PASS pid=17868 gl=27.8MB pss=604.6MB views=345
[2026-07-21 08:30:08] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":1025.5,"views":559,"lastGlMb":142,"hardCeiling":true}
[2026-07-21 08:30:08] HANDOFF packed -> outbox/cursor-incident-handoff.md (Kim Team Lead triage)
[2026-07-21 08:32:31] INVESTIGATION start reason=mem_anomaly
[2026-07-21 08:32:31] INVESTIGATION alert=[2026-07-21 08:29:29] GL_HARD_CEILING gl=142 pss=1025.5 views=559
[2026-07-21 08:32:32] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260721-083231.log
[2026-07-21 08:32:33] INVESTIGATION mem from timeline gl=27.8MB pss=604.6MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260721-083231.log
```

## Recent incidents

```
[2026-07-21 08:12:14] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260721-0800.md verdict=WARN
[2026-07-21 08:14:00] PSS_SOFT_CEILING pss=945.8 gl=152.9 views=559 native_reclaim_advisory
[2026-07-21 08:14:15] DAILY_8AM_REPORT 2026-07-21 08:14:15 KST
[2026-07-21 08:14:15] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260721-0800.md verdict=WARN
[2026-07-21 08:29:29] GL_HARD_CEILING gl=142 pss=1025.5 views=559
[2026-07-21 08:29:29] REFIX_REQUESTED gl_critical_active_hub
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
2026-07-21 05:54:51,29524,715.8,695.7,52.7,34.3,87,302.5,39.5,,403,20.9,0.3,
2026-07-21 06:10:15,29524,700.3,679.8,50.4,19.8,70.3,297.6,44,,378,-15.5,-2.3,
2026-07-21 06:25:41,29524,710.6,690.1,50.7,34.3,85,301.9,35.2,,403,10.3,0.3,
2026-07-21 06:41:07,29524,695,674.3,50.4,19.8,70.3,306.4,37.8,,378,-15.6,-0.3,
2026-07-21 06:56:35,29524,716.4,695.7,54.7,34.3,89,301.6,44.8,,395,21.4,4.3,
2026-07-21 07:12:01,29524,828.5,819.8,150,19.8,169.9,351.2,32.9,,560,112.1,95.3,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-07-21 07:27:27,29524,743.1,742.3,52.5,40.7,93.2,340.9,33.4,,307,-85.4,-97.5,GL_RECOVERED idle_ok
2026-07-21 07:42:59,29524,863.3,938.8,157,19.9,176.9,412.1,46.9,,561,120.2,104.5,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-07-21 07:58:28,29524,949.5,1025.3,152.9,19.8,172.7,495.8,46.6,,559,86.2,-4.1,PSS_SPIKE review=graphics+native
2026-07-21 08:13:54,29524,945.8,1020,152.9,19.8,172.7,494.6,45.2,,559,-3.7,0,
2026-07-21 08:29:24,29524,1025.5,1098.5,142,19.8,161.8,584.6,43.3,,559,79.7,-10.9,PSS_SPIKE review=graphics+native
2026-07-21 08:30:08,17868,604.6,,27.8,,,,,,345,,,POST_REMEDIATION_VERIFY_OK
```
