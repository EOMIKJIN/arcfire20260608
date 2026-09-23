# 무기체계 전수검사 · 드론/함재기 개발 현황 파악 (1단계, 분석 전용)

```text
status=ANALYSIS_ONLY (1단계 — 김팀장 개발 완료 후 2단계 재검사 예정)
task_id=weapon-drone-carrier-system-inventory-20260913
kind=SYSTEM_INVENTORY
code_changes=NO
author=김클로드
date=2026-09-13
trigger=대표님 — 드론·함재기 기초연출·기능 개발 진행 중. 먼저 전체 무기체계 전수검사 + 개발 현황 파악. 완료되면 2단계 재검사·보고.
```

## 0. 결론 먼저

**드론·함재기는 "이제 막 시작"이 아니라 상당히 깊은 곳까지 이미 구현돼 있다.** 데이터(CSV 튜닝)·시뮬레이션 엔진·렌더링 3층 전부 코드가 존재하고 유닛테스트도 통과한다. **아직 안 된 딱 한 가지**: 이 전부가 지금은 **"드라코 VMock" 테스트 전용 함선에서만** 동작하고, **실제 플레이어가 붙는 진짜 전투 시뮬레이션에는 아직 연결이 안 됐다.** 대표님이 말씀하신 "각 무기리스트에 맞게 추가개발 진행 중"은 바로 이 마지막 연결 작업을 가리키는 것으로 보인다.

## 1. 전체 무기체계 인벤토리 (`tables/content/weapon_list.csv`)

| 구분 | 개수 | 무기분류(종류) |
|------|------|----------------|
| 프로덕션 무기(`tradePortListed=TRUE`) | 82개 | laser·missile·rocket·drone·carrier |
| 테스트 무기(`tradePortListed=FALSE`, 웨이브디펜스·VMock) | 12개 | 레벨1 고정 스탯 |

**프로덕션 드론(7개)**: `w_missile_arc_003`(요격 드론 군집, Lv1) · `w_missile_arc_016`(스파이크 와이어, Lv9) · `w_missile_arc_017`(가속 돌격기, Lv9) · `w_missile_arc_025`(전술 무인기 편대, Lv15) · `w_missile_arc_034`(자율 기동 댄싱, Lv20) · `w_missile_arc_053`(아차원 수용, Lv40) · `w_missile_arc_070`(엔트로피 종말, Lv60) — 레벨 전 구간에 고르게 분포.

**프로덕션 함재기(5개)**: `w_missile_arc_006`(범용 폭격, Lv2) · `w_missile_arc_027`(침투형, Lv15) · `w_missile_arc_036`(아다만틴, Lv20) · `w_missile_arc_043`(무한 기동, Lv27) · `w_missile_arc_071`(유니버스, Lv60).

**신규 테스트 슬롯(10개, `등급라벨=테스트`)**: "드라코 VMock 01~10" — 레이저 5 + 함재기 5(홀수 번호) / 레이저 5 + 드론 5(짝수 번호) 쌍으로 구성. `tradePortListed=FALSE`(상점 비노출, 순수 테스트용). 이게 어제(09-11~12) PSS 조사에서 발견한 `dracoCombatTestVenue.ts`(`draco_haven` 행성)와 정확히 같은 계열 — **오늘 조사 대상(드론·함재기 개발)과 어제 발견한 이슈(테스트 벤이 프로덕션 가드 없이 라이브)가 같은 기능의 앞뒷면**이다.

## 2. 드론·함재기 개발 3층 구조 — 층별 완성도 실측

### 층 1 — 데이터/튜닝 (`tables/balance/weapon_craft_loiter_policy.csv`): **완료**

패밀리 기본값(drone/carrier 각 1행) + 12개 프로덕션 무기 전부(7드론+5함재기) 개별 오버라이드 행이 이미 존재한다. 전부 플레이버 텍스트와 수치가 일치하도록 손으로 튜닝된 흔적이 뚜렷하다 — 예: "가속 돌격기"(kamikaze) 프로필은 `pierceAfterStrike=1`+`pierceMs=280`(관통 자폭), "아차원 수용 드론"(contain)은 `aoeRadiusPx=48`+`slowMul=0.5`+`slowMs=6000`(광역 격리) 등 이름값에 맞는 파라미터가 다 들어가 있다.

### 층 2 — 시뮬레이션 엔진 (`src/combat/capitalCraftPool.ts`): **완료 + 테스트 통과**

- FSM 7단계(`dead/approach/orbit/strike/figure8/rtb/pierce`), 드론 전용 tick(`tickDrone`)·함재기 전용 tick(`tickCarrier`) 분리 구현.
- 특수 플래그(orbitAttack·ignoreShield·aoeRadiusPx·pierceAfterStrike·ramThenRtb·interceptMissiles·slowMul/slowMs) **전부** 실제 분기 처리됨 — CSV에 값만 있고 코드가 안 읽는 죽은 컬럼 없음.
- 사전할당 풀(`CAPITAL_CRAFT_POOL_SIZE=16`=드론8+함재기8) + 사전할당 impact scratch 버퍼 — **틱마다 신규 객체/배열 생성 없음**(파일 헤더 주석에 명시, 실제로 확인됨) — 이 프로젝트의 메모리 원칙(Zero-Allocation)을 정확히 지킴.
- `npx tsx --test src/combat/capitalCraftPool.test.ts` 직접 재실행 — **5/5 PASS**(드론 원궤도→돌입, 함재기 8자→귀환, 패밀리/소유자 상한, 표적 격침 시 드론은 잔여돌입·함재기는 즉시귀환).

### 층 3 — 렌더링 (`src/components/planet/PlanetEdenRaidOrbitSkiaCombat.tsx`, 899-921행): **완료**

실제 **프로덕션 전투 Skia 렌더러**(테스트 파일 아님) 안에 드론(붉은 원)·함재기(보라 8자형 오벌) 그리기 코드가 이미 들어가 있다. `ensureCraftOval(pools)`로 오벌 Path를 재사용하고 `writeNovaHeadOvalAlongTangent`로 좌표만 갱신 — **프레임마다 Skia `Make()`/신규 Path 생성 없음**, CLAUDE.md 금지 3번 항목을 정확히 지킴.

### 층 4 — 실제 전투 연결: **여기가 미완성**

`tickCapitalCrafts`·`trySpawnCapitalCraft`·`createCapitalCraftPool` 호출부를 전수 grep한 결과 **`src/components/planet/PlanetEdenRaidTestLayer.tsx`(드라코 테스트 벤) 단 한 곳뿐**이다. `crafts` 배열 자체를 참조하는 파일도 이 테스트 레이어와 공용 렌더러(층3) 딱 2개뿐 — **실제 플레이어가 진짜 적과 붙는 본선 전투 시뮬레이션 훅에는 드론·함재기 스폰/틱이 아직 연결돼 있지 않다.** 렌더러는 "누가 `crafts`를 채워주든 그릴 준비가 됐다"는 상태이고, 그 "채우는 역할"이 지금은 테스트 벤에서만 일어난다.

`capitalWeaponPipeline.ts` 파일 헤더의 자체 상태표(2026-09 기준)는 drone/carrier 모두 "연출 O · 전투 O"라고 적어놨는데, 이건 **테스트 벤 기준으로는 맞고 본선 기준으로는 아직 이른** 표기로 보인다 — 문서(주석)와 실제 배선 범위가 살짝 앞서 있다는 점도 참고사항으로 기록해둔다.

## 3. `weapon_family_runtime_policy.csv` — 패밀리별 구현 상태 플래그

```
laser,instant_beam,target_track,laser_dodge,laser_beam,active
missile,bezier_guided,target_track,default,missile_trail,active
rocket,straight_fixed,spread_circle,rocket_spread,rocket_bolt,active
drone,orbit_loiter,spread_circle,drone_burst,drone_sprite,active
carrier,arc_loiter_turn,spread_circle,carrier_bomb,carrier_wing,active
```

`implementationStatus` 컬럼이 5개 패밀리 전부 `active`다. 코드(`capitalWeaponRuntimeSpec.ts`)에는 `effectPending`이라는 "아직 준비 안 됨" 상태값도 이미 설계돼 있어(그러면 로켓 스텁으로 폴백) — 즉 **"진행 중" 단계를 표현할 수 있는 스위치가 이미 있는데, 지금은 둘 다 `active`로 표시돼 있다.** 이건 테스트 벤에서의 검증 결과를 반영한 것으로 보이며, §2-층4의 "본선 미연결"과는 별개 축(패밀리 자체의 연출/판정 로직 완성도 vs 실제 스폰 트리거 배선 여부)이다.

## 4. "아이템으로 탑재될 무기" — 확인

`item_defs.csv`에도 "드론"이 들어간 항목이 있으나(`eq_mining_drone_1~3`, `tg_084`) 이건 **채굴 장비·교역품**이지 전투 드론/함재기 무기와 무관하다(이름만 겹침, 다른 축). 전투용 드론·함재기 무기는 `weapon_list.csv` → 함선 무기 로드아웃 슬롯(`capital_ship_loadout_profile` 계열)으로 장착되는 별도 체계다 — 헷갈리지 않도록 확인해둔다.

## 5. 2단계 계획 (김팀장 개발 완료 후)

대표님 지시대로, 2단계는 김팀장의 "각 무기리스트에 맞게 추가개발"(가장 유력하게는 §2-층4 본선 연결 작업으로 추정)이 끝난 뒤 진행한다. 그때 다시 열어볼 지점을 지금 미리 적어둔다:

1. `tickCapitalCrafts`/`trySpawnCapitalCraft` 호출부가 테스트 레이어 밖(본선 전투 훅)에도 생겼는지 재grep.
2. 본선에 연결됐다면, 스폰 트리거가 어느 무기(laser/missile/rocket와 동일한 발사 큐)에서 오는지, 발사 주기·재장전(weapon_list.csv의 재장전ms)과 CapitalCraft 풀 상한(poolHardCap=8)이 상충하지 않는지.
3. 어제 발견한 이슈(드라코 테스트 벤이 `__DEV__` 가드 없이 라이브)가 이번 개발 완료 시점에 같이 정리됐는지 — 본선 연결이 끝나면 테스트 벤 자체를 가드 처리하거나 정리하는 게 자연스러운 타이밍.
4. 신규 12개 CSV 프로필의 밸런스(특히 kamikaze/contain/entropy 등 특수 플래그 조합)가 실제 플레이 밸런스에 문제 없는지.
5. `capitalCraftPool.test.ts` 외에 본선 연결부에 대한 신규 테스트가 추가됐는지.

## 6. 지금 하지 않은 것

이번엔 1단계 조사만이다. 코드는 건드리지 않았다. 김팀장의 개발이 "완료"로 확인되면 §5 체크리스트로 2단계 전수검사를 진행하고 결과를 보고한다.

**END(1단계)** — 2026-09-13 · 김클로드
