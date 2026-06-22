// ============================================================
// NPC 전함 장비 슬롯 — npc_capital_ship_equip_slots.csv (Table-First)
// ============================================================

import {
  NPC_CAPITAL_SHIP_EQUIP_SLOTS_FROM_CSV,
  type NpcCapitalShipEquipSlotRow,
} from '../data/generated';
import type { PlayerShip, ShipyardEquipSlotId } from '../types';
import { resolveEquipSlotDisplayName } from './equipSlotDisplayName';
import { getItemDef } from '../data/goods';
import { isShipEquipmentItemId } from './shipEquipment';

/** NPC 전함당 장비 슬롯 상한 (무기 슬롯 제외) */
export const NPC_CAPITAL_SHIP_MAX_EQUIP_SLOT_COUNT = 4;

export type NpcCapitalShipEquipSlotDef = {
  slotOrder: number;
  slotId: ShipyardEquipSlotId;
  itemDefId: string | null;
};

let cachedSlotRowsByNpcId: Map<string, NpcCapitalShipEquipSlotDef[]> | null = null;
let cachedEquippedByNpcId: Map<string, Partial<Record<ShipyardEquipSlotId, { itemDefId: string; name: string }>>> | null = null;

function compareSlotOrder(a: NpcCapitalShipEquipSlotDef, b: NpcCapitalShipEquipSlotDef): number {
  return a.slotOrder - b.slotOrder;
}

function buildCaches(): void {
  if (cachedSlotRowsByNpcId && cachedEquippedByNpcId) return;

  const slotRows = new Map<string, NpcCapitalShipEquipSlotDef[]>();
  const equipped = new Map<string, Partial<Record<ShipyardEquipSlotId, { itemDefId: string; name: string }>>>();

  for (const row of NPC_CAPITAL_SHIP_EQUIP_SLOTS_FROM_CSV) {
    const npcShipId = row.npcShipId.trim();
    const slotId = row.slotId.trim() as ShipyardEquipSlotId;
    if (!npcShipId || !slotId) continue;

    const slotOrder = Math.max(1, Math.min(NPC_CAPITAL_SHIP_MAX_EQUIP_SLOT_COUNT, row.slotOrder ?? 99));
    const itemDefId = String(row.itemDefId ?? '').trim();

    const bucket = slotRows.get(npcShipId) ?? [];
    if (bucket.length >= NPC_CAPITAL_SHIP_MAX_EQUIP_SLOT_COUNT) continue;
    if (bucket.some((s) => s.slotId === slotId)) continue;

    bucket.push({
      slotOrder,
      slotId,
      itemDefId: itemDefId || null,
    });
    slotRows.set(npcShipId, bucket);

    if (itemDefId && getItemDef(itemDefId) && isShipEquipmentItemId(itemDefId)) {
      const eq = equipped.get(npcShipId) ?? {};
      eq[slotId] = {
        itemDefId,
        name: resolveEquipSlotDisplayName(itemDefId),
      };
      equipped.set(npcShipId, eq);
    }
  }

  for (const [npcShipId, rows] of slotRows) {
    rows.sort(compareSlotOrder);
    slotRows.set(npcShipId, rows.slice(0, NPC_CAPITAL_SHIP_MAX_EQUIP_SLOT_COUNT));
  }

  cachedSlotRowsByNpcId = slotRows;
  cachedEquippedByNpcId = equipped;
}

/** 테이블에 정의된 NPC 장비 슬롯(최대 4, itemDefId 없어도 포함) */
export function listNpcCapitalShipEquipSlotDefs(npcShipId: string): readonly NpcCapitalShipEquipSlotDef[] {
  buildCaches();
  const id = npcShipId.trim();
  if (!id) return [];
  return cachedSlotRowsByNpcId!.get(id) ?? [];
}

export function resolveNpcCapitalShipEquipSlotCapacity(npcShipId: string): number {
  return listNpcCapitalShipEquipSlotDefs(npcShipId).length;
}

/** 장착된 장비만 — 전투·스탯 집계용 */
export function resolveNpcCapitalShipEquipSlots(
  npcShipId: string,
): NonNullable<PlayerShip['equipSlots']> {
  buildCaches();
  const id = npcShipId.trim();
  if (!id) return {};
  return { ...(cachedEquippedByNpcId!.get(id) ?? {}) };
}

export function listNpcCapitalShipEquipmentItemIds(npcShipId: string): string[] {
  const slots = resolveNpcCapitalShipEquipSlots(npcShipId);
  return Object.values(slots)
    .map((s) => s?.itemDefId?.trim())
    .filter((v): v is string => Boolean(v));
}

export function getNpcCapitalShipEquipSlotRowById(rowId: string): NpcCapitalShipEquipSlotRow | undefined {
  const id = rowId.trim();
  if (!id) return undefined;
  return NPC_CAPITAL_SHIP_EQUIP_SLOTS_FROM_CSV.find((r) => r.id === id);
}
