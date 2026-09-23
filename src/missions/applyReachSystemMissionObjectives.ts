/**
 * reach_system 목표 완료 — 행성 허브 착륙만.
 * 배송(buy_goods+reach)은 화물이 있을 때만 소모·완료. 부족하면 미완료 유지(팝업 없음).
 * `__neighbor_system__` / 인스턴스 인접 배달은 출발 성계가 아닌 아무 성계 착륙이면 완료.
 */

import type { Player } from '../types';
import { useMissionStore } from '../store/missionStore';
import { usePlayerStore } from '../store/playerStore';
import { listActiveMissionBundles } from './missionActiveBundles';
import {
  shouldApplyReachSystemObjective,
  type ReachSystemApplyGate,
} from './missionCategory';
import { doesReachSystemObjectiveMatch } from './missionNeighborReach';
import { resolveMissionOfferOriginSystemId } from './missionNeighborReachLookups';
import { showArcAlert } from '../utils/showArcAlert';
import {
  countGoodInInventory,
  normalizeInventorySlots,
  removeGoodFromInventorySlots,
} from '../game/playerInventory';

export function applyReachSystemMissionObjectives(
  targetSystemId: string,
  player: Player,
  opts?: {
    onDeliverFail?: () => void;
    deliverFailTitle?: string;
    deliverFailBody?: string;
    gate?: ReachSystemApplyGate;
  },
): void {
  const gate: ReachSystemApplyGate = opts?.gate ?? 'system_arrival';
  const completeObjective = useMissionStore.getState().completeObjective;
  const activeBundles = listActiveMissionBundles(useMissionStore.getState().progresses);
  let playerSnap = usePlayerStore.getState().player ?? player;

  for (const active of activeBundles) {
    if (!shouldApplyReachSystemObjective(active.mission, gate)) continue;
    const buyObjectives = active.mission.objectives.filter((obj) => obj.type === 'buy_goods');
    const pendingBuyObjectives = buyObjectives.filter((obj) => !active.progress.objectives[obj.id]);
    const originSystemId = resolveMissionOfferOriginSystemId(active.mission);

    active.mission.objectives.forEach((obj) => {
      if (
        obj.type === 'reach_system'
        && doesReachSystemObjectiveMatch(active.mission, obj, targetSystemId, originSystemId)
        && !active.progress.objectives[obj.id]
      ) {
        if (pendingBuyObjectives.length > 0) return;

        if (buyObjectives.length > 0) {
          playerSnap = usePlayerStore.getState().player ?? playerSnap;
          let nextSlots = normalizeInventorySlots(playerSnap.inventorySlots);
          let canDeliver = true;

          buyObjectives.forEach((buyObj) => {
            const required = buyObj.quantity ?? 1;
            const currentQty = countGoodInInventory(nextSlots, buyObj.targetId);
            if (currentQty < required) {
              canDeliver = false;
              return;
            }
            const removed = removeGoodFromInventorySlots(nextSlots, buyObj.targetId, required);
            if (!removed) {
              canDeliver = false;
              return;
            }
            nextSlots = removed;
          });

          if (!canDeliver) {
            if (opts?.deliverFailTitle && opts?.deliverFailBody) {
              showArcAlert(opts.deliverFailTitle, opts.deliverFailBody);
            }
            opts?.onDeliverFail?.();
            return;
          }

          usePlayerStore.getState().setPlayer({ ...playerSnap, inventorySlots: nextSlots });
          playerSnap = usePlayerStore.getState().player ?? playerSnap;
        }

        completeObjective(active.mission.id, obj.id);
      }
    });
  }
}
