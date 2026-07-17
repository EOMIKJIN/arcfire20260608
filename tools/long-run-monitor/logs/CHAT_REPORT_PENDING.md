# [실시간 이상] Arcfire 자동탐지 → 김팀장 P0

**시각 (KST)**: 2026-07-17 11:32:16
**사유**: `mem_anomaly`

| 항목 | 경로 |
|------|------|
| incident handoff | `tools/long-run-monitor/outbox/cursor-incident-handoff.md` |
| Cursor 트리거 | `.cursor/trigger-incident-auto-fix.json` |

## 최근 incidents
```
[2026-07-13 12:22:23] PSS_SOFT_CEILING pss=934.1 gl=145.9 views=560 native_reclaim_advisory
[2026-07-13 12:37:44] PSS_SOFT_CEILING pss=935.7 gl=147.9 views=560 native_reclaim_advisory
[2026-07-17 11:31:15] DAILY_8AM_REPORT 2026-07-17 11:31:15 KST
[2026-07-17 11:31:15] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260717-0800.md verdict=OK
[2026-07-17 11:31:25] VIEWS_NATIVE_ADVISORY views=556 native_heap=98.3 pss=433.2 gl=135.2 (node/list retention ??pre-hardceiling early warn)
[2026-07-17 11:32:15] INVESTIGATION_TRIGGERED mem_anomaly
```

## 최근 remediation
```
[2026-07-17 11:32:14] INVESTIGATION mem from timeline gl=135.2MB pss=433.2MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260717-113212.log
[2026-07-17 11:32:15] packed D:\arcfire20260607\tools\long-run-monitor\outbox\cursor-incident-handoff.md
[2026-07-17 11:32:15] INVESTIGATION trigger -> .cursor/trigger-incident-auto-fix.json
[2026-07-17 11:32:15] INVESTIGATION done reason=mem_anomaly
```

## 권장 (김팀장 즉시)
1. logcat·mem-timeline 근거 원인 특정 → 코드 수정 → tsc
2. 완료: `node tools/long-run-monitor/ack-incident-handoff.cjs`

---
**P0**: 김팀장 — **사용자 Cursor 대화창에 즉시 게시** + handoff 기반 코드 조치. 파일만 남기고 채팅 생략 **금지**.

--- handoff excerpt ---
# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-07-17T02:32:14.837Z
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
[2026-07-13 11:05:28] INFO PSS_SOFT_CEILING pss=814.4 gl=43.4 views=380 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-13 11:20:50] INFO PSS_SOFT_CEILING pss=806.8 gl=43.4 views=396 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-13 11:36:12] INFO PSS_SOFT_CEILING pss=929.7 gl=145.9 views=560 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-13 11:51:37] INFO PSS_SOFT_CEILING pss=943.9 gl=145.9 views=560 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-13 12:07:01] INFO PSS_SOFT_CEILING pss=943.7 gl=145.9 views=560 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-13 12:22:23] INFO PSS_SOFT_CEILING pss=934.1 gl=145.9 views=560 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-13 12:37:44] INFO PSS_SOFT_CEILING pss=935.7 gl=147.9 views=560 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-17 11:31:25] INFO VIEWS_NATIVE_ADVISORY views=556 native_heap=98.3 pss=433.2 gl=135.2 -> no restart (native_heap/views �?조기 경보; 리스??가?�화 ?��? 추적)
[2026-07-17 11:32:12] INVESTIGATION start reason=mem_anomaly
[2026-07-17 11:32:12] INVESTIGATION alert=[2026-07-10 21:01:05] GL_HARD_CEILING gl=120.9 pss=1075.4 views=561
[2026-07-17 11:32:12] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260717-113212.log
[2026-07-17 11:32:14] INVESTIGATION mem from timeline gl=135.2MB pss=433.2MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260717-113212.log
```

## Recent incidents

```
[2026-07-13 12:07:01] PSS_SOFT_CEILING pss=943.7 gl=145.9 views=560 native_reclaim_advisory
[2026-07-13 12:22:23] PSS_SOFT_CEILING pss=934.1 gl=145.9 views=560 native_reclaim_advisory
[2026-07-13 12:37:44] PSS_SOFT_CEILING pss=935.7 gl=147.9 views=560 native_reclaim_advisory
[2026-07-17 11:31:15] DAILY_8AM_RE
