// ============================================================
// arc_core_fiscal_opex_policy.csv — 일 1회 프록시 오펙스
// 틱·부트·타이틀 금지. 기존 수수료/800/탄력0 미변경.
// ============================================================

import { ArcCoreFiscalOpexPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';

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
      ArcCoreFiscalOpexPolicy_FROM_BALANCE_CSV.map((row) => [row.key, row.value] as const),
    );
  }
  return policyKv;
}

function policyNum(key: string, fallback: number): number {
  return parseNum(getPolicyKv().get(key), fallback);
}

export type ArcCoreFiscalOpexVaultKey = 'red' | 'blue' | 'neutral' | 'independent' | 'fleet';

export type ArcCoreFiscalOpexPolicy = {
  enabled: boolean;
  shadowMode: boolean;
  kMil: number;
  pgpUnitDivisor: number;
  kShip: number;
  orbitTrafficCap: number;
  kShipyard: number;
  fleetShipSharePct: number;
  redShipSharePct: number;
  kCap: number;
  kRd: number;
  residualSurplusPct: number;
  skipEmptyCentralBankBurnWhenLive: boolean;
  fleetOpexOfSurplusPct: number;
  redDividendPct: number;
  devBudgetPreSpend: boolean;
  coeffHintEnabled: boolean;
  coeffHintSeedMultiple: number;
  coeffHintStepPct: number;
  coeffHintMulMin: number;
  coeffHintMulMax: number;
};

export function resolveArcCoreFiscalOpexPolicy(): ArcCoreFiscalOpexPolicy {
  const fleet = Math.max(0, Math.min(100, policyNum('fleet_ship_share_pct', 70)));
  const red = Math.max(0, Math.min(100, policyNum('red_ship_share_pct', 30)));
  const shareSum = fleet + red;
  const scale = shareSum > 0 ? 100 / shareSum : 0.5;
  return {
    enabled: parseBool(getPolicyKv().get('enabled')),
    shadowMode: parseBool(getPolicyKv().get('shadow_mode') ?? 'true'),
    kMil: Math.max(0, policyNum('k_mil', 40)),
    pgpUnitDivisor: Math.max(1, policyNum('pgp_unit_divisor', 3375)),
    kShip: Math.max(0, policyNum('k_ship', 4000)),
    orbitTrafficCap: Math.max(0, Math.floor(policyNum('orbit_traffic_cap', 5))),
    kShipyard: Math.max(0, policyNum('k_shipyard', 800)),
    fleetShipSharePct: fleet * scale,
    redShipSharePct: red * scale,
    kCap: Math.max(0, policyNum('k_cap', 150)),
    kRd: Math.max(0, policyNum('k_rd', 400)),
    residualSurplusPct: Math.max(0, Math.min(100, policyNum('residual_surplus_pct', 15))),
    skipEmptyCentralBankBurnWhenLive: parseBool(
      getPolicyKv().get('skip_empty_central_bank_burn_when_live') ?? 'true',
    ),
    fleetOpexOfSurplusPct: Math.max(0, Math.min(20, policyNum('fleet_opex_of_surplus_pct', 2))),
    redDividendPct: 0,
    devBudgetPreSpend: parseBool(getPolicyKv().get('dev_budget_pre_spend') ?? 'true'),
    coeffHintEnabled: parseBool(getPolicyKv().get('coeff_hint_enabled') ?? 'true'),
    coeffHintSeedMultiple: Math.max(2, policyNum('coeff_hint_seed_multiple', 20)),
    coeffHintStepPct: Math.max(0, Math.min(10, policyNum('coeff_hint_step_pct', 5))),
    coeffHintMulMin: Math.max(0.5, policyNum('coeff_hint_mul_min', 0.85)),
    coeffHintMulMax: Math.min(1.5, policyNum('coeff_hint_mul_max', 1.15)),
  };
}

/** 라이브 오펙스가 켜진 뒤에만 함대·개방 빈 소각을 생략한다. shadow면 현행 유지. */
export function shouldSkipCentralBankEmptyAccountingBurn(): boolean {
  const policy = resolveArcCoreFiscalOpexPolicy();
  return (
    policy.enabled
    && !policy.shadowMode
    && policy.skipEmptyCentralBankBurnWhenLive
  );
}

export function emptyFiscalOpexVaultMap(): Record<ArcCoreFiscalOpexVaultKey, number> {
  return { red: 0, blue: 0, neutral: 0, independent: 0, fleet: 0 };
}
