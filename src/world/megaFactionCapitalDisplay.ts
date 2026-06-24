// ============================================================
// 메가팩션 수도 — occupation seeds · trade route · compendium 연동
// ============================================================

import {
  resolveGalaxyRouteDirectionForPlanet,
  resolveMegaFactionCapitalSide,
  resolveOccupationSeedForPlanet,
} from './galaxyRouteFactionBridge';

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

export function resolveMegaFactionCapitalHubSubtitle(
  planetId: string | null | undefined,
  t: TranslateFn,
): string | null {
  const id = String(planetId ?? '').trim();
  const side = resolveMegaFactionCapitalSide(id);
  if (!side) return null;

  const seed = resolveOccupationSeedForPlanet(id);
  const route = resolveGalaxyRouteDirectionForPlanet(id);
  const sideLabel = t(side === 'blue' ? 'territorial.side.blue' : 'territorial.side.red');
  const place = seed?.alertLabelKo?.trim() || id;
  if (!route) return `${sideLabel} ${place}`;

  return `${sideLabel} ${place} ${t(`worldmap.route.${route}`)}`;
}
