/**
 * 착륙 행성 기준 reach_planet + reach_system. 대사/overlay import 없음.
 * 화물 부족은 배달 미완료로만 둔다 — 허브 재진입마다 실패 팝업 금지.
 */

import { useMissionStore } from '../store/missionStore';
import { usePlayerStore } from '../store/playerStore';
import { resolveSystemIdForPlanetId } from '../world/resolvePlanetSystemId';
import { applyBuyGoodsMissionObjectives } from './applyBuyGoodsMissionObjectives';
import { applyReachSystemMissionObjectives } from './applyReachSystemMissionObjectives';
import { listActiveMissionBundles } from './missionActiveBundles';

export function applyLandedMissionObjectives(planetId: string): void {
  applyBuyGoodsMissionObjectives();
  const bundles = listActiveMissionBundles(useMissionStore.getState().progresses);
  for (const active of bundles) {
    const objs = active.mission.objectives;
    for (let i = 0; i < objs.length; i += 1) {
      const obj = objs[i]!;
      if (
        obj.type === 'reach_planet'
        && obj.targetId === planetId
        && !active.progress.objectives[obj.id]
      ) {
        useMissionStore.getState().completeObjective(active.mission.id, obj.id);
      }
    }
  }

  const systemId = resolveSystemIdForPlanetId(planetId);
  const player = usePlayerStore.getState().player;
  if (systemId && player) {
    applyReachSystemMissionObjectives(systemId, player, {
      gate: 'hub_landing',
    });
  }
}
