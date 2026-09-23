# 퀘스트 전투 우선 레인 — 설계 정본

> **작성**: 2026-09-21 · 김팀장  
> **상태**: **1안 Phase 1~3 반영 완료** — 기존 26행·존 확률·dest-org 숫자 유지  
> **범위**: `defeat_enemy` 전투 미션 vs 전투 4축(A 허브 · B 웨이브 · C 항로 dest-org · D 퀘스트)  
> **후속**: 챕터 바인드 때 `hub_orbit` / `transit_toward_anchor` 행 추가 · `wave_assault` Phase 2  
> **2026-09-21 재검수**: 항로 퀘스트 시드/TCL/헐은 `shouldGuaranteeQuestTransitEncounter` 홉에서만. 오프로드는 dest-org.

```text
[pss-pre-dev] hot_path=전투 종료·시드 1회 (틱/setInterval 없음)
[pss-pre-dev] alloc=락 재계산(progress 스냅샷) · persist 없음 · 스토어 필드 없음
[pss-pre-dev] stage=STAGE 3 기존 dispose · risk=P1/P6 해당없음 · verdict=PASS
```

교차: `docs/PLAY_SCENARIO_COMBAT_LEVEL_ADVANCEMENT.md` §1·§7 · `docs/MISSION_SYSTEM_HANDOFF.md` · `src/missions/missionObjectiveDsl.ts`

---

## 0. 한 줄 판정

현재 퀘스트 전투(D)는 **별도 엔진이 아니다.** 항로 조우(C)와 **같은 STAGE 3 인스턴스**를 `transit_guaranteed`로 **가로채는 우선 점유**다.  
도착 후 허브/웨이브(A/B)와는 **시드가 갈라지지만, 클리어는 행성 앵커로 새어 나간다.**  
대표님께서 요청하신 「퀘스트 전용 · 트리거로 병행 · 끝나면 레벨 전투 복귀」는 **가능**하다. 새 렌더러·13번째 서브코어는 쓰지 않는다.

| 묻고 | 현재 | 설계 1안 |
|------|------|----------|
| 프로세스가 완전한가? | **아니오.** 조우·시드·클리어가 한 계약이 아님 | 트리거 레지스트리 + 베뉴 락 + 베뉴 일치 클리어 |
| 도착 전투가 허브/웨이브와 겹치나? | **시드 아니오 · 클리어 예** | 도착 퀘스트는 `hub_orbit` 베뉴만. A/B 클리어로 D 완료 금지 |
| 이동 퀘스트가 dest-org와 겹치나? | **같은 레인 가로채기** (이중 함대 아님) | 락 동안 C 시드 억제. 해제 후 dest-org 복귀 |
| 퀘스트 우선이 되는가? | 조우 확률만 우선. 클리어·난이도는 레벨 축에 섞임 | 활성 `defeat_enemy` 락이 A/B/C보다 항상 앞선다 |
| 점령 후 적 출현? | 항로 C는 점령을 **안 봄**. 허브는 combat 함장만 | 레벨 축 유지. 퀘스트는 점령과 무관하게 락만 본다 |

---

## 1. 현재 전투 4축 (섞지 말 것)

정본은 플레이 시나리오 문서 §1과 같다. 퀘스트 설계는 **5번째 렌더러를 만들지 않고**, D를 **트리거 오버레이**로 고정한다.

| 축 | 플레이어가 겪는 것 | 발화 | 적 시드 | 레벨 입력 |
|----|-------------------|------|---------|-----------|
| **A. 허브 일반전투** | 행성 궤도 Ready 후 교전 | `evaluateHubMainStageCombatEntered` — `mainStageCombatEnabled` + 궤도 RED | `resolveCombatFleetSlotsFromCaptains` — `operationalState===combat`만 + 총사령관 · `hostileShipCount` 캡 | TCL = 무기 곡선. HP = 함 CSV |
| **B. 웨이브 9판** | 카운트다운 → 3·6·12 | 분쟁 차례 / RED [전투] / 채팅 / `endgame_boss` 착륙 | 행성 `npc_cpt_enemy_*` 순환 또는 `npc_wave_invader_tN` | TCL → 침입자 티어(슬롯 없을 때) |
| **C. 차원항로 dest-org** | 성계 이동 중 1척 | 존 확률 safe 0.1 / neutral 0.3 / pvp 0.7 / endgame 0.1 | 목적지 `npc_cpt_enemy_*` (허브 해적 후순위) | `min(playerLv, destTCL)` + dest 선체 스케일 |
| **D. 퀘스트** | `defeat_enemy` 1척 | `mission_quest_combat_ops.encounterPolicy` | `mission_combat_captains` 템플릿+앵커 | **전용 난이도 컬럼 없음** → 지금은 dest TCL/선체에 섞임 |

A와 B는 이미 **동시 점유 금지**다 (`evaluateHubMainStageCombatEntered` — 웨이브 세션/분쟁 차례면 허브 보스 억제).  
C와 D는 **같은 `combat.tsx` + `__transit__` 시드**를 쓴다. 이중 레드 함대가 아니라 **한 슬롯을 누가 채우느냐**의 문제다.

---

## 2. 현재 퀘스트 전투 프로세스 (실기)

### 2-1. 라이브 전투 미션 목록

`mission_objectives.csv` 의 `defeat_enemy` 전부:

| 군 | id | 템플릿 | 앵커 (`mission_quest_combat_ops`) |
|----|-----|--------|----------------------------------|
| 튜토리얼 | `mission_002` / `obj_002_a` | `pirate_fighter` | `arcadia_prime` |
| 샌드박스 | `sandbox_001`…`029` · `032` | fighter / cruiser / bounty | 행성별 (오메가 TCL37 등) |
| ArcCore tq | `tq_cbt_*` · `tq_bty_*` | 동일 3종 | **앵커 공란** |

`story_001` · 챕터1 q02/q04/q06 는 `defeat_enemy` **0**. 메인 본편 전투 퀘스트는 **아직 없음**.  
`mission_quest_combat_ops.csv` 의 `encounterPolicy` 는 **전원 `transit_guaranteed`**. `hub_orbit` / `wave_assault` / `land_on_arrival` 행은 **0건**.

함장 매핑(`mission_combat_captains.csv`): 템플릿+행성 → `npc_cpt_enemy_*`. 기본 행은 fighter→아르카디아, cruiser→오메가, bounty→시리우스.

### 2-2. 이동 중 발화 (지금 유일한 실기 경로)

```text
월드맵 홉
  → resolveTransitEncounterChance
       · shouldGuaranteeQuestCombatEncounter → 1.0
       · 아니면 zone + (주선 핀 전투미션이면 +0.4)
  → 롤 성공 + 함선 전투가능
  → transitCombatSession.begin(origin, dest)
  → STAGE 3 combat.tsx
       · findFirstIncompleteObjective(defeat_enemy)
       · resolveQuestCombatAnchorPlanetId
       · bindMission(template, anchor)
       · 시드 = mission_combat_captains || dest hostile
  → 승리 applyDefeatEnemy({ enemyTemplateId })
  → commitArrival (moveToSystem · reach_system는 착륙 게이트)
  → worldmap 복귀
```

`hasPrimaryActiveCombatMission` 은 **QuestHUD 핀(`activeMissionId`)** 만 본다.  
`shouldGuaranteeQuestCombatEncounter` 는 핀이 있으면 그 미션, 없으면 **첫 미완료 `defeat_enemy`**.  
부선 전투를 수락했는데 주선이 이동 미션이면, 보장 조우가 **안 켜질 수 있다**(핀 불일치).

### 2-3. 도착·허브·웨이브 (퀘스트가 시작시키지 않음)

D는 착륙 시 A/B를 **켜지 않는다.**  
착륙 후 A/B는 **행성 CSV·점령·분쟁 차례**만 본다.

다만 **클리어는 이미 허브/웨이브에 붙어 있다.**

| 호출 | 파일 | 입력 | 효과 |
|------|------|------|------|
| 항로 승리 | `app/(game)/combat.tsx` | `enemyTemplateId` | 템플릿 일치 시 완료 |
| 허브 궤도 블루 승 | `PlanetEdenRaidTestLayer` | `planetId` | **앵커/offer 행성이면 완료** |
| 웨이브 런 승 | `planet.tsx` `handleWaveDefenseRunEnded` | `planetId` | 동일 |

`docs/PLAY_SCENARIO` G8 · handoff P2 「허브 승리 미연동」은 **코드와 어긋난 구문서**다. 연동은 있다. 문제는 **연동이 너무 넓다.**

### 2-4. 완전하지 않은 지점 (갭)

| ID | 갭 | 결과 |
|----|-----|------|
| Q1 | D가 C를 덮어쓸 뿐, 락·베뉴·복귀 계약이 없음 | 「전용 시스템」이 아님 |
| Q2 | 정책이 `transit_guaranteed` 단일 | 도착 전투 퀘스트를 표현할 테이블이 없음 |
| Q3 | 클리어가 템플릿 **또는** 행성 | 드라코 허브/웨이브 승으로 샌드박스 순양 퀘스트가 끝날 수 있음 |
| Q4 | 보장 조우가 **모든 홉**에 걸림 | 아르카디아 해적 퀘스트를 들고 나이트폴로 가도 100% 조우 |
| Q5 | 퀘스트 시드(앵커 함장) + dest TCL/선체 | 먼 홉에서 퀘스트 적이 dest 난이도로 스케일 |
| Q6 | 점령이 C/D 조우를 안 막음 | BLUE 점령 성계 항로에도 dest-org 해적 |
| Q7 | 핀 vs 첫 미완료 불일치 | 부선 전투 보장이 꺼질 수 있음 |
| Q8 | tq_* 앵커 공란 | 클리어가 offerPlanet / 템플릿에만 의존 |
| Q9 | 전용 난이도 컬럼 없음 | 샌드박스 수락Lv vs 존 TCL 붕괴(시나리오 G9)와 동일 축 |
| Q10 | 패배 시 `clear()` — 도착 없음 | 재시도는 다음 홉. 락이 없어 다음 홉이 dest-org일 수도, 다시 보장일 수도(보장은 미완료면 계속) |

---

## 3. 중복 검토 (요청 두 장면)

### 3-1. 특정 성계 도착 후 전투 vs 레벨 허브/웨이브

**시드 중복: 아니오.**  
도착 퀘스트를 켜는 코드가 없다. 착륙 전투는 전부 A(허브 combat 함장) 또는 B(웨이브 트리거)다.

라이브 허브 적이 실제로 뜨는 곳:

- `draco_haven` — combat 함장 3 · 허브 ON · 착륙 강제 웨이브 없음  
- `vega_base` — combat 함장 있으나 허브 OFF → 어썰트/차례 웨이브  
- Z18~20 `endgame_boss` — 착륙 즉시 웨이브가 허브를 선점  
- Z1 아르카디아 — 허브 ON이나 combat 함장 공백 (시나리오 G3)

**클리어 중복: 예.**  
`sandbox_013`(앵커 드라코)를 받은 뒤 드라코 허브 보스 또는 분쟁 웨이브를 이기면, 항로에서 퀘스트 순양을 안 잡아도 `planetId` 일치로 목표가 끝난다.  
`sandbox_007`(베가)는 허브 OFF라 궤도로는 안 끝나지만, RED [전투] 웨이브 승이면 같은 누수가 난다.

**도착 직후 이중 전투:**  
항로 퀘스트를 이기고 `commitArrival` 한 뒤 그 행성 허브에 착륙하면, 목표가 이미 끝났어도 A/B는 **레벨 규칙대로 또** 뜰 수 있다.  
지금은 「퀘스트 끝나면 레벨 복귀」가 아니라 「퀘스트와 무관하게 레벨이 원래부터 따로 돈다」에 가깝다.

### 3-2. 이동식 전투 퀘스트 vs dest-org (C)

**엔진 중복: 예 — 같은 레인.**  
이중 스폰은 아니다. `bindMission` 이 있으면 레드 1척은 퀘스트 함장, 없으면 dest-org 함장.

| 구간 | 누가 시드하나 |
|------|----------------|
| 활성 `transit_guaranteed` 미완료 | D (템플릿+앵커 함장) |
| 퀘스트 완료·포기 후 다음 홉 | C (dest `npc_cpt_enemy_*`) |
| 전투 미션 있으나 정책/핀 불일치 | C + 확률 +0.4 (핀이 전투일 때만) |

겹침의 실체:

1. **확률** — D가 C의 롤을 1.0으로 덮음 (모든 홉).  
2. **함장** — 앵커 행성 적(예: 아르카디아 카일)이 dest-org 적 자리를 차지.  
3. **난이도** — 함장은 D, TCL/선체는 C dest. 정체와 스펙이 갈라짐.  
4. **점령** — C도 D도 홀드를 안 봄.

퀘스트가 끝나면 dest-org가 **자동으로 돌아온다**(락이 없어서 「복귀」가 아니라 「덮어쓸 미션이 없음」).

---

## 4. 레벨 전투 체계 — 반복 · 점령 · 적 출현

퀘스트 락을 걸기 전에, 복귀 대상인 레벨 축을 고정한다. **기존 존 확률·선체 숫자는 이 설계로 바꾸지 않는다.**

### 4-1. 반복

| 축 | 같은 성계에서 다시 싸우나 | 억제 |
|----|---------------------------|------|
| A 허브 | combat 함장이 있으면 Ready마다 | 허브 쿨다운 · 웨이브 세션이 있으면 억제 |
| B 웨이브 | 어썰트/차례/엔드 조건이 다시 맞으면 | 승리 30분 쿨다운 (`markWaveCombatVictoryCooldown`) |
| C 항로 | **홉마다** 존 확률 | 점령·거리·플레이어 Lv **미적용** |
| D 퀘스트 | 미완료면 홉마다 100% | 완료되면 보장 소멸 |

점령되어도 C는 반복된다. 「우리 영토인데 항로 해적」이 현재 레벨 규칙이다.

### 4-2. 점령과 적 출현

| 홀드 | A 허브 | B 웨이브 | C 항로 dest-org |
|------|--------|----------|-----------------|
| BLUE (아르카디아 등) | 대부분 허브 적 공백 · 점령전투 OFF | 어썰트 없음 | **그대로 롤** |
| RED | 허브 OFF가 많음 | [전투] + `occupationCombatEnabled` 면 웨이브 | **그대로 롤** |
| NEUTRAL / 분쟁 | 행성별 | 차례 due 시 웨이브 | **그대로 롤** |
| 플레이어 웨이브 승 → 중립화 | 허브는 CSV 유지 | 그 행성 어썰트 소멸(홀드 변경) | **항로는 무관** |

퀘스트 D는 홀드를 **전혀 읽지 않는다.** 점령 성계 도착 퀘스트를 만들 때도, 「점령되면 퀘스트 적 없음」은 **정책 컬럼으로만** 넣고 기본은 **퀘스트 우선(점령 무시)** 이다.

### 4-3. 복귀 계약 (설계가 보장할 것)

퀘스트 락이 풀리면:

- 다음 홉 → C dest-org + 존 확률 (기존 숫자)  
- 다음 착륙 → A/B 기존 게이트 (combat 함장 · 웨이브 resolver · 쿨다운)  
- 퀘스트 함장 시드 · 보장 1.0 · 퀘스트 TCL 캡은 **재적용 금지**

---

## 5. 목표 구조 — 트리거 병행 + 퀘스트 우선

### 5-1. 원칙

1. **렌더러 1개** — `PlanetEdenRaidTestLayer` / Skia 단일 경로 유지.  
2. **시드 소스만 갈라짐** — A 함장 테이블 · B 웨이브 빌더 · C dest-org · D 퀘스트 테이블.  
3. **동시에 레드 함대 2개를 넣지 않음** — 락이 있으면 그 베뉴의 레벨 시드는 skip.  
4. **클리어는 베뉴+템플릿** — 행성 id만으로 완료 금지.  
5. **Table-First** — 정책·앵커·함장은 CSV. 코드에 행성 하드코딩 금지.  
6. **기존 확정값 유지** — 존 조우 0.1/0.3/0.7, dest-org 헐/TCL, 웨이브 3·6·12, 허브 레이아웃. 바꿀 때는 대표님 재확인.

### 5-2. 퀘스트 전투 락 (메모리)

활성 미완료 `defeat_enemy` 중 **우선 1건**만 락을 갖는다.

```text
QuestCombatLock
  missionId
  objectiveId
  templateId          — pirate_fighter | pirate_cruiser | bounty_hunter
  venue               — transit | hub_orbit | wave_assault
  encounterPolicy     — CSV
  anchorPlanetId      — 없으면 offerPlanetId, 둘 다 없으면 lock 불가(tq는 템플릿-only transit)
  captainId           — mission_combat_captains 해석 결과
  status              — armed | in_combat | released
```

우선순위(락 선정):

1. QuestHUD 핀 미션에 미완료 `defeat_enemy`가 있으면 그것  
2. 없으면 `findFirstIncompleteObjective(defeat_enemy)`  
3. 주선(tutorial/main_story)이 부선(sandbox/tq)보다 앞선다 (핀이 없을 때)

락은 `missionStore` persist에 **넣지 않는다.** 진행 플래그(`objectives[id]`)만 영속. 락은 hydrate 후 동기 재계산(틱/렌더 할당 없음).

### 5-3. 정책 → 베뉴 (CSV 확장, 기본값 호환)

`mission_quest_combat_ops.encounterPolicy` 허용값:

| 정책 | 베뉴 | 의미 | 지금 CSV |
|------|------|------|----------|
| `transit_guaranteed` | transit | 락이 있는 동안 **모든 홉** 100% 조우 · D 시드 | 전원 이 값 |
| `transit_toward_anchor` | transit | 목적지 성계가 앵커 행성의 성계일 때만 100%. 그 외 홉은 C | **신규 · 권장 기본** |
| `hub_orbit` | hub_orbit | 앵커 행성 **착륙** 시 A 레벨 시드 대신 퀘스트 1척. 항로 C는 레벨 유지 | 0건 |
| `wave_assault` | wave_assault | 앵커에서 B를 퀘스트가 선점(어썰트 의도). 일반 분쟁 웨이브와 시드 분리 | 0건 · Phase 2 |
| `none` / 행 없음 | — | D 오버레이 없음. 레벨만. 클리어는 템플릿 일치 항로만 | 사용 안 함 |

**1안(안정화):** 라이브 행은 `transit_guaranteed` 유지(기존 튜토리얼 체감 보존).  
구현은 락/베뉴/클리어만 넣고, `transit_toward_anchor` · `hub_orbit` 는 **행을 넣을 때부터** 켠다.  
기존 26행을 일괄 바꾸는 것은 **기존값 변경**이므로 승인 전 금지.

### 5-4. 런타임 우선순위 (한 시점 하나의 전투)

```text
STAGE 전환 직전 판정:

1) QuestCombatLock.armed
     · venue=transit 이고 이번 사건이 홉     → C 레벨 시드 skip, D 시드, 확률=1
     · venue=hub_orbit 이고 이번이 앵커 착륙 → A 레벨 시드 skip, D 1척, Ready
     · venue=wave_assault 이고 앵커 어썰트   → B 레벨 시드 skip, 퀘스트 웨이브 시드
     · 사건이 락 베뉴와 다르면               → 레벨 축 정상 (퀘스트 안 건드림)

2) 락이 없거나 베뉴 불일치
     · B 게이트 (분쟁/어썰트/채팅/엔드) 
     · else A 게이트 (허브 combat)
     · 홉이면 C dest-org + 존 확률
```

A/B 동시 점유 금지는 **그대로** 위에 얹는다.  
퀘스트가 허브를 선점한 동안 분쟁 차례가 오면: **분쟁 차례가 퀘스트보다 위**가 되면 스토리가 끊긴다.  
1안: `hub_orbit` 락 중에는 분쟁 웨이브를 **한 틱 미룬다**(pending 유지, 소거 아님). 퀘스트 끝나면 기존 B 게이트가 그대로 발화.  
`endgame_boss` 착륙은 헌법 §16-A — `hub_orbit` 퀘스트를 이터니티/코어에 두지 않는다. CSV 감사로 금지.

### 5-5. 클리어 계약 (Q3 수정이 핵심)

```text
applyDefeatEnemyMissionObjectives({
  venue,            // 'transit' | 'hub_orbit' | 'wave_assault'
  enemyTemplateId?,
  planetId?,
})
```

완료 조건 (모두 만족):

1. 목표가 `defeat_enemy` 이고 미완료  
2. `lock.venue === venue` (또는 락이 그 objective)  
3. `enemyTemplateId === targetId` — **항로·허브 공통 필수**  
4. `hub_orbit` / `wave_assault` 만 추가로 `planetId === anchorPlanetId`

**삭제:** 「행성만 같으면 완료」(현재 `applyDefeatEnemy` 후반부).  
허브/웨이브 승리는 퀘스트 베뉴가 그쪽일 때만 인정한다.

패배: 락은 `armed`로 남김. 항로는 도착하지 않음(`clear` 세션). 다음 적격 사건이 다시 D.

### 5-6. 퀘스트 전용 난이도 (충돌 없이)

새 전투 수학을 만들지 않는다. **입력 행성만 갈라** 기존 TCL·선체 함수를 재사용한다.

| 입력 | 락 중 D | 락 해제 후 C |
|------|---------|--------------|
| 함장 | `mission_combat_captains` | dest `npc_cpt_enemy_*` |
| TCL | `min(playerLv, anchorTCL)` | `min(playerLv, destTCL)` (현행) |
| 선체 스케일 | 앵커 행성 `planet_hostile_hull_scale` | dest 행성 (현행) |
| 친화도 | 앵커 | dest |
| 척수 | 1 | 1 |

이렇게 하면 「아르카디아 해적 퀘스트를 들고 제네시스로 홉」해도 적이 제네시스 스케일로 안 커진다.  
`transit_toward_anchor` 를 쓰면 그 홉 자체가 안 뜬다.

전용 CSV 컬럼(`questCombatLevel`)은 **지금 넣지 않는다.** 샌드박스 G9(수락Lv vs TCL)는 별 사이클. 기존 `levelRequired` 덮어쓰기 금지.

### 5-7. 점령

| 상황 | 동작 |
|------|------|
| 락 중 항로/도착 퀘스트 | 홀드와 무관하게 D 발화 (스토리 해적은 점령과 별개) |
| 락 해제 후 | §4 레벨 표 그대로 |
| BLUE 점령 성계 허브 | 레벨 A가 비어 있으면 퀘스트가 아닌 한 적 없음 |
| RED 점령 + 어썰트 | 레벨 B. 퀘스트 `wave_assault`가 아니면 퀘스트 완료 안 됨 |

C의 「점령 성계 항로 적 억제」는 **이 설계의 기본이 아니다.** 기존 0.1/0.3/0.7 유지. 바꾸려면 별도 재확인.

---

## 6. 장면별 시퀀스 (1안)

### 6-A. 이동 퀘스트 (`transit_guaranteed` / `transit_toward_anchor`)

```text
수락 → Lock(venue=transit, template, captain, anchor)
  홉 (적격)
    → C dest-org skip
    → D 1척 (앵커 함장 · 앵커 TCL/헐)
    → 승: 템플릿+venue=transit 로 완료 → Lock release
    → 패: Lock 유지 · 미도착
  착륙 (앵커든 아니든)
    → A/B는 레벨 게이트만. 승리해도 D 완료 안 됨
Lock 없음
  → 다음 홉 C dest-org · 존 확률
```

### 6-B. 도착 퀘스트 (`hub_orbit`) — 신규 정책, 행이 있을 때만

```text
수락 → Lock(venue=hub_orbit)
  홉 → C dest-org 정상 (퀘스트와 병행, 시드 안 섞음)
  앵커 착륙
    → A combat 함장 시드 skip
    → D 1척 Ready
    → 분쟁 pending 은 보류
    → 승: template+planet+venue 완료 → Lock release
    → 패: Lock 유지. 재도전은 재진입/Ready (허브 쿨다운은 퀘스트 중 적용 여부: 적용 — 남용 방지)
  다른 행성 착륙 → A/B 레벨. D 완료 안 됨
Lock release 후 같은 행성 재착륙
  → A/B 원래 편성 (드라코면 허브 3척 등)
```

도착 퀘스트와 항로 dest-org는 **병행**이다. 같은 이동에서 항로 싸움(C)을 하고, 착륙 후 퀘스트 궤도전(D)을 할 수 있다. 시드가 다르므로 중복이 아니다.

### 6-C. 웨이브 퀘스트 (`wave_assault`) — Phase 2

챕터 q04/q06 · 엔드 기함용. 지금 라이브 행 없음.  
구현 전 웨이브 FPS HOLD와 충돌 없는지 재확인. **이번 안정화 범위 밖.**

---

## 7. 구현 단계

| Phase | 내용 | 상태 | 안 건드리는 것 |
|-------|------|------|----------------|
| **1 계약** | 락 해석 + 클리어 베뉴 게이트 | **완료** | 존 확률 · dest-org pick · 헐 CSV |
| **2 시드 분리** | 락 중 transit TCL/헐 = 앵커 | **완료** | 비미션 dest-org |
| **3 허브 선점** | `hub_orbit` 시드 + 분쟁/웨이브 보류 | **완료** (정책만 · 행 없음) | `planetMainStageLayout` · 웨이브 척수 |
| **4 정책 행** | 신규 미션만 `transit_toward_anchor` / `hub_orbit` | **보류** — 챕터 바인드 때 | 기존 26행 일괄 변경 |
| **5 감사** | placement venue·엔드보스 금지 + 회귀 | **완료** | — |

완료 게이트(구현 시): `tsc` · `audit:memory:all` · 미션 placement 감사 · 기존 dest-org 테스트 회귀.

메모리: 락은 모듈/스토어 필드 수 개. 틱 할당 없음. persist 추가 금지. STAGE dispose 시 `in_combat`만 리셋, `armed`는 progress에서 재계산.

---

## 8. 대표님 확인 항목 (코드 전)

구현 전에 아래만 확정하면 Phase 1을 바로 쓸 수 있다.

| # | 질문 | 1안 (권장) |
|---|------|------------|
| 1 | 라이브 `transit_guaranteed` 26행을 앵커 성계 홉만으로 좁히나? | **아니오.** 튜토리얼 체감 유지. 신규 행만 `transit_toward_anchor` |
| 2 | 허브/웨이브 승으로 항로 퀘스트 완료를 막을까? | **예.** 베뉴 불일치 완료 삭제 |
| 3 | 도착 전투 퀘스트를 지금 CSV에 만들까? | **정책만 열고 행은 안 넣음.** 챕터 q02 바인드 때 `hub_orbit` 1행 |
| 4 | BLUE 점령 항로 dest-org를 줄일까? | **아니오.** 레벨 C 기존값 유지 |
| 5 | 퀘스트 중 분쟁 웨이브 | **보류(pending 유지).** 퀘스트 끝나면 발화 |

---

## 9. 문서 정정 (구현과 별개)

| 문서 | 지금 문구 | 사실 |
|------|-----------|------|
| `PLAY_SCENARIO` G8 | 허브 승리 → defeat_enemy 미연동 | `planetId` 경로로 **이미 연동** (과잉) |
| `MISSION_SYSTEM_HANDOFF` P2 | 궤도 전투 연동 미완 | 동일. 연동은 있음. **베뉴 가드가 없음** |

이 두 줄은 설계 승인 후 문서만 고친다.

---

*설계일 2026-09-21. 코드 미착수. 승인 전 CSV/런타임 diff 금지.*
