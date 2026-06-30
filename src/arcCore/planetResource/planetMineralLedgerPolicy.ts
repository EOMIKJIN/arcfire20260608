// ============================================================
// planet_mineral_ledger_policy.csv — 궤도 채굴 광물 allowance (일일)
//
// 기획: 광물 = 아크파이어 기초 재화이나 행성 R(자원) 5대 지표 전체를 대변하지 않음.
// R 은 복합 시스템(구현·미구현 자원 병렬) — 광물은 그 중 채굴 가능 광맥 층만.
// allowance = mineral_pool_base + (R/100) × mineral_r_scale × mineral_r_influence_pct
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
  /** R 과 무관한 광물 전용 기초 풀 */
  mineralPoolBaseUnits: number;
  /** R 선형항에 곱하는 부분 반영률 (0..1, 1=R 100% 치환 아님을 명시) */
  mineralRInfluencePct: number;
  /** R=100·influence=1 일 때 추가 가능한 상한 스케일 */
  mineralRScaleUnits: number;
  dailyRegenPct: number;
  miningReserveFloorUnits: number;
  persistCoalesceMs: number;
};

export function resolvePlanetMineralLedgerPolicy(): PlanetMineralLedgerPolicy {
  const legacyBase = Math.max(0, Math.floor(num('reserve_base_units', 80)));
  const legacyScale = Math.max(0, Math.floor(num('reserve_r_scale', 220)));
  return {
    enabled: bool('enabled', true),
    mineralPoolBaseUnits: Math.max(
      0,
      Math.floor(num('mineral_pool_base_units', legacyBase * 5)),
    ),
    mineralRInfluencePct: Math.max(
      0,
      Math.min(1, num('mineral_r_influence_pct', 0.5)),
    ),
    mineralRScaleUnits: Math.max(
      0,
      Math.floor(num('mineral_r_scale_units', legacyScale * 10)),
    ),
    dailyRegenPct: Math.max(0, Math.min(1, num('daily_regen_pct', 0.18))),
    miningReserveFloorUnits: Math.max(0, Math.floor(num('mining_reserve_floor_units', 5))),
    persistCoalesceMs: Math.max(500, Math.floor(num('persist_coalesce_ms', 1500))),
  };
}

/**
 * 궤도 채굴 일일 allowance 상한 — R 부분 반영 + 광물 전용 기초 풀.
 * R=50 예: 400 + 0.5×2200×0.5 ≈ 950 (구 R=단순치환 190 대비 ~5×).
 */
export function resolvePlanetMineralReserveMaxUnits(resourceStat: number): number {
  const policy = resolvePlanetMineralLedgerPolicy();
  const r = Math.max(0, Math.min(100, Math.round(Number.isFinite(resourceStat) ? resourceStat : 0)));
  const rContribution = (r / 100) * policy.mineralRScaleUnits * policy.mineralRInfluencePct;
  return Math.max(
    policy.miningReserveFloorUnits + 1,
    Math.floor(policy.mineralPoolBaseUnits + rContribution),
  );
}
