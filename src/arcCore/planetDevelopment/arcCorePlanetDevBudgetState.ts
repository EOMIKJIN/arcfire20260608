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
};

const EMPTY: ArcCorePlanetDevBudgetState = {
  kstDayKey: '',
  budgetRemainingCr: 0,
  budgetAllocatedCr: 0,
  spentTodayCr: 0,
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
  await AsyncStorage.setItem(BUDGET_KEY, JSON.stringify(cache));
}

/** 일 1회 central bank pass — development slice를 예산 풀에 적립 (vault 선소각 없음) */
export async function creditArcCorePlanetDevDailyBudget(
  kstDayKey: string,
  amount: number,
): Promise<ArcCorePlanetDevBudgetState> {
  const credits = Math.max(0, Math.floor(amount));
  const cur = await hydrateArcCorePlanetDevBudgetState();
  const sameDay = cur.kstDayKey === kstDayKey;
  const next: ArcCorePlanetDevBudgetState = sameDay
    ? {
      kstDayKey,
      budgetRemainingCr: cur.budgetRemainingCr + credits,
      budgetAllocatedCr: cur.budgetAllocatedCr + credits,
      spentTodayCr: cur.spentTodayCr,
    }
    : {
      kstDayKey,
      budgetRemainingCr: credits,
      budgetAllocatedCr: credits,
      spentTodayCr: 0,
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
  void AsyncStorage.setItem(BUDGET_KEY, JSON.stringify(cache));
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
  void AsyncStorage.setItem(BUDGET_KEY, JSON.stringify(cache));
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
