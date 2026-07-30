# [실시간 이상] Arcfire 자동탐지 → 김팀장 P0

**시각 (KST)**: 2026-07-30 09:01:16
**사유**: `gl_critical_active_hub`

| 항목 | 경로 |
|------|------|
| incident handoff | `tools/long-run-monitor/outbox/cursor-incident-handoff.md` |
| Cursor 트리거 | `.cursor/trigger-incident-auto-fix.json` |

## 최근 incidents
```
[2026-07-30 08:14:10] VIEWS_NATIVE_ADVISORY views=576 native_heap=276.4 pss=780.4 gl=125.3 (node/list retention ??pre-hardceiling early warn)
[2026-07-30 08:14:13] DAILY_8AM_REPORT 2026-07-30 08:14:13 KST
[2026-07-30 08:14:13] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260730-0800.md verdict=OK
[2026-07-30 08:29:36] VIEWS_NATIVE_ADVISORY views=577 native_heap=276.5 pss=776.7 gl=123.4 (node/list retention ??pre-hardceiling early warn)
[2026-07-30 08:45:01] VIEWS_NATIVE_ADVISORY views=577 native_heap=273.5 pss=779 gl=125.5 (node/list retention ??pre-hardceiling early warn)
[2026-07-30 09:00:27] REFIX_REQUESTED gl_critical_active_hub
```

## 최근 remediation
```
[2026-07-30 09:00:55] AUTO_FIX baseline reset pid=29392 gl=6MB pss=210.6MB
[2026-07-30 09:00:55] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-07-30 09:01:15] VERIFY PASS pid=29392 gl=8.5MB pss=710.7MB views=99
[2026-07-30 09:01:15] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":1001.9,"views":578,"lastGlMb":131.1,"hardCeiling":true}
```

## 권장 (김팀장 즉시)
1. logcat·mem-timeline 근거 원인 특정 → 코드 수정 → tsc
2. 완료: `node tools/long-run-monitor/ack-incident-handoff.cjs`

---
**P0**: 김팀장 — **사용자 Cursor 대화창에 즉시 게시** + handoff 기반 코드 조치. 파일만 남기고 채팅 생략 **금지**.

--- handoff excerpt ---
# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-07-30T00:01:16.087Z
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
[2026-07-30 08:14:10] INFO VIEWS_NATIVE_ADVISORY views=576 native_heap=276.4 pss=780.4 gl=125.3 -> no restart (native_heap/views �?조기 경보; 리스??가?�화 ?��? 추적)
[2026-07-30 08:29:36] INFO VIEWS_NATIVE_ADVISORY views=577 native_heap=276.5 pss=776.7 gl=123.4 -> no restart (native_heap/views �?조기 경보; 리스??가?�화 ?��? 추적)
[2026-07-30 08:45:01] INFO VIEWS_NATIVE_ADVISORY views=577 native_heap=273.5 pss=779 gl=125.5 -> no restart (native_heap/views �?조기 경보; 리스??가?�화 ?��? 추적)
[2026-07-30 09:00:27] INCIDENT GL_HARD_CEILING gl=131.1 pss=1001.9 views=578 -> immediate remediation (OOM imminent)
[2026-07-30 09:00:27] REFIX_REQUESTED gl_critical_active_hub -> gl-leak-refix-requested.flag
[2026-07-30 09:00:27] AUTO_FIX static audit:skia-memory start
[2026-07-30 09:00:30] AUTO_FIX audit:skia-memory PASS
[2026-07-30 09:00:30] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-07-30 09:00:55] AUTO_FIX baseline reset pid=29392 gl=6MB pss=210.6MB
[2026-07-30 09:00:55] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-07-30 09:01:15] VERIFY PASS pid=29392 gl=8.5MB pss=710.7MB views=99
[2026-07-30 09:01:15] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":1001.9,"views":578,"lastGlMb":131.1,"hardCeiling":true}
```

## Recent incidents

```
[2026-07-30 08:14:10] VIEWS_NATIVE_ADVISORY views=576 native_heap=276.4 pss=780.4 gl=125.3 (node/list retention ??pre-hardceiling early warn)
[2026-07-30 08:14:13] DAILY_8AM_REPORT 2026-07-30 08:14:13 KST
[2026-07-30 08:14:13] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260730-0800.md verdict=OK
[2026-07-30 08:29:36] VIEWS_NATIVE_ADVISORY views=577 native_heap=276.5 pss=776.7 gl=123.4 (node/list retention ??pre-hardceiling early warn)
[2026-07-30 08:45:01] VIEWS_NATIVE_ADVISORY views=577 native_heap=273.5 pss=779 gl=125.5 (node/list retention ??pre-h
