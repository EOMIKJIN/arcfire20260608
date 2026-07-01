// ============================================================
// arc_core_central_bank_policy.csv — 중앙은행 지출·발행 정책
// ============================================================

import { ArcCoreCentralBankPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';

function parseNum(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function parseBool(raw: string | undefined): boolean {
  return String(raw ?? '').trim().toLowerCase() === 'true';
}

let policyKv: Map<string, string> | null = null;

function getPolicyKv(): Map<string, string> {
  if (!policyKv) {
    policyKv = new Map(
      ArcCoreCentralBankPolicy_FROM_BALANCE_CSV.map((row) => [row.key, row.value] as const),
    );
  }
  return policyKv;
}

function policyNum(key: string, fallback: number): number {
  return parseNum(getPolicyKv().get(key), fallback);
}

export type ArcCoreCentralBankPolicy = {
  expenditurePassEnabled: boolean;
  expenditureFleetMilitarySharePct: number;
  expenditurePlanetOpeningSharePct: number;
  expenditurePlanetDevelopmentSharePct: number;
};

export function resolveArcCoreCentralBankPolicy(): ArcCoreCentralBankPolicy {
  const fleet = Math.max(0, policyNum('expenditure_fleet_military_share_pct', 34));
  const opening = Math.max(0, policyNum('expenditure_planet_opening_share_pct', 33));
  const development = Math.max(0, policyNum('expenditure_planet_development_share_pct', 33));
  const sum = fleet + opening + development;
  const scale = sum > 0 ? 100 / sum : 1 / 3;
  return {
    expenditurePassEnabled: parseBool(getPolicyKv().get('expenditure_pass_enabled')),
    expenditureFleetMilitarySharePct: fleet * scale,
    expenditurePlanetOpeningSharePct: opening * scale,
    expenditurePlanetDevelopmentSharePct: development * scale,
  };
}
