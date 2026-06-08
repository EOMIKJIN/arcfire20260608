// ============================================================
// 실시간 전투 — 진입점 (D20 턴제 `src/engine` 과 분리)
// ============================================================

export {
  BATTLE_FIXED_DT_MS,
  BATTLE_MAX_ENTITIES,
  BATTLE_MAX_SIM_STEPS_PER_FRAME,
  BATTLE_MAX_WEAPON_VISUALS,
  BATTLE_TARGET_SIM_HZ,
} from './battleConstants';

export { BATTLE_ARCHITECTURE_SNAPSHOT } from './battleArchitecture';

export type {
  BattleDiamondStyle,
  BattleEmpVisualSpec,
  BattleLaserVisualSpec,
  BattleMissileVisualSpec,
  BattlePackedRgb,
  BattleTeamId,
  BattleWeaponVisualKind,
  BattleWeaponVisualSpec,
} from './battleTypes';
export { BattleLightingFlags } from './battleTypes';

export type { BattleArenaBuffers } from './battleArenaBuffers';
export { createBattleArenaBuffers, clearBattleArenaActive } from './battleArenaBuffers';

export { BattleIndexPool } from './indexPool';

export type { BattleSimStepFn } from './simClock';
export { consumeBattleSimAccumulator } from './simClock';

export { defaultWeaponVisual } from './weaponVisualDefaults';

export { integrateBattleArenaCapitalShips, integrateBattleArenaLinear } from './battleSimStub';

export { useBattleSimLoop } from './useBattleSimLoop';

export type {
  FirestoreUserDocMock,
  FirestoreUserShipStatsMock,
  SeamlessBattlePerformanceProfile,
  SeamlessBattleStatus,
  SeamlessBattleTeam,
  SeamlessCombatantRuntime,
  Vec2,
} from './seamlessPvpTypes';

export {
  SEAMLESS_BATTLE_MAX_COMBATANTS,
  checkProximity,
  resolveSeamlessBattlePerformanceMode,
  tickSeamlessBattle,
} from './seamlessPvpEngine';

export { createMockSeamlessUsers } from './mockSeamlessPvpUsers';
export { useSeamlessPvpSimulation } from './useSeamlessPvpSimulation';
