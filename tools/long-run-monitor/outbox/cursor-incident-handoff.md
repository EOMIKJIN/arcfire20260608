# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-06-22T14:31:19.645Z
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
[2026-06-22 00:05:39] HANDOFF packed -> outbox/cursor-incident-handoff.md (Kim Team Lead triage)
[2026-06-22 13:05:18] INFO GL_ELEVATED mounting_or_insufficient_samples gl=140.6 pss=749.6 views=933 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-22 20:36:16] INFO GL_ELEVATED mounting_or_insufficient_samples gl=152.1 pss=885.1 views=943 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-22 23:30:35] INCIDENT GL_HARD_CEILING gl=152.4 pss=1029.9 views=929 -> immediate remediation (OOM imminent)
[2026-06-22 23:30:35] REFIX_REQUESTED gl_critical_active_hub -> gl-leak-refix-requested.flag
[2026-06-22 23:30:35] AUTO_FIX static audit:skia-memory start
[2026-06-22 23:30:38] AUTO_FIX audit:skia-memory PASS
[2026-06-22 23:30:38] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-06-22 23:30:57] AUTO_FIX baseline reset pid=21849 gl=6MB pss=206.1MB
[2026-06-22 23:30:57] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-06-22 23:31:19] VERIFY PASS pid=21849 gl=4.4MB pss=390.1MB views=15
[2026-06-22 23:31:19] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":1029.9,"views":929,"lastGlMb":152.4,"hardCeiling":true}
```

## Recent incidents

```
[2026-06-22 00:04:59] GL_HARD_CEILING gl=218.1 pss=853.4 views=934
[2026-06-22 00:04:59] REFIX_REQUESTED gl_critical_active_hub
[2026-06-22 13:05:18] GL_ELEVATED mounting_or_insufficient_samples gl=140.6 pss=749.6 views=933 restart_held
[2026-06-22 20:36:16] GL_ELEVATED mounting_or_insufficient_samples gl=152.1 pss=885.1 views=943 restart_held
[2026-06-22 23:30:35] GL_HARD_CEILING gl=152.4 pss=1029.9 views=929
[2026-06-22 23:30:35] REFIX_REQUESTED gl_critical_active_hub
```

## Crash signature (tail)

```
06-22 09:56:08.920 20400  7764 F libc    : Fatal signal 11 (SIGSEGV), code 1 (SEGV_MAPERR), fault addr 0x0 in tid 7764 (hades), pid 20400 (.arcfire.online)
06-22 09:56:10.044  7849  7849 F DEBUG   : signal 11 (SIGSEGV), code 1 (SEGV_MAPERR), fault addr 0x0000000000000000
06-22 18:17:59.465  3866  4534 F libc    : Fatal signal 11 (SIGSEGV), code 1 (SEGV_MAPERR), fault addr 0x6001600000400 in tid 4534 (hades), pid 3866 (.arcfire.online)
06-22 18:18:00.567  5200  5200 F DEBUG   : signal 11 (SIGSEGV), code 1 (SEGV_MAPERR), fault addr 0x0006001600000400
```

## mem-timeline (tail)

```csv
﻿iso_time,pid,pss_mb,rss_mb,gl_mb,egl_mb,graphics_mb,native_heap_mb,java_heap_mb,threads,views,delta_pss_mb,delta_gl_mb,note
2026-06-22 21:00:05,6506,759.2,786,41,19.8,60.8,464.6,23.1,,98,-125.9,-111.1,GL_RECOVERED idle_ok
2026-06-22 21:06:16,6506,798.2,825.1,52,34.3,86.3,444.3,28.7,,315,39,11,HUB_ACTIVATION gl_mount_ok
2026-06-22 21:30:09,6506,788,815.4,54,19.8,73.9,443.7,27,,313,-10.2,2,
2026-06-22 21:36:20,6506,697.6,672.5,42.9,19.8,62.7,302.1,37.6,,15,-90.4,-11.1,GL_RECOVERED idle_ok
2026-06-22 22:00:15,6506,592.4,551.4,41.1,22,63.1,220.2,33.6,,15,-105.2,-1.8,
2026-06-22 22:06:26,6506,853.7,775.8,52,19.8,71.8,402,24,,294,261.3,10.9,HUB_ACTIVATION gl_mount_ok
2026-06-22 22:30:22,6506,891.9,767.5,59.2,30.2,89.5,376.9,25.9,,323,38.2,7.2,
2026-06-22 22:36:32,6506,885.5,761.2,61.1,19.8,80.9,374,27.6,,314,-6.4,1.9,
2026-06-22 23:00:27,6506,930,806,61.7,40.7,102.4,382.4,35.7,,347,44.5,0.6,PSS_SPIKE review=graphics+native
2026-06-22 23:06:37,6506,903.1,779.1,61.1,19.8,80.9,382.7,29.8,,314,-26.9,-0.6,
2026-06-22 23:30:31,6506,1029.9,906.3,152.4,19.8,172.2,424.2,28.9,,929,126.8,91.3,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-06-22 23:31:19,21849,390.1,,4.4,,,,,,15,,,POST_REMEDIATION_VERIFY_OK
```
