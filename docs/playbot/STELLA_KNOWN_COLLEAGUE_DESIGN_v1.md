# 스텔라 「아는 동료」 — 플레이봇 지식 · 행동 관찰 · 능동 인터랙션 설계 (v2)

> **작성**: 김플레이 · 2026-10-06 (v1 18:5x 조언 · **v2 19:2x 관찰·능동 추가**)  
> **지시 1**: 대표님 — 「너의 방향이 맞다. 기존설계를 너가 제안한 아는동료로 모두 설계변경 기획하고 개발에 들어갈 수 있는 상태까지 디테일하게 만든다.」  
> **지시 2**: 대표님 — 「내행동을 판단해 자의식이 있는것처럼 선 질문, 선 연락, 말걸기 등의 능동적 인터랙션 지능이 필요하다. 내행동을 현재처럼 로그로 파악하고 입력 처리하는 기능이 동일하게 있어야, 오직 내가 질문에만 답하는 수동적 아는동료에서 고도화된 스텔라 아리스로 완성될 수 있다.」  
> **구성**: **Part A** 아는 동료 조언(§2–§8) · **Part B** 행동 관찰(§B) · **Part C** 능동 인터랙션(§C) · 공통 단계(§9)  
> **대체**: `docs/character/STELLA_ARIS_PROJECT_LIFE_SYSTEM_v0.2.md` §17 「몸 — 플레이봇 일지」(2026-10-04) 전체. 그 절은 본 문서를 가리키는 요약으로 바뀐다.  
> **상태**: 설계 완료 · **착수는 선행조건(§10) 충족 후 단계별(§9)**. 차기 목록 `PB-STELLA`.  
> **대체하지 않음**: 라이프 슬롯(§3) · §15 숙련 · §16 선제 · 이중 입 D1–D5 · `PB-LIVE` · `PB-CELL`.

---

## 0. 한 줄

**플레이봇이 수천 일을 돌려 검증한 판단 규칙을 표 한 장으로 앱에 넣는다. 대표님이 물으면 스텔라가 대표님의 실제 상태에 그 규칙을 대어 보고, 조언 한 가지를 동료 말투로 말한다.**

봇의 하루를 말하는 「몸의 일지」가 아니다. 봇이 **배운 것**을 대표님 **자신의 상황**에 맞춰 말하는 「아는 동료」다.

```text
[개발 PC]  플레이봇 ─ 트윈 수천 일 ─ 규칙별 효과 검증 ─▶ 규칙표 후보 (tools/…/out)
                                                         │ Fable·대표님 승인 후
                                                         ▼
[정본]     tables/content/stella_play_advice_*.csv  ─ build ─▶ generated TS
                                                         │
[앱]       대표님 실제 상태 ──▶ resolvePlayAdvice(snapshot, table)  (순수 함수 · src/game/playAdvice)
                                                         │ 물었을 때 1회
                                                         ▼
           읽기 도구 get_play_advice ─▶ operator 팩 1줄 ─▶ 기존 LLM 1홉 / 로컬 템플릿
```

같은 `resolvePlayAdvice` 를 플레이봇이 import 해 트윈 상태에 돌린다. **규칙 구현은 한 곳**이다. 앱은 플레이봇을 import 하지 않는다.

### 0-1. 완성형 (v2) — 수동 동료에서 능동 스텔라로

```text
[Part B 관찰]  대표님 행동 ─ emitPlayVerb() → recordPlayerObserve() ─▶ 링 64칸(휘발) + 하루 요약(대화 저장 별도 필드 observe ≤512B)
                (플레이봇 [PLAY_VERB] 와 같은 어휘 · 같은 지점)
                                   │ 결정 순간에만 (허브 진입·전투 복귀·착륙·세션 시작·대화 닫힘)
                                   ▼
[Part C 판단]  상황 인식 detectStellaSituations()  ─▶  동기(걱정·자랑·궁금·환영…)
                × 스텔라 자신의 상태(§3 당직/비번·§15 숙련·§16 동기)  ─▶  말할지 / 참을지
                                   │ 심한 정도 × 지금이 말할 때인가 · 자제 · 학습된 수용도 (예산 없음)
                                   ▼
[말]           선 질문(1차 통신) · 선 연락(메신저 미읽음) · 말걸기(허브 한 줄)
                수락 후 → 기존 1홉 대화. 팩에 관찰 요약 + (필요 시) Part A 조언
                                   │
                                   ▼
[기억]         무엇을 말했고, 대표님이 받았는지·따랐는지·결과가 어땠는지 → 다음 판단에 반영
```

「자의식처럼 보이는 것」은 다섯 가지에서 나온다. **연속성**(어제 본 걸 기억) · **자기 기억**(내가 한 말과 그 결과) · **자기 상태**(바쁠 땐 참음) · **예의**(전투 중엔 안 부름) · **학습**(대표님이 싫어한 종류는 줄임). LLM 을 더 부르는 게 아니라, 판단 재료와 참는 규칙이 많아지는 것이다.

---

## 1. 무엇이 바뀌나 (잠금 개정)

| 항목 | 이전 §17 (2026-10-04) | 「아는 동료」 (본 문서) |
|------|----------------------|------------------------|
| 봇이 주는 것 | 봇 계정의 세션 일지 1줄 (`bodyNote`) | **검증된 판단 규칙표** (CSV) |
| 듣는 사람 | 봇 계정의 스텔라만. 대표님 입은 닫힘 (B3) | **대표님 계정의 스텔라**. 단, 대표님 **자기 상태**로만 판정 |
| 사실 출처 | 봇이 겪은 교전·채굴 | 대표님 플레이어 store (크레딧·레벨·장착·내구도·위치) |
| B1 PC 일지 JSON | 계획 | **폐기** |
| B2 `life.bodyNote` | 계획 | **폐기** (life 3KB 키에 아무것도 추가하지 않음) |
| B3 대표님 입이 봇 일지 읽기 | 닫힘 | **닫힘 유지** — 봇의 사건을 사실로 말하지 않는다. 대신 **봇의 규칙**을 대표님 상태에 적용 |
| B4 스텔라 함·봇 조종 | 닫힘 | **닫힘 유지** |
| D6(c) 제안 id 편향 | 예약 (B 스위치) | **조언 한정 개방** — 입이 「무엇을 하면 좋은지」 말한다. 실행·write 는 여전히 0 (D6(b) 유지) |
| D7 근원체 | 0 | **0 유지** — 근원체(적의 입)는 조언 도구를 받지 않는다 |
| §15-8 신규 LLM 홉·임베딩 | 금지 | **금지 유지** — 기존 1홉에 팩 1줄만 |
| 파인튜닝·봇 로그 학습 | — | **금지** |
| 대표님 행동 관찰 (v2) | 없음 (`[PLAY_VERB]` 는 개발 빌드 전용 logcat) | **출시 앱에 관찰 입력 신설** — 같은 어휘·같은 지점. 단 logcat·파일이 아니라 **메모리 링 + 하루 요약**. 개발 logcat 은 지금처럼 출시 제외 |
| 스텔라 선제 (v2) | §16 — 스텔라 자신의 하루가 동기일 때만, 하루 1회 | **대표님 행동도 동기가 됨** (걱정·자랑·궁금·환영·자기반성). 채널 3종. 횟수 예산 없이 스텔라가 심한 정도와 때를 판단 (§C-4 · 대표님 2026-10-06) |
| §16-2 「전투를 스텔라가 선제로 묻기 불가」 | 전투·스파이·스토리는 근원체 inbound | **개정**: 전투 **보고**는 근원체 그대로. 대표님 **자신의 처지**(연속 파괴·수리 미룸)에 대한 걱정은 스텔라 선제 허용. 스파이·스토리·세계는 근원체 유지 |

**왜 바꾸는가.** 이전 설계는 봇 계정에서만 의미가 있었고(`PB-LIVE` 이후), 대표님이 실제로 얻는 것이 없었다. 봇의 가치는 「무엇을 했나」가 아니라 「무엇이 통하는지 안다」는 데 있다. 그 지식을 대표님 상태에만 적용하면 F15(남의 교전을 사실로 말함)가 구조적으로 생기지 않는다.

### 1-A. 김팀장 검수 잠금 (2026-10-06 20:07 · 방향 채택 · O3·O5 착수 전 필수)

| # | 잠금 | 반영 위치 |
|---|------|-----------|
| 1 | `repair_due` 근거를 G6 이후 실게임으로 — 출격을 막는 건 함체 0% 뿐. 아이템 소멸·슬롯 해제 문장 금지. 샘플 포함 전 행 `enabled=0` 시작 | §3 · §4-1 |
| 2 | hydrate 전 대화 저장 금지 — 가드를 테스트로 고정한 뒤에만 다음 단계 | 코드 `canPersistArcCoreChat` (완료) |
| 3 | 도구 4칸 — 관찰 턴은 최근 행동 → 조언 → 스텔라 지금 → 주제 도구 | §C-5 |
| 4 | 앱에 파괴 방출이 들어가기 전 `rough_day`·`advice_ignored_hurt` `enabled=0` | §C-3 |
| 5 | 근원체 슬롯은 취소 없이 다음 창으로 미룸 · 스텔라 문장에 적·전황 금지 · `quest_stall` 은 목표 이름·공략 금지 | §C-3 · §C-4 |
| 6 | 체류 중 판정 없음 — 예시도 복귀 시점 | §C-1 · §C-3 |
| 7 | ~~선 질문 하루 1회는 라이프 질문과 공유 · 팝업 열림 = 오늘 소진~~ **대표님 개정 (2026-10-06): 횟수 예산 폐지.** 유지 — 다른 팝업 떠 있으면 침묵 · 수락 없이 닫힘 = 무시 1회 | §C-4 |
| 8 | 말걸기 표면은 시안·오버레이 감사 전 금지 · 레이아웃 상수 불변 · 다른 창 열려 있으면 0회 | §C-5 |

Part A 활성 잠금: `hull_ready`·`weapon_first`·`train_band` 는 A-9·A-10·G5 전 `enabled=0`. `trade_route` 는 PB-G2 결정 전 0. 오토모드 0단계가 같은 판정기를 쓰면 호출은 **버튼 누른 순간 1회** — 허브 상시 실행 금지.

---

## 2. 대표님이 겪는 모습

**Part A 조언은 물었을 때만** 말한다. 잡담에는 조언이 끼지 않는다(§0-H). 먼저 말을 거는 것은 Part C 가 맡는다(§C-1 예시).

```text
대표님: 요즘 자꾸 터지는데 뭐부터 해야 돼?
스텔라: 새 함선보다 무장이 먼저야. 여기 무역소에 플라즈마 캐논이 있어, 그거부터 달자.

대표님: 다음엔 어디서 싸우는 게 좋을까
스텔라: 지금 레벨이면 베가 쪽 교전이 맞아. 여기 적은 아직 버거워.

대표님: 오늘 날씨 좋네
스텔라: (조언 없음 — 라이프·일상 대화만)
```

숫자·가격·승률·내부 id 는 말하지 않는다. 이름(행성·아이템 표시명)과 방향만 말한다.

**세계관 근거 (지식 카드 1행)**: 스텔라는 아르카디아 전술 시뮬레이터로 수없이 출격해 본 오퍼레이터다. 「시뮬레이터에서 많이 봤어」 정도로만 말하고, 봇·학습·AI 라는 말은 쓰지 않는다.

---

## 3. 조언 종류 (MVP 6 + 예약 1)

각 종류는 플레이봇 정책의 한 결정에서 나왔다. 활성 여부는 CSV `enabled` 열이며, **플레이봇 검증(§8-3)을 통과한 행만 1** 이 된다.

| kind | 대표님 상태 조건 (판정기 입력) | 플레이봇 근거 | 말 모양 (템플릿 예) | 선행 |
|------|------------------------------|--------------|--------------------|------|
| `repair_due` | **warn**: 함체 `durabilityPct ≤ paramA` (함체 0% 면 출격 불가) · **info**: 장착 아이템 `≤ paramB` | G6 이후 실게임: 아이템 0% 여도 슬롯 유지·무기 작동. 출격을 막는 것은 **함체 0% 뿐** (김팀장 검수 잠금 1) | warn 「출격 전에 수리부터 하자. 이대로면 배가 못 버텨.」 · info 「{item} 상태가 많이 안 좋아. 시간 날 때 손보자.」 — **아이템이 사라진다·슬롯이 빈다는 말 금지** | G6 커밋 후 문장 재확인 |
| `weapon_first` | 장착 레이저/미사일 무기의 요구 레벨 < 현재 무역소의 구매 가능 최상 무기 요구 레벨 − `paramA`, 그리고 크레딧 ≥ 그 무기 가격 | A-9a: 함선 예비금이 무장을 굶겨 파괴 66회 | 「새 함선보다 무장이 먼저야. 여기 {item}부터 달자.」 | A-9a·G4·G5 |
| `gear_empty_slot` | 비무기 장비 칸이 비어 있고, 현재 무역소에 살 수 있는 해당 칸 장비가 있음 | `tryBuyBestGear` · 방어 장비 반영(A-9b) | 「{slot} 칸이 비어 있어. {item} 정도면 지금 살 수 있어.」 | A-9b |
| `skill_open` | `levelRequired ≤ level` 인데 미습득 스킬이 있고 비용 감당 가능 | `tryLearnSkill` | 「배울 수 있는 기술이 남아 있어. {skill}부터 익혀 두자.」 | A-9b |
| `train_band` | 현재 행성이 레벨 밴드 추천 상위 `paramA` 에 없음 | 트윈 교전 효율(밴드별 승률×경험치) | 「지금 레벨이면 {planet} 쪽 교전이 맞아. 여기는 {tooHard\|tooEasy}.」 | A-9b·A-9c·A-10 |
| `hull_ready` | 다음 등급 함선 요구 레벨 충족, 크레딧 ≥ 함선 가격 + 무장 예비 `paramA` 배 | `tryBuyNextHull` (G5 곡선 후 재검증) | 「이제 {ship}으로 올라갈 때야. 무장 살 돈은 남겨 두고.」 | **G5 필수** |
| `trade_route` (예약) | 현재 행성 출발 교역 노선 상위 | `tradeRun` · `tgRunStep` | 「여기서 {good} 싣고 {planet}에 넘기면 남아.」 | **PB-G2 대표님 결정** · 기본 `enabled=0` |

**우선순위**: `severity=warn` 먼저(`repair_due`), 그다음 `sort` 오름차순. **한 턴에 한 가지만** 말한다.

**판정이 없을 때**: `hasAdvice=false` → 「지금은 크게 손댈 게 없어 보여.」 (일상 말투, 브리핑 금지)

---

## 4. 테이블 (Table-First · 신규 2장 · 기존 행 무변경)

### 4-1. `tables/content/stella_play_advice_rules.csv`

```text
id,sort,kind,enabled,severity,minLevel,maxLevel,paramA,paramB,cooldownAsks,lineKo,lineEn,evidenceRef,botVersion
adv_repair_due,1,repair_due,0,warn,1,999,40,20,2,출격 전에 수리부터 하자. 이대로면 배가 못 버텨.,Repair before you launch. The hull won't hold like this.,pb-ab-20261xxx-repair,pb-1.x
adv_weapon_first,10,weapon_first,0,info,1,999,5,,3,새 함선보다 무장이 먼저야. 여기 {item}부터 달자.,Weapons before a new hull. Fit the {item} here first.,pb-ab-…,pb-1.x
…
```

| 열 | 의미 |
|----|------|
| `kind` | §3 고정 enum. 판정기 코드에 대응 함수가 있어야 함(없으면 빌드 실패) |
| `enabled` | 0/1. **플레이봇 A/B 통과 행만 1** |
| `severity` | `warn` \| `info` |
| `minLevel` `maxLevel` | 대표님 레벨 밴드 게이트 |
| `paramA` `paramB` | kind 별 임계값 (§3 표). 숫자는 말로 나가지 않음 |
| `cooldownAsks` | 같은 행을 다시 말하기 전 필요한 「조언 질문」 횟수 (상태 지문이 바뀌면 무시) |
| `lineKo` `lineEn` | 템플릿. 자리표시자 `{item}` `{slot}` `{skill}` `{planet}` `{ship}` `{good}` `{tooHard\|tooEasy}` 만 허용. **숫자·가격 금지** |
| `evidenceRef` | 플레이봇 검증 리포트 id (`tools/play-bot-console/reports/advice-ab/…`) |
| `botVersion` | 검증한 봇 버전. 봇 정책이 바뀌면 재검증 대상 |

### 4-2. `tables/content/stella_play_advice_train_bands.csv`

```text
levelMin,levelMax,rank,planetId,evidenceWinPct,evidenceExpIndex,evidenceRef
1,5,1,arcadia,78,100,pb-ab-…
1,5,2,…
```

- 밴드당 `rank` 1~5. `evidence*` 는 기록용이며 **말·팩에 싣지 않는다**.
- 생성은 플레이봇 수출(§8-2), 반영은 Fable. 재수출로 값이 바뀌면 **기존값 변경 재확인 규칙** 적용(대표님 승인).

### 4-3. 기존 채팅 CSV — **신규 행만 추가**

| 파일 | 추가 행 |
|------|---------|
| `arc_core_chat_topics.csv` | `advice,뭐 하지\|뭐하지\|뭘 해야\|뭐부터\|추천\|조언\|어떻게 해야\|막혔\|강해지\|자꾸 터\|what should\|advice\|recommend\|stuck,get_play_advice,도구가 준 조언 한 가지만 동료 말투로 말한다. 숫자·가격·id는 말하지 않는다. 조언이 없으면 지금은 손댈 게 없다고 한다.,…en` |
| `arc_core_chat_purposes.csv` | `guide_play,<sort>,asked_advice,advice,조언을 물으면 하나만 권한다. 대신 실행하지 않는다.,…en` |
| `arc_core_chat_knowledge.csv` | `know_sim_record,advice,operator_mouth,1,나는 시뮬레이터로 수없이 출격해 봤어. 통하는 순서는 대충 알아.,…en` |
| i18n | `arcCoreChat.reply.advice` · `arcCoreChat.reply.adviceNone` (로컬 폴백 키) |

`trade` · `shipyard` · `combat` 주제 행의 `hintTools` 에 `get_play_advice` 를 붙이는 것은 **기존값 변경**이다. K4 이후 대표님 확인 사항(§11-2)으로 남긴다. 붙이기 전까지 조언은 `advice` 주제로만 열린다.

---

## 5. 앱 런타임 계약 (김팀장 구현 · 파일 단위)

### 5-1. 순수 판정기 — `src/game/playAdvice/`

| 파일 | 내용 |
|------|------|
| `playAdviceTypes.ts` | `PlayAdviceSnapshot` · `PlayAdviceResult` · `PlayAdviceKind` |
| `playAdviceTableIndex.ts` | generated 행 → 모듈 레벨 1회 Map (`getPlayAdviceRuleIndex()` · `getTrainBandRows(level)`) |
| `resolvePlayAdvice.ts` | `resolvePlayAdvice(snap, opts) → PlayAdviceResult \| null` **순수**. store·i18n·Date 직접 접근 금지 |
| `playAdviceKinds.ts` | kind 별 판정 함수 6개. 각 함수는 `snap` + 행 params 만 받음 |
| `buildPlayAdviceSnapshotFromStores.ts` | 어댑터. `usePlayerStore` · `resolveTradePortCatalogItemIds(planetId)` · 아이템/함선/스킬 정의에서 **필요한 스칼라만** 뽑아 snapshot 구성 |
| `resolvePlayAdvice.test.ts` | §8-4 픽스처 계약 테스트 |

```ts
type PlayAdviceSnapshot = {
  level: number;
  credits: number;
  planetId: string | null;
  hullShipId: string;
  hullDurabilityPct: number;
  equipped: Array<{ slot: string; itemId: string; requiredLevel: number; durabilityPct: number }>;
  emptySlots: string[];
  portOffers: Array<{ itemId: string; slot: string; requiredLevel: number; price: number; labelKo: string; labelEn: string }>;
  learnableSkills: Array<{ skillId: string; cost: number; labelKo: string; labelEn: string }>;
  nextHull: { shipId: string; requiredLevel: number; price: number; labelKo: string; labelEn: string } | null;
};

type PlayAdviceResult = {
  ruleId: string;
  kind: PlayAdviceKind;
  severity: 'warn' | 'info';
  lineKo: string; // 자리표시자 채움 · ≤80자
  lineEn: string;
  fingerprint: string; // 판정에 쓴 상태 요약 — 반복 억제용
};

resolvePlayAdvice(snap, { recentAsks: ReadonlyMap<string, { asksAgo: number; fingerprint: string }> })
```

- `portOffers` 는 **현재 행성 무역소 진열 중 플레이어 레벨로 살 수 있는 무기·장비만**. 진열이 없으면 빈 배열(무역소 없는 행성).
- `resolveTradePortCatalogItemIds` 는 캐시가 없으므로 **물은 턴 1회만** 부른다. `memoizePerPlanet` 금지(진열이 점유·해금 store 에 의존 — P3).

### 5-2. 읽기 도구 — `src/arcCore/chat/arcCoreChatReadTools.ts`

- `ALLOWED_TOOLS` 에 `get_play_advice` 추가. 기존 ≤4 상한 유지.
- `runPlayAdvice(turn)`:
  1. `turn.policy.persona !== 'operator'` → `{ hasAdvice: false }` (D7).
  2. snapshot 어댑터 → `resolvePlayAdvice`.
  3. 반환 `data`: `{ hasAdvice, line, severity }` 만. **ruleId·kind·숫자 미포함**(LLM 이 id 를 되뇌지 않게).
  4. 세션 메모리(모듈 레벨 `Map`, 최대 8행, 앱 재시작 시 소멸)에 ruleId·fingerprint 기록. **persist 0**.
- 다른 도구처럼 lazy `require` 로 판정기 모듈을 불러 store ↔ chat 정적 순환을 만들지 않는다(P4).

### 5-3. 팩·턴 흐름

| 지점 | 변경 |
|------|------|
| `arcCoreChatDialogueDrive.ts` `ASKED_SYSTEM_TOPICS` | `advice` 추가 · `purposeForAsked('advice') → 'guide_play'` |
| `arcCoreAgentPack.ts` | 변경 없음 — 주제 CSV `hintTools` 가 도구를 고른다. humanFirst 턴이면 주제가 `smalltalk` 으로 잡혀 도구가 오지 않음 |
| `localConversationalReplySpec.ts` | `specForAdvice` 추가: `hasAdvice && line` → `{ key: 'arcCoreChat.reply.advice', rawText: line }` · 없으면 `adviceNone` |
| `quarantineArcCoreChatReply.ts` | 팩에 `get_play_advice` 결과가 있을 때만: 회신에 `\d[\d,]*\s*(cr\|크레딧\|%)` 가 있으면 `null` → 로컬 템플릿(F5 경로). 다른 주제 영향 0 |
| `stellaLifePack.ts` | 변경 없음. 라이프 400자와 조언 줄은 **별 필드**(도구 결과)라 서로 밀어내지 않음 |

### 5-4. 개발 전용 계측 (김플레이 · 출시 제외)

- `src/game/devPlayVerbLog.ts` 에 `ADVICE` 동사 추가: `[PLAY_VERB] ADVICE rule=… sev=… shown=1` · 다음 관련 행동(구매·수리·이동·습득)이 같은 세션에서 나오면 `ADVICE_FOLLOW rule=…`.
- `__DEV__` 가드 · 릴리즈 번들 0 (대표님 지시: 출시 때 이 기능을 뺀다).

---

## 6. [pss-pre-dev]

**앱 (K2·K4)**

```text
[pss-pre-dev] hot_path=채팅 턴 중 「조언 주제」로 분류된 턴만 1회 · 틱·타이머·렌더 경로 0
[pss-pre-dev] alloc=턴당 snapshot 1 + 진열 배열 1(≤~40) + 결과 1 · cache=규칙 Map 모듈 1회 · 세션 반복 Map ≤8 · 진열 memo 없음
[pss-pre-dev] stage=신규 STAGE·Canvas·Skia 없음 · persist 0 · 신규 AsyncStorage 키 0 · 부트 경로 0
[pss-pre-dev] risk=P3(진열은 store 의존 → memo 금지로 해소) · P4(lazy require) · P7 해당 없음
[pss-pre-dev] verdict=PASS
```

**플레이봇 (K1·K3)** — PC 전용, 앱 PSS 무관. 수출 파일은 덮어쓰기 1개씩, append 로그 금지.

완료 게이트(앱): `npx tsc --noEmit -p tsconfig.client.json` · `npm run audit:memory:all` · 채팅 단위 테스트 · 김경제 `mem-post-dev-recheck`.

---

## 7. 지켜야 할 경계

### 7-1. 말해도 되는 것 / 안 되는 것 (Part A 조언 · 먼저 말 거는 규칙은 §C-4)

| 말함 | 말하지 않음 |
|------|------------|
| 아이템·행성·함선·스킬 **표시명** | 가격 · 승률 · 레벨 수치 · 내부 id |
| 「먼저」「지금은」「올라갈 때」 같은 방향 | 「봇이」「학습」「AI」「시뮬레이션 데이터에 따르면 몇 %」 |
| 한 턴 한 가지 | 목록 나열 · 체크리스트 |
| 물었을 때 | 잡담 중 끼워 넣기 · 근원체 입 |

### 7-2. 실패 모드 (§17 F15–F20 대체)

| # | 실패 | 방어 |
|---|------|------|
| F15 | 남(봇)의 사건을 대표님 사실로 말함 | 입력은 대표님 store 뿐. 봇 사건 데이터는 앱에 없음 |
| F16 | 조언이 잡담을 덮음 | `advice` 주제일 때만 도구 · humanFirst 는 smalltalk |
| F17 | 입이 대신 실행 | 도구는 읽기 전용. 구매·이동·수리 API 미호출 · `WRITE_DONE_RE` 유지 |
| F18 | 가격·수치 누출 | 템플릿 숫자 금지 + 조언 턴 한정 수치 검역 |
| F19 | 같은 말 반복 | `cooldownAsks` + fingerprint (상태가 바뀌면 다시 말해도 됨) |
| F20 | 틀린 조언 (트윈과 실게임 불일치) | `enabled=1` 은 A/B 통과 행만 · 선행조건 §10 · 봇 버전 바뀌면 재검증 |
| F21 | 앱과 봇의 판정이 갈라짐 | 판정기 1개를 봇이 import · 픽스처 계약 테스트 |
| F22 | 진열 조회가 고빈도로 번짐 | 물은 턴 1회 · 렌더/useMemo 호출 금지 |
| F23 | 근원체가 조언 | persona 가드 + 주제 CSV `operator` 한정 지식 |

### 7-3. 금지 (§17 금지 26–30 대체)

26. 봇 세션·교전·일지를 대표님 세이브·채팅 키·팩에 싣기  
27. 판정기를 `src/` 밖(플레이봇)에 두고 앱에 복제하기  
28. 조언 생성에 LLM 추가 홉·임베딩·파인튜닝 사용  
29. 허브 궤도 슬롯을 스텔라 상주 함으로 고정 (유지)  
30. 이 문서로 `PB-LIVE` 버튼·계정 스왑·수집기 억제를 착수 (유지)  
31. 조언 도구에서 store write · 구매·이동 실행  
32. A/B 미통과 행을 `enabled=1` 로 배포  
33. 기존 채팅 주제 행 `hintTools` 를 대표님 확인 없이 변경

---

## 8. 플레이봇 쪽 (김플레이)

### 8-1. 판정기 공유

- 트윈 하네스가 `src/game/playAdvice/resolvePlayAdvice.ts` 를 import 한다(봇 → 앱 한 방향, 이미 `src/data` 를 그렇게 쓰고 있음).
- 트윈 `WorldState` → `PlayAdviceSnapshot` 어댑터: `tools/play-bot-console/src/adviceSnapshot.ts`. 진열은 봇의 `listGearCandidates` 가 아니라 앱과 같은 `tradePortCatalogPolicy` 경로를 써서 앱과 같은 입력이 되게 한다.

### 8-2. 수출 — `npx tsx tools/play-bot-console/export-advice.ts`

| 산출 | 내용 |
|------|------|
| `tools/play-bot-console/out/stella-advice-rules.candidate.csv` | §4-1 형식. `enabled` 는 A/B 결과로 채움. `paramA/B` 는 봇이 찾은 임계값 |
| `tools/play-bot-console/out/stella-advice-train-bands.candidate.csv` | §4-2. 대표 장비 조합(밴드별 봇 평균 장착)으로 행성별 교전 효율 순위 |
| `tools/play-bot-console/reports/advice-ab/<runId>.md` | 행별 근거: 시드·일수·KPI 차이 |

`tables/` 에는 직접 쓰지 않는다. Fable 이 후보를 정본에 반영하고, 기존 행 값이 바뀌면 대표님 확인을 받는다.

### 8-3. 검증 — 「조언 따르기」 A/B

- 페르소나 `advice_follow`: 매 가상일 시작 시 `resolvePlayAdvice` 를 부르고, 결과가 있으면 그 행동을 우선 실행한 뒤 기존 정책으로 진행.
- 대조군: 같은 시드의 기존 페르소나(`mixed_ref`).
- 조건: 4 시드 × 동일 일수(기본 D600). 규칙 하나씩 켜고 끈다(행별 기여 분리).

| 행 통과 기준 (모두) |
|---------------------|
| 함선 파괴 횟수 대조군 대비 증가 없음 |
| 1장 완료일·레벨 도달일 중 하나 이상 개선, 나머지 악화 없음 (±5% 허용) |
| 조언이 같은 상태에서 3회 넘게 연속 나오지 않음 (말만 하고 해결 불가한 조언 방지) |
| `trade_route` 는 PB-G2 결정 전 평가만 하고 `enabled=0` |

### 8-4. 계약 픽스처

- `tools/play-bot-console/fixtures/stella-advice/*.json` — `{ snapshot, expectRuleId }` 20건 이상(kind 별 양·음성).
- 앱 테스트 `resolvePlayAdvice.test.ts` 가 같은 JSON 을 읽는다(테스트 전용, 번들 미포함).
- 봇 테스트 `play-bot-console.test.ts` 에 「트윈 상태 → snapshot 어댑터 → 같은 결과」 케이스 추가.

---

# Part B — 행동 관찰 (출시 앱)

## B-0. 한 줄

**플레이봇이 `[PLAY_VERB]` 로 읽는 것과 같은 행동을, 같은 지점에서, 스텔라도 받는다.** 다만 출시 앱에서는 로그로 내보내지 않고 메모리 링과 하루 요약으로만 쥔다.

## B-1. 지금 있는 것 (2026-10-06 실측)

| 항목 | 실측 |
|------|------|
| 마커 | `src/game/devPlayVerbLog.ts` `emitPlayVerb(verb, detail)` — `__DEV__` 일 때만 console. 출시는 즉시 return |
| 동사 10종 | quest · combat · trade · annex · skill · ship · mine · scan · talk · develop |
| 방출 지점 | `missionStore`(수락·목표·완료) · `playerStore`(스킬) · `runCombatEndOutcomeFlow`(전투) · `planetEconomyFabric`(무역) · `applyStelliumAnnex` · `trade.tsx`(함선 구매) · `mining/service` · `tryPresentScanToMainQuestDialog` · `ingameDialogCompletion` · `planetDevelopmentActionOptions` |
| 스텔라 선제 | `bindStellaLifeAskToPlanetSession` — 허브 진입 시 1회 · 안전 슬롯·DND·튜토리얼·inbound pending 확인 · `resolveStellaHumanAsk`(스텔라 하루만 입력) · 하루 1회(`lastAskDay`) |
| 빈 곳 | 출시 앱에서 대표님 행동이 스텔라에게 **0건** 전달됨. 파괴·수리·장착·착륙·레벨업은 마커 자체가 없음 |

## B-2. 관찰 어휘 (플레이봇 저널과 공통)

`PlayerObserveVerb` — 기존 10종 + 신규 6종. **플레이봇 저널 `kind` 와 1:1 대응표**를 같이 둔다(§B-6).

| verb | sub | 방출 지점 | 신규 |
|------|-----|-----------|------|
| `quest` | accept · objective · complete | `missionStore` | |
| `combat` | win · lose · retreat (+ venue) | `runCombatEndOutcomeFlow` | |
| `trade` | buy · sell | `planetEconomyFabric` | |
| `ship` | buy | `trade.tsx` · 조선소 | |
| `skill` · `annex` · `mine` · `scan` · `talk` · `develop` | — | 기존 | |
| `destroy` | flagship | `playerSurvivalPod` 진입 | **신규** |
| `repair` | hull · item | 내구도 수리 확정 | **신규** |
| `equip` | on · off | 조선소 장착 확정 | **신규** |
| `land` | — | 행성 도착 확정 (허브 진입 전) | **신규** |
| `level` | up | `playerStore` 레벨 상승 | **신규** |
| `session` | start · end | 이어하기 진입 · 앱 background | **신규** |

```ts
type PlayerObserveEvent = {
  verb: PlayerObserveVerb;
  sub: string;        // 짧은 enum 문자열
  planetId: string;   // 없으면 ''
  refId: string;      // missionId·itemId·shipId 등. 없으면 ''
  atMs: number;
};

// 방출 지점이 부르는 단일 API — 기존 emitPlayVerb 를 대체
recordPlayerAction(verb, sub, planetId?, refId?): void
//  1) __DEV__ → 기존과 같은 `[PLAY_VERB]` console (출시 제외 · 대표님 지시 유지)
//  2) 항상    → playerObserveSink.push(...)  (console·파일·네트워크 없음)
```

> **구현 반영 (O1·O2 · 2026-10-06)**: 방출 지점을 건드리지 않으려고 `emitPlayVerb(verb, detail)` 이름을 그대로 두고, 안에서 `recordPlayerObserve` 를 항상 부른다. detail 문자열은 sink 가 (sub, planet, ref) 로 쪼갠다. 하루 요약은 `life` 안이 아니라 같은 저장 키의 **별도 필드 `observe`** 다 (≤512B 자기 클램프, 지난 2일). 필드 이름은 축약형(`c`·`loss`·`dstr`·`run`…) — 정본은 `src/game/playerObserve/playerObserveSink.ts`. 아래 `StellaObserveDigest` 는 설계 의도로 남긴다.

## B-3. 저장 — 두 층

| 층 | 위치 | 크기 | 수명 |
|----|------|------|------|
| **링** | `src/game/playerObserve/playerObserveSink.ts` 모듈 상태. 64칸 **사전 할당 객체**에 필드 덮어쓰기 | 64 × ~6필드 | 앱 프로세스. 재시작 시 소멸 |
| **하루 요약** `observe` | 기존 `arcCoreChatStore` 같은 저장 키의 별도 필드 (`life` 밖) | **≤512B 자기 상한 · 자기 클램프(notable→prevDays)**. 기존 life 클램프 순서에 넣지 않음 — 꽉 찬 계정(실측 5,966B)에서 스텔라 기억을 밀어내지 않게 (전수 조사 §3-2) | 오늘 + 어제 + 그제(3일). 그 이전은 버림 |

```ts
type StellaObserveDigest = {
  dayKey: string;                       // 오늘 KST
  counts: Record<PlayerObserveVerb, number>; // 오늘 동사별 횟수 (0이면 키 생략)
  streak: { loss: number; destroyToday: number; samePlanetCombat: number; samePlanetId: string };
  firsts: number;                       // 비트마스크: 첫 함선 구매·첫 편입·첫 개발·첫 파괴·첫 레벨10…
  notable: Array<{ verb: string; sub: string; planetId: string; refId: string; dayKey: string }>; // ≤4, 최신 우선
  prevDays: Array<{ dayKey: string; line: string }>;  // ≤2, 「어제 베가에서 두 번 실려 옴」 류 요약 키
  lastSessionEndMs: number;
  lastProactive: { situationId: string; channel: string; dayKey: string; outcome: 'accept' | 'ignore' | 'pending' } | null;
  receptivity: Record<string, { acc: number; ign: number }>; // 상황별 수용·무시 (≤12키, 각 0–9 포화)
  lastAdvice: { ruleId: string; dayKey: string; followed: boolean | null } | null; // Part A 연동
};
```

- **persist**: 「눈에 띄는 사건」(destroy·first·level·quest complete·session start/end)과 날짜 변경 때만 기존 `touchPersist()`(1.5s 코얼레싱)에 편승. 무역·채굴·전투 카운트는 메모리에서 바로 더하고, 다음 눈에 띄는 사건이나 background 때 같이 기록.
- **계정 초기화**: `life` 는 `resetArcCoreChatForAccountPurge` 대상이라 `observe` 도 함께 지워짐. 신규 키 0.
- **외부 전송 0**: Firestore·Lambda 로 원시 이벤트를 보내지 않는다. LLM 에는 수락 후 대화 팩의 요약 1블록(≤200자)만 간다(§C-5).

## B-4. 모듈 경계 (순환 방지)

- `playerObserveSink.ts` 는 **아무 store 도 import 하지 않는다.** 순수 링 + 카운터 + digest 변이 함수. `missionStore`·`playerStore` 가 이 모듈을 불러도 순환이 생기지 않는다(P4).
- digest 를 `life` 에 쓰는 일은 `arcCoreChat` 쪽 어댑터가 결정 순간에 lazy `require` 로 가져가 병합한다.

## B-5. [pss-pre-dev] (Part B)

```text
[pss-pre-dev] hot_path=플레이어 행동 1회당 1호출 (무역 일괄 매매 시 버스트 가능) · 틱·프레임 0
[pss-pre-dev] alloc=이벤트당 0 (사전 할당 링에 필드 쓰기 · 카운터 증가) · digest 변이는 눈에 띄는 사건만 · cache 없음
[pss-pre-dev] stage=신규 STAGE·Canvas 없음 · persist=기존 life 1.5s 코얼레싱 편승 · 신규 AsyncStorage 키 0
[pss-pre-dev] risk=P1(무역 버스트 → O(1) 보장) · P4(sink 무의존) · P6(눈에 띄는 사건만 persist)
[pss-pre-dev] verdict=PASS
```

## B-6. 플레이봇과의 관계 (김플레이)

| 플레이봇 저널 `kind` | 관찰 verb |
|---------------------|-----------|
| `COMBAT` | combat |
| `DESTROY` | destroy |
| `TRADE` | trade |
| `GEAR` | equip · repair |
| `TRAVEL` · `LAND` | land |
| `LEVEL` | level |
| `QUEST` · `SKILL` · `MINE` · `DEVELOP` · `ANNEX` | 동명 |

- 같은 어휘라서 **플레이봇 트윈의 수천 일 저널을 그대로 관찰 이벤트로 재생**할 수 있다. Part C 의 상황 인식기가 하루에 몇 번 말을 걸지, 어떤 상황이 몰리는지 대표님 앞에 내놓기 전에 봇이 측정한다(§C-8).
- `devPlayVerbLog` 는 `recordPlayerAction` 의 개발 출력부로 남는다. owner-playlog 수집기의 `[PLAY_VERB]` 형식은 바꾸지 않는다(신규 동사만 추가).

---

# Part C — 능동 인터랙션

## C-0. 한 줄

**스텔라는 타이머로 말을 걸지 않는다. 대표님이 무언가를 끝낸 순간, 그 행동이 스텔라의 마음에 걸릴 때만 먼저 말한다. 그리고 자기가 한 말을 기억한다.**

## C-1. 대표님이 겪는 모습

```text
[전투 패배 후 허브 복귀 · 오늘 두 번째 파괴]
  1차 통신 ─ 스텔라: 「오늘 두 번째로 실려 왔어. 괜찮아? 뭐가 꼬였는지 같이 볼래?」  [수락] [나중에]
  수락 → 메신저: 대화가 이어지고, 필요하면 「무장부터」 조언(Part A)

[이틀 만에 접속 · 허브 진입]
  스텔라 이름 옆 미읽음 1 (팝업 없음)
  열면: 「왔구나. 이틀 만이네. 나는 그동안 당직만 서고 있었어.」

[첫 함선 구매 후 착륙]
  허브 한 줄 (버튼 없음, 몇 초 뒤 사라짐) ─ 스텔라: 「새 함선 봤어. 마음에 들어?」

[어제 「수리부터」 했는데 대표님이 수리 없이 출격 → 파괴]
  1차 통신 ─ 「내가 어제 더 분명히 말했어야 했는데. 지금이라도 수리하고 갈까?」

[베가에서 같은 교전만 1시간째 하고 허브로 돌아온 순간 — 머무는 동안이 아니라 복귀 시점에만]
  허브 한 줄 ─ 「거기서 계속 싸우는 이유가 있어? 궁금해서.」
```

## C-2. 결정 순간 (타이머 없음)

| 순간 | 지점 | 비고 |
|------|------|------|
| 허브 진입 | `bindStellaLifeAskToPlanetSession` (기존) | 기존 라이프 선제와 **같은 함수에서 같이** 판정 |
| 전투 종료 후 허브 복귀 | 위와 동일 (복귀 = 허브 진입) | 전투 중·웨이브 중 판정 0 |
| 이어하기 첫 허브 | 동일 + `session start` 사건 | 장기 부재 판정 |
| 대화창 닫힘 | 메신저 닫힘 콜백 | 후속(「아까 그거 해봤어?」)만. 새 선제 0 |

결정 순간마다 `detectStellaSituations` 1회. 이벤트 하나마다 판정하지 않는다.

## C-3. 상황 인식 — `tables/content/stella_observe_situations.csv`

```text
id,priority,detector,paramA,paramB,motiveId,channel,cooldownHours,dutyGate,enabled,lineKo,lineEn
sit_rough_day,1,destroy_or_loss_streak,2,3,worry,ask,6,any,1,오늘 {n}번째로 실려 왔어. 괜찮아? 뭐가 꼬였는지 같이 볼래?,…
```

| id | 감지 (digest·링·플레이어 상태) | 동기 | 채널 | 성격 |
|----|-------------------------------|------|------|------|
| `sit_rough_day` | 오늘 파괴 ≥ paramA 또는 연패 ≥ paramB | worry | ask | 걱정 |
| `sit_risky_launch` | 허브 진입 시 함선 내구도 ≤ paramA (Part A `repair_due` 와 같은 판정) | worry | remark | 경고 (구 K6) |
| `sit_advice_ignored_hurt` | `lastAdvice.followed=false` 후 destroy | want_right | ask | 자기반성 |
| `sit_advice_followed_ok` | `lastAdvice.followed=true` 후 승리·목표 달성 | proud | remark | 「거봐」 아닌 함께 기뻐함 |
| `sit_welcome_back` | `session start` 이고 직전 종료로부터 ≥ paramA 시간 | check_in | message | 선 연락 |
| `sit_first_milestone` | `firsts` 새 비트 (첫 함선·첫 편입·첫 개발) | proud | remark | 자랑 |
| `sit_level_mark` | 레벨이 paramA 의 배수 도달 | proud | remark | 축하 |
| `sit_grind_loop` | 같은 행성 연속 교전 ≥ paramA 이고 세션 경과 ≥ paramB 분 | curious | remark | 궁금 |
| `sit_quest_stall` | 같은 세부미션 목표가 세션 ≥ paramA 번 · 플레이 ≥ paramB 분 동안 그대로 | need_you | ask | 「막힌 것 같아. 얘기해 볼래?」 수준만 — **목표 이름·공략 금지** (스토리 입과 겹침 · 잠금 5) |
| `sit_long_session` | 연속 플레이 ≥ paramA 분 또는 새벽 시간대 | check_in | remark | 쉼 권유 |
| `sit_trade_run` | 오늘 무역 ≥ paramA | want_share | remark | 가벼운 공감 |

- **파괴 입력 잠금 (잠금 4)**: `destroy` 방출은 G6 커밋 뒤에 붙는다. 그 전에는 `sit_rough_day` 의 파괴 조건과 `sit_advice_ignored_hurt` 를 **`enabled=0`** 으로 둔다. `rough_day` 는 연패 조건만으로도 켜지 않는다 — 봇 재생에는 파괴가 있고 앱에는 없으면 판정이 갈라지므로, 방출이 들어간 뒤 같은 입력으로 다시 잰다.
- **전부 `enabled=0` 으로 시작**한다. O4(봇 빈도 검증) 합격 행만 후보로 1.
- 모든 상황은 **결정 순간(허브 진입·복귀)에만** 판정한다. 머무는 동안 시간 경과로 말하지 않는다 (잠금 6).
- **동기 어휘**는 §16 의 것(need_you · want_share · check_in · unfinished · want_right)에 `worry` · `proud` · `curious` 3개를 더한다.
- **dutyGate**: `any` · `off_only`. 스텔라가 당직·집중 중(§3)이면 `off_only` 상황은 참는다. worry 계열만 당직 중에도 말한다 — 「바쁜데도 걱정돼서」가 자의식의 핵심 연출.
- 템플릿 숫자: 「두 번째」「이틀」처럼 **5 이하의 개인적인 횟수·날짜만** 허용. 가격·승률·레벨 수치 금지(Part A 와 같음).
- 감지기는 `src/arcCore/chat/stellaObserveSituations.ts` 의 **순수 함수**. 입력 = digest + 링 뷰 + 최소 플레이어 스칼라. 출력 = 우선순위 1개.

## C-4. 말할지 참을지 — 스텔라의 판단 (능동형 · 2026-10-06 개정)

> **대표님 결정 (2026-10-06)**: 하루 몇 번 같은 **방해 예산은 없다.** 예산은 스텔라에게 몸체가 없을 때의 규칙이었다. 이제 스텔라가 상황을 보고 **스스로 판단해 먼저** 말을 건다. 판단은 두 가지다 — **얼마나 심한가**, 그리고 **지금이 말을 걸 때인가**. 성능이 아직 완벽하지 않은 부분만 기술 조정으로 막는다.

```text
situation 후보 = detect(…)                      // 없으면 → 기존 §16 라이프 선제로 넘김
기술 조정 (판단이 아니라 안전장치)
  · 말할 수 없는 순간   overlay·대화·웨이브·튜토리얼·DND·앱 비활성 · 같은 진입의 다른 팝업 → 침묵
  · 근원체와 겹침       근원체 inbound 15분 안이면 기다림 · 같은 순간이면 걱정·귀환 인사만 먼저
  · 고장 방지 상한      하루 6 — 판단 규칙 아님. 닿으면 판단 쪽을 고친다
판단 (후보마다)
  말하고 싶은 마음 = 동기 무게 × 심한 정도(1~1.25배)
                     × 방금 말했다는 자제 (스텔라 자신의 마지막 선제·일상 질문, 반감기 90분)
                     × 대표님 반응 (그 상황 무시마다 0.6 · 요즘 연달아 무시마다 0.85 · 받아 주면 풀림)
                     × 자기 상태 (당직 중 off_only 0.5 · casualFirst 높으면 걱정 외 0.7)
  지금이 말할 때인가 = 근거 행동이 방금인가 (10분 안 1 → 반감기 30분 → 최저 0.3)
                     × 대표님이 한창 바쁜가 (5분 안 행동 6개 이상이면 걱정 외 0.5)
  한 말은 기억       같은 상황은 cooldownHours 동안, 더 나빠졌을 때만 다시 꺼냄
→ 마음 × 때 가 가장 큰 상황 1개. 0.4 이상이면 말함 · ask 행은 0.7 이상일 때만 물음(아니면 message)
```

- **근원 행동(`anchorVerb`)** 은 상황 표의 열이다. 파괴 직후 복귀했으면 바로 걱정하지만, 한 시간 뒤 다른 볼일로 들어왔을 때는 꺼내지 않는다(침묵 사유 `not_now`). 함선 상태·장시간처럼 **지금 상태가 곧 이유**인 상황은 열이 비어 있고 때가 늘 맞다.
- 침묵 사유는 `restraint`(마음이 모자람)와 `not_now`(마음은 있는데 때가 아님)로 나뉜다 — O4 봇 재생에서 둘을 따로 센다.
- 모든 값은 `stella_observe_gate_policy.csv`. 표의 모든 행은 감지 문턱에서 때가 맞으면 말할 수 있어야 한다(테스트 고정).
- **근원체 inbound 와 간격을 나눈다.** 15분 안에 근원체가 울렸으면 스텔라는 기다리고, 반대도 같다. 같은 순간에 둘 다 이유가 있으면 `worry`·`welcome_back` 이 먼저, 그다음 근원체 `spy`, 나머지는 스텔라가 양보.
- **근원체 슬롯은 취소하지 않고 다음 창으로 미룬다 (잠금 5)**. 예: 패배 후 허브 복귀 → 스텔라가 즉시 걱정 → 45–90초 뒤 예정이던 근원체 전투 보고는 15분 간격을 채운 다음 창으로 밀린다. 근원체 지연 상수(45–90초·8–15분)는 그대로. 스텔라 문장에는 적·전황·전투 결과 해설을 넣지 않는다 — 대표님 **처지**만.
- §16 라이프 선제(`operator_life`)는 그대로 둔다. 관찰 상황이 없을 때만 돈다. 일상 질문도 스텔라 자신이 한 말이라 **자제**에 같이 들어간다(`lifeAskLastAtMs`). 횟수를 나눠 쓰지 않는다.
- **잠금 7 개정 (대표님 2026-10-06)**: 「선 질문 하루 1회 공유」는 폐지. 남는 것 — 최초 착륙 팝업·튜토리얼·환영 대사·첫 스텔라 연락 팝업이 떠 있거나 같은 허브 진입에서 이미 떴으면 관찰 선제는 **침묵**. 1차 통신이 수락 없이 닫히면 **무시 1회**(그 상황 + 요즘 전체), 받아 주면 둘 다 풀림.

## C-5. 세 채널

| 채널 | 모양 | 구현 지점 | LLM |
|------|------|-----------|-----|
| **ask 선 질문** | 1차 통신 팝업 (수락/나중에) → 수락 시 메신저 | 기존 `presentOperatorInboundFirstComm` → `presentArcCoreBackchannel({ reason: 'operator_observe', speakerId: 'operator' })` | 1차 템플릿 0 · 수락 후 기존 1홉 |
| **message 선 연락** | 팝업 없음. 허브 대화 명단(`planetHubTalkRoster`)의 스텔라 항목에 미읽음 표시. 열면 그 말이 오프너 | 명단 배지 + `openerText` | 열기 전 0 |
| **remark 말걸기** | 허브 하단 한 줄 말풍선, 버튼 없음, 몇 초 뒤 사라짐. 탭하면 메신저 | `ArcOverlayHost` 경유 신규 비차단 표면 (오버레이 계약 준수 · RN Modal 금지) | 0 |

- 새 이유 `operator_observe` 를 `arcCoreBackchannelTriggers` 에 추가. `originHold=false`, operator 고정.
- 수락·열기 후 팩: **읽기 도구 `get_recent_activity`** (operator 만 · 키 ≤6 · 값 ≤80자). 새 팩 필드는 서버가 버리므로 쓰지 않는다(전수 조사 §3-1·§3-3 — 기존 `lifeBlock` 도 서버·로컬 어디서도 읽히지 않음). 예: `관찰: 오늘 함선 두 번 파괴(베가) · 수리 미룸 · 어제 내가 권한 것=수리 · 대표님 반응=안 함`. 라벨은 표시명으로 렌더, id 금지. Part A 조언이 연결된 상황(`rough_day`·`risky_launch`·`advice_*`)이면 `get_play_advice` 도 같이 실음.
- **도구 4칸 우선순위 (잠금 3)**: 서버·클라 모두 도구 결과 4개. 관찰 턴(`operator_observe` 수락 후)은 **최근 행동 `get_recent_activity` → 조언 `get_play_advice` → 스텔라 지금 `get_stella_now` → 주제 도구** 순으로 채우고 넘치면 뒤에서 버린다. 일반 대화 턴은 지금처럼 주제 도구 → `get_stella_now`. 값 ≤80자 · 키 ≤6 · 도구 값에 내부 id 금지(표시명만).
- **말걸기 표면 (잠금 8)**: 시안 확인 + `audit:ui-overlay` 전에는 만들지 않는다. 허브 레이아웃 상수(`planetMainStageLayout`)는 그대로, 기존 크롬 위 오버레이로만. 퀘스트 창·대사창·메신저·다른 오버레이가 열려 있으면 **0회**. 하루 3회는 상한일 뿐 목표가 아니다.
- 1차 문장은 LLM 없이 CSV 템플릿(§16 금지 24 유지).

## C-6. 자기 기억과 후속

| 기억 | 쓰임 |
|------|------|
| `lastProactive` + outcome | 같은 말 반복 금지 · 대화 닫힐 때 후속 1회(「아까 그거 해봤어?」는 **다음 결정 순간**에 remark 로) |
| `lastAdvice` + followed | Part A 조언 뒤 대표님 행동(수리·장착·구매·이동)이 링에 나오면 followed=true. 다음 전투 결과와 엮어 `advice_*` 상황 |
| `notable` · `prevDays` | 「어제 베가에서…」 같은 연속성. **관측된 것만** 말함(grounding) |
| `receptivity` | 대표님이 무시한 종류는 줄이고, 받아 준 종류는 유지 — 사람처럼 눈치를 봄 |

## C-7. [pss-pre-dev] (Part C)

```text
[pss-pre-dev] hot_path=결정 순간만 (허브 진입·복귀·세션 시작·대화 닫힘) — 분당 수 회 이하 · 타이머 0
[pss-pre-dev] alloc=판정 1회당 상황 후보 ≤1 + 템플릿 문자열 1 · remark 표면은 오버레이 호스트 재사용 · cache=상황 CSV Map 모듈 1회
[pss-pre-dev] stage=신규 STAGE·Canvas 없음 · 허브 세션 리소스로 등록·해제(기존 bind 함수 안) · persist=lastProactive·receptivity 만 life 편승
[pss-pre-dev] risk=P5(착륙 직후 판정 — 착륙 sync 후 허브 진입에서만) · P1 해당 없음
[pss-pre-dev] verdict=PASS
```

## C-8. 플레이봇 검증 — 「하루에 몇 번 말을 거는가」

- 김플레이가 트윈 저널(사람 시계 `humanClock` 세션 포함)을 관찰 이벤트로 재생 → `detectStellaSituations` + 게이트(§C-4)를 그대로 import 해서 돌린다.
- 4 시드 × D600 기준 측정치와 합격선:

| 지표 | 합격선 (초기값 · 대표님 확인 대상) |
|------|-----------------------------------|
| 플레이일당 선제 총합 | 0.5 ~ 3 |
| ask 2회 이상인 날 | ≤ 10% (하루 예산 폐지로 「구조상 보장」 대신 측정 · 1차 통신 전부 포함) |
| 한 상황의 점유율 | ≤ 40% |
| 연속 3일 같은 상황 | 0 |
| 「침묵일」(선제 0) 비율 | 20 ~ 60% (항상 말 거는 동료는 시끄럽다) |
| 파괴 직후 `rough_day` 포착률 | ≥ 80% (걱정해야 할 때 놓치지 않음) — O4: 「새 힘든 시기」(72h 안에 같은 걱정을 안 꺼낸 때)만 셈. 매일 반복되는 날까지 세면 연속 3일 기준과 충돌 (대표님 확인 대상) |

- 실행: `npx tsx tools/play-bot-console/stella-verify.ts 600 4 <runId>` — A(지금 앱 · 허브 타이머 대화 요청 포함) · B(판단만) 두 시나리오.
- 결과는 `tools/play-bot-console/reports/stella-proactive/<runId>.md`. CSV 임계값 후보는 `out/` 으로만 내고 Fable 이 반영.
- 개발 빌드 계측: `[PLAY_VERB] STELLA_PROACTIVE sit=… ch=… out=accept|ignore` — 대표님 실기 반응을 김플레이가 수집해 수용도 기본값을 다듬는다. 출시 제외.

## C-9. 실패·금지 (Part B·C 추가분)

| # | 실패 | 방어 |
|---|------|------|
| F24 | 말이 너무 잦아 귀찮음 | 자제 반감기 · 「지금이 말할 때인가」 · 수용도 · 봇 빈도 측정 합격선 (예산 없음) |
| F25 | 지켜보는 게 섬뜩함 (감시 느낌) | 원시 행동 나열 금지 · 한 번에 한 가지 · 숫자는 작은 개인 횟수만 · 「다 보고 있어」류 문장 금지 |
| F26 | 전투 중·대화 중 끼어듦 | 결정 순간이 허브뿐 · 안전 슬롯 |
| F27 | 근원체와 동시에 울림 | 공동 예산 · 15분 간격 · 우선순위 |
| F28 | 관측하지 않은 일을 지어냄 | 템플릿 자리표시자는 digest 값만 · observeBlock 도 digest 렌더 |
| F29 | 무역 버스트가 프레임을 먹음 | 이벤트당 O(1)·할당 0 |

금지 (Part B·C)

34. 관찰 이벤트를 logcat·파일·네트워크로 출시 빌드에서 내보내기  
35. 관찰을 위해 `setInterval`·타이머·틱 신설  
36. 선 질문 1차 문장을 LLM 으로 생성  
37. 근원체 inbound 상수(45–90초·8–15분)를 바꾸거나 스텔라 선제 원인으로 쓰기 (§16 금지 21·25 유지)  
38. 관찰 digest 를 Firestore·짝 유저 미러로 동기화

---

# Part D — 플레이봇 성능 향상 → 스텔라 성능 향상 (연결 설계 · 2026-10-06 재검토)

## D-0. 한 줄

**봇이 좋아질 때마다 같은 날 스텔라를 다시 재고, 나아진 것만 표로 올린다.** 봇은 표 후보와 근거만 낸다. 스텔라 앱 코드는 바뀌지 않고 표만 바뀐다.

## D-1. 재검토 — 지금 설계로는 연결이 돌지 않는다

| # | 문제 | 근거 | 결과 |
|---|------|------|------|
| R1 | 봇이 바뀌어도 스텔라 재검증이 시작되지 않는다 | §4-1 `botVersion` 열은 있으나 언제 다시 재는지 정한 곳이 없다. 3단 프로세스(`PLAYBOT_THREE_LANE_PROCESS.md`)에 스텔라 칸이 없다 | 봇은 나아지는데 표는 옛 근거 그대로 |
| R2 | 「봇 성능」이 세 가지로 섞여 있다 | 벤치는 레벨·본편·파괴만 본다 (`bench-bot.ts`) | 봇이 **사람보다 강해지면** 재생에서 파괴·연패가 줄어 `rough_day` 가 거의 안 잡히고, 임계값이 사람에게 맞지 않게 된다 |
| R3 | 봇 저널을 관찰 이벤트로 정확히 재생할 수 없다 | `JournalEntry` 는 `kind` + 자유 문장 `line` 뿐 (`types.ts`). 행성·승패·대상 id 가 구조로 없다 | §C-8 재생이 문장 파싱에 기대게 됨 → 앱과 다른 입력 |
| R4 | 어휘가 셋이다 | 코퍼스 `PlayVerb`(talk_g1·quest_accept·depart…) · 봇 `JournalKind`(대문자 21종) · 관찰 동사 16종 | 한쪽에 동사가 늘면 다른 쪽이 조용히 놓친다 |
| R5 | 스텔라가 나아졌는지 잴 지표가 없다 | 벤치 기록에 스텔라 칸 없음 | 「봇 개선 → 스텔라 개선」을 숫자로 말할 수 없음 |
| R6 | 후보가 지금 표보다 나쁜지 비교하지 않는다 | §8-3 대조군은 「조언 없음」뿐 | 봇 버전이 바뀌어 근거가 흔들려도 새 후보가 그대로 올라올 수 있음 |
| R7 | 게임이 바뀌면 근거가 낡는다 | 3단에서 CSV·게임 코드가 바뀌면 트윈 미러 확인(`--ack-mirror`) 전까지 봇은 옛 게임을 흉내 냄 | 낡은 트윈으로 잰 규칙이 표에 들어감 |
| R8 | 담당 표가 옛 배치다 | §9 표에 O2·O3·O5·O6 담당이 김팀장 | 대표님 결정 1안(김플레이 주도 · 단계마다 김팀장 검수)과 다름 → §9 갱신 |

맞게 된 부분 (유지):
- 판정 코드는 앱에 하나, 봇이 import (§8-1). 관찰 sink 는 이미 import 없는 순수 모듈로 구현돼 봇이 그대로 쓸 수 있다 (`src/game/playerObserve/playerObserveSink.ts`).
- 봇은 `tables/` 에 쓰지 않는다. 후보 → Fable → 기존값이면 대표님 확인.
- 봇의 사건을 사실로 말하지 않는다 (B3). 봇이 넘기는 것은 규칙과 임계값뿐.

## D-2. 「봇 성능」을 셋으로 나눈다

| 축 | 뜻 | 재는 곳 | 스텔라에 주는 것 |
|----|----|---------|------------------|
| **충실도** | 트윈이 게임과 같은가 (전투 판정·파괴 후 처리·진열·가격) | K1 · 3단 미러 확인 · 픽스처 계약 | 모든 근거의 전제. 미달이면 스텔라 검증 **중단** |
| **판단력** | 봇 정책이 더 잘 노는가 (파괴↓ · 본편 진도↑) | 기존 벤치 | **Part A 조언 규칙** 후보 — 「무엇이 통하나」 |
| **사람다움** | 봇 세션이 대표님 실기와 닮았나 (순서·체류·실수) | 코퍼스 G-* · `humanClock` · human-seed | **Part C 빈도·임계값** — 「사람은 언제 힘들어하나」 |

**잠금**: Part C 재생은 **사람다움 축 세션만** 쓴다 (`humanClock` + human-seed 페르소나). 판단력 최상위 봇으로 Part C 를 재지 않는다. Part A A/B 의 대조군도 사람다운 기준 페르소나(`mixed_ref`)로 둔다 — 조언은 사람이 따랐을 때의 효과여야 한다.

**강한 봇 경보**: 재생 세션의 하루 파괴·연패율이 대표님 human-seed 보다 절반 아래로 떨어지면 그 회차 Part C 결과는 **무효**로 적고 후보를 내지 않는다.

## D-3. 스텔라 지표 — 봇이 재는 「스텔라 성능」

| 구분 | 지표 | 뜻 |
|------|------|----|
| A 조언 | 조언 효과 | `advice_follow` 대비 대조군: 파괴 감소 · 1장 완료일 · 레벨 도달일 |
| A 조언 | 해소율 | 조언 후 N 가상일 안에 그 조언 조건이 풀린 비율 (말만 하는 조언 방지) |
| A 조언 | 현재 표 대비 | **후보 표 vs 지금 정본 표** A/B. 후보가 지금보다 나쁘면 올리지 않음 (R6) |
| C 능동 | 빈도 합격 | §C-8 표 전부 |
| C 능동 | 걱정 포착률 / 헛걱정률 | 파괴 직후 `rough_day` 를 잡은 비율 / 걱정했는데 실제로는 순조로웠던 비율 |
| C 능동 | 침묵일 비율 | 20–60% |
| 실기 (개발 빌드) | 수락률 · 따름률 · 따른 뒤 결과 | O7·K5 계측. 출시 빌드 수집 없음 (금지 34) |

기록: `tools/play-bot-console/logs/learned/stella-bench-history.ndjson` — 회차당 1줄 `{ ts, botVersion, gameRev, fidelityOk, humanLikeOk, A:{…}, C:{…}, verdict }`. 봇 벤치 기록과 같은 날·같은 `botVersion` 으로 묶어 「봇이 이만큼 나아져 스텔라가 이만큼 나아졌다」를 한 표로 본다.

## D-4. 흐름 — 봇 개선이 스텔라까지 가는 길

```text
1단 김플레이: 봇 정책·트윈 수정
   └▶ 일 1회 봇 벤치 (기존) ── 후퇴 있음 → 멈춤 (스텔라 검증 안 함)
         │ 후퇴 없음
         ▼
   botVersion 확정 = 정책 파일 해시 + 트윈 미러 확인 시각 + 게임 CSV 해시
         │ 지난 스텔라 검증 이후 botVersion 이 바뀐 날만
         ▼
   stella-verify (같은 FQA 루프 · 별도 프로세스 · 일 1회 이하)
     ① 충실도 확인 — 미러 미확인(WAIT)·픽스처 실패면 중단
     ② Part A — 후보 표 vs 지금 표 vs 조언 없음 · 4 시드 · 사람다운 대조군
     ③ Part C — humanClock 세션 재생 → 앱 sink·감지기·게이트 import 그대로 → 빈도·포착률
     ④ 강한 봇 경보 확인
         ▼
   stella-bench-history 1줄 + reports/stella-verify/<runId>.md
         │ 지금 표와 다른 후보가 있고 verdict=PASS 일 때만
         ▼
   out/stella-*.candidate.csv + 차이 리포트
   process-items 에 PB-S 항목 등록 (lane 3 · 담당 Fable / 기존값이면 대표님)
         ▼
   Fable 신규 행 반영 · 기존값은 대표님 승인 → build:content-tables → 김팀장 검수·커밋
         ▼
   앱 스텔라가 새 표로 말함 (앱 코드 변경 없음)
         ▼
   대표님 개발 빌드 플레이 → [PLAY_VERB] (관찰 동사 · ADVICE_FOLLOW · STELLA_PROACTIVE)
         ▼
   owner-playlog 수집 → human-seed · 수용도 기본값 → 2단 정책 적응 → 다시 1단
```

이 고리에서 **사람(대표님 실기)이 들어오는 곳은 마지막 한 칸**이다. 그래서 봇이 대표님 플레이를 닮아 갈수록(사람다움 축) 스텔라의 빈도·임계값도 대표님에게 맞아 간다. 이것이 「봇 성능 향상 = 스텔라 성능 향상」의 실제 경로다.

## D-5. 같은 코드 · 같은 문자열 계약 (R3·R4 해결)

- 봇 저널 행에 선택 필드 `obs?: { verb: PlayerObserveVerb; detail: string }` 를 더한다. `detail` 은 앱 `emitPlayVerb` 와 **같은 형식** (`hub:lose` · `sell:eden` · `start:shipyard:eden` …). 재생은 앱의 `parsePlayerObserveDetail`·`recordPlayerObserve` 를 그대로 부른다 — 파서가 하나다.
- 어휘 표 한 장: `tools/play-bot-console/src/observeVocab.ts` — `JournalKind` → 관찰 동사, 코퍼스 `PlayVerb` → 관찰 동사. 계약 테스트가 **양쪽 모든 값**이 표에 있는지(또는 명시적 「관찰 안 함」) 확인한다. 한쪽에 동사가 늘면 테스트가 깨진다.
- 봇이 import 하는 앱 모듈은 모두 **RN·store import 없는 순수 모듈**이어야 한다: `playerObserveSink` (완료) · `resolvePlayAdvice` · `stellaObserveSituations` · 게이트 판정. 시간은 인자(`nowMs`)로만 받는다. 이 조건은 O3·K2 의 김팀장 검수 항목이다.
- sink 는 모듈 상태 하나다. 시드마다 `resetPlayerObserve()` 후 순차 재생하거나 시드별 별도 프로세스로 돌린다 (한 프로세스 병렬 금지).

## D-6. 잠금 (Part D)

39. 스텔라 검증을 봇 벤치 후퇴 회차·미러 미확인 회차에 돌리기  
40. 판단력 최상위 봇 세션으로 Part C 빈도·임계값 산출  
41. 후보 표를 지금 정본 표와 비교 없이 올리기  
42. 봇이 `tables/`·앱 스텔라 런타임을 직접 수정  
43. 출시 빌드에서 실기 반응을 수집·전송 (개발 빌드 `[PLAY_VERB]` 만)

## D-7. 단계 (O·K 표에 추가)

| 단계 | 내용 | 담당 | 수용 기준 | 선행 |
|------|------|------|-----------|------|
| **D1** | `observeVocab.ts` + 계약 테스트 · 저널 `obs` 필드 · 방출 지점 detail 형식 일치 | 김플레이 | 어휘 계약 테스트 PASS · 같은 detail → 같은 digest | O1·O2 검수 |
| **D2** | `botVersion` 산출 · `stella-bench-history.ndjson` · 강한 봇 경보 | 김플레이 | 벤치 후퇴·미러 WAIT 회차에 스텔라 검증 0 | D1 |
| **D3** | `stella-verify` Part C 재생 (O4 와 같은 작업) | 김플레이 | §C-8 합격선 · 포착률·헛걱정률 기록 | O3 |
| **D4** | `stella-verify` Part A 3자 A/B · PB-S 항목 자동 등록 | 김플레이 | 후보 vs 지금 표 비교 리포트 | K2 |
| **D5** | 3단 프로세스 문서·감시판에 스텔라 칸 | 김플레이 | 감시판에 마지막 스텔라 검증 시각·verdict 표시 | D2 |

---

## 9. 단계와 담당

| 단계 | 내용 | 담당 | 수용 기준 | 지금 |
|------|------|------|-----------|------|
| **K0** | 본 설계 | 김플레이 | 대표님 승인 | **완료** |
| **K1** | 봇 정합 — A-9a/b/c · A-10 · G4–G7 반영 확인 후 트윈 재정렬 | 김플레이 | 트윈 「승리인데 전멸」 0 · 파괴 후 장착·귀환이 게임과 동일 · 4 시드 중 1장 완료 ≥3 | 진행 대기 (A-9 착수 전) |
| **K2** | 판정기 + 테이블 골격 | 김팀장(판정기·어댑터) · Fable(CSV·build) · 김플레이(픽스처) | 픽스처 테스트 PASS · tsc · 모든 행 `enabled=0` 으로 시작 | K1 이후 |
| **K3** | A/B 검증·수출 | 김플레이 | 행별 리포트 · 통과 행만 `enabled=1` 후보 · Fable 반영 | K2 이후 |
| **K4** | 입 연결 — 도구·주제/목적/지식 행·로컬 폴백·검역 | 김팀장 | 아래 대화 수용 테스트 전부 PASS · `audit:memory:all` · 김경제 재검수 | K3 에서 통과 행 ≥3 |
| **K5** | 개발 계측 `ADVICE`/`ADVICE_FOLLOW` · 실기 확인 | 김플레이 | dev 빌드에서만 로그 · 릴리즈 0 | K4 와 동시 |
| ~~K6~~ | 선제 조언 → **Part C `sit_risky_launch`·`sit_rough_day` 로 흡수** | — | — | 대체됨 |

**관찰·능동 트랙 (O) — Part A 선행조건과 무관하게 먼저 착수 가능**

| 단계 | 내용 | 담당 | 수용 기준 |
|------|------|------|-----------|
| **O1** | 관찰 sink 연결 · `emitPlayVerb` 항상 기록 · `land`/`level` 방출 (`destroy`/`repair`/`equip` 은 G6 커밋 후) | 김플레이 (1안) · 김팀장 검수 | 구현 완료 · 검수 대기 (`kim-play-handoff-stella-o1o2-20261006.md`) |
| **O2** | 링 + 하루 요약 — 대화 store 별도 필드 `observe` (512B) | 김플레이 (1안) · 김팀장 검수 | 구현 완료 · 검수 대기 |
| **O3** | 상황 CSV + 감지기 + 게이트 (순수 모듈 · D-5) | 김플레이 (감지기·게이트·픽스처) · Fable(CSV) · 김팀장 검수 | 상황별 양·음성 픽스처 PASS · 근원체와 공동 예산 테스트 · 봇이 import 가능 — 구현 완료 · 검수 대기 (`kim-play-handoff-stella-o3-20261006.md`) |
| **O4** | 봇 빈도 검증 (§C-8) = D3 | 김플레이 | 합격선 전부 PASS · 임계값 후보 수출 — 재생 완료 · 검수 대기 (`kim-play-handoff-stella-o4-20261006.md`). 판단만: 7개 중 4 PASS. 지금 앱: 허브 타이머 대화 요청이 스텔라라 하루 10.5회 |
| **O5** | 채널 3종 — ask 재사용 · message 명단 배지 · remark 신규 비차단 표면 | 김플레이 (1안) · 김팀장 검수 · remark 는 대표님 시안 확인 | 오버레이 계약 audit PASS · 전투·대화·웨이브 중 0회 · 실기 확인 |
| **O6** | 읽기 도구 `get_recent_activity` · 후속 · 수용도 학습 · Part A 연결 | 김플레이 (1안) · 김팀장 검수 | 수락 후 대화가 관찰 사실로 이어짐 · 무시 2회 후 쿨다운 2배 |
| **O7** | 개발 계측 `STELLA_PROACTIVE` · 대표님 실기 반응 수집 | 김플레이 | 개발 빌드만 · 수용도 기본값 조정 리포트 |

**권장 순서**: O1 → O2 → **D1** → O3 → O4(=D3) → D2 → O5 → O6 → O7 · D5. Part A 는 K1(봇 정합)이 끝나는 대로 K2 → D4(=K3 확장) 병행. O6 의 Part A 연결은 K4 이후. D1 을 O3 앞에 두는 이유: 감지기를 만들기 전에 봇과 앱의 입력 문자열을 하나로 묶어야 재생 결과를 믿을 수 있다.

**K4 대화 수용 테스트**

| 입력 | 기대 |
|------|------|
| operator · 「뭐부터 해야 돼?」 · 수리 필요 상태 | `repair_due` 줄, 숫자 없음 |
| operator · 같은 질문 즉시 반복 · 상태 동일 | 같은 행 억제 → 다음 우선 행 또는 「손댈 게 없어」 |
| operator · 「안녕」 | 도구 미호출 |
| arc_core 입 · 「뭐 해야 돼?」 | 조언 없음 (근원체 말투 유지) |
| 오프라인 (LLM 미연결) | 템플릿 줄 그대로 |
| LLM 이 「12,000크레딧이면…」 회신 | 검역 → 로컬 템플릿 |
| 무역소 없는 행성 | 무장·장비 조언 없음, 다른 kind 만 |

---

## 10. 선행조건

| 조건 | 이유 | 상태 (2026-10-06) |
|------|------|-------------------|
| A-9a 함선 예비금이 무장을 굶김 | `weapon_first` 근거 자체 | 김플레이 미착수 |
| A-9b 방어 장비·스킬·숙련·내구도·파괴 후 처리 | 트윈 승률이 실게임과 맞아야 `train_band` 가 맞음 | 미착수 |
| A-9c 전멸시켜도 패배 판정 | 승률 모순 | 미착수 |
| A-10 트윈 수입 검증 | `hull_ready` 예비금 임계값 | 보류 |
| PB-G4 arc_029 제외 · G6 장비 유지 · G7 가격 0 해소 | 진열·내구도 조언 입력 | 김팀장 반영 중 (차기 목록 이력 참조) |
| PB-G5 함선 등급 곡선 | `hull_ready` · `weapon_first` 비교 기준 | 수치 확정 전 보류 |
| PB-G2 경제 노출 | `trade_route` | 대표님 결정 대기 |

---

## 11. 결정 기록 · 남은 확인

### 11-1. 이 문서로 잠근 것 (대표님 2026-10-06 승인 방향)

- 대표님 계정 스텔라가 조언한다. 입력은 대표님 상태뿐.
- 봇은 **규칙과 근거**만 넘긴다. 봇의 사건은 넘기지 않는다.
- 판정기는 앱에 하나, 봇이 import.
- 물었을 때만, 한 가지만, 숫자 없이.

### 11-2. K4 무렵 대표님 확인 (기존값 변경이라 지금 정하지 않음)

1. `trade` · `shipyard` · `combat` 주제에도 조언 도구를 붙일지 (예: 「무역소 어때?」에 조언 한 줄 덧붙임).
2. ~~K6 선제 조언~~ → Part C 로 대체.

### 11-3. Part B·C 대표님 확인 (O3·O5 착수 전)

1. ~~**방해 예산** 초기값 — 하루 ask 1 · message 1 · remark 3~~ → **대표님 결정 (2026-10-06): 예산 없음.** 스텔라가 심한 정도와 「지금이 말할 때인가」로 스스로 판단 (§C-4). 근원체와 15분 간격·고장 방지 상한만 기술 조정.
2. **remark(말걸기) 신규 표면** — 허브 하단 비차단 한 줄. 새 UI 라서 모양은 김팀장 시안 후 확인.
3. **§16-2 개정** — 대표님 자신의 연속 파괴·패배에 대한 걱정은 스텔라가 먼저 말함(전투 보고는 근원체 유지).
4. 「침묵일」 비율 목표 20–60%.
5. **대표님 결정 (2026-10-06 · O4 후)**: 허브 타이머 대화 요청(실제로는 스텔라 1차 통신, 8~15분)을 없애고 스텔라 판단으로 합친다 — 잠금 5·§C-9 #37 해제 대상. 일상 질문(§16 하루 1회)도 판단으로 옮긴다. `rough_day` 포착 합격선은 「새 힘든 시기」만 센다.

확정 전에는 표의 값을 초기값으로 두고 O1·O2(관찰 입력)는 먼저 진행할 수 있다 — 관찰만으로는 화면에 아무 변화가 없다.

---

## 12. 인게임 오토모드와의 관계

`docs/playbot/인게임오토모드_기획설계_보고서.md` 의 **0단계(조언 모드)** 와 같은 자산이다. 같은 `resolvePlayAdvice` 결과를 화면 버튼(「추천 행동」)으로 보여 주면 오토모드 0단계, 스텔라 입으로 말하면 아는 동료다. 1단계 이상(대신 실행)은 본 문서 범위 밖이며 D6(b) write 금지가 그대로 적용된다.

---

**END** — `docs/playbot/STELLA_KNOWN_COLLEAGUE_DESIGN_v1.md` (내용 v2 + Part D + §1-A 잠금) · 김플레이 설계 · 김팀장 방향 채택 2026-10-06 · 구현: 0단계·O1·O2·잠금 2 가드·D1 (REVIEWED · 커밋 대기) · O3 (검수 대기) · 다음 O4
