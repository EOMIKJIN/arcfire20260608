// ============================================================
// 소유권 구매 — 클라우드 유일 락 성공 후에만 로컬 hold
// ============================================================

import { isPlayerIndependentNationHold } from '../../clanWar/planetOwnershipModel';
import { soloClanIdForUid } from '../../clanWar/clanWarRules';
import {
  acquirePlanetUniqueDeedLock,
  releasePlanetUniqueDeedLock,
  type AcquirePlanetUniqueDeedResult,
} from '../../firebase/planetUniqueDeedLock';
import {
  appendUniqueDeedRowIfMissing,
  type PlanetUniqueDeedRow,
} from '../../firebase/planetUniqueDeedModel';
import { useClanWarFoundationStore } from '../../store/clanWarFoundationStore';
import { usePlanetDeedCashGrantStore } from '../../store/planetDeedCashGrantStore';
import { usePlayerStore } from '../../store/playerStore';
import type { Player } from '../../types';
import { QUAD_NATION_BY_KIND } from '../../world/megaFactionNationPolicy';

export type ClaimPlanetOwnershipWithUniqueLockReason =
  | 'no_player'
  | 'cloud_taken'
  | 'cloud_offline'
  | 'cloud_auth'
  | 'invalid'
  | 'red_territory'
  | 'faction_mismatch'
  | 'neutral_territory'
  | 'neutral_planet'
  | 'already_owner'
  | 'owned_by_other_clan';

export type ClaimPlanetOwnershipWithUniqueLockResult =
  | { ok: true; clanId?: string }
  | { ok: false; reason: ClaimPlanetOwnershipWithUniqueLockReason };

export function resolveMegaFactionDisplayNameForDeed(
  megaFactionId: string,
  locale: 'ko' | 'en' = 'ko',
): string {
  const id = megaFactionId.trim();
  if (!id) return '';
  const nations = Object.values(QUAD_NATION_BY_KIND);
  for (let i = 0; i < nations.length; i += 1) {
    const nation = nations[i];
    if (nation?.megaFactionId === id) {
      return locale === 'en' ? nation.displayNameEn : nation.displayNameKo;
    }
  }
  return '';
}

export function buildPlanetUniqueDeedWriteFromPlayer(
  player: Player,
  planetId: string,
): {
  planetId: string;
  ownerUid: string;
  nickname: string;
  playerLevel: number;
  megaFactionId: string;
} {
  return {
    planetId,
    ownerUid: player.uid,
    nickname: player.nickname?.trim() || 'Unknown',
    playerLevel: Math.max(1, Math.floor(player.level || 1)),
    megaFactionId: player.political?.megaFactionId?.trim() || '',
  };
}

export function listLocalPlayerUniqueDeedPlanetIds(uid: string): string[] {
  const clanId = soloClanIdForUid(uid);
  const holds = useClanWarFoundationStore.getState().planetHolds;
  const out: string[] = [];
  const keys = Object.keys(holds);
  for (let i = 0; i < keys.length; i += 1) {
    const planetId = keys[i];
    const hold = holds[planetId!];
    if (!hold || !isPlayerIndependentNationHold(hold)) continue;
    if (hold.homePlayerUid === uid || hold.deedOwnerClanId === clanId) {
      out.push(hold.planetId);
    }
  }
  return out;
}

/** 랭킹 폴백 — 클라우드 실패 시 이미 hydrate된 로컬 hold만. 신규 할당은 오픈 1회. */
export function listLocalPlayerUniqueDeedRows(uid: string): PlanetUniqueDeedRow[] {
  const player = usePlayerStore.getState().player;
  if (!player || player.uid !== uid) return [];
  const holds = useClanWarFoundationStore.getState().planetHolds;
  const ids = listLocalPlayerUniqueDeedPlanetIds(uid);
  const out: PlanetUniqueDeedRow[] = [];
  const base = buildPlanetUniqueDeedWriteFromPlayer(player, '');
  for (let i = 0; i < ids.length; i += 1) {
    const planetId = ids[i];
    if (!planetId) continue;
    const hold = holds[planetId];
    const securedAt =
      hold && Number.isFinite(hold.capturedAt) && hold.capturedAt > 0
        ? Math.floor(hold.capturedAt)
        : Date.now();
    out.push({
      planetId,
      ownerUid: base.ownerUid,
      nickname: base.nickname,
      playerLevel: base.playerLevel,
      megaFactionId: base.megaFactionId,
      securedAt,
    });
  }
  return out;
}

/** 현금 증서 클레임만 있고 hold hydrate가 늦은 경우 한 장 보충. 신규 할당은 오픈 1회. */
export function appendClaimedPlanetToLocalDeedRows(
  rows: readonly PlanetUniqueDeedRow[],
  claimedPlanetId: string | null | undefined,
  player: Player,
): PlanetUniqueDeedRow[] {
  const id = claimedPlanetId?.trim();
  if (!id) return rows.slice();
  const base = buildPlanetUniqueDeedWriteFromPlayer(player, id);
  return appendUniqueDeedRowIfMissing(rows, {
    planetId: id,
    ownerUid: base.ownerUid,
    nickname: base.nickname,
    playerLevel: base.playerLevel,
    megaFactionId: base.megaFactionId,
    securedAt: Date.now(),
  });
}

/** 랭킹 오픈 1회 — 독립국 hold + 현금 증서 claimedPlanetId. 거점(player_home)만은 제외. */
export function collectLocalPlayerUniqueDeedRows(uid: string): PlanetUniqueDeedRow[] {
  const player = usePlayerStore.getState().player;
  if (!player || player.uid !== uid) return [];
  const holds = listLocalPlayerUniqueDeedRows(uid);
  return appendClaimedPlanetToLocalDeedRows(
    holds,
    usePlanetDeedCashGrantStore.getState().claimedPlanetId,
    player,
  );
}

export async function claimPlanetOwnershipWithUniqueLock(params: {
  uid: string;
  planetId: string;
  systemId: string;
  nickname: string;
  megaFactionId: string;
}): Promise<ClaimPlanetOwnershipWithUniqueLockResult> {
  const player = usePlayerStore.getState().player;
  if (!player || player.uid !== params.uid) {
    return { ok: false, reason: 'no_player' };
  }

  const cloud = await acquirePlanetUniqueDeedLock(
    buildPlanetUniqueDeedWriteFromPlayer(player, params.planetId),
  );
  if (!cloud.ok) {
    return { ok: false, reason: mapAcquireReason(cloud) };
  }

  const claim = useClanWarFoundationStore.getState().claimPlanetOwnershipByPurchase(params);
  if (!claim.ok) {
    if (!cloud.alreadyOwned) {
      await releasePlanetUniqueDeedLock(params.planetId);
    }
    return { ok: false, reason: (claim.reason ?? 'owned_by_other_clan') as ClaimPlanetOwnershipWithUniqueLockReason };
  }
  return { ok: true, clanId: claim.clanId };
}

function mapAcquireReason(
  result: Extract<AcquirePlanetUniqueDeedResult, { ok: false }>,
): ClaimPlanetOwnershipWithUniqueLockReason {
  return result.reason;
}
