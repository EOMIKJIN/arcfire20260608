# 인게임 대사 — 제로로딩 자막 설계 (v0.2)

> **문서 버전**: v0.2  
> **작성**: 2026-09-25 · 김팀장  
> **상태**: **P0+P1 구현** (김클로드 검토 R-1~R-4 반영)  
> **지시**: 자막이 나오는 중의 로딩을 없앤다. 모든 대사는 **인앱 대사 최초 화면이 시작되기 전**에 미리 로딩하고, 실제 진행 중에는 스크롤(타이핑) 속도에 로딩 부하가 **0**.  
> **검토**: `tools/kim-team-lead/reports/kim-claude-ingame-dialog-zero-load-design-review-20260925.md`  
> **축**: 1차 통신 게이트만 (`NarrativeDialogRow` · `IngameDialogHost` · intro 동일 3단). 2차 메신저·NL·WAVE FPS HOLD 비범위.  
> **유지**: `NARRATIVE_DIALOG_LAYOUT` 수치 불변 · 카드 고정 높이 482 · ScrollView 대사창 금지 · 함장 초상 전수를 부트/`listCriticalSessionImageSources`에 넣지 않음 · 시작 화면 버튼에 prewarm 금지.  
> **교차**: `.cursor/rules/arcfire-ingame-dialog-ui-default.mdc` · `docs/CONVERSATION_TWO_GATE_DESIGN.md` · `src/game/ingameDialog/` · `src/components/TypewriterText.tsx`

```text
[pss-pre-dev] hot_path=세션 오픈 1회 팩 빌드+prefetch · 진행은 인덱스만
[pss-pre-dev] alloc=세션 팩 1(페이지 상한) · 초상 unique N · 틱/rAF 신규 객체 0
[pss-pre-dev] stage=present 게이트에서만 워밍 · dismiss 시 팩 dispose · 부트/타이틀 금지
[pss-pre-dev] verdict=설계 PASS — 구현 시 팩 상한·dismiss dispose 없으면 REDESIGN
```

---

## 0. 한 줄

대사창이 **보이기 전에** 그 세션의 글·초상·세그먼트를 한 번에 끝내 두고, 창이 열린 뒤에는 **이미 만든 칸만 넘긴다.**  
길수록, 장면(화자·초상)이 바뀔수록 이 규칙이 더 필요하다.

---

## 1. 대표님 예측이 맞는 이유 (현행)

레이아웃 계약상 대사창에 **ScrollView는 없다.** 체감 「자막 스크롤」은 `TypewriterText`가 **글자를 일정 속도로 이어 붙이는 것**이다.

```text
presentScene() → session 즉시 set
        → IngameDialogHost 가 현재 페이지만 ViewModel 생성
        → Overlay present → NarrativeDialogRow 마운트
        → Typewriter rAF 시작  ← 여기부터 「자막이 나오는 중」
        → 같은 순간에 <Image> 초상 디코드
[다음]  → 다음 페이지 split + 초상 resolve + Overlay patch
        → Typewriter remount + 새 Image 디코드  ← 장면이 길수록 반복
```

### 1-1. 자막 진행이 JS 스레드와 한몸

`TypewriterText`는 `requestAnimationFrame`마다 글자 수를 올리고 `setDisplayed(text.slice(0, i))`를 한다.  
속도(`speed` ms/글자)는 **JS가 한가할 때만** 일정하다. 같은 스레드에서 이미지 디코드 콜백·require·split·store patch가 끼면 한 프레임이 밀리고, 자막이 끊기거나 한꺼번에 튀어 나온다.

### 1-2. 지금 「중간 로딩」이 생기는 지점

| # | 언제 | 무엇이 로드되나 | 자막과 겹침 |
|---|---|---|---|
| A | 창이 뜨는 순간 | 1페이지 초상 `<Image>` 최초 디코드. prefetch 없음 | **겹침** — `typewriterActive`를 Host가 넘기지 않아 타이핑이 바로 시작됨 |
| B | `[ 다음 ]` · 화자 교체 | 다음 페이지 초상 디코드 · `resolveIngameDialogPortraitSource` | **겹침** — 새 `typewriterKey`로 타이핑이 다시 시작되는 동시에 Image 교체 |
| C | `[ 다음 ]` 마다 | `splitNarrativeDialogSegments` + 현재 페이지만 ViewModel 재계산 | 짧지만 JS. 장면이 많을수록 누적 |
| D | 페이지마다 | Overlay `patch` + `TypewriterText` remount(`key=typewriterKey`) | 타이핑 리셋과 레이아웃이 한 틱에 몰림 |
| E | (부수) | 허브 궤도 Skia/rAF가 창 아래에서 계속 돎 | 자막 rAF와 JS 경쟁. 1차 원인이라기보다 **팩 적용 후에도 남으면** 별도 |

CSV 본문 자체는 `STORY_SCENES_FROM_CSV`로 이미 메모리에 있다. **글 파일이 늦게 오는 것이 아니다.**  
늦게 오는 것은 **초상 디코드 + 다음 칸 계산 + 타이핑 루프가 같은 순간에 만남**이다.

장면이 길어질수록 B·C·D가 페이지 수만큼 반복된다. 그래서 「길고 전환이 많을수록 중간 로딩」이 커진다.

### 1-3. 지금 게이트가 안 막는 것

`runWhenUiScreenReady`는 **허브 셸(메뉴·첫 프레임)** 이 끝난 뒤에 창을 연다.  
**그 씬의 초상·전 페이지 세그먼트**를 기다리지 않는다. 셸 레디 ≠ 대사 제로로딩.

부트/`runCriticalSessionAssetPrewarm`에 함장 초상 전수를 넣는 것은 **금지**다 (`npcCaptainPortraitAssets.ts`). 타이틀 버튼에도 묶지 않는다.

---

## 2. 목표 계약 (합격 정의)

실제 대사 진행(첫 글자가 움직이기 시작한 뒤 ~ 창 dismiss) 동안 아래가 **0**이어야 한다.

| 금지 (진행 중) | 허용 (창이 보이기 전 1회) |
|---|---|
| `Image.prefetch` / 초상 디코드 시작 | 세션 unique 초상 prefetch + 디코드 완료 대기 |
| `splitNarrativeDialogSegments` | 세션 전 페이지 세그먼트 분할 |
| `resolveIngameDialogPortraitSource` | 팩 빌드 때 1회 |
| Metro/에셋 `require` 추가 해석 | 팩 빌드 때 맵에서 source 확정 |
| 페이지마다 ViewModel 전량 rebuild | `pack.pages[i]` 인덱스만 |
| persist · 카탈로그 순회 · LLM | 해당 없음 (1차 통신 템플릿만) |

**스크롤 속도에 로딩 부하 0** = 타이핑 rAF 한 틱 안에 네트워크·디코드·split·resolve가 들어가지 않음.  
글자 진행은 이미 메모리에 있는 `string`을 자르기만 한다.

시각 합격: 화자 10회 이상 바뀌는 긴 씬에서도 자막 속도가 첫 페이지와 같다. 장면 전환 직후 한 글자 멈춤·한꺼번에 밀려 나옴 없음.

---

## 3. 권장안 (1안) — 세션 팩 + 오픈 게이트

창을 두 단계로 나눈다.

```text
present 요청
    → (기존) 화면 셸 ready
    → [신규] build*IngameDialogSessionPack(scene|adhoc|intro)
    → unique 초상: prefetch(best-effort) + 오프스크린 워머(릴리즈 신뢰 경로, R-1)
    → 400ms 상한 후 degrade present (R-2). 워머는 세션 동안 계속
    → session.pack + session.ready=true
    → 그때만 Overlay present · typewriterActive=true
진행
    → pack.steps[stepIndex] 만 표시
    → [다음] = stepIndex += 1  (계산 0)
닫힘
    → pack = null · 워머 언마운트
```

팩이 끝나기 전에는 **자막 rAF를 시작하지 않는다.**  
대기 중 UI는 짧게(어두운 초상 칸 + 빈 대사 슬롯, 또는 창 자체를 아직 present 하지 않음).  
대기 스피너·허브 위 로딩 모달을 새로 뿌리지 않는다. `ArcOverlayHost` 밖 Alert 금지.

권장 기본: **창 present 자체를 팩 완료 후로 미룸.** 사용자는 「통신이 열린 순간부터」 끊김 없는 자막만 본다.  
셸 레디와 팩 워밍이 겹치면 체감 대기는 한 번이다.

---

## 4. 세션 팩 (무엇을 미리 만드나)

한 세션 = CSV 씬 1개 또는 adhoc 1건. **지금 연 대화만.** 다음 퀘스트·전 은하 대사를 미리 만들지 않는다.

```text
IngameDialogSessionPack
  sceneId | adhocId
  locale, nicknameHash, splitWidthKey
  steps[]: {
    stepIndex
    pageIndex, segmentIndex
    label, text            // 이미 치환·정규화·3줄 분할 완료
    typewriterKey, typewriterSpeedMs
    imageSource            // require 결과 (모듈 레퍼런스)
    portraitScale
    buttonText, secondaryButtonText?
    isFinalStep
  }
  uniquePortraitSources[]  // prefetch 대상, 중복 제거
  ready: boolean
```

- 텍스트: 닉네임·`[미션제목]`·궤도 토큰 치환까지 팩 빌드 때 끝낸다.  
- 분할: `splitNarrativeDialogSegments`를 **모든 CSV 페이지**에 1회. `[다음]`에서 다시 돌리지 않는다.  
- 초상: 페이지마다 `resolveIngameDialogPortraitSource` 1회 → unique 목록만 prefetch.  
- 폭 키: `windowWidth + insets`. 회전으로 폭이 바뀌면 팩을 **창이 닫힌 뒤** 다음 present에서 다시 만든다. 진행 중 재분할 금지.

상한 (구현 시 상수, 추측 확대 금지):

| 캡 | 제안 | 이유 |
|---|---|---|
| steps | 64 | 비정상 CSV 방어 |
| unique 초상 | 12 | 한 씬 화자 수. 전 함장 맵 금지 |
| 팩 수명 | 활성 세션 1개 | 동시 1 통신 게이트와 동일 |
| persist | 없음 | 로컬 메모리만. AsyncStorage 금지 |

adhoc도 동일: payload 텍스트를 세그먼트로 쪼개 팩에 넣고 초상 1장을 prefetch.

---

## 5. 재생 경로 (제로로딩)

`IngameDialogHost` / `buildIngameDialogViewModel`는 진행 중 **현재 step만 읽는다.**

```text
viewModel = pack.steps[session.stepIndex]
imageSource = step.imageSource   // 이미 prefetch·디코드된 소스
text = step.text                 // 이미 3줄
```

`pressNext`는 `stepIndex + 1`과 `pageComplete` 리셋만 한다.  
`resolveIngameDialogSegmentCount`를 매 클릭마다 다시 호출하지 않는다. 길이는 `pack.steps.length`다.

`TypewriterText`:

- 시작 조건: `session.ready === true` 그리고 (있으면) 오픈 시퀀스 `onOpened`.  
- 한 스텝의 `text`는 팩에 고정. rAF는 slice만.  
- 다음 스텝 초상은 **이미 캐시된 source**라 `<Image>` 교체가 디코드 대기 없이 그려져야 한다.  
- remount(`key=typewriterKey`)는 유지해도 된다. 비용은 빈 문자열 + rAF 재시작뿐이어야 하고, 그 틱에 prefetch/split이 없으면 끊김으로 안 본다.

선택(P2, 1차 필수 아님): 타이핑을 UI 스레드로 옮기거나 글자 배열을 미리 만들지 않는다. JS rAF + **진행 중 부하 0**이면 계약 충족. Worklet 이전은 크래시 게이트가 커서 **끊김이 팩 이후에도 남을 때만** 검토.

---

## 6. 초상 워밍 (중간 장면 전환의 핵심)

문제의 큰 축은 텍스트가 아니라 **페이지마다 다른 PNG 디코드**다.

1. 팩의 `uniquePortraitSources`에 `Image.prefetch(uri)` (기존 `prefetchImageSources` — **dev/Metro만 실효**, 릴리즈 드로어블은 no-op일 수 있음).  
2. **R-1 P0**: `IngameDialogPortraitWarmer`가 오프스크린 240 `<Image>`를 unique만큼 마운트해 디코드를 끝낸 뒤 `ready=true`. 릴리즈 신뢰 경로.  
3. **R-2**: 400ms 안에 워머가 안 끝나면 창을 연다(degrade). 워머는 세션이 닫힐 때까지 남는다.  
4. 실패(미등록 키)는 placeholder(`onError`도 워밍 완료). 진행 중 재시도·재resolve 금지.

금지:

- `listCriticalSessionImageSources`에 함장 초상 전수  
- 차원항로/`runContinueSessionPrewarm`에 대사 초상 합류 (시작 화면·항로 책임 분리)  
- 허브 진입마다 전 NPC 초상 워밍

---

## 7. 타이밍 — 「최초 화면이 시작되기 전」

```text
[허브 셸 ready]     기존 runWhenUiScreenReady
        │
        ▼
[세션 팩 빌드]      sync 가능 (CSV는 이미 메모리). split은 씬 페이지 수만큼 1회
        │
        ▼
[초상 prefetch]     async. 여기만 await
        │
        ▼
[ready]             Overlay present + typewriterActive
        │
        ▼
[자막 진행]         부하 0
```

- 팩 빌드(문자열)는 짧다. 대기 체감의 거의 전부는 **초상 prefetch**다. unique 3~4장이면 짧게 끝난다.  
- 첫 글자 전에만 기다린다. 페이지 중간에서 기다리지 않는다.  
- 오픈 전환 연출(`ArcOverlayShortTransition`)을 다시 켤 경우: `onOpened` 전에 prefetch가 끝나 있어야 한다. 연출과 디코드를 겹치지 말 것.

intro(`app/(game)/intro.tsx`)도 같은 3단·Typewriter를 쓴다. **intro 씬도 첫 카드 전에 팩+prefetch.** 별도 파이프 금지.

---

## 8. 메모리 · STAGE

| 항목 | 계약 |
|---|---|
| 수명 | `ingameDialogStore.session`과 같음. dismiss/abort/purge 때 `pack=null` |
| persist | 없음. `purgeLocalAccountData` 대상 아님 (휘발) |
| 부트 | 팩 빌드 금지. 타이틀 게이트 금지 |
| 허브 이탈 | 기존 `abortIngameDialogLeavingStage`가 세션을 지울 때 팩도 지움 |
| Skia | 신규 Canvas 없음. 초상은 RN `Image` |
| 틱 | 새 setInterval 없음. Typewriter rAF는 기존 1개 유지 |

허브 궤도와의 JS 경쟁(§1-2 E)은 본 1안의 **필수 범위가 아니다.** 팩 적용 후 실기에서 여전히  tit터면, 대사 `ready` 동안 허브 Skia 루프를 잠시 낮추는 안을 **별도 검토**한다. 이번 설계에서 궤도 루프를 끄라고 확정하지 않는다.

---

## 9. 비범위

- 2차 메신저 · Groq/NL · 턴당 LLM  
- `NARRATIVE_DIALOG_LAYOUT` 수치 · 482 · 3줄 · 빗살 헤더 위치  
- ScrollView 대사창 · 가변 높이  
- 위협 전투 · WAVE FPS HOLD  
- 전 퀘스트 대사 부트 프리로드  
- 자막을 영상 크레딧처럼 자동 수직 스크롤하는 새 연출 (현행은 `[다음]` 세그먼트)
- **R-3 회전**: 대사 진행 중 화면 폭이 바뀌어도 **재분할하지 않는다.** 이전 `splitWidthKey` 기준 3줄이 그대로 보인다. 다음 present에서만 다시 팩을 만든다.

---

## 10. 구현 단계 (승인 후)

| 단계 | 내용 | 게이트 |
|---|---|---|
| P0 | `IngameDialogSessionPack` 빌드 + 워머(R-1) + 400ms degrade(R-2) + `ready` 전 present/타이핑 금지. **intro 포함(R-4)** — cinematic은 즉시, `ingame_dialog`만 팩·워머 | 단위 테스트: 팩 steps 수 = 전 페이지 세그먼트 합 · ready 전 typewriter 미시작 |
| P1 | `pressNext`·Host ViewModel을 팩 인덱스만 사용. 진행 중 split/resolve 제거 | grep: 진행 경로에 `splitNarrativeDialogSegments`·`resolveIngameDialogPortraitSource` 없음 |
| P2 | Image source 교체만 (카드 remount 최소화). 실패 초상 재시도 없음 | 긴 씬 실기: 전환 직후 자막 속도 동일 |
| P3 | (조건부) 허브 Skia와 rAF 경쟁이 남으면만 검토 | 팩 PASS 이후 실측 있을 때만 |

P0+P1이면 「중간 로딩 0」 계약의 코드 축은 닫힌다. P2는 체감, P3는 예비.

완료 게이트(구현 턴): `npx tsc --noEmit -p tsconfig.client.json` · 대사 단위 테스트 · `audit:hot-path` · Skia 신규 없으면 `audit:skia-memory` 생략. GL 실측은 Image만 만질 때 허브 왕복 floor만.

---

## 11. 승인 체크

- [x] 대사는 **창이 보이기 전** 세션 팩+초상 워머. 진행 중 로드 0  
- [x] 부트·타이틀·차원항로·critical session 전수에 함장 초상 넣지 않음  
- [x] 레이아웃 상수·ScrollView 금지·1차 통신 셸 유지  
- [x] 팩은 세션 1개 · dismiss dispose · persist 없음  
- [x] 2차 메신저·NL 손대지 않음  
- [x] **R-1** 릴리즈 신뢰 경로 = 오프스크린 워머 (`Image.prefetch`만으로 ready 금지)  
- [x] **R-2** `ready` 대기 400ms 상한 + degrade present  
- [x] **R-3** 진행 중 회전 재분할 비범위  
- [x] **R-4** intro `ingame_dialog`가 P0 동일 팩 경로
