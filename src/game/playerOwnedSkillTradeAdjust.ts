// ============================================================
// 플레이어 무역 스킬 — 매입/매도 단가 · 수수료 · 밀수 (견적·결제 1회)
// ============================================================

import type { PlanetTradeFeeBreakdown } from '../arcCore/economy/planetUpkeepPolicy';
import { sumOwnedSkillStatBonus } from './ownedSkillStatBonus';
import { resolveSkillAutoCombatPolicy } from './skillAutoCombatPolicy';

function readOwnedSkillIds(ownedSkillIds?: readonly string[]): readonly string[] {
  if (ownedSkillIds) return ownedSkillIds;
  const { usePlayerStore } = require('../store/playerStore') as typeof import('../store/playerStore');
  return usePlayerStore.getState().player?.skills ?? [];
}

function resolveOwnedStat(statKey: string, ownedSkillIds?: readonly string[]): number {
  return sumOwnedSkillStatBonus(statKey, readOwnedSkillIds(ownedSkillIds));
}

function owns(id: string, ownedSkillIds?: readonly string[]): boolean {
  return readOwnedSkillIds(ownedSkillIds).includes(id);
}

/** 매입 -N% / 매도 +N% 합산 상한. CSV 기존값 변경 없음 */
export const TRADE_BONUS_STAT_CAP_PCT = 40;
/** 수수료 감면 합산 상한 */
export const TAX_CUT_STAT_CAP_PCT = 80;

function clampPct(raw: number, cap: number): number {
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  return Math.min(cap, raw);
}

export function resolvePlayerTradeBonusPct(ownedSkillIds?: readonly string[]): number {
  return clampPct(resolveOwnedStat('trade_bonus', ownedSkillIds), TRADE_BONUS_STAT_CAP_PCT);
}

export function resolvePlayerTaxCutPct(ownedSkillIds?: readonly string[]): number {
  return clampPct(resolveOwnedStat('tax_cut', ownedSkillIds), TAX_CUT_STAT_CAP_PCT);
}

export function resolvePlayerMonopolyBuyPct(ownedSkillIds?: readonly string[]): number {
  if (!owns('monopoly_master', ownedSkillIds)) return 0;
  const policy = resolveSkillAutoCombatPolicy();
  const csv = resolveOwnedStat('price_control', ownedSkillIds);
  return clampPct(csv > 0 ? csv : policy.monopolyBuyPct, policy.monopolyBuyPct);
}

export function resolvePlayerBulkMarginPct(qty: number, ownedSkillIds?: readonly string[]): number {
  const policy = resolveSkillAutoCombatPolicy();
  if (qty < policy.bulkQtyThreshold) return 0;
  return clampPct(resolveOwnedStat('profit_margin', ownedSkillIds), 40);
}

export function playerOwnsMarketSense(ownedSkillIds?: readonly string[]): boolean {
  return owns('market_sense', ownedSkillIds) || resolveOwnedStat('market_range', ownedSkillIds) > 0;
}

export function playerOwnsBlackMarketBoss(ownedSkillIds?: readonly string[]): boolean {
  return owns('black_market_boss', ownedSkillIds) || resolveOwnedStat('trade_access', ownedSkillIds) > 0;
}

export function playerOwnsInvestorDeal(ownedSkillIds?: readonly string[]): boolean {
  return owns('investor_deal', ownedSkillIds);
}

function applyBuyDiscounts(base: number, ownedSkillIds?: readonly string[], qty = 1): number {
  let price = Math.max(1, Math.floor(base));
  const bonus = resolvePlayerTradeBonusPct(ownedSkillIds);
  if (bonus > 0) price = Math.max(1, Math.floor(price * (1 - bonus / 100)));
  const monopoly = resolvePlayerMonopolyBuyPct(ownedSkillIds);
  if (monopoly > 0) price = Math.max(1, Math.floor(price * (1 - monopoly / 100)));
  const bulk = resolvePlayerBulkMarginPct(qty, ownedSkillIds);
  if (bulk > 0) price = Math.max(1, Math.floor(price * (1 - bulk / 100)));
  return price;
}

function applySellPremiums(base: number, ownedSkillIds?: readonly string[], qty = 1): number {
  let price = Math.max(1, Math.floor(base));
  const bonus = resolvePlayerTradeBonusPct(ownedSkillIds);
  if (bonus > 0) price = Math.max(1, Math.floor(price * (1 + bonus / 100)));
  const bulk = resolvePlayerBulkMarginPct(qty, ownedSkillIds);
  if (bulk > 0) price = Math.max(1, Math.floor(price * (1 + bulk / 100)));
  return price;
}

/** 매입 단가 — negotiation_pro · monopoly_master · bulk_trading */
export function applyPlayerTradeBuyUnitPrice(
  unitPrice: number,
  ownedSkillIds?: readonly string[],
  qtyArg?: number,
): number {
  return applyBuyDiscounts(unitPrice, ownedSkillIds, qtyArg ?? 1);
}

/** 매도 단가 — negotiation_pro · bulk_trading */
export function applyPlayerTradeSellUnitPrice(
  unitPrice: number,
  ownedSkillIds?: readonly string[],
  qtyArg?: number,
): number {
  return applySellPremiums(unitPrice, ownedSkillIds, qtyArg ?? 1);
}

function zeroFees(breakdown: PlanetTradeFeeBreakdown): PlanetTradeFeeBreakdown {
  return {
    grossCredits: breakdown.grossCredits,
    totalFee: 0,
    playerPoolShare: 0,
    arcImmediateShare: 0,
  };
}

export function applyPlayerTaxCutToFeeBreakdown(
  breakdown: PlanetTradeFeeBreakdown,
  ownedSkillIds?: readonly string[],
  opts?: { contraband?: boolean },
): PlanetTradeFeeBreakdown {
  if (opts?.contraband && playerOwnsBlackMarketBoss(ownedSkillIds)) {
    return zeroFees(breakdown);
  }
  const cut = resolvePlayerTaxCutPct(ownedSkillIds);
  if (cut <= 0) return breakdown;
  const mul = 1 - cut / 100;
  return {
    grossCredits: breakdown.grossCredits,
    totalFee: Math.floor(breakdown.totalFee * mul),
    playerPoolShare: Math.floor(breakdown.playerPoolShare * mul),
    arcImmediateShare: Math.floor(breakdown.arcImmediateShare * mul),
  };
}

export function isContrabandTradeGood(category: string | null | undefined, goodId?: string): boolean {
  if (String(category ?? '').trim() === 'contraband') return true;
  return String(goodId ?? '').trim() === 'contraband';
}

export type ContrabandDetectResult = {
  contraband: boolean;
  caught: boolean;
  detectPct: number;
};

/** 밀수 발각 주사위 — 거래 확정 1회. 발각 시 거래 취소 */
export function rollContrabandDetection(
  category: string | null | undefined,
  goodId?: string,
  ownedSkillIds?: readonly string[],
  rng: () => number = Math.random,
): ContrabandDetectResult {
  if (!isContrabandTradeGood(category, goodId)) {
    return { contraband: false, caught: false, detectPct: 0 };
  }
  const policy = resolveSkillAutoCombatPolicy();
  let detectPct = policy.smugglerBaseDetectPct;
  const risk = resolveOwnedStat('contraband_risk', ownedSkillIds);
  if (risk < 0) detectPct = Math.max(0, detectPct * (1 + risk / 100));
  if (playerOwnsBlackMarketBoss(ownedSkillIds)) detectPct = Math.max(0, detectPct * 0.25);
  const caught = rng() * 100 < detectPct;
  return { contraband: true, caught, detectPct };
}

export function applyInvestorDealToRepairCost(cost: number, ownedSkillIds?: readonly string[]): number {
  if (playerOwnsInvestorDeal(ownedSkillIds)) return 0;
  return Math.max(0, Math.floor(cost));
}

/** 암시장 거물 — 섹터 밴드와 무관하게 밀수품 SKU 진열 */
export function applyBlackMarketBossToCatalogIds(
  itemIds: readonly string[],
  ownedSkillIds?: readonly string[],
): string[] {
  const next = itemIds.slice();
  if (!playerOwnsBlackMarketBoss(ownedSkillIds)) return next;
  let has = false;
  for (let i = 0; i < next.length; i += 1) {
    if (next[i] === 'contraband') {
      has = true;
      break;
    }
  }
  if (!has) next.push('contraband');
  return next;
}
