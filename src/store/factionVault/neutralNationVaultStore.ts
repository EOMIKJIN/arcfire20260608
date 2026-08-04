// ============================================================
// 중립국 금고 — 중립(NEUTRAL) 점유 행성 유지비·무역 수수료
// task_id=economy-vault-5axis-upgrade-20260804
// ============================================================

import { createFactionVaultStore } from './createFactionVaultStore';
import { vaultAllowsNegativeBalance } from '../../arcCore/economy/planetUpkeepPolicy';
import { getTradeRouteTxnHistoryLimit } from '../../arcCore/balance/balanceTableRegistry';

/** 신규 금고 — 기존 3키(arccore/blue/transport) 잔액은 이전하지 않는다(대표님 지시). 시드 0 고정. */
export const useNeutralNationVaultStore = createFactionVaultStore({
  storageKey: 'arcfire_neutral_nation_vault_v1',
  seedCredits: () => 0,
  seedNote: '중립국 금고 시드',
  txnHistoryLimit: getTradeRouteTxnHistoryLimit,
  allowNegativeBalance: vaultAllowsNegativeBalance,
});
