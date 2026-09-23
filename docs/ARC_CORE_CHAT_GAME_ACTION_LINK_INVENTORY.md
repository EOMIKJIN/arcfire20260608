# 아크코어 에이전트(LLM) 대화 ↔ 게임 연동 액션 전수

> **작성**: 2026-09-16 · 김팀장  
> **성격**: 코드·정본 대조 **인벤토리** (구현 지시 아님)  
> **범위**: 2차 메신저(`presentArcCoreBackchannel`)가 게임에 손대는 길 + 같은 대화 가문의 1차 통신·허브 몸이 이미 가진 문  
> **정본 충돌 시**: 입≠몸 · `docs/대화형_아크코어_구현.md` L1 · `docs/CONVERSATION_TWO_GATE_DESIGN.md` · `docs/ARC_CORE_AGENT_WORLD_DOMAIN_DESIGN.md`

```text
[pss-pre-dev] hot_path=없음(문서) alloc=0 cache=없음
[pss-pre-dev] stage=없음 risk=없음
[pss-pre-dev] verdict=PASS
```

---

## 0. 한 줄 판정

**2026-09-16 연결 완료**: 명시 요청 문장은 확인 없이 기존 문을 연다.  
`talk_bar` / `talk_npc` / `open_*` / `arm_wave` — CSV 이름만. 신규 NPC·전장 생성 없음.

LLM 입은 월드를 만들지 않는다. 크레딧·점유·일일배치 write는 계속 금지.

---

## 1. 두 방향 · 두 게이트

| 방향 | 지금 | 의미 |
|------|------|------|
| **게임 → 대화** | 실기동 | 허브·전투 종료·선제가 입을 연다 |
| **대화 → 게임(관측)** | 실기동 | 행성별·미션·공지 등을 **말로만** 전한다 |
| **대화 → 게임(집행)** | **무역소·조선소만** | 확인 후 기존 시설 화면 |

| 게이트 | API | LLM | 게임 write |
|--------|-----|-----|------------|
| 0 명단 | `presentPlanetHubTalkRoster` | 없음 | 없음 |
| **1 통신** | `presentIngameDialogScene` / `presentAdHocIngameDialog` | 없음(템플릿) | **있음** — 미션 수락·클리어·talk_npc |
| **2 메신저** | `presentArcCoreBackchannel` | 로컬/클라우드 | **시설 2문만** |

바걸 첫 인사·NPC 퀘스트 수락은 **1차**다. 2차 LLM이 그 액션을 부르지 않는다.

---

## 2. 현재 구현 — 대화가 게임을 연다 (2차 LLM)

정본: `arcCoreChatWorldProposal.ts` · `arcCoreChatWorldProposalExecute.ts` · `arcCoreChatFacilityBridge.ts` · `planet.tsx` opener 등록.

| id | 플레이어 확인 | 몸이 하는 일 | 상태 |
|----|---------------|--------------|------|
| `open_trade` | `showArcAlert` 1장 또는 「응/열어」 | `runPlanetHubSubmenuPreflight('trade')` → `/(game)/trade` | **실기동** (허브 마운트·무역소 설치 시) |
| `open_shipyard` | 동일 | 조선소 프리플라이트 → `/(game)/shipyard` | **실기동** |

발동 조건:

1. 대화 drive가 `mode=lead` 이고 `nextAsk`가 위 id — 확인 창  
2. `pendingProposalId`가 있고 유저가 짧은 수락어 — 바로 집행, 실패 시 확인 창  

가드: 허브 opener 없음(행성 이탈)·시설 미설치·프리플라이트 실패면 **열지 않음**.  
채팅 패널은 `dismissWhere(isArcCoreChatOverlayToDismiss)` 후 시설로 넘어간다.

`ARC_CORE_CHAT_WORLD_PROPOSAL_LIVE = false` 는 `resolveArcCoreChatWorldProposal()`만 항상 null로 둔다.  
시설 집행 함수는 LIVE를 보지 않는다. 설계 문서 §5의 「집행 없음」은 **코드보다 한 세대 이전**이다.

### 2-1. 구현된 부수 연동 (월드 write 아님)

| 기능 | 코드 | 상태 |
|------|------|------|
| 제안 수락/거절 기억 | `arcCoreChatJudgmentMemory` | 실기동 · persist 합류 |
| 채팅 오버레이 닫기 | `arcCoreChatOverlayDismissPolicy` | 시설 열 때 |
| 회신 검역(이미 지급했다는 말 차단) | `quarantineArcCoreChatReply` | 실기동 |
| 운용 요청 거절 말 | intent `refuse` · topic `refuse` | 실기동 · write 없음 |

---

## 3. 현재 구현 — 대화가 세계를 읽는다 (연동의 전제)

집행이 아니라 **말로 세계를 맞추는 도구**. 턴당 ≤4 · 동기 스칼라.  
정본: `arcCoreChatReadTools.ts`.

| tool | 읽는 것 | 하지 않는 것 |
|------|---------|--------------|
| `get_location` | 정박 행성 id·표시명 | 강제 이동 |
| `get_callsign` | 닉네임 | 개명 |
| `get_spy_alert` | pending 유무·행성 | 스파이 생성/해제 |
| `get_last_combat` | 최근 전투 1건 | 전투 시작 |
| `get_planet_cores` | 현재 행성 R/P/D/T/E | 지표 변경 |
| `get_latest_notice` | 바 공지 1건 제목 | 공지 작성 |
| `get_active_mission` | 수락 중 미션 표시명 | 수락/클리어 |
| `get_planet_vitality` | 활력 티어 | 경제 overlay 반영 |
| `get_mining_allowance` | 오늘 채굴 한도 소진 | 채굴 시작 |
| `get_daily_ops_status` | 오늘 배치 정산 여부 | 배치 실행 |

GM 비트(`arc_core_chat_gm_beats.csv`)는 **이끌기 문장만**. `worldWrite=false`.  
`suggestedProposalId=open_mission` 은 idle이 아닐 때 힌트만 — **미션 패널 집행 핸들러 없음**.

---

## 4. 현재 구현 — 게임이 대화를 연다 (역방향)

| reason | 트리거 | 1차 | 2차 LLM | 상태 |
|--------|--------|-----|---------|------|
| `manual` | 허브 명단 NL 입 | `presentNlMouthComm` | 있음 | 실기동 |
| `inbound_request` | 허브 안전 슬롯 선제 | 수락형 통신 | 수락 시 | 실기동 |
| `combat_end` | 웨이브 결과 닫힌 뒤 | 오퍼레이터 통신 | 있음 · 행성당 1회 | 실기동 |
| `first_scan` | A1 스캔 안내 dismiss | 있음 | 스텔라 1~2턴 | 실기동 |
| `quest_accept` / `quest_clear` / `quest_objective` | 예약 reason | — | API만 | **호출부 미완 또는 희소** |
| `story_scene_end` | 예약 reason | — | API만 | **호출부 미완** |
| `session_start` | 타이틀 boot-chat | 생략 | 플래그 | **OFF** |

스파이·반란 오퍼레이터·바 후원 대사는 **1차만**. 메신저로 이어지지 않는다.

---

## 5. 현재 구현 — 1차 통신이 이미 하는 게임 액션 (LLM 아님)

같은 「대화」가문이지만 **템플릿 종료 훅**이다. 2차 입이 이것을 부르면 L1 위반.

정본: `IngameDialogCompletionAction` · `ingameDialogCompletion.ts`.

| type | 몸이 하는 일 | 쓰는 곳 |
|------|--------------|---------|
| `accept_main_story_mission` | 본편 수락 + 피드백 | 허브 NPC [대화] |
| `accept_quest_mission` | 의뢰 수락 | 바·허브 NPC |
| `grant_mission_rewards` / `finalizeMissionCompletion` | 클리어 보상 | 완료 씬 |
| `complete_talk_npc` | talk_npc 목표 반영 | 탐문 |
| `start_mission` / `mark_intro_seen_and_start_first_mission` | 튜토리얼 시드 | 인트로 |
| `mark_scene_seen` | seen 플래그 | once 씬 |
| `run_callback` | 등록된 1회 훅 | 레지스트리만 · 채팅 미연결 |

바걸 첫 문장(`attendant_hello`)은 바 공연 1차 ad-hoc이다. LLM 제안 id 없음.

---

## 6. 기반만 — id·훅·프리플라이트는 있고 입이 안 누름

### 6-1. 예약 제안 id (화이트리스트, 시설 2개만 집행)

| id | 설계 의도 | 집행 | 비고 |
|----|-----------|------|------|
| `open_trade` | 무역소 | **있음** | §2 |
| `open_shipyard` | 조선소 | **있음** | §2 |
| `open_mission` | 활성 미션 패널 | **없음** | GM이 힌트만. 수락 금지 |
| `depart_hint` | 출발 가능 안내 | **없음** | 강제 출발 금지 |
| `daily_ops_status` | 오늘 배치 읽기 | 읽기 도구만 | 배치 실행 금지 |

`grant_credit` · `run_daily_ops` 는 테스트에서 **예약 밖**으로 확인. 넣지 말 것.

### 6-2. 허브 몸은 이미 여는 문 (채팅 미연결)

`runPlanetHubSubmenuPreflight` + `buildPlanetHubFeatureMenuItems`:

| 문 | href / 동작 | 채팅 연결 |
|----|-------------|-----------|
| 무역소 | `/(game)/trade` | **연결됨** |
| 조선소 | `/(game)/shipyard` | **연결됨** |
| **바** | `/(game)/bar` | 프리플라이트만. 제안 id 없음 |
| **연구실/스킬** | `/(game)/skilltree` | 동일 |
| **출발** | worldmap · 채굴/전투 안전 종료 | 동일 |

### 6-3. 오버레이 present API (채팅 미연결)

`arcOverlayStore` — 확인 1장 뒤에 붙일 **기존 문**.

| API | UI | 비고 |
|-----|-----|------|
| `presentPlanetHubTalkRoster` | [대화] 명단 | 게이트 0 |
| `presentPlanetEconomyInfoOverlay` | 행성 경제 | |
| `presentPlanetDevelopmentOverlay` | 행성 개발 목록 | |
| `presentPlanetOwnershipRosterOverlay` | 점유 명단 | 점유 write 아님 |
| `presentBmShopOverlay` | BM 상점 | STAGE3 dispose 후만 |
| `presentSettingsOverlay` | 설정 | |
| `presentSkillInfoOverlay` | 스킬 설명 | |
| `presentRelicLoreOverlay` | 유물 로어 | |
| `presentNearbyPresenceInfoOverlay` | 궤도 프레즌스 | |
| `presentWaveResultOverlay` | 웨이브 결과 | 이미 combat_end 앞단 |
| `showArcAlert` / reward / levelUp | compact | 제안 확인에 이미 사용 |
| `presentAdHocIngameDialog` | 1차 통신 | 바걸·inbound |

### 6-4. 바 NL 훅

`registerBarPatronageNlResolver` — `delivery=nl_preferred` 턴용.  
**등록자 없음.** 지금은 스크립트 폴백. 2차 메신저와 별축.

### 6-5. GM `bodyHint` (연출 힌트, 코드 미소비)

| when | bodyHint | 뜻 |
|------|----------|----|
| tutorial / quest active | `quest_hud` | 퀘스트 HUD를 보라는 말 |
| story active | `narrative` | 스토리 통신 |
| story_available / idle | `bar` | 수락은 바·NPC |

힌트를 **바로 바를 여는 코드로 쓰지 않는다.**

---

## 7. 추후 가능 — 몸이 이미 있어 입에 붙일 수 있는 것

원칙: **신규 월드 생성 금지.** 기존 함수를 제안 id 하나에 묶고, 확인 1장, 허브/해당 STAGE에서만.

### 7-A. UI 활성화 (가장 안전 · 대표님 「각종 UI」)

| 후보 id (아직 없음) | 기존 문 | 난이도 | 주의 |
|---------------------|---------|--------|------|
| `open_bar` | 바 시설 | 낮음 | GM이 이미 바를 가리킴. **바걸 등장의 정석** = 바 화면 입장(로스터 표시) |
| `open_skilltree` | 연구실 | 낮음 | 시설 게이트 |
| `open_mission` | 퀘스트 HUD / 바 보드 | 중 | **수락 금지.** 패널·안내만 |
| `open_economy` | 경제 오버레이 | 낮음 | 읽기 UI |
| `open_planet_dev` | 행성 개발 | 낮음 | |
| `open_ownership` | 점유 명단 | 낮음 | claim 트랜잭션 금지 |
| `open_talk_roster` | [대화] 명단 | 낮음 | |
| `open_nearby` | 궤도 정보 | 낮음 | |
| `open_settings` | 설정 | 낮음 | 세계 연출 약함 |
| `open_bm` | BM | 중 | 전투 중·Skia dispose 전 금지 |
| `open_relic` / `open_skill_info` | 로어·스킬 카드 | 낮음 | 컨텍스트 키 필요 |
| `depart_confirm` | 출발·월드맵 | 중 | 채굴/전투 스냅샷. 강제 출발 금지 |

### 7-B. 바걸 「등장」

| 안 | 가능 여부 | 설명 |
|----|-----------|------|
| **A. 바 열기** | **가능 · 권장** | `open_bar` → 기존 로스터가 보임. 새 NPC 생성 없음 |
| B. 특정 이름 1차 인사 | 가능 · 기반 | `presentAdHocIngameDialog` + `bar_attendant_hello.csv`. 2차가 1차를 스택하면 게이트 위반 → 메신저 dismiss 후 |
| C. 로스터에 없는 바걸 스폰 | **불가/비권장** | Table-First 로스터·초상 풀. LLM이 행을 만들면 안 됨 |
| D. 바 턴을 2차 NL로 | 기반만 | `registerBarPatronageNlResolver`. 채널 1개 유지하려면 메신저로 흡수할지 별도 승인 |

### 7-C. 전투지역 「발생」

| 기존 몸 | 지금 트리거 | 입에 붙이면 |
|---------|-------------|-------------|
| 웨이브 디펜스 | 행성 CSV `mainStageCombatVariant` · 착륙/인트로 | **생성 금지.** `warn_wave` / `open_ready` 안내·Ready UI만 |
| STAGE 3 궤도전 | 출격·조우 | 출발 확인 후 기존 루프 |
| 인바운드 드론 | `ArcInboundDroneSubCore` (몸) | 스폰 명령 금지. `get_spy_alert` 식 관측·허브 마크 안내 |
| 항로 조우 | 월드맵 이동 | `depart_hint`와 묶을 수 있음. 이동 중 강제 조우 생성 금지 |
| 스파이 정보원 1차 | pending alert | 이미 관측. 대화 후 정보원 씬은 1차 |

「대화하니까 전투가 생긴다」는 C안(입 write)이다.  
가능한 연동은 **이미 예정된 위협을 말하고, 기존 Ready/출격 문을 제안**하는 것이다.

### 7-D. 월드오브젝트 · 채굴 · 기타 몸

| 몸 | 상호작용 | 입 연결 후보 |
|----|----------|--------------|
| 소행성 | mining | `hint_mine` — 한도 소진은 이미 읽음. 채굴 시작은 마커 |
| 잔해 | salvage | 안내만 |
| 스테이션 | dock/trade | 무역소와 중복 가능 |
| 이상체 | scan | 첫 스캔은 이미 first_scan |
| 방위위성 | 없음/방어 | 개발 UI와 묶기 |
| 행성 점유 구매 | 무역 증서 | **대화 write 금지** |
| 섀도우 리빌 | 본진 웨이브 9 | 입 누설 검역 유지 |
| 일일 배치 | 12:00 몸 | 상태 읽기만 |

### 7-E. 미션 · 스토리

| 동작 | 지금 | 입 |
|------|------|----|
| 수락/클리어 | 1차 NPC·바 | **2차 금지** (GM 명시) |
| 활성 미션 말하기 | `get_active_mission` | 실기동 |
| 미션 패널만 열기 | id만 | 기반 |
| 대화로 퀘스트 신설 | — | **금지** |
| quest_* / story_scene_end 로 메신저 | reason만 | 1차 dismiss 후 같은 API |

### 7-F. 절대 연결하지 않음 (C안 · 검역)

- 크레딧·아이템·함선 지급  
- 스킬/성계/시설 언락  
- 일일 배치·AABS·가격 변경  
- 점유·팩션·금고 write  
- 섀도우 닉네임 사전 공개  
- 상용 툴(검색·코드·이미지)  
- 온디바이스 LLM · 13번째 서브코어  

---

## 8. 수량 요약

| 층 | 개수 | 내용 |
|----|------|------|
| 2차 LLM이 **집행**하는 액션 | **2** | 무역소 · 조선소 |
| 읽기 도구 | **10** | §3 |
| 예약 제안 id | **5** | 집행 2 · 미집행 3 |
| 허브 시설 문(몸) | **5** | 무역·조선·바·스킬·출발 |
| 오버레이 present (채팅 밖) | **12+** | §6-3 |
| 1차 완료 액션 타입 | **8** | 미션/플래그 |
| 메신저 오픈 reason | **10** | 실기동 4 · 예약/OFF 6 |

---

## 9. 확장 1안 (지시 오기 전 코딩 금지)

대표님 예시 세 가지를 **헌법과 맞는 연결**로만 쓰면:

1. **바걸 등장** → `open_bar` (제안→확인→기존 바). 필요하면 dismiss 후 특정 종업원 1차 인사. 신규 바걸 생성 없음.  
2. **UI 활성화** → 같은 패턴으로 `open_mission`(패널만) · 경제/개발/명단.  
3. **전투지역** → 생성하지 않음. 웨이브/드론이 **이미 예약된 행성**에서만 `warn` + 기존 Ready/출격 문.

다음 코드를 열 조건: 대표님 명시 + 제안 id 1개씩 + 확인 1장 + 기존 opener/present + `tsc` · 시설 프리플라이트 · 타이틀/틱에서 해석 금지.

교차: `docs/ARC_CORE_AGENT_WORLD_DOMAIN_DESIGN.md` §5 · `docs/대화형_아크코어_구현.md` §0-E·§0-G.
