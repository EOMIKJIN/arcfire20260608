# [실시간 이상] Arcfire 자동탐지 → 김팀장 P0

**시각 (KST)**: 2026-06-28 23:17:10
**사유**: `test_flash`

| 항목 | 경로 |
|------|------|
| incident handoff | `tools/long-run-monitor/outbox/cursor-incident-handoff.md` |
| Cursor 트리거 | `.cursor/trigger-incident-auto-fix.json` |

## 최근 incidents
```
[2026-06-28 19:39:36] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-28 19:50:02] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-28 21:14:43] INVESTIGATION_TRIGGERED mem_anomaly
[2026-06-28 21:22:44] GL_ELEVATED mounting_or_insufficient_samples gl=108.8 pss=784.7 views=567 restart_held
[2026-06-28 22:00:01] EVENING_WATCH_2200_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\evening-watch-report-20260628-2200.md
[2026-06-28 22:14:28] GL_ELEVATED mounting_or_insufficient_samples gl=126 pss=752.6 views=558 restart_held
```

## 최근 remediation
```
[2026-06-28 21:14:47] INVESTIGATION audit:skia-memory completed (paused mode static gate)
[2026-06-28 21:14:47] INVESTIGATION done reason=mem_anomaly
[2026-06-28 21:22:44] INFO GL_ELEVATED mounting_or_insufficient_samples gl=108.8 pss=784.7 views=567 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-28 22:14:28] INFO GL_ELEVATED mounting_or_insufficient_samples gl=126 pss=752.6 views=558 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
```

## 권장 (김팀장 즉시)
1. logcat·mem-timeline 근거 원인 특정 → 코드 수정 → tsc
2. 완료: `node tools/long-run-monitor/ack-incident-handoff.cjs`

---
**P0**: 김팀장 — **사용자 Cursor 대화창에 즉시 게시** + handoff 기반 코드 조치. 파일만 남기고 채팅 생략 **금지**.

--- handoff excerpt ---
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

## Crash signat
