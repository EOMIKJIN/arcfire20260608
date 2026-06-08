// ============================================================
// trade_port_sector_commodity_policy — sectorBand → tg category
// ============================================================

import { TradePortSectorCommodityPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';

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
