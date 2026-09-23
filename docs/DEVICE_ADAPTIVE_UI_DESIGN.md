# 기기대응 UI — 기본 설계 v0.4

```text
status=DESIGN_ONLY
version=0.4
date=2026-09-23
owner=김팀장
code=미착수 (대표님 설계 승인 후)
선행=v0.3 + 현재 UI 표시 코딩 실측·개발계획
[pss-pre-dev] hot_path=리사이즈·회전 1회 재계산 (틱/루프 없음)
[pss-pre-dev] stage=레이아웃 모듈 신설 · persist 없음 · Skia 논리 좌표는 orbit 320 유지
[pss-pre-dev] verdict=PASS (설계) · 구현 시 상수 무단 변경 금지 · 하단 inset 중첩은 시각 0변화만
```

> **이번 문서 범위**: 설계만. `planetMainStageLayout`·`STAGE_TOP_INSET_PX` 등 **기존 확정값은 코드에서 바꾸지 않는다.**  
> **1순위**: 현재 기준 스마트폰과 **조금만 다른** 화면에서 버튼이 가려지거나 잘리지 않게.  
> **2순위 태블릿**: 기준 Play Frame을 **통째로 한 배율**로 확대(대표님 참고). 폰 밴드에는 이 배율 금지.

### v0.2 변경 (v0.1 대비)

| # | 반영 | 출처 | 판정 |
|---|---|---|---|
| 1 | §4에 Material 3 Window Size Class 대응 열 | 김클로드 | **AGREE** |
| 2 | 구글 공식 테스트 치수(841×701 / 1024×640 / 1280×800)를 **QA 기준선**으로 기록 | 김클로드 · [Adaptive app quality](https://developer.android.com/docs/quality-guidelines/adaptive-app-quality) 재확인 | **PARTIAL** — 선확정 아님. 공식 8형 min=640 ≠ 기존 코드 700 |
| 3 | 2·3순위 보류 = Play 대형화면 노출(Tier)과 별축 | 김클로드 · 동 문서 TIER 3/2/1 | **AGREE** (1순위 유지) |
| 4 | Fold를 「펼친 창」과 「접힌 커버 화면」으로 분리 | 김클로드 | **AGREE** · 구현은 3순위 유지 |
| 5 | 거터 공식 — 좌우 inset 비대칭 각주 | 김클로드 · RN 폴더블 가이드 | **AGREE** · 1순위 해당 없음 |
| 6 | 오포 등 동남아 = 표준 안드로이드 API, 별도 SDK 없음 | 김클로드 | **AGREE** |
| 7 | **대형 태블릿 = 게임화면 전체 확대** (§3-5) | **대표님 참고 2026-09-23** | 신규 기준. 기존 「태블릿 버튼 1.0 고정」을 이 절로 교체 |
| 8 | `app.json` `orientation: portrait` · iOS `supportsTablet: false` | 김팀장 재조사 | 가로·iPad는 3순위/비대상 |

김클로드가 제안한 「700을 공식 매트릭스로 선확정」은 **받지 않는다.** 이유는 §4-1.

### v0.3 변경 (v0.2 대비) — 안드로이드 공식 폰 가이드

| # | 반영 | 공식 출처 |
|---|---|---|
| 1 | 1순위 폰 = **Compact width (<600dp)** = 세로 폰의 99.96% | [Use window size classes](https://developer.android.com/develop/adaptive-apps/guides/use-window-size-classes) |
| 2 | 폰끼리 갈리는 축은 **높이 클래스**(480 / 900). 우리 740·780은 게임 크롬용 세분 | 동 문서 height class · 97.59% 폰이 Medium height(480–900) |
| 3 | 레이아웃은 **창 크기**만. `isTablet`·기종·실측 화면 금지 | [Support different display sizes](https://developer.android.com/develop/adaptive-apps/guides/support-different-display-sizes) |
| 4 | 「고정 px」= RN 논리 px ≒ **dp**. 밀도(xxhdpi 등)는 시스템이 처리. 폰에서 밀도 스케일 금지 | [Support different pixel densities](https://developer.android.com/training/multiscreen/screendensities) |
| 5 | 버튼 **히트 ≥ 48dp**, 간격 권장 8dp. 보이는 34는 기존값 유지 | [Make apps more accessible](https://developer.android.com/guide/topics/ui/accessibility/apps) · [MD3 target sizes](https://m3.material.io/foundations/designing/structure) |
| 6 | 컷아웃·상태바 높이 하드코딩 금지. inset만 | [Display cutouts](https://developer.android.com/develop/ui/views/layout/display-cutout) · [Edge-to-edge](https://developer.android.com/develop/ui/views/layout/edge-to-edge) |
| 7 | 창 메트릭은 **한 모듈**(`devicePlayFrame`) | Support different display sizes 「single location」 |
| 8 | Android 16(API 36)은 sw≥600에서 세로 잠금 무시 가능 → 태블릿 §3-5 이유 보강 | 동 Support different display sizes 상단 주의 |

### v0.4 변경 (v0.3 대비) — 현재 UI 코딩 실측 + 개발계획

| # | 반영 |
|---|---|
| 1 | §11 허브·전투·월드맵·시설·오버레이·대화·타이틀 **표시 코딩 실측** (상수·중첩·360/390 계산) |
| 2 | §12 **개발계획** — 스프린트 0~6, 파일, 값 디프 0, 게이트. 구현은 승인 후 |

---

## 0. 대표님 지시 → 설계 문장

| 지시 | 설계 문장 |
|---|---|
| UI 버튼이 가려지거나 잘리지 않음 | **폰(1순위): 크롬(버튼·도크·탑바)은 고정 px.** 부족한 공간은 **게임 시야(배경·궤도·성계전투)** 가 먼저 줄어든다. |
| 기본 게임화면 사이즈를 결정 | **기준 논리 해상도 + 콘텐츠 열 폭 + 궤도 씬** 을 명명·고정한다. |
| 버튼 크기·위치 최대한 유지 | **폰끼리 스케일하지 않는다.** 좌우·하단만 유동. |
| 좌우 여백 유동 | 기기 폭 − 콘텐츠 열 = **좌우 거터**(성운·배경으로 채움. 검정 레터박스 금지). |
| 가장 아래단 게임화면(배경·성계전투) 유동 | 세로는 **남은 시야 밴드**에 궤도/전투를 센터 맞춤. |
| 태블릿·특수 기기 | 2순위. **큰 태블릿은 기준 게임화면 전체를 한 배율로 확대**한다(대표님 참고). 시야만 키우고 버튼만 남기는 방식은 쓰지 않는다. |

---

## 1. 히스토리 조사 — 기존 기반은 있는가

**전용 「기기대응 시스템」은 없다.** 화면마다 조각이 있다. 부실하므로 **새 프레임을 위에 얹고**, 조각은 흡수한다.

### 1-1. 있는 것 (재사용)

| 조각 | 위치 | 하는 일 | 한계 |
|---|---|---|---|
| 허브 세로 메트릭 | `src/stages/planetMainStageLayout.ts` `getPlanetMainStageVerticalMetrics` | 예약 높이·배경 paddingTop/Bottom. fontScale·폭≥900 `tabletBoost` | **폰 밴드 없음.** 짧은 폰에서 버튼 클립을 막지 않음. 2순위 전체 확대와 **중복 스케일 금지** |
| 태블릿 행성 스케일 | 같은 파일 `getPlanetMainStageBackgroundScale` | minSide≥700이면 행성 열 1.0~1.22 | 버튼은 안 건드림. **2순위에서는 §3-5 전체 배율로 흡수** |
| 콘텐츠 열 폭 | `planetHubStyles` · `planetCapitalCombatHeavyUi` `maxWidth: 430` | 넓은 폰에서 열을 430에 캡 | **상수 이름·기준 없음.** 거터 공식 없음 |
| 궤도 씬 | `PLANET_MAIN_ORBIT_SCENE_SIZE = 320` | 허브·전투·채굴·드론 **동일 좌표계** | 기기와 무관. **논리 좌표 유지(전투 수학)** |
| 셸 상·하 고정 공백 | `src/stages/layout.ts` `STAGE_TOP_INSET_PX=72` · `STAGE_BOTTOM_MIN_INSET_PX=54` | SafeArea 위/아래 장식 여유 | **모든 스테이지 동일.** 짧은 폰에서 시야를 크게 먹음 |
| SafeArea | `StageShell` SafeAreaView + insets.bottom 보충 | 노치·홈 인디케이터 | 화면마다 insets를 **또** 더하는 곳과 안 더하는 곳이 섞임 |
| 오버레이 세로 % | `overlayPanelLayout.ts` 85~96% | 팝업이 화면을 넘지 않게 | 허브 도크·전투와 **프레임을 공유하지 않음** |
| 온보딩 | `onboardingScreenLayout.ts` | 허브 72px 상단을 **쓰지 않음**을 명시 | 허브와 정책이 이미 갈라짐 |
| 헤드리스 스텁 | `tools/headless/react-native-stub.ts` | `390 × 844` | **사실상의 기준폰.** 문서화되지 않음 |
| 방향 잠금 | `app.json` `orientation: "portrait"` | 세로 고정 | 가로·폴드 펼침 가로는 **창이 바뀌어도 앱은 세로** — 3순위 |
| iOS 태블릿 | `app.json` `ios.supportsTablet: false` | iPad 비대상 | 2순위 태블릿 = **안드로이드** |

### 1-2. 없는 것

- 기준 스마트폰 이름·논리 해상도 정본
- 폰 소형/기준/장형 밴드
- 「크롬 고정 / 시야 유동」 한 함수 (`devicePlayFrame`)
- 태블릿 전체 확대 배율 한곳
- 월드맵·타이틀·시설·전투를 같은 play-frame으로 묶는 모듈
- 잘림 검사(크롬 합 + inset > 화면 → FAIL) 게이트

**판정**: 오래전 작업은 **허브 세로 추정 + 태블릿 행성 스케일 + maxWidth 430** 까지다. 전 기기 UI 대응으로 쓰기엔 **부실**. 폐기하지 않고 **Play Frame 아래로 흡수**한다.

---

## 2. 기준 화면 (기본 게임화면 사이즈)

개발·헤드리스·현재 허브 열이 이미 가리키는 값을 **기준**으로 명명한다. **기존값 변경이 아님** — 이름만 붙인다.

| 이름 | 값 | 근거 | 코드 시 역할 |
|---|---|---|---|
| **기준 논리 폭** `REF_W` | **390** | 헤드리스 스텁 · iPhone 14 급 · 국내 안드로이드 다수(360~412)의 중앙 | 버튼 위치의 X 기준 · 태블릿 확대의 분모 |
| **기준 논리 높이** `REF_H` | **844** | 동일 스텁 · 긴 플래그십 | 시야 밴드 기준 · 태블릿 확대의 분모 |
| **콘텐츠 열 최대** `CONTENT_MAX_W` | **430** | 이미 `maxWidth: 430` | 폰에서 이보다 넓으면 좌우 거터 |
| **궤도·전투 씬** `ORBIT` | **320** | `PLANET_MAIN_ORBIT_SCENE_SIZE` | **논리 좌표는 절대 바꾸지 않음** |
| **행성 도트** | **120** | `PlanetDot` size | 씬 320 안의 고정(논리) |

단위: RN `useWindowDimensions` 논리 px. 안드로이드 **dp와 실무상 동일 축**. 두 단위 체계를 코드에 섞지 않는다. 문서의 「고정 px」는 **고정 dp(논리)** 이다. 물리 픽셀·`PixelRatio`로 크롬을 키우지 않는다.

### 2-1. 안드로이드 공식 폰 대응 — 이 설계와의 대응

공식 정본은 태블릿/폴드 글이 아니라 **창 크기 클래스 + 밀도 + 인셋**이다. 1순위(폰)는 아래만 쓰면 된다.

**폭 (공식, 거의 모든 세로 폰)**

| 공식 클래스 | 문턱 | 공식 커버 | Arcfire |
|---|---|---|---|
| **Compact width** | 폭 < **600dp** | **세로 폰의 99.96%** | Phone-R / R+ / R− / S 전부. `playScale = 1` |
| Medium width | 600–839 | 세로 태블릿 | Tablet 후보 (2순위) |
| Expanded+ | ≥840 | 가로 태블릿·펼친 폴드 | 3순위 / §3-5 |

공식은 폰 폭을 360·390·430으로 쪼개지 **않는다**. Compact 안에서는 **같은 레이아웃**이 정석이다. 우리 360~430 세분은 Compact 안에서 **거터만** 조절하는 게임 세분이다. 버튼을 폭에 비례 스케일하는 것은 공식·대표님 지시 둘 다 위반.

**높이 (공식, 세로 폰이 실제로 갈리는 축)**

| 공식 클래스 | 문턱 | 공식 커버 | Arcfire |
|---|---|---|---|
| Compact height | 높이 < **480** | 가로 폰 99.78% | 앱 `portrait` 잠금 → 1순위 해당 없음. 분할창으로 창이 낮아지면 Phone-S 경로 |
| **Medium height** | **480–899** | **세로 폰의 97.59%** | Phone-R · R− · S (740 세분은 우리 크롬+궤도 320용) |
| Expanded height | ≥ **900** | 세로 태블릿 94.25% + 남은 장형 폰 | Phone-R+ (시야 여백만) 또는 Tablet |

공식 높이 문턱은 **480 / 900 두 개**뿐이다. 우리 740·780은 허브 도크+궤도 320이 들어가는지를 가르는 **게임 세분**이다. 안드로이드 공식 값으로 바꾸지 않는다.

**밀도 (폰마다 dpi가 달라도 버튼 물리 크기는 같게)**

공식: 레이아웃은 **dp**, 텍스트는 **sp**, 제스처 임계는 dp→px 변환. mdpi=160이 기준. RN 논리 px가 이미 dp이므로 **폰에서 밀도별 추가 스케일 금지**. Skia 궤도 320도 논리 dp. 비트맵을 밀도 버킷으로 쪼개는 작업은 이번 기기대응 범위 밖(아이콘 파이프라인).

**터치 타깃 (폰 버튼이 잘리면 안 되는 공식 하한)**

- 히트 영역 **≥ 48×48dp** (약 9mm). 보이는 아이콘은 더 작아도 됨(패딩으로 히트 확보).
- 타깃 사이 간격 **권장 8dp**.
- 현재 탑바 아이콘 **보이는 크기 34**는 **기존값**. 구현 시 시각은 유지하고 `hitSlop`/최소 히트만 48. 34를 48로 키우려면 기존값 재확인.
- 폭 360 5열: 열당 72. 간격 축소해도 **히트 ≥ 48**. 48 아래로 줄이지 않음.

**인셋·컷아웃**

상태바·노치·펀치홀 높이를 숫자로 넣지 않는다. `StageShell` inset만. `STAGE_TOP_INSET` 72는 **장식 여유**이지 컷아웃 대체값이 아니다.

**창 메트릭 한곳**

공식: 화면 크기 분기를 여러 화면에 흩리지 말고 **한곳에서 상태로 내려 보낸다.** → `devicePlayFrame`이 그 한곳. 화면마다 `useWindowDimensions`로 거터를 다시 짜는 것은 공식 위반에 가깝다.

**Android 16 (API 36) 주의**

smallest width **≥ 600dp** 이면 시스템이 세로 고정·종횡비 제한을 **무시할 수 있다.** Compact 폰(폭<600)의 portrait 잠금은 유지. 태블릿에서 창이 커지면 §3-5 전체 확대가 대응이다. `isTablet` 분기로 막지 않는다.

```text
기준 스마트폰 (Phone-R)
  논리 390 × 844
  ┌──────── 390 ────────┐
  │ 거터≈0 (390 < 430)  │
  │  [탑바 34 고정]      │
  │  [퀘스트 HUD 고정]   │
  │                     │
  │   궤도 씬 320×320    │  ← 시야 밴드 안에 센터
  │   (배경·성계전투)    │
  │                     │
  │  [스캔5+시설5+파일럿]│
  └─────────────────────┘
```

**게임화면 사이즈의 뜻**

- **크롬**: 기준폰에서 지금 보이는 버튼 크기·상대 위치(상수 그대로).
- **게임 시야**: 크롬·SafeArea를 뺀 **남은 사각형**. 그 안에 320 궤도/전투를 **논리 스케일 없이** 두고, 남는 위·아래·좌우는 배경(성운·베일)이 채운다.
- **태블릿 확대**: 위 기준 구성 **전체**를 `playScale`로 그린다(§3-5). 논리 390×844 자체는 그대로다.

전투 레이어의 `1.1` 배(`PLANET_MAIN_COMBAT_LAYER_*_SCALE`)는 **연출 확대**이지 기기 스케일이 아니다. 유지. 기기 대응으로 또 곱하지 않는다. 태블릿 `playScale`은 그 **바깥**에서 프레임 전체에 한 번만 곱한다.

---

## 3. 핵심 모델 — Play Frame (고정 크롬 + 유동 시야 · 태블릿만 전체 확대)

```text
┌──────────── device window ─────────────┐
│  inset.top (노치·상태바)                 │  시스템
│ ┌──────── play frame ───────────────┐  │
│ │  TOP CHROME   고정 px (논리)       │  │  탑바·퀘스트
│ │ ┌──── GAME VIEWPORT (fluid) ────┐ │  │
│ │ │  좌거터 │ 시야(배경+궤도/전투) │우│ │  폭·높이에 맞춤
│ │ │         │  320 씬은 센터      │  │ │
│ │ └───────────────────────────────┘ │  │
│ │  BOTTOM CHROME 고정 px (논리)     │  │  스캔·시설·파일럿
│ └───────────────────────────────────┘  │
│  inset.bottom (홈 인디케이터) + 보충    │  시스템 · STAGE_BOTTOM_MIN 54
└────────────────────────────────────────┘
  폰: playScale = 1
  큰 태블릿: 위 프레임 전체에 playScale (성운 거터는 프레임 밖)
```

### 3-1. 절대 규칙

1. **폰 밴드(Phone-R / R+ / R− / S)에서 버튼·도크·탑바를 scale 하지 않는다.**
2. **폰에서 잘림이 나면 시야(게임 배경·궤도·전투 캔버스 주변 여백)를 줄인다.** 버튼을 줄이거나 겹치지 않는다.
3. **궤도 320 논리 좌표계는 불변.** 전투·채굴·드론 수학은 이 공간에서만. 태블릿 확대는 **렌더·터치에 같은 `playScale`을 한 번** 적용할 뿐, `orbitSize` 상수를 바꾸지 않는다.
4. **SafeArea는 한 곳(`StageShell`)만.** 화면이 insets를 다시 더하면 이중 패딩 → 짧은 폰에서 버튼이 밀린다.
5. **레이아웃 상수(`planetMainStageLayout` 수학)는 기존값 재확인 없이 변경 금지.**
6. **거터·프레임 밖은 성운/배경으로 채운다.** 검정 레터박스·호환 모드 축소창은 쓰지 않는다(Play Adaptive Ready = 전체 창 실행).
7. **레이아웃 단위는 dp(RN 논리 px).** 밀도·`PixelRatio`로 폰 크롬을 키우지 않는다.
8. **인터랙트 히트 ≥ 48dp.** 보이는 크기를 기존값 재확인 없이 키우지 않는다.
9. **창 크기만 본다.** `isTablet`·기종·브랜드·물리 화면 대각선으로 분기 금지.

### 3-2. 가로 — 1순위 본론 (폰)

```text
availW   = windowW - insetL - insetR
contentW = min(availW, CONTENT_MAX_W)              // 상한 430
remain   = availW - contentW
gutterL  = insetL + remain / 2
gutterR  = insetR + remain / 2
```

v0.1의 `(windowW - contentW) / 2` 균등 분배는 **inset이 좌우 같을 때**와 같다. 위 식은 같은 결과이되, Fold(3순위)에서 좌우 inset이 달라도 콘텐츠 열이 **세이프 영역 중앙**에 온다.

| 기기 폭 (논리) | 거터 | 버튼 |
|---|---|---|
| 360 (갤럭시 콤팩트) | 0 · 열=360 | **같은 dp.** 5열은 간격만 축소. **히트 ≥ 48dp** (공식). 타일 시각 크기를 48 미만으로 줄이지 않음. |
| **390 기준** | 0 · 열=390 | 현재와 동일 |
| 412~430 | 0~작음 · 열=폭 | 위치는 열 중앙. 크기 동일 |
| 430+ (맥스·일부 넓은 폰) | (availW−430)/2 | 열 430 고정. 버튼 그대로. **아직 태블릿 확대 아님** |

**1순위 폰(기준 ±40폭, ±80높이)** 에서는 이 거터만으로 충분하다. 전체 UI scale 금지.

### 3-3. 세로 — 1순위 본론 (폰)

```text
chromeTop    = 탑바 + (퀘스트 HUD 있으면 추정)     // 기존 식, 고정
chromeBottom = 스캔행 + 시설행 + 파일럿             // 기존 도크, 고정
safeTop      = inset.top
safeBottom   = max(inset.bottom, STAGE_BOTTOM_MIN_INSET_PX)

gameViewportH = windowH - safeTop - safeBottom - chromeTop - chromeBottom
               - (장식용 STAGE_TOP_INSET 는 시야에서만 삭감, 크롬에서 삭감 금지)
```

- 긴 폰(기준보다 높음): `gameViewportH`가 커짐 → 행성/전투 **위아래 여백**이 늘어남. 버튼은 하단에 그대로.
- 짧은 폰(기준보다 낮음): `gameViewportH`가 줄어듦. **장식 72(`STAGE_TOP_INSET`)를 시야 여유분으로만 취급**하고, 뷰포트가 `ORBIT(320)`보다 작아지기 **전에** 장식부터 줄이는 것이 2순위(소형폰) 규칙. 1순위(거의 같은 폰)에서는 72를 건드리지 않는다.

하단 「가장 아래단 게임화면」 = **도크 위쪽 시야**. 성운·행성·성계전투가 이 밴드를 채운다. 도크는 그 아래 **고정**.

### 3-4. 성계전투와의 정합

허브 전투는 지금 `ORBIT` 320 + `planetStageScale`(폰에서는 1) + 레이어 1.1 연출이다.

| 해야 할 일 | 하지 말 것 |
|---|---|
| 전투 오버레이를 **같은 play frame** 안에 둔다 (거터·하단 도크와 열 정렬) | 기기마다 논리 `orbitSize`를 바꿈 |
| 시야가 커지면 전투 주변(베일·성운)만 커짐 (폰) | 폰에서 버튼·HUD를 전투와 함께 scale |
| 짧은 폰: 베일/여백 감소 | 전투 캔버스를 줄여 명중 판정 변경 |
| 태블릿: 프레임+전투를 **같은 playScale** | 행성 1.22와 playScale를 **겹쳐 곱함** |

### 3-5. 대형 태블릿 — 게임화면 전체 확대 (2순위 · 대표님 참고)

대표님(2026-09-23): *화면이 큰 태블릿일 경우 게임화면 전체를 확대하는 기준 적용 등으로 대응하면 된다.*

폰처럼 「버튼은 그대로, 여백만」이면 10형에서 크롬이 작아 보인다. **기준 390×844 구성을 한 배율로 키운다.**

```text
availW = windowW - insetL - insetR
availH = windowH - insetT - max(insetB, STAGE_BOTTOM_MIN_INSET_PX)

playScale = 1                              // 모든 폰 밴드
if band == Tablet:
  playScale = min(availW / REF_W, availH / REF_H)
  // 예: 세로 800×1280 → min(2.05, 1.52) = 1.52
  // 예: 공식 10.5형 세로 800×1280 동형

논리 Play Frame (크롬+시야+320 씬) 를 playScale 로 그린다.
남는 바깥 = 성운/배경 거터. 검정 레터박스 금지.
터치 hit 는 논리 좌표 → 동일 playScale 역변환.
```

| 허용 | 금지 |
|---|---|
| Tablet 밴드에서만 `playScale > 1` | Phone-R / R+ / R− / S 에 동일 공식 적용 |
| 렌더·터치를 **한** 배율 | 화면마다 `scale = width/390` (폰 포함 전역 스케일) |
| 기존 행성 1.0~1.22 · `tabletBoost`를 **이 배율로 흡수** | 1.22 × playScale 이중 확대 |
| 논리 ORBIT 320 유지 | `PLANET_MAIN_ORBIT_SCENE_SIZE` 를 기기마다 변경 |

배율 상한(예: 1.6)은 **2순위 구현 전** 대표님 확인. 지금은 식만 고정하고 cap은 두지 않는다.

---

## 4. 기기 밴드 (분류만, 값 확정은 구현 전 재확인)

1순위는 **Phone-R과 이웃**만 구현 대상으로 연다.

| 밴드 | 판정 (초안) | 공식 폭 / 높이 클래스 | 정책 |
|---|---|---|---|
| **Phone-R (기준)** | 폭 360~430 · 높이 780~900 | Compact 폭 / Medium 높이 | `playScale=1`. 거터 + 시야 여백만. 크롬·72·54 **현행 유지** |
| **Phone-R+** | 같은 폭 · 높이 > 900 | Compact 폭 / **Expanded 높이** | 시야 여백 증가. 버튼은 하단 크롬 고정. 공식도 세로 폰 장형을 여기서 가름 |
| **Phone-R−** | 같은 폭 · 높이 740~780 | Compact 폭 / Medium 높이 | 시야만 소폭 축소. 버튼 유지 |
| **Phone-S** (2순위) | 높이 < 740 (SE 667 등) | Compact 폭 / Medium 높이 (공식 480 위) | 장식 72 시야 기여를 줄임. **버튼·히트 유지.** 공식 Compact height(<480)가 아님 |
| **Tablet** (2순위) | min(W,H) ≥ 700 (기존 `getPlanetMainStageBackgroundScale`과 동일 문턱) | Medium 상단 ~ Expanded (≥840) | **§3-5 전체 확대.** 열은 논리 430. 버튼도 함께 커짐 |
| **Fold-Open** (3순위) | 펼친 창. 공식 QA 841×701 | Medium / Expanded | 프레임만 열어 둠. `useWindowDimensions`로 재계산. 기기 모델명으로 분기 금지 |
| **Fold-Cover** (3순위) | 접힌 **커버(외부) 화면**. Phone-S보다 작고 정사각에 가까움 | Compact 밖(극단) | **Phone-S와 다른 밴드.** 실기 전: 커버에 앱이 뜨는지부터 확인. 대부분 RN은 커버에서 중단·축소 |
| **Other** | 데스크톱·크롬북 1600×900 등 | Large / X-Large | 비대상 |

문턱 숫자(780/900/740/700)는 **초안**이다. 구현 전에 대표님 기준폰 실측 1대와 맞춰 확정한다.

### 4-1. 공식 QA 치수 — 선확정하지 않는 이유

구글 Adaptive app quality **레이아웃 테스트 최소 세트**(dp):

| 공식 기기 | 치수 | 우리 초안 밴드 |
|---|---|---|
| 폴더블 펼침 | **841 × 701** | min=701 → Tablet 문턱(700)에 **겨우 걸림** |
| 8형 태블릿 | **1024 × 640** | min=640 → Tablet **미진입** (폰 거터만) |
| 10.5형 태블릿 | **1280 × 800** | min=800 → Tablet |
| 13형 크롬북 | **1600 × 900** | 비대상 |

김클로드 제안 「701/640/800으로 700을 선확정」은 **받지 않는다.** 640은 기존 함수 700 밖이다. 700을 내리면 **기존값 변경**이므로 대표님 재확인이 필요하다. 1순위(폰)와 무관. 2순위 착수 때 선택지:

- **유지 700** — 기존 행성 스케일 문턱과 동일. 공식 8형은 전체 확대 없이 거터만.
- **하향 600** — WSC Medium 시작. 공식 8형도 §3-5 대상.

지금은 둘 다 적기만 하고 **코드를 바꾸지 않는다.**

### 4-2. Play 대형화면 등급 (별축 · 1순위를 바꾸지 않음)

[공식](https://developer.android.com/docs/quality-guidelines/adaptive-app-quality): Play는 Adaptive 품질을 대형화면 검색·추천에 쓴다.

| Tier | 이름 | 이번 설계와의 관계 |
|---|---|---|
| 3 | Adaptive **ready** | 전체 창·레터박스 없음. 1순위 거터를 성운으로 채우면 **이 최소선에 맞춰 둘 수 있음** |
| 2 | Adaptive **optimized** | 화면별 레이아웃. 태블릿 §3-5가 여기 |
| 1 | Adaptive **differentiated** | 폴드 posture 등. **3순위 · 이번 스프린트 밖** |

**2·3순위 보류 = Play 대형화면 노출 최적화는 이번 1순위 범위 밖.** 버튼 안 잘림(1순위)과 노출 등급은 다른 축이다.

### 4-3. 동남아 오포·비보·샤오미

ColorOS 등은 **표준 안드로이드 스킨**이다. `useWindowDimensions` + `react-native-safe-area-context`만 쓴다. 별도 SDK 없음. 저가형 18:9~20:9·노치 편차는 Phone-R / R+ 폭(360~430)·높이 밴드로 커버. 극단 장형(높이>900)은 이미 Phone-R+.

---

## 5. 화면별 적용 순서

| 우선 | 화면 | 이유 |
|---|---|---|
| P0 | **행성 허브 + 허브 성계전투** | 버튼 잘림·배경/전투 여백이 대표님 1순위 |
| P1 | 월드맵 | 전체 폭 사용·크롬 적음. 거터만 |
| P1 | 시설(무역·조선·바·연구) | 하단 `PLANET_MAIN_BOTTOM_FEATURE_RESERVE` + SafeArea. play frame 열 폭 공유 |
| P2 | 타이틀·인트로 | 비율 로고(`TITLE_LOGO_ZONE_HEIGHT_RATIO`). 버튼 잘림만 검사 |
| P2 | 오버레이 패널 | 이미 85~96%. play frame 폭과 열 정렬만 |
| P3 | 대화창 482 고정 | 짧은 폰에서만 하한 검사. 규격 변경은 별도 승인 |

태블릿 `playScale`은 **P0 허브에 먼저** 연결하고, 같은 모듈을 시설·월드맵이 읽는다. 화면마다 배율을 다시 짜지 않는다.

---

## 6. 구현 시 모듈 모양 (코드는 아직 없음)

신설 예정 (승인 후):

```text
src/stages/devicePlayFrame.ts
  classifyDeviceBand(w, h, insets) -> Phone-R | R+ | R- | S | Tablet | FoldOpen | FoldCover | Other
  resolvePlayFrame(w, h, insets) -> {
    contentW, gutterLeft, gutterRight,
    gameViewportH, gameViewportTop,
    chromeTopH, chromeBottomH,
    band,
    playScale          // 폰=1 · Tablet만 min(availW/REF_W, availH/REF_H)
  }
```

- `getPlanetMainStageVerticalMetrics` / `getPlanetMainStageBackgroundScale` / `maxWidth: 430` 은 **이 모듈을 호출하도록** 옮긴다. 1순위 식의 결과값(72, 54, 320, 430, 도크 높이)은 일단 동일.
- 태블릿 구현 턴에 행성 1.22·`tabletBoost`는 `playScale`로 흡수(중복 금지).
- 화면 전용 `useWindowDimensions`로 거터를 다시 짜는 것 금지. 공식과 같이 **한 모듈이 창 메트릭을 상태로 내려 보낸다.**
- 리사이즈·회전·폴드 창 변화 때만 재계산. **틱·interval 없음.** 폴링 금지.
- 분류는 창 폭/높이만. `Platform.isPad`·기종 문자열·대각선 인치 금지.

### 완료 게이트 (구현 턴)

- `npx tsc --noEmit -p tsconfig.client.json`
- 허브 크롬 상수 디프 **0** (기존값 변경 시 재확인)
- 실기: 기준폰 + 폭±20 또는 높이±40 1대 — 탑바·5열·시설 5열·파일럿이 잘리지 않음
- 전투: 궤도 정렬이 기준폰과 동일(논리 좌표 320)
- 2순위 태블릿 실기 시: 공식 10.5형급에서 프레임이 한 배율로 커지고, 바깥은 성운

---

## 7. 금지 (구현자가 흔히 하는 실수)

| 금지 | 이유 |
|---|---|
| 폰에서 화면 전체에 `scale = width/390` | 버튼이 기기마다 달라짐. 대표님 1순위 반대 |
| `ORBIT` 320 논리값을 기기마다 변경 | 전투·채굴·드론 좌표 붕괴 |
| `STAGE_TOP_INSET` 72를 1순위 폰에서 수정 | 기존값. 짧은 폰(Phone-S)만 별도 승인 |
| 허브·전투·월드맵에 서로 다른 거터·서로 다른 playScale | 스테이지 전환 때 열이 점프 |
| 태블릿에서 행성 1.22와 playScale를 곱함 | 이중 확대. §3-5로 흡수 |
| insets를 화면마다 가산 | 이중 SafeArea → 하단 버튼이 홈 인디케이터에 먹힘 |
| 기기 모델명·브랜드(오포/삼성)·`isTablet`로 분기 | 공식: 창 크기만. 물리 화면 금지 |
| 커버 화면을 Phone-S로 처리 | 별도 극단 밴드(Fold-Cover) |
| 상태바/노치 높이를 72 등으로 하드코딩 | 공식 컷아웃: inset만. 72는 장식 |
| 폰에서 `PixelRatio`로 크롬 스케일 | 밀도는 시스템이 처리. 레이아웃은 dp |
| 5열 히트를 48dp 미만으로 축소 | 공식 최소 터치 타깃 |

---

## 8. 대표님 확인이 필요한 것 (코드 전)

1순위 구현 착수 전 아래만 정해 주시면 된다.

1. **기준폰 실기 1대** — 논리 해상도(또는 기종명). 설계는 390×844로 두었음. 다르면 REF만 고친다.
2. **1순위 범위** — 「지금 폰과 비슷한 안드로이드/아이폰」만 먼저인지, Phone-S(SE급)까지 같은 스프린트인지.
3. **5열 타일** — 폭 360에서 **간격 축소 / 열 스크롤 / 현상 유지** 중 어느 것. 권장: **간격만 축소, 타일 크기 유지, 히트 ≥ 48dp.**

이미 반영된 것 (다시 묻지 않음):

- 대형 태블릿 = **게임화면 전체 확대** (대표님 참고 → §3-5).

2순위 착수 때만:

4. Tablet 문턱 **700 유지 vs 600으로 내려 공식 8형(640) 포함** — 기존값이라 그때 재확인.
5. `playScale` 상한 둘지.

---

## 9. 권장 1안 (구현 순서 요약)

상세 스프린트·파일·게이트는 **§12**. 여기서는 한 줄.

**Phone-R 이웃만. 크롬 고정. 거터·시야 여백만. 현재 식을 이름만 붙이고 값은 0 변경.**

승인 전까지 **코드 없음.**

---

## 10. 외부 근거 (검수 시 재확인)

**폰 1순위 (이번 보강 정본)**

- [Use window size classes](https://developer.android.com/develop/adaptive-apps/guides/use-window-size-classes) — Compact 폭 <600 = 세로 폰 99.96% · 높이 480/900
- [Support different display sizes](https://developer.android.com/develop/adaptive-apps/guides/support-different-display-sizes) — 창 메트릭 · 한곳 분기 · API 36 sw≥600 세로잠금 무시
- [Support different pixel densities](https://developer.android.com/training/multiscreen/screendensities) — dp/sp · 밀도 스케일은 시스템
- [Make apps more accessible](https://developer.android.com/guide/topics/ui/accessibility/apps) — 히트 ≥ 48dp
- [MD3 target sizes](https://m3.material.io/foundations/designing/structure) — 48dp · 간격 8dp
- [Display cutouts](https://developer.android.com/develop/ui/views/layout/display-cutout) · [Edge-to-edge](https://developer.android.com/develop/ui/views/layout/edge-to-edge) — inset, 상태바 하드코딩 금지

**대형화면 (2·3순위 참고)**

- [Adaptive app quality guidelines](https://developer.android.com/docs/quality-guidelines/adaptive-app-quality) — Tier 3/2/1 · 841×701 / 1024×640 / 1280×800
- [Get started with adaptive apps](https://developer.android.com/develop/adaptive-apps/guides/get-started-with-adaptive-apps)

**프로젝트**: `app.json` portrait · 탑바 아이콘 보이는 34 · `STAGE_TOP_INSET_PX=72` · `STAGE_BOTTOM_MIN_INSET_PX=54` · orbit 320 · 행성 스케일 minSide 700

---

## 11. 현재 UI 표시 코딩 실측 (2026-09-23)

구현은 이 스택을 **읽어서 이름만 붙인다.** 새 레이아웃을 위에 덮지 않는다. `SPACING.xs=4 sm=8 md=12`.

### 11-1. 표시 파이프라인 (누가 그리는가)

```text
window (useWindowDimensions)
 └─ StageShell
      SafeAreaView edges — 허브/월드맵/전투/무역 = ['bottom'] 만
        (상·좌·우는 SafeArea 없음. 상단은 항상 spacer 72)
      + foregroundBottomPad = max(0, 54 − insets.bottom)
      + 포그라운드 children
      + backgroundOverlay (absoluteFill, 허브만 행성/성운)
      + absoluteOverlay zIndex 1000 (허브 전투 등)
```

| 화면 | 셸 | 창 읽기 | 열 폭 | 하단 |
|---|---|---|---|---|
| 행성 허브 | `edges=['bottom']` + spacer 72 | `planet.tsx` width/height/**fontScale** + `useSafeAreaInsets` | `maxWidth: 430` 3곳 (bg stack · planetColumn · reserve) | 도크 **또** inset.bottom · 스크롤 **또** inset.bottom |
| 허브 전투 | 동일 셸 위 `absoluteOverlay` | 동일 | 430 · 논리 320 · **시각 1.1** | 스캔 행 숨김, 도크 101만 |
| 월드맵 | `edges=['bottom']` | **width만** | 전폭. 430 없음 | 셸 하단만 |
| 무역·조선·바·연구 | `edges=['bottom']` (조선/무역은 headerBg) | 거의 없음 | 화면마다 자체 | ScrollView **마지막 spacer 140** |
| STAGE 3 전투 | `edges=['bottom']` | width | 전폭 | 셸 |
| 타이틀 | StageShell 없음 (`app/index.tsx`) | width/height | 로고 존 **0.60192×H** | 버튼 존 잔여 |
| 온보딩 | `topInset={false}` | — | — | 72 안 씀. compact header 12 |
| 오버레이 | `ArcOverlayHost` inset | height % | 전폭 pad | footer 76 · 카드 85–96% |
| 대화 | Host + `NARRATIVE_DIALOG_LAYOUT` | width | 전폭 · 높이 **482 고정** | STAGE_BOTTOM 54와 핀 계산 |

창 메트릭이 **화면마다 다시** 읽힌다. 공식·§3-1의 「한 모듈」과 어긋남. `devicePlayFrame`이 이 읽기를 흡수한다.

### 11-2. 허브 세로 — 상수 합 (변경 금지)

| 조각 | 값 | 코드 |
|---|---|---|
| 셸 상단 spacer | **72** | `STAGE_TOP_INSET_PX`. 노치 대체. inset.top **가산 없음** |
| 탑바 | **51** | 1 + 8×2 + 아이콘 34. 히트 시각 34 |
| 탑바 시각 lift | 10 (점유 0) | `PLANET_MAIN_FOREGROUND_TOP_CHROME_LIFT_PX` |
| 퀘스트 HUD 추정 | **92** | 4+8+26+54. 있을 때만 |
| 배경 paddingTop | 72+51 = **123** / 퀘스트 시 **215** | `getPlanetMainStageVerticalMetrics` |
| 시야 예약 | **360** (fontScale 1) | `max(360+(fs-1)×72, 0.34H)` cap `H−380` |
| 궤도 논리 | **320** | 불변 |
| 궤도 시각 lift | 14 | `PLANET_MAIN_ORBIT_VISUAL_LIFT_PX` |
| 행성 도트 | 120 | 씬 안 |
| 전투 시각 | 320×**1.1 = 352** | `PLANET_MAIN_COMBAT_LAYER_*_SCALE` |
| 행성 그래픽 스케일 | minSide&lt;700 → **1** | `getPlanetMainStageBackgroundScale` |
| 배경 paddingBottom | **300** (fs 1, 상한 fs 1.28→384) | `BOTTOM_STACK_BASE` |
| 스캔 블록 | **76** | 게이지 20 + 갭 4 + 타일 52 |
| 스캔↔메뉴 | 5 | `SCAN_MENU_GAP` |
| 메뉴+파일럿 헤더 | **101** | 타일 52 + 갭 5 + 헤더 44 |
| 파일럿 펼침 | +156 | 레이아웃 점유는 펼칠 때만 |
| 시설 spacer | **140** | ScrollView **안** 마지막 |
| 셸 하단 | **max(inset.bottom, 54)** | SafeArea + 보충 |

스크롤 `paddingBottom` (현행):

```text
(전투잠금 ? 101 : 177) + 140 + insets.bottom
```

도크 `paddingBottom`: `max(4, insets.bottom)`.

**중첩**: 셸이 이미 `max(inset,54)`를 쓴 뒤, 도크·스크롤이 inset을 **다시** 더한다. 1순위 흡수 때 **시각 0변화**로 한곳에 모은다. 버튼이 1px라도 올라가면 기존값 재확인.

### 11-3. 기준폰·이웃 계산

`fontScale=1`, 퀘스트 없음, `inset.bottom=20` → 셸 하단 합 54. 배경은 SafeArea 안쪽.

| | **390×844 REF** | **360×800** | **360×740** | **412×915 R+** |
|---|---|---|---|---|
| 밴드 | Phone-R | Phone-R | Phone-R− / S 경계 | Phone-R+ |
| 열 contentW | 390 | 360 | 360 | 412 |
| 거터 | 0 | 0 | 0 | 0 (430 미만) |
| 5열 타일 폭 | (390−24−32)/5 = **66.8** | **60.8** | 60.8 | **71.2** |
| 타일 히트 | 66.8×52 ≥48 | 60.8×52 ≥48 | 동일 | OK |
| 전투 시각 352 | 390−352=**38** 여유 | 360−352=**8** | 8 | 60 |
| stageReserve | 360 | 360 | min(360, 740−380)=**360** | max(360, 0.34×915)→360 |
| 궤도 슬롯 (H−54 −123 −300) | 844계 ~**367** ≥320 | ~**323** ≥320 | ~**263 < 320** | ~**438** |
| 퀘스트 ON 슬롯 (−92) | ~275 **<320** | ~231 | ~171 | ~346 |

판정:

- 1순위 390·360×800: 궤도 320은 들어간다. 360 전투 1.1은 **여유 8dp** — 실기에서 좌우 클립만 확인.
- **퀘스트 HUD + 짧은 폰**: 슬롯 &lt; 320. 현행은 예약 360이 스크롤을 밀어 도크와 겹치지 않게 함. 시야는 잘릴 수 있음. Phone-S 규칙(72를 시야에서만 줄임)이 이 숫자와 맞음. 1순위에서 72·300 **금지**.
- 폭 430+: 거터 (W−430)/2. 현행 `maxWidth:430` + `alignSelf:'center'`가 이미 이 효과. 공식만 명시.

### 11-4. 화면별 코딩 방식

**허브 포그라운드** — 열 고정 + 스크롤 예약 + 하단 도크 고정.

```text
spacer 72
탑바 51 (translateY −10, 점유 유지)
QuestHUD (있으면 92 추정)
mainArea flex
  ScrollView 투명
    planetStageReserve minHeight=360   ← 시야 자리만 비움
    (전투 자세 행)
  PlanetMainPlanetInfoTapOverlay (예약 높이·scale)
  planetBottomDock 고정
    스캔 5열 (전투 시 unmount)
    시설 5열 + 파일럿 44
info 우상단 42% — 전투 시 unmount
전투 HUD — reserve 아래 absolute
```

배경은 같은 paddingTop/Bottom으로 궤도 슬롯을 맞춤. 행성 `scale(planetStageScale)` + translateY −14.

**허브 위 시설** — 허브 스택 유지(`push`). 하단 140은 ScrollView **마지막 spacer**. 뷰포트 밖 고정 reserve 금지(AGENTS). 조선소 `paddingTop: 80` / `72`는 허브 72와 **다른 하드코딩** — P1에서 감사만, 값 변경은 재확인.

**월드맵** — 헤더+QuestHUD+전폭 맵. 430 열 없음. 줌·노드 좌표는 기기 대응과 **별축**. playScale=1. 거터 없음.

**STAGE 3** — `combat.tsx` 전폭. 허브 전투와 다른 화면. 논리 orbit은 허브와 공유하지 않음. 이번 1순위 비대상.

**오버레이** — 높이 85–96% · 중앙 bias 36 · footer 76. 열 430과 비공유.

**대화** — 300+126+56=**482**. 짧은 폰에서 셸 하단 54+카드를 빼면 핀이 겹침. 규격 변경은 별도 승인. P2는 하한 검사만.

**타이틀** — `TITLE_LOGO_ZONE_HEIGHT_RATIO = 0.44 × 1.44 × 0.95 = 0.60192`. 844에서 로고 존 ≈508. Play Frame 밖. P2는 버튼 잘림만.

### 11-5. 코딩 ↔ Play Frame 갭 (개발이 메울 것)

| 현행 | Play Frame | 개발 때 |
|---|---|---|
| 430이 스타일 리터럴 3+곳 | `CONTENT_MAX_W` 한곳 | 이름 치환, 값 430 |
| 메트릭+스케일을 `planet.tsx`가 직접 계산 | `resolvePlayFrame` | 식 이동, 결과 동일 |
| 화면마다 `useWindowDimensions` | 한 모듈 상태 | 신규 화면 추가 금지 |
| 하단 inset 2~3중 | 셸 한곳 | 시각 0변화로 흡수 |
| 허브 `edges=['bottom']` → 좌우 inset 0 | 공식은 insetL/R | 1순위 0 유지. Fold만 식 준비 |
| 상단 72가 inset.top을 대체 | 설계는 inset+장식 | **1순위 현행 유지** (72=장식+노치 합) |
| 태블릿 행성 1.22 · width≥900 boost | §3-5 `playScale` | 2순위에서 흡수 |
| 오버레이/대화/타이틀 독자 | 열만 공유 | P2 |

---

## 12. 개발계획

```text
[pss-pre-dev] hot_path=리사이즈 1회 · 틱 없음 · persist 없음
[pss-pre-dev] stage=devicePlayFrame 신설 · 기존 메트릭 호출 치환 · Skia 논리 320
[pss-pre-dev] verdict=PASS — 1순위는 식 이동만. 72/54/320/430/1.1/34/52/140 변경 없음
```

### 0. 착수 전 (코드 0)

1. §8 기준폰 1대 · 1순위 범위 · 5열(간격 축소, 히트≥48).
2. 기준폰에서 허브 퀘스트 ON/OFF · 360급 1대 도크·궤도 스크린샷.

### 1. P0 허브 — 프레임 흡수 (값 디프 0)

신설 `src/stages/devicePlayFrame.ts`:

```text
classifyDeviceBand(w, h, insets)
resolvePlayFrame(w, h, insets, { fontScale, hasQuestHud }) ->
  band, contentW, gutterLeft, gutterRight,
  chromeTopH, chromeBottomH, gameViewportH,
  stageReservePx, backgroundChrome,   // 기존 함수 위임
  planetStageScale,                   // 기존 함수 위임
  playScale                           // 폰=1
```

- `getPlanetMainStageVerticalMetrics` / `getPlanetMainStageBackgroundScale` **식을 복사하지 말고 호출**.
- `planet.tsx`의 두 `useMemo`를 `resolvePlayFrame` 1회로.
- `maxWidth: 430` → `CONTENT_MAX_W` (`planetHubStyles` 3곳 · `planetCapitalCombatHeavyUi` 2곳).
- 화면 전용 거터 재계산 금지.

게이트: `tsc` · 허브 상수 디프 0 · 기준폰+폭±20 탑바·5열·파일럿 미클립 · 궤도 정렬 동일.

### 1b. P0 하단 inset 중첩 (시각 0)

대상: `StageShell` + `planet.tsx` 스크롤/도크.

목표: inset은 셸 **한곳**. 도크·스크롤에서 빼되 **버튼 Y가 지금과 같게**. 1px 이동이면 중단하고 재확인.

### 2. P0 허브 성계전투

- 같은 play frame. `orbitSize` 논리 320. 시각 1.1 유지.
- 360에서 352 여유 8 — 실기 좌우만 확인. 1.1 변경 금지.
- 인포 unmount · 베일 · 그레이 마크는 현행 유지(기기대응 범위 밖).

### 3. P1 월드맵

- 헤더+QuestHUD를 `chromeTopH`로만 읽음. 맵은 전폭(`contentW=windowW`).
- 노드/줌/펄스 좌표 **금지**.
- `worldmap.tsx` width 단독 읽기를 프레임 구독으로 치환(값 동일).

### 4. P1 시설

- trade / shipyard / bar / skilltree: spacer **140** 유지, `contentW`만 공유.
- 조선소 `paddingTop` 80·72 감사. 허브 72와 합치지 않음(기존값).

### 5. P2 오버레이 · 대화 · 타이틀

- 패널 85–96%는 windowH 유지. 폭만 `contentW` 정렬(선택).
- 대화 482: `windowH − safe − 54 < 482` 이면 로그만. 높이 변경은 승인.
- 타이틀 로고 비율 유지. 시작 버튼 잘림만.

### 6. P3 태블릿 · Phone-S (밴드 확정 후)

- `playScale = min(availW/390, availH/844)`. 행성 1.22·`tabletBoost` 흡수.
- Phone-S: 72를 **시야에서만** 줄임. 버튼 금지. §8-2 승인 후.

### 파일 지도

| 스프린트 | 만짐 | 안 만짐 |
|---|---|---|
| 1 | `devicePlayFrame.ts` 신설 · `planet.tsx` · `planetHubStyles.ts` · `planetCapitalCombatHeavyUi.tsx` | `planetMainStageLayout` 숫자 · Skia 전투 수학 |
| 1b | `StageShell.tsx` · `planet.tsx` 패딩 | 도크 타일 52·34 |
| 2 | 허브 전투 래퍼 정렬만 | `PLANET_MAIN_ORBIT_SCENE_SIZE` · 1.1 |
| 3 | `worldmap.tsx` 크롬 읽기 | 맵 좌표·줌 |
| 4 | 시설 spacer 정렬 | 140 값 |
| 5 | overlay width 선택 · 대화 하한 로그 | 482 · 로고 비율 |
| 6 | playScale 연결 · 1.22 흡수 | 폰 밴드 scale |

### 완료 게이트 (전 스프린트)

- `npx tsc --noEmit -p tsconfig.client.json`
- 1순위: 72 / 54 / 320 / 430 / 1.1 / 34 / 52 / 140 / lift 10·14 **디프 0**
- `npm run audit:memory:all` (STAGE 연결 시)
- 전투 연결 시 `audit:skia-memory` + 논리 320 동일
- 리사이즈 외에 틱·interval·persist 없음

