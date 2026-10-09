# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-10-08T16:10:50.200Z
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
[2026-10-09 01:05:58] AUTO_FIX static audit:skia-memory start
[2026-10-09 01:06:01] AUTO_FIX audit:skia-memory PASS
[2026-10-09 01:06:01] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-10-09 01:06:18] AUTO_FIX baseline reset pid=9481 gl=2.7MB pss=324.6MB
[2026-10-09 01:06:18] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-10-09 01:06:39] VERIFY PASS pid=9481 gl=18.1MB pss=567.6MB views=99
[2026-10-09 01:06:39] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":1038.3,"views":393,"lastGlMb":383.8,"hardCeiling":true}
[2026-10-09 01:06:41] HANDOFF packed -> outbox/cursor-incident-handoff.md (Kim Team Lead triage)
[2026-10-09 01:10:47] INVESTIGATION start reason=mem_anomaly
[2026-10-09 01:10:47] INVESTIGATION alert=[2026-10-09 01:05:58] GL_HARD_CEILING gl=383.8 pss=1038.3 views=393
[2026-10-09 01:10:47] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20261009-011047.log
[2026-10-09 01:10:49] INVESTIGATION mem from timeline gl=18.1MB pss=567.6MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20261009-011047.log
```

## Recent incidents

```
[2026-10-09 00:34:58] INVESTIGATION_TRIGGERED mem_anomaly
[2026-10-09 00:49:09] GL_HARD_CEILING gl=335.5 pss=1025.1 views=415
[2026-10-09 00:49:10] REFIX_REQUESTED gl_critical_active_hub
[2026-10-09 00:50:22] INVESTIGATION_TRIGGERED mem_anomaly
[2026-10-09 01:05:58] GL_HARD_CEILING gl=383.8 pss=1038.3 views=393
[2026-10-09 01:05:58] REFIX_REQUESTED gl_critical_active_hub
```

## Crash signature (tail)

```
10-09 01:09:37.685  9481  9600 I ReactNativeJS: '[arc-hitch] settle', 'convoy_plan', 47
10-09 01:09:40.965  9481  9600 I ReactNativeJS: '[arc-hitch] tick', 'arc_core_spy_subcore', 36
10-09 01:09:47.072  9481  9600 I ReactNativeJS: '[arc-hitch] tick', 'arc_core_spy_subcore', 37
10-09 01:09:49.085  9481  9600 I ReactNativeJS: '[arc-hitch] tick', 'arc_core_spy_subcore', 32
10-09 01:09:52.117  9481  9600 I ReactNativeJS: '[arc-hitch] tick', 'arc_core_spy_subcore', 32
10-09 01:10:12.304  9481  9600 I ReactNativeJS: '[arc-hitch] settle', 'convoy_plan', 77
10-09 01:10:19.615  9481  9600 I ReactNativeJS: '[arc-hitch] settle', 'convoy_plan', 79
10-09 01:10:20.457  9481  9600 I ReactNativeJS: '[arc-hitch] tick', 'arc_core_spy_subcore', 33
10-09 01:10:23.525  9481  9600 I ReactNativeJS: '[arc-hitch] tick', 'arc_core_spy_subcore', 35
10-09 01:10:26.576  9481  9600 I ReactNativeJS: '[arc-hitch] tick', 'arc_core_spy_subcore', 35
10-09 01:10:29.625  9481  9600 I ReactNativeJS: '[arc-hitch] tick', 'arc_core_spy_subcore', 33
10-09 01:10:31.637  9481  9600 I ReactNativeJS: '[arc-hitch] tick', 'arc_core_spy_subcore', 30
10-09 01:10:32.653  9481  9600 I ReactNativeJS: '[arc-hitch] tick', 'arc_core_spy_subcore', 45
10-09 01:10:34.093  9481  9600 I ReactNativeJS: '[arc-hitch] tick', 'ai_npc_subcore', 42
10-09 01:10:35.693  9481  9600 I ReactNativeJS: '[arc-hitch] tick', 'arc_core_spy_subcore', 34
10-09 01:10:39.477  9481  9600 I ReactNativeJS: '[arc-hitch] settle', 'convoy_plan', 51
10-09 01:10:39.525  9481  9600 I ReactNativeJS: '[arc-hitch] settle', 'convoy_plan', 40
10-09 01:10:45.858  9481  9600 I ReactNativeJS: '[arc-hitch] tick', 'arc_core_spy_subcore', 33
10-09 01:10:48.909  9481  9600 I ReactNativeJS: '[arc-hitch] tick', 'arc_core_spy_subcore', 31

```

## mem-timeline (tail)

```csv
﻿iso_time,pid,pss_mb,rss_mb,gl_mb,egl_mb,graphics_mb,native_heap_mb,java_heap_mb,threads,views,delta_pss_mb,delta_gl_mb,note
2026-10-08 23:21:40,25922,520.7,652.6,17.8,19.8,37.6,280.4,42.5,,99,,,
2026-10-08 23:37:52,27318,1009.5,1142.5,294.6,43.3,337.9,417.3,37.5,,377,,,
2026-10-08 23:43:01,28266,497.8,,5.4,,,,,,110,,,POST_REMEDIATION_VERIFY_OK
2026-10-08 23:59:01,29253,1054.4,1192.5,344.7,28,372.7,435.1,40,,387,,,
2026-10-08 23:59:49,31460,577,,17.9,,,,,,99,,,POST_REMEDIATION_VERIFY_OK
2026-10-09 00:15:49,31460,,,,,,,,,0,,,
2026-10-09 00:31:59,1119,1083.7,1224.2,430.9,43.3,474.3,372,42.1,,410,,,
2026-10-09 00:32:57,3439,598.4,,17.9,,,,,,99,,,POST_REMEDIATION_VERIFY_OK
2026-10-09 00:48:59,3439,1025.1,1002.7,335.5,43.3,378.8,244.6,33.6,,415,,,
2026-10-09 00:49:49,7138,586.3,,5.5,,,,,,565,,,POST_REMEDIATION_VERIFY_OK
2026-10-09 01:05:49,7138,1038.3,1060.3,383.8,43.3,427.2,270.9,33.5,,393,,,
2026-10-09 01:06:39,9481,567.6,,18.1,,,,,,99,,,POST_REMEDIATION_VERIFY_OK
```
