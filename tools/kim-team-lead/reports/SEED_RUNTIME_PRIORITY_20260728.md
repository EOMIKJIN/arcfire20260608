# 시드 < 진행 우선순위 고정 (2026-07-28)

## 대표님 지시
초기값(시드)은 단순 디폴트. **분쟁·영토 프로세스 진행 중에는 현재 hold/진행이 항상 우선.**

## 처리
| 축 | 변경 |
|---|---|
| `territorialCombatGraph` | 인접 BLUE/RED = `planetHolds` 정본 (시드는 holds 생략 시에만) |
| `runTerritorialCombatPass` | validate에 `warStore.planetHolds` 전달 |
| `seedPlanetOccupationFromBalance` | `isTerritorialProcessPlanet`이면 국가 시드 **복구 금지** |
| `isTerritorialProcessPlanet` | contested seed · dynamic · `policy.enabled` |
| `resolveEffectiveMapOccupierClanId` | 분쟁/영토 프로세스에서 시드 폴백 **금지** |

## 검증
- `seedPlanetOccupationFromBalance.test.ts` PASS
- `territorialCombatGraph.test.ts` PASS
- `tsc --noEmit -p tsconfig.client.json` PASS (재확인)
