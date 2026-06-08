// ============================================================
// Growth Sync + Economic Executor — AABS §2-B, §2-C
// ============================================================

import type { SimBotAggregate } from './simBotEngine';
import { useAabsPolicyStore } from './aabsPolicyStore';
import type { AabsMultiplierKey } from './aabsConstants';

export function applyGrowthSyncFromSim(sim: SimBotAggregate): void {
  const store = useAabsPolicyStore.getState();
  if (store.safeModeEnabled) return;

  for (const drift of sim.driftReports) {
    const current = store.multipliers[drift.key] ?? 1;
    let target = current;
    if (drift.gapRatio > 0) {
      target = current * (1 - Math.min(0.05, Math.abs(drift.gapRatio) * 0.1));
    } else if (drift.gapRatio < 0) {
      target = current * (1 + Math.min(0.05, Math.abs(drift.gapRatio) * 0.1));
    }
    store.applyStepToward(drift.key, target);
  }

  store.setCriticalDriftFlags(sim.criticalDriftKeys);
}

export function syncEconomicMultipliers(): void {
  const store = useAabsPolicyStore.getState();
  if (store.safeModeEnabled) return;
  const credit = store.multipliers.creditReward ?? 1;
  store.applyStepToward('tradeIncome', credit);
  store.applyStepToward('miningYield', Math.max(0.85, Math.min(1.15, credit * 0.98)));
}

export function isAabsAdjustmentAllowedForItem(_itemId: string): boolean {
  return true;
}

export function summarizeMultiplierAdjustments(): Record<AabsMultiplierKey, number> {
  return { ...useAabsPolicyStore.getState().multipliers };
}
