// ============================================================
// Guardian Mode — AGDS §단계 5 · AABS §4 Safe Mode
// ============================================================

import { AABS_GUARDIAN_INFLATION_THRESHOLD } from './aabsConstants';
import { useAabsPolicyStore } from './aabsPolicyStore';
import type { SimBotAggregate } from './simBotEngine';

export type GuardianVerdict = {
  triggered: boolean;
  reason: string;
};

export function evaluateGuardianMode(sim: SimBotAggregate): GuardianVerdict {
  const creditDrift = sim.driftReports.find((d) => d.key === 'creditReward');
  if (creditDrift && creditDrift.gapRatio >= AABS_GUARDIAN_INFLATION_THRESHOLD) {
    return { triggered: true, reason: 'credit_inflation_critical' };
  }
  if (sim.criticalDriftKeys.length >= 2) {
    return { triggered: true, reason: 'multi_axis_critical_drift' };
  }
  return { triggered: false, reason: 'ok' };
}

export function activateGuardianSafeMode(reason: string): void {
  const store = useAabsPolicyStore.getState();
  store.setSafeMode(true);
  store.resetToBaseline();
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    // eslint-disable-next-line no-console
    console.warn('[AABS Guardian] safe mode ON:', reason);
  }
}
