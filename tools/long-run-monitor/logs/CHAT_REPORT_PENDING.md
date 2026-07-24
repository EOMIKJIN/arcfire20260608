# [실시간 이상] Arcfire 자동탐지 → 김팀장 P0

**시각 (KST)**: 2026-07-24 10:24:11
**사유**: `gl_critical_active_hub`

| 항목 | 경로 |
|------|------|
| incident handoff | `tools/long-run-monitor/outbox/cursor-incident-handoff.md` |
| Cursor 트리거 | `.cursor/trigger-incident-auto-fix.json` |

## 최근 incidents
```
[2026-07-24 08:14:14] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260724-0800.md verdict=OK
[2026-07-24 09:36:49] PSS_SOFT_CEILING pss=855.1 gl=130.1 views=555 native_reclaim_advisory
[2026-07-24 09:52:21] PSS_SOFT_CEILING pss=851.5 gl=130.1 views=555 native_reclaim_advisory
[2026-07-24 10:23:29] GL_HARD_CEILING gl=158.6 pss=1044.8 views=554
[2026-07-24 10:23:29] REFIX_REQUESTED gl_critical_active_hub
[2026-07-24 10:23:53] INVESTIGATION_TRIGGERED mem_anomaly
```

## 최근 remediation
```
[2026-07-24 10:23:53] INVESTIGATION trigger -> .cursor/trigger-incident-auto-fix.json
[2026-07-24 10:23:53] INVESTIGATION done reason=mem_anomaly
[2026-07-24 10:24:10] VERIFY PASS pid=21744 gl=9.5MB pss=591.6MB views=335
[2026-07-24 10:24:10] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":1044.8,"views":554,"lastGlMb":158.6,"hardCeiling":true}
```

## 권장 (김팀장 즉시)
1. logcat·mem-timeline 근거 원인 특정 → 코드 수정 → tsc
2. 완료: `node tools/long-run-monitor/ack-incident-handoff.cjs`

---
**P0**: 김팀장 — **사용자 Cursor 대화창에 즉시 게시** + handoff 기반 코드 조치. 파일만 남기고 채팅 생략 **금지**.

--- handoff excerpt ---
# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-07-24T01:24:11.179Z
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
[2026-07-24 10:23:31] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-07-24 10:23:48] AUTO_FIX baseline reset pid=21744 gl=4.4MB pss=417.1MB
[2026-07-24 10:23:48] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-07-24 10:23:50] INVESTIGATION start reason=mem_anomaly
[2026-07-24 10:23:50] INVESTIGATION alert=[2026-07-24 10:23:29] GL_HARD_CEILING gl=158.6 pss=1044.8 views=554
[2026-07-24 10:23:50] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260724-102350.log
[2026-07-24 10:23:52] INVESTIGATION mem from timeline gl=158.6MB pss=1044.8MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260724-102350.log
[2026-07-24 10:23:53] packed D:\arcfire20260607\tools\long-run-monitor\outbox\cursor-incident-handoff.md
[2026-07-24 10:23:53] INVESTIGATION trigger -> .cursor/trigger-incident-auto-fix.json
[2026-07-24 10:23:53] INVESTIGATION done reason=mem_anomaly
[2026-07-24 10:24:10] VERIFY PASS pid=21744 gl=9.5MB pss=591.6MB views=335
[2026-07-24 10:24:10] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":1044.8,"views":554,"lastGlMb":158.6,"hardCeiling":true}
```

## Recent incidents

```
[2026-07-24 08:14:14] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260724-0800.md verdict=OK
[2026-07-24 09:36:49] PSS_SOFT_CEILING pss=855.1 gl=130.1 views=555 native_reclaim_advisory
[2026-07-24 09:52:21] PSS_SOFT_CEILING pss=851.5 gl=130.1 views=555 native_reclaim_advisory
[2026-07-24 10:23:29] GL_HARD_CEILING gl=158.6 pss=1044.8 views=554
[2026-07-24 10:23:29] REFIX_REQUESTED gl_critical_active_hub
[2026-07-24 10:23:53] INVESTIGATION_TRIGGERED mem_anomaly
```

## Crash signature (tail)

```
07-22 22:50:07.414 26404 26404 F DEBUG   :       #45 pc 0000000000786bcc  /data/app/~~1jBCJoN39z3fV1DQIQtvXg==/com.arcfir
