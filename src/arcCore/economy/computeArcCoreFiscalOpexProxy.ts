// ============================================================
// 프록시 4항 + 잔여 — 순수 계산 (스토어 없음)
// ============================================================

import {
  emptyFiscalOpexVaultMap,
  type ArcCoreFiscalOpexPolicy,
  type ArcCoreFiscalOpexVaultKey,
} from './arcCoreFiscalOpexPolicy';

export type FiscalOpexPlanetInput = {
  planetId: string;
  vaultKey: ArcCoreFiscalOpexVaultKey;
  defense: number;
  pgp: number;
  shipyardLevel: number;
  laboratoryLevel: number;
  talkEnabledGovernor: boolean;
};

export type FiscalOpexGatheredInputs = {
  planets: FiscalOpexPlanetInput[];
  orbitShipCount: number;
  orbitCaptainCount: number;
};

export type FiscalOpexRequested = {
  military: Record<ArcCoreFiscalOpexVaultKey, number>;
  ship: Record<ArcCoreFiscalOpexVaultKey, number>;
  captain: Record<ArcCoreFiscalOpexVaultKey, number>;
  rd: Record<ArcCoreFiscalOpexVaultKey, number>;
  residual: Record<ArcCoreFiscalOpexVaultKey, number>;
  totals: Record<ArcCoreFiscalOpexVaultKey, number>;
  requestedSum: number;
  orbitUsed: number;
  shipyardLevelSum: number;
  laboratoryLevelSum: number;
  captainCount: number;
};

function add(
  map: Record<ArcCoreFiscalOpexVaultKey, number>,
  key: ArcCoreFiscalOpexVaultKey,
  amount: number,
): void {
  const n = Math.max(0, Math.floor(amount));
  if (n <= 0) return;
  map[key] += n;
}

export function computePgpUnit(pgp: number, defense: number, divisor: number): number {
  if (pgp > 0 && divisor > 0) return pgp / divisor;
  return Math.max(1, defense);
}

export function computeArcCoreFiscalOpexRequested(
  gathered: FiscalOpexGatheredInputs,
  policy: ArcCoreFiscalOpexPolicy,
): FiscalOpexRequested {
  const military = emptyFiscalOpexVaultMap();
  const ship = emptyFiscalOpexVaultMap();
  const captain = emptyFiscalOpexVaultMap();
  const rd = emptyFiscalOpexVaultMap();
  const residual = emptyFiscalOpexVaultMap();

  let shipyardLevelSum = 0;
  let laboratoryLevelSum = 0;
  let governorTalkCount = 0;

  for (let i = 0; i < gathered.planets.length; i += 1) {
    const p = gathered.planets[i]!;
    const d = Math.max(0, p.defense);
    const pgpUnit = computePgpUnit(p.pgp, d, policy.pgpUnitDivisor);
    add(military, p.vaultKey, policy.kMil * d * pgpUnit);
    if (p.shipyardLevel > 0) shipyardLevelSum += p.shipyardLevel;
    if (p.laboratoryLevel > 0) laboratoryLevelSum += p.laboratoryLevel;
    if (p.talkEnabledGovernor) {
      governorTalkCount += 1;
      add(captain, p.vaultKey, policy.kCap);
    }
  }

  const orbitUsed = Math.min(policy.orbitTrafficCap, Math.max(0, gathered.orbitShipCount));
  const shipTotal =
    policy.kShip * orbitUsed + policy.kShipyard * shipyardLevelSum;
  add(ship, 'fleet', (shipTotal * policy.fleetShipSharePct) / 100);
  add(ship, 'red', (shipTotal * policy.redShipSharePct) / 100);

  const extraCaptains = Math.max(0, gathered.orbitCaptainCount);
  add(captain, 'fleet', policy.kCap * extraCaptains);

  add(rd, 'red', policy.kRd * laboratoryLevelSum);

  const totals = emptyFiscalOpexVaultMap();
  const keys: ArcCoreFiscalOpexVaultKey[] = ['red', 'blue', 'neutral', 'independent', 'fleet'];
  let requestedSum = 0;
  for (const key of keys) {
    totals[key] = military[key] + ship[key] + captain[key] + rd[key] + residual[key];
    requestedSum += totals[key];
  }

  return {
    military,
    ship,
    captain,
    rd,
    residual,
    totals,
    requestedSum,
    orbitUsed,
    shipyardLevelSum,
    laboratoryLevelSum,
    captainCount: governorTalkCount + extraCaptains,
  };
}

export function computeResidualForSurplus(
  remainingSurplus: number,
  residualPct: number,
): number {
  if (remainingSurplus <= 0 || residualPct <= 0) return 0;
  return Math.max(0, Math.floor((remainingSurplus * residualPct) / 100));
}

/** 시드 위만 쓸 수 있는 한도 */
export function spendableAboveSeed(balance: number, seed: number): number {
  return Math.max(0, Math.floor(balance) - Math.max(0, Math.floor(seed)));
}
