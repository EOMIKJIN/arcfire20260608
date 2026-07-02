// ============================================================
// 행성 소유권 증서 가격 — Table-First (PGP · 구역 · 미래 수익 프리미엄)
// ============================================================

import { PlanetOwnershipDeedPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';
import { getItemDef } from '../../data/itemRegistry';
import { calculatePlanetPgpFromStats } from '../../world/planetPgpModel';
import { resolvePlanetById } from '../../world/resolvePlanetById';
import { resolveStarSystemForPlanetId } from '../../world/resolvePlanetSystemPosition';
import type { ZoneType } from '../../types';

type OwnershipDeedPolicy = {
  testPlanetIds: Set<string>;
  testPriceCredits: number;
  baseCredits: number;
  pgpBmuToCreditsMul: number;
  futureValueMul: number;
  zoneMulByType: Record<ZoneType, number>;
  minCredits: number;
  maxCredits: number;
};

let cachedPolicy: OwnershipDeedPolicy | null = null;

function num(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function getPolicyKv(): Map<string, string> {
  return new Map(
    PlanetOwnershipDeedPolicy_FROM_BALANCE_CSV.map((row) => [row.key, row.value] as const),
  );
}

function resolvePolicy(): OwnershipDeedPolicy {
  if (cachedPolicy) return cachedPolicy;
  const kv = getPolicyKv();
  cachedPolicy = {
    testPlanetIds: new Set(
      String(kv.get('test_planet_ids') ?? 'arcadia_prime')
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean),
    ),
    testPriceCredits: Math.max(1, Math.floor(num(kv.get('test_price_credits'), 1))),
    baseCredits: Math.max(0, Math.floor(num(kv.get('base_credits'), 12000))),
    pgpBmuToCreditsMul: Math.max(0, num(kv.get('pgp_bmu_to_credits_mul'), 0.085)),
    futureValueMul: Math.max(1, num(kv.get('future_value_mul'), 2.15)),
    zoneMulByType: {
      safe: Math.max(0.1, num(kv.get('zone_safe_mul'), 1)),
      neutral: Math.max(0.1, num(kv.get('zone_neutral_mul'), 1.12)),
      pvp: Math.max(0.1, num(kv.get('zone_pvp_mul'), 1.28)),
      endgame: Math.max(0.1, num(kv.get('zone_endgame_mul'), 1.55)),
    },
    minCredits: Math.max(1, Math.floor(num(kv.get('min_credits'), 38000))),
    maxCredits: Math.max(1, Math.floor(num(kv.get('max_credits'), 4200000))),
  };
  return cachedPolicy;
}

function clampCredits(value: number, policy: OwnershipDeedPolicy): number {
  return Math.max(policy.minCredits, Math.min(policy.maxCredits, Math.floor(value)));
}

function resolveZoneTypeForPlanet(planetId: string): ZoneType {
  const system = resolveStarSystemForPlanetId(planetId);
  const zone = system?.zone;
  if (zone === 'safe' || zone === 'neutral' || zone === 'pvp' || zone === 'endgame') return zone;
  return 'neutral';
}

/** 런타임 PGP(배치 갱신) 우선, 없으면 CSV 5대 스탯 시드 */
export function resolvePlanetPgpBmuForOwnershipPricing(planetId: string): number {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { usePlanetCoreRuntimeStore } = require('../../store/planetCoreRuntimeStore') as typeof import('../../store/planetCoreRuntimeStore');
    const runtime = usePlanetCoreRuntimeStore.getState().byPlanetId[planetId]?.pgp;
    if (typeof runtime === 'number' && Number.isFinite(runtime) && runtime > 0) {
      return Math.floor(runtime);
    }
  } catch {
    /* store 미로드 */
  }

  const planet = resolvePlanetById(planetId);
  if (!planet) return calculatePlanetPgpFromStats({
    resource: 50,
    population: 50,
    defense: 50,
    technology: 50,
    environment: 50,
  });

  return calculatePlanetPgpFromStats({
    resource: planet.coreResource,
    population: planet.corePopulation,
    defense: planet.coreDefense,
    technology: planet.coreTechnology,
    environment: planet.coreEnvironment,
  });
}

/** 무역소 구매 탭 단가 — item_defs basePrice(테스트 1CR) · PGP 정책 */
export function resolvePlanetOwnershipDeedTradePriceCredits(planetId: string): number {
  const id = planetId.trim();
  if (!id) return 1;

  const policy = resolvePolicy();
  if (policy.testPlanetIds.has(id)) {
    return policy.testPriceCredits;
  }

  const itemDef = getItemDef(`ownership_${id}`);
  if (itemDef?.basePrice === policy.testPriceCredits) {
    return policy.testPriceCredits;
  }

  const pgpBmu = resolvePlanetPgpBmuForOwnershipPricing(id);
  const zoneType = resolveZoneTypeForPlanet(id);
  const zoneMul = policy.zoneMulByType[zoneType] ?? 1;
  const core = policy.baseCredits + pgpBmu * policy.pgpBmuToCreditsMul;
  const priced = core * policy.futureValueMul * zoneMul;
  return clampCredits(priced, policy);
}

export function invalidatePlanetOwnershipDeedPricingCache(): void {
  cachedPolicy = null;
}
