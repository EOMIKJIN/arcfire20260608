/**
 * 생존포드·기본전함 id — import 의존 없음 (durability ↔ playerInventory 순환 차단)
 */

/** 생존포드 — `npc_ai_ships.csv` Player_freighter */
export const SURVIVAL_POD_NPC_SHIP_ID = 'Player_freighter';

/** 신규 파일럿 기본 지급 전함 */
export const STARTER_NPC_CAPITAL_SHIP_ID = 'Player_npc_red_fleet_1';

export const SURVIVAL_POD_CAPITAL_SHIP_ITEM_ID = `capital_ship_${SURVIVAL_POD_NPC_SHIP_ID}`;

export function isSurvivalPodNpcShipId(id: string | null | undefined): boolean {
  return String(id ?? '').trim() === SURVIVAL_POD_NPC_SHIP_ID;
}

export function isSurvivalPodCapitalShipItemId(itemId: string | null | undefined): boolean {
  return String(itemId ?? '').trim() === SURVIVAL_POD_CAPITAL_SHIP_ITEM_ID;
}

export function resolveStarterNpcCapitalShipId(): string {
  return STARTER_NPC_CAPITAL_SHIP_ID;
}

export function isStarterNpcCapitalShipId(id: string | null | undefined): boolean {
  return String(id ?? '').trim() === STARTER_NPC_CAPITAL_SHIP_ID;
}
