# 스킬트리 미개발 36종 개별 개발안 (기획·설계 — 코드 미착수)

```text
status=DESIGN_ANALYSIS_ONLY
task_id=skill-tree-36-undeveloped-design-20260913
kind=DESIGN_PROPOSAL (36개 개별)
code_changes=NO
author=김클로드
date=2026-09-13
trigger=대표님 — 김팀장 스킬 개발 중, 미개발 36종에 김클로드가 기획·설계 채워 개발문서 작성. 완료 시 김팀장 전달.
```

## 0. 결론 먼저

`tables/content/skills.csv` 총 45종 중 `src/game/skillTree/skillRuntimeStatus.ts`의 `COMPLETE_IDS`(8종)+`PARTIAL_NOTE_KEY`(1종)를 뺀 **정확히 36종이 미개발**이다(대표님 수치와 실측 일치, 정본 확인).

전수조사 결과 36종은 성격이 완전히 다른 두 그룹으로 갈린다 — **이 구분이 이번 설계의 핵심이다**:

| 그룹 | 개수 | 필요한 것 |
|------|------|-----------|
| **A. 패시브 — 값 합산형** | 21종 | 기존 `sumOwnedSkillStatBonus()` 패턴 그대로. 소비 지점 코드 몇 줄만 추가하면 즉시 작동 |
| **B. "액티브" — 실제로는 5가지 다른 성격** | 15종 | 아래 §3에서 그룹별로 다시 나눔. 그중 절반은 기존 전투 시뮬 수식 확장이지 새 시스템이 아니다 |

**가장 중요한 재검수 결과**: `effectType=active`라는 CSV 라벨을 보고 "플레이어가 버튼 눌러 발동하는 액티브 스킬 시스템"을 새로 만들어야 한다고 오판하기 쉬운데, **실제로는 아니다.** 이 게임 전투는 자동전투(`effectDescription`에 "자동 전투:"로 시작하는 스킬 다수 확인)라 대부분의 "active" 스킬은 자동전투 수식에 계수 하나 더하는 수준이다. 진짜 "발동형" 스킬은 15개 중 7개뿐이고, 그마저도 기존 전투 시뮬(`capitalWeaponImpact.ts`)에 이미 있는 `statusTintUntilMs`/`speedSlowUntilMs` 같은 "임시 상태 타이머" 필드 패턴을 재사용하면 새 프레임워크 없이 된다.

---

## 1. 기존 완료 패턴 재확인 (설계의 기준선)

8개 완료 스킬이 실제로 어떻게 소비되는지 코드로 직접 확인했다 — 이게 아래 36개 설계의 "정답 형태"다.

| 소비 지점 | 담당 스탯 | 실제 사용처 |
|-----------|-----------|-------------|
| `src/game/playerOwnedSkillCombatBind.ts` | `armor_pierce`(armor_piercing), `damage_reduction`(reactive_armor) | `resolvePlayerCombatSkillBind()` — **매치 시작 1회** 바인딩. 호출부: `PlanetEdenRaidTestLayer.tsx`(실전투 시뮬) |
| `src/game/playerOwnedSkillTradeAdjust.ts` | `trade_bonus`(negotiation_pro), `tax_cut`(tax_exemption) | 호출부: `tradeScreenPolicy.ts`·`applyPlanetTradeTransactionFee.ts`·`planetTradePortRuntimeBridge.ts` |
| `src/game/galaxyTransit/computeGalaxyTransitFuelQuote.ts` | `fuel_efficiency`(warp_stabilizer, orbit_surge) | `resolvePlayerGalaxyTransitFuelEfficiencyPct()` — 은하이동 연료견적에 직접 반영 |
| (별도 확인, 파일 미특정) | `spy_detect`(counterintel_array), `anti_terror`(arc_threat_analyzer) | 스파이/테러 판정 경로 — 이번 조사 범위 밖, 그러나 존재 확인(COMPLETE 등재) |

공통 뼈대: `sumOwnedSkillStatBonus(statKey, ownedIds)`(`src/game/ownedSkillStatBonus.ts`)가 **Table-First로 CSV `effectStat`/`effectValue`를 합산**하고, 각 도메인별 Bind 파일이 "매치/견적 시작 시 1회" 호출해 캡을 씌운 뒤 실제 계산식에 넣는다. **틱 루프에서 재계산하지 않는다** — 이 원칙은 36개 전부에 그대로 적용해야 한다.

---

## 2. A그룹 — 패시브 21종 (기존 패턴 재사용, 소비 지점만 추가하면 완료)

### 2-1. 전투(2종) — 기존 `playerOwnedSkillCombatBind.ts`에 필드만 추가

| id | effectStat | 제안 |
|----|-----------|------|
| `critical_focus` | `crit_range`(19) | `resolvePlayerCombatSkillBind()`에 `critRange: number`(기본 20) 필드 추가, `sumOwnedSkillStatBonus`가 아니라 **최솟값 선택**(합산 아님 — 19가 20보다 넓은 범위이므로 `Math.min(20, ...)` 방식) 방식으로 처리. 실제 크리티컬 판정부(주사위 굴림 로직)에서 이 값을 하한으로 사용 |
| `hull_regeneration` | `regen_rate`(5) | 신규 필드 `regenRatePct: number`. 소비는 전투 턴 종료 시 1회(틱 아님) `hullHp += maxHullHp * regenRatePct/100` — `capitalWeaponImpact.ts`의 턴/라운드 경계 훅에 연결 |

### 2-2. 항법(4종) — 신규 파일 `src/game/playerOwnedSkillNavigationBind.ts` 제안(기존 Bind 파일과 동일 구조)

| id | effectStat | 소비 지점 제안 |
|----|-----------|----------------|
| `jump_boost` | `jump_speed`(30) | `computeGalaxyTransitFuelQuote.ts`의 자매 함수로 이동 **시간**(연료 아님) 계산이 따로 있다면 그쪽에 배율 적용. 없다면 이 스탯의 소비처를 신규로 정의해야 함 — 김팀장 확인 필요(§5) |
| `sensor_array` | `sensor_range`(20) | 성계 진입 시 위협/자원 스캔 반경 계산부 — `sensor_range` 문자열 자체가 코드 어디에도 없음(신규). 스파이 경보·행성 코어 관측 판정 반경에 가산 제안 |
| `ghost_vessel` | `sneak_attack`(100) | 전투 시뮬의 "은신 후 첫 공격" 판정 — `stealth_drive`(§3) 보유 시에만 의미 있음(선행 스킬이 `stealth_drive`). 첫 타격 데미지 배율 필드로 `playerCombatSkillBind`에 추가 |
| `wormhole_finder` | `shortcut_find`(15) | 은하 경로탐색 로직에서 확률적으로 홉 수 절감 — `galaxyTransitFuelPolicy.ts` 인접 |

### 2-3. 무역(6종) — 기존 `playerOwnedSkillTradeAdjust.ts`에 필드만 추가(가장 쉬움 — 이미 같은 파일·같은 스탯 축)

| id | effectStat | 제안 |
|----|-----------|------|
| `market_sense` | `market_range`(1) | 인접 성계 가격 미리보기 — UI 조회 함수에 `playerOwnsSkill('market_sense')` 체크 추가(불리언, 합산 아님) |
| `cargo_stacking` | `cargo_capacity`(10) | 인벤토리 슬롯 계산부에 가산 |
| `smuggler_route` | `contraband_risk`(-50) | 밀수 단속 확률 계산에 승수 적용 |
| `bulk_trading` | `profit_margin`(10) | 대량거래 임계치 이상 물량에 `applyPlayerTradeSellUnitPrice`류와 같은 층에서 추가 배율 |
| `black_market_boss` | `trade_access`(1) | 불리언 게이트 — 밀수품 거래 가능 여부 체크에 `playerOwnsSkill` 사용 |
| `investor_deal` | `service_fee`(0) | 정거장 수리비 계산부에 0 강제(수수료 면제) — `resolvePlayerTaxCutPct`와 형제 함수로 추가 |

### 2-4. 함대(9종) — 신규 파일 `src/game/playerOwnedSkillFleetBind.ts` 제안

`TEMP_MAX_HANGAR_SHIPS = 30`(`src/store/playerStore.ts:82`, 하드코딩 확인)이 함대 슬롯의 실제 상한이다 — `fleet_slot`/`fleet_size`는 이 상수를 스킬 보너스로 대체하면 된다.

| id | effectStat | 소비 지점 제안 |
|----|-----------|----------------|
| `wingman_recruit` | `fleet_slot`(1) | `TEMP_MAX_HANGAR_SHIPS` 대신 `TEMP_MAX_HANGAR_SHIPS + fleetSlotBonus` |
| `formation_basic` | `armor_bonus`(5) | 플래그십 장갑 계산 — `playerOwnedSkillCombatBind`와 같은 층(전투 시작 1회) |
| `repair_drone` | `fleet_regen`(1) | 비전투 중(허브 체류) 함선 체력 서서히 회복 — 일일배치나 허브 tick 중 **고빈도 아닌** 이벤트(예: 성계 진입 시 1회)에 연결 |
| `wingman_synergy` | `cooldown_reduction`(5) | 무기 재장전 시간 — `weapon_list.csv` 재장전ms에 배율. `resolvePlayerCombatSkillBind`에 필드 추가 |
| `fleet_command` | `party_attack_bonus`(2) | 파티원 명중 보너스 — 파티 시스템이 있다면 그 계산부, 없다면 함께 참전하는 NPC 캡틴 명중 계산부 |
| `tactical_link` | `stat_multiplier`(5) | "지휘·긴급 계열과 시너지" — 조건부(둘 다 보유 시)라 단순 합산이 아니라 **AND 조건 보너스**. `fleet_command`·`emergency_warp` 보유 여부를 함께 체크하는 별도 함수 필요 |
| `carrier_command` | `fleet_size`(2) | `fleet_slot`과 동일 소비처(둘 다 상한 가산이라 합산해도 무방) |
| `carrier_protocol` | `drone_damage`(50) | **이미 있는 시스템과 직결** — `weapon_craft_loiter_policy.csv`/`capitalCraftPool.ts`의 드론·함재기 피해 계산에 배율 적용(어제 조사한 드론/함재기 시스템의 자연스러운 확장점) |
| `overlord_presence` | `aura_effect`(10) | 아군 명중+4/적 명중-4 — 전투 시뮬의 명중 판정부 양쪽에 상수 가산 |

**A그룹 총평**: 21종 전부 기존 CSV `effectStat`/`effectValue`가 이미 채워져 있어 **새 데이터 설계가 필요 없다.** 코드 쪽만 "합산 함수 호출 1줄 + 실제 계산식에 대입 1곳" 패턴으로 채우면 된다. 유일하게 항법·함대 도메인은 전용 Bind 파일이 없어 신규 파일 2개가 필요하다(기존 파일 복붙 수준, 새 아키텍처 아님).

---

## 3. B그룹 — "액티브" 15종의 실제 성격 재분류

CSV의 `effectType=active`만 보고 뭉뚱그리면 안 된다 — 실제로 필요한 메커니즘이 5가지로 다르다.

### 3-1. 자동전투 수식 확장형(5종) — 새 시스템 불필요, 기존 자동전투 수식에 계수만 추가

| id | 효과 | 제안 |
|----|------|------|
| `double_shot` | 무기 쿨다운 -12%·미사일 살보 +1 | `weapon_list.csv` 재장전ms/연발수 조회부에 배율·가산. `playerOwnedSkillCombatBind`에 필드 추가(합산형과 동일 방식, 그냥 effectType 라벨만 active일 뿐) |
| `shield_overload` | 최대 실드 +20% | 실드 최대치 계산에 배율 |
| `emp_blast` | 명중 시 적 실드 25% 방전 | `capitalWeaponImpact.ts`의 명중 판정 후 실드 차감 로직에 조건부 추가(선행 스킬 `double_shot` 보유 전제) |
| `plasma_cannon` | 실드 관통 10% | `applyIncomingDamage`의 실드 관통 파라미터에 가산 — **어제 조사한 특수무기 `ignoreShield`(불리언)와 달리 이건 "10%만 관통"이라 별도 소수점 파라미터 필요** — `capitalWeaponImpact.ts`에 `shieldPenPct` 같은 신규 인자 추가 필요(작은 시그니처 확장) |
| `multi_lockon` | 최대 3타겟 동시 공격 | 현재 단일표적 판정 루프를 스킬 보유 시 다중표적 루프로 — `capitalWeaponImpact.ts`의 `target_track` impactMode 분기에 타겟 수 파라미터 추가 |

이 5개는 **결국 A그룹과 코드 패턴이 동일하다.** `effectType` 라벨 차이는 게임 디자인상 "능동적으로 느껴지는 효과"라는 의미일 뿐, 구현은 "매치 시작 1회 바인딩 + 계산식 대입"으로 A그룹과 완전히 같다.

### 3-2. 전투 중 임시상태형(6종) — 기존 `statusTintUntilMs`/`speedSlowUntilMs` 패턴 재사용(신규 필드만 추가, 새 시스템 아님)

`capitalWeaponImpact.ts`에서 이미 확인한 `Agent` 타입의 `speedSlowMul`/`speedSlowUntilMs`/`statusTintHex`/`statusTintUntilMs` — **"일정 시간 상태 유지" 타이머는 이미 있는 패턴이다.** 아래 6개는 같은 필드 추가 방식으로 충분하다.

| id | 효과 | 제안 필드/로직 |
|----|------|-----------------|
| `fortress_mode` | 이동불가·방어+50% | `Agent`에 `stanceMode: 'normal'\|'fortress'` 추가. 이동 로직에서 fortress면 speed=0, 방어 계산에 +50% |
| `stealth_drive` | 3턴 감지불가 | `Agent.stealthUntilTurn` — 적 타겟팅 로직에서 이 턴수 내면 타겟 후보에서 제외 |
| `dimensional_blink` | 전투 중 무적 이동 | `Agent.invincibleUntilMs`(기존 `statusTintUntilMs`와 형제 필드) — 데미지 적용부에서 이 타임스탬프 이내면 스킵 |
| `gravity_swing` | 일시 최고속도+50% | `Agent.speedBoostMul`+`speedBoostUntilMs` — `speedSlowMul`과 정확히 대칭 구조로 추가(이미 슬로우가 있으니 부스트도 같은 자리) |
| `singularity_cannon` | 밀집유도+광역 | `applySpecialWeaponAoeAroundPoint`(어제 확인한 특수무기 AoE 함수) 그대로 재사용 가능 — "밀집 유도"만 신규(적들을 impactPoint로 서서히 끌어당기는 소수 로직), 광역 피해는 기존 함수 그대로 |
| `perfect_defense` | 1턴 무효화 | `dimensional_blink`와 동일 패턴(`invincibleUntilMs`)을 지속시간만 다르게 |

**공용 인프라 제안**: 이 6개를 위해 `Agent` 타입에 상태 필드 4~5개(`stanceMode`,`stealthUntilTurn`,`invincibleUntilMs`,`speedBoostMul`,`speedBoostUntilMs`) 추가하고, 발동 조건(자동전투이므로 "언제 자동으로 켜지는가" — 예: HP 30% 이하일 때 `fortress_mode` 자동 전환 같은 트리거 규칙)을 CSV에 신규 컬럼(`autoTriggerCondition`)으로 추가하는 걸 제안한다. **이게 이번 설계에서 유일하게 "새 데이터 컬럼"이 필요한 지점**이다 — 그 외엔 전부 기존 컬럼으로 충분하다.

### 3-3. 소환형(1종) — 어제 조사한 CapitalCraft 풀 그대로 재사용 가능

| id | 효과 | 제안 |
|----|------|------|
| `wingman` | AI 윙맨 1척 소환, 3턴 유지 | 완전히 새로 만들 필요 없음 — **어제 정밀검사한 `src/combat/capitalCraftPool.ts`의 함재기(carrier) FSM을 아군 소환수로 재사용**. `family: 'ally_wingman'` 하나만 추가하거나, 기존 `carrier` 패밀리를 팀 구분 없이 확장. 이미 사전할당 풀·dispose 패턴이 완비돼 있어 메모리 리스크 없음 |

### 3-4. 아웃오브컴뱃 유틸리티형(2종) — 전투 시뮬과 무관, 각자 도메인에 훅

| id | 효과 | 제안 |
|----|------|------|
| `wormhole_generator` | 두 지점 간 즉시이동 포탈 | 은하지도 이동 시스템(`galaxyTransit` 폴더)에 "저장된 포탈 좌표" 개념 신규 — 이건 A/B그룹보다 설계 폭이 크다. 1차는 "이미 방문한 두 성계 중 하나를 즐겨찾기 등록 → 그 경로만 홉 비용 0" 수준으로 축소 제안(전체 포탈 네트워크는 후속) |
| `monopoly_master` | 성계 물가 강제 조정 | 무역 경제 시스템(`planetUpkeepPolicy.ts` 계열)에 플레이어발 일시적 가격 조작 이벤트 — 밸런스 리스크가 있어 **일 1회, 지속시간 제한, 되돌림 로직 필수**로 설계할 것을 제안(무제한 조작 시 경제 밸런스 붕괴 위험) |

### 3-5. 조건부 자동트리거형(1종) — CSV 스스로 "표시용"이라 명시한 것 재확인

| id | 효과 | 제안 |
|----|------|------|
| `emergency_warp` | 함체 위험 시 생존 보정(CSV 비고: **표시용**) | 어제 특수무기 조사에서 본 "연출만" 패턴과 동일 케이스. 실제 기능화 제안: `finalizeDestroyed` 직전 훅에서 "이 매치 중 미사용 시 1회, hullHp<=0 조건에서 hullHp=1로 되돌리고 `invincibleUntilMs`(§3-2 신규 필드) 짧게 부여" — 기존 destroy 판정 함수 1곳에 조건 분기만 추가하면 되는 가벼운 구현 |

---

## 4. 실행 우선순위 제안

| 순서 | 항목 | 이유 |
|------|------|------|
| 1 | A그룹 무역 6종 | 기존 파일에 필드만 추가, 리스크 최소 |
| 2 | A그룹 전투 2종 | 기존 파일에 필드만 추가 |
| 3 | A그룹 항법 4종 + 함대 9종 | 신규 Bind 파일 2개 필요하나 기존 패턴 복붙 수준 |
| 4 | B-1 자동전투 수식 확장형 5종 | A그룹과 동일 난이도, `capitalWeaponImpact.ts` 소폭 확장 |
| 5 | B-2 임시상태형 6종 | `Agent` 신규 필드 4~5개 + (선택) CSV `autoTriggerCondition` 컬럼 — 이번 설계에서 유일한 "약간의 기반 작업" |
| 6 | B-3 소환형(wingman) | CapitalCraft 풀 재사용 — 어제 검증된 인프라라 리스크 낮음 |
| 7 | B-4/B-5 (wormhole_generator·monopoly_master·emergency_warp) | 전투 시뮬 밖 도메인이라 별도 설계 필요, 우선순위 낮음 |

## 5. 김팀장 확인 필요 사항 (이번 조사로 못 좁힌 것)

- `jump_speed`(점프 가속) — 은하 이동의 "시간" 계산 로직이 연료 계산(`computeGalaxyTransitFuelQuote.ts`)과 별도 파일에 있는지, 아니면 이 스탯 자체가 아직 어디에도 소비 설계가 없는 완전 신규인지 확인 필요.
- `sensor_range`(정찰 센서) — "위협을 먼저 식별"의 구체적 판정 로직(스파이 경보? 행성 코어 관측?) 확정 필요.

## 6. 지금 하지 않은 것

CSV·코드 전부 무변경. 36개 전부 설계(제안) 단계이며, 착수는 김팀장 판단 후.

**END** — 2026-09-13 · 김클로드
