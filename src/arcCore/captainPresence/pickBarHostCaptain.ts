import type { NpcCaptain } from '../../types';
import { isSynthFrontierPlanetId } from '../../world/isSynthFrontierPlanetId';

export const SYNTH_BAR_HOST_SCOPE = 'synth' as const;
export const SYNTH_BAR_HOST_CAPTAIN_ID = 'npc_cpt_bar_ret_synth';

export function isSynthBarKioskHost(
  captain: Pick<NpcCaptain, 'barHostScope' | 'id'> | null | undefined,
): boolean {
  if (!captain) return false;
  return captain.barHostScope === SYNTH_BAR_HOST_SCOPE || captain.id === SYNTH_BAR_HOST_CAPTAIN_ID;
}

/** 명시 행성 주인 우선 · 없으면 신스 범용 키오스크 */
export function pickBarHostCaptainFromList(
  captains: readonly NpcCaptain[],
  planetId: string,
  readPrimaryPlanetId?: (captainId: string) => string | null | undefined,
): NpcCaptain | undefined {
  const pid = String(planetId ?? '').trim();
  if (!pid) return undefined;

  let best: NpcCaptain | undefined;
  let bestPriority = -1;
  for (let i = 0; i < captains.length; i += 1) {
    const captain = captains[i]!;
    if (!captain.barPlanetIds.includes(pid)) continue;
    const primaryPlanet = readPrimaryPlanetId?.(captain.id);
    if (primaryPlanet && primaryPlanet !== pid) continue;
    const pri = captain.mainStageTalkPriority ?? 5;
    if (pri >= bestPriority) {
      bestPriority = pri;
      best = captain;
    }
  }
  if (best) return best;
  if (!isSynthFrontierPlanetId(pid)) return undefined;
  for (let i = 0; i < captains.length; i += 1) {
    if (captains[i]!.barHostScope === SYNTH_BAR_HOST_SCOPE) return captains[i];
  }
  return captains.find((c) => c.id === SYNTH_BAR_HOST_CAPTAIN_ID);
}
