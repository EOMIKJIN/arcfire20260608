// ============================================================
// BM Table-First 인덱스 — 보석·교환·play_scenario O(1) 조회
// 정본: tables/balance/bm_economy_policy.csv · gem_*_catalog.csv
// ============================================================

import {
  BmEconomyPolicy_FROM_BALANCE_CSV,
  GemExchangeCatalog_FROM_BALANCE_CSV,
  GemPackCatalog_FROM_BALANCE_CSV,
  GemSpendCatalog_FROM_BALANCE_CSV,
  PlayScenarioEconomy_FROM_BALANCE_CSV,
} from '../data/balance/generated';
import type { GemExchangeCatalogRow } from '../data/balance/generated/csvGemExchangeCatalog';
import type { GemPackCatalogRow } from '../data/balance/generated/csvGemPackCatalog';
import type { GemSpendCatalogRow } from '../data/balance/generated/csvGemSpendCatalog';

function parseNum(raw: string | undefined): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

let bmPolicyMap: Map<string, number> | null = null;

function getBmPolicyMap(): Map<string, number> {
  if (!bmPolicyMap) {
    bmPolicyMap = new Map(
      BmEconomyPolicy_FROM_BALANCE_CSV.map((row) => [row.key, parseNum(row.value)]),
    );
  }
  return bmPolicyMap;
}

export function getBmPolicyNumber(key: string, fallback = 0): number {
  return getBmPolicyMap().get(key) ?? fallback;
}

/** @deprecated BM_DUMMY_GEM_TO_CREDIT_RATE 대체 — CSV gem_exchange_base_cr_per_gem */
export function getGemExchangeBaseCrPerGem(): number {
  return getBmPolicyNumber('gem_exchange_base_cr_per_gem', 400);
}

export function getGemExchangeDailyCapGems(): number {
  return getBmPolicyNumber('gem_exchange_daily_cap_gems', 500);
}

export function getGemDirectPurchasePremiumMul(): number {
  return getBmPolicyNumber('gem_direct_purchase_premium_mul', 1.35);
}

export function getF2pOptimalDailyCreditIncome(): number {
  return getBmPolicyNumber('f2p_optimal_daily_credit_income', 50_000);
}

export function getPlayScenarioCreditPerHourAnchor(): number {
  return getBmPolicyNumber('play_scenario_credit_per_hour_anchor', 10_000);
}

export function computeGemPackGrantAmount(baseGems: number, bonusPct: number): number {
  const base = Math.max(0, Math.floor(baseGems));
  const bonus = Math.max(0, Math.floor(bonusPct));
  return Math.floor(base * (100 + bonus) / 100);
}

let gemExchangeById: Map<string, GemExchangeCatalogRow> | null = null;

export function getGemExchangeById(productId: string): GemExchangeCatalogRow | undefined {
  if (!gemExchangeById) {
    gemExchangeById = new Map(
      GemExchangeCatalog_FROM_BALANCE_CSV.map((row) => [row.productId, row]),
    );
  }
  return gemExchangeById.get(productId);
}

export function listGemExchangeCatalog(): readonly GemExchangeCatalogRow[] {
  return GemExchangeCatalog_FROM_BALANCE_CSV;
}

let gemPackById: Map<string, GemPackCatalogRow> | null = null;

export function getGemPackById(productId: string): GemPackCatalogRow | undefined {
  if (!gemPackById) {
    gemPackById = new Map(
      GemPackCatalog_FROM_BALANCE_CSV.map((row) => [row.productId, row]),
    );
  }
  return gemPackById.get(productId);
}

export function listGemPackCatalog(): readonly GemPackCatalogRow[] {
  return GemPackCatalog_FROM_BALANCE_CSV;
}

let gemSpendById: Map<string, GemSpendCatalogRow> | null = null;

export function getGemSpendById(itemId: string): GemSpendCatalogRow | undefined {
  if (!gemSpendById) {
    gemSpendById = new Map(
      GemSpendCatalog_FROM_BALANCE_CSV.map((row) => [row.itemId, row]),
    );
  }
  return gemSpendById.get(itemId);
}

export function listGemSpendCatalog(): readonly GemSpendCatalogRow[] {
  return GemSpendCatalog_FROM_BALANCE_CSV;
}

export type PlayScenarioMilestone = {
  zoneIndex: number;
  requiredCredits: number;
  pureMiningMinutes: number;
  creditPerHour: number;
  gemsToSkipAtBaseRate: number;
};

export function listPlayScenarioMilestones(): PlayScenarioMilestone[] {
  return PlayScenarioEconomy_FROM_BALANCE_CSV.map((row) => {
    const requiredCredits = parseNum(row.requiredCredits);
    const pureMiningMinutes = parseNum(row.pureMiningMinutes);
    const creditPerHour = pureMiningMinutes > 0
      ? requiredCredits / (pureMiningMinutes / 60)
      : 0;
    const baseRate = getGemExchangeBaseCrPerGem();
    const gemsToSkipAtBaseRate = baseRate > 0
      ? Math.ceil(requiredCredits / baseRate)
      : 0;
    return {
      zoneIndex: parseNum(row.zoneIndex),
      requiredCredits,
      pureMiningMinutes,
      creditPerHour,
      gemsToSkipAtBaseRate,
    };
  });
}

export function resolveExchangeCreditAmount(productId: string): number {
  const row = getGemExchangeById(productId);
  return row ? parseNum(row.creditAmount) : 0;
}

export function resolveExchangeEffectiveCrPerGem(productId: string): number {
  const row = getGemExchangeById(productId);
  if (!row) return getGemExchangeBaseCrPerGem();
  const gems = parseNum(row.gemCost);
  const credits = parseNum(row.creditAmount);
  return gems > 0 ? credits / gems : getGemExchangeBaseCrPerGem();
}

export function resolveGemPackGrant(productId: string): number {
  const row = getGemPackById(productId);
  if (!row) return 0;
  return computeGemPackGrantAmount(parseNum(row.gemAmount), parseNum(row.bonusPct));
}

export function resolveGemPackCreditEquivalent(productId: string): number {
  return resolveGemPackGrant(productId) * getGemExchangeBaseCrPerGem();
}
