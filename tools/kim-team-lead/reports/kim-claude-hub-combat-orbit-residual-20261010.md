# 허브 전투 orbit 종료 후 Native Heap +20~25MB 잔류 — 독립 원인 분석 (김클로드)

- 작성: 김클로드(서브리더) · 2026-10-10 · 요청: 김플레이(메인리더)
- 범위: 읽기 전용 분석. 코드 수정·commit 없음. heap purge 경로, Skia GPU 캐시 상한, 화면 전환 겹침은 김플레이 담당이라 다루지 않음.
- 대상 버전: RN 0.81.5 · RN Skia 2.2.12 · Reanimated 3.19.5(`node_modules/react-native-reanimated/package.json`) · 구 아키텍처

---

## 0. 결론 요약

1. **전제 재검수: PARTIAL.** 「톱니 = SkPicture가 Hermes GC finalize로 몰아서 해제된다」는 **JS 런타임 기준으로는 맞지 않습니다.** `hermes_ext_mb`는 전투 중에도 4.5~10MB로 평탄합니다(mem-profile-logcat 10-09 22:31~22:33). 그래서 45MB를 한꺼번에 붙잡는 주체는 JS 런타임 밖에 있습니다.
2. **유력 경로(근거: 코드 강 · 원인 판정 중).** RN Skia 2.2.12의 `<Canvas>`는 Reanimated 3가 있으면 **React commit 1회마다** 다음을 만듭니다.
   - JS 쪽 `Skia.Recorder()` 1개
   - `runOnUI` 클로저 1개
   - UI(Reanimated) 런타임 쪽 `recorder.play()` SkPicture 1개

   이 Recorder와 play 결과물이 **전투 SkPicture를 sk_sp로 참조**합니다. 이 참조가 풀리는 시점은 **UI 런타임 GC**입니다. UI 쪽에 보고되는 메모리 압력은 바깥 picture 크기(수백 B)뿐이고, 안쪽 전투 picture 크기(~33KB)는 반영되지 않습니다. 그래서 UI GC가 드물게 돌고, 돌 때 한꺼번에 해제되는 톱니가 생깁니다.
3. **잔류 해석.** orbit이 끝나는 순간에는 「마지막 UI GC 이후 쌓인 분량」(0~45MB, 기대값 약 22MB)이 남습니다. 허브는 화면이 유지되고 UI 런타임 할당이 적어서 다음 GC가 늦어집니다. 실측 +20~25MB는 기대값과 일치하지만, **누수인지 단순 지연 해제인지는 아직 가르지 못했습니다** → §4 검증 P0.
4. **추가 발견(근거: 코드 강).**
   - `PlanetCapitalCombatRoot`는 active가 바뀔 때마다 `<>{children}</>`와 `<Binder>{children}</Binder>` 사이를 오갑니다. 그 결과 **허브 서브트리 전체(StageShell 포함)가 전투 시작과 종료 때마다 리마운트**됩니다. 이전 Skia 네이티브 뷰는 Java `finalize()`(ART GC)가 돌아야 해제됩니다.
   - Canvas 1회 render 때 redraw가 **2번** 실행됩니다(Recorder도 2배).
5. 모듈 캐시(`_combatPictureRecorder`, `skColorCache`, `_teamFlameTintCache`, `_mfCache`, Paint, Rect, Path 풀)는 **모두 해제 경로가 있고 크기도 수십 KB 이하**입니다. 이번 +20MB의 주원인이 아닙니다.

---

## 1. 전수 조사 표 — orbit이 켜질 때 생기고 꺼진 뒤에도 네이티브를 붙잡을 수 있는 것

| # | 항목 | 생성 (파일:줄) | 해제 (파일:줄) | orbit 종료 후 | 추정 크기 | 확신 |
|---|------|---------------|---------------|--------------|-----------|------|
| 1 | **프레임당 전투 SkPicture**(RTree BBH 포함). `beginRecording(rect, &SkRTreeFactory)` | `PlanetEdenRaidOrbitSkiaCombat.tsx:808-1103`(`finishRecordingAsPicture` 1103) · 커밋 1185 · `<Canvas><Picture/>` 1321-1323 · BBH: `node_modules/.../JsiSkPictureRecorder.h:29-34` | JS 래퍼는 JS GC(압력=`approximateBytesUsed`, `JsiSkPicture.h:72-80`)로 빠르게 정리됨. 그러나 #2의 Recorder와 UI picture가 참조 중이면 **UI 런타임 GC 전까지 살아 있음** | **잔류(지연)**. 마지막 UI GC 이후분이 남음 | 2MB/s ÷ 약 60fps ≈ **약 33KB/프레임** → 0~45MB, 기대값 약 22MB | 경로 강 · 주원인 판정 중 |
| 2 | **RN Skia Reanimated 컨테이너의 커밋당 Recorder와 UI picture** | `node_modules/@shopify/react-native-skia/src/sksg/Container.native.ts:42-66`(`new ReanimatedRecorder` → `runOnUI` → `recorder.play()`) · PictureCmd가 `sk_sp<SkPicture>` 보유: `cpp/api/recorder/Drawings.h:796-811` · `play()`: `JsiRecorder.h:53-65` | UI 런타임의 Recorder 래퍼와 play 결과가 GC될 때. 메모리 압력은 바깥 picture의 `approximateBytesUsed`만 반영되고 중첩된 전투 picture 크기는 빠짐 | **잔류(지연)**. #1을 붙잡고 있는 실체 | Recorder 자체는 작음(JS 쪽 보고 16KB, `JsiRecorder.h:317`). 핵심은 #1을 고정시킨다는 점 | 강(코드) · 중(GC 타이밍) |
| 3 | **Canvas 이중 redraw**: `root.render()` = `resetAfterCommit→redraw` + 명시적 `redraw` | `node_modules/.../sksg/Reconciler.ts:55-59` · `HostConfig.ts:133-135` · `renderer/Canvas.tsx:97-99` | #2와 같음 | #2의 쓰레기를 2배로 만듦 | #2 × 2 | 강(코드) |
| 4 | **전투 모드 성운 Skia 백드롭**(`SkiaPlanetNebulaShaderBackdrop`): useImage 3장(성운 baked 1024², backdrop, dodge) + dodge picture 50ms 커밋 | 스왑: `planetHubSubcomponents.tsx:601-626`(`showEdenRaidTest`일 때만 마운트) · 이미지: `SkiaPlanetNebulaShaderBackdrop.tsx:140-142` · dodge 커밋: 169-185, 281-290 | 컴포넌트 언마운트 후 JS GC, UI GC(Recorder ImageCmd가 참조), ART finalize(#5)를 모두 거쳐야 함 | **잔류(지연)** 가능 | 인코딩된 SkData 약 0.7~0.9MB(`arcadia_prime.png` 874KB) + backdrop. 디코드된 래스터 4MB의 CPU 상주 여부는 불명. GPU 텍스처는 GL 축 | 중 / 약(디코드 상주) |
| 5 | **Skia 네이티브 뷰(C++ `RNSkPictureView`)가 마지막 picture를 보유** | `cpp/rnskia/RNSkPictureView.h:53-74`(`sk_sp<SkPicture> _picture`) | **Java `SkiaPictureView.finalize()` → `resetNative()`** 시점(`android/.../SkiaPictureView.java:20-23`). `onDropViewInstance`→`dropInstance`(`SkiaBaseView.java:35-37`)는 unregister만 함 → **ART GC에 의존** | 잔류(지연). 뷰당 마지막 프레임 1장. GL surface는 GL 축 | 전투 뷰 약 33KB. 성운 뷰는 picture가 SkImage를 참조하므로 #4를 고정 | 강(코드) · 크기 작음 |
| 6 | **`PlanetCapitalCombatRoot` 트리 모양 전환으로 허브 서브트리 전체 리마운트** | `src/game/planetCapitalCombatIntegration.tsx:60-74`(`<>{children}</>` ↔ `<Binder>`) · children 4개: `planet.tsx:2150-2386`(Preloader, HeavySlot, StageShell, StageLoadingOverlay) | 이전 서브트리의 Skia 뷰, useImage, picture가 각각 #2·#5 경로로 지연 해제 | 전투 시작과 종료 때 **허브의 모든 Skia Canvas와 이미지가 1회씩 이중 존재** | 불명(허브 Skia Canvas 수 × 마지막 picture + 이미지) | 리마운트 사실 강(React: 키 없는 top-level Fragment는 펼쳐지고, 단일 요소 Binder와 타입이 달라 전부 삭제 후 재생성) · MB 기여 약 |
| 7 | `_combatPictureRecorder` | `PlanetEdenRaidOrbitSkiaCombat.tsx:418-423` | `reclaimCombatSkiaModuleCaches` 727-728(언마운트 16ms 후 1236, orbit_end reclaim 경로 `runPlanetHubPostSkiaPeakReclaimPass.ts:34`) | 해제됨 | `sizeof(SkPictureRecorder)` + 기록 버퍼 | 강 |
| 8 | `SK_PAINT_STROKE/FILL` · `_thrusterFlamePaint` | 572-583 · 689-699 | 721-726 | 해제됨 | 1KB 미만 | 강 |
| 9 | `_teamFlameTintCache` | 702-713(값은 항상 `null`) | 717-720 | 해제됨(실질적으로 빈 맵) | 0 | 강 |
| 10 | `skColorCache`(Float32Array) | 629-637 | 716(JS 참조만 끊고 GC) | 해제됨 | 16B × 수십 | 강 |
| 11 | `_recordRect` · `_thrusterSrc/DestRect` | 425-427, 835-836 | 729-731 | 해제됨 | 무시 가능 | 강 |
| 12 | `_burstPaints` · `_dodgePaint` · **`_mfCache`**(MaskFilter blur) · scratch rect | `planetSkiaHitFxContract.ts:95-102, 146-178` | `disposePlanetSkiaHitFxModuleCaches` 116-136(등록: `PlanetEdenRaidOrbitSkiaCombat.tsx:735`) | 해제됨 | 수 KB. blur 마스크는 Ganesh 경로라 GPU 축 | 강 |
| 13 | Path 풀(missileTrail, novaHead, diamond + spare, craftOval/Trail) | 104-136, 1126-1130, `skiaMemoryLifecycle.ts:81-91` | 언마운트 16ms 후 drain: 1217-1237 · `skiaMemoryLifecycle.ts:93-102` | 해제됨. picture는 path를 COW 사본으로 가지므로 dispose해도 안전 | 수십 개 × 1KB 미만 | 강 |
| 14 | orbit useImage(`color_dodge_02` 78×77 · `tail_fire_02` 50×50) | 1131, 1137 | 언마운트 후 GC(+ #2 경로) | 지연 해제 | 약 40KB | 강 |
| 15 | `_nebulaDodgeRecorder` | `SkiaPlanetNebulaShaderBackdrop.tsx:43-48` | 242-245, 255-261 | 해제됨 | 작음 | 강 |
| 16 | 시뮬 상태(agentsRef, missilesRef, craftsRef, missileHitFxRef, agentByIdBuf …) | `PlanetEdenRaidTestLayer.tsx:2947-2989` | orbit 종료 시 Root가 Binder를 언마운트 → ref 소멸(4139-4174). active=false 정리 3059-3079 | 해제됨(JS GC) | JS 힙. craft 풀의 typed array 백킹만 소량 malloc | 강 |
| 17 | Reanimated SharedValue · worklet | orbit 컴포넌트에는 SV 없음(ref 직독). 라이브러리가 커밋마다 `runOnUI` 클로저를 만듦 = #2 | — | #2에 포함 | — | 강 |
| 18 | store의 전투 스냅샷 | `useOrbitCapitalCombatUiStore`(boolean, 4161-4164) · `captureCombatResumeSnapshot`는 출발 때만(4084-4097) · `resetHubOrbitCombatResultSession` | — | JS 소량 | 무시 가능 | 강 |
| 19 | 프레임 루프 내 소할당(잔류는 아님) | `planetSkiaHitFxContract.ts:253,258,263` `Skia.Color()` 버스트당 3회 · `SkiaPlanetNebulaShaderBackdrop.tsx:62` `Skia.XYWHRect` 기록당 1회 · `beginRecording`마다 `JsiSkCanvas` 래퍼(`JsiSkPictureRecorder.h:40-42`) | JS GC | 잔류 아님(쓰레기 압력만) | 작음 | 강 · ETC 후보 |

### `clearCapitalRealtimeCombatPresentationCaches` / `runCombatSkiaPresentationReclaim`가 실제로 비우는 범위
- `combatSkiaPresentationReclaim.ts:35-44` → `invalidateAllSkPictureFrames()`(등록된 Picture를 React 프레임에서 제거 = `setPicture(null)`)를 실행한 뒤, 등록된 reclaim fn을 실행합니다.
- 등록된 reclaim fn은 3개뿐입니다: `reclaimCombatSkiaModuleCaches`(#7~#11), `disposePlanetSkiaHitFxModuleCaches`(#12), `TransitCombatSkiaParallaxBackdrop.dropIfInactive`.
- **#1~#6(UI 런타임 GC와 ART finalize에 묶인 것)은 이 경로로 건드릴 수 없습니다.** 90초 followup이 효과가 없는 것과 일치합니다(근거 강).

---

## 2. 이동 중 전투(combat.tsx)에는 잔류가 없고 허브 orbit에는 남는 차이

| 관점 | 이동 중 전투(STAGE 3) | 허브 orbit(STAGE 1 유지) |
|------|-----------------|--------------------|
| 렌더 컴포넌트 | **같은 컴포넌트**: `combat.tsx:456` `CapitalRealtimeCombatOrbitSkia` = `PlanetEdenRaidOrbitSvg` → `PlanetEdenRaidOrbitSkiaCombat` | 같은 컴포넌트: `planetCapitalCombatHeavyUi.tsx:141` |
| 프레임당 쓰레기 경로 | 같음(#1~#3) | 같음(#1~#3) + 성운 Skia 백드롭 dodge 커밋(#4) |
| 종료 직후 | `router.replace('/(game)/worldmap' \| '/(game)/planet')`(`combat.tsx:243, 311, 371, 394`) → **라우트 전체 언마운트 + 새 STAGE 마운트**. JS, UI(Reanimated), Java 할당이 한꺼번에 늘어 세 힙 모두 GC가 일어날 가능성이 큼 | 화면 유지. Root 리마운트(#6)만 일어남 → 할당량이 상대적으로 작아 UI 런타임 YG가 차지 않으면 GC가 미뤄짐 |
| 측정 시점 | 「전투 → 지도 → 전투」의 **다음 전투 시작값**(지도에서 보낸 시간 포함) | 전투 직후 연속 관측 |

- **해석(중).** 차이는 「무엇이 해제되느냐」가 아니라 **「GC를 일으킬 계기(화면 전환에 따른 할당 폭증과 경과 시간)가 있느냐」**일 가능성이 큽니다. STAGE 3는 언마운트와 새 화면 마운트가 계기가 되고, 허브는 그 계기가 없습니다.
- **주의(교란 변수).** 두 측정은 경과 시간과 측정 지점이 다릅니다. 허브도 충분히 기다리거나 STAGE를 한 번 오가면 잔류가 사라질 수 있습니다. 이걸 확인하기 전에 「누수」라고 단정하지 않습니다.

---

## 3. 근거 메모

- **JS 런타임 ext 평탄**: `tools/memory-profiler/reports/mem-profile-logcat.txt` 96200~96340행(10-09 dev 세션)에서 전투 구간 `hermes_ext_mb`=5.8~8.6, orbit_end=6.5→4.8입니다. JS 쪽에서 dead SkPicture 45MB가 대기 중이었다면 ext에 잡혔어야 합니다. 따라서 톱니의 주체는 JS 런타임 밖(UI 런타임 또는 ART)으로 봅니다. 단, 이 로그는 10-09 dev 세션이라 10-10 release 세션에서 재확인이 필요합니다.
- **HAS_REANIMATED_3**: `node_modules/.../external/reanimated/renderHelpers.ts:1-16`(3.19.5 → true). 그래서 `NativeReanimatedContainer` 경로를 탑니다(`Container.native.ts:69-79`).
- **중첩 picture 참조**: Skia `SkRecorder::onDrawPicture`는 op 수가 1 초과면 unroll하지 않고 `sk_ref_sp`로 참조합니다(Skia 내부 동작 · 근거 중, 소스 미확인).
- **Root 리마운트**: 키 없는 top-level Fragment는 React가 children 배열로 펼칩니다. 단일 요소 `<Binder>`로 바뀌면 첫 child(`PlanetCapitalCombatPreloader`)와 타입이 달라 기존 child를 전부 삭제하고 새로 만듭니다. `useStageMemory`의 `[MEM] planet_main_stage_hub mount` 로그는 Root 바깥(`planet.tsx:542`)에서 찍히므로 이 리마운트를 보여주지 못합니다. 실기로 확인하려면 StageShell 하위에 mount 로그를 넣어야 합니다.

---

## 4. 수정안 (게임 결과 동일 · 우선순위)

### P0 — 코드 수정 전 검증(dev 계측만, 게임 영향 없음) · 권장 1순위
가설 「UI 런타임 GC 지연」을 실기에서 가릅니다.
1. orbit 종료 시점과 이후 10초 간격으로 `runOnUI(() => { 'worklet'; HermesInternal?.getInstrumentedStats?.() })` 결과(UI 런타임 `js_numGCs`, `js_externalBytes`, `js_heapSize`)를 `[MEM_UI_RT]`로 로그합니다. **Native가 떨어지는 시각과 UI `numGCs` 증가가 겹치면 가설 확정**입니다.
2. 같은 구간 logcat에서 ART `GC freed` 줄과 대조합니다(#5·#6 ART 의존분 분리).
3. 대조 실험:
   - (a) orbit 종료 후 허브에서 5분 방치
   - (b) 허브 → 지도 → 허브 1회

   둘 중 하나로 바닥이 시작값으로 돌아오면 「누수 아님, 지연 해제」입니다. 반복 측정에서 잔류량이 0~45MB 사이로 흩어지면 #1 가설이 강화되고, 항상 20MB 언저리로 같다면 다른 원인(#4·#6)을 우선 봅니다.

### P1 — 전투 orbit picture를 `<Canvas><Picture/>`(React commit)에서 **`SkiaPictureView` 명령형 갱신**으로 전환
- 내용: `PlanetEdenRaidOrbitSkiaCombat.tsx` 1321-1323의 `<Canvas><Picture picture/></Canvas>`를 `SkiaPictureView`(RN Skia 공개 API: `src/views/SkiaPictureView.tsx`, `views/index.ts:1`에서 export)로 바꿉니다. `pushFrame`/`flushPictureToReact`(1179-1186)에서 `setPicture` 대신 `SkiaViewApi.setJsiProperty(nativeId, 'picture', pic)` + `requestRedraw(nativeId)`를 JS 스레드에서 직접 호출합니다.
- 효과:
  - 커밋당 JS Recorder, `runOnUI` 클로저, UI `play()` picture가 **0개**가 됩니다(#2·#3 제거).
  - 전투 picture는 JS 래퍼(정확한 압력 보고 → JS GC, 분당 약 35회 관측)와 네이티브 뷰의 최신 1장만 참조합니다. **UI 런타임 GC 의존이 사라져** 종료 후 잔류 상한이 수 MB 이하로 내려갈 것으로 예상합니다(추정).
  - 프레임당 React/Skia 리컨실 비용도 함께 줄어듭니다.
- 결과 동일성: 그리는 SkPicture는 같습니다. 다만 **효과 문구 라벨(1245-1300행)은 지금 `setPicture` 리렌더에 실려 매 프레임 위치가 갱신됩니다.** 라벨이 있는 동안에만 라벨 전용 state tick을 유지해야 동일성이 지켜집니다. 이 점이 구현의 핵심 주의점입니다.
- SIGSEGV 안전 근거:
  - 과거 크래시(`skiaMemoryLifecycle.ts:25-35`)는 **SkiaDomView `PictureProp` finalize와 JS 수동 dispose의 이중 해제**였습니다.
  - 2.2.12의 `RNSkPictureView`는 `sk_sp<SkPicture>`를 직접 보유하며(`RNSkPictureView.h:53-74`) JS 래퍼에 의존하지 않습니다.
  - P1은 **dispose를 전혀 호출하지 않습니다**(참조 교체만). Worklet dispose 없음, 프레임 루프 Make/Paint 추가 없음.
  - `invalidateAllSkPictureFrames`(1152-1161)의 `dropSkPictureReactFrame`은 `setJsiProperty(nativeId,'picture',null)`로 바꿉니다.
- 같은 패턴으로 확장 가능(P1b): 성운 dodge picture(`SkiaPlanetNebulaShaderBackdrop.tsx:169-185`). 이 Canvas는 SkiaImage 2장과 함께 있어 분리 설계가 필요하므로 P1 실측 후 판단합니다.
- 확신: 메커니즘 제거 강 · 잔류 해소 효과 중(P0 결과에 따라 확정).

### P2 — `PlanetCapitalCombatRoot` 트리 모양 고정(허브 서브트리 리마운트 제거)
- 내용: `planetCapitalCombatIntegration.tsx:60-74`에서 active와 관계없이 **같은 타입의 래퍼**로 children을 감쌉니다.
  - 예: `PlanetEdenRaidSimContext`를 lazy가 아닌 경량 모듈로 옮깁니다.
  - Root는 항상 `<SimContext.Provider value={sim | null}>{children}</...>`를 렌더합니다.
  - lazy sim 훅은 children을 감싸지 않는 형제 컴포넌트에서 돌리고 sim을 상태로 올립니다.
- 효과: 전투 시작과 종료 때마다 허브의 모든 Skia Canvas, useImage, 네이티브 뷰가 새로 만들어지고 이전 것은 ART finalize를 기다리는 **이중화(#6)를 제거**합니다. 성운 baked 이미지 재디코드와 GPU 재업로드도 함께 줄어듭니다(GPU는 김플레이 축).
- 결과 동일성 주의: 지금은 리마운트 덕분에 허브 하위 로컬 state(애니메이션 위상, 스크롤, 래치 등)가 전투 경계마다 초기화됩니다. 고정하면 state가 유지되므로 **초기화에 의존하는 하위 컴포넌트가 있는지 감사가 필요합니다**(dodge latch, `hubDodgeSkiaOverlayMounted`, `PlanetMainScanActionRow` 등). 감사 전에는 「결과 동일」을 보장할 수 없습니다.
- 확신: 리마운트 사실 강 · MB 기여 약(P0의 ART 대조로 확인).

### (비권장) 명시적 dispose 추가
전투 picture나 SkImage에 `dispose()`를 넣는 방식은 #2에서 UI 런타임 래퍼가 같은 객체를 참조하므로 **해제 후 사용(UAF)과 SIGSEGV 위험**이 있습니다. 쓰지 않습니다. P1로 참조 경로 자체를 줄이는 쪽이 안전합니다.

---

## 5. 리스크 · 미확인

- §3의 ext 평탄 근거는 10-09 dev 로그입니다. 10-10 release 세션 로그는 repo에서 찾지 못했습니다(`mem-profile-logcat.txt`에 10-10 00:0x 행 0건).
- Ganesh가 lazy SkImage 디코드 결과를 CPU `SkResourceCache`에 남기는지(#4의 4MB/장)는 Skia 소스를 확인하지 않았습니다(약). GPU 캐시 축과 겹치므로 김플레이 측 확인을 요청합니다.
- 프레임당 33KB는 「2MB/s ÷ 60」에서 역산한 값입니다. 커밋 빈도는 sim rAF 기준이며, 이중 redraw를 감안하면 picture 1장 크기는 같고 Recorder만 2배입니다.
- ETC 후보(P3): #19 프레임 루프 소할당(`Skia.Color` × 3/버스트, `Skia.XYWHRect`/기록).

---

## 6. 추가 감사 — 김플레이 P2 변형 반영분 (2026-10-10)

- 대상: `src/game/planetCapitalCombatIntegration.tsx:60-79`. Binder를 한 번 불러온 뒤에는 active=false여도 `<Binder>`로 계속 감쌉니다.
- 결과: 전투 종료 시 허브 서브트리 재마운트 0회, 첫 전투 진입 시 1회만 남습니다.
- 감사 방법: 읽기 전용. 범위는 `planet.tsx:2143-2387`의 children입니다.
- 결론 요약: **문제 1건(표시 문구), 주의 1건(sticky dodge 오버레이), 나머지는 무해**입니다.

### 6-1. 핵심 변화: 이제 Binder의 `active=false` 정리 effect가 실제로 실행됨
예전에는 orbit이 끝나면 Binder 자체가 언마운트되었습니다. 그래서 `usePlanetEdenRaidSim`의 inactive 정리 effect(`PlanetEdenRaidTestLayer.tsx:3059-3079`)와 `clearCapitalRealtimeCombatPresentationCaches` effect(4166-4169)는 **전투 종료 때 한 번도 실행되지 않았습니다.** 이제는 전투 종료마다 실행됩니다.

| # | 항목 | 파일:줄 | 판정 | 근거 · 보완안 |
|---|------|--------|------|-------------|
| A1 | **허브 전투 결과 오버레이의 `questOrbit`가 await 뒤에 읽힘** | 읽는 곳: `PlanetEdenRaidTestLayer.tsx:3466`(`await waitCombatEndHold()` 800ms 이후) · 리셋하는 곳: 3076 `resetHubOrbitCombatResultSession()`(2131-2136, `questOrbit=false`) | **문제(경미 · 표시 문구)** | 퀘스트 orbit에서 이기면 같은 틱의 3405 `applyDefeatEnemyMissionObjectives`가 퀘스트 락을 풉니다. 그러면 `questHubOrbitActive`가 false → `evaluateHubMainStageCombatEntered`(`evaluateHubMainStageCombatGate.ts:33-43`)도 false → orbit이 꺼지고 3076이 실행됩니다. 이 모든 일이 800ms 홀드보다 먼저 끝날 수 있습니다. 그러면 결과 오버레이 부제가 `waveResult.subtitleQuestOrbit` 대신 일반 허브 부제로 바뀝니다(`combatResultOverlayView.ts:65`). 패배 쪽(격침으로 orbit 꺼짐)도 같습니다. 쓰는 곳은 부제뿐이고 보상·쿨다운 판정에는 영향이 없습니다(3398 쿨다운 분기는 await 전에 동기 실행). **보완: 3442-3446에서 `expEarned` 등과 함께 `const questOrbit = hubOrbitCombatResultSession.questOrbit;`를 미리 받아 두고, 3466에서는 그 지역 변수를 쓰면 예전 동작과 같아집니다.** 확신: 경로 강 · 타이밍 중(orbit이 꺼지는 시점은 실기 확인 필요) |
| A2 | `expEarned`, `pendingDestroyAlert`, `enemyName`, `leaderCaptainId` | 3442-3446 | 무해 | 모두 await **전에** 지역 변수로 받아 둡니다. 3068 `agentsRef.current = []`는 ref를 새 배열로 바꿀 뿐이라, 클로저가 들고 있는 `agents` 배열은 그대로입니다 |
| A3 | `waveOutcomeAwardedRef`, `playerCapitalDestroyedRef`, `battleEngageStartMsRef`, `sessionCombatKeyRef`, `elapsedCarryRef` 리셋 | 3059-3079 | 무해 | 다음 전투의 init effect(2995-3057)도 같은 값으로 다시 세팅합니다. `playerDurabilityWearAppliedRef`는 리셋 대상이 아니지만 교전 시작(3306-3308 `activeBattle`)에서 false로 돌아가므로 2회차 전투의 내구도 마모도 정상입니다 |
| A4 | Binder가 유지되면서 남는 ref(`lastWaveGenKeyRef`, `combatTargetRingTickRef`, `fpsRef`, `craftsRef` 풀 등) | 2945-2994 | 무해 | 예전에는 새 Binder라서 `lastWaveGenKeyRef=0` → 첫 활성 때 `waveReseed=true` → 캐시 1회 클리어(3004)였습니다. 지금은 유지되어 reseed=false가 될 수 있습니다. 하지만 `sessionCombatKeyRef=null`이라 init은 그대로 진행되고(2999), 캐시 클리어는 orbit_end reclaim이 이미 했습니다. 나머지는 init에서 재설정되거나 동작에 무관합니다. craft 풀은 허브 체류 동안 상주하지만 JS 소량입니다 |
| A5 | 전투 종료 시 `clearCapitalRealtimeCombatPresentationCaches` 추가 실행 | 4166-4169 | 무해 | 같은 commit에서 언마운트되는 orbit 컴포넌트의 invalidate 등록 해제(1152-1161 cleanup)가 passive 순서상 먼저 끝납니다. 그 뒤라도 dispose 대상은 모듈 Paint/Recorder(멱등)와 dodge recorder뿐이고, orbit_end reclaim도 같은 일을 다시 합니다. React `<Picture>`가 쓰는 SkPicture에는 dispose를 호출하지 않습니다 |
| A6 | `useOrbitCapitalCombatUiStore.setActive(false)` | 4161-4164 | 무해 | 예전 언마운트 cleanup과 같은 값입니다(`setActive(false)`가 `endHoldActive`도 false로 만드는 것도 동일). A1의 3449-3451 홀드 플래그 토글 순서도 예전과 같습니다 |

### 6-2. 마운트 1회 초기화 state·ref가 「전투 후 리셋」을 전제로 하는지 (질문 1)
리마운트가 없어져 **전투를 사이에 두고도 유지되는** 컴포넌트만 봤습니다. 아래는 조건부 렌더라 전투 경계에서 어차피 마운트/언마운트되므로 변화가 없습니다.
- `NearbyShipInfoPanel`(`planet.tsx:2339`), `PlanetMainScanActionRow`(2307), `CombatEndHoldVeil`(2185-2198), HeavySlot 4개(`useEffect([active])`가 `setUi(null)`)
- `PlanetHubInboundDroneLayer` · `PlanetPlayerBlueOrbitMark`(`planetHubSubcomponents.tsx:809, 818`)

| # | 컴포넌트 · state | 파일:줄 | 판정 | 근거 · 보완안 |
|---|------------------|--------|------|-------------|
| B1 | **`PlanetStageBackground`: `hubDodgeSkiaOverlayMounted` · `hubSkiaDodgeNebulaReady`(sticky dodge 오버레이)** | `planetHubSubcomponents.tsx:374-376, 415-423, 438-454, 557-558, 642-655` | **주의(메모리 · 경미한 깜빡임)** | 예전에는 전투 종료 리마운트가 두 값을 false로 되돌려서, 전투 전에 드론 웨이브로 켜졌던 Skia dodge 오버레이(Canvas 1장 + 성운 1024² 등 useImage 3장)가 **다음 드론 피격 전까지 마운트되지 않았습니다.** 지금은 값이 유지되므로 **전투가 끝나자마자 오버레이가 다시 마운트**됩니다. 전투 중에는 dual-stack 분기가 아니라서 언마운트됩니다(601-626). 결과적으로 「전투 전 상태로 복귀」라 설계 취지(415-418: 「허브 체류 동안 유지」)와는 맞지만, **전투 후 Native/GL 실측 기준선이 이 오버레이만큼 높게 보일 수 있습니다.** 또 `hubSkiaDodgeNebulaReady`가 이전 인스턴스 기준 true로 남습니다. 오버레이 언마운트 때 `onNebulaImagesLost`가 호출되지 않기 때문입니다(`SkiaPlanetNebulaShaderBackdrop.tsx:229-237`은 마운트 중 상태 변화에서만 호출). 그래서 새 인스턴스의 이미지가 로드되기 전에 다음 드론 latch가 켜지면 RN 성운은 opacity 0이 되고 Skia는 `deferCanvas` 상태라 **잠깐 빈 배경**이 될 수 있습니다(가능성 낮음). **보완: `showEdenRaidTest`가 false→true로 바뀔 때 `setHubSkiaDodgeNebulaReady(false)`를 실행합니다. 예전과 완전히 같게 하려면 `setHubDodgeSkiaOverlayMounted(false)`도 함께 실행합니다.** 둘 다 기존 444/454 effect와 같은 패턴입니다 |
| B2 | `PlanetStageBackground`: `dodgeOrbitOffset`, `hubRnBackdropRemountGen`, `dodgeStageMountedRef`, `hubDodgeTimeMsRef` | 366-409, 456-461, 538-551 | 무해 | offset은 `showEdenRaidTest`를 deps로 다시 계산됩니다(550). remount gen은 deep reclaim 구독(마운트 1회)인데 유지되는 쪽이 오히려 정상입니다 |
| B3 | `PlanetHubOrbitSkiaLayer`: `arcPackSigRef`, `packEpochRef` | `PlanetHubOrbitSkiaLayer.tsx:146-184` | 무해(연속성 개선) | 전투 중에도 마운트되어 계속 갱신되므로(`combatGray`만 바뀜) 종료 시점 상태는 정상입니다. 예전 리마운트는 epoch를 새로 만들어 pack을 강제했고, 위상 점프가 생길 수 있었습니다 |
| B4 | `PlanetMainPilotInfoPanel`: `expanded` | `PlanetMainPilotInfoPanel.tsx:89-101` | 무해(UX 차이) | 전투 전에 펼쳐 두었다면 전투 후에도 펼쳐진 채 유지됩니다(예전에는 접힘으로 초기화). 게임 결과에는 영향이 없습니다 |
| B5 | `StageLoadingOverlay`: `showOverlay` | `StageLoadingOverlay.tsx:24-48` | 무해 | `visible`(`stageSession.isTransiting`)을 deps로 동기화됩니다 |
| B6 | `StageShell`, `QuestHUD`, `PlanetHubFeatureMenuRow`, `PlanetMainPlanetInfoTapOverlay`, `MilitaryCommandOrbitSet` | 해당 파일들 | 무해 | 로컬 hook이 없거나 props·store 기반입니다(스캔 결과 useState/useRef/useEffect 없음) |
| B7 | `ScrollView` 스크롤 위치(`planet.tsx:2259`) | — | 무해 | 예전에는 전투 후 맨 위로 초기화, 지금은 위치 유지입니다 |
| B8 | `PlanetCapitalCombatPreloader` | `planetCapitalCombatIntegration.tsx` 110-116 | 무해 | `useEffect([active])`라 동작이 같습니다 |

### 6-3. `PlanetEdenRaidSimContext`가 null로 바뀔 때 (질문 2)
- 예전에는 Provider가 없어서 `createContext(null)`의 기본값 null을 받았습니다. 지금은 `value = active ? sim : null`(4158)로 **명시적 null**을 받습니다. 소비자 입장에서는 같은 값입니다.
- 소비자 전수(6곳): `planetHubSubcomponents.tsx:494`, `CombatStanceRow.tsx:43`, `planetCapitalCombatHeavyUi.tsx:59/95`, `PlanetEdenRaidTestLayer.tsx:4185/4279`
  - HeavySlot이나 orbit 하위에 있는 소비자는 inactive일 때 언마운트됩니다.
  - 유지되는 소비자는 `planetHubSubcomponents.tsx:494` 하나뿐이고, 모든 사용처가 `showEdenRaidTest && combatSimFromCtx` 또는 `?.`로 null을 막고 있습니다(520, 611-620).
- 판정: **무해**(근거 강).
- 재렌더: inactive 동안 Binder는 `waveGenKey` 구독(2993) 때문에 재렌더될 수 있습니다. 하지만 children 요소가 같고 value가 null로 고정이라 소비자 갱신은 없습니다.

### 6-4. 전투 결과·보상·퀘스트 UI가 언마운트 cleanup에 의존하는지 (질문 3)
- `usePlanetEdenRaidSim` 안에는 **언마운트 전용 cleanup이 없습니다**(`[]` deps 3건은 모두 `useCallback`: 3168, 4097, 4116). 루프 effect cleanup(4078-4081)은 deps에 `active`가 있어서 예전과 똑같이 실행됩니다.
- 결과·보상·퀘스트 처리는 sim 루프 안에서 동기로 끝나거나(3370-3420: 경험치, 내구도, 매치 요약, 퀘스트 목표, 쿨다운, 섀도우 공개) microtask와 store로 넘어갑니다. **언마운트 cleanup에 의존하는 항목은 없습니다.**
- 유일한 예외는 **6-1 A1**입니다(언마운트 cleanup이 아니라 「새로 실행되는 inactive effect」가 module 세션을 지우는 문제).
- 튜토리얼 무승부·패배(`presentTutorialOpeningRaidDrawOutcome`, `tutorialOpeningRaid.ts:88-140`)는 자기 모듈 상태만 쓰므로 무해합니다.

### 6-5. 참고
- 첫 전투 진입 때 1회 리마운트는 남습니다(Binder lazy 로드 직후 Fragment→Binder). 그래서 B1 같은 차이는 **2회차 이후 전투에서만** 나타납니다. 실측할 때 1회차와 2회차 이후를 나눠 봐야 합니다.
- 제안하는 보완(A1 지역 변수 캡처, B1 effect 1개)은 둘 다 기존 패턴과 같고 메모리·Skia 수명에 영향이 없습니다(dispose 없음, 루프 할당 없음).
