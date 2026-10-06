# 스텔라 아리스 고도화 — 코드 반영 가능성 · 김플레이 전담 가능성 전수 조사

> **작성**: 김플레이 · 2026-10-06 19:5x  
> **지시**: 대표님 — 「스텔라 아리스 고도화 작업은 봇플레이 작업수준보다 높다. 이 작업을 실제 코드에 반영할 수 있을지 김플레이가 담당해서 처음부터 끝까지 진행이 가능할지 전수 조사하라. 기존 개발내용들과 코드를 모두 확인해서 검토하라.」  
> **대상 설계**: `docs/playbot/STELLA_KNOWN_COLLEAGUE_DESIGN_v1.md` (v2 · Part A 조언 · Part B 관찰 · Part C 능동)  
> **코드 변경**: 없음. 측정용 임시 파일 1개는 실행 후 삭제.

---

## 0. 결론

| 질문 | 답 |
|------|----|
| 실제 코드에 반영할 수 있는가 | **가능.** 기존 구조가 받쳐 준다. 다만 설계 수정 3건과 기존 결함 1건 해결이 먼저다(§3) |
| 김플레이가 처음부터 끝까지 할 수 있는가 | **기술적으로는 가능. 지금 규칙으로는 불가.** 손댈 파일의 대부분이 김팀장·Fable 영역이고, 그중 일부는 김팀장이 지금 수정 중이다(§4). 대표님이 범위를 열어 주시고, 단계마다 김팀장 검수를 두면 가능하다 |
| 김플레이 혼자 못 하는 것 | 실기 확인(화면·타이밍·PSS 30분 idle)은 대표님 기기와 logcat 이 필요하다. 커밋은 김팀장 검수 후 |

---

## 1. 조사 범위와 기준선

| 항목 | 실측 |
|------|------|
| 대화·스텔라 코드 | `src/arcCore/chat/` 122파일 · 9,833줄 · 테스트 41파일 |
| 스텔라 라이프 | `stellaLife*` 19파일 (Resolve·Pack·Ask·Cognition·Digest·Snapshot·Memory·TableIndex…) |
| 라이프 선제 (§16) | **구현됨** — `bindStellaLifeAskToPlanetSession`(허브 진입 1회) → `resolveStellaHumanAsk` → `presentStellaLifeAskComm`(1차 통신 → 메신저 `operator_life`). 하루 1회 |
| 테스트 기준선 | 대화 테스트 **40/41 PASS**. 실패 1(`arcCoreChatGmBeat.test.ts`)은 react-native import 를 tsx 가 못 읽는 기존 한계(김팀장 2026-09-21 보류 기록과 동일) |
| 타입 | `npx tsc --noEmit -p tsconfig.client.json` **PASS** |
| git 이력 | 대화 코드는 일일 스냅샷 커밋 4개뿐 — 세부 변경 추적 불가. 검수 기록은 `tools/kim-team-lead/reports/*stella*` 4건 |
| 실기 검증 기록 | 라이프 선제(`operator_life`)의 **기기 실측 기록 없음**. 검수는 tsc·단위테스트까지 |
| 서버 | `aws/arc-core-chat/src/pack.ts` — Groq Free Lambda. 마지막 변경 2026-09-24 |

---

## 2. 설계 항목별 반영 가능성

### 2-1. Part B 관찰

| 항목 | 지금 코드 | 판정 |
|------|----------|------|
| 기존 10동사 방출 지점 | `emitPlayVerb` 10곳(missionStore 7·playerStore·combat·economy·annex·trade·mining·scan·talk·develop) | **그대로 재사용.** 함수 하나만 `recordPlayerAction` 으로 확장 |
| 신규 `destroy` | `src/game/playerSurvivalPod.ts` | 지점 명확. **김팀장 수정 중** |
| 신규 `repair` | `durabilityModel.ts` `repairActiveShipHull` | 지점 명확. **김팀장 수정 중** |
| 신규 `equip` | `app/(game)/shipyard.tsx` 화면 안 (`equipSlots` 29곳) | 화면 코드에 넣어야 함. 지점 정리 필요 |
| 신규 `land` | `playerStore` `currentPlanetId` 설정(695행) | 명확 |
| 신규 `level` | `playerStore.addExp`(998행) | 명확 |
| 신규 `session` | 이어하기 진입 · AppState | 명확 |
| 링 64칸 | 신규 모듈, 의존 0 | 문제 없음 |
| 하루 요약을 `life` 에 | `life` 상한 3,072B · 클램프 있음 | **설계 수정 필요** (§3-2) |
| 계정 초기화 | `resetArcCoreChatForAccountPurge` 가 life 를 지움 | 자동 포함 |

### 2-2. Part C 능동

| 항목 | 지금 코드 | 판정 |
|------|----------|------|
| 결정 순간·안전 슬롯·DND·튜토리얼·pending | `bindStellaLifeAskToPlanetSession` 에 이미 있음 | **같은 함수에 상황 판정 추가**로 끝남 |
| 선 질문 | `presentOperatorInboundFirstComm` → `presentArcCoreBackchannel` | 재사용. 이유 `operator_observe` 1개 추가 |
| 선 연락 (미읽음) | 대화 명단 `showInitiatedBadge` 가 이미 있음 (스텔라 줄은 항상 false) | **작은 수정** — 스텔라 줄에 켜기 |
| 말걸기 (비차단 한 줄) | 오버레이 종류 19개 중 **비차단 토스트 없음** | **신규 UI** — 오버레이 종류 추가 · `audit:ui-overlay` · 실기 확인. 가장 큰 UI 작업 |
| 근원체와 방해 예산 공유 | inbound 스케줄러 별도(`arcCoreInboundTalkSchedule`) · `hasInboundTalkPending` 확인만 있음 | 공동 시각 기록 1개 추가로 가능 |
| 상황 CSV | `build-arc-core-chat-tables.mjs` 에 stella 표 10개가 한 줄씩 등록 | 한 줄 추가로 가능 |
| 관찰 요약을 대화로 전달 | 아래 §3-1 | **설계 수정 필요** |

### 2-3. Part A 조언

| 항목 | 판정 |
|------|------|
| 읽기 도구 `get_play_advice` | 화이트리스트 + 주제 CSV `hintTools` 구조라 쉬움 |
| 무역소 진열 조회 | `resolveTradePortCatalogItemIds` 캐시 없음 → 물은 턴 1회만 호출이면 문제 없음 |
| 순수 판정기 + 봇 import | 봇이 이미 `src/data` 를 import 중. react-native 를 건드리지 않게 짜면 가능 (테스트 기준선 한계와 같은 이유) |
| 조언 품질 | **봇 품질(A-9·A-10)과 게임 G4–G7 반영이 먼저.** 이건 코드 가능성이 아니라 순서 문제 |

---

## 3. 착수 전에 고쳐야 할 것

### 3-1. [기존 결함] 스텔라의 하루가 언어모델에 전달되지 않음 — 김팀장 보고 대상

- 클라이언트 `arcCoreAgentPack.ts` 는 `lifeBlock`(스텔라 지금 하는 일·기분·어제 한 일·서사)을 만든다.
- **이 필드를 읽는 곳이 레포에 없다.** 서버 `aws/arc-core-chat/src/pack.ts` 의 검증·프롬프트에도 없고, 로컬 템플릿 응답(`localConversationalReplySpec.ts`)에도 없다.
- 결과: §3 라이프 슬롯·§15 숙련으로 만든 「스텔라의 하루」가 대화 문장에 실리지 않는다. 대표님이 말한 「자의식」의 재료 절반이 지금 끊겨 있다.
- 반면 **도구 결과(`toolResults`)는 서버가 프롬프트에 넣는다** (도구 4개 · 키 6개 · 값 80자).
- 같은 서버에서 지식 카드는 4장까지만 받는다(클라이언트는 최대 6장 보냄).
- **고치는 두 길**: (가) 라이프를 읽기 도구(`get_stella_now` 류)로 보냄 — 서버 재배포 불필요. (나) 서버 `pack.ts` 에 `lifeBlock` 추가 후 Lambda 재배포 — 배포 권한·절차가 대표님 쪽.

### 3-2. [설계 수정] 관찰 요약은 `life` 와 예산을 나눠야 함

측정(임시 스크립트, 실행 후 삭제):

| 경우 | `life` 직렬화 크기 |
|------|-------------------|
| 평소 (14일 요약·짧은 기억) | **2,147B** |
| 기억이 꽉 찬 계정 | **5,966B** → 지금도 3,072B 로 잘리는 중 |

관찰 512B 를 그냥 얹으면, 꽉 찬 계정에서 클램프가 **스텔라 자신의 기억(anchors→digests)을 먼저 지운다.** 수정: 관찰 요약은 자기 상한(≤512B)과 자기 클램프(notable→prevDays 순)를 따로 갖고, 기존 클램프 순서에 들어가지 않게 한다. 3,072 숫자는 바꾸지 않는다(기존값).

### 3-3. [설계 수정] 관찰을 대화로 보내는 통로

설계 v2 의 `observeBlock` 새 필드는 3-1 과 같은 이유로 서버에서 버려진다. **읽기 도구 `get_recent_activity`**(키 ≤6 · 값 ≤80자)로 바꾼다. 서버 재배포 없이 클라우드·로컬 응답 모두에 들어간다. 로컬 템플릿에는 `specFor…` 하나 추가.

### 3-4. [설계 수정] 순수 함수 경계

tsx 테스트가 react-native 를 못 읽는다(기준선 실패 1건과 같은 원인). 감지기·게이트·판정기·digest 변이는 **store·RN import 없는 모듈**로 두고, store 를 읽는 어댑터는 얇게 분리한다. 그래야 단위 테스트와 플레이봇 재생 검증이 둘 다 된다.

---

## 4. 김플레이 전담 가능성

### 4-1. 손대야 하는 파일과 지금 주인

| 영역 | 파일 (대표) | 지금 규칙상 주인 | 현재 상태 |
|------|------------|-----------------|-----------|
| 개발 로그 | `src/game/devPlayVerbLog.ts` + 기존 방출 10곳 | **김플레이** | 미커밋 수정 있음(김플레이 이전 작업) |
| 관찰 sink·digest | `src/game/playerObserve/*` (신규) | 김팀장 | — |
| 신규 방출 지점 | `playerSurvivalPod.ts` · `durabilityModel.ts` | 김팀장 | **김팀장 G6 작업으로 미커밋 수정 중** |
| 신규 방출 지점 | `playerStore.ts` · `app/(game)/shipyard.tsx` | 김팀장 | — |
| 대화·스텔라 | `src/arcCore/chat/*` (도구·트리거·바인드·팩·검역·로컬 응답) | 김팀장 (S1–S6 구현·검수 주인) | — |
| 화면 | `src/ui/overlay/*` 신규 종류 · `planetHubTalkRoster.ts` · `HubTalkRosterOverlayContent.tsx` | 김팀장 | — |
| 표 | `tables/content/stella_*.csv` 신규 · 채팅 CSV 신규 행 · 빌드 스크립트 1줄 | Fable | — |
| i18n | `ko.ts` · `en.ts` | 김팀장 | 미커밋 수정 있음 |
| 서버 (선택) | `aws/arc-core-chat/src/pack.ts` + 배포 | 김팀장 · 배포는 대표님 | — |
| 봇 검증 | `tools/play-bot-console/**` | **김플레이** | — |

규모 추정: 신규 15~20파일, 기존 수정 20~25파일, 테스트 포함 신규 코드 약 2,000~3,000줄. 현재 스텔라 라이프(19파일)와 비슷하거나 조금 크다.

### 4-2. 김플레이가 할 수 있는 것 / 막히는 것

| 구분 | 내용 |
|------|------|
| **할 수 있음** | 코드 읽기·설계·순수 로직·테스트·tsc·audit 실행 · 봇으로 빈도·조언 효과 검증 · CSV 초안 · 단계별 handoff |
| **규칙상 막힘** | `src/arcCore/chat` · `src/ui/overlay` · `playerStore` · `shipyard.tsx` · `tables/` 수정 — 김플레이 범위 밖 (AGENTS.md · 라우팅 규칙). 대표님 지시로 열 수 있음 |
| **충돌 위험** | 김팀장이 같은 시기에 `playerSurvivalPod` · `durabilityModel` · `missionStore` · i18n 을 고치는 중. 동시 수정하면 덮어쓰기 위험 |
| **물리적으로 막힘** | 기기 화면·타이밍·PSS 30분 idle·GL 실측 — 대표님 실기 + logcat 필요 |
| **업무 손실** | 김플레이 본업(A-9 함선 파괴, A-10, 1장 완료율)이 멈춤. Part A 조언 품질은 그 본업에 달려 있음 |

### 4-3. 전담하려면 필요한 조건

1. **범위 개방** — 대표님이 「스텔라 고도화에 한해 위 파일 수정 허용」을 지시.
2. **검수 게이트** — 김클로드 방식과 같이 단계마다 handoff `PENDING` → 김팀장 검수·커밋. 스텔라 라이프 정본 주인이 김팀장이기 때문.
3. **파일 잠금 약속** — `playerSurvivalPod` · `durabilityModel` 은 김팀장 G6 반영·커밋 뒤에만 손댐. i18n 은 키 추가만.
4. **표 정본** — CSV 는 김플레이 초안 → Fable(또는 김팀장) 반영. 기존 행 변경은 대표님 확인.
5. **실기** — O5(화면) 이후 단계마다 대표님 실기 1회 + logcat.

---

## 5. 권장 진행안

**1안 (권장) — 김플레이 주도 · 김팀장 검수.** 조건 §4-3 전부 충족 시.

| 순서 | 내용 | 비고 |
|------|------|------|
| 0 | §3-1 라이프 미전달 결함 — 김팀장에게 보고 (김플레이가 고치면 1에 포함) | 기존 기능 결함이라 가장 먼저 |
| 1 | O1·O2 관찰 입력 — `recordPlayerAction` · sink · digest(자기 예산) · 기존 10지점 + `land`·`level`·`session` | 화면 변화 0. 위험 가장 낮음 |
| 2 | O3 상황 감지기·게이트 + CSV 초안 + 픽스처 | 순수 함수만 |
| 3 | O4 봇 재생으로 빈도 검증 | 김플레이 본업 영역 |
| 4 | O5-a 선 질문 · O5-b 선 연락(명단 배지) | 기존 표면 재사용 |
| 5 | O6 `get_recent_activity` 도구 · 후속 · 수용도 | 서버 재배포 없음 |
| 6 | O5-c 말걸기 신규 오버레이 | 화면 시안 대표님 확인 후 |
| 7 | `destroy`·`repair`·`equip` 방출 | 김팀장 G6 커밋 뒤 |
| 8 | Part A 조언 | 봇 정합(K1) 뒤 |

**2안 — 분담.** 김플레이: 관찰 어휘·순수 로직·CSV 초안·봇 검증·픽스처. 김팀장: 대화 연결·화면·방출 지점. 충돌은 적지만 대표님이 원하신 「한 담당이 처음부터 끝까지」가 아니다.

---

## 6. 대표님 결정 필요

1. 1안(김플레이 주도 · 김팀장 검수)으로 갈지, 2안(분담)으로 갈지.
2. 1안이면 수정 범위 개방 지시 (§4-1 표의 파일).
3. §3-1 라이프 미전달 결함을 (가) 읽기 도구로 고칠지 (나) 서버 재배포로 고칠지 — 권장 (가).
4. 김플레이 본업(A-9 등)과 스텔라 작업의 우선순위.

### 6-1. 결정 (2026-10-06 · 대표님)

| 질문 | 결정 |
|---|---|
| 담당 | **1안** — 김플레이 주도, §4-1 범위 개방, 단계마다 김팀장 검수·커밋 |
| 라이프 미전달 | **(가)** 읽기 도구 `get_stella_now` — 서버 재배포 없음 |
| 우선순위 | **병행** — 관찰 입력(O1·O2) 먼저, 이어서 A-9 |

### 6-2. 진행

| 단계 | 상태 | 인계 |
|---|---|---|
| 0 라이프 전달 (`get_stella_now`) | 구현·테스트 완료 · 검수 대기 | `tools/kim-team-lead/reports/kim-play-handoff-stella-o1o2-20261006.md` |
| O1·O2 관찰 입력 | 구현·테스트 완료 · 검수 대기 | 같은 파일 |
| 추가 발견 — 허브 진입 라이프 선제가 대화창을 열기 전엔 판정 불가 | 같이 수정 · 검수 대기 | 같은 파일 §3 |

---

**END** — 김플레이 전수 조사 · §6-2 이후 진행 기록
