// ============================================================
// arc_core_planet_upkeep_policy.csv — 유지비·거래수수료 정본
// ============================================================

import { ArcCorePlanetUpkeepPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';
import { resolvePlanetFiscalPolicyFromKv } from './planetFiscalKpi';

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
  /** [보완 #2] 행성 1개당 일 유지비 고정 베이스(크레딧) — P=50% 기준 800 */
  upkeepFixedCreditsPerPlanet: number;
  /** [v3] 개발 엔티티 레벨별 유지비를 베이스에 가산할지 */
  developmentScalingEnabled: boolean;
  /** [v4] 당일 팩션 수수료 비례 유지비 sink */
  tradeVolumeShareEnabled: boolean;
  dailyFactionFeeSharePct: number;
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
    developmentScalingEnabled: parseBool(
      getPolicyKv().get('upkeep_development_scaling_enabled') ?? 'true',
    ),
    tradeVolumeShareEnabled: parseBool(
      getPolicyKv().get('upkeep_trade_volume_share_enabled') ?? 'true',
    ),
    dailyFactionFeeSharePct: Math.max(
      0,
      Math.min(50, policyNum('upkeep_daily_faction_fee_share_pct', 18)),
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

/**
 * 행성 1개당 1일 유지비 = 고정 베이스 + 개발 엔티티 유지비 가산분.
 * [v3] 개발도 비례: developmentUpkeepCredits 는 호출부에서 행성별 개발 엔티티
 *   레벨 유지비를 합산해 전달(`computePlanetDevelopmentDailyUpkeepCredits`). 정책 플래그로 가산 게이트.
 */
export function computePlanetDailyUpkeepCredits(
  developmentUpkeepCredits = 0,
  policy = resolvePlanetUpkeepPolicy(),
  dailyArcFeeCredits = 0,
): number {
  const base = policy.upkeepFixedCreditsPerPlanet;
  const dev = policy.developmentScalingEnabled
    ? Math.max(0, Math.floor(developmentUpkeepCredits))
    : 0;
  const tradeSink =
    policy.tradeVolumeShareEnabled && dailyArcFeeCredits > 0
      ? Math.floor(dailyArcFeeCredits * (policy.dailyFactionFeeSharePct / 100))
      : 0;
  return base + dev + tradeSink;
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
  opts?: { dailyArcFeeCredits?: number; dailyUpkeepCredits?: number },
  policy = resolvePlanetUpkeepPolicy(),
): PlanetTradeFeeBreakdown {
  const gross = Math.max(0, Math.floor(grossCredits));
  if (gross <= 0) {
    return { grossCredits: 0, totalFee: 0, playerPoolShare: 0, arcImmediateShare: 0 };
  }
  const dampen = resolveConvoyFeeDampenMultiplier(
    opts?.dailyArcFeeCredits ?? 0,
    opts?.dailyUpkeepCredits ?? policy.upkeepFixedCreditsPerPlanet,
  );
  const totalFee = Math.floor(gross * (policy.tradeFeeRatePct / 100) * dampen);
  return { grossCredits: gross, totalFee, playerPoolShare: 0, arcImmediateShare: totalFee };
}

export function convoyDailyCoverageEnabled(): boolean {
  return parseBool(getPolicyKv().get('convoy_daily_coverage_enabled'));
}

export function getConvoyDailyMinTradeQty(): number {
  return Math.max(1, Math.floor(policyNum('convoy_daily_min_trade_qty', 2)));
}

export function resolvePlanetFiscalPolicy() {
  return resolvePlanetFiscalPolicyFromKv((key) => getPolicyKv().get(key));
}

export function getConvoyProgressiveFeeThresholdRatio(): number {
  return Math.max(1, policyNum('convoy_progressive_fee_threshold_ratio', 15));
}

export function getConvoyProgressiveFeeDampenMaxPct(): number {
  return Math.max(0, Math.min(90, policyNum('convoy_progressive_fee_dampen_max_pct', 40)));
}

export function getFiscalClosedLoopWarnStreakDays(): number {
  return Math.max(1, Math.floor(policyNum('fiscal_closed_loop_warn_streak_days', 3)));
}

export function getFiscalClosedLoopTradeRouteStepPct(): number {
  return Math.max(0.5, Math.min(10, policyNum('fiscal_closed_loop_trade_route_step_pct', 2)));
}

/**
 * 고유량 행성 convoy 수수료 progressive dampening (일 1회 배치·당일 ledger 기준).
 */
export function resolveConvoyFeeDampenMultiplier(
  dailyArcFeeCredits: number,
  dailyUpkeepCredits: number,
): number {
  const upkeep = Math.max(0, Math.floor(dailyUpkeepCredits));
  const fees = Math.max(0, Math.floor(dailyArcFeeCredits));
  if (upkeep <= 0 || fees <= 0) return 1;
  const ratio = fees / upkeep;
  const threshold = getConvoyProgressiveFeeThresholdRatio();
  if (ratio <= threshold) return 1;
  const maxDampen = getConvoyProgressiveFeeDampenMaxPct() / 100;
  const excess = (ratio - threshold) / threshold;
  const dampen = Math.min(maxDampen, excess * 0.05);
  return Math.max(1 - maxDampen, 1 - dampen);
}

/** 월 환산 일수 — 유지비·수수료 월 추정 */
export const PLANET_ECONOMY_MONTHLY_DAYS = 30;
