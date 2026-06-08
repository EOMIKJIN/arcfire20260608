// ============================================================
// weapon_trade_base_price_policy — integrated_leveling_v1
// 구간 예산(planet_leveling_progression.targetCreditsEarned) × 등급 × 레벨 스케일
// ============================================================

import { getWeaponTradePriceBounds } from '../arcCore/balance/balanceTableRegistry';
import { getPlanetLevelingRowForZone } from '../arcCore/planetBalance/planetZoneIndexRegistry';
import { getCapitalWeaponRow } from '../game/capitalWeaponRegistry';
import { getItemDef } from '../data/itemRegistry';
import { weaponItemIdFromWeaponId } from '../game/weaponItemId';

function clampPrice(n: number): number {
  const { min, max } = getWeaponTradePriceBounds();
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function requiredLevelToZoneIndex(requiredLevel: number): number {
  return Math.max(1, Math.min(20, Math.ceil(requiredLevel / 3)));
}

function tierLabelGradeMul(tierLabel: string): number {
  const t = tierLabel.trim();
  if (t === '숙련') return 0.075;
  if (t === '신규') return 0.055;
  if (t === '기본') return 0.045;
  return 0.05;
}

function resolveWeaponRequiredLevel(weaponId: string): number {
  const def = getItemDef(weaponItemIdFromWeaponId(weaponId));
  const raw = def?.attrs?.weaponRequiredLevel;
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
}

function resolveWeaponTierLabel(weaponId: string): string {
  const def = getItemDef(weaponItemIdFromWeaponId(weaponId));
  const raw = def?.attrs?.weaponTierLabel;
  return typeof raw === 'string' ? raw : '기본';
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
  const gradeMul = tierLabelGradeMul(resolveWeaponTierLabel(weaponId));
  const levelScale = 1 + (requiredLevel - 1) * 0.08;
  const creditN = Math.max(0, cumulativeCredits);
  const creditFactor = 1 + Math.min(1.5, Math.log10(creditN + 1) / 7.5);

  const raw = zoneBudget * gradeMul * levelScale * creditFactor;
  const csvFallback = weapon.purchasePrice > 0 ? weapon.purchasePrice : raw;
  return clampPrice(Math.max(raw, csvFallback * 0.85));
}
