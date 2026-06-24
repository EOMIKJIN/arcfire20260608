// ============================================================
// planets.csv description — Table-First 단일 조회 (행성 정보 UI·스냅샷 공용)
// ============================================================

import { findPlanetById } from '../../arcCore/planetEnvironment/resolvePlanetAsteroidVisualPolicy';
import { resolvePlanetDescription } from '../../i18n/systemText';
import type { AppLocale } from '../../i18n/types';

/** `tables/content/planets.csv` → `description` / `descriptionEn` */
export function resolvePlanetTableDescription(planetId: string, locale: AppLocale): string {
  const planet = findPlanetById(planetId);
  if (!planet) return '';
  return resolvePlanetDescription(planet, locale, planet.systemId);
}
