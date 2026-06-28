# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-06-28T14:17:10.718Z
triggerReason: test_flash
refixPayload: (none)

## Mandatory agent action (P0)

1. `arcfire-bug-debug-workflow.mdc` — logcat/crash·remediation VERIFY FAIL 근거로 원인 특정.
2. Skia·허브·STAGE 관련이면 `arcfire-skia-memory-lifecycle.mdc` + `npm run audit:skia-memory`.
3. 코드 수정 후 `npx tsc --noEmit -p tsconfig.client.json`.
4. 런타임 재확인: `manual-mem-snapshot.ps1` 또는 mem-timeline VERIFY PASS 추이.
5. 완료 시 `node tools/long-run-monitor/ack-incident-handoff.cjs` 실행.

## Recent remediation

```
[2026-06-28 19:50:04] INVESTIGATION done reason=mem_hard_ceiling_playtest
[2026-06-28 21:14:40] INVESTIGATION start reason=mem_anomaly
[2026-06-28 21:14:41] INVESTIGATION alert=[2026-06-25 08:51:20] GL_HARD_CEILING gl=228.9 pss=991.1 views=947
[2026-06-28 21:14:41] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260628-211441.log
[2026-06-28 21:14:42] INVESTIGATION mem snapshot gl=35.3MB pss=704.8MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260628-211441.log
[2026-06-28 21:14:43] packed D:\arcfire20260607\tools\long-run-monitor\outbox\cursor-incident-handoff.md
[2026-06-28 21:14:43] INVESTIGATION trigger -> .cursor/trigger-incident-auto-fix.json
[2026-06-28 21:14:43] INVESTIGATION code-fix handoff only (monitor-paused ??no app relaunch)
[2026-06-28 21:14:47] INVESTIGATION audit:skia-memory completed (paused mode static gate)
[2026-06-28 21:14:47] INVESTIGATION done reason=mem_anomaly
[2026-06-28 21:22:44] INFO GL_ELEVATED mounting_or_insufficient_samples gl=108.8 pss=784.7 views=567 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-28 22:14:28] INFO GL_ELEVATED mounting_or_insufficient_samples gl=126 pss=752.6 views=558 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
```

## Recent incidents

```
[2026-06-28 19:39:36] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-28 19:50:02] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-28 21:14:43] INVESTIGATION_TRIGGERED mem_anomaly
[2026-06-28 21:22:44] GL_ELEVATED mounting_or_insufficient_samples gl=108.8 pss=784.7 views=567 restart_held
[2026-06-28 22:00:01] EVENING_WATCH_2200_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\evening-watch-report-20260628-2200.md
[2026-06-28 22:14:28] GL_ELEVATED mounting_or_insufficient_samples gl=126 pss=752.6 views=558 restart_held
```

## Crash signature (tail)

```
(no crash snippet)
```

## mem-timeline (tail)

```csv
﻿iso_time,pid,pss_mb,rss_mb,gl_mb,egl_mb,graphics_mb,native_heap_mb,java_heap_mb,threads,views,delta_pss_mb,delta_gl_mb,note
2026-06-28 21:22:36,10107,784.7,900.6,108.8,19.8,128.6,389,31.1,,567,107.1,74.1,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-06-28 21:33:00,15084,666.6,796.4,43.9,40.7,84.5,339.8,23.6,,383,,,
2026-06-28 21:34:52,15084,643.3,773.1,43.3,19.8,63.1,333.8,26.8,,374,,,
2026-06-28 21:43:18,15084,599.8,730.1,16.9,19.8,36.7,330.4,25,,99,-43.5,-26.4,GL_RECOVERED idle_ok
2026-06-28 21:53:43,15084,441.2,486.1,11.2,19.8,31,206.1,16.5,,13,-158.6,-5.7,GL_RECOVERED idle_ok
2026-06-28 22:04:05,15084,566,611.7,12.2,19.8,32.1,324.3,24.8,,99,124.8,1,PSS_SPIKE review=graphics+native
2026-06-28 22:05:09,15084,564.3,609.9,12.2,19.8,32.1,324.2,23.1,,99,-1.7,0,
2026-06-28 22:14:23,15084,752.6,789.2,126,19.8,145.8,364.9,27.8,,558,188.3,113.8,HUB_ACTIVATION gl_mount_ok
2026-06-28 22:27:46,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-06-28 22:42:54,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-06-28 22:57:55,23252,729.8,785.6,48.2,19.8,68.1,370.1,25.9,,361,,,
2026-06-28 23:13:16,23252,743.8,689.8,48.2,19.8,68.1,275.2,27,,382,,,
```
