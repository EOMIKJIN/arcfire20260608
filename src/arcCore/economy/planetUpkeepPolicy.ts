// ============================================================
// arc_core_planet_upkeep_policy.csv — 유지비·거래수수료 정본
// ============================================================

import { ArcCorePlanetUpkeepPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';

function parseNum(raw: string | number | undefined, fallback: number): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function parseBool(raw: string | undefined): boolean {
  return String(raw ?? '').trim().toLowerCase() === 'true';
}

let policyKv: Map<string, string> | null = null;

function getPolicyKv(): Map<string, string> {
  if (!policyKv) {
    policyKv = new Map(
      ArcCorePlanetUpkeepPolicy_FROM_BALANCE_CSV.map((row) => [row.key, row.value] as const),
    );
  }
  return policyKv;
}

function policyNum(key: string, fallback: number): number {
  return parseNum(getPolicyKv().get(key), fallback);
}

export type PlanetUpkeepPolicy = {
  enabled: boolean;
  /** [보완 #2] 행성 1개당 일 유지비 고정(크레딧) — P=50% 기준 800 */
  upkeepFixedCreditsPerPlanet: number;
  tradeFeeRatePct: number;
  tradeFeePlayerWalletSharePct: number;
  tradeFeeArcImmediateSharePct: number;
};

export function resolvePlanetUpkeepPolicy(): PlanetUpkeepPolicy {
  return {
    enabled: parseBool(getPolicyKv().get('enabled')),
    upkeepFixedCreditsPerPlanet: Math.max(
      0,
      Math.floor(policyNum('upkeep_fixed_credits_per_planet', 800)),
    ),
    tradeFeeRatePct: Math.max(0, Math.min(50, policyNum('trade_fee_rate_pct', 10))),
    tradeFeePlayerWalletSharePct: Math.max(
      0,
      Math.min(50, policyNum('trade_fee_player_wallet_share_pct', 5)),
    ),
    tradeFeeArcImmediateSharePct: Math.max(
      0,
      Math.min(50, policyNum('trade_fee_arc_immediate_share_pct', 5)),
    ),
  };
}

/** [보완 #2] 행성 1개당 일 유지비 — P 스탯 무관 고정(추후 동적 계산 예정) */
export function computePlanetDailyUpkeepCredits(
  _populationScalar?: number,
  policy = resolvePlanetUpkeepPolicy(),
): number {
  return policy.upkeepFixedCreditsPerPlanet;
}

export type PlanetTradeFeeBreakdown = {
  grossCredits: number;
  totalFee: number;
  playerPoolShare: number;
  arcImmediateShare: number;
};

export function computePlanetTradeFeeBreakdown(
  grossCredits: number,
  policy = resolvePlanetUpkeepPolicy(),
): PlanetTradeFeeBreakdown {
  const gross = Math.max(0, Math.floor(grossCredits));
  if (gross <= 0) {
    return { grossCredits: 0, totalFee: 0, playerPoolShare: 0, arcImmediateShare: 0 };
  }
  const totalFee = Math.floor(gross * (policy.tradeFeeRatePct / 100));
  const playerPoolShare = Math.floor(gross * (policy.tradeFeePlayerWalletSharePct / 100));
  const arcImmediateShare = Math.floor(gross * (policy.tradeFeeArcImmediateSharePct / 100));
  return { grossCredits: gross, totalFee, playerPoolShare, arcImmediateShare };
}

export function getArcCoreTransportFleetSeedCredits(): number {
  return Math.floor(policyNum('transport_fleet_seed_credits', 500_000));
}

export function getArcCoreVaultSeedCredits(): number {
  return Math.floor(policyNum('arc_core_vault_seed_credits', 100_000));
}

export function getBlueTeamVaultSeedCredits(): number {
  return Math.floor(policyNum('blue_team_vault_seed_credits', 100_000));
}

export function vaultAllowsNegativeBalance(): boolean {
  return parseBool(getPolicyKv().get('allow_negative_vault_balance'));
}

export function getTransportFleetDisplayNameKo(): string {
  const raw = getPolicyKv().get('transport_fleet_display_name_ko');
  return raw?.trim() || '아크코어 수송선단';
}

export function computeConvoyTradeFeeBreakdown(
  grossCredits: number,
  policy = resolvePlanetUpkeepPolicy(),
): PlanetTradeFeeBreakdown {
  const gross = Math.max(0, Math.floor(grossCredits));
  if (gross <= 0) {
    return { grossCredits: 0, totalFee: 0, playerPoolShare: 0, arcImmediateShare: 0 };
  }
  const totalFee = Math.floor(gross * (policy.tradeFeeRatePct / 100));
  return { grossCredits: gross, totalFee, playerPoolShare: 0, arcImmediateShare: totalFee };
}

export function convoyDailyCoverageEnabled(): boolean {
  return parseBool(getPolicyKv().get('convoy_daily_coverage_enabled'));
}

export function getConvoyDailyMinTradeQty(): number {
  return Math.max(1, Math.floor(policyNum('convoy_daily_min_trade_qty', 2)));
}

/** 월 환산 일수 — 유지비·수수료 월 추정 */
export const PLANET_ECONOMY_MONTHLY_DAYS = 30;
