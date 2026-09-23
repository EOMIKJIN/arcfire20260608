/**
 * QuestHUD 현재 목표 한 줄 — persist 플래그만 보면 배달 화물이 없어도
 * 다음 이동 목표만 보여 §3-B처럼 「이미 다 했다」로 오해한다.
 * 착륙 배달은 실화물을 다시 보므로, 이동 목표가 아직 남았고 화물이 부족하면
 * 구매 목표를 다시 보여 준다. 틱/persist 없음. 인벤 정규화 import 없음.
 */

import type { Mission, MissionObjective, MissionProgress } from '../types';

export type HudInventoryCell = { goodId: string; quantity: number } | null | undefined;

export type HudCurrentObjective = {
  objective: MissionObjective | undefined;
  cargoShort: boolean;
};

function countGoodId(slots: readonly HudInventoryCell[] | undefined | null, goodId: string): number {
  if (!slots || !goodId) return 0;
  let n = 0;
  for (let i = 0; i < slots.length; i += 1) {
    const cell = slots[i];
    if (cell && cell.goodId === goodId) n += cell.quantity;
  }
  return n;
}

function hasOpenDeliveryReach(mission: Mission, progress: MissionProgress): boolean {
  const objs = mission.objectives;
  for (let i = 0; i < objs.length; i += 1) {
    const obj = objs[i]!;
    if (
      (obj.type === 'reach_system' || obj.type === 'reach_planet' || obj.type === 'deliver_cargo')
      && !progress.objectives[obj.id]
    ) {
      return true;
    }
  }
  return false;
}

export function resolveHudCurrentObjective(
  mission: Mission,
  progress: MissionProgress,
  slots: readonly HudInventoryCell[] | undefined | null,
): HudCurrentObjective {
  if (hasOpenDeliveryReach(mission, progress)) {
    const objs = mission.objectives;
    for (let i = 0; i < objs.length; i += 1) {
      const obj = objs[i]!;
      if (obj.type !== 'buy_goods') continue;
      if (!progress.objectives[obj.id]) continue;
      const required = obj.quantity ?? 1;
      if (countGoodId(slots, obj.targetId) < required) {
        return { objective: obj, cargoShort: true };
      }
    }
  }

  const incomplete = mission.objectives.find((obj) => !progress.objectives[obj.id]);
  return { objective: incomplete, cargoShort: false };
}
