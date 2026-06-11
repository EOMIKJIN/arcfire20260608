// ============================================================
// 생존포드 전함 id — 순환 참조 방지용 경량 모듈
// ============================================================

import type { PlayerHangarShip, PlayerShip } from '../types';
import {
  addToInventorySlotsMax,
  countGoodInInventory,
  type PlayerInventorySlot,
} from './playerInventory';

/** 생존포드 — `npc_ai_ships.csv` Player_freighter */
export const SURVIVAL_POD_NPC_SHIP_ID = 'Player_freighter';

export const SURVIVAL_POD_CAPITAL_SHIP_ITEM_ID = `capital_ship_${SURVIVAL_POD_NPC_SHIP_ID}`;

export function isSurvivalPodNpcShipId(id: string | null | undefined): boolean {
  return String(id ?? '').trim() === SURVIVAL_POD_NPC_SHIP_ID;
}

export function isSurvivalPodCapitalShipItemId(itemId: string | null | undefined): boolean {
  return String(itemId ?? '').trim() === SURVIVAL_POD_CAPITAL_SHIP_ITEM_ID;
}

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
