# Tactical UI — Phase T1 적용·보류 보고 (2026-06-25)

> 기준: `docs/TACTICAL_UI_BASELINE_AND_ROLLOUT_READINESS.md` · `src/ui/overlay/tacticalOverlayRollout.ts`

## 이번 적용 완료

### 메인스테이지 (다크 배경)

| 영역 | 파일 | 내용 |
|------|------|------|
| 액션 타일 | `PlanetHubActionTile.tsx` | G-ARCHIVE 그레이 톤 · primary `#252930` |
| 시설·스탠스·메뉴 버튼 | `planetHubStyles.ts` | 블루→그레이 border/bg, mining 카드 |
| 파일럿 헤더 | `PlanetMainPilotInfoPanel.tsx` | tactical chrome 토큰 |
| 토큰 정본 | `src/ui/tactical/tacticalHubTokens.ts` | 허브 전용 투명도·라인 |

### 오버레이 (kind 플래그 ON)

| kind | 비고 |
|------|------|
| `planetEconomyInfo` | 기존 baseline 유지 |
| `settings` | 카드·footer·오디오·언어 행 tactical |
| `planetDevelopment` | 리스트 셸·행 inset 그레이 (상세 dev 화면 본문은 부분 phosphor 잔존) |
| `tradeQuantity` | 카드·메타·수량 버튼 tactical |
| `waveResult` | 카드·InfoRow·확인 버튼 tactical |

## 보류 (별도 Phase — 디자인 통일 난이도 높음)

| kind | 보류 사유 |
|------|-----------|
| `alert` | 본문 인라인 버튼·가변 메시지 레이아웃 |
| `levelUp` | compact + 레거시 `LevelUpModal` 이중 경로 |
| `reward` | 아이콘·보상 리스트 로컬 phosphor 다수 |
| `bmShop` | `bmShopOverlayStyles` 전용 카드·가격 행 |
| `narrative` | `NarrativeDialogRow` 별도 축 — Card 미통합 |
| `blocking` | 텍스트 only — tactical 카드 불필요 |

### 행성개발 상세 (planetDevelopment 하위)

- `PlanetDefenseSatelliteDevContent` · `PlanetOrbitShipyardDevContent` 등 — 로컬 row/level 스타일 phosphor 잔존
- 전환 시 `planetDevelopmentOverlayStyles` 전면 tactical + `ArcOverlayInfoRow` 통합 필요

## 다음 권장 순서 (T2)

1. `alert` → footer `ArcOverlayFooterActions` 통일
2. `reward` / `levelUp` → 레거시 Modal 제거 후 overlay 단일화
3. `bmShop` · narrative 축
4. `ArcOverlayCard` exclusive style set (phosphor base merge 제거)

## 검증

```bash
npx tsc --noEmit -p tsconfig.client.json
npm run audit:ui-overlay
npm run audit:ui-overlay:tactical-readiness
```

실기: 행성 허브 스캔 행 · 행성정보 · 설정 · 무역 수량 · 웨이브 결과 · 행성개발 리스트.
