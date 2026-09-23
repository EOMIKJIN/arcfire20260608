# 본편 메인 퀘스트 — 필수 기반 (콘텐츠 미착수)

> **작성**: 2026-09-14 · 김팀장  
> **상태**: **기반 계약 · `story_001` 동결 · q02–q06 bind 반영(2026-09-23) · q07+ skeleton**  
> **선행**: `docs/EARLY_STORY_AND_QUEST_SPINE.md` v1.5 · `docs/MAIN_STORY_CHAPTER_SPINE.md`  
> **전투레벨 전수 (2026-09-17)**: `docs/PLAY_SCENARIO_COMBAT_LEVEL_ADVANCEMENT.md` — 본편 bind 전에 존 TCL과 맞출 것.  
> **작성칸**: `docs/MAIN_QUEST_WRITE_TEMPLATE.md` (나중에 채움)

```text
[pss-pre-dev] hot_path=HUD 행 1회 조회 · 궤도 루프 boolean 1회
[pss-pre-dev] alloc=없음 · persist 신규 키 없음 · 틱/setInterval 없음
[pss-pre-dev] cache=기존 mainStoryCatalog · planetMemo 궤도 키 유지
[pss-pre-dev] stage=STAGE 1 HUD/궤도만 · dispose 추가 없음
[pss-pre-dev] verdict=PASS
```

---

## 0. 한 줄

기반 계약은 유지한다. **q02–q06**은 2026-09-23 대표님 지시로 기존 21성계에 bind했다.  
`story_001` 제목·보상·5목표 **동결**. q07+·신규 행성(그리하벤·세렌) **추가 금지**.

---

## 1. 잠긴 결정 (구현이 따른다)

| 항목 | 잠금 |
|------|------|
| 이름 있는 본편 1개 | **세부 미션 5~10 순차**. 라이브 평균 = `story_001` 목표 5개 |
| 총량 | **약 10개 선개발 후 클리어 시간 실측**. 12·340은 목표가 아님. 골격 340칸은 용량만 |
| 챕터 슬롯 | `story_cXX_q01`…`q30`만. **`q31`–`q36` 없음**. 클로저 = `q30` |
| `story_001` | 제목·보상·목표 5개 **동결** |
| 없는 플레이 | 새 overlay/경제/함대 엔진 금지. **`talk_npc` + 마지막 페이지 `actionLabel` 동사** |
| 없는 함장 | **퀘스트 전용 `questOnly=TRUE`**. q02–q06 3행(노아·코발·소사) 등록 완료. q07+ 추가 시 동일 규칙 |
| 행성 | 없는 지명(그리하벤 등) **지금 추가 금지** |
| 온보딩 | 렌/미아/카일 ≠ 이후 퀘스트 함장 동명 |

---

## 2. 이번 기반이 연 것

| 기반 | 위치 | 하는 일 |
|------|------|---------|
| 인증 버튼 | `story_scene_pages.actionLabel` / `actionLabel_en` | 마지막 페이지 동사. 비면 `[ 확인 ]`. 수락/취소가 있으면 수락이 이김 |
| 연퀘 오퍼 | `firstIncompleteReadyBindMissionId` | **완료된 bind는 건너뜀**. 스텝2가 안 뜨던 구멍 차단 |
| 세부 커서 | `resolveMainQuestDetailCursor` → QuestHUD | 본편만 `2/5` 접두. 행 높이·레이아웃 상수 **불변** |
| 퀘스트 전용 함장 | `npc_ai_captains.questOnly` | `TRUE`면 궤도·수송·주둔·AABS 재배치 제외. 전함 없어도 됨. **q02–q06: 노아·코발·소사 등록** |

생성: `node tools/content-tables/build-content-from-csv.mjs`  
(전량 `npm run build:content-tables` 금지 — 무기 TTK·ownership sync 부작용)

---

## 3. 일부러 안 한 것

- `planets.csv` 신규 행성 (그리하벤·세렌 벨트 등)
- `story_c01_q07`…`q30` `ready` 전환 · q07+ 본문 미션 생성
- 새 `MissionObjective.type` · 새 overlay kind
- `story_001` 제목·보상·5목표 변경
- 전량 `npm run build:content-tables` (무기 TTK 부작용) — 콘텐츠는 `build-content-from-csv.mjs`만

---

## 4. 나중에 콘텐츠를 넣을 때

1. 작성칸(`MAIN_QUEST_WRITE_TEMPLATE`) 또는 확정 시나리오만 bind.  
2. 본편 1개 = `main_story_quests` 1슬롯 + `missions` 1행(또는 연퀘 스텝 N) + 목표 5~10 + 1차 대사 씬.  
3. 없는 함장 = `questOnly=TRUE`, `assignedShipId` 비움, `talk_npc.targetId`만. 궤도에 올리지 않음.  
4. 없는 시스템 = `talk_npc` 씬 마지막 `actionLabel` 동사.  
5. 있는 행성 이동 = 실기 `reach_planet`. 있는 행성 전투 = 실기 `defeat_enemy`.  
6. `story_001` 문구/보상/5목표는 건드리지 않음.  
7. 챕터1 클로저는 `q30`. `q31`+ 만들지 않음.

---

## 5. 라이브 앵커 (변경 금지)

- 미션: `story_001` 「동기가 확인되지 않는 살인사건」
- 골격: `story_c01_q01` ready · 연퀘 1스텝 `story_c01_q01_s01`
- 목표 순차: 솔라 도착 → 한로 대화 → 아르카디아 귀환 → 엘렌 대화 → 이사 벤트 대화
- 씬: `story_dialog_story_001` · `story_dialog_obj_story_001_b|d|e`
- 목표 a·c는 도착만 (대사 없음)

---

## 6. q02–q06 라이브 bind (2026-09-23)

| 슬롯 | bind | 행성(planet id) | TCL | 비고 |
|------|------|-----------------|----:|------|
| q02 | `story_002` | `minerva_deep` | 7 | 솔라 경유 2홉 · fighter 1 |
| q03 | `story_003` | `arcadia_prime`→`vega_base` | 3 | 국경 = 베가 전초 1홉 |
| q04 | `story_004` | `vega_base` | 3 | 전멸은 서사. 조우 cruiser 1 |
| q05 | `story_005` | →`draco_haven` | 9 | 베가 경유 2홉 |
| q06 | `story_006` | `draco_haven` | 9 | cruiser 1 · 소사 대면 |

q09 지명 매핑(skeleton 유지): 아이언워치=`iron_remnant` · 캘리스=`omega_hub` · 하벤포드=`eden_city`. 그리하벤 권장=`shadow_market`(문서만).
