# 릴리즈 빌드 UI/UX 진행 정지 — 전수 정밀 검사

```text
status=PENDING
task_id=release-build-ui-flow-audit-20260928
kind=CODE_AUDIT (김클로드 코드 변경 0 · 커밋 0)
date=2026-09-28
증상(대표님)=릴리즈 빌드 최초 시작 · 퀘스트 진행 중 «전투 결과가 안 나옴» · «인앱 대화창이 안 열림». 개발/디버그 연결 시에는 미발생.
verdict=단일 실패 클래스로 수렴 — «데드라인 없는 InteractionManager.runAfterInteractions»
```

---

## 0. 결론

**증상 2개가 같은 뿌리다.** `InteractionManager.runAfterInteractions` 는 인터랙션·전환·Reanimated 애니메이션이 안 풀리면 **영구 대기**한다. 이 저장소는 이미 **3번** 같은 사고를 겪고 **그때마다 그 파일에서만** 고쳤다. **저장소 차원의 차단 장치가 없어** 같은 패턴이 **18곳** 남아 있고, 그중 하나가 **바 인앱 대화창**이다.

> 개발 빌드에서 안 보이는 이유: 릴리즈는 애니메이션이 끊김 없이 돌아 IM 큐가 비는 순간이 드물다. 개발 빌드는 프레임 드랍·Metro·디버거 일시정지가 **우연히** IM 을 배수시켜 준다. **최초 시작**은 캐시가 없어 로딩이 길고 인터랙션이 더 오래 겹친다.

---

## 1. 🔴 R-1 (P0) — 바 인앱 대화창: 데드라인 없는 IM. 증상 직결

`app/(game)/bar.tsx:405`

```js
InteractionManager.runAfterInteractions(() => {
  requestAnimationFrame(() => {
    void presentBarDialogTurns(dialogPayload);
  });
});
```

- **폴백 타임아웃이 없다.** IM 이 안 풀리면 `presentBarDialogTurns` 는 **영원히 호출되지 않는다.**
- 하필 바는 **공연 연출(`startBarPerformanceSong`)·점원 애니메이션**이 상시 도는 화면이다 — IM 이 안 풀릴 조건이 가장 잘 갖춰진 곳.
- 게다가 `onDismiss` 안에서 `holdSongForIntroRef.current = false` 로 곡을 되돌리므로, **대화가 안 열리면 곡 상태도 복구되지 않는다.**

**「인앱 대화창이 제대로 열리지 않는다」의 재현 경로가 이것이다.**

---

## 2. 🔴 R-2 (P0) — 같은 패턴 18곳 (데드라인 없음)

`src/`·`app/` 전수(테스트 제외) 결과 `InteractionManager.runAfterInteractions` **21건 / 18파일**. 이 중 **보호 장치가 있는 건 3건뿐**(`stageNavGate` 2 · `localAccountReset` 1).

### UI·게임 진행을 막는 것 (우선 조치)

| # | 위치 | 막히면 생기는 일 |
|---|---|---|
| 1 | `app/(game)/bar.tsx:405` | **바 대화창 안 열림** (R-1) |
| 2 | `src/arcCore/schedule/presentArcCoreDailyOpsSummaryAlert.ts:31` | 일일 배치 요약 **알림 미표시** |
| 3 | `src/firebase/gameSaveBackup/GameSaveRestorePendingConsumer.tsx:44` | **최초 시작 세이브 복구 미실행** |
| 4 | `src/assetPipeline/useStageAssetPrewarm.ts:32` | 스테이지 에셋(초상 포함) 프리웜 미실행 → 대화 초상 지연 |
| 5 | `app/_layout.tsx:218`, `:295` | 부트 체인 일부 미실행 |
| 6 | `src/store/planetCoreRuntimeStore.ts:119`, `:557` | 행성 런타임 갱신 미실행 |
| 7 | `src/arcCore/chat/arcCoreChatWorldProposalExecute.ts:43` | 대화 제안 실행 미반영 |

### 배경 작업 (영향도 낮음)

`nativeReclaim` 3건 · `arcCore/subcores` 3건 · `firebaseAnonymousAuth` · `devMetroReloadGuard`(dev 전용) · `continueSessionPrewarm:68`

---

## 3. 🔴 R-3 (P0 · 구조) — 세 번 당하고도 저장소 차단 장치가 없다

같은 실패를 이미 세 번 겪고, **매번 그 파일에서만** 고쳤다:

| 시점 | 파일 | 남아 있는 근거 |
|---|---|---|
| 과거 | `src/game/continueSessionPrewarm.ts:69-71` | 주석: 「**영구 대기 → prewarm Promise 미완 → planet으로 navigate 못 함(검은 화면 정지)**」 → `yieldToUi()` 로 교체 |
| 과거 | `src/account/localAccountReset.ts:314-316` | 주석: 「⚠️ **InteractionManager 단독 의존 금지**」 → `runStageUiAfterIdle` |
| **금번(미커밋)** | `src/game/transitCombat/transitCombatPostFlow.ts:69-73` | `InteractionManager` → `runStageUiAfterIdle` 로 교체 |

**정답 패턴은 이미 저장소에 있다** — `src/navigation/stageNavGate.ts:19` `runStageUiAfterIdle` = IM **또는 2500ms 데드라인** 중 먼저 오는 쪽에서 **반드시 1회** 실행.

그런데 이를 강제하는 감사가 **없다.** 유일한 방어는 `transitCombatPostFlow.test.ts:12-14` 의 **파일 한정** 문자열 검사:

```js
assert.doesNotMatch(src, /InteractionManager\.runAfterInteractions/);
```

**→ 같은 테스트를 저장소 전역 감사로 승격해야 재발이 멈춘다.** (배경 작업은 allowlist 로 예외 처리)

---

## 4. 🟠 R-4 (P1) — `runWhenUiScreenReady` 가 «큐에 넣고 true» 를 반환한다

`src/ui/process/uiForegroundSequence.ts:62-71`

```js
export function runWhenUiScreenReady(run, bypass = false) {
  if (bypass || (isUiScreenShellReady() && !isDialogBusy())) return run();
  if (pending.length >= PENDING_CAP) return false;
  pending.push(() => { run(); });
  return true;            // ← 실제로는 «대기열에 넣음». 호출측은 «떴다» 로 읽는다
}
```

`presentScene` / `presentAdHoc` / `tryFireTrigger` 가 모두 이걸 통과하므로, **호출측은 «표시됨» 과 «대기열» 을 구분할 수 없다.**

- `transitCombatPostFlow.presentAdHocTransitDialog:186` 은 뒤에 `isIngameDialogActive()` 를 한 번 더 확인해서 **우연히 안전**하다.
- `presentMissionClearWhenReady:249-258` 은 반환값만 믿는다 → 큐에 들어간 경우 `onDismiss` 가 안 와서 **20초 타임아웃까지 정지**.

**권고**: 반환 타입을 `'presented' | 'queued' | 'rejected'` 로 바꾸거나, 큐잉 시 `false` 반환.

---

## 5. 🟠 R-5 (P1) — flush 가 한 번에 «1개»만 꺼낸다 → 큐 고착

`uiForegroundSequence.ts:73-79`

```js
export function flushUiScreenReadyTasks() {
  if (!isUiScreenShellReady()) return;
  if (isDialogBusy()) return;
  const next = pending.shift();   // ← 1개만
  if (!next) return;
  next();
}
```

flush 트리거는 **`markUiScreenShellReady`(화면당 1회)** 와 **`subscribeIngameDialogBecameIdle`(대화가 닫힐 때)** 뿐이다.

**고착 조건**: 큐에 2건이 쌓인 상태에서 shell 이 ready → 1번만 실행. 그런데 **1번이 대화를 열지 못하면**(예: `presentScene` 이 `scene.triggerRepeat === 'once'` + 이미 seen 으로 `false` 반환) «대화가 닫힘» 이벤트가 영영 안 온다 → **2번은 영구 대기**.

`PENDING_CAP = 4` 이므로 이후 요청도 조용히 `false`. **테스트 미커버**(`uiForegroundSequence.test.ts` 는 큐 1건 시나리오만 검증).

---

## 6. 🟠 R-6 (P1) — 전투 후처리 최악 지연이 «분» 단위

`transitCombatPostFlow.runTransitCombatPostFlow:296` 은 6단계를 **직렬**로 기다린다. 각 단계 상한을 더하면:

| 단계 | 상한 |
|---|---|
| `presentAdHocTransitDialog` 재시도 루프 | **12,000ms** |
| 승리 보상 오버레이 `awaitOverlayClose` | `ARC_OVERLAY_DEFAULT_AUTO_DISMISS_MS + 2000` |
| 레벨업 오버레이 | 동일 |
| `presentMissionClearWhenReady` | **20,000ms** |
| 장비 파손 알림 | 오버레이 상한 |
| 각 단계 사이 `waitForIngameDialogIdle` | 각 **20,000ms** |

이 동안 화면은 **전투 화면 그대로 `exitPending`** 이고 worldmap 이동은 호출측에서 대기한다.
→ 대표님이 보신 **「전투 결과가 안 나온다」는 «영구 정지» 가 아니라 «수십 초~분 단위 정지»** 일 수 있다. R-1/R-2 로 앞단이 막히면 각 상한을 전부 소진한다.

**권고**: 전체 후처리에 **단일 총 상한**(예 25s)을 씌우고 초과 시 즉시 worldmap 이동.

---

## 7. 🟡 R-7 (P2) — 전투 UI 가 dev/release 에서 «설계상» 다르다

`src/combat/capitalRealtimeCombatUiFlags.ts:5`

```js
export const CAPITAL_REALTIME_COMBAT_LOG_UI_ENABLED = __DEV__;
```

전투 로그 UI 가 **개발 빌드에만** 뜬다. 버그는 아니지만, **개발 빌드로 QA 하면 릴리즈와 다른 화면을 보게 된다** — 이번 사안처럼 «개발에선 멀쩡» 판단을 흐린다. QA 절차에 명시 필요.

---

## 8. ✅ 오탐으로 판명 — 보고에서 제외

- **`endUiScreenShell` 이 대기 큐를 비우는 것**(`uiForegroundSequence.ts:39-43`)은 **의도된 설계**다. `uiForegroundSequence.test.ts:28` 「leaving a screen drops queued dialogs」가 명시적으로 검증한다. 버그 아님.
- **`app/(game)/combat.tsx` 가 `useUiScreenShell` 을 안 쓰는 것**도 문제 아님 — shell 이 `null` 이면 `isUiScreenShellReady()` 가 `true` 라 게이트가 열린다.
- 전투 결과 표시 경로는 `runTransitCombatPostFlow` **단일 경로**다(다른 우회 경로 없음).

---

## 9. 김팀장 최근 수정 검토

| 변경 | 판정 |
|---|---|
| `transitCombatPostFlow`: `InteractionManager` → `runStageUiAfterIdle` | **정확하다.** 실패 클래스를 제대로 짚었다 |
| `awaitOverlayClose` + `TRANSIT_OVERLAY_CLOSE_DEADLINE_MS` 도입 | **좋다.** 오버레이 미표시 시 영구 대기 차단 |
| `combat.tsx`: `captainId`/`captainName` 전달 | 기능 추가. 이번 증상과 무관 |
| `resolveTransitCombatEndDialog` 신규 + 테스트 155줄 | 구조 양호 |

**다만 범위가 한 파일에 갇혔다.** 같은 원인이 R-2 의 18곳에 남아 있고, **바 대화창(R-1)은 대표님이 보고한 증상 그 자체**인데 미수정이다.

---

## 10. 조치 제안 (착수 순서)

| 순위 | 조치 | 범위 |
|---|---|---|
| **1** | `app/(game)/bar.tsx:405` → `runStageUiAfterIdle` | 1줄. 증상 직결 |
| **2** | R-2 «UI·진행 차단» 7곳 → `runStageUiAfterIdle` | 각 1줄 |
| **3** | **`audit:no-bare-interaction-manager` 신설** — `transitCombatPostFlow.test.ts` 의 검사를 전역 승격, 배경 작업은 allowlist | 재발 방지 본체 |
| 4 | R-4 반환 타입 `'presented'\|'queued'\|'rejected'` | 계약 수정 |
| 5 | R-5 flush 를 «큐가 빌 때까지» 또는 재진입 안전 루프로 | + 다건 테스트 |
| 6 | R-6 후처리 총 상한 도입 | |
| 7 | R-7 QA 절차에 dev/release UI 차이 명시 | 문서 |

### 실기 검증 절차 (릴리즈 빌드)

```
1. 최초 설치(앱 데이터 삭제) → 릴리즈 빌드 첫 실행
2. 바 입장 → 공연 시작 → 점원 대화 시도
   - 대화창이 안 열리면 R-1 확정
3. adb logcat 에서 IM 대기 흔적 확인:
   adb logcat -d | Select-String "presentBarDialogTurns|uiForegroundSequence|MEM_PROFILE"
4. 퀘스트 전투 → 승리 → 결과창까지 걸린 «초» 측정 (R-6 구분: 영구 정지 vs 지연)
```

---

## 11. 한계

- **정적 분석이다.** R-1 은 코드상 인과가 명확하지만, 「실기에서 IM 이 실제로 안 풀린다」는 §10 절차로 확인해야 확정된다.
- R-5 고착은 조건부다 — 「큐 2건 + 선행 task 가 대화를 못 엶」이 동시 성립해야 한다. 코드상 가능하나 실측 사례는 없다.
- 릴리즈 전용 요인 중 **R8/ProGuard·Hermes 최적화**는 이번에 보지 않았다. 위 항목으로 재현되지 않으면 그쪽을 파야 한다.

---

**김클로드는 읽기만 했다** — 코드 변경 0 · 커밋 0.
