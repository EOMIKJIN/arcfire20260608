import { useWorldObjectRuntimeStore } from '../store/worldObjectRuntimeStore';
import type { WorldObject } from './types';

/** 빌드 직후 — `objectId`별 영속 런타임 상태 병합(방위위성 hp·depleted 등 추후) */
export function withWorldObjectInstanceRuntime(object: WorldObject): WorldObject {
  const patch = useWorldObjectRuntimeStore.getState().getInstanceState(object.id);
  if (!patch) return object;
  return {
    ...object,
    defenseLevel: patch.defenseLevel ?? object.defenseLevel,
    state: {
      depleted: patch.depleted ?? object.state.depleted,
      hp: patch.hp ?? object.state.hp,
      ownerFactionId: patch.ownerFactionId ?? object.state.ownerFactionId,
      cooldownUntilMs: patch.cooldownUntilMs ?? object.state.cooldownUntilMs,
    },
  };
}

export function withWorldObjectInstanceRuntimeAll(objects: WorldObject[]): WorldObject[] {
  return objects.map(withWorldObjectInstanceRuntime);
}
