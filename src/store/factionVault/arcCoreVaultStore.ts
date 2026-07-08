// ============================================================
// 아크코어 금고 — RED 점령 행성 유지비·무역 수수료
// ============================================================

import { createFactionVaultStore } from './createFactionVaultStore';
import {
  getArcCoreVaultSeedCredits,
  vaultAllowsNegativeBalance,
} from '../../arcCore/economy/planetUpkeepPolicy';
import { getTradeRouteTxnHistoryLimit } from '../../arcCore/balance/balanceTableRegistry';

export const MIGRATION_STASH_ARC_CORE = 'arcfire_vault_migration_arc_core';

export const useArcCoreVaultStore = createFactionVaultStore({
  storageKey: 'arcfire_arc_core_vault_v1',
  migrationStashKey: MIGRATION_STASH_ARC_CORE,
  seedCredits: getArcCoreVaultSeedCredits,
  seedNote: '아크코어 금고 시드',
  txnHistoryLimit: getTradeRouteTxnHistoryLimit,
  allowNegativeBalance: vaultAllowsNegativeBalance,
});
