// ============================================================
// 조선소 전함 탭 — 장비·아이템 슬롯 정의 (순서 고정)
// ============================================================

import type { ShipyardEquipSlotId } from '../types';

export const SHIPYARD_EQUIP_SLOT_DEFS: readonly { order: number; id: ShipyardEquipSlotId }[] = [
  { order: 1, id: 'WEAPON_1' },
  { order: 2, id: 'WEAPON_2' },
  { order: 3, id: 'WEAPON_3' },
  { order: 4, id: 'WEAPON_4' },
  { order: 5, id: 'ARMOR' },
  { order: 6, id: 'SYSTEM' },
  { order: 7, id: 'ENGINE' },
  { order: 8, id: 'FIGHTER' },
  { order: 9, id: 'EX_01' },
  { order: 10, id: 'EX_02' },
  { order: 11, id: 'EX_03' },
  { order: 12, id: 'EX_04' },
] as const;
