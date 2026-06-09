// ============================================================
// 무역소 진열 단일 정본 — 01_레벨업구조 · planet_leveling_progression × balance CSV
// ============================================================

import {
  TradePortGlobalItems_FROM_BALANCE_CSV,
  TradePortWeaponTierPolicy_FROM_BALANCE_CSV,
} from '../../data/balance/generated';
import { listZoneTradeableMineralIds } from '../economy/mineralTradePricing';
import { listTradeRoutePlayerBuyItemIds } from '../economy/tradeRouteCommercePolicy';
import { getItemDef, listItemDefs } from '../../data/itemRegistry';
import { STAR_SYSTEMS } from '../../data/systems';
import { dispatchEconomyTradePortBulk } from '../ArcCoreCommandBus';
import {
  getPlanetLevelingRowForZone,
  resolvePlanetZoneIndex,
} from '../planetBalance/planetZoneIndexRegistry';
import { listPlanetIdsWithTradePort } from '../../world/planetTradePortDb';
import { getTradePortWeaponModuleRequiredLevel } from '../../world/planetTradePortDb';
import { listCapitalShipItemIdsForPlanet } from './tradePortCapitalShipPolicy';
import { getCapitalHullPurchaseRow } from './balanceTableRegistry';
import {
  isCanonicalTradePortCapitalShip,
  resolveHullTierKeyForTradeCatalogShip,
} from './capitalShipTradeListingPolicy';

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
  const levelCap = Math.min(Math.max(1, Math.floor(recommendedPilotLevel)), tierCap);
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

/** 아크코어 — 행성별 무역소 전체 진열 id (교역품·무기·전함·소유권·글로벌) */
export function resolveTradePortCatalogItemIds(planetId: string): string[] {
  const system = findSystemForPlanetId(planetId);
  const zoneIndex = resolvePlanetZoneIndex(planetId, system ?? null);
  const row = getPlanetLevelingRowForZone(zoneIndex);
  const recommendedPilotLevel = parseNum(row.recommendedPilotLevel, 1);
  const recommendedWeaponTierKey = String(row.recommendedWeaponTierKey ?? 't1_laser');

  const parts = [
    ...listTradeRoutePlayerBuyItemIds(planetId),
    ...listZoneTradeableMineralIds(zoneIndex),
    ...listWeaponModuleItemIdsForPlanetZone(recommendedPilotLevel, recommendedWeaponTierKey),
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

  return true;
}

/** UI·시장 — 행성 진열 ∩ 플레이어 구매 가능 */
export function filterTradePortCatalogForPlayer(itemIds: readonly string[], playerLevel: number): string[] {
  return itemIds.filter((id) => isTradePortItemPurchasableByPlayer(id, playerLevel));
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
