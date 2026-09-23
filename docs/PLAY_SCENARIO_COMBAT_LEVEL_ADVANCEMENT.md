# 플레이 시나리오에 따른 전투레벨 고도화

> **작성**: 2026-09-17 · 김팀장  
> **갱신**: 2026-09-18 — 권장안 런타임 연동 1차 (무역 도전 키트 · 선체 스케일 · 샌드박스 수락)  
> **상태**: **전수 조사 정본 + 1차 연동**  
> **범위**: 코어 21성계 일반전투·웨이브·조우·보스 · 메인/튜토리얼/샌드박스 퀘스트 연동  
> **후속**: 실 플레이 데이터로 `planet_hostile_hull_scale.csv` · 진열 캡만 재조정

```text
[pss-pre-dev] hot_path=없음 (문서만)
[pss-pre-dev] alloc=없음 · persist 없음
[pss-pre-dev] verdict=PASS — 조사·문서. 코드 금지
```

---

## 0. 한 줄 판정

존 표(`play_scenario_zone_planets` + `planet_leveling_progression`)의 **권장 파일럿 레벨 = `targetCombatLevel`(1~60)** 은 서로 맞다.  
그러나 **실제 적 함장 레벨·적함 HP·무기 CSV** 는 그 곡선을 따르지 않는다.  
본편 라이브 전투는 `story_002`/`004`/`006`의 `defeat_enemy` 각 1척(존 앵커 템플릿)이며, **함대 전멸·기함 데드코러스 편성은 서사 대행**이다.

| 묻고 | 답 |
|------|----|
| 일반전투와 웨이브가 레벨별로 어떻게 갈라지나? | 허브 궤도 = `mainStageCombatEnabled` + `operationalState=combat` 함장. 웨이브 9판 = 어썰트·분쟁 차례·채팅·`endgame_boss` 착륙 |
| 21행성 전투레벨 표가 있나? | 있다. 정본은 `planet_hostile_red_progression` = `play_scenario_zone_planets` (동일 수치) |
| 수도·최종 보스 공략 수준이 TCL과 맞나? | **부분.** 권장 Lv 52~60은 표에 있으나, 적함 HP는 580~790(이터니티)·제네시스는 웨이브 침입자 HP 80. 총사령관 기함 2200은 웨이브에 안 들어감 |
| 메인퀘스트 전투가 존과 비슷하게 흐르나? | **부분.** `story_001` 전투 0. q02 미네르바(TCL7 fighter)·q04 베가(TCL3 cruiser)·q06 드라코(TCL9 cruiser) bind. 전멸·기함은 서사 |

---

## 1. 전투 4축 (섞지 말 것)

| 축 | 플레이어가 겪는 것 | 발화 | 적 시드 | 레벨 입력 |
|----|-------------------|------|---------|-----------|
| **A. 허브 일반전투** | 행성 궤도 Ready 후 교전 | `evaluateHubMainStageCombatEntered` — `mainStageCombatEnabled` + 궤도 RED | `resolveCombatFleetSlotsFromCaptains` — **`operationalState===combat`만** + 총사령관(옵션) · `hostileShipCount` 캡 | TCL은 **무기 곡선**만. HP는 함 CSV |
| **B. 웨이브 9판** | 카운트다운 → 3·6·12…(상한 12) | 분쟁 차례 / RED [전투] / 채팅 지정 / **`endgame_boss` 착륙** | 행성 `npc_cpt_enemy_*` 있으면 그 헐 순환. 없으면 `npc_wave_invader_tN` | TCL → 침입자 티어 공식. 행성 슬롯 있으면 **티어 공식 미사용** |
| **C. 차원항로 조우** | 성계 이동 중 인스턴스 | 확률 + 퀘스트 `transit_guaranteed` | 조우 시드 + 미션이면 `mission_combat_captains` | `resolveCombatEncounterTargetLevel` = 행성 TCL 또는 성계 시나리오 행 |
| **D. 퀘스트 전투** | 이동 중 1척 격파(`defeat_enemy`) | `mission_quest_combat_ops` | 템플릿+앵커 행성 함장 1명 | 미션 전용 난이도 컬럼 **없음** → 앵커 행성 TCL·함 CSV |

`tutorial_escape` · `draco_boss` 는 **웨이브 자동 발화가 아니다.**  
`evaluatePlanetWaveCombatTrigger` 의 웨이브 variant 화이트리스트는 `draco_wave` · `endgame_boss` 만.

드라코 시험 베뉴(`DRACO_COMBAT_TEST_VENUE_ENABLED`)는 **2026-09-16 OFF**. 강제 9웨이브·시험 동료 4척 없음.

---

## 2. 레벨 숫자 — 정본과 유사 숫자 (4개 스케일)

구현·표기 전에 **어느 칸을 말하는지** 고정한다. 네 숫자가 같은 행성에 동시에 있다.

| 스케일 | 정본 | 코어 범위 | 런타임 |
|--------|------|-----------|--------|
| **TCL `targetCombatLevel`** | `planet_hostile_red_progression.csv` (조회) · `play_scenario_zone_planets.csv` (존 표, 값 동일) | 1~60 | 무기 로드아웃 · 조우 레벨 · 침입자 티어(슬롯 없을 때) |
| **권장 파일럿 Lv** | `planet_leveling_progression.csv` `recommendedPilotLevel` | 1~60 (Zone 1~20) | 무역 밴드·기획 페이싱. **전투 시드 직접 입력 아님** |
| **성계 `systemEnemyLevel`** | `planets.csv` | 1~40 | 지도 패널 등 **표시**. TCL과 **불일치** |
| **함장/함 `combatLevel`** | `npc_ai_captains` · `npc_ai_ships` | 적함장 1~35 · 적함 5~33 · 제네시스 총수 60 | 함 HP/스탯 CSV. **TCL로 재스케일 없음** |

`planet_leveling_progression` 은 Zone 1~20만 있다. Zone 21 제네시스 행 **없음**(시나리오 TCL=60은 `play_scenario`에만).

`capital_ship_combat_level_class.csv` · `capital_ship_wave_tier_class.csv` 는 **src 런타임 import 0**. 설계 표.

---

## 3. `targetCombatLevel` 이 하는 일 / 안 하는 일

`resolvePlanetTargetCombatLevel` (`balanceTableRegistry.ts`) — hostile_red 행 우선, 없으면 synth 행, 기본 1.

| 적용 | 내용 |
|------|------|
| **함** | `resolveHostileEnemyWeaponLoadout(spawnIndex, combatLevel)` — `weapon_list.requiredLevel ≤ TCL` 최고 행. TCL≥13 이면 장거리 미사일 패턴 |
| **조우** | `resolveCombatEncounterTargetLevel` |
| **웨이브 폴백** | `waveDefenseInvaderTier = min(30, ceil(TCL/2) + wave - 1)` → `npc_wave_invader_tN` |

| 미적용 | 내용 |
|--------|------|
| 적 HP / 장갑 / 실드 | CSV `maxHp` × 숙련 × 일일 `globalEngageHpMul` 만 |
| 웨이브 침입자 t1~t30 | **전부 HP 80 · 실드 40 · 장갑 8**. 이름·CSV 무기칸만 다름. 무기는 다시 로드아웃이 덮음 |
| 미션 `levelRequired` | 수락 게이트. 적 스펙과 무관 |

즉 TCL은 **「이 존의 권장 난이도 라벨 + 무기 티어 캡」** 이지, 적 선체 곡선이 아니다.

---

## 4. 코어 21행성 전수 (일반 vs 웨이브)

점유 = `planet_occupation_seeds` 시드(런타임 홀드와 다를 수 있음).  
함장 Lv = `npc_ai_captains` 레벨. 함 HP = `npc_ai_ships` 대표값.  
허브 시드 = `operationalState=combat` 인 RED만(베가 1 · 드라코 3). 나머지는 허브 일반전에 **안 올라온다.**

| Z | 행성 | TCL | 권장Lv | 지도Lv | 변형 | 허브 | 웨이브 실기 | 점유시드 | 적 함장 | 함장Lv | 적함 HP(대표) | 비고 |
|---|------|----:|-------:|-------:|------|:----:|:-----------:|----------|---------|-------:|-------------:|------|
| 1 | `arcadia_prime` | 1 | 1 | 1 | `tutorial_escape` | ON | 자동 아님 | BLUE · 점령전투 OFF | 3 · **general** | 1 | 314 | 튜토리얼 탈출. 허브 RED 시드 공백 |
| 2 | `vega_base` | 3 | 3 | 3 | `draco_wave` | OFF | 어썰트/차례 | BLUE | 1 · **combat** | 4 | 356 | 허브 OFF. 함장Lv>TCL |
| 3 | `solar_station` | 5 | 5 | **2** | `draco_wave` | OFF | 어썰트/차례 | BLUE | 1 · general | 2 | 328 | 지도Lv 낮음 |
| 4 | `minerva_deep` | 7 | 7 | **3** | `draco_wave` | OFF | 어썰트/차례 | BLUE | 1 · general | 3 | 342 | q02 설계 전투 무대 |
| 5 | `draco_haven` | 9 | 9 | **7** | `draco_boss` | **ON** | 분쟁 차례·어썰트만 | BLUE · **분쟁** | 3 · **combat** | **1~3** | 314~342 | 라이브 허브 보스. 함장≪TCL |
| 6 | `eden_city` | 12 | 12 | **5** | `draco_wave` | OFF | 어썰트/차례 | BLUE | 1 · general | 5 | (eden함) | L1 종단 후보 |
| 7 | `iron_remnant` | 15 | 15 | **6** | `draco_wave` | OFF | 어썰트/차례 | BLUE | 3 · general | 6 | | |
| 8 | `sirius_border` | 18 | 18 | **10** | `draco_wave` | OFF | 어썰트(RED) | **RED** | 3 · general | 10 | | |
| 9 | `perseus_memorial` | 21 | 21 | **11** | `draco_wave` | OFF | 어썰트 | RED | 3 · general | 11 | | |
| 10 | `crimson_base` | 25 | 25 | **15** | `draco_wave` | OFF | 어썰트 | RED | 3 · general | 15 | | |
| 11 | `blood_station` | 28 | 28 | **18** | `draco_wave` | OFF | 어썰트 | RED | 3 · general | 18 | | |
| 12 | `helios_core` | 31 | 31 | **9** | `draco_wave` | OFF | 어썰트 | NEUTRAL | 3 · general | 9 | | 지도Lv 크게 낮음 |
| 13 | `titan_ruins` | 34 | 34 | **10** | `draco_wave` | OFF | 어썰트 | NEUTRAL | 3 · general | 10 | | |
| 14 | `omega_hub` | 37 | 37 | **8** | `draco_wave` | OFF | 분쟁+어썰트 | RED · **분쟁** | 3 · general | 8 | | 샌드박스 Lv8 vs TCL37 |
| 15 | `nightfall_citadel` | 40 | 40 | **19** | `draco_wave` | OFF | 어썰트 | RED | 3 · general | 19 | 566 | |
| 16 | `shadow_market` | 44 | 44 | **16** | `draco_wave` | OFF | 분쟁+어썰트 | NEUTRAL · **분쟁** | 3 · general | 16 | | |
| 17 | `dark_haven` | 48 | 48 | **17** | `draco_wave` | OFF | 어썰트 | RED | 3 · general | 17 | | |
| 18 | `abyss_gate` | 52 | 52 | **20** | `endgame_boss` | ON* | **착륙 즉시 9웨이브** | RED | 3 · general | 20 | 580 | 허브는 웨이브 중 억제 |
| 19 | `core_prime` | 56 | 56 | **30** | `endgame_boss` | ON* | **착륙 즉시 9웨이브** | RED | 3 · general | **30** | **720** | 크림슨 수도 성계 |
| 20 | `eternal_throne` | 60 | 60 | **35** | `endgame_boss` | ON* | **착륙 즉시 9웨이브** | NEUTRAL | 3 · general | **35** | **790** | 웨이브9 섀도우 복제 |
| 21 | `genesis_origin` | 60 | (표 없음) | **40** | `endgame_boss` | OFF | **착륙 즉시 9웨이브** | NEUTRAL | **npc_enemy 0** | 총수 60 | 침입자 80 / 총수함 2200 | 총수함은 웨이브 미편성 |

\* `mainStageCombatEnabled=true` 이나 `endgame_boss` 가 웨이브를 먼저 켠다. 허브 보스는 웨이브 세션이 끝난 뒤에만 이론상 가능.

`hostileShipCount`: Z1=1 · Z2~4·6=2 · 나머지 3. 함장이 더 있어도 허브는 이 수로 자른다.

---

## 5. 일반전투(허브) vs 웨이브 — 레벨링이 갈리는 지점

### 5-1. 허브 일반전투

1. 궤도에 `operationalState=combat` RED 함장이 있어야 시드가 생긴다.  
2. **라이브 combat RED**: `vega_base`(1) · `draco_haven`(3).  
3. 허브 ON 은 시나리오상 Z1·Z5·Z18~20. Z1은 combat 함장 없음 → **튜토리얼 허브 적이 비는 구조 구멍.** Z5만 허브 보스가 실제로 채워진다.  
4. 무기: 스폰 인덱스 %3 = A/B/C + TCL 곡선. 후반 적함 CSV가 아직 `w_laser_light_01` / `w_missile_standard_01` 이어도 **전투 중 덮어씀.**

### 5-2. 웨이브

| 웨이브 N | 동시 적 | 행성 슬롯 있을 때 | 슬롯 없을 때 (제네시스) |
|----------|--------:|-------------------|-------------------------|
| 1 | 3 | `npc_enemy_*` 순환 | t30 (TCL60 → ceil(30)+0) |
| 2 | 6 | 동일 헐 반복 | t30 |
| 3+ | 12 | 동일 | t30 |

난이도 상승은 **척수(3→12)** 가 본선. 선체 HP는 행성 고정이거나 침입자 80 고정.  
함장 id 폴백 침입자는 `npc_cpt_ai_robot_default` 한 명.

### 5-3. 점령 [전투] (RED 현지)

월드맵 [전투] → 착륙 + `planet_assault` → 웨이브 9판.  
TCL·적 헐은 그 행성 표. **이동중 조우가 아님**(2026-07 수정 유지).

---

## 6. 보스·수도 공략 (정밀)

기획 페이싱(`planet_leveling` · `01_10 레벨업구조`): Zone 5 드라코 = 초반 최종 보스(권장 Lv9, Shielded, 권장 프리깃 개량·T2 레이저). Zone 18~21 = 엔드.

### 6-1. 드라코 성운 헤이븐 (초반 보스 · 라이브 허브)

| 항목 | 표(시나리오) | 실기 편성 |
|------|--------------|-----------|
| 플레이어 필요 Lv | 9 | 수락 게이트 없음. 샌드박스 `sandbox_013` 만 Lv7 |
| 변형 | `draco_boss` · 허브 ON | 허브 궤도 3척. 착륙 강제 웨이브 **없음** |
| 함장 | — | 라스 베일(1) · 니아 크룩스(2) · 테온 모르(3) · **전부 combat** |
| 함 | hostile 3 · shielded | HP 314/328/342 · 실드 95~105 · 장갑 8~9 · `hull_cap_patrol_01` |
| 함 CSV 무기 | — | 01 `w_laser_arc_004`+`w_missile_arc_022` · 02 `arc_010`+`arc_003` · 03 `arc_019`+`arc_006` → **로드아웃이 TCL9로 재선택** |
| 메인퀘 q06 | 요새 포격+기함 데드코러스 | **`story_006` ready.** 조우 cruiser 1 · 소사 `questOnly` 대면. 기함 행 없음 |

**갭**: 권장 Lv9·DPS 900 vs 함장 Lv1~3·선체 초반 순찰급. 「보스」는 variant 이름과 허브 ON이지, 선체 곡선이 보스급이 아니다.

### 6-2. 어비스 게이트 (엔드 관문 · 착륙 웨이브)

- TCL 52 · 권장 Lv52 · 함장 Lv20 · 함 HP 580/실드 190/`hull_cap_raider_01` · 함 `combatLevel` 22  
- 착륙 = 9웨이브 × 위 3척 순환. 허브 일반전은 웨이브가 선점

### 6-3. 아크파이어 코어 프라임 (크림슨 수도 성계)

- TCL 56 · 권장 Lv56 · 지도Lv 30  
- 함장 아우렐 코어 등 Lv**30** · 함 HP **720**/240/장갑 18 · `hull_cap_line_01` · 함 combatLevel 31  
- `requiredFleetMinDps` 20,000 — 선체만 보면 중순양 이하. **수도 기함급 전용 행 없음**  
- 착륙 즉시 웨이브 9

### 6-4. 이터니티 스론 (최종 왕좌 · 섀도우)

- TCL 60 · 권장 Lv60 · 지도Lv 35 · affinity `boss_heavy`  
- 함장 크로노스 베일 등 Lv**35** · 함 HP **790**/265/19 · combatLevel 33  
- 웨이브 1~8: 위 3척. **웨이브 9 레드 슬롯 0**: 짝 유저 기함 스냅샷(`arcCoreShadowBossClone`). 없으면 CSV 침입자 폴백(무경고)  
- 공개 전 네임플레이트 위장. 헌법 §16-A

### 6-5. 제네시스 오리진 (대칭 종착)

- TCL 60 · 허브 OFF · `endgame_boss` 라 **착륙 웨이브는 켜짐**  
- `npc_cpt_enemy_genesis_*` **없음** → 침입자 t30 × 3~12, HP **80**  
- 총사령관 `npc_cpt_gov_genesis` 아르카노 원 Lv60 · `npc_gov_genesis_flagship` HP **2200**/880/42 · 무기 헤비+유도삼연 — **웨이브 빌더가 안 넣음**  
- 플레이어가 기대하는 「수도 수문장」과 실기 웨이브가 **완전히 갈라짐**

### 6-6. 무기·장착 수준 (전 후반 공통)

- 정책: A 중거리 레이저+로켓 / B 레이저+중·장거리 미사일 / C 로켓+미사일. TCL≥13 장거리 ON  
- 후반 적함 **장착 CSV는 여전히 입문 슬롯**인 행이 많음. 체감 화력은 로드아웃 곡선에 의존  
- `capital_ship_*_class` 로 체급을 올리는 경로는 **비활성**

---

## 7. 퀘스트 전투 vs 존 레벨

계층 잠금: `docs/EARLY_STORY_AND_QUEST_SPINE.md` — L1 튜토리얼 · L2 본편 · L3 캠페인 초안(런타임 아님).

### 7-1. L1 `mission_001`~`005` (라이브)

| id | 유형 | 요구Lv | 전투 | 앵커/목표 | 존 TCL | 정합 |
|----|------|-------:|:----:|-----------|-------:|------|
| 001 | travel | 1 | 없음 | 베가 | 3 | 이동만 |
| **002** | combat | 1 | **해적 1척 조우** | 아르카디아 | **1** | **맞음** |
| 003 | delivery | 2 | 없음 | 솔라→미네르바 | 5→7 | 무역 |
| 004 | explore | 3 | 없음 | 뉴에덴 | 12 | 이동만. TCL과 요구Lv 벌어짐 |
| 005 | explore | 5 | 없음 | 오메가 | 37 | 이동만. 심장치 대비 과소 |

라이브 튜토리얼 **전투는 Zone 1 한 번**. L3/`01_10` 의 베가 전면전·드라코 총수전은 **이식되지 않음**(스파인 금지와 일치).

### 7-2. L2 `story_001` (라이브 유일 본편)

솔라 도착 → 한로 대화 → 아르카디아 귀환 → 엘렌 → 이사 벤트.  
`defeat_enemy` 0 · `mission_quest_combat_ops` 0.  
동선 Zone 1↔3 (TCL 1~5)이나 **싸움 없음.**

### 7-3. 챕터1 본편 전투 (q01–q06 bind · 2026-09-23)

`docs/main_quest_template_v3_chapter1_complete.md`

| 슬롯 | 설계 전투 | 행성(planet) | 존 TCL | bind |
|------|-----------|------|-------:|------|
| q01 | 없음 | `arcadia_prime`↔`solar_station` | 1~5 | `story_001` ready |
| q02 | fighter 1 | `minerva_deep` | **7** | `story_002` ready |
| q03 | 없음 | `arcadia_prime`→`vega_base` | 3 | `story_003` ready |
| q04 | cruiser 1 · 전멸은 서사 | `vega_base` | **3** | `story_004` ready |
| q05 | 없음 | →`draco_haven` | 9 | `story_005` ready |
| q06 | cruiser 1 · 기함은 서사 | `draco_haven` | **9** | `story_006` ready |

q04 TCL3 < q02 TCL7 은 **의도**(전멸 연출 대행 1척). 지도 `systemEnemyLevel`과 TCL을 섞지 말 것.  
허브 `defeat_enemy` 연동은 handoff P2 잔여. q07+는 skeleton.

### 7-4. 샌드박스 전투 (라이브 · 스케일 붕괴)

`levelRequired` 상한 15. TCL은 60. 앵커 행성의 **존 전투 스펙을 그대로** 씀.

| 미션 | 요구Lv | 앵커 | TCL | 차 |
|------|-------:|------|----:|---:|
| sandbox_001 | 1 | 아르카디아 | 1 | 0 |
| 003 | 2 | 솔라 | 5 | +3 |
| 005 | 3 | 미네르바 | 7 | +4 |
| 007 | 4 | 베가 | 3 | −1 |
| 009~011 | 5~6 | 뉴에덴 | 12 | +6~7 |
| 013 | 7 | 드라코 | 9 | +2 |
| 015 | 8 | 오메가 | **37** | **+29** |
| 017 | 9 | 헬리오스 | 31 | +22 |
| 025 | 13 | 다크리프트 | 48 | +35 |
| 029 | 15 | 나이트폴 | 40 | +25 |

초반만 「거의 비슷」. 중후반은 **수락 Lv와 존 화력이 다른 게임**.

퀘스트 조우 적 1척(파이터/순양/현상금) vs 존 허브·웨이브 다수 — **구조도 다름.**

---

## 8. 신스 식민지

`synth_system_colonization.csv` 에 zoneIndex + TCL 이 있다. 조회는 `synth_NNN_p` 정규식.  
컴펜디엄 v1.0(2026-06-19) 신스 표(관측국 Zone1 전투Lv2 등)는 **현재 CSV와 불일치. 폐기하고 본 절+생성 CSV를 따른다.**

신스는 코어 21 페이싱을 **복제 배치**한 프런티어이지, 메인퀘 동선이 아니다.

---

## 9. 갭 목록 (패치는 다음 사이클)

우선순위는 대표님 확인 후. **이 문서만으로 CSV/코드를 바꾸지 않는다.**

| ID | 갭 | 축 |
|----|-----|-----|
| G1 | TCL·권장Lv 곡선 vs 함장Lv·함 HP 곡선 분리. 후반은 라벨만 높음 | A/B |
| G2 | 웨이브 침입자 t1~t30 HP 평탄(80). 제네시스 수도전이 약함 | B · 6-5 · **1차: 스케일 minHp 480** |
| G3 | 허브 시드가 `combat` 함장만 — Z1 튜토리얼 허브 적 공백. 대부분 행성은 허브 일반전 불가 | A |
| G4 | `tutorial_escape`/`draco_boss` 특수 로직 없음(이름만) | A |
| G5 | `capital_ship_*_class` 미사용 | 설계 |
| G6 | `planets.csv` 지도Lv ≠ TCL | 표시 |
| G7 | 메인퀘 q02/q04/q06 bind(각 1척). 전멸·기함 편성은 서사 대행 | D · q07+ skeleton |
| G8 | 허브/웨이브 승리 → `defeat_enemy` 행성 id 단독 완료(과잉) | D · **2026-09-21: 베뉴+템플릿 가드** |
| G9 | 샌드박스 `levelRequired` vs TCL 중후반 붕괴 | D · **1차: 전투 수락=권장Lv** |
| G10 | 드라코 보스 실편성(Lv1~3·HP~340) ≠ 권장 Lv9 보스상 | A · 6-1 |
| G11 | 코어/이터니티 수도함이 라인급 720~790. 제네시스 2200은 웨이브 밖 | B · 6-3~6-5 |
| G12 | 섀도우 보스 스냅샷 없으면 침입자 폴백 | B |
| G13 | leveling Zone21 행 없음 | 표 · **1차: 행 추가** |

---

## 10. 정본 파일

| 용도 | 경로 |
|------|------|
| 존 전투 행 | `tables/balance/play_scenario_zone_planets.csv` |
| 런타임 TCL/허브/변형 | `tables/balance/planet_hostile_red_progression.csv` |
| 권장 Lv·선체·무기 페이싱 | `tables/balance/planet_leveling_progression.csv` |
| 지도 적 레벨 | `tables/content/planets.csv` `systemEnemyLevel` |
| 적 로드아웃 | `tables/balance/hostile_enemy_weapon_loadout_policy.csv` |
| 적함·함장 | `npc_ai_ships.csv` · `npc_ai_captains.csv` |
| 웨이브 빌더 | `src/game/waveDefense/waveDefenseFleet.ts` |
| 허브 시드 | `src/combat/capitalRealtimeCombatGate.ts` |
| 조회 | `src/arcCore/balance/balanceTableRegistry.ts` |
| 미션 전투 | `missions.csv` · `mission_objectives.csv` · `mission_combat_captains.csv` · `mission_quest_combat_ops.csv` |
| L3 초안 | `docs/01_10 레벨업구조.csv` · `docs/levelup_story_merge.md` |
| 챕터1 전투 의도 | `docs/main_quest_template_v3_chapter1_complete.md` |
| 맥락 잠금 | `docs/EARLY_STORY_AND_QUEST_SPINE.md` |

---

## 11. 교차 문서

- 미션 인수인계: `docs/MISSION_SYSTEM_HANDOFF.md`
- 본편 골격: `docs/MAIN_STORY_CHAPTER_SPINE.md` · `docs/MAIN_QUEST_FOUNDATION.md`
- 행성 대백과: `docs/_000_ARCFIRE_PLANET_COMPENDIUM_v1.0_20260619.md` — **전투 숫자는 본 문서가 이김**(2026-09-17)
- 에이전트: `AGENTS.md` §미션

---

*전수 조사일 2026-09-17. 1차 연동 2026-09-18.*

---

## 12. 2026-09-18 권장안 1차 연동 (실 플레이 데이터 전)

권장 표(`planet_leveling_progression` · TCL)를 시뮬 정본으로 두고, **선체 CSV 원본은 유지**한 채 전투 시드·무역·수락 게이트만 맞췄다. 함 HP 일괄 덮어쓰기·웨이브 척수 변경·L3 메인퀘 신설은 하지 않았다.

| 축 | 한 일 | 플레이 데이터로 바꿀 곳 |
|----|--------|-------------------------|
| 무역 | 현재+다음 존 TCL 적 무장을 진열 예약. 캡 20→24 | `weapon_trade_base_price_policy` listing_count |
| 선체 | `planet_hostile_hull_scale.csv` 배율·제네시스 minHp 480 | 같은 CSV 숫자만 |
| 수락 | 샌드박스 **전투** `levelRequired` = 앵커 권장 Lv | `missions.csv` |
| 표 | leveling Zone21 행 추가(Lv60) | — |
| 유지 | 웨이브 3·6·12 · 드라코 허브 2 · 메인 002 · L3 skeleton | — |

테스트: `npx tsx src/combat/playScenarioZoneBalance.test.ts` · `earlyHubCombatBalance.test.ts`
