// ============================================================
// ?�성 ?�유�?모델 ???�토(�??·�?��) vs ?�유�?증서(?�랜)
// ============================================================
//
// - occupierClanId: �?��·?�령?�·팩??금고 (블루/?�드 �?? ?�드 ?�는 AI ?�랜)
// - deedOwnerClanId: null = �?? ?�폴???�유, �??�음 = ?�당 ?�랜??증서 보유
// - 블루/?�드??UI·지??구분?? �??명�? megaFactionNationPolicy ?�본

import {
  ARC_CORE_SEED_BLUE_CLAN_ID,
  ARC_CORE_SEED_RED_CLAN_ID,
} from '../arcCore/balance/seedPlanetOccupationFromBalance';
import {
  getPlanetOccupationSeedRow,
} from '../arcCore/balance/balanceTableRegistry';
import { isTerritorialProcessPlanet } from '../arcCore/territorial/isTerritorialProcessPlanet';
import {
  resolveMapFactionSideFromClanIdPure,
  type MapFactionSide,
} from '../galaxyMap/mapFactionSideCore';
import type { ClanBasicsRecord, PlanetClanHold } from '../types';
import {
  resolveNationDisplayNameForMapSide,
} from '../world/megaFactionNationPolicy';
import { formatClanPlateDisplayName, stripSoloClanFleetSuffix } from './formatClanPlateDisplayName';
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

/** ?�레?�어·?�로 ?�랜 ??증서�??�질 보유?????�는 ?�랜 */
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

/** �?��·금고·Voronoi ???�토 ?�유 ?�랜 */
export function resolveTerritorialOccupierClanId(hold: PlanetClanHold): string {
  return hold.occupierClanId;
}

/**
 * ?�유�?증서 보유 ?�랜.
 * deedOwnerClanId 미설?????�토 occupier(�?? ?�드·AI ?�랜)가 ?�폴???�유.
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

/** CSV ?�드 기�? ?�토 occupier·kind (증서 ?�제·중립 복원) */
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

/** 구매??거�? ?�력 ??�?��??Voronoi)??�?? ?�드 ?�랜 id */
export function resolveNationSeedClanIdForMegaFaction(
  megaFactionId: string | null | undefined,
): string | null {
  const side = resolveMegaFactionSide(megaFactionId);
  if (side === 'blue') return ARC_CORE_SEED_BLUE_CLAN_ID;
  if (side === 'red') return ARC_CORE_SEED_RED_CLAN_ID;
  return null;
}

/** ?�레?�어 ?�립�?hold ??`player_independent` ?�는 중립/�?? occupier + ?�레?�어 증서(legacy) */
export function isPlayerIndependentNationHold(hold: PlanetClanHold): boolean {
  if (hold.kind === 'player_independent') return true;
  const deedOwner = hold.deedOwnerClanId?.trim();
  if (!deedOwner || !isPlayerOriginatedClanId(deedOwner)) return false;
  if (isNationSeedClanId(hold.occupierClanId)) return true;
  if (hold.occupierClanId === 'neutral' || hold.kind === 'neutral') return true;
  return hold.occupierClanId === deedOwner;
}

/** Voronoi·지??occupier ??legacy 중립 ?�토 ?�유�?구매 ?�함 */
export function resolvePlayerIndependentOccupierClanId(hold: PlanetClanHold): string | null {
  if (!isPlayerIndependentNationHold(hold)) return null;
  const occupier = hold.occupierClanId?.trim();
  if (occupier && occupier !== 'neutral' && isPlayerOriginatedClanId(occupier)) return occupier;
  const deedOwner = hold.deedOwnerClanId?.trim();
  if (deedOwner && isPlayerOriginatedClanId(deedOwner)) return deedOwner;
  return null;
}

/** ?�토 �?�� side ??중립 hold·occupier ?�함 */
export function resolveTerritorialSideForHold(
  hold: PlanetClanHold,
  clans: Record<string, ClanBasicsRecord>,
): MapFactionSide {
  const independentOccupier = resolvePlayerIndependentOccupierClanId(hold);
  if (independentOccupier) {
    return resolveMapFactionSideFromClanIdPure(independentOccupier, clans);
  }
  if (hold.kind === 'neutral' || hold.occupierClanId === 'neutral') return 'neutral';
  return resolveMapFactionSideFromClanIdPure(hold.occupierClanId, clans);
}

/** v1?�v2 마이그레?�션: 구매 ??occupierClanId�?바꾸???�?�을 ?�토/증서 분리 */
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

/**
 * M2-E(?�택) ??기존 구매 hold ???�립�??�환.
 * - occupier=�?? ?�드 + deedOwner=?�레?�어 (블루/?�드 ?�토 legacy)
 * - occupier=neutral + deedOwner=?�레?�어 (중립 ?�토 legacy)
 * idempotent ??�?부???�전 ?�실??
 */
export function migrateExistingPlayerDeedHoldToIndependent(
  hold: PlanetClanHold,
): { hold: PlanetClanHold; changed: boolean } {
  if (hold.kind === 'player_independent') {
    const deedOwner = hold.deedOwnerClanId?.trim();
    if (deedOwner && hold.occupierClanId !== deedOwner) {
      return { hold: { ...hold, occupierClanId: deedOwner }, changed: true };
    }
    return { hold, changed: false };
  }
  const deedOwner = hold.deedOwnerClanId?.trim();
  if (!deedOwner || !isPlayerOriginatedClanId(deedOwner)) return { hold, changed: false };
  const fromNationSeed = isNationSeedClanId(hold.occupierClanId);
  const fromNeutral = hold.occupierClanId === 'neutral' || hold.kind === 'neutral';
  if (!fromNationSeed && !fromNeutral) return { hold, changed: false };
  return {
    hold: { ...hold, occupierClanId: deedOwner, kind: 'player_independent' },
    changed: true,
  };
}

export function migrateExistingPlayerDeedHoldsToIndependentAll(
  holds: Record<string, PlanetClanHold>,
): { holds: Record<string, PlanetClanHold>; changed: boolean } {
  let changed = false;
  const next: Record<string, PlanetClanHold> = {};
  for (const [planetId, hold] of Object.entries(holds)) {
    const migrated = migrateExistingPlayerDeedHoldToIndependent(hold);
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
 * ?�??지??Voronoi·?�널 ??store hold 기�? occupier.
 * hold 미시?�·비 contested neutral ?� CSV ?�드 ?�성. ?�전지??neutral ?� ArcCore ?�정 ?��?undefined).
 */
/**
 * Map/border Voronoi occupier.
 * Territorial process: runtime hold only (no seed fallback).
 * Else: seed default only when hold missing or non-process neutral.
 */
export function resolveEffectiveMapOccupierClanId(
  planetId: string,
  hold: PlanetClanHold | undefined,
): string | undefined {
  // Contested / territorial policy — live hold beats seed initialOwner (2026-07-28)
  if (isTerritorialProcessPlanet(planetId)) {
    if (hold) {
      const independentOccupier = resolvePlayerIndependentOccupierClanId(hold);
      if (independentOccupier) return independentOccupier;
    }
    const occupier = hold?.occupierClanId?.trim();
    if (!occupier || occupier === 'neutral' || hold?.kind === 'neutral') return undefined;
    return occupier;
  }

  if (hold) {
    const independentOccupier = resolvePlayerIndependentOccupierClanId(hold);
    if (independentOccupier) return independentOccupier;
    const occupier = hold.occupierClanId?.trim();
    if (hold.kind !== 'neutral' && occupier && occupier !== 'neutral') {
      return occupier;
    }
    if (hold.neutralizedAt) return undefined;
  }

  const seed = resolveSeedOccupierClanForPlanet(planetId);
  if (seed.kind === 'neutral' || seed.occupierClanId === 'neutral') {
    return undefined;
  }
  return seed.occupierClanId;
}

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

/** 무역??구매 UI ??구매 차단 ?�유(범용 Alert) */
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
 * 무역???�유�?증서 구매 가???��?.
 * - ?�용: 블루·중립 ?�토 (구매 ??모두 player_independent ?�립�?
 * - 거�?: ?�드 ?�토 · 구매??�?? ?�드 미�???· ?� ?�랜 증서
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
  // independent(?�레?�어 ?�유)???�기??막�? ?�고 ?�래 deedOwner 체크�??�겨
  // already_owner/owned_by_other_clan ?????�확???�유�?반환?�게 ?�다.
  if (territorialSide !== 'blue' && territorialSide !== 'neutral' && territorialSide !== 'independent') {
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
  /** ?�레?�어 ?�립�??�색 �?��) ???�유�?증서 구매�?�?? ?�토?�서 ?�립 */
  isIndependent: boolean;
};

/** ?�성 ?�브·지?????�유�?증서 기�? ?�시�?(�?? ?�폴??= ?�텔리�? ?�합 ?? */
export function resolvePlanetHubOwnershipPlate(
  hold: PlanetClanHold,
  clans: Record<string, ClanBasicsRecord>,
  locale: AppLocale = 'ko',
): PlanetHubOwnershipPlate | null {
  const displayLocale = resolveOwnershipDisplayLocale(locale);
  if (hold.kind === 'neutral' && !isPlayerIndependentNationHold(hold)) return null;

  const deedOwnerClanId = resolveDeedOwnerClanId(hold);
  const nationDefault = isNationDefaultDeedOwnership(hold) && isNationSeedClanId(deedOwnerClanId);
  const isIndependent = isPlayerIndependentNationHold(hold);

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

  // ?�립�???"{?�네?? ?��?" ?�랜명에???�네?�만 추출("{?�네?? ?�립�? ?�기?? worldmap.panel.independent)
  const clanName = isIndependent
    ? stripSoloClanFleetSuffix(formatClanPlateDisplayName(rawName) || rawName)
    : formatClanPlateDisplayName(rawName) || rawName;

  return {
    clanName,
    clanColorClanId: nationDefault ? hold.occupierClanId : deedOwnerClanId,
    deedOwnerClanId,
    isNationDefault: nationDefault,
    isIndependent,
  };
}

/** ?�레?�어 ?�랜·uid 기�? ?�질 ?�유�?(증서·거점) */
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
