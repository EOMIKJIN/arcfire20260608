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

/**
 * 신규 파일럿 기본 지급 전함 — `capitalHullPurchaseFromBalance` frigate_default 와 동일.
 * (경량 모듈 — balance 레지스트리 import 회피)
 */
export const STARTER_NPC_CAPITAL_SHIP_ID = 'Player_npc_red_fleet_1';

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

export function resolveStarterNpcCapitalShipId(): string {
  return STARTER_NPC_CAPITAL_SHIP_ID;
}

export function isStarterNpcCapitalShipId(id: string | null | undefined): boolean {
  return String(id ?? '').trim() === STARTER_NPC_CAPITAL_SHIP_ID;
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
