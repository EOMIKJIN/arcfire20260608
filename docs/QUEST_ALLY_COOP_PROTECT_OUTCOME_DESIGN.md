# 퀘스트 협동·보호 · 성공/실패 조건 — 설계 검수 v1

> **작성**: 2026-10-03 · 김팀장  
> **상태**: **설계만 · 코드 금지** (대표님 검수 후 착수)  
> **지시**: 메인·서브 **전투 세부미션**을 스텔리움 연합(블루) NPC 전함과 협동하게 수정하거나 신설. **보호임무**(동료 격침=실패, 적 전멸+동료 생존=성공). 성공/실패 판정이 없으면 추가하고 **조건은 테이블로 설정**.  
> **교차**: `missionObjectiveDsl.ts` · `questCombatLock.ts` · `mission_quest_combat_ops.csv` · `QUEST_COMBAT_PRIORITY_LANE_DESIGN.md` · `CHAPTER1_MAJOR_SIDE_QUESTS_DESIGN.md` · `.cursor/rules/arcfire-quest-detail-mission.mdc`

```text
[pss-pre-dev] hot_path=전투 종료·아군 격침 1회 (틱 신규 persist 없음)
[pss-pre-dev] alloc=퀘스트 시드 +1~2 블루 슬롯(기존 에이전트 풀) · 결과 정책 O(1)
[pss-pre-dev] cache=objectiveId 키 Map · planetMemo 아님
[pss-pre-dev] stage=STAGE3 기존 dispose · 렌더러/서브코어 신설 없음
[pss-pre-dev] verdict=PASS — 설계. 구현은 검수 후
```

---

## 0. 한 줄

지금 전투 퀘스트는 **적 1척 vs 플레이어 기함**이고, 이기면 `defeat_enemy`만 완료한다.  
**실패 상태 전이**는 본편·정식 서브에 없다(만료는 진행을 지운다).  
협동·보호는 **새 전투 엔진이 아니라** 퀘스트 시드에 블루 NPC 1척을 얹고, **승리/실패 규칙을 목표마다 CSV로 고른다.**

---

## 1. 지금 코드가 하는 일 (갭)

### 1-1. 전투 퀘스트 목록 (라이브)

`mission_objectives.type=defeat_enemy` + `mission_quest_combat_ops` `hub_orbit`.

| 군 | 목표 | 앵커 | 비고 |
|----|------|------|------|
| 튜토리얼 | `obj_002_a` | arcadia_prime | 1v1 유지(초전 교육) |
| 본편 | `obj_story_002_c` | minerva_deep | 밀수 호위 격파 |
| 본편 | `obj_story_004_a` | vega_base | **전멸 서사 — 협동 전환 금지** |
| 본편 | `obj_story_006_a` | draco_haven | 궤도 호위 격파 → 다렐 |
| 본편 | `obj_story_012_d` · `014_c` · `021_c` · `028_b` | 후반 | 이번 1차 배치 제외 |
| 정식 서브 | `obj_s034_d` · `035_d` · `036_c` · `037_c` | synth | 부모+순차 세부 |
| 정식 서브 | `obj_s056_d` · `057_d` · `058_d` · `059_d` | synth | 전투 부모 |
| 바 | `sandbox_001`–`033` · `tq_*` | — | **이번 범위 밖** |

시드는 허브·항로 모두 **레드 1 + 플레이어 블루 1** (`questHubOrbitCombatSeed` · `capitalTransitCombatSeed`).

### 1-2. 성공

`applyDefeatEnemyMissionObjectives` — 락 베뉴 + `enemyTemplateId===targetId` 이면 `completeObjective`.  
아군 생존·플레이어 생존을 **보지 않는다.** 블루가 이기기만 하면 된다.

### 1-3. 실패

| 경로 | 동작 | 퀘스트 |
|------|------|--------|
| 플레이어 격침 | 내구 마모·싱크 알림·전투 종료 | **미완료 유지** (재도전) |
| 도주 | 항로 도착/허브 복귀 | **미완료 유지** |
| 벽시계 만료 | `sweepExpiredMissions`가 **progress 삭제** | `failed`를 안 씀. 본편·정식 서브는 `timeLimitHours=0`이라 해당 없음 |
| 미확인 이상 | `closeAnomalyMission` | 이상 전용 |
| `MissionStatus.failed` | 타입만 있음 | **본편/서브 전투에서 기록하는 코드 없음** |

보호임무(동료 격침=실패)를 넣을 수 있는 **판정 API가 없다.**

### 1-4. 블루 NPC는 이미 전투에 있다 — 퀘스트만 안 쓴다

- 함장 CSV `combatTeam=blue` + `operationalState=combat` → 허브 **일반** 궤도 시드
- 스킬 윙맨 → 임시 블루 (퀘스트 동료 아님)
- 스텔리움 연합 = `mega_stellium_alliance` / 연방·변경·광부 호송 함장

퀘스트 시드는 위 함장을 **넣지 않고** 플레이어만 블루로 고정한다.

### 1-5. 엔진이 이미 허용하는 것

- `CombatFleetSeedSlot.team='blue'` 다수
- 승패: `aliveRed && aliveBlue` 가 깨지면 팀 승
- 함대 기본 상한 블루 3 (`EDEN_CAPITAL_FLEET_BLUE_COUNT`)
- 새 Skia 렌더러·13번째 서브코어 **불필요**

---

## 2. 잠금 규칙 (검수 전제)

| # | 규칙 |
|---|------|
| L1 | `story_001` 문장·목표 **불변** |
| L2 | `story_023`–`030` skeleton **불변** |
| L3 | 바 `sandbox_001`–`033` · 튜토리얼 `mission_*` 전투 **1v1 유지** |
| L4 | `story_004` / `obj_story_004_a` — 「아군 함대는 무너지고 당신만 산다」 **협동·보호 전환 금지** |
| L5 | 세부미션 = 부모 1행 + 순차 목표. 전투마다 `missions.csv`를 쪼개지 않음 |
| L6 | 정식 서브 **신규 부모 행**은 차기 `SUB-NEW` HOLD. 보호 신설은 **검수에서 부모 신설을 열지** 정함 |
| L7 | 기존 목표 id·선행·보상 곡선은 구현 전 **기존값 재확인** |
| L8 | 점유 웨이브·dest-org 레벨 축과 시드를 섞지 않음 (퀘스트 락 유지) |
| L9 | 알림은 `ArcOverlayHost`만 |

---

## 3. 1안 — 규칙 모델

목표 타입은 **`defeat_enemy` 유지**. 보호도 같은 타입 + **결과 정책**.  
HUD만 정책에서 「적 격파 / 아군 생존」을  squashes.

### 3-1. 승리 (`winWhen`)

| 값 | 의미 |
|----|------|
| `all_red_dead` | **현재.** 레드 전멸 (기본) |
| `all_red_dead_and_protected_alive` | 레드 전멸 **그리고** `mustSurvive=1` 동료가 모두 생존 |
| `all_red_dead_and_player_alive` | 레드 전멸 + 플레이어 생존 (명시. 기본 보호/협동에 켬) |

기본(정책 행 없음) = 지금과 동일 `all_red_dead`.

### 3-2. 실패 (`failWhen`) — 전투 중에도 봄

| 값 | 의미 |
|----|------|
| `none` | **현재.** 격침·도주는 퀘스트를 안 바꿈 |
| `any_protected_dead` | `mustSurvive=1` 동료 1척이라도 격침 |
| `player_dead` | 플레이어 격침을 퀘스트 실패로 (기본은 끄기 — 지금과 같음) |
| `player_or_protected_dead` | 둘 중 하나 |

보호 기본 = `any_protected_dead`.  
협동 기본 = `none` (동료가 먼저 죽어도 **플레이어가 적을 끝내면 성공**. 동료는 화력 지원).

### 3-3. 실패 후 (`onFail`)

| 값 | 의미 |
|----|------|
| `retry_objective` | **보호 1안.** `active` 유지, 해당 목표만 미완료, 오버레이 「재도전」. 보상 없음 |
| `fail_mission` | `status=failed`, 보상 없음, 오퍼 NPC에서 재수락. 본편 체인에는 **쓰지 않음** |
| `expire_delete` | 지금 만료와 같음. 전투 실패에 쓰지 않음 |

본편 협동/보호는 `retry_objective`만. 본편을 `failed`로 닫으면 `nextMissionId` 체인이 끊긴다.

### 3-4. 역할 (`allyRole`)

| 값 | 시드 | 실패 |
|----|------|------|
| `coop` | 블루 NPC 1척 + 플레이어 | `failWhen=none` |
| `protect` | 블루 NPC 1척 + 플레이어 | `failWhen=any_protected_dead` · `winWhen=all_red_dead_and_protected_alive` |

척수 1차 = **동료 1**. 상한 블루 3(플레이어+동료+여유). 2척 이상은 2차.

### 3-5. 평가 시점

```text
전투 중  보호 대상 격침 → failWhen 충족 → 전투 종료(블루 패) + onFail
전투 종료  레드 전멸 + winWhen → completeObjective (지금 함수를 정책 게이트로 감쌈)
전투 종료  플레이어 전멸 + failWhen에 player 없음 → 지금과 같이 미완료
도주      failWhen 미적용 (도망=미완료). 보호 도주 실패는 2차
```

`applyDefeatEnemyMissionObjectives`는 **winWhen을 통과할 때만** `completeObjective`.

---

## 4. 테이블 (Table-First)

정본은 **편집 CSV**. generated는 빌드. 기존 `defeat_enemy` 행은 **정책 행이 없으면 동작 불변**.

### 4-1. `tables/content/mission_quest_outcome_policy.csv` (신설)

| 열 | 예 | 설명 |
|----|----|------|
| `id` | `qout_obj_s064_c` | 행 id |
| `objectiveId` | `obj_s064_c` | `mission_objectives.id` |
| `winWhen` | `all_red_dead_and_protected_alive` | §3-1 |
| `failWhen` | `any_protected_dead` | §3-2 |
| `onFail` | `retry_objective` | §3-3 |
| `playerMustSurvive` | `1` | 플레이어 전멸 시 완료 금지 |
| `notesKo` | 보호 1안 | |

행 없음 = 현재 승리만.

### 4-2. `tables/content/mission_quest_combat_allies.csv` (신설)

| 열 | 예 | 설명 |
|----|----|------|
| `id` | `qally_obj_story_002_c_0` | |
| `objectiveId` | `obj_story_002_c` | |
| `slot` | `0` | 0부터. 1차는 0만 |
| `captainId` | `npc_cpt_sela` | 스텔리움/우호 블루 함장 |
| `assignedShipId` | (공란=함장 배정함) | 필요 시만 |
| `allyRole` | `coop` \| `protect` | |
| `mustSurvive` | `0` 협동 · `1` 보호 | |
| `displayNameKo` | 셀라 모른 | HUD·오버레이. 공란이면 함장 displayName |
| `notesKo` | 미네르바 광물 호송 | |

- `combatInstanceKey` = `quest_ally_{missionId}_{objectiveId}_{slot}` — 월드 궤도 presence와 분리
- 함장은 **기존 블루 스텔리움/연방/호송**을 재사용. synth 앵커는 코어 함장을 빌려도 되고, 검수 후 `questOnly` 호위 함장 1명을 추가해도 됨 (Fable)
- 크림슨/`combatTeam=red` 함장 **금지**

### 4-3. 기존 CSV

| 파일 | 1차 |
|------|-----|
| `mission_quest_combat_ops.csv` | 베뉴·앵커 유지. 열 추가 없음 |
| `mission_objectives.csv` | 타입 `defeat_enemy` 유지. 보호는 **설명 문구만** 검수 후 수정 |
| `mission_combat_captains.csv` | 적 매핑 유지 |
| `missions.csv` | 보호 **신규 부모**만 검수에서 열면 1행. 그 전엔 손대지 않음 |

감사: `audit:mission-quest-placements`에 outcome/ally 정합(objective 존재, 보호면 mustSurvive≥1, 함장 블루)을 붙인다.

---

## 5. 런타임 (구현 시 · 지금 안 함)

| 모듈 | 역할 |
|------|------|
| `resolveQuestCombatOutcomePolicy` | objectiveId O(1) |
| `buildQuestAllySeedSlots` | 블루 슬롯 append. 허브·항로 시드가 호출 |
| `applyQuestCombatEncounterResult` | 승/패 한곳. 허브 종료 + 항로 승리/패배 + (보호) 아군 격침 |
| `failQuestObjective` / `failQuestMission` | `missionStore`. persist는 기존 coalesce |
| DSL | `missionObjectiveDsl.ts` v1+ — `defeat_enemy` 완료에 winWhen, 실패 API |

HUD: 보호면 목표 줄에 「동료 생존」. 스텔라 현장 메모 표에 coop/protect 힌트 행(구현 시 Fable).

오버레이: 성공은 기존 클리어. 보호 실패는 `showArcAlert` 한 장.

---

## 6. 배치 1안 (검수 대상)

### 6-1. 협동 — **기존 전투 세부미션 수정** (부모 신설 없음)

| 목표 | 동료 (초안) | 이유 |
|------|-------------|------|
| `obj_story_002_c` 미네르바 | `npc_cpt_sela` 광물 호송 | 밀수 단속·호송과 맞음. 본편 초반 |
| `obj_story_006_a` 드라코 | `npc_cpt_vector` 학술 순항 | 성운 관측 호위. 다렐 대면은 전투 **이후** talk |
| `obj_s034_d` 캠프 출구 | 연방 순항 1 (또는 questOnly 호위) | 암흑 팩 전투 칸 |
| `obj_s056_d` 펄 차단 | 변경 초계 1 | 출정 전야·잠긴 항로 |

`failWhen=none`. 동료가 먼저 죽어도 플레이어가 격파하면 성공.

### 6-2. 넣지 말 것

| 목표 | 이유 |
|------|------|
| `obj_story_004_a` | 전멸·단독 생존 정본 |
| `obj_002_a` | 튜토리얼 1v1 |
| `obj_s035_d` | 「아군 신호 위장」톨린 — 진짜 아군 협동과 톤이 충돌 |
| 바 001–033 · tq_* | 범위 밖 |
| story_012 이후 | 후반. 1차 후 |

### 6-3. 보호 — **신설 1개** (권장)

기존 「호위」문구는 **적 호위함을 부수는 것**이지 아군 보호가 아니다. 그 칸을 보호로 바꾸면 서사가 뒤집힌다.

| 안 | 내용 | 조건 |
|----|------|------|
| **P-A (권장)** | 정식 서브 부모 1개 신설 `sandbox_064` + 세부 3~4 (talk → 착륙 → **보호 전투** → 보고) | `SUB-NEW`를 이 1행만 연다 |
| P-B | 기존 부모에 보호 세부미션 **한 칸 삽입** | 순번·대사·마크가 밀림. 기존값 재확인 필수. 비권장 |
| P-C | `obj_s057_d`를 보호로 재해석 | 「빈 지휘 매물」과 안 맞음. 기각 |

**P-A 초안** (이름·행성은 검수 후 Fable):

```text
sandbox_064  스텔리움 호송 엄호
  수락    코어 인근 스텔리움/연방 호송 함장 (기존 또는 questOnly 1)
  세부 1  talk_npc
  세부 2  reach_planet (호송 집결 행성)
  세부 3  defeat_enemy + protect 정책  (적 1~2, 동료 1, 동료 격침=retry)
  세부 4  talk_npc 보고
```

수락 Lv·앵커 TCL은 차기 `QLB`와 같이 맞춤. 구현 전 숫자 재확인.

### 6-4. 본편에 보호를 넣을지

1차 **넣지 않음.** 본편 전투는 협동 2칸만. 보호는 서브에서 규칙을 검증한 뒤 챕터2 후보.

---

## 7. 메모리 · STAGE

| 항목 | 계약 |
|------|------|
| 에이전트 | 퀘스트 전투 +1 블루. 윙맨과 동시에 켜지지 않게 하거나 상한 3 |
| persist | 실패/완료만. 틱·격침마다 stringify 금지 |
| 시드 | 전투 입장 1회. 프레임 재빌드 금지 |
| Canvas | 기존 궤도 1장 |
| 이탈 | 기존 STAGE3 dispose · `replace()` |

---

## 8. 구현 순서 (검수 통과 후)

1. outcome policy + `failQuestObjective` + 테스트 (동작 불변 기본)  
2. ally 시드 허브·항로 + 테스트  
3. 협동 4목표 CSV (기존값 재확인 후)  
4. 보호 P-A (`SUB-NEW` 1행 승인 시)  
5. HUD·오버레이·스텔라 힌트  
6. `audit:mission-quest-placements` 확장 · `tsc` · 실기 4+1

---

## 9. 검수 체크

- [ ] story_004 · story_001 · 튜토리얼 · 바 001–033 제외 동의  
- [ ] 협동 4칸 (`002_c` · `006_a` · `s034_d` · `s056_d`) 동의 또는 교체  
- [ ] 보호는 P-A 신설 vs 보류  
- [ ] 협동은 동료 사망해도 성공, 보호만 동료 사망=재도전  
- [ ] 본편 `fail_mission` 사용 안 함  
- [ ] 동료 1척, 적 수는 기존 1척 유지 (보호 적 2척은 2차)

---

*김팀장 · 2026-10-03 · 설계 검수용. commit은 대표님 지시 시.*
