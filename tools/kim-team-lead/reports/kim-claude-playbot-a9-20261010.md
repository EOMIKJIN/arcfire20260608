# 김클로드 리포트 — 플레이봇 A-9 (전투 파괴 원인) · 2026-10-10

- task: A-9a·A-9b·A-9c (정본 `docs/playbot/PLAYBOT_FULL_AUDIT_20261006.md` §6-C)
- 담당: 김클로드(서브리더) → **김플레이(메인리더) 검수 요청** · git commit 안 함
- worktree: `D:\arcfire20260607\.claude\worktrees\agent-a9ddbc8a59f1d188d` · 브랜치 `worktree-agent-a9ddbc8a59f1d188d` (base `3dfc926`, 10-08)
- 수정 범위: `tools/play-bot-console/**` 만. `src/`·`app/`·`tables/` 무변경.

```text
[pss-pre-dev] hot_path=Node 트윈 행동 1회(앱 아님) alloc=전투 스냅샷·장비/함선 가치는 (함선·레벨·스킬 수·장착) 키가 바뀔 때만 재계산
[pss-pre-dev] stage=앱 STAGE/Skia 무관 · persist 변경 없음 risk=없음
[pss-pre-dev] verdict=PASS — src/app/tables 무변경
```

## 1. 핵심

1. 전멸시키고도 파괴되는 판정(R4)이 벤치 파괴 2,891회 중 1,615회였다. 0회로 없앴다.
2. 트윈 승률에 숙련 HP 배율·장비·스킬을 실기와 같은 순서로 넣었다(R3). 실기 함수를 그대로 호출한다.
3. 시작 함선보다 약한 함선(프리깃 개량형, 전투력 0.58배)을 사서 잃던 반복(벤치 평균 422회 구매·383회 상실)을 멈췄다. 그 돈은 무기·장비에 먼저 쓴다(R1).
4. 레벨 24→28, 퀘스트 75→77, 본편 11→13, 하드 정체 1→0, 연료 53만→45만.
5. R5(격침 후 거점 귀환)는 반영하면 레벨이 19로 떨어져 **기본 OFF**로 두었다(`PB_POD_HOME=1`로 실험 가능). 장착 유지는 PB-G6 이후 실기와 이미 같다.

## 2. 재검수 판정표

| # | 진단 | 판정 | 근거 |
|---|---|---|---|
| R1 | 함선 예비금이 무기·장비 구매를 막는다 | **PARTIAL** | 코드 확인: `gearCreditReserve`가 잔액 < 다음 함선값+800 이면 함선값 전액을 예비금으로 잡고(`combatEfficiency.ts` 구 164-170), `doGear`가 `needsHullFund`면 장비 전에 `earnForShip`로 빠진다(`actions.ts` 구 1102). 하지만 변경 전 벤치에서도 D284 이후 장비 구매가 시드별 18~22회 있었다. 「D284 이후 0」은 하네스에서 함선을 사고 잃기를 반복해 잔액이 계속 예비금 아래였던 결과다. 근본 원인은 R2(약한 함선)와 묶여 있다. 또 옛 장비 점수(등급·가격 가중)는 센서·통신 같은 전투 무관 장비를 샀다 |
| R2 | 산 함선이 약하다 | **AGREE**(참고) | 트윈 전투력 지표로 L7~L40 실측: `Player_frigate_mk2` 0.57~0.59배, 구축함~순양전함 완성형 0.83~1.10배, 슈퍼캐피털 1.17배, 아펙스 1.57배(시작 함선 대비). PB-G5 보류 상태 그대로 |
| R3 | 방어 장비·스킬·광물·숙련 HP가 승률에 없다 · `fightPowerBonus` 미사용 | **AGREE** | 구 `fightOdds`는 CSV `maxHp+maxShield`, `armor`만 썼다. `fightPowerBonus`(`progress.ts` 구 65)는 호출 0건(grep). 광물 강화는 트윈에 행동 자체가 없어 0으로 둔다(N/A) |
| R4 | 전멸시켜도 패배·파괴 | **AGREE** | 구 `resolveFightPay`: 승산이 있으면 `liveSec > killSec`인데 패배 분기에서 `playerDps × liveSec`로 격파 수를 세서 항상 전멸이 나왔다. 변경 전 벤치 `wipedButLost` 1,615/2,891 |
| R5 | 파괴 후 장착 유지·제자리 | **PARTIAL** | 장착: PB-G6 DONE. 격침 시 `preservedEquipSlots`에 남기고 다음 전함 탑승 때 복원한다(`src/game/applyNpcCapitalShipPurchase.ts:62-71`, `playerSurvivalPod.ts:102-124`). 그래서 트윈의 「장착 유지」는 실기 순효과와 같다 → 장착 부분은 **DISAGREE**. 귀환: 실기는 `resolvePlayerHomePlanetId`(기본 `arcadia_prime`)로 연료 없이 귀환한다(`playerSurvivalPod.ts:147-188`). 웨이브·허브 궤도·이동중 공통이다(`runCombatEndOutcomeFlow.ts:90-91`) → **AGREE**. 다만 반영하면 후퇴해서 OFF(§4) |
| R6 | 스킬 선택이 요구 레벨 낮은 순 | **AGREE** | 구 `tryLearnSkill`: `s.levelRequired < pick.levelRequired` |

추가로 찾은 트윈 결함(같이 고침):
- 무기 아이템(`weapon_item_*`)이 `weapon` 칸에 따로 들어가 함선 기본 4문 위에 **5번째 포**로 더해졌다. 실기는 WEAPON_1..4 채널뿐이다(`src/game/resolvePlayerCombatWeaponChannels.ts:38`, `combatWeaponSlots.ts:46`).
- 무기 아이템 요구 레벨을 `equipmentRequiredLevel`(없음)로 읽어 전부 L1로 봤다. 실제 속성은 `weaponRequiredLevel`이다.
- 방어 장비 칸을 `equipmentCategory`(defense 1칸)로 묶어 장갑판·실드증폭기를 동시에 달 수 없었다. 실기는 ARMOR·EX_02로 나뉜다(`shipEquipmentModel.ts:15-35`).

## 3. 변경 (파일:줄은 변경 후 기준)

| 파일 | 내용 |
|---|---|
| `tools/play-bot-console/src/liveCombat.ts:269` `buildPlayerSide` | **A-9b** 실기 `resolvePlayerFlagshipCombatBinding`(PlanetEdenRaidTestLayer.tsx:2010) 순서: `calculateShipPerformance`(숙련 HP·실드·장갑) → `applyShipEquipmentToShipPerformance` → `resolveShipEquipmentAgentKnobs`(피해감소 0.65 하한·미사일 회피·선체 재생·회피 AC) → `resolvePlayerCombatSkillBind`(피해감소 0.6 하한·실드 배율·장갑 가산·쿨다운). 쿨다운은 무기 DPS를 나눠 반영 |
| `liveCombat.ts:312` `playerCombatSig` · `:336` `playerCombatPower` | 전투 스냅샷 캐시 키 · 함대와 무관한 전투력 지표(유효HP×DPS÷받는 피해 배율). 함선·장비·스킬 가치 비교용 |
| `liveCombat.ts:422` `fightOdds` | 적 무장 DPS 중 미사일 몫에만 ECM·디코이 회피 적용 → 장갑·피해감소 → 재생(하한 10%) |
| `liveCombat.ts:476` `resolveFightPay` | **A-9c** 패배 굴림이면 생존 시간을 `killSec × (1-roll)/(1-chance)`(< killSec)로 보고 격파 수를 센다. 패배는 항상 전멸 미만 |
| `liveCombat.ts:518` `strongerHullShipId` | 등급의 기본함·대체함 중 강한 쪽을 산다(예전엔 홀짝 틱으로 약한 대체함도 샀다) |
| `combatEfficiency.ts:114` `HULL_MIN_POWER_GAIN=0.25` · `:132` `refreshHullTarget` | **A-9a** 레벨이 열린 상위 등급 중 전투력 +25% 이상인 가장 낮은 등급만 구매 목표로 둔다. 없으면 바로 위 등급을 **자금 목표로만** 둔다(교역로 자금 루프 유지) |
| `combatEfficiency.ts:234` · `:258` | 살 가치가 없으면 조선소로 가지 않고 사지도 않는다 |
| `progress.ts:117` `gearGains` · `:148` `bestAffordableGear` | **A-9a** 장비는 전투력 상승이 가장 큰 것부터 산다. 함선 예비금은 목표 함선의 「상승÷가격」이 그 장비보다 클 때만 건다. 함선 자금을 모으는 중에는 교역 운전자금 5,000cr(`:146`)을 남긴다 |
| `progress.ts:179` `tryLearnSkill` | **R6** 전투력 상승이 큰 스킬부터. 같으면 요구 레벨 낮은 순 |
| `progress.ts` | 호출 0건인 `fightPowerBonus` 삭제 |
| `catalog.ts:366` `weaponGearSlot` · `:387` | 무기 칸 = 실기 WEAPON_1..4 → 트윈 `weapon_laser/missile/close/aux` · 무기 요구 레벨 `weaponRequiredLevel` · 장비 칸 = 실기 `resolveShipEquipmentSlotForItemDef` |
| `actions.ts:1147` `doGear` · `:1188` | 살 장비가 있으면 함선 자금 루프보다 먼저. 무역소가 아니면 가까운 무역소로 간다 |
| `actions.ts:274` `POD_RETURN_HOME` · `:276` · `:219` | **R5** 생존포드 거점 귀환 + 빈곤 루프 방지(남은 항로 연료를 못 대면 무역소+채굴 행성에서 먼저 번다). **기본 OFF**, `PB_POD_HOME=1`일 때만 |
| `bench-bot.ts` | A-9 지표 추가: `hullBuys` `gearBuys` `hullLost` `wipedButLost` `skills` `gearScore` `wins`(평균) |
| `play-bot-console.test.ts` | 신규 1건(A-9 승률·전멸) · 수정 2건(약한 함선은 사지 않음 · 장비 먼저 · 300일 자금 목표 도달) |

## 4. 벤치 전/후 (`npx tsx tools/play-bot-console/bench-bot.ts 1200 4`, 4시드 평균)

| 지표 | 변경 전 | R3·R4·무기칸 정정만 | 최종 + R5 켬(PB_POD_HOME=1) | **최종(R5 OFF)** |
|---|---|---|---|---|
| 레벨 | 24 | 25 | 19 | **28** |
| 퀘스트 | 75 | 74 | 74 | **77** |
| 본편 | 11 | 11 | 11 | **13** |
| 함선 최종 등급 | 0 | 0 | 0 | 0 |
| 상위 함선 구매 | 422 | 209 | 0 | **0** |
| 산 함선 상실 | 383 | 184 | 0 | **0** |
| 파괴(전체) | 2,891 | 2,889 | 1,332 | 2,744 |
| 전멸시키고 파괴 | 1,615 | 0 | 0 | **0** |
| 승리 | 5,570 | 6,361 | 2,366 | 7,625 |
| 연료(cr) | 531,115 | 471,646 | 381,580 | **446,574** |
| 장비·무기 구매 | 56 | 57 | 18 | 24 |
| 스킬 | 23 | 21 | 18 | 27 |
| 하드 정체(합) | 1 | 3 | 110 | **0** |

(「R5 켬」 열은 교역 운전자금 5,000cr 규칙을 넣기 전에 잰 값이다. 같은 시점의 R5 OFF 측정은 최종과 같았다: L28·Q77·본편 13.)

시드별 최종: L28·28·28·29, 퀘스트 77×4, 본편 13×4, 하드 정체 0×4.

- 장비 구매 수가 56→24로 준 것은 전투 무관 장비(센서·통신·항법 등급 갈아타기)를 더 이상 사지 않아서다. 최종에서도 D284 이후 장비 구매가 시드별 10~11회, 마지막 구매일 D1111~D1175다.
- 「함선」 칸은 그대로 0이다. 현 CSV에서 전투력 +25%를 넘는 함선은 아펙스 레전드(L80, 1억cr)뿐이다. PB-G5(함선 등급 곡선)가 들어오면 같은 규칙으로 자동으로 산다.

### 되돌린 변경과 이유
- **R5 거점 귀환(기본 OFF)**: 켜면 레벨 28→19, 하드 정체 0→110이다. 공정선 0.5 전투에서 격침될 때마다 아르카디아로 돌아갔다가 다시 날아가느라 시간과 연료를 쓴다. 초반에는 아르카디아(광물 10cr)↔베가 전초기지 왕복 매도에 갇힌다(시드 2: D53~D1100 L7). 항로 연료 부족 가드로 일부 회복(L19)됐지만 후퇴가 남아 끈다. 봇의 전장 선택에 격침 비용(귀환 거리·연료)이 들어간 뒤 켜야 한다.
- **함선 목표 없애기(1차안)**: 약한 함선을 목표에서 아예 빼면 시드 3·4가 L17·18로 떨어졌다. 함선 자금 압박이 교역로(tg) 루프를 돌리는 유일한 동력이었는데, 그것이 사라지자 개발비로 잔액을 소진하고 빈곤 루프에 빠졌다. 그래서 바로 위 등급을 「자금 목표로만」 남겼다.
- **함선 가치 하한 5%(1차안)**: 구축함(1.02~1.1배)을 사고 시드당 79~87회 잃었다. 25%로 올렸다.

## 5. 테스트

- `npm run playbot:test`: **115 PASS / 0 FAIL**(신규 1 · 수정 2)
- `npx tsc --noEmit -p tsconfig.client.json`: `tools/play-bot-console` 오류 0. 손대지 않은 `src/firebase/firestore.ts(18)`·`firestoreClientConfig.ts(10)`에서 TS7006 2건이 나온다. worktree에 `node_modules`가 없어 본 checkout(SDK54)의 `node_modules`를 junction으로 연결했는데, worktree base가 10-08이라 타입 버전이 어긋난 것으로 보인다. 본 checkout에서 재확인이 필요하다.
- Skia 변경 없음 → `audit:skia-memory` 해당 없음.

## 6. 남은 위험

1. 플레이어 DPS는 여전히 트윈 근사 `(주사위+무장)×숙련배율`이다. 실기는 숙련을 피해 배율이 아니라 STR 가산(`ShipPerformanceCalculator.ts:30-33,114-128`)으로 준다. 그래서 고레벨에서 트윈 화력이 과대할 수 있다. 이번에는 손대지 않았다(후퇴 위험이 커서 A-9 밖).
2. 장갑은 트윈 `armor/100`(상한 50%) 경감을 그대로 쓴다. 실기는 고정 경감 `floor(armor×0.4)`+AC다(`PlanetEdenRaidTestLayer.tsx:1044,1137-1144`). 회피 AC는 「1당 명중 5%p」로 근사했다(주석 표기).
3. R7(무역소 행성별 진열 상한)·내구도는 여전히 미반영이다.
4. R5를 켜려면 먼저 봇 전장 선택을 고쳐야 한다(격침 시 귀환 비용 반영 승률선 · 거점 근처 수련). A-10·공정선과 같이 봐야 한다.
5. 함선 자금 목표(프리깃 개량형 25만)는 「교역 운전자금을 모으는 동기」로만 남긴 봇 정책이다. PB-G5 전에는 함선 업그레이드가 계속 0이다.
6. 상시 하네스의 기존 world 파일: 예전 키 `weapon`(5번째 포)이 남아 있으면 그 무기를 계속 추가 화력으로 센다. `defense` 등 옛 장비 키는 실기 칸 매핑으로 정상 처리된다. 하네스 재시작 또는 world 초기화를 권한다.
7. worktree base(`3dfc926`)는 본 브랜치 HEAD(`ef73253`)보다 커밋 2개 뒤다. `tables/`·`src/data`·`tools/play-bot-console/src`는 두 커밋 사이 차이가 없다. 본 checkout `actions.ts:740`에 들여쓰기만 바뀐 미커밋 변경이 있어, 병합 때 자잘한 충돌이 날 수 있다.

## 7. 검수 요청

김플레이(메인리더) 검수를 요청합니다. diff 7파일(`tools/play-bot-console/**`), 커밋은 하지 않았습니다.
