export type MapFactionSide = 'blue' | 'red' | 'neutral' | 'independent';

export type ClanMegaFactionLookup = Record<string, { megaFactionId?: string } | undefined>;

const BLUE_COLOR = '#2E85F0';
const RED_COLOR = '#D94545';
/** 플레이어 독립국 — 채움·국경 공용(CSV 정본과 동일 hex 유지) */
const INDEPENDENT_COLOR = '#3FBF6B';

/** 지도 Voronoi 국경 — 채도 유지형 팔레트 (헤일로·코어 공용) */
export const MAP_FACTION_BLUE_BORDER_COLOR = BLUE_COLOR;
export const MAP_FACTION_RED_BORDER_COLOR = RED_COLOR;
export const MAP_FACTION_INDEPENDENT_BORDER_COLOR = INDEPENDENT_COLOR;
/** 블루–레드 접경 — pale yellow 대신 amber gold */
export const MAP_FACTION_CONTEST_BORDER_COLOR = '#E5A832';

/** 국가 시드·AI 클랜이 아닌 클랜(플레이어 솔로/클랜) — 순환참조 방지용 인라인 판정 */
function isPlayerOriginatedClanIdInline(clanId: string): boolean {
  if (clanId === 'balance_seed_faction_blue' || clanId === 'balance_seed_faction_red') return false;
  if (clanId.startsWith('ai_clan_')) return false;
  return true;
}

function normalizeHex(hex: string): string {
  return String(hex ?? '').trim().toUpperCase();
}

/** store 없이 clanId → 지도 팩션 side (순환참조 방지 — store·colorPolicy 미참조) */
export function resolveMapFactionSideFromClanIdPure(
  clanId: string | null | undefined,
  clans: ClanMegaFactionLookup,
): MapFactionSide {
  if (!clanId || clanId === 'neutral') return 'neutral';
  // 플레이어 유래 occupier(솔로/클랜) — megaFactionId(출신국)와 무관하게 독립국으로 판정.
  // 국가 시드·AI 클랜 판정보다 먼저 검사해야 함(mega_stellium_alliance 유지로 인한 블루 오판정 방지).
  if (isPlayerOriginatedClanIdInline(clanId)) return 'independent';
  const mega = clans[clanId]?.megaFactionId?.trim();
  if (mega === 'mega_stellium_alliance') return 'blue';
  if (mega === 'mega_crimson_legion') return 'red';
  if (clanId.includes('_pvp_') || clanId.startsWith('ai_clan_pvp')) return 'red';
  if (clanId.includes('_safe_') || clanId.startsWith('ai_clan_safe')) return 'blue';
  // clans lookup 누락 시(불완전한 clans dict) 대비 폴백 — clans 값과 무관하게 확정
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
  if (side === 'independent') return INDEPENDENT_COLOR;
  return '#9AA8C4';
}
