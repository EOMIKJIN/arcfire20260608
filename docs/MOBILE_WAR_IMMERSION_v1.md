# 모바일 전쟁 몰입 — 여운·카피·뉴스 (v1)

> **문서 버전**: v1.0  
> **작성**: 2026-10-03 · 김팀장  
> **상태**: **P0+P1 반영** (2026-10-03) · 전투 롤·CSV 보호창 불변  
> **승인 취지**: 대표님 — PC 4X 완결이 아니라 **모바일에서 전쟁을 심플하게 느끼게**. 초반 3분과 같은 무게로 몰입 여운을 반영.  
> **전쟁 정본**: **스텔리움 연합 ↔ 크림슨 레기온**. 블루/레드는 **시각 표기**(지도 색·국경·아이콘)이지 국가명이 아님.  
> **교차**: `docs/EARLY_STORY_AND_QUEST_SPINE.md` §2-1 · `docs/튜토리얼_시스템.md` §0 · `src/world/megaFactionNationPolicy.ts` · `src/arcCore/territorial/*` · `src/store/barBoardStore.ts`

```text
[pss-pre-dev] hot_path=일 1회 배치 말미 공지 0~1건 · 편입/점유 알림은 기존 overlay 1장
[pss-pre-dev] alloc=공지 객체 1 · i18n 키 조회 · persist는 barBoard 기존 캡(20/200)
[pss-pre-dev] cache=없음 · planetMemo 신규 금지 · 전 행성 루프 뉴스 금지
[pss-pre-dev] stage=타이틀·intro01·L0·차원항로에서 overlay 금지(기존 skip 유지·강화)
[pss-pre-dev] verdict=PASS — 카피·presentKind·바 공지 1줄만. 전투 롤·보호창·전술그래프 없음
```

---

## 0. 한 줄

규칙을 키우지 않는다. **이미 돌아가는 전쟁**을 초반 3분과 같은 밀도로, 한 문장·한 색·한 뉴스로 읽히게 한다.

플레이어가 외울 문장은 이것뿐이다.

> 스텔리움 연합과 크림슨 레기온이 지금 싸우고 있다.  
> 파란 깃발은 스텔리움, 붉은 깃발은 크림슨이다.  
> 내가 편입해도 전선이면 다시 밀릴 수 있다.

---

## 1. 잠긴 원칙 (구현이 뒤집지 말 것)

### 1-1. 세 계층 — 섞지 않는다

| 계층 | 이름 | 플레이어에게 | 코드·에셋 | 이번 스프린트 |
|------|------|-------------|-----------|----------------|
| **A. 세계** | 스텔리움 연합 / 크림슨 레기온 | 대사·알림·뉴스·편입 문장 | `resolveNationDisplayNameForMapSide` | **문장 정본** |
| **B. 시각** | 블루 팩션 / 레드 팩션 | 지도 색 `#4EA3FF` / 크림슨 레드, 국경, 클랜 플레이트 | `clan_map_faction_color_policy` · side=`blue`/`red` | **유지** |
| **C. 내부** | `BLUE`/`RED` · `blue_team` vault | 안 보임 | hold 키 · CSV · store | **개명 금지** |

**「블루팀」「레드팀」** 은 국가가 아니다. 과거 짧은 표기 잔재다. **줄이거나 보수적으로만** 남긴다. 전투 HUD·함대 슬롯 색 재설정은 **향후 전투 시스템 개선**에서 한다. 이번 문서가 전투 규칙을 리셋하지 않는다.

남부 머큐리움 · 북부 아우렐리움은 **초반 문장에 넣지 않는다.** 전쟁 초점은 2국이다.

### 1-2. 복잡도 금지

| 금지 | 이유 |
|------|------|
| `protectNeutralizedMs` 켜기 · 신규 보호 타이머 | 규칙 추가. CSV 기존값 `0` 유지 |
| `GalaxyTacticalGraph` · 다홉 · 4국 외교 UI | PC 복잡도 |
| 실시간 시세·장부 팝업 | 숙제화 |
| 일일 배치를 틱으로 쪼개기 | 헌법 · 초반 3분 저격 |
| `TerritorialPassDecision` 값 추가 | 전투 롤 변경. 표현만 `presentKind` |
| 타이틀·intro01·L0에 점유/경제 overlay | 초반 3분 전면 도둑질 |
| 내부 id `blue`/`red` 전면 rename | 시각 계층을 부숨 |

### 1-3. 초반 3분 = 몰입과 동일 우선순위

`docs/튜토리얼_시스템.md`: 최초 허브에서 **튜토리얼이 유일한 전면**.  
`intro01` 3페이지가 이미 전쟁을 건다. **새 비트를 끼워 넣지 않는다.**

초반 180초(체감 L0)에 허용되는 전쟁 정보는 **이미 있는 인트로 문장과 지도 색**뿐이다.  
편입 여운·점유 팝업·경제 뉴스는 **세계가 열린 뒤**다.

---

## 2. 표현 계약 — `presentKind`

전투 롤(`battle` / `neutral_declare` / `status_quo`)은 그대로 둔다.  
알림·바 뉴스만 아래 4종으로 **읽는다.**

| presentKind | 언제 (기존 값에서 유도) | 플레이어 한 단어 | 문장 동사 |
|-------------|-------------------------|------------------|-----------|
| `battle` | `decision==='battle'` 그리고 실효 모드가 접전(`blue_red`) 또는 독립국 침공 | **전투** | 공격했다 / 막아냈다 |
| `seize` | `decision==='battle'` 그리고 실효 모드가 단측(`blue_neutral` / `red_neutral`) | **접수** | 저항 없이 접수했다 |
| `declare` | `decision==='neutral_declare'` | **선언** | 중립을 선포했다 |
| `quiet` | `decision==='status_quo'` | **소강** | 교전이 없었다 |

유도 함수(신설 예정, 순수·틱 금지):

```text
resolveTerritorialPresentKind({ decision, combatMode })
```

- `combatMode`는 이미 `resolveEffectiveTerritorialCombatMode`가 낸 실효값.  
- notify 호출부에 인자 1개만 추가. hold/롤/가중치 불변.  
- 독립국 침공은 함대가 맞붙으므로 `battle` 유지.

`news.territorialHold.decision.*` 는 **롤 키를 유지**하고, 표시 문구만 presentKind로 고른다.

| i18n (현행 → 목표) | 현행 | 목표 |
|--------------------|------|------|
| `news.territorialHold.decision.battle` | 전투 | **쓰지 않음** (presentKind로 분기) |
| `news.territorialHold.decision.neutral_declare` | 전투 | **쓰지 않음** |
| `news.territorialHold.decision.seize` (신규) | — | 접수 |
| `news.territorialHold.decision.declare` (신규) | — | 선언 |
| `news.territorialHold.decision.battle` (유지·전투만) | 전투 | 전투 |
| `news.territorialHold.decision.status_quo` | 현상 유지 | 소강 |

바 본문 예:

- 접전: `{planet} — 스텔리움 연합 → 크림슨 레기온 (전투)`  
- 단측: `{planet} — 중립 → 크림슨 레기온 (접수)`  
- 선언: `{planet} — 스텔리움 연합 → 중립 (선언)`

---

## 3. 작업 패키지 (구현 순서)

모바일은 **앞 화면이 곧 규칙**이다. P0 카피가 먼저, P1 뉴스가 다음이다.

### P0 — 문장·여운 (복잡도 0)

플레이어가 읽는 모든 점유/편입 문장을 계층 A로 맞춘다. 색은 계층 B.

#### P0-A. 국호 표시

`showTerritorialOccupationChangeAlert.sideLabelKo` 는 지금 `territorial.side.blue` = **블루팀**.  
`formatTerritorialBattleAlertCopy.nationLabel` 은 이미 국호. **후자로 통일.**

| 키 | 현행 ko / en | 목표 | 비고 |
|----|----------------|------|------|
| `territorial.side.blue` | 블루팀 / Blue Team | **스텔리움 연합 / Stellium Alliance** | 폴백 키. 가능하면 `resolveNationDisplayNameForMapSide` 직접 |
| `territorial.side.red` | 레드팀 / Red Team | **크림슨 레기온 / Crimson Legion** | 동일 |
| `territorial.side.neutral` | 중립 | 유지 | |
| `territorial.side.independent` | 독립국 | 유지 | |

`noticeText.ts` `news.territorialHold` 의 `prevLabel`/`nextLabel` 도 국호 함수. `territorial.side.*` 문자열에 의존하지 말 것.

#### P0-B. 알림 제목·본문 (전투 vs 접수 vs 선언)

| 키 | 현행 문제 | 목표 ko (1안) |
|----|-----------|----------------|
| `territorial.alert.neutralTitle` | 「접전지역 — 전투 결과」 | **전선 — 중립 선언** |
| `territorial.alert.neutralBody` | 「전투가 발생했습니다」 | `{planet}에서 중립이 선언되었습니다.\n점유: {prev} → {next}` |
| `territorial.alert.battleTitle` | 단측도 이 제목 | **전선 — 전투 결과** (`presentKind==='battle'`만) |
| `territorial.alert.seizeTitle` (신규) | — | **전선 — 무혈 접수** |
| `territorial.alert.seizeBody` (신규) | — | `{planet} — {next}이(가) 저항 없이 접수했습니다.\n점유: {prev} → {next}` |
| `territorial.alert.changeTitle` | 「점령 변경」 | **전선 — 점유 변경** |
| `territorial.alert.resultLabel` | 전투 결과 | `battle`만 「전투 결과」. `seize`는 「접수 결과」 |
| `territorial.alert.maintainedNeutralDeclareTitle` | 「전투 결과」 | **전선 — 선언** |
| `territorial.alert.maintained.diplomaticBody` | 「전투가 발생」 | `{planet}에서 선언이 있었으나 {side} 점유가 유지되었습니다.` |
| `territorial.alert.statusQuoTitle` | 접전지역 | **전선 — 소강** (본문 유지) |
| `news.territorialHold.title` | 접전지역 점령 변경 | **전선 — 점유 변경** |

「접전지역」은 모드가 진짜 접전일 때만. 그 외는 **전선**(짧은 모바일 단어).

`formatTerritorialBattleAlertCopy` 는 `presentKind==='battle'` 전용. 단측은 이 함수를 타지 않는다.

#### P0-C. 편입 여운 — 규칙 아님, 문장

`protectNeutralizedMs=0` **유지.** 보호창은 엔드/전투 재설정 때 재논의 (`docs/엔드콘텐츠_개발계획.md`).

| 키 | 현행 | 목표 ko (1안) |
|----|------|----------------|
| `stelliumAnnex.hint.ready` | 블루 금고로 … | 방위위성 확인. **스텔리움 연합 금고**로 편입합니다. |
| `stelliumAnnex.confirmBody` | 비용: 블루 금고 | 이 행성을 **스텔리움 연합** 영토로 편입합니다.\n전선에 남아 있으면 **크림슨 레기온이 다시 밀고 올 수 있습니다.**\n\n비용: 스텔리움 연합 금고 {cost} |
| `stelliumAnnex.successBody` | 블루 국경이 움직입니다 | 스텔리움 연합 깃발이 올랐습니다. 지도의 **푸른 국경**이 움직입니다.\n전선이면 크림슨이 다시 접수할 수 있습니다. |
| `stelliumAnnex.reason.vault_short` | 블루 금고 잔액 | 스텔리움 연합 금고 잔액이 부족합니다. |

성공 팝업은 **기존 `showArcAlert` 1장**만. 초 보호 타이머·두 번째 토스트 없음.

시각: 확인/성공 카드의 악센트는 기존 블루. 문장은 국호, 색은 블루.

#### P0-D. 보수적 잔존 (의도적)

아래는 **팀 호칭을 국가로 쓰지 않는 선**에서 남겨도 된다. 일괄 치환 금지.

| 위치 | 처리 |
|------|------|
| vault 키 `blue_team` / store 파일명 | 내부. 유지 |
| 경제 패널 `econSnap.blueVault` | P0에서 **스텔리움 연합 금고**로만 교체. 「블루팀」 삭제 |
| CSV notesKo `블루팀 공용 금고 시드` | 개발자 메모. 이번 스프린트 비대상 (기존값 재확인 대상) |
| `clan_map_faction_color_policy` notesKo | 개발자 메모. 비대상 |
| 전투 HUD 「블루/레드」 슬롯 색 | **향후 전투 개선**. 이번 금지 |
| `systemText.ts` 블루팀 스트립 | 유지(레거시 설명 청소) |

### P1 — 경제는 장부가 아니라 뉴스 한 줄

플레이어에게 시세표·5축 잔액을 보여 주지 않는다.  
**일 1회, 바 공지 1줄, overlay 없음.**

#### 신호 (둘 중 우선 1개)

| 우선 | 조건 (배치 말미, 이미 계산된 값만) | 키 | 본문 1안 |
|------|-------------------------------------|----|----------|
| 1 | 그날 convoy miss가 지배적이거나 `windowConvoyTrips===0` 이고 전날 대비 끊김 | `news.warPulse.convoyCut` | **크림슨 전선 쪽 선단이 끊겼습니다.** 항로가 조용합니다. |
| 2 | 그날 블루 금고 `stellium_annex` 지출이 있을 때만 (잔액≥8000 매일 공지는 스팸이라 제외) | `news.warPulse.vaultAnnex` | **스텔리움 연합 금고가 편입을 받치고 있습니다.** 푸른 깃발이 버팁니다. |
| — | 둘 다 아니면 | **공지 없음** | 침묵이 기본 |

숫자·퍼센트·행성 목록·오펙스 표 **금지.**  
선단이 스텔리움 쪽인지 크림슨 쪽인지 코드가 단정할 수 없으면 **「전선 쪽 선단」** 으로 약화 (1안의 크림슨 귀인은 진단이 항로/동부를 가리킬 때만).

#### 합류 슬롯

- `runArcCoreDailyOpsBatch` **마지막**, 기존 convoy 정산·금고 일일 요약 **이후**.  
- `publishWarPulseNotice({ kind, kstDayKey })` → `pushOrRefreshNotice(..., 'war_pulse_'+dayKey)`.  
- tag=`economy`. 하루 1키로 덮어쓰기.  
- `shouldSkipWorldOpsNotificationAlert()` 이면 **푸시 자체를 스킵하지 말고** 보드에만 넣고 overlay는 원래 없음.  
- 부트·onBoot·렌더·useMemo 경로 **진입 금지**.

#### 초반 3분 게이트 (P1 필수)

| 구간 | 전쟁 overlay | 전쟁 바 공지 |
|------|--------------|--------------|
| 타이틀 · intro01 · 캐릭터 생성 | 금지 (현행 skip) | hydrate만, 자동 팝업 없음 |
| L0 강제 가이드 / `isPreHubWorldOpsAlertSuppressed` | 금지 | 보드 적재 가능, HUD 뱃지 점멸 금지 |
| 차원항로 | 금지 | 금지(도착 후) |
| 신규 계정 허브 체감 180초 | **점유 overlay 억제** | 보드만. 튜토리얼 전면 유지 |
| 세계 오픈 후 (L1+) | 현행 — 허브·지도에서 점유 1장 | 일 1줄 |

신규 180초: 기존 `shouldSkipTerritorialOccupationAlert` 는 허브 도착 후 점유 팝업을 **허용**한다.  
P1에서 **신규 L0 미완료**이면 점유도 바 보드만 (`shouldSkipWorldOpsNotificationAlert`와 같은 허브 잠금). 복귀 유저(튜토리얼 완료)는 현행 유지.

구현 훅 후보(신규 스토어 금지): `hasPlanetHubWorldOpsNotifyUnlocked()` 또는 튜토리얼 완료 플래그. **persist 키 신설 금지** — 있는 플래그만.

---

## 4. 초반 3분 — 전쟁 연출 체크리스트

인트로·튜토리얼 **원문 교체는 별도 승인.** 이번 스프린트는 **침범하지 않기**.

| # | 확인 | 합격 |
|---|------|------|
| 1 | `intro01` 3페이지가 스텔리움·크림슨·아크코어 침공을 말함 | 유지. 블루팀 단어 없음 |
| 2 | L0 중 점유/경제 overlay 0 | P0 게이트 유지 + P1 L0 강화 |
| 3 | 첫 허브에서 지도 색만으로 양측이 읽힘 | 색 정책 불변 |
| 4 | 편입 버튼·여운 문장은 L0에 등장하지 않음 | 시설 잠금 현행 |
| 5 | 바를 열기 전에 경제 뉴스 팝업 없음 | P1 overlay 없음 |
| 6 | 초반 대사에 머큐리움·아우렐리움·4X 용어 없음 | 유지 |

초반 3분의 전쟁 몰입은 **새 시스템이 아니라 방해하지 않는 것**이다.

---

## 5. 파일 지도 (구현 시만)

| 패키지 | 파일 | 하는 일 |
|--------|------|---------|
| P0 | `src/i18n/locales/ko.ts` · `en.ts` | 키 교체·신규 seize/declare/warPulse |
| P0 | `src/i18n/noticeText.ts` | 국호 + presentKind 라벨 |
| P0 | `src/arcCore/territorial/showTerritorialOccupationChangeAlert.ts` | sideLabel=국호, seize 분기 |
| P0 | `src/arcCore/territorial/territorialBattleAlertCopy.ts` | battle 전용 유지 |
| P0 | `src/arcCore/territorial/publishTerritorialHoldChangeNotice.ts` | presentKind 파라미터 |
| P0 | `src/arcCore/territorial/runTerritorialCombatPass.ts` | notify에 combatMode만 전달 (롤 불변) |
| P0 | `src/ui/overlay/content/PlanetEconomyInfoOverlayContent.tsx` | 성공 알림은 기존 1장. 카피만 |
| P0 | 순수 테스트 `resolveTerritorialPresentKind.test.ts` | 4분기 |
| P1 | `src/arcCore/economy/publishWarPulseNotice.ts` (신설, RN 분리) | 보드 1줄 |
| P1 | `src/arcCore/schedule/runArcCoreDailyOpsBatch.ts` | 말미 1회 호출 |
| P1 | territorial alert gate 또는 worldOps 잠금 | 신규 180초/L0 점유 overlay 억제 |
| — | `tables/balance/stellium_annex_policy.csv` | **금지** (`protectNeutralizedMs` 유지) |
| — | 전투 Skia / 웨이브 HUD | **금지** |

기존값: 위 i18n·표시 분기는 **본 문서 = 대표님 승인**.  
CSV 가중치·편입 비용 8000·금고 시드·색 hex는 **비대상**.

---

## 6. 수락 기준 (완료 선언)

| # | 기준 |
|---|------|
| 1 | 점유 알림/뉴스에 「블루팀」「레드팀」 없음. 국호만 |
| 2 | 단측 전이는 「접수」, 중립 롤은 「선언」, 접전만 「전투」 |
| 3 | 편입 확인·성공에 전선 재탈취 한 문장. 타이머·보호창 없음 |
| 4 | 금고 비용 문구는 「스텔리움 연합 금고」. 카드 악센트는 블루 |
| 5 | 경제 뉴스는 일 0~1줄, 바 보드, 숫자 없음, overlay 없음 |
| 6 | 타이틀·intro01·L0·항로에서 점유/경제 overlay 0 |
| 7 | 신규 허브 180초/튜토리얼 중 점유 overlay 0 (복귀 유저는 현행) |
| 8 | `protectNeutralizedMs===0` · 전투 롤 테스트 기존 PASS |
| 9 | `npx tsc --noEmit -p tsconfig.client.json` · 신규 순수 테스트 PASS |
| 10 | 부트 동기 경로에 뉴스/전 행성 진단 루프 없음 |

---

## 7. HOLD (나중에)

| 항목 | 이유 |
|------|------|
| 편입 후 `protectNeutralizedMs` | 규칙. 엔드/전투 재설정과 같이 재확인 |
| 전투 HUD 블루/레드 슬롯명 | 대표님: 향후 전투 시스템에서 재설정 |
| 4국 이름을 초반 뉴스에 | 전쟁 초점 희석 |
| 선단 끊김을 크림슨 귀인으로 단정 | 진단이 항로를 가리킬 때만 P1 허용, 아니면 약화 문장 |
| 오퍼레이터 장문·2차 메신저로 전쟁 브리핑 | 초반 3분·대화 게이트와 충돌 |
| GalaxyTacticalGraph | PC 복잡도 |

---

## 8. 구현 착수 문장 (김팀장 세션)

```text
P0+P1 반영 완료 (2026-10-03).
전투 롤·CSV 보호창·Skia HUD 불변.
신규 180초 타이머 없음 — tutorialComplete 미러만.
```

---

## 9. 기존값 변경 기록 (구현 커밋에 한 줄)

```text
[existing-value-change] i18n territorial.side / annex success·confirm / territorial.alert* · 본 문서 승인
[existing-value-change] CSV 없음 · protectNeutralizedMs 0 유지
```
