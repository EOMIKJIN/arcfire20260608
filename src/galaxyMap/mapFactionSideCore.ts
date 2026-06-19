export type MapFactionSide = 'blue' | 'red' | 'neutral';

export type ClanMegaFactionLookup = Record<string, { megaFactionId?: string } | undefined>;

const BLUE_COLOR = '#4EA3FF';
const RED_COLOR = '#E36B6B';

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
  if (color === normalizeHex(BLUE_COLOR)) return 'blue';
  if (color === normalizeHex(RED_COLOR)) return 'red';
  return null;
}

export function resolveMapFactionBorderColor(side: MapFactionSide): string {
  if (side === 'blue') return BLUE_COLOR;
  if (side === 'red') return RED_COLOR;
  return '#9AA8C4';
}

/** 블루–레드 접경(스크린샷 노란 핫라인) */
export const MAP_FACTION_CONTEST_BORDER_COLOR = '#FFD56A';
