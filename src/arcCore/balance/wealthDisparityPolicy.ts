// ============================================================
// arc_core_wealth_disparity_policy.csv · population_dome_wdi_stability.csv
// planet_rebellion_resolution.csv
// ============================================================

import {
  ArcCoreWealthDisparityPolicy_FROM_BALANCE_CSV,
  PlanetRebellionResolution_FROM_BALANCE_CSV,
  PopulationDomeWdiStability_FROM_BALANCE_CSV,
} from '../../data/balance/generated';
import type { MapFactionSide } from '../../galaxyMap/mapFactionSideCore';

let policyKv: Map<string, string> | null = null;
let rebellionKv: Map<string, string> | null = null;
let domeStabilityByLevel: Map<number, number> | null = null;

function getPolicyKv(): Map<string, string> {
  if (!policyKv) {
    policyKv = new Map(
      ArcCoreWealthDisparityPolicy_FROM_BALANCE_CSV.map((row) => [row.key, row.value] as const),
    );
  }
  return policyKv;
}

function getRebellionKv(): Map<string, string> {
  if (!rebellionKv) {
    rebellionKv = new Map(
      PlanetRebellionResolution_FROM_BALANCE_CSV.map((row) => [row.key, row.value] as const),
    );
  }
  return rebellionKv;
}

function getDomeStabilityByLevel(): Map<number, number> {
  if (!domeStabilityByLevel) {
    domeStabilityByLevel = new Map(
      PopulationDomeWdiStability_FROM_BALANCE_CSV.map((row) => [
        Math.max(0, Math.min(15, Math.floor(Number(row.level)))),
        Math.max(0, Number(row.wdi_reduction_per_day) || 0),
      ] as const),
    );
  }
  return domeStabilityByLevel;
}

function policyNum(kv: Map<string, string>, key: string, fallback: number): number {
  const n = Number(kv.get(key));
  return Number.isFinite(n) ? n : fallback;
}

function policyBool(kv: Map<string, string>, key: string, fallback: boolean): boolean {
  const raw = String(kv.get(key) ?? '').trim().toLowerCase();
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return fallback;
}

export type WealthDisparityGlobalPolicy = {
  enabled: boolean;
  wdiUnrestMin: number;
  wdiDangerMin: number;
  naturalDecayPerDay: number;
  maxDailyWdiRise: number;
  maxDailyWdiFall: number;
  pDeclineVsBaselineWeight: number;
  attackEventWeight: number;
  spyEventWeight: number;
  contestedAftermathPopGapWeight: number;
  fiscalDeficitWeight: number;
  postOverthrowDecayPerDay: number;
  simmeringRecoveryWdiMax: number;
};

export type RebellionResolutionPolicy = {
  enabled: boolean;
  overthrowBaseProbAtDanger: number;
  overthrowProbSpanToMax: number;
  overthrowProbMulBlue: number;
  overthrowProbMulRed: number;
  overthrowProbMulNeutral: number;
  simmeringPopPenaltyPerDay: number;
  simmeringResourcePenaltyPerDay: number;
  overthrowWdiOnSuccess: number;
};

export function resolveWealthDisparityGlobalPolicy(): WealthDisparityGlobalPolicy {
  const kv = getPolicyKv();
  return {
    enabled: policyBool(kv, 'enabled', true),
    wdiUnrestMin: Math.max(0, policyNum(kv, 'wdi_unrest_min', 35)),
    wdiDangerMin: Math.max(0, policyNum(kv, 'wdi_danger_min', 70)),
    naturalDecayPerDay: Math.max(0, policyNum(kv, 'natural_decay_per_day', 1.5)),
    maxDailyWdiRise: Math.max(0.5, policyNum(kv, 'max_daily_wdi_rise', 8)),
    maxDailyWdiFall: Math.max(0.5, policyNum(kv, 'max_daily_wdi_fall', 6)),
    pDeclineVsBaselineWeight: Math.max(0, policyNum(kv, 'p_decline_vs_baseline_weight', 0.55)),
    attackEventWeight: Math.max(0, policyNum(kv, 'attack_event_weight', 0.35)),
    spyEventWeight: Math.max(0, policyNum(kv, 'spy_event_weight', 0.9)),
    contestedAftermathPopGapWeight: Math.max(0, policyNum(kv, 'contested_aftermath_pop_gap_weight', 0.08)),
    fiscalDeficitWeight: Math.max(0, policyNum(kv, 'fiscal_deficit_weight', 0.25)),
    postOverthrowDecayPerDay: Math.max(0, policyNum(kv, 'post_overthrow_decay_per_day', 4)),
    simmeringRecoveryWdiMax: Math.max(0, policyNum(kv, 'simmering_recovery_wdi_max', 34)),
  };
}

export function resolveRebellionResolutionPolicy(): RebellionResolutionPolicy {
  const kv = getRebellionKv();
  return {
    enabled: policyBool(kv, 'enabled', true),
    overthrowBaseProbAtDanger: Math.max(0, Math.min(1, policyNum(kv, 'overthrow_base_prob_at_danger', 0.12))),
    overthrowProbSpanToMax: Math.max(0, Math.min(1, policyNum(kv, 'overthrow_prob_span_to_max', 0.22))),
    overthrowProbMulBlue: Math.max(0, policyNum(kv, 'overthrow_prob_mul_blue', 1)),
    overthrowProbMulRed: Math.max(0, policyNum(kv, 'overthrow_prob_mul_red', 0.33)),
    overthrowProbMulNeutral: Math.max(0, policyNum(kv, 'overthrow_prob_mul_neutral', 1)),
    simmeringPopPenaltyPerDay: Math.max(0, policyNum(kv, 'simmering_pop_penalty_per_day', 1)),
    simmeringResourcePenaltyPerDay: Math.max(0, policyNum(kv, 'simmering_resource_penalty_per_day', 1)),
    overthrowWdiOnSuccess: Math.max(70, Math.min(100, policyNum(kv, 'overthrow_wdi_on_success', 100))),
  };
}

export function resolvePopulationDomeWdiReductionPerDay(level: number): number {
  const lv = Math.max(0, Math.min(15, Math.floor(level)));
  return getDomeStabilityByLevel().get(lv) ?? 0;
}

export function resolveRebellionOverthrowProbMul(factionSide: MapFactionSide): number {
  const policy = resolveRebellionResolutionPolicy();
  if (factionSide === 'red') return policy.overthrowProbMulRed;
  if (factionSide === 'blue') return policy.overthrowProbMulBlue;
  return policy.overthrowProbMulNeutral;
}

export function resolveOperatorRebellionAlertCaptainId(): string {
  const raw = String(getPolicyKv().get('operator_captain_id') ?? '').trim();
  return raw || 'npc_cpt_operator_stella';
}

/** 내전(simmering) — 이벤트 발생 즉시 오퍼레이터 대화 (착륙 트리거 없음) */
export function resolveOperatorCivilWarRealtimeAutoOpen(): boolean {
  return policyBool(getPolicyKv(), 'operator_civil_war_realtime_auto_open', true);
}
