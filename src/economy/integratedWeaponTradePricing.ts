// ============================================================
// weapon_trade_base_price_policy — integrated_leveling_v2
// 구간 예산 × 성능(DPS·사거리) × 가상수요 오버레이
// ============================================================

import {
  getEconomyPriceMicroPolicyNum,
  getWeaponTradePriceBounds,
} from '../arcCore/balance/balanceTableRegistry';
import { getPlanetLevelingRowForZone } from '../arcCore/planetBalance/planetZoneIndexRegistry';
import { getCapitalWeaponRow } from '../game/capitalWeaponRegistry';
import { getItemDef } from '../data/itemRegistry';
import { weaponItemIdFromWeaponId } from '../game/weaponItemId';
import { getEconomyCategoryPriceMul } from '../arcCore/economy/economyPriceOverlayStore';
import type { CapitalWeaponCsvRow } from '../data/generated';

function clampPrice(n: number): number {
  const { min, max } = getWeaponTradePriceBounds();
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function requiredLevelToZoneIndex(requiredLevel: number): number {
  return Math.max(1, Math.min(20, Math.ceil(requiredLevel / 3)));
}

function resolveWeaponRequiredLevel(weaponId: string): number {
  const def = getItemDef(weaponItemIdFromWeaponId(weaponId));
  const raw = def?.attrs?.weaponRequiredLevel;
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
}

/** DPS·사거리·연발 기반 연속 성능 점수 */
export function weaponPerformanceScore(weapon: CapitalWeaponCsvRow): number {
  const reloadSec = Math.max(0.45, weapon.cooldownMs / 1000);
  const salvo = Math.max(1, weapon.salvoCount);
  const dps = (weapon.damage * salvo) / reloadSec;
  const rangeNorm = Math.sqrt(Math.max(40, weapon.rangePx) / 150);
  const speedBonus = Math.min(0.12, weapon.projectileSpeedPxPerSec / 50_000);
  return dps * (0.82 + rangeNorm * 0.14 + speedBonus);
}

function baselinePerformanceForLevel(requiredLevel: number): number {
  return 2.15 * Math.pow(1.26, Math.max(0, requiredLevel - 1));
}

/**
 * @param cumulativeCredits 플레이어 누적 획득 크레딧(없으면 0) — 후반 구간 가격 상향 계수
 */
export function resolveIntegratedWeaponTradePrice(
  weaponId: string,
  cumulativeCredits = 0,
): number {
  const weapon = getCapitalWeaponRow(weaponId);
  if (!weapon) return getWeaponTradePriceBounds().min;

  const requiredLevel = resolveWeaponRequiredLevel(weaponId);
  const zoneIndex = requiredLevelToZoneIndex(requiredLevel);
  const zoneRow = getPlanetLevelingRowForZone(zoneIndex);
  const zoneBudget = Number(zoneRow.targetCreditsEarned) || 30_000;

  const perf = weaponPerformanceScore(weapon);
  const baseline = baselinePerformanceForLevel(requiredLevel);
  const perfExponent = getEconomyPriceMicroPolicyNum('weapon_perf_exponent', 0.72);
  const perfNorm = Math.pow(Math.max(0.35, perf / baseline), perfExponent);

  const levelScale = 1 + (requiredLevel - 1) * 0.065;
  const creditN = Math.max(0, cumulativeCredits);
  const creditFactor = 1 + Math.min(1.5, Math.log10(creditN + 1) / 7.5);
  const zoneCoef = getEconomyPriceMicroPolicyNum('weapon_zone_budget_coef', 0.048);
  const demandMul = getEconomyCategoryPriceMul('weapon');

  const raw = zoneBudget * zoneCoef * perfNorm * levelScale * creditFactor * demandMul;
  const csvFallback = weapon.purchasePrice > 0 ? weapon.purchasePrice : raw;
  return clampPrice(Math.max(raw, csvFallback * 0.85));
}
