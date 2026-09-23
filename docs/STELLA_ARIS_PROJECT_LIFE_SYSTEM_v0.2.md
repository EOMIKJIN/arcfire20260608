# 스텔라 아리스 프로젝트 — 에이전트 라이프 시스템 설계

> **문서 버전**: v0.2  
> **작성**: 2026-09-21 · 김팀장  
> **선행**: 김클로드 v0.1 초안 + 자가감사 PARTIAL  
> **상태**: **S1–S6 구현 착수** · 2026-09-21 §15 사고 · §16 인간 선제 질문  
> **지시**: 대표님 — 하루 일상을 행동·학습·저장·기억하고, 그것이 플레이어 대화 맥락이 되게 한다. LLM+템플릿과 이어지는 사고수준. 과도한 데이터 금지 · 최대 저장일 + 고도화 교체.  
> **유지**: 입≠몸 · 채널 1개 · 턴당 클라우드 LLM 1 · ZERO_BILL · 온디바이스=로컬 G3+라이프≤3KB(가중치·임베딩·SDK 금지) · Firebase=6h 세이브 편승만 · 일 1회 배치 · Table-First · PSS §0-A · 2게이트 · 친밀도 HOLD · 상점 GM HOLD  
> **대체**: `docs/STELLA_ARIS_PROJECT_LIFE_SYSTEM_v0.1.md` (초안. 본 문서가 구현 정본)

```text
[pss-pre-dev] hot_path=채팅 오픈 1 · 전송 1 · 일일배치 1 (신규 틱·타이머 0)
[pss-pre-dev] alloc=슬롯 스칼라 7 + 팩 ≤400자 · persist=기존 chat 키 schema 5 · cache=라이프 CSV 부트 1회 Map · 슬롯 세션 1회
[pss-pre-dev] stage=기존 arcCoreChat 오버레이 · 신규 STAGE/Canvas/Skia 없음 · 이탈 시 세션 캐시만 해제
[pss-pre-dev] risk=P2(persist +3KB) · P6(전송 persist는 기존 1.5s coalesce만)
[pss-pre-dev] verdict=PASS — 타이머·라이프 LLM 홉·13좌·ObservationBus·신규 persist 키 없으면 착수 가능
```

교차: `docs/ARC_CORE_DUAL_MOUTH_OPERATOR_DESIGN.md` v0.4 · `docs/CONVERSATION_TWO_GATE_DESIGN.md` · `docs/대화형_아크코어_구현.md` §0-H·L1~L12 · `docs/ARC_CORE_AGENT_WORLD_DOMAIN_DESIGN.md` v0.3.2 · `docs/ARC_CORE_SUSTAINABLE_LEARNING_MODEL_v1.md` · `tools/kim-team-lead/reports/STELLA_ARIS_OPERATOR_DIALOG_DEPTH_VERDICT_20260913.md` · `tools/kim-team-lead/reports/kim-claude-stella-aris-life-design-full-audit-20260921.md`

---

## 0. 한 줄 판정

**최초 기획은 현재 배로 구현 가능하다.** 단 「주기 작동」을 타이머로, 「선제 연락」을 기존 `inbound_request`에 얹으면 **둘 다 실패**한다.

라이프는 **시계에서 읽고**, **스텔라 턴의 팩에만 살**을 붙이며, **기존 채팅 키에 3KB로 접는다.** 스텔라는 세계를 쓰지 않는다 — 자기 하루를 살고, 기억하고, 그 기억으로 **동료 입**으로만 말한다.

| 최초 의도 | 판정 | 구현 수단 (v0.2) |
|-----------|------|-------------------|
| 대화 밖의 하루 | **가능** | 결정론 `resolveStellaLifeAt(nowMs)` · 30분 슬롯 · 타이머 0 |
| 학습·저장·기억 | **가능** | L0 세션 / L1 14칸 / L2 EMA 합본. 원본 폐기 |
| 10·30·60분 주기 | **수단 교체** | CPU 주기가 아니라 **슬롯 해상도 30분**. 상태는 시간에 따라 변함 |
| 과도한 데이터 금지 | **가능** | 총 **≤3KB** 단언. 신규 persist 키 **0** |
| 최대 저장일 + 고도화 교체 | **가능** | L1>14 → L2에 α=0.15 흡수 후 삭제 |
| 대화 맥락 | **가능** | 오퍼레이터 턴 팩 ≤400자. 근원체 턴 **0** |
| LLM+템플릿 사고 | **가능** | 라이프 로컬 생성 · LLM 홉 **추가 0** · G3 동일 재료 |
| 동기·최소 변수 | **가능** | 스칼라 7. 게이지 UI 없음 |
| 서버리스 | **가능** | AsyncStorage 정본 · Firestore 신규 컬렉션 0 · 6시간 세이브 편승 |

---

## 1. 김클로드 v0.1 전수 검수 (김팀장)

자가감사 16정본 대조를 **코드로 재실측**했다. 골자(가상시계·로컬결정론·3계층·입≠몸)는 **채택**. 본문 미반영이던 C1~C4와, 김클로드가 놓친 **C5**를 본 문서에 잠근다.

### 1-1. 채택 — 중대 정정

| ID | 내용 | 실측 | v0.2 |
|----|------|------|------|
| **C1** | 신규 키 `arcfire_stella_life_v1` 금지 | `ARC_CORE_CHAT_STORAGE_KEY` · `SCHEMA_VERSION=4` · 정본 §11-2 「한 키」 | **`arcfire_arc_core_chat_v1` schemaVersion 5** · `life` 필드 1개 |
| **C2** | 선제가 메신저 직행처럼 읽힘 | `CONVERSATION_TWO_GATE` 금지1 | 선제(후속)도 **1차 통신 → 수락 → 2차**. S0–S4는 선제 **안 함**(C5) |
| **C3** | 배치는 접속한 날만 | `runArcCoreDailyOpsBatch` 일 1회 상한. 결번 없음 | 배치에서 **결번 백필 ≤3일**. 초과는 「오래 비움」 1행 |
| **C4** | `arcCoreMemoryRegistry`는 미구현 · `bootstrapAccountData`는 장부/스킬만 | `accountLifecycle.ts`에 chat 없음. chat는 이미 purge·game-save·hydrate | C1이면 **신규 등록 0** |

### 1-2. 채택 — 보강·사실

| ID | v0.2 |
|----|------|
| **B5** | 1차 환경 = L8만 (시간·위치·코어5·스파이·최근전투1). 배치결과·팩션긴장 = **2차 승인** |
| **B6** | 튜토리얼: 팩 허용 · 선제 금지 · 강제 스크립트 대체 금지 |
| **B7** | §0-H: 라이프는 층0을 **대체하지 않음**. 턴당 라이프 문장 **최대 1** |
| **B8** | `sanitizeStellaLifeAnchor` — 섀도우닉·결제·id·40자. 실패 시 저장 안 함 |
| **A9** | 백업 **6시간** (`GAME_SAVE_BACKUP_MIN_INTERVAL_MS`) |
| **A10** | 위 pss 3줄 `risk=P2·P6` |

### 1-3. 김팀장 신규 — 구현하면 세계가 틀린다 (C5)

`defaultNlMouthForBackchannelReason('inbound_request')` = **`arc_core`**. `combat_end`도 근원체.

v0.1 「라이프 화제를 기존 inbound에 실음」은 **적의 입이 스텔라의 커피·당직을 말하게** 된다. dual mouth v0.4 §2·§9-4 위반.

> **잠금 C5**: 라이프는 **`operator` 턴에만** 팩/템플릿에 들어간다. `inbound_request` · `combat_end` · 근원체 회신에 라이프 **0**.  
> **S0–S4**: 라이프 **선제 연락 없음**. 플레이어가 스텔라를 연 뒤에만 보인다.  
> **S6(후속·별도 승인)**: 이유 `operator_life` + `presentNlMouthComm` 1차. 기존 inbound 스케줄러·타이머 **재사용 금지**(신규 주기 트리거가 됨).

### 1-4. 김팀장 추가 잠금 (v0.1에 없거나 약함)

| # | 잠금 | 이유 |
|---|------|------|
| K1 | **13번째 서브코어 금지** · `StellaLifeSubCore` 없음 | 확정 12좌. 순수 함수 + 기존 배치 훅 |
| K2 | 라이프 계산 **타이틀·부트·`runContinueSessionPrewarm` 금지** | 시작화면 최소 활성 |
| K3 | L1/L2 **변이 = 일일 배치만**. 오픈은 읽기. 전송의 mood/anchor는 기존 chat persist **1.5s coalesce에 편승** | 전송마다 별도 persist 금지 |
| K4 | **3요소는 내부 파이프** (기존 mode/stance). 화면에 「생각:」 방백 3줄 금지 | §0-H · `op_persona_style` 두세 문장 |
| K5 | 기존 `arc_core_chat_operator_persona.csv` **행 덮어쓰기 금지** | 기존값 재확인. 라이프는 신규 3장만 |
| K6 | `sharedDays`는 팩 재료. **미터·해금 게이트 아님** | 친밀도 HOLD |
| K7 | inbound 스케줄의 `setTimeout`은 **이미 있는 선제 장치**. 라이프가 슬롯 변경으로 재무장 금지 | D1 |

정합 확인(입≠몸·채널1·ZERO_BILL·턴당1홉·onSnapshot없음·Learning 단방향·로맨스/상점 HOLD) — 자가감사 18건 **동의**.

별건(라이프 구현과 분리): 구현정본 §12-A Bedrock 문구 vs ZERO_BILL · §0-I 튜토리얼 명단 문구 vs dual mouth v0.4. **본 설계는 ZERO_BILL·코드·dual mouth를 따른다.**

---

## 2. 근본 결정 (D1–D8)

### D1 — 틱이 아니라 시계

```text
[기각] setInterval(10/30/60분) → persist
[채택] resolveStellaLifeAt(nowMs, uid)  순수 함수
        dayKey    = KST yyyyMMdd
        slotIndex = floor(KST 자정 이후 분 / 30)   // 0..47
        seed      = hash32(uid, dayKey, slotIndex)
        activity  = stella_life_slots 후보 중 seed 1개
```

같은 입력 → 같은 출력. 세션 중 슬롯은 **오픈 1회 캐시**(F4).

### D2 — 라이프 생성 LLM 0

로컬 CSV+seed. LLM은 재료로만 말한다. 턴당 클라우드 **1 유지**.

### D3 — 3계층 + 기억 압축 (「고도화 교체」의 저장 뜻)

대표님 문장의 「최대 저장일 + 고도화 교체」는 **원본을 버리고 합본만 남기는 것**이다. 인격 슬라이더가 올라가는 것과 **사고 숙련(§15)은 다른 축**이다.

```text
L0  지금 슬롯 · 직전 대화 델타     persist 없음
L1  하루 1행 · 링 14               ≤1.7KB
L2  traits/anchors/narrative       ≤1.2KB 고정
배치: 결번 백필≤3 → 어제 digest → L1>14면 최오래된 행을 L2에 α=0.15 흡수 후 삭제
```

traits EMA = **살아 온 결**(duty/warmth…).  
사고수준 = **어떻게 말할지 고르는 숙련**(§15). 둘을 한 숫자로 합치지 않는다.

### D4 — Learning 단방향

배치가 이미 만든 스칼라는 **2차**. 1차는 L8만. 라이프 → ObservationBus **publish 금지**.

### D5 — 친밀도 없음

anchors ≤6 = 사실의 기억. `affection` / FSM / 거절 페널티 **없음**.

### D6 — 행동 범위

| 해석 | 판정 |
|------|------|
| (a) 스텔라 **발화 결·화제** | **본선** |
| (b) 월드 write | **기각** |
| (c) 제안 id 편향 | **B 스위치와 함께 예약** |

### D7 — 입 격리 (신규)

라이프 팩·템플릿 치환은 `resolveChatReplySpeaker` 결과가 **`operator`일 때만**.  
`arc_core` 턴 · `originHold` · `inbound_request` · `combat_end` = 라이프 블록 **삭제**.

### D8 — 저장은 이미 있는 키

`life?: StellaLifeSnapshot` on `ArcCoreChatPayload`. hydrate 실패 시 `life=empty`. 구세이브 v4는 빈 life.

---

## 3. 하루 모델 · CSV · 변수

직업은 정본 그대로 — 스텔리움 본체를 둔 **파생 입·안내 동료**. 일상은 그 위에 얹는다. 수면 슬롯에도 **응답 거부 없음**(「비번이라 늘어져 있었어」).

| 대역(KST) | 슬롯 | 직무 | 개인 |
|-----------|------|------|------|
| 06–09 | 12–17 | 야간 로그 인수·브리핑 | 기상 |
| 09–12 | 18–23 | 관측 검수·연합 통신 | 집중 |
| 12–14 | 24–27 | 운용 결과 확인 | 식사 |
| 14–18 | 28–35 | 항로 이상·보고서 | 잡무 |
| 18–22 | 36–43 | 당직 인계 | 사적 |
| 22–02 | 44–47, 0–3 | 야간 당직/비번 | 정리 |
| 02–06 | 4–11 | 수면(비번) | — |

요일·주차는 seed에 포함. 슬롯 문장은 **장소 비특정**(F11).

### 3-1. 신규 CSV 3장 (기존 대화/밸런스 CSV 불변)

`build:content-tables` → generated Map. 런타임 `find` 금지. Fable 축.

| 테이블 | 컬럼 |
|--------|------|
| `tables/content/stella_life_slots.csv` | `id, slotFrom, slotTo, weekdayMask, dutyOrOff, activityKo, activityEn, energyDelta, focusDelta, topicHint` |
| `tables/content/stella_life_goals.csv` | `id, driveId, goalKo, goalEn, spanDays, progressStep, retireRule` |
| `tables/content/stella_life_env_rules.csv` | `id, envKey, condition, moodDelta, focusDelta, lineKo, lineEn` |

`envKey` 1차 허용: `hour` `weekday` `planet` `coreR` `coreP` `coreD` `coreT` `coreE` `spy` `lastCombat`.  
`dailyBatch` `factionTension` — 행을 넣지 않음(2차).

### 3-2. 스칼라 7

| 변수 | 범위 | 갱신 | 대화 |
|------|------|------|------|
| `energy` | 0–100 | 슬롯 | 활력 |
| `mood` | 0–100 | 환경+세션 델타 | 어투 |
| `focus` | 0–100 | 슬롯 | 질문 깊이 |
| `driveId` | duty curiosity care rest growth unease | 배치 1회 | 왜 그 말을 꺼내는가 |
| `goalId` | CSV | 배치 1회 | 며칠 화제 |
| `goalProgress` | 0–100 | 배치 1회 | 만족/초조 |
| `playerGapDays` | 0–30 | **계산·비저장** | 반가움. 서운함 연출 금지 |

슬라이더·수치 화면·수치 보상 **금지**.

### 3-3. 플레이어 흔적

| 경로 | 상한 | 수명 |
|------|------|------|
| 세션 `mood` ±10 | 당일 | L0 |
| `anchors` 사실 1줄 | 6×40자 | L2 FIFO |

anchor 예: 「호출은 짧게」 · 「다음에 뉴에덴」.  
넣지 않음: 결제 · 실명/개인정보 · 리빌 전 섀도우 닉 · 호감 수치.

`sanitizeStellaLifeAnchor(text)`: §16-A 닉 패턴 · 크레딧/아이템 id · 결제 어휘 · 40자 클램프. 실패 = 저장 안 함.

---

## 4. 스키마 · 배치 · 용량

```text
StellaLifeSnapshot
  L1 digests[≤14]
      d, mood, driveId, goalId, done[≤2×24자], withPlayer 0|1
  L2
      traits { duty, warmth, curiosity, steadiness } 0–100 EMA
      anchors[≤6×40]
      narrative ≤240자          // 규칙 재작성 · LLM 아님
      sharedDays int            // 게이트 아님
      goalHistory[≤4]
  lastConsolidatedDayKey
```

합계 **≤3KB** 테스트 단언.  
`withPlayer`: 그날 메신저에서 operator 턴이 1회 이상이면 1. 백필 날은 0.

### 4-1. 배치 훅 (기존 함수 말미 1회)

`runArcCoreDailyOpsBatch` **마지막**에 `consolidateStellaLifeOnDailyBatch(nowMs)`  
`onBoot` 동기 · 타이틀 · prewarm · 별도 catch-up **금지**. 벽시계 catch-up이 배치를 돌릴 때만 자연 합류.

```text
gap = dayKeys(lastConsolidated .. yesterday)  // KST
if gap > 3:
  「오래 비움」 1행 (withPlayer=0) → L1
else:
  각 결번 날을 resolveStellaLifeAt(그날 12:00)으로 digest (withPlayer=0)
어제(접속일) digest: withPlayer = 스토어 플래그
L1>14 → 최구행 L2 흡수(α=0.15) → 삭제
lastConsolidatedDayKey = yesterday
시계 역행 → no-op (F1/F2)
배치 증가 DoD ≤50ms
```

`narrative` = CSV 템플릿 + traits 구간. LLM 호출 0.

### 4-2. persist 타이밍

| 사건 | 디스크 |
|------|--------|
| 채팅 오픈 | **쓰기 없음**. `resolveStellaLifeAt` + 세션 캐시 |
| 전송 (operator) | mood/anchor는 메모리. **기존 1.5s persist**에 `life` 포함 |
| 일일 배치 | L1/L2 변이 후 chat persist 1회 |
| 타이틀/부트 | **금지** |

---

## 5. 대화 연결

### 5-1. 언제 보이는가

| 경로 | 라이프 |
|------|--------|
| 허브 [대화] → 1차 스텔라 → 2차 메신저 | **S4** 팩 주입 |
| 플레이어가 스텔라에게 전송 | 팩 + G3 동일 재료 |
| `inbound_request` / `combat_end` / 근원체 | **0** |
| 튜토리얼 강제 스크립트 | **대체 금지**. 팩은 메신저가 열릴 때만 |
| 라이프 선제 1차 | **S0–S4 없음** |

### 5-2. 3요소 (내부)

대표님 「질문·생각·대답」은 **새 말풍선이 아니다.** 이미 있는 drive에 입력을 더한다.

| 요소 | 기존 | 화면 |
|------|------|------|
| 질문 | mode `lead` / stance `inquire` | 대답 안에 물음 한 조각 **또는** 생략 |
| 생각 | mode `clue` / stance `observe` | **표시 라벨 없음**. 톤만 |
| 대답 | `react` | 항상 1 |

턴당 라이프 **사실 문장 최대 1**.  
합격: 「오늘 기분 어때」→ 「그냥 그래. 밤에 좀 늘어졌거든.」  
불합격: 오전 로그·오후 검수 나열.

팩 초과 절단: 라이프 블록 **최우선**. 세계 팩트·페르소나·검역이 먼저.

| 블록 | 상한 |
|------|------|
| 지금 하는 일 | 60 |
| energy/mood/drive | 60 |
| 오늘 digest | 80 |
| L2 narrative | 120 |
| anchors ≤3 | 80 |
| **합** | **≤400** |

클라우드 LIVE = 같은 재료로 자연어. G3 = 같은 재료로 슬롯 치환.

### 5-3. 1차 통신

S0–S4에서 1차 CSV 씬을 라이프로 **다시 쓰지 않는다**. 기존값 보호.  
후속 선제(S6)만 ad-hoc 1차에 라이프 한 조각.

---

## 6. 실패 모드

| # | 실패 | 방어 |
|---|------|------|
| F1 | 시계 앞당김 | 1회 진행 **최대 3일**. 역행 무시 |
| F2 | 되돌림·중복 digest | `lastConsolidatedDayKey` 멱등 |
| F3 | 장기 미접속 | L2만으로 대화. 「오랜만」세션 1회 |
| F4 | 슬롯 깜빡임 | 세션 1회 캐시 · STAGE 이탈 dispose |
| F5 | 팩 초과 | 라이프 최우선 절단 |
| F6 | purge 누락 | C1 — 기존 chat purge 경로 |
| F7 | 스키마 | v5 hydrate · 실패 시 empty life |
| F8 | 성장 | ≤3KB 단언 |
| F9 | 오프라인 | 로컬 생성 정상 |
| F10 | 429 | G3 + 같은 재료 |
| F11 | 세계 모순 | 실관측만 · 슬롯 장소 비특정 |
| F12 | 반복 | seed에 주차 · goal span |
| F13 | 근원체가 라이프를 말함 | **D7 하드 게이트** |
| F14 | 라이프가 inbound를 재무장 | C5 · K7 |

---

## 7. 구현 계약 (착수 시 파일)

코드는 **본 문서 + 대표님 S1–S6 착수 지시(2026-09-21)** 로 구현한다.

| 산출 | 경로 | 담당 |
|------|------|------|
| CSV 3장 + 숙련 밴드 | `stella_life_slots/goals/env_rules/cognition_bands.csv` | **Fable** |
| 순수 resolver | `src/arcCore/chat/stellaLifeResolve.ts` | 김팀장 |
| digest/백필/숙련 ingest | `src/arcCore/chat/stellaLifeDigest.ts` | 김팀장 |
| 숙련 밴드 | `src/arcCore/chat/stellaLifeCognition.ts` | 김팀장 |
| anchor 검역 | `src/arcCore/chat/sanitizeStellaLifeAnchor.ts` | 김팀장 |
| 스키마 5 | `src/store/arcCoreChatStore.ts` `life?` | 김팀장 |
| 팩 400 | `arcCoreAgentPack.ts` — speaker=`operator`만 | 김팀장 |
| G3 | `localConversationalProvider.ts` 동일 재료 | 김팀장 |
| 배치 훅 | `runArcCoreDailyOpsBatch` 말미 1함수 | 김팀장 |
| 테스트 | 결정론 · 3KB · D7 격리 · 백필≤3 · purge 잔존0 | 김팀장 |

금지 파일: 신규 `*SubCore.ts` · 신규 persist 키 · persona/근원체 CSV 행 수정 · inbound 스케줄러 개조.

---

## 8. 단계

각 단계 독립 롤백. 앞 단계만으로 회귀 없음.

| 단계 | 산출 | 체감 |
|------|------|------|
| **S0** | 본 문서 잠금 | — |
| **S1** | CSV3 + resolver + 결정론 테스트. 런타임 연결 없음 | 아니오 |
| **S2** | 변수7 + L8 환경만 | 아니오 |
| **S3** | schema 5 + ≤3KB + 배치 백필 멱등 | 아니오 |
| **S4** | operator 팩 ≤400 + G3 + §0-H 1문장 | **첫 체감** |
| **S5** | 배치 digest + traits EMA (S4 없어도 「오늘」은 동작) | 어제 |
| **S5b** | 사고 숙련 ingest + 밴드 CSV (§15) — 같은 배치 훅 | 말이 깊어짐 |
| **S6** | `operator_life` 1차 — **의도 먼저 · 시계는 예의만**(§16) · 별도 승인 | 인간 질문 선제 |

최소 실용 = **S4**. S1–S3를 건너뛰면 purge/키 회귀(09-13 친밀도 HOLD와 같은 함정).

---

## 9. 금지

1. 라이프 전용 `setInterval` · `AppState` 주기 · inbound 재무장  
2. 라이프 LLM 홉 (ZERO_BILL)  
3. ObservationBus / LearningStore / PolicyPack write  
4. 월드 write (크레딧·언락·배치·점유)  
5. 호감 수치·단계 해금·질투/서운함/죄책감  
6. 결제·상품 화제  
7. 신규 오버레이·STAGE·`present*` · gifted-chat  
8. CoT·「생각:」 라벨 출력  
9. 기존 밸런스·페르소나 CSV 덮어쓰기  
10. 무한 성장 필드  
11. 리빌 전 섀도우 닉 anchor  
12. 타이틀·부트·prewarm에서 라이프  
13. **13번째 서브코어**  
14. `inbound_request` / `combat_end`에 라이프  
15. 신규 persist 키

---

## 10. 상수 (김팀장 권장 잠금)

실기 후 숫자만 바꿀 수 있는 것: 슬롯 분 · L1 일수 · α. 구조(키·입·게이트)는 비싸다.

| # | 값 | 대안 |
|---|-----|------|
| 슬롯 | **30분 / 48** | 10=과잉 · 60=단조 |
| L1 | **14일** | 7 / 30 |
| purge | **chat 키 = player scope** (계정 초기화 시 삭제) | world 유지 금지 |
| 친밀도 | **없음** | 별도 승인 |
| 월드·제안 편향 | **지금 닫음** | B 스위치 |
| 선제 | **S6 전 닫음** | C5 |

---

## 15. 사고수준 고도화 (학습능력) — 2026-09-21 보강

정밀 재분석 전문: `tools/kim-team-lead/reports/kim-team-lead-stella-aris-cognition-20260921.md`

### 15-0. 한 줄

**사고 고도화 ≠ 도구를 늘리는 것 ≠ 친밀도 ≠ L2 traits EMA.**  
스텔라가 똑똑해지는 것은 **같은 1홉·같은 L8 안에서, 무엇을 꺼내고 무엇을 참는지**가 늘어나는 것이다.

### 15-1. 학습 3축 — 섞지 말 것

| 축 | 정본 레퍼런스 | 하는 일 | 스텔라 |
|----|---------------|---------|--------|
| **W 월드 학습** | `ARC_CORE_SUSTAINABLE_LEARNING_MODEL_v1` · `src/arcCore/learning/*` | Observation → 일 1회 Policy | **write 금지**. 읽기는 2차 |
| **M 대화 기억** | §0-F H1~H6 · `rollingSummary` 400 · 태그≤8 · `judgment` counts≤8 | 선호·사건 접기 · 제안 수락/거절 | **이미 실기**. 사실 저장소. 숙련 아님 |
| **C 사고 숙련** | 본 절 · 09-09 지적능력 설계 §5 · §0-H | observe→일 1회 ingest→CSV 밴드→drive 편향 | **이번 보강**. 새 키·새 홉 없음 |

v0.1이 「α=0.15면 사고능력이 고도화된다」고 한 것은 **저장 압축을 지능으로 읽은 범주 오류**다. 그 규칙은 D3에 남기고, 지능은 본 절만 담당한다.

### 15-2. 레퍼런스에서 가져오는 방법 (새 엔진 없음)

| 레퍼런스 | 가져올 것 | 가져오지 말 것 |
|----------|-----------|----------------|
| 지속가능 학습 | **관측 → 버퍼 → 일 1회 ingest → 버전된 정책** | ObservationBus · Policy Pack 파일 · 13좌 · RTDB |
| `arcCoreChatJudgmentMemory` | **같은 chat 키 · counts 상한 8 · 틱 persist 없음** | 제안 id 월드 편향 (B 닫힘) |
| H1 / H5 | **명시 발화만** 태그. 임베딩 금지 | 세 번째 사실 창고 |
| H6 | 팩 `nuanceHint` 1개 | 분류 2홉 |
| 09-09 §0 / §5 | **일상 바닥 · 관점·purpose가 지능** | 도구 8개 확장으로 똑똑해 보이기 |
| §0-H | 기분 질문에 시스템/라이프 덤프 **불합격** | 라이프 브리핑 = 안내원 |
| dialogueDrive | mode `react/lead/clue/hold` · `nextAsk` | 신규 분류기 |
| dual mouth | **operator 턴만** 관측·적용 | inbound/combat_end/근원체 |
| Inworld §12-B | **세계(팩)가 먼저 · Verbatim/Instruction 혼용 · 입은 말** | SDK · 감정/관계 슬라이더 · 지식 시맨틱 검색 · 온디바이스 가중치/임베딩 |
| 대화 ⑥ 사고 | purpose/mode/stance가 **무엇을 답할지** | 2홉 분류 · 새 사고 엔진 |

```text
[operator 전송 1회]
  H5 태그 · topic · humanFirst 여부 · 라이프문장 사용 여부
  → L0 evidence 카운트 ≤5종 (세션)
  → 기존 1.5s chat persist에 cognition 카운터만 편승

[일일 배치 — consolidate와 같은 함수 말미]
  L0 → cognition 4축 EMA α=0.15
  evidence 링 ≤8일 접고 폐기 (L1과 동일 압축)
  → CSV 밴드 resolve (LLM 0)

[다음 operator 턴]
  밴드가 drive에 입력 하나
  §0-H humanFirst 이면 밴드보다 우선 — nextAsk='' · 라이프 문장 0
```

### 15-3. 숙련 4축 (IQ·호감 아님)

7개 라이프 스칼라와 **합치지 않는다.** 표시 UI 없음.

| 축 | 뜻 | 올라가는 증거 (기존 신호만) | 대화에 주는 것 |
|----|-----|------------------------------|----------------|
| `recall` | 있는 기억을 **0~1개만** 꺼냄 | H1 태그 또는 anchor가 팩에 실리고 턴이 operator | 팩 anchors 0 / 1 / 3 |
| `askDepth` | 물은 축만 깊게 | `askedSystemTopic` 적중 · `lead`/`clue` | humanFirst가 아닐 때만 `lead` 허용 |
| `grounding` | 관측 없는 말 안 함 | L8/슬롯 비특정 준수 · 검역 통과 | 장소 특정 라이프 문장 차단 |
| `casualFirst` | 잡담을 브리핑으로 안 바꿈 | `isArcCoreChatHumanFirstTurn` + react | 기분·인사 → 라이프 0 · `nextAsk=''` |

시작값 50. 캡 0–100. 하루 EMA 한 축당 ±8 클램프 (한 주에 뒤집히지 않음).

### 15-4. 관측 5종 (세션 L0 · 상한만)

| kind | 언제 +1 | 비고 |
|------|---------|------|
| `h5_pref` | H5 정규식 히트 (좋아/싫어/기억해) | 기존 `extractArcCoreChatPreferenceTags` |
| `topic_follow` | 시스템 토픽 적중 | `arcCoreChatDialogueDrive` ASKED 집합 |
| `casual_ok` | humanFirst 이고 라이프 문장 안 씀 | §0-H 합격 |
| `dump_fail` | humanFirst 인데 라이프/슬롯 나열 | **음수 학습** |
| `correction` | 플레이어가 「그게 아냐/아니야」+ 직전 축 | 정규식 1회. 임베딩 금지 |

근원체 턴 · inbound · combat_end · 튜토리얼 강제 = **관측 0**.

### 15-5. 스키마 (같은 `life` 필드 · +≤200B)

```text
life.cognition
  recall, askDepth, grounding, casualFirst   // int 0-100
  lastIngestDay
  ev[≤8]  { d, h5, topic, casual, dump, corr }  // 일 합산 바이트
```

3KB 단언에 **포함**. 별도 키 없음.  
사실 문장은 계속 H1(400자) + anchors(6×40)만. cognition은 **꺼내는 숙련**이지 세 번째 일기장이 아니다.

### 15-6. 정책 CSV (4장째 · 페르소나 행 불변)

`tables/content/stella_life_cognition_bands.csv`

`id, axis, lo, hi, packAnchors, allowLead, allowLifeLine, forceHumanFirst`

런타임 Map O(1). 기존 `arc_core_chat_operator_persona.csv` **덮어쓰기 금지** (09-13 관점 3행 유지).

적용 순서 (고정):

```text
1) §0-H humanFirst → react · nextAsk='' · 라이프 문장 0   // 밴드 무시
2) D7 speaker≠operator → cognition 미적용
3) 밴드: packAnchors · allowLead · allowLifeLine
4) 기존 purpose/mode 표
```

신규 분류기 0. `invite_axis` catch-all을 라이프용으로 넓히지 않는다.

### 15-7. 09-09 「지적 능력」과의 역할 분담

| 09-09 수단 | 스텔라 라이프 |
|------------|----------------|
| persona 관점 행 | **이미 있음**. 라이프가 대체하지 않음 |
| purposes 세분화 · 도구 8 | **열지 않음** (지능≠시야 확대). 2차 |
| GM `when` | **근원체 줄기**. 스텔라 숙련에 안 씀 (C5) |
| 모델 temperature | 범위 밖 |

스텔라가 똑똑해 보이는 1항은 **§0-H + recall 0~1 + 덤프 안 함**이다. 팩션 도구는 그 다음이다.

### 15-8. 금지 (본 절 추가)

16. IQ·숙련 게이지 UI · 해금 게이트  
17. 사고 전용 LLM 홉 · 벡터/임베딩  
18. cognition → ObservationBus / LearningStore  
19. 도구 화이트리스트를 숙련 해금으로 염  
20. dump_fail를 친밀도 페널티로 씀  

### 15-9. 단계

S5b는 S5와 **같은 배치 훅**. S4만으로도 「오늘 하는 일」은 보인다. 숙련이 없어도 대화는 성립해야 한다(팩 절단과 동일).

---

## 16. 인간 사고 선제 질문 (S6 보강 · 2026-09-21)

검토: `tools/kim-team-lead/reports/kim-team-lead-stella-human-ask-20260921.md`

### 16-0. 한 줄

**시계가 말을 걸지 않는다. 일상 생각이 먼저 있고, 그 생각이 상대를 필요로 할 때만 묻는다.**  
태그·전투·스파이은 점화가 아니다. 기존 inbound 타이머는 **원인으로 재사용하지 않는다**(C5 · K7).

### 16-1. 지금 배의 선제 — 무엇이 무작위인가

| 층 | 실측 | 스텔라와의 관계 |
|----|------|-----------------|
| **언제** | 허브 무장 후 첫 **45–90초**, 이후 **8–15분** `rollBoundedDelayMs` | **무작위**. 대표님이 기억하는 「랜덤 대화요청」 |
| **무슨 말** | `spy > combat > story > world > observe > idle` 우선순위 | 랜덤 픽은 아님. 다만 세계 축이 없으면 `idle` = 「그냥 말 걸어봤다」 |
| **누구 입** | 1차 얼굴은 오퍼레이터. `shouldHoldOriginMouth(inbound_request)=true` → 회신은 **근원체 고정** | 라이프·인간 질문을 얹으면 C5 위반 |

그래서 인간 선제는 **기존 inbound를 고치는 작업이 아니다.** S6 `operator_life`만 연다.

### 16-2. 반영 판정

| 요청 | 판정 |
|------|------|
| 스텔라가 인간적 사고로 질문 요청 | **가능**. S6 · 이유 `operator_life` · 1차 `presentNlMouthComm` 수락 |
| 기존 inbound 타이머에 라이프/인간 질문 실음 | **불가**. 근원체 hold + 시계 재무장 |
| idle 「그냥 말 걸어봤다」를 스텔라 선제에 남김 | **불가**. 그게 무작위 |
| spy/combat/story를 스텔라가 **선제**로 묻기 | **불가**. 세계·적 입. 근원체 inbound에 잔류 |
| 플레이어가 활성 퀘스트 현장을 물으면 스텔라가 답하기 | **가능**. `docs/STELLA_QUEST_FIELD_NOTE_v0.1.md` · 선제 아님 |
| S0–S5에서 선제 | **닫음** (C5 유지) |

### 16-3. 동기 스택 — 일상 사고가 점화 (대표님 2026-09-21)

질문은 **기억 태그가 울려서**가 아니라, 오늘 슬롯을 사는 생각이 「이 사람은 지금 네가 필요해」라고 할 때만 나온다.  
§3 `driveId`가 이미 「왜 그 말을 꺼내는가」다. §16은 그 위에 선제만 얹는다.

```text
[0 일상 사고]  resolveStellaLifeAt
              슬롯 개인축 · mood · focus · drive · 오늘 한 줄
                ↓
[1 동기]      그 생각이 플레이어를 필요로 하는가?   (없으면 침묵)
                ↓
[2 연료]      약속/선호/열린얘기/정정/앵커 — 생각에 걸린 것만
                ↓
[3 질문 형태] promise · correction · thread · care · share
                ↓
[4 게이트]    §0-H · 예의 1일 · 숙련 · 직무 브리핑 금지
```

**0이 1을 만든다. 2는 점화가 아니다.**  
약속 태그가 있어도, 오늘 생각이 「당직·집중·개인 공백」이면 묻지 않는다.  
쉬는 중에 그 약속이 떠올라야 care/promise가 된다.

#### 16-3-A. 일상 사고 → 동기 (테이블)

`tables/content/stella_life_ask_motive.csv`  
`id, driveId, dutyOrOff, moodLo, moodHi, motiveId, allowAsk`

이미 있는 `driveId`(duty curiosity care rest growth unease) + 슬롯 `dutyOrOff`만. 신규 persist 없음.

| 일상 사고 (지금) | 동기 `motiveId` | 질문이 됨 | 안 됨 |
|------------------|-----------------|-----------|--------|
| 비번·식사·사적 · 나눌 조각 1 | `want_share` | share | 직무 로그 나열 |
| 오늘 일과에 네 말이 걸림 | `need_you` | care / promise | 태그 상시 발사 |
| 빈 얘기가 오늘 머리에 남음 | `unfinished` | thread | GM·미션 줄기 |
| 어제 틀린 게 오늘 걸림 | `want_right` | correction | 죄책감·호감 연출 |
| 에너지 낮고 혼자가 김 | `check_in` | care | 서운함 |
| 당직·집중 · 개인 생각 공백 | `none` | **동기 0** | 질문 자체 |
| 세계 경보·전투·스토리 | `none` | 스텔라 선제 아님 | 근원체 inbound |

`allowAsk=0` 또는 `motiveId=none` → resolve **null**. idle 폴백 없음.

#### 16-3-B. 인간 why 5종 — 표현일 뿐 (테이블)

`tables/content/stella_life_ask_why.csv` — 런타임 Map O(1). 페르소나 행 불변.

발화는 **[1] 동기 있고 [2] 연료가 생각에 걸릴 때만**. 타이머로 빈 idle을 만들지 않는다.

| 우선 | id | 인간 사고 | 기존 신호만 | 질문 형태 (한 줄) |
|------|-----|-----------|-------------|-------------------|
| 1 | `promise` | 네가 맡긴 말을 내가 기억하나 | H1 태그 `약속` | 그때 말한 것, 아직 유효한가 |
| 2 | `correction` | 내가 잘못 짚었다 | §15 `correction` 일 합 >0 | 내가 빗나갔나. 다시 물을게 |
| 3 | `thread` | 지난 얘기가 열려 있다 | `lastArcQuestion` 미닫힘 · 직전 operator 세션 | 그 얘기, 이어서 할까 |
| 4 | `care` | 네가 남긴 선호·컨디션 | H5 좋아/싫어 · 직전 팩에 안 씀 · ≥1일 | 그때 말한 거, 지금은 어때 |
| 5 | `share` | 내 하루에 사람 말로 꺼낼 조각 1 | L2/오늘 anchor **1개** · 슬롯 나열 금지 | 잠깐 — 오늘 {anchor} 때문에 네가 궁금해 |

동률이면 위 우선 1개만. **동기와 안 맞는 연료는 버림** (예: motive=`want_share`인데 promise만 있으면 share 문장으로만, 약속 심문 금지).  
1차 문장 ≤2줄(일상 한 조각 + 질문 1). §0-H: 브리핑·무역·전투 덤프 불합격.

**중요한 필터 (발화 금지)**

- 튜토리얼 강제 · 첫 스텔라 세션(intro 전) · 오늘 이미 `operator_life` 1회
- why 없음 → **침묵**. 똑똑한 동료는 용건 없이 울리지 않음 (`casualFirst` 높을수록 share 억제)
- `observe`(여기 계속 있을 건가) · `idle` · spy/combat/story/world → 스텔라 why **아님**

### 16-4. 언제 배지를 다는가 (의도 먼저 · 시계는 예의)

```text
[허브 포커스 1회 — setTimeout 원인 금지]
  thought = resolveStellaLifeAt(now)          // 일상
  motive  = resolveStellaAskMotive(thought)   // 동기 · none이면 끝
  why     = bindStellaAskWhy(motive, fuels)   // 표현
  why 있고 · 예의 쿨다운 지남 · safe slot · DND 아님
    → pending (기존 inbound pending과 키 분리, 틱 persist 없음)
  motive 없음 · why 없음 → 배지 0

[플레이어가 [대화] · 스텔라]
  1차 통신 수락/취소 (2게이트)
  수락 → presentArcCoreBackchannel({ reason:'operator_life', speakerId:'operator' })
  originHold = false · 라이프 팩 허용 (C5 예외는 이 reason만)

[취소 · 이탈]
  pending 클리어. 같은 허브 체류 중 재무장 없음
```

**예의 쿨다운** (랜덤 롤 아님 · 기존 8–15분 상수 **변경 금지**):  
마지막 스텔라 선제 이후 **달력 1일** 또는 **해당 why 스레드가 플레이어 전송으로 닫힘**.  
행성 hop마다 재resolve 가능하나, 예의에 걸리면 침묵.

허브 체류 30분이어도 **재타이머 없음**. 같이 앉아 있는 사람에게 다시 울리지 않는다.

### 16-5. §15 숙련과의 결합

| 축 | 선제에 주는 것 |
|----|----------------|
| `recall` | 1차에 anchor **0 또는 1** |
| `askDepth` | 질문 1개. `lead`는 수락 후 메신저만 |
| `grounding` | 관측 없는 장소·사건 금지 |
| `casualFirst` | share 억제. why=care/promise만 남김 |

### 16-6. 금지 (본 절)

21. `inbound_request` 스케줄러·45–90초 상수를 스텔라 선제 원인으로 씀  
22. `operator_life`에 `originHold`  
23. why 없이 idle 폴백으로 배지  
24. 선제 전용 LLM 홉 (1차는 템플릿. 수락 후 기존 1홉)  
25. 기존 inbound 딜레이 숫자를 「인간적으로」 재롤 (기존값 재확인 대상)

---

## 11. 한 문단

스텔라에게 **타이머 없는 하루**를 준다. 시계·CSV·seed가 「지금 무엇을 하는지」를 결정론으로 정하므로 백그라운드 비용은 0이다. 접속하지 않은 날은 배치가 **최대 3일만** 되감아 접고, 14일이 지난 줄은 인격에 15%만 남긴 채 버린다. 기억은 **이미 있는 채팅 키**에 3KB로 붙는다. 플레이어가 스텔라를 열면 400자가 팩에 실려 기존 한 홉이 말하고, 오프라인이면 템플릿이 같은 사실을 말한다. 근원체는 그 재료를 받지 않는다. 사고는 도구가 늘어서가 아니라 **같은 재료에서 무엇을 참는지**로 는다. 말은 시계가 아니라 **이유가 있을 때만** 먼저 건넨다. 스텔라는 세계를 바꾸지 않는다 — **살고, 기억하고, 동료로 말할 뿐이다.**

---

**END** — `docs/STELLA_ARIS_PROJECT_LIFE_SYSTEM_v0.2.md` · 김팀장 고도화 정본 · 코드 미착수 · 구현은 S0 확인 후 S1부터
