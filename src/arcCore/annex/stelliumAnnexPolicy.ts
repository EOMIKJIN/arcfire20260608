// ============================================================
// 스텔리움 편입 정책 — tables/balance/stellium_annex_policy.csv
// ============================================================

import { StelliumAnnexPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';

export type StelliumAnnexVaultKey = 'blue_team';

export type StelliumAnnexPolicy = {
  policyId: string;
  enabled: boolean;
  costCredits: number;
  requireDefenseSatLevel: number;
  chargeVaultKey: StelliumAnnexVaultKey;
  protectNeutralizedMs: number;
  excludePlanetIds: ReadonlySet<string>;
};

const FALLBACK: StelliumAnnexPolicy = {
  policyId: 'stellium_core_v1',
  enabled: false,
  costCredits: 8000,
  requireDefenseSatLevel: 1,
  chargeVaultKey: 'blue_team',
  protectNeutralizedMs: 0,
  excludePlanetIds: new Set(['eternal_throne', 'genesis_origin']),
};

function parseNum(raw: string | number | undefined, fallback: number): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function parseBool(raw: string | boolean | undefined, fallback = false): boolean {
  if (typeof raw === 'boolean') return raw;
  const s = String(raw ?? '').trim().toLowerCase();
  if (s === 'true') return true;
  if (s === 'false') return false;
  return fallback;
}

function parseExcludeIds(raw: string | undefined): ReadonlySet<string> {
  const out = new Set<string>();
  for (const part of String(raw ?? '').split(/[|,]/)) {
    const id = part.trim();
    if (id) out.add(id);
  }
  return out;
}

let cached: StelliumAnnexPolicy | null = null;

export function resolveStelliumAnnexPolicy(): StelliumAnnexPolicy {
  if (cached) return cached;
  const row = StelliumAnnexPolicy_FROM_BALANCE_CSV[0];
  if (!row) {
    cached = FALLBACK;
    return cached;
  }
  cached = {
    policyId: String(row.policyId ?? FALLBACK.policyId).trim() || FALLBACK.policyId,
    enabled: parseBool(row.enabled, false),
    costCredits: Math.max(0, Math.floor(parseNum(row.costCredits, FALLBACK.costCredits))),
    requireDefenseSatLevel: Math.max(0, Math.floor(parseNum(row.requireDefenseSatLevel, 1))),
    chargeVaultKey: 'blue_team',
    protectNeutralizedMs: Math.max(0, Math.floor(parseNum(row.protectNeutralizedMs, FALLBACK.protectNeutralizedMs))),
    excludePlanetIds: parseExcludeIds(row.excludePlanetIds),
  };
  return cached;
}

/** 테스트 전용 — 정책 캐시 리셋 */
export function resetStelliumAnnexPolicyCacheForTest(): void {
  cached = null;
}
