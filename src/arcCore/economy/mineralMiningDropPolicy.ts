// ============================================================
// 아크코어 — 광물 확률 채굴 드랍 (존 풀 · 70% 주력 / 30% 부가)
// - mining_drop_weight_policy.csv
// ============================================================

import { MiningDropWeightPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';
import { resolveStarSystemForPlanetId } from '../../world/resolvePlanetSystemPosition';
import { resolvePlanetZoneIndex } from '../planetBalance/planetZoneIndexRegistry';
import {
  listZonePoolMineralIds,
  resolveZonePrimaryMineralId,
} from './mineralCatalogRegistry';

function parseNum(raw: string | number | undefined, fallback = 0): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function clampZone(n: number): number {
  return Math.max(1, Math.min(21, Math.round(n)));
}

function resolveZoneIndexForPlanet(planetId: string): number {
  const system = resolveStarSystemForPlanetId(planetId);
  return clampZone(resolvePlanetZoneIndex(planetId, system ?? null));
}

function findDropWeightRow(zoneIndex: number) {
  const z = clampZone(zoneIndex);
  for (const row of MiningDropWeightPolicy_FROM_BALANCE_CSV) {
    const min = parseNum(row.zoneIndexMin, 1);
    const max = parseNum(row.zoneIndexMax, 99);
    if (z >= min && z <= max) return row;
  }
  return MiningDropWeightPolicy_FROM_BALANCE_CSV[0] ?? null;
}

function resolvePrimaryWeightPct(zoneIndex: number): number {
  const row = findDropWeightRow(zoneIndex);
  const pct = parseNum(row?.primaryWeightPct, 70);
  return Math.max(0, Math.min(100, pct));
}

/**
 * 확률 채굴 1회분 광물 id.
 * @param rng 0..1. 미전달 시 Math.random()
 */
export function rollMiningDropGoodId(planetId: string, rng = Math.random()): string {
  const zoneIndex = resolveZoneIndexForPlanet(planetId);
  const pool = listZonePoolMineralIds(zoneIndex);
  if (pool.length === 0) return resolveZonePrimaryMineralId(zoneIndex);

  const primary = pool[0]!;
  const primaryWeight = resolvePrimaryWeightPct(zoneIndex) / 100;
  const roll = Math.max(0, Math.min(0.999999, rng));

  if (pool.length === 1 || roll < primaryWeight) {
    return primary;
  }

  const secondary = pool.slice(1);
  const idx = Math.floor(((roll - primaryWeight) / (1 - primaryWeight)) * secondary.length);
  return secondary[Math.min(secondary.length - 1, Math.max(0, idx))] ?? primary;
}

/** UI·소행성 슬롯1 표시용 — 존 주력 광물 */
export function resolvePlanetDisplayPrimaryMineralId(planetId: string): string {
  return resolveZonePrimaryMineralId(resolveZoneIndexForPlanet(planetId));
}
