# 2026-08-03 — i18n·번역 시스템 전수 조사 검수 보고서

> **작성**: 김팀장(분석 세션 · Composer/글록 — **코드·번역 문구 수정 없음**)  
> **범위**: `src/i18n/**` · locale 사전 · content `*_en` 파이프라인 · 하드코딩 잔여 · `npm run audit:i18n`  
> **판정 요약**: **KO↔EN UI 키 패리티 PASS · 중복 키 0 · 내용 품질 양호 · EN 사용자 노출 하드코딩·다국어 위장 P0**

---

## 0. Executive Verdict

| 층 | 판정 | 근거 |
|----|------|------|
| UI 사전 키 대칭 (ko/en) | **PASS** | 각 **1,180** 키 · onlyKo/onlyEn **0** |
| 파일 내 중복 키 | **PASS** | 0 |
| KO/EN 파라미터 `{…}` 대칭 | **거의 PASS** | **1건** 불일치 (`news.megaFactionPgp.body`) |
| EN 빈 값 / KO 덤프 | **PASS** | 빈 값 0 · EN 한글 포함 **1**(의도: Language 섹션) |
| skill EN | **부분** | `skillEn` **135** 키를 EN만 병합 · KO는 CSV |
| 사용자 UI EN 완성도 | **FAIL/진행중** | `audit:i18n` 잔여 한글 **311라인 / 87파일** |
| ja/zh/es/de | **위장** | 설정에 표시되나 사전 없음 → **KO 폴백** |
| 프로세스 | **WARN** | 스캐너는 한글 잔여만 · 키/인자 패리티 CI 없음 |

---

## 1. 아키텍처 (정본)

### 1.1 런타임
| 모듈 | 역할 |
|------|------|
| `src/i18n/index.ts` | `t` / `useT` / `translate` · i18next 없음 |
| `src/i18n/types.ts` | `I18nDictionary = Record<string, string>` — **키 타입 유니온 없음** |
| `locales/ko.ts` · `en.ts` | UI 크롬 정본 |
| `locales/skillEn.ts` | EN에만 `...SKILL_EN` 스프레드 |
| `appSettingsStore` | locale 영속 · 기본 `ko` |

**해석 순서**: 현재 locale 사전 → `KO` → `EN` → **키 문자열 그대로 표시**.  
**보간**: `{param}` 만 · 누락 시 `{param}` 잔존.

### 1.2 콘텐츠 이중 파이프라인
| 층 | 방식 |
|----|------|
| UI | `t('domain.key')` |
| 스킬 | KO=CSV · EN=`skill.*` |
| 스토리 | CSV `text_en`/`label_en` → `storyText.ts` |
| 아이템·함선·행성·직업·미션 | CSV `name_en` 등 → 각 `*Text.ts` |
| 뉴스 보드 | `i18nKey` + `noticeText` (일부만) |

### 1.3 locale 정책
- `SUPPORTED_LOCALES`: ko · en · ja · zh-CN · zh-TW · es · de  
- **완전 번역**: ko · en 뿐. 나머지 선택 시 **사실상 한국어 UI**.

---

## 2. 사전 통계 (2026-08-03 실측)

| 소스 | 키 수 |
|------|------:|
| `ko.ts` | 1,180 |
| `en.ts` (라인 키, skill 제외) | 1,180 |
| `skillEn.ts` | 135 |
| KO only / EN only (non-skill) | **0 / 0** |
| `{param}` 불일치 키 | **1** |
| EN 값 내 한글 | **1** (`settings.section.language`) |
| `audit:i18n` 한글 잔여 | **311** 라인 · **87** 파일 |

### 네임스페이스 (KO 상위)
shipyard · tavern · planetDev · trade · bmShop · researchLab · worldmap · defenseSat · econInfo · combat · territorial …

로드맵(`I18N_MIGRATION_ROADMAP.md`)의 711/94·shipyard 118 잔여 수치는 **구식** — 현재 잔여 중심은 **backup / tavern 시드 / news board / equipment**.

---

## 3. 오류·중복·용어 정밀

### 3.1 파라미터 불일치 (실측 1건)
| 키 | KO | EN |
|----|-----|-----|
| `news.megaFactionPgp.body` | `{blueNation}` `{redNation}` … | `{blueNationEn}` `{redNationEn}` … |

호출부에서 4개 모두 넘기면 동작·하지 않으면 **한 locale에서 `{…}` 노출**. 권장: locale 선해석 후 공통 키.

### 3.2 용어 불일치 (오타 아닌 **기획 불통일**)
| 개념 | 혼용 예 | 권장 1안 |
|------|---------|----------|
| hold | 점유(`zone.occupied`) vs 점령(territorial 알림·뉴스) | UI hold=**점유**, 전투 탈취 순간만 **점령** |
| 블루 표기 | 블루팀 / 스텔리움 연합 / 블루 | 국가명 1회 resolve + short side 키 분리 |
| 독립국 | `독립국` 일치 양호 | 유지 |

### 3.3 중복 키 / 중복 문구
- **동일 키 중복 정의**: 0  
- **의미 중복 문구**: blue/red/independent maintained 바디가 동일 템플릿 — 의도적 복제(유지 OK).

### 3.4 오타·EN 품질
- 고전 영문 오타 스캔: **유의미 히트 없음**.  
- EN 빈 문자열·KO 통째 복사: **0**(스캔 범위 내).

### 3.5 하드코딩 한글 (EN 깨짐 · P0 상위)
`audit:i18n` Top:

| 잔여 | 파일 | 성격 |
|-----:|------|------|
| 29 | `GameSaveBackupSection.tsx` | 클라우드 백업 UI 전부 KO |
| 26 | `tavernBoardStore.ts` | 보드 시드·제목 KO 매칭 |
| 18 | `ArcNewsBoardSubCore.ts` | 아크 뉴스 푸시 KO |
| 18 | `shipEquipmentDisplay.ts` | 장비 스탯 라벨 KO |
| 15 | `PlanetEdenRaidTestLayer.tsx` | 전투/테스트 라벨 (혼합) |
| 14 | `runTerritorialCombatPass.ts` | DEV console 위주 |
| 12 | `weaponCatalogSeed.ts` · `stages/registry.ts` | 데이터/레지스트리 |

기타: NarrativeDialog `[ 다음 ]` · LevelUp `[ 확인 ]` · Back `◀ 나가기` · Relic 알림 등 오버레이 기본값.

### 3.6 콘텐츠 CSV
- item `name_en` 일부 공란 보고(이전 스캔 ~22) — EN이면 KO 폴백.  
- mission `titleEn` / 함선 template EN 부분 하드코딩(`shipText` 소수).

---

## 4. 프로세스 갭

| 항목 | 상태 |
|------|------|
| `npm run audit:i18n` | 한글 **라인 수**만 · 키 패리티·param·빈 EN **미검사** |
| tsc 키 타입 | 없음 — 오타는 런타임에 키 노출 |
| 단위 테스트 | 없음 |
| 로드맵 | 수치·우선 파일 구식 |

---

## 5. 권장 조치 (텍스트 · 구현은 Opus/김클로드)

### P0
1. `GameSaveBackupSection` → `settings.backup.*`  
2. `shipEquipmentDisplay` → `equipment.stat.*`  
3. 뉴스/tavern 시드 → `i18nKey` + params (`noticeText` 패턴)  
4. common: `confirm` / `continue` / `back`  
5. Relic 알림 키화  

### P1
6. audit 확장: KO↔EN 키 집합 · `{param}` 집합 · empty EN fail  
7. `news.megaFactionPgp.body` 파라미터 통일  
8. 용어 1안(점유/점령) 표 확정 후 알림 일괄  

### P2
9. item/mission name_en 공란 메우기  
10. 로드맵 residual **311/87** 재기입 · ja 등 미완 로케일 피커 정책(숨김 or “준비중” 강제)  
11. DEV console 한글을 residual 스캔에서 제외(옵션)

---

## 6. 결론

Arcfire 번역 **사전 축은 성숙**하다(1,180 쌍 대칭, 중복·빈 EN·대량 오타 없음).  
남는 문제는 **(1) 하드코딩 KO 잔여가 EN 플레이를 깨는 것**, **(2) 7개 언어 표기 vs 2개 언어 실구현**, **(3) 감사 도구가 패리티를 안 보는 것**, **(4) 점유/점령·블루 표기 용어 불일치**, **(5) PGP body param 비대칭 1건**이다.

*측정 근거: `node` 키 패리티 · `npm run audit:i18n` 2026-08-03T02:28Z · 코드 전수 explore.*
