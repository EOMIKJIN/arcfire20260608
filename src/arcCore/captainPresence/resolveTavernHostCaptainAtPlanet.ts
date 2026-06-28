// ============================================================
// 선술집 주인 — getCaptainPrimaryPresence() 수렴
// ============================================================

import type { NpcCaptain } from '../../types';
import { listNpcCaptains } from '../../npc/npcFleetRegistry';
import {
  getCaptainPrimaryPresence,
  type getCaptainPresenceWorldIndex,
} from './buildCaptainPresenceWorldIndex';

/** CSV tavernPlanetIds + primary가 타 행성/궤도에 고정되지 않을 때 */
export function resolveTavernHostCaptainAtPlanet(
  planetId: string,
  arcShips: Parameters<typeof getCaptainPresenceWorldIndex>[0] = [],
): NpcCaptain | undefined {
  const pid = String(planetId ?? '').trim();
  if (!pid) return undefined;

  let best: NpcCaptain | undefined;
  let bestPriority = -1;

  for (const captain of listNpcCaptains()) {
    if (!captain.tavernPlanetIds.includes(pid)) continue;
    const primary = getCaptainPrimaryPresence(captain.id, arcShips);
    if (primary?.planetId && primary.planetId !== pid) continue;
    const pri = captain.mainStageTalkPriority ?? 5;
    if (pri >= bestPriority) {
      bestPriority = pri;
      best = captain;
    }
  }

  return best;
}
