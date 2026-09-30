// ============================================================
// 군사령부 정책 — tables/balance/planet_military_command_policy.csv
// 방위위성 CSV·요격·inbound 와 분리
// ============================================================

import { PlanetMilitaryCommandPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';

export type PlanetMilitaryCommandPolicy = {
  doctrineAdvantageL1: number;
  doctrineAdvantageL15: number;
  doctrineAdvantageCap: number;
  logisticsUpkeepDiscountCapPct: number;
  hqUpkeepJointCapPct: number;
  statOffsetDL15: number;
  statOffsetTL15: number;
  statOffsetRL15: number;
  statOffsetPL15: number;
  statOffsetEL15: number;
  statOffsetFloor: number;
  patrolDotCount: number;
  patrolCycleMs: number;
};

const FALLBACK: PlanetMilitaryCommandPolicy = {
  doctrineAdvantageL1: 0.4,
  doctrineAdvantageL15: 6,
  doctrineAdvantageCap: 6,
  logisticsUpkeepDiscountCapPct: 12,
  hqUpkeepJointCapPct: 22,
  statOffsetDL15: 2,
  statOffsetTL15: 1.5,
  statOffsetRL15: -1,
  statOffsetPL15: -1,
  statOffsetEL15: -1.2,
  statOffsetFloor: 8,
  patrolDotCount: 6,
  patrolCycleMs: 16_000,
};

function parseNum(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

let cached: PlanetMilitaryCommandPolicy | null = null;

export function resolvePlanetMilitaryCommandPolicy(): PlanetMilitaryCommandPolicy {
  if (cached) return cached;
  const map = new Map<string, string>();
  for (const row of PlanetMilitaryCommandPolicy_FROM_BALANCE_CSV) {
    map.set(String(row.key ?? '').trim(), String(row.value ?? ''));
  }
  cached = {
    doctrineAdvantageL1: parseNum(map.get('doctrine_advantage_l1'), FALLBACK.doctrineAdvantageL1),
    doctrineAdvantageL15: parseNum(map.get('doctrine_advantage_l15'), FALLBACK.doctrineAdvantageL15),
    doctrineAdvantageCap: parseNum(map.get('doctrine_advantage_cap'), FALLBACK.doctrineAdvantageCap),
    logisticsUpkeepDiscountCapPct: parseNum(
      map.get('logistics_upkeep_discount_cap_pct'),
      FALLBACK.logisticsUpkeepDiscountCapPct,
    ),
    hqUpkeepJointCapPct: parseNum(map.get('hq_upkeep_joint_cap_pct'), FALLBACK.hqUpkeepJointCapPct),
    statOffsetDL15: parseNum(map.get('stat_offset_d_l15'), FALLBACK.statOffsetDL15),
    statOffsetTL15: parseNum(map.get('stat_offset_t_l15'), FALLBACK.statOffsetTL15),
    statOffsetRL15: parseNum(map.get('stat_offset_r_l15'), FALLBACK.statOffsetRL15),
    statOffsetPL15: parseNum(map.get('stat_offset_p_l15'), FALLBACK.statOffsetPL15),
    statOffsetEL15: parseNum(map.get('stat_offset_e_l15'), FALLBACK.statOffsetEL15),
    statOffsetFloor: parseNum(map.get('stat_offset_floor'), FALLBACK.statOffsetFloor),
    patrolDotCount: Math.max(1, Math.floor(parseNum(map.get('patrol_dot_count'), FALLBACK.patrolDotCount))),
    patrolCycleMs: Math.max(1000, Math.floor(parseNum(map.get('patrol_cycle_ms'), FALLBACK.patrolCycleMs))),
  };
  return cached;
}

export function resetPlanetMilitaryCommandPolicyCacheForTest(): void {
  cached = null;
}

export function interpolateMilitaryCommandLevel(level: number, l1: number, l15: number): number {
  const lv = Math.max(0, Math.floor(level));
  if (lv <= 0) return 0;
  if (lv >= 15) return l15;
  if (lv === 1) return l1;
  return l1 + ((l15 - l1) * (lv - 1)) / 14;
}

export function scaleMilitaryCommandToLevel(level: number, l15: number): number {
  const lv = Math.max(0, Math.min(15, Math.floor(level)));
  if (lv <= 0) return 0;
  return (l15 * lv) / 15;
}
