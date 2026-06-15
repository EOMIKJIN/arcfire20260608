import { resolvePlanetWorldObjectContext } from '../../worldObjects/planetContext';
import { listPlanetWorldObjectsByKind } from '../../worldObjects/query';
import type { WorldObject } from '../../worldObjects';

/** 행성 `planetId` 기준 방위위성 — 월드오브젝트 리스트 단일 경로 */
export function listPlanetDefenseSatellites(planetId: string): WorldObject[] {
  const ctx = resolvePlanetWorldObjectContext(planetId);
  if (!ctx) return [];
  return listPlanetWorldObjectsByKind(ctx.planetId, ctx.systemId, 'defense_satellite');
}
