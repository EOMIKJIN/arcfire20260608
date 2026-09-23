# 이동중 전투 Skia 배경 — 김팀장 실패 해부 (분석만 · 코드 미변경)

```text
status=ANALYSIS_ONLY
task_id=transit-combat-skia-backdrop-fix-20260916
kind=FAILURE_ANATOMY
code_changes=NO
written=2026-09-16 19:08 KST
김팀장_패치=STOP
```

김클로드 구현과 병행. 패치 지시가 아님. 현재 디스크(`TransitCombatSkiaParallaxBackdrop.tsx`) 기준.

---

## 0. 한 줄

이번 구현은 **「풀화면」「여백」「크롬」을 한 계약으로 고정하지 않은 채**, 레이아웃 인셋·타일 dest·베이크 contain·Skia JSI를 턴마다 뒤집어서 **공백과 넘침이 교대**하고, 그 위에 **틱 `clipRect`/`width()`** 로 실기 크래시가 난 것이다.

---

## 1. 계약이 서로 모순이었다 (모든 시각 버그의 뿌리)

같은 화면에서 아래가 **동시에** 요구됐다. 코드는 한 시점에 하나만 맞출 수 있었다.

| 말 | 코드가 해석한 좌표 | 결과 |
|---|---|---|
| 풀화면 기준은 위아래 여백 제외 | 타일/베이크 = `STAGE_TOP_INSET_PX`(72) + 하단 54+ 를 뺀 박스 | 그래픽이 크롬에 안 들어감 → **단색 띠** |
| 구름성운이 여백을 꽉 채운다 (불만) | iy=-1/+1 타일이 크롬까지 dest | **구름이 헤더/하단을 덮음** |
| 위아래 공백을 남기며 구현 중 (분석 지시) | 컨테이너 `top/bottom` 인셋 | Canvas 없음 → `#05070e` 띠 |
| 배경 레이어는 풀블리드 | `StageShell.backgroundOverlay` = `absoluteFill` | 인셋을 뷰에 다시 주면 이중 마진 |

`combat.tsx:364-377` 마운트:

- `backgroundOverlay` → `StageShell` `styles.bgOverlay` = **이미 풀블리드** (`StageShell.tsx:98`)
- `edges={['bottom']}` → SafeArea는 **하단만**. 위는 물리 화면 상단까지
- 포그라운드는 **별도**로 위 72 스페이서 + `paddingBottom = max(0, 54−safeBottom)` (`StageShell.tsx:52,76-80`)
- `safeAreaBackgroundColor="#05070e"` — Canvas가 없는 픽셀은 이 색만 보임

즉 **오버레이 좌표 ≠ 포그라운드 콘텐츠 좌표**. 인셋을 어디에 적용하느냐가 곧 버그 종류다.

```
SafeAreaView (edges=bottom, bg #05070e)
 ├─ bgOverlay absoluteFill     ← 패럴랙스 Canvas가 있어야 할 곳 (전체)
 └─ foreground
      ├─ 72px spacer           ← 「크롬」— 헤더가 앉는 자리
      ├─ header / QuestHUD / 궤도
      └─ bottom pad
```

---

## 2. 시각 문제 — 현재 디스크에도 남아 있는 것

### 2-A. 구름 dest가 크롬을 뚫는다 (「여백을 꽉 채움」)

`drawCloudCoverage` (`TransitCombatSkiaParallaxBackdrop.tsx:167-173`):

```ts
if (intersectRects(destX, destY, tw, th, contentX, contentY, contentW, contentH)) {
  canvas.drawImageRect(..., scratchDestRect(slot, destX, destY, tw, th), ...);
}
```

`intersectRects`는 **그릴지 말지 게이트**일 뿐, dest를 content에 자르지 않는다.  
`iy = -1 / +1` (`TRANSIT_CLOUD_TILE_ROW_MIN/MAX`) 타일은 높이 `content.h/2`이라 **항상** content 위·아래로 걸친다.

수치(360×800, chrome 72/54, content y=72 h=674, th=337, oy∈[0,337)):

| 행 | destY 범위 | 그리는 dest | 크롬 |
|---|---|---|---|
| iy=-1 | [72+oy−337, …] ⊂ [−265, 72) | 전체 타일 | **y=0..72 침범** |
| iy=1 | [72+oy+337, …] | 전체 타일 | **하단 54+ 침범** |

컨테이너를 `absoluteFill`로 되돌려도 이 dest면 **구름이 위아래 여백을 다시 채운다.**  
김클로드 §5 「인셋을 구름 타일에만」를 뷰에서 빼고 dest 크롭 없이 넣으면 증상이 남는다.

### 2-B. 베이크 contain 정사각 — 세로 레터박스 (「위아래 공백」)

`drawBakedHubFill` → `resolveTransitBakedFillBox(w,h,0,0)` → `size = min(W,H)`, 세로 중앙.

360×800이면 size=360, y=220. **y=0..220 · y=580..800는 단색 `#05070e`만.**  
허브는 정사각을 `max(W,H)*0.59`로 두고 RN `resizeMode="cover"` (`planetHubSubcomponents.tsx:571`, `PlanetNebulaImageBackdrop.tsx:56`).  
이동전투는 **cover가 아니라 contain 정사각**이라, Canvas가 풀블리드여도 위아래가 비어 보인다.

`plan.ts` 파일 머리 주석(5–6행)은 아직도 「베이크는 여백 제외 박스 contain」— 구현(0,0)과 문서가 어긋남.

### 2-C. 컨테이너 인셋 (고친 뒤에도 재발했던 공백)

한때 `style={{ top: chromePad.topPx, bottom: chromePad.bottomPx }}`.  
이미 풀블리드인 오버레이를 72/54 밀어 Canvas가 없는 띠 = 김클로드 §1 **확정**.  
현재는 `absoluteFill`로 원복됨. **2-B가 같은 띠를 다른 메커니즘으로 재현**한다.

### 2-D. 인셋 함수가 둘

| 함수 | bottom |
|---|---|
| `resolveTransitStageInsets` | `max(54, safeBottom)` |
| `resolveTransitBackdropChromePad` | `max(0, 54−safeBottom)` ← StageShell 포그라운드와 동일 |

SafeArea `edges=['bottom']`인 Canvas에서 stageInsets를 쓰면 **하단을 이중으로 깎는다.**  
베이크 기본 인자가 `stageInsets`라, 인자 생략 시 또 어긋남.

---

## 2-E. 대표님 실기 (2026-09-16 19:13) — **현재 크래시 없음**

지금 빌드/세션에서는 튕기지 않는다. 18:10 `clipRect` · 18:19 `width()` tombstone은 **그 버전 실측**이지, 현재 재현이 아니다.  
남은 것은 시각(2-A dest 넘침 · 2-B 베이크 레터박스). 크래시를 P0로 추가 패치하지 말 것.

---

## 3. 크래시 — 과거 tombstone (현재 비재현)

### 3-A. 18:10:16 `JsiSkCanvas::clipRect` + `getBool()` SIGABRT — `.tmp-crash-buf.txt`

- JS 스레드 (`MessageQueueThread` · `RuntimeScheduler`)
- `clipRect` JSI 3번째 인자(antiAlias bool) 타입 불일치
- C++ Skia 내부 clip이 아니라 **JS `canvas.clipRect(...)`**
- 당시 패럴랙스가 dest를 자르려고 `clipRect`를 넣었던 버전과 시각이 맞음
- **재도입 금지.** dest를 숫자로 크롭할 것

### 3-B. 18:19:29 `JsiSkImage::width` SIGSEGV — `.tmp-crash-buf2.txt`

스택 핵심:

```
TimerCallback::invoke          ← setInterval (80ms flushPicture)
JsiSkImage::width
SkImage::width → SkISize::width  (해제된 이미지)
```

틱에서 `image.width()`를 읽으면, `useImage`가 교체·언마운트한 뒤 **finalize된 SkImage**에 JSI로 접근한다.  
현재 TS에는 `.width()`가 없음. 그래도 `drawImageRect(죽은 핸들)`은 **다른 스택으로** 남을 수 있음.

`setInterval(flushPicture, 80)` (`Backdrop.tsx:398`) + `useImage`×5 (baked 3구름 dodge).  
baked는 `destSystemId`마다 소스가 바뀜 → 훅이 이전 SkImage를 버릴 수 있음.  
`useEffect` ref 동기화는 **다음 커밋 후**. 그 사이 틱이 옛 핸들을 그리면 위험.

### 3-C. 가설로 남은 것 (미확정)

- Canvas를 `gfxSize`로 조건부 마운트 (`423-427`) — 첫 레이아웃 전 빈 화면, 리사이즈 시 서피스 재생성
- `skipFlushTicksRef = 2` — 레이아웃 직후 160ms 미녹화 (빈 Picture)
- 모듈 싱글톤 `PictureRecorder`를 80ms마다 `beginRecording` — JS는 동기라 중첩은 드묾. 언마운트 중 틱은 `skiaLoopsActiveRef`로 막음
- ColorDodge를 허브 정사각 공식 그대로 (`nebulaSize = dodgeOrbitSize`) 풀화면 캔버스에 적용 — 좌표 어긋남. 크래시 원인으로는 약함

---

## 4. 테스트가 실패를 고정했다

`transitCombatParallaxPlan.test.ts`는 content 박스·chrome pad 숫자를 **의도**로 단언한다.  
검사하지 않는 것:

- dest가 content 밖으로 나가는지 (게이트만 통과해도 PASS)
- 베이크 레터박스(min(W,H) 후 남는 띠)
- 컨테이너 인셋 회귀

`transitCloudTilingCoversViewport`는 content-local 샘플만 본다. **크롬 침범은 PASS.**

`audit:skia-memory`는 문자열(`clipRect` 없음, `width()` 없음). 레이아웃·dest 크롭은 못 잡음.

---

## 5. 허브와 다른 점 (왜 새로 깨졌는가)

| | 허브 | 이동전투 이번 구현 |
|---|---|---|
| 성운 | RN `Image` cover, 정사각 `max(W,H)*0.59` | Skia Picture 80ms, contain `min(W,H)` |
| 구름 | 없음(또는 다른 레이어) | space_cd 2×3 타일 + Screen, dest 오버플로 |
| Dodge | 성운과 같은 정사각 좌표계 | 풀화면 Canvas + 궤도 오프셋 혼용 |
| 루프 | dodge만 필요할 때 Picture | 상시 setInterval + setState |

허브 경로를 베끼지 않고 **틱 Skia 풀스크린**을 새로 짠 것이 복잡도·JSI 표면이다.

---

## 6. 패치가 실패한 이유 (프로세스)

1. 증상 하나(넘침)를 뷰 인셋으로 막음 → 공백  
2. 공백을 풀블리드로 풂 → dest 오버플로·레터박스가 남음  
3. 넘침을 `clipRect`/`width()`로 자름 → tombstone  
4. 정적 audit PASS를 완료처럼 사용  
5. 「여백」이 크롬인지 레터박스인지 턴마다 다른 말로 패치

---

## 7. 김클로드가 코드를 만질 때 볼 잔여 (지시 아님)

현재 디스크에서 **아직 틀린 것**만:

1. **구름 dest를 content∩으로 잘라 그리지 않음** (2-A) — `clipRect` 없이 dest 숫자만
2. **베이크가 세로를 안 채움** (2-B) — cover 또는 높이 기준. 허브와 맞출지는 대표님 시각 기준
3. **틱이 죽은 `useImage`를 그릴 수 있음** (3-B) — ref/가드. `.width()`/`clipRect` 금지 유지
4. 테스트에 dest 비침범·베이크 레터박스 단언 없음 (4)

이 문서는 분석만. 구현은 READY `kim-claude-ready-transit-combat-skia-backdrop-20260916.md`.

---

## 8. 김팀장 검수 판정 (2026-09-16 19:30) — PARTIAL · 이 축 STOP

김클로드가 구름을 raw `canvasW/canvasH`로 맞추고 safe-area flush 재생성을 뺀 것은 **수용**.  
2-A(크롬 침범)는 더 이상 버그가 아니라 **확정 계약**(풀블리드). 헤더 `TF.panelBg`로 UI는 읽힌다.  
2-B(베이크 레터박스)는 구름이 가리는 잔여. cover 전환은 대표님 실기 후.  
크래시 P0 해제. READY 닫힘. 상세 `kim-team-lead-transit-backdrop-review-20260916.md`.
