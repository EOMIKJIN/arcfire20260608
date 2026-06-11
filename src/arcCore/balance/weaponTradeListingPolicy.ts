// ============================================================
// weapon_trade_listing_policy.csv — 무역소 판매 무기 정본
// vmock·wave(NPC 슬롯 번호 복제)만 제외 · 기본 _01·arc 전체 포함
// ============================================================

import { WeaponTradeListingPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';
import { CAPITAL_WEAPON_LIST_FROM_CSV } from '../../data/generated/csvWeapons';
import {
  getTradePortWeaponListingCount,
  getTradePortWeaponMinPerPlanet,
  getTradePortWeaponZoneOverlap,
} from './balanceTableRegistry';
import { getPlanetLevelingRowForZone } from '../planetBalance/planetZoneIndexRegistry';

type ListingRow = (typeof WeaponTradeListingPolicy_FROM_BALANCE_CSV)[number];

const SORTED_LISTING_ROWS: ListingRow[] = [...WeaponTradeListingPolicy_FROM_BALANCE_CSV].sort(
  (a, b) => parseNum(a.tradeGradeRank, 0) - parseNum(b.tradeGradeRank, 0),
);

const PINNED_LISTING_ROWS = SORTED_LISTING_ROWS.filter(
  (row) => String(row.listingAnchor ?? '').trim().toLowerCase() === 'pinned',
);

const PROGRESSION_LISTING_ROWS = SORTED_LISTING_ROWS.filter(
  (row) => String(row.listingAnchor ?? '').trim().toLowerCase() !== 'pinned',
);

const pinnedWeaponIds = new Set(
  PINNED_LISTING_ROWS.map((row) => String(row.canonicalWeaponId).trim()),
);

const canonicalWeaponIds = new Set(
  SORTED_LISTING_ROWS.map((row) => String(row.canonicalWeaponId).trim()),
);

const TRADE_PORT_WEAPON_FAMILY_GROUPS = [
  'laser',
  'missile',
  'rocket',
  'drone',
  'carrier',
] as const;

function parseNum(raw: string | number | undefined, fallback = 0): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function listWeaponTradeGradeListingRows(): readonly ListingRow[] {
  return SORTED_LISTING_ROWS;
}

export function listPinnedTradePortWeaponIds(): string[] {
  return [...pinnedWeaponIds];
}

export function isPinnedTradePortWeapon(weaponId: string): boolean {
  return pinnedWeaponIds.has(weaponId.trim());
}

export function listCanonicalTradePortWeaponIds(): string[] {
  return [...canonicalWeaponIds];
}

export function isCanonicalTradePortWeapon(weaponId: string): boolean {
  if (!canonicalWeaponIds.has(weaponId.trim())) return false;
  const row = CAPITAL_WEAPON_LIST_FROM_CSV[weaponId.trim()];
  return row?.tradePortListed === true;
}

export function resolveWeaponRequiredPilotLevel(weaponId: string): number {
  const policy = SORTED_LISTING_ROWS.find(
    (r) => String(r.canonicalWeaponId).trim() === weaponId.trim(),
  );
  if (policy) return parseNum(policy.requiredPilotLevelMin, 1);
  return Math.max(1, CAPITAL_WEAPON_LIST_FROM_CSV[weaponId.trim()]?.requiredLevel ?? 1);
}

/** 행성 zone — 권장 레벨 밴드 + 인접 zone 겹침(동일 SKU 중복 판매 허용) */
export function resolvePilotLevelBandForZone(zoneIndex: number): { minLv: number; maxLv: number } {
  const zone = Math.max(1, Math.min(20, Math.round(zoneIndex)));
  const overlap = getTradePortWeaponZoneOverlap();
  const curLv = parseNum(getPlanetLevelingRowForZone(zone).recommendedPilotLevel, 1);

  let minLv = curLv;
  let maxLv = curLv;
  for (let d = 1; d <= overlap; d += 1) {
    if (zone - d >= 1) {
      minLv = Math.min(
        minLv,
        parseNum(getPlanetLevelingRowForZone(zone - d).recommendedPilotLevel, 1),
      );
    }
    if (zone + d <= 20) {
      maxLv = Math.max(
        maxLv,
        parseNum(getPlanetLevelingRowForZone(zone + d).recommendedPilotLevel, curLv),
      );
    }
  }

  return { minLv: Math.max(1, minLv), maxLv: Math.max(minLv, maxLv) };
}

/**
 * 행성 zone — 기본 무장(pinned) 상시 + 성능 밴드 progression + 계열 최소 1종.
 */
export function resolveTradePortWeaponIdsForZone(zoneIndex: number): string[] {
  const { minLv, maxLv } = resolvePilotLevelBandForZone(zoneIndex);
  const minCount = getTradePortWeaponMinPerPlanet();
  const listingCap = getTradePortWeaponListingCount();

  const selected = new Set<string>();

  for (const row of PINNED_LISTING_ROWS) {
    const id = String(row.canonicalWeaponId).trim();
    if (id && isCanonicalTradePortWeapon(id)) selected.add(id);
  }

  for (const row of PROGRESSION_LISTING_ROWS) {
    const id = String(row.canonicalWeaponId).trim();
    if (!id || !isCanonicalTradePortWeapon(id)) continue;
    const req = parseNum(row.requiredPilotLevelMin, 1);
    if (req >= minLv && req <= maxLv) selected.add(id);
  }

  for (const family of TRADE_PORT_WEAPON_FAMILY_GROUPS) {
    const hasFamily = [...selected].some(
      (id) => resolveWeaponFamilyKindForTradeCatalogWeapon(id) === family,
    );
    if (hasFamily) continue;
    const pick = PROGRESSION_LISTING_ROWS.find((row) => {
      const id = String(row.canonicalWeaponId).trim();
      if (!id || !isCanonicalTradePortWeapon(id)) return false;
      const req = parseNum(row.requiredPilotLevelMin, 1);
      if (req > maxLv) return false;
      return String(row.weaponFamilyKind).trim().toLowerCase() === family;
    });
    if (pick) selected.add(String(pick.canonicalWeaponId).trim());
  }

  if (selected.size < minCount) {
    for (const row of PROGRESSION_LISTING_ROWS) {
      if (selected.size >= minCount) break;
      const id = String(row.canonicalWeaponId).trim();
      if (!id || !isCanonicalTradePortWeapon(id)) continue;
      if (parseNum(row.requiredPilotLevelMin, 1) <= maxLv) selected.add(id);
    }
  }

  const sorted = [...selected].sort((a, b) => {
    const aPinned = isPinnedTradePortWeapon(a) ? 0 : 1;
    const bPinned = isPinnedTradePortWeapon(b) ? 0 : 1;
    if (aPinned !== bPinned) return aPinned - bPinned;
    const lvDiff = resolveWeaponRequiredPilotLevel(a) - resolveWeaponRequiredPilotLevel(b);
    if (lvDiff !== 0) return lvDiff;
    return a.localeCompare(b);
  });

  if (sorted.length <= listingCap) return sorted;

  const pinned = sorted.filter((id) => isPinnedTradePortWeapon(id));
  const progression = sorted.filter((id) => !isPinnedTradePortWeapon(id));
  const progressionSlots = Math.max(0, listingCap - pinned.length);
  return [...pinned, ...progression.slice(0, progressionSlots)];
}

export function resolveWeaponFamilyKindForTradeCatalogWeapon(weaponId: string): string {
  const row = SORTED_LISTING_ROWS.find(
    (r) => String(r.canonicalWeaponId).trim() === weaponId.trim(),
  );
  if (row) return String(row.weaponFamilyKind).trim().toLowerCase();
  const weapon = CAPITAL_WEAPON_LIST_FROM_CSV[weaponId.trim()];
  return String(weapon?.familyKind ?? 'laser').trim().toLowerCase();
}
