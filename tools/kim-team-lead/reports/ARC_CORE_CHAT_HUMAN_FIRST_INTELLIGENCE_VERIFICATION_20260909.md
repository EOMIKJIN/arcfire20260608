# 아크코어 "성인 남성 수준 자연대화 + 시스템 연동" 재검수 (코드·설계 전수 검증, 코드 미착수)

```text
status=ANALYSIS_ONLY
task_id=arc-core-chat-human-first-intelligence-verification-20260909
kind=RE_VERIFICATION (CLAUDE.md 「김팀장 지시 재검수」)
code_changes=NO (대표님 지시 — "코드 작업 없이 분석 후 김팀장이 향후 확인 가능하게")
author=김클로드
date=2026-09-09
scope=docs/대화형_아크코어_구현.md §0-H·§0-H-2, arcCoreChatCasualTalk.ts, arcCoreChatDialogueDrive.ts, localConversationalReplySpec.ts, arcCoreChatWorldProposal.ts, arcCoreChatTableIndex.ts, aws/arc-core-chat/src/pack.ts, tables/content/arc_core_chat_*.csv, src/data/generated/csvArcCoreChat*.ts
```

## 0. 결론 먼저

대표님이 지적한 대로 **"기본 LLM 대화 기능은 작동하지만, 성인 남성 수준의 자연스러운 지적 대화가 실제로 이루어지는지는 확인되지 않은 상태"가 맞다.** 설계(§0-H/§0-H-2)와 라우팅 로직(`arcCoreChatDialogueDrive.ts`) 자체는 방향이 맞게 짜여 있다. 하지만 **재검수 결과, 이 설계가 지금 실제 게임에서 온전히 작동하지 않는 것을 확인**했다 — 가장 큰 원인은 코드 버그가 아니라 **빌드 파이프라인 누락**이다.

| 심각도 | 발견 | 한 줄 |
|--------|------|------|
| **P0** | CSV는 편집됐는데 런타임이 읽는 생성 파일이 재빌드 안 됨 | `seats`·`cores`·`trade`·`shipyard` 4개 신규 토픽이 **지금 앱에서 전혀 인식되지 않는다.** 실제 테스트 1건이 이걸로 이미 FAIL 중 |
| **P1** | 토픽 키워드 매칭이 무경계 부분일치라 일상 말이 시스템 축으로 오분류될 위험 | "성인 남자다운 자연스러움"을 지키는 §0-H 가드가, 그 가드가 의존하는 토픽 판정 자체의 결함 때문에 뚫릴 수 있음. 테스트로 검증된 적 없음 |
| **P2** | 로컬(오프라인) 폴백의 일상 대화가 고정 문장 2개뿐 | 클라우드가 매 턴 100% 성공한다는 보장이 없는 한, "매 턴 같은 말"이라는 이 문서 자신의 불합격 기준에 걸리는 경로가 실제로 존재 |
| **P3** | `arcCoreChatWorldProposal.ts` 주석과 실제 동작 불일치 | 지금은 무해하지만 향후 오해 소지 |

아래 §1~§4에서 각각 file:line 근거와 재현 방법을 든다.

---

## 1. [P0 최우선] CSV 편집 후 빌드 안 됨 — §0-H-2가 약속한 4개 시스템이 지금 안 보임

### 1-1. 직접 재현한 증거

```powershell
npx tsx --test src/arcCore/chat/arcCoreChatConversation.test.ts
```

**FAIL** — `asked seats and trade stay knowledge talk not a facility hijack`

```text
buildArcCoreChatTurn('12좌가 뭐야', ...).topicId
expected: 'seats'
actual:   'other'
```

### 1-2. 근본 원인 — 소스 CSV와 런타임 생성 파일의 시각차

```powershell
tables\content\arc_core_chat_topics.csv     LastWriteTime 09-09 23:40:03
tables\content\arc_core_chat_knowledge.csv  LastWriteTime 09-09 23:19:33
src\data\generated\csvArcCoreChatTopics.ts  LastWriteTime 09-09 22:01:53  ← 78~99분 더 오래됨
src\data\generated\csvArcCoreChatKnowledge.ts LastWriteTime 09-09 22:01:53
```

`src/data/generated/csvArcCoreChatTopics.ts`를 직접 열어 확인 — **`seats`·`cores`·`trade`·`shipyard` 4행이 통째로 없다.** `csvArcCoreChatKnowledge.ts`도 `know_seats`/`know_cores`/`know_trade`/`know_shipyard` 검색 결과 **0건**. 즉 소스 CSV는 §0-H-2가 요구한 4개 신규 지식 축("열두 좌·행성 지표·무역소·조선소")을 전부 담고 있는데, **`npm run build:content-tables`(또는 좁혀서 `build:arc-core-chat-tables`)가 그 이후 재실행되지 않아 런타임은 여전히 구버전 인덱스를 쓴다.**

### 1-3. 실제로 벌어지는 일 (코드로 추적)

`arcCoreChatTableIndex.ts:169` `hintArcCoreChatTopicId`가 이 stale `ARC_CORE_CHAT_TOPICS_FROM_CSV`를 모듈 로드 시 캐싱해서 쓴다(`arcCoreChatTableIndex.ts:63` `topicCache`). "12좌가 뭐야"·"무역소는 있어?"·"조선소 있나"·"코어 지표 어때" 같은 질문은 전부 어떤 topic hint에도 안 걸려 `other`로 떨어지고, `arcCoreChatCasualTalk.ts:isArcCoreChatSystemAxis`도 `SYSTEM_TOPIC_IDS`에 이 4개를 갖고 있지만(코드 자체는 맞게 짜여 있음) topicId가 애초에 'seats'/'cores'/'trade'/'shipyard'로 안 잡히니 무용지물이다.

**결과**: §0-H-2가 "충분히 나눌 수 있어야 한다"고 못박은 6개 축(12좌·일일정리·행성지표·광맥·무역소·조선소) 중 **광맥(mining)·일일(daily)은 살아있고, 12좌·행성지표·무역소·조선소 4개는 지금 이 순간 게임에서 죽어 있다.** 대표님이 "지적 수준 대화가 되는지 확인 못 했다"고 느낀 이유의 상당 부분이 여기 있을 가능성이 높다 — 시스템 지식을 물어도 `other`(일상 취급)로 빠지면, 클라우드 LLM은 그 축을 팩에 실린 지식 카드 없이 즉흥으로 받아야 하고, 없는 지식을 지어내지 않는 게 헌법(L8)이라 결국 얕은 대답이나 회피로 흐르기 쉽다.

### 1-4. 확인 필요 (분석만, 실행은 안 함)

이 세션은 지시대로 코드/빌드를 실행하지 않았다. **김팀장이 `npm run build:content-tables`(또는 `node tools/content-tables/build-arc-core-chat-tables.mjs`)를 재실행하고, `arcCoreChatConversation.test.ts`가 24/24로 돌아오는지 재확인**하는 게 가장 먼저 할 일이다. 이건 코드 수정이 아니라 빌드 스텝 실행이라 리스크가 사실상 없다.

**부수 발견**: `package.json`의 `postinstall`/`prestart`/`preandroid`는 `build-balance-from-csv.mjs`만 자동 실행하고 `build:content-tables`(아크코어 챗 CSV 포함)는 **자동 훅에 없다** — 수동 실행 의존이라 이번 같은 누락이 구조적으로 재발하기 쉽다. 코드 변경 제안이 아니라 운영상 주의점으로만 기록한다.

---

## 2. [P1] 토픽 판정이 "무경계 부분일치" — 일상 말이 시스템 축으로 잘못 튈 위험

`arcCoreChatTableIndex.ts:169-185` `hintArcCoreChatTopicId`:

```ts
if (hint && lower.includes(hint.toLowerCase())) return id;
```

단어 경계 없는 **단순 부분 문자열 포함 검사**를, `refuse > location > spy > combat > safety > notice > mission > story > mining > daily > cores > trade > shipyard > seats > self > smalltalk > greet > other` 순으로 시스템 축을 먼저 검사한다. §0-H의 핵심 약속("일상 말에 시스템 가로채기 금지")은 **이 판정이 정확할 때만** 성립하는데, 판정 자체가 느슨하다.

**구체적 충돌 사례** (topics.csv 실제 키워드 기준, 코드로 확인):

| 유저가 실제로 할 법한 말 | 걸리는 키워드 | 잘못 튀는 축 |
|--------------------------|----------------|--------------|
| "나 요즘 여기 되게 심심해" | `location` hint `여기` | `location`(위치)으로 튐 — "여기" 부분일치 |
| "숙제 결과 어때" / "그 결과 어떻게 됐어" | `combat` hint `결과` | `combat`(전투)으로 튐 |
| "오늘 좀 활력이 없다" | `cores` hint `활력`(코어 지표=자원/인구/방어/기술/**환경**… vitality) | `cores`(행성 지표)로 튐 — 사람 기분 얘기가 행성 스탯 취급됨 |
| "누구 왔어?" / "이거 누구 아이디어야" | `self` hint `누구` | `self`(정체성 질문)로 튐 |

`isArcCoreChatSystemAxis`(`arcCoreChatCasualTalk.ts:40`)는 `topicId`가 이미 시스템 축으로 **잘못** 잡혀 있으면 그걸 그대로 신뢰한다 — 즉 이 오분류를 막을 안전망이 없다. §0-H가 "실패 예"로 든 것과 정확히 같은 모양의 실패("여기 어디야?"류 취급을 원치 않는 캐주얼 문장에)가 재현 가능하다.

**테스트 커버리지 갭**: `arcCoreChatCasualTalk.test.ts`(4개)·`arcCoreChatDialogueDrive.test.ts`·`arcCoreChatConversation.test.ts`(24개, 1개 FAIL) 전부 확인했지만, **"시스템 키워드가 우연히 섞인 캐주얼 문장"을 실제 `hintArcCoreChatTopicId`에 통과시켜 오분류를 검증하는 테스트는 0건**이다. 기존 테스트는 전부 `topicId`를 수동으로 넣어주거나(단위 격리), 충돌 없는 깨끗한 입력만 쓴다. 이 클래스의 실패를 아무도 아직 못 봤을 가능성이 높다 — 리포트만 하고 재현 테스트는 추가하지 않았다(코드 미착수 지시).

---

## 3. [P2] 로컬(오프라인) 캐주얼 대화가 고정 문장 2개뿐 — 자체 기준(§3-2)에 걸림

`localConversationalReplySpec.ts:170-174` `specForHumanTalk`가 캐주얼 축 전체를 담당하는데, 실제 문구는:

```
src/i18n/locales/ko.ts:838  'arcCoreChat.reply.smalltalk': '그래. 여긴 잠잠하다. 너는 좀 어때.'
src/i18n/locales/ko.ts:839  'arcCoreChat.reply.smalltalkAgain': '응, 이어서 말해.'
```

"오늘 기분 어때"·"심심해"·"고마워"·"오늘 힘들었어"·"사랑해" 등 **완전히 다른 감정·화제의 문장이 전부 이 두 줄 중 하나로 귀결**된다. `docs/대화형_아크코어_구현.md` §3-2가 스스로 정의한 불합격 기준 — "매 턴 같은 브리핑 3줄 = 접수 창구" — 이 정확히 이 경로에 해당한다(브리핑이 아니라 잡담이라는 점만 다를 뿐, "매 턴 같은 문장"이라는 본질은 같다).

클라우드(F1)가 매번 성공하면 안 드러나지만, 이 프로젝트는 스스로 "로컬이 하한"(§3-3 "LIVE 전 로컬 복도가 하한")이라고 못박아 왔다 — 캐주얼 축만은 이 하한이 사실상 거의 없는 셈이다. 무료 티어 쿼터 초과(429)·타임아웃·검역 실패 등 클라우드가 매 턴 100%를 보장 못 하는 상황이 이미 여러 차례 이 세션에서 확인된 바 있어(라운드 2~4 참고), 캐주얼 대화 도중 한 번이라도 폴백이 뜨면 "그래. 여긴 잠잠하다…"가 튀어나와 몰입이 바로 깨진다.

---

## 4. [P3, 낮은 우선순위] `arcCoreChatWorldProposal.ts` 주석-동작 불일치

`arcCoreChatWorldProposal.ts:1-5`:

```ts
// 세계 콘트롤 B안 예약 슬롯.
// 현재 개발 경로 = A(관측만). LIVE=false 동안 제안은 항상 null.
```

하지만 실제로 대화 흐름이 쓰는 함수는 `suggestArcCoreChatWorldProposal`(37번째 줄)이고, 이 함수는 `ARC_CORE_CHAT_WORLD_PROPOSAL_LIVE`/`isArcCoreChatWorldProposalLive()`를 **전혀 참조하지 않는다** — `hasTradePort`/`hasShipyard`만 보고 바로 `'open_trade'`/`'open_shipyard'`를 반환한다. `arcCoreChatDialogueDrive.ts:79` `pickEmptyAxisDrive`가 실제로 이 함수를 호출해 `nextAsk`에 그 값을 싣는다.

**지금은 위험하지 않다** — 실행 함수(`dispatch`류)가 존재하지 않아(주석 41행 "집행 함수는 두지 않는다") 실제 시설을 여는 동작으로 이어지지 않는다, `nextAsk`는 대화 힌트일 뿐이다. 다만 파일 헤더 주석이 "LIVE=false면 항상 null"이라고 말하는 함수(`resolveArcCoreChatWorldProposal`)와, 실제로 쓰이는 함수(`suggestArcCoreChatWorldProposal`)가 **이름은 비슷한데 게이팅 여부가 다르다** — 향후 누군가 "주석대로 LIVE=false면 안전하다"고 믿고 이 함수 주변에 집행 로직을 얹으면 그 순간 §0-G/L1("입은 대화, 몸은 운용") 위반으로 직행할 수 있는 구조다. 지금 고칠 필요는 없지만 인지해 둘 가치가 있다.

---

## 5. 잘 짜여 있는 부분 (정정 없이 AGREE)

전부 부정적인 것만 있는 건 아니다 — 다음은 코드를 직접 열어 확인했고 설계 의도대로 잘 되어 있다:

- **Lambda 프롬프트 계층화**(`aws/arc-core-chat/src/pack.ts:199-224`) — "Layer 0(일상)/Layer 1(지식)" 구분, "Purpose/Mode/GM은 배경일 뿐 그대로 베끼지 말고 유저 마지막 말에 안 맞으면 무시하라"는 지시가 실제로 프롬프트에 들어가 있다. 이건 "브리핑 강제" 실패를 LLM 레벨에서 막는 좋은 설계다.
- **인간우선 게이트 자체의 단위 로직**(`arcCoreChatCasualTalk.ts`, `arcCoreChatDialogueDrive.ts:123-131`) — 입력받은 topicId가 정확하다는 전제하에서는 캐주얼/시스템 분기가 올바르게 짜여 있다(§2의 문제는 "입력이 정확하다는 전제"가 깨질 수 있다는 것이지, 이 게이트 자체의 로직 결함이 아니다).
- **월드 write 금지 경계**는 이번 확장 전체에서 일관되게 지켜짐 — 신규 도구(`get_mining_allowance`/`get_daily_ops_status`) 전부 read-only, 신규 topic 4개도 knowledge-only.
- **`arcCoreChatConversation.test.ts` 자체의 존재와 범위**(24개 케이스, greet/refuse/spy/combat/proposal-memory/empty-axis까지 커버) — 테스트 설계 자체는 폭넓고 촘촘하다. §1의 FAIL은 테스트가 나쁜 게 아니라 **빌드가 테스트를 못 따라간 것**이다.

---

## 6. 대표님 질문에 대한 직접 답

> "결론적으로 의도는 인간과 대화하는 자연스러운 주고받기 대화를 기준으로 현재 게임의 내용 및 시스템 등에 대해서도 플레이어 vs 아크코어 간 대화가 지적수준으로 이루어져야 한다는 것"

**설계는 정확히 이 방향으로 짜여 있다** (§0-H/§0-H-2, Lambda Layer 0/1). **그러나 지금 이 순간 실제로 켜서 테스트하면:**

1. 일상 잡담은 클라우드가 살아있는 한 자연스럽게 받아질 가능성이 높다(설계·프롬프트 근거 확인).
2. **"12좌 뭐야", "무역소 있어?", "조선소는?", "행성 지표 어때?" 같은, 정확히 "게임 시스템에 대한 지적 대화"를 시험하는 질문들은 지금 전부 실패한다** — §1의 빌드 누락 때문에 시스템이 그 축 자체를 인식하지 못한다. 이게 대표님이 "확인하지 못했다"고 느낀 원인의 핵심일 가능성이 높다.
3. 캐주얼 대화가 여러 턴 이어지다 클라우드가 한 번이라도 실패하면, 같은 두 문장 중 하나가 튀어나와(§3) "성인 남자 수준"이 아니라 "창구"로 순간 되돌아간다.
4. §2의 오분류 위험은 아직 실기로 걸린 사례를 못 봤지만(테스트 부재), 코드 구조상 재현 가능한 잠재 결함이다.

---

## 7. 다음 단계 제안 (제안만 — 이번엔 실행 안 함)

| 순서 | 항목 | 근거 |
|------|------|------|
| 1 | `npm run build:content-tables` 재실행 + `arcCoreChatConversation.test.ts` 24/24 재확인 | §1 — 지금 가장 크게 막힌 것, 리스크 거의 없음 |
| 2 | `hintArcCoreChatTopicId`에 단어 경계 검사(또는 최소 조사 분리) 도입 검토 + §2의 4개 충돌 사례를 테스트로 고정 | §2 — 재현 안 된 잠재 결함을 사고 전에 막음 |
| 3 | 로컬 캐주얼 폴백에 2~3개 문장 로테이션(또는 최소한 사용자 문장에서 짧은 키워드를 반영한 변주) 검토 | §3 — 클라우드 실패 시 체감 저하 완화 |
| 4 | `arcCoreChatWorldProposal.ts` 헤더 주석을 `suggestArcCoreChatWorldProposal`의 실제 게이팅 부재에 맞게 정정 | §4 — 낮은 우선순위, 문서 정합성만 |

---

## 8. PSS (재확인 — 이번 재검수 자체는 관측만, 변경 없음)

```text
[pss-pre-dev] hot_path=조사만 — 코드 실행은 npx test/tsc 자기검증뿐, 런타임 삽입 없음
[pss-pre-dev] alloc=신규 없음
[pss-pre-dev] cache=신규 없음
[pss-pre-dev] verdict=PASS — 분석 전용, 코드/빌드 변경 없음(대표님 지시)
```

## 9. 지금 하지 않은 것

이 문서는 분석·검증까지만이다. §7의 4개 항목 중 무엇도 실행하지 않았다 — `npm run build:content-tables`조차 이 세션에서 돌리지 않았다(대표님 지시 "코드 작업 없이"를 빌드 스텝까지 포함해 엄격히 해석). 김팀장이 이 문서로 직접 재현·확인 후 진행.

---

# 라운드 2 — 김팀장 작업 완료 후 전체 재검수 (2026-09-10)

```text
status=RE_VERIFIED
trigger=대표님 — "김팀장 작업 완료. 재검수하라"
method=코드 직접 재실행 + 실측(테스트·타임스탬프·함수 직접 호출) — 보고 받아쓰기 없음
```

## 10. §1~§4 재검수 결과 — 항목별 AGREE/DISAGREE

| # | 라운드1 지적 | 판정 | 실측 근거 |
|---|--------------|------|-----------|
| P0 | CSV 편집 후 빌드 안 됨(`seats`/`cores`/`trade`/`shipyard` 인식 불가) | **해결 확인(AGREE)** | 타임스탬프 재확인: `csvArcCoreChatTopics.ts`·`csvArcCoreChatKnowledge.ts` 둘 다 09-10 00:10:03로, 두 소스 CSV(00:04:12·23:19:33)보다 최신. `npx tsx --test arcCoreChatConversation.test.ts` 재실행 — **24/24 전부 PASS**(이전 FAIL이던 "asked seats and trade…" 통과 확인) |
| P1 | 토픽 판정이 무경계 부분일치 — 일상 말이 시스템 축으로 오분류 위험 | **미해결(그대로, DISAGREE — 아직 안 고쳐짐)** | `hintArcCoreChatTopicId` 코드 동일. **직접 함수를 호출해 실측**(임시 스크립트, 검증 후 삭제): `"오늘 좀 활력이 없다"` → `cores`, `"숙제 결과 어때"` → `combat`, `"누구 왔어?"` → `self`, `"나 요즘 여기 되게 심심해"` → `location`. 4건 전부 캐주얼 문장이 시스템 축으로 튐 — 라운드1 예측이 전부 재현됨 |
| P2 | 로컬 캐주얼 폴백이 고정 문장 2개뿐 | **미해결(그대로)** | `ko.ts:838-839` 문구 byte-identical — `'그래. 여긴 잠잠하다. 너는 좀 어때.'` / `'응, 이어서 말해.'` |
| P3 | `arcCoreChatWorldProposal.ts` 주석-동작 불일치 | **미해결(그대로)** | 파일 내용 byte-identical — 헤더 주석은 여전히 "LIVE=false면 항상 null"이라 하고, 실사용 함수 `suggestArcCoreChatWorldProposal`은 여전히 그 플래그를 안 봄 |

**추가 확인(라운드1에 없던 것, 이번에 새로 발견)**: `tables/content/arc_core_chat_persona.csv` 전체가 "성인 남자"/"또래 남자" 톤으로 다시 쓰였다(`persona_temperament`·`persona_goal`·`persona_style`·`persona_tone` 4행 갱신 확인) — §5-1에서 제안했던 페르소나 심화가 실제로 반영됨. `npx tsc --noEmit -p tsconfig.client.json` 0에러.

## 11. 종합 판정

**부분 완료(PARTIAL).** 이번 "작업 완료"로 처리된 범위는 **P0(빌드 재생성)와 페르소나 톤 심화** 딱 두 가지로 보인다 — 둘 다 실측으로 확인됐고 잘 됐다. 반면 라운드1에서 지적한 **P1(오분류 위험)·P2(로컬 캐주얼 반복)·P3(주석 불일치)는 코드 한 글자도 안 바뀌었다** — 아직 손이 안 간 상태다.

대표님이 던진 "12좌가 뭐야?" 류 질문은 이제 정상 작동한다(P0 해결 덕). 하지만 **"오늘 활력이 없다"처럼 순수 일상 말인데 시스템 키워드가 우연히 섞인 문장은 지금도 실제로 행성 지표(cores) 취급을 받는다** — §0-H가 약속한 "일상 말에 시스템 가로채기 금지"가 이 케이스에서 실제로 깨지는 걸 이번에 직접 재현했다. 이건 라운드1엔 코드 추적상의 "위험"이었는데, 이번 재검수로 **실측 재현된 확정 결함**으로 격상됐다.

## 12. 다음 우선순위 (라운드1 §7 갱신)

| 순서 | 항목 | 상태 |
|------|------|------|
| ~~1~~ | ~~build:content-tables 재실행~~ | **완료** |
| ~~—~~ | ~~persona.csv 톤 심화~~ | **완료(요청 범위 밖 보너스)** |
| 2 | `hintArcCoreChatTopicId` 단어경계 처리 + §2/§10 재현 사례 4건을 회귀 테스트로 고정 | **미착수, 최우선으로 승격** — 실측 재현됐으므로 |
| 3 | 로컬 캐주얼 폴백 문장 다양화 | 미착수 |
| 4 | `arcCoreChatWorldProposal.ts` 주석 정정 | 미착수, 낮은 우선순위 |

## 13. 지금 하지 않은 것 (라운드 2)

재검수 전 과정이 읽기 전용이었다 — 유일한 실행은 기존 테스트 재실행(`npx tsx --test`)과 실측용 임시 스크립트(`tmpCheckTopicHint.ts`, 검증 직후 삭제·git 잔류 없음 확인) 뿐이었다. 소스 코드·CSV·빌드 산출물 전부 무변경.

**END (라운드 2)** — 2026-09-10 · 김클로드
