import { withWorldObjectInstanceRuntime } from '../applyInstanceRuntime';
import { makeWorldObjectId } from '../ids';
import type { WorldObject } from '../types';
import type { PlanetWorldObjectProvider } from './types';

export const wreckWorldObjectProvider: PlanetWorldObjectProvider = {
  id: 'wreck_stub_v1',
  kinds: ['wreck'],
  list(ctx) {
    const wreck: WorldObject = {
      id: makeWorldObjectId(ctx.planetId, 'wreck', '1'),
      kind: 'wreck',
      planetId: ctx.planetId,
      systemId: ctx.systemId,
      title: '잔해',
      description: '궤도 표류 잔해 — 수색 시 회수품 획득 가능(기초)',
      transform: {
        orbitSlotIndex: 960,
        radiusScale: 0.78,
        phaseBias: 0.41,
      },
      interactions: [
        { kind: 'salvage', enabled: true },
        { kind: 'scan', enabled: true },
      ],
      state: {
        depleted: false,
        cooldownUntilMs: null,
      },
      tags: ['world_object', 'wreck', 'salvage_stub'],
    };
    return [withWorldObjectInstanceRuntime(wreck)];
  },
};
