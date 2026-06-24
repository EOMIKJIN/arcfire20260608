# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-06-24T02:53:43.195Z
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
[2026-06-24 11:53:03] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-06-24 11:53:05] INVESTIGATION start reason=mem_hard_ceiling_playtest
[2026-06-24 11:53:05] INVESTIGATION alert=[2026-06-24 11:53:05] [MEM_HARD_CEILING] pss=948.1MB gl=216.1MB
[2026-06-24 11:53:07] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260624-115305.log
[2026-06-24 11:53:07] INVESTIGATION mem snapshot gl=MB pss=MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260624-115305.log
[2026-06-24 11:53:07] packed D:\arcfire20260607\tools\long-run-monitor\outbox\cursor-incident-handoff.md
[2026-06-24 11:53:07] INVESTIGATION trigger -> .cursor/trigger-incident-auto-fix.json
[2026-06-24 11:53:07] INVESTIGATION done reason=mem_hard_ceiling_playtest
[2026-06-24 11:53:20] AUTO_FIX baseline reset pid=26927 gl=6MB pss=217.5MB
[2026-06-24 11:53:20] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-06-24 11:53:42] VERIFY PASS pid=26927 gl=4.4MB pss=355.7MB views=13
[2026-06-24 11:53:42] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":948.1,"views":388,"lastGlMb":216.1,"hardCeiling":true}
```

## Recent incidents

```
[2026-06-24 11:22:49] PSS_SOFT_CEILING pss=833.5 gl=47.5 views=302 native_reclaim_advisory
[2026-06-24 11:34:10] PROCESS_EXIT clean (no recent crash signature) ??relaunch skipped
[2026-06-24 11:42:55] GL_ELEVATED mounting_or_insufficient_samples gl=121.4 pss=790.1 views=284 restart_held
[2026-06-24 11:53:01] GL_HARD_CEILING gl=216.1 pss=948.1 views=388
[2026-06-24 11:53:01] REFIX_REQUESTED gl_critical_active_hub
[2026-06-24 11:53:07] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
```

## Crash signature (tail)

```
06-23 22:46:19.147 15773 15865 F libc    : Fatal signal 11 (SIGSEGV), code 2 (SEGV_ACCERR), fault addr 0x754e00008b in tid 15865 (mqt_v_js), pid 15773 (.arcfire.online)
06-23 22:46:20.350 18505 18505 F DEBUG   : signal 11 (SIGSEGV), code 2 (SEGV_ACCERR), fault addr 0x000000754e00008b
```

## mem-timeline (tail)

```csv
﻿iso_time,pid,pss_mb,rss_mb,gl_mb,egl_mb,graphics_mb,native_heap_mb,java_heap_mb,threads,views,delta_pss_mb,delta_gl_mb,note
2026-06-24 10:21:25,21100,543,656.9,9,19.8,28.9,273.9,41.5,,98,24.8,0,
2026-06-24 10:31:30,21100,816,932.5,133,40.7,173.6,369.1,37.8,,284,273,124,HUB_ACTIVATION gl_mount_ok
2026-06-24 10:41:38,21100,959.9,1075.1,226.6,19.8,246.4,443,35.1,,293,143.9,93.6,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-06-24 10:42:25,23327,362,,4.4,,,,,,13,,,POST_REMEDIATION_VERIFY_OK
2026-06-24 10:52:27,23327,513.8,627.8,7,19.8,26.8,259.2,25.5,,98,,,
2026-06-24 11:02:33,23327,540.1,654.1,7,19.8,26.8,255.4,42.6,,98,26.3,0,
2026-06-24 11:12:38,23327,757,875.6,46.5,19.8,66.3,397,29.4,,290,216.9,39.5,HUB_ACTIVATION gl_mount_ok
2026-06-24 11:22:43,23327,833.5,948.8,47.5,19.8,67.3,429.8,70.8,,302,76.5,1,PSS_SPIKE review=graphics+native
2026-06-24 11:32:50,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-06-24 11:42:51,26224,790.1,907.7,121.4,40.7,162.1,374.6,28.2,,284,,,
2026-06-24 11:52:56,26224,948.1,1061.8,216.1,19.8,236,452,39,,388,,,
2026-06-24 11:53:42,26927,355.7,,4.4,,,,,,13,,,POST_REMEDIATION_VERIFY_OK
```
