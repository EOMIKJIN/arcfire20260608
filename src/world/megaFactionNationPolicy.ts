// ============================================================
// 메가팩션 국가명 — clan_map · occupation seeds · megaFactionId 정본
// 서부(블루)=스텔리움 연합 · 동부(레드)=크림슨 레기온
// ============================================================

import { PlanetOccupationSeeds_FROM_BALANCE_CSV } from '../data/balance/generated';
import type { MapFactionSide } from '../galaxyMap/mapFactionSideCore';

export const MEGA_FACTION_BLUE_NATION = {
  megaFactionId: 'mega_stellium_alliance',
  displayNameKo: '스텔리움 연합',
  displayNameEn: 'Stellium Alliance',
  routeLabelKo: '서부항로',
  routeLabelEn: 'West Route',
} as const;

export const MEGA_FACTION_RED_NATION = {
  megaFactionId: 'mega_crimson_legion',
  displayNameKo: '크림슨 레기온',
  displayNameEn: 'Crimson Legion',
  routeLabelKo: '동부항로',
  routeLabelEn: 'East Route',
} as const;

export function resolveMegaFactionNationDisplayName(
  side: 'blue' | 'red',
  locale: 'ko' | 'en' = 'ko',
): string {
  const nation = side === 'blue' ? MEGA_FACTION_BLUE_NATION : MEGA_FACTION_RED_NATION;
  return locale === 'en' ? nation.displayNameEn : nation.displayNameKo;
}

/** planet_occupation_seeds initialOwner → 국가명 (점유 시드 정본) */
export function resolveNationDisplayNameForOccupationOwner(
  owner: string | null | undefined,
  locale: 'ko' | 'en' = 'ko',
): string | null {
  const o = String(owner ?? '').trim().toUpperCase();
  if (o === 'BLUE') return resolveMegaFactionNationDisplayName('blue', locale);
  if (o === 'RED') return resolveMegaFactionNationDisplayName('red', locale);
  return null;
}

const INDEPENDENT_NATION_LABEL = { ko: '독립국', en: 'Independent Nation' } as const;

export function resolveNationDisplayNameForMapSide(
  side: MapFactionSide,
  locale: 'ko' | 'en' = 'ko',
): string | null {
  if (side === 'blue') return resolveMegaFactionNationDisplayName('blue', locale);
  if (side === 'red') return resolveMegaFactionNationDisplayName('red', locale);
  if (side === 'independent') return INDEPENDENT_NATION_LABEL[locale];
  return null;
}

/** 행성 설명 접두 — CSV·UI 공통 */
export function formatPlanetNationDescriptionPrefix(
  owner: 'BLUE' | 'RED',
  locale: 'ko' | 'en' = 'ko',
): string {
  const nation = resolveNationDisplayNameForOccupationOwner(owner, locale);
  return locale === 'en' ? `[Nation: ${nation}] ` : `[국가: ${nation}] `;
}

export function listOccupationSeedPlanetIdsForOwner(owner: 'BLUE' | 'RED'): string[] {
  return PlanetOccupationSeeds_FROM_BALANCE_CSV.filter(
    (row) => String(row.initialOwner ?? '').trim().toUpperCase() === owner,
  ).map((row) => String(row.planetId).trim());
}
