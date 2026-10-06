# 김플레이 → 김팀장 인계 — PB-G 2차 (게임 개선 4건)

- 작성: 김플레이 · 2026-10-06 18:40
- 상태: **REVIEWED** (2026-10-06) — G4·G6·G7 반영. G5 보류(함체 곡선 수치 미확정)
- 대표님 결정: 2026-10-06 18:33 — 4건 모두 승인
- 정본 목록: `docs/ops/차기_업무_목록.md` §10-2 (2차 · 닫힘)
- 조사 근거: `docs/playbot/PLAYBOT_FULL_AUDIT_20261006.md` §6-C

플레이봇 상시 하네스(D2994 · L41)가 시작 함선으로 7,586번 파괴된 원인을 조사하다 찾은 **게임 쪽** 항목이다. 봇 쪽 원인(A-9 a·b·c)은 김플레이가 따로 고친다. 아래 4건은 게임 코드·CSV라 김팀장 담당이다.

검토 요청: 아래 전제를 코드·CSV로 다시 확인해 주십시오. 틀린 곳이 있으면 이 문서에 정정을 남겨 주시면 김플레이가 트윈을 맞춥니다.

## 김팀장 정정 (2026-10-06)

- G4: 「Instant Kill」·치명 배율은 `CapitalWeaponCsvRow`에 없다. 전투는 `damage`를 `attackBonus = floor(damage × 0.8)`로 쓴다. 피해 999가 곡선을 깨는 원인이다. 진열 플래그와 적 곡선 id 제외만 반영했다. 무기 행·피해 999·특수 FX는 그대로다.
- G5: 보류. 원칙은 맞다. 전 함체 HP·주사위·가격을 한 번에 바꾸면 기존 전투·무역 값이 움직인다. 수치표 확정 전 CSV 없음.
- G6: 반영. 격침 시 `preservedEquipSlots`에 두고 다음 비포드 전함에서 되돌린다. 내구도 0%는 칸을 지우지 않는다. 성능 하락·강제 수리는 넣지 않았다. 0% 무기는 장착된 채로 기능한다. 선체 0% 출항 금지는 기존 그대로다.
- G7: 반영. 요격미사일 구매가 1,660(같은 레벨 미사일 성능 점수 대비, 무역소 표시 1,411). `battlecruiser_max` 체급가 20,000,000(L52 1,500만과 L65 2,500만 사이, 백만 단위). 무역소 진열 제외는 그대로다.

---

## PB-G4 — 전설 일격 무기 `w_laser_arc_029` 빼기

| 항목 | 내용 |
|---|---|
| 대상 | `tables/content/weapon_list.csv` 39행 `w_laser_arc_029` 「반물질 입자포」 |
| 현재 | 피해 999 · 주사위 「Instant Kill」 · 치명 x2(Natural20) · 등급 전설 · 요구 L17 · 142,500cr · `tradePortListed=TRUE`. 같은 계열(arc_019·030 등) 피해는 1~10 |
| 연관 | `weapon_trade_listing_policy.csv` rank 38 · `weapon_special_fx_policy.csv` antimatter · 적 무장 `resolveHostileEnemyWeaponLoadout` — **tcl17에서 적이 이 무기를 쓴다** |
| 판단 | 테스트값이 아니라 콘셉트 무기. L17에서 전투 곡선을 깬다 |
| 대표님 결정 | **빼기.** 무역소 진열 제외 + 적 tcl17 무장에서 제외. 전설 무기 재도입은 곡선 설계 후 |
| 확인 요청 | 실기 전투가 `damage` 999를 그대로 쓰는지, 「Instant Kill」을 별도로 해석하는지 |
| 완료 기준 | 진열 목록·적 로드아웃(tcl1~80 · 패턴 0~2)에 arc_029 없음 · `build:content-tables` · tsc |

## PB-G5 — 함선 등급 성능 곡선

| 항목 | 내용 |
|---|---|
| 대상 | `tables/content/npc_capital_ships.csv`(Player_* 함선 combat) · `capital_hull_purchase_policy.csv` · `capital_ship_trade_listing_policy.csv` |
| 대표님 결정 | **등급이 오르면 성능이 올라야 하고 요구 레벨에 맞춘다. 같은 등급은 파이터·레인저 성향만 다르고 총합은 비슷하다** (RPG 클래스와 같은 개념) |
| 현재 구조 | 같은 등급 파이터·레인저 쌍은 이미 있다 → 유지 |
| 현재 문제 | 아래 표. 등급이 올라도 거의 같고, 피해 주사위는 오히려 줄어든다 |

| 등급 | 요구 L | 값(cr) | 파이터 HP/실드/장갑/주사위 | 레인저 HP/실드/장갑/주사위 |
|---|---|---|---|---|
| frigate_default | 1 | 0 | 560/210/16/3d10+5 (`Player_npc_red_fleet_1`) | 72/88/11/1d8+1 (`Player_scout_ship`) |
| frigate_upgraded | 7 | 250,000 | — | 400/95/9/4d8+6 (`Player_frigate_mk2`) |
| destroyer | 15 | 1,200,000 | 600/250/18/3d10+6 | 450/125/10/4d8+6 |
| destroyer_upgraded | 25 | 1,800,000 | 580/220/17/3d10+6 | 480/135/11/4d8+7 |
| cruiser | 31 | 5,000,000 | 600/235/17/2d12+7 | 470/140/11/4d8+7 |
| cruiser_upgraded | 40 | 7,500,000 | 610/240/17/2d12+8 | 490/148/12/4d8+8 |
| battlecruiser | 52 | 15,000,000 | 620/245/18/2d12+6 | 500/155/12/4d8+8 |
| battlecruiser_max | 60 | 0 | 640/255/18/2d12+6 | 520/165/13/4d8+9 |
| dreadnought | 65 | 25,000,000 | 680/265/19/2d8+3 | 540/175/13/4d8+9 |
| super_capital | 72 | 50,000,000 | 800/295/20/2d8+3 | 580/190/14/4d8+10 |
| apex_legend | 80 | 100,000,000 | 880/320/21/2d8+3 | 620/205/15/4d8+11 |

- 25만cr `Player_frigate_mk2`가 시작 함선보다 약하다. 봇은 이 함선을 66번 사서 잃었다.
- 실기 파이프라인은 원시값에 숙련도 배율만 곱한다(`calculateShipPerformance`). 등급 보정은 없다.
- 적 쪽 비교 기준: 적 무장 DPS는 tcl에 따라 오른다(예: tcl30 레이저 18 · tcl50 레이저 82). 적 함선 HP는 대체로 560 안팎이다.
- 작업 분담 제안: 곡선 설계와 수학 검증은 Fable(Table-First), 연동·검수는 김팀장.
- **기존값 변경**은 대표님이 원칙을 승인했다. 구체 수치표는 대표님께 한 번 보여 드리는 것을 권장한다.
- 완료 기준: 등급마다 총합 성능이 단조 증가 · 같은 등급 파이터·레인저 총합 차이가 작음 · 웨이브 전용 `player_wave_ship`은 제외.

## PB-G6 — 기함 파괴 시 장착 복원 · 내구도 0 소멸 차단

| 항목 | 내용 |
|---|---|
| 대표님 결정 | **장비는 유지한다.** 장비 파괴 운영은 추후 결정하되, 플레이어 손실이 크므로 **일단 막는다** |
| 현재 1 | 장비는 인벤토리에 남는다. 생존포드로 갈아탈 때 `buildSurvivalPodShip`이 `equipSlots: {}`로 장착만 푼다(`src/game/playerSurvivalPod.ts`) |
| 요청 1 | 다음 함선 탑승 때 직전 장착 구성을 복원한다(인벤토리에 남은 같은 아이템 기준). 방식은 김팀장 판단 |
| 현재 2 | 내구도가 있다. 장비 전투당 약 0.1%p(해시 ±), 선체 0.2~0.8%p. **0%가 되면 인벤토리 칸을 지우고 장착을 푼다** — `applyPostCombatDurabilityPass`(`src/game/durability/durabilityModel.ts` 199~203행) |
| 요청 2 | 0% 소멸을 막는다. 대안(예: 0%면 성능 저하·수리 필요 상태)은 김팀장 제안 |
| 주의 | 플레이어 계정 귀속 데이터. 영속 store 신규 시 purge·생성 연동 확인 |

## PB-G7 — 가격 0 해소

| 대상 | 현재 | 비고 |
|---|---|---|
| `w_intercept_missile_01` 요격미사일 | `weapon_list.csv` 13행 구매가 0 · `tradePortListed=TRUE` · 진열 rank 9 | 방위위성 기본 탑재 무기(`planet_defense_satellite_policy.csv default_weapon_id`) |
| `battlecruiser_max` | `capital_hull_purchase_policy` 구매가 0 · 요구 L60 | 함선 `Player_battlecruiser_apex` · `Player_raptor_bc_apex` |

- 대표님 결정: **테스트용이 아니면 모두 가격이 있어야 한다.** 둘 다 테스트용 아님.
- 금액은 김팀장이 곡선에 맞춰 제안하고 대표님이 확인한다.
- 그 밖에 진열 무기·장비 중 가격 0은 없다(생성 테이블 조회 기준).

---

## 공통 게이트

- 코딩 전 `[pss-pre-dev]` 3줄. G6은 store·persist 경로라 P5·P6 해당.
- CSV 변경 후 `npm run build:content-tables` · `npx tsc --noEmit -p tsconfig.client.json`.
- 완료하면 `docs/ops/차기_업무_목록.md` §10-2의 [상태]를 바꿔 주십시오. 김플레이가 반영 여부를 확인하고 트윈을 맞춥니다.

## 김플레이 쪽 (참고 · 김팀장 작업 아님)

- A-9a: 함선 예비금이 무기·장비 구매를 막는 문제
- A-9b: 방어 장비·스킬·숙련 HP·내구도·파괴 후 장착/귀환을 트윈 승률에 반영
- A-9c: 적을 전멸시켜도 패배로 나오는 판정
- G4~G7이 반영되면 트윈도 같이 맞춘다.
