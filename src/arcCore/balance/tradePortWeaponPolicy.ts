// ============================================================
// 무역소 무기 진열 — 성능 밴드 × 계열 최소 1종 × 행성 간 SKU 중복 허용
// dev_trade_port Lv2+ → 고급 무기 가중 배분(tradePortDevWeaponListing)
// ============================================================

import { resolveStarSystemForPlanetId } from '../../world/resolvePlanetSystemPosition';
import { resolvePlanetZoneIndex } from '../planetBalance/planetZoneIndexRegistry';
import { resolveTradePortWeaponIdsForPlanetDev } from './tradePortDevWeaponListing';
import {
  isCanonicalTradePortWeapon,
  listCanonicalTradePortWeaponIds,
  resolveTradePortWeaponIdsForZone,
  resolveWeaponRequiredPilotLevel,
} from './weaponTradeListingPolicy';

export { isPinnedTradePortWeapon } from './weaponTradeListingPolicy';

function findSystemForPlanetId(planetId: string) {
  return resolveStarSystemForPlanetId(planetId);
}

function resolveInstalledTradePortLevel(planetId: string): number | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const listing = require('../../game/planetDevelopment/planetTradePortListing') as typeof import('../../game/planetDevelopment/planetTradePortListing');
    if (!listing.isPlanetTradePortInstalled(planetId)) return null;
    return listing.readPlanetTradePortDetail(planetId).level;
  } catch {
    return null;
  }
}

/** 무역소에 올릴 수 있는 무기 `weapon_item_*` id 전체(정책 등록분) */
export function listAllTradePortWeaponModuleItemIds(): string[] {
  return listCanonicalTradePortWeaponIds()
    .filter((id) => isCanonicalTradePortWeapon(id))
    .map((id) => `weapon_item_${id}`);
}

/** 행성 zone — dev Lv1=zone 정본 · Lv2+ 고급 무기 가중 배분 */
export function listWeaponModuleItemIdsForPlanet(planetId: string): string[] {
  const system = findSystemForPlanetId(planetId);
  const zoneIndex = resolvePlanetZoneIndex(planetId, system ?? null);
  const devLevel = resolveInstalledTradePortLevel(planetId);
  const weaponIds = devLevel != null && devLevel > 1
    ? resolveTradePortWeaponIdsForPlanetDev(zoneIndex, planetId, devLevel)
    : resolveTradePortWeaponIdsForZone(zoneIndex);

  const filtered = weaponIds.filter((id) => isCanonicalTradePortWeapon(id));

  return filtered
    .map((id) => `weapon_item_${id}`)
    .sort((a, b) => {
      const wa = a.slice('weapon_item_'.length);
      const wb = b.slice('weapon_item_'.length);
      const lvDiff = resolveWeaponRequiredPilotLevel(wa) - resolveWeaponRequiredPilotLevel(wb);
      if (lvDiff !== 0) return lvDiff;
      return wa.localeCompare(wb);
    });
}
