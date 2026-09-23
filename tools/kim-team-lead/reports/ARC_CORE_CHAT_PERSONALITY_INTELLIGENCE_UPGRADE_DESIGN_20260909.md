# 아크코어 인격·지적능력·대화수준 고도화 보강 설계

```text
status=LOCKED_HUMAN_FIRST
task_id=arc-core-chat-personality-intelligence-upgrade-design-20260909
kind=DESIGN+LOCK
code_changes=YES (2026-09-09 재검수 — 일상 기본 / 시스템 위)
author=김팀장
date=2026-09-09
trigger=대표님 — 고도화는 시스템 연동 위에 일반 사람과의 자연스러운 일상대화를 기본으로 구축
canon=docs/대화형_아크코어_구현.md §0-H
```

## 0. 잠금 — 일상 대화가 기본, 시스템 연동은 그 위

대표님 재지시로 이 문서의 우선순위를 뒤집는다.

이전 초안은 「관측 스칼라를 넓히면 똑똑해 보인다」를 다음 단계의 앞줄에 두었다.  
그 순서는 틀렸다. **사람 말이 바닥이고, 시스템 읽기·시설 제안은 그 위에만 올라간다.**

| 층 | 정본 | 실패 예 |
|----|------|---------|
| **0 일상** | 인사·기분·잡담·열린 기타는 `react` · `nextAsk=''` · 로컬 `smalltalk` | 「오늘 기분이 어때」→ 전투/무역소 |
| **1 명시 질문** | 위치·스파이·전투·안전·공지·미션·채굴·일일·정체만 그 축 `react` | 「여기 어디야?」에 지난 `open_trade`를 `nextAsk`로 실음 |
| **1 정세** | 「요즘/무슨 일/별일/현황/정세」만 사람 말 **뒤**에 단서 하나 | 사람 문장을 채굴/일일/무역 템플릿으로 교체 |

경제 금고·가격·AABS·선단 수량·언락·점유·미션 수락/클리어는 계속 금지.  
도구를 늘리는 후속(아래 §3~§4)은 **이 잠금을 통과한 뒤에만** 검토한다.

정본 구현: `arcCoreChatCasualTalk.ts` · `arcCoreChatDialogueDrive.ts` · `localConversationalReplySpec.ts` · persona/purpose/mode/topic CSV · Lambda `pack.ts` Layer 0/1.

## 0-lock-2. 한 축 — 성인 남성 LLM + 지식 (2026-09-09 재점검)

대표님 재지시 후 결론: **0-H 가드만으로는 부족**하다. 기본축은 두 줄이 아니라 하나다.

1. **말** — LLM 일상 대화, 성인 남성 구어. 보통 사람과 말하는 기분.
2. **지식** — 아크코어 내부 관측·CSV 지식을 같은 목소리로 충분히 나눔.

가드는 유지한다(기분 질문에 무역소 금지). 다만 세계를 물으면 창구 한 줄이 아니라 **지식 대화**가 되어야 한다.

추가 토픽: `seats` · `cores` · `trade` · `shipyard`. 일상 팩에 `smalltalk` 지식 상시. 가격·금고·스탯 나열은 계속 금지.

---

## 0-old. 이전 결론 (이력)

**가능하다.** 정본 문서(`docs/대화형_아크코어_구현.md`)의 인격화 로드맵(§0-F H1~H6 + §0-G GM)은 이미 배에 붙어 있다. 다만 「재료를 넓히는 것」이 고도화의 1항이 되어서는 안 된다. 1항은 §0-H 일상 기본이다.

---

## 1. 재검수 — "인격화 로드맵"은 이미 전부 구현됨 (문서 vs 실제 코드)

`docs/대화형_아크코어_구현.md` §0-F를 그대로 받아쓰지 않고 직접 코드를 열어 하나씩 대조했다.

| 항목 | 문서상 표기 | 실제 코드 확인 결과 |
|------|-------------|----------------------|
| H1 (일화 태그) | "2026-08-21 기반 장착" | **AGREE·구현됨** — `arcCoreChatMemoryTags.ts`(`#tags 좋아:… 사건:…` 파서·포매터) + `arcCoreChatRollingSummary.ts`에서 실사용 |
| H2 (구어체 톤 고정) | "H2 `kind=tone` 신규 행" | **AGREE·구현됨** — `arc_core_chat_persona.csv`에 `persona_tone,8,tone,…` 행 실재 |
| H3 (문장 분할 타이핑) | "완성 회신을 문장 ≤4로" | **AGREE·구현됨** — `ArcCoreChatOverlayContent.tsx`가 `splitArcCoreChatReplyTurns`(`chunkEndOffsets`/`delayMsForChatTurnChunk`) 사용 |
| H4 (DND) | "시간대 DND는 신규 작은 persist" | **AGREE·구현됨** — `arcCoreInboundTalkDnd.ts`(기본 off) + 유닛테스트 + `arcCoreInboundTalkRequest.ts`에서 실사용 |
| H5 (선호 키 추출) | "명시 문장만 정규식" | **AGREE·구현됨** — `arcCoreChatMemoryTags.ts`의 `extractArcCoreChatPreferenceTags`(「좋아/싫어」 정규식) + rollingSummary 경로에 연결 |
| H6 (뉘앙스 힌트) | "팩 선택 필드 `nuanceHint`" | **AGREE·구현됨** — `arcCoreAgentPack.ts`가 `hintArcCoreChatNuance(turn.userText)`를 팩에 실음 |
| §0-G GM(줄기 조종) | "미션 스토어 동기 read" | **AGREE·구현됨** — `arcCoreChatGmBeat.ts` + `arc_core_chat_gm_beats.csv`(5행) 실사용 |

**결론**: 이 로드맵은 "다음에 열 것"이 아니라 "이미 열려서 가동 중인 것"이다. 문서의 상태 표기가 실제보다 뒤처져 있다 — 별도 후속 정리 대상이지만, 이번 지시(설계만)의 범위는 아니므로 이 문서에 기록만 해둔다.

---

## 2. 지금 아크코어의 "지적 능력" 총 재고 (실측)

말할 수 있는 재료를 CSV 단위로 전수 확인했다.

| 축 | 파일 | 행 수 | 내용 |
|----|------|-------|------|
| 정체성(persona) | `arc_core_chat_persona.csv` | 8 | identity·temperament·office·purpose·style·forbid·output·**tone** |
| 지식(knowledge) | `arc_core_chat_knowledge.csv` | 8 | 정체·입≠몸·허브·공지·미션·스토리·섀도우 침묵 |
| 주제(topics) | `arc_core_chat_topics.csv` | 10 | refuse·location·safety·spy·combat·notice·mission·self·greet·story·other |
| 목적(purposes) | `arc_core_chat_purposes.csv` | 7 | keep_mouth_body·surface_alert·name_self·anchor_location·close_combat·invite_axis·guide_story |
| 화법(modes) | `arc_core_chat_modes.csv` | 4 | react·lead·clue·hold |
| GM 비트 | `arc_core_chat_gm_beats.csv` | 5 | tutorial·main_story·quest·story_offer·idle — **스토리 계열뿐** |
| 읽기 도구 | `arcCoreChatReadTools.ts` `ALLOWED_TOOLS` | 7 | get_location·get_callsign·get_spy_alert·get_last_combat·get_planet_cores·get_latest_notice·get_active_mission |

**관찰**: topics·purposes·GM 비트가 전부 "위치/전투/스파이/미션·스토리" 축에 몰려 있다. **경제·외교·팩션·은하 정세 축은 하나도 없다.** 그래서 유저가 "요즘 경제 어때", "다른 국가랑 사이는 어때" 같은 질문을 하면 무조건 `other`(관측 없음)로 떨어진다 — 창구가 좁은 게 아니라 **그 시스템 자체가 아크코어의 시야에 아예 없다.**

---

## 3. 왜 "게임의 모든 시스템과 대화"가 지금은 막혀 있는가

`arcCoreAgentPack.ts:1` 자신의 주석: **"전 행성/프로필/금고 금지."** 이건 실수가 아니라 명시적 헌법(L8: "1차 도구는 위치·호칭·스파이·최근 전투 1건·현재 행성 코어 5값·공지 1건·지식 ≤4"만)이다. `§6`의 ContextPack 화이트리스트가 명시적으로 **넣지 않는다**고 못박은 것:

> 프로필 전체, 인벤, 함선 스냅샷, 금고, 전 행성 코어, 텔레메트리 80건, Observation 버퍼, 섀도우 닉/기함(리빌 전), 명령버스 상태

이 경계는 **바꿀 이유가 없다** — 환각 방지(관측 없는 걸 지어내지 않게 함), 몰입 보호(리빌 전 스포일러 차단), 메모리·PSS(전 행성 루프 금지) 세 가지를 동시에 지키는 설계다. 그래서 이번 설계도 이 경계 **안에서** 확장한다 — 경계를 없애자는 게 아니라, 경계 안에 있는데 아직 안 쓴 시스템을 찾는 것이다.

### 3-1. 직접 확인한 시스템별 노출 가능성 (Explore 서브에이전트 전수 조사로 보강·1차 자체조사 오류 정정)

> 1차 자체조사에서 "선단/함선 보유"·"캡틴 관계도" 시스템이 **없다**고 적었는데, 이는 틀렸다. Explore 서브에이전트가 전 저장소를 다시 훑어 실제로 존재함을 확인했다 — 아래 표는 정정된 결과다. **확인 없이 있다/없다고 가정하지 않는다**는 원칙을 스스로도 어겨서 처음엔 틀렸고, 재검수로 바로잡았다.

| 시스템 | 실제 소스 | 지금 아크코어에 보이나 | 안전하게 노출 가능한 형태 |
|--------|-----------|------------------------|---------------------------|
| 경제(금고) | `src/store/factionVault/{arcCoreVaultStore,blueTeamSharedVaultStore,neutralNationVaultStore,playerIndependentNationVaultStore}.ts` · `player.credits`/`player.gems`(`playerStore.ts`) | **아니오 — 금지 유지 대상** | 잔액·숫자는 절대 금지(L8/§6). 정성적 등급("여유/빠듯")조차 리스크가 커 **비권장 — 통째로 스킵**하는 게 안전. 소유/통제 라벨은 아래 팩션 축에서 다룸 |
| 팩션/외교/영토 | `src/arcCore/territorial/factionPoliticalRelations.ts`(진영 간 우호/적대/중립 고정 관계) · `Planet.factionId`(`src/types/index.ts`) · `player.political`(`megaFactionId`·`clanId`·`captainStandings`, `playerStore.ts`) · `territorialCombatGraph.ts`/`territorialCombatCampaign.ts` | **아니오** | 신규 `get_planet_faction` — **현재 행성**을 쥔 진영 + 그 진영과 플레이어 소속 진영의 관계(우호/적대/중립) 한 줄. 다른 행성·전체 정치 지도 금지 |
| 은하 지도/이동 | `src/store/worldStore.ts`(`systems`·`selectedSystemId`·`unlockedSystemIds`·`synthColonizationPhaseByPlanetId`) · `StarSystem.connections`/`enemyLevel`(`src/types/index.ts`) | **부분적** — 현재 행성 id/명만(`get_location`), 연결 항로·해금 상태·식민 단계는 미노출 | 신규 `get_travel_status`(정박/항해 중 + 목적지명만, 좌표·전체 그래프 금지) + `get_planet_tier_label`을 식민화 phase(0~3)로 구체화 가능(§4-1 갱신) |
| 선술집/후원 | `src/store/barPatronageStore.ts`(`activeSession`·종업원별 인기도·`totalPatronageSpendCredits`·최대 200건 원장) | **아니오** | 신규 knowledge 카드(세계관 한 줄: "이 행성에 후원 문화가 있다") 정도만. **개인 후원 지출액·특정 종업원 인기도·원장은 §6 "인벤/프로필" 급이라 금지** |
| 선단/함선 | **정정** — `player.ship`(현재 탑승 함선) + `player.shipHangar: PlayerHangarShip[]`(보유 함선 배열), `playerStore.ts` 실재 확인 | **아니오** | 신규 `get_fleet_summary` — "지금 [함선 계열] 탑승 중, 격납고에 N척 더 있음" **개수·계열명만**. 격납고 전체 목록·개별 함선 스탯 나열은 §6 "함선 스냅샷" 금지 그대로 |
| 캡틴/NPC 관계 | **정정** — `src/store/npcCaptainProgressStore.ts`(캡틴별 레벨/경험치/전적) + `player.political.captainStandings`(외교적 호감도), `playerStore.ts` 실재 확인 | **아니오** | 신규 `get_captain_standing` — 지금 대화 맥락에 관련된 캡틴 1명과의 호감도(우호/중립/적대)만. 전적 수치·전 캡틴 목록 금지 |
| 미션/퀘스트(활성 외) | `src/store/missionStore.ts`(`progresses` 완료 이력) · `src/store/arcCoreInstanceMissionBoardStore.ts`(행성별 게시판) | **아니오** — `get_active_mission`만 있음 | 신규 `get_mission_board_summary` — "완료 N건 · 이 행성에 신규 의뢰 M건" **개수만**, 의뢰 내용 나열 금지 |
| 전투 태세/위협도 | `src/store/battleStanceStore.ts`(`activeStance` 공격/방어/중립) · `StarSystem.enemyLevel` | **아니오** | 신규 `get_battle_stance` — 지금 태세 한 단어. `enemyLevel`은 "현재 행성만" 규칙 적용해 노출 여부 재검토(다른 시스템 위협도 비교는 금지) |
| 위협/경보 | `getPendingArcCoreSpyIntelAlert`(이미 도구) | **이미 있음** | 확장 불필요 |
| 식민화/개발 단계 | `usePlanetCoreRuntimeStore`(R,P,D,T,E, 이미 `get_planet_cores`) + `worldStore.synthColonizationPhaseByPlanetId` | **부분적**(5값은 있음, phase 라벨은 없음) | `get_planet_tier_label`을 실제 `synthColonizationPhaseByPlanetId`(0~3)에 매핑해 라벨화 — §4-1 갱신 |
| 플레이어 정체성 | `playerStore.ts`/`Player`(`level`·`exp`·`pilotProfile.professionId`) — **`rank`/`title` 필드는 `Player`엔 없음**(NPC 캡틴 타입에만 있음, 착각 주의) | **부분적**(닉네임만 `get_callsign`) | 신규 `get_pilot_profile` — 레벨·직업(profession)만. 경험치 수치·스킬포인트는 §6 "프로필 전체" 급이라 금지 |

**정정 요약**: 함선 보유·캡틴 관계는 실제로 존재하는 시스템이다 — 1차 조사에서 "없다"고 한 건 탐색 범위가 부족했던 내 오류였고, Explore 서브에이전트의 전수 재조사로 바로잡았다. 반대로 경제(금고)는 시스템은 있지만 **의도적으로 계속 막아야 하는 축**이라는 판단은 그대로다.

---

## 4. 설계안 — 신규 읽기 도구·지식·GM 확장 (전부 읽기 전용)

### 4-1. 신규 read-tool 후보 (§3-1 정정 반영 · 기존 7개 패턴과 동일 규칙 — 스칼라만, 현재 행성/현재 세션 한정)

| id | 데이터 소스 | 반환 형태(예) | 비고 |
|----|-------------|----------------|------|
| `get_planet_faction` | `factionPoliticalRelations.ts` + `Planet.factionId` + `player.political.megaFactionId` | `{ planetId, factionLabel, relation: 'ally'\|'hostile'\|'neutral' }` | 다른 행성 소속·전체 정치 지도 금지 — 지금 행성만 |
| `get_travel_status` | `worldStore.ts`(`selectedSystemId` 등) | `{ inTransit: boolean, destinationLabel: string\|null }` | 좌표·항로 그래프·전체 unlockedSystemIds 목록 금지 |
| `get_planet_tier_label` | `worldStore.synthColonizationPhaseByPlanetId` | `{ tierLabel: '초기'\|'성장'\|'번성'\|'완숙' }`(phase 0~3 매핑) | 원 phase 숫자 대신 라벨만 — `get_planet_cores`와 동일 원칙 |
| `get_fleet_summary` | `player.ship` + `player.shipHangar`(`playerStore.ts`) | `{ activeShipLabel, hangarCount: number }` | 격납고 **개수만**. 목록·개별 스탯 나열 금지(§6 "함선 스냅샷") |
| `get_captain_standing` | `player.political.captainStandings`(`playerStore.ts`) | `{ captainLabel, standing: 'friendly'\|'neutral'\|'hostile' }` | 대화에 언급된/관련된 캡틴 1명만. 전 캡틴 목록·전적 수치 금지 |
| `get_mission_board_summary` | `missionStore.progresses`(완료 수) + `arcCoreInstanceMissionBoardStore`(행성별 게시판) | `{ completedCount: number, boardCount: number }` | **개수만**, 의뢰 내용·제목 나열 금지(`get_active_mission`은 표시명 1개까지만 이미 허용) |
| `get_battle_stance` | `battleStanceStore.activeStance` | `{ stance: 'aggressive'\|'defensive'\|'neutral' }` | 플레이어 자신의 현재 태세만. 다른 시스템 `enemyLevel` 비교는 금지 |
| `get_pilot_profile` | `playerStore.ts`(`level`·`pilotProfile.professionId`) | `{ level: number, profession: string }` | 경험치·스킬포인트 수치는 §6 "프로필 전체" 급이라 금지 |

**8개 후보 모두 ≤4 tools/turn 캡을 넘지 않도록**, 토픽 힌트 라우팅(§4-2)으로 "물었을 때만" 실행 — 지금 7개도 매 턴 전부 도는 게 아니라 topic이 힌트한 것만 도는 구조(`arcCoreChatReadTools.ts:144` `names.length>0?requested:['get_location']`)와 동일 원칙. 다만 **전체 화이트리스트가 7→15개로 거의 두 배가 되므로**, §4-2의 topic↔purpose 매핑 표(`arcCoreChatDialogueDrive.ts`)도 그만큼 늘어난다 — 한 번에 8개를 다 여는 것보다 §7 우선순위대로 2~3개씩 단계적으로 여는 걸 권장.

### 4-2. topics.csv·purposes.csv 확장 (기계적 패턴 — §2 표와 동일 컬럼)

새 topic 2개: `faction`(팩션/소속/누구 땅), `travel`(이동/항해 중). 각각 `hintTools`에 위 신규 도구 연결. `arcCoreChatDialogueDrive.ts`의 `ASKED_TOPICS`·`askedTopic`·`purposeForAsked`에 두 topic을 추가해야 실제로 라우팅된다(지금 구조상 topics.csv에만 추가하고 이 표를 안 고치면 도구가 안 불림 — §7-2 이 부분은 **CSV뿐 아니라 이 TS 매핑도 같이** 바꿔야 하는 유일한 예외 지점).

### 4-3. GM 비트 확장 — 지금 "스토리만"인 GM을 다른 정세로

`arc_core_chat_gm_beats.csv`의 `when` 축(지금 `tutorial_active`/`story_active`/`quest_active`/`story_available`/`idle`)에 신규 `when` 값을 추가할 수 있는 여지가 구조적으로 있다 — 예: `faction_tension_high`(현재 행성 소속 국가가 최근 바뀜/분쟁 중이면), `economy_milestone`(세계 금고 총액이 아니라 "일일 배치가 방금 돌았다" 같은 **이벤트성** 한 줄, 숫자 아님). 이건 §0-G의 "GM은 줄기만 이끈다, 수락·집행은 몸" 원칙을 경제/외교 영역까지 넓히는 것 — **가장 "사고 수준이 높아 보이는" 효과가 크면서도 위험이 가장 낮은 확장**이다(숫자·잔액이 아니라 "지금 세계에 이런 흐름이 있다"는 서사적 한 줄이라 §6 화이트리스트를 안 건드림).

---

## 5. "지적 능력" 자체를 높이는 별도 축 (도구 개수와 무관)

기존 문서 §0-A의 철학("상용 성능이 아니라 게임에서 비슷하게 느껴지는 선")을 유지하면서, 이미 클라우드 NL(Groq)이 붙어 있는 지금 시점엔 아래가 "사고 수준"에 실질적으로 기여한다:

1. **persona.csv 심화** — 지금 8행은 전부 "규칙"(하지 마라/이래야 한다)이다. "이 세계를 어떻게 보는가"에 대한 **관점 문장**(예: "12좌 하나가 늦어지면 그걸 세계의 리듬으로 느낀다") 몇 줄을 추가하면, 같은 규칙 안에서도 대사가 더 인격적으로 들린다. 신규 행 추가일 뿐 기존 7행 문구는 안 건드림(§7-2 H2 원칙 그대로 재사용).
2. **purposes.csv 세분화** — 지금 `invite_axis`(그 외 전부)가 사실상 catch-all이다. §4-2의 신규 topic이 늘수록 이 catch-all 비중이 줄고 "무엇을 물었을 때 무슇을 하려는가"가 더 세밀해진다 — 이게 인지적으로 "똑똑해 보이는" 가장 직접적인 지점이다.
3. **GM `when` 축 확장(§4-3)** — 대화가 "지금 이 순간의 세계"를 반영하면, 매턴 같은 축만 도는 느낌이 없어진다. 로드맵 문서가 이미 "매 턴 같은 브리핑 3줄 = 불합격"이라고 명시한 만큼, 이 축이 가장 크게 그 불합격 리스크를 줄인다.
4. **모델 파라미터(이미 진행 중)** — `max_completion_tokens 768`·`temperature 0.7`(라운드3~4 이후 김팀장 추가 조정분, 이미 배포됨)로 여유가 커졌다 — 이건 이미 된 것이므로 이 설계 범위 밖이지만, §4의 새 지식/도구가 늘어날수록 이 여유가 실제로 쓰일 데가 많아진다는 점만 짚어둔다.

---

## 6. 절대 하지 않을 것 (기존 L1-L11 + §6 화이트리스트 재확인)

이번 설계 전체가 지키는 하드 경계 — 새로 추가하는 것 없음, 전부 기존 규정 재확인:

| 금지 | 이유 |
|------|------|
| 금고 잔액·인벤토리·함선 스냅샷 수치 노출 | §6 화이트리스트 명시. 경제 시스템은 §3-1에서 "라벨(소속)"만, 숫자는 절대 아님 |
| 다른 행성/전체 은하 데이터 | L8 "현재 행성만". 신규 도구 3개 전부 이 규칙 준수 |
| 채팅이 크레딧·언락·배치·점유·팩션 소속을 직접 바꾸는 것 | L1 입≠몸. 신규 GM `when`도 전부 read-only 트리거일 뿐 |
| 리빌 전 섀도우 정보 | L4/L8. 미변경 |
| 온디바이스 LLM, 신규 클라우드 홉 추가 | L5/L9. 이 설계는 기존 1홉(F1) 그대로 사용 |
| 틱/부트/prewarm 경로에 신규 조회 삽입 | PSS. 전부 "전송 1회" 경로에만 삽입 |
| 벡터DB·임베딩·유사도 검색 | §0-F "겹치지 않게 기각" 재확인. 계속 CSV+정규식 힌트만 |

---

## 7. 실행 순서 제안 (지시 시, 우선순위순 — 이번엔 착수하지 않음)

| 순서 | 항목 | 리스크 | 효과 |
|------|------|--------|------|
| 1 | §4-3 GM `when` 확장(팩션 정세·일일배치 이벤트 한 줄) | 낮음 — 서사적 한 줄, 숫자 없음 | 큼 — "매 턴 같은 얘기"를 가장 크게 줄임 |
| 2 | §4-1 `get_planet_faction`(팩션 소속+관계 라벨) | 낮음 — 기존 `get_planet_cores`와 동일 스코프 규칙 재사용 | 중간 |
| 3 | §4-1 `get_fleet_summary`·`get_captain_standing`(개수/등급만) | 낮음~중간 — 개수·라벨만 노출하도록 반환 형태를 엄격히 제한해야 함(전체 목록 유출 리스크가 실제로 존재하는 시스템이라 더 주의) | 중간~큼 — "전략게임다운" 화제가 처음 생김 |
| 4 | §5-2 purposes.csv 세분화 | 낮음 — CSV 행 추가 + `arcCoreChatDialogueDrive.ts` 매핑 동시 수정 필요(주의점, §4-2) | 중간 |
| 5 | §4-1 `get_travel_status`·`get_planet_tier_label`(worldStore 연동) | 낮음~중간 | 중간 |
| 6 | §4-1 `get_mission_board_summary`·`get_battle_stance`·`get_pilot_profile` | 낮음 | 작지만 누적 |
| 7 | §5-1 persona.csv 관점 문장 추가 | 낮음 | 작지만 누적 |

---

## 8. PSS 선언 (이 설계가 실제 구현으로 넘어갈 때 적용될 기준)

```text
[pss-pre-dev] hot_path=전송 1회 그대로 — 신규 도구도 topic 힌트로만 실행, 틱/부트 삽입 없음
[pss-pre-dev] alloc=신규 도구 3개 각 소형 스칼라 1개, 기존 ≤4 캡 안에서 흡수 — 총 도구 슬롯 늘리지 않음
[pss-pre-dev] cache=신규 CSV는 기존 build:content-tables 인덱스 훅에 편입, 매 턴 find 금지 유지
[pss-pre-dev] verdict=PASS — 벡터DB·신규 클라우드 홉·전 행성 루프·write 도구 없으면 착수 가능
```

---

## 9. 결론

- 대표님 질문("게임의 모든 시스템을 파악해서 나와 대화할 수 있는 수준까지 높일 수 있는지") — **예, 상당히 넓게 가능하다.** 팩션/외교·영토, 은하 이동·식민화 단계, **함선 보유(격납고 개수)**, **캡틴 외교 관계**, 미션 게시판 규모, 전투 태세, 파일럿 레벨/직업까지 총 8개 신규 축을 안전하게(스칼라·개수·라벨만) 열 수 있다(§4-1). 유일하게 계속 막아야 하는 건 **경제(금고 잔액)** 한 축뿐이다 — 이건 능력 밖이 아니라 헌법상 의도적 금지(§6)다.
- **1차 조사 오류를 재검수로 정정**: 처음엔 "함선/캡틴 관계 시스템이 없다"고 잘못 판단했으나, Explore 서브에이전트 전수 재조사로 실제 존재를 확인하고 표를 다시 썼다(§3-1). 확인 없이 없다고 단정하지 않는다는 원칙을 스스로 어겼던 지점을 이 문서 안에서 바로잡았다.
- 이번 지시대로 **코드는 건드리지 않았다.** 위 §7 실행 순서는 제안이며, 착수는 대표님/김팀장 지시 후.

**END** — 2026-09-09 · 김클로드
