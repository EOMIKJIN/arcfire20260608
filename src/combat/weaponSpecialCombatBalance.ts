// ============================================================
// weapon_special_combat_balance_policy — 광역·특수 무기 가격/TTK 예외
// ============================================================

import { WeaponSpecialCombatBalancePolicy_FROM_BALANCE_CSV } from '../data/balance/generated';
import type { CapitalWeaponCsvRow } from '../data/generated';

export type WeaponSpecialCombatBalanceRow = {
  weaponId: string;
  excludeFromTtkRebalance: boolean;
  pricingAoeHullFraction: number;
  pricingAoeTargetCount: number;
  pricingAoeBlendWeight: number;
  minPurchasePriceCredits: number;
};

const policyByWeaponId = new Map<string, WeaponSpecialCombatBalanceRow>(
  WeaponSpecialCombatBalancePolicy_FROM_BALANCE_CSV.map((row) => [
    row.weaponId,
    {
      weaponId: row.weaponId,
      excludeFromTtkRebalance: String(row.excludeFromTtkRebalance).trim().toLowerCase() === 'true',
      pricingAoeHullFraction: Number(row.pricingAoeHullFraction) || 0,
      pricingAoeTargetCount: Number(row.pricingAoeTargetCount) || 1,
      pricingAoeBlendWeight: Math.max(0, Math.min(1, Number(row.pricingAoeBlendWeight) || 0)),
      minPurchasePriceCredits: Math.max(0, Number(row.minPurchasePriceCredits) || 0),
    },
  ]),
);

export function getWeaponSpecialCombatBalance(weaponId: string): WeaponSpecialCombatBalanceRow | null {
  const id = weaponId.trim();
  return policyByWeaponId.get(id) ?? null;
}

export function isWeaponExcludedFromTtkRebalance(weaponId: string): boolean {
  return getWeaponSpecialCombatBalance(weaponId)?.excludeFromTtkRebalance ?? false;
}

export function resolveWeaponMinPurchasePriceCredits(weaponId: string, csvPurchasePrice: number): number {
  const special = getWeaponSpecialCombatBalance(weaponId);
  if (special && special.minPurchasePriceCredits > 0) return special.minPurchasePriceCredits;
  return csvPurchasePrice > 0 ? csvPurchasePrice : 0;
}

/** 광역 노바 등 — 단일표적 DPS에 AoE 기대 피해를 blend하여 가격 산정용 DPS 보정 */
export function blendSingleTargetDpsWithAoePricing(
  weapon: CapitalWeaponCsvRow,
  singleTargetDps: number,
  refHullHp: number,
  cycleSec: number,
): number {
  const special = getWeaponSpecialCombatBalance(weapon.id);
  if (!special || special.pricingAoeBlendWeight <= 0) return singleTargetDps;
  const frac = special.pricingAoeHullFraction;
  if (frac <= 0) return singleTargetDps;
  const safeCycle = Math.max(0.12, cycleSec);
  const aoeBurst = refHullHp * frac * Math.max(1, special.pricingAoeTargetCount);
  const aoeDps = aoeBurst / safeCycle;
  const w = special.pricingAoeBlendWeight;
  return singleTargetDps * (1 - w) + aoeDps * w;
}
