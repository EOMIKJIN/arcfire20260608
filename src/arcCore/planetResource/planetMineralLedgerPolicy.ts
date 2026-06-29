// ============================================================
// planet_mineral_ledger_policy.csv — 행성 광물 레저(매장 잔량)
// ============================================================

import { PlanetMineralLedgerPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';

let kv: Map<string, string> | null = null;

function getKv(): Map<string, string> {
  if (!kv) {
    kv = new Map(
      PlanetMineralLedgerPolicy_FROM_BALANCE_CSV.map((row) => [row.key, row.value] as const),
    );
  }
  return kv;
}

function num(key: string, fallback: number): number {
  const n = Number(getKv().get(key));
  return Number.isFinite(n) ? n : fallback;
}

function bool(key: string, fallback: boolean): boolean {
  const raw = String(getKv().get(key) ?? '').trim().toLowerCase();
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return fallback;
}

export type PlanetMineralLedgerPolicy = {
  enabled: boolean;
  reserveBaseUnits: number;
  reserveRScale: number;
  dailyRegenPct: number;
  miningReserveFloorUnits: number;
  persistCoalesceMs: number;
};

export function resolvePlanetMineralLedgerPolicy(): PlanetMineralLedgerPolicy {
  return {
    enabled: bool('enabled', true),
    reserveBaseUnits: Math.max(0, Math.floor(num('reserve_base_units', 80))),
    reserveRScale: Math.max(0, Math.floor(num('reserve_r_scale', 220))),
    dailyRegenPct: Math.max(0, Math.min(1, num('daily_regen_pct', 0.18))),
    miningReserveFloorUnits: Math.max(0, Math.floor(num('mining_reserve_floor_units', 5))),
    persistCoalesceMs: Math.max(500, Math.floor(num('persist_coalesce_ms', 1500))),
  };
}

/** R(0..100) → 행성 매장 상한 단위 */
export function resolvePlanetMineralReserveMaxUnits(resourceStat: number): number {
  const policy = resolvePlanetMineralLedgerPolicy();
  const r = Math.max(0, Math.min(100, Math.round(Number.isFinite(resourceStat) ? resourceStat : 0)));
  return Math.max(
    policy.miningReserveFloorUnits + 1,
    Math.floor(policy.reserveBaseUnits + (r / 100) * policy.reserveRScale),
  );
}
