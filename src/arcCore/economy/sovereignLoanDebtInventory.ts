// ============================================================
// 국가 대출 부채 재산정 — 장부 분류만. 잔액 persist·이자 계산 없음.
// 실잔액은 스텔리움 개척 loanCredits 한 줄. 나머지는 예약/비부채.
// ============================================================

import { ArcCoreSovereignLoanBooks_FROM_BALANCE_CSV } from '../../data/balance/generated';
import { resolveSovereignLoanIntentPolicy } from './sovereignLoanIntentPolicy';

export type SovereignLoanBookClass =
  | 'sovereign_loan'
  | 'sovereign_loan_reserved'
  | 'not_debt';

export type SovereignLoanBookRow = {
  bookId: string;
  borrowerNation: string;
  instrument: string;
  liveNow: boolean;
  principalSource: string;
  lenderNow: string;
  lenderFuture: string;
  defaultHalt: string;
  occupationUnwind: string;
  classifiedAs: SovereignLoanBookClass;
  notesKo: string;
};

export type SovereignLoanBookRestate = SovereignLoanBookRow & {
  principalCredits: number;
};

export type SovereignLoanDebtRestatement = {
  policyVersion: number;
  livePrincipalTotal: number;
  liveBooks: SovereignLoanBookRestate[];
  reservedBooks: SovereignLoanBookRestate[];
  excludedFromDebt: SovereignLoanBookRestate[];
  lenderFuture: string;
  transitionalLender: string;
  defaultConsequence: string;
  occupationUnwindPath: string[];
  runtimeEnginesLockedOff: boolean;
};

function parseClass(raw: string): SovereignLoanBookClass {
  const s = String(raw ?? '').trim();
  if (s === 'sovereign_loan') return 'sovereign_loan';
  if (s === 'sovereign_loan_reserved') return 'sovereign_loan_reserved';
  return 'not_debt';
}

function listBookRows(): SovereignLoanBookRow[] {
  return ArcCoreSovereignLoanBooks_FROM_BALANCE_CSV.map((row) => ({
    bookId: String(row.bookId ?? '').trim(),
    borrowerNation: String(row.borrowerNation ?? '').trim(),
    instrument: String(row.instrument ?? '').trim(),
    liveNow: String(row.liveNow ?? '').trim().toLowerCase() === 'true',
    principalSource: String(row.principalSource ?? '').trim(),
    lenderNow: String(row.lenderNow ?? '').trim(),
    lenderFuture: String(row.lenderFuture ?? '').trim(),
    defaultHalt: String(row.defaultHalt ?? '').trim(),
    occupationUnwind: String(row.occupationUnwind ?? '').trim(),
    classifiedAs: parseClass(row.classifiedAs),
    notesKo: String(row.notesKo ?? '').trim(),
  })).filter((row) => row.bookId.length > 0);
}

export function listSovereignLoanBookRows(): SovereignLoanBookRow[] {
  return listBookRows();
}

export function restateSovereignLoanDebt(input?: {
  stelliumColonizeLoanCredits?: number;
}): SovereignLoanDebtRestatement {
  const policy = resolveSovereignLoanIntentPolicy();
  const livePrincipal = Math.max(0, Math.floor(Number(input?.stelliumColonizeLoanCredits) || 0));
  const rows = listBookRows();
  const liveBooks: SovereignLoanBookRestate[] = [];
  const reservedBooks: SovereignLoanBookRestate[] = [];
  const excludedFromDebt: SovereignLoanBookRestate[] = [];

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const principalCredits = row.bookId === 'stellium_colonize_ops' && row.liveNow
      ? livePrincipal
      : 0;
    const next: SovereignLoanBookRestate = { ...row, principalCredits };
    if (row.classifiedAs === 'sovereign_loan' && row.liveNow) liveBooks.push(next);
    else if (row.classifiedAs === 'sovereign_loan_reserved') reservedBooks.push(next);
    else excludedFromDebt.push(next);
  }

  let livePrincipalTotal = 0;
  for (let i = 0; i < liveBooks.length; i += 1) {
    livePrincipalTotal += liveBooks[i].principalCredits;
  }

  return {
    policyVersion: policy.policyVersion,
    livePrincipalTotal,
    liveBooks,
    reservedBooks,
    excludedFromDebt,
    lenderFuture: policy.lenderVaultKeyFuture,
    transitionalLender: policy.lenderVaultKeyTransitional,
    defaultConsequence: policy.defaultConsequence,
    occupationUnwindPath: policy.occupationUnwindPath,
    runtimeEnginesLockedOff:
      policy.intentLock
      && !policy.runtimeInterestEnabled
      && !policy.runtimeProcurementHaltEnabled
      && !policy.runtimeOccupationSettlementEnabled,
  };
}
