import { isStelliumColonizeMarkPhase } from '../../arcCore/colonize/stelliumColonizeTypes';
import { useStelliumColonizeStore } from '../../store/stelliumColonizeStore';
import {
  WORLD_OBJECT_STELLIUM_COLONIZE_RADIUS_SCALE,
} from '../planetWorldObjectOrbit';
import { withWorldObjectInstanceRuntime } from '../applyInstanceRuntime';
import { makeWorldObjectId } from '../ids';
import type { WorldObject } from '../types';
import type { PlanetWorldObjectProvider } from './types';

export const STELLIUM_COLONIZE_WORLD_OBJECT_TAG = 'stellium_colonize';

const BASE_PHASE_BIAS = 0.18;

export function isStelliumColonizeWorldObject(object: Pick<WorldObject, 'tags'>): boolean {
  const tags = object.tags;
  if (!tags) return false;
  for (let i = 0; i < tags.length; i += 1) {
    if (tags[i] === STELLIUM_COLONIZE_WORLD_OBJECT_TAG) return true;
  }
  return false;
}

export const stelliumColonizeWorldObjectProvider: PlanetWorldObjectProvider = {
  id: 'stellium_colonize_v1',
  kinds: ['station'],
  list(ctx) {
    const row = useStelliumColonizeStore.getState().byPlanetId[ctx.planetId];
    if (!row || !isStelliumColonizeMarkPhase(row.phase)) return [];
    const object: WorldObject = {
      id: makeWorldObjectId(ctx.planetId, 'station', 'stellium_colonize_1'),
      kind: 'station',
      planetId: ctx.planetId,
      systemId: ctx.systemId,
      title: 'hubBg.stelliumColonize',
      transform: {
        orbitSlotIndex: 961,
        radiusScale: WORLD_OBJECT_STELLIUM_COLONIZE_RADIUS_SCALE,
        phaseBias: BASE_PHASE_BIAS,
      },
      interactions: [{ kind: 'none', enabled: false }],
      state: {},
      tags: ['world_object', STELLIUM_COLONIZE_WORLD_OBJECT_TAG, 'visual_only'],
    };
    return [withWorldObjectInstanceRuntime(object)];
  },
};
