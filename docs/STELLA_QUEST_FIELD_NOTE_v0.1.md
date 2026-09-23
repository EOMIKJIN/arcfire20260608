# 스텔라 퀘스트 현장 메모 — 1안 (v0.1)

> **작성**: 2026-09-23 · 김팀장  
> **상태**: **개발설계 정본 · 기반 반영**  
> **지시**: 대표님 — 스텔라 아리스 에이전트 고도화. 동료·화자로 퀘스트 맥락을 돕는다. 3중 서사.  
> **충돌 시 우선**: 본 문서(현장 메모) > 이중 입 §4 구문「스토리/미션=근원체」  
> **유지**: 입≠몸 · 창 1개 · 턴당 LLM 1 · ZERO_BILL · Table-First · PSS §0-A · 대화로 퀘스트 신설 금지  
> **교차**: `docs/ARC_CORE_DUAL_MOUTH_OPERATOR_DESIGN.md` · `docs/CONVERSATION_TWO_GATE_DESIGN.md` · `docs/대화형_아크코어_구현.md` §0-G·§0-H · `.cursor/rules/arcfire-quest-detail-mission.mdc`

```text
[pss-pre-dev] hot_path=메신저 오픈 1 · 전송 1 · 함장 1차 종료 1
[pss-pre-dev] alloc=카드 1~3 · persist 신규 스토어 없음 · 세션 스칼라 1
[pss-pre-dev] stage=오버레이 · 틱/부트 hydrate 없음
[pss-pre-dev] verdict=PASS
```

---

## 0. 한 줄

하나의 퀘스트 서사 = **함장 대사(1차 고정)** + **스텔라가 아는 이야기(표)** + **플레이어 메신저(생성)**.  
큰 그림은 `missions.csv`·세부미션이 잠그고, 과정에서만 닫힌 카드로 가지가 난다.

## 1. 세 입

| 층 | 누가 | 정본 | 하지 않음 |
|---|---|---|---|
| **A** | 함장 | `story_dialog_{objectiveId}` 1차 | 해설·복선 설명 |
| **B** | 스텔라 | dossier / aside / captain_note → 팩 | 수락·클리어·창작·근원체 행세 |
| **C** | 플레이어 | 2차 메신저 NL | 결말 변경 |

| 물음 | 입 |
|---|---|
| 활성 의뢰·본편 세부·방금 함장이 말한 것 | **스텔라** |
| 정체·12좌·리빌·운명·근원체 | **근원체** |
| inbound / combat_end / GM 핵심 | **근원체** (유지) |
| 스텔라가 story를 **선제**로 물음 | **불가** (라이프 S6 유지) |

## 2. 표

| 파일 | 키 | 상한 |
|---|---|---|
| `stella_quest_dossier.csv` | `missionId` | 퀘스트당 1 · 팩 1 |
| `stella_quest_aside.csv` | `objectiveId` + `mentionHints` | 세부미션당 1~2 · 팩 1~2 |
| `stella_captain_note.csv` | `captainId` | 함장당 1 · 팩 0~1 |

턴당 **합 3장**. 문장 220자. 전 퀘스트 덤프 금지.  
세부미션 정본: 부모 1행 + 순차 목표. 카드를 미션 행으로 쪼개지 않음.

## 3. 런타임

- `pickStellaQuestFieldNoteCards` — 오퍼레이터 + 활성 퀘스트일 때만. Map O(1).
- `buildArcCoreAgentPack` — `knowledgeCards`에 앞장 주입. 총 6 이내.
- `get_active_mission` — `missionId` · `objectiveId` · 목표 한 줄 추가. write 없음.
- `stellaQuestTalkMemory` — 함장 1차 종료 씬만 세션 기억. persist 없음. purge/STAGE에 비움.
- 로컬 G3는 카드 `rawText` 우선. 클라우드 LIVE는 같은 팩.

## 4. 금지

대화로 퀘스트 생성·클리어 · LLM 설정 창작 · 창 2개 · 턴당 LLM 2 · 시계 선제 브리핑 · 기존 함장 대사 덮어쓰기 · `gender`/초상 변경.
