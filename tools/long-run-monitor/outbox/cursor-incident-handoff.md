# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-06-23T13:46:41.244Z
triggerReason: arcfire_crash_playtest
refixPayload: (none)

## Mandatory agent action (P0)

1. `arcfire-bug-debug-workflow.mdc` — logcat/crash·remediation VERIFY FAIL 근거로 원인 특정.
2. Skia·허브·STAGE 관련이면 `arcfire-skia-memory-lifecycle.mdc` + `npm run audit:skia-memory`.
3. 코드 수정 후 `npx tsc --noEmit -p tsconfig.client.json`.
4. 런타임 재확인: `manual-mem-snapshot.ps1` 또는 mem-timeline VERIFY PASS 추이.
5. 완료 시 `node tools/long-run-monitor/ack-incident-handoff.cjs` 실행.

## Recent remediation

```
[2026-06-23 20:53:50] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260623-205349.log
[2026-06-23 20:53:50] INVESTIGATION mem snapshot gl=46.7MB pss=992.8MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260623-205349.log
[2026-06-23 20:53:50] packed D:\arcfire20260607\tools\long-run-monitor\outbox\cursor-incident-handoff.md
[2026-06-23 20:53:50] INVESTIGATION trigger -> .cursor/trigger-incident-auto-fix.json
[2026-06-23 20:53:50] INVESTIGATION code-fix handoff only (monitor-paused ??no app relaunch)
[2026-06-23 20:53:53] INVESTIGATION audit:skia-memory completed (paused mode static gate)
[2026-06-23 20:53:53] INVESTIGATION done reason=mem_hard_ceiling_playtest
[2026-06-23 21:23:48] INFO GL_ELEVATED mounting_or_insufficient_samples gl=145.5 pss=775.6 views=939 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-23 22:46:39] INVESTIGATION start reason=arcfire_crash_playtest
[2026-06-23 22:46:39] INVESTIGATION alert=[2026-06-23 22:46:39] [ARCFIRE_CRASH age=0.3m] 06-23 22:46:19.147 15773 15865 F libc    : Fatal signal 11 (SIGSEGV), cod
[2026-06-23 22:46:40] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260623-224639.log
[2026-06-23 22:46:40] INVESTIGATION mem snapshot gl=MB pss=MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260623-224639.log
```

## Recent incidents

```
[2026-06-23 20:43:23] PLAYTEST_START playtest-20260623-204323 interval=10m paused=True
[2026-06-23 20:45:28] INVESTIGATION_TRIGGERED arcfire_crash_playtest
[2026-06-23 20:53:50] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-23 21:23:48] GL_ELEVATED mounting_or_insufficient_samples gl=145.5 pss=775.6 views=939 restart_held
[2026-06-23 21:38:17] PLAYTEST_MILESTONE arcadia_idle_2h_soak_start
[2026-06-23 21:40:57] PLAYTEST_MILESTONE arcadia_idle_codefix_applied
```

## Crash signature (tail)

```
06-23 13:39:51.918 31582 31631 F libc    : Fatal signal 11 (SIGSEGV), code 1 (SEGV_MAPERR), fault addr 0xc0 in tid 31631 (mqt_v_js), pid 31582 (.arcfire.online)
06-23 13:39:52.839 12269 12269 F DEBUG   : signal 11 (SIGSEGV), code 1 (SEGV_MAPERR), fault addr 0x00000000000000c0
06-23 19:42:47.685 20789 20789 F libc    : Fatal signal 11 (SIGSEGV), code 1 (SEGV_MAPERR), fault addr 0x441bc00000000002 in tid 20789 (.arcfire.online), pid 20789 (.arcfire.online)
06-23 19:42:48.662  5861  5861 F DEBUG   : signal 11 (SIGSEGV), code 1 (SEGV_MAPERR), fault addr 0x441bc00000000002
06-23 22:46:19.147 15773 15865 F libc    : Fatal signal 11 (SIGSEGV), code 2 (SEGV_ACCERR), fault addr 0x754e00008b in tid 15865 (mqt_v_js), pid 15773 (.arcfire.online)
06-23 22:46:20.350 18505 18505 F DEBUG   : signal 11 (SIGSEGV), code 2 (SEGV_ACCERR), fault addr 0x000000754e00008b
```

## mem-timeline (tail)

```csv
﻿iso_time,pid,pss_mb,rss_mb,gl_mb,egl_mb,graphics_mb,native_heap_mb,java_heap_mb,threads,views,delta_pss_mb,delta_gl_mb,note
2026-06-23 21:13:40,13585,650.2,785.5,48.3,19.8,68.1,328.1,38.3,,289,,,
2026-06-23 21:23:45,13585,775.6,881.1,145.5,19.8,165.3,352,17.8,,939,,,
2026-06-23 21:33:48,13585,767,873.5,71.4,19.8,91.2,412.1,22.7,,293,-8.6,-74.1,GL_RECOVERED idle_ok
2026-06-23 21:38:17,13585,771.9,878.4,71.4,19.8,91.2,412.1,25.2,,305,4.9,0,PLAYTEST_MILESTONE:arcadia_idle_2h_soak_start
2026-06-23 21:38:21,13585,775.5,882,71.4,19.8,91.2,412.4,28.6,,289,3.6,0,arcadia_idle_2h_soak_baseline
2026-06-23 21:43:52,15773,632.8,774.2,45.8,34.3,80.1,317,27.2,,315,,,
2026-06-23 21:53:57,15773,635,776.5,53.9,19.8,73.8,323.5,23.2,,289,,,
2026-06-23 22:04:02,15773,651.9,793.6,51.9,19.8,71.7,331.8,29.3,,293,16.9,-2,
2026-06-23 22:14:07,15773,669.6,810.1,52.2,34.3,86.5,329.6,27.8,,298,17.7,0.3,
2026-06-23 22:24:11,15773,702.9,844,62.1,40.7,102.7,338.8,31.4,,302,33.3,9.9,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-06-23 22:34:22,15773,666.3,807.4,57.4,19.8,77.2,333.2,25.5,,293,-36.6,-4.7,
2026-06-23 22:44:28,15773,675.2,816.4,57.7,19.8,77.5,336.4,30.9,,293,8.9,0.3,
```
