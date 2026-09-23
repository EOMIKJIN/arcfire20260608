// ============================================================
// 잔해 수색 — 광물 시세 CR·일일 한도 (Table-First)
// ============================================================

import { PlanetSalvageSearchPolicy_FROM_BALANCE_CSV } from '../data/balance/generated';

export type PlanetSalvageSearchPolicy = {
  enabled: boolean;
  mineralCashChancePct: number;
  dailySearchCap: number;
  cashPriceMul: number;
};

let policyKv: Map<string, string> | null = null;
let policyTestOverride: Partial<PlanetSalvageSearchPolicy> | null = null;

function num(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function bool(raw: string | undefined, fallback: boolean): boolean {
  const v = String(raw ?? '').trim().toLowerCase();
  if (v === 'true' || v === '1' || v === 'yes') return true;
  if (v === 'false' || v === '0' || v === 'no') return false;
  return fallback;
}

function getPolicyKv(): Map<string, string> {
  if (!policyKv) {
    policyKv = new Map(
      PlanetSalvageSearchPolicy_FROM_BALANCE_CSV.map((row) => [row.key, row.value] as const),
    );
  }
  return policyKv;
}

export function resolvePlanetSalvageSearchPolicy(): PlanetSalvageSearchPolicy {
  const kv = getPolicyKv();
  const resolved: PlanetSalvageSearchPolicy = {
    enabled: bool(kv.get('enabled'), true),
    mineralCashChancePct: Math.max(0, Math.min(100, Math.floor(num(kv.get('mineral_cash_chance_pct'), 50)))),
    dailySearchCap: Math.max(1, Math.floor(num(kv.get('daily_search_cap'), 100))),
    cashPriceMul: Math.max(0, num(kv.get('cash_price_mul'), 1)),
  };
  return policyTestOverride ? { ...resolved, ...policyTestOverride } : resolved;
}

/** 단위테스트 전용. 런타임·틱에서 호출 금지. */
export function setPlanetSalvageSearchPolicyForTest(
  override: Partial<PlanetSalvageSearchPolicy> | null,
): void {
  policyTestOverride = override;
}

export function invalidatePlanetSalvageSearchPolicyCache(): void {
  policyKv = null;
}
