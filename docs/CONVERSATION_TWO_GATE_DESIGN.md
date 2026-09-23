# 대화 2게이트 — 통신(1) → 메신저(2)

> **문서 버전**: v1.0  
> **작성**: 2026-09-12 · 김팀장  
> **상태**: **개발설계 정본 · 기반 반영**  
> **지시**: 인앱 대사창은 최초 연락 **통신(1차 게이트)**. 아크코어 자연어 창은 **메신저(2차 게이트)**. 전 앱을 「연락받고 → 메신저로 대화」로 통일. NL 없는 NPC는 1차만(플레이어는 선택 응답).  
> **충돌 시 우선**: 본 문서(게이트 순서) > 허브 명단이 메신저를 바로 연다는 구문 · inbound `showArcAlert` 구문  
> **유지**: `presentArcCoreBackchannel` = 메신저 유일 입구 · `presentIngameDialogScene`/`presentAdHocIngameDialog` = 통신 유일 셸 · 채널 1개 · 입≠몸 · ZERO_BILL · PSS §0-A · Table-First  
> **교차**: `docs/대화형_아크코어_구현.md` · `docs/ARC_CORE_BACKCHANNEL_AND_HUB_TALK_ROSTER.md` · `docs/ARC_CORE_DUAL_MOUTH_OPERATOR_DESIGN.md` · `.cursor/rules/arcfire-ingame-dialog-ui-default.mdc`

```text
[pss-pre-dev] hot_path=통신 오픈 1 · 수락/다음 1 · 메신저 present 1 · 전송 1
[pss-pre-dev] alloc=adhoc/csv 세션 1 · 게이트 동시 스택 없음 · persist 추가 없음
[pss-pre-dev] stage=루트 ArcOverlayHost · 게이트1 dismiss 후에만 게이트2
[pss-pre-dev] verdict=PASS — 창 복제·턴당 LLM 2홉·레이아웃 상수 변경 없으면 착수 가능
```

---

## 0. 한 줄

모든 대화 프로세스는 **통신으로 연락**한 뒤, NL 입이 있을 때만 **메신저로 이어 말한다.**  
1차와 2차는 다른 앱이 아니라 **같은 연락의 두 단계**다.

---

## 1. 게이트

| 게이트 | 세계관 | UI 셸 | 공개 API | 플레이어 |
|--------|--------|-------|----------|----------|
| **0. 명단** | 누구에게 연락할지 | `hubTalkRoster` | `presentPlanetHubTalkRoster` | 행 선택. **게이트 아님** |
| **1. 통신** | 최초 메시지·템플릿 | `NarrativeDialogRow` / `IngameDialogHost` | `presentIngameDialogScene` · `presentAdHocIngameDialog` · `presentNlMouthComm` | `[ 다음 ]` 또는 `[ 수락 ]`/`[ 취소 ]` |
| **2. 메신저** | 자연어 주고받기 | `ArcCoreChatOverlayContent` | **`presentArcCoreBackchannel`만** | 입력·전송 |

잠금:

- 게이트 1과 2를 **동시에 스택하지 않는다.** (`presentArcCoreBackchannel`은 `isIngameDialogActive()`면 false)
- 게이트 2를 연 뒤 게이트 1을 다시 얹지 않는다.
- 메신저 입구를 화면마다 복제하지 않는다.
- `NarrativeDialogRow` 레이아웃 상수·빗살 헤더는 바꾸지 않는다.
- gifted-chat · 화면 전용 Modal · 두 번째 `present*Backchannel` 금지.

---

## 2. 대상별 프로세스 (전 앱 통일)

```text
[대화] 명단
  ├─ NPC (NL 없음)     → 1차 통신(선택) → 끝
  └─ NL 입 (아크코어 · 이후 오퍼레이터)
                         → 1차 통신(연결/수락) → 2차 메신저

inbound (선제 연락)     → 1차 통신 [수락]/[취소] → 수락 시만 2차
combat_end              → 1차 오퍼레이터 통신 → (웨이브 결과) → 2차
first_scan (A1 뒤)      → 1차 스텔라 안내 → dismiss 후 2차 스텔라 NL 1~2턴
튜토리얼·스토리·반란안내 → 1차만 (강제 스크립트 · first_scan만 예외)
boot-chat-first         → 예외: 타이틀에서 2차만 (플래그 OFF · 타이틀≠인게임 통신)
```

| 경로 | 1차 | 2차 | 비고 |
|------|-----|-----|------|
| 허브 NPC | CSV 씬 | 없음 | 기존. 선택/수락은 씬 정책 |
| 허브 아크코어 행 | `presentNlMouthComm` | `manual` | 명단에서 메신저 직행 **금지** |
| inbound | `presentNlMouthComm` 수락형 | `inbound_request` | compact Alert **금지** |
| 웨이브 종료 | `ingame_dialog_wave_defense_end` | `combat_end` | 이미 맞음. 통신을 한 번 더 끼우지 않음 |
| 첫 스캔 A1 | `ingame_dialog_scan_main_quest` | `first_scan` | A1 dismiss 후 스텔라 opener. 통신과 스택 금지 |
| 스파이·반란 오퍼레이터 | 1차만 | 없음 | NL 입 승격 전 |
| 바 후원 등 ad-hoc | 1차만 | 없음 | NL 아니면 메신저 열지 않음 |
| `session_start` 타이틀 | 생략 | 실험 플래그 | 타이틀 버튼에 통신 대기 금지 |

이중 입(설계): 일상 기본 입은 오퍼레이터(스텔라·동료), inbound/combat_end/GM은 본체(근원체·적의 입). **입만 갈린다.** 게이트 순서는 같다. 정본 `docs/ARC_CORE_DUAL_MOUTH_OPERATOR_DESIGN.md` v0.4.

---

## 3. 전앱 범용구조 정합

이미 맞는 것:

- NPC·튜토리얼·퀘스트 수락 = 통신 셸 단일
- `combat_end` = 통신 후 메신저
- 메신저 API 1개 · 오버레이 호스트 1개
- 통신 중 메신저 오픈 거부

어긋나 기반에서 고친 것:

| 어긋남 | 조치 |
|--------|------|
| 허브 아크코어 행이 메신저 직행 | 통신 → `[ 확인 ]` → 메신저 |
| inbound가 compact `showArcAlert` | 통신 수락/취소 → 메신저 |
| 「대사창과 채팅은 영구 분리 축」 | **단계 분리**로 개정. 축 분리가 아님 |

의도적으로 안 건드린 것:

- 웨이브 결과 오버레이(통신과 메신저 사이 전술 정산)
- boot-chat-first (타이틀 예외)
- 오퍼레이터 NL 화자 persist — **D1–D5 실기** (`docs/ARC_CORE_DUAL_MOUTH_OPERATOR_DESIGN.md`). D6 스킵
- 통신 CSV 씬화 (이후 Fable · `ingame_dialog_nl_comm_*`)

---

## 4. 코드 정본

| 역할 | 경로 |
|------|------|
| 분류·스킵 규칙 | `src/game/conversation/conversationGateContract.ts` |
| NL 1차 통신 | `src/game/conversation/presentNlMouthComm.ts` |
| 1차 셸 | `src/game/ingameDialog/` |
| 2차 메신저 | `src/arcCore/chat/presentArcCoreBackchannel.ts` |
| 허브 분기 | `src/game/planetHubTalkRoster.ts` |
| inbound | `src/arcCore/chat/arcCoreInboundTalkRequest.ts` |

호출 규칙:

1. NL 입을 **플레이어가 고르거나** 세계가 **선제 연락**하면 먼저 `presentNlMouthComm`
2. 수락/`[ 확인 ]`의 `onAccept`에서만 `presentArcCoreBackchannel`
3. NPC는 기존 `presentIngameDialogScene` — 메신저 호출 금지
4. 이미 통신이 있으면 메신저를 열지 않음. 통신이 끝나면 `onDismiss`/`runAfterIngameDialogIdle`

---

## 5. 금지

1. 허브·inbound·이벤트에서 메신저 **직행** (combat_end · first_scan처럼 이미 1차가 있는 체인 제외)
2. inbound를 compact Alert로 되돌리기
3. 게이트 1+2 동시 스택
4. 메신저 창 2개 · 입구 2개
5. 턴당 클라우드 LLM 2홉
6. `NARRATIVE_DIALOG_LAYOUT` / 행성 메인 레이아웃 상수 변경
7. 타이틀 버튼에 통신·메신저 대기

---

## 6. 다음 (지시 후)

- Fable: NL 통신 첫 페이지를 `story_scenes` CSV로 승격
- D6 (선택): 튜토리얼 대사를 채팅 셸 스크립트 모드로 이전

**END** — 2026-09-12 · 김팀장
