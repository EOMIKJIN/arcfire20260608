# 김클로드 — PB-G4 마무리 확인 · PB-G5 함선 등급 성능 곡선 수치안 (2026-10-10)

- 작성: 김클로드(서브리더) · 배정: 김플레이(메인리더) · 대표님 승인 근거: 10-06 18:33
- status: **PENDING** — 김플레이 검수 요청 · **commit 금지**
- worktree: `D:\arcfire20260607\.claude\worktrees\agent-a3990b9ae0bdb47d3`
  - 기준선: `ef73253` + 메인 체크아웃 미커밋 WIP(`src` · `tools/play-bot-console` · `tables`, 10-10 15:40경)을 그대로 복사해 둔 상태. A-9 플레이봇 변경이 메인에만 미커밋으로 있어서 벤치 기준을 맞추려고 그렇게 했다. **내 산출물은 이 리포트 1개뿐.** CSV·generated 임시 변경은 전부 되돌렸고, `npc_ai_ships.csv`가 HEAD와 같은 것도 확인했다.
  - `node_modules`는 메인 체크아웃으로 연결한 junction이다(추적 대상 아님).

---

## 1. PB-G4 — `w_laser_arc_029`(피해 999)를 적 무장에서 제외

### 판정: **이미 제외되어 있음 · 이번에 수정한 파일 없음** (재검수 결론 AGREE, 단서 1건)

| 확인 항목 | 근거 |
|---|---|
| 적 무장 자동 선택 경로는 하나뿐 | `src/components/planet/PlanetEdenRaidTestLayer.tsx:2681` `resolveHostileEnemyWeaponLoadout(r, loadoutLevel)`. 적대 NPC·웨이브·이동중 조우가 모두 이 분기(`!isPlayerSlot`, shadowBoss 아님)를 지난다. 그 밖에 `CAPITAL_WEAPON_LIST_FROM_CSV`를 레벨로 고르는 곳은 없다(grep: `hostileEnemyWeaponLoadoutFromBalance.ts:43`뿐) |
| 곡선에서 제외 | `src/combat/hostileEnemyWeaponLoadoutFromBalance.ts:31-32` `isCurveEligibleWeaponId`: `if (id === 'w_laser_arc_029') return false;` — 김팀장이 반영했고 `0ea9a58`(10-07 스냅샷)에 커밋됨 |
| 진열 제외 | `tables/content/weapon_list.csv:39` `tradePortListed=FALSE` → generated `csvWeapons.ts` `tradePortListed: false`. 무역소 선반은 `isCanonicalTradePortWeapon`(`src/arcCore/balance/weaponTradeListingPolicy.ts:68-71`)이 `tradePortListed===true`로 거른다. `weapon_trade_listing_policy.csv`에 rank 38 행이 남아 있어도 진열되지 않는다. 도전 무기(`listChallengeWeaponIdsForZone`)도 같은 함수로 거른다 |
| 테스트 | `npx tsx src/combat/hostileEnemyWeaponLoadoutFromBalance.test.ts` → **all PASS**. 「전설 일격 arc_029 는 적 곡선에 없다」 케이스가 tcl 1~80 × 패턴 3을 전수 확인한다 |
| 감사 기록(§6-C) 재현 | 제외 조건을 빼고 같은 곡선을 돌리면 **tcl 17에서만** 레이저가 `w_laser_arc_029`로 잡힌다(lv17, 피해 999). tcl 18부터는 `w_laser_arc_030`이다. 현재 tcl 17은 `w_laser_arc_020`(lv16)으로 내려간다. 감사 기록은 맞았고, 지금은 해소된 상태다 |
| 그 밖의 경로 | NPC 장착 CSV(`npc_ai_ships.csv`)에 해당 id 0건. 셰도우 보스(`resolveArcCoreShadowBossOverride`)는 플레이어 함선을 복제하는 경로라 레벨 곡선을 쓰지 않는다 |

**단서(PARTIAL 사유): Table-First 위반이 남아 있다.** 제외 조건이 코드에 id로 박혀 있다(`:32`). 같은 함수의 `'wave'`·`'vmock'` 부분 문자열 제외도 코드 하드코딩이다(`:30`). 이번 지시 범위가 「포함되어 있으면 최소 수정」이어서 손대지 않았다. 데이터로 옮기려면 둘 중 하나를 고르면 된다.
- (a) `hostile_enemy_weapon_loadout_policy.csv`에 `curve_excluded_weapon_ids` 키를 **신규 행**으로 추가한다(기존 값 변경 아님). `getHostileLoadoutPolicyValue`로 읽는다.
- (b) `weapon_list.csv`에 `hostileCurveEligible` 열을 신규로 추가한다.

`tradePortListed=FALSE`를 그대로 「적 미사용」으로 쓰면 결과 집합은 지금과 같다(FALSE 21행 = vmock 20 + arc_029). 하지만 「진열 안 함」과 「적이 안 씀」은 다른 뜻이라 권하지 않는다. → 김플레이 판단. ETC 백로그 후보.

---

## 2. PB-G5 — 함선 등급 성능 곡선 수치안 (제안서 · **CSV 적용 금지**)

### 2-1. 현황 재검수 (a9 R2 · 감사 §6-C) — AGREE

트윈 `playerCombatPower`(= 유효HP × DPS ÷ 받는 피해 배율, `tools/play-bot-console/src/liveCombat.ts:337`)로 다시 쟀다. 기준은 시작함 `Player_npc_red_fleet_1`(560/210, 3d10+5)이고, 같은 레벨에서 비교했다.

| 등급 | 가격 | 요구Lv | 현재 기본함(파이터) 배율 | 현재 대체함(레인저) 배율 |
|---|---:|---:|---:|---:|
| frigate_upgraded (`Player_frigate_mk2`, 레인저 단독) | 25만 | 7 | **0.59** | — |
| destroyer | 120만 | 15 | 1.02 | 0.69 |
| destroyer_upgraded | 180만 | 25 | 0.95 | 0.76 |
| cruiser | 500만 | 31 | 0.92 | 0.74 |
| cruiser_upgraded | 750만 | 40 | 1.10 | 0.80 |
| battlecruiser | 1,500만 | 52 | 0.94 | 0.82 |
| battlecruiser_max | 2,000만 | 60 | 0.98 | 0.88 |
| dreadnought | 2,500만 | 65 | **0.83** | 0.91 |
| super_capital | 5,000만 | 72 | 1.18 | 1.01 |
| apex_legend | 1억 | 80 | 1.58 | 1.29 |

a9 R2 수치(0.57~0.59 / 0.83~1.10 / 1.17 / 1.57)와 일치한다. 원인은 세 가지다.
1. HP+실드가 770 → 1,200으로 사실상 평평하다.
2. 드레드노트·슈퍼캐피털·아펙스 주사위가 **2d8+3(평균 12)**로 시작함(21.5)보다 낮다.
3. 레인저 대체함은 EHP가 파이터의 70~80%다.

실기 피해 모델(`PlanetEdenRaidTestLayer.tsx:2377-2390`)에서는 **한 발 피해 = 선체 주사위 + 무기 damage + strMod**다. 그래서 주사위는 모든 무기의 매 발에 더해지는 선체 공격력이다.

### 2-2. 설계 규칙 (대표님 승인 방향 「등급·레벨 따라 상승, 같은 등급은 파이터·레인저 성향만 차이」)

**R1. 가격 대비 전투력 곡선 (멱함수, 체감 수익)**
`M(price) = 1.30 × (price / 250,000)^α`, α = ln(6.0/1.3) / ln(400) = **0.255**
- 기준점: 프리깃 개량형 25만 = 1.30배(플레이봇 구매 문턱 +25%를 넘는 최소치), 아펙스 1억 = 6.0배.
- 뜻: 가격이 2배가 되면 전투력은 약 +19%다. 가격은 400배인데 전투력은 4.6배에 그친다. 고가 함선은 「사치재」 곡선을 따른다.
- 적 곡선과 맞춘 근거는 §2-5에 있다. 후반 구역(tcl 52~60)은 장비 없이 이기려면 8~12배가 필요하다. 장비·스킬 배율(피해감소 하한 0.65×0.6 등, 약 ×2~3)을 빼면 선체 몫이 4~6배다.

**R2. 배율 분해 (선체가 책임지는 축만 올린다)**
- EHP(maxHp+maxShield) = 770 × M^**0.9**. HP:실드 비율은 시작함과 같은 73:27로 둔다.
- 주사위 평균 = 21.5 × M^**0.3**. count/sides는 그대로 두고 **damageDiceBonus만** 조정한다.
- **armor·attackBonus·str/dex·sizeClass·속도·쿨다운은 그대로 둔다.** 이유: armor는 AC(`defenseAc = 10 + size + dexMod + armor`, `:1044`)에 들어가 1점에 명중 약 5%p가 바뀐다. 너무 민감하다. 현재도 등급별로 16→21까지 이미 오른다.

**R3. 파이터/레인저 성향 규칙 (같은 등급)**
- 파이터(기본함) = 등급 예산 100%: EHP 1.00 · 주사위 1.00.
- 레인저(대체함) = EHP **×0.85** · 주사위 **×1.10**. 기존 기동 우위(속도 +35%, 쿨다운 jitter −45%, `ShipPerformanceCalculator` 레인저 감지·쿨다운 보정)는 그대로 둔다.
- 가격은 기존 성능가 공식(`capitalShipPerformancePricing.ts` 등급가 × clamp(성능점수 비, 0.88~1.14))이 자동으로 정한다. 레인저는 기본함가의 약 0.88~0.89배가 된다.
- 예외: 대체함이 없는 단일 함선 등급(frigate_upgraded = 레인저 `Player_frigate_mk2`)은 EHP 100%(등급 예산 전액)를 받고, 주사위만 레인저 ×1.10을 받는다.

**R4. 무장 슬롯**: 무기 4칸(`COMBAT_WEAPON_SLOT_IDS`, `src/game/combatWeaponSlots.ts:8`)은 전 함선 공통이라 **그대로 둔다**. 비무기 장비 칸(`equipCapacity`)은 함선을 사도 바뀌지 않는다(`applyNpcCapitalShipPurchase.ts`에 갱신 없음). 등급별로 늘리려면 코드 변경과 신규 열이 필요해 이번 안에서 뺐다(결정 D7).

### 2-3. 제안 수치표 (변경 열: `maxHp`, `maxShield`, `damageDiceBonus` 3개 · 19행)

| 등급 | 가격 | 목표 M | 함선 | 성향 | maxHp | maxShield | 주사위 | 트윈 실측 배율(현재 → 제안, 같은 무기) |
|---|---:|---:|---|---|---|---|---|---|
| frigate_upgraded | 25만 | 1.30 | Player_frigate_mk2 | 레인저(단독) | 400→**710** | 95→**265** | 4d8+6→**+8** | 0.59 → **1.22** |
| destroyer | 120만 | 1.94 | Player_destroyer_mk1 | 파이터 | 600→**1015** | 250→**380** | 3d10+6→**+10** | 1.02 → **2.05** |
| | | | Player_hunter_mk1 | 레인저 | 450→**865** | 125→**325** | 4d8+6→**+11** | 0.69 → 1.57 |
| destroyer_upgraded | 180만 | 2.15 | Player_destroyer_mk2 | 파이터 | 580→**1115** | 220→**420** | 3d10+6→**+11** | 0.95 → **2.24** |
| | | | Player_hunter_mk2 | 레인저 | 480→**950** | 135→**355** | 4d8+7→**+12** | 0.76 → 1.72 |
| cruiser | 500만 | 2.79 | Player_cruiser_mk1 | 파이터 | 600→**1410** | 235→**530** | 2d12+7→**+16** | 0.92 → **2.81** |
| | | | Player_shadow_cruiser_mk1 | 레인저 | 470→**1200** | 140→**450** | 4d8+7→**+14** | 0.74 → 2.13 |
| cruiser_upgraded | 750만 | 3.10 | Player_cruiser_mk2 | 파이터 | 610→**1550** | 240→**580** | 2d12+8→**+17** | 1.10 → **3.14** |
| | | | Player_shadow_cruiser_mk2 | 레인저 | 490→**1315** | 148→**495** | 4d8+8→**+15** | 0.80 → 2.42 |
| battlecruiser | 1,500만 | 3.70 | Player_battlecruiser_mk1 | 파이터 | 620→**1815** | 245→**680** | 2d12+6→**+19** | 0.94 → **3.48** |
| | | | Player_raptor_bc_mk1 | 레인저 | 500→**1545** | 155→**580** | 4d8+8→**+17** | 0.82 → 2.52 |
| battlecruiser_max | 2,000만 | 3.98 | Player_battlecruiser_apex | 파이터 | 640→**1940** | 255→**730** | 2d12+6→**+20** | 0.98 → **3.71** |
| | | | Player_raptor_bc_apex | 레인저 | 520→**1650** | 165→**620** | 4d8+9→**+18** | 0.88 → 2.66 |
| dreadnought | 2,500만 | 4.21 | Player_dreadnought_mk1 | 파이터 | 680→**2045** | 265→**765** | 2d8+3→**+24** | 0.83 → **3.96** |
| | | | Player_phantom_dreadnought_mk1 | 레인저 | 540→**1735** | 175→**650** | 4d8+9→**+18** | 0.91 → 2.80 |
| super_capital | 5,000만 | 5.03 | Player_super_capital_mk1 | 파이터 | 800→**2395** | 295→**900** | 2d8+3→**+26** | 1.18 → **4.76** |
| | | | Player_phantom_super_capital_mk1 | 레인저 | 580→**2035** | 190→**765** | 4d8+10→**+20** | 1.01 → 3.31 |
| apex_legend | 1억 | 6.00 | Player_apex_legend_mk1 | 파이터 | 880→**2810** | 320→**1055** | 2d8+3→**+28** | 1.58 → **5.72** |
| | | | Player_phantom_apex_legend_mk1 | 레인저 | 620→**2385** | 205→**895** | 4d8+11→**+22** | 1.29 → 3.96 |

- 「트윈 실측 배율」은 요구 레벨에서 시작함과 **같은 tcl 곡선 무기**를 낀 상태로 비교한 값이다. 레인저가 낮게 나오는 것은 트윈이 선체 쿨다운 jitter·속도·사거리를 모델링하지 않기 때문이다. 실기에서는 기동 우위로 메운다고 가정했다(검증 필요, 리스크 5).
- 변경 후 무역소 가격(성능가 공식 재현): 파이터는 등급가 그대로다. 레인저는 hunter_mk1 1,060,996 · hunter_mk2 1,606,971 · shadow_c1 4,459,700 · shadow_c2 6,707,058 · raptor_bc1 13,309,326 · raptor_apex 17,757,421 · phantom_dread 22,024,629 · phantom_super 44,000,000(하한 0.88) · phantom_apex 88,000,000(하한 0.88)이다.
- 변경 대상이 아닌 행: `Player_npc_red_fleet_1`(시작함·기준), `Player_scout_ship`(D5), `Player_freighter`(survival), `player_wave_ship`(웨이브 테스트함, 제외 지시).

**적용 시 diff 형태(예시 3행 · 해당 열만)**
```
 tables/content/npc_ai_ships.csv
 id                        maxHp  maxShield  damageDiceBonus
-Player_frigate_mk2         400     95        6
+Player_frigate_mk2         710    265        8
-Player_destroyer_mk1       600    250        6
+Player_destroyer_mk1      1015    380       10
-Player_apex_legend_mk1     880    320        3
+Player_apex_legend_mk1    2810   1055       28
```
적용 순서(승인 후): ① `npc_ai_ships.csv` 19행 3열 수정 → ② `npm run build:content-tables`(generated `csvNpcCapitalShips`·`csvShipTemplates`·`csvItemDefs` 갱신) → ③ `tools/ship-upgrade-value/run-ship-upgrade-value.ts` 재생성(`capital_ship_max_upgrade_value.csv`는 생성물이라 직접 편집 금지) → ④ `npx tsc --noEmit -p tsconfig.client.json` · `play-bot-console.test.ts` · 무역 관련 테스트(`waveDefenseTestTradeFlow.test.ts` 등). 재현 스크립트(제안값 계산·임시 적용)는 scratchpad의 `pbg5_propose.cjs`에 있다. 필요하면 `tools/`에 옮겨 둘 수 있다.

### 2-4. 플레이봇 벤치 (`npx tsx tools/play-bot-console/bench-bot.ts 600 4`, 같은 시드 · 임시 적용 후 원복)

| 지표(4시드 평균) | 현재 | 제안 적용 |
|---|---:|---:|
| level / quests / story | 21 / 74 / 11 | 21(20~21) / 74 / 11 |
| **hullBuys** | **0** | **45** (38~53) |
| hullRank(종료 시) | 0 | 1 (0~2) |
| 첫 함선 구매 시각 `hullBuyH` | -1 (미구매) | 약 40h (39.6~41.2) |
| **hullLost** | 0 | **45** (구매 수와 같음) |
| tgTrips / tgNet | ~19 / ~300만 | ~115 / ~6,200만 |
| wins / destroys | 3,766 / 1,547 | 3,310 / 1,438 |
| gearBuys / gearScore | 20 / 2,161 | 18 / 2,028 |
| hardStalls / sectionStalls | 0 / 0 | 0 / 0 |

해석:
- 목적이던 「함선을 살 이유」는 생겼다. 구매 0회가 45회가 됐고, 함선 자금 목표 때문에 교역이 약 6배 늘었다.
- **하지만 산 함선을 전부 잃는다(hullLost = hullBuys).** 봇이 승률 0.5 이상이면 싸우는데(`fairFightMin=0.5`), 유료 선체는 패배 한 번에 사라진다. 그래서 「사고 → 잃고 → 다시 산다」를 반복하며 크레딧을 태운다(시드 4는 종료 잔액 1cr). 승수가 줄어든 것도 이 루프에 시간을 쓴 탓이다.
- 레벨·스토리 진행은 그대로다(L21/스토리 11에서 다른 원인으로 정체 — 이번 범위 밖).
- 결론: 곡선 수치만으로는 반쪽이다. **유료 선체의 격침 손실 규칙(또는 봇의 유료 선체 교전 문턱)**을 같이 결정해야 순효과가 확인된다(D6).

### 2-5. 적 tcl 곡선과의 균형 검토

시작함에 tcl 곡선 무기를 끼고, 장비·스킬 없이, 레벨 = tcl로 놓고 구역별 승률 0.5에 필요한 **선체 배율**을 쟀다(`2 × killSec/liveSec`).

| 구역(tcl) | 1(1) | 4(7) | 6(12) | 7(15) | 8(18) | 9(21) | 10(25) | 11(28) | 12(31) | 14(37) | 15(40) | 17(48) | 18(52) | 19(56) | 20(60) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 필요 배율 | 0.5 | 0.5 | 0.5 | 4.4 | 8.2 | 8.0 | 5.0 | 5.2 | 3.8 | 3.3 | **12.5** | 3.9 | **10.9** | **11.9** | 8.0 |
| 그 구역에서 살 수 있는 제안 파이터 배율 | 1.0 | 1.22 | 1.22 | 2.05 | 2.05 | 2.05 | 2.24 | 2.24 | 2.81 | 2.81 | 3.14 | 3.14 | 3.48 | 3.48 | 3.71 |

- 장비·스킬 몫(피해감소 장비 하한 0.65 × 스킬 0.6, 실드 배율, 쿨다운 등)을 약 ×2~3으로 잡으면 tcl 31~48 구간은 선체 몫과 맞는다. 다만 **tcl 18~21(구역 8·9), 40(구역 15), 52~56(구역 18·19)는 스파이크**다. 선체만으로 메우려면 곡선 전체를 2배로 올려야 해서 권하지 않는다. 스파이크는 해당 행성 웨이브 슬롯 구성(`listPlanetWaveEnemySlots`) 문제로 보인다. 적 쪽 별도 항목으로 분리하기를 권한다.
- 트윈 적 함대에는 `planet_hostile_hull_scale.csv`(구역 20 HP ×3.0)가 들어가지 않는다. 그래서 실기의 후반은 위 표보다 더 어렵다. 제안 아펙스 EHP 3,865는 구역 20 적 1척(스케일 적용 시 약 3,900)과 비슷한 수준이다.
- 적 무기 DPS는 tcl 1→60에서 약 10배 오르고, 시작함 + 곡선 무기 전투력은 18배가 된다(무기가 대부분을 메운다). 선체 6배는 상한 쪽 보조 축이라 과하지 않다고 판단한다.

### 2-6. 위험

1. **격침 손실 루프**(§2-4) — 함선이 강해지면 봇·사람 모두 더 큰 싸움을 고른다. 유료 선체를 잃는 비용이 그대로면 크레딧 소모가 커진다.
2. **셰도우 보스**(`resolveArcCoreShadowBossOverride`, 「지휘관 복제 전함」 §16-A)가 플레이어 함선 스탯을 복제한다면 엔드 보스도 같이 강해진다. 복제 원본이 선체 CSV인지 플레이어 계산값인지 확인해야 한다(미확인).
3. **레인저 가격 하락** — 성능가 clamp 때문에 대체함이 기본함가의 0.88배까지 내려간다(현재도 일부는 하한). 무역 경제 지표(`balance-ops-audit`)를 다시 측정해야 한다.
4. **광물 15강 가산(+750 HP 등)이 고정값**이라 큰 선체일수록 강화 비중이 줄어든다. 이건 의도된 결과(선체 비중 증가)지만 `capital_ship_max_upgrade_value.csv`는 반드시 재생성해야 한다.
5. **레인저 저평가는 트윈 한계** — 실기에서 레인저가 0.75~0.8배로 체감되면 R3 계수(0.85/1.10)를 다시 조정해야 한다. 실기 측정 필요.
6. generated 재생성 시 `csvStoryScenes.ts`에 이번 변경과 무관한 드리프트(16줄)가 함께 나온다. 이미 CSV와 generated가 어긋나 있다는 뜻이니 커밋할 때 분리해야 한다.
7. 기존 세이브의 보유 함선은 다음 로드 때 바로 새 스탯이 적용된다(상향뿐이라 하향 민원 위험은 없음).

### 2-7. 대표님 결정 필요 사항

| # | 결정 | 김클로드 권고 |
|---|---|---|
| D1 | 곡선 상한: 아펙스 **6.0배**(α 0.255) / 5.0배(α 0.225) / 다른 값 | 6.0배 — 구역 18~20 필요 배율(장비 제외 8~12배)의 선체 몫 |
| D2 | 배율 분해: EHP^0.9 · 주사위^0.3, **armor·attackBonus 동결** | 이대로 — armor는 명중률이 1점에 5%p 바뀌어 민감하다 |
| D3 | 레인저 규칙: EHP ×0.85 · 주사위 ×1.10 · 기동 우위 유지 · 가격은 성능가 자동(약 0.88배) | 이대로, 실기 측정 후 재조정 |
| D4 | 프리깃 개량형(단독 레인저) 예외 = 등급 예산 전액. 트윈 1.22배라 봇 구매 문턱(+25%)에 약간 못 미친다 → 1.30 앵커를 1.35로 올릴지 | 1.35로 상향(EHP 약 +4%) |
| D5 | `Player_scout_ship`(frigate_default 레인저, 시작함의 0.12배) — 같은 등급 레인저 규칙(시작함 EHP×0.85)을 적용할지, 「상점 최저가 입문함」으로 남길지 | 기획 의도 확인 필요 — 변경하지 않은 채로 둠 |
| D6 | 유료 선체 격침 손실 규칙(보험·수리·잔존가) 또는 봇의 유료 선체 교전 문턱 | **PB-G5와 묶어서 결정** — 이게 빠지면 곡선을 올린 효과가 크레딧 소모로 상쇄된다 |
| D7 | 등급별 비무기 장비 칸(equipCapacity) 증가(예: tierBand당 +1) | 코드·신규 열이 필요한 별건 — 보류 권고 |
| D8 | 적 스파이크 구역(8·9·15·18·19) 웨이브 구성 조정을 별도 항목으로 만들지 | 별도 항목 신설 권고 |

---

## 3. self-check
- PB-G4: `hostileEnemyWeaponLoadoutFromBalance.test.ts` all PASS. 코드·CSV 변경이 없어 tsc는 생략했다(변경 0).
- PB-G5: CSV 적용 **안 함**. 임시 적용 → 벤치 → `npc_ai_ships.csv`·`src/data/generated` 원복 완료(`git diff ef73253 -- tables/content/npc_ai_ships.csv` 없음). 임시 측정 스크립트 `tools/play-bot-console/_pbg5_tmp.ts`는 삭제했다.
- [pss-pre-dev] hot_path=없음(데이터 제안서) · stage=N/A · risk=없음 · verdict=PASS
