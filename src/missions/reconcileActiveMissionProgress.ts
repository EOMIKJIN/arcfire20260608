/**
 * 수락·구매 직후 — 보유 화물·현재 착륙지로 남은 목표를 한 번 맞춤.
 * 틱 없음. persist는 completeObjective 경로만.
 * 클리어 대사는 presentPendingMissionClearDialog — HubSync/Api 경유 금지.
 */

import { usePlayerStore } from '../store/playerStore';
import { applyBuyGoodsMissionObjectives } from './applyBuyGoodsMissionObjectives';
import { applyLandedMissionObjectives } from './applyLandedMissionObjectives';

export function reconcileActiveMissionProgressAfterEvent(): void {
  applyBuyGoodsMissionObjectives();
  const planetId = usePlayerStore.getState().player?.currentPlanetId?.trim();
  if (planetId) {
    applyLandedMissionObjectives(planetId);
  }
}
