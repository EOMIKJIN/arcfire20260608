// ============================================================
// NPC 배치 정책 집행 — AABS §2-C
// ============================================================

import { STAR_SYSTEMS_FROM_CSV } from '../../data/generated';
import { listNpcCaptains } from '../../npc/npcFleetRegistry';
import { dispatchArcCoreCommand } from '../ArcCoreCommandBus';

export function enforceNpcDeploymentPolicy(maxMoves = 3): number {
  let moves = 0;
  const systems = Object.values(STAR_SYSTEMS_FROM_CSV);
  const systemsById = new Map(systems.map((s) => [s.id, s]));
  const lowLevelSystems = systems.filter((s) => s.enemyLevel <= 5);

  for (const captain of listNpcCaptains()) {
    if (moves >= maxMoves) break;
    if (captain.operationalState !== 'combat') continue;
    if (captain.arcOrbitPresenceFill) continue;
    const sysId = captain.baseSystemId?.trim();
    if (!sysId) continue;
    const sys = systemsById.get(sysId);
    if (!sys) continue;
    if (sys.enemyLevel > 8) continue;

    const target = lowLevelSystems.find((s) => s.enemyLevel >= 6);
    const planetId = target?.planets[0]?.id;
    if (!planetId) continue;

    dispatchArcCoreCommand({
      type: 'npc_gather_planet',
      planetId,
      meta: { origin: 'arc_core_policy', reason: 'aabs_deployment_rebalance' },
    });
    moves += 1;
  }
  return moves;
}
