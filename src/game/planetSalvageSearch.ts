import { getItemDef } from '../data/goods';

/** 잔해 수색 기본 루트 — 추후 CSV·아크코어 테이블로 이전 */
const SALVAGE_LOOT_ITEM_IDS = [
  'ore_ferrite',
  'ore_silicate',
  'ore_carbon',
  'ore_mineral_1',
  'ore_nickel',
] as const;

function hash32(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pickSalvageLootItemId(planetId: string, wreckId: string, attemptIndex: number): string {
  const seed = hash32(`${planetId}:${wreckId}:${attemptIndex}`);
  const pool = SALVAGE_LOOT_ITEM_IDS.filter((id) => Boolean(getItemDef(id)));
  const list = pool.length > 0 ? pool : ['ore_ferrite'];
  return list[seed % list.length]!;
}

export function formatSalvageLootLabel(itemId: string): string {
  return getItemDef(itemId)?.name ?? itemId;
}
