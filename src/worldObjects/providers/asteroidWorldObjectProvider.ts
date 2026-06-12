import {
  resolvePlanetAsteroidAssignedMineralIds,
  resolvePlanetAsteroidOrbitCount,
} from '../../world/mineralDepositModel';
import { useWorldObjectRuntimeStore } from '../../store/worldObjectRuntimeStore';
import { withWorldObjectInstanceRuntimeAll } from '../applyInstanceRuntime';
import { makeWorldObjectId } from '../ids';
import type { WorldObject } from '../types';
import type { PlanetWorldObjectProvider } from './types';

export const asteroidWorldObjectProvider: PlanetWorldObjectProvider = {
  id: 'asteroid_orbit_v1',
  kinds: ['asteroid'],
  list(ctx) {
    const fallbackOrbitCount = resolvePlanetAsteroidOrbitCount(ctx.planetId);
    const runtime = useWorldObjectRuntimeStore.getState();
    const orbitCount = runtime.getAsteroidOrbitCount(ctx.planetId, fallbackOrbitCount);
    const fallbackAssigned = resolvePlanetAsteroidAssignedMineralIds(ctx.planetId, orbitCount);
    const assignedMineralIds = runtime.getAsteroidAssignedMineralItemIds(
      ctx.planetId,
      orbitCount,
      fallbackAssigned,
    );

    const objects: WorldObject[] = Array.from({ length: orbitCount }, (_, i) => {
      const n = i + 1;
      const mineralItemId = assignedMineralIds[i] ?? 'ore_ferrite';
      return {
        id: makeWorldObjectId(ctx.planetId, 'asteroid', String(n)),
        kind: 'asteroid',
        planetId: ctx.planetId,
        systemId: ctx.systemId,
        mineralItemId,
        title: `소행성 ${n}`,
        description: `채광 가능 · 표시 광물(참고): ${mineralItemId}`,
        transform: {
          orbitSlotIndex: i,
          radiusScale: 0.58 + i * 0.035,
          phaseBias: (i * 0.13) % 1,
        },
        interactions: [
          { kind: 'mining', enabled: true },
          { kind: 'scan', enabled: true },
        ],
        state: {
          depleted: false,
          cooldownUntilMs: null,
        },
        tags: ['world_object', 'asteroid'],
      };
    });

    return withWorldObjectInstanceRuntimeAll(objects);
  },
};
