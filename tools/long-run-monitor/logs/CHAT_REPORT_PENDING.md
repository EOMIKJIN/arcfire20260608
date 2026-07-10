# [실시간 이상] Arcfire 자동탐지 → 김팀장 P0

**시각 (KST)**: 2026-07-10 21:01:48
**사유**: `gl_critical_active_hub`

| 항목 | 경로 |
|------|------|
| incident handoff | `tools/long-run-monitor/outbox/cursor-incident-handoff.md` |
| Cursor 트리거 | `.cursor/trigger-incident-auto-fix.json` |

## 최근 incidents
```
[2026-07-10 19:57:55] REFIX_REQUESTED gl_critical_active_hub
[2026-07-10 20:29:31] VIEWS_NATIVE_ADVISORY views=577 native_heap=316.7 pss=692 gl=97.9 (node/list retention ??pre-hardceiling early warn)
[2026-07-10 20:44:58] GL_HARD_CEILING gl=130.3 pss=973.2 views=561
[2026-07-10 20:44:58] REFIX_REQUESTED gl_critical_active_hub
[2026-07-10 21:01:05] GL_HARD_CEILING gl=120.9 pss=1075.4 views=561
[2026-07-10 21:01:05] REFIX_REQUESTED gl_critical_active_hub
```

## 최근 remediation
```
[2026-07-10 21:01:25] AUTO_FIX baseline reset pid=12768 gl=4.4MB pss=367.2MB
[2026-07-10 21:01:25] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-07-10 21:01:48] VERIFY PASS pid=12768 gl=8.5MB pss=554.8MB views=99
[2026-07-10 21:01:48] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":1075.4,"views":561,"lastGlMb":120.9,"hardCeiling":true}
```

## 권장 (김팀장 즉시)
1. logcat·mem-timeline 근거 원인 특정 → 코드 수정 → tsc
2. 완료: `node tools/long-run-monitor/ack-incident-handoff.cjs`

---
**P0**: 김팀장 — **사용자 Cursor 대화창에 즉시 게시** + handoff 기반 코드 조치. 파일만 남기고 채팅 생략 **금지**.

--- handoff excerpt ---
# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-07-10T12:01:48.391Z
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
[2026-07-10 20:45:40] VERIFY PASS pid=12074 gl=8.5MB pss=594.3MB views=99
[2026-07-10 20:45:40] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":973.2,"views":561,"lastGlMb":130.3,"hardCeiling":true}
[2026-07-10 20:45:41] HANDOFF packed -> outbox/cursor-incident-handoff.md (Kim Team Lead triage)
[2026-07-10 21:01:05] INCIDENT GL_HARD_CEILING gl=120.9 pss=1075.4 views=561 -> immediate remediation (OOM imminent)
[2026-07-10 21:01:05] REFIX_REQUESTED gl_critical_active_hub -> gl-leak-refix-requested.flag
[2026-07-10 21:01:05] AUTO_FIX static audit:skia-memory start
[2026-07-10 21:01:07] AUTO_FIX audit:skia-memory PASS
[2026-07-10 21:01:07] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-07-10 21:01:25] AUTO_FIX baseline reset pid=12768 gl=4.4MB pss=367.2MB
[2026-07-10 21:01:25] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-07-10 21:01:48] VERIFY PASS pid=12768 gl=8.5MB pss=554.8MB views=99
[2026-07-10 21:01:48] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":1075.4,"views":561,"lastGlMb":120.9,"hardCeiling":true}
```

## Recent incidents

```
[2026-07-10 19:57:55] REFIX_REQUESTED gl_critical_active_hub
[2026-07-10 20:29:31] VIEWS_NATIVE_ADVISORY views=577 native_heap=316.7 pss=692 gl=97.9 (node/list retention ??pre-hardceiling early warn)
[2026-07-10 20:44:58] GL_HARD_CEILING gl=130.3 pss=973.2 views=561
[2026-07-10 20:44:58] REFIX_REQUESTED gl_critical_active_hub
[2026-07-10 21:01:05] GL_HARD_CEILING gl=120.9 pss=1075.4 views=561
[2026-07-10 21:01:05] REFIX_REQUESTED gl_critical_active_hub
```

## Crash signature (tail)

```
07-10 21:01:30.647 12768 12871 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog planets=1 items=68 origin=arc_core_policy', 'trade_port_planet_resync'
07-10 21:01:30.661 12768 12871 I ReactNativeJS: '[ArcCore/Economy] bulk set_catalog planets=1 items=49 o
