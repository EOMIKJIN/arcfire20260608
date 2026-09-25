# 인게임 대사 제로로딩 P0+P1 구현 — 검수

```text
status=REVIEWED
verdict=PASS (차단 0 · 실기 확인 1 · P3 관찰 2)
date=2026-09-25
reviewer=김클로드
대상=IngameDialogPortraitWarmer · ingameDialogSessionPack · ingameDialogSessionAdvancePack · Host/ViewModel/Store/Overlay/intro
설계=docs/INGAME_DIALOG_ZERO_LOAD_DESIGN.md v0.2
```

---

## 0. 결론

**차단 사유 없음.** 제가 낸 검토 4건(R-1~R-4)이 **전부 반영**됐고, 설계 계약(§2 「진행 중 로드 0」)이 **코드로 닫혔다.**

| 게이트 | 결과 |
|---|---|
| `ingameDialogSessionPack.test.ts` 외 3종 | ✅ **17/17 PASS** |
| `tsc --noEmit -p tsconfig.client.json` | ✅ **EXIT=0** |
| `npm run audit:hot-path` | ✅ **PASS (hits=0)** |

---

## 1. R-1~R-4 반영 확인

| # | 내 지적 | 반영 | 근거 |
|---|---|---|---|
| **R-1** | `Image.prefetch`가 릴리즈에서 no-op → 오프스크린 디코드가 유일 신뢰 경로 | ✅ **신규 `IngameDialogPortraitWarmer`** | 오프스크린 240×240 `<Image>`를 unique만큼 마운트. `prefetchImageSources`는 **best-effort로 병행**(`Host:103`) — 계층 분리가 정확하다 |
| **R-2** | `ready` 대기에 상한·degrade 없음 | ✅ **`INGAME_DIALOG_READY_TIMEOUT_MS = 400`** | `beginReadyWatch()` + **`readyGen` 세대 가드**로 stale 타이머 무시(`store:80-89`). 초과 시 present |
| **R-3** | 회전 시 이전 폭 분할 잔존을 비범위 명시 | ✅ 문서 `:249`에 수용 명시 | |
| **R-4** | intro가 자체 경로라 누락 위험 | ✅ **완전 포함** | 자체 타임아웃(`intro:105`) · 워머(`:259`) · `typewriterActive={introDialogReady}`(`:301`) · **ready 전 버튼 disabled**(`:318,:328`) |

**설계 문서도 v0.2로 갱신**되어 R-1~R-4를 본문에 인용했다. 추적 가능성이 좋다.

---

## 2. 계약 충족 — 코드로 확인

### 「ready 전 로드 0」

```ts
Host:106   const overlayVisible = session?.ready === true;
Host:109   if (!session || !overlayVisible) return null;   // ViewModel 빌드 자체를 막는다
```

→ **ready 전에는 split·resolve·ViewModel이 아예 돌지 않는다.** `typewriterActive: true`(`:121`)가 하드코딩이어도 **config가 ready 이후에만 만들어지므로** 정확하다.

### 「진행 중 계산 0」 (P1)

```ts
ingameDialogSessionAdvancePack.ts:17-18
  const next = (session.stepIndex ?? 0) + 1;
  if (next >= pack.steps.length) return { type: 'completed', session };
```

→ 인덱스 증가와 경계 검사뿐. **`resolveIngameDialogSegmentCount` 호출 없음.**

```ts
ingameDialogViewModel.ts:157-160
  const packed = session.pack?.steps[session.stepIndex ?? 0];
  if (packed) return viewModelFromPackStep(packed, session.pageComplete);
```

→ 팩이 있으면 **조기 반환**. 남아 있는 `splitNarrativeDialogSegments`(`:170,208`)·`resolveIngameDialogPortraitSource`(`:201`)는 **폴백 전용**이며, R-2 degrade(팩 없이 ready) 때만 도달한다. **설계 의도와 일치.**

### 수명·상한

| 항목 | 확인 |
|---|---|
| 팩 상한 | `STEP_CAP = 64` · `PORTRAIT_CAP = 12` — 설계대로 |
| ready 타이머 해제 | **`clearReadyWatch()` 11곳** (dismiss·abort·cancel 전 경로) — 누수 없음 |
| 팩 해제 | `pack: null` 세션 전환 시 |
| 워머 수명 | `if (!session \|\| !warmerSources...) return null`(`Host:167`) → 세션 종료 시 언마운트 |
| 신규 Skia / setInterval | **0 / 0** (setTimeout 2종만) |

### 워머 자체

`onLoad`·`onError`를 **둘 다** 카운트(`:51-52`)해 **깨진 에셋에서 영원히 안 끝나는 상황을 막는다.** `firedRef` 중복 방지, `memo`, `pointerEvents="none"`, `accessibilityElementsHidden`. 견고하다.

---

## 3. 🟡 실기 확인 필요 1건 — R-1의 핵심 가정은 정적으로 증명 불가

**「`opacity: 0` 오프스크린 `<Image>`가 릴리즈 Android에서 실제로 디코드를 끝내는가」는 기기에서만 확인된다.**

- 플랫폼이 완전 투명·클리핑된 뷰의 디코드를 지연시키면, `onLoad`가 와도 본 카드 렌더에서 다시 비용이 날 수 있다
- 이 한 점에 **R-1 해결 전체가 걸려 있다**

> **권고**: 화자 10회 이상 교체되는 긴 씬을 **릴리즈 빌드 실기**로, 첫 페이지와 전환 직후 자막 속도가 같은지 확인. 남으면 `opacity: 0.01` 또는 화면 밖 배치(`left: -9999`)로 바꾸는 선택지가 있다.

---

## 4. 🟢 P3 관찰 2건

### O-1 — 렌더 본문에서 ref 할당

```ts
IngameDialogPortraitWarmer.tsx:20
  onWarmedRef.current = onWarmed;   // 렌더 중 side effect
```

React 권장 패턴이 아니며 동시성 렌더에서 예측이 어렵다. 현재 RN 렌더러에서는 동작하고, intro가 매 렌더 새 클로저를 넘기므로 **최신값 유지 목적은 달성**된다. 다만 effect로 옮기면 구조적으로 안전하다.

### O-2 — 워머 effect deps가 `[total]`

```ts
useEffect(() => { doneRef.current = 0; firedRef.current = false; ... }, [total]);
```

**길이가 같고 내용만 다른** sources로 교체되면 `firedRef`가 리셋되지 않아 `onWarmed`가 다시 발화하지 않는다. 현재는 `key`(sceneId/adhocId) + 세션 null 시 언마운트로 막혀 있어 **실질 위험은 낮다.** deps에 sources 신원(예: 첫 소스 키)까지 포함하면 구조적으로 닫힌다.

---

## 5. 메모리 관찰 (결함 아님 · 기록용)

문서 `:189`가 「워머는 세션이 닫힐 때까지 남는다」고 명시했다. unique 12장 × 240×240 ARGB ≈ **약 2.7MB**가 대화 동안 상주한다.

**의도된 트레이드오프다** — 워밍 후 언마운트하면 Fresco가 evict해 중간 재디코드가 생기고 목표가 깨진다. 세션 종료 시 해제되므로 누수가 아니다.

다만 CLAUDE.md 「메모리/PSS 먼저」 기준상, 위 §3 실기 확인 때 **PSS도 함께 측정**해 두면 좋다. 긴 씬 중 PSS floor가 세션 전후로 복귀하는지만 보면 충분하다.

---

## 6. 총평

**설계 검토 → 구현 반영 → 문서 갱신의 고리가 완결됐다.** 특히 좋았던 세 가지.

1. **R-1을 「추정으로 워머부터 만들기」가 아니라 계층으로 풀었다** — `prefetch`는 best-effort로 남기고 워머를 신뢰 경로로 얹었다. 둘 중 하나를 버리지 않은 판단이 맞다.
2. **degrade 경로에 세대 가드(`readyGen`)를 넣었다.** 400ms 타이머가 이전 세션 것이면 무시한다 — 세션이 빠르게 바뀔 때 조용히 깨질 자리를 미리 막았다.
3. **intro에서 버튼까지 ready로 잠갔다.** 창만 막고 버튼을 열어 두면 ready 전 `pressNext`가 들어와 상태가 꼬인다. 설계에 없던 디테일을 스스로 채웠다.

**차단 없음.** 실기 1건과 P3 2건만 남는다.

---

**김클로드는 읽기만 했다** — 코드·CSV 변경 0 · 커밋 0. 테스트·빌드·감사는 검증 목적 실행.
