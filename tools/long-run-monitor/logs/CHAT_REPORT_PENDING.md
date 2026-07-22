# [실시간 이상] Arcfire 자동탐지 → 김팀장 P0

**시각 (KST)**: 2026-07-22 23:41:18
**사유**: `mem_anomaly`

| 항목 | 경로 |
|------|------|
| incident handoff | `tools/long-run-monitor/outbox/cursor-incident-handoff.md` |
| Cursor 트리거 | `.cursor/trigger-incident-auto-fix.json` |

## 최근 incidents
```
[2026-07-22 22:05:13] PSS_SOFT_CEILING pss=880.8 gl=154.8 views=553 native_reclaim_advisory
[2026-07-22 22:20:47] PSS_SOFT_CEILING pss=880.8 gl=154.8 views=553 native_reclaim_advisory
[2026-07-22 23:22:12] PSS_SOFT_CEILING pss=909.5 gl=138 views=349 native_reclaim_advisory
[2026-07-22 23:37:37] GL_HARD_CEILING gl=203.4 pss=1028.5 views=553
[2026-07-22 23:37:37] REFIX_REQUESTED gl_critical_active_hub
[2026-07-22 23:41:17] INVESTIGATION_TRIGGERED mem_anomaly
```

## 최근 remediation
```
[2026-07-22 23:41:16] INVESTIGATION mem from timeline gl=8.5MB pss=567.2MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260722-234114.log
[2026-07-22 23:41:17] packed D:\arcfire20260607\tools\long-run-monitor\outbox\cursor-incident-handoff.md
[2026-07-22 23:41:17] INVESTIGATION trigger -> .cursor/trigger-incident-auto-fix.json
[2026-07-22 23:41:17] INVESTIGATION done reason=mem_anomaly
```

## 권장 (김팀장 즉시)
1. logcat·mem-timeline 근거 원인 특정 → 코드 수정 → tsc
2. 완료: `node tools/long-run-monitor/ack-incident-handoff.cjs`

---
**P0**: 김팀장 — **사용자 Cursor 대화창에 즉시 게시** + handoff 기반 코드 조치. 파일만 남기고 채팅 생략 **금지**.

--- handoff excerpt ---
# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-07-22T14:41:16.799Z
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
[2026-07-22 23:37:37] AUTO_FIX static audit:skia-memory start
[2026-07-22 23:37:39] AUTO_FIX audit:skia-memory PASS
[2026-07-22 23:37:39] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-07-22 23:37:57] AUTO_FIX baseline reset pid=29010 gl=6MB pss=196.8MB
[2026-07-22 23:37:57] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-07-22 23:38:18] VERIFY PASS pid=29010 gl=8.5MB pss=567.2MB views=99
[2026-07-22 23:38:18] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":1028.5,"views":553,"lastGlMb":203.4,"hardCeiling":true}
[2026-07-22 23:38:19] HANDOFF packed -> outbox/cursor-incident-handoff.md (Kim Team Lead triage)
[2026-07-22 23:41:14] INVESTIGATION start reason=mem_anomaly
[2026-07-22 23:41:14] INVESTIGATION alert=[2026-07-22 23:37:37] GL_HARD_CEILING gl=203.4 pss=1028.5 views=553
[2026-07-22 23:41:15] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260722-234114.log
[2026-07-22 23:41:16] INVESTIGATION mem from timeline gl=8.5MB pss=567.2MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260722-234114.log
```

## Recent incidents

```
[2026-07-22 20:32:28] PSS_SOFT_CEILING pss=947.4 gl=44.6 views=317 native_reclaim_advisory
[2026-07-22 22:05:13] PSS_SOFT_CEILING pss=880.8 gl=154.8 views=553 native_reclaim_advisory
[2026-07-22 22:20:47] PSS_SOFT_CEILING pss=880.8 gl=154.8 views=553 native_reclaim_advisory
[2026-07-22 23:22:12] PSS_SOFT_CEILING pss=909.5 gl=138 views=349 native_reclaim_advisory
[2026-07-22 23:37:37] GL_HARD_CEILING gl=203.4 pss=1028.5 views=553
[2026-07-22 23:37:37] REFIX_REQUESTED gl_critical_active_hub
```

## Crash signature (tail)

```
07-22 22:50:07.414 26404 26404 F DEBUG   :       #45 pc 0000000000786bcc  /data/app/~~1jBCJoN39z3fV1DQIQtvXg==/com.arcfire.online-BetpbiQJUn2jx0c00be3dg==/base.apk!librnskia.so (offset 0x414b000) 
