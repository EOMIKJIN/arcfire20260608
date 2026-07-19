// ============================================================
// planets.csv description — Table-First 단일 조회 (행성 정보 UI·스냅샷 공용)
// ============================================================

import { findPlanetById } from '../../arcCore/planetEnvironment/resolvePlanetAsteroidVisualPolicy';
import { resolvePlanetDescription } from '../../i18n/systemText';
import { resolvePlanetInfoPanelPresentation } from './resolvePlanetInfoPanelStage';
import type { AppLocale } from '../../i18n/types';

/** `planets.csv` + `planet_info_panel_stage.csv` 단계 설명 */
export function resolvePlanetTableDescription(planetId: string, locale: AppLocale): string {
  const pres = resolvePlanetInfoPanelPresentation(planetId, locale);
  if (pres.description.trim()) return pres.description.trim();
  const planet = findPlanetById(planetId);
  if (!planet) return '';
  return resolvePlanetDescription(planet, locale, planet.systemId);
}

// 총사령관 이름 줄을 덧붙이던 resolvePlanetInfoPanelDescription은 제거됨(2026-07-19)
// — 행성 정보창의 총사령관 포트레이트 카드(`PlanetInfoGovernorCard`)와 중복 표기였다.
