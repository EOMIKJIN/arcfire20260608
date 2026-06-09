export type {
  MiningSessionState,
  MiningSystemStatus,
  MiningTickResult,
} from './types';

export {
  createInitialMiningSessionState,
  startMiningSession,
  pauseMiningSession,
  stopMiningSession,
  runMiningTick,
  applyOrbitalMiningRewardForCurrentPlayerCycle,
} from './service';

export {
  scheduleMiningPlayerPersist,
  flushMiningPlayerPersist,
} from './miningPlayerPersist';
export {
  captureMiningResumeSnapshot,
  clearMiningResumeSnapshot,
  consumeMiningResumeSnapshotForPlanet,
  hydrateMiningResumeStore,
  miningResumeSnapshotToSession,
  peekMiningResumeSnapshot,
} from './miningResumeStore';
export type { MiningResumeSnapshot } from './miningResumeStore';

export { useMiningDriver } from './useMiningDriver';
export type { MiningGrant, UseMiningDriverOptions } from './useMiningDriver';
