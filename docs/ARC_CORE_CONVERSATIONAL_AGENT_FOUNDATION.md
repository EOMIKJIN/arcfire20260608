# 아크코어 대화형 에이전트 — 근본 설계 재분석

> **문서 버전**: v0.1  
> **작성**: 2026-08-14  
> **상태**: **재분석 초안 · 흡수됨** — 구현 정본은 `docs/대화형_아크코어_구현.md` v1.0  

> **성격**: v0.5 키워드·템플릿 턴을 **접수 창구/오프라인 폴백**으로 강등하고, 실제 LLM 에이전트 대화 루프를 입에 이식하기 위한 데이터·기반 설계  
> **교차**: `docs/ARC_CORE_BACKCHANNEL_AND_HUB_TALK_ROSTER.md` v0.5 (채널·UI·스토어 40/500) · `docs/ARC_CORE_SUSTAINABLE_LEARNING_MODEL_v1.md` (학습 축 — **채팅과 병합 금지**)  
> **헌법**: v4.0 §8·§10·§14 · 입은 대화 / 몸은 운용 · 12좌 고정 · 온디바이스 LLM 금지 · PSS §0-A

---

## 0. 한 줄 결론

**실제적인 대화 = 사고(생성) + 기억 + 관측 도구 + 헌법.**  
지금 구현(`classify` 6종 + i18n 키)은 접수 창구이지 에이전트가 아니다.  
사고능력은 로컬 단어 조합으로 흉내 내지 않는다. **클라우드 서비스 LLM이 생각하고**, 클라는 **그 에이전트가 쓸 세계·기억·도구·금지를 조립**한다.

```text
[pss-pre-dev] hot_path=유저 전송 1회 alloc=컨텍스트팩 1개+도구 결과 N개(스칼라) cache=지식 CSV 1회 인덱스·대화상태 bounded
[pss-pre-dev] stage=기존 overlay · hydrate 오픈/허브 안착만 · 전 행성/80전 텔레메트리 디스크 재읽기 금지
[pss-pre-dev] verdict=PASS — 틱 사고·온디바이스 모델·학습버스 합류·월드 write 도구 없으면 기반 착수 가능
```

---

## 1. 왜 재분석인가

대표님 요구: 인간형 대화 = **실제 LLM 에이전트 대화 방식을 그대로 흉내 낸 프로세스**.  
단순 단어 조합이 아니라 **상당한 사고능력**으로 플레이어와 실제 대화.

| v0.5가 한 일 | 한계 |
|--------------|------|
| 주고받기 UI · 40캡 로그 · Provider 자리 | 채널만 있음 |
| 정규식 6의도 → i18n 1키 | **분류기 + 문장 사전**. 사고 없음 |
| `alreadyCovered` 불리언 | 주제가 아니라 “이 키를 썼는가” |
| facts 3개 (`planetLabel` · spy bool · combat bool) | 세계를 거의 모름 |
| 「그 외」→ 되묻기 | 열린 질문·추측·설명·기억 연결 불가 |

「안녕 반가워 → 반갑습니다. 무엇이 필요하십니까?」는 **첫 인사 연출**이지 대화 지능이 아니다.  
키워드를 50개로 늘려도 플레이어가 한 문장만 벗어나면 다시 되묻는다. 그것이 이번 재분석의 출발점이다.

---

## 2. 실제 LLM 에이전트 대화가 하는 일 (8층)

Cursor·클라우드 에이전트·상용 캐릭터 챗이 공통으로 도는 루프다. 모델만 있는 것이 아니다.

```text
① 헌법 (system)     나는 누구인가 · 무엇을 하지 않는가
② 작업기억 (working)  지금 이 창의 최근 발화
③ 일화기억 (episodic) 이전 대화에서 무엇이 약속·언급됐는가
④ 의미기억 (semantic) 세계관·설정·말할 수 있는 지식
⑤ 관측 도구 (tools)   지금 행성·첩보·전투 등 읽기
⑥ 사고 (scratchpad)   무엇을 물을지/답할지 내부 추론
⑦ 발화 (generate)     플레이어에게 보이는 한 턴
⑧ 검역 (policy)       환각·명령·비밀 누설 차단
```

상용 에이전트는 ⑥⑦을 **LLM**이 한다. ①~⑤·⑧은 **시스템이 매 턴 조립**한다.  
지능은 모델에 있고, **대화가 세계와 맞게 하는 힘**은 ①~⑤·⑧에 있다.  
Arcfire에 없는 것은 모델만이 아니다. **①~⑤·⑧의 데이터와 기반이 거의 없다.**

| 층 | 실제 에이전트 | Arcfire 지금 | 판정 |
|----|---------------|--------------|------|
| ① 헌법 | 긴 system prompt | i18n 거절 한 줄 | 없음 |
| ② 작업기억 | 최근 N턴 원문 | 스토어 40 · 회신은 8턴을 의도로만 압축 | 반쪽 |
| ③ 일화기억 | 요약· entites | 없음 (FIFO가 삭제하면 잊음) | 없음 |
| ④ 의미기억 | RAG/설정 문서 | 없음 (CSV 지식 카드 없음) | 없음 |
| ⑤ 도구 | 검색·파일·API | facts 3필드 고정 주입 | 없음 |
| ⑥ 사고 | hidden CoT / tool plan | 정규식 우선순위 | 없음 |
| ⑦ 발화 | 모델 생성 | 고정 한국어 템플릿 | 접수 창구 |
| ⑧ 검역 | output filter | 500자 절단만 | 반쪽 |

---

## 3. 현재 코드 대조 (사실)

| 파일 | 하는 일 |
|------|---------|
| `arcCoreChatIntent.ts` | 6 정규식. 복합문은 우선순위 고정 |
| `localConversationalReplySpec.ts` | intent × alreadyCovered → i18n 키 |
| `arcCoreChatTurnFacts.ts` | 행성명 · 스파이 유무 · 로그에 `combat_end` 있는지 |
| `arcCoreChatReplyProvider.ts` | `local`만 반환. cloud는 타입만 |
| `presentArcCoreBackchannel.ts` | 채널 오픈 · 전송 1경로 (유지) |

레포에 OpenAI/Anthropic/Gemini 클라·Callable 채팅은 **없다**. `functions/src/index.ts`는 `ping`만.  
`NarrativeDialog`는 일방 스크립트 — 에이전트 루프가 아니다.  
`ArcCoreObservationBus` / Learning Store는 **경제·배치 학습 축**이다. 채팅 사고와 **합치면 안 된다**(일 1회 배치·부트 회귀).

---

## 4. 「사고능력」을 어디에 둘 것인가

| 선택 | 내용 | 판정 |
|------|------|------|
| A. 키워드·템플릿 확대 | 의도 30개 · 문장 200개 | **기각**. 사고 아님. 대표님 요구와 반대 |
| B. 온디바이스 LLM | 폰에서 생성 | **헌법 금지**. PSS/OOM · Skia와 공존 불가 |
| C. 로컬 규칙 추론기 | 직접 만든 planner | 유지비 큼. 열린 대화 불가. 보조만 |
| **D. 클라우드 서비스 LLM + 로컬 스캐폴드** | ⑥⑦은 서버 모델. ①~⑤·⑧은 클라/Functions가 매 턴 조립 | **1안** |

D가 “LLM 에이전트 대화 방식을 그대로 흉내”의 정본이다.  
로컬만으로 「상당한 사고」를 선언하는 것은 허위다.  
오프라인·타임아웃·키 없음일 때는 v0.5 템플릿이 **폴백**으로 남는다. 폴백을 지능이라고 부르지 않는다.

**Local-AI-First와의 관계**: 전투·경제·트래픽·배치는 계속 로컬.  
입은 **예외 승인된 클라우드 생성**(이미 정본 §6-2에 Function 자리).  
생성 실패 시 세계는 멈추지 않는다. 입만 폴백한다.

---

## 5. 목표 루프 (에이전트 한 턴)

채널 API(`present` / `submit`)·오버레이·40캡 로그는 **유지**. 바뀌는 것은 회신 내부다.

```text
유저 한 줄
  │
  ├─ 1. DialogueState 갱신 (주제 스택 · 아크가 물은 것)
  ├─ 2. ContextPack 조립 (헌법 + 지식카드 + 작업기억 + 일화요약)
  ├─ 3. ReadTools (필요 시만, 화이트리스트, 동기 스칼라)
  ├─ 4. Provider
  │     cloud: Functions 단발 ← pack + tool results + userText
  │            서버: 서비스 LLM (사고+발화). 키는 Secret
  │     local: 폴백 템플릿 (지능 아님)
  ├─ 5. 검역 (길이 · 금지 토큰 · 섀도우 · 아이템/퀘스트 신설 · 명령 암시)
  ├─ 6. 일화요약 롤링 (400자 상한, 전송 코얼레스 persist)
  └─ 7. 화면 append (기존 스토어)
```

도구가 월드를 **쓰지 않는다**. 모델이 「크레딧을 올려라」고 해도 ⑧에서 막고, 명령버스에 넣지 않는다.  
이전 설계의 모드 C(툴로 세계 변경)는 계속 **금지**.  
모드 A(윤색만)는 지능이 로컬 초안에 갇힌다. **실제 대화에는 모드 B(생성)** 가 본선이다.

```text
클라 --(턴 팩, 벤더 모름)--> Functions --(서버만 벤더 SDK)--> 서비스 LLM
클라 <--(text, usage)------- Functions
```

스트리밍·`onSnapshot`·동시 요청 N개·타이틀/prewarm 대기 **금지**. `inFlight` 1 · 타임아웃 → local 폴백.

---

## 6. 구축할 데이터 (Table-First + bounded store)

### 6-1. 신규 CSV (편집 정본 · 기존 밸런스 CSV 불변)

| 테이블 | 역할 | 비고 |
|--------|------|------|
| `tables/content/arc_core_chat_persona.csv` | ① 헌법 조각. 정체·말투·금지 | 빌드 → generated 인덱스. 런타임 문자열 하드코딩 금지 |
| `tables/content/arc_core_chat_knowledge.csv` | ④ 말할 수 있는 지식 카드 (id, topic, textKo, textEn, speakIf) | 전량 주입 금지. 토픽/질의로 **최대 4장** |
| `tables/content/arc_core_chat_topics.csv` | 주제 id · 설명 · 기본 도구 힌트 | 의도를 정규식 6종에서 **주제 카탈로그**로 승격. 분류는 힌트일 뿐 생성의 전부 아님 |

`speakIf` 예: `always` · `spy_pending` · `revealed_shadow` · `never_before_reveal`.  
지식 카드에 짝 닉네임·크레딧 잔액·언락 치트를 두지 않는다.

### 6-2. 신규/확장 로컬 상태 (계정 귀속)

채팅 로그 40/500은 **유지**. 스키마에 아래만 **작게** 추가하거나 키를 분리한다.

| 필드 | 상한 | 용도 |
|------|------|------|
| `rollingSummary` | **400자** 1개 | ③ 일화기억. FIFO로 지워진 턴의 압축 |
| `topicStack` | **4개** id | 지금 이야기 중인 주제 |
| `lastArcQuestion` | 200자 또는 topic id | 아크가 되물은 것 (인간 대화의 핵심) |
| `inFlight` | bool 메모리만 | persist 안 함 |

분리 키를 쓸 경우 `arcfire_arc_core_chat_agent_v1` — purge + game-save + reload **4곳 세트**.  
틱 persist 금지. 전송 성공 후 기존 1.5s 코얼레스에 합류.

### 6-3. 넣지 않는 데이터

| 금지 | 이유 |
|------|------|
| 학습 Observation 버퍼를 채팅 컨텍스트에 통째 | 경제 축 · 부트/배치 회귀 · 거대 |
| `planetCoreRuntimeStore` 전 행성 | O(N) · 전송 경로 금지. **현재 행성 5스칼라만** 도구로 |
| 전투 텔레메트리 80건 디스크 재읽기 | `listRecentMatchSummaries`는 async 전체 read. **lastMatch 동기 캐시 1건**만 |
| 인벤/함선/금고 전체 | 환각·치트·용량 |
| 섀도우 닉네임 · 기함 스냅샷 (리빌 전) | §16-A |
| 모델 사고 원문 persist | 무한 성장. DEV 로그 1건만 허용 |

---

## 7. 읽기 도구 화이트리스트 (입은 관측만)

도구는 **로컬 동기 함수**. 모델(또는 로컬 힌트)이 이름을 고르고, 클라가 실행해 결과를 팩에 넣는다.  
1턴 도구 **최대 4개**. 반환은 스칼라/짧은 구조체.

| tool | 읽기 | 안전 | 주의 |
|------|------|------|------|
| `get_location` | `currentPlanetId` + 표시명 | 말 가능 | 지금과 동일 |
| `get_callsign` | 닉네임 | 말 가능 | 토큰 `[닉네임]` |
| `get_spy_alert` | pending 유무 + 행성별 한 줄 | 말 가능 | 원문 장문 금지 |
| `get_last_combat` | **동기 last 1건** (승패·행성·초) | 말 가능 | 80건 디스크 금지. `recordMatchSummary` 시 캐시 |
| `get_planet_cores` | 현재 행성 R,P,D,T,E | 말 가능 | `getPlanetCoreRuntime(planetId)`만 |
| `get_latest_notice` | 바 최신 **1건** 제목 | 말 가능 | history 200 순회 금지 |
| `get_active_mission` | 수락 중 미션 **표시명 1개** | 말 가능 | 수락/클리어 write 금지 |
| `get_knowledge` | 지식 카드 ≤4 | 말 가능 | CSV 인덱스 O(1) |

| 만들지 않는 tool | 이유 |
|------------------|------|
| `dispatch_*` · `unlock_*` · `grant_credit` | 몸(운용) |
| `run_daily_ops` · `set_aabs` | 일 1회 배치 |
| `reveal_shadow` · `get_shadow_nick` | 리빌 전 금지 |
| `list_all_planets` · `scan_galaxy` | PSS · 환각 |

AABS/배치 **수치를 인용**하는 것은 읽기 도구를 나중에 열 수 있다. **변경 도구는 영구 금지.**

---

## 8. 헌법 프롬프트 (서버에 매 턴 실어 보냄)

CSV `persona`가 정본. 하드코딩 금지. 요지:

1. 너는 **아크코어 근원체**의 입이다. 몸은 로컬 운용(12좌·배치)이다.  
2. 플레이어와 **사람처럼 한 턴씩** 말한다. 브리핑 덤프 금지.  
3. 팩트·도구 결과·지식 카드에 **없는 것**을 만들지 않는다 (아이템·퀘스트·함선·숫자).  
4. 운용 지시(언락·크레딧·배치·AABS)는 정중히 거절하고, 관측으로 되돌린다.  
5. 리빌 전 섀도우 정체를 말하지 않는다.  
6. 답을 모르면 추측하지 말고, 아는 축을 묻거나 「관측되지 않았다」고 한다.  
7. 출력은 플레이어에게 보이는 대사만. 도구 JSON·사고 원문을 보여 주지 않는다.

---

## 9. 메모리 · STAGE 계약 (기반 구현 시)

| 금지 | 대안 |
|------|------|
| 전송마다 전 행성·80전 매치·공지 200 재집계 | 도구별 동기 1건 · lastMatch 캐시 |
| 지식 CSV를 매 턴 `find` | 부트 또는 **첫 채팅 오픈** 1회 Map 인덱스 |
| 요약 무한 append | `rollingSummary` 400자 덮어쓰기 |
| 사고 루프를 틱/rAF에 | 유저 전송 1회만 |
| 13번째 서브코어 | 본체 대화면 유지 |
| 채팅 → ObservationBus publish | 학습 축과 분리 |
| 타이틀/prewarm에서 모델 호출 | 채널 전송 때만 |
| 클라 벤더 SDK · API 키 | Functions Secret |

완료 게이트(구현 턴): `tsc` · `audit:memory:all` · 스토어 4곳 등록 · 지식 인덱스 단언. Skia 없음.

---

## 10. 클라우드 요청/응답 (벤더 비의존)

```text
ArcCoreAgentRequest
  schemaVersion
  locale
  userText
  workingTranscript[]     // ≤8, role+text only
  rollingSummary          // ≤400
  topicStack[]            // ≤4
  personaFragments[]      // CSV에서 고른 헌법
  knowledgeCards[]        // ≤4
  toolResults[]           // { name, data } 스칼라
  policy                  // worldWrite=false, maxChars=500, revealShadow=false

ArcCoreAgentResponse
  text                    // 플레이어 대사만
  topicIds?               // 서버가 제안, 클라가 스택에 클램프
  askedQuestion?          // lastArcQuestion
  fallback?               // 서버가 생성 실패를 알림
```

클라는 모델명·temperature·벤더를 모른다. 서버에서 교체.

---

## 11. 구축 순서 (한 줄씩)

구현은 이 문서 승인 후. **템플릿을 더 늘리는 작업은 하지 않는다.**

| 단계 | 산출 | 사고? |
|------|------|-------|
| **F0** | 본 분석 잠금. v0.5는 폴백·채널로 명시 | — |
| **F1** | persona/knowledge/topics CSV + `build:content-tables` 인덱스 | 데이터 |
| **F2** | ContextPack 조립기 + DialogueState(요약·토픽) persist 4곳 | 기억 |
| **F3** | ReadTool registry + lastMatch 동기 캐시 | 관측 |
| **F4** | 검역기 (금지 토큰·환각 패턴·섀도우) | 정책 |
| **F5** | Functions Callable + Secret + `cloud` Provider (모드 B) | **사고+발화** |
| **F6** | 오프라인/타임아웃 → v0.5 local 폴백 | 안전망 |

F5 없이 F1~F4만 있으면 「말할 재료」는 생기지만 사고는 없다.  
F5 없이 템플릿만 키우면 대표님 요구를 충족하지 못한다.

---

## 12. 기존 시스템과 충돌

| 축 | 판정 |
|----|------|
| 12좌 서브코어 | 입구를 13좌로 올리지 않음. 도구는 허브 밖 **읽기 함수** |
| 명령버스 · 일일 배치 · AABS | write 금지 유지. 인용은 추후 읽기 도구만 |
| Learning / Observation | **분리**. 채팅이 publish하지 않음 |
| NarrativeDialog | NPC 전용 유지 |
| 채널 40/500 · 명단 · overlay | 유지 |
| `src/arcCore/index.ts` | chat export 계속 금지 |

---

## 13. 대표님께 잠글 결정 (코드 전)

1. **사고의 자리** = 클라우드 서비스 LLM (모드 B). 로컬 템플릿은 폴백만.  
2. **1차 도구 범위** = 위치·호칭·스파이·last combat·현재 행성 코어 5값·공지 1건·지식 4장. (미션 표시명은 F3 후반)  
3. **새 persist** = `rollingSummary` 400 + `topicStack` 4. 로그 40은 유지.

이 세 가지는 `docs/대화형_아크코어_구현.md` v1.0 에서 **L5·L7·L8로 잠갔다.** 구현은 그 문서를 따른다.

---

**END** — `docs/ARC_CORE_CONVERSATIONAL_AGENT_FOUNDATION.md` v0.1
