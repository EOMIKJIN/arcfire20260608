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
import { useNeutralNationVaultStore } from '../../store/factionVault/neutralNationVaultStore';
import { usePlayerIndependentNationVaultStore } from '../../store/factionVault/playerIndependentNationVaultStore';
import { isPlayerOriginatedClanId } from '../../clanWar/planetOwnershipModel';

function getClanWarFoundationStore() {
  // 헤드리스 경제 감사·convoy 수수료 경로에서 불필요한 UI 에셋 체인 로드 방지
  return require('../../store/clanWarFoundationStore').useClanWarFoundationStore as typeof import('../../store/clanWarFoundationStore').useClanWarFoundationStore;
}

/** [보완 #3][5축] AsyncStorage 금고 키 — BLUE / RED·아크코어(중앙은행) / 중립 / 독립국 */
export const VAULT_KEY_ARCCORE = 'arccore_vault';
export const VAULT_KEY_BLUE = 'blue_vault';
export const VAULT_KEY_NEUTRAL = 'neutral_vault';
export const VAULT_KEY_PLAYER_INDEPENDENT = 'player_independent_vault';

export type OccupierFactionKind = 'red' | 'blue' | 'neutral' | 'player_clan';

/** [5축] 팩션 문자열 → 금고 키 (BLUE=블루팀, NEUTRAL=중립, 그 외(RED·player_clan 폴백)=아크코어) */
export function getVaultKeyByFaction(faction: string): string {
  const f = faction.trim().toLowerCase();
  if (f === 'blue' || f === ARC_CORE_SEED_BLUE_CLAN_ID) return VAULT_KEY_BLUE;
  if (f === 'neutral') return VAULT_KEY_NEUTRAL;
  return VAULT_KEY_ARCCORE;
}

/** [5축] hold가 플레이어 독립국(소유권 구매) 귀속인지 — kind 우선, occupier 폴백 */
export function isPlayerIndependentHold(hold: PlanetClanHold | undefined | null): boolean {
  if (!hold) return false;
  if (hold.kind === 'player_independent') return true;
  return isPlayerOriginatedClanId(hold.occupierClanId);
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
  'hydrate' | 'ensureHydrated' | 'applyDelta' | 'trySpend' | 'spendUpToBalance' | 'appendInflow' | 'getBalance'
> {
  if (vaultKey === VAULT_KEY_BLUE) return useBlueTeamSharedVaultStore.getState();
  if (vaultKey === VAULT_KEY_NEUTRAL) return useNeutralNationVaultStore.getState();
  if (vaultKey === VAULT_KEY_PLAYER_INDEPENDENT) return usePlayerIndependentNationVaultStore.getState();
  return useArcCoreVaultStore.getState();
}

/**
 * [5축 · 김팀장 검수] RED/BLUE/neutral 금고 + 플레이어 유래 clanId→독립국.
 * 예전: neutral→arccore 붕괴 · player_clan→null — fee/upkeep와 이중 경로 금지(READY §3 단일 라우터).
 */
export function resolveFactionVaultForOccupierClanId(
  occupierClanId: string,
): Pick<
  FactionVaultState,
  'hydrate' | 'ensureHydrated' | 'applyDelta' | 'trySpend' | 'spendUpToBalance' | 'appendInflow' | 'getBalance'
> | null {
  if (isPlayerOriginatedClanId(occupierClanId)) {
    return resolveVaultStoreByKey(VAULT_KEY_PLAYER_INDEPENDENT);
  }
  const faction = resolveOccupierFactionKind(occupierClanId);
  if (faction === 'player_clan') return null;
  const vaultKey = getVaultKeyByFaction(
    faction === 'blue' ? 'blue' : faction === 'neutral' ? 'neutral' : 'red',
  );
  return resolveVaultStoreByKey(vaultKey);
}

export function resolveFactionVaultForPlanetId(
  planetId: string,
): Pick<
  FactionVaultState,
  'hydrate' | 'ensureHydrated' | 'applyDelta' | 'trySpend' | 'spendUpToBalance' | 'appendInflow' | 'getBalance'
> | null {
  const hold = getClanWarFoundationStore().getState().getHold(planetId);
  if (!hold) return null;
  if (isPlayerIndependentHold(hold)) {
    return resolveVaultStoreByKey(VAULT_KEY_PLAYER_INDEPENDENT);
  }
  return resolveFactionVaultForOccupierClanId(hold.occupierClanId);
}

/**
 * [5축] 무역 수수료 — BLUE→blue_vault, NEUTRAL→neutral_vault,
 * 플레이어 독립국(kind==='player_independent' 또는 player 유래 occupier)→player_independent_vault,
 * RED·그 외 폴백→arccore_vault. (task_id=economy-vault-5axis-upgrade-20260804)
 */
export function resolveTradeFeeFactionVault(
  planetId: string,
): Pick<FactionVaultState, 'hydrate' | 'ensureHydrated' | 'applyDelta' | 'trySpend' | 'spendUpToBalance' | 'appendInflow' | 'getBalance'> {
  if (process.env.ARCFIRE_HEADLESS_ECONOMY_AUDIT === '1') {
    return useArcCoreVaultStore.getState();
  }
  const hold = getClanWarFoundationStore().getState().getHold(planetId);
  if (isPlayerIndependentHold(hold)) {
    return resolveVaultStoreByKey(VAULT_KEY_PLAYER_INDEPENDENT);
  }
  const faction = resolveOccupierFactionKindForHold(hold);
  const vaultKey = getVaultKeyByFaction(
    faction === 'blue' ? 'blue' : faction === 'neutral' ? 'neutral' : 'red',
  );
  return resolveVaultStoreByKey(vaultKey);
}
