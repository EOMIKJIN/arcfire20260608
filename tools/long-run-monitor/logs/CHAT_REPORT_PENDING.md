# [실시간 이상] Arcfire 자동탐지 → 김팀장 P0

**시각 (KST)**: 2026-07-05 18:30:33
**사유**: `mem_anomaly`

| 항목 | 경로 |
|------|------|
| incident handoff | `tools/long-run-monitor/outbox/cursor-incident-handoff.md` |
| Cursor 트리거 | `.cursor/trigger-incident-auto-fix.json` |

## 최근 incidents
```
[2026-07-05 17:39:23] PSS_SOFT_CEILING pss=864.6 gl=48.8 views=296 native_reclaim_advisory
[2026-07-05 17:54:46] PSS_SOFT_CEILING pss=883.1 gl=50 views=344 native_reclaim_advisory
[2026-07-05 18:10:10] PSS_SOFT_CEILING pss=905.8 gl=50.3 views=394 native_reclaim_advisory
[2026-07-05 18:25:31] GL_HARD_CEILING gl=154.2 pss=1074.1 views=559
[2026-07-05 18:25:31] REFIX_REQUESTED gl_critical_active_hub
[2026-07-05 18:30:32] INVESTIGATION_TRIGGERED mem_anomaly
```

## 최근 remediation
```
[2026-07-05 18:30:31] INVESTIGATION mem from timeline gl=4.4MB pss=390.9MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260705-183029.log
[2026-07-05 18:30:32] packed D:\arcfire20260607\tools\long-run-monitor\outbox\cursor-incident-handoff.md
[2026-07-05 18:30:32] INVESTIGATION trigger -> .cursor/trigger-incident-auto-fix.json
[2026-07-05 18:30:32] INVESTIGATION done reason=mem_anomaly
```

## 권장 (김팀장 즉시)
1. logcat·mem-timeline 근거 원인 특정 → 코드 수정 → tsc
2. 완료: `node tools/long-run-monitor/ack-incident-handoff.cjs`

---
**P0**: 김팀장 — **사용자 Cursor 대화창에 즉시 게시** + handoff 기반 코드 조치. 파일만 남기고 채팅 생략 **금지**.

--- handoff excerpt ---
# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-07-05T09:30:31.808Z
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
[2026-07-05 18:25:32] AUTO_FIX static audit:skia-memory start
[2026-07-05 18:25:34] AUTO_FIX audit:skia-memory PASS
[2026-07-05 18:25:34] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-07-05 18:25:51] AUTO_FIX baseline reset pid=15875 gl=6MB pss=202.7MB
[2026-07-05 18:25:51] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-07-05 18:26:12] VERIFY PASS pid=15875 gl=4.4MB pss=390.9MB views=15
[2026-07-05 18:26:12] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":1074.1,"views":559,"lastGlMb":154.2,"hardCeiling":true}
[2026-07-05 18:26:13] HANDOFF packed -> outbox/cursor-incident-handoff.md (Kim Team Lead triage)
[2026-07-05 18:30:29] INVESTIGATION start reason=mem_anomaly
[2026-07-05 18:30:29] INVESTIGATION alert=[2026-07-05 18:25:31] GL_HARD_CEILING gl=154.2 pss=1074.1 views=559
[2026-07-05 18:30:30] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260705-183029.log
[2026-07-05 18:30:31] INVESTIGATION mem from timeline gl=4.4MB pss=390.9MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260705-183029.log
```

## Recent incidents

```
[2026-07-05 16:55:00] INVESTIGATION_TRIGGERED mem_anomaly
[2026-07-05 17:39:23] PSS_SOFT_CEILING pss=864.6 gl=48.8 views=296 native_reclaim_advisory
[2026-07-05 17:54:46] PSS_SOFT_CEILING pss=883.1 gl=50 views=344 native_reclaim_advisory
[2026-07-05 18:10:10] PSS_SOFT_CEILING pss=905.8 gl=50.3 views=394 native_reclaim_advisory
[2026-07-05 18:25:31] GL_HARD_CEILING gl=154.2 pss=1074.1 views=559
[2026-07-05 18:25:31] REFIX_REQUESTED gl_critical_active_hub
```

## Crash signature (tail)

```
07-03 19:46:43.899  1822  2705 I ActivityManager: Changes in 10108 10 to 10, 128 to 0
07-03 19:46:43.923  1822  1949 I ActivityManager: Start proc 25967:com.android.providers.calendar/u0a115 for broadcast {com.android.providers.cale
