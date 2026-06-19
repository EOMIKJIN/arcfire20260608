// ============================================================
// 무역소 행성개발(dev_trade_port) — 고급 무기 진열 가중 배분
// Lv1 = zone 정본 배분 · Lv2+ = tradeGradeRank 가중 리롤(행성·Lv 시드)
// ============================================================

import {
  getTradePortWeaponListingCount,
} from './balanceTableRegistry';
import { resolveTradePortHighGradeWeaponWeightBonus } from './facilityTradePortLevelPolicy';
import {
  buildTradePortWeaponIdsForZoneUncapped,
  capTradePortWeaponListingToZonePolicy,
  isPinnedTradePortWeapon,
  MAX_WEAPON_TRADE_GRADE_RANK,
  resolveTradePortWeaponIdsForZone,
  resolveWeaponTradeGradeRank,
  sortTradePortWeaponIds,
} from './weaponTradeListingPolicy';

function hashStringToInt(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function weaponProgressionWeight(weaponId: string, weightBonusPct: number): number {
  const rank = resolveWeaponTradeGradeRank(weaponId);
  const maxRank = Math.max(1, MAX_WEAPON_TRADE_GRADE_RANK);
  const gradeFactor = rank / maxRank;
  const bonus = Math.max(0, weightBonusPct) / 100;
  return 1 + gradeFactor * bonus * 3;
}

function weightedSampleWithoutReplacement(
  items: readonly string[],
  count: number,
  weightFn: (id: string) => number,
  rand: () => number,
): string[] {
  if (count <= 0 || items.length === 0) return [];
  const pool = [...items];
  const picked: string[] = [];
  for (let n = 0; n < count && pool.length > 0; n += 1) {
    const weights = pool.map(weightFn);
    const total = weights.reduce((sum, w) => sum + w, 0);
    let roll = rand() * total;
    let idx = 0;
    for (; idx < pool.length; idx += 1) {
      roll -= weights[idx];
      if (roll <= 0) break;
    }
    const pickIdx = Math.min(idx, pool.length - 1);
    picked.push(pool[pickIdx]);
    pool.splice(pickIdx, 1);
  }
  return picked;
}

/**
 * dev_trade_port Lv2+ — zone 풀 위에서 progression 슬롯만 고급 무기 가중 배분.
 * Lv1·미설치는 zone 정본과 동일.
 */
export function resolveTradePortWeaponIdsForPlanetDev(
  zoneIndex: number,
  planetId: string,
  tradePortLevel: number,
): string[] {
  if (tradePortLevel <= 1) {
    return resolveTradePortWeaponIdsForZone(zoneIndex);
  }

  const uncapped = buildTradePortWeaponIdsForZoneUncapped(zoneIndex);
  const listingCap = getTradePortWeaponListingCount();
  if (uncapped.length <= listingCap) return uncapped;

  const pinned = uncapped.filter((id) => isPinnedTradePortWeapon(id));
  const progression = uncapped.filter((id) => !isPinnedTradePortWeapon(id));
  const progressionSlots = Math.max(0, listingCap - pinned.length);
  if (progressionSlots <= 0) return capTradePortWeaponListingToZonePolicy(uncapped);

  const weightBonus = resolveTradePortHighGradeWeaponWeightBonus(tradePortLevel);
  const seed = hashStringToInt(`${planetId}:trade_port_weapon:${tradePortLevel}`);
  const rand = mulberry32(seed);
  const picked = weightedSampleWithoutReplacement(
    progression,
    progressionSlots,
    (id) => weaponProgressionWeight(id, weightBonus),
    rand,
  );

  return sortTradePortWeaponIds([...pinned, ...picked]);
}
