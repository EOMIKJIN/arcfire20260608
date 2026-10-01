/**
 * 엔드 전선 — 캡/퀘 소진 후 편입 가능한 이웃을 고른다.
 */
import { hasStelliumAnnexFriendlyAdjacency } from '../../../src/arcCore/annex/stelliumAnnexEligibility';
import { TICK_GAME_MS, TICKS_PER_DAY } from './clock';
import { CORE_PLANET_IDS, hopsBetween } from './catalog';
import type { WorldState } from './types';
import { paintOf, toHolds } from './world';

export const PLAYBOT_FRONT_LEVY_CREDITS = 2000;

export function resolvePlaybotNeutralizeProtectMs(policyMs: number): number {
  const dayMs = TICK_GAME_MS * TICKS_PER_DAY;
  return Math.max(Math.max(0, policyMs | 0), dayMs);
}

export function levyBlueVaultOnFrontWin(world: WorldState): number {
  world.blueVault += PLAYBOT_FRONT_LEVY_CREDITS;
  return PLAYBOT_FRONT_LEVY_CREDITS;
}

export function pickFrontPlanetId(world: WorldState): string {
  const holds = toHolds(world);
  let bestAnnexId = '';
  let bestAnnexScore = 1e9;
  let bestFightId = '';
  let bestFightScore = 1e9;

  for (let i = 0; i < CORE_PLANET_IDS.length; i += 1) {
    const id = CORE_PLANET_IDS[i];
    const slot = world.planets[id];
    if (!slot || !slot.combatEnabled) continue;
    if (id === 'eternal_throne' || id === 'genesis_origin') continue;
    const paint = paintOf(slot);
    if (paint === 'INDEPENDENT' || paint === 'BLUE') continue;
    const hops = hopsBetween(world.currentSystemId, slot.systemId);
    const adj = hasStelliumAnnexFriendlyAdjacency(slot.systemId, holds);
    if (paint === 'NEUTRAL' && adj) {
      const score = hops;
      if (score < bestAnnexScore) {
        bestAnnexScore = score;
        bestAnnexId = id;
      }
    }
    if (paint === 'RED' || paint === 'NEUTRAL') {
      const score = hops + (adj ? 0 : 8);
      if (score < bestFightScore) {
        bestFightScore = score;
        bestFightId = id;
      }
    }
  }
  return bestAnnexId || bestFightId || world.currentPlanetId;
}
