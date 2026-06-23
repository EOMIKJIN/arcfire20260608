/**
 * 은하 이동 도착 시 reach_system 목표 완료 — worldmap·이동중 전투 도착 공용
 */

import type { Player } from '../types';
import { useMissionStore } from '../store/missionStore';
import { usePlayerStore } from '../store/playerStore';
import { listActiveMissionBundles } from './missionActiveBundles';
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
  },
): void {
  const completeObjective = useMissionStore.getState().completeObjective;
  const activeBundles = listActiveMissionBundles(useMissionStore.getState().progresses);

  for (const active of activeBundles) {
    const buyObjectives = active.mission.objectives.filter((obj) => obj.type === 'buy_goods');
    const pendingBuyObjectives = buyObjectives.filter((obj) => !active.progress.objectives[obj.id]);

    active.mission.objectives.forEach((obj) => {
      if (
        obj.type === 'reach_system'
        && obj.targetId === targetSystemId
        && !active.progress.objectives[obj.id]
      ) {
        if (pendingBuyObjectives.length > 0) return;

        if (buyObjectives.length > 0) {
          let nextSlots = normalizeInventorySlots(player.inventorySlots);
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

          usePlayerStore.getState().setPlayer({ ...player, inventorySlots: nextSlots });
        }

        completeObjective(active.mission.id, obj.id);
      }
    });
  }
}
