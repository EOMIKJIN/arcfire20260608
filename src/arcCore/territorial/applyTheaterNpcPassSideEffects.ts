// ============================================================
// NPC 영토전 패스 후 주둔·승리금. 플레이어 웨이브 경로에서 호출 금지.
// ============================================================

import { useClanWarFoundationStore } from '../../store/clanWarFoundationStore';
import { resolveFactionVaultForPlanetId } from '../economy/resolveFactionVault';
import { resolveHoldFactionSide } from './territorialFactionSide';
import { getArcCoreTheaterGarrisonPolicy } from './arcCoreTheaterGarrisonPolicy';
import { applyTheaterBattleGarrisonPct } from './applyTheaterGarrisonAdjustments';
import {
  getTheaterGarrisonPct,
  setTheaterGarrisonPct,
} from './theaterGarrisonStore';
import { recordTerritorialPassObservation } from './territorialPassObservation';
import { isPlanetInActiveTerritorialRotation } from './resolveWarTheaterState';

export function applyTheaterNpcPassSideEffects(input: {
  planetId: string;
  decision: string;
  holdChanged: boolean;
  source?: 'npc' | 'player_wave' | 'skip';
}): { spoilsCredits: number; garrisonAfter: number } {
  const policy = getArcCoreTheaterGarrisonPolicy();
  const source = input.source ?? 'npc';
  const planetId = input.planetId.trim();
  const empty = { spoilsCredits: 0, garrisonAfter: getTheaterGarrisonPct(planetId) };

  if (!policy.enabled || !planetId) return empty;
  if (source === 'player_wave' && !policy.applyOnPlayerWave) {
    recordTerritorialPassObservation({
      planetId,
      decision: input.decision,
      holdChanged: input.holdChanged,
      garrisonAfter01: empty.garrisonAfter,
      spoilsCredits: 0,
      atMs: Date.now(),
      source: 'player_wave',
    });
    return empty;
  }
  if (source === 'skip' || !isPlanetInActiveTerritorialRotation(planetId)) {
    return empty;
  }

  let outcome: 'defend_win' | 'occupy' | 'status_quo' = 'status_quo';
  if (input.decision === 'battle' && input.holdChanged) outcome = 'occupy';
  else if (input.decision === 'battle' && !input.holdChanged) outcome = 'defend_win';

  const nextPct = applyTheaterBattleGarrisonPct({
    currentPct: getTheaterGarrisonPct(planetId),
    outcome,
  });
  setTheaterGarrisonPct(planetId, nextPct);

  let spoilsCredits = 0;
  if (outcome === 'occupy' && policy.spoilsOnOccupyCredits > 0) {
    const hold = useClanWarFoundationStore.getState().getHold(planetId);
    const side = resolveHoldFactionSide(hold?.occupierClanId);
    if (side === 'NEUTRAL') {
      recordTerritorialPassObservation({
        planetId,
        decision: input.decision,
        holdChanged: input.holdChanged,
        garrisonAfter01: nextPct,
        spoilsCredits: 0,
        atMs: Date.now(),
        source: 'npc',
      });
      return { spoilsCredits: 0, garrisonAfter: nextPct };
    }
    const vault = resolveFactionVaultForPlanetId(planetId);
    if (vault) {
      vault.appendInflow(policy.spoilsOnOccupyCredits, {
        kind: 'theater_spoils',
        planetId,
        note: 'npc_occupy',
      });
      spoilsCredits = policy.spoilsOnOccupyCredits;
    }
  }

  recordTerritorialPassObservation({
    planetId,
    decision: input.decision,
    holdChanged: input.holdChanged,
    garrisonAfter01: nextPct,
    spoilsCredits,
    atMs: Date.now(),
    source: 'npc',
  });

  return { spoilsCredits, garrisonAfter: nextPct };
}
