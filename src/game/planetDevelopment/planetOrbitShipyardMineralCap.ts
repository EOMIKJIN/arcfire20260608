// ============================================================
// 조선소 광물 강화 상한 — playerStore·UI 전용 (순환 참조 격리)
// ============================================================

import { resolveShipyardMineralUpgradeCapForLevel } from '../../arcCore/balance/facilityShipyardLevelPolicy';
import { readPlanetOrbitShipyardDetail } from './planetOrbitShipyardListing';

/** 개발 설치·레벨 기준 — 미설치 시 0 (방위위성과 동일 계약) */
export function resolvePlanetShipyardLevelForMineralCap(planetId: string): number {
  const detail = readPlanetOrbitShipyardDetail(planetId);
  return detail.installed ? detail.level : 0;
}

export function resolvePlanetShipyardMineralCap(planetId: string): number {
  const level = resolvePlanetShipyardLevelForMineralCap(planetId);
  return resolveShipyardMineralUpgradeCapForLevel(level);
}
