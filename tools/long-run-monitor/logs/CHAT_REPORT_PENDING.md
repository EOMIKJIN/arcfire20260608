# [실시간 이상] Arcfire 자동탐지 → 김팀장 P0

**시각 (KST)**: 2026-08-01 22:00:54
**사유**: `mem_anomaly`

| 항목 | 경로 |
|------|------|
| incident handoff | `tools/long-run-monitor/outbox/cursor-incident-handoff.md` |
| Cursor 트리거 | `.cursor/trigger-incident-auto-fix.json` |

## 최근 incidents
```
[2026-08-01 20:55:32] VIEWS_NATIVE_ADVISORY views=581 native_heap=327.9 pss=784.7 gl=140.2 (node/list retention ??pre-hardceiling early warn)
[2026-08-01 21:26:27] PSS_SOFT_CEILING pss=823.1 gl=36.3 views=369 native_reclaim_advisory
[2026-08-01 21:41:54] PSS_SOFT_CEILING pss=936.5 gl=130 views=575 native_reclaim_advisory
[2026-08-01 21:57:20] GL_HARD_CEILING gl=133.8 pss=954.7 views=575
[2026-08-01 21:57:20] REFIX_REQUESTED gl_critical_active_hub
[2026-08-01 22:00:53] INVESTIGATION_TRIGGERED mem_anomaly
```

## 최근 remediation
```
[2026-08-01 22:00:52] INVESTIGATION mem from timeline gl=8.5MB pss=556.8MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260801-220050.log
[2026-08-01 22:00:53] packed D:\arcfire20260607\tools\long-run-monitor\outbox\cursor-incident-handoff.md
[2026-08-01 22:00:53] INVESTIGATION trigger -> .cursor/trigger-incident-auto-fix.json
[2026-08-01 22:00:53] INVESTIGATION done reason=mem_anomaly
```

## 권장 (김팀장 즉시)
1. logcat·mem-timeline 근거 원인 특정 → 코드 수정 → tsc
2. 완료: `node tools/long-run-monitor/ack-incident-handoff.cjs`

---
**P0**: 김팀장 — **사용자 Cursor 대화창에 즉시 게시** + handoff 기반 코드 조치. 파일만 남기고 채팅 생략 **금지**.

--- handoff excerpt ---
# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-08-01T13:00:52.953Z
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
[2026-08-01 21:57:20] AUTO_FIX static audit:skia-memory start
[2026-08-01 21:57:23] AUTO_FIX audit:skia-memory PASS
[2026-08-01 21:57:23] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-08-01 21:57:42] AUTO_FIX baseline reset pid=7103 gl=6MB pss=199.1MB
[2026-08-01 21:57:42] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-08-01 21:58:03] VERIFY PASS pid=7103 gl=8.5MB pss=556.8MB views=99
[2026-08-01 21:58:03] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":954.7,"views":575,"lastGlMb":133.8,"hardCeiling":true}
[2026-08-01 21:58:04] HANDOFF packed -> outbox/cursor-incident-handoff.md (Kim Team Lead triage)
[2026-08-01 22:00:50] INVESTIGATION start reason=mem_anomaly
[2026-08-01 22:00:50] INVESTIGATION alert=[2026-08-01 21:57:20] GL_HARD_CEILING gl=133.8 pss=954.7 views=575
[2026-08-01 22:00:51] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260801-220050.log
[2026-08-01 22:00:52] INVESTIGATION mem from timeline gl=8.5MB pss=556.8MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260801-220050.log
```

## Recent incidents

```
[2026-08-01 20:40:04] VIEWS_NATIVE_ADVISORY views=581 native_heap=327.9 pss=784.7 gl=140.2 (node/list retention ??pre-hardceiling early warn)
[2026-08-01 20:55:32] VIEWS_NATIVE_ADVISORY views=581 native_heap=327.9 pss=784.7 gl=140.2 (node/list retention ??pre-hardceiling early warn)
[2026-08-01 21:26:27] PSS_SOFT_CEILING pss=823.1 gl=36.3 views=369 native_reclaim_advisory
[2026-08-01 21:41:54] PSS_SOFT_CEILING pss=936.5 gl=130 views=575 native_reclaim_advisory
[2026-08-01 21:57:20] GL_HARD_CEILING gl=133.8 pss=954.7 views=575
[2026-08-01 21:57:20] REFIX_REQUESTED gl_critical_active_hub
```

## Crash signature (tail)

```
08-01 21:59:18.678  7476  7569 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=deep_reclaim her
