# 기기대응 UI 설계 v0.1 보강 — 업계 표준·안드로이드 공식 가이드 대조 (2026-09-23)

```text
status=REVIEWED
task_id=device-adaptive-ui-design-reinforcement-20260923
kind=DESIGN_REVIEW + EXTERNAL_REFERENCE (코드 변경 0 — 설계 보강 자료만)
대상=docs/DEVICE_ADAPTIVE_UI_DESIGN.md v0.1 → v0.2 (김팀장 반영 완료)
verdict=PARTIAL (김팀장)
방법=WebSearch·WebFetch로 안드로이드 공식 개발가이드 + 업계(Unity/모바일게임 스튜디오) 관행 전수 참고
김팀장=tools/kim-team-lead/reports/kim-team-lead-device-adaptive-ui-v02-20260923.md
```

## 0. 총평

김팀장의 「크롬 고정 · 시야 유동(Play Frame)」 설계는 **업계 표준과 방향이 정확히 일치한다.** 특히 "버튼은 스케일하지 않고 여백/시야만 늘어난다"는 원칙은 아래에서 확인한 안드로이드 공식 가이드·모바일 게임 스튜디오 관행 양쪽 모두가 권장하는 패턴이다. 이번 보강은 설계를 뒤집지 않고, **§4의 "초안" 밴드 문턱값에 공식 근거를 채워 넣고**, **문서가 다루지 않은 실전 함정 3가지**를 추가하는 것이 목적이다.

---

## 1. 기존 설계가 맞았음을 확인 (외부 근거로 검증)

| 문서 원칙 | 외부 근거 |
|---|---|
| 버튼·크롬은 스케일 안 함, 여백만 유동 | Unity 공식 문서: Canvas Scaler "Scale With Screen Size"도 종횡비가 다르면 **레퍼런스 해상도에서 벗어나 화면 비율을 우선**한다 — 즉 업계 표준 엔진조차 "버튼 무한 스케일"보다 "여백 흡수"를 기본으로 삼는다. |
| 안전존을 잡고 남는 공간만 늘림 | 모바일 게임 UX 아티클(Space Ape Games 등) — 16:9를 안전존으로 잡고, 그보다 넓거나 좁은 비율에서는 **X축 또는 Y축에만 여백을 추가**하는 것이 업계 정석. 문서의 "좌우 거터만 유동, 320 궤도는 불변"과 동일 원리다. |
| SafeArea는 한 곳(`StageShell`)만 | RN/Expo 공식: `react-native-safe-area-context`는 `SafeAreaProvider`를 루트에 한 번만 두고 하위는 `useSafeAreaInsets()`로 읽는 게 정석 — 화면마다 다시 적용하면 이중 패딩이 난다는 문서의 §3-1-④ 경고와 정확히 일치. |
| 폴더블은 "기기 모델"이 아니라 "창 크기 변화"로 처리 | RN/Expo 공식 가이드(폴더블 전용): "React Native에 폴드 API는 없고, 대부분 필요 없다 — `useWindowDimensions`로 크기를 읽어라, 기기 모델이나 세로 고정으로 판단하지 마라." **문서의 리사이즈 재계산 방식이 이미 이 권고와 일치**한다. |
| 리사이즈·회전 때만 재계산, 틱 없음 | 동일 공식 가이드: `useWindowDimensions`는 리스너 기반으로 회전·폴드 변화 시에만 갱신 — 폴링 불필요. |

**결론**: 설계 방향을 바꿀 필요는 없다. 아래는 "구멍 메우기"다.

---

## 2. 공식 문턱값 — §4 "초안" 대체 근거

### 2-1. 안드로이드 공식 Window Size Class (Material Design 3 / Android 공식)

| 클래스 | 폭(dp) | 전형 기기 |
|---|---|---|
| **Compact** | < 600 | 일반 폰 세로 |
| **Medium** | 600 ~ 839 | 폰 가로, 소형 태블릿, **펼친 플립폰** |
| **Expanded** | 840 ~ 1199 | 대형 태블릿, **펼친 폴더블** |
| Large / X-Large | 1200+ / 1600+ | 데스크톱급(비대상) |

문서의 `Tablet` 밴드 문턱(`min(W,H) ≥ 700`)은 **Medium 상단(600~839)과 Expanded 진입부(840)에 걸쳐 있다** — 700이라는 값 자체가 틀린 건 아니지만, 이 표준 3단계(Compact/Medium/Expanded) 명칭을 §4 표에 나란히 적어두면 이후 "왜 700인가"를 대표님·다음 작업자가 안드로이드 공식 체계로 바로 이해할 수 있다. **제안**: §4 표에 "안드로이드 표준 대응" 열 추가.

### 2-2. 구글 공식 "Adaptive app quality guidelines" 실기 테스트 매트릭스

Google Play가 실제 앱 품질 등급(3단계: Adaptive Ready → Optimized → Differentiated) 판정에 쓰는 **공식 테스트 기기 치수**:

| 기기 | 논리 해상도(dp) |
|---|---|
| 폴더블(펼침) | **841 × 701** |
| 8형 태블릿 | **1024 × 640** |
| 10.5형 태블릿 | **1280 × 800** |

문서 §4의 `min(W,H) ≥ 700` 문턱은 이 공식 매트릭스의 8형 태블릿(640)·폴더블(701) 사이에 정확히 걸린다 — **구현 전 재확인 시 이 3개 수치를 실기 없이도 기준선으로 바로 쓸 수 있다.** §8 "대표님 확인이 필요한 것" 1번(기준폰 실측)과 별개로, 태블릿·폴더블 밴드는 이 공식 수치로 **선확정**해도 무방하다는 근거가 된다.

### 2-3. Google Play 등급제 — 2순위/3순위 보류의 실제 대가

구글 공식 문서: Play는 **Adaptive 품질 가이드라인을 충족하는 앱·게임을 대형화면 검색·추천에서 우선 노출**한다(3단계: Tier 3 "Ready"=레터박싱 없이 전체화면 실행, Tier 2 "Optimized"=화면별 레이아웃 최적화, Tier 1 "Differentiated"=폴더블 posture 대응 등). 문서가 태블릿·폴드를 2·3순위로 미루는 결정 자체는 유효한 우선순위 판단이지만, **"버튼 안 잘림"이라는 1순위 목표와 별개로 "Play 대형화면 노출 순위"라는 별도 축이 있다는 사실**을 대표님이 알고 있는 상태에서 순위를 정한 것인지 확인 필요 — 문서에 이 트레이드오프가 명시돼 있지 않다. **제안**: §4 또는 §8에 한 줄 추가("2·3순위 보류 = Play 대형화면 노출 최적화는 이번 스프린트 범위 밖"으로 명문화).

---

## 3. 문서가 안 다룬 실전 함정 3가지

### 3-1. [중요] 폴더블 "덮개(커버) 화면" — Phone-S보다 더 극단적인 밴드

삼성 Z Flip류는 접었을 때 **외부(커버) 디스플레이**가 따로 있다(Z Flip6/7 기준 대략 정사각형에 가까운 매우 작은 화면). 이건 §4의 `Phone-S`(높이 < 740)보다도 훨씬 좁고 짧다 — **별도 밴드로 취급하거나, 접힌 상태에서는 앱이 아예 그 화면에 안 뜨는지(대부분의 비최적화 RN 앱은 커버 화면에서 그냥 중단되거나 축소 렌더링됨)를 먼저 실기로 확인**해야 한다. 문서 §4의 `Fold / 가로` 밴드가 "펼친 상태의 가로 모드"만 가리키는지, "접은 상태의 커버 화면"까지 포함하는지 구분이 없다 — **이 자체가 서로 다른 두 케이스이므로 분리해서 명시 권장.**

### 3-2. [경미] 폴더블 좌우 인셋 비대칭 가능성

RN 공식 폴더블 가이드: "접힌 상태에 따라 좌우 세이프에어리어 inset이 서로 다를 수 있다(대칭 아님) — 양쪽을 각각 읽어야 한다." 문서 §3-2 공식(`gutter = max(0, (windowW - contentW)/2)`)은 좌우를 **균등 분배**한다. 폴더블 힌지 근처에서 좌우 inset이 다르면 콘텐츠 열이 살짝 중심에서 벗어날 수 있다 — 1순위(Phone-R 이웃)에서는 해당 없음, Fold 밴드(3순위)를 실제로 열 때 재확인 필요 항목으로만 남겨두면 됨.

### 3-3. [참고] 동남아 오포 등 — OS 차이 아님, 표준 안드로이드로 커버됨

"오포폰(동남아)"을 별도 대응 대상으로 지시하셨는데, 확인 결과 **오포(ColorOS)·비보·샤오미 등은 커스텀 OS가 아니라 표준 안드로이드 위의 스킨**이라 `useWindowDimensions`·`react-native-safe-area-context`가 동일하게 동작한다(별도 SDK 불필요). 다만 이 시장은 **저가형 기기 비중이 높아 화면 비율이 18:9~20:9로 더 다양하고, 노치/펀치홀 위치·크기 편차가 크다** — 이건 문서의 Phone-R/R+/R- 밴드 폭(360~430)·높이(780~900) 범위로 대부분 커버되지만, **20:9 이상의 극단적으로 긴 화면**(예: 360×900 이상)은 `Phone-R+`(높이>900) 밴드가 이미 다루므로 추가 밴드는 불필요 — 커버되고 있다는 확인만 문서에 한 줄 추가 권장.

---

## 4. 요약 — §4·§8에 반영 제안

| # | 제안 | 근거 |
|---|---|---|
| 1 | §4 표에 "안드로이드 표준 Window Size Class" 열 추가(Compact/Medium/Expanded) | Material Design 3 공식 |
| 2 | 태블릿·폴더블 밴드 문턱(700 등)을 구글 공식 테스트 매트릭스(701/640/800)로 실기 없이 선확정 가능함을 §8에 명시 | Google Adaptive app quality guidelines |
| 3 | §4/§8에 "2·3순위 보류 = Play 대형화면 노출 트레이드오프" 한 줄 명시 | Google Play 등급제 |
| 4 | §4 `Fold` 밴드를 "펼친 가로"와 "접은 커버 화면"으로 분리, 커버 화면은 별도 극단 밴드로 표시(구현은 여전히 3순위 보류 유지) | 삼성 공식 가이드 |
| 5 | §3-2 거터 공식에 "좌우 인셋 비대칭 가능" 각주 추가(Fold 밴드 열 때만 해당) | RN 공식 폴더블 가이드 |
| 6 | 오포 등 동남아 기기가 표준 안드로이드 API로 커버됨을 §4 하단에 한 줄 확인 문구 추가 | 조사 결과 |

전부 **기존 설계를 바꾸지 않는 각주·근거 보강**이다. 코드·구현 순서·절대 규칙(§3-1)·기준값(REF_W 390 등)은 그대로 둔다.

## 5. 조사 방법 · 한계

WebSearch/WebFetch로 안드로이드 공식 문서(developer.android.com) 4건, Material Design 3 공식 1건, Samsung 공식 1건, RN/Expo 공식 1건, 모바일 게임 UX 아티클 1건을 확인했다. Unity Canvas Scaler 문서는 업계 관행 비교용 참고(이 프로젝트는 Unity 아님). 코드 변경은 없다 — 문서(`DEVICE_ADAPTIVE_UI_DESIGN.md`) 자체도 이번 조사에서 수정하지 않았다(설계 소유자 김팀장 반영 대상).

**Sources**:
- [Adaptive app quality guidelines](https://developer.android.com/develop/adaptive-apps/quality-guidelines/adaptive-app-quality)
- [Get started with adaptive apps](https://developer.android.com/develop/adaptive-apps/guides/get-started-with-adaptive-apps)
- [Get started with large screens](https://developer.android.com/guide/topics/large-screens)
- [Support different pixel densities](https://developer.android.com/training/multiscreen/screendensities)
- [Material Design 3 — Breakpoints](https://m3.material.io/foundations/layout/breakpoints/medium)
- [Samsung Developer — App continuity and Multi-tasking](https://developer.samsung.com/one-ui/foldable-and-largescreen/app-cont-and-multi.html)
- [Expo — Safe areas](https://docs.expo.dev/develop/user-interface/safe-areas/)
- [React Native Foldable UI Dimensions (Medium)](https://medium.com/@aloksinha94566/in-react-native-foldable-ui-dimensions-without-third-party-npm-module-7255710ab8de)

**김팀장(Cursor 본창) 검수 요청** — §4 표에 근거 열 추가 여부만 판단해 주시면 됩니다. 구현은 여전히 대표님 승인 후.
