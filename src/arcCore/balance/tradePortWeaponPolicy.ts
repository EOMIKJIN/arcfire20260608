// ============================================================
// 무역소 무기 진열 — 성능 밴드 × 계열 최소 1종 × 행성 간 SKU 중복 허용
// ============================================================

import { STAR_SYSTEMS } from '../../data/systems';
import { resolvePlanetZoneIndex } from '../planetBalance/planetZoneIndexRegistry';
import {
  isCanonicalTradePortWeapon,
  listCanonicalTradePortWeaponIds,
  resolveTradePortWeaponIdsForZone,
  resolveWeaponRequiredPilotLevel,
} from './weaponTradeListingPolicy';

export { isPinnedTradePortWeapon } from './weaponTradeListingPolicy';

function findSystemForPlanetId(planetId: string) {
  for (const system of Object.values(STAR_SYSTEMS)) {
    if (system.planets.some((p) => p.id === planetId)) return system;
  }
  return undefined;
}

/** 무역소에 올릴 수 있는 무기 `weapon_item_*` id 전체(정책 등록분) */
export function listAllTradePortWeaponModuleItemIds(): string[] {
  return listCanonicalTradePortWeaponIds()
    .filter((id) => isCanonicalTradePortWeapon(id))
    .map((id) => `weapon_item_${id}`);
}

/** 행성 zone — 성능 밴드 기반 진열(계열 단일 필터 없음 · 독점 없음) */
export function listWeaponModuleItemIdsForPlanet(planetId: string): string[] {
  const system = findSystemForPlanetId(planetId);
  const zoneIndex = resolvePlanetZoneIndex(planetId, system ?? null);
  const weaponIds = resolveTradePortWeaponIdsForZone(zoneIndex).filter((id) =>
    isCanonicalTradePortWeapon(id),
  );

  return weaponIds
    .map((id) => `weapon_item_${id}`)
    .sort((a, b) => {
      const wa = a.slice('weapon_item_'.length);
      const wb = b.slice('weapon_item_'.length);
      const lvDiff = resolveWeaponRequiredPilotLevel(wa) - resolveWeaponRequiredPilotLevel(wb);
      if (lvDiff !== 0) return lvDiff;
      return wa.localeCompare(wb);
    });
}
