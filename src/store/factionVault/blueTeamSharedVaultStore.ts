// ============================================================
// 블루팀 공용 금고 — BLUE 점령 행성 유지비·무역 수수료
// ============================================================

import { createFactionVaultStore } from './createFactionVaultStore';
import {
  getBlueTeamVaultSeedCredits,
  vaultAllowsNegativeBalance,
} from '../../arcCore/economy/planetUpkeepPolicy';
import { getTradeRouteTxnHistoryLimit } from '../../arcCore/balance/balanceTableRegistry';

export const useBlueTeamSharedVaultStore = createFactionVaultStore({
  storageKey: 'arcfire_blue_team_shared_vault_v1',
  seedCredits: getBlueTeamVaultSeedCredits,
  seedNote: '블루팀 공용 금고 시드',
  txnHistoryLimit: getTradeRouteTxnHistoryLimit,
  allowNegativeBalance: vaultAllowsNegativeBalance,
});
