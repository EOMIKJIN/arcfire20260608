// ============================================================
// 아크코어 중앙은행 — 발행(mint)·소각(burn)·지출 txn kind 정본
// 행성개발 RED ArcCore 실지출은 vault trySpend + 일일 예산 풀 연동
// ============================================================

import { useArcCoreVaultStore } from '../../store/factionVault/arcCoreVaultStore';
import type { FactionVaultTxn } from '../../store/factionVault/createFactionVaultStore';

export const ARC_CORE_CENTRAL_BANK_TXN_KIND = {
  mint: 'central_bank_mint',
  burn: 'central_bank_burn',
  spendFleetMilitary: 'central_bank_spend_fleet_military',
  spendPlanetOpening: 'central_bank_spend_planet_opening',
  spendPlanetDevelopment: 'central_bank_spend_planet_development',
} as const;

export type ArcCoreCentralBankTxnKind =
  (typeof ARC_CORE_CENTRAL_BANK_TXN_KIND)[keyof typeof ARC_CORE_CENTRAL_BANK_TXN_KIND];

function vault() {
  return useArcCoreVaultStore.getState();
}

/** 중앙은행 발행 — 인플레이션 통제용(정책 배치·운영툴 전용) */
export function mintArcCoreCentralBankCredits(
  amount: number,
  meta?: Partial<FactionVaultTxn>,
): boolean {
  const credits = Math.floor(amount);
  if (credits <= 0) return false;
  vault().appendInflow(credits, {
    kind: ARC_CORE_CENTRAL_BANK_TXN_KIND.mint,
    note: meta?.note ?? 'central_bank_mint',
    ...meta,
  });
  return true;
}

/** 중앙은행 소각 — 유통량 회수 */
export function burnArcCoreCentralBankCredits(
  amount: number,
  meta?: Partial<FactionVaultTxn>,
): boolean {
  const credits = Math.floor(amount);
  if (credits <= 0) return false;
  return vault().trySpend(credits, {
    kind: ARC_CORE_CENTRAL_BANK_TXN_KIND.burn,
    note: meta?.note ?? 'central_bank_burn',
    ...meta,
  });
}

/** 회계 지출 — 게임 자원 차감 없음 */
export function spendArcCoreCentralBankAccounting(
  amount: number,
  kind: Exclude<
    ArcCoreCentralBankTxnKind,
    typeof ARC_CORE_CENTRAL_BANK_TXN_KIND.mint | typeof ARC_CORE_CENTRAL_BANK_TXN_KIND.burn
  >,
  meta?: Partial<FactionVaultTxn>,
): boolean {
  const credits = Math.floor(amount);
  if (credits <= 0) return false;
  return vault().trySpend(credits, {
    kind,
    note: meta?.note ?? kind,
    ...meta,
  });
}
