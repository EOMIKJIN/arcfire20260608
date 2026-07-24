// ============================================================
// 행성 소유권 증서 — 연간 실물수익 + 정성·영토가치 (Table-First)
// 정액 12000CR 제거 · PGP·구역·시설·ledger/fabric 기반
// ============================================================

import { PlanetOwnershipDeedPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';
import { resolvePlanetUpkeepPolicy } from '../economy/planetUpkeepPolicy';
import { resolvePlanetSupplyStockScale } from '../economy/planetEconomyFabric';
import { resolvePlanetDevelopmentTdiPgpBonusBmu } from '../planetDevelopment/planetDevelopmentLevelBenefits';
import { getPlanetMasterBalanceDetailForPlanet, resolvePlanetZoneIndex } from '../planetBalance/planetZoneIndexRegistry';
import { calculatePlanetPgpFromStats } from '../../world/planetPgpModel';
import { resolvePlanetById } from '../../world/resolvePlanetById';
import { resolveStarSystemForPlanetId } from '../../world/resolvePlanetSystemPosition';
import type { ZoneType } from '../../types';

export type PlanetOwnershipDeedValuationPolicy = {
  testPlanetIds: Set<string>;
  testPriceCredits: number;
  /** 전쟁 후 중립·분쟁지역 테스트가 — 추후 정상가−전쟁보상으로 교체 */
  warSpoilsTestPriceCredits: number;
  /** true면 분쟁지역(정적·동적)만 전쟁 스폴일가 적용 */
  warSpoilsRequireContested: boolean;
  annualDays: number;
  zoneAnnualEarnRatio: number;
  observedFeeWeight: number;
  sovereignPgpBmuToCreditsMul: number;
  zoneMulByType: Record<ZoneType, number>;
  facilityTradePortMul: number;
  facilityShipyardMul: number;
  facilityTavernMul: number;
  supplyVitalityMin: number;
  supplyVitalityMax: number;
  populationRevenueFloor: number;
  populationRevenueSpan: number;
  minCredits: number;
  maxCredits: number;
};

export type PlanetOwnershipDeedValuation = {
  priceCredits: number;
  annualTangibleCredits: number;
  qualitativeCredits: number;
  dailyGrossCredits: number;
  dailyNetCredits: number;
  pgpBmu: number;
  zoneType: ZoneType;
};

let cachedPolicy: PlanetOwnershipDeedValuationPolicy | null = null;

function num(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function resolvePlanetOwnershipDeedValuationPolicy(): PlanetOwnershipDeedValuationPolicy {
  if (cachedPolicy) return cachedPolicy;
  const kv = new Map(
    PlanetOwnershipDeedPolicy_FROM_BALANCE_CSV.map((row) => [row.key, row.value] as const),
  );
  cachedPolicy = {
    testPlanetIds: new Set(
      String(kv.get('test_planet_ids') ?? '')
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean),
    ),
    testPriceCredits: Math.max(1, Math.floor(num(kv.get('test_price_credits'), 1))),
    warSpoilsTestPriceCredits: Math.max(
      1,
      Math.floor(num(kv.get('war_spoils_test_price_credits'), 10)),
    ),
    warSpoilsRequireContested: String(kv.get('war_spoils_require_contested') ?? 'true')
      .trim()
      .toLowerCase() !== 'false',
    annualDays: Math.max(1, Math.floor(num(kv.get('annual_days'), 365))),
    zoneAnnualEarnRatio: Math.max(0, Math.min(2, num(kv.get('zone_annual_earn_ratio'), 0.55))),
    observedFeeWeight: Math.max(0, num(kv.get('observed_fee_weight'), 1)),
    sovereignPgpBmuToCreditsMul: Math.max(0, num(kv.get('sovereign_pgp_bmu_to_credits_mul'), 0.038)),
    zoneMulByType: {
      safe: Math.max(0.1, num(kv.get('zone_safe_mul'), 1)),
      neutral: Math.max(0.1, num(kv.get('zone_neutral_mul'), 1.12)),
      pvp: Math.max(0.1, num(kv.get('zone_pvp_mul'), 1.28)),
      endgame: Math.max(0.1, num(kv.get('zone_endgame_mul'), 1.55)),
    },
    facilityTradePortMul: Math.max(1, num(kv.get('facility_trade_port_mul'), 1.12)),
    facilityShipyardMul: Math.max(1, num(kv.get('facility_shipyard_mul'), 1.06)),
    facilityTavernMul: Math.max(1, num(kv.get('facility_tavern_mul'), 1.04)),
    supplyVitalityMin: Math.max(0.1, num(kv.get('supply_vitality_min'), 0.55)),
    supplyVitalityMax: Math.max(0.1, num(kv.get('supply_vitality_max'), 1.35)),
    populationRevenueFloor: Math.max(0, num(kv.get('population_revenue_floor'), 0.72)),
    populationRevenueSpan: Math.max(0, num(kv.get('population_revenue_span'), 0.56)),
    minCredits: Math.max(1, Math.floor(num(kv.get('min_credits'), 25000))),
    maxCredits: Math.max(1, Math.floor(num(kv.get('max_credits'), 4_200_000))),
  };
  return cachedPolicy;
}

function clampCredits(value: number, policy: PlanetOwnershipDeedValuationPolicy): number {
  return Math.max(policy.minCredits, Math.min(policy.maxCredits, Math.floor(value)));
}

/** zoneIndex(1..21) → 소유권 정성·구역 배율 — colonization CSV 정본 */
export function resolveOwnershipPricingZoneType(planetId: string): ZoneType {
  const system = resolveStarSystemForPlanetId(planetId);
  const zoneIndex = resolvePlanetZoneIndex(planetId, system ?? null);
  if (zoneIndex <= 5) return 'safe';
  if (zoneIndex <= 12) return 'neutral';
  if (zoneIndex <= 18) return 'pvp';
  return 'endgame';
}

function resolveFacilitySovereignMul(
  planet: { hasTradePort?: boolean; hasShipyard?: boolean; hasTavern?: boolean },
  policy: PlanetOwnershipDeedValuationPolicy,
): number {
  let mul = 1;
  if (planet.hasTradePort) mul *= policy.facilityTradePortMul;
  if (planet.hasShipyard) mul *= policy.facilityShipyardMul;
  if (planet.hasTavern) mul *= policy.facilityTavernMul;
  return mul;
}

function resolvePopulationRevenueMul(
  resource: number,
  population: number,
  policy: PlanetOwnershipDeedValuationPolicy,
): number {
  const avg = (Math.max(0, Math.min(100, resource)) + Math.max(0, Math.min(100, population))) / 200;
  return policy.populationRevenueFloor + policy.populationRevenueSpan * avg;
}

function readObservedDailyFeeCredits(planetId: string): number {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { usePlanetTradeFeeLedgerStore } =
      require('../../store/planetTradeFeeLedgerStore') as typeof import('../../store/planetTradeFeeLedgerStore');
    const bucket = usePlanetTradeFeeLedgerStore.getState().getBucket(planetId);
    const arc = Math.max(0, Math.floor(Number(bucket.arcFeeCredits) || 0));
    const convoy = Math.max(0, Math.floor(Number(bucket.convoyFeeCredits) || 0));
    const player = Math.max(0, Math.floor(Number(bucket.playerTradeFeeCredits) || 0));
    return arc + convoy + player;
  } catch {
    return 0;
  }
}

function readFabricDailyFeeCredits(planetId: string): number {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { usePlanetCoreRuntimeStore } =
      require('../../store/planetCoreRuntimeStore') as typeof import('../../store/planetCoreRuntimeStore');
    const runtime = usePlanetCoreRuntimeStore.getState().getPlanetCoreRuntime(planetId);
    const fabric = runtime?.detail?.economyFabric?.window;
    if (!fabric) return 0;
    const gross = Math.max(0, Math.floor(Number(fabric.playerTradeGrossCredits) || 0));
    const convoyProfit = Math.max(0, Math.floor(Number(fabric.convoyProfitCredits) || 0));
    const policy = resolvePlanetUpkeepPolicy();
    const tradeFee = Math.floor(gross * (policy.tradeFeeRatePct / 100));
    return tradeFee + Math.floor(convoyProfit * 0.12);
  } catch {
    return 0;
  }
}

function resolveZoneAnnualModelCredits(
  planetId: string,
  resource: number,
  population: number,
  policy: PlanetOwnershipDeedValuationPolicy,
): number {
  const system = resolveStarSystemForPlanetId(planetId);
  const masterBalance = getPlanetMasterBalanceDetailForPlanet(planetId, system ?? null);
  const vitality = Math.max(
    policy.supplyVitalityMin,
    Math.min(policy.supplyVitalityMax, resolvePlanetSupplyStockScale(planetId)),
  );
  const popMul = resolvePopulationRevenueMul(resource, population, policy);
  return masterBalance.targetCreditsEarned * policy.zoneAnnualEarnRatio * vitality * popMul;
}

/** 런타임 PGP(배치 갱신) 우선, 없으면 CSV 5대 스탯 시드 */
export function resolvePlanetPgpBmuForOwnershipPricing(planetId: string): number {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { usePlanetCoreRuntimeStore } =
      require('../../store/planetCoreRuntimeStore') as typeof import('../../store/planetCoreRuntimeStore');
    const runtime = usePlanetCoreRuntimeStore.getState().byPlanetId[planetId]?.pgp;
    if (typeof runtime === 'number' && Number.isFinite(runtime) && runtime > 0) {
      return Math.floor(runtime);
    }
  } catch {
    /* store 미로드 */
  }

  const planet = resolvePlanetById(planetId);
  if (!planet) {
    return calculatePlanetPgpFromStats({
      resource: 50,
      population: 50,
      defense: 50,
      technology: 50,
      environment: 50,
    });
  }

  return calculatePlanetPgpFromStats({
    resource: planet.coreResource,
    population: planet.corePopulation,
    defense: planet.coreDefense,
    technology: planet.coreTechnology,
    environment: planet.coreEnvironment,
  }) + resolvePlanetDevelopmentTdiPgpBonusBmu(planetId);
}

/** 소유권 = 연간 실물수익 + 정성·영토(PGP·구역·시설) */
export function computePlanetOwnershipDeedValuation(planetId: string): PlanetOwnershipDeedValuation {
  const id = planetId.trim();
  const policy = resolvePlanetOwnershipDeedValuationPolicy();
  const zoneType = resolveOwnershipPricingZoneType(id);
  const zoneMul = policy.zoneMulByType[zoneType] ?? 1;

  const planet = resolvePlanetById(id);
  const resource = planet?.coreResource ?? 50;
  const population = planet?.corePopulation ?? 50;

  const observedDaily = Math.max(readObservedDailyFeeCredits(id), readFabricDailyFeeCredits(id));
  const observedAnnual = observedDaily * policy.observedFeeWeight * policy.annualDays;
  const zoneAnnualModel = resolveZoneAnnualModelCredits(id, resource, population, policy);
  const annualTangibleCredits = Math.max(observedAnnual, zoneAnnualModel);

  const pgpBmu = resolvePlanetPgpBmuForOwnershipPricing(id);
  const facilityMul = planet ? resolveFacilitySovereignMul(planet, policy) : 1;
  const qualitativeCredits =
    pgpBmu * policy.sovereignPgpBmuToCreditsMul * zoneMul * facilityMul;

  const priceCredits = clampCredits(annualTangibleCredits + qualitativeCredits, policy);

  const dailyGross = Math.floor(annualTangibleCredits / policy.annualDays);

  return {
    priceCredits,
    annualTangibleCredits: Math.floor(annualTangibleCredits),
    qualitativeCredits: Math.floor(qualitativeCredits),
    dailyGrossCredits: dailyGross,
    dailyNetCredits: dailyGross,
    pgpBmu,
    zoneType,
  };
}

export function invalidatePlanetOwnershipDeedPricingCache(): void {
  cachedPolicy = null;
}
