// ============================================================
// 일 1회 — 아크코어 중앙은행 적립금(시드 초과) 전액 회계 지출
// 함대·행성개방·행성개발 — 게임 적용은 추후, 금고 소각+원장만.
// ============================================================

import { planetAttackKstDayKey } from '../planetAttack/planetAttackKstDayKey';
import { useArcCoreVaultStore } from '../../store/factionVault/arcCoreVaultStore';
import { getArcCoreVaultSeedCredits } from './planetUpkeepPolicy';
import { resolveArcCoreCentralBankPolicy } from './arcCoreCentralBankPolicy';
import {
  ARC_CORE_CENTRAL_BANK_TXN_KIND,
  spendArcCoreCentralBankAccounting,
} from './arcCoreCentralBank';
import { accumulateArcCoreCentralBankExpenditure } from './arcCoreCentralBankExpenditureLedger';

export type ArcCoreCentralBankExpenditurePassResult = {
  ran: boolean;
  kstDayKey: string;
  surplusBefore: number;
  fleetMilitarySpent: number;
  planetOpeningSpent: number;
  planetDevelopmentSpent: number;
  balanceAfter: number;
};

function splitSurplusAcrossExpenditureCategories(
  surplus: number,
  policy: ReturnType<typeof resolveArcCoreCentralBankPolicy>,
): { fleet: number; opening: number; development: number } {
  const total = Math.max(0, Math.floor(surplus));
  if (total <= 0) return { fleet: 0, opening: 0, development: 0 };

  const fleet = Math.floor((total * policy.expenditureFleetMilitarySharePct) / 100);
  const opening = Math.floor((total * policy.expenditurePlanetOpeningSharePct) / 100);
  const development = Math.max(0, total - fleet - opening);
  return { fleet, opening, development };
}

export async function runArcCoreCentralBankExpenditurePass(): Promise<ArcCoreCentralBankExpenditurePassResult> {
  const kstDayKey = planetAttackKstDayKey();
  const empty: ArcCoreCentralBankExpenditurePassResult = {
    ran: false,
    kstDayKey,
    surplusBefore: 0,
    fleetMilitarySpent: 0,
    planetOpeningSpent: 0,
    planetDevelopmentSpent: 0,
    balanceAfter: 0,
  };

  const policy = resolveArcCoreCentralBankPolicy();
  if (!policy.expenditurePassEnabled) return empty;

  if (!useArcCoreVaultStore.getState().hydrated) {
    await useArcCoreVaultStore.getState().hydrate();
  }

  const seed = getArcCoreVaultSeedCredits();
  const balanceBefore = useArcCoreVaultStore.getState().getBalance();
  const surplusBefore = Math.max(0, balanceBefore - seed);
  if (surplusBefore <= 0) {
    return { ...empty, ran: true, balanceAfter: balanceBefore };
  }

  const split = splitSurplusAcrossExpenditureCategories(surplusBefore, policy);

  const fleetOk = spendArcCoreCentralBankAccounting(
    split.fleet,
    ARC_CORE_CENTRAL_BANK_TXN_KIND.spendFleetMilitary,
    {
      note: `fleet_military_accounting kst=${kstDayKey} amt=${split.fleet}`,
    },
  );
  const openingOk = spendArcCoreCentralBankAccounting(
    split.opening,
    ARC_CORE_CENTRAL_BANK_TXN_KIND.spendPlanetOpening,
    {
      note: `planet_opening_accounting kst=${kstDayKey} amt=${split.opening}`,
    },
  );
  const devOk = spendArcCoreCentralBankAccounting(
    split.development,
    ARC_CORE_CENTRAL_BANK_TXN_KIND.spendPlanetDevelopment,
    {
      note: `planet_development_accounting kst=${kstDayKey} amt=${split.development}`,
    },
  );

  const fleetMilitarySpent = fleetOk ? split.fleet : 0;
  const planetOpeningSpent = openingOk ? split.opening : 0;
  const planetDevelopmentSpent = devOk ? split.development : 0;

  if (fleetMilitarySpent + planetOpeningSpent + planetDevelopmentSpent > 0) {
    await accumulateArcCoreCentralBankExpenditure({
      kstDayKey,
      fleetMilitaryCredits: fleetMilitarySpent,
      planetOpeningCredits: planetOpeningSpent,
      planetDevelopmentCredits: planetDevelopmentSpent,
    });
  }

  return {
    ran: true,
    kstDayKey,
    surplusBefore,
    fleetMilitarySpent,
    planetOpeningSpent,
    planetDevelopmentSpent,
    balanceAfter: useArcCoreVaultStore.getState().getBalance(),
  };
}
