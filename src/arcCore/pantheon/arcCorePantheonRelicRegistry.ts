import { ARC_CORE_PANTHEON_RELICS_FROM_CSV } from '../../data/generated';
import type { ArcCorePantheonRelicRow } from '../../types';

/** godId → 유물 행. relicItemId → 유물 행. 모듈 레벨 1회 구성. */
const BY_GOD_ID = new Map<string, ArcCorePantheonRelicRow>();
const BY_RELIC_ITEM_ID = new Map<string, ArcCorePantheonRelicRow>();

for (const row of ARC_CORE_PANTHEON_RELICS_FROM_CSV) {
  if (!row.godId || !row.relicItemId) continue;
  BY_GOD_ID.set(row.godId, row);
  BY_RELIC_ITEM_ID.set(row.relicItemId, row);
}

export function getArcCorePantheonRelicByGodId(godId: string): ArcCorePantheonRelicRow | null {
  return BY_GOD_ID.get(godId) ?? null;
}

export function getArcCorePantheonRelicByItemId(relicItemId: string): ArcCorePantheonRelicRow | null {
  return BY_RELIC_ITEM_ID.get(relicItemId) ?? null;
}

export function listArcCorePantheonRelics(): readonly ArcCorePantheonRelicRow[] {
  return ARC_CORE_PANTHEON_RELICS_FROM_CSV;
}
