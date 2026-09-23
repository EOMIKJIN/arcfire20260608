// ============================================================
// ArcCore RED 행성개발 — 일일 예산 풀 (vault 실지출과 연동)
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

const BUDGET_KEY = 'arcfire_arc_core_planet_dev_budget_v1';

export type ArcCorePlanetDevBudgetState = {
  kstDayKey: string;
  budgetRemainingCr: number;
  budgetAllocatedCr: number;
  spentTodayCr: number;
  /** true면 금고에서 이미 선지출 — 건설 시 vault 재차감 금지 */
  prepaidFromVault: boolean;
};

const EMPTY: ArcCorePlanetDevBudgetState = {
  kstDayKey: '',
  budgetRemainingCr: 0,
  budgetAllocatedCr: 0,
  spentTodayCr: 0,
  prepaidFromVault: false,
};

let cache: ArcCorePlanetDevBudgetState | null = null;
let hydrated = false;

function normalize(raw: unknown): ArcCorePlanetDevBudgetState {
  if (!raw || typeof raw !== 'object') return { ...EMPTY };
  const src = raw as Partial<ArcCorePlanetDevBudgetState>;
  return {
    kstDayKey: String(src.kstDayKey ?? ''),
    budgetRemainingCr: Math.max(0, Math.floor(src.budgetRemainingCr ?? 0)),
    budgetAllocatedCr: Math.max(0, Math.floor(src.budgetAllocatedCr ?? 0)),
    spentTodayCr: Math.max(0, Math.floor(src.spentTodayCr ?? 0)),
    prepaidFromVault: src.prepaidFromVault === true,
  };
}

export async function hydrateArcCorePlanetDevBudgetState(): Promise<ArcCorePlanetDevBudgetState> {
  if (hydrated && cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(BUDGET_KEY);
    cache = raw ? normalize(JSON.parse(raw)) : { ...EMPTY };
  } catch {
    cache = { ...EMPTY };
  }
  hydrated = true;
  return cache;
}

export function getArcCorePlanetDevBudgetSnapshot(): ArcCorePlanetDevBudgetState {
  return cache ? { ...cache } : { ...EMPTY };
}

export function getArcCorePlanetDevBudgetRemaining(): number {
  return cache?.budgetRemainingCr ?? 0;
}

async function persistBudget(next: ArcCorePlanetDevBudgetState): Promise<void> {
  cache = normalize(next);
  hydrated = true;
  try {
    await AsyncStorage.setItem(BUDGET_KEY, JSON.stringify(cache));
  } catch {
    /* 메모리 예산은 유지 */
  }
}

export function isArcCorePlanetDevBudgetPrepaid(): boolean {
  return cache?.prepaidFromVault === true;
}

/** 일 1회 central bank pass — development slice를 예산 풀에 적립. lockFromVault면 금고 선지출. */
export async function creditArcCorePlanetDevDailyBudget(
  kstDayKey: string,
  amount: number,
  opts?: { lockFromVault?: boolean },
): Promise<ArcCorePlanetDevBudgetState> {
  const cur = await hydrateArcCorePlanetDevBudgetState();
  if (cur.kstDayKey === kstDayKey && (cur.prepaidFromVault || cur.budgetAllocatedCr > 0)) {
    return cur;
  }
  let credits = Math.max(0, Math.floor(amount));
  let prepaidFromVault = false;
  if (opts?.lockFromVault && credits > 0) {
    const { useArcCoreVaultStore } = await import('../../store/factionVault/arcCoreVaultStore');
    const { getArcCoreVaultSeedCredits } = await import('../economy/planetUpkeepPolicy');
    const { spendableAboveSeed } = await import('../economy/computeArcCoreFiscalOpexProxy');
    const vault = useArcCoreVaultStore.getState();
    if (!vault.hydrated) await vault.hydrate();
    const cap = spendableAboveSeed(vault.getBalance(), getArcCoreVaultSeedCredits());
    const locked = vault.spendUpToBalance(Math.min(credits, cap), {
      kind: 'fiscal_opex_dev_lock',
      note: `planet_dev_budget_lock kst=${kstDayKey} amt=${credits}`,
    });
    credits = locked.spent;
    prepaidFromVault = locked.spent > 0;
  }
  const sameDay = cur.kstDayKey === kstDayKey;
  const next: ArcCorePlanetDevBudgetState = sameDay
    ? {
      kstDayKey,
      budgetRemainingCr: cur.budgetRemainingCr + credits,
      budgetAllocatedCr: cur.budgetAllocatedCr + credits,
      spentTodayCr: cur.spentTodayCr,
      prepaidFromVault: prepaidFromVault || cur.prepaidFromVault,
    }
    : {
      kstDayKey,
      budgetRemainingCr: credits,
      budgetAllocatedCr: credits,
      spentTodayCr: 0,
      prepaidFromVault,
    };
  await persistBudget(next);
  return next;
}

/** 투자 시도 전 예산 확보 — 실패 시 vault 미차감 */
export function tryConsumeArcCorePlanetDevBudget(amount: number): boolean {
  const credits = Math.floor(amount);
  if (credits <= 0) return true;
  if (!cache || cache.budgetRemainingCr < credits) return false;
  cache = {
    ...cache,
    budgetRemainingCr: cache.budgetRemainingCr - credits,
    spentTodayCr: cache.spentTodayCr + credits,
  };
  void AsyncStorage.setItem(BUDGET_KEY, JSON.stringify(cache)).catch(() => {
    /* 예산 메모리는 이미 반영 */
  });
  return true;
}

export function releaseArcCorePlanetDevBudget(amount: number): void {
  const credits = Math.floor(amount);
  if (credits <= 0 || !cache) return;
  cache = {
    ...cache,
    budgetRemainingCr: cache.budgetRemainingCr + credits,
    spentTodayCr: Math.max(0, cache.spentTodayCr - credits),
  };
  void AsyncStorage.setItem(BUDGET_KEY, JSON.stringify(cache)).catch(() => {
    /* 예산 메모리는 이미 반영 */
  });
}

export async function recordArcCorePlanetDevActualSpend(
  kstDayKey: string,
  spentCr: number,
): Promise<void> {
  const credits = Math.max(0, Math.floor(spentCr));
  if (credits <= 0) return;
  const { accumulateArcCoreCentralBankExpenditure } = await import('../economy/arcCoreCentralBankExpenditureLedger');
  await accumulateArcCoreCentralBankExpenditure({
    kstDayKey,
    fleetMilitaryCredits: 0,
    planetOpeningCredits: 0,
    planetDevelopmentCredits: credits,
  });
}
