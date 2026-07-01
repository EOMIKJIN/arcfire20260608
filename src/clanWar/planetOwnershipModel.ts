// ============================================================
// 행성 소유권 모델 — 영토(국가·국경) vs 소유권 증서(클랜)
// ============================================================
//
// - occupierClanId: 국경·점령전·팩션 금고 (블루/레드 국가 시드 또는 AI 클랜)
// - deedOwnerClanId: null = 국가 디폴트 소유, 값 있음 = 해당 클랜이 증서 보유
// - 블루/레드는 UI·지도 구분용; 국가명은 megaFactionNationPolicy 정본

import {
  ARC_CORE_SEED_BLUE_CLAN_ID,
  ARC_CORE_SEED_RED_CLAN_ID,
} from '../arcCore/balance/seedPlanetOccupationFromBalance';
import { getPlanetOccupationSeedRow } from '../arcCore/balance/balanceTableRegistry';
import {
  resolveMapFactionSideFromClanIdPure,
  type MapFactionSide,
} from '../galaxyMap/mapFactionSideCore';
import type { ClanBasicsRecord, PlanetClanHold } from '../types';
import {
  resolveNationDisplayNameForMapSide,
} from '../world/megaFactionNationPolicy';
import { formatClanPlateDisplayName } from './formatClanPlateDisplayName';
import type { AppLocale } from '../i18n/types';

function resolveOwnershipDisplayLocale(locale: AppLocale = 'ko'): 'ko' | 'en' {
  return locale === 'en' ? 'en' : 'ko';
}

export { ARC_CORE_SEED_BLUE_CLAN_ID, ARC_CORE_SEED_RED_CLAN_ID };

export function isNationSeedClanId(clanId: string | null | undefined): boolean {
  return clanId === ARC_CORE_SEED_BLUE_CLAN_ID || clanId === ARC_CORE_SEED_RED_CLAN_ID;
}

export function isAiNpcClanId(clanId: string | null | undefined): boolean {
  return Boolean(clanId?.startsWith('ai_clan_'));
}

/** 플레이어·솔로 클랜 등 증서를 실질 보유할 수 있는 클랜 */
export function isPlayerOriginatedClanId(clanId: string | null | undefined): boolean {
  if (!clanId || clanId === 'neutral') return false;
  if (isNationSeedClanId(clanId) || isAiNpcClanId(clanId)) return false;
  return true;
}

export function resolveMegaFactionSide(megaFactionId: string | null | undefined): MapFactionSide {
  const mega = megaFactionId?.trim();
  if (mega === 'mega_stellium_alliance') return 'blue';
  if (mega === 'mega_crimson_legion') return 'red';
  return 'neutral';
}

/** 국경·금고·Voronoi — 영토 점유 클랜 */
export function resolveTerritorialOccupierClanId(hold: PlanetClanHold): string {
  return hold.occupierClanId;
}

/**
 * 소유권 증서 보유 클랜.
 * deedOwnerClanId 미설정 시 영토 occupier(국가 시드·AI 클랜)가 디폴트 소유.
 */
export function resolveDeedOwnerClanId(hold: PlanetClanHold): string {
  const explicit = hold.deedOwnerClanId?.trim();
  if (explicit) return explicit;
  return hold.occupierClanId;
}

export function isNationDefaultDeedOwnership(hold: PlanetClanHold): boolean {
  return !hold.deedOwnerClanId?.trim();
}

export function resolveTerritorialNationClanIdForPlanet(planetId: string): string | null {
  const row = getPlanetOccupationSeedRow(planetId);
  if (!row) return null;
  const owner = String(row.initialOwner ?? '').trim().toUpperCase();
  if (owner === 'BLUE') return ARC_CORE_SEED_BLUE_CLAN_ID;
  if (owner === 'RED') return ARC_CORE_SEED_RED_CLAN_ID;
  return null;
}

/** v1→v2 마이그레이션: 구매 시 occupierClanId만 바꾸던 저장을 영토/증서 분리 */
export function migratePlanetHoldOwnershipSplit(
  hold: PlanetClanHold,
): { hold: PlanetClanHold; changed: boolean } {
  const deedOwnerClanId = hold.deedOwnerClanId ?? null;
  let next: PlanetClanHold = { ...hold, deedOwnerClanId };
  let changed = deedOwnerClanId !== hold.deedOwnerClanId;

  const occ = hold.occupierClanId;
  if (isPlayerOriginatedClanId(occ) && !deedOwnerClanId) {
    const nationClanId = resolveTerritorialNationClanIdForPlanet(hold.planetId);
    if (nationClanId) {
      next = {
        ...next,
        occupierClanId: nationClanId,
        deedOwnerClanId: occ,
      };
      changed = true;
    }
  }
  return { hold: next, changed };
}

export function migratePlanetHoldsOwnershipSplit(
  holds: Record<string, PlanetClanHold>,
): { holds: Record<string, PlanetClanHold>; changed: boolean } {
  let changed = false;
  const next: Record<string, PlanetClanHold> = {};
  for (const [planetId, hold] of Object.entries(holds)) {
    const migrated = migratePlanetHoldOwnershipSplit(hold);
    next[planetId] = migrated.hold;
    if (migrated.changed) changed = true;
  }
  return { holds: next, changed };
}

export type PlanetOwnershipDeedPurchaseCheck =
  | { ok: true }
  | { ok: false; reason: 'neutral_planet' | 'neutral_territory' | 'faction_mismatch' | 'already_owner' | 'owned_by_other_clan' };

/** 무역소 소유권 증서 구매 가능 여부 */
export function canPurchasePlanetOwnershipDeed(
  hold: PlanetClanHold | undefined,
  buyerClanId: string,
  buyerMegaFactionId: string,
  clans: Record<string, ClanBasicsRecord>,
): PlanetOwnershipDeedPurchaseCheck {
  if (!hold || hold.kind === 'neutral') return { ok: false, reason: 'neutral_planet' };

  const territorialSide = resolveMapFactionSideFromClanIdPure(hold.occupierClanId, clans);
  const buyerSide = resolveMegaFactionSide(buyerMegaFactionId);
  if (territorialSide === 'neutral') return { ok: false, reason: 'neutral_territory' };
  if (buyerSide !== territorialSide) return { ok: false, reason: 'faction_mismatch' };

  const deedOwner = resolveDeedOwnerClanId(hold);
  if (deedOwner === buyerClanId) return { ok: false, reason: 'already_owner' };
  if (isPlayerOriginatedClanId(deedOwner) && deedOwner !== buyerClanId) {
    return { ok: false, reason: 'owned_by_other_clan' };
  }
  return { ok: true };
}

export type PlanetHubOwnershipPlate = {
  clanName: string;
  clanColorClanId: string;
  deedOwnerClanId: string;
  isNationDefault: boolean;
};

/** 행성 허브·지도 — 소유권 증서 기준 표시명 (국가 디폴트 = 스텔리움 연합 등) */
export function resolvePlanetHubOwnershipPlate(
  hold: PlanetClanHold,
  clans: Record<string, ClanBasicsRecord>,
  locale: AppLocale = 'ko',
): PlanetHubOwnershipPlate | null {
  const displayLocale = resolveOwnershipDisplayLocale(locale);
  if (hold.kind === 'neutral') return null;

  const deedOwnerClanId = resolveDeedOwnerClanId(hold);
  const nationDefault = isNationDefaultDeedOwnership(hold) && isNationSeedClanId(deedOwnerClanId);

  let rawName: string;
  if (nationDefault) {
    const side = resolveMapFactionSideFromClanIdPure(deedOwnerClanId, clans);
    rawName =
      resolveNationDisplayNameForMapSide(side, displayLocale)
      ?? (clans[deedOwnerClanId]?.displayName ?? '').trim()
      ?? deedOwnerClanId;
  } else {
    rawName = (clans[deedOwnerClanId]?.displayName ?? '').trim() || deedOwnerClanId;
  }

  return {
    clanName: formatClanPlateDisplayName(rawName) || rawName,
    clanColorClanId: nationDefault ? hold.occupierClanId : deedOwnerClanId,
    deedOwnerClanId,
    isNationDefault: nationDefault,
  };
}

/** 플레이어 클랜·uid 기준 실질 소유권 (증서·거점) */
export function isPlayerPlanetDeedOwner(
  hold: PlanetClanHold,
  playerUid: string | null | undefined,
  playerClanId: string | null | undefined,
): boolean {
  if (!playerUid) return false;
  if (hold.kind === 'player_home' && hold.homePlayerUid === playerUid) return true;
  const deedOwner = resolveDeedOwnerClanId(hold);
  if (playerClanId && deedOwner === playerClanId && isPlayerOriginatedClanId(deedOwner)) return true;
  if (hold.deedOwnerClanId && hold.homePlayerUid === playerUid) return true;
  return false;
}
