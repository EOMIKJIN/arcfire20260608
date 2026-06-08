// ============================================================
// 조선소 전함 탭 — 장비·아이템 슬롯 정의 (순서 고정)
// ============================================================

import type { ShipyardEquipSlotId } from '../types';

export const SHIPYARD_EQUIP_SLOT_DEFS: readonly { order: number; id: ShipyardEquipSlotId }[] = [
  { order: 1, id: 'WEAPON_1' },
  { order: 2, id: 'WEAPON_2' },
  { order: 3, id: 'ARMOR' },
  { order: 4, id: 'SYSTEM' },
  { order: 5, id: 'ENGINE' },
  { order: 6, id: 'FIGHTER' },
  { order: 7, id: 'EX_01' },
  { order: 8, id: 'EX_02' },
  { order: 9, id: 'EX_03' },
  { order: 10, id: 'EX_04' },
] as const;
