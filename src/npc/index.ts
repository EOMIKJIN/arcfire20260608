// ============================================================
// NPC 시스템 진입점 (전함·함장 DB 운용)
// ============================================================

export {
  getNpcCaptain,
  getNpcCapitalShip,
  getNpcCapitalAiContext,
  isPlayerRegistryCapitalShipId,
  listNpcCaptains,
  listNpcCapitalShips,
  listNpcCapitalShipsInSystem,
  listNpcCapitalShipsByFaction,
  listNpcCapitalShipsByCaptain,
  npcCapitalResolvedToCombatant,
  resolveNpcCapitalShip,
} from './npcFleetRegistry';
export {
  resolveNpcCaptainRelation,
  shouldNpcCaptainsEnterCombatByFaction,
  type NpcCaptainRelation,
} from './npcFactionDiplomacy';

export {
  EDEN_CAPITAL_FLEET_BLUE_COUNT,
  EDEN_CAPITAL_FLEET_LARGE_SCALE_BLUE_COUNT,
  EDEN_CAPITAL_FLEET_LARGE_SCALE_RED_COUNT,
  EDEN_CAPITAL_FLEET_RED_COUNT,
} from './edenCapitalFleetConfig';

export {
  nearbyPresenceHash32,
  NEARBY_PRESENCE_DISPLAY_SEP,
  resolveNearbyPresenceAiContexts,
  resolvePlanetNearbyPresence,
} from './nearbyOrbitPresenceSystem';
export type { NearbyOrbitMotion, NearbyOrbitPresenceRow } from './nearbyOrbitPresenceSystem';

export { mergeArcShipsIntoNearbyHubPresence } from './mergeArcTrafficIntoNearbyPresence';

export {
  getNpcCapitalHullClassDef,
  resolveNpcCapitalOrbitKinematic,
  resolveAmbientNpcCapitalHullClassId,
  listRegisteredNpcCapitalHullClassIds,
} from './npcCapitalClassRegistry';

export { npcDeterministicHash32 } from './npcDeterministicHash';

export {
  resolvePlanetNpcCapitalSlotCount,
  resolvePlanetNpcCapitalOperationPlan,
} from './npcPlanetOperationPlan';

export type {
  NpcCapitalHullClassDef,
  NpcCapitalOrbitKinematic,
  NpcCapitalOrbitMotionParams,
  NpcCapitalPlanetMovementIntent,
  NpcCapitalPlanetObjectiveTag,
  NpcCapitalPlanetOperationPlan,
} from '../types';
export {
  NPC_CAPITAL_HULL_FALLBACK_ID,
  NPC_PLANET_CAPITAL_SLOT_MAX,
  NPC_PLANET_CAPITAL_SLOT_MIN,
} from '../types';
