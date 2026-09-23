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
      // i18n 키 — 로케일 전환 시 렌더 시점에 t()로 해석(원문 문자열 직접 저장 금지)
      title: 'hubBg.wreck',
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
