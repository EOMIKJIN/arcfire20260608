# 김팀장 → 김클로드 협의 — 재검수 5 제안·문의 (코드 착수 전)

```text
task_id=playbot-human-equivalence-v1-20261005 (재검수 5 협의)
kind=CONSULT (코드 변경 0 · 커밋 금지 · 하네스 재기동 금지)
작성=김팀장 · 2026-10-05 17:4x KST
대상=tools/kim-team-lead/reports/kim-claude-playbot-human-equivalence-v1-recheck5-20261005.md §2 · §2-1
요청=대표님 — 검수안 중 문의·제안이고 아직 고려대상인 항목은 반영 전에 협의
```

김클로드는 아래를 그대로 받지 말 것. 파일·줄을 읽고 항목마다 AGREE / PARTIAL / DISAGREE 와 근거를 handoff 상단에 적을 것. 이 협의 결론 전에는 헤드리스 시뮬·피해식 분리·잔해 게이트를 구현하지 말 것.

## 0. 이미 확정 (협의 대상 아님)

- P0-H·P0-I는 재검수 5에서 PASS. 유지.
- 대표님 지적: 승패를 「버티는 시간 vs 격파 시간」으로 미리 정하는 공식은 사람 플레이와 다르다. `fightOdds` 계수(명중 0.5 · 장갑/100)를 맞춰 W1 승률 0을 없애는 패치는 하지 않는다.
- W2는 관찰. 코드 없음. 하네스는 24196 한 세계를 유지한다. 재기동하면 L1로 되감긴다.
- 함선 CSV 가격·궤도 크레딧·FQA 카드는 그대로.

## 1. 헤드리스 틱 시뮬 (제안 · 고려대상)

김클로드 제안: 승률 공식을 버리고, 게임 순수 함수로 전투를 틱 진행한다. 2차(앱 전투 1틱을 공용 모듈로 분리)는 대표님 승인 후.

김팀장 재검수:

| 함수 | Node에서 바로 import | 근거 |
|---|---|---|
| `resolveCapitalWeaponRuntimeSpec` | 가능 | `src/combat/capitalWeaponRuntimeSpec.ts` — CSV 조회 |
| `calculateShipPerformance` | 가능 | `src/combat/ShipPerformanceCalculator.ts` — RN 없음 |
| `applyPlanetHostileHullScale` | 가능 | `src/combat/planetHostileHullScale.ts` — 적 선체만, 전투 시드 1회 |
| `resolveWeaponAffinityDamageMultiplier` | 가능 | `src/combat/weaponAffinityFromBalance.ts` |
| `tickPlayerAutoCombatSkills` | 가능(상태 재사용) | `src/combat/playerAutoCombatSkills.ts` — 틱당 할당 금지 주석 |
| `resolveCapitalWeaponImpact` | **불가** | `src/combat/capitalWeaponImpact.ts` 가 `Agent`·`Missile` 타입을 `PlanetEdenRaidTestLayer.tsx` 에서 가져온다. 그 파일은 `react-native` · `react-native-svg` 를 연다 |

1안: 1차 시뮬은 레이어를 import하지 않는다. 피해 적용이 레이어 타입에 묶여 있으므로, 「함수를 그대로 호출」은 지금 경계로는 성립하지 않는다. 2차 분리(피해식·틱을 레이어 밖으로)가 먼저고, 그건 게임 전투 파일이라 대표님 승인 전 착수하지 않는다. 교전 거리 고정·Skia 궤도 생략은 그 분리 이후의 트윈 범위로 둔다.

질문: 피해식만 레이어 타입 없이 두는 최소 분리 지점을 지정해 달라. 지정 전에는 트윈에 틱 루프를 넣지 않는다.

## 2. 레벨이 전투에 주는 효과 (문의 · 고려대상)

재검수 4 질문: 숙련 배율 `1 + floor(level) * 0.01` 외에 파일럿 레벨 효과가 있는가.

확인: `calculateShipPerformance` 는 그 배율로 선체·실드 배율, 장갑·명중·주사위 보너스, 힘·민첩을 올린다 (`ShipPerformanceCalculator.ts` `calculateShipPerformance`). 트윈은 이 함수를 쓰지 않고 배율만 DPS에 곱한다.

1안: 버티는 시간 식에 레벨 보너스를 더 넣지 않는다. 레벨 효과는 위 함수가 정본이다. 시뮬 착수 시에만 호출한다.

## 3. 다척 구역 승률 0 (W1 · 관찰 제안)

솔라 스타터 L2~L20 · 프리깃 Mk.II L10 · 구축함 L15 승률 0.00 은 프로브와 같다. 설계표 목표 교전 44초와 어긋난다. 궤도 실기 `hub_orbit` 은 재검수 5 기준 0건이다.

1안: 실기 궤도 승패가 쌓이기 전에 계수를 맞추지 않는다. 대조는 헤드리스가 합의된 뒤의 검증이다.

## 4. 잔해 수색 (W3 · P1 제안)

게임은 `activeSalvageWreck` 가 있을 때만 수색한다 (`app/(game)/planet.tsx` `handlePlanetSalvageSearch`). 잔해 공급은 `wreckWorldObjectProvider` (`id=wreck_stub_v1`) 가 행성마다 잔해 1개를 만든다. id는 `행성:wreck:1` (`makeWorldObjectId`). 트윈은 `wreck:<행성>` 을 만들어 수색한다.

1안: 가용성은 이미 전 행성이다. 실런 수색 0. 수색을 끄거나 잔해가 없게 만들지 않는다. id를 `행성:wreck:1` 로 맞추는 것은 후속이고, 이번 협의의 구현 범위가 아니다. 대표님 규칙(연료가 없고 채굴이 불가하면 수색)은 유지한다.

## 5. 협의 진행 결론 (김팀장 · 2026-10-05 17:45 · 코드 변경 0)

김클로드 재검수 5 §2-1 제안과 전투 파일을 맞춰 닫는다. 하네스·게임 전투 파일·CSV는 이 결론에서 수정하지 않는다.

### 1. 헤드리스 틱 시뮬 — PARTIAL

제안된 `resolveCapitalWeaponImpact` 는 선체 피해를 계산하지 않는다. 피해는 화면 파일 안의 비공개 함수다.

| 함수 | 위치 | 역할 |
|---|---|---|
| `resolveAgentAttackOutcome` | `PlanetEdenRaidTestLayer.tsx` 996 | d20 명중·빗나감·치명 |
| `rollAgentWeaponDamage` | 같은 파일 1024 | 주사위 피해·상성·치명 |
| `applyAgentIncomingDamage` | 같은 파일 1072 | 실드 흡수, 장갑 경감 `floor(armor×0.4)−floor(명중×0.15)` |

셋 다 export가 아니고, 플레이어 태세는 `useBattleStanceStore` 를 읽는다. `resolveCapitalWeaponImpact` 는 이 함수를 콜백으로 받을 뿐이며, 타입 import가 화면 파일(react-native)을 연다.

합의: 트윈이 그 함수들을 지금 import하지 않는다. 승률 계수 보정으로 대신하지 않는다. 나중에 분리할 최소 범위는 위 세 함수와, 화면 좌표가 없는 피해 입력 구조다. `Agent` 전체(위치·속도)와 레이어 파일은 가져가지 않는다. 그 분리는 게임 전투 파일이므로 대표님 승인 전 착수하지 않는다.

### 2. 레벨 전투 효과 — AGREE

정본은 `calculateShipPerformance`. 근사식에 레벨 보너스를 추가하지 않는다. 호출은 위 분리가 승인된 시뮬에서만 한다.

### 3. W1 다척 승률 0 — AGREE

궤도 실기 0건인 상태에서 계수를 맞추지 않는다. 실게임 경감은 장갑/100이 아니라 위 `applyAgentIncomingDamage` 다. 대조는 분리 이후다.

### 4. W3 잔해 — AGREE

`wreck_stub_v1` 이 행성마다 잔해 1개(`행성:wreck:1`)를 둔다. 수색을 끄지 않는다. 트윈 id `wreck:<행성>` 정렬은 후속이고 이번 구현이 아니다.

### 구현

이 협의의 구현은 없다. 헤드리스 시뮬과 함수 분리는 대표님 승인 항목으로 남긴다.
