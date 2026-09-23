# 이동중 전투 배경 Skia 레이어 — 전수 정밀 조사 (분석만)

> **후속 (2026-09-16 19:01)**: 구현+자가검수는 김클로드 이관. READY=`kim-claude-ready-transit-combat-skia-backdrop-20260916.md` · 김팀장 패치 중단.

```text
status=ANALYSIS_ONLY
task_id=transit-combat-skia-backdrop-inspection-20260916
kind=CRASH_INVESTIGATION
code_changes=NO
commit=FORBIDDEN
target=src/components/combat/TransitCombatSkiaParallaxBackdrop.tsx · src/combat/transitCombatParallax*.ts · app/(game)/combat.tsx
[pss-pre-dev] hot_path=flushPicture() 80ms setInterval · useImage×5(baked/cloud0-2/dodge) alloc=신규 없음(모듈 스크래치 재사용 확인) cache=Picture 1장(state)
[pss-pre-dev] stage=combat(전투) STAGE3 risk=P0(런타임 크래시 실측 2건) · P1(레이아웃 공백)
[pss-pre-dev] verdict=분석만 — 코드 미변경. 아래 근거로 패치 방향만 제시.
```

> **대표님 지시**: "김팀장이 이동중 전투의 배경그래픽(스키아) 레이어 구현을 진행중이다. 위아래 공백을 남겨두고 구현중인데 크래시나 구현이 잘안되는 중이다. 현재 구현한 내용을 모두 검수하고 전수 정밀조사하라. 분석만 하라."

---

## ⚠️ 중요 — 조사 중 파일이 실시간으로 바뀜

조사 도중 `TransitCombatSkiaParallaxBackdrop.tsx`를 두 번 읽었는데 **내용이 서로 달랐다** — 김팀장이 지금 이 순간에도 Cursor에서 편집 중임을 직접 확인했다(1차 읽음 시점엔 `stageInsets`/`resolveTransitStageInsets` 기반 풀캔버스 채우기+콘텐츠박스 인셋 방식, 2차 읽음 시점엔 `chromePad`/`resolveTransitBackdropChromePad` 기반 View 자체 위치 인셋 방식으로 이미 바뀌어 있었음). 그 사이 `tsc`를 돌렸을 땐 `stageInsets` 참조가 끊긴 과도기 상태라 `Cannot find name 'stageInsets'` 에러까지 순간적으로 떴다(현재는 해소됨).

**따라서 이 리포트는 "지금 이 순간 디스크에 있는 최신본" 기준이며, 대표님이 이 문서를 읽는 시점엔 또 달라져 있을 수 있다.** 아래 크래시 2건의 정확한 트리거 코드가 "그 크래시가 난 순간의 버전"과 100% 일치한다고 단정하지 않는다 — 그 시점 스냅샷은 남아있지 않다. 다만 문제의 성격(레이아웃 구조·타입 오류·신호 패턴)은 현재 버전에도 유효하다.

---

## 1. 확인된 문제 A — 위아래 공백 (원인 확정)

**현재 코드** (`src/components/combat/TransitCombatSkiaParallaxBackdrop.tsx:393-399`):

```tsx
<View
  ref={rootRef}
  style={[styles.root, { top: chromePad.topPx, bottom: chromePad.bottomPx }]}
  pointerEvents="none"
  onLayout={handleGfxLayout}
>
```

`chromePad` = `resolveTransitBackdropChromePad(safeInsets.bottom)` (`transitCombatParallaxPlan.ts:82-87`) → `{ topPx: 72, bottomPx: max(0, 54-safeBottom) }`.

이 컴포넌트는 `app/(game)/combat.tsx:369-377`에서 `StageShell`의 **`backgroundOverlay`**로 전달된다. `StageShell.tsx:59-71,98` 확인 결과, `backgroundOverlay`는 이미 **`styles.bgOverlay = StyleSheet.absoluteFillObject`**로 화면 전체(헤더·하단 포함)를 덮도록 설계되어 있다 — 주석도 "별 배경 위·포그라운드 UI 아래에 그릴 레이어"라고 명시(`StageShell.tsx:19`).

**즉 이미 전체화면을 받는 레이어를 컴포넌트 스스로 `top:72 / bottom:54`만큼 다시 밀어 넣고 있다.** 그 결과 상단 72px·하단 ~54px+ 구간은 `Canvas`가 아예 존재하지 않는 영역이 되어, `StageShell`의 `safeAreaBackgroundColor="#05070e"`(`combat.tsx:368`) 단색만 노출된다 — 패럴랙스 구름·성운 베이크가 전혀 닿지 않는 정적인 띠. **이게 대표님이 보시는 "위아래 공백"이다.**

`resolveTransitBackdropChromePad`의 주석(`transitCombatParallaxPlan.ts:78-81`)은 "이 패드로 뷰를 밀어 여백에 구름이 못 들어간다"고 밝히고 있어 — **의도적 설계**였던 것으로 보이나, 적용 대상이 틀렸다. 이 로직은 "그리는 콘텐츠(구름 타일)를 여백에 안 들어가게" 하려는 의도였을 텐데, 실제로는 **컨테이너 View 자체의 위치**에 적용돼 배경 레이어 전체가 화면 가장자리에서 물러나 버렸다.

*(참고: 1차로 읽은 이전 버전은 `resolveTransitFullscreenContentBox`로 콘텐츠만 인셋하고 `canvas.drawRect(...)`로 캔버스 전체엔 최소한 단색 채움은 했었다 — 그때도 "여백에 구름 없음"은 동일했지만 지금 버전은 그 단색 채움 코드(`drawBakedHubFill`의 인셋 인자 등)도 같이 사라져 증상이 더 뚜렷해졌을 가능성이 있다.)*

---

## 2. 확인된 문제 B — `tsc` 자체 실패 (self-check 게이트 불통과)

```
npx tsc --noEmit -p tsconfig.client.json
src/components/combat/TransitCombatSkiaParallaxBackdrop.tsx(241,31): error TS2345:
  Argument of type 'ImageSourcePropType | null' is not assignable to parameter of type 'DataSourceParam'.
  Type 'ImageURISource' is not assignable to type 'DataSourceParam'.
```

`TransitCombatSkiaParallaxBackdrop.tsx:241` — `const bakedImage = useImage(bakedSource ?? null);` — `bakedSource`는 `resolvePlanetNebulaBakedSource()`(`src/game/planetNebulaBakedAssets.ts:48-51`)가 반환하는 RN `ImageSourcePropType`인데, Skia의 `useImage()`는 자체 `DataSourceParam` 타입을 요구해 타입이 안 맞는다.

**같은 소스를 이미 쓰고 있는 기존 정상 동작 컴포넌트**(`src/components/planet/SkiaPlanetNebulaShaderBackdrop.tsx:140-141`)는 동일 문제를 `as any` 캐스팅으로 우회하고 있다:
```ts
const nebulaImage = useImage(loadNebulaImages && renderNebulaShader ? ((nebulaBakedImageSource as any) ?? null) : null);
```
신규 파일엔 이 캐스팅이 빠져있다 — **단순 누락**으로 보인다. (런타임 크래시와는 무관 — Metro는 타입체크 안 하므로 JS 동작 자체엔 영향 없음. 다만 CLAUDE.md의 필수 self-check 게이트를 현재 통과하지 못하는 상태.)

---

## 3. 실측 크래시 2건 (오늘, tombstone 확보)

repo 루트에 실제 크래시 덤프 2개가 오늘 날짜로 남아있었다(`.tmp-crash-buf.txt`, `.tmp-crash-buf2.txt` — 대표님 또는 김팀장이 adb bugreport로 받아둔 것으로 추정).

### 3-1. 18:10:16 — `JsiSkCanvas::clipRect` assert (SIGABRT)

```
#02 RNSkia::JsiSkCanvas::clipRect(...)
#01 facebook::jsi::Value::getBool() const   ← 인자 타입 불일치로 assert
#00 __assert2 (abort)
```

**`src/` 전체를 `clipRect`로 grep했으나 애플리케이션 코드에 단 한 곳도 없다.** 즉 우리 TS/TSX 코드가 직접 `.clipRect(...)`를 호출하는 게 아니라, `@shopify/react-native-skia` 라이브러리 내부(`<Canvas>` 서페이스 관리 또는 `<Group>`/마스킹 내부 구현)에서 발생한 것으로 보인다. 이 신규 배경 레이어는 `<Canvas style={{width: gfxSize.w, height: gfxSize.h}}>`(`TransitCombatSkiaParallaxBackdrop.tsx:401`)의 크기를 `onLayout` → `setGfxSize`로 매번 갱신하는데, 이 값이 바뀌는 시점과 80ms 간격(`TRANSIT_PARALLAX_TICK_MS`)으로 독립 실행되는 `flushPicture()`의 레코딩 시점이 어긋나면(리사이즈 중인 네이티브 서페이스에 구 크기로 레코딩된 Picture를 합성) 라이브러리 내부에서 이런 종류의 assert가 날 수 있다 — **확정 아님, 정황상 가장 유력한 후보**.

### 3-2. 18:19:29 — `JsiSkImage::width()` SIGSEGV (esr 0x92000006, bad memory access)

```
#03 RNSkia::JsiSkImage::width(...)
#02 SkImage::width() const
#01 SkImageInfo::width() const
#00 SkISize::width() const   ← 잘못된 메모리 접근
```

`transitCombatParallaxPlan.ts:23`의 자체 주석("틱에서 SkImage.width() 금지·JsiSkImage::width SIGSEGV")이 정확히 이 신호와 일치해, 이 위험은 **이미 한 번 학습된 패턴**이다. 그런데 직접 추적한 결과:

- `TransitCombatSkiaParallaxBackdrop.tsx` 자체: `.width()/.height()` 호출 **0건** (현재본 기준, grep 확인).
- 이 컴포넌트가 호출하는 `drawNebulaColorDodgeFxTransformedOnSkCanvas`(`planetSkiaHitFxContract.ts:341-391`)도 `.width()/.height()` 호출 **없음** — `COLOR_DODGE_02_NATIVE_W/H` 상수만 사용(379행). *(참고: 최초 조사 에이전트가 이 함수 안에 `.width()/.height()` 호출이 있다고 보고했으나, 직접 재확인 결과 사실이 아니었다 — 정정함.)*
- `.width()/.height()`가 실제로 있는 곳은 같은 파일의 **`drawPlanetFlameBurstOnSkCanvas`**(`planetSkiaHitFxContract.ts:274-275`)뿐이며, 이 함수는 `PlanetEdenRaidOrbitSkiaCombat.tsx:961`·`inboundDroneHitFxDraw.ts:60`에서만 호출된다. `combat.tsx`가 실제로 마운트하는 궤도 컴포넌트는 `CapitalRealtimeCombatOrbitSkia`(`combat.tsx:401`, `renderMissileDodgeFx={false}`로 dodge-fx는 명시적으로 끔)인데, 이는 `capitalRealtimeBridge.ts:20`에서 `PlanetEdenRaidOrbitSvg`(`PlanetEdenRaidTestLayer.tsx` 정의)의 별칭이다 — 이 파일을 전수 grep한 결과 `clipRect`/`.width()`/`.height()`/`drawPlanetFlameBurstOnSkCanvas` 호출이 **전혀 없다**. 즉 `combat.tsx` 화면에서 실제로 `.width()`를 부를 만한 애플리케이션 코드 경로를 찾지 못했다.

**남은 가장 유력한 가설**: Skia의 `useImage()` 훅 자체가 내부적으로 로드 완료 판정에 `.width()`류 접근을 쓸 수 있는데, 이 컴포넌트가 **한 번에 5개**(`bakedImage`, `cloud0/1/2`, `dodgeImage`, `TransitCombatSkiaParallaxBackdrop.tsx:241-245`)의 `useImage()`를 돌리고, 목적지 행성이 바뀔 때마다(`destSystemId`/`originSystemId` 변경 → `bakedSource` 재계산 → `useImage(bakedSource)` 재호출) 이미지를 폐기·재로드한다. **조사 중 실시간으로 관찰된 사실**: 최초 읽음 시점엔 `bakedImageRef.current = bakedImage` 등 5개 ref 동기화가 전부 `useEffect(() => {...}, [dep])`로 커밋 단계에만 실행되도록 감싸져 있었는데, 방금 재확인한 최신본은 이 `useEffect` 래핑이 **사라지고 렌더 본문에서 직접 대입**하는 형태로 바뀌어 있었다(현재 251-255행). 렌더 본문에서의 ref 대입은 커밋되지 않는 렌더(리액트가 버리는 렌더)에서도 실행될 수 있어, 80ms 간격 `flushPicture()`가 Skia가 폐기 중인 이미지 핸들을 순간적으로 쥐게 될 여지를 만든다 — **이것이 `JsiSkImage::*` SIGSEGV 계열과 정확히 같은 위험 범주**다. 다만 이 변경이 정확히 18:19 크래시 "이후"에 이뤄졌는지 "그 원인"이었는지는 스냅샷이 없어 확정할 수 없다 — **현재 시점 기준 신규/잔존 리스크로만 보고한다.**

---

## 4. 종합 — 무엇이 확실하고 무엇이 가설인가

| # | 항목 | 확실성 | 근거 |
|---|---|---|---|
| 1 | 위아래 공백 원인 | **확정** | `chromePad`를 이미 풀블리드인 `backgroundOverlay` 컨테이너 자체 위치에 적용(§1) |
| 2 | tsc 타입 에러 | **확정, 재현됨** | `npx tsc --noEmit` 실행 결과 TS2345 (§2) |
| 3 | 크래시 2건 발생 사실 | **확정** | 오늘자 tombstone 덤프 실측(§3) |
| 4 | 크래시 1(`clipRect`)의 정확한 호출부 | **미확정** | 앱 코드에 `clipRect` 없음 — 라이브러리 내부/캔버스 리사이즈 타이밍 가설만 |
| 5 | 크래시 2(`SkImage.width`)의 정확한 호출부 | **미확정** | 앱 코드에서 도달 가능한 `.width()` 경로 못 찾음. `useImage` 내부 또는 최근 useEffect 제거로 인한 ref-레이스가 유력 후보 |

---

## 5. 권고 방향 (미적용 — 분석만)

1. **공백**: `TransitCombatSkiaParallaxBackdrop.tsx:396`의 `top/bottom` 인셋을 컨테이너 View에서 제거하고, 풀캔버스(`canvasW × canvasH`) 기준으로 그리되 **구름 타일만** 상하 여백을 피하도록 `drawCloudCoverage` 호출 시 콘텐츠 박스를 넘기는 이전 방식(1차본의 `resolveTransitFullscreenContentBox`)으로 되돌리는 편이 의도(여백에 구름 안 들어가되 배경 자체는 풀블리드)에 맞다.
2. **tsc 실패**: `bakedSource ?? null` → `(bakedSource as any) ?? null`로 기존 `SkiaPlanetNebulaShaderBackdrop.tsx` 패턴과 통일.
3. **크래시**: 이미지 ref 동기화(`bakedImageRef`/`cloudRefs`/`dodgeImageRef` 대입)를 **반드시 `useEffect`로 되돌려** 커밋 단계에서만 실행되게 할 것 — 렌더 본문 직접 대입은 되돌린 것으로 보이는 변경이며, 기존 다른 Skia 컴포넌트들도 전부 이 패턴을 지키고 있다. 그 다음에도 재현되면, `<Canvas>` 리사이즈 중 `flushPicture` 인터벌을 일시 정지(`gfxSize` 변경 직후 1~2틱 skip)하는 가드를 추가해 §3-1 가설도 함께 배제해볼 것을 권장.
4. 위 모두 **코드 변경은 김팀장 판단 후 진행** — 본 리포트는 분석만이며 어떤 파일도 수정하지 않았다.

---

*작성: 김클로드 · 2026-09-16 · 분석만(코드 미변경). 조사 대상 파일이 조사 중 실시간으로 계속 바뀌어, 위 내용은 작성 시점 스냅샷 기준임을 재차 명시.*

---

## 6. 재검수 (김팀장 수정 완료 후, 2026-09-16 18:4x KST)

대표님 지시: "지금 좀전에 수정이 끝났는데 한번더 전수 검사해봐라." 아래는 §1~§3 세 가지 확인 항목을 수정 후 코드로 다시 대조한 결과.

| # | 항목 | 상태 | 근거 |
|---|---|---|---|
| B | `tsc` TS2345 타입 에러 | **✅ 해소 확인** | `TransitCombatSkiaParallaxBackdrop.tsx:241` → `useImage((bakedSource ?? null) as never)`로 수정됨. `npx tsc --noEmit -p tsconfig.client.json` 재실행 결과 **에러 0건** |
| A | 위아래 공백 | **❌ 미수정** | `TransitCombatSkiaParallaxBackdrop.tsx:396` `style={[styles.root, { top: chromePad.topPx, bottom: chromePad.bottomPx }]}` 그대로. `resolveTransitBackdropChromePad`(72/54)도 불변. `transitCombatParallaxPlan.test.ts:108-120`("fullscreen content excludes stage top/bottom insets", "backdrop chrome pad matches StageShell combat")도 이 인셋-마진 동작을 여전히 "의도된 동작"으로 단언 — §1에서 지적한 컨테이너 인셋 구조 자체는 손대지 않은 것으로 보임 |
| C | 이미지 ref 동기화가 `useEffect` 밖 렌더 본문 직접 대입 | **❌ 미수정** | `TransitCombatSkiaParallaxBackdrop.tsx:251-255` 여전히 `bakedImageRef.current = bakedImage;` 등 렌더 본문 직접 대입. §3-2에서 권고한 `useEffect` 복원 미적용 |
| — | 신규 크래시 tombstone | **판단 불가** | `.tmp-crash-buf.txt`/`buf2.txt`의 `LastWriteTime`이 이전과 동일(18:14/18:21) — 수정 이후 새 실기 재현 캡처는 없었음. 즉 "크래시 안 남" = 확인 아님, 단지 재현 시도 기록이 아직 없다는 뜻 |
| — | `tools/memory-audit/reports/skia-worklet-latest.md` (26/26 PASS) | **참고용, 근거 아님** | 타임스탬프가 이전 조사 때와 동일(09:39:14Z) — 이번 수정 후 재실행되지 않음. 이 감사는 텍스트 패턴 스캔(예: "clipRect 문자열 없음", "width() 문자열 없음")이라 **A(레이아웃 구조)·C(useEffect 여부)를 애초에 잡아낼 수 없는 종류의 검사** — PASS가 A/C 미수정 사실과 모순되지 않음 |

**요약**: 이번 수정은 **§2(tsc 타입 에러)만 정확히 고쳤다.** §1(위아래 공백)과 §3(크래시 유력 후보였던 ref 동기화 패턴)은 코드상 그대로 남아있어, **"위아래 공백"은 계속 재현될 가능성이 높고, 크래시 재현 여부는 실기로 다시 확인해야 한다.** 대표님께 "전수 재검사" 결과로 이 두 가지가 아직 안 고쳐졌다는 점을 명확히 보고 드리는 것이 맞다고 판단.

*재검수: 김클로드 · 2026-09-16 · 분석만(코드 미변경).*

---

## 7. "왜 안 고쳐지고 있나" — 작업 패턴 분석 (대표님 요청)

코드·타임라인 근거로만 분석. 사람에 대한 추측(의도·역량 평가)이 아니라 **관찰 가능한 산출물 패턴**에 한정.

1. **고쳐진 것은 "안 고치면 본인이 당장 막히는" 신호뿐이다.** `tsc` 타입 에러는 김팀장 본인의 빌드/IDE에서 파일을 저장할 때마다 바로 빨간 줄로 보인다 — 피할 수 없는 신호. 반면 위아래 공백은 **기기에서 화면을 직접 봐야만** 보이고, ref-sync 문제는 **런타임 레이스**라 정적 검사로 안 걸린다. 셋 다 리포트 §1~3에 파일:줄로 적어뒀지만, 실제로 반영된 건 "저장할 때마다 에디터가 알려주는 것" 하나뿐이었다.

2. **자체 테스트가 오답을 정답으로 보증하고 있다.** `transitCombatParallaxPlan.test.ts:108-120`의 테스트명 자체가 `"fullscreen content excludes stage top/bottom insets"` — 즉 "인셋을 뺀 콘텐츠 박스"를 **의도된 사양**으로 단언하는 테스트다. 이 테스트는 인셋 수치 계산(72/54)이 내부적으로 일관된지는 검증하지만, **그 인셋을 컨테이너에 적용하는 게 맞는지**(상위 `StageShell.backgroundOverlay`가 이미 풀블리드라는 사실)는 애초에 알 수 없는 범위다. `npx tsx` 유닛테스트가 전부 PASS로 뜨니, 이 테스트만 보면 "문제 없음"으로 읽힌다 — **버그가 수치가 아니라 "어디에 적용하는가"에 있어서, 이 레벨의 테스트로는 구조적으로 못 잡는다.**

3. **인셋을 없애는 대신 "적용 방식"만 계속 바꾸고 있다.** 조사 도중 직접 목격한 사실: `resolveTransitStageInsets`(풀캔버스 채우고 콘텐츠만 인셋) → `resolveTransitBackdropChromePad`(컨테이너 View 자체를 인셋) 로 리팩터됐는데, **인셋이라는 개념 자체는 두 버전 다 유지**됐고 옛 함수(`resolveTransitStageInsets`)도 파일에 그대로 남아있다(현재 `drawBakedHubFill`의 내부 헬퍼 `resolveTransitBakedFillBox`가 여전히 그걸 씀). 이건 "인셋 값/적용 위치를 바꿔보면 공백이 없어지겠지"라는 가설로 계속 변형을 시도 중인 패턴으로 읽힌다 — 반면 본 리포트 §1의 결론은 "**StageShell이 이미 풀블리드 컨테이너를 주므로 이 레이어는 아예 인셋하면 안 된다**"로, 지금까지의 변형 방향과 전제가 다르다. 이 전제 차이가 아직 해소되지 않은 것으로 보인다.

4. **ref 동기화의 `useEffect` 제거는 별도 의도적 결정이라기보다 리팩터의 부수 효과로 보인다.** 같은 파일 안에서 "SkImage 수동 dispose 금지" 같은 안전 규칙은 주석으로 꼼꼼히 남기는 습관이 있는데(라인 256 등), `useEffect` 제거에는 그런 설명이 없다 — `stageInsets`→`chromePad` 리네이밍과 같은 시점에 통째로 바뀐 것으로 보아, 넓은 범위를 한 번에 고쳐쓰는 편집 중 곁가지로 사라진 것에 가깝다.

5. **handoff에 아직 김팀장 verdict가 없다.** 두 리포트(§1 최초 분석, §6 재검수) 모두 `kim_team_lead_verdict` 필드가 비어 있다 — 즉 이번 수정은 리포트를 보고 항목별로 반영한 것이라기보다, **김팀장이 자기 화면(에디터)에서 직접 마주친 에러부터 먼저 처리**했을 가능성이 높다. 마지막 파일 수정(18:40)부터 지금(18:54)까지 약 14분간 추가 편집이 없어, 이 시점을 "일단락"으로 보고 있는 것으로 보인다 — 즉 **아직 진행 중이라기보다 리포트의 나머지 항목을 놓친 채로 멈춰 있을 가능성**이 크다.

**결론**: 기술적으로 "못 고치는" 게 아니라, 리포트의 3개 항목 중 **자동으로 보이는 신호 1개만 처리되고 나머지 2개는 화면 확인·문서 재독이 필요한 항목**이라 아직 반영 전인 것으로 보인다. 대표님께서 "위아래 공백이랑 §3 ref 동기화, 리포트 §1/§3 다시 봐달라"고 직접 짚어주시면 빠르게 반영될 가능성이 높다고 판단.

---

## 8. 구현 + 자가검수 (READY `transit-combat-skia-backdrop-fix-20260916` 이관 · 2026-09-16 19:0x)

대표님 지시로 구현·자가검수가 김클로드로 이관됨(READY 파일 §1: "지금 수정이 안 되는 중이므로 김클로드가 이어서 구현"). 착수 직전 디스크를 다시 읽어보니 김팀장이 §1(공백)·§3(ref 동기화)에 대해 **이미 부분 반영**을 시도한 상태였다 — 컨테이너는 `styles.root`(순수 `absoluteFillObject`)로 풀블리드 전환돼 있었고, ref 동기화도 `useEffect`로 복원돼 있었다. 그런데 **구름 레이어만은 여전히 `resolveTransitFullscreenContentBox`로 상하 72/54px 인셋된 콘텐츠 박스 안에서만 그려지고 있어**, flat-fill과 베이크 성운은 풀캔버스인데 구름만 마진에 못 닿는 **비대칭 상태**였다 — 이게 대표님이 "위아래 공백까지 채워야 하는 문제"로 다시 지적하신 잔여 증상이라고 판단했다.

**대조 기준**: 대표님 지시("기존 행성허브나 은하계 지도와 동일한 구조") — 허브의 실제 배경 컴포넌트 `PlanetNebulaImageBackdrop.tsx:70`을 확인한 결과 `...StyleSheet.absoluteFillObject`로 **레이어 구분 없이 전체가 풀블리드**였다. 즉 "같은 구조"는 일부 레이어만 마진을 피하는 비대칭이 아니라 **전 레이어 동일 풀캔버스**를 의미한다고 결론.

**변경**:
- `TransitCombatSkiaParallaxBackdrop.tsx` — `flushPicture()`에서 구름 타일 크기·좌표 계산을 `resolveTransitFullscreenContentBox(canvasW, canvasH, insets...)` 기반 `content` 박스 대신 **원시 `canvasW`/`canvasH`**로 변경(베이크·flat-fill과 동일 기준으로 통일). 이제 불필요해진 `useSafeAreaInsets`/`resolveTransitBackdropChromePad`/`resolveTransitFullscreenContentBox` import·변수 제거.
- 부수 효과: 구름 인셋이 `safeInsets.bottom`(비동기 해석값)에 의존하던 고리가 없어지면서, 그 값이 바뀔 때마다 `flushPicture` 콜백 identity가 바뀌어 인터벌이 재시작되던 경로도 함께 사라짐 — 기존 `skipFlushTicksRef`(리사이즈 2틱 스킵)는 `gfxSize` 변경만 감시해 이 경로를 못 덮었었는데, 경로 자체를 없애 "끊기는" 체감의 유력 원인 하나를 제거.
- `tools/memory-audit/run-skia-worklet-memory-audit.cjs` — "overlay is full-bleed" 체크가 옛 설계(구름 content-box 유지) 전제라 새 설계에서 실패해, 검증 대상을 "구름도 베이크와 동일 풀캔버스 기준"으로 갱신 + 신규 체크 1개 추가.

**자가검수**: `npx tsc --noEmit -p tsconfig.client.json` 클린(0 에러) · `npx tsx src/combat/transitCombatParallaxPlan.test.ts` 17/17 PASS · `npm run audit:skia-memory` 29/29 PASS(수정 전 27/28 FAIL 1건 → 체크 갱신 후 전부 PASS).

**실기 미확인**: 이 턴엔 기기 접근이 없어 "끊기는 체감이 실제로 사라졌는지"는 대표님 재테스트로만 확인 가능. 크래시는 대표님 확인상 현재 미재현이며, 이번 변경은 좌표·범위 계산만 건드려 새 크래시 경로를 만들 가능성은 낮다고 판단하나 이 역시 실기 확인 전까지는 추정이다.

*구현: 김클로드 · 2026-09-16 · commit 없음(대표님 지시 후 김팀장 커밋).*
