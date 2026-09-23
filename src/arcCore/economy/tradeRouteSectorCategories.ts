// ============================================================
// trade_port_sector_commodity_policy — sectorBand → tg category + 기초 화물 SKU
// ============================================================

import { getItemDef } from '../../data/itemRegistry';
import { TradePortSectorCommodityPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';

/** 섹터 pipe 토큰과 1:1인 기초 화물(식량 팩 등). tg_* 와 별도. */
const SECTOR_CARGO_SKU_IDS = ['food', 'minerals', 'tech', 'luxury', 'weapon', 'contraband'] as const;

const sectorPipeByBand = new Map(
  TradePortSectorCommodityPolicy_FROM_BALANCE_CSV.map((row) => [
    String(row.sectorBand).trim(),
    String(row.commodityItemIdsPipe ?? '')
      .split('|')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  ] as const),
);

/** CSV pipe `minerals` → item category `mineral` */
const CATEGORY_ALIASES: Record<string, string> = {
  minerals: 'mineral',
  mineral: 'mineral',
  food: 'food',
  tech: 'tech',
  luxury: 'luxury',
  weapon: 'weapon',
  contraband: 'contraband',
};

export function splitPipeCategoriesFromSectorBand(sectorBand: string): Set<string> {
  const pipe =
    sectorPipeByBand.get(sectorBand.trim()) ?? sectorPipeByBand.get('early') ?? ['food', 'mineral'];
  const out = new Set<string>();
  for (const token of pipe) {
    out.add(CATEGORY_ALIASES[token] ?? token);
  }
  return out;
}

/** early → food·minerals. 무역소 구매 탭에 식량 팩이 빠지지 않게 한다. */
export function listSectorCargoSkuItemIds(sectorBand: string): string[] {
  const allowed = splitPipeCategoriesFromSectorBand(sectorBand);
  const out: string[] = [];
  for (const id of SECTOR_CARGO_SKU_IDS) {
    const def = getItemDef(id);
    if (!def?.tradeable) continue;
    if (allowed.has(def.category) || allowed.has(id)) out.push(id);
  }
  return out;
}
