import type { PlanetClanHold } from '../../types';
import { resolveHoldFactionSide } from '../territorial/territorialFactionSide';

export type StelliumColonizeIneligibleReason =
  | 'locked_system'
  | 'info_not_revealed'
  | 'red_seed'
  | 'contested'
  | 'player_hold'
  | 'already_blue'
  | 'already_red'
  | 'no_blue_path';

export type StelliumColonizeEligibilityInput = {
  planetId: string;
  systemId: string;
  systemUnlocked: boolean;
  planetInfoRevealed: boolean;
  hold: PlanetClanHold | undefined;
  csvInitialOwner: 'BLUE' | 'RED' | 'NEUTRAL' | null;
  contested: boolean;
};

export function evaluateStelliumColonizeEligibility(
  input: StelliumColonizeEligibilityInput,
): { ok: true } | { ok: false; reason: StelliumColonizeIneligibleReason } {
  if (!input.systemUnlocked) return { ok: false, reason: 'locked_system' };
  if (!input.planetInfoRevealed) return { ok: false, reason: 'info_not_revealed' };
  if (input.csvInitialOwner === 'RED') return { ok: false, reason: 'red_seed' };
  if (input.contested) return { ok: false, reason: 'contested' };

  const hold = input.hold;
  if (hold?.kind === 'player_independent' || hold?.kind === 'player_home') {
    return { ok: false, reason: 'player_hold' };
  }

  const side = resolveHoldFactionSide(hold?.occupierClanId);
  if (side === 'BLUE') return { ok: false, reason: 'already_blue' };
  if (side === 'RED') return { ok: false, reason: 'already_red' };
  if (side === 'INDEPENDENT') return { ok: false, reason: 'player_hold' };

  return { ok: true };
}
