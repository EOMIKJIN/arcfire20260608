// ============================================================
// ?‰ì„± ?Œìœ ê¶?ëª¨ë¸ ???í† (êµ??Â·êµ?²½) vs ?Œìœ ê¶?ì¦ì„œ(?´ëœ)
// ============================================================
//
// - occupierClanId: êµ?²½Â·?ë ¹?„Â·íŒ©??ê¸ˆê³  (ë¸”ë£¨/?ˆë“œ êµ?? ?œë“œ ?ëŠ” AI ?´ëœ)
// - deedOwnerClanId: null = êµ?? ?”í´???Œìœ , ê°??ˆìŒ = ?´ë‹¹ ?´ëœ??ì¦ì„œ ë³´ìœ 
// - ë¸”ë£¨/?ˆë“œ??UIÂ·ì§€??êµ¬ë¶„?? êµ??ëª…ì? megaFactionNationPolicy ?•ë³¸

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

/** ?Œë ˆ?´ì–´Â·?”ë¡œ ?´ëœ ??ì¦ì„œë¥??¤ì§ˆ ë³´ìœ ?????ˆëŠ” ?´ëœ */
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

/** êµ?²½Â·ê¸ˆê³ Â·Voronoi ???í†  ?ìœ  ?´ëœ */
export function resolveTerritorialOccupierClanId(hold: PlanetClanHold): string {
  return hold.occupierClanId;
}

/**
 * ?Œìœ ê¶?ì¦ì„œ ë³´ìœ  ?´ëœ.
 * deedOwnerClanId ë¯¸ì„¤?????í†  occupier(êµ?? ?œë“œÂ·AI ?´ëœ)ê°€ ?”í´???Œìœ .
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

/** CSV ?œë“œ ê¸°ì? ?í†  occupierÂ·kind (ì¦ì„œ ?´ì œÂ·ì¤‘ë¦½ ë³µì›) */
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

/** êµ¬ë§¤??ê±°ë? ?¸ë ¥ ??êµ?²½??Voronoi)??êµ?? ?œë“œ ?´ëœ id */
export function resolveNationSeedClanIdForMegaFaction(
  megaFactionId: string | null | undefined,
): string | null {
  const side = resolveMegaFactionSide(megaFactionId);
  if (side === 'blue') return ARC_CORE_SEED_BLUE_CLAN_ID;
  if (side === 'red') return ARC_CORE_SEED_RED_CLAN_ID;
  return null;
}

/** ?Œë ˆ?´ì–´ ?…ë¦½êµ?hold ??`player_independent` ?ëŠ” ì¤‘ë¦½/êµ?? occupier + ?Œë ˆ?´ì–´ ì¦ì„œ(legacy) */
export function isPlayerIndependentNationHold(hold: PlanetClanHold): boolean {
  if (hold.kind === 'player_independent') return true;
  const deedOwner = hold.deedOwnerClanId?.trim();
  if (!deedOwner || !isPlayerOriginatedClanId(deedOwner)) return false;
  if (isNationSeedClanId(hold.occupierClanId)) return true;
  if (hold.occupierClanId === 'neutral' || hold.kind === 'neutral') return true;
  return hold.occupierClanId === deedOwner;
}

/** VoronoiÂ·ì§€??occupier ??legacy ì¤‘ë¦½ ?í†  ?Œìœ ê¶?êµ¬ë§¤ ?¬í•¨ */
export function resolvePlayerIndependentOccupierClanId(hold: PlanetClanHold): string | null {
  if (!isPlayerIndependentNationHold(hold)) return null;
  const occupier = hold.occupierClanId?.trim();
  if (occupier && occupier !== 'neutral' && isPlayerOriginatedClanId(occupier)) return occupier;
  const deedOwner = hold.deedOwnerClanId?.trim();
  if (deedOwner && isPlayerOriginatedClanId(deedOwner)) return deedOwner;
  return null;
}

/** ?í†  êµ?²½ side ??ì¤‘ë¦½ holdÂ·occupier ?¬í•¨ */
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

/** v1?’v2 ë§ˆì´ê·¸ë ˆ?´ì…˜: êµ¬ë§¤ ??occupierClanIdë§?ë°”ê¾¸???€?¥ì„ ?í† /ì¦ì„œ ë¶„ë¦¬ */
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
 * M2-E(? íƒ) ??ê¸°ì¡´ êµ¬ë§¤ hold ???…ë¦½êµ??„í™˜.
 * - occupier=êµ?? ?œë“œ + deedOwner=?Œë ˆ?´ì–´ (ë¸”ë£¨/?ˆë“œ ?í†  legacy)
 * - occupier=neutral + deedOwner=?Œë ˆ?´ì–´ (ì¤‘ë¦½ ?í†  legacy)
 * idempotent ??ë§?ë¶€???ˆì „ ?¬ì‹¤??
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
 * ?€??ì§€??VoronoiÂ·?¨ë„ ??store hold ê¸°ì? occupier.
 * hold ë¯¸ì‹œ?œÂ·ë¹„ contested neutral ?€ CSV ?œë“œ ?©ì„±. ?‘ì „ì§€??neutral ?€ ArcCore ?ì • ?€ê¸?undefined).
 */
export function resolveEffectiveMapOccupierClanId(
  planetId: string,
  hold: PlanetClanHold | undefined,
): string | undefined {
  if (isPlanetContestedZone(planetId)) {
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
    // ?Œë ˆ?´ì–´ ?„íˆ¬ ?¹ë¦¬ ì¤‘ë¦½????CSV ?œë“œ ?´ë°± ?†ì´ ì¤‘ë¦½ êµ?²½ ? ì?
    if (hold.neutralizedAt) return undefined;
  }

  const seed = resolveSeedOccupierClanForPlanet(planetId);
  if (seed.kind === 'neutral' || seed.occupierClanId === 'neutral') {
    return undefined;
  }
  return seed.occupierClanId;
}

/** hold ë¯¸ì‹œ????CSV occupation ?œë“œë¡??©ì„± */
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

/** ë¬´ì—­??êµ¬ë§¤ UI ??êµ¬ë§¤ ì°¨ë‹¨ ?¬ìœ (ë²”ìš© Alert) */
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
 * ë¬´ì—­???Œìœ ê¶?ì¦ì„œ êµ¬ë§¤ ê°€???¬ë?.
 * - ?ˆìš©: ë¸”ë£¨Â·ì¤‘ë¦½ ?í†  (êµ¬ë§¤ ??ëª¨ë‘ player_independent ?…ë¦½êµ?
 * - ê±°ë?: ?ˆë“œ ?í†  Â· êµ¬ë§¤??êµ?? ?œë“œ ë¯¸ì???Â· ?€ ?´ëœ ì¦ì„œ
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
  // independent(?Œë ˆ?´ì–´ ?Œìœ )???¬ê¸°??ë§‰ì? ?Šê³  ?„ë˜ deedOwner ì²´í¬ë¡??˜ê²¨
  // already_owner/owned_by_other_clan ?????•í™•???¬ìœ ë¥?ë°˜í™˜?˜ê²Œ ?œë‹¤.
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
  /** ?Œë ˆ?´ì–´ ?…ë¦½êµ??¹ìƒ‰ êµ?²½) ???Œìœ ê¶?ì¦ì„œ êµ¬ë§¤ë¡?êµ?? ?í† ?ì„œ ?…ë¦½ */
  isIndependent: boolean;
};

/** ?‰ì„± ?ˆë¸ŒÂ·ì§€?????Œìœ ê¶?ì¦ì„œ ê¸°ì? ?œì‹œëª?(êµ?? ?”í´??= ?¤í…”ë¦¬ì? ?°í•© ?? */
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

  // ?…ë¦½êµ???"{?‰ë„¤?? ?¨ë?" ?´ëœëª…ì—???‰ë„¤?„ë§Œ ì¶”ì¶œ("{?‰ë„¤?? ?…ë¦½êµ? ?œê¸°?? worldmap.panel.independent)
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

/** ?Œë ˆ?´ì–´ ?´ëœÂ·uid ê¸°ì? ?¤ì§ˆ ?Œìœ ê¶?(ì¦ì„œÂ·ê±°ì ) */
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
