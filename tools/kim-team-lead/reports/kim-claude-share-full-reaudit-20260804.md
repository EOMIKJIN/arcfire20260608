# 김팀장 → 김클로드 공유 — 전체 재검수 결과 (2026-08-04)

> **수신**: 김클로드 (Claude Code · Cursor ✱)  
> **발신**: 김팀장 · 대표님 지시 「전체 재검수 내용을 김클로드에게 공유」  
> **성격**: 현황 공유 정본 · **git commit 금지** · 이 문서 기준으로 rework 우선순위 정렬  
> **교차**:  
> - 재작업 READY: `tools/kim-team-lead/reports/kim-claude-ready-rework-boot-batch-warp-20260804.md`  
> - handoff: `tools/kim-team-lead/reports/kim-claude-handoff-pending.md`  
> - 부트/버튼 규칙: `AGENTS.md` §시작 화면 버튼 최소 활성 · `arcfire-main-lead-agent.mdc` 동 절

---

## 0. 한 줄 요약 (김클로드 필독)

**핵심 런타임 패치는 워크트리 코드에 이미 반영되어 있고 `tsc` PASS.**  
**미커밋·PENDING 파편·재작업 R0~R2 미완·실기 device_PASS 없음.**  
다음 업무 = **R0 handoff 통합 → R1 join 20~25s → R2 catalog 로그** (READY 정본).

---

## 1. 정적 게이트 (김팀장 실측)

| 항목 | 결과 |
|------|------|
| `npx tsc --noEmit -p tsconfig.client.json` | **PASS (exit 0)** · 전수검사 시점 |
| git HEAD | `612c795` chore(daily) snapshot |
| **본 스프린트 src/app 커밋** | **없음** — 전부 working tree dirty / untracked |
| 완료·merge 선언 | **금지** (device_PASS·handoff 정리 전) |

---

## 2. 기능 축 — 코드 실재 맵 (전수)

김클로드 handoff 주장과 **코드 대조** 결과.

| 축 | 판정 | 파일 / 근거 |
|----|------|-------------|
| 타이틀 버튼 즉시 (`postBootSettled` 즉시) | **OK · AGREE** | `app/_layout.tsx` bootReady 직후 `setPostBootSettled(true)` · 12s `settleDeadline` **없음** |
| 타이틀에 daily/catch-up wait 금지 | **OK · AGREE** | `app/` 에서 `waitForArcCore*` **0건** |
| 부트 critical asset prewarm 제거 | **OK · AGREE** | `_layout` 에 `runCriticalSessionAssetPrewarm` **없음** (prewarm = continue만) |
| 이어하기 합류 슬롯 | **OK · AGREE** | `src/game/continueSessionPrewarm.ts` |
| catch-up gate | **OK · AGREE** | `src/arcCore/schedule/arcCoreWallClockCatchUpGate.ts` **(untracked)** |
| join 상한 | **OK · AGREE (soft)** | catch-up **12s** · daily **45s** `withJoinTimeout` — **R1: 45→20~25s 미반영** |
| RTDB KPI write hang 방지 | **OK · AGREE** | `pushArcCoreDailyKpiToRtdb.ts` `Promise.race` + `ARCORE_RTDB_DAILY_KPI_WRITE_TIMEOUT_MS=6_000` |
| RTDB skip → LogBox 팝업 | **OK · AGREE** | catch: `console.warn` → `__DEV__ console.log` (후속 PENDING과 일치) |
| 일일 배치 TOCTOU 이중 실행 | **OK · AGREE** | `ArcCoreDailyOpsSubCore`: `batchRunning=true` **before** `hydrate` + 상위 `try/finally` |
| 배치 완료 게이트 Wave A | **OK · AGREE** | `lastBatchCompletedDayKey` + `shouldRunArcCoreDailyBatch` |
| 배치 격리·perf follow-up | **OK · 이전 AGREE** | batch isolation · bulk O(N) · presence Set 등 (워크트리 포함) |
| 영유권 팝업 worldmap only | **OK · AGREE_SOFT** | `territorialAlertGalaxyMapGate.ts` **(untracked)** · `worldmap` focus · `showTerritorial*` 경유 |
| 규칙 재명기 | **OK** | `AGENTS.md` · `arcfire-main-lead-agent.mdc` · memory-audit · BOOT_INIT |
| rework R1 join 20~25s | **미반영** | 여전히 `DAILY_BATCH_JOIN_TIMEOUT_MS = 45_000` |
| rework R2 catalog 로그 스로틀 | **미반영** | 행당 `trade_port_planet_resync` bulk log 유지 |
| device 실기 합격 | **없음** | handoff 전부 device_PASS pending |

### 의도된 런타임 플로우 (정본)

```text
cold boot
  → hydrate → bootReady → postBootSettled 즉시 → 타이틀 버튼 (최소화)
  → BG: catch-up+territorial · daily batch register · economy resync 로그 다수
이어하기
  → 차원항로 로딩
  → wait catch-up ≤12s · wait daily ≤45s (join만, 작업 cancel 아님)
  → assets → planet
배치 말미 RTDB KPI set ≤6s timeout · 실패 시 DEV log only (LogBox warn 목표: 제거됨)
영유권 알림: 타이틀/허브 보류 · 은하 지도(worldmap) focus 시 최신 1건만 노출
```

---

## 3. handoff / 프로세스 상태 (문제)

| 문제 | 상세 |
|------|------|
| **PENDING 파편화** | 상단에 RTDB LogBox 후속 · warp 무한대기 · territorial · race+boot audit · 구 daily-ops … **다층 누적** |
| **R0 미이행** | rework 지시「PENDING **1블록** 통합」미완 |
| **title ASSIGNED** | handoff에 잔존 · rework 흡수 미마감 |
| **재작업 READY** | `kim-claude-ready-rework-boot-batch-warp-20260804.md` 배정됨 · **R0~R2 미착수/미완** |
| **김팀장 총평** | `AGREE_CORE_PATCHES · rework_R0_R2_required` (유효) |

### 김클로드 자신 산출물 중 문서 누락이었던 것 (코드는 이미 있음)

- RTDB 6s + join 12/45s → 나중에 handoff에 올림 ✓  
- LogBox warn 완화 → handoff **최상단 PENDING** ✓  

---

## 4. dirty 분류 (커밋 시 가이드 · **지금은 커밋 금지**)

### A. 포함 후보 (src · app · 규칙 · READY)

| 영역 | 경로 예 |
|------|---------|
| 부트/타이틀 | `app/_layout.tsx`, `app/index.tsx`, `src/store/appBootStore.ts` |
| 차원항로 | `src/game/continueSessionPrewarm.ts`, `arcCoreWallClockCatchUpGate.ts` |
| 일일배치 | `ArcCoreDailyOpsSubCore.ts`, daily ops state/policy/batch, planetCore bulk, missions, presence, pgp 등 |
| RTDB | `pushArcCoreDailyKpiToRtdb.ts`, `arccoreRtdbConfig.ts` |
| 영유권 | `territorialAlertGalaxyMapGate.ts`, show*Alert, `app/(game)/worldmap.tsx` |
| 규칙/문서 | AGENTS, CLAUDE, `.cursor/rules/*`, BOOT_INIT, READY, handoff |

### B. 커밋 제외 (노이즈)

- `tools/long-run-monitor/logs/**` · mem/incident/dashboard  
- balance-ops / planet-economy / memory-profiler / arc-core-learning **reports**  
- `tools/debug/_repro*` `_mock*` `_bench*` · RKStorage dumps  

---

## 5. 검수 판정 고정표 (김클로드 분석 수용/보류)

| task_id / 주제 | 김팀장 판정 |
|----------------|-------------|
| `continue-warp-infinite-wait` (RTDB+join) | **AGREE_CODE** · device 미검증 |
| RTDB skip LogBox 후속 | **AGREE_CODE** · device 미검증 |
| daily-ops TOCTOU race | **AGREE_CODE** |
| title 즉시 + prewarm 합류 | **AGREE_CODE** |
| territorial galaxy gate | **AGREE_SOFT** (행성 허브 미노출 = 현재 의도, 문서화) |
| daily-ops incomplete Wave A~C′ / perf | 이전 **AGREE_CODE** · device_PASS pending |
| auth `resolveDeviceScopedUid` 재시도 | **DEFER — 값 변경 금지** |
| catalog 행성당 set_catalog DEV 로그 | 원인 **AGREE** · 수정 **P2 = R2** |

---

## 6. 리스크 우선순위 (재작업 순서와 동일)

| P | 항목 | 담당 |
|---|------|------|
| **P0 프로세스** | handoff **PENDING 1블록** · title ASSIGNED 닫기 (R0) | 김클로드 |
| **P0 실기** (대표님/공통) | 타이틀 즉시 · 항로 비고착(≤ cap) · LogBox 무 · micro-adjust **1회** | 실기 확인 |
| **P1 UX** | daily join **45s → 20~25s** + 단계 로그(R1) | 김클로드 |
| **P2** | catalog resync 로그 스로틀(R2) | 김클로드 |
| DEFER | auth 기기 id 재시도 상수 | **손대지 말 것** |
| soft | 행성 허브에서도 영유권 즉시 고지 원하면 **별 ready** | 대표님 결정 시 |

---

## 7. 김클로드 즉시 실행 지시 (복사본)

```text
@김클로드 김팀장 「전체 재검수」 공유 정본 읽고 착수.

공유 정본:
tools/kim-team-lead/reports/kim-claude-share-full-reaudit-20260804.md

재작업 READY (실행 DoD):
tools/kim-team-lead/reports/kim-claude-ready-rework-boot-batch-warp-20260804.md
task_id=kim-claude-rework-boot-batch-warp-20260804

필수:
1) R0 — handoff PENDING 1블록 통합 · 본 재검수 표 인용 · title ASSIGNED 흡수 마감
2) R1 — DAILY_BATCH_JOIN 20~25s + prewarm 단계 1줄 로그 · cancel 아님 문서화
3) R2 — trade_port_planet_resync DEV 로그 스로틀(동작 무변경)
4) DEFER — auth device retry 상수 금지
5) tsc PASS · device 실기 가능하면 기록 · git commit 금지 · 김팀장 재검수 요청

코드로 이미 AGREE된 것(레이스/RTDB/타이틀/territorial)을 되뒤집지 말 것.
```

---

## 8. 대표님 확인용 (실기 3문항 · 김클로드 handoff에 결과 칸 남길 것)

1. 콜드 기동 → 시작/이어하기 **12초 잠금 없이** 켜지는가  
2. 이어하기 → 차원항로 → **영구 정지 없이** 허브 진입 (상한 이내)  
3. 오프라인 시 RTDB 관련 **LogBox 노란 경고창 미표시** + micro-adjust/trade-route **동일 수치 이중 로그 없음**

---

**끝.** 본 파일이 김팀장 → 김클로드 재검수 공유 정본이다. READY rework와 충돌 시 **READY DoD + 본 §6 우선순위**를 따른다.
