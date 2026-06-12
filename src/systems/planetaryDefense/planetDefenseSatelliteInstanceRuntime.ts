import { useWorldObjectRuntimeStore } from '../../store/worldObjectRuntimeStore';
import { makeWorldObjectId } from '../../worldObjects/ids';
import type { WorldObjectRuntimeState } from '../../worldObjects/types';

/** 행성·인스턴스 키로 방위위성 1기 런타임 패치 — `instanceStateByObjectId` 영속 */
export function patchPlanetDefenseSatelliteInstanceState(
  planetId: string,
  instanceKey: string,
  patch: Partial<WorldObjectRuntimeState>,
): void {
  useWorldObjectRuntimeStore.getState().patchInstanceState(
    makeWorldObjectId(planetId, 'defense_satellite', instanceKey),
    patch,
    'manual',
  );
}

export function getPlanetDefenseSatelliteInstanceState(
  planetId: string,
  instanceKey: string,
): WorldObjectRuntimeState | undefined {
  return useWorldObjectRuntimeStore.getState().getInstanceState(
    makeWorldObjectId(planetId, 'defense_satellite', instanceKey),
  );
}
