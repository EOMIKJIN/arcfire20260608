export type MapFactionSide = 'blue' | 'red' | 'neutral';

export type ClanMegaFactionLookup = Record<string, { megaFactionId?: string } | undefined>;

const BLUE_COLOR = '#2E85F0';
const RED_COLOR = '#D94545';

/** 지도 Voronoi 국경 — 채도 유지형 팔레트 (헤일로·코어 공용) */
export const MAP_FACTION_BLUE_BORDER_COLOR = BLUE_COLOR;
export const MAP_FACTION_RED_BORDER_COLOR = RED_COLOR;
/** 블루–레드 접경 — pale yellow 대신 amber gold */
export const MAP_FACTION_CONTEST_BORDER_COLOR = '#E5A832';

function normalizeHex(hex: string): string {
  return String(hex ?? '').trim().toUpperCase();
}

/** store 없이 clanId → 지도 팩션 side (순환참조 방지 — store·colorPolicy 미참조) */
export function resolveMapFactionSideFromClanIdPure(
  clanId: string | null | undefined,
  clans: ClanMegaFactionLookup,
): MapFactionSide {
  if (!clanId || clanId === 'neutral') return 'neutral';
  const mega = clans[clanId]?.megaFactionId?.trim();
  if (mega === 'mega_stellium_alliance') return 'blue';
  if (mega === 'mega_crimson_legion') return 'red';
  if (clanId.includes('_pvp_') || clanId.startsWith('ai_clan_pvp')) return 'red';
  if (clanId.includes('_safe_') || clanId.startsWith('ai_clan_safe')) return 'blue';
  if (clanId === 'balance_seed_faction_blue') return 'blue';
  if (clanId === 'balance_seed_faction_red') return 'red';
  return 'neutral';
}

/** CSV 색상 hex 폴백 — resolveMapFactionSide 래퍼 전용 */
export function resolveMapFactionSideFromDisplayColorHex(colorHex: string): MapFactionSide | null {
  const color = normalizeHex(colorHex);
  if (color === normalizeHex(BLUE_COLOR) || color === '#4EA3FF') return 'blue';
  if (color === normalizeHex(RED_COLOR) || color === '#E36B6B') return 'red';
  return null;
}

export function resolveMapFactionBorderColor(side: MapFactionSide): string {
  if (side === 'blue') return BLUE_COLOR;
  if (side === 'red') return RED_COLOR;
  return '#9AA8C4';
}
