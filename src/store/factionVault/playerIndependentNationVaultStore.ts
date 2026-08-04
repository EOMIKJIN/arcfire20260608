// ============================================================
// 플레이어 독립국 금고 — 소유권 구매 행성의 무역 수수료 적립
// task_id=economy-vault-5axis-upgrade-20260804
// 1차 범위: 수수료 적립만. 유지비는 기존대로 player.credits 직차감(회귀 최소).
// 계정 초기화 시 잔액 0 — resetPlayerIndependentNationVaultForAccountPurge() 참고.
// ============================================================

import { createFactionVaultStore } from './createFactionVaultStore';
import { vaultAllowsNegativeBalance } from '../../arcCore/economy/planetUpkeepPolicy';
import { getTradeRouteTxnHistoryLimit } from '../../arcCore/balance/balanceTableRegistry';

/** 신규 금고 — 기존 3키(arccore/blue/transport) 잔액은 이전하지 않는다(대표님 지시). 시드 0 고정. */
export const usePlayerIndependentNationVaultStore = createFactionVaultStore({
  storageKey: 'arcfire_player_independent_nation_vault_v1',
  seedCredits: () => 0,
  seedNote: '독립국 금고 시드',
  txnHistoryLimit: getTradeRouteTxnHistoryLimit,
  allowNegativeBalance: vaultAllowsNegativeBalance,
});

/**
 * 계정 초기화(purge) 전용 — 플레이어 축 데이터라 잔액을 0으로 되돌린다(대표님 계약:
 * 독립국 → 초기화 시 중립화). 월드 축(1~4)은 손대지 않음 — 이 스토어만 대상.
 */
export async function resetPlayerIndependentNationVaultForAccountPurge(): Promise<void> {
  usePlayerIndependentNationVaultStore.setState({
    hydrated: true,
    balanceCredits: 0,
    totalInflowCredits: 0,
    totalOutflowCredits: 0,
    txns: [],
  });
  await usePlayerIndependentNationVaultStore.getState().persist();
}
