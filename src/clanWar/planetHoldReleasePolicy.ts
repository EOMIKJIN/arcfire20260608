// ============================================================
// 플레이어 클랜 해산·계정 purge — 행성 hold 복원 단일 정책
// ============================================================

import type { PlanetClanHold } from '../types';
import {
  isPlayerOriginatedClanId,
  resolveSeedOccupierClanForPlanet,
} from './planetOwnershipModel';

export type PlanetHoldReleaseMode = 'dissolve_clan' | 'purge_account' | 'purge_all_non_ai';

export type ReleasePlayerPlanetHoldsInput = {
  holds: Record<string, PlanetClanHold>;
  removedClanIds: ReadonlySet<string>;
  /** purge 시 orphan 판정 — 남은 클랜 id 집합 */
  remainingClanIds: ReadonlySet<string>;
  uid?: string | null;
  mode: PlanetHoldReleaseMode;
};

export type ReleasePlayerPlanetHoldsResult = {
  holds: Record<string, PlanetClanHold>;
  releasedPlanetCount: number;
};

function shouldReleaseHold(
  hold: PlanetClanHold,
  planetId: string,
  input: ReleasePlayerPlanetHoldsInput,
  remainingClanIds: ReadonlySet<string>,
): boolean {
  const { removedClanIds, uid, mode } = input;
  const deedOwned = Boolean(hold.deedOwnerClanId && removedClanIds.has(hold.deedOwnerClanId));
  const legacyOccupierOwned = removedClanIds.has(hold.occupierClanId);

  if (mode === 'dissolve_clan') {
    if (hold.kind === 'player_home' && legacyOccupierOwned) return true;
    return deedOwned || (legacyOccupierOwned && isPlayerOriginatedClanId(hold.occupierClanId));
  }

  if (mode === 'purge_account') {
    const isTargetPlayerHold =
      (uid != null && hold.homePlayerUid === uid) || deedOwned || legacyOccupierOwned;
    const isOrphanNonAiHold =
      !hold.occupierClanId.startsWith('ai_clan_') && !remainingClanIds.has(hold.occupierClanId);
    return isTargetPlayerHold || isOrphanNonAiHold;
  }

  // purge_all_non_ai
  return !hold.occupierClanId.startsWith('ai_clan_');
}

function restoreHoldAfterPlayerRelease(
  planetId: string,
  hold: PlanetClanHold,
  mode: PlanetHoldReleaseMode,
  uid?: string | null,
): PlanetClanHold | null {
  if (mode === 'dissolve_clan' && hold.kind === 'player_home') {
    return null;
  }

  const seed = resolveSeedOccupierClanForPlanet(planetId);
  return {
    ...hold,
    occupierClanId: seed.occupierClanId,
    deedOwnerClanId: null,
    homePlayerUid: uid != null && hold.homePlayerUid === uid ? null : hold.homePlayerUid,
    kind: seed.kind,
  };
}

/** dissolve / purge 공용 — CSV 시드 기준 복원 */
export function releasePlayerPlanetHolds(
  input: ReleasePlayerPlanetHoldsInput,
): ReleasePlayerPlanetHoldsResult {
  let releasedPlanetCount = 0;
  const next: Record<string, PlanetClanHold> = {};

  for (const [planetId, hold] of Object.entries(input.holds)) {
    if (!shouldReleaseHold(hold, planetId, input, input.remainingClanIds)) {
      next[planetId] = hold;
      continue;
    }

    releasedPlanetCount += 1;
    const restored = restoreHoldAfterPlayerRelease(planetId, hold, input.mode, input.uid);
    if (restored) next[planetId] = restored;
  }

  return { holds: next, releasedPlanetCount };
}
