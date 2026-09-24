import { UnidentifiedAnomalyPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';

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
