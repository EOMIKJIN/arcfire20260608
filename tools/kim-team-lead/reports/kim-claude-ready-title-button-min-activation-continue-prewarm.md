# 김클로드 착수 — 시작 화면 버튼 최소 활성 · 배치/prewarm 차원항로 전담

> **배정**: 김팀장 (Cursor 본창) · **2026-08-04** · 대표님 지시  
> **task_id**: `title-button-min-activation-continue-prewarm-20260804`  
> **우선순위**: **P0 (UX)** — 「이어하기/시작하기」 12초급 잠금 회귀 금지  
> **김클로드**: 구현·재검수 → `kim-claude-handoff-pending.md` **PENDING** · **git commit 금지** · 김팀장 재검수 필수  
> **규칙 정본(이미 재명기됨 — 코드·문서 일치 확인)**:
> - `AGENTS.md` §시작 화면 버튼 최소 활성  
> - `.cursor/rules/arcfire-main-lead-agent.mdc` §시작 화면 버튼 최소 활성  
> - `.cursor/rules/arcfire-memory-leak-audit-first.mdc` §1 항목4  
> - `docs/BOOT_INIT_OPTIMIZATION_ROADMAP.md` Stage 0 / 0.5

---

## [pss-pre-dev] (코딩 전 · handoff에도 동일 기록)

```text
[pss-pre-dev] hot_path=부팅 1회 게이트·이어하기 탭 후 prewarm · alloc=신규 루프/객체 없음(await 위치·게이트만) · cache=무
[pss-pre-dev] stage=title 즉시 활성 / continue-warp·prewarm 합류 · risk=P1(조기탭·catch-up 미등록)·P5
[pss-pre-dev] verdict=PASS — 타이틀 await 제거 + 차원항로 전담 합류가 헌법
```

---

## 0. 대표님 지시 (원문 취지)

1. 최초 앱 실행 후 **시작하기 / 이어하기 버튼 활성화 시간을 최소화**한다.  
2. **어떤 배치·사전로딩도 시작 화면에 최대한 두지 말 것.**  
3. 전부 **차원항로 진입 로딩 구간** (`ContinueSessionLoadingView` / `runContinueSessionPrewarm` / `continue-warp`)에서 수행.  
4. 개발규칙에 **매번 명기** — (김팀장) 규칙 문서 이미 갱신 → **김클로드는 구현이 규칙과 100% 일치하는지 재검수·보완**.

---

## 1. 문제 (재현)

| 증상 | 원인(코드 정합) |
|------|----------------|
| 시작 화면에서 버튼이 **~12초** 늦게 활성 | `app/_layout.tsx` 가 `postBootSettled` 를 catch-up(+과거 일일배치 wait) 끝날 때까지 미룸 + **`setTimeout(settle, 12_000)` 안전 데드라인** |
| 「배치 로딩 다시 길어졌다」체감 | 타이틀 게이트에 무거운 합류가 붙은 회귀 (일일배치 이관 후에도 **catch-up 12s** 잔존) |

**목표 UX**

| 구간 | 기대 |
|------|------|
| 타이틀 | `bootReady && hydrated && !cloudRestorePending` (+ `postBootSettled`는 **즉시 true**) 수준에서 **즉시** 버튼 활성 |
| 이어하기 탭 후 차원항로 | catch-up wait · 일일 배치 wait · asset prewarm · full CSV — **여기만** 길어질 수 있음 |

---

## 2. 김클로드 DoD (✅ / ❌)

### ✅ 한다

| # | 작업 | 정본 경로 |
|---|------|-----------|
| A | `postBootSettled` = **bootReady 직후 즉시 true**. **12s settleDeadline 금지**. catch-up 완료를 타이틀 게이트에 묶지 않음 | `app/_layout.tsx` |
| B | 벽시계 catch-up·territorial probe: 백그라운드 발화 + **gate 등록**(탭이 defer 400ms 전에도 wait 누락 없게 **Promise 즉시 등록**, defer는 Promise 내부) | `src/arcCore/schedule/arcCoreWallClockCatchUpGate.ts` (신규 또는 동등) · `_layout` 부트·포그라운드 |
| C | `runContinueSessionPrewarm`: 순서 상위 `waitForArcCoreWallClockCatchUpIdle` → `waitForArcCoreDailyBatchIdle` → asset prewarm · full CSV | `src/game/continueSessionPrewarm.ts` |
| D | 부트 `_layout`에서 `runCriticalSessionAssetPrewarm()` **호출 제거** (prewarm은 이어하기 슬롯만) | `app/_layout.tsx` |
| E | 주석·store 설명: `postBootSettled` ≠ 배치 완료. daily batch gate 주석도 타이틀 합류 금지 | `appBootStore.ts` · `arcCoreDailyBatchGate.ts` · `app/index.tsx` |
| F | self-check: `npx tsc --noEmit -p tsconfig.client.json` PASS · 회귀 체크리스트 handoff 기록 |
| G | 규칙 절이 코드와 어긋나면 **최소 수정으로 정합**(규칙 본문 대규모 개편 금지 — 이미 명기됨) |

### ❌ 하지 않는다

| 제외 | 이유 |
|------|------|
| 일일 배치 Wave A~C 성능·completedDayKey 패치 | `daily-ops-batch-incomplete-fix` 별 task |
| `CONTINUE_SESSION_MIN_LOADING_MS` 대규모 UX 애니메이션 개편 | 범위 밖 |
| 클라우드 복원 판정 제거 | 신규 계정 무결성 (의도적 lock) |
| onBoot에 전행성 경제 패스 동기 추가 | 메모리/부트 헌법 위반 |
| git commit / 「완료」 선언 | 김팀장 전용 |

---

## 3. 구현 상세 (1안)

### 3.1 타이틀 게이트

- `titleInteractive ≈ bootReady && postBootSettled && hydrated && !cloudRestorePending`  
- **`postBootSettled`는 bootReady 시점에 즉시 true** (계정 초기화 짧은 lock만 false→restore 유지).  
- **금지 호출(타이틀 settle 경로)**:  
  - `waitForArcCoreDailyBatchIdle`  
  - `waitForArcCoreWallClockCatchUpIdle`  
  - `setTimeout(..., 12_000)` settle  
  - `runCriticalSessionAssetPrewarm` on boot path  

### 3.2 catch-up gate (권장 시그니처)

```ts
// src/arcCore/schedule/arcCoreWallClockCatchUpGate.ts
registerRunningArcCoreWallClockCatchUp(work: Promise<void>): void
waitForArcCoreWallClockCatchUpIdle(): Promise<void>  // no-op if idle
```

`_layout` bootReady effect 예시 의도:

```ts
useAppBootStore.getState().setPostBootSettled(true);
const catchUpWork = (async () => {
  await delay(ARC_CORE_CATCH_UP_DEFER_MS);
  await applyArcCoreWallClockCatchUpFromPersistedGap(arcCoreHub);
  await requestTerritorialCombatProbeAfterCatchUp();
})();
registerRunningArcCoreWallClockCatchUp(catchUpWork);
```

포그라운드 복귀 catch-up도 **같은 gate에 등록**.

### 3.3 차원항로 prewarm 순서

1. `buildCsvStaticIndexesFull` + `yieldToUi`  
2. `await waitForArcCoreWallClockCatchUpIdle()`  
3. `await waitForArcCoreDailyBatchIdle()`  
4. `runCriticalSessionAssetPrewarm` + 기존 세션 워밍  

`continue-warp.tsx` / 타이틀 `handleStart` 이어하기 경로는 모두 `runContinueSessionPrewarm` 공유.

---

## 4. 워크트리 초안 재검수 (필수 · CLAUDE §재검수)

워크트리에 김팀장/세션 초안이 **이미 있을 수 있음**. 김클로드는:

1. 위 DoD와 **파일 단위 diff 대조** (AGREE / PARTIAL / DISAGREE + 파일:줄 근거).  
2. 불완전·위반 시 **직접 보완**.  
3. 중복·불필요 코드 정리.  
4. handoff에 재검수 결과 한 블록 기록.  
5. **추측으로 「이미 반영됨」 완료 금지** — 체크리스트 전항 검증.

---

## 5. 합격 기준 (실기 · handoff에 기록)

| # | 확인 |
|---|------|
| 1 | 콜드 기동 → 시작/이어하기 버튼이 **12초 데드라인에 묶이지 않음** (hydrate 직후급) |
| 2 | 이어하기 탭 → 차원항로 로딩만 길어질 수 있음 (배치 있는 날) · 탭 직후 수 초 freeze-only 회귀 없음 |
| 3 | 배치 없는 평일: 차원항로 ≈ min hold(~1.2s) + 가벼운 prewarm |
| 4 | `grep`/리뷰: 타이틀 settle에 daily/catch-up **wait 없음** · boot에 critical prewarm **없음** |
| 5 | tsc PASS |

---

## 6. handoff 템플릿 (작업 종료 시 상단 삽입)

```text
status=PENDING
task_id=title-button-min-activation-continue-prewarm-20260804
code_changes=YES
commit 금지
team_lead_recheck=AGREE|PARTIAL|DISAGREE + 근거
[pss-pre-dev] (위 3줄 복사)
변경 파일: ...
self-check: tsc=...
실기: (가능 시 1~3) / 미검증이면 명시
김팀장 검수 요청
```

---

## 7. 교차 task

| task | 관계 |
|------|------|
| `daily-ops-batch-incomplete-fix-20260803` | 배치 **완료** 품질 — 본 task와 **병렬**, 본 task는 **어디를 기다리는가**만 |
| vault / economy-band | 무관 · 건드리지 말 것 |

---

**끝.** 김클로드는 본 READY를 정본으로 착수·재검수 후 PENDING handoff만 남긴다.
