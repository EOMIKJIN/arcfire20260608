# [실시간 이상] Arcfire 자동탐지 → 김팀장 P0

**시각 (KST)**: 2026-07-27 11:37:29
**사유**: `mem_anomaly`

| 항목 | 경로 |
|------|------|
| incident handoff | `tools/long-run-monitor/outbox/cursor-incident-handoff.md` |
| Cursor 트리거 | `.cursor/trigger-incident-auto-fix.json` |

## 최근 incidents
```
[2026-07-27 09:46:45] PSS_SOFT_CEILING pss=828.6 gl=134.1 views=573 native_reclaim_advisory
[2026-07-27 10:02:11] PSS_SOFT_CEILING pss=826.1 gl=134.1 views=573 native_reclaim_advisory
[2026-07-27 10:17:36] PSS_SOFT_CEILING pss=817.4 gl=134.1 views=573 native_reclaim_advisory
[2026-07-27 11:34:53] GL_HARD_CEILING gl=53.5 pss=957.4 views=326
[2026-07-27 11:34:54] REFIX_REQUESTED gl_critical_active_hub
[2026-07-27 11:37:28] INVESTIGATION_TRIGGERED mem_anomaly
```

## 최근 remediation
```
[2026-07-27 11:37:27] INVESTIGATION mem from timeline gl=10.6MB pss=609.4MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260727-113724.log
[2026-07-27 11:37:28] packed D:\arcfire20260607\tools\long-run-monitor\outbox\cursor-incident-handoff.md
[2026-07-27 11:37:28] INVESTIGATION trigger -> .cursor/trigger-incident-auto-fix.json
[2026-07-27 11:37:28] INVESTIGATION done reason=mem_anomaly
```

## 권장 (김팀장 즉시)
1. logcat·mem-timeline 근거 원인 특정 → 코드 수정 → tsc
2. 완료: `node tools/long-run-monitor/ack-incident-handoff.cjs`

---
**P0**: 김팀장 — **사용자 Cursor 대화창에 즉시 게시** + handoff 기반 코드 조치. 파일만 남기고 채팅 생략 **금지**.

--- handoff excerpt ---
# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-07-27T02:37:28.147Z
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
[2026-07-27 11:34:54] AUTO_FIX static audit:skia-memory start
[2026-07-27 11:34:56] AUTO_FIX audit:skia-memory PASS
[2026-07-27 11:34:56] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-07-27 11:35:14] AUTO_FIX baseline reset pid=24122 gl=6MB pss=186MB
[2026-07-27 11:35:14] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-07-27 11:35:35] VERIFY PASS pid=24122 gl=10.6MB pss=609.4MB views=120
[2026-07-27 11:35:35] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":957.4,"views":326,"lastGlMb":53.5,"hardCeiling":true}
[2026-07-27 11:35:37] HANDOFF packed -> outbox/cursor-incident-handoff.md (Kim Team Lead triage)
[2026-07-27 11:37:24] INVESTIGATION start reason=mem_anomaly
[2026-07-27 11:37:24] INVESTIGATION alert=[2026-07-27 11:34:53] GL_HARD_CEILING gl=53.5 pss=957.4 views=326
[2026-07-27 11:37:26] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260727-113724.log
[2026-07-27 11:37:27] INVESTIGATION mem from timeline gl=10.6MB pss=609.4MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260727-113724.log
```

## Recent incidents

```
[2026-07-27 09:16:35] DAILY_8AM_REPORT_FAIL D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260727-0800.md MEMINFO_ERROR — Command failed: adb shell pidof com.arcfire.online
[2026-07-27 09:46:45] PSS_SOFT_CEILING pss=828.6 gl=134.1 views=573 native_reclaim_advisory
[2026-07-27 10:02:11] PSS_SOFT_CEILING pss=826.1 gl=134.1 views=573 native_reclaim_advisory
[2026-07-27 10:17:36] PSS_SOFT_CEILING pss=817.4 gl=134.1 views=573 native_reclaim_advisory
[2026-07-27 11:34:53] GL_HARD_CEILING gl=53.5 pss=957.4 views=326
[2026-07-27 11:34:54] REFIX_REQUESTED gl_critical_active_hub
```

## Crash signature (tail)

```
07-27 11:36:28.429 24122 24235 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=manual 
