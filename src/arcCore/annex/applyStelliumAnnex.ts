// ============================================================
// 스텔리움 편입 적용 — 정보창 확정 1회. 틱/부트 금지.
// applyArcCoreTerritorialHold(BLUE) + 블루 금고. 개척선 큐 사용 금지.
// ============================================================

import {
  getPlanetOccupationSeedRow,
  isPlanetOccupationCombatEnabled,
} from '../balance/balanceTableRegistry';
import { useBlueTeamSharedVaultStore } from '../../store/factionVault/blueTeamSharedVaultStore';
import { useClanWarFoundationStore } from '../../store/clanWarFoundationStore';
import { usePlayerStore } from '../../store/playerStore';
import { resolvePlanetDefenseSatelliteLevel } from '../../systems/planetaryDefense/planetDefenseSatelliteLevel';
import { isSynthFrontierPlanetId } from '../../world/isSynthFrontierPlanetId';
import { resolveSystemIdForPlanetId } from '../../world/resolvePlanetSystemId';
import {
  evaluateStelliumAnnexEligibility,
  hasStelliumAnnexFriendlyAdjacency,
  shouldShowStelliumAnnexAction,
  type StelliumAnnexIneligibleReason,
} from './stelliumAnnexEligibility';
import { resolveStelliumAnnexPolicy } from './stelliumAnnexPolicy';

export const STELLIUM_ANNEX_OPERATION_SOURCE = 'player_stellium_annex';

export type StelliumAnnexOffer = {
  showAction: boolean;
  costCredits: number;
  requireDefenseSatLevel: number;
  gate: { ok: true } | { ok: false; reason: StelliumAnnexIneligibleReason };
};

export type StelliumAnnexApplyResult =
  | { ok: true; previousSide: string; newSide: string }
  | { ok: false; reason: StelliumAnnexIneligibleReason | 'apply_failed' };

const POLICY_OFF_OFFER: StelliumAnnexOffer = {
  showAction: false,
  costCredits: 0,
  requireDefenseSatLevel: 0,
  gate: { ok: false, reason: 'policy_off' },
};

function isCoreAnnexPlanet(planetId: string): boolean {
  if (isSynthFrontierPlanetId(planetId)) return false;
  return Boolean(getPlanetOccupationSeedRow(planetId));
}

export function resolveStelliumAnnexOffer(planetId: string): StelliumAnnexOffer {
  const policy = resolveStelliumAnnexPolicy();
  if (!policy.enabled) return POLICY_OFF_OFFER;
  const id = planetId.trim();
  const player = usePlayerStore.getState().player;
  const war = useClanWarFoundationStore.getState();
  const hold = war.getHold(id);
  const systemId = hold?.systemId?.trim() || resolveSystemIdForPlanetId(id) || '';
  const vaultCredits = Math.max(0, Math.floor(useBlueTeamSharedVaultStore.getState().balanceCredits));
  const gate = evaluateStelliumAnnexEligibility({
    policyEnabled: policy.enabled,
    isCorePlanet: isCoreAnnexPlanet(id),
    excluded: policy.excludePlanetIds.has(id),
    occupationCombatEnabled: isPlanetOccupationCombatEnabled(id),
    hold,
    landedHere: Boolean(player?.currentPlanetId && player.currentPlanetId === id),
    defenseSatLevel: resolvePlanetDefenseSatelliteLevel(id),
    requireDefenseSatLevel: policy.requireDefenseSatLevel,
    hasFriendlyAdjacency: systemId
      ? hasStelliumAnnexFriendlyAdjacency(systemId, war.planetHolds)
      : false,
    vaultCredits,
    costCredits: policy.costCredits,
  });
  return {
    showAction: shouldShowStelliumAnnexAction(gate),
    costCredits: policy.costCredits,
    requireDefenseSatLevel: policy.requireDefenseSatLevel,
    gate,
  };
}

export function applyStelliumAnnex(planetId: string): StelliumAnnexApplyResult {
  if (!resolveStelliumAnnexPolicy().enabled) return { ok: false, reason: 'policy_off' };
  const id = planetId.trim();
  if (!id) return { ok: false, reason: 'not_core' };
  const offer = resolveStelliumAnnexOffer(id);
  if (!offer.gate.ok) return { ok: false, reason: offer.gate.reason };

  const war = useClanWarFoundationStore.getState();
  const hold = war.getHold(id);
  const systemId = hold?.systemId?.trim() || resolveSystemIdForPlanetId(id);
  if (!systemId) return { ok: false, reason: 'not_core' };

  const vault = useBlueTeamSharedVaultStore.getState();
  const spent = vault.trySpend(offer.costCredits, {
    kind: 'stellium_annex',
    planetId: id,
    note: STELLIUM_ANNEX_OPERATION_SOURCE,
  });
  if (!spent) return { ok: false, reason: 'vault_short' };

  const applied = war.applyArcCoreTerritorialHold({
    planetId: id,
    systemId,
    factionSide: 'BLUE',
    operationMeta: {
      source: STELLIUM_ANNEX_OPERATION_SOURCE,
      decision: 'stellium_annex',
      attackerSide: 'BLUE',
      defenderSide: 'NEUTRAL',
    },
  });
  if (!applied.changed) {
    vault.appendInflow(offer.costCredits, {
      kind: 'stellium_annex_refund',
      planetId: id,
      note: 'apply_unchanged',
    });
    return { ok: false, reason: 'apply_failed' };
  }
  return {
    ok: true,
    previousSide: applied.previousSide,
    newSide: applied.newSide,
  };
}
