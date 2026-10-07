/**
 * 수락·구매 직후 — buy_goods 를 맞춘 뒤, 지금 서 있는 행성의 도착 목표를 닫는다.
 * 배달(reach + buy)은 deliveryBuyHold 가 같은 성계에서 보류한다.
 * 틱 없음. persist는 completeObjective 경로만.
 */

import { usePlayerStore } from '../store/playerStore';
import { applyBuyGoodsMissionObjectives } from './applyBuyGoodsMissionObjectives';
import { applyLandedMissionObjectives } from './applyLandedMissionObjectives';

export function reconcileActiveMissionProgressAfterEvent(): void {
  applyBuyGoodsMissionObjectives();
  const planetId = usePlayerStore.getState().player?.currentPlanetId?.trim() ?? '';
  if (!planetId) return;
  applyLandedMissionObjectives(planetId);
}
