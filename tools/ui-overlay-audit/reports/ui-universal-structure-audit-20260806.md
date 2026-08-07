# UI 구조 · 통합 범용(ArcOverlay) 적용 전수검사

Generated: 2026-08-06 KST · 김팀장 정적 전수

정본: `.cursor/rules/arcfire-overlay-ui-contract.mdc` · `docs/OVERLAY_UI_UNIVERSAL_SPEC.md`

## Verdict

| 축 | 판정 |
|----|------|
| RN `Modal` / `Alert.alert` 잔존 | **없음** (`audit:ui-overlay` PASS) |
| 팝업 → `ArcOverlayHost` 단일 루트 | **적용됨** (`app/_layout.tsx`) |
| panel 조립(Card·TitleHeader·FooterActions) | **주요 panel kind 완료** |
| compact (alert/levelUp/reward/waveResult) | **Card 사용 · FooterActions 미통일** (스펙 Phase A) |
| 시설 STAGE 화면 (무역/선술집/조선소) | **별도 `PlanetFacility*` 셸** — 오버레이 kind 아님(의도) |
| 통합 범용 완성도 | **약 80%** — Host 수렴 OK · compact/레거시·chrome 갭 잔존 |

---

## 1. UI 계층 지도

```text
app/_layout.tsx
 ├─ ArcOverlayHost          ← 모든 팝업 kind 스택
 ├─ IngameDialogHost        ← narrative 전용(별도 축 · Card 통합 보류)
 └─ (game) STAGE screens
      ├─ planet.tsx         허브
      ├─ worldmap / combat
      └─ trade / tavern / shipyard / skilltree  ← SUB-STAGE 풀스크린
           └─ PlanetFacilityTitleHeader + ScrollView spacer
```

| 계층 | 통합 범용 대상? | 상태 |
|------|-----------------|------|
| 팝업·모달·알림 | **예** | Host + Card |
| 인게임 대사 | 스펙상 **보류** | `NarrativeDialogRow` |
| 시설 풀스크린 | **아니오** (STAGE) | `PlanetFacility*` 공용 헤더 |
| 허브 HUD/메뉴 | 아니오 | planet 로컬 |

---

## 2. ArcOverlayKind 적용표

| kind | hostAnchor (chrome) | Content 셸 | footer | 통합 범용 |
|------|---------------------|------------|--------|-----------|
| settings | top · panel | ArcOverlayCard panel | FooterActions | ✅ |
| bmShop | top · panel | Card panel | FooterActions | ✅ |
| tradeQuantity | top · panel | Card panel | FooterActions | ✅ |
| planetEconomyInfo | top · panel | HeavyUi → Card | FooterActions | ✅ |
| planetDevelopment | top · panel | HeavyUi / Card | FooterActions | ✅ |
| nearbyPresenceInfo | top · panel | Card panel | FooterActions | ✅ |
| **relicLore** | **default→center/phosphor** ⚠️ | Card **panel** | FooterActions | ⚠️ chrome 미등록 |
| alert | center · phosphor | Card compact | 버튼 in body | △ Phase A |
| levelUp | center | Card compact | body | △ |
| reward | center | Card compact | body | △ |
| waveResult | center | Card compact | ArcButton in footer prop | △ (FooterActions 아님) |
| narrative | center · narrative | NarrativeDialogRow | 자체 | 보류(스펙) |
| blocking | center | 전용 | — | 유지 |

---

## 3. 공식 감사

| 명령 | 결과 |
|------|------|
| `npm run audit:ui-overlay` | **PASS** |
| `npm run audit:ui-overlay:tactical-readiness` | FAIL 0 · **WARN 6** |

WARN 요약: `LevelUpModal` dead legacy · HeavyUi/Portrait tactical 토큰 갭 · Card/TitleHeader theme merge.

---

## 4. 양호 (유지)

1. 루트 단일 Host · `showArcAlert` → overlay alert (30s autoDismiss 계약)
2. panel 마이그레이션 완료 목록(스펙 §3-2) + nearby/relic Content는 Card 사용
3. `HeavyUiOverlayShell` = Card + FooterActions 래퍼 (로딩/에러 공용)
4. 행성개발 상세 → GenericFacility / OrbitShipyard / DefenseSatellite 모두 Card
5. `ArcMessageModalHost` = Host 별칭 (우회 Modal 아님)
6. 시설 화면 하단 spacer = `PLANET_MAIN_BOTTOM_FEATURE_RESERVE_PX` 계약(레이아웃 헌법)

---

## 5. 갭 / 리스크

### P1 — 계약 불일치

| ID | 내용 | 권장 |
|----|------|------|
| **U-P1-1** | `relicLore`가 `overlayChrome` panel/`hostAnchor:'top'`에 **없음** → Host가 center·phosphor로 정렬하는데 Content는 `layout="panel"` | `overlayChrome` case에 `relicLore`를 nearby와 동일 등록 |
| **U-P1-2** | compact kind footer 미통일 (스펙 Phase A1–A3) | waveResult/reward/alert → `ArcOverlayFooterActions` |

### P2 — 정리·테마

| ID | 내용 |
|----|------|
| U-P2-1 | `LevelUpModal.tsx` — import 0 · @deprecated 제거 후보 |
| U-P2-2 | `phosphorOverlayStyles` deprecated card* 잔존 (스펙 A4) |
| U-P2-3 | tactical readiness WARN 6 — theme exclusive 세트·HeavyUi visualTheme 전파 |
| U-P2-4 | `PlanetInfoGovernorCard` 로컬 card 스타일 — 오버레이 **본문 위젯**(셸 위반 아님) · 장기 MetaBlock 후보 |

### 비이슈 (의도적 분리)

- trade/tavern/shipyard/skilltree = STAGE push · 오버레이 강제 아님
- narrative = IngameDialogHost 축
- 허브 인라인 HUD

---

## 6. 시설 STAGE 공용 적용

| 화면 | 공용 헤더 | 비고 |
|------|-----------|------|
| trade / tavern / shipyard | `PlanetFacilityTitleHeader` | `t('common.back')` 등 i18n |
| skilltree | 시설 토큰 계열 | 동일 레이아웃 헌법 |
| NearbyPresence overlay | Facility 타이포 일부 재사용 | panel Card 안 |

→ “통합 범용 **팝업**”과 “시설 **화면** 셸”은 **두 축**. 팝업 축은 ArcOverlay, 화면 축은 PlanetFacility.

---

## 7. 권장 다음 (안정 우선)

1. **U-P1-1** relicLore chrome 등록 (1파일 · 레이아웃만 · 게임성 리스크 낮음)
2. Phase A: waveResult → FooterActions
3. LevelUpModal 파일 삭제(미사용 확인 후)
4. tactical WARN은 전면 테마 교체 스프린트에서

---

## 한 줄

팝업은 **통합 범용 Host에 수렴되어 있고** 공식 audit PASS다. 남은 건 **relicLore chrome 누락**, compact footer 통일, dead `LevelUpModal`·tactical WARN 정리이며, 시설 풀스크린은 별도 Facility 셸로 정상 분리되어 있다.
