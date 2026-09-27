// ============================================================
// 바 주인 — getCaptainPrimaryPresence() 수렴
// ============================================================

import type { NpcCaptain } from '../../types';
import { listNpcCaptains } from '../../npc/npcFleetRegistry';
import {
  getCaptainPrimaryPresence,
  type getCaptainPresenceWorldIndex,
} from './buildCaptainPresenceWorldIndex';
import { pickBarHostCaptainFromList } from './pickBarHostCaptain';

export {
  isSynthBarKioskHost,
  SYNTH_BAR_HOST_CAPTAIN_ID,
  SYNTH_BAR_HOST_SCOPE,
} from './pickBarHostCaptain';

/** CSV barPlanetIds + primary가 타 행성/궤도에 고정되지 않을 때 */
export function resolveBarHostCaptainAtPlanet(
  planetId: string,
  arcShips: Parameters<typeof getCaptainPresenceWorldIndex>[0] = [],
): NpcCaptain | undefined {
  return pickBarHostCaptainFromList(listNpcCaptains(), planetId, (captainId) => {
    return getCaptainPrimaryPresence(captainId, arcShips)?.planetId ?? null;
  });
}
