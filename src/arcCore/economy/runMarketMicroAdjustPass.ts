// ============================================================
// 일 1회 경제 가격 미세조정 — 가상 10만 유저 수요 시뮬
// ============================================================

import { getEconomyPriceMicroPolicyNum } from '../balance/balanceTableRegistry';
import {
  ECONOMY_CATEGORY_KEYS,
  useEconomyPriceOverlayStore,
} from './economyPriceOverlayStore';
import {
  pressureToTargetMultiplier,
  runVirtualMarketDemandSim,
} from './simMarketDemandEngine';

export type MarketMicroAdjustResult = {
  ran: boolean;
  virtualPopulation: number;
  sampleCount: number;
  observedCreditsPerHour: number;
  targetCreditsPerHour: number;
  adjustments: Partial<Record<string, number>>;
};

export async function runMarketMicroAdjustPass(): Promise<MarketMicroAdjustResult> {
  const store = useEconomyPriceOverlayStore.getState();
  if (!store.hydrated) {
    await store.loadAsync();
  }

  const sim = runVirtualMarketDemandSim();
  const maxStep = getEconomyPriceMicroPolicyNum('max_daily_price_step_pct', 3) / 100;
  const maxDrift = getEconomyPriceMicroPolicyNum('max_cumulative_price_drift_pct', 12) / 100;

  const macroGain = sim.observedCreditsPerHour > 0 && sim.targetCreditsPerHour > 0
    ? Math.max(0.06, Math.min(0.12, 0.08 * (sim.targetCreditsPerHour / sim.observedCreditsPerHour)))
    : 0.08;

  const adjustments: Partial<Record<string, number>> = {};

  for (const key of ECONOMY_CATEGORY_KEYS) {
    const pressure = sim.categoryPressures[key];
    const target = pressureToTargetMultiplier(pressure, macroGain);
    store.applyCategoryStep(key, target, maxStep, maxDrift);
    adjustments[key] = useEconomyPriceOverlayStore.getState().multipliers[key];
  }

  store.markAdjust(sim.virtualPopulation);
  await store.persistAsync();

  if (__DEV__) {
    console.log(
      `[ArcCore/Economy] market micro-adjust pop=${sim.virtualPopulation} sample=${sim.sampleCount}`,
      adjustments,
    );
  }

  return {
    ran: true,
    virtualPopulation: sim.virtualPopulation,
    sampleCount: sim.sampleCount,
    observedCreditsPerHour: sim.observedCreditsPerHour,
    targetCreditsPerHour: sim.targetCreditsPerHour,
    adjustments,
  };
}
