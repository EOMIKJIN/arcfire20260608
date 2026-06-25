// ============================================================
// 메가팩션 수도 — occupation seeds · trade route · compendium 연동
// ============================================================

import { findPlanetById } from '../arcCore/planetEnvironment/resolvePlanetAsteroidVisualPolicy';
import { resolvePlanetDisplayName } from '../i18n/systemText';
import type { AppLocale } from '../i18n/types';
import {
  resolveGalaxyRouteDirectionForPlanet,
  resolveMegaFactionCapitalSide,
} from './galaxyRouteFactionBridge';

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

/** 행성정보 수도 부제 — 행성명 + 항로만 (블루팀/레드팀·(블루수도) 레거시 미사용) */
export function resolveMegaFactionCapitalHubSubtitle(
  planetId: string | null | undefined,
  t: TranslateFn,
  locale: AppLocale = 'ko',
): string | null {
  const id = String(planetId ?? '').trim();
  if (!resolveMegaFactionCapitalSide(id)) return null;

  const planet = findPlanetById(id);
  const place = planet ? resolvePlanetDisplayName(planet, locale) : id;
  const route = resolveGalaxyRouteDirectionForPlanet(id);
  if (!route) return place;

  return `${place} ${t(`worldmap.route.${route}`)}`;
}
