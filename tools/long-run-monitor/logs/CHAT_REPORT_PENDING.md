# [실시간 이상] Arcfire 자동탐지 → 김팀장 P0

**시각 (KST)**: 2026-07-21 08:32:34
**사유**: `mem_anomaly`

| 항목 | 경로 |
|------|------|
| incident handoff | `tools/long-run-monitor/outbox/cursor-incident-handoff.md` |
| Cursor 트리거 | `.cursor/trigger-incident-auto-fix.json` |

## 최근 incidents
```
[2026-07-21 08:14:00] PSS_SOFT_CEILING pss=945.8 gl=152.9 views=559 native_reclaim_advisory
[2026-07-21 08:14:15] DAILY_8AM_REPORT 2026-07-21 08:14:15 KST
[2026-07-21 08:14:15] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260721-0800.md verdict=WARN
[2026-07-21 08:29:29] GL_HARD_CEILING gl=142 pss=1025.5 views=559
[2026-07-21 08:29:29] REFIX_REQUESTED gl_critical_active_hub
[2026-07-21 08:32:33] INVESTIGATION_TRIGGERED mem_anomaly
```

## 최근 remediation
```
[2026-07-21 08:32:33] INVESTIGATION mem from timeline gl=27.8MB pss=604.6MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260721-083231.log
[2026-07-21 08:32:33] packed D:\arcfire20260607\tools\long-run-monitor\outbox\cursor-incident-handoff.md
[2026-07-21 08:32:33] INVESTIGATION trigger -> .cursor/trigger-incident-auto-fix.json
[2026-07-21 08:32:33] INVESTIGATION done reason=mem_anomaly
```

## 권장 (김팀장 즉시)
1. logcat·mem-timeline 근거 원인 특정 → 코드 수정 → tsc
2. 완료: `node tools/long-run-monitor/ack-incident-handoff.cjs`

---
**P0**: 김팀장 — **사용자 Cursor 대화창에 즉시 게시** + handoff 기반 코드 조치. 파일만 남기고 채팅 생략 **금지**.

--- handoff excerpt ---
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
07-17 20:53:26.468 
