# Arcfire 범용 오버레이 UI — 작업 현황 · 안정성 · 로드맵

> **최종 갱신**: 2026-06-25  
> **정본 코드**: `src/ui/overlay/` · **감사**: `npm run audit:ui-overlay`  
> **Tactical(G-ARCHIVE) 기준·전면 교체 준비**: `docs/TACTICAL_UI_BASELINE_AND_ROLLOUT_READINESS.md` · `npm run audit:ui-overlay:tactical-readiness`  
> **헌법 교차참조**: v4.0 §15(RN Modal/Alert 금지) · `AGENTS.md` UI 오버레이 절

---

## 1. 목표

모든 게임 팝업을 **단일 호스트 + 조립형 카드 셸**로 수렴한다.

```text
ArcOverlayHost
 ├─ hostAnchor (overlayChrome.ts) — panel=상단 · compact=중앙 bias
 └─ centerSlot
      └─ ArcOverlayCard (layout=panel → min/max 높이 자동)
           ├─ ArcOverlayTitleHeader   ← 제목·부제·trailing만
           ├─ body (compact | panel + ScrollView)
           │    └─ panelPrefix?       ← 메타(단가/재고) 등 헤더 직하 고정
           └─ footerDock              ← ArcOverlayFooterActions [취소][확인]
```

신규 팝업은 **로컬 `View` card + `flex:1` body** 를 만들지 않고 위 조립만 확장한다.

---

## 2. 안정성 점검 (2026-06-20)

| 게이트 | 결과 | 비고 |
|--------|------|------|
| `npx tsc --noEmit -p tsconfig.client.json` | **PASS** | 오버레이 TS 전수 |
| `npm run audit:ui-overlay` | **PASS** | RN `Modal` / `Alert.alert` / magic padding 잔존 없음 |
| Skia·Reanimated | **해당 없음** | 본 UI 배치는 RN View 셸만 — Skia audit 불필요 |
| 실기 레이아웃 | **수동 QA 완료** | 카드 폭·세로(85~96%)·footer 가림·세로 bias 반영 |

### 알려진 잔여 리스크 (낮음)

- **퍼센트 `minHeight`/`maxHeight`**: 기종·세이프에리어에 따라 스크롤 길이 체감 차 — `overlayPanelLayout.ts` 상수로만 조정.
- **행성개발 상세 footer**: 액션 버튼 + [목록][닫기] 2단 — 항목 많을 때 스크롤·footer 동시 노출은 실기 재확인 권장.
- **`phosphorOverlayStyles` 레거시 `card*`** : 미사용 deprecated 스타일 잔존 — Phase 2에서 정리 예정.

---

## 3. 현재 작업 상태 (완료)

### 3-1. 인프라

| 모듈 | 역할 |
|------|------|
| `ArcOverlayHost` | 단일 루트 · `getOverlayChrome().hostAnchor` · `centerSlot` |
| `overlayChrome.ts` | kind별 `zIndex` · `cardVariant` · **`hostAnchor`** (정렬 정본) |
| `ArcOverlayCard` | `compact` / `panel` · panel 시 `resolveOverlayPanel*Height` 자동 · `footerDock` |
| `ArcOverlayTitleHeader` | 탭형 네이vy 헤더 + SVG 대각 패턴 |
| `ArcOverlayFooterActions` | 범용 [취소][확인] — `common.cancel` / `common.confirm` |
| `overlayPanelLayout.ts` | `resolveOverlayPanelMinHeight/MaxHeight` · `OVERLAY_PANEL_TOP_ANCHOR_PX` |
| `phosphorOverlayStyles.ts` | 본문 타이포·divider·버튼 row (카드 외곽은 Card가 담당) |

### 3-2. `ArcOverlayCard` 마이그레이션 완료

| kind / 화면 | layout | footer | 비고 |
|-------------|--------|--------|------|
| `planetEconomyInfo` | panel | FooterActions | 초상화·PGP → `panelPrefix` |
| `planetDevelopment` 목록 | panel | FooterActions | |
| `planetDevelopment` 상세 | panel | 액션 col + FooterActions | GenericFacility·OrbitShipyard·DefenseSatellite |
| `settings` | panel | FooterActions | 취소=설정 롤백 |
| `bmShop` | panel | FooterActions | premium · exchange(크레딧) |
| `tradeQuantity` | panel | FooterActions | **제목=아이템명** · 메타=panelPrefix · 구매/판매 동일 |

### 3-3. 레이아웃 회귀 방지 (필수 계약)

1. **카드 폭**: `centerSlot` + `OVERLAY_CARD_LAYOUT.width:'100%'` — `alignItems:center` 부모에서 `width:100%` 단독 사용 금지(제목 너비로 축소됨).
2. **본문 `flex:1` 금지**: bounded 카드 없이 `cardBody flex:1` → RN 높이 0 붕괴. 스크롤은 Card 내부 `flexGrow:1`만.
3. **footer는 스크롤 밖**: `footerDock`이 `overflow:hidden` 카드에서 클리핑되지 않도록 Card 직속 자식.
4. **제목 영역**: `ArcOverlayTitleHeader`에 단가·재고 등 데이터 금지 → `panelPrefix` 또는 scroll body.

---

## 4. 미완 / 레거시 (다음 마이그레이션 대상)

| kind / Content | 현재 | 목표 |
|----------------|------|------|
| `alert` | compact · 버튼 in body | 선택: footerDock + FooterActions |
| `levelUp` | compact | compact 유지 또는 짧은 panel |
| `reward` | compact | compact + footerDock |
| `waveResult` | compact · 확인 버튼 in body | panel + FooterActions |
| `narrative` | `NarrativeDialogRow` · bottom/center | **별도 축** — Card 통합 보류 |
| `blocking` | 전용 Content | 유지 |

행성개발 시설 상세(`PlanetTradePortDevContent` 등)는 **`PlanetGenericFacilityDevContent` 위임** — 별도 card 스hell 없음 ✅

---

## 5. 향후 작업 예정 (효율적 범용 UI)

### Phase A — 단기 (1~2세션)

- [ ] **A1** `WaveResultOverlayContent` → `panel` + `ArcOverlayFooterActions`
- [ ] **A2** `RewardOverlayContent` → footerDock 통일
- [ ] **A3** `AlertOverlayContent` — 2버튼 이상 시 footerDock (게임종료·확인 다이얼로그)
- [ ] **A4** `phosphorOverlayStyles` deprecated `card`/`cardBody*` 제거 · grep 잔존 0

### Phase B — 조립 블록 추출

- [ ] **B1** `ArcOverlayMetaBlock` — 무역 `MetaRow`(단가/재고/수요) 재사용
- [ ] **B2** `ArcOverlaySectionLabel` + `ArcOverlayKeyValueRow` — 행성정보·개발 상세 row 통합
- [ ] **B3** `ArcOverlayDevActionFooter` — 설치/업그레이드 col + FooterActions 한 컴포넌트

### Phase C — 감사·문서

- [ ] **C1** `audit:ui-overlay` 확장: `content/*` 내 `flex:1`+`cardBody`·로컬 `maxHeight`+% card 패턴 탐지
- [ ] **C2** `src/ui/overlay/index.ts` — `ArcOverlayCard`·`overlayPanelLayout` re-export 정리
- [ ] **C3** i18n P2 (`trade.tsx`·`TradeQuantityOverlayContent` 잔여 한국어) — `docs/I18N_MIGRATION_ROADMAP.md` 연동

### Phase D — 장기 (선택)

- [ ] Narrative bottom/center와 Card 시각 토큰만 공유 (구조 통합은 우선순위 낮음)
- [ ] BM 상점 `ProductRow` → `ArcOverlayListItem` 패턴 일반화

---

## 6. 신규 오버레이 kind 추가 체크리스트

1. `arcOverlayStore.ts` — kind·entry 타입
2. **`overlayChrome.ts`** — `zIndex` · `backdrop` · **`hostAnchor`** · `cardVariant`
3. `ArcOverlayHost.tsx` — Content switch만 (**Host 정렬 kind 하드코딩 금지**)
4. Content — **`ArcOverlayCard` + `ArcOverlayFooterActions`** (`layout="panel"` 기본, 높이 수동 전달 불필요)
5. `presentArc*` 또는 `showArc*` imperative API
6. `tsc` + `npm run audit:ui-overlay`
7. 실기: panel 계열 헤더 상단 정렬·footer 가림·세로 높이 일치

---

## 7. 상수 조정 가이드

| 상수 | 파일 | 용도 |
|------|------|------|
| `OVERLAY_PANEL_CARD_MIN_HEIGHT_PCT` | `overlayPanelLayout.ts` | compact+footer 폴백 (panel은 px 자동) |
| `resolveOverlayPanelMinHeight` | idem | panel 최소 세로 (85% + 설명블록 보정) |
| `resolveOverlayPanelMaxHeight` | idem | panel 최대 세로 (96%) |
| `OVERLAY_CENTER_VERTICAL_BIAS_PX` | idem | compact 중앙 offset (36) |
| `OVERLAY_PANEL_TOP_ANCHOR_PX` | idem | panel Host 상단 앵커 (28) |
| `OVERLAY_FOOTER_DOCK_MIN_HEIGHT` | idem | 하단 버튼 영역 (76) |
| `OVERLAY_TOKENS.cardMaxWidth` | `theme.ts` | 카드 가로 (300) |

**한 기종만 조정 금지** — 상수 1곳 변경 후 전체 팝업 실기 스pot check.

---

## 8. 관련 파일 인덱스

```text
src/ui/overlay/
  ArcOverlayHost.tsx          # 루트 · centerWrap/centerSlot
  ArcOverlayCard.tsx          # 카드 셸 정본
  ArcOverlayTitleHeader.tsx
  ArcOverlayFooterActions.tsx
  overlayPanelLayout.ts       # 높이·bias 상수
  content/                    # kind별 Content
  phosphorOverlayStyles.ts    # 공통 본문 스타일
tools/ui-overlay-audit/       # 통합 감사
.cursor/rules/arcfire-overlay-ui-contract.mdc  # 에이전트 계약
```

---

**다음 권장 작업**: Phase A1~A3 (결과·보상·알림 footer 통일) → Phase B1 MetaBlock 추출.
