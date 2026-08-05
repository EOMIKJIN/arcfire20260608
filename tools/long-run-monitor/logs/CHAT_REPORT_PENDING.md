# [실시간 이상] Arcfire 자동탐지 → 김팀장 P0

**시각 (KST)**: 2026-08-05 15:57:39
**사유**: `mem_anomaly`

| 항목 | 경로 |
|------|------|
| incident handoff | `tools/long-run-monitor/outbox/cursor-incident-handoff.md` |
| Cursor 트리거 | `.cursor/trigger-incident-auto-fix.json` |

## 최근 incidents
```
[2026-08-05 13:02:01] PSS_SOFT_CEILING pss=801.7 gl=42.5 views=375 native_reclaim_advisory
[2026-08-05 14:19:42] PSS_SOFT_CEILING pss=864.6 gl=31.6 views=362 native_reclaim_advisory
[2026-08-05 15:06:19] PSS_SOFT_CEILING pss=949.4 gl=72.4 views=463 native_reclaim_advisory
[2026-08-05 15:52:50] GL_HARD_CEILING gl=43.1 pss=999.1 views=399
[2026-08-05 15:52:50] REFIX_REQUESTED gl_critical_active_hub
[2026-08-05 15:57:38] INVESTIGATION_TRIGGERED mem_anomaly
```

## 최근 remediation
```
[2026-08-05 15:57:37] INVESTIGATION mem from timeline gl=10MB pss=714.2MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260805-155733.log
[2026-08-05 15:57:38] packed D:\arcfire20260607\tools\long-run-monitor\outbox\cursor-incident-handoff.md
[2026-08-05 15:57:38] INVESTIGATION trigger -> .cursor/trigger-incident-auto-fix.json
[2026-08-05 15:57:38] INVESTIGATION done reason=mem_anomaly
```

## 권장 (김팀장 즉시)
1. logcat·mem-timeline 근거 원인 특정 → 코드 수정 → tsc
2. 완료: `node tools/long-run-monitor/ack-incident-handoff.cjs`

---
**P0**: 김팀장 — **사용자 Cursor 대화창에 즉시 게시** + handoff 기반 코드 조치. 파일만 남기고 채팅 생략 **금지**.

--- handoff excerpt ---
# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-08-05T06:57:37.863Z
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
[2026-08-05 15:52:50] AUTO_FIX static audit:skia-memory start
[2026-08-05 15:52:52] AUTO_FIX audit:skia-memory PASS
[2026-08-05 15:52:52] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-08-05 15:53:11] AUTO_FIX baseline reset pid=25612 gl=6MB pss=199.6MB
[2026-08-05 15:53:11] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-08-05 15:53:31] VERIFY PASS pid=25612 gl=10MB pss=714.2MB views=229
[2026-08-05 15:53:31] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":999.1,"views":399,"lastGlMb":43.1,"hardCeiling":true}
[2026-08-05 15:53:32] HANDOFF packed -> outbox/cursor-incident-handoff.md (Kim Team Lead triage)
[2026-08-05 15:57:33] INVESTIGATION start reason=mem_anomaly
[2026-08-05 15:57:33] INVESTIGATION alert=[2026-08-05 15:52:50] GL_HARD_CEILING gl=43.1 pss=999.1 views=399
[2026-08-05 15:57:35] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260805-155733.log
[2026-08-05 15:57:37] INVESTIGATION mem from timeline gl=10MB pss=714.2MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260805-155733.log
```

## Recent incidents

```
[2026-08-05 08:14:17] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260805-0800.md verdict=OK
[2026-08-05 13:02:01] PSS_SOFT_CEILING pss=801.7 gl=42.5 views=375 native_reclaim_advisory
[2026-08-05 14:19:42] PSS_SOFT_CEILING pss=864.6 gl=31.6 views=362 native_reclaim_advisory
[2026-08-05 15:06:19] PSS_SOFT_CEILING pss=949.4 gl=72.4 views=463 native_reclaim_advisory
[2026-08-05 15:52:50] GL_HARD_CEILING gl=43.1 pss=999.1 views=399
[2026-08-05 15:52:50] REFIX_REQUESTED gl_critical_active_hub
```

## Crash signature (tail)

```
08-02 02:01:46.041 18187 18290 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog planets=1 items=91 origin=arc_core_policy', 'trade_port_planet_resyn
