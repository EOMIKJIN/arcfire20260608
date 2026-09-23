# 허브 대화 명단 + 아크코어 백채널 채팅 — 기획·설계 정본

> **문서 버전**: v0.5  
> **작성**: 2026-08-14  
> **상태**: **1차 구현 + 인간 대화 턴** — 명단·백채널·스토어·WaveDefense `combat_end` · 로컬 주고받기 회신  
> **v0.5**: 기본 채널 = 인간 대화 프로세스. 회신 = 의도 1축 + 최근 턴 기억. 이후 서비스 AI API는 Provider만 교체  
> **인지 재분석 (2026-08-14)**: 키워드 템플릿 ≠ 사고.  
> **구현 정본 (2026-08-14)**: `docs/대화형_아크코어_구현.md` v1.0 — 충돌 시 그 문서 우선. 본 문서는 명단·채널·STAGE 가드 상세
> **공동 검수**: 김클로드 `PARTIAL` (`arc-core-backchannel-joint-review-20260814`) · 김팀장 재확인·흡수 2026-08-14  
> **검수 직후**: 대화채널 전수 조사(메모리·누적·채팅기록 §11) **PASS** · 구현은 대표님 지시 후  
> **지시**: 대표님 2026-08-14 — [대화] → 대화가능 명단 → NPC는 기존 스크립트 / 아크코어는 상호 채팅  
> **추가 (같은 날)**: 아크코어 채널은 **게임 중 어디서든**, 시작·전투 종료·퀘스트 등 **어떤 조건에서도** 켜질 수 있는 단일 구조  
> **선행 검토**: 2026-08-14 김팀장 세션 — 아크코어 대화는 세계 조종 에이전트가 아니라 **근원체 관측 회신 창**  
> **헌법**: v4.0 §6·§8·§14-15 · Local-AI-First · Table-First · `ArcOverlayHost` 단일 호스트 · STAGE `replace()` · PSS §0-A  
> **교차**: `src/game/planetHubNpcDialog.ts` · `src/game/ingameDialog/` · `src/ui/overlay/` · `.cursor/rules/arcfire-ingame-dialog-ui-default.mdc` · §16-A 섀도우 페어링

---

## 0. 한 줄 요약

허브 **[대화]** 는 더 이상 최우선 NPC 스크립트를 바로 열지 않는다.  
**대화가능 명단**(아크코어 최상단 → 기존 우선순위 NPC)을 띄우고, 행 우측 **[대화]** 로 대상을 고른다.  
NPC·퀘스트는 **기존 일방 스크립트(1차 통신)만** 쓴다.  
아크코어는 **1차 통신으로 연락받은 뒤** 에이전트 채팅형 **2차 메신저**(히스토리 위로 스크롤 · 하단 입력)를 쓴다.  
게이트 정본: `docs/CONVERSATION_TWO_GATE_DESIGN.md`.  
이 창은 허브 명단의 전유물이 아니다. **루트 단일 API**로 어느 STAGE·어느 트리거에서도 같은 채널을 연다.  
채팅 로그는 **계정 귀속 · 상한 캡 · 오래된 것부터 덮어쓰기**이며 무한 스크롤을 금지한다.

```
[pss-pre-dev] hot_path=명단 오픈 1회 / 채널 present 1회 / 전송 1회 alloc=행 N개·메시지 1건 cache=명단 세션·채팅 bounded
[pss-pre-dev] stage=루트 ArcOverlayHost · STAGE 전환 시 dismiss · persist 전송 코얼레스
[pss-pre-dev] verdict=PASS — 화면별 채팅 복제·틱 폴링·전투 dispose 전 오픈·무한 로그 없으면 착수 가능
```

---

## 1. 기획 의도

| # | 의도 | 하지 않는 것 |
|---|------|----------------|
| 1 | 플레이어가 **누구와 말할지 고른다** | [대화] 한 번에 시스템 최우선 NPC만 강제 |
| 2 | NPC는 **대사·퀘스트 수락 창구**로 남긴다 | 기존 `NarrativeDialog`를 채팅으로 개조 |
| 3 | 아크코어는 **근원체와 주고받는 백채널** | Cursor/LLM이 세계·CSV·배치를 직접 바꿈 |
| 4 | 로그는 **짧은 기억** | 무한 히스토리 · 틱 persist · 클라우드 실시간 동기 |
| 5 | 채널은 **전역 1개**. 허브·시작·전투 후·퀘스트 등 어디서든 같은 창 | 화면마다 채팅 UI/스토어를 복제 · 조건마다 다른 창 |

세계관: 표시명은 위장 **「아크코어 근원체」**. 섀도우 짝 닉네임은 본진 리빌 전까지 채팅·명단에 넣지 않는다.  
아크코어 채팅은 세계를 **조종하는 에이전트**가 아니라, 로컬 월드 사실을 **회신하는 창**이다.  
**핵심 기능의 자리**는 12좌가 아니라 **본체(`eternal_throne`)의 대화면**이다. 13번째 서브코어로 올리면 판테온·틱과 충돌한다(§10).

---

## 2. 현재 구현 (전수 재검토 결과)

### 2-1. [대화] 버튼 — 즉시 최우선 1명

| 항목 | 정본 |
|------|------|
| UI | `PlanetMainScanActionRow` · i18n `scanRow.dialog` |
| 핸들러 | `app/(game)/planet.tsx` → `openPlanetHubNpcDialog` |
| 대상 | `resolvePlanetHubNpcDialogTarget` **1명만** |
| 결과 | `presentIngameDialogScene(sceneId)` 즉시 |

우선순위(숫자 **낮을수록** 앞, 기존 유지 · **CSV 값 변경 없음**):

| 순위 | source | 대표 priority | 비고 |
|------|--------|---------------|------|
| 0 | `spy_intel` | -100 | `planet.tsx`가 타겟 오버라이드. `spyIntelAutoOpenDialog`면 **버튼 없이 자동 오픈** |
| 1 | `main_story` | -50 | 행성 단위 수락 가능 `story_*` |
| 2 | `orbit_captain` / `governor` | CSV `mainStageTalkPriority` | 동점이면 `SOURCE_TIEBREAK` |
| 3 | `copresence` | (배지만) | 씬 pick 중복 없음 |

후보 **목록 함수는 이미 있다**: `listPlanetHubDialogCandidates(planetId, presentCaptainIds)`.  
지금은 `pickBestPlanetHubDialogCandidate`로 **1명만** 쓴다. 명단 UI만 없고, 후보 집계를 새로 발명할 필요는 없다.

궤도 함장 id는 `collectPlanetHubCaptainIds`(INFO/궤도 가시 전함). 허브 동시 트래픽 상한은 **8척** (`PLANET_HUB_ORBIT_CAPITAL_RENDER_MAX` · `ARC_ORBIT_PRESENCE_FILL_MAX`) + 총사령관 + 스토리 주입이라 **명단 N은 원래 bounded**(표시 상한 16).

### 2-2. 기존 대화창 — 일방 스크립트 (유지)

| 계약 | 내용 |
|------|------|
| 호스트 | `IngameDialogHost` + overlay kind `narrative` |
| 셸 | `NarrativeDialogRow` · 세로 3단(얼굴 300·합 482)·3줄 · `[ 다음 ]` |
| 입력 | **없음** (`TextInput` 전무) |
| 종료 액션 | `accept_main_story_mission` / `accept_quest_mission` 등 |
| 금지 | 이 창을 채팅으로 바꾸거나 높이·스크롤을 가변으로 만드는 것 |

NPC·퀘스트 수락은 **이 경로만** 사용한다.

### 2-3. 이미 있는 리스트+우측 버튼 패턴 (시각 참고)

`nearbyPresenceInfo` (`NearbyPresenceInfoOverlayContent`):  
`listingCard` = 좌측 이름/설명 + 우측 `NearbyPresenceRowActionButton`.  
명단 패널은 **이 조립을 재사용**하고, INFO 오버레이를 대화 명단으로 용도 변경하지 않는다(축 분리).

### 2-4. 없는 것

- 대화가능 NPC **명단 오버레이**
- 아크코어 **상호 채팅** kind · 입력창 · 히스토리 스토어
- 아크코어 채널 **전역 present API** (화면 밖 트리거가 호출할 입구)
- 플레이어 채팅 → `ArcCoreCommandBus` 연결 (그리고 **연결하지 않는다**)

---

## 3. 플레이어 플로우 (확정)

```text
허브 [대화]
  └─ ① 대화가능 명단 패널 (ArcOverlayHost · 신규 kind)
        ├─ 행 0: 아크코어 근원체     [대화] ──► ③ 백채널 채팅 패널
        ├─ 행 1..N: 우선순위 NPC    [대화] ──► ② 기존 NarrativeDialog
        └─ 스크롤 (행 수 > 뷰포트일 때만)
```

1. **[대화] 타일** — 스캔 행 위치·아이콘·레이아웃 상수 **불변**. 동작만 「명단 오픈」으로 바꾼다.  
2. **명단에서 NPC [대화]** — 지금과 동일하게 `presentIngameDialogScene` + `resolvePlanetHubNpcTalkCompletionActions` + 배지 ack.  
3. **명단에서 아크코어 [대화]** — 명단 dismiss 후 **전역 채널 API**로 채팅 패널. 기존 narrative를 쓰지 않는다.  
   허브 명단은 채널의 **진입점 하나**일 뿐, 유일한 진입점이 아니다.

### 3-1. 스파이 자동 오픈 (기존값 유지 · 1안)

`spyIntelAutoOpenDialog` **정책·자동 팝업은 유지**한다(긴급 경보).  
**[대화] 버튼은 항상 명단**을 연다. 스파이 정보원도 명단에 기존 우선순위로 한 줄 들어간다.  
자동 팝업이 이미 떠 있으면 명단을 겹치지 않는다(`isIngameDialogActive` 가드 유지).

### 3-2. 닫힘·복귀 (1안)

| 창 | 닫은 뒤 |
|----|---------|
| 명단 | **연 화면** (허브) |
| NPC 스크립트 | 연 화면 (명단 재오픈 없음) |
| 아크코어 채팅 | **연 화면** (허브·월드맵·전투 후 허브 등). 항상 허브로 `replace` 하지 않음 |

명단을 스크립트/채팅 아래에 깔아 두지 않는다(오버레이 스택·Views 잔류 방지).  
채널은 루트 `ArcOverlayHost`에만 붙이므로 STAGE를 바꾸지 않고 닫으면 아래 화면이 그대로다.

### 3-3. 빈 명단

후보 NPC가 0명이어도 **아크코어 1행은 항상** 있다.  
지금처럼 폴백 씬을 [대화]에 바로 띄우는 동작은 **폐기**한다(폴백 씬 자체·CSV는 삭제하지 않음. NPC 행이 씬을 못 찾을 때의 내부 폴백만 유지).

---

## 4. 명단 패널 — 설계

### 4-1. UI 계약

- `ArcOverlayHost` **신규** kind (가칭 `hubTalkRoster`). RN `Modal`/`Alert` 금지.
- `overlayChrome`: `panel` · `hostAnchor: 'top'` (settings / nearbyPresenceInfo와 동일).
- 조립: `ArcOverlayCard` + 헤더 + `ScrollView` + `footerDock`(`[ 닫기 ]`).
- 행: 좌측 초상/이름/한 줄 사유(스토리 수락·궤도 함장·총사령관·스파이) · 우측 **[대화]**.
- 레드점: 행 단위 `showInitiatedBadge`. 허브 타일 배지는 **명단 중 1행이라도 미확인이면** 유지.
- `planetMainStageLayout` 상수 변경 금지. 명단은 오버레이만.

### 4-2. 행 정렬 (확정)

1. **고정 1행**: `kind: 'arc_core'` — 아크코어 근원체. priority 개념 밖.  
2. **나머지**: `listPlanetHubDialogCandidates` + 스파이 대기 행을 합친 뒤  
   기존 `pickBest`와 **같은 비교**(priority 오름차순 → `SOURCE_TIEBREAK`).  
3. **함장 id 1행**: 같은 `captainId` 중복 금지(스토리 오버레이가 씬만 교체).

표시 상한(안전): **16행**(아크코어 포함). 초과분은 버림 — 허브 실측 N은 이보다 작다.  
틱·rAF에서 명단을 다시 만들지 않는다. **오픈 시점 1회** 스냅샷.

### 4-3. 아크코어 행

| 필드 | 값 |
|------|-----|
| 표시명 | i18n `arcCoreShadow.boss.concealedName` (아크코어 근원체) |
| 부제 | 「백채널」 등 고정 문구(신규 i18n) |
| 초상 | 전용 키 또는 기존 근원체 폴백. 섀도우 유저 초상 **금지** |
| 버튼 | [대화] → 채팅 kind |

---

## 5. 아크코어 채팅 — 전역 채널 (v0.2 추가)

허브 [대화] 명단은 **수동 진입 1경로**다.  
아크코어 에이전트 채널 자체는 **게임 중 어디서든, 어떤 조건에서도** 같은 창·같은 로그·같은 API로 켜져야 한다.

### 5-0. 구조 원칙

```text
  트리거 A  허브 명단 [아크코어]     → 1차 통신 → 2차
  트리거 B  inbound 선제 연락         → 1차 통신(수락) → 2차
  트리거 C  특정 전투 종료            → 기존 1차 오퍼레이터 → (결과) → 2차
  트리거 D  특정 퀘스트 수락/클리어   → NPC는 1차만 / NL 입만 2차
  트리거 E  이후 추가                 → 같은 순서
        │
        ├─ 1차  presentNlMouthComm / presentIngameDialogScene
        └─ 2차  presentArcCoreBackchannel({ reason, openerText? })  ← 메신저 유일 API
              ├─ 이미 열려 있으면 새 패널을 쌓지 않음
              ├─ 같은 스토어 `arcfire_arc_core_chat_v1` (40건 캡)
              └─ 같은 overlay kind `arcCoreChat` (루트 ArcOverlayHost)
```

| 해야 할 일 | 하지 말 일 |
|------------|------------|
| **채널 1개** · present 함수 1개 · 스토어 1개 · kind 1개 | `planet.tsx` / `combat.tsx` / `worldmap.tsx`에 채팅 컴포넌트 복제 |
| 조건은 **트리거가 API를 호출**할 뿐 | 조건마다 다른 UI·다른 히스토리 파일 |
| Table-First로 자동 오픈 조건을 나중에 CSV에 추가 가능 | 화면 `useEffect`에 조건 하드코딩 남발 |
| 전투 종료 오픈은 **dispose·`postStepRef=null` 이후** | STAGE 3 캔버스 살아 있는 동안 패널 오픈 (OOM §14-11) |
| 세션 시작 오픈은 **차원항로/`runContinueSessionPrewarm` 이후** | 타이틀 「이어하기」 활성 전에 채널·prewarm 묶기 |

`presentIngameDialogScene`이 스토리/NPC 대사의 전역 입구인 것과 같이,  
`presentArcCoreBackchannel`이 아크코어 채팅의 **전역 입구**다.

### 5-0-1. 호출 가능 위치 (폭넓게 · 화면 소유 없음)

루트에 `ArcOverlayHost`가 있으므로 아래는 모두 **같은 패널**을 연다.

| 위치 | 예시 | 가드 |
|------|------|------|
| STAGE 0 이후 세션 | 이어하기/시작 후 첫 허브 또는 인트로 dismiss | 타이틀 `titleInteractive`에 묶지 않음 |
| STAGE 1 허브 | 명단 아크코어 행 · 이후 HUD 단축(선택) | 명단과 채팅 동시 스택 금지 |
| STAGE 2 월드맵 | 퀘스트/이벤트 트리거 | 맵 전용 채팅 뷰 금지 |
| STAGE 3 전투 **후** | 특정 전투 승리/패배 결과 닫힌 뒤 | Skia `dispose` 완료 전 금지 |
| 시설 서브(무역·바 등) | 퀘스트 수락 직후 백채널 | 시설 로컬 Modal 금지 |
| 일일 배치·스파이 등 | 시스템 한 줄 + 채널 오픈 또는 배지만 | 틱마다 오픈 금지 · **이벤트 1회** |

1차 구현은 API + 허브 명단 진입 + 스토어만 넣어도 된다.  
시작·전투·퀘스트 트리거는 **같은 API를 호출하도록 구멍만 열어 두고**, CSV/호출부는 후속(Table-First)으로 붙인다.  
구조를 허브 전용으로 짜면 나중에 뜯게 되므로, **처음부터 전역 present**로 잡는다.

### 5-0-2. 자동 오픈 조건 (확장 슬롯 · 1차에 전 조건 구현 의무 없음)

조건은 코드 분기가 아니라 **트리거 테이블**(예정, 기존 씬 CSV와 별도)로 늘린다.

| `triggerKey` (가칭) | 의미 | 비고 |
|---------------------|------|------|
| `manual` | 명단·단축 버튼 | 1차 필수 |
| `session_start` | 세션이 허브에 안착한 뒤 1회 | 계정당/일 1회 등 디듀프 키 필요 |
| `combat_end` | `combatId` / variant 매칭 | dispose 후 · 결과 오버레이와 동시 스택 금지(결과 닫힌 뒤) |
| `quest_accept` / `quest_clear` / `quest_objective` | `missionId` 매칭 | 기존 스크립트 창과 **동시에** 열지 않음(스크립트 dismiss 후) |
| `story_scene_end` | 특정 씬 종료 후 백채널 | 체인 1단만 |
| 이후 | 스파이·일일 배치 통지·본진 리빌 | 같은 API |

디듀프: `lastFiredTriggerKey+id`를 채팅 스토어 또는 플레이어 플래그에 **bounded**로 남긴다.  
같은 전투/퀘스트로 채널을 매 프레임·매 재진입마다 띄우지 않는다.

오픈 시 선택적으로 **시스템 오프너 한 줄**(아크코어가 먼저 말함)을 append할 수 있다. 이것도 40건 캡에 포함.

### 5-0-3. 동시성 · STAGE 전환

- 채널이 열린 채 `Navigation.replace`로 STAGE가 바뀌면 **패널은 dismiss**한다. 로그 스토어는 남는다(다음 화면에서 다시 열면 이어짐).
- 이미 `arcCoreChat`이 떠 있는데 다른 트리거가 오면 **두 번째 패널을 만들지 않는다**. 오프너 텍스트만 있으면 한 줄 추가.
- `narrative`(NPC 스크립트)와 채팅은 **동시 금지**. 스크립트가 끝나면 트리거가 채널을 연다.
- 전투 중(시뮬 루프 활성) 자동 오픈 **금지**.
- `resolvePendingArcOverlaysForStageExit`는 보상 kind(`levelUp`/`reward`/`waveResult`)만 `onClose` 후 **스택 전체 `dismissAll`**. 채팅·명단은 이 blanket으로 닫힌다. `narrative`는 `ingameDialogStore` 별도 세션이라 이 함수 범위 밖(기존 갭 · 채팅이 만든 구멍이 아님).

---

## 6. 아크코어 채팅 패널 — 설계

### 6-1. UI (에이전트 대화창을 팝업으로)

Cursor/에이전트 채팅과 **같은 정보 구조**를 게임 패널에 옮긴다.

```text
┌─ 아크코어 근원체                    [X] ─┐
│  (오래된 메시지)                          │
│  플레이어: …                              │
│  아크코어: …                              │
│  (최신 — 하단 고정 스크롤)                │
├──────────────────────────────────────────┤
│  [ 입력 …                         ] [전송] │
└──────────────────────────────────────────┘
```

| 계약 | 내용 |
|------|------|
| kind | 가칭 `arcCoreChat` · `panel` · `hostAnchor: 'top'` |
| 본문 | `ScrollView` · 최신으로 스크롤 · **가상 무한 로드 없음** |
| 입력 | `footerDock`에 `TextInput` + 전송. 헤더 X로 닫기 |
| 키보드 | 패널 내부 Avoiding만. `ArcOverlayCard`에 `KeyboardAvoidingView` 선례 없음(Host 최초 TextInput). Android soft-input + iOS Avoiding **실기 검증**. 허브 `padding`/`setInterval` 금지 |
| 기존 창 | `NarrativeDialogRow` / 204px 고정 높이 **재사용 금지**(축이 다름) |

전송 중에는 입력 비활성. 오프라인·로컬 회신 실패 시 고정 실패 한 줄(LogBox/Alert 남발 금지).

### 6-2. 회신 엔진 — 인간 대화 턴 (v0.5)

기본 채널은 **브리핑 덤프가 아니라 주고받는 대화**다.

```text
플레이어 : 안녕 반가워
아크코어 : 반갑습니다. 아크코어입니다. 무엇이 필요하십니까?
플레이어 : 여기 어디야?
아크코어 : (행성 한 축만)
플레이어 : 안녕
아크코어 : (이미 인사함 → 짧은 추임새, 브리핑 재반복 금지)
```

한 유저 줄 → **의도 하나 → 답 한 축**. 인사에 첩보·거절을 붙이지 않는다.

```text
[pss-pre-dev] hot_path=전송 1회 alloc=턴 DTO 1개+회신 1줄 cache=최근 8턴(스토어 40 슬라이스)
[pss-pre-dev] stage=기존 overlay · hydrate 오픈/허브 안착만
[pss-pre-dev] verdict=PASS — 틱/부트/스트리밍/월드 write 없음
```

#### 6-2-1. 한 턴 루프

```text
유저 전송
  → 턴 조립 (로컬·동기·읽기만)
       intent · facts(화이트리스트) · recent(≤8) · alreadyCovered
  → ReplyProvider.complete(turn)
       지금: local (템플릿 1문장)
       이후: cloud (Functions 단발 · 같은 턴 DTO)
  → 검역 (500자 · 명령/아이템 환각 금지)
  → 실패/타임아웃 → local 폴백
  → 스토어 append (40/500 기존)
```

| 해야 할 일 | 하지 말 일 |
|------------|------------|
| 한 질문 → 한 축 | 매 턴 행성+첩보+거절을 묶음 |
| 최근 유저 의도로 반복 억제 | 히스토리 스키마 확대 · 무한 컨텍스트 |
| 거절은 이유 한 줄 | 거절+브리핑 |
| 팩트 화이트리스트만 API에 전달 | 프로필·인벤·금고·명령버스 통째 송신 |
| Provider만 교체해 서비스 AI API 연동 | 클라 벤더 SDK · API 키 · onSnapshot |

#### 6-2-2. 의도 (로컬 분류 · LLM 없음)

복합문은 **아래 우선**이다. 「안녕, 여기 어디야?」→ `location`.

| 우선 | intent | 예 |
|------|--------|-----|
| 1 | `refuse` | 언락·배치·명령·크레딧·AABS |
| 2 | `location` | 어디·행성·여기 |
| 3 | `spy` | 스파이·첩보·경보 |
| 4 | `combat` | 전투·교전·결과 |
| 5 | `greet` | 안녕·반가워 |
| 6 | `other` | 그 외 → 무엇을 필요하냐고 되물음 |

`alreadyCovered`는 **직전 유저 줄들의 의도**로만 본다(스키마 추가 없음).

#### 6-2-3. 턴 계약 (API가 바뀌어도 유지)

```text
ArcCoreChatTurn
  userText
  intent
  facts     planetLabel · spyAlertPending · hasCombatRecord
  recent    최근 ≤8 (스토어 40 슬라이스, 이번 유저 줄 제외)
  alreadyCovered  greeted · location · spy · combat · other
  policy    worldWrite=false · maxChars=500 · persona=근원체
```

`facts`에 프로필 전체·함선·금고·명령 상태를 넣지 않는다.

#### 6-2-4. Provider — 이후 서비스 AI API 자리

| Provider | 역할 | 언제 |
|----------|------|------|
| `local` | 의도+팩트+반복억제로 **한 문장** | **기본 · 오프라인 · 폴백** |
| `cloud` | 같은 턴 DTO를 Functions에 보냄. 서버만 벤더 키를 앎 | 별도 승인 후 |
| 온디바이스 | — | **금지** |

클라우드 모드(같은 인터페이스):

| 모드 | 서버 | 허용 |
|------|------|------|
| A 윤색 | 로컬 초안을 문장만 다듬음 | 2차 기본 |
| B 생성 | 턴 DTO로 문장 생성 · 로컬 검역 | 가능 |
| C 도구 에이전트 | 월드 write 툴 | **금지** |

클라는 벤더 SDK를 넣지 않는다. 호출은 Callable 1회. 키는 Functions Secret. 스트리밍·키입력 persist·동시 요청 N개·타이틀/prewarm 대기 **금지**. `inFlight` 1 · 타임아웃 후 local.

#### 6-2-5. 단계

| 단계 | 내용 | 월드 write |
|------|------|------------|
| **지금 (v0.5)** | 로컬 인간 대화 턴. **접수 창구·오프라인 폴백**. 사고 아님 | 금지 |
| 인지 기반 | `docs/ARC_CORE_CONVERSATIONAL_AGENT_FOUNDATION.md` — 헌법·지식·도구·기억 스캐폴드 + 클라우드 생성(모드 B) | 금지 |
| 금지 | 온디바이스 LLM · 채팅 → `dispatchArcCoreCommand` · 일일배치/AABS/언락/점유 · 템플릿 확대로 사고 대체 | — |

환각으로 가짜 퀘스트·아이템을 주지 않는다.  
키워드·i18n을 늘려 「사고」를 선언하지 않는다. 실제 대화 지능은 재분석 문서의 에이전트 루프다.

### 6-3. 로그 저장 — 상한 · 덮어쓰기

**분류**: 플레이어 인터랙티브 진행 → 계정 귀속.

| 항목 | 1안 (신규 상수 · 기존 CSV 아님) |
|------|----------------------------------|
| 키 | `arcfire_arc_core_chat_v1` |
| 상한 | 메시지 **40건**(유저+아크 합산). 초과 시 **가장 오래된 건부터 삭제** |
| 1건 본문 | 최대 **500자** 절단 |
| persist | **전송 성공 후**만. 디바운스 1.5s 허용. 키 입력마다 저장 금지 |
| hydrate | 채팅 오픈 또는 **허브 안착 후** 1회. 타이틀·prewarm·렌더/틱 금지 |
| 초기화 | `reset*` + `purgeLocalAccountData` 필수 |
| 백업 | game-save 스냅샷에 포함(다른 진행 스토어와 동일) |
| 클라우드 실시간 | **금지** (`onSnapshot` · RTDB 리스너 없음) |

스키마(구현 시):

```text
{ schemaVersion: 1, updatedAtMs,
  messages: [{ id, role: 'user'|'arc'|'system', text, atMs, reason? }],
  lastFired: [{ key, id, atMs }]   // 자동 오픈 디듀프 · 상한 16건 · 오래된 것 삭제
}
```

UI 스크롤 길이는 `messages.length ≤ 40` 이므로 무한대가 될 수 없다.  
페이지 추가 로드·서버 아카이브는 하지 않는다.

---

## 7. 메모리 · STAGE · 기존값

### 7-1. PSS

| 금지 | 대안 |
|------|------|
| 궤도 틱마다 명단 재빌드 | 오픈 시 `list*` 1회 |
| 채팅 배열 무한 append + 즉시 `JSON.stringify` | 40캡 + 전송 후 코얼레스 persist |
| 온디바이스 모델 | 로컬 템플릿 |
| 명단+스크립트+채팅 3중 스택 | 한 번에 오버레이 1 + narrative 0/1 |
| 화면마다 채팅 트리 복제 | 루트 Host + `presentArcCoreBackchannel` 1경로 |
| 전투 루프 중·dispose 전 오픈 | 결과 dismiss + Skia dispose 이후 1회 |
| 타이틀 버튼에 채널 대기 | 차원항로/허브 안착 후만 `session_start` |
| `planet` 객체 통째 useMemo dep | `planet.id` · revision |

완료 게이트(구현 턴): `tsc` · `audit:ui-overlay` · `audit:memory:all`. Skia 루프 없으면 `audit:skia-memory` 생략.  
김경제 `mem-post-dev-recheck`는 코드 반영 후.

### 7-2. 기존값 변경 재확인

| 대상 | 이번 기획 |
|------|-----------|
| `mainStageTalkPriority` 등 CSV | **변경 없음** — 명단 정렬만 기존 식 재사용 |
| `NARRATIVE_DIALOG_LAYOUT` | **변경 없음** |
| `PLANET_MAIN_*` 레이아웃 | **변경 없음** |
| `spyIntelAutoOpenDialog` | **변경 없음** |
| [대화] 타일 위치 | **변경 없음** — 핸들러만 |

신규 kind·스토어·i18n·상한 40/500은 **신규 추가**라 기존값 재확인 대상이 아니다.

---

## 8. 구현 착수 시 파일 지도 (아직 작성하지 않음)

| 축 | 예정 |
|----|------|
| **전역 채널 API** | `src/arcCore/chat/presentArcCoreBackchannel.ts` — 유일 입구. 허브·전투 후·퀘스트·시작이 이 함수만 호출 |
| 트리거 레지스트리 | `src/arcCore/chat/arcCoreBackchannelTriggers.ts` + 이후 CSV (1차는 `manual`만 연결, 나머지 슬롯만) |
| 명단 집계 | `planetHubNpcDialog.ts`에 `listPlanetHubTalkRosterRows` (아크코어 prepend + 기존 후보 정렬) |
| 명단 오픈 | `planet.tsx` `openPlanetHubNpcDialog` → roster present. 스파이 자동 오픈 분기는 유지 |
| overlay kind 등록 **3곳** | (a) `tacticalOverlayRollout.ts` `TACTICAL_OVERLAY_KIND_FLAGS` — **컴파일 강제** (b) `overlayChrome.ts` switch — `default` 있으면 누락해도 통과 (c) `ArcOverlayHost.tsx` 렌더 분기 — 누락 시 조용히 안 그림. `audit:ui-overlay`는 kind 완전성 미검사 |
| overlay 오픈 | 고정 id + `dismissWhere` 후 1장 (settings/wave 패턴). `nearbyPresenceInfo` append 금지 |
| 채팅 스토어 | `src/store/arcCoreChatStore.ts` · purge · `PLAYER_GAME_SAVE_BACKUP_KEYS` · `reloadAllLocalGameSaveStores` · `lastFired` 16캡 |
| `combat_end` 훅 | **1차 WaveDefense만**: `planet.tsx` `handleWaveDefenseRunEnded` → 종료 대사 dismiss → `presentWaveResultOverlay` **`onClose` 안**(EXP·reset 이후). 퇴거 `replace` 직전이면 present 안 함. **캡틀레이드**: 1차는 슬롯만. 구현 시 `PlanetEdenRaidOrbitSkiaCombat` dispose에서 `combatOrbitPostStepRef=null` **이후** + 결과창이 있으면 그 `onClose` 이후. postStep 콜백 본체에서 fire 금지 |
| 회신 | `arcCoreChatTurn` · `localConversationalProvider` · `arcCoreChatReplyProvider` — 스텁 금지. 명령버스 import 금지. `src/arcCore/index.ts`에서 chat export 금지 |
| i18n | 명단 제목·백채널 부제·전송·실패 문구 KO/EN |

Table-First 핵심(CSV 우선순위 값)은 건드리지 않으므로 Fable 위임 대상 아님. UI·스토어·arcCore 스텁은 김팀장.

---

## 9. 수락 체크 (코드 전)

- [x] [대화] → 명단 → 대상별 창 분기
- [x] NPC = 기존 스크립트 + 퀘스트 수락 유지
- [x] 아크코어 = 채팅형 상호 대화 · 로그 상한 덮어쓰기
- [x] 아크코어 행 최상단 · 이후 기존 NPC 우선순위
- [x] 채널은 **전역 1 API** — 허브·시작·전투 후·퀘스트 등에서 동일 창
- [x] 세계 조작 에이전트·온디바이스 LLM·무한 스크롤 제외
- [x] 기존 시스템·아크코어 핵심과의 충돌 전수 조사 (§10)
- [x] 메모리·누적·채팅기록 전수 (§11) — 김클로드 검수 흡수 후 김팀장 재확인 **PASS**
- [x] 김클로드 공동 검수 `PARTIAL` 흡수 (READY `arc-core-backchannel-joint-review-20260814`)
- [x] 검수 직후 김팀장 전수 조사 보고 (`kim-team-lead-ready-arc-core-backchannel-post-review-full-audit.md`)
- [x] 대표님 **구현 지시** — 1차: API·명단·채팅 스토어·허브 [대화]·WaveDefense `combat_end`
- [x] 인간 대화 턴 (v0.5) — 의도 1축 · 반복 억제 · Provider 자리 · 브리핑 덤프 폐기

---

## 10. 전수 연동·충돌 조사 (코드 전 · 2026-08-14)

대표님 전제: **아크코어 에이전트 채널 = 아크코어 현재 시스템의 핵심 기능.**  
조사 범위: 12좌 서브코어 · 명령버스 · 일일 배치 · AABS · 스파이/드론 · 섀도우 · 뉴스보드 · 인게임 대사 · 오버레이 스택 · STAGE 이탈 · 타이틀/차원항로 · 미션 클리어 체인 · persist/purge.

### 10-0. 판정

| 판정 | 내용 |
|------|------|
| **연동 가능** | 채널을 **본체(`eternal_throne`)의 플레이어 창구**로 두고, 핵심 서브코어는 **읽기만** 하면 충돌 없음 |
| **핵심으로 두되 13좌 금지** | 등록 서브코어는 **12개 고정**. 채팅을 `registerDefaultArcSubCores`에 13번째로 넣으면 판테온·틱 예산과 충돌 |
| **write 금지면 안전** | 채팅 → 명령버스/AABS/배치/언락/점유/크레딧 **금지**이면 경제·밸런스 핵심과 충돌 없음 |
| **UI 경합은 설계로 해소** | 오버레이 스택·STAGE 이탈·전투 후 체인·스파이 자동창은 **가드만 지키면** 기존 시스템 유지 |

**REDESIGN이 되는 넣기:** 13번째 SubCore + `onWallTick`에서 패널 오픈 · 채팅이 `dispatchArcCoreCommand` · 타이틀/prewarm에 채널 대기 · 전투 dispose 전 오픈 · 뉴스보드와 창 병합.

### 10-1. 「핵심」의 자리 — 본체 창구 ≠ 13번째 좌

| 층 | 지금 | 채널의 자리 |
|----|------|-------------|
| 본체 | `node_eternal_throne` — 12좌 **밖** 근원 | **여기의 목소리**. 에이전트 = 근원체가 플레이어와 말하는 면 |
| 12좌 | DailyOps·AABS·NPC·드론·스파이·행성·경제·공격·뉴스·성운·해금 등 | **읽기 소스**. 좌를 대체하거나 틱에 올라타지 않음 |
| 이리스 | `ArcNewsBoardSubCore` — 바 **일방 공지** | **축 분리 유지**. 공지 피드 ≠ 상호 채팅. 공지를 채팅으로 바꾸지 않음 |
| 명령버스 | 정책/디버그/admin_bulk → 서브코어 | 채널은 **구독만 가능**(오프너 한 줄). `origin: player_chat` 추가·발행 **금지** |
| 일일 배치 | 12:00 1회 · 차원항로에서 join | 배치 **안**에서 패널 present 금지. 완료 이벤트는 이후 트리거 슬롯 |
| AABS | `applyAabsCreditMultiplier` 등 보상 경로 | 채팅 전송/회신이 크레딧·EXP·refund를 타면 안 됨 (환불 버그 교훈과 동일) |

구현 모듈은 `src/arcCore/chat/` 에 두어 **아크코어 패키지의 핵심 창구**로 분류한다.  
허브 `gameLoop` 구독·`onBoot` 동기 패스는 **넣지 않는다**(부트 1GB 회귀와 같은 계열).

### 10-2. 기존 「아크코어가 말하는」 면 — 병합하지 말 것

이미 근원/좌가 플레이어에게 닿는 길이 있다. 채널은 **상호 대화만** 추가하고 아래를 흡수하지 않는다.

| 기존 면 | 성격 | 채널과의 관계 |
|---------|------|----------------|
| `NarrativeDialog` / 스토리 CSV | 일방 스크립트 · 퀘스트 수락 | **유지**. 동시 오픈 금지 · dismiss 후 트리거만 |
| 스파이 정보원 자동 창 | `spyIntelAutoOpenDialog` | **유지**. 버튼은 명단. 채널과 겹치면 스크립트 우선 |
| `ArcNewsBoardSubCore` → 바 보드 | 일방 공지 · 24h | 보드 유지. 같은 이벤트를 채팅에 **자동 복붙하지 않음**(1차) |
| 섀도우 리빌 alert | 본진 승리 1회 | 채팅에 닉네임 금지. 리빌 전에는 위장명만 |
| 인바운드 드론 연출 | 아폴론 틱 핫패스 | 회신이 「관측됨」만. 드론 시뮬/요격 로직 변경 없음 |
| 월드 해금 명령 | 야누스 | 오프너 슬롯만. `world_system_unlocked`를 채팅이 재발행 금지 |

### 10-3. 충돌 표

| ID | 기존 시스템 | 위험 | 해소 (설계 고정) | 심각 |
|----|-------------|------|------------------|------|
| C1 | 12좌 `registerDefaultArcSubCores` | 13번째 등록·틱 증가 | 서브코어 추가 **금지**. 본체 창구 모듈만 | P0 |
| C2 | `ArcCoreCommandBus` | 채팅이 gather/unlock/경제 bulk | 발행 금지. 구독은 오프너 전용·1차 미구현 | P0 |
| C3 | 일일 배치 · `continueSessionPrewarm` | 타이틀/차원항로에 채널·LLM 대기 | `session_start`는 **허브 안착 후**. prewarm에 present 금지 | P0 |
| C4 | STAGE 3 Skia · §14-11 | 전투 중/dispose 전 패널. 캡틀레이드 dispose와 WaveDefense 결과창은 **별 배선** | 시뮬 활성·`combatOrbitPostStepRef` 살아 있으면 거부. 1차 `combat_end`는 WaveDefense 결과 `onClose`만. 캡틀레이드는 dispose null **이후** 슬롯(§8) | P0 |
| C5 | `resolvePendingArcOverlaysForStageExit` | 출발 시 채팅이 다음 STAGE를 가림(7/6 검은화면 동형) | 함수는 보상 kind `onClose` 후 **스택 전체 dismissAll**. 채팅·명단은 자동 닫힘. `narrative`는 이 함수 밖(기존) | P0 |
| C6 | 오버레이 `present` = **무한 append** | 명단+채팅+설정+alert 스택 · Views | 채팅은 **고정 id + dismissWhere 후 1장**. 명단과 동시 금지 | P0 |
| C7 | `transitCombatPostFlow` · waveResult · levelUp | 보상 체인 중간에 채널이 끼면 보상 유실/가림 | 결과·레벨업·미션클리어 스크립트 **끝난 뒤**만 트리거 | P0 |
| C8 | `tryPresentPendingMissionClearDialog` | 허브 진입 시 클리어 대사와 경합 | `isIngameDialogActive`와 동일하게 클리어 대사 우선. 채널은 그 다음 | P0 |
| C9 | 스파이 자동 오픈 | 명단/채널과 삼중 | 자동 스크립트 유지. 활성 중 present 거부 | P1 |
| C10 | AABS 보상 경로 | 회신이 크레딧/EXP를 주면 밸런스 붕괴 | 회신 스텁에 경제 함수 import 금지 | P0 |
| C11 | 섀도우 §16-A | 채팅에 짝 닉네임·스냅샷 | 위장명만. shadow store 읽기 금지(리빌 전) | P0 |
| C12 | 이리스 뉴스보드 | 「아크코어 공지」와 채팅이 한 창으로 합쳐짐 | 축 분리. 1차 자동 미러 금지 | P1 |
| C13 | `planetMainStageLayout` · 궤도 Skia | 허브 키보드가 레이아웃 상수/궤도 흔들림. Host **최초 TextInput** | 오버레이 내부 Avoiding만(선례 없음 · 실기). 허브 padding 변경 금지 | P1 |
| C14 | persist / purge / game-save | 스토어 미등록 시 초기화 잔존·세이브 누락 | `purgeLocalAccountData` + backup 필수. 40건만 | P1 |
| C15 | `missionStore` ↔ dialog 순환 | 채팅이 missionStore를 직접 present | 미션 모듈은 API만 호출. 채팅→미션 수락 금지(NPC 스크립트 전담) | P1 |
| C16 | Heavy UI preflight | 허브 세션 아닌데 패널 | 월드맵/전투후는 preflight 허브 전제에 묶지 않음. 채널은 세션 가드만 | P1 |
| C17 | 신규 kind 등록 | `audit:ui-overlay`는 Modal/Alert grep만. chrome/Host 누락은 **컴파일 통과** | 등록 3곳(§8). 강제점은 `TACTICAL_OVERLAY_KIND_FLAGS`뿐 | P1 |
| C18 | 순환 import | `src/arcCore/index.ts` **존재**(배럴). territorial은 이미 overlay alert 정적 import | chat을 배럴에 올리지 않음. SubCore는 `presentArcCoreBackchannel` 정적 import 금지. 점령 alert(일회 알림)과 채팅(유지 패널)은 축이 달라 채팅만 더 엄격 | P0 |
| C19 | 벽시계 catch-up | 실제는 `_layout` 비동기 시작 + prewarm **join**(동기 전 행성 재빌드 아님) | 회신 요약은 **오픈/전송 시 1회** 읽기. 틱·catch-up 재수집 금지 | P0 |
| C20 | 멀티/`onSnapshot` | 실시간 에이전트 착각 | 로컬만. Firestore 리스너 금지 | P0 |

### 10-4. 핵심 기능과의 **허용 연동** (읽기)

회신 스텁이 봐도 되는 것(오픈/전송 시 요약 객체 1개, 상한 필드):

- 현재 `planetId` / 행성 표시명  
- 허브면 드론·스파이 「있음/없음」 플래그만  
- 최근 일일 배치 **완료 여부**(내용 전체 dump 금지)  
- 개방 성계 수 등 스칼라  

보면 안 되는 것: 섀도우 스냅샷 전투스탯, faction vault 잔액 상세, AABS 내부 멀티플라이어 조작, 전 행성 코어 루프.

### 10-5. 1차 구현에서 건드리지 않는 핵심

`runArcCoreDailyOpsBatch` · `AiNpcSubCore` 틱 · `ArcInboundDroneSubCore` 틱 · AABS daily alignment · `planetMainStageLayout` · `NARRATIVE_DIALOG_LAYOUT` · 스파이 정책 CSV · 12좌 CSV · 명령 타입 추가.

건드리는 것(구현 지시 후): overlay kind 2 · 전역 present · 스토어 · 허브 [대화] 핸들러 · purge/backup 한 줄.

### 10-6. 조사 결론

기존 아크코어 **시뮬·배치·12좌는 그대로 핵심**이다.  
에이전트 채널은 그 위에 얹는 **본체 대화면**이지, 시뮬을 대체하는 새 엔진이 아니다.  
§10-3 P0 가드를 코드 계약으로 지키면 **충돌 없이 핵심 기능으로 연동 가능**하다.

### 10-7. 김클로드 공동 검수 흡수 (2026-08-14)

김클로드 `verdict=PARTIAL` · 김팀장 코드 재확인.

| 항목 | 김클로드 | 김팀장 | 반영 |
|------|----------|--------|------|
| C1~C3, C6~C16, C20 | AGREE | AGREE | 유지 |
| C4 | PARTIAL — 캡틀레이드 dispose와 WaveDefense 결과 미연결 | **동의** | §8 훅 지점 · C4 문구 |
| C5 | PARTIAL — blanket dismissAll · narrative 미커버 | **동의** | §5-0-3 · C5 |
| C13 키보드 | 선례 없음 | **동의** | §6-1 |
| C17 | audit가 kind 미검사 | **동의** | §8 3곳 |
| C18 배럴 없음 | 「`arcCore/index.ts` 없음」 | **정정** — 파일 있음. 순환 위험은 유효 | C18 |
| C19 동기 재빌드 | 과장 | **동의** | C19 |
| 궤도 5척 | 오기 → 8 | **동의** | §2-1 |

---

## 11. 메모리 · 누적 · 채팅기록 전수 (2026-08-14 · 검수 직후 **PASS**)

대표님 지시: 김클로드 검수 종료 후 최종 전수. 김팀장 재확인 완료.

### 11-0. 판정 (최종)

| 축 | 판정 | 막아야 할 것 |
|----|------|----------------|
| 메모리 | 루트 1 Host + 오픈 1회 스냅샷 + STAGE dismiss면 PSS 허용 | 틱 재빌드 · 화면별 채팅 트리 · 전투 중 오픈 · 타이틀 hydrate |
| 누적 | 40/16/1장 캡을 **읽기·쓰기·복구** 모두에 걸면 안전 | `present()` 무한 append · lastFired 무한 · 키입력 persist |
| 채팅기록 | 계정 키 1개 + purge + backup + restore hydrate | 키만 넣고 `reloadAllLocalGameSaveStores` 누락 · 부트 동기 hydrate |

`verdict=PASS` (설계 · 검수 흡수 후 재확인). 구현 시 §11-3 등록 4곳을 빠뜨리면 **REDESIGN이 아니라 누락 버그**.

### 11-1. 메모리 — 기존 코드 근거

| 사실 | 근거 | 채널 계약 |
|------|------|-----------|
| overlay `present`는 `stack: [...stack, next]` **무한 append** | `arcOverlayStore.ts` `present` | 채팅/명단은 settings와 같이 **고정 id + `dismissWhere` 후 1장**. alert 고정 id의 단일 set 교체도 허용 |
| Host는 **top만** 렌더. 아래 스택은 Views/콜백이 남을 수 있음 | `presentArcOverlayAlert` 주석 | 명단 dismiss 후 채팅. 3중 스택 금지 |
| `nearbyPresenceInfo`·`relicLore`는 고정 id인데 `present`만 함 → **같은 id가 스택에 중복될 수 있음** | `presentNearbyPresenceInfoOverlay` / `presentRelicLoreOverlay` | **이 패턴 금지**. settings/wave/bm (`dismissWhere` 후 present)만 복제 |
| STAGE 이탈은 보상 kind만 `onClose` 후 `dismissAll` | `resolvePendingArcOverlaysForStageExit` | 채팅에 보상 `onClose` 없음. dismissAll에 포함되면 로그 스토어는 유지 |
| 인게임 대사는 **세션만** (AsyncStorage 없음) | `ingameDialogStore.ts` | 채팅은 별도 persist. narrative에 로그를 얹지 않음 |
| 금고 persist는 1.5s coalesce + hydrate 공유 Promise | `createFactionVaultStore.ts` | 채팅 persist/hydrate **동일 패턴** (fee 레이스 교훈) |
| 전투 텔레메트리는 읽기에서 `slice(-MAX)` | `combatMatchTelemetryStore.ts` | 채팅 hydrate/restore도 **디스크가 커도** 40으로 자름 |

### 11-2. 누적 — 캡이 빠지는 구멍

| 구멍 | 왜 위험한가 | 가드 |
|------|-------------|------|
| append만 하고 hydrate에서 slice 안 함 | 옛 버그/수동 편집으로 1000건이 디스크에 있으면 메모리·JSON이 커짐 | 읽기·쓰기·복구 **3곳** 모두 40 FIFO |
| `lastFired`를 트리거마다 무한 push | 퀘스트/전투 id가 늘면 persist가 커짐 | 16캡 FIFO |
| 오프너를 캡 밖에 둠 | 자동 오픈이 로그를 잠식 | 시스템 줄도 40에 포함 |
| 월드 요약을 persist | 오픈마다 커지는 dump | 저장은 `messages` + `lastFired` + 스칼라 메타만 |
| 키 입력마다 `JSON.stringify` | GC 톱니 · PSS floor | 전송 성공 후 coalesce |
| overlay `overlaySeq` | 프로세스 동안만 증가. persist 아님 | 무시. 채팅 id는 스토어 쪽 bounded |

### 11-3. 채팅기록 데이터 — 등록 4곳 (구현 시 누락 = 잔존/복구 실패)

지금 `arcfire_arc_core_chat_v1`는 **키가 없다**. 구현 때 아래를 **한 세트로** 넣는다.

| # | 위치 | 빠지면 |
|---|------|--------|
| 1 | `src/store/arcCoreChatStore.ts` `reset*` | 메모리만 남음 |
| 2 | `purgeLocalAccountData` | 계정 초기화 후 이전 대화 잔존 |
| 3 | `PLAYER_GAME_SAVE_BACKUP_KEYS` | 세이브에 로그 없음 / 복구 시 키 미삭제 |
| 4 | `reloadAllLocalGameSaveStores` | AsyncStorage만 복구되고 **화면 메모리는 옛 로그** |

추가로: schemaVersion · role 화이트리스트(`user`/`arc`/`system`) · 500자 절단 · 깨진 JSON → `{ messages: [], lastFired: [] }` · 클라우드 리스너 없음 · 섀도우 닉네임 저장 금지.

부트: 타이틀/`continueSessionPrewarm`에서 hydrate **금지**. 채널 오픈 또는 허브 안착 후 1회.

용량: 40×500자 ≈ 20KB + 메타. game-save slim에서 자르지 않는다(이미 bounded).

### 11-4. 재확인 결과 (2026-08-14)

체크리스트 `kim-team-lead-ready-arc-core-backchannel-post-review-full-audit.md` — M1~M8 · A1~A8 · D1~D9 **전부 PASS**(설계 계약).  
채팅 스토어는 아직 없으므로 D1~D4는 **구현 시 한 세트 등록**이 합격 조건이다.

구현 지시 후에만 `src/` 착수.

---

**END** — `docs/ARC_CORE_BACKCHANNEL_AND_HUB_TALK_ROSTER.md` v0.5
