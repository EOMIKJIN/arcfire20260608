// ============================================================
// 행성개발 Lv1 설치 — 영역별 전투 선행 (v2.0 §8 개정)
// - 블루·동맹 거점: 전투 조건 없음 (소유·크레딧·시설 체인)
// - 레드·중립·점령 거점: 해당 행성 전투 승리 1회 (누적 N회 아님)
// ============================================================

import { getPlanetOccupationSeedRow } from '../../arcCore/balance/balanceTableRegistry';
import {
  resolveMapFactionSideFromClanIdPure,
  type MapFactionSide,
} from '../../galaxyMap/mapFactionSideCore';
import { t } from '../../i18n';
import { hasPlanetCombatVictorySync } from '../../store/combatMatchTelemetryStore';
import { useClanWarFoundationStore } from '../../store/clanWarFoundationStore';
import { usePlayerStore } from '../../store/playerStore';
import { resolvePlayerHomePlanetId } from '../playerSurvivalPod';

export type PlanetDevInstallTerritory = 'blue_allied' | 'contested';

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

/** 설치 전투 선행 분류 — blue_allied = 승리 불필요 */
export function resolvePlanetDevInstallTerritory(planetId: string): PlanetDevInstallTerritory {
  const id = planetId?.trim();
  if (!id) return 'contested';

  const player = usePlayerStore.getState().player;
  if (!player) return 'contested';

  if (id === resolvePlayerHomePlanetId(player)) return 'blue_allied';

  const playerSide = resolvePlayerFactionSide(player.political?.megaFactionId);
  if (playerSide === 'neutral') return 'contested';

  const seedSide = resolveSeedOwnerSide(id);
  if (seedSide === 'blue' && playerSide === 'blue') return 'blue_allied';

  const foundation = useClanWarFoundationStore.getState();
  const hold = foundation.getHold(id);
  if (hold) {
    const occupierSide = resolveMapFactionSideFromClanIdPure(
      hold.occupierClanId,
      foundation.clans,
    );
    if (occupierSide === playerSide && seedSide === 'blue') return 'blue_allied';
  }

  return 'contested';
}

export function requiresInstallVictoryOnPlanet(planetId: string): boolean {
  return resolvePlanetDevInstallTerritory(planetId) === 'contested';
}

/** contested 영역 — 승리 1회 미충족 시 설치 차단 사유 */
export function resolvePlanetInstallVictoryBlock(planetId: string): string | null {
  if (!requiresInstallVictoryOnPlanet(planetId)) return null;
  if (hasPlanetCombatVictorySync(planetId)) return null;
  return t('planetDev.installCombatVictoryRequired');
}
