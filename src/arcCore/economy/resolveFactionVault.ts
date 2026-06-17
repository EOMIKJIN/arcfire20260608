// ============================================================
// 행성 점유 → 팩션 금고 라우팅
// ============================================================

import {
  ARC_CORE_SEED_BLUE_CLAN_ID,
  ARC_CORE_SEED_RED_CLAN_ID,
} from '../balance/seedPlanetOccupationFromBalance';
import type { PlanetClanHold } from '../../types';
import type { FactionVaultState } from '../../store/factionVault/createFactionVaultStore';
import { useArcCoreVaultStore } from '../../store/factionVault/arcCoreVaultStore';
import { useBlueTeamSharedVaultStore } from '../../store/factionVault/blueTeamSharedVaultStore';

function getClanWarFoundationStore() {
  // 헤드리스 경제 감사·convoy 수수료 경로에서 불필요한 UI 에셋 체인 로드 방지
  return require('../../store/clanWarFoundationStore').useClanWarFoundationStore as typeof import('../../store/clanWarFoundationStore').useClanWarFoundationStore;
}

/** [보완 #3] AsyncStorage 금고 키 — BLUE / RED·중립(아크코어) */
export const VAULT_KEY_ARCCORE = 'arccore_vault';
export const VAULT_KEY_BLUE = 'blue_vault';

export type OccupierFactionKind = 'red' | 'blue' | 'neutral' | 'player_clan';

/** [보완 #3] 팩션·점유 문자열 → 금고 키 (BLUE=블루팀, RED·중립·폴백=아크코어) */
export function getVaultKeyByFaction(faction: string): string {
  const f = faction.trim().toLowerCase();
  if (f === 'blue' || f === ARC_CORE_SEED_BLUE_CLAN_ID) return VAULT_KEY_BLUE;
  return VAULT_KEY_ARCCORE;
}

export function resolveOccupierFactionKind(occupierClanId: string): OccupierFactionKind {
  if (occupierClanId === ARC_CORE_SEED_RED_CLAN_ID) return 'red';
  if (occupierClanId === ARC_CORE_SEED_BLUE_CLAN_ID) return 'blue';
  if (occupierClanId === 'neutral') return 'neutral';
  return 'player_clan';
}

export function resolveOccupierFactionKindForHold(hold: PlanetClanHold | undefined): OccupierFactionKind {
  if (!hold) return 'neutral';
  return resolveOccupierFactionKind(hold.occupierClanId);
}

function resolveVaultStoreByKey(vaultKey: string): Pick<
  FactionVaultState,
  'hydrate' | 'applyDelta' | 'trySpend' | 'spendUpToBalance' | 'appendInflow' | 'getBalance'
> {
  if (vaultKey === VAULT_KEY_BLUE) return useBlueTeamSharedVaultStore.getState();
  return useArcCoreVaultStore.getState();
}

/** [보완 #3] RED·BLUE·중립·폴백 → 팩션 금고 스토어 */
export function resolveFactionVaultForOccupierClanId(
  occupierClanId: string,
): Pick<
  FactionVaultState,
  'hydrate' | 'applyDelta' | 'trySpend' | 'spendUpToBalance' | 'appendInflow' | 'getBalance'
> | null {
  const faction = resolveOccupierFactionKind(occupierClanId);
  if (faction === 'player_clan') return null;
  const vaultKey = getVaultKeyByFaction(faction === 'blue' ? 'blue' : 'red');
  return resolveVaultStoreByKey(vaultKey);
}

export function resolveFactionVaultForPlanetId(
  planetId: string,
): Pick<
  FactionVaultState,
  'hydrate' | 'applyDelta' | 'trySpend' | 'spendUpToBalance' | 'appendInflow' | 'getBalance'
> | null {
  const hold = getClanWarFoundationStore().getState().getHold(planetId);
  if (!hold) return null;
  return resolveFactionVaultForOccupierClanId(hold.occupierClanId);
}

/** [보완 #3] 무역 수수료 — BLUE→blue_vault, RED·중립·플레이어클랜→arccore_vault */
export function resolveTradeFeeFactionVault(
  planetId: string,
): Pick<FactionVaultState, 'hydrate' | 'applyDelta' | 'trySpend' | 'spendUpToBalance' | 'appendInflow' | 'getBalance'> {
  if (process.env.ARCFIRE_HEADLESS_ECONOMY_AUDIT === '1') {
    return useArcCoreVaultStore.getState();
  }
  const hold = getClanWarFoundationStore().getState().getHold(planetId);
  const faction = resolveOccupierFactionKindForHold(hold);
  const vaultKey = getVaultKeyByFaction(faction === 'blue' ? 'blue' : 'red');
  return resolveVaultStoreByKey(vaultKey);
}
