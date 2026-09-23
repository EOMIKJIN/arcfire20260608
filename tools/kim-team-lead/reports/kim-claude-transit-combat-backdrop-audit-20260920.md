# 이동중 전투(Transit Combat) 배경 성운·구름 연출 — 코드 전수 정밀조사

```text
status=ANALYSIS_ONLY
task_id=transit-combat-backdrop-audit-20260920
kind=CODE_AUDIT
code_changes=NO
commit=FORBIDDEN
target=src/combat/transitCombatParallaxPlan.ts · src/combat/transitCombatParallaxAssets.ts ·
       src/components/combat/TransitCombatSkiaParallaxBackdrop.tsx ·
       src/components/planet/planetSkiaHitFxContract.ts (공용 hit-fx draw) ·
       app/(game)/combat.tsx (마운트/active/dispose 연결) ·
       src/game/planetStageGpuSupervisor.ts · src/combat/combatSkiaPresentationReclaim.ts ·
       src/game/skia/{skiaMemoryLifecycle,skiaPictureFrameRegistry}.ts
[pss-pre-dev] hot_path=이동중 전투 배경 패럴랙스 tick(setInterval 120ms) — 전투 rAF와 별도
[pss-pre-dev] alloc=모듈 레벨 Paint/Rect/Float32Array 스크래치 재사용, 틱 신규 할당 없음(직접 확인)
[pss-pre-dev] cache=SkImage(useImage 훅 자체 관리) · SkPicture(React state 교체만, 수동 dispose 금지)
[pss-pre-dev] stage=STAGE 3 combat.tsx · Skia 있음 — Zero-Allocation 대상
[pss-pre-dev] verdict=PASS — 아래 §2 경미 1건 제외 구조적 결함 없음
```

> **대표님 지시**: "이동중 전투(배경 구름성운·연출) 코드 안정화 여부 전수조사 — 프레임 문제·메모리 문제·연출효과 구현을 코드단에서 정밀 설계도 분석."

---

## 0. 결론

**설계·구현 모두 견고함.** 프레임·메모리 관점에서 확정 결함 없음 — 확인한 것은 경미한 중복 정리 호출 1건뿐이며 이는 안전(멱등)하다. 아래 항목별로 실제 코드를 근거로 검증했다.

---

## 1. 프레임 — 전투 rAF와 배경 패럴랙스 tick이 실제로 분리되어 있음

`TransitCombatSkiaParallaxBackdrop.tsx:473-475`에서 `setInterval(flushPictureRef.current, TRANSIT_PARALLAX_TICK_MS)`로 배경(구름·별·베이크 성운)만 별도 120ms 주기로 그린다. 실제 전함 대전(`PlanetEdenRaidOrbitSkiaCombat` 공용 엔진)은 별개의 rAF 루프를 쓰므로, 배경 Picture 재생성+`setState`가 전투 프레임과 경쟁하지 않는다.

- `transitCombatParallaxPlan.ts:31-32` 주석: *"구름은 1.15~1.7px/s. 80ms는 Picture+setState가 전투 프레임과 겹쳐 끊김"* — 80ms에서 120ms로 올린 근거가 코드에 직접 기록돼 있다. 즉 이 값은 임의 상수가 아니라 실측 튜닝 결과.
- `transitCombatParallaxPlan.test.ts:91-93`에 `TRANSIT_PARALLAX_TICK_MS >= 120` 단위테스트로 회귀 방지까지 걸어놨다 — 이후 누군가 값을 낮춰도 테스트가 잡는다.
- 레이아웃 변경 시 `skipFlushTicksRef`로 리사이즈 후 2틱을 건너뛰어(`handleGfxLayout:494-497`) 리사이즈 중간에 어긋난 프레임이 그려지는 것도 막아둠.

**닷지 섬광(ColorDodge) 표시 주기 관련 참고사항(결함 아님)**: 닷지 섬광 지속시간은 `NEBULA_DODGE_FX_DURATION_MS=203ms`(레이저 닷지는 ×0.5=101ms, `planetSkiaHitFxContract.ts:182-191`)이고 배경 틱은 120ms다. 수치상 섬광의 유효 표시 구간(생성 48ms 전~종료, 약 149ms)이 120ms 틱 주기보다 길어 최소 1회는 항상 그려짐이 산수적으로 보장되지만(주기<구간이면 pigeonhole로 항상 겹침), 부드러운 페이드보다 "1~2프레임 플래시"에 가깝게 보일 수 있다. 이는 위 80ms→120ms 튜닝과 같은 트레이드오프이지 버그는 아니다 — 굳이 더 매끄럽게 하려면 별도 rAF 채널이 필요하나 그러면 다시 전투 프레임과 경쟁하므로 현재 선택이 합리적이다.

---

## 2. 메모리 — Zero-Allocation 원칙 실제 준수 확인 (경미 1건)

`TransitCombatSkiaParallaxBackdrop.tsx:48-170`의 모든 Paint·Rect·Float32Array(`_fillPaint`, `_spacePaint`, `_cloudPaints`, `_cloudSrcRect`, `_scratchDestRects`, `_starCatalog`, `_starDrawScratch`, `_starDimPaint`, `_starBrightPaint`)는 모듈 레벨 lazy-singleton으로, 틱마다 `Skia.Paint()`/`Skia.XYWHRect()`를 새로 만들지 않고 `setXYWH`/`setAlphaf`/`setColor`로 값만 갱신한다 — 파일 헤더 주석("Zero-Allocation: 모듈 Paint·Rect + Picture 1장")이 실제 구현과 일치함을 라인 단위로 확인했다.

`SkPicture`/`SkImage` 수동 dispose를 하지 않는 것도 **의도적**이다. `skiaMemoryLifecycle.ts:25-38` 주석에 2026-07-22 logcat SIGSEGV(`JsiSkPicture::~ → jsi::Pointer::~` NPE, FinalizerDaemon) 재현 경로가 기록돼 있고, `commitSkPictureReactFrame`/`dropSkPictureReactFrame`은 React state 교체로 참조만 끊고 네이티브 해제는 RN Skia finalizer에 위임한다. 배경 패럴랙스도 이 계약을 그대로 따른다(직접 `.dispose()` 호출 없음, 확인됨).

별빛 필드도 `getStarCatalog()`로 위치·반짝임 시드를 1회만 생성해 `Float32Array`에 캐시하고(`fillTransitStarCatalog`), 매 틱은 `writeTransitStarDraw`로 같은 4-float 스크래치(`_starDrawScratch`)에 덮어쓴다 — 52개 별 × 매 120ms 신규 객체 0개.

### 경미 — STAGE 이탈 시 동일한 정리 로직이 레지스트리 2곳에서 중복 실행

이 컴포넌트는 언마운트/비활성 정리 함수(`stopParallaxLoops(); dropSkPictureReactFrame(...)`)를 **두 개의 별도 레지스트리**에 각각 등록한다:

- `registerSkPictureFrameInvalidate(...)` (`TransitCombatSkiaParallaxBackdrop.tsx:437-442`)
- `registerCombatSkiaPresentationReclaim(...)` (`TransitCombatSkiaParallaxBackdrop.tsx:444-449`)

그런데 `runCombatSkiaPresentationReclaim()`(`combatSkiaPresentationReclaim.ts:19-27`)은 **먼저** `invalidateAllSkPictureFrames()`를 호출한 뒤(1차 레지스트리 순회) **그다음** 자기 자신의 `reclaimFns`를 순회한다(2차). 이 컴포넌트만 놓고 보면 STAGE reclaim 1회(`runStageNativeReclaimPass` 또는 `clearCapitalRealtimeCombatPresentationCaches` 경유)마다 동일한 정리 함수가 정확히 2번 호출된다.

- **위험도**: 낮음. `stopParallaxLoops`(interval already-null 체크 있음)·`dropSkPictureReactFrame`(ref/setState를 null로) 모두 멱등이라 크래시·부작용 없음.
- **왜 있는지**: 두 레지스트리는 원래 다른 목적(Picture 노드 invalidate vs 모듈 캐시 reclaim)으로 만들어졌는데, 이 컴포넌트가 같은 클린업을 양쪽에 다 걸어서 겹친 것으로 보인다. 다른 Skia 레이어(`SkiaPlanetNebulaShaderBackdrop.tsx`, `PlanetEdenRaidOrbitSkiaCombat.tsx`)도 동일 패턴인지는 이번 조사 범위 밖이라 확인 못함 — 필요시 별도 확인 권장.
- **개선 방향(미적용)**: 두 레지스트리 중 하나만 등록하거나, `runCombatSkiaPresentationReclaim` 쪽에서 `invalidateAllSkPictureFrames` 호출을 없애고 reclaimFns 하나로 통합. 급하지 않음.

---

## 3. GPU 레이어 등록 — `onRelease` 미전달은 버그 아니라 코드베이스 공통 관례

`registerGpuLayer('skia_transit_parallax', 'T0')`(줄 323)에 3번째 인자(`onRelease`)가 없어 실제 자원 해제로 이어지지 않는 것처럼 보이지만, 확인 결과 **다른 3곳(`PlanetEdenRaidOrbitSkiaCombat.tsx`, `SkiaPlanetNebulaShaderBackdrop.tsx`, `PlanetHubInboundDroneSkiaTrailLayer.tsx`) 전부 동일하게 `onRelease` 없이 호출**한다 — 코드베이스 전체에서 `registerGpuLayer`는 사실상 "티어 집계용 북키핑"으로만 쓰이고, 실제 해제는 `registerCombatSkiaPresentationReclaim`(§2) 쪽이 담당한다. 이 컴포넌트만의 결함이 아니므로 정정 대상 아님.

---

## 4. 연출효과(구름·성운·별빛·닷지 섬광) 구현 — 설계 의도와 코드 일치 확인

| 연출 | 구현 | 확인 |
|---|---|---|
| 베이크 성운(고정 배경) | `resolvePlanetNebulaBakedSource` — 행성별 지정 없으면 zone별 폴백 풀에서 해시 결정론 선택(`planetNebulaBakedAssets.ts:48-63`), `useImage`로 로드 | 미등록 행성도 항상 성운이 뜨도록 폴백 확인됨 |
| 흐르는 구름 2겹 | `TRANSIT_CLOUD_LAYER_SPEEDS_PX_PER_SEC=[1.15,1.7]`, 서로 다른 위상(`WRAP_PHASE_FRAC=[0.5,0]`)·알파(`[0.40,0.34]`) — 동일 대각선, 속도만 다름 | `transitCombatParallaxPlan.test.ts:95-107`에서 두 겹이 서로 다른 속도·위상을 갖는지 단위 검증 |
| 별빛(원경) | 52개 고정 카탈로그, 구름보다 느린 드리프트(0.28px/s < 1.15px/s) — 원근감 | 테스트로 "별이 구름보다 느림" 명시 검증(`transitCombatParallaxPlan.test.ts:62-78`) |
| 닷지 섬광(ColorDodge) | 전투 궤도 좌표 → 배경 좌표로 `orbitOffsetX/Y` 변환 후 구름/성운 픽셀 위에만 그림(`drawNebulaColorDodgeFxTransformedOnSkCanvas`) | `planetSkiaHitFxContract.ts:10-14` 계약 주석대로 "성운/구름과 동일 SkCanvas ONLY, 전투 궤도 Picture에서 금지"를 실제로 지킴 — 궤도 combat Picture 쪽에는 이 함수 호출이 없음(별도 확인) |
| 조우마다 다른 시작점 | `resolveTransitSessionViewStart(seed)`가 마운트 1회만 롤 — 매번 같은 자리에서 시작하지 않도록 함 | seed 1과 2가 다른 시작 오프셋을 내는지 테스트로 검증(`transitCombatParallaxPlan.test.ts:254-262`) |

순수 수학 함수(좌표·랩·해시)는 전부 `transitCombatParallaxPlan.test.ts`(node 실행, Skia 불필요)로 커버돼 있어 화면 배치·랩핑 로직 자체의 회귀 위험은 낮다.

---

## 5. STAGE 이탈 연동 — 정상

- `active={isCombatRouteFocused && !exitPending}`(`app/(game)/combat.tsx:373`) — 라우트 blur·이탈 대기 중이면 즉시 `stopParallaxLoops()`+Picture drop, 언마운트를 기다리지 않음.
- `useStageMemory('combat_transit', ..., releaseCombatStageMemory)`(`combat.tsx:116-122`) → `clearCapitalRealtimeCombatPresentationCaches` → `runCombatSkiaPresentationReclaim()`으로 STAGE 완전 이탈 시에도 재확인 정리.
- `resetSkPath`류 SkPath 풀은 이 배경 컴포넌트는 사용하지 않음(별도 orbit combat 쪽 관심사) — 범위 밖.

---

*작성: 김클로드 · 2026-09-20 · 코드 단위 분석만(실기 미접근). commit 없음.*
