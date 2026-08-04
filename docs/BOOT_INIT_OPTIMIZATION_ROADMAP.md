# 초기화 단축 · 부트/로딩 로드맵 (보류 — 2026-06-23)

> **상태**: 🟡 **추후 손보기로 보류** — 기능 개발 우선. 본 문서는 결론·방향성 정본.
> **재개 트리거**: 대화·이슈에서 **`초기화 단축`**, **`부트 최적화`**, **`boot init`**, **`타이틀까지 로딩`** 등을 언급하면 **본 파일을 먼저 읽을 것**.
> **관련**: v4.0 Session-Based Memory · `.cursor/rules/arcfire-main-lead-agent.mdc` §경제 부트경로 격리 · `tools/boot-perf/README.md`
> **교차 (2026-08-03)**: **APK/AAB·R8·ABI·Play target** 는 본 로드맵이 아님 → [`BUILD_PACKAGING_ANDROID_PLAY_RESCAN_2026-08-03.md`](./BUILD_PACKAGING_ANDROID_PLAY_RESCAN_2026-08-03.md). 본 문서는 **기동 후 JS hydrate/부트 순서**만.

---

## 0. 한 줄 결론

| 질문 | 결론 |
|------|------|
| 앱 시작 시 전행성·전 아크코어를 한꺼번에 깨우는 게 과한가? | **예.** 첫 체감 구간(타이틀→메인 허브)에는 **현재 행성/성계**만 있어도 충분한 기능이 많음. |
| RN “초기화” 구간을 건드릴 수 있나? | **부분 가능.** 엔진 cold start는 한계가 있으나 **번들·import·storage hydrate**는 게임 코드로 단축 여지 큼. |
| 지금 당장 수정? | **아니오 (2026-06-23)** — 방향만 기록, 구현은 추후. |

---

## 1. 문제 인식 (2026-06-23 대화 요약)

1. **부트 집중**: `app/_layout.tsx` + `arcCoreHub.start()` + 경제 `syncTradePortCatalogFromBalance`(17무역소 × 행성별 `set_catalog`) 등이 **앱 시작~타이틀 활성** 전후에 몰려 있음.
2. **효용 vs 비용**: 플레이어가 처음 있는 곳만 쓸 때 **타 행성 무역 카탈로그·전행성 코어 merge·전 서브코어 onBoot**는 **즉시 효용이 낮음**.
3. **체감 병목**: **게임 시작 화면 버튼 활성 전** 가장 길게 느껴지는 구간은 **React Native 초기화(네이티브 + JS 번들 eval + `_layout` static import)** 쪽 (dev Metro 환경에서 특히 큼).
4. **6/16 회귀 교훈**: 경제·일일 패스를 **onBoot 동기·전행성 루프**에 넣으면 부트 OOM·타이틀 멈춤 — **부트 / 배치 / 행성 진입** 경계 분리 필요 (김팀장 부트경로 검수表).

---

## 2. 목표 아키텍처 — STAGE 순차 워밍 (제안 정본)

플레이어 여정에 맞춰 **필요할 때만** 올린다.

```text
Stage 0 — Splash / Auth / Title gate
  · 계정·플레이어·lastPlanetId·systemId
  · CSV minimal index (`buildCsvStaticIndexesMinimal`)
  · 타이틀 interactive: bootReady && postBootSettled(즉시) && hydrated && !cloudRestorePending
  · **금지**: 일일 배치 wait · 벽시계 catch-up settle · 에셋 prewarm · full CSV (2026-08-04 재명기)
  · ArcCore start는 백그라운드 가능 — **버튼 lock과 합류 대기는 금지**

Stage 0.5 — 차원항로 / 이어하기 로딩 (`runContinueSessionPrewarm`) ← 합류 정본 슬롯
  · wait catch-up gate + daily batch gate
  · full CSV index · critical asset prewarm · 행성 세션 워밍
  · 이 구간은 로딩 UI가 자연스러움 — 타이틀 버튼과 혼동 금지

Stage 1 — Planet Hub 진입 (현재 행성만)
  · (planetId, systemId) 코어 런타임 슬라이스
  · 궤도 트래픽·허브 Skia·해당 행성 시설 dev
  · 무역소/조선소: 해당 행성 카탈로그 lazy (`syncTradePortCatalogForPlanet`)

Stage 1.5 — 허브 idle / 서브화면
  · 조선소·무역·행성개발 overlay — 진입 시 hydrate (Heavy UI session 패턴 확장)

Stage 2 preflight — [출발] / worldmap 직전
  · 은하계 지도 에셋·unlocked 성계
  · 타 행성 무역 캐시·교역 시장 (`runTradeRouteMarketPass` 등)
  · 필요 시 ArcCore 서브코어 tier-2 워밍

Stage 2+ — 이동·타 행성
  · 방문/해금 성계 단위 추가 hydrate · planetMemoCache / session dispose 유지

Stage Daily (12:00 KST 배치만)
  · 전행성 패스 — v4.0 §10 · `runArcCoreDailyOpsBatch` · onBoot/틱 금지
```

**원칙**: “월드 전체를 안다” ≠ “부팅 1초에 전부 메모리에 올린다”.

---

## 3. 무역소 17곳 `set_catalog` (경제 부트)

| 현재 | 이유 | lazy 대안 |
|------|------|-----------|
| `syncTradePortCatalogFromBalance`가 **행성마다** `economy_trade_port_bulk` dispatch | ArcCore 단일 DB + 교역 cross-planet·`runTradeRouteMarketPass` | **현재 행성** + **무역소 UI 오픈 시** hydrate; 은하계/교역 preflight에서 unlocked 성계만 |
| 부팅 시 `AiTradePortLevelPolicySubCore.onBoot` + `AiEconomySubCore` **이중 force sync** | 역사적 편의 | **한 채널로 통합** + force 중복 제거 |

참고 코드: `src/arcCore/balance/tradePortCatalogPolicy.ts`, `AiEconomySubCore.ts`, `runPlayScenarioEconomyPass.ts`.

---

## 4. 타이틀 활성화 전 — 구간 분해 & 레버

### 4.1 구간

| # | 구간 | 타이틀 버튼 | 손대기 난이도 |
|---|------|-------------|----------------|
| ① | 네이티브 cold start (Hermes, Skia, Firebase, …) | JS 이전 | 높음 (네이티브/릴리스) |
| ② | JS 번들 + **`_layout` static import 전체 eval** | `layout_effect_start` 이전 | **중~高 (JS)** |
| ③ | `_layout` IIFE: AsyncStorage parallel, `bootstrapFromWorldAsync` 전행성, CSV minimal | `boot_ready` / `hydrated` | **中 (JS)** |
| ④ | 타이틀 `tryRestorePlayerFromCloud` | `cloudRestorePending` | 中 |

`arcCoreHub.start()`는 **`bootReady` 이후** → ③④와 병렬이나 **타이틀 gate 자체는 ③**이 지배.

### 4.2 이미 한 것

- CSV **minimal / full** 2-tier (`buildCsvStaticIndexes.ts`)
- `bootReady` 전 ArcCore·Firebase 정책·에셋 prewarm **일부 지연**
- `continueSessionPrewarm`: **현재 행성** 중심 (이어하기 직전)
- `[boot-perf]` 마커 (`src/game/bootPerformance.ts`, `tools/boot-perf/README.md`)

### 4.3 아직 안 한 것 (추후 우선 후보)

| 우선 | 항목 | 기대 효과 |
|------|------|-----------|
| P0 | `_layout.tsx` **import 다이어트** + heavy module **`import()` lazy** | ② 단축 |
| P0 | 타이틀 gate용 storage **최소 집합** (player·session·lastPlanet); 나머지 hydrate 지연 | ③ 단축 |
| P0 | `planetCoreRuntime` **현재 행성 슬라이스** lazy (blob read vs memory merge 분리 설계) | ③ 단축 |
| P1 | `expo-splash-screen`: **`bootReady`까지 스플래시 유지** (속도 동일, 체감 UX) | 체감 |
| P1 | ArcCore **`start()` tier** — Hub 진입 / 출발 preflight로 분리 | ③ 이후 CPU |
| P1 | 무역 **17× set_catalog** → 행성 lazy + 이중 onBoot 제거 | 부트·로그 |
| P2 | release 빌드 + Hermes bytecode **기준선 측정** (dev Metro ≠ prod) | ①② 실측 |
| P2 | generated CSV **on-demand** (362KB+ 단일 파일 top import 차단) | ② |

### 4.4 건드리기 어려운 것

- RN 엔진·링크된 native module **cold start** (Skia/Firebase/Reanimated 등)
- **dev Metro** 오버헤드 → 부트 “최적화” 판단은 **release APK**로 재측정 필수

---

## 5. lazy 전환 시 깨지기 쉬운 지점 (체크리스트)

- [ ] 무역소 **차익 tips** — 타 행성 카탈로그 없으면 지연/스킵 UI
- [ ] `planetCoreRuntime` AsyncStorage **단일 blob** — read 1회 vs memory **전행성 merge** 분리
- [ ] **오프라인 catch-up** — 현재 행성만 vs 전행성 정책 명시
- [ ] **일 1회 배치** — onBoot/틱 진입 금지 유지 (v4.0 §10·§14)
- [ ] Skia 허브 — **현재 행성만** early, dispose on `releasePlanetMainStageSession`
- [ ] 완료 게이트: `tsc` · `npm run audit:balance-ops`(경제 touch 시) · 부트 **release cold start** `[boot-perf]` · Kim **부트경로 검수 6항**

---

## 6. 측정 방법 (재개 시)

1. Cold start → dev console `[boot-perf] root_layout total=…ms`
2. Marks: `layout_effect_start` → `storage_load_*` → `boot_ready` → (타이틀) → `continue_prewarm_*` → `planet_first_render`
3. **release** `npx expo run:android --variant release` 동일 측정
4. `tools/daily-perf-audit/reports/latest.md` — 대형 generated TS 크기 추적

---

## 7. 관련 파일 인덱스

| 영역 | 경로 |
|------|------|
| 루트 부트 | `app/_layout.tsx`, `app/index.tsx` |
| boot gate | `src/store/appBootStore.ts` |
| perf 마커 | `src/game/bootPerformance.ts` |
| CSV tier | `src/game/buildCsvStaticIndexes.ts` |
| 이어하기 prewarm | `src/game/continueSessionPrewarm.ts` |
| ArcCore start | `src/arcCore/ArcCoreHub.ts`, `registerDefaultArcSubCores.ts` |
| 경제 카탈로그 sync | `src/arcCore/balance/tradePortCatalogPolicy.ts` |
| 전행성 코어 | `src/store/planetCoreRuntimeStore.ts` |
| Heavy UI (화면 lazy 선례) | `src/ui/heavyUiDataSession/` |

---

## 8. 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-23 | 초기 작성 — 대화 결론·STAGE lazy·RN 부트 구간·보류 결정 |
