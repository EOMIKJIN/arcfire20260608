import { resolveClanMapDisplayColor } from '../arcCore/balance/clanMapFactionColorPolicy';
import { useClanWarFoundationStore } from '../store/clanWarFoundationStore';
import {
  MAP_FACTION_CONTEST_BORDER_COLOR,
  resolveMapFactionBorderColor,
  resolveMapFactionSideFromClanIdPure,
  resolveMapFactionSideFromDisplayColorHex,
  type MapFactionSide,
} from './mapFactionSideCore';

export type { MapFactionSide };
export { resolveMapFactionBorderColor, MAP_FACTION_CONTEST_BORDER_COLOR };

export function resolveMapFactionSideFromClanId(clanId: string | null | undefined): MapFactionSide {
  const clans = useClanWarFoundationStore.getState().clans;
  const side = resolveMapFactionSideFromClanIdPure(clanId, clans);
  if (side !== 'neutral' || !clanId || clanId === 'neutral') return side;
  const fromColor = resolveMapFactionSideFromDisplayColorHex(resolveClanMapDisplayColor(clanId));
  return fromColor ?? 'neutral';
}
