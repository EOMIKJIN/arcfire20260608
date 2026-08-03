# [실시간 이상] Arcfire 자동탐지 → 김팀장 P0

**시각 (KST)**: 2026-08-03 16:00:26
**사유**: `mem_anomaly`

| 항목 | 경로 |
|------|------|
| incident handoff | `tools/long-run-monitor/outbox/cursor-incident-handoff.md` |
| Cursor 트리거 | `.cursor/trigger-incident-auto-fix.json` |

## 최근 incidents
```
[2026-08-03 15:09:26] PSS_SOFT_CEILING pss=858.4 gl=127 views=739 native_reclaim_advisory
[2026-08-03 15:25:00] PSS_SOFT_CEILING pss=863.3 gl=146.4 views=578 native_reclaim_advisory
[2026-08-03 15:40:33] PSS_SOFT_CEILING pss=840.1 gl=115.4 views=743 native_reclaim_advisory
[2026-08-03 15:56:05] GL_HARD_CEILING gl=113.1 pss=1062.4 views=581
[2026-08-03 15:56:05] REFIX_REQUESTED gl_critical_active_hub
[2026-08-03 16:00:25] INVESTIGATION_TRIGGERED mem_anomaly
```

## 최근 remediation
```
[2026-08-03 16:00:24] INVESTIGATION mem from timeline gl=8.5MB pss=645.3MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260803-160021.log
[2026-08-03 16:00:25] packed D:\arcfire20260607\tools\long-run-monitor\outbox\cursor-incident-handoff.md
[2026-08-03 16:00:25] INVESTIGATION trigger -> .cursor/trigger-incident-auto-fix.json
[2026-08-03 16:00:25] INVESTIGATION done reason=mem_anomaly
```

## 권장 (김팀장 즉시)
1. logcat·mem-timeline 근거 원인 특정 → 코드 수정 → tsc
2. 완료: `node tools/long-run-monitor/ack-incident-handoff.cjs`

---
**P0**: 김팀장 — **사용자 Cursor 대화창에 즉시 게시** + handoff 기반 코드 조치. 파일만 남기고 채팅 생략 **금지**.

--- handoff excerpt ---
# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-08-03T07:00:25.241Z
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
[2026-08-03 15:56:05] AUTO_FIX static audit:skia-memory start
[2026-08-03 15:56:07] AUTO_FIX audit:skia-memory PASS
[2026-08-03 15:56:07] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-08-03 15:56:25] AUTO_FIX baseline reset pid=15732 gl=6MB pss=200.2MB
[2026-08-03 15:56:25] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-08-03 15:56:45] VERIFY PASS pid=15732 gl=8.5MB pss=645.3MB views=99
[2026-08-03 15:56:45] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":1062.4,"views":581,"lastGlMb":113.1,"hardCeiling":true}
[2026-08-03 15:56:46] HANDOFF packed -> outbox/cursor-incident-handoff.md (Kim Team Lead triage)
[2026-08-03 16:00:21] INVESTIGATION start reason=mem_anomaly
[2026-08-03 16:00:21] INVESTIGATION alert=[2026-08-03 15:56:05] GL_HARD_CEILING gl=113.1 pss=1062.4 views=581
[2026-08-03 16:00:23] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260803-160021.log
[2026-08-03 16:00:24] INVESTIGATION mem from timeline gl=8.5MB pss=645.3MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260803-160021.log
```

## Recent incidents

```
[2026-08-03 14:53:53] PSS_SOFT_CEILING pss=838.1 gl=117.9 views=596 native_reclaim_advisory
[2026-08-03 15:09:26] PSS_SOFT_CEILING pss=858.4 gl=127 views=739 native_reclaim_advisory
[2026-08-03 15:25:00] PSS_SOFT_CEILING pss=863.3 gl=146.4 views=578 native_reclaim_advisory
[2026-08-03 15:40:33] PSS_SOFT_CEILING pss=840.1 gl=115.4 views=743 native_reclaim_advisory
[2026-08-03 15:56:05] GL_HARD_CEILING gl=113.1 pss=1062.4 views=581
[2026-08-03 15:56:05] REFIX_REQUESTED gl_critical_active_hub
```

## Crash signature (tail)

```
08-02 02:01:46.041 18187 18290 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog planets=1 items=91 origin=arc_core_policy', 'trade_port_planet_resync'
08-02 02:01:46.052 18187 18290 I ReactNa
