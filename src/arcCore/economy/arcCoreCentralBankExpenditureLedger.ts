// ============================================================
// 중앙은행 지출 원장 — txn 히스토리 상한과 무관한 누적 회계
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

const LEDGER_KEY = 'arcfire_arc_core_central_bank_ledger_v1';

export type ArcCoreCentralBankExpenditureLedger = {
  fleetMilitaryCredits: number;
  planetOpeningCredits: number;
  planetDevelopmentCredits: number;
  mintedCredits: number;
  burnedCredits: number;
  lastKstDayKey: string | null;
  lastPassAt: number | null;
};

const EMPTY: ArcCoreCentralBankExpenditureLedger = {
  fleetMilitaryCredits: 0,
  planetOpeningCredits: 0,
  planetDevelopmentCredits: 0,
  mintedCredits: 0,
  burnedCredits: 0,
  lastKstDayKey: null,
  lastPassAt: null,
};

let cache: ArcCoreCentralBankExpenditureLedger | null = null;
let hydrated = false;

function normalize(raw: unknown): ArcCoreCentralBankExpenditureLedger {
  if (!raw || typeof raw !== 'object') return { ...EMPTY };
  const src = raw as Partial<ArcCoreCentralBankExpenditureLedger>;
  return {
    fleetMilitaryCredits: Math.max(0, Math.floor(src.fleetMilitaryCredits ?? 0)),
    planetOpeningCredits: Math.max(0, Math.floor(src.planetOpeningCredits ?? 0)),
    planetDevelopmentCredits: Math.max(0, Math.floor(src.planetDevelopmentCredits ?? 0)),
    mintedCredits: Math.max(0, Math.floor(src.mintedCredits ?? 0)),
    burnedCredits: Math.max(0, Math.floor(src.burnedCredits ?? 0)),
    lastKstDayKey: src.lastKstDayKey ?? null,
    lastPassAt: src.lastPassAt ?? null,
  };
}

export async function hydrateArcCoreCentralBankExpenditureLedger(): Promise<ArcCoreCentralBankExpenditureLedger> {
  if (hydrated && cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(LEDGER_KEY);
    cache = raw ? normalize(JSON.parse(raw)) : { ...EMPTY };
  } catch {
    cache = { ...EMPTY };
  }
  hydrated = true;
  return cache;
}

export function getArcCoreCentralBankExpenditureLedgerSnapshot(): ArcCoreCentralBankExpenditureLedger {
  return cache ? { ...cache } : { ...EMPTY };
}

export async function persistArcCoreCentralBankExpenditureLedger(
  next: ArcCoreCentralBankExpenditureLedger,
): Promise<void> {
  cache = normalize(next);
  hydrated = true;
  await AsyncStorage.setItem(LEDGER_KEY, JSON.stringify(cache));
}

/** 서비스 개시 월드 리셋 — 중앙은행 누적 원장 제로 */
export async function clearArcCoreCentralBankExpenditureLedgerForServiceLaunch(): Promise<void> {
  await persistArcCoreCentralBankExpenditureLedger({ ...EMPTY });
}

export async function accumulateArcCoreCentralBankExpenditure(input: {
  kstDayKey: string;
  fleetMilitaryCredits: number;
  planetOpeningCredits: number;
  planetDevelopmentCredits: number;
}): Promise<ArcCoreCentralBankExpenditureLedger> {
  const cur = await hydrateArcCoreCentralBankExpenditureLedger();
  const next: ArcCoreCentralBankExpenditureLedger = {
    ...cur,
    fleetMilitaryCredits: cur.fleetMilitaryCredits + Math.max(0, input.fleetMilitaryCredits),
    planetOpeningCredits: cur.planetOpeningCredits + Math.max(0, input.planetOpeningCredits),
    planetDevelopmentCredits:
      cur.planetDevelopmentCredits + Math.max(0, input.planetDevelopmentCredits),
    lastKstDayKey: input.kstDayKey,
    lastPassAt: Date.now(),
  };
  await persistArcCoreCentralBankExpenditureLedger(next);
  return next;
}
