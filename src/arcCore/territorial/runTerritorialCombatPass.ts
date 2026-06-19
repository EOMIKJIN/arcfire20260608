import {
  ARC_CORE_SEED_BLUE_CLAN_ID,
  ARC_CORE_SEED_RED_CLAN_ID,
} from '../balance/seedPlanetOccupationFromBalance';
import {
  getTerritorialCombatPolicy,
  listTerritorialCombatPolicies,
  listTerritorialFleetShipIds,
  type TerritorialFactionSide,
} from './arcCoreTerritorialCombatPolicy';
import {
  getTerritorialCombatLastPassAtMs,
  hydrateArcCoreTerritorialCombatState,
  markTerritorialCombatPassCompleted,
} from './arcCoreTerritorialCombatState';
import {
  opposingTerritorialSide,
  resolveHoldFactionSide,
  resolveTerritorialQuickCombat,
} from './resolveTerritorialQuickCombat';
import { showTerritorialOccupationChangeAlert } from './showTerritorialOccupationChangeAlert';
import { resolveMapFactionSideFromClanId } from '../../galaxyMap/resolveMapFactionSide';
import type { MapFactionSide } from '../../galaxyMap/resolveMapFactionSide';
import { useClanWarFoundationStore } from '../../store/clanWarFoundationStore';
import type { ClanWarOperation, PlanetClanHold, PlanetHoldKind } from '../../types';

export type TerritorialPassDecision = 'battle' | 'neutral_declare' | 'status_quo';

export type TerritorialPassResult = {
  planetId: string;
  decision: TerritorialPassDecision;
  holdChanged: boolean;
  previousSide: MapFactionSide;
  newSide: MapFactionSide;
  operationId?: string;
};

function clanIdForSide(side: TerritorialFactionSide): string {
  return side === 'RED' ? ARC_CORE_SEED_RED_CLAN_ID : ARC_CORE_SEED_BLUE_CLAN_ID;
}

function holdKindForSide(side: TerritorialFactionSide | 'NEUTRAL'): PlanetHoldKind {
  if (side === 'NEUTRAL') return 'neutral';
  return 'clan_hold';
}

function rollDecision(policy: NonNullable<ReturnType<typeof getTerritorialCombatPolicy>>): TerritorialPassDecision {
  const total =
    policy.battleWeightPct + policy.neutralDeclareWeightPct + policy.statusQuoWeightPct;
  if (total <= 0) return 'status_quo';
  let r = Math.random() * total;
  if (r < policy.battleWeightPct) return 'battle';
  r -= policy.battleWeightPct;
  if (r < policy.neutralDeclareWeightPct) return 'neutral_declare';
  return 'status_quo';
}

function resolveAttackerDefenderSides(
  holdSide: TerritorialFactionSide | 'NEUTRAL',
): { attacker: TerritorialFactionSide; defender: TerritorialFactionSide } {
  if (holdSide === 'BLUE') {
    return { attacker: 'RED', defender: 'BLUE' };
  }
  if (holdSide === 'RED') {
    return { attacker: 'BLUE', defender: 'RED' };
  }
  const attacker: TerritorialFactionSide = Math.random() < 0.5 ? 'BLUE' : 'RED';
  return { attacker, defender: opposingTerritorialSide(attacker) };
}

function makeOperationId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
}

function sideToMapFaction(side: TerritorialFactionSide | 'NEUTRAL'): MapFactionSide {
  if (side === 'BLUE') return 'blue';
  if (side === 'RED') return 'red';
  return 'neutral';
}

export async function runTerritorialCombatPassForPlanet(
  planetId: string,
  nowMs: number,
): Promise<TerritorialPassResult | null> {
  const policy = getTerritorialCombatPolicy(planetId);
  if (!policy?.enabled) return null;

  const lastPass = getTerritorialCombatLastPassAtMs(planetId);
  if (lastPass != null && nowMs - lastPass < policy.passIntervalSec * 1000) {
    return null;
  }

  const warStore = useClanWarFoundationStore.getState();
  if (!warStore.hydrated) {
    await warStore.loadLocalClanWarFoundation();
  }

  const hold = warStore.getHold(planetId);
  const holdSide = resolveHoldFactionSide(hold?.occupierClanId);
  const previousSide = sideToMapFaction(holdSide);
  const decision = rollDecision(policy);

  let newSide = previousSide;
  let holdChanged = false;
  let operationId: string | undefined;
  let attackerWon: boolean | undefined;

  if (decision === 'status_quo') {
    await markTerritorialCombatPassCompleted(planetId, nowMs);
    return { planetId, decision, holdChanged: false, previousSide, newSide: previousSide };
  }

  if (decision === 'neutral_declare') {
    if (holdSide !== 'NEUTRAL') {
      const applied = warStore.applyArcCoreTerritorialHold({
        planetId,
        systemId: policy.systemId,
        factionSide: 'NEUTRAL',
        operationMeta: { source: 'arc_core_territorial', decision },
      });
      holdChanged = applied.changed;
      newSide = applied.newSide;
      operationId = applied.operationId;
    }
    await markTerritorialCombatPassCompleted(planetId, nowMs);
    if (holdChanged) {
      showTerritorialOccupationChangeAlert({
        planetLabelKo: policy.alertLabelKo,
        previousSide,
        newSide,
        decision,
      });
    }
    return { planetId, decision, holdChanged, previousSide, newSide, operationId };
  }

  const { attacker, defender } = resolveAttackerDefenderSides(holdSide);
  const attackerShipIds = listTerritorialFleetShipIds(planetId, attacker);
  const defenderShipIds = listTerritorialFleetShipIds(planetId, defender);
  if (attackerShipIds.length === 0 || defenderShipIds.length === 0) {
    await markTerritorialCombatPassCompleted(planetId, nowMs);
    return { planetId, decision, holdChanged: false, previousSide, newSide: previousSide };
  }

  const combat = resolveTerritorialQuickCombat({
    attackerShipIds,
    defenderShipIds,
    defenderAdvantagePct: policy.defenderAdvantagePct,
    combatNoisePct: policy.combatNoisePct,
  });
  attackerWon = combat.winner === 'attacker';

  let targetFaction: TerritorialFactionSide | 'NEUTRAL' = holdSide;
  if (attackerWon) {
    targetFaction = attacker;
  } else if (holdSide === 'NEUTRAL') {
    targetFaction = defender;
  } else {
    targetFaction = holdSide;
  }

  const applied = warStore.applyArcCoreTerritorialHold({
    planetId,
    systemId: policy.systemId,
    factionSide: targetFaction,
    operationMeta: {
      source: 'arc_core_territorial',
      decision,
      attackerSide: attacker,
      defenderSide: defender,
      attackerWon,
      combat,
    },
  });
  holdChanged = applied.changed;
  newSide = applied.newSide;
  operationId = applied.operationId;

  await markTerritorialCombatPassCompleted(planetId, nowMs);

  if (holdChanged) {
    showTerritorialOccupationChangeAlert({
      planetLabelKo: policy.alertLabelKo,
      previousSide,
      newSide,
      decision,
      attackerWon,
    });
  }

  return { planetId, decision, holdChanged, previousSide, newSide, operationId };
}

export async function runTerritorialCombatPass(nowMs = Date.now()): Promise<TerritorialPassResult[]> {
  await hydrateArcCoreTerritorialCombatState();
  const results: TerritorialPassResult[] = [];
  for (const policy of listTerritorialCombatPolicies()) {
    if (!policy.enabled) continue;
    const row = await runTerritorialCombatPassForPlanet(policy.planetId, nowMs);
    if (row) results.push(row);
  }
  return results;
}

export function resolveTerritorialHoldMapSide(hold: PlanetClanHold | undefined): MapFactionSide {
  return resolveMapFactionSideFromClanId(hold?.occupierClanId ?? 'neutral');
}
