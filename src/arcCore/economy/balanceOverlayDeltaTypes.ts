// ============================================================
// Macro economy SIM → 앱 overlay ingest 계약 (schema v1)
// ============================================================

import type { AabsMultiplierKey } from '../aabs/aabsConstants';
import type { EconomyCategoryKey } from './economyPriceOverlayStore';

export const BALANCE_OVERLAY_DELTA_SCHEMA_VERSION = 1 as const;

export type EconomySimKpiStatus = 'ok' | 'warn' | 'critical';

export type EconomySimMacroKpi = {
  f2pAvgPower: number;
  dolphinAvgPower: number;
  whaleAvgPower: number;
  whaleToF2pPowerRatio: number;
  status: EconomySimKpiStatus;
};

export type BalanceOverlayDelta = {
  schemaVersion: typeof BALANCE_OVERLAY_DELTA_SCHEMA_VERSION;
  /** ingest 중복 방지 — SIM 실행마다 갱신 */
  deltaId: string;
  generatedAt: string;
  simDays: number;
  virtualPopulation: number;
  /** 0..1 — 전투 layer 미완 시 0, combat AABS knob ingest 생략 */
  combatWeight: number;
  kpi: EconomySimMacroKpi;
  categoryTargetMul: Partial<Record<EconomyCategoryKey, number>>;
  aabsTargetMul: Partial<Record<AabsMultiplierKey, number>>;
};
