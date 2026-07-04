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
import {
  getPlanetOccupationSeedRow,
  isPlanetContestedZone,
} from '../arcCore/balance/balanceTableRegistry';
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

/** CSV 시드 기준 영토 occupier·kind (증서 해제·중립 복원) */
export function resolveSeedOccupierClanForPlanet(planetId: string): {
  occupierClanId: string;
  kind: PlanetClanHold['kind'];
} {
  const row = getPlanetOccupationSeedRow(planetId);
  if (!row) {
    return { occupierClanId: 'neutral', kind: 'neutral' };
  }
  const owner = String(row.initialOwner ?? '').trim().toUpperCase();
  if (owner === 'BLUE') {
    return { occupierClanId: ARC_CORE_SEED_BLUE_CLAN_ID, kind: 'clan_hold' };
  }
  if (owner === 'RED') {
    return { occupierClanId: ARC_CORE_SEED_RED_CLAN_ID, kind: 'clan_hold' };
  }
  return { occupierClanId: 'neutral', kind: 'neutral' };
}

/** 구매자 거대 세력 → 국경선(Voronoi)용 국가 시드 클랜 id */
export function resolveNationSeedClanIdForMegaFaction(
  megaFactionId: string | null | undefined,
): string | null {
  const side = resolveMegaFactionSide(megaFactionId);
  if (side === 'blue') return ARC_CORE_SEED_BLUE_CLAN_ID;
  if (side === 'red') return ARC_CORE_SEED_RED_CLAN_ID;
  return null;
}

/** 영토 국경 side — 중립 hold·occupier neutral 포함 */
export function resolveTerritorialSideForHold(
  hold: PlanetClanHold,
  clans: Record<string, ClanBasicsRecord>,
): MapFactionSide {
  if (hold.kind === 'neutral' || hold.occupierClanId === 'neutral') return 'neutral';
  return resolveMapFactionSideFromClanIdPure(hold.occupierClanId, clans);
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
  | {
      ok: false;
      reason:
        | 'neutral_planet'
        | 'neutral_territory'
        | 'red_territory'
        | 'faction_mismatch'
        | 'already_owner'
        | 'owned_by_other_clan';
    };

/**
 * 은하 지도 Voronoi·패널 — store hold 기준 occupier.
 * hold 미시드·비 contested neutral 은 CSV 시드 합성. 접전지역 neutral 은 ArcCore 판정 대기(undefined).
 */
export function resolveEffectiveMapOccupierClanId(
  planetId: string,
  hold: PlanetClanHold | undefined,
): string | undefined {
  if (isPlanetContestedZone(planetId)) {
    const occupier = hold?.occupierClanId?.trim();
    if (!occupier || occupier === 'neutral' || hold?.kind === 'neutral') return undefined;
    return occupier;
  }

  if (hold) {
    const occupier = hold.occupierClanId?.trim();
    if (hold.kind !== 'neutral' && occupier && occupier !== 'neutral') {
      return occupier;
    }
  }

  const seed = resolveSeedOccupierClanForPlanet(planetId);
  if (seed.kind === 'neutral' || seed.occupierClanId === 'neutral') {
    return undefined;
  }
  return seed.occupierClanId;
}

/** hold 미시드 시 CSV occupation 시드로 합성 */
export function resolvePlanetHoldForOwnershipCheck(
  planetId: string,
  hold: PlanetClanHold | undefined,
): PlanetClanHold {
  if (hold) return hold;
  const seed = resolveSeedOccupierClanForPlanet(planetId);
  const systemId = getPlanetOccupationSeedRow(planetId)?.systemId?.trim() ?? '';
  return {
    planetId,
    systemId,
    occupierClanId: seed.occupierClanId,
    deedOwnerClanId: null,
    homePlayerUid: null,
    kind: seed.kind,
    capturedAt: 0,
  };
}

/** 무역소 구매 UI — 구매 차단 사유(범용 Alert) */
export function previewPlanetOwnershipDeedPurchase(
  planetId: string,
  hold: PlanetClanHold | undefined,
  buyerClanId: string,
  buyerMegaFactionId: string,
  clans: Record<string, ClanBasicsRecord>,
): PlanetOwnershipDeedPurchaseCheck {
  return canPurchasePlanetOwnershipDeed(planetId, hold, buyerClanId, buyerMegaFactionId, clans);
}

/**
 * 무역소 소유권 증서 구매 가능 여부.
 * - 허용: 블루·중립 영토 (CSV NEUTRAL / occupier neutral 포함)
 * - 거부: 레드 영토 · 구매자 국가 시드 미지원 · 타 클랜 증서
 */
export function canPurchasePlanetOwnershipDeed(
  planetId: string,
  hold: PlanetClanHold | undefined,
  buyerClanId: string,
  buyerMegaFactionId: string,
  clans: Record<string, ClanBasicsRecord>,
): PlanetOwnershipDeedPurchaseCheck {
  const resolvedHold = resolvePlanetHoldForOwnershipCheck(planetId, hold);

  const territorialSide = resolveTerritorialSideForHold(resolvedHold, clans);
  if (territorialSide === 'red') {
    return { ok: false, reason: 'red_territory' };
  }
  if (territorialSide !== 'blue' && territorialSide !== 'neutral') {
    return { ok: false, reason: 'neutral_territory' };
  }
  if (!resolveNationSeedClanIdForMegaFaction(buyerMegaFactionId)) {
    return { ok: false, reason: 'faction_mismatch' };
  }

  const deedOwner = resolveDeedOwnerClanId(resolvedHold);
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
