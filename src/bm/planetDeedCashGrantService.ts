// ============================================================
// 행성 소유권 현금 증서권 — 더미 IAP 지급 + 행성 선택 클레임
// 핫 경로 금지. 상점 오픈·구매·클레임만.
// ============================================================

import { canPurchasePlanetOwnershipDeed, isPlayerIndependentNationHold } from '../clanWar/planetOwnershipModel';
import { soloClanIdForUid } from '../clanWar/clanWarRules';
import { claimPlanetOwnershipWithUniqueLock } from '../game/planetOwnership/claimPlanetOwnershipWithUniqueLock';
import { fetchPlanetUniqueDeedRoster } from '../firebase/planetUniqueDeedLock';
import { isPlanetOwnershipDeedCatalogEligible } from '../arcCore/balance/planetOwnershipDeedCatalog';
import { useClanWarFoundationStore } from '../store/clanWarFoundationStore';
import { usePlanetDeedCashGrantStore } from '../store/planetDeedCashGrantStore';
import { usePlayerStore } from '../store/playerStore';
import { resolveStarSystemDisplayNameNow } from '../i18n/systemText';
import {
  listCoreOpenGameplayPlanetIds,
  resolveCoreOpenGameplayPlanetRef,
} from '../world/coreOpenGameplayPlanets';
import { resolveSystemIdForPlanetIdFromGalaxy } from '../world/resolvePlanetSystemPosition';
import {
  getPlanetDeedIapAccountLimit,
  PLANET_DEED_IAP_PRODUCT_ID,
  PLANET_DEED_PICKER_MAX_ROWS,
} from './planetDeedCashGrantPolicy';

export type PlanetDeedPickerRow = {
  planetId: string;
  name: string;
  /** 소속 성계 표시명 — 행성명과 별개 서브타이틀 */
  systemName: string;
};

export type PlanetDeedGrantStatus = {
  purchasedCount: number;
  accountLimit: number;
  pendingGrant: boolean;
  claimedPlanetId: string | null;
  canPurchase: boolean;
  canPickPlanet: boolean;
};

function findExistingPlayerDeedPlanetId(uid: string): string | null {
  const clanId = soloClanIdForUid(uid);
  const holds = useClanWarFoundationStore.getState().planetHolds;
  const openIds = listCoreOpenGameplayPlanetIds();
  for (let i = 0; i < openIds.length; i += 1) {
    const planetId = openIds[i];
    const hold = holds[planetId];
    if (!hold || !isPlayerIndependentNationHold(hold)) continue;
    if (hold.deedOwnerClanId === clanId || hold.occupierClanId === clanId) {
      return planetId;
    }
  }
  return null;
}

export async function ensurePlanetDeedCashGrantReady(): Promise<void> {
  const store = usePlanetDeedCashGrantStore.getState();
  if (!store.hydrated) {
    await store.hydrate();
  }
  const player = usePlayerStore.getState().player;
  if (!player?.uid) return;
  const latest = usePlanetDeedCashGrantStore.getState();
  if (latest.claimedPlanetId) return;
  const existing = findExistingPlayerDeedPlanetId(player.uid);
  if (existing) {
    latest.syncExistingClaim(existing);
  }
}

export function readPlanetDeedGrantStatus(): PlanetDeedGrantStatus {
  const s = usePlanetDeedCashGrantStore.getState();
  const accountLimit = getPlanetDeedIapAccountLimit(PLANET_DEED_IAP_PRODUCT_ID);
  const claimedPlanetId = s.claimedPlanetId;
  const atLimit = s.purchasedCount >= accountLimit || Boolean(claimedPlanetId);
  return {
    purchasedCount: s.purchasedCount,
    accountLimit,
    pendingGrant: s.pendingGrant && !claimedPlanetId,
    claimedPlanetId,
    canPurchase: !atLimit && !s.pendingGrant,
    canPickPlanet: s.pendingGrant && !claimedPlanetId,
  };
}

export function grantPlanetDeedPurchaseDummy(): { ok: true } | { ok: false; reason: 'already' | 'no_player' } {
  const player = usePlayerStore.getState().player;
  if (!player?.uid) return { ok: false, reason: 'no_player' };
  const status = readPlanetDeedGrantStatus();
  if (!status.canPurchase && !status.canPickPlanet) {
    return { ok: false, reason: 'already' };
  }
  if (status.canPickPlanet) return { ok: true };
  usePlanetDeedCashGrantStore.getState().applyPurchase();
  return { ok: true };
}

export function listPlanetDeedCashGrantTargets(): PlanetDeedPickerRow[] {
  const player = usePlayerStore.getState().player;
  if (!player?.uid) return [];
  const clanWar = useClanWarFoundationStore.getState();
  const clanId = soloClanIdForUid(player.uid);
  const out: PlanetDeedPickerRow[] = [];
  const ids = listCoreOpenGameplayPlanetIds();
  for (let i = 0; i < ids.length && out.length < PLANET_DEED_PICKER_MAX_ROWS; i += 1) {
    const planetId = ids[i];
    if (!isPlanetOwnershipDeedCatalogEligible(planetId)) continue;
    const check = canPurchasePlanetOwnershipDeed(
      planetId,
      clanWar.planetHolds[planetId],
      clanId,
      player.political.megaFactionId,
      clanWar.clans,
    );
    if (!check.ok) continue;
    const ref = resolveCoreOpenGameplayPlanetRef(planetId);
    out.push({
      planetId,
      name: ref?.planet.name?.trim() || planetId,
      systemName: ref?.system
        ? resolveStarSystemDisplayNameNow(ref.system)
        : '',
    });
  }
  return out;
}

export async function listPlanetDeedCashGrantTargetsWithCloud(): Promise<PlanetDeedPickerRow[]> {
  const local = listPlanetDeedCashGrantTargets();
  const player = usePlayerStore.getState().player;
  if (!player?.uid || local.length === 0) return local;
  const roster = await fetchPlanetUniqueDeedRoster();
  if (!roster.ok) return local;
  const taken = new Set<string>();
  for (let i = 0; i < roster.rows.length; i += 1) {
    const row = roster.rows[i];
    if (!row) continue;
    if (row.ownerUid !== player.uid) taken.add(row.planetId);
  }
  return local.filter((row) => !taken.has(row.planetId));
}

export async function claimPlanetDeedFromCashGrant(planetId: string): Promise<{
  ok: true;
  planetName: string;
} | {
  ok: false;
  reason: 'no_player' | 'no_grant' | 'claim_failed';
  claimReason?: string;
}> {
  const player = usePlayerStore.getState().player;
  if (!player?.uid) return { ok: false, reason: 'no_player' };
  const status = readPlanetDeedGrantStatus();
  if (!status.canPickPlanet) return { ok: false, reason: 'no_grant' };
  const id = planetId.trim();
  const systemId = resolveSystemIdForPlanetIdFromGalaxy(id) ?? player.currentSystemId ?? '';
  const claim = await claimPlanetOwnershipWithUniqueLock({
    uid: player.uid,
    planetId: id,
    systemId,
    nickname: player.nickname,
    megaFactionId: player.political.megaFactionId,
  });
  if (!claim.ok) {
    return { ok: false, reason: 'claim_failed', claimReason: claim.reason };
  }
  usePlanetDeedCashGrantStore.getState().applyClaim(id);
  const ref = resolveCoreOpenGameplayPlanetRef(id);
  return { ok: true, planetName: ref?.planet.name?.trim() || id };
}
