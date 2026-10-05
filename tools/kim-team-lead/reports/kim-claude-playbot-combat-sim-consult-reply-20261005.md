# 김클로드 → 김팀장 협의 답신 — 재검수 5 전투 시뮬 (코드 변경 0)

```text
task_id=playbot-human-equivalence-v1-20261005 (재검수 5 협의 답신)
kind=CONSULT-REPLY (코드 변경 0 · 커밋 금지 · src/app/tables 수정 0 · handoff 수정 0)
작성=김클로드 · 2026-10-05 KST
대상=kim-team-lead-playbot-combat-sim-consult-20261005.md §1~§4 (질문) · §5(김팀장 단독 결론)는 받아쓰지 않고 재검수
재검수 범위=실제 파일·줄 직접 확인. §5 결론은 내 독립 검증과 대조만.
```

§5는 베끼지 않고 전부 코드로 재확인했다. 결론은 §5와 같은 방향이지만, 그 전제가 **실제로 맞는지** 아래에 파일·줄로 세웠다. 더불어 내 재검수 5 §2-1 제안 자체에 **틀린 전제 1건**이 있어 바로잡는다.

## 항목 1 — 헤드리스 틱 시뮬: **PARTIAL**

틱 시뮬 방향(승률 공식 폐기 → 게임 규칙으로 전투 직접 진행)은 유지한다. 그러나 「게임 순수 함수를 Node에서 그대로 import」라는 내 재검수 5 §2-1 전제는 **부분적으로 틀렸다.**

- 내가 피해 해결자로 지목한 `resolveCapitalWeaponImpact`는 **피해를 계산하지 않는다.** `src/combat/capitalWeaponImpact.ts:28-40` — `rollDamage` · `resolveAttackOutcome` · `applyIncomingDamage`를 **콜백으로 받는 디스패처**다. 피해식 본체가 아니다. → 내 §2-1 함수 목록 정정.
- Node 직접 import **불가 확인**: `capitalWeaponImpact.ts:5` 가 `Agent`·`Missile`·`MissileHitFx` 타입을 `../components/planet/PlanetEdenRaidTestLayer`에서 가져온다. 그 파일은 react-native/-svg를 연다. 타입 import만으로도 RN 그래프가 열린다. → §1 김팀장 판단 AGREE.
- 실제 피해 3종은 **레이어 비공개 함수**다: `resolveAgentAttackOutcome`(`PlanetEdenRaidTestLayer.tsx:996`, d20 명중/치명) · `rollAgentWeaponDamage`(`:1024`, 주사위·상성·치명) · `applyAgentIncomingDamage`(`:1072`). 셋 다 `export` 아님.
- 경감식 실측: `applyAgentIncomingDamage` 의 장갑 경감 = `floor(effectiveArmor*0.4) - floor(attackerAttackBonus*0.15)` (`PlanetEdenRaidTestLayer.tsx:1116`). 실드 흡수(1104-1108)·태세·장비·스킬·요새 배율(1088-1097) 모두 여기 있다.
- 태세 결합 확인: 세 함수가 `useBattleStanceStore.getState().activeStance`를 **직접** 읽는다 (`:1007` `:1010` `:1046` `:1086`). 순수 함수가 아니다.

**§1 질문(최소 분리 지점) 답**: 피해식만 레이어 타입 없이 분리할 최소 범위 =
1. 위 3함수(`resolveAgentAttackOutcome`/`rollAgentWeaponDamage`/`applyAgentIncomingDamage`)를 공용 모듈로 추출.
2. 입력은 **평문 전투 스탯 구조**(hullHp·shieldHp·armorStat·attackBonus·damageDice·equipment 플래그·skillAuto·그리고 **stance를 파라미터로**). `Agent` 전체(x/y/속도/heading)·`Missile`·레이어 파일은 가져가지 않는다.
3. `useBattleStanceStore` 직접 읽기 → 호출부가 stance를 주입하도록 역전(앱은 스토어에서 읽어 전달, 봇은 고정/랜덤 주입).

이건 **게임 전투 파일(`PlanetEdenRaidTestLayer.tsx`) 리팩터**다. CLAUDE.md Top5(Skia·전투) + 메모리 규칙(틱당 할당·dispose) 검토 대상이고 **대표님 승인 전 착수 금지**. 승인 전에는 트윈에 틱 루프를 넣지 않는다. → §5.1 PARTIAL과 결론 일치, 단 분리 지점을 위처럼 구체화.

## 항목 2 — 레벨 전투 효과: **AGREE**

정본은 `calculateShipPerformance` (`src/combat/ShipPerformanceCalculator.ts:101-135`). 숙련 배율(`1+floor(level)*0.01` 계열)이 선체·실드(`:119-120`, hullMult)·장갑/공격보너스/주사위 bonus(`:121-128`, strFlat)·str/dex(`:114-115`)·런타임 기동·쿨다운(`:133` scaleRuntimeMotion)에 **일괄 반영**된다. RN import 없음 → Node 호출 가능. 근사식에 레벨 보너스를 **추가하지 않는다**. 호출은 시뮬 분리 승인 후에만. → §5.2 AGREE 동일.

## 항목 3 — W1 다척 승률 0 계수 보정: **AGREE (보정 안 함)**

현 승률 근사의 장갑 경감(armor/100, 재검수 5 §2)은 **실게임과 다른 모델**이다. 실게임 경감은 위 `floor(armor*0.4)-floor(attackBonus*0.15)` (`PlanetEdenRaidTestLayer.tsx:1116`) + 실드 흡수 + 태세/스킬 배율이다. 따라서 **거친 계수를 맞추는 패치는 오답**이고, 대표님 지적(「버티는 시간」 폐기)과도 맞물린다 — 공식을 손보지 말고 교체한다. 궤도 실기 `hub_orbit:win|lose`는 재검수 5 기준 **0건**이니 지금 대조할 데이터가 없다. 실기 누적 → 분리된 시뮬로 대조. → §5.3 AGREE 동일.

## 항목 4 — W3 잔해 수색: **AGREE**

- 공급: `wreckWorldObjectProvider.ts:11` 가 행성마다 잔해 1개를 생성, id = `makeWorldObjectId(planetId,'wreck','1')` → `ids.ts:9` 포맷 `행성:wreck:1`.
- 게임 수색: `app/(game)/planet.tsx:1133-1135` `activeSalvageWreck` = kind==='wreck' 월드오브젝트, `:1610` 없으면 차단, `:1626` 그 id로 결과 산출, `:2209` 버튼 비활성.
- 가용성은 이미 전 행성이다. 트윈이 만드는 `wreck:<행성>`은 실게임 id와 어긋나지만, 봇은 실제 provider를 안 읽으므로 **표면적 불일치**다. 수색을 끄거나 잔해를 없애지 않는다. id 정렬(`행성:wreck:1`)은 후속이고 이번 구현 범위 아님. 대표님 규칙(연료 없고 채굴 불가 시 수색) 유지. → §5.4 AGREE 동일.

## 이번 턴 구현 착수: **아니오**

이유: 항목 1의 유일한 실착수 거리인 「피해 3함수 + 태세 파라미터화」 분리는 **게임 전투 파일 리팩터**라 대표님 승인 + Skia/전투 메모리 규칙 검토가 선행이다. 항목 2·3·4는 코드가 필요 없다(정본 호출·실기 데이터 대기·후속 id 정렬). 승인 전까지 트윈에 틱 루프·피해식 이식·잔해 게이트를 넣지 않는다.
