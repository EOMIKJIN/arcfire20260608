# 인게임 대사창 초상 깜박임 — 수정분 재검수

```text
status=REVIEWED
verdict=React 계층은 «해결 완료» · 남은 원인은 «네이티브 계층» 1순위 후보 특정
date=2026-09-26
reviewer=김클로드
증상=바 대사창에서 [다음] 누를 때 초상이 깜박이며 다시 출력. 인포창은 정상.
```

---

## 0. 결론

**김팀장의 진단(React key remount)은 맞았고 그 수정도 완결됐다.** React 경로를 전수 추적한 결과 **초상이 언마운트·리마운트될 여지가 남아 있지 않다.**

그럼에도 증상이 남았다면 원인은 **오늘 새로 들어간 네이티브 렌더 옵션**이며, 그중 **`renderToHardwareTextureAndroid`가 1순위**다. **정상 동작하는 인포창에는 이 옵션이 없다.**

---

## 1. 김팀장 수정 내용 (확인)

| 파일 | 변경 | 판정 |
|---|---|---|
| `TypewriterText.tsx` | `key` remount 폐기 → `resetToken` + epoch 내부 리셋. 주석에 「React key remount 금지(초상 Image 깜박임)」 명시 | ✅ **원인 규정이 정확** |
| `NarrativeDialogRow.tsx` | 인라인 `<Image>` → `NarrativeDialogPortrait` 분리, `collapsable={false}` 다수 추가 | ✅ |
| `NarrativeDialogPortrait.tsx` **(신규)** | `memo` 비교자(source key) + ref 래치 + 네이티브 옵션 3종 | ⚠️ **§3** |
| `narrativeDialogPortraitSourceKey.ts` **(신규)** | 에셋 동일성 키 + `reuse…Source` | ✅ |

테스트 `NarrativeDialogPortrait.test.ts` · `typewriterResetState.test.ts` **8/8 PASS**.

---

## 2. React 경로 전수 확인 — 리마운트 여지 없음

증상이 「다시 출력」이므로 **언마운트가 있는지**를 경로 전체에서 확인했다. **없다.**

| 지점 | 확인 | 결과 |
|---|---|---|
| `useArcNarrativeOverlay` | 내용 변경 시 **`patch`만**, `dismiss`는 창 닫을 때·언마운트만 | ✅ |
| 〃 | `reuseNarrativeDialogPortraitSource`로 **같은 초상이면 기존 참조 유지** | ✅ |
| `arcOverlayStore.patchOverlay` | `stack.map` + spread — **스택 길이·순서 보존**, entry가 null이 되는 프레임 없음 | ✅ |
| `ArcOverlayHost` | `entry = stack[last]`, narrative 콘텐츠에 **key 없음** | ✅ |
| `NarrativeOverlayContent` | `<NarrativeDialogRow key={entry.id} …>` — **id는 `'ingame-dialog'` 고정** | ✅ |
| `NarrativeDialogRow` | 초상이 조건부 렌더·key 없이 고정 위치 | ✅ |
| `narrativeDialogPortraitSourceKey` | 번들 에셋(number)도 `n:{id}`로 **안정 키** 산출 | ✅ |
| 레이아웃 | `portraitBleedPx`는 `windowWidth`만, `textBlockHeight`는 `resolveIngameDialogLineBudget()` **상수** → **카드 높이가 스텝마다 변하지 않음** | ✅ |
| `TypewriterText` | `key` 제거 확인. 현재 `resetToken={typewriterKey}` | ✅ |

**세그먼트 진행([다음])은 같은 페이지 안의 이동이므로 화자·초상이 동일하다.** 따라서 소스 키도 같고 memo가 리렌더까지 막는다. **React 층에서 깜박일 이유가 남아 있지 않다.**

---

## 3. 🔴 인포창과의 차이 — 대표님 질문에 대한 답

**출력 방식이 다르다.** 정상 동작하는 인포창은 **가장 단순한 경로**를 쓴다.

| | 인포창 `PlanetInfoGovernorCard` (**정상**) | 대사창 `NarrativeDialogPortrait` (**깜박임**) |
|---|---|---|
| 소스 | `useMemo(resolveNpcCaptainPortraitSource, [key])` | ref 래치 + memo 비교자 |
| 렌더 | `<Image source resizeMode="cover" />` **끝** | 아래 옵션 4종 추가 |
| **하드웨어 레이어** | **없음** | **`renderToHardwareTextureAndroid`** ← **오늘 신규** |
| 페이드 | 기본(Android 300ms) | **`fadeDuration={0}`** |
| 프로그레시브 | 기본 | **`progressiveRenderingEnabled={false}`** |
| collapsable | 기본 | **`false`** |

### 왜 `renderToHardwareTextureAndroid`가 1순위인가

- 이 속성은 뷰를 **하드웨어 텍스처 레이어로 승격**시킨다. 그 서브트리에 레이아웃/합성 변화가 생기면 Android가 **레이어를 파기하고 다시 만든다.** 재생성 사이에 **레이어가 비어 있는 프레임**이 생기고, 그것이 정확히 **「깜박이며 다시 출력」**으로 보인다.
- RN 공식 권고는 **애니메이션 중에만 켜고 끝나면 끄라**는 것이다. 저장소 내 다른 사용처는 `worldmap.tsx:2383`의 **이동 함선 애니메이션** — 올바른 용례다. 정지 초상에는 해당하지 않는다.
- **`fadeDuration={0}`이 은폐를 걷어냈다.** 기본 300ms 페이드는 짧은 재디코드·레이어 재생성을 부드럽게 덮어 준다. 0으로 두면 같은 현상이 **하드컷 깜박임**으로 그대로 드러난다.

### 덧붙임 — 하드웨어 레이어의 별도 부작용 (초상 잘림)

`portraitScale`은 `ingameDialogSessionPack.ts:303`에서 **`clamp(imageScalePct, 40…140)/100`** — 즉 **최대 1.4**다. `NarrativeDialogPortrait`는 이 값을 `transform:[{scale}]`로 자식 `Image`에 적용한다.

**하드웨어 텍스처 레이어는 뷰 경계 크기로 래스터화되므로, 경계를 넘겨 확대된 자식은 레이어에서 잘린다.** `imageScalePct > 100`인 페이지에서는 초상 상·하단이 **의도치 않게 절단**될 수 있다(`portraitBleedPx`로 위로 빼내려는 설계와 충돌). 깜박임과는 별개의 버그이지만, **§4-1을 실행하면 동시에 해소**된다.

### 2순위 — 프레임 내 동기 레이아웃 반복

`TypewriterText`가 **렌더 본문 setState**(epoch 리셋)와 **`useLayoutEffect`**를 함께 쓴다. 둘 다 정당한 패턴이지만, [다음] 한 번에 **페인트 전 동기 패스가 2~3회** 돈다. 하드웨어 레이어를 얹은 형제 뷰가 있으면 그 패스마다 레이어 무효화가 겹칠 수 있다.

> 즉 **1순위와 2순위가 서로를 증폭**한다. 1순위만 제거해도 증상이 사라질 가능성이 높다.

---

## 4. 권고 — 한 줄부터 되돌린다

**정상 동작하는 인포창이 이미 정답 샘플이다.** 대사창 초상을 그 수준까지 내린 뒤 하나씩 다시 얹는다.

| 순서 | 조치 | 근거 |
|---|---|---|
| **1** | `NarrativeDialogPortrait.tsx:42` **`renderToHardwareTextureAndroid` 제거** | 인포창에 없는 유일한 «빈 프레임 유발» 요소. **한 줄 · 즉시 검증 가능** |
| 2 | 그래도 남으면 **`fadeDuration={0}` 제거**(기본 페이드 복귀) | 재디코드가 실제로 일어나는지 구분된다. 페이드로 사라지면 «재디코드», 그대로면 «레이어» |
| 3 | 그래도 남으면 **ref 래치 제거** — memo 비교자가 이미 같은 키를 막으므로 래치는 중복이다 | 렌더 본문 ref 변경은 동시성 렌더에서 예측이 어렵다 |
| 4 | 최종적으로 인포창과 동일한 `<Image source resizeMode>` + `useMemo` 형태까지 내려 본다 | 여기서도 깜박이면 원인이 초상이 아니라 **카드 레이아웃**이라는 뜻 |

**1~4를 한 번에 하지 말 것.** 합치면 무엇이 고쳤는지 또 알 수 없게 된다.

---

## 5. 솔직한 한계

**기기 재현 없이 정적 분석으로 좁힌 결론이다.** React 경로에 리마운트가 없다는 것은 코드로 확정했으나, 「하드웨어 레이어가 실제로 빈 프레임을 낸다」는 **에뮬레이터·실기에서만 증명된다.**

다만 §4-1은 **한 줄 제거**이므로 검증 비용이 거의 없다. 추정에 기대 구조를 더 얹기 전에 **빼 보는 쪽이 먼저**다.

---

**김클로드는 읽기만 했다** — 코드 변경 0 · 커밋 0.
