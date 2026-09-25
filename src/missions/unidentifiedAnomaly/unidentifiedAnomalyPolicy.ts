import { UnidentifiedAnomalyPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';
import { planetAttackKstDayKey } from '../../arcCore/planetAttack/planetAttackKstDayKey';

export type UnidentifiedAnomalyPayloadKind = 'relic' | 'threat';

export type UnidentifiedAnomalyPolicy = {
  concurrent: number;
  dailySpawn: number;
  unacceptedTtlHours: number;
  questRelicSalvagePct: number;
  payloadRelicWeightPct: number;
  payloadThreatWeightPct: number;
  threatTclAdd: number;
  cooldownDays: number;
  historyCap: number;
  bandWeightEarly: number;
  bandWeightMidEarly: number;
  bandWeightMid: number;
  bandWeightLate: number;
  baseSpawnChancePct: number;
};

let policyKv: Map<string, string> | null = null;
let policyTestOverride: Partial<UnidentifiedAnomalyPolicy> | null = null;

function num(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function getPolicyKv(): Map<string, string> {
  if (!policyKv) {
    policyKv = new Map(
      UnidentifiedAnomalyPolicy_FROM_BALANCE_CSV.map((row) => [row.key, row.value] as const),
    );
  }
  return policyKv;
}

export function resolveUnidentifiedAnomalyPolicy(): UnidentifiedAnomalyPolicy {
  const kv = getPolicyKv();
  const resolved: UnidentifiedAnomalyPolicy = {
    concurrent: Math.max(1, Math.floor(num(kv.get('concurrent'), 1))),
    dailySpawn: Math.max(1, Math.floor(num(kv.get('daily_spawn'), 2))),
    unacceptedTtlHours: Math.max(1, Math.floor(num(kv.get('unaccepted_ttl_hours'), 12))),
    questRelicSalvagePct: Math.max(0, Math.min(100, Math.floor(num(kv.get('quest_relic_salvage_pct'), 30)))),
    payloadRelicWeightPct: Math.max(0, Math.min(100, Math.floor(num(kv.get('payload_relic_weight_pct'), 50)))),
    payloadThreatWeightPct: Math.max(0, Math.min(100, Math.floor(num(kv.get('payload_threat_weight_pct'), 50)))),
    threatTclAdd: Math.max(0, Math.floor(num(kv.get('threat_tcl_add'), 15))),
    cooldownDays: Math.max(0, Math.floor(num(kv.get('cooldown_days'), 3))),
    historyCap: Math.max(1, Math.floor(num(kv.get('history_cap'), 8))),
    bandWeightEarly: Math.max(0, Math.floor(num(kv.get('band_weight_early'), 0))),
    bandWeightMidEarly: Math.max(0, Math.floor(num(kv.get('band_weight_mid_early'), 1))),
    bandWeightMid: Math.max(0, Math.floor(num(kv.get('band_weight_mid'), 3))),
    bandWeightLate: Math.max(0, Math.floor(num(kv.get('band_weight_late'), 8))),
    baseSpawnChancePct: Math.max(0, Math.min(100, Math.floor(num(kv.get('base_spawn_chance_pct'), 100)))),
  };
  return policyTestOverride ? { ...resolved, ...policyTestOverride } : resolved;
}

/** 단위테스트 전용. 런타임·틱에서 호출 금지. */
export function setUnidentifiedAnomalyPolicyForTest(
  override: Partial<UnidentifiedAnomalyPolicy> | null,
): void {
  policyTestOverride = override;
}

export function invalidateUnidentifiedAnomalyPolicyCache(): void {
  policyKv = null;
}

export function hash32(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function rollAnomalyPayloadKind(
  instanceId: string,
  relicWeightPct = resolveUnidentifiedAnomalyPolicy().payloadRelicWeightPct,
): UnidentifiedAnomalyPayloadKind {
  const weight = Math.max(0, Math.min(100, Math.floor(relicWeightPct)));
  return hash32(`spawn:${instanceId}`) % 100 < weight ? 'relic' : 'threat';
}

export function anomalyKstDayKey(nowMs = Date.now()): string {
  return planetAttackKstDayKey(nowMs);
}

export function nextAnomalyKstMidnightMs(nowMs: number): number {
  const today = anomalyKstDayKey(nowMs);
  let lo = nowMs + 1;
  let hi = nowMs + 36 * 60 * 60 * 1000;
  if (anomalyKstDayKey(hi) === today) hi += 12 * 60 * 60 * 1000;
  while (hi - lo > 250) {
    const mid = Math.floor((lo + hi) / 2);
    if (anomalyKstDayKey(mid) === today) lo = mid + 1;
    else hi = mid;
  }
  return hi;
}

export function addAnomalyDayKeyDays(dayKey: string, days: number): string {
  const parts = dayKey.trim().split('-');
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return dayKey.trim();
  const utc = Date.UTC(y, m - 1, d + Math.floor(days));
  const dt = new Date(utc);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function resolveAnomalyBandWeight(
  sectorBand: string,
  policy = resolveUnidentifiedAnomalyPolicy(),
): number {
  switch (String(sectorBand ?? '').trim()) {
    case 'early':
      return policy.bandWeightEarly;
    case 'mid_early':
      return policy.bandWeightMidEarly;
    case 'mid':
      return policy.bandWeightMid;
    case 'late':
      return policy.bandWeightLate;
    default:
      return 0;
  }
}

export function resolveAnomalyBandWeightSum(
  policy = resolveUnidentifiedAnomalyPolicy(),
): number {
  return (
    policy.bandWeightEarly
    + policy.bandWeightMidEarly
    + policy.bandWeightMid
    + policy.bandWeightLate
  );
}

/** 정본 주사위: baseSpawnChancePct × 밴드 가중 / 가중합 */
export function resolveAnomalyIdentifyChancePct(
  sectorBand: string,
  policy = resolveUnidentifiedAnomalyPolicy(),
): number {
  const sum = resolveAnomalyBandWeightSum(policy);
  const weight = resolveAnomalyBandWeight(sectorBand, policy);
  if (sum <= 0 || weight <= 0) return 0;
  return Math.floor((policy.baseSpawnChancePct * weight) / sum);
}

export function rollAnomalyIdentifySuccess(
  planetId: string,
  sectorBand: string,
  dayKey: string,
  policy = resolveUnidentifiedAnomalyPolicy(),
): boolean {
  const chance = resolveAnomalyIdentifyChancePct(sectorBand, policy);
  if (chance <= 0) return false;
  return hash32(`identify:${planetId}:${dayKey}`) % 100 < chance;
}

export function resolveAnomalyUnacceptedTtlMs(
  policy = resolveUnidentifiedAnomalyPolicy(),
): number {
  return Math.max(1, policy.unacceptedTtlHours) * 60 * 60 * 1000;
}

export function isAnomalyPlanetOnCooldown(
  resolvedAtMs: number,
  nowMs: number,
  cooldownDays = resolveUnidentifiedAnomalyPolicy().cooldownDays,
): boolean {
  if (cooldownDays <= 0) return false;
  if (!Number.isFinite(resolvedAtMs) || !Number.isFinite(nowMs)) return false;
  const until = addAnomalyDayKeyDays(anomalyKstDayKey(resolvedAtMs), cooldownDays);
  return anomalyKstDayKey(nowMs) < until;
}
