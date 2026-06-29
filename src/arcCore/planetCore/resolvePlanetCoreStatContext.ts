// ============================================================
// ArcCore 행성 스탯 context — World / Player / Home (일 1회 패스 공용)
// ============================================================

import { useClanWarFoundationStore } from '../../store/clanWarFoundationStore';
import { usePlayerStore } from '../../store/playerStore';
import type { PlanetClanHold } from '../../types';
import type { PlanetCoreStatAuthorityContext } from '../balance/planetCoreStatAuthorityPolicy';

export function isPlayerOwnedHold(hold: PlanetClanHold, playerUid: string | null | undefined): boolean {
  if (!playerUid) return false;
  if (hold.homePlayerUid === playerUid) return true;
  if (hold.kind === 'player_home' && hold.homePlayerUid === playerUid) return true;
  return false;
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
