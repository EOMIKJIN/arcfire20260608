# E6 회수 패스 인벤토리 + 단일 스케줄러 설계 초안 (김클로드 · 2026-10-09 · 읽기 전용)

> 대상: 허브 인바운드 드론 웨이브 1회당 연달아 도는 회수 패스. 근거 로그: `tools/play-bot-console/logs/soak/rdt-off-20261009-1911/logcat-full-1.txt`(pid 29913, 30분, 웨이브 31회). 구현은 김플레이와 협의한 뒤 진행한다.

## 1. 결론

- 웨이브 1회가 끝날 때 Fresco 비트맵 trim이 약 5~6회, 성운 프로필 prune과 메모 compact가 약 5회씩, 전투 Skia 회수가 약 5회 돈다. **같은 일을 3.6초 안에 여러 번 반복한다.**
- 그중 두 경로는 지금 아무 일도 하지 않는다: `signalHubSkiaNativeReclaim`(구독자 0 · epoch 읽는 곳 0)과 `followup_90s`(30분 동안 0회 실행 — 웨이브 간격 약 65초가 90초 타이머를 매번 취소).
- 제안: 웨이브 종료 트리거를 **1개(at-planet→0)**로 줄이고, 이후 단계는 **한 번의 지연 패스**로 묶는다. 결과(무엇이 해제되는가)는 같고 횟수만 줄인다.

## 2. 웨이브 1회의 실제 흐름

| 시점 | 트리거 (파일:줄) | 실행 내용 |
|---|---|---|
| T0 | flying→0: planet.tsx effect(`prevCount>0 && cur===0`) → `schedulePlanetHubPostSkiaPeakReclaim(pid,'hub_inbound_drone_end')` | 2×rAF + 32ms + InteractionManager 뒤 **PostSkiaPeak 패스 #1** |
| T0+약0.5s | at-planet→0(trail 잔존 종료): planet.tsx effect(`prevLen>0 && curLen===0`) → `schedulePlanetHubPostSkiaPeakReclaim(pid,'hub_inbound_vfx_cleared')` | **PostSkiaPeak 패스 #2** + `scheduleNativeHeapPurgeAfterStageExit`(즉시 + 지연 purge 2회) |
| 각 패스 +1.5s | `scheduleDeferredNativeReclaimPass`(deferredNativeReclaimScheduler.ts:15) | registry listener 2개(nativeReclaimBootstrap.ts:28 · :44): 성운 prune + memo compact, **Fresco trim** |
| T0+0.5+3.1s | settle 타이머(runPlanetHubPostSkiaPeakReclaimPass.ts:103-121, `HUB_INBOUND_SETTLE_RECLAIM_MS`) | `runPlanetHubSoftNativeReclaimPass(bypassCoalesce)` → signal + 전투 회수 + `runSoftNativeReclaimPass`(성운 LRU prune · compact · 전투 회수) + deferred(다시 Fresco trim) → 이어서 전투 회수 + **Fresco trim** 한 번 더 |
| +90s | followup 타이머(:99-102) | **0회 실행** — 다음 웨이브의 effect cleanup이 취소(30분 로그 `followup_90s`=0) |

PostSkiaPeak 패스 본문(runPlanetHubPostSkiaPeakReclaimPass.ts:27-70): 전투 Skia 회수 → `signalHubSkiaNativeReclaim` → 성운 prune(keep) → memo compact → deferred 예약 → **Fresco trim 즉시** → (vfx_cleared면) heap purge.

## 3. 단계별 중복 집계 (웨이브 1회)

| 단계 | 실행 위치 | 횟수/웨이브 | 비고 |
|---|---|---|---|
| Fresco bitmap trim (native) | 패스 #1 즉시 · 패스 #2 즉시 · deferred ×2~3 · settle 끝 | **약 5~6** | 30분 로그 deferred 66회 · purge 62회 |
| 성운 프로필 prune | 패스 #1 · #2 · deferred ×2~3 · soft | 약 5~6 | keep 1행성이라 두 번째부터는 사실상 no-op |
| planet memo compact | 패스 #1 · #2 · deferred ×2~3 · soft | 약 5~6 | 위와 같음 |
| 전투 Skia 프레젠테이션 회수 | 패스 #1 · #2 · settle soft 안 ×2 · settle 끝 | 약 5 | 허브 웨이브에서는 전투 orbit 비활성 |
| native heap purge | 패스 #2(즉시 + 지연) | 2 | |
| `signalHubSkiaNativeReclaim` | 패스 #1 · #2 · soft | 3 | **구독자 0**(상시 마운트 변경으로 planetHubSubcomponents 구독 삭제), `getHubSkiaNativeReclaimEpoch` 사용처 0 → 로그와 epoch++만 |
| followup_90s | 패스 #1 · #2가 예약 | 0(실행) | 웨이브 간격 < 90초라 항상 취소 |

이와 별개인 주기 패스(planet.tsx): 5분 soft(`HUB_SOFT_NATIVE_RECLAIM_INTERVAL_MS`, flying 중이면 pending 표시 → settle에서 소비), 15분 deep(Fresco trim · RN 백드롭 remount). coalesce `tryBeginHubNativeReclaim`(hubNativeReclaimCoalesce.ts:6)은 soft/deep끼리만 막고 settle은 `bypassCoalesce`로 건너뛴다.

## 4. 설계 초안 — `hubReclaimScheduler` (단일 진입점)

1. **트리거 축소 (결과 동일)**
   - 웨이브 종료는 **at-planet→0(vfx_cleared) 하나만** 쓴다. flying→0 패스(#1)는 원래 sticky dodge overlay를 내리려고 있었는데, 그 구독이 사라져 고유 효과가 없다(#2가 0.5초 뒤 같은 단계를 모두 수행).
   - 그 밖의 전환 트리거(전투 orbit 종료 · battleReady 직전 · 행성 변경 · STAGE blur/ingress)는 지금처럼 각자 호출하되 같은 스케줄러로 들어간다.
2. **한 번의 지연 패스로 병합**
   - `requestHubReclaim(reason, level)` — level = `light`(웨이브·전투 종료) | `soft`(5분 주기·PSS soft zone) | `deep`(15분·STAGE 이탈).
   - 요청이 오면 2×rAF + InteractionManager + **settle 지연(약 3.1초, 기존 값)** 뒤에 한 번 실행한다. 그 사이 들어온 요청은 가장 높은 level로 합친다(debounce).
   - 실행 단계(각 1회): 전투 Skia 회수 → 성운 prune(keep) → memo compact → Fresco trim → (light 이상, 웨이브·STAGE 종료면) heap purge → (deep) 백드롭 remount.
   - native 단계(Fresco trim · heap purge)는 단계별 최소 간격(예: 30초)을 둬 연속 웨이브에서도 웨이브당 1회를 넘지 않게 한다.
3. **주기는 하나로**
   - 5분 soft와 15분 deep은 스케줄러 내부 단일 타이머(5분 틱, 3번째마다 deep)로 둔다. flying 중이면 지금처럼 pending → 웨이브 종료 패스에 합친다.
4. **제거 후보**
   - `followup_90s`(실행 0회) · `signalHubSkiaNativeReclaim` 호출 3곳과 `hubSkiaNativeReclaimSignal.ts`(구독자 0, epoch 미사용). 단, 상시 마운트 결정이 되돌려질 가능성을 고려해 신호 모듈 삭제는 상시 마운트가 커밋된 뒤로 미룬다.

## 4-1. 회수 단계 ↔ 메모리 축 매핑 (대표님 지시 20:3x 「회수가 실제로 작동하는지」 판정용)

각 단계가 **실제 코드상** 무엇을 해제하는지와 그 결과가 meminfo의 어느 축에 나타나야 하는지를 정리했다.

| 단계 (정의) | 실제로 하는 일 | 영향 축 | 효과 예상 |
|---|---|---|---|
| Fresco trim — `trimBitmapMemoryCachesAsync`(ArcfireNativeMemoryModule.kt:17-27) | `Fresco.getImagePipeline().clearMemoryCaches()` — **화면에 쓰이지 않는** 캐시 비트맵만 해제 | Bitmap(Fresco) · Native · (HWUI 텍스처 → GL 일부) | 허브에서는 성운 RN Image가 표시 중이라 해제 대상이 거의 없음 → 웨이브마다 반복해도 효과 작음 |
| native heap purge — `NativeHeapPurge.nativePurge`(native-heap-purge.cpp:6-15) | `mallopt(M_PURGE_ALL / M_PURGE)` — scudo가 붙잡은 **이미 free된** 페이지를 OS에 반환 | Native Heap PSS | free 직후에만 의미가 있음(STAGE 이탈 · 지도 SVG recycle 뒤). vfx_cleared마다 하는 것은 대부분 반환할 페이지가 없음 |
| 성운 프로필 prune — `prunePlanetNebulaProfilesExceptPlanetIds/Lru`(planetNebulaStore.ts:262·281) | zustand의 행성별 성운 파라미터 항목 삭제 | Hermes(극소) | keep 1행성이면 대부분 no-op |
| memo compact — `compactPlanetMemoRegistryShells`(planetMemoCache.ts:134-140) | **비어 있는** 레지스트리 껍데기만 삭제(항목이 있는 캐시는 안 건드림) | Hermes(극소) | 거의 no-op |
| 전투 Skia 회수 — `runCombatSkiaPresentationReclaim`(combatSkiaPresentationReclaim.ts:35-44) | `invalidateAllSkPictureFrames`(허브 dodge·trail SkPicture 드롭 포함) + 전투 color/tint Map 비우기 | Native(Skia 객체) · Hermes ext | 웨이브 직후 남은 Picture가 있으면 효과 있음. 두 번째 호출부터는 no-op |
| `signalHubSkiaNativeReclaim` | 구독자 0 — epoch++와 로그만 | 없음 | **죽은 경로** |
| deferred listener 2개(nativeReclaimBootstrap.ts:28 · :44) | 위의 prune + compact + Fresco trim 재실행 | 위와 같음 | 중복 |
| 15분 deep — RN 백드롭 remount | 성운 RN Image 재마운트(재디코드) | Bitmap · GL(HWUI 텍스처) | 표시 중인 비트맵을 실제로 교체하는 유일한 경로 |

**회수 장치가 없는 축 (오늘 계단 후보와 대조)**
- **GL(RN Skia GrResourceCache)**: RN Skia 2.2.12는 `setResourceCacheLimit`·`purge*` 호출이 없고 JS에 노출된 API도 없다. 은하 왕복 뒤 허브 GL 30 → 50 1회 계단과 지도 진입 피크가 이 축이다. 위 단계 중 이 축을 줄이는 것은 없다(Canvas 언마운트로 표면만 줄어듦). → 회수 장치 추가 후보: patch-package로 OpenGLContext 생성 직후 캐시 한도 설정, 또는 STAGE 전환 때 `purgeUnlockedResources`를 부르는 JSI 진입점(재빌드 필요, 대표님 승인 대상).
- **1380 SurfaceTexture 잔류(약 15MB · gralloc)**: 해제 경로가 RN Skia native(`RNSkOpenGLCanvasProvider._jSurfaceTexture` 전역 참조, release 없는 Surface)에 있어 JS 회수 단계로는 닿지 않는다.
- **Hermes 확보량(Unknown = hades-segment)**: GC 직후 alloc은 평탄(RDT OFF)한데 확보량만 57 → 80. release JS에는 GC를 직접 부르는 수단이 없다(HermesInternal은 dev 계측용). 회수는 Hermes 내부 정책에 맡겨진다.
- **Native 상주 계단(04:18 +74 · 지도 진입 +26)**: purge는 free된 페이지만 반환하므로, **살아 있는 할당이 늘어난 계단**에는 효과가 없다. 원인 할당을 찾아야 하는 축이다(views 변화 · 지도 SVG 비트맵 · Skia 객체 후보).

**측정과 맞대어 판정하는 법**: 웨이브 5초 샘플(release-perf-20261009-2028/wave-5s.csv)에서 settle(+3.1s) 전후로 Bitmap·Native가 내려오면 Fresco·purge가 작동하는 것이다. 내려오지 않고 floor도 평탄하면 「돌지만 효과가 없는 패스」(1단계·2단계에서 1회로 줄여도 손실 없음)이다. floor가 웨이브마다 오르는 축이 있고 그 축이 위 「장치 없음」 목록에 있으면 회수 장치 추가 대상이다.

## 5. 예상 효과와 위험

- 웨이브당 Fresco trim 약 5~6 → 1, compact·prune 약 5 → 1, 전투 회수 약 5 → 1, heap purge 2 → 1(지연 1회 유지 여부는 측정으로 결정), 로그 줄 약 12 → 2.
- 위험: (1) Fresco trim을 줄였을 때 웨이브 뒤 native floor가 오르는지 → 30분 허브 측정에서 Native PSS·GL을 기존 세션(평탄)과 비교. (2) settle 지연을 하나로 묶으면 회수 시점이 최대 약 0.5초 늦어진다(체감 없음). (3) 회수 경로는 STAGE dispose 안전망과 겹친다 → STAGE 이탈 경로(route_blur·ingress)는 이번 범위에서 건드리지 않고 허브 웨이브와 주기만 대상으로 한다.
- 검증: 30분 허브 체류에서 `[MEM]` 줄 수, Native PSS·GL floor, GC 직후 alloc을 이번 세션(rdt-off-20261009-1911)과 비교한다.
