// ============================================================
// 웨이브 디펜스 테스트 아이템 — 상점 거래가 강제 (테스트 단계 한정)
// ------------------------------------------------------------
// 무역소 런타임 가격은 CSV purchasePrice/infoLineSuffix가 아니라
//  - 무기: resolveIntegratedWeaponTradePrice (min 800 클램프)
//  - 전함: resolveCapitalShipPerformanceBasePrice (hull tier × 성능)
// 로 계산되므로, 테스트 아이템은 가격 경로에서만 CSV 강제가를 쓴다.
// 정본(Table-First · 2026-10-10): weapon_list.csv · npc_ai_ships.csv 의
//   specialUse=wave_test · testTradePriceCredits. 코드에 id·가격을 두지 않는다.
// ============================================================

import { CAPITAL_WEAPON_LIST_FROM_CSV } from '../data/generated/csvWeapons';
import { NPC_CAPITAL_SHIPS_FROM_CSV } from '../data/generated/csvNpcCapitalShips';
import type { NpcCapitalShip } from '../types';

let waveTestShipById: Map<string, NpcCapitalShip> | null = null;

function waveTestShip(npcShipId: string): NpcCapitalShip | undefined {
  if (!waveTestShipById) {
    const m = new Map<string, NpcCapitalShip>();
    for (let i = 0; i < NPC_CAPITAL_SHIPS_FROM_CSV.length; i += 1) {
      const s = NPC_CAPITAL_SHIPS_FROM_CSV[i]!;
      if (s.specialUse === 'wave_test') m.set(s.id, s);
    }
    waveTestShipById = m;
  }
  return waveTestShipById.get(npcShipId);
}

export function isWaveTestTradeWeaponId(weaponId: string | null | undefined): boolean {
  return CAPITAL_WEAPON_LIST_FROM_CSV[String(weaponId ?? '').trim()]?.specialUse === 'wave_test';
}

export function isWaveTestTradeShipId(npcShipId: string | null | undefined): boolean {
  return waveTestShip(String(npcShipId ?? '').trim()) != null;
}

/** 웨이브 테스트 무기 강제 거래가 — 대상 아니거나 CSV 빈칸이면 null(정상 가격식) */
export function resolveWaveTestWeaponTradePrice(weaponId: string | null | undefined): number | null {
  const row = CAPITAL_WEAPON_LIST_FROM_CSV[String(weaponId ?? '').trim()];
  if (row?.specialUse !== 'wave_test') return null;
  return row.testTradePriceCredits ?? null;
}

/** 웨이브 테스트함 강제 거래가 — 대상 아니거나 CSV 빈칸이면 null(정상 가격식) */
export function resolveWaveTestShipTradePrice(npcShipId: string | null | undefined): number | null {
  return waveTestShip(String(npcShipId ?? '').trim())?.testTradePriceCredits ?? null;
}

/** itemDef → 웨이브 테스트 무기/전함 (광물 싱크·헐 밴드 예외) */
export function isWaveTestTradeItemDef(itemDef: {
  type?: string | null;
  id?: string | null;
  attrs?: Record<string, unknown> | null;
} | null | undefined): boolean {
  if (!itemDef) return false;
  if (itemDef.type === 'weapon_module') {
    const fromAttr = typeof itemDef.attrs?.weaponId === 'string'
      ? itemDef.attrs.weaponId
      : '';
    const fromId = String(itemDef.id ?? '').replace(/^weapon_item_/, '');
    return isWaveTestTradeWeaponId(fromAttr || fromId);
  }
  if (itemDef.type === 'capital_ship') {
    const fromAttr = typeof itemDef.attrs?.npcCapitalShipId === 'string'
      ? itemDef.attrs.npcCapitalShipId
      : '';
    const fromId = String(itemDef.id ?? '').replace(/^capital_ship_/, '');
    return isWaveTestTradeShipId(fromAttr || fromId);
  }
  return false;
}
