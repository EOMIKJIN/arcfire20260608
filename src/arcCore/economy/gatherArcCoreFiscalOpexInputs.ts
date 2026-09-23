// ============================================================
// 일 1회 — 점유·D·PGP·시설·궤도 관측 수집 (신규 배열 persist 없음)
// ============================================================

import { useClanWarFoundationStore } from '../../store/clanWarFoundationStore';
import { usePlanetCoreRuntimeStore } from '../../store/planetCoreRuntimeStore';
import { useArcNpcTrafficStore } from '../../store/arcNpcTrafficStore';
import { PLANET_GOVERNOR_COMMANDERS_FROM_CSV } from '../../data/generated';
import type { PlanetClanHold } from '../../types';
import {
  isPlayerIndependentHold,
  resolveOccupierFactionKindForHold,
} from './resolveFactionVault';
import { readPlanetOrbitShipyardDetail } from '../../game/planetDevelopment/planetOrbitShipyardListing';
import { readPlanetResearchLabDetail } from '../../game/planetDevelopment/planetResearchLabListing';
import type { ArcCoreFiscalOpexVaultKey } from './arcCoreFiscalOpexPolicy';
import type { FiscalOpexGatheredInputs, FiscalOpexPlanetInput } from './computeArcCoreFiscalOpexProxy';

function vaultKeyForHold(hold: PlanetClanHold | undefined): ArcCoreFiscalOpexVaultKey {
  if (!hold) return 'red';
  if (isPlayerIndependentHold(hold)) return 'independent';
  const kind = resolveOccupierFactionKindForHold(hold);
  if (kind === 'blue') return 'blue';
  if (kind === 'neutral') return 'neutral';
  return 'red';
}

const GOVERNOR_TALK_BY_PLANET: ReadonlyMap<string, boolean> = (() => {
  const map = new Map<string, boolean>();
  for (const row of PLANET_GOVERNOR_COMMANDERS_FROM_CSV) {
    map.set(row.planetId, row.talkEnabled === true);
  }
  return map;
})();

export function gatherArcCoreFiscalOpexInputs(): FiscalOpexGatheredInputs {
  const holds = useClanWarFoundationStore.getState().planetHolds;
  const core = usePlanetCoreRuntimeStore.getState();
  const planets: FiscalOpexPlanetInput[] = [];
  const seen = new Set<string>();

  for (const planetId of Object.keys(holds)) {
    if (seen.has(planetId)) continue;
    seen.add(planetId);
    const runtime = core.getPlanetCoreRuntime(planetId);
    const shipyard = readPlanetOrbitShipyardDetail(planetId);
    const lab = readPlanetResearchLabDetail(planetId);
    planets.push({
      planetId,
      vaultKey: vaultKeyForHold(holds[planetId]),
      defense: runtime?.defense ?? 0,
      pgp: typeof runtime?.pgp === 'number' && Number.isFinite(runtime.pgp) ? runtime.pgp : 0,
      shipyardLevel: shipyard.installed ? Math.max(0, Math.floor(shipyard.level)) : 0,
      laboratoryLevel: lab.installed ? Math.max(0, Math.floor(lab.level || 0)) : 0,
      talkEnabledGovernor: GOVERNOR_TALK_BY_PLANET.get(planetId) === true,
    });
  }

  const traffic = useArcNpcTrafficStore.getState();
  const orbitShipCount = traffic.ships.length;
  const orbitCaptainIds = new Set<string>();
  for (let i = 0; i < traffic.captains.length; i += 1) {
    const id = traffic.captains[i]?.id;
    if (id) orbitCaptainIds.add(id);
  }

  return {
    planets,
    orbitShipCount,
    orbitCaptainCount: orbitCaptainIds.size,
  };
}
