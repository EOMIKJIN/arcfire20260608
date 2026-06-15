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

export type OccupierFactionKind = 'red' | 'blue' | 'neutral' | 'player_clan';

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

/** RED·BLUE 시드 점유 행성의 팩션 금고. 플레이어·중립은 null (플레이어 지갑·아크 금고 폴백). */
export function resolveFactionVaultForOccupierClanId(
  occupierClanId: string,
): Pick<FactionVaultState, 'hydrate' | 'applyDelta' | 'trySpend' | 'appendInflow' | 'getBalance'> | null {
  const faction = resolveOccupierFactionKind(occupierClanId);
  if (faction === 'red') return useArcCoreVaultStore.getState();
  if (faction === 'blue') return useBlueTeamSharedVaultStore.getState();
  return null;
}

export function resolveFactionVaultForPlanetId(
  planetId: string,
): Pick<FactionVaultState, 'hydrate' | 'applyDelta' | 'trySpend' | 'appendInflow' | 'getBalance'> | null {
  const hold = getClanWarFoundationStore().getState().getHold(planetId);
  if (!hold) return null;
  return resolveFactionVaultForOccupierClanId(hold.occupierClanId);
}

/** 무역 수수료(팩션 몫) — RED/BLUE 행성은 각 금고, 중립·플레이어 클랜 점유는 아크코어 금고 */
export function resolveTradeFeeFactionVault(
  planetId: string,
): Pick<FactionVaultState, 'hydrate' | 'applyDelta' | 'trySpend' | 'appendInflow' | 'getBalance'> {
  if (process.env.ARCFIRE_HEADLESS_ECONOMY_AUDIT === '1') {
    return useArcCoreVaultStore.getState();
  }
  const vault = resolveFactionVaultForPlanetId(planetId);
  return vault ?? useArcCoreVaultStore.getState();
}
