// ============================================================
// 아크코어 수송선단 금고 — convoy 매입·수익 전용 (중립 경제 집단)
// ============================================================

import { createFactionVaultStore } from './createFactionVaultStore';
import {
  getArcCoreTransportFleetSeedCredits,
  vaultAllowsNegativeBalance,
} from '../../arcCore/economy/planetUpkeepPolicy';
import { getTradeRouteTxnHistoryLimit } from '../../arcCore/balance/balanceTableRegistry';

export const MIGRATION_STASH_TRANSPORT_FLEET = 'arcfire_vault_migration_transport_fleet';

export const useArcCoreTransportFleetBankStore = createFactionVaultStore({
  storageKey: 'arcfire_arc_core_transport_fleet_bank_v1',
  migrationStashKey: MIGRATION_STASH_TRANSPORT_FLEET,
  seedCredits: getArcCoreTransportFleetSeedCredits,
  seedNote: '아크코어 수송선단 금고 시드',
  txnHistoryLimit: getTradeRouteTxnHistoryLimit,
  allowNegativeBalance: vaultAllowsNegativeBalance,
});
