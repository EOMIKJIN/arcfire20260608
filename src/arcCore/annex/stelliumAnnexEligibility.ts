// ============================================================
// 스텔리움 편입 게이트 — 순수. 틱/스토어 금지.
// 코어 중립만. CSV RED 시드 무시. 분쟁 풀 소속 허용.
// ============================================================

import type { PlanetClanHold } from '../../types';
import { listAdjacentSystemIds } from '../territorial/territorialSupplyLine';
import { resolveHoldFactionSide } from '../territorial/territorialFactionSide';

export type StelliumAnnexIneligibleReason =
  | 'policy_off'
  | 'not_core'
  | 'excluded'
  | 'combat_disabled'
  | 'not_neutral'
  | 'player_hold'
  | 'not_landed'
  | 'sat_required'
  | 'no_adjacency'
  | 'vault_short';

export type StelliumAnnexEligibilityInput = {
  policyEnabled: boolean;
  isCorePlanet: boolean;
  excluded: boolean;
  occupationCombatEnabled: boolean;
  hold: PlanetClanHold | undefined;
  landedHere: boolean;
  defenseSatLevel: number;
  requireDefenseSatLevel: number;
  hasFriendlyAdjacency: boolean;
  vaultCredits: number;
  costCredits: number;
};

export function evaluateStelliumAnnexEligibility(
  input: StelliumAnnexEligibilityInput,
): { ok: true } | { ok: false; reason: StelliumAnnexIneligibleReason } {
  if (!input.policyEnabled) return { ok: false, reason: 'policy_off' };
  if (!input.isCorePlanet) return { ok: false, reason: 'not_core' };
  if (input.excluded) return { ok: false, reason: 'excluded' };
  if (!input.occupationCombatEnabled) return { ok: false, reason: 'combat_disabled' };

  const hold = input.hold;
  if (hold?.kind === 'player_home' || hold?.kind === 'player_independent') {
    return { ok: false, reason: 'player_hold' };
  }

  const side = resolveHoldFactionSide(hold?.occupierClanId);
  if (side === 'INDEPENDENT') return { ok: false, reason: 'player_hold' };
  if (side !== 'NEUTRAL') return { ok: false, reason: 'not_neutral' };

  if (!input.landedHere) return { ok: false, reason: 'not_landed' };
  if (input.defenseSatLevel < input.requireDefenseSatLevel) {
    return { ok: false, reason: 'sat_required' };
  }
  if (!input.hasFriendlyAdjacency) return { ok: false, reason: 'no_adjacency' };
  if (input.vaultCredits < input.costCredits) return { ok: false, reason: 'vault_short' };
  return { ok: true };
}

/** 정보창에 편입 버튼을 둘지 — 코어 중립 후보만. 위성·착륙·금고는 비활성 사유. */
export function shouldShowStelliumAnnexAction(
  gate: { ok: true } | { ok: false; reason: StelliumAnnexIneligibleReason },
): boolean {
  if (gate.ok) return true;
  return (
    gate.reason === 'not_landed'
    || gate.reason === 'sat_required'
    || gate.reason === 'no_adjacency'
    || gate.reason === 'vault_short'
  );
}

/** 1홉에 독립국·BLUE 클랜 홀드가 있으면 편입 접선. */
export function hasStelliumAnnexFriendlyAdjacency(
  systemId: string,
  holds: Readonly<Record<string, PlanetClanHold>>,
): boolean {
  const sid = systemId.trim();
  if (!sid) return false;
  const adjacent = listAdjacentSystemIds(sid);
  for (let i = 0; i < adjacent.length; i += 1) {
    const adj = adjacent[i];
    const keys = Object.keys(holds);
    for (let j = 0; j < keys.length; j += 1) {
      const hold = holds[keys[j]];
      if (!hold || hold.systemId !== adj) continue;
      if (hold.kind === 'player_independent') return true;
      if (resolveHoldFactionSide(hold.occupierClanId) === 'BLUE') return true;
    }
  }
  return false;
}
