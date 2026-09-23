// ============================================================
// 스텔리움 개척 현금 — 블루 운용 · 현행 상환은 중앙금고 자리표시 (틱 상환 금지)
// 국가 대출 정본: tables/balance/arc_core_sovereign_loan_*.csv
// 향후 대주=군수업체 · 이자·조달중단·점령반환 청산은 고도화(intent_lock). 지금은 원금만.
// trySpend는 마이너스 허용이라 잔고 확인 후에만 깎는다.
// 대출 잔액은 기존 persist 키에 스칼라로만 둔다(월드 축 · purge 제외).
// ============================================================

import { getArcCoreVaultSeedCredits, getBlueTeamVaultSeedCredits } from '../economy/planetUpkeepPolicy';
import { useArcCoreVaultStore } from '../../store/factionVault/arcCoreVaultStore';
import { useBlueTeamSharedVaultStore } from '../../store/factionVault/blueTeamSharedVaultStore';
import type { FactionVaultState } from '../../store/factionVault/createFactionVaultStore';
import {
  isStelliumColonizeActivePhase,
  type StelliumColonizePolicy,
  type StelliumColonizeRecord,
} from './stelliumColonizeTypes';
import {
  canAffordColonizeDepartReserve,
  resolveStelliumColonizeAttemptCredits,
  resolveStelliumColonizeDepartReserveCredits,
  resolveStelliumColonizeHqReserveCredits,
} from './stelliumColonizeCosts';
import { resolveOperationalShipCap } from './stelliumColonizeDispatch';

export const STELLIUM_COLONIZE_FLEET_FISCAL_STORAGE_KEY = 'arcfire_stellium_colonize_fleet_fiscal_v1';

export const STELLIUM_COLONIZE_LOAN_TXN = {
  draw: 'colonize_loan_draw',
  credit: 'colonize_loan_credit',
  proceeds: 'colonize_loan_proceeds',
  repay: 'colonize_loan_repay',
} as const;

export type StelliumColonizeFiscalHooks = {
  canAffordDepart: (planetId: string, travelDays: number) => boolean;
  authorizeDepart: (planetId: string, travelDays: number) => boolean;
  onBeforeHqRoll: (planetId: string, travelDays: number) => boolean;
};

type HullFiscalState = {
  hullsOutfitted: number;
  loanCredits: number;
  lastRepayDayKey: string | null;
};

const EMPTY_FISCAL: HullFiscalState = {
  hullsOutfitted: 0,
  loanCredits: 0,
  lastRepayDayKey: null,
};

let hullState: HullFiscalState = { ...EMPTY_FISCAL };
let hullHydrated = false;
let hullHydratePromise: Promise<void> | null = null;
let hullPersistTimer: ReturnType<typeof setTimeout> | null = null;

function getAsyncStorage(): {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
} | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@react-native-async-storage/async-storage') as {
      default?: { getItem: (k: string) => Promise<string | null>; setItem: (k: string, v: string) => Promise<void> };
      getItem?: (k: string) => Promise<string | null>;
      setItem?: (k: string, v: string) => Promise<void>;
    };
    const impl = mod.default ?? mod;
    if (typeof impl.getItem !== 'function' || typeof impl.setItem !== 'function') return null;
    return impl as { getItem: (k: string) => Promise<string | null>; setItem: (k: string, v: string) => Promise<void> };
  } catch {
    return null;
  }
}

function persistFiscalNow(): void {
  if (hullPersistTimer) {
    clearTimeout(hullPersistTimer);
    hullPersistTimer = null;
  }
  const storage = getAsyncStorage();
  if (!storage) return;
  void storage.setItem(
    STELLIUM_COLONIZE_FLEET_FISCAL_STORAGE_KEY,
    JSON.stringify({
      hullsOutfitted: hullState.hullsOutfitted,
      loanCredits: hullState.loanCredits,
      lastRepayDayKey: hullState.lastRepayDayKey,
    }),
  ).catch(() => undefined);
}

export function getStelliumColonizeHullsOutfitted(): number {
  return hullState.hullsOutfitted;
}

export function getStelliumColonizeLoanCredits(): number {
  return hullState.loanCredits;
}

export function resetStelliumColonizeFiscalForTest(): void {
  hullState = { ...EMPTY_FISCAL };
  hullHydrated = false;
  hullHydratePromise = null;
  if (hullPersistTimer) {
    clearTimeout(hullPersistTimer);
    hullPersistTimer = null;
  }
}

export function seedStelliumColonizeFiscalForTest(over: Partial<HullFiscalState> = {}): void {
  hullState = { ...EMPTY_FISCAL, ...over };
  hullHydrated = true;
  hullHydratePromise = null;
  if (hullPersistTimer) {
    clearTimeout(hullPersistTimer);
    hullPersistTimer = null;
  }
}

export async function ensureStelliumColonizeFleetFiscalHydrated(): Promise<void> {
  if (hullHydrated) return;
  if (hullHydratePromise) return hullHydratePromise;
  hullHydratePromise = (async () => {
    const storage = getAsyncStorage();
    try {
      const raw = storage ? await storage.getItem(STELLIUM_COLONIZE_FLEET_FISCAL_STORAGE_KEY) : null;
      const parsed = raw
        ? JSON.parse(raw) as {
          hullsOutfitted?: unknown;
          loanCredits?: unknown;
          lastRepayDayKey?: unknown;
        }
        : null;
      const lastRepay = typeof parsed?.lastRepayDayKey === 'string' && parsed.lastRepayDayKey.trim()
        ? parsed.lastRepayDayKey.trim()
        : null;
      hullState = {
        hullsOutfitted: Math.max(0, Math.floor(Number(parsed?.hullsOutfitted) || 0)),
        loanCredits: Math.max(0, Math.floor(Number(parsed?.loanCredits) || 0)),
        lastRepayDayKey: lastRepay,
      };
    } catch {
      hullState = { ...EMPTY_FISCAL };
    }
    hullHydrated = true;
  })().finally(() => {
    hullHydratePromise = null;
  });
  return hullHydratePromise;
}

function resolveColonizeChargeVault(
  policy: Pick<StelliumColonizePolicy, 'chargeVaultKey'>,
): FactionVaultState {
  if (policy.chargeVaultKey === 'arccore_vault') return useArcCoreVaultStore.getState();
  return useBlueTeamSharedVaultStore.getState();
}

function loanAllowed(policy: Pick<StelliumColonizePolicy, 'loanEnabled' | 'chargeVaultKey'>): boolean {
  return policy.loanEnabled !== false && policy.chargeVaultKey === 'blue_team';
}

function trySpendExact(vault: FactionVaultState, amount: number, meta: { kind: string; planetId?: string }): boolean {
  const spend = Math.max(0, Math.floor(amount));
  if (spend <= 0) return true;
  if (!vault.hydrated || vault.getBalance() < spend) return false;
  vault.applyDelta(-spend, meta);
  return true;
}

/** 블루 부족분을 아크코어 중앙금고에서 끌어 운용 금고로 넣는다. 시드 아래는 신용(미지급) 장부. */
export function drawStelliumColonizeLoan(
  policy: Pick<StelliumColonizePolicy, 'loanEnabled' | 'chargeVaultKey'>,
  amount: number,
  meta?: { kind?: string; planetId?: string },
): boolean {
  const need = Math.max(0, Math.floor(amount));
  if (need <= 0) return true;
  if (!loanAllowed(policy)) return false;
  hullState = { ...hullState, loanCredits: hullState.loanCredits + need };
  persistFiscalNow();

  const central = useArcCoreVaultStore.getState();
  if (central.hydrated) {
    const seed = getArcCoreVaultSeedCredits();
    const fromReserve = Math.min(need, Math.max(0, central.getBalance() - seed));
    if (fromReserve > 0) {
      central.applyDelta(-fromReserve, {
        kind: STELLIUM_COLONIZE_LOAN_TXN.draw,
        planetId: meta?.planetId,
        note: meta?.kind,
      });
    }
    const credit = need - fromReserve;
    if (credit > 0) {
      central.recordAudit(STELLIUM_COLONIZE_LOAN_TXN.credit, {
        planetId: meta?.planetId,
        note: `credit=${credit}`,
      });
    }
  }

  const ops = resolveColonizeChargeVault(policy);
  if (ops.hydrated) {
    ops.appendInflow(need, {
      kind: STELLIUM_COLONIZE_LOAN_TXN.proceeds,
      planetId: meta?.planetId,
      note: meta?.kind,
    });
  }
  return true;
}

function spendColonizeOrLoan(
  policy: StelliumColonizePolicy,
  amount: number,
  meta: { kind: string; planetId?: string },
): boolean {
  const spend = Math.max(0, Math.floor(amount));
  if (spend <= 0) return true;
  const vault = resolveColonizeChargeVault(policy);
  const have = vault.hydrated ? Math.max(0, vault.getBalance()) : 0;
  if (have < spend) {
    if (!loanAllowed(policy)) return false;
    if (!drawStelliumColonizeLoan(policy, spend - have, meta)) return false;
    if (!vault.hydrated) return true;
  }
  return trySpendExact(resolveColonizeChargeVault(policy), spend, meta);
}

/** 일 1회 — 블루 시드 초과분만 중앙금고로 상환. 틱·실시간 경로 금지. */
export function repayStelliumColonizeLoanDaily(
  todayKey: string,
  policy: Pick<StelliumColonizePolicy, 'loanEnabled' | 'chargeVaultKey'>,
): { repaid: number } {
  const day = String(todayKey ?? '').trim();
  if (!day || !loanAllowed(policy)) return { repaid: 0 };
  if (hullState.lastRepayDayKey === day) return { repaid: 0 };

  const outstanding = Math.max(0, Math.floor(hullState.loanCredits));
  if (outstanding <= 0) {
    hullState = { ...hullState, lastRepayDayKey: day };
    persistFiscalNow();
    return { repaid: 0 };
  }

  const ops = resolveColonizeChargeVault(policy);
  const central = useArcCoreVaultStore.getState();
  if (!ops.hydrated || !central.hydrated) return { repaid: 0 };

  const seed = getBlueTeamVaultSeedCredits();
  const surplus = Math.max(0, ops.getBalance() - seed);
  const repay = Math.min(outstanding, surplus);
  if (repay <= 0) {
    hullState = { ...hullState, lastRepayDayKey: day };
    persistFiscalNow();
    return { repaid: 0 };
  }
  if (!trySpendExact(ops, repay, { kind: STELLIUM_COLONIZE_LOAN_TXN.repay })) {
    return { repaid: 0 };
  }
  central.appendInflow(repay, { kind: STELLIUM_COLONIZE_LOAN_TXN.repay });
  hullState = {
    ...hullState,
    loanCredits: outstanding - repay,
    lastRepayDayKey: day,
  };
  persistFiscalNow();
  return { repaid: repay };
}

export async function ensureStelliumColonizeFiscalReady(
  policy: Pick<StelliumColonizePolicy, 'chargeVaultKey'>,
): Promise<void> {
  await ensureStelliumColonizeFleetFiscalHydrated();
  await resolveColonizeChargeVault(policy).ensureHydrated();
  await useArcCoreVaultStore.getState().ensureHydrated();
}

export function bindStelliumColonizeRuntimeFiscal(
  policy: StelliumColonizePolicy,
): StelliumColonizeFiscalHooks {
  const cap = resolveOperationalShipCap(policy);
  let voyageReserved = 0;

  const hullNeedCredits = (): number => {
    if (hullState.hullsOutfitted >= cap) return 0;
    return Math.max(0, Math.floor(policy.hullOutfittingCredits));
  };

  const voyageNeedCredits = (travelDays: number): number => (
    policy.requirePrepaidEnqueue
      ? resolveStelliumColonizeDepartReserveCredits(travelDays, policy)
      : 0
  );

  const canAffordDepart = (_planetId: string, travelDays: number): boolean => {
    if (loanAllowed(policy)) return true;
    const vault = resolveColonizeChargeVault(policy);
    if (!hullHydrated || !vault.hydrated) return false;
    return canAffordColonizeDepartReserve(
      vault.getBalance(),
      hullNeedCredits(),
      voyageNeedCredits(travelDays),
      voyageReserved,
    );
  };

  const authorizeDepart = (planetId: string, travelDays: number): boolean => {
    if (!canAffordDepart(planetId, travelDays)) return false;
    const hullNeed = hullNeedCredits();
    if (hullNeed > 0) {
      if (!spendColonizeOrLoan(policy, hullNeed, { kind: 'colonize_hull', planetId })) return false;
      hullState = { ...hullState, hullsOutfitted: hullState.hullsOutfitted + 1 };
      persistFiscalNow();
    }
    voyageReserved += voyageNeedCredits(travelDays);
    return true;
  };

  const onBeforeHqRoll = (planetId: string, travelDays: number): boolean => {
    const vault = resolveColonizeChargeVault(policy);
    if (!loanAllowed(policy)) {
      if (!hullHydrated || !vault.hydrated) return false;
      if (policy.requirePrepaidEnqueue) {
        const need = resolveStelliumColonizeHqReserveCredits(policy, travelDays);
        if (vault.getBalance() < need) return false;
      }
    }
    return spendColonizeOrLoan(
      policy,
      resolveStelliumColonizeAttemptCredits(travelDays, policy),
      { kind: 'colonize_hq_attempt', planetId },
    );
  };

  return { canAffordDepart, authorizeDepart, onBeforeHqRoll };
}

export function tryChargeStelliumColonizeSuccessBond(
  policy: StelliumColonizePolicy,
  planetId: string,
): boolean {
  return spendColonizeOrLoan(policy, policy.successBondCredits, {
    kind: 'colonize_success_bond',
    planetId,
  });
}

export function applyStelliumColonizeDailyOpex(
  records: Record<string, StelliumColonizeRecord>,
  todayKey: string,
  policy: StelliumColonizePolicy,
): Record<string, StelliumColonizeRecord> {
  const vault = resolveColonizeChargeVault(policy);
  if (!vault.hydrated && !loanAllowed(policy)) return records;
  const opex = Math.max(0, Math.floor(policy.opexCreditsPerShipDay));
  const keys = Object.keys(records);
  let next = records;
  for (let i = 0; i < keys.length; i += 1) {
    const row = next[keys[i]];
    if (!row || !isStelliumColonizeActivePhase(row.phase)) continue;
    if (row.lastOpexDayKey === todayKey) continue;
    if (opex > 0) {
      spendColonizeOrLoan(policy, opex, { kind: 'colonize_opex', planetId: row.planetId });
    }
    if (next === records) next = { ...records };
    next[row.planetId] = { ...row, lastOpexDayKey: todayKey };
  }
  return next;
}
