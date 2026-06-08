/**
 * 뉴에덴 궤도 실시간 전함 함대 규모 — `PlanetEdenRaidTestLayer`의 `DUEL_TEAM_*_COUNT`와 동기화.
 *
 * 전투 규약(살보·유도·팀 승패 등)은 `src/combat/capitalCombatConventions.ts` 고정.
 * **대규모**도 동일 규약이며 아래 `LARGE_SCALE_*`만 쓰면 척수만 확장된다.
 */
/** 시험·기본 소규모 */
export const EDEN_CAPITAL_FLEET_RED_COUNT = 3;
export const EDEN_CAPITAL_FLEET_BLUE_COUNT = 3;

/** 대규모 전투 프리셋(동일 시뮬 규약, 에이전트 수만 증가) */
export const EDEN_CAPITAL_FLEET_LARGE_SCALE_RED_COUNT = 12;
export const EDEN_CAPITAL_FLEET_LARGE_SCALE_BLUE_COUNT = 12;
