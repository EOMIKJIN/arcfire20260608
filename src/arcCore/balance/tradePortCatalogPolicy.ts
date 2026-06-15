// ============================================================
// 무역소 진열 단일 정본 — 01_레벨업구조 · planet_leveling_progression × balance CSV
// ============================================================

import {
  TradePortEquipmentTierPolicy_FROM_BALANCE_CSV,
  TradePortGlobalItems_FROM_BALANCE_CSV,
  TradePortWeaponTierPolicy_FROM_BALANCE_CSV,
} from '../../data/balance/generated';
import { listTradeRoutePlayerBuyItemIds } from '../economy/tradeRouteCommercePolicy';
import { resolvePlanetSupplyStockScale } from '../economy/planetEconomyFabric';
import {
  listZoneTradeableMineralIds,
  resolveZonePrimaryMineralId,
} from '../economy/mineralTradePricing';
import { getItemDef, listItemDefs } from '../../data/itemRegistry';
import { STAR_SYSTEMS } from '../../data/systems';
import { dispatchEconomyTradePortBulk } from '../ArcCoreCommandBus';
import {
  getPlanetLevelingRowForZone,
  resolvePlanetZoneIndex,
} from '../planetBalance/planetZoneIndexRegistry';
import { listPlanetIdsWithTradePort } from '../../world/planetTradePortDb';
import {
  getTradePortEquipmentRequiredLevel,
  getTradePortWeaponModuleRequiredLevel,
} from '../../world/planetTradePortDb';
import { listCapitalShipItemIdsForPlanet } from './tradePortCapitalShipPolicy';
import { listWeaponModuleItemIdsForPlanet } from './tradePortWeaponPolicy';
import { getCapitalHullPurchaseRow } from './balanceTableRegistry';
import {
  isCanonicalTradePortCapitalShip,
  resolveHullTierKeyForTradeCatalogShip,
} from './capitalShipTradeListingPolicy';
import { isCanonicalTradePortWeapon } from './weaponTradeListingPolicy';

function parseNum(raw: string | number | undefined, fallback = 0): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function findSystemForPlanetId(planetId: string) {
  for (const system of Object.values(STAR_SYSTEMS)) {
    if (system.planets.some((p) => p.id === planetId)) return system;
  }
  return undefined;
}

const weaponTierByKey = new Map(
  TradePortWeaponTierPolicy_FROM_BALANCE_CSV.map(
    (row) => [String(row.tierKey).trim(), row] as const,
  ),
);

const equipmentTierByKey = new Map(
  TradePortEquipmentTierPolicy_FROM_BALANCE_CSV.map(
    (row) => [String(row.tierKey).trim(), row] as const,
  ),
);

const globalTradePortItemIds = TradePortGlobalItems_FROM_BALANCE_CSV.map((row) =>
  String(row.itemId).trim(),
).filter(Boolean);

function weaponModuleRequiredLevelFromDef(def: ReturnType<typeof getItemDef>): number {
  if (!def || def.type !== 'weapon_module') return Number.POSITIVE_INFINITY;
  const raw = def.attrs?.weaponRequiredLevel;
  if (typeof raw === 'number' && Number.isFinite(raw)) return Math.max(1, Math.floor(raw));
  if (typeof raw === 'string') {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isFinite(parsed)) return Math.max(1, parsed);
  }
  return 1;
}

function weaponFamilyKindFromDef(def: ReturnType<typeof getItemDef>): string {
  const family = def?.attrs?.weaponFamilyKind ?? def?.attrs?.weaponKind;
  return typeof family === 'string' ? family.trim().toLowerCase() : '';
}

function equipmentRequiredLevelFromDef(def: ReturnType<typeof getItemDef>): number {
  if (!def) return Number.POSITIVE_INFINITY;
  const raw = def.attrs?.equipmentRequiredLevel;
  if (typeof raw === 'number' && Number.isFinite(raw)) return Math.max(1, Math.floor(raw));
  if (typeof raw === 'string') {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isFinite(parsed)) return Math.max(1, parsed);
  }
  return 1;
}

function equipmentCategoryFromDef(def: ReturnType<typeof getItemDef>): string {
  const raw = def?.attrs?.equipmentCategory;
  return typeof raw === 'string' ? raw.trim().toLowerCase() : '';
}

function equipmentGradeFromDef(def: ReturnType<typeof getItemDef>): number {
  if (!def) return Number.POSITIVE_INFINITY;
  const raw = def.attrs?.equipmentGrade;
  if (typeof raw === 'number' && Number.isFinite(raw)) return Math.max(1, Math.min(3, Math.floor(raw)));
  if (typeof raw === 'string') {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isFinite(parsed)) return Math.max(1, Math.min(3, parsed));
  }
  return 1;
}

function isShipTradeEquipmentDef(def: ReturnType<typeof getItemDef>): boolean {
  if (!def?.tradeable || def.kind !== 'equipment') return false;
  if (def.type === 'weapon_module') return false;
  return def.type === 'ship_equipment';
}

function resolveEquipmentTierKeyFromWeaponTier(recommendedWeaponTierKey: string): string {
  const prefix = recommendedWeaponTierKey.trim().toLowerCase().match(/^t(\d)/)?.[1];
  if (prefix === '4') return 'eq_t4';
  if (prefix === '3') return 'eq_t3';
  if (prefix === '2') return 'eq_t2';
  return 'eq_t1';
}

function resolvePlanetOwnershipItemId(planetId: string): string | null {
  const id = `ownership_${planetId}`;
  const def = getItemDef(id);
  return def?.tradeable ? id : null;
}

/** 행성 zone · `recommendedWeaponTierKey` 기준 무기 모듈 진열 */
export function listWeaponModuleItemIdsForPlanetZone(
  recommendedPilotLevel: number,
  recommendedWeaponTierKey: string,
): string[] {
  const tierRow = weaponTierByKey.get(recommendedWeaponTierKey.trim());
  const tierCap = tierRow
    ? parseNum(tierRow.maxWeaponRequiredLevel, 60)
    : Math.max(1, Math.floor(recommendedPilotLevel));
  /** zone 티어 상한 — recommendedPilotLevel(행성 권장 Lv)과 분리 */
  const levelCap = tierCap;
  const kindFilter = tierRow ? String(tierRow.weaponFamilyKindFilter ?? '*').trim().toLowerCase() : '*';

  const allInBand = listItemDefs().filter((d) => {
    if (d.type !== 'weapon_module' || !d.tradeable) return false;
    return weaponModuleRequiredLevelFromDef(d) <= levelCap;
  });

  if (kindFilter === '*' || kindFilter === '') {
    return allInBand.map((d) => d.id);
  }

  const kindMatched = allInBand.filter((d) => weaponFamilyKindFromDef(d) === kindFilter);
  if (kindMatched.length > 0) return kindMatched.map((d) => d.id);
  return allInBand.map((d) => d.id);
}

/** 행성 zone · 무기 티어 연동 함선 장비 진열(무기 제외 `kind:equipment`) */
export function listShipEquipmentItemIdsForPlanetZone(
  recommendedPilotLevel: number,
  recommendedWeaponTierKey: string,
): string[] {
  const eqTierKey = resolveEquipmentTierKeyFromWeaponTier(recommendedWeaponTierKey);
  const tierRow = equipmentTierByKey.get(eqTierKey);
  const tierCap = tierRow
    ? parseNum(tierRow.maxEquipmentRequiredLevel, 60)
    : Math.max(1, Math.floor(recommendedPilotLevel));
  /** zone 티어(eq_t*) 상한 — 행성 권장 Lv와 분리, 구매 Lv는 isTradePortItemPurchasableByPlayer */
  const levelCap = tierCap;
  const gradeCap = tierRow
    ? Math.max(1, Math.min(3, parseNum(tierRow.maxEquipmentGrade, 3)))
    : 3;
  const categoryFilter = tierRow
    ? String(tierRow.equipmentCategoryFilter ?? '*').trim().toLowerCase()
    : '*';

  const allInBand = listItemDefs().filter((d) => {
    if (!isShipTradeEquipmentDef(d)) return false;
    if (equipmentGradeFromDef(d) > gradeCap) return false;
    return equipmentRequiredLevelFromDef(d) <= levelCap;
  });

  if (categoryFilter === '*' || categoryFilter === '') {
    return allInBand.map((d) => d.id);
  }

  const categoryMatched = allInBand.filter(
    (d) => equipmentCategoryFromDef(d) === categoryFilter,
  );
  if (categoryMatched.length > 0) return categoryMatched.map((d) => d.id);
  return allInBand.map((d) => d.id);
}

/** 생산 재고 배율·zone 풀 — 광물 SKU 슬롯 수(최소 1) */
function listMineralIdsForPlanetCatalog(planetId: string, zoneIndex: number): string[] {
  const pool = [...listZoneTradeableMineralIds(zoneIndex)];
  if (pool.length === 0) return [];

  const primary = resolveZonePrimaryMineralId(zoneIndex);
  if (primary && pool.includes(primary)) {
    pool.sort((a, b) => (a === primary ? -1 : b === primary ? 1 : 0));
  }

  const scale = resolvePlanetSupplyStockScale(planetId);
  const slotCount = Math.max(1, Math.min(pool.length, Math.round(scale * pool.length)));
  return pool.slice(0, slotCount);
}

/** 아크코어 — 행성별 무역소 전체 진열 id (교역품·무기·전함·소유권·글로벌) */
export function resolveTradePortCatalogItemIds(planetId: string): string[] {
  const system = findSystemForPlanetId(planetId);
  const zoneIndex = resolvePlanetZoneIndex(planetId, system ?? null);
  const row = getPlanetLevelingRowForZone(zoneIndex);
  const recommendedPilotLevel = parseNum(row.recommendedPilotLevel, 1);
  const recommendedWeaponTierKey = String(row.recommendedWeaponTierKey ?? 't1_laser');

  const parts = [
    ...listTradeRoutePlayerBuyItemIds(planetId),
    ...listMineralIdsForPlanetCatalog(planetId, zoneIndex),
    ...listWeaponModuleItemIdsForPlanet(planetId),
    ...listShipEquipmentItemIdsForPlanetZone(recommendedPilotLevel, recommendedWeaponTierKey),
    ...listCapitalShipItemIdsForPlanet(planetId),
    ...globalTradePortItemIds,
  ];

  const ownershipId = resolvePlanetOwnershipItemId(planetId);
  if (ownershipId) parts.push(ownershipId);

  const unique = [...new Set(parts)].filter((id) => Boolean(getItemDef(id)?.tradeable));
  return unique;
}

/** 플레이어 레벨 — 구매 가능 여부(진열은 행성 zone, 구매는 성장 레벨) */
export function isTradePortItemPurchasableByPlayer(itemId: string, playerLevel: number): boolean {
  const def = getItemDef(itemId);
  if (!def?.tradeable) return false;

  const lv = Math.max(1, Math.floor(playerLevel));

  if (def.type === 'weapon_module') {
    const weaponId = String(def.attrs?.weaponId ?? '').trim();
    if (!weaponId || !isCanonicalTradePortWeapon(weaponId)) return false;
    const req = getTradePortWeaponModuleRequiredLevel(itemId);
    return req != null && req <= lv;
  }

  if (def.type === 'capital_ship') {
    const npcId = String(def.attrs?.npcCapitalShipId ?? '').trim();
    if (!npcId || !isCanonicalTradePortCapitalShip(npcId)) return false;
    const tier = resolveHullTierKeyForTradeCatalogShip(npcId);
    const row = getCapitalHullPurchaseRow(tier);
    return lv >= parseNum(row?.requiredPilotLevelMin, 1);
  }

  if (isShipTradeEquipmentDef(def)) {
    const req = getTradePortEquipmentRequiredLevel(itemId);
    return req != null && req <= lv;
  }

  return true;
}

/** 무역소 구매 탭 — 행성 카탈로그 진열(플레이어 Lv 무관). 구매 차단은 isTradePortItemPurchasableByPlayer */
export function isTradePortBuyMarketListedItem(itemId: string): boolean {
  const def = getItemDef(itemId);
  if (!def?.tradeable) return false;

  if (def.type === 'weapon_module') {
    const weaponId = String(def.attrs?.weaponId ?? '').trim();
    return Boolean(weaponId && isCanonicalTradePortWeapon(weaponId));
  }

  if (def.type === 'capital_ship') {
    const npcId = String(def.attrs?.npcCapitalShipId ?? '').trim();
    return Boolean(npcId && isCanonicalTradePortCapitalShip(npcId));
  }

  if (isShipTradeEquipmentDef(def)) {
    return getTradePortEquipmentRequiredLevel(itemId) != null;
  }

  return true;
}

/** UI·시장 — 행성 진열 ∩ 플레이어 구매 가능 */
export function filterTradePortCatalogForPlayer(itemIds: readonly string[], playerLevel: number): string[] {
  return itemIds.filter((id) => isTradePortItemPurchasableByPlayer(id, playerLevel));
}

/**
 * 구매 탭 진열 — 무기·전함·장비·교역품 공통: 행성 카탈로그 전부 표시.
 * 레벨·재고·잔고 등은 구매 버튼(resolveTradeBuyBlock)에서만 차단.
 */
export function filterTradePortCatalogForBuyMarket(
  itemIds: readonly string[],
  _playerLevel?: number,
): string[] {
  return itemIds.filter((id) => isTradePortBuyMarketListedItem(id));
}

let lastSyncSignature = '';

/** 아크코어 — 전 무역소 진열 재동기(단일 채널) */
export function syncTradePortCatalogFromBalance(force = false): void {
  const planetIds = listPlanetIdsWithTradePort();
  const signature = planetIds
    .map((pid) => `${pid}:${resolveTradePortCatalogItemIds(pid).join(',')}`)
    .join('|');
  if (!force && signature === lastSyncSignature) return;
  lastSyncSignature = signature;

  const meta = {
    origin: 'arc_core_policy' as const,
    reason: 'trade_port_zone_catalog',
  };

  for (const planetId of planetIds) {
    dispatchEconomyTradePortBulk({
      action: 'set_catalog',
      scope: { kind: 'planet_ids', planetIds: [planetId] },
      itemIds: resolveTradePortCatalogItemIds(planetId),
      meta,
    });
  }
}
