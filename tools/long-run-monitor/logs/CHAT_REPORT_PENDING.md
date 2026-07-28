# [실시간 이상] Arcfire 자동탐지 → 김팀장 P0

**시각 (KST)**: 2026-07-28 21:03:25
**사유**: `mem_anomaly`

| 항목 | 경로 |
|------|------|
| incident handoff | `tools/long-run-monitor/outbox/cursor-incident-handoff.md` |
| Cursor 트리거 | `.cursor/trigger-incident-auto-fix.json` |

## 최근 incidents
```
[2026-07-28 20:14:19] VIEWS_NATIVE_ADVISORY views=572 native_heap=315.9 pss=734 gl=125.5 (node/list retention ??pre-hardceiling early warn)
[2026-07-28 20:29:44] VIEWS_NATIVE_ADVISORY views=572 native_heap=316.2 pss=733.8 gl=125.5 (node/list retention ??pre-hardceiling early warn)
[2026-07-28 20:45:09] VIEWS_NATIVE_ADVISORY views=644 native_heap=351.9 pss=797.4 gl=100.4 (node/list retention ??pre-hardceiling early warn)
[2026-07-28 21:00:40] GL_HARD_CEILING gl=126 pss=1024.3 views=572
[2026-07-28 21:00:40] REFIX_REQUESTED gl_critical_active_hub
[2026-07-28 21:03:24] INVESTIGATION_TRIGGERED mem_anomaly
```

## 최근 remediation
```
[2026-07-28 21:03:24] INVESTIGATION mem from timeline gl=8.5MB pss=613.4MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260728-210320.log
[2026-07-28 21:03:24] packed D:\arcfire20260607\tools\long-run-monitor\outbox\cursor-incident-handoff.md
[2026-07-28 21:03:24] INVESTIGATION trigger -> .cursor/trigger-incident-auto-fix.json
[2026-07-28 21:03:24] INVESTIGATION done reason=mem_anomaly
```

## 권장 (김팀장 즉시)
1. logcat·mem-timeline 근거 원인 특정 → 코드 수정 → tsc
2. 완료: `node tools/long-run-monitor/ack-incident-handoff.cjs`

---
**P0**: 김팀장 — **사용자 Cursor 대화창에 즉시 게시** + handoff 기반 코드 조치. 파일만 남기고 채팅 생략 **금지**.

--- handoff excerpt ---
# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-07-28T12:03:24.370Z
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
[2026-07-28 21:00:40] AUTO_FIX static audit:skia-memory start
[2026-07-28 21:00:42] AUTO_FIX audit:skia-memory PASS
[2026-07-28 21:00:42] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-07-28 21:00:59] AUTO_FIX baseline reset pid=8652 gl=6MB pss=206.8MB
[2026-07-28 21:01:00] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-07-28 21:01:21] VERIFY PASS pid=8652 gl=8.5MB pss=613.4MB views=99
[2026-07-28 21:01:21] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":1024.3,"views":572,"lastGlMb":126,"hardCeiling":true}
[2026-07-28 21:01:22] HANDOFF packed -> outbox/cursor-incident-handoff.md (Kim Team Lead triage)
[2026-07-28 21:03:20] INVESTIGATION start reason=mem_anomaly
[2026-07-28 21:03:20] INVESTIGATION alert=[2026-07-28 21:00:40] GL_HARD_CEILING gl=126 pss=1024.3 views=572
[2026-07-28 21:03:22] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260728-210320.log
[2026-07-28 21:03:24] INVESTIGATION mem from timeline gl=8.5MB pss=613.4MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260728-210320.log
```

## Recent incidents

```
[2026-07-28 19:58:54] VIEWS_NATIVE_ADVISORY views=572 native_heap=315.9 pss=734.8 gl=127.5 (node/list retention ??pre-hardceiling early warn)
[2026-07-28 20:14:19] VIEWS_NATIVE_ADVISORY views=572 native_heap=315.9 pss=734 gl=125.5 (node/list retention ??pre-hardceiling early warn)
[2026-07-28 20:29:44] VIEWS_NATIVE_ADVISORY views=572 native_heap=316.2 pss=733.8 gl=125.5 (node/list retention ??pre-hardceiling early warn)
[2026-07-28 20:45:09] VIEWS_NATIVE_ADVISORY views=644 native_heap=351.9 pss=797.4 gl=100.4 (node/list retention ??pre-hardceiling early warn)
[2026-07-28 21:00:40] GL_HARD_CEILING gl=126 pss=1024.3 views=572
[2026-07-28 21:00:40] REFIX_REQUESTED gl_critical_active_hub
```

## Crash signature (tail)

```
07-
