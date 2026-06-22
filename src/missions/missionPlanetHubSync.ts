/**
 * 행성 허브(STAGE 1) 진입 시 미션·인게임 대화 동기화.
 * missionStore ↔ ingameDialogApi 순환 참조 방지 — present 는 이 모듈에서만.
 */

import {
  isIngameDialogActive,
  presentIngameDialogScene,
  tryFireIngameDialogTrigger,
} from '../game/ingameDialog/ingameDialogApi';
import { useMissionStore } from '../store/missionStore';
import { listActiveMissionBundles } from './missionActiveBundles';

function tryPresentPendingMissionClearDialog(): boolean {
  const pending = useMissionStore.getState().pendingMissionClearDialog;
  if (!pending) return false;
  if (isIngameDialogActive()) return false;
  const presented = presentIngameDialogScene(pending.sceneId, pending.options);
  if (!presented) return false;
  useMissionStore.setState({ pendingMissionClearDialog: null });
  return true;
}

export function syncPlanetHubMissionAndDialog(planetId: string): void {
  const bundles = listActiveMissionBundles(useMissionStore.getState().progresses);
  for (const active of bundles) {
    for (const obj of active.mission.objectives) {
      if (
        obj.type === 'reach_planet'
        && obj.targetId === planetId
        && !active.progress.objectives[obj.id]
      ) {
        useMissionStore.getState().completeObjective(active.mission.id, obj.id);
      }
    }
  }

  tryFireIngameDialogTrigger('planet_landed', planetId);
  tryPresentPendingMissionClearDialog();
}
