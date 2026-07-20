# [실시간 이상] Arcfire 자동탐지 → 김팀장 P0

**시각 (KST)**: 2026-07-20 17:37:11
**사유**: `mem_anomaly`

| 항목 | 경로 |
|------|------|
| incident handoff | `tools/long-run-monitor/outbox/cursor-incident-handoff.md` |
| Cursor 트리거 | `.cursor/trigger-incident-auto-fix.json` |

## 최근 incidents
```
[2026-07-20 16:46:14] PSS_SOFT_CEILING pss=845.2 gl=50.2 views=312 native_reclaim_advisory
[2026-07-20 17:01:38] PSS_SOFT_CEILING pss=854.2 gl=59.8 views=494 native_reclaim_advisory
[2026-07-20 17:17:03] PSS_SOFT_CEILING pss=849.9 gl=59.8 views=361 native_reclaim_advisory
[2026-07-20 17:32:29] GL_HARD_CEILING gl=137.4 pss=983.2 views=571
[2026-07-20 17:32:29] REFIX_REQUESTED gl_critical_active_hub
[2026-07-20 17:37:10] INVESTIGATION_TRIGGERED mem_anomaly
```

## 최근 remediation
```
[2026-07-20 17:37:09] INVESTIGATION mem from timeline gl=8.7MB pss=635.9MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260720-173706.log
[2026-07-20 17:37:10] packed D:\arcfire20260607\tools\long-run-monitor\outbox\cursor-incident-handoff.md
[2026-07-20 17:37:10] INVESTIGATION trigger -> .cursor/trigger-incident-auto-fix.json
[2026-07-20 17:37:10] INVESTIGATION done reason=mem_anomaly
```

## 권장 (김팀장 즉시)
1. logcat·mem-timeline 근거 원인 특정 → 코드 수정 → tsc
2. 완료: `node tools/long-run-monitor/ack-incident-handoff.cjs`

---
**P0**: 김팀장 — **사용자 Cursor 대화창에 즉시 게시** + handoff 기반 코드 조치. 파일만 남기고 채팅 생략 **금지**.

--- handoff excerpt ---
# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-07-20T08:37:09.489Z
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
[2026-07-20 17:32:29] AUTO_FIX static audit:skia-memory start
[2026-07-20 17:32:32] AUTO_FIX audit:skia-memory PASS
[2026-07-20 17:32:32] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-07-20 17:32:49] AUTO_FIX baseline reset pid=7743 gl=5.9MB pss=325.3MB
[2026-07-20 17:32:49] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-07-20 17:33:10] VERIFY PASS pid=7743 gl=8.7MB pss=635.9MB views=99
[2026-07-20 17:33:10] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":983.2,"views":571,"lastGlMb":137.4,"hardCeiling":true}
[2026-07-20 17:33:11] HANDOFF packed -> outbox/cursor-incident-handoff.md (Kim Team Lead triage)
[2026-07-20 17:37:06] INVESTIGATION start reason=mem_anomaly
[2026-07-20 17:37:06] INVESTIGATION alert=[2026-07-20 17:32:29] GL_HARD_CEILING gl=137.4 pss=983.2 views=571
[2026-07-20 17:37:07] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260720-173706.log
[2026-07-20 17:37:09] INVESTIGATION mem from timeline gl=8.7MB pss=635.9MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260720-173706.log
```

## Recent incidents

```
[2026-07-20 13:56:25] PSS_SOFT_CEILING pss=814.7 gl=115.8 views=569 native_reclaim_advisory
[2026-07-20 16:46:14] PSS_SOFT_CEILING pss=845.2 gl=50.2 views=312 native_reclaim_advisory
[2026-07-20 17:01:38] PSS_SOFT_CEILING pss=854.2 gl=59.8 views=494 native_reclaim_advisory
[2026-07-20 17:17:03] PSS_SOFT_CEILING pss=849.9 gl=59.8 views=361 native_reclaim_advisory
[2026-07-20 17:32:29] GL_HARD_CEILING gl=137.4 pss=983.2 views=571
[2026-07-20 17:32:29] REFIX_REQUESTED gl_critical_active_hub
```

## Crash signature (tail)

```
07-17 20:53:26.468 16902 17002 I ReactNativeJS: [intro-diag] MOUNT scene=intro01 flow=preNickname
07-17 20:53:26.468 16902 17002 I ReactNativeJS: [intro-diag] page=0 seg=0
07-17 20:53:26.468 16902 17
