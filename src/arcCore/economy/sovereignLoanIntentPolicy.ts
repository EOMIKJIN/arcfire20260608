// ============================================================
// arc_core_sovereign_loan_policy.csv — 국가 대출 의도 잠금
// 런타임 이자·조달중단·점령청산 없음. 고도화 재설계 전 설정 정본만.
// 틱·부트·타이틀·신규 persist 금지.
// ============================================================

import { ArcCoreSovereignLoanPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';

function parseBool(raw: string | undefined, fallback = false): boolean {
  if (raw == null || String(raw).trim() === '') return fallback;
  return String(raw).trim().toLowerCase() === 'true';
}

let policyKv: Map<string, string> | null = null;

function getPolicyKv(): Map<string, string> {
  if (!policyKv) {
    policyKv = new Map(
      ArcCoreSovereignLoanPolicy_FROM_BALANCE_CSV.map((row) => [row.key, row.value] as const),
    );
  }
  return policyKv;
}

function policyStr(key: string, fallback: string): string {
  const raw = getPolicyKv().get(key);
  const s = String(raw ?? '').trim();
  return s || fallback;
}

export const SOVEREIGN_LOAN_LENDER_VAULT_FUTURE = 'military_industry_vault';
export const SOVEREIGN_LOAN_LENDER_VAULT_TRANSITIONAL = 'arccore_vault';

export type SovereignLoanIntentPolicy = {
  policyVersion: number;
  intentLock: boolean;
  runtimeInterestEnabled: boolean;
  runtimeProcurementHaltEnabled: boolean;
  runtimeOccupationSettlementEnabled: boolean;
  lenderVaultKeyFuture: typeof SOVEREIGN_LOAN_LENDER_VAULT_FUTURE;
  lenderVaultKeyTransitional: string;
  borrowerNations: string[];
  interestAccrualBase: string;
  interestIncomeTo: string;
  interestRatePctLocked: boolean;
  defaultConsequence: string;
  procurementHaltScope: string[];
  occupationUnwindPath: string[];
  repayClock: string;
  seedProtectRepay: boolean;
  newPersistKeyAllowed: boolean;
  playerWalletIsNotSovereignLoan: boolean;
  transportVaultIsNotLender: boolean;
  worldAxis: boolean;
};

const FALLBACK: SovereignLoanIntentPolicy = {
  policyVersion: 1,
  intentLock: true,
  runtimeInterestEnabled: false,
  runtimeProcurementHaltEnabled: false,
  runtimeOccupationSettlementEnabled: false,
  lenderVaultKeyFuture: SOVEREIGN_LOAN_LENDER_VAULT_FUTURE,
  lenderVaultKeyTransitional: SOVEREIGN_LOAN_LENDER_VAULT_TRANSITIONAL,
  borrowerNations: ['stellium', 'arccore', 'neutral', 'independent'],
  interestAccrualBase: 'outstanding_principal',
  interestIncomeTo: 'military_industry',
  interestRatePctLocked: false,
  defaultConsequence: 'halt_military_procurement',
  procurementHaltScope: ['nation_hull', 'nation_weapon', 'nation_equip', 'colonize_outfitting'],
  occupationUnwindPath: ['return_hold', 'neutralize', 'settle_loan_cost'],
  repayClock: 'daily_batch_only',
  seedProtectRepay: true,
  newPersistKeyAllowed: false,
  playerWalletIsNotSovereignLoan: true,
  transportVaultIsNotLender: true,
  worldAxis: true,
};

function splitPipe(raw: string): string[] {
  return raw.split('|').map((s) => s.trim()).filter(Boolean);
}

export function resolveSovereignLoanIntentPolicy(): SovereignLoanIntentPolicy {
  const kv = getPolicyKv();
  if (kv.size === 0) return FALLBACK;
  return {
    policyVersion: Math.max(1, Math.floor(Number(policyStr('policy_version', '1')) || 1)),
    intentLock: parseBool(kv.get('intent_lock'), true),
    runtimeInterestEnabled: parseBool(kv.get('runtime_interest_enabled'), false),
    runtimeProcurementHaltEnabled: parseBool(kv.get('runtime_procurement_halt_enabled'), false),
    runtimeOccupationSettlementEnabled: parseBool(kv.get('runtime_occupation_settlement_enabled'), false),
    lenderVaultKeyFuture: SOVEREIGN_LOAN_LENDER_VAULT_FUTURE,
    lenderVaultKeyTransitional: policyStr(
      'lender_vault_key_transitional',
      SOVEREIGN_LOAN_LENDER_VAULT_TRANSITIONAL,
    ),
    borrowerNations: splitPipe(policyStr('borrower_nations', FALLBACK.borrowerNations.join('|'))),
    interestAccrualBase: policyStr('interest_accrual_base', FALLBACK.interestAccrualBase),
    interestIncomeTo: policyStr('interest_income_to', FALLBACK.interestIncomeTo),
    interestRatePctLocked: parseBool(kv.get('interest_rate_pct_locked'), false),
    defaultConsequence: policyStr('default_consequence', FALLBACK.defaultConsequence),
    procurementHaltScope: splitPipe(
      policyStr('procurement_halt_scope', FALLBACK.procurementHaltScope.join('|')),
    ),
    occupationUnwindPath: splitPipe(
      policyStr('occupation_unwind_path', FALLBACK.occupationUnwindPath.join('|')),
    ),
    repayClock: policyStr('repay_clock', FALLBACK.repayClock),
    seedProtectRepay: parseBool(kv.get('seed_protect_repay'), true),
    newPersistKeyAllowed: parseBool(kv.get('new_persist_key_allowed'), false),
    playerWalletIsNotSovereignLoan: parseBool(kv.get('player_wallet_is_not_sovereign_loan'), true),
    transportVaultIsNotLender: parseBool(kv.get('transport_vault_is_not_lender'), true),
    worldAxis: parseBool(kv.get('world_axis'), true),
  };
}

/** 고도화 전 — 이자·조달중단·점령청산 엔진을 켜면 안 된다 */
export function sovereignLoanRuntimeEnginesAreLockedOff(
  policy: SovereignLoanIntentPolicy = resolveSovereignLoanIntentPolicy(),
): boolean {
  return policy.intentLock
    && !policy.runtimeInterestEnabled
    && !policy.runtimeProcurementHaltEnabled
    && !policy.runtimeOccupationSettlementEnabled
    && !policy.newPersistKeyAllowed;
}

export function resetSovereignLoanIntentPolicyCacheForTest(): void {
  policyKv = null;
}
