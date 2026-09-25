# 인게임 대사 제로로딩 설계 v0.1 — 검토

```text
status=REVIEWED
verdict=AGREE (방향·진단 타당) · 설계 수정 1건 · 보완 3건
date=2026-09-25
reviewer=김클로드
대상=docs/INGAME_DIALOG_ZERO_LOAD_DESIGN.md (v0.1 · 김팀장 · 2026-09-25)
방법=문서 주장 전수를 실제 코드로 재검수 (CLAUDE.md 「김팀장 지시 재검수」)
```

---

## 0. 결론

**설계 방향에 동의한다.** 「창이 보이기 전에 끝내고, 진행 중에는 인덱스만 넘긴다」는 접근이 맞고, 진단(§1)의 사실 주장은 **전수 검증을 통과**했다.

다만 **핵심 가정 하나가 릴리즈 빌드에서 무너진다.** 그대로 구현하면 **dev에서는 고쳐진 것처럼 보이고 실기에서만 재발**한다. 착수 전 결론이 필요하다.

---

## 1. 진단 검증 — 전제는 전부 사실

| 문서 주장 | 검증 | 결과 |
|---|---|---|
| ScrollView 없음, 체감 스크롤 = `TypewriterText` | `NarrativeDialogRow` 전문 | ✅ |
| rAF마다 `setDisplayed(text.slice(0,i))` | `TypewriterText.tsx:79-105` | ✅ |
| §1-2 **A** — Host가 `typewriterActive`를 안 넘겨 타이핑이 바로 시작 | **전역 검색 결과 선언(`:52`)·기본값 `true`(`:76`)·소비(`:156`)뿐, 두 렌더러(`NarrativeOverlayContent.tsx:37` · `intro.tsx:226`) 어디서도 전달 안 함** | ✅ |
| §1-2 **C** — `[다음]`마다 split | `ingameDialogViewModel.ts:135,173` 뷰모델 빌드마다 호출 | ✅ |
| §1-2 **B** — 페이지마다 초상 resolve | `ingameDialogViewModel.ts:166` | ✅ |
| §5 — `resolveIngameDialogSegmentCount` 매 클릭 재호출 | `ingameDialogStore.ts:262` | ✅ |
| CSV 본문은 이미 메모리 | `STORY_SCENES_FROM_CSV` 생성물 | ✅ |

**「글이 늦게 오는 게 아니라 초상 디코드·계산·타이핑이 한 순간에 만난다」는 원인 규정이 정확하다.**

---

## 2. 🔴 R-1 (설계 수정 필요) — `Image.prefetch`가 릴리즈에서 no-op일 수 있다

설계의 게이트는 **「unique 초상 prefetch 완료를 await한 뒤 `ready=true`」**(§3·§7)다. 그런데 재사용 대상으로 지목한 `prefetchImageSources`의 실제 구현은 이렇다.

```ts
// src/assetPipeline/prefetchImageSources.ts:12-18
const resolved = Image.resolveAssetSource(src);
if (resolved?.uri) { await Image.prefetch(resolved.uri); }
catch { /* 프리페치 미지원·URI 없음 등 — 인게임 1차 로드로 폴백 */ }
```

| 빌드 | `resolveAssetSource().uri` | `Image.prefetch` |
|---|---|---|
| **dev (Metro)** | `http://localhost:8081/...` | **동작** |
| **release (번들 드로어블)** | 리소스명 · 스킴 없음(또는 없음) | **실패 → `catch`가 삼킴** |

**파일 주석 자체가 best-effort임을 인정한다** — 「플랫폼에 따라 캐시/워밍에 **도움이 될 수 있음**(실패는 무시)」.

### 왜 치명적인가

릴리즈에서 `await`가 **즉시 resolve**되고 `ready=true`가 켜진다. 그 뒤 첫 `<Image>` 렌더에서 **디코드가 그대로 일어난다** → 설계가 없애려던 §1-2 **A·B 지점이 살아남는다.**

**가장 나쁜 실패 형태다** — dev 실기에서는 고쳐진 것처럼 보이고, **스토어 빌드에서만 재발**한다.

### 그리고 대안이 「재사용」이 아니다

§6-3은 「**필요하면** 오프스크린에 unique `<Image>`를 한 번씩 마운트해 디코드를 끝낸 뒤」라고 선택지로 뒀다. 그러나 위 사정상 **릴리즈에서는 그것이 유일한 신뢰 경로**다.

**저장소에 오프스크린 디코드 수단이 없다** — `src/assetPipeline/` 6개 파일 전수 확인, `offscreen|decodeWarm|prewarmImage` 패턴 **0건**. 즉 **기존 재사용이 아니라 신규 구현**이며, **P0 공수 재산정이 필요**하다.

### 권고

착수 전 둘 중 하나로 결론낸다.

1. **오프스크린 디코드 워머를 P0에 포함**한다(확실하지만 신규 컴포넌트 + 수명 관리 필요), 또는
2. **릴리즈 빌드에서 `Image.prefetch` 실효성을 먼저 실측**하고, 듣지 않으면 1로 간다.

**2를 먼저 하는 편이 싸다.** 측정 없이 오프스크린 워머를 만들면 불필요한 기계를 하나 더 얹게 된다.

---

## 3. 🟡 보완 3건

### R-2 — `ready` 대기에 상한·폴백이 없다

§3은 「창 present 자체를 팩 완료 후로 미룸」 + 「대기 스피너 금지」다. prefetch·디코드가 느리면 플레이어가 [대화]를 눌렀는데 **아무 일도 일어나지 않는 구간**이 생기고, 설계에 **타임아웃이 없다.**

> **권고**: 상한(예: 300~500ms)을 두고 초과 시 **현행 동작으로 degrade해 present**한다. **「끊기는 자막」보다 「안 열리는 창」이 더 나쁘다.** unique 12장 상한(§4)에서 최악을 가정하면 더 그렇다.

### R-3 — 회전 시 레이아웃 불일치를 비범위에 명시할 것

§4는 폭 키가 바뀌면 「창이 닫힌 뒤」 재빌드, **진행 중 재분할 금지**다. 대사 중 회전하면 **이전 폭 기준 3줄 분할이 그대로 보인다.** 타당한 트레이드오프지만 지금은 어디에도 「수용한다」고 안 적혀 있다 → **§9(비범위)에 한 줄 추가** 권고.

### R-4 — intro를 P0 범위에 명시할 것

§7이 「intro도 같은 3단 · 별도 파이프 금지」라고 했는데, 현재 `intro.tsx`는 **자체 경로**다 — `:98`에서 `resolveIngameDialogPortraitSource`를 직접 호출하고 `:226`에서 Row를 직접 렌더한다. §10 단계표에 intro가 안 보인다.

> **권고**: P0 항목에 **「intro 포함」**을 명시. 안 그러면 인트로만 남는다.

---

## 4. ✅ 설계가 놓친 유리한 사실 — P0가 생각보다 싸다

### `active` 배선이 이미 end-to-end로 존재한다

```text
TypewriterText.active  (:21,:33,:57-62 — false면 rAF 미시작)
      ↑
NarrativeDialogRow.typewriterActive  (:52 선언 · :76 기본 true · :156 전달)
      ↑
[ 아무도 안 넘김 ]   ← 여기만 채우면 된다
```

**「ready 전 타이핑 금지」는 신규 기계가 아니라 배선 한 줄**이다(두 렌더러에서 `typewriterActive={session.ready}`). 설계가 이 점을 짚지 않았는데, **P0 리스크를 크게 낮춘다.**

### `memo` 덕분에 정상 상태 비용은 이미 낮다

`NarrativeDialogRow`는 `memo`(`:59`)이고 `displayed`는 `TypewriterText` 내부 state다. 따라서 **글자당 `setState`가 Row·`<Image>`까지 리렌더하지 않는다.**

→ 「진행 중 부하」의 실체가 **타이핑 자체가 아니라 열기 전 로딩**이라는 설계 진단이 구조적으로도 맞다. 팩 도입 후 P2(카드 remount 최소화)·P3(Skia 경쟁)는 **실측 후에만** 손대도 된다는 판단도 타당하다.

---

## 5. 착수 순서 권고

| 순위 | 항목 | 근거 |
|---|---|---|
| 1 | **`typewriterActive={session.ready}` 배선** | 저비용·즉시 효과. §1-2 A를 단독으로 없앤다 |
| 2 | **R-1 결론** — 릴리즈 prefetch 실측 → 필요 시 오프스크린 워머 | 이게 안 정해지면 P0 전체가 헛돈다 |
| 3 | 세션 팩(P0) + 인덱스 재생(P1) | 설계대로 |
| 4 | R-2 타임아웃 · R-4 intro 포함 · R-3 비범위 명시 | 문서 보완 |

**1번은 팩 없이도 단독으로 의미가 있다.** 지금은 창이 뜨자마자 타이핑과 첫 초상 디코드가 같은 틱에서 만나는데, 그것만 떼어내도 첫 페이지 체감이 달라진다.

---

## 6. 승인 체크(§11)에 추가 권고

- [ ] **릴리즈 빌드에서 초상 prefetch가 실제로 듣는지 확인**했다 (R-1)
- [ ] `ready` 대기에 **상한과 degrade 경로**가 있다 (R-2)
- [ ] **intro가 P0 범위**에 들어 있다 (R-4)

---

**김클로드는 읽기만 했다** — 코드·CSV 변경 0 · 커밋 0. 구현은 대표님 지시 후 김팀장 소관.
