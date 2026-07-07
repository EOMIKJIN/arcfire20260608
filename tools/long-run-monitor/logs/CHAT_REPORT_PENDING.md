# [실시간 이상] Arcfire 자동탐지 → 김팀장 P0

**시각 (KST)**: 2026-07-07 21:48:01
**사유**: `mem_anomaly`

| 항목 | 경로 |
|------|------|
| incident handoff | `tools/long-run-monitor/outbox/cursor-incident-handoff.md` |
| Cursor 트리거 | `.cursor/trigger-incident-auto-fix.json` |

## 최근 incidents
```
[2026-07-07 20:41:36] PSS_SOFT_CEILING pss=803.1 gl=123.3 views=367 native_reclaim_advisory
[2026-07-07 20:56:59] GL_ELEVATED mounting_or_insufficient_samples gl=110.5 pss=784.6 views=371 restart_held
[2026-07-07 21:12:30] PSS_SOFT_CEILING pss=845.2 gl=113.1 views=383 native_reclaim_advisory
[2026-07-07 21:43:25] GL_HARD_CEILING gl=110.4 pss=993.5 views=464
[2026-07-07 21:43:25] REFIX_REQUESTED gl_critical_active_hub
[2026-07-07 21:48:00] INVESTIGATION_TRIGGERED mem_anomaly
```

## 최근 remediation
```
[2026-07-07 21:47:59] INVESTIGATION mem from timeline gl=8.6MB pss=505.2MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260707-214756.log
[2026-07-07 21:48:00] packed D:\arcfire20260607\tools\long-run-monitor\outbox\cursor-incident-handoff.md
[2026-07-07 21:48:00] INVESTIGATION trigger -> .cursor/trigger-incident-auto-fix.json
[2026-07-07 21:48:00] INVESTIGATION done reason=mem_anomaly
```

## 권장 (김팀장 즉시)
1. logcat·mem-timeline 근거 원인 특정 → 코드 수정 → tsc
2. 완료: `node tools/long-run-monitor/ack-incident-handoff.cjs`

---
**P0**: 김팀장 — **사용자 Cursor 대화창에 즉시 게시** + handoff 기반 코드 조치. 파일만 남기고 채팅 생략 **금지**.

--- handoff excerpt ---
# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-07-07T12:48:00.031Z
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
[2026-07-07 21:43:26] AUTO_FIX static audit:skia-memory start
[2026-07-07 21:43:28] AUTO_FIX audit:skia-memory PASS
[2026-07-07 21:43:28] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-07-07 21:43:46] AUTO_FIX baseline reset pid=27487 gl=6MB pss=193.6MB
[2026-07-07 21:43:46] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-07-07 21:44:07] VERIFY PASS pid=27487 gl=8.6MB pss=505.2MB views=99
[2026-07-07 21:44:07] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":993.5,"views":464,"lastGlMb":110.4,"hardCeiling":true}
[2026-07-07 21:44:08] HANDOFF packed -> outbox/cursor-incident-handoff.md (Kim Team Lead triage)
[2026-07-07 21:47:56] INVESTIGATION start reason=mem_anomaly
[2026-07-07 21:47:56] INVESTIGATION alert=[2026-07-07 21:43:25] GL_HARD_CEILING gl=110.4 pss=993.5 views=464
[2026-07-07 21:47:58] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260707-214756.log
[2026-07-07 21:47:59] INVESTIGATION mem from timeline gl=8.6MB pss=505.2MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260707-214756.log
```

## Recent incidents

```
[2026-07-07 20:26:12] PSS_SOFT_CEILING pss=802.4 gl=129.3 views=363 native_reclaim_advisory
[2026-07-07 20:41:36] PSS_SOFT_CEILING pss=803.1 gl=123.3 views=367 native_reclaim_advisory
[2026-07-07 20:56:59] GL_ELEVATED mounting_or_insufficient_samples gl=110.5 pss=784.6 views=371 restart_held
[2026-07-07 21:12:30] PSS_SOFT_CEILING pss=845.2 gl=113.1 views=383 native_reclaim_advisory
[2026-07-07 21:43:25] GL_HARD_CEILING gl=110.4 pss=993.5 views=464
[2026-07-07 21:43:25] REFIX_REQUESTED gl_critical_active_hub
```

## Crash signature (tail)

```
07-03 19:46:43.899  1822  2705 I ActivityManager: Changes in 10108 10 to 10, 128 to 0
07-03 19:46:43.923  1822  1949 I ActivityManager: Start proc 25967:com.android.providers.cale
