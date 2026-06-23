// ============================================================
// 전함 격침 → 생존포드 · 거점 귀환
// ============================================================

import { STAR_SYSTEMS, STARTING_PLANET_ID, STARTING_SYSTEM_ID } from '../data/systems';
import type { Player, PlayerHangarShip, PlayerShip } from '../types';
import { applyNpcCapitalShipToPlayerShip } from './applyNpcCapitalShipPurchase';
import {
  ensureStarterCapitalShipInHangar,
  ensureSurvivalPodInHangar,
  grantSurvivalPodShipToInventory,
  isSurvivalPodNpcShipId,
  resolveStarterNpcCapitalShipId,
  SURVIVAL_POD_NPC_SHIP_ID,
} from './survivalPodShip';
import { grantNpcCapitalShipBundleToInventory } from './grantNpcCapitalShipBundle';

export {
  ensureSurvivalPodInHangar,
  grantSurvivalPodShipToInventory,
  isSurvivalPodCapitalShipItemId,
  isSurvivalPodNpcShipId,
  SURVIVAL_POD_CAPITAL_SHIP_ITEM_ID,
  SURVIVAL_POD_NPC_SHIP_ID,
  ensureStarterCapitalShipInHangar,
  isStarterNpcCapitalShipId,
  resolveStarterNpcCapitalShipId,
  STARTER_NPC_CAPITAL_SHIP_ID,
} from './survivalPodShip';
import { getItemDef } from '../data/itemRegistry';
import {
  addToInventorySlotsMax,
  countGoodInInventory,
  normalizeInventorySlots,
  removeGoodFromInventorySlots,
} from './playerInventory';
import { resolvePlayerShipDurabilityPct } from './durability';

/** 생존포드 상태 또는 선체 내구 0% — 은하 이동·전투 불가 */
export function isPlayerShipCombatCapable(ship: PlayerShip | null | undefined): boolean {
  if (!ship) return false;
  const id = ship.portraitNpcCapitalShipId?.trim();
  if (id && isSurvivalPodNpcShipId(id)) return false;
  return resolvePlayerShipDurabilityPct(ship) > 0;
}

export type PlayerTravelBlockReason = 'pod' | 'durability' | 'missing_ship';

/** 은하 이동 차단 사유 — null이면 이동 가능 */
export function resolvePlayerTravelBlock(
  player: Pick<Player, 'ship'> | null | undefined,
): PlayerTravelBlockReason | null {
  if (!player?.ship) return 'missing_ship';
  const id = player.ship.portraitNpcCapitalShipId?.trim();
  if (id && isSurvivalPodNpcShipId(id)) return 'pod';
  if (resolvePlayerShipDurabilityPct(player.ship) <= 0) return 'durability';
  return null;
}

/** 거점 행성 — 추후 `homePlanetId` 지정 기능 연동 */
export function resolvePlayerHomePlanetId(player: Pick<Player, 'homePlanetId'>): string {
  const home = player.homePlanetId?.trim();
  if (home) return home;
  return STARTING_PLANET_ID;
}

export function resolvePlayerHomeSystemId(planetId: string): string {
  for (const system of Object.values(STAR_SYSTEMS)) {
    if (system.planets.some((p) => p.id === planetId)) return system.id;
  }
  return STARTING_SYSTEM_ID;
}

function reconcileCapitalShipInventoryFromHangar(
  slots: ReturnType<typeof normalizeInventorySlots>,
  hangar: PlayerHangarShip[],
) {
  let next = slots;
  const hangarCountByNpcId = new Map<string, number>();
  hangar.forEach((h) => {
    hangarCountByNpcId.set(h.npcCapitalShipId, (hangarCountByNpcId.get(h.npcCapitalShipId) ?? 0) + 1);
  });
  hangarCountByNpcId.forEach((hangarCount, npcCapitalShipId) => {
    const itemId = `capital_ship_${npcCapitalShipId}`;
    const def = getItemDef(itemId);
    if (!def || def.type !== 'capital_ship') return;
    const invCount = countGoodInInventory(next, itemId);
    const delta = hangarCount - invCount;
    if (delta > 0) {
      next = addToInventorySlotsMax(next, itemId, delta, 0).slots;
      return;
    }
    if (delta < 0) {
      const trimmed = removeGoodFromInventorySlots(next, itemId, Math.abs(delta));
      if (trimmed) next = trimmed;
    }
  });
  const allowedCapitalItemIds = new Set(
    Array.from(hangarCountByNpcId.keys()).map((npcId) => `capital_ship_${npcId}`),
  );
  const capitalItemIdsInInventory = new Set<string>();
  next.forEach((cell) => {
    if (!cell?.goodId?.startsWith('capital_ship_')) return;
    capitalItemIdsInInventory.add(cell.goodId);
  });
  capitalItemIdsInInventory.forEach((itemId) => {
    if (allowedCapitalItemIds.has(itemId)) return;
    const qty = countGoodInInventory(next, itemId);
    if (qty <= 0) return;
    const trimmed = removeGoodFromInventorySlots(next, itemId, qty);
    if (trimmed) next = trimmed;
  });
  return next;
}

function buildSurvivalPodShip(currentShip: PlayerShip): PlayerShip {
  const applied = applyNpcCapitalShipToPlayerShip(currentShip, SURVIVAL_POD_NPC_SHIP_ID);
  if (!applied.ok) {
    return {
      ...currentShip,
      portraitNpcCapitalShipId: SURVIVAL_POD_NPC_SHIP_ID,
      name: '생존포드',
      equipSlots: {},
      weapons: [],
      weaponItems: [],
    };
  }
  return {
    ...applied.ship,
    equipSlots: {},
    weapons: [],
    weaponItems: [],
  };
}

function finalizeInventoryAfterDestruction(
  hangar: PlayerHangarShip[],
  slots: ReturnType<typeof normalizeInventorySlots>,
  addedStarter: boolean,
): ReturnType<typeof normalizeInventorySlots> {
  let next = reconcileCapitalShipInventoryFromHangar(slots, hangar);
  if (addedStarter) {
    next = grantNpcCapitalShipBundleToInventory(next, resolveStarterNpcCapitalShipId(), {
      shipBuyPrice: 0,
    });
  }
  return grantSurvivalPodShipToInventory(next);
}

/**
 * 탑승 전함 격침 처리:
 * - 격납고·인벤에서 해당 전함 1척 제거
 * - 전투 전함 0척이면 기본전함 1척 격납고 지급
 * - 생존포드 탑승
 * - 거점(현재 arcadia_prime) 착륙
 */
export function applyCapitalShipDestructionToPlayer(player: Player): Player {
  const destroyedId = player.ship.portraitNpcCapitalShipId?.trim();
  const homePlanetId = resolvePlayerHomePlanetId(player);
  const homeSystemId = resolvePlayerHomeSystemId(homePlanetId);

  if (!destroyedId || isSurvivalPodNpcShipId(destroyedId)) {
    const starterResult = ensureStarterCapitalShipInHangar(player.shipHangar);
    const hangar = ensureSurvivalPodInHangar(starterResult.hangar);
    return {
      ...player,
      currentPlanetId: homePlanetId,
      currentSystemId: homeSystemId,
      shipHangar: hangar,
      inventorySlots: finalizeInventoryAfterDestruction(
        hangar,
        normalizeInventorySlots(player.inventorySlots),
        starterResult.addedStarter,
      ),
      ship: buildSurvivalPodShip(player.ship),
    };
  }

  const hangarAfterRemoval = [...player.shipHangar];
  const idx = hangarAfterRemoval.findIndex((h) => h.npcCapitalShipId === destroyedId);
  if (idx >= 0) hangarAfterRemoval.splice(idx, 1);

  const starterResult = ensureStarterCapitalShipInHangar(hangarAfterRemoval);
  const hangar = ensureSurvivalPodInHangar(starterResult.hangar);
  const inventorySlots = finalizeInventoryAfterDestruction(
    hangar,
    normalizeInventorySlots(player.inventorySlots),
    starterResult.addedStarter,
  );

  return {
    ...player,
    currentPlanetId: homePlanetId,
    currentSystemId: homeSystemId,
    shipHangar: hangar,
    inventorySlots,
    ship: buildSurvivalPodShip(player.ship),
  };
}
