// ============================================================
// AGDS Insight Engine — `4.Autonomous_Game_Development_System_Spec.md` §1
// ============================================================

import { LevelBandTargets_FROM_BALANCE_CSV } from '../../../data/balance/generated';
import type { AabsDriftReport } from '../aabsConstants';

export type AgdsLogicInput = {
  generatedAt: string;
  policySource: 'level_band_targets.csv';
  drifts: Array<{
    key: string;
    target: number;
    observed: number;
    gapPercent: number;
    severity: string;
    decision: 'adjust_multiplier' | 'adjust_table' | 'code_change';
  }>;
  bands: typeof LevelBandTargets_FROM_BALANCE_CSV;
};

export function buildAgdsLogicInput(drifts: AabsDriftReport[]): AgdsLogicInput {
  return {
    generatedAt: new Date().toISOString(),
    policySource: 'level_band_targets.csv',
    drifts: drifts.map((d) => ({
      key: d.key,
      target: d.target,
      observed: d.observed,
      gapPercent: Math.round(d.gapRatio * 1000) / 10,
      severity: d.severity,
      decision: decideAgdsAction(d),
    })),
    bands: LevelBandTargets_FROM_BALANCE_CSV,
  };
}

function decideAgdsAction(drift: AabsDriftReport): AgdsLogicInput['drifts'][number]['decision'] {
  if (Math.abs(drift.gapRatio) <= 0.15) return 'adjust_multiplier';
  if (Math.abs(drift.gapRatio) <= 0.35) return 'adjust_table';
  return 'code_change';
}

export function analyzeLogicInput(input: AgdsLogicInput): {
  needsCodeChange: boolean;
  needsTablePatch: boolean;
  needsMultiplierOnly: boolean;
} {
  const decisions = input.drifts.map((d) => d.decision);
  return {
    needsCodeChange: decisions.includes('code_change'),
    needsTablePatch: decisions.includes('adjust_table'),
    needsMultiplierOnly: decisions.every((d) => d === 'adjust_multiplier'),
  };
}
