// ============================================================
// 행성별 NPC 기함 주둔 수 + [운용설계] 스텁
// - 주둔 수: planetId+systemId 결정론 1..4 (임시)
// - 목적·이동·임무 필드: 추후 NPC AI가 갱신할 수 있도록 구조만 고정
// ============================================================

import type {
  NpcCapitalPlanetMovementIntent,
  NpcCapitalPlanetObjectiveTag,
  NpcCapitalPlanetOperationPlan,
} from '../types';
import { NPC_PLANET_CAPITAL_SLOT_MAX, NPC_PLANET_CAPITAL_SLOT_MIN } from '../types';
import { npcDeterministicHash32 } from './npcDeterministicHash';

const OBJECTIVE_TAGS: readonly NpcCapitalPlanetObjectiveTag[] = [
  'patrol',
  'garrison',
  'transit',
  'training',
  'unknown',
] as const;

const MOVEMENT_INTENTS: readonly NpcCapitalPlanetMovementIntent[] = [
  'hold_orbit',
  'patrol_near_planet',
  'await_orders',
] as const;

/** 행성·성계별 궤도에 올릴 NPC 기함 수 (결정론, 1..4) */
export function resolvePlanetNpcCapitalSlotCount(planetId: string, systemId: string): number {
  const h = npcDeterministicHash32(`capitalCount:${planetId}:${systemId}`);
  const span = NPC_PLANET_CAPITAL_SLOT_MAX - NPC_PLANET_CAPITAL_SLOT_MIN + 1;
  return NPC_PLANET_CAPITAL_SLOT_MIN + (h % span);
}

/**
 * NPC AI [운용설계] 스냅샷 — 현재는 시드 기반 스텁.
 * 추후: 미션 스토어·함대 AI가 `missionTemplateId`·`routingNotes`·이동 그래프를 채운다.
 */
export function resolvePlanetNpcCapitalOperationPlan(
  planetId: string,
  systemId: string,
): NpcCapitalPlanetOperationPlan {
  const stationedCapitalCount = resolvePlanetNpcCapitalSlotCount(planetId, systemId);
  const ho = npcDeterministicHash32(`operation:${planetId}:${systemId}`);
  const objectiveTag = OBJECTIVE_TAGS[ho % OBJECTIVE_TAGS.length]!;
  const movementIntent = MOVEMENT_INTENTS[(ho >>> 4) % MOVEMENT_INTENTS.length]!;
  return {
    planetId,
    systemId,
    stationedCapitalCount,
    objectiveTag,
    movementIntent,
    missionTemplateId: null,
    routingNotes: 'NPC AI [운용설계] 미연결 — 주둔 수·목적·이동은 시드 스텁입니다.',
  };
}
