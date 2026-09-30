import { resolveStelliumAnnexPolicy } from '../../../src/arcCore/annex/stelliumAnnexPolicy';
import { shouldHoldNpcOccupyAfterPlayerNeutralize } from '../../../src/arcCore/annex/stelliumAnnexEligibility';
import { listAdjacentSystemIds } from '../../../src/arcCore/territorial/territorialSupplyLine';
import { resolveHoldFactionSide } from '../../../src/arcCore/territorial/territorialFactionSide';
import type { Rng } from './rng';
import type { JournalEntry, WorldState } from './types';
import { BLUE_CLAN, NEUTRAL_CLAN, RED_CLAN } from './types';
import { paintOf, toHolds } from './world';

function adjacentHas(world: WorldState, systemId: string, side: 'BLUE' | 'RED'): boolean {
  const adj = listAdjacentSystemIds(systemId);
  const ids = Object.keys(world.planets);
  for (let i = 0; i < adj.length; i += 1) {
    for (let j = 0; j < ids.length; j += 1) {
      const slot = world.planets[ids[j]];
      if (slot.systemId !== adj[i]) continue;
      if (resolveHoldFactionSide(slot.occupierClanId) === side) return true;
    }
  }
  return false;
}

/** 일 1회 NPC 영토 롤 — 체류 중이면 해당 행성 스킵. 보호창은 eligibility 순수함수. */
export function runTerritorialDay(world: WorldState, rng: Rng): JournalEntry[] {
  const out: JournalEntry[] = [];
  const policy = resolveStelliumAnnexPolicy();
  const holds = toHolds(world);
  const ids = Object.keys(world.planets);

  for (let i = 0; i < ids.length; i += 1) {
    const slot = world.planets[ids[i]];
    if (!slot.combatEnabled) continue;
    if (world.currentPlanetId === slot.planetId) {
      out.push(event(world, 'TERRITORIAL', `${slot.labelKo} 체류 중 — NPC 점령 보류`));
      continue;
    }
    const hold = holds[slot.planetId];
    if (
      shouldHoldNpcOccupyAfterPlayerNeutralize({
        hold,
        nowMs: world.nowMs,
        protectMs: policy.protectNeutralizedMs,
      })
    ) {
      out.push(event(world, 'TERRITORIAL', `${slot.labelKo} 중립 보호창 — NPC 점령 보류`));
      continue;
    }

    const paint = paintOf(slot);
    if (paint === 'INDEPENDENT') continue;

    const redAdj = adjacentHas(world, slot.systemId, 'RED');
    const blueAdj = adjacentHas(world, slot.systemId, 'BLUE');
    const contestedBonus = slot.contested ? 0.08 : 0;

    if (paint === 'NEUTRAL') {
      const redChance = (redAdj ? 0.12 : 0.04) + contestedBonus;
      const blueChance = blueAdj ? 0.08 : 0.02;
      const roll = rng();
      if (roll < redChance) {
        slot.occupierClanId = RED_CLAN;
        slot.kind = 'clan_hold';
        slot.capturedAt = world.nowMs;
        slot.neutralizedAt = null;
        out.push(event(world, 'TERRITORIAL', `${slot.labelKo} NPC 자동전투 → 크림슨 점유`));
      } else if (roll < redChance + blueChance) {
        slot.occupierClanId = BLUE_CLAN;
        slot.kind = 'clan_hold';
        slot.capturedAt = world.nowMs;
        slot.neutralizedAt = null;
        out.push(event(world, 'TERRITORIAL', `${slot.labelKo} NPC 자동전투 → 스텔리움 점유`));
      }
      continue;
    }

    if (paint === 'BLUE' && redAdj && rng() < 0.1 + contestedBonus) {
      slot.occupierClanId = NEUTRAL_CLAN;
      slot.kind = 'neutral';
      slot.neutralizedAt = world.nowMs;
      out.push(event(world, 'TERRITORIAL', `${slot.labelKo} 접전 → 중립화`));
    } else if (paint === 'RED' && blueAdj && rng() < 0.06) {
      slot.occupierClanId = NEUTRAL_CLAN;
      slot.kind = 'neutral';
      slot.neutralizedAt = world.nowMs;
      out.push(event(world, 'TERRITORIAL', `${slot.labelKo} 반격 → 중립화`));
    }
  }

  world.dailyBatchCount += 1;
  out.push(event(world, 'DAILY', `일일 배치 마커 #${world.dailyBatchCount} (가상 정오)`));
  return out;
}

function event(
  world: WorldState,
  kind: JournalEntry['kind'],
  line: string,
): JournalEntry {
  return {
    t: Date.now(),
    day: world.day,
    tick: world.tick,
    kind,
    line,
  };
}
