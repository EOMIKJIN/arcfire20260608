// ============================================================
// 아크코어 — 10종 광물 카탈로그·존 풀 정본
// - mining_mineral_catalog.csv · mining_zone_mineral_pool.csv
// ============================================================

import {
  MiningMineralCatalog_FROM_BALANCE_CSV,
  MiningZoneMineralPool_FROM_BALANCE_CSV,
} from '../../data/balance/generated';

export type MineralCatalogEntry = {
  mineralIndex: number;
  mineralId: string;
  displayNameKo: string;
  tierRank: number;
  sellPriceAnchorCr: number;
  poolWeight: number;
};

function parseNum(raw: string | number | undefined, fallback = 0): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function clampZone(n: number): number {
  return Math.max(1, Math.min(21, Math.round(n)));
}

const catalogByIndex = new Map<number, MineralCatalogEntry>();
const catalogById = new Map<string, MineralCatalogEntry>();

for (const row of MiningMineralCatalog_FROM_BALANCE_CSV) {
  const mineralIndex = parseNum(row.mineralIndex, 0);
  const mineralId = String(row.mineralId ?? '').trim();
  if (mineralIndex <= 0 || !mineralId) continue;
  const entry: MineralCatalogEntry = {
    mineralIndex,
    mineralId,
    displayNameKo: String(row.displayNameKo ?? mineralId).trim(),
    tierRank: parseNum(row.tierRank, mineralIndex),
    sellPriceAnchorCr: parseNum(row.sellPriceAnchorCr, 100),
    poolWeight: parseNum(row.poolWeight, 1),
  };
  catalogByIndex.set(mineralIndex, entry);
  catalogById.set(mineralId, entry);
}

function findZonePoolRow(zoneIndex: number) {
  const z = clampZone(zoneIndex);
  for (const row of MiningZoneMineralPool_FROM_BALANCE_CSV) {
    const min = parseNum(row.zoneIndexMin, 1);
    const max = parseNum(row.zoneIndexMax, 99);
    if (z >= min && z <= max) return row;
  }
  return MiningZoneMineralPool_FROM_BALANCE_CSV[0] ?? null;
}

export function listMineralCatalogEntries(): readonly MineralCatalogEntry[] {
  return [...catalogByIndex.values()].sort((a, b) => a.mineralIndex - b.mineralIndex);
}

export function getMineralCatalogEntryById(mineralId: string): MineralCatalogEntry | null {
  return catalogById.get(mineralId.trim()) ?? null;
}

export function isCatalogGalacticMineral(mineralId: string): boolean {
  return catalogById.has(mineralId.trim());
}

export function listAllGalacticMineralItemIds(): string[] {
  return listMineralCatalogEntries().map((e) => e.mineralId);
}

/** 존에서 채굴·무역 가능한 광물 id (index 오름차순) */
export function listZonePoolMineralIds(zoneIndex: number): string[] {
  const row = findZonePoolRow(zoneIndex);
  if (!row) return listAllGalacticMineralItemIds().slice(0, 4);
  const idxMin = parseNum(row.mineralIndexMin, 1);
  const idxMax = parseNum(row.mineralIndexMax, idxMin);
  const out: string[] = [];
  for (let i = idxMin; i <= idxMax; i += 1) {
    const entry = catalogByIndex.get(i);
    if (entry) out.push(entry.mineralId);
  }
  return out;
}

/** 존 풀에서 최저 index = 주력(체감 70% 드랍 대상) */
export function resolveZonePrimaryMineralId(zoneIndex: number): string {
  const pool = listZonePoolMineralIds(zoneIndex);
  return pool[0] ?? 'ore_ferrite';
}

export function resolveZonePoolMineralIndexRange(zoneIndex: number): { min: number; max: number } {
  const row = findZonePoolRow(zoneIndex);
  const min = parseNum(row?.mineralIndexMin, 1);
  const max = parseNum(row?.mineralIndexMax, min);
  return { min, max };
}

export function filterMineralIdsToZonePool(zoneIndex: number, mineralIds: readonly string[]): string[] {
  const allowed = new Set(listZonePoolMineralIds(zoneIndex));
  return mineralIds.filter((id) => allowed.has(id));
}

export function resolveCatalogSellPriceAnchor(mineralId: string): number {
  return getMineralCatalogEntryById(mineralId)?.sellPriceAnchorCr ?? 10;
}
