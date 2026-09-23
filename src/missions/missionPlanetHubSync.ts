/**
 * 행성 허브(STAGE 1) 진입 시 미션·인게임 대화 동기화.
 * present 는 presentPendingMissionClearDialog · store.tryFireTrigger 만 — Api 경유 금지.
 */

import { useIngameDialogStore } from '../store/ingameDialogStore';
import { useMissionStore } from '../store/missionStore';
import { applyLandedMissionObjectives } from './applyLandedMissionObjectives';
import { tryPresentPendingMissionClearDialog } from './presentPendingMissionClearDialog';

export { applyLandedMissionObjectives } from './applyLandedMissionObjectives';
export { tryPresentPendingMissionClearDialog } from './presentPendingMissionClearDialog';

export function syncPlanetHubMissionAndDialog(planetId: string): void {
  useMissionStore.getState().sweepExpiredMissions({ notify: true });
  applyLandedMissionObjectives(planetId);
  tryPresentPendingMissionClearDialog();
  if (!useIngameDialogStore.getState().isActive()) {
    useIngameDialogStore.getState().tryFireTrigger({ triggerKey: 'planet_landed', targetId: planetId });
  }
}
