// ============================================================
// arc_core_planet_dev_investment_policy.csv
// ============================================================

import { ArcCorePlanetDevInvestmentPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated/csvArcCorePlanetDevInvestmentPolicy';

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
      ArcCorePlanetDevInvestmentPolicy_FROM_BALANCE_CSV.map((row) => [row.key, row.value] as const),
    );
  }
  return policyKv;
}

function policyNum(key: string, fallback: number): number {
  return parseNum(getPolicyKv().get(key), fallback);
}

export type ArcCorePlanetDevInvestmentPolicy = {
  investmentTickEnabled: boolean;
  maxStartsPerTick: number;
  moduleWeightDefenseSatellite: number;
  moduleWeightDevOrbitShipyard: number;
  moduleWeightDevTradePort: number;
  moduleWeightDevResearchLab: number;
  moduleWeightDevPopulationDome: number;
  contestedDefenseBonus: number;
  capitalPrimeBonus: number;
  minFirstWavePlanets: number;
  minFirstWaveModuleTypes: number;
  maxConcurrentSameModule: number;
  portfolioPrimaryAffinityBonus: number;
  portfolioSecondaryAffinityBonus: number;
  sameModuleInFlightPenalty: number;
  firstWavePlanetPriorityCap: number;
};

export function resolveArcCorePlanetDevInvestmentPolicy(): ArcCorePlanetDevInvestmentPolicy {
  return {
    investmentTickEnabled: parseBool(getPolicyKv().get('investment_tick_enabled')),
    maxStartsPerTick: Math.max(1, policyNum('max_starts_per_tick', 2)),
    moduleWeightDefenseSatellite: policyNum('module_weight_defense_satellite', 100),
    moduleWeightDevOrbitShipyard: policyNum('module_weight_dev_orbit_shipyard', 70),
    moduleWeightDevTradePort: policyNum('module_weight_dev_trade_port', 75),
    moduleWeightDevResearchLab: policyNum('module_weight_dev_research_lab', 60),
    moduleWeightDevPopulationDome: policyNum('module_weight_dev_population_dome', 50),
    contestedDefenseBonus: policyNum('contested_defense_bonus', 40),
    capitalPrimeBonus: policyNum('capital_prime_bonus', 30),
    minFirstWavePlanets: Math.max(1, policyNum('min_first_wave_planets', 3)),
    minFirstWaveModuleTypes: Math.max(1, policyNum('min_first_wave_module_types', 3)),
    maxConcurrentSameModule: Math.max(1, policyNum('max_concurrent_same_module', 1)),
    portfolioPrimaryAffinityBonus: policyNum('portfolio_primary_affinity_bonus', 50),
    portfolioSecondaryAffinityBonus: policyNum('portfolio_secondary_affinity_bonus', 25),
    sameModuleInFlightPenalty: policyNum('same_module_in_flight_penalty', 80),
    firstWavePlanetPriorityCap: Math.max(1, policyNum('first_wave_planet_priority_cap', 3)),
  };
}

export function resolveArcCorePlanetDevModuleWeight(
  moduleId: string,
  policy: ArcCorePlanetDevInvestmentPolicy = resolveArcCorePlanetDevInvestmentPolicy(),
): number {
  switch (moduleId) {
    case 'defense_satellite': return policy.moduleWeightDefenseSatellite;
    case 'dev_orbit_shipyard': return policy.moduleWeightDevOrbitShipyard;
    case 'dev_trade_port': return policy.moduleWeightDevTradePort;
    case 'dev_research_lab': return policy.moduleWeightDevResearchLab;
    case 'dev_population_dome': return policy.moduleWeightDevPopulationDome;
    default: return 0;
  }
}
