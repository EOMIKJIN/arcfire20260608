import { listPlanetWorldObjectsFromProviders } from './providers/registry';
import { planetHubDefenseSatelliteMemoRev, planetHubFacilityDevMemoRev } from '../game/planetHub/planetHubStoreMemoRevisions';
import { usePlanetCoreRuntimeStore } from '../store/planetCoreRuntimeStore';
import { useWorldObjectRuntimeStore } from '../store/worldObjectRuntimeStore';
import {
  invalidatePlanetWorldObjectsListCache,
  readPlanetWorldObjectsListCache,
  writePlanetWorldObjectsListCache,
} from './planetWorldObjectsListCacheRegistry';
import type { WorldObject } from './types';

export { invalidatePlanetWorldObjectsListCache } from './planetWorldObjectsListCacheRegistry';

export function resolvePlanetWorldObjectsListRevision(planetId: string): string {
  const coreDetail = usePlanetCoreRuntimeStore.getState().getPlanetCoreRuntime(planetId)?.detail;
  const wo = useWorldObjectRuntimeStore.getState();
  const orbitCount = wo.asteroidOrbitCountByPlanetId[planetId] ?? 0;
  const mineralIds = wo.asteroidMineralItemIdsByPlanetId[planetId];
  const mineralSig = mineralIds?.length ? mineralIds.join(',') : '';
  let instanceSig = 0;
  const prefix = `${planetId}:`;
  for (const [objectId, state] of Object.entries(wo.instanceStateByObjectId)) {
    if (!objectId.startsWith(prefix)) continue;
    instanceSig += 1;
    if (state.depleted) instanceSig += 17;
    if (typeof state.hp === 'number') instanceSig += Math.floor(state.hp);
    if (typeof state.defenseLevel === 'number') instanceSig += state.defenseLevel * 3;
  }
  return [
    planetHubDefenseSatelliteMemoRev(coreDetail),
    planetHubFacilityDevMemoRev(coreDetail),
    `a${orbitCount}:${mineralSig}`,
    `i${instanceSig}`,
  ].join(';');
}

export function listPlanetWorldObjectsCached(
  planetId: string,
  systemId: string,
): WorldObject[] {
  const revision = resolvePlanetWorldObjectsListRevision(planetId);
  const hit = readPlanetWorldObjectsListCache(planetId, systemId, revision);
  if (hit) return hit;
  const list = listPlanetWorldObjectsFromProviders({ planetId, systemId });
  return writePlanetWorldObjectsListCache(planetId, systemId, revision, list);
}
