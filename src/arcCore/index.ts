/**
 * 아크코어 — 게임 전역 AI 중추. `arcCoreHub`가 런타임 허브.
 * @see `ArcCoreHub.ts` 상단 아키텍처 주석
 */
export { arcCoreHub } from './ArcCoreHub';
export {
  dispatchArcCoreCommand,
  dispatchEconomyTradePortBulk,
  subscribeArcCoreCommands,
} from './ArcCoreCommandBus';
export type {
  ArcCoreCommand,
  ArcCoreCommandMeta,
  ArcCoreCommandOrigin,
  EconomyTradePortBulkAction,
  EconomyTradePortBulkScope,
} from './ArcCoreCommandBus';
export { attachArcCoreRuntimeCommandBridge } from './ArcCoreRuntimeBridge';
export type {
  ArcCoreHub,
  ArcCoreProcess,
  ArcCoreTickContext,
  ArcCoreWallTickFn,
  ArcSubCore,
  ArcSubCoreMission,
} from './types';
export { AiEconomySubCore } from './subcores/AiEconomySubCore';
export { AiNpcSubCore } from './subcores/AiNpcSubCore';
export { AiPlanetsSubCore } from './subcores/AiPlanetsSubCore';
export { ArcNewsBoardSubCore } from './subcores/ArcNewsBoardSubCore';
export { ArcCoreMessageSubCore } from './subcores/ArcCoreMessageSubCore';
export { ARC_CORE_MESSAGE_DEFAULT_KO } from './message/arcCoreMessagePolicy';
export { ARC_CORE_MESSAGE_STRIKES_PER_DAY } from './message/arcCoreMessageDailyRandomStrikeSchedule';
export type {
  ArcCoreMessageStrikeScheduleProvider,
  ArcCoreMessageStrikeDayPlan,
} from './message/arcCoreMessageStrikeScheduleTypes';
export {
  ArcCoreMessageDailyRandomStrikeScheduleProvider,
  buildArcCoreMessageStrikeDayPlan,
} from './message/arcCoreMessageDailyRandomStrikeSchedule';
export { ArcCoreMessageStrikeScheduleController } from './message/arcCoreMessageStrikeScheduleController';
export { ArcPlanetNebulaSubCore } from './subcores/ArcPlanetNebulaSubCore';
export { AiAabsSubCore } from './subcores/AiAabsSubCore';
export {
  useAabsPolicyStore,
  applyAabsExpMultiplier,
  applyAabsCreditMultiplier,
  runDailyPolicyAlignment,
} from './aabs';
export { applyPolicyShift, userModController } from './userMod/UserModController';
export {
  ARC_NPC_TRAFFIC_MAX_SLOTS,
  listArcNpcTrafficRowsFromTables,
  type ArcNpcTrafficTableRow,
} from './arcNpcTrafficTableRegistry';
export { PlanetCorePortraitSvg, derivePlanetPortrait, quantizePortraitCore } from './planetCorePortrait';
export {
  collectPlanetInteractionSignals,
  collectSurroundingPlanetIds,
  computePlanetDiversityIndex,
  rebalancePlanetFiveFromDiversity,
  runPlanetEnvironmentDiversityPass,
  type PlanetInteractionSignals,
} from './planetEnvironment';

/** 제품·UI 표기명 */
export const ARC_CORE_DISPLAY_NAME = '아크코어' as const;
