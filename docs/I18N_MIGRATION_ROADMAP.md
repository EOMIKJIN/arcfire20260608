# Arcfire i18n(영어 전환) 마이그레이션 로드맵

> 목적: 게임의 **모든 UI 텍스트 + 스토리**를 언어 설정으로 전환(우선 영어). 한 번에 전부는 위험하므로 **단계별 치환 + 매 단계 검수**.

## 기반(완료)

- **런타임**: `src/i18n/index.ts` — `t(key, params)` / `useT()` 훅, `{param}` 보간, `ko → en → key` 폴백.
- **로케일 store**: `src/store/appSettingsStore.ts` — locale·BGM·SFX, AsyncStorage 영속·부트 hydrate.
- **설정 UI**: `SettingsOverlayContent` — 언어 선택 즉시 반영(7개 로케일, 완전 사전 ko/en).
- **스토리 파이프라인**: `story_scene_pages.csv`에 `text_en`/`label_en` 병렬 컬럼 → 생성기 emit → `resolveStoryPage*`(`src/i18n/storyText.ts`) 리더가 locale 선택. **인트로 컷신 + 전 NPC 대사 + 미션완료 67페이지 영어 번역 완료.**
- **검수 스캐너**: `npm run audit:i18n` → `tools/i18n-audit/reports/latest.md` (코멘트 제외 사용자 노출 한국어 잔여 라인·파일 측정).

## 진행률(스캐너 기준)

- 기준선: **723라인 / 94파일** → 현재 **711 / 94** (설정 UI 치환 반영).
- 스토리(CSV)는 스캐너 집계 밖 — 별도로 67/67 페이지 EN 완료.

## 잔여 UI 단계(우선순위 · 스캐너 상위)

| 단계 | 대상 파일 | 잔여(약) |
|---|---|---|
| P1 | `app/(game)/shipyard.tsx` + `ShipyardMineralUpgradeTab` | ~118 |
| P2 | `app/(game)/trade.tsx` + `TradeQuantityOverlayContent` | ~68 |
| P3 | 행성 개발/방위위성 오버레이(`PlanetDefenseSatelliteDevContent` 등) | ~85 |
| P4 | `app/(game)/worldmap.tsx` · `combat.tsx` · `planet.tsx` 잔여 HUD | ~70 |
| P5 | 경제 정보·뉴스보드·tavern·nickname·미션(`missions.ts`) | ~120 |
| P6 | 콘텐츠 이름(아이템/무기/함선 CSV) — 별도 `*_en` 컬럼 파이프라인 | 대량 |

## 단계별 절차(고정)

1. 대상 파일의 한국어 문자열 → `t('domain.key')` 치환, `ko.ts`/`en.ts` 키 추가.
2. `npx tsc --noEmit -p tsconfig.client.json` PASS.
3. `npm run audit:i18n` 잔여 감소 확인 + `npm run audit:ui-overlay` PASS.
4. 실기에서 언어 토글 → 해당 화면 영어 전환 육안 검수.

## 콘텐츠(CSV) 이름 번역 패턴

스토리와 동일하게 **병렬 `*_en` 컬럼 + locale 리더**를 표준으로 한다(런타임 CSV 정본 비파괴 — 헌법 §14). 아이템/무기/함선/미션은 각 생성기에 `nameEn`/`descEn` emit 추가 후 조회부에서 locale 선택.
