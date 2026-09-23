// ============================================================
// NPC 배치 정책 집행 — AABS §2-C
// `npc_gather_planet`은 유인 비콘·총독 security 전용(궤도 함선 전체 소집).
// 일일 `runDailyPolicyAlignment`에서는 호출하지 않는다(허브 트래픽 몰림 방지).
// ============================================================

import { listCoreOpenGameplaySystemIds, resolveCoreOpenStarSystem } from '../../world/coreOpenGameplayPlanets';
import { listNpcCaptains } from '../../npc/npcFleetRegistry';
import { dispatchArcCoreCommand } from '../ArcCoreCommandBus';
import type { StarSystem } from '../../types';

export function enforceNpcDeploymentPolicy(maxMoves = 3): number {
  let moves = 0;
  const systems: StarSystem[] = [];
  for (const systemId of listCoreOpenGameplaySystemIds()) {
    const sys = resolveCoreOpenStarSystem(systemId);
    if (sys) systems.push(sys);
  }
  const systemsById = new Map(systems.map((s) => [s.id, s]));
  const lowLevelSystems = systems.filter((s) => s.enemyLevel <= 5);

  for (const captain of listNpcCaptains()) {
    if (moves >= maxMoves) break;
    if (captain.operationalState !== 'combat') continue;
    if (captain.questOnly) continue;
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
