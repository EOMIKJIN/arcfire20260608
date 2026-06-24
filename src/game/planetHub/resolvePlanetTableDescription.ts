// ============================================================
// planets.csv description — Table-First 단일 조회 (행성 정보 UI·스냅샷 공용)
// ============================================================

import { findPlanetById } from '../../arcCore/planetEnvironment/resolvePlanetAsteroidVisualPolicy';
import { resolvePlanetDescription } from '../../i18n/systemText';
import { translate } from '../../i18n';
import type { AppLocale } from '../../i18n/types';
import { getNpcCaptain } from '../../npc/npcFleetRegistry';
import { getPlanetGovernorCommander } from '../planetGovernor/planetGovernorRegistry';

/** `tables/content/planets.csv` → `description` / `descriptionEn` */
export function resolvePlanetTableDescription(planetId: string, locale: AppLocale): string {
  const planet = findPlanetById(planetId);
  if (!planet) return '';
  return resolvePlanetDescription(planet, locale, planet.systemId);
}

/** 행성 정보창 설명 — planets.csv 설명 + 총사령관 이름 */
export function resolvePlanetInfoPanelDescription(planetId: string, locale: AppLocale): string {
  const base = resolvePlanetTableDescription(planetId, locale).trim();
  const gov = getPlanetGovernorCommander(planetId);
  if (!gov) return base;
  const captain = getNpcCaptain(gov.governorCaptainId);
  const name = String(captain?.displayName ?? '').trim();
  if (!name) return base;
  const governorLine = translate(locale, 'econInfo.planetGovernor', { name });
  if (!base) return governorLine;
  return `${base}\n${governorLine}`;
}
