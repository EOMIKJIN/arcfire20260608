// ============================================================
// 생존포드 전함 — hangar/inventory 연동 (id 상수는 survivalPodIds)
// ============================================================

import type { PlayerHangarShip, PlayerShip } from '../types';
import {
  addToInventorySlotsMax,
  countGoodInInventory,
  type PlayerInventorySlot,
} from './playerInventory';
import {
  SURVIVAL_POD_NPC_SHIP_ID,
  STARTER_NPC_CAPITAL_SHIP_ID,
  SURVIVAL_POD_CAPITAL_SHIP_ITEM_ID,
  isSurvivalPodNpcShipId,
} from './survivalPodIds';

export {
  SURVIVAL_POD_NPC_SHIP_ID,
  STARTER_NPC_CAPITAL_SHIP_ID,
  SURVIVAL_POD_CAPITAL_SHIP_ITEM_ID,
  isSurvivalPodNpcShipId,
  isSurvivalPodCapitalShipItemId,
  resolveStarterNpcCapitalShipId,
  isStarterNpcCapitalShipId,
} from './survivalPodIds';

/** 생존포드는 무장 불가 — 전함 격침 후 탈출용 */
export function clearSurvivalPodWeaponLoadout(ship: PlayerShip): PlayerShip {
  if (!isSurvivalPodNpcShipId(ship.portraitNpcCapitalShipId)) return ship;
  return {
    ...ship,
    equipSlots: {},
    weapons: [],
    weaponItems: [],
  };
}

/** 격납고에 생존포드 1척 보장(판매·격침 제거 불가) */
export function ensureSurvivalPodInHangar(hangar: PlayerHangarShip[]): PlayerHangarShip[] {
  if (hangar.some((h) => isSurvivalPodNpcShipId(h.npcCapitalShipId))) {
    return hangar;
  }
  return [
    ...hangar,
    {
      id: `hg_survival_${Date.now().toString(36)}`,
      npcCapitalShipId: SURVIVAL_POD_NPC_SHIP_ID,
      acquiredAt: Date.now(),
    },
  ];
}

/** 인벤에 생존포드 전함 아이템만 지급(무기 번들 없음) */
export function grantSurvivalPodShipToInventory(slots: PlayerInventorySlot[]): PlayerInventorySlot[] {
  if (countGoodInInventory(slots, SURVIVAL_POD_CAPITAL_SHIP_ITEM_ID) >= 1) {
    return slots;
  }
  return addToInventorySlotsMax(slots, SURVIVAL_POD_CAPITAL_SHIP_ITEM_ID, 1, 0).slots;
}

/** 생존포드 제외 — 전투/탑승 가능 전함 수 */
export function countCombatCapitalShipsInHangar(hangar: PlayerHangarShip[]): number {
  let n = 0;
  for (const h of hangar) {
    if (!isSurvivalPodNpcShipId(h.npcCapitalShipId)) n += 1;
  }
  return n;
}

/**
 * 격납고에 전투 전함이 0척이면 최초 지급 기본전함 1척을 추가한다.
 */
export function ensureStarterCapitalShipInHangar(hangar: PlayerHangarShip[]): {
  hangar: PlayerHangarShip[];
  addedStarter: boolean;
} {
  if (countCombatCapitalShipsInHangar(hangar) > 0) {
    return { hangar, addedStarter: false };
  }
  if (hangar.some((h) => h.npcCapitalShipId === STARTER_NPC_CAPITAL_SHIP_ID)) {
    return { hangar, addedStarter: false };
  }
  return {
    hangar: [
      ...hangar,
      {
        id: `hg_starter_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
        npcCapitalShipId: STARTER_NPC_CAPITAL_SHIP_ID,
        acquiredAt: Date.now(),
      },
    ],
    addedStarter: true,
  };
}
