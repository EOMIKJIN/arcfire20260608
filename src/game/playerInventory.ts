// ============================================================
// 플레이어 인벤토리 — 계정(`player.uid`)과 함께 `arcfire_player_v1`에 저장
// 무역소 판매 탭·조선소 UI와 동일 스택(CargoItem) 모델
// ============================================================

import type { CargoItem } from '../types';

export const PLAYER_INVENTORY_SLOT_COUNT = 100;
export const PLAYER_INVENTORY_MAX_STACK = 99_999;

export type PlayerInventorySlot = CargoItem | null;

export function createEmptyInventorySlots(): PlayerInventorySlot[] {
  return Array.from({ length: PLAYER_INVENTORY_SLOT_COUNT }, () => null);
}

export function normalizeInventorySlots(raw: unknown): PlayerInventorySlot[] {
  if (!Array.isArray(raw)) return createEmptyInventorySlots();
  const out: PlayerInventorySlot[] = [];
  for (let i = 0; i < PLAYER_INVENTORY_SLOT_COUNT; i++) {
    const cell = raw[i];
    if (!cell || typeof cell !== 'object') {
      out.push(null);
      continue;
    }
    const o = cell as Record<string, unknown>;
    if (typeof o.goodId !== 'string' || typeof o.quantity !== 'number') {
      out.push(null);
      continue;
    }
    const qty = Math.max(0, Math.floor(o.quantity));
    if (qty <= 0) {
      out.push(null);
      continue;
    }
    out.push({
      goodId: o.goodId,
      quantity: Math.min(PLAYER_INVENTORY_MAX_STACK, qty),
      buyPrice: typeof o.buyPrice === 'number' && Number.isFinite(o.buyPrice) ? o.buyPrice : 0,
    });
  }
  return out;
}

/** 인벤에 해당 goodId를 더 넣을 수 있는지(빈 칸 또는 같은 good 스택 여유) */
export function inventoryHasRoomFor(slots: PlayerInventorySlot[], goodId: string): boolean {
  for (const c of slots) {
    if (c == null) return true;
    if (c.goodId === goodId && c.quantity < PLAYER_INVENTORY_MAX_STACK) return true;
  }
  return false;
}

export function maxAddableToInventory(slots: PlayerInventorySlot[], goodId: string, maxWanted: number): number {
  let cap = 0;
  for (const c of slots) {
    if (c == null) cap += PLAYER_INVENTORY_MAX_STACK;
    else if (c.goodId === goodId) cap += Math.max(0, PLAYER_INVENTORY_MAX_STACK - c.quantity);
  }
  return Math.min(Math.max(0, Math.floor(maxWanted)), cap);
}

/**
 * 인벤에 최대한 적재. `added` < `quantity`이면 남은 수량은 호출부에서 별도 처리.
 */
export function addToInventorySlotsMax(
  slots: PlayerInventorySlot[],
  goodId: string,
  quantity: number,
  buyPrice: number,
): { slots: PlayerInventorySlot[]; added: number } {
  const next = [...slots];
  let remaining = Math.max(0, Math.floor(quantity));
  let added = 0;
  for (let i = 0; i < next.length && remaining > 0; i++) {
    const c = next[i];
    if (c?.goodId === goodId && c.quantity < PLAYER_INVENTORY_MAX_STACK) {
      const room = PLAYER_INVENTORY_MAX_STACK - c.quantity;
      const take = Math.min(room, remaining);
      next[i] = { ...c, quantity: c.quantity + take };
      remaining -= take;
      added += take;
    }
  }
  for (let i = 0; i < next.length && remaining > 0; i++) {
    if (next[i] == null) {
      const take = Math.min(PLAYER_INVENTORY_MAX_STACK, remaining);
      next[i] = { goodId, quantity: take, buyPrice };
      remaining -= take;
      added += take;
    }
  }
  return { slots: next, added };
}

/** goodId 기준 수량만큼 인벤에서 차감(뒤 슬롯부터). 실패 시 null */
export function removeGoodFromInventorySlots(
  slots: PlayerInventorySlot[],
  goodId: string,
  quantity: number,
): PlayerInventorySlot[] | null {
  let rem = Math.max(0, Math.floor(quantity));
  const next = slots.map((c) => (c ? { ...c } : null));
  for (let i = next.length - 1; i >= 0 && rem > 0; i--) {
    const c = next[i];
    if (!c || c.goodId !== goodId) continue;
    const take = Math.min(c.quantity, rem);
    const left = c.quantity - take;
    if (left <= 0) next[i] = null;
    else next[i] = { ...c, quantity: left };
    rem -= take;
  }
  if (rem > 0) return null;
  return next;
}

export function countGoodInInventory(slots: PlayerInventorySlot[], goodId: string): number {
  let n = 0;
  for (const c of slots) {
    if (c && c.goodId === goodId) n += c.quantity;
  }
  return n;
}

/** 판매 UI용 — goodId별 합산 */
export function aggregateInventoryForTrade(slots: PlayerInventorySlot[]): CargoItem[] {
  const map = new Map<string, { quantity: number; minBuy: number }>();
  for (const c of slots) {
    if (!c || c.quantity <= 0) continue;
    const prev = map.get(c.goodId);
    if (!prev) map.set(c.goodId, { quantity: c.quantity, minBuy: c.buyPrice });
    else {
      prev.quantity += c.quantity;
      prev.minBuy = Math.min(prev.minBuy, c.buyPrice);
    }
  }
  return [...map.entries()].map(([goodId, v]) => ({
    goodId,
    quantity: v.quantity,
    buyPrice: v.minBuy,
  }));
}

