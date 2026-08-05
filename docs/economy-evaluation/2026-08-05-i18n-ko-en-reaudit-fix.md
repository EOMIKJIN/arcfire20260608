# 2026-08-05 — i18n KO↔EN 재검수·보완

> **담당**: 김팀장 · 기준 감사 `docs/I18N_FULL_RESCAN_2026-08-03.md`

## [pss-pre-dev]

```text
[pss-pre-dev] hot_path=settings locale toggle / tavern board render · alloc=dictionary lookup only · cache=module dict
[pss-pre-dev] stage=settings overlay · tavern · combat stance row · continue loading · risk=P3
[pss-pre-dev] verdict=PASS
```

## Verdict

| 항목 | 결과 |
|------|------|
| KO/EN 키 패리티 | **1245 / 1245 · onlyKo/onlyEn 0 · param mismatch 0** |
| `tsc` | **PASS** |
| `audit:i18n` 잔여 | **320 → ~220** 라인 · **90 → ~81** 파일 |
| 설정 locale | 완전 번역 **ko/en만** 노출 · pending → **EN 사전** |

## 구조 최적화

1. **사전 locale** — `resolveDictionaryLocale`: `ko` 외 전부 EN (ja/zh 위장 KO 제거).
2. **공지 태그** — `TavernNoticeTag`를 `ops|economy|diplomacy|rumor|arccore` 코드로 통일 · 로드 시 구형 KO 태그 migrate · `noticeTag.*` 이중 키 유지.
3. **장비 스탯** — `equip.stat.*` 사전 수렴 (`shipEquipmentDisplay`).
4. **전투 태세** — 라벨을 `battleStance.*`로 분리 (`BATTLE_STANCE_META`는 color만).

## 사용자 UI 보완 (이번 턴)

| 영역 | 키/파일 |
|------|---------|
| 클라우드 백업 | `backup.*` + `GameSaveBackupSection` |
| 뉴스/공지 폴백 | EN fallback + i18nKey (`ArcNewsBoard` · nebula · expansion · territorial · PGP) |
| 계정 초기화 | `settings.reset.progress/error.*` |
| 인게임 다이얼로그 버튼 | `dialog.comm/next/ok` |
| 이어하기 로딩 | `session.continue.*` |
| 무역 아이콘 a11y | `a11y.itemIcon` |

## 잔여 (의도적·후속)

| 성격 | 예 |
|------|-----|
| 레거시 마이그레이션 매칭 | `tavernBoardStore` KO title 매칭 (~23) |
| DEV/콘솔·데이터 시드 | `PlanetEdenRaidTestLayer` · `weaponCatalogSeed` · `registry` |
| KO 원문 매칭 리더 | `systemText` synth 설명 매칭 |
| CSV `*_en` 공란 | 콘텐츠 파이프라인(별도) |

## 검증

```bash
node tools/i18n-audit/_parity-check.cjs   # 1245/1245 · paramMism []
npx tsc --noEmit -p tsconfig.client.json
npm run audit:i18n
```

설정에서 **한국어 ↔ English** 토글 후: 설정 백업 섹션 · 선술집 공지 태그 · 전투 태세 · 이어하기 로딩 문구 육안 확인 권장.

## Follow-up (서브에이전트 §6 UI 기본 라벨)

| 항목 | 키 |
|------|-----|
| NarrativeDialog `[ 다음 ]` | `common.next` |
| LevelUp `[ 확인 ]` / title | `common.confirm` · `levelUp.cardTitle` |
| ArcStageBackButton | `common.back` |
| alert 기본 버튼 | `common.confirmBare` |
| Relic 제목 접두 + EN 신명 | `relic.title` · `godNameEn` from world node |

유물 **비문 본문** EN은 CSV `loreBodyEn` 미도입 — 후속 Table-First.
