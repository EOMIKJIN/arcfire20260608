/**
 * 인벤 보유 수량으로 buy_goods 완료 — 구매 직후·수락 직후·착륙 공용.
 */

import { countGoodInInventory, normalizeInventorySlots } from '../game/playerInventory';
import { useMissionStore } from '../store/missionStore';
import { usePlayerStore } from '../store/playerStore';
import { listActiveMissionBundles } from './missionActiveBundles';

export function applyBuyGoodsMissionObjectives(): void {
  const player = usePlayerStore.getState().player;
  if (!player) return;
  const slots = normalizeInventorySlots(player.inventorySlots);
  const completeObjective = useMissionStore.getState().completeObjective;
  const bundles = listActiveMissionBundles(useMissionStore.getState().progresses);

  for (const active of bundles) {
    const objs = active.mission.objectives;
    for (let i = 0; i < objs.length; i += 1) {
      const obj = objs[i]!;
      if (obj.type !== 'buy_goods') continue;
      if (active.progress.objectives[obj.id]) continue;
      const required = obj.quantity ?? 1;
      if (countGoodInInventory(slots, obj.targetId) >= required) {
        completeObjective(active.mission.id, obj.id);
      }
    }
  }
}
