// ============================================================
// 행성개발 설치·업그레이드 권한 — 거점 + 블루팩션 영역·동맹 점유
// ============================================================

import { isRedOccupiedPlanet } from '../../clanWar/planetTerritoryPlayerAccess';
import { resolveDeedOwnerClanId } from '../../clanWar/planetOwnershipModel';
import { getPlanetOccupationSeedRow } from '../../arcCore/balance/balanceTableRegistry';
import { resolvePlayerHomePlanetId } from '../playerSurvivalPod';
import {
  resolveMapFactionSideFromClanIdPure,
  type MapFactionSide,
} from '../../galaxyMap/mapFactionSideCore';
import { useClanWarFoundationStore } from '../../store/clanWarFoundationStore';
import { usePlayerStore } from '../../store/playerStore';
import { isSynthFrontierPlanetId } from '../../world/isSynthFrontierPlanetId';
import { resolveSystemIdForPlanetId } from '../../world/resolvePlanetSystemId';

function resolvePlayerFactionSide(megaFactionId: string | undefined): MapFactionSide {
  const mega = megaFactionId?.trim();
  if (mega === 'mega_stellium_alliance') return 'blue';
  if (mega === 'mega_crimson_legion') return 'red';
  return 'neutral';
}

function resolveSeedOwnerSide(planetId: string): MapFactionSide | null {
  const row = getPlanetOccupationSeedRow(planetId);
  if (!row) return null;
  const owner = String(row.initialOwner ?? '').trim().toUpperCase();
  if (owner === 'BLUE') return 'blue';
  if (owner === 'RED') return 'red';
  if (owner === 'NEUTRAL') return 'neutral';
  return null;
}

/** 행성개발 메뉴에서 설치·업그레이드 가능 여부 */
export function canManagePlanetDevelopment(planetId: string): boolean {
  const id = planetId?.trim();
  if (!id) return false;

  /** RED 점령지 — ArcCore 전용, 플레이어 개발 불가 */
  if (isRedOccupiedPlanet(id)) return false;

  const player = usePlayerStore.getState().player;
  if (!player) return false;

  if (id === resolvePlayerHomePlanetId(player)) return true;

  const currentPlanetId = player.currentPlanetId?.trim() || null;
  if (currentPlanetId === id) return true;

  if (isSynthFrontierPlanetId(id)) {
    const systemId = resolveSystemIdForPlanetId(id);
    if (systemId && player.currentSystemId === systemId) return true;
  }

  const playerSide = resolvePlayerFactionSide(player.political?.megaFactionId);
  const foundation = useClanWarFoundationStore.getState();
  const hold = foundation.getHold(id);

  if (hold) {
    const playerClanId = player.political?.clanId?.trim();
    if (playerClanId && resolveDeedOwnerClanId(hold) === playerClanId) return true;

    const occupierSide = resolveMapFactionSideFromClanIdPure(
      hold.occupierClanId,
      foundation.clans,
    );
    if (occupierSide !== 'neutral' && occupierSide === playerSide) return true;
  }

  const seedSide = resolveSeedOwnerSide(id);
  if (seedSide && seedSide !== 'neutral' && seedSide === playerSide) return true;

  return false;
}
