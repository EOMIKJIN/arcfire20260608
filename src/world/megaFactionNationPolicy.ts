// ============================================================
// 4대 국호 — [고유명] + [정치체] (F1 스텔리움 연합 / Stellium Alliance 규칙)
// F1 서부=스텔리움 연합 · F2 남부=머큐리움 연합 · F3 동부=크림슨 레기온 · F4 북부=아우렐리움 길드
// 국가 id는 mega_* 만. trade_coalition / miners_guild 는 planets·NPC flavor — 국가 아님.
// 점유 hold 접두는 블루/레드만.
// ============================================================

import { PlanetOccupationSeeds_FROM_BALANCE_CSV } from '../data/balance/generated';
import type { MapFactionSide } from '../galaxyMap/mapFactionSideCore';

export type QuadNationDisplay = {
  megaFactionId: string;
  displayNameKo: string;
  displayNameEn: string;
  routeLabelKo: string;
  routeLabelEn: string;
};

export const MEGA_FACTION_BLUE_NATION: QuadNationDisplay = {
  megaFactionId: 'mega_stellium_alliance',
  displayNameKo: '스텔리움 연합',
  displayNameEn: 'Stellium Alliance',
  routeLabelKo: '서부항로',
  routeLabelEn: 'West Route',
};

export const MEGA_FACTION_SOUTH_NATION: QuadNationDisplay = {
  megaFactionId: 'mega_mercurium_coalition',
  displayNameKo: '머큐리움 연합',
  displayNameEn: 'Mercurium Coalition',
  routeLabelKo: '남부항로',
  routeLabelEn: 'South Route',
};

export const MEGA_FACTION_RED_NATION: QuadNationDisplay = {
  megaFactionId: 'mega_crimson_legion',
  displayNameKo: '크림슨 레기온',
  displayNameEn: 'Crimson Legion',
  routeLabelKo: '동부항로',
  routeLabelEn: 'East Route',
};

export const MEGA_FACTION_NORTH_NATION: QuadNationDisplay = {
  megaFactionId: 'mega_aurelium_guild',
  displayNameKo: '아우렐리움 길드',
  displayNameEn: 'Aurelium Guild',
  routeLabelKo: '북부항로',
  routeLabelEn: 'North Route',
};

/** planets.csv · NPC 소속용. 4대 국가 id와 겹치면 안 됨. */
export const LOCAL_FLAVOR_FACTION_IDS = [
  'federation',
  'federation_military',
  'miners_guild',
  'trade_coalition',
  'scientists',
  'pirates',
  'independent',
  'scavengers',
  'border_watch',
  'void_walkers',
] as const;

export type QuadNationKind = 'west' | 'south' | 'east' | 'north';

export const QUAD_NATION_BY_KIND: Record<QuadNationKind, QuadNationDisplay> = {
  west: MEGA_FACTION_BLUE_NATION,
  south: MEGA_FACTION_SOUTH_NATION,
  east: MEGA_FACTION_RED_NATION,
  north: MEGA_FACTION_NORTH_NATION,
};

export function resolveQuadNationDisplayName(
  kind: QuadNationKind,
  locale: 'ko' | 'en' = 'ko',
): string {
  const nation = QUAD_NATION_BY_KIND[kind];
  return locale === 'en' ? nation.displayNameEn : nation.displayNameKo;
}

export function isQuadNationId(factionId: string | null | undefined): boolean {
  const id = String(factionId ?? '').trim();
  if (!id) return false;
  return (
    id === MEGA_FACTION_BLUE_NATION.megaFactionId
    || id === MEGA_FACTION_SOUTH_NATION.megaFactionId
    || id === MEGA_FACTION_RED_NATION.megaFactionId
    || id === MEGA_FACTION_NORTH_NATION.megaFactionId
  );
}

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
