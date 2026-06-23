// ============================================================
// 내구도 밸런스 정책 — Table-First (balance CSV)
// ============================================================

import {
  CapitalShipDurabilityPolicy_FROM_BALANCE_CSV,
  ItemDurabilityWearPolicy_FROM_BALANCE_CSV,
} from '../../data/balance/generated';

export interface CapitalShipDurabilityPolicyRow {
  policyKey: string;
  wearMinPct: number;
  wearMaxPct: number;
  repairCostRatio: number;
  repairFloorCredits: number;
}

export interface ItemDurabilityWearPolicyRow {
  itemDefId: string;
  wearCenterPct: number;
  wearVariancePct: number;
}

function parseNum(raw: unknown, fallback: number): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

const DEFAULT_CAPITAL_POLICY: CapitalShipDurabilityPolicyRow = {
  policyKey: 'default',
  wearMinPct: 0.2,
  wearMaxPct: 0.8,
  repairCostRatio: 0.10,
  repairFloorCredits: 500,
};

const DEFAULT_ITEM_WEAR: ItemDurabilityWearPolicyRow = {
  itemDefId: '__default__',
  wearCenterPct: 0.1,
  wearVariancePct: 0.03,
};

let capitalPolicyCache: CapitalShipDurabilityPolicyRow | null = null;
let itemWearMapCache: Map<string, ItemDurabilityWearPolicyRow> | null = null;

export function getCapitalShipDurabilityPolicy(): CapitalShipDurabilityPolicyRow {
  if (capitalPolicyCache) return capitalPolicyCache;
  const rows = CapitalShipDurabilityPolicy_FROM_BALANCE_CSV as unknown as Record<string, string>[];
  const row = rows.find((r) => r.policyKey === 'default') ?? rows[0];
  if (!row) {
    capitalPolicyCache = DEFAULT_CAPITAL_POLICY;
    return capitalPolicyCache;
  }
  capitalPolicyCache = {
    policyKey: String(row.policyKey ?? 'default'),
    wearMinPct: parseNum(row.wearMinPct, DEFAULT_CAPITAL_POLICY.wearMinPct),
    wearMaxPct: parseNum(row.wearMaxPct, DEFAULT_CAPITAL_POLICY.wearMaxPct),
    repairCostRatio: parseNum(row.repairCostRatio, DEFAULT_CAPITAL_POLICY.repairCostRatio),
    repairFloorCredits: parseNum(row.repairFloorCredits, DEFAULT_CAPITAL_POLICY.repairFloorCredits),
  };
  return capitalPolicyCache;
}

function buildItemWearMap(): Map<string, ItemDurabilityWearPolicyRow> {
  const map = new Map<string, ItemDurabilityWearPolicyRow>();
  const rows = ItemDurabilityWearPolicy_FROM_BALANCE_CSV as unknown as Record<string, string>[];
  for (const row of rows) {
    const itemDefId = String(row.itemDefId ?? '').trim();
    if (!itemDefId) continue;
    map.set(itemDefId, {
      itemDefId,
      wearCenterPct: parseNum(row.wearCenterPct, DEFAULT_ITEM_WEAR.wearCenterPct),
      wearVariancePct: parseNum(row.wearVariancePct, DEFAULT_ITEM_WEAR.wearVariancePct),
    });
  }
  if (!map.has('__default__')) {
    map.set('__default__', DEFAULT_ITEM_WEAR);
  }
  return map;
}

function getItemWearMap(): Map<string, ItemDurabilityWearPolicyRow> {
  if (!itemWearMapCache) itemWearMapCache = buildItemWearMap();
  return itemWearMapCache;
}

function hashItemDefId(itemDefId: string): number {
  let h = 0;
  for (let i = 0; i < itemDefId.length; i += 1) {
    h = (h * 31 + itemDefId.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** 무기·장비 1회 전투 마모(%p). CSV 오버라이드 없으면 itemDefId 해시로 ±variance 분산 */
export function resolveItemWearPerCombatPct(itemDefId: string): number {
  const map = getItemWearMap();
  const row = map.get(itemDefId) ?? map.get('__default__') ?? DEFAULT_ITEM_WEAR;
  const variance = Math.max(0, row.wearVariancePct);
  if (variance <= 0) return row.wearCenterPct;
  const bucket = hashItemDefId(itemDefId) % 7;
  const offset = (bucket - 3) * (variance / 3);
  return Math.max(0.01, row.wearCenterPct + offset);
}

/** 전함 선체 1회 전투 마모(%p) — combat seed 기반 난수 */
export function rollCapitalShipWearPerCombatPct(seed: number): number {
  const policy = getCapitalShipDurabilityPolicy();
  const min = Math.min(policy.wearMinPct, policy.wearMaxPct);
  const max = Math.max(policy.wearMinPct, policy.wearMaxPct);
  if (max <= min) return min;
  const t = Math.abs(Math.sin(seed * 12.9898) * 43758.5453) % 1;
  return min + t * (max - min);
}
