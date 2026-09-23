import { resolveFacilityLevelByType } from '../game/planetDevelopment/planetFacilityLevelResolver';
import {
  resolveBarInstanceCategorySlotsForLevel,
  resolveBarInstanceListedCap,
  type BarInstanceBoardLayout,
} from './barInstanceBoardPolicy';

/** persist 돔 또는 CSV hasBar 유효 Lv1. */
export function resolvePlanetBarDomeLevelForMissions(planetId: string): number {
  const id = String(planetId ?? '').trim();
  if (!id) return 0;
  return Math.max(0, Math.floor(resolveFacilityLevelByType(id, 'bar') || 0));
}

export function resolveBarInstanceBoardLayout(planetId: string): BarInstanceBoardLayout {
  const level = resolvePlanetBarDomeLevelForMissions(planetId);
  return {
    level,
    maxListed: resolveBarInstanceListedCap(level),
    slots: resolveBarInstanceCategorySlotsForLevel(level),
  };
}
