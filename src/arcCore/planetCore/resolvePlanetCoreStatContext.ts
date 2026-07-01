// ============================================================
// ArcCore 행성 스탯 context — World / Player / Home (일 1회 패스 공용)
// ============================================================

import { isPlayerPlanetDeedOwner } from '../../clanWar/planetOwnershipModel';
import { useClanWarFoundationStore } from '../../store/clanWarFoundationStore';
import { usePlayerStore } from '../../store/playerStore';
import type { PlanetClanHold } from '../../types';
import type { PlanetCoreStatAuthorityContext } from '../balance/planetCoreStatAuthorityPolicy';

export function isPlayerOwnedHold(hold: PlanetClanHold, playerUid: string | null | undefined): boolean {
  const playerClanId = usePlayerStore.getState().player?.political?.clanId ?? null;
  return isPlayerPlanetDeedOwner(hold, playerUid, playerClanId);
}

/** ArcCore authority 분류 — player_home > player_owned > world_default */
export function resolvePlanetCoreStatAuthorityContext(planetId: string): PlanetCoreStatAuthorityContext {
  const playerUid = usePlayerStore.getState().player?.uid ?? null;
  if (!playerUid || !planetId) return 'world_default';

  const hold = useClanWarFoundationStore.getState().planetHolds[planetId];
  if (!hold || !isPlayerOwnedHold(hold, playerUid)) return 'world_default';
  if (hold.kind === 'player_home') return 'player_home';
  return 'player_owned';
}
