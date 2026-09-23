import { StelliumColonizePolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';
import {
  STELLIUM_COLONIZE_FACTION_ID,
  STELLIUM_COLONIZE_ORIGIN,
  STELLIUM_COLONIZE_POLICY_FISCAL_DEFAULTS,
  type StelliumColonizePolicy,
  type StelliumColonizeVaultKey,
} from './stelliumColonizeTypes';

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

const FALLBACK_POLICY: StelliumColonizePolicy = {
  factionId: STELLIUM_COLONIZE_FACTION_ID,
  enabled: true,
  concurrentInFlightCap: 3,
  hopDays1: 1,
  hopDays2: 2,
  hopDays3Plus: 3,
  attempt1MinPct: 50,
  attempt1MaxPct: 70,
  attempt2MinPct: 60,
  attempt2MaxPct: 80,
  attempt3MinPct: 70,
  attempt3MaxPct: 90,
  successCapPct: 95,
  originTag: STELLIUM_COLONIZE_ORIGIN,
  holdOccupierClanId: 'balance_seed_faction_blue',
  outpostArriveSec: 300,
  baseShipCount: 1,
  baseSpeedMul: 1,
  maxShipCount: 3,
  handoffSec: 300,
  requireDefenseSatLevel: 1,
  aiAutomated: true,
  requireShipTable: false,
  requireCaptain: false,
  ...STELLIUM_COLONIZE_POLICY_FISCAL_DEFAULTS,
};

function parseVaultKey(raw: string | undefined): StelliumColonizeVaultKey {
  const s = String(raw ?? '').trim().toLowerCase();
  if (s === 'arccore_vault' || s === 'arccore' || s === 'red') return 'arccore_vault';
  return 'blue_team';
}

let cached: StelliumColonizePolicy | null = null;

export function resolveStelliumColonizePolicy(): StelliumColonizePolicy {
  if (cached) return cached;
  const row = StelliumColonizePolicy_FROM_BALANCE_CSV.find(
    (r) => String(r.factionId ?? '').trim() === STELLIUM_COLONIZE_FACTION_ID,
  ) ?? StelliumColonizePolicy_FROM_BALANCE_CSV[0];
  if (!row) {
    cached = FALLBACK_POLICY;
    return cached;
  }
  cached = {
    factionId: String(row.factionId ?? STELLIUM_COLONIZE_FACTION_ID).trim() || STELLIUM_COLONIZE_FACTION_ID,
    enabled: parseBool(row.enabled),
    concurrentInFlightCap: Math.max(1, Math.floor(parseNum(row.concurrentInFlightCap, 3))),
    hopDays1: Math.max(1, Math.floor(parseNum(row.hopDays1, 1))),
    hopDays2: Math.max(1, Math.floor(parseNum(row.hopDays2, 2))),
    hopDays3Plus: Math.max(1, Math.floor(parseNum(row.hopDays3Plus, 3))),
    attempt1MinPct: parseNum(row.attempt1MinPct, 50),
    attempt1MaxPct: parseNum(row.attempt1MaxPct, 70),
    attempt2MinPct: parseNum(row.attempt2MinPct, 60),
    attempt2MaxPct: parseNum(row.attempt2MaxPct, 80),
    attempt3MinPct: parseNum(row.attempt3MinPct, 70),
    attempt3MaxPct: parseNum(row.attempt3MaxPct, 90),
    successCapPct: parseNum(row.successCapPct, 95),
    originTag: STELLIUM_COLONIZE_ORIGIN,
    holdOccupierClanId: String(row.holdOccupierClanId ?? 'balance_seed_faction_blue').trim()
      || 'balance_seed_faction_blue',
    outpostArriveSec: Math.max(30, Math.floor(parseNum(row.outpostArriveSec, 300))),
    baseShipCount: Math.max(1, Math.floor(parseNum(row.baseShipCount, 1))),
    baseSpeedMul: Math.max(1, parseNum(row.baseSpeedMul, 1)),
    maxShipCount: Math.max(1, Math.min(8, Math.floor(parseNum(row.maxShipCount, 3)))),
    handoffSec: Math.max(0, Math.floor(parseNum(row.handoffSec, 300))),
    requireDefenseSatLevel: Math.max(0, Math.min(15, Math.floor(parseNum(row.requireDefenseSatLevel, 1)))),
    aiAutomated: parseBool(row.aiAutomated, true),
    requireShipTable: parseBool(row.requireShipTable, false),
    requireCaptain: parseBool(row.requireCaptain, false),
    hullOutfittingCredits: Math.max(0, Math.floor(parseNum(
      row.hullOutfittingCredits,
      STELLIUM_COLONIZE_POLICY_FISCAL_DEFAULTS.hullOutfittingCredits,
    ))),
    opexCreditsPerShipDay: Math.max(0, Math.floor(parseNum(
      row.opexCreditsPerShipDay,
      STELLIUM_COLONIZE_POLICY_FISCAL_DEFAULTS.opexCreditsPerShipDay,
    ))),
    attemptCreditsPerHopDay: Math.max(0, Math.floor(parseNum(
      row.attemptCreditsPerHopDay,
      STELLIUM_COLONIZE_POLICY_FISCAL_DEFAULTS.attemptCreditsPerHopDay,
    ))),
    successBondCredits: Math.max(0, Math.floor(parseNum(
      row.successBondCredits,
      STELLIUM_COLONIZE_POLICY_FISCAL_DEFAULTS.successBondCredits,
    ))),
    requirePrepaidEnqueue: parseBool(row.requirePrepaidEnqueue, true),
    chargeVaultKey: parseVaultKey(row.chargeVaultKey),
    loanEnabled: parseBool(row.loanEnabled, true),
  };
  return cached;
}

export function createStelliumColonizePolicyForTest(
  over: Partial<StelliumColonizePolicy> = {},
): StelliumColonizePolicy {
  return { ...FALLBACK_POLICY, ...over };
}

export function resetStelliumColonizePolicyCacheForTest(): void {
  cached = null;
}
