# 2026-08-05 — i18n 전수 재조사·오류 수정·최적화

> 김팀장 · 기준: `I18N_FULL_RESCAN_2026-08-03` + 금일 보완분 재검증

## [pss-pre-dev]

```text
[pss-pre-dev] hot_path=locale hydrate / t() / content resolvers · alloc=none per tick · cache=module dict
[pss-pre-dev] stage=settings·콘텐츠 리더·스킬 UI · risk=P3
[pss-pre-dev] verdict=PASS
```

## 재조사 결과

| 게이트 | 결과 |
|--------|------|
| KO/EN 키 패리티 | **1258/1258 · only 0 · param 0 → PASS** |
| EN 값 한글 | 1건 의도 (`settings.section.language`) |
| 리터럴 `t()` 누락 키 | 실질 0 (`battleStance.`/`noticeTag.` 는 템플릿 오탐) |
| `audit:i18n` 잔여 | **~211 라인 / 75 파일** (대부분 LEGACY/DEV/SEED/KO_MATCHER) |

## 이번 턴 수정 (오류)

1. **skillText 버그** — `locale === 'en'`만 EN 사전. pending(`ja` 등)이 **KO 스킬**로 떨어지던 회귀 → `resolveDictionaryLocale` 사용.
2. **콘텐츠 locale 판정 통일** — `isKoUi()` 도입 후 item/mission/profession/ship/system/story/equip/classification/dialog 에 적용. pending → EN 콘텐츠 정합.
3. **locale hydrate** — 저장된 ja/zh/es/de → **`en`으로 정규화·재영속**. `setLocale`은 완전 번역(ko/en)만 허용.

## 최적화

| 항목 | 내용 |
|------|------|
| `isKoUi` | 사전·CSV EN 선택 단일 진입점 |
| `npm run audit:i18n` | **패리티 섹션 통합** (FAIL 시 exit 1) · `latest.md` 갱신 |
| `_full-rescan.cjs` | 키 커버리지 보조 스캐너 |

## 잔여 분류 (의도적)

| 분류 | 예 |
|------|-----|
| LEGACY_MIGRATE | `tavernBoardStore` 구형 KO title 매칭 |
| DEV_CONSOLE | `PlanetEdenRaidTestLayer` · territorial pass 로그 |
| DATA_SEED | weaponCatalog · ships · galaxy100 |
| KO_MATCHER | `systemText` synth 한국어 원문 매칭 |

## 검증

```bash
npm run audit:i18n          # 패리티 PASS + 잔여 리포트
npx tsc --noEmit -p tsconfig.client.json
```
