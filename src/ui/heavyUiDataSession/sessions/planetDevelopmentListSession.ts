import { listPlanetDevelopmentCatalogRows } from '../../../game/planetDevelopment/planetDevelopmentCatalog';
import type { PlanetDevFacilitySnapshotSlice } from '../../../game/planetDevelopment/planetDevelopmentListRowModel';
import { buildOrbitShipyardDevSnapshot } from '../../../game/planetDevelopment/planetOrbitShipyardDevelopment';
import { buildTradePortDevSnapshot } from '../../../game/planetDevelopment/planetTradePortDevelopment';
import { buildLaboratoryDevSnapshot } from '../../../game/planetDevelopment/planetLaboratoryDevelopment';
import { buildTavernFacilityDevSnapshot } from '../../../game/planetDevelopment/planetTavernFacilityDevelopment';
import { buildDefenseSatelliteDevSnapshot } from '../../../systems/planetaryDefense/planetDefenseSatelliteDevelopment';
import { createPlanetDevelopmentHydrateSteps } from '../hydrateRecipes';
import { preflightPlanetHubSession } from '../preflightPlanetHub';
import type { HeavyUiSessionConfig } from '../types';

export type PlanetDevelopmentListSessionData = {
  catalogRows: ReturnType<typeof listPlanetDevelopmentCatalogRows>;
  snapshotByCatalogId: Record<string, PlanetDevFacilitySnapshotSlice | null>;
  activeSnapshots: PlanetDevFacilitySnapshotSlice[];
};

function toSnapshotSlice(
  snap: PlanetDevFacilitySnapshotSlice & { activeSatelliteCount?: number },
): PlanetDevFacilitySnapshotSlice {
  return {
    installed: snap.installed,
    level: snap.level,
    isInstalling: snap.isInstalling,
    isUpgrading: snap.isUpgrading,
    upgradeProgressPct: snap.upgradeProgressPct,
    upgradeJob: snap.upgradeJob,
    isCsvWorldBaseline: snap.isCsvWorldBaseline,
    activeSatelliteCount: snap.activeSatelliteCount,
  };
}

export function buildPlanetDevelopmentListSessionData(
  planetId: string,
): PlanetDevelopmentListSessionData {
  const catalogRows = listPlanetDevelopmentCatalogRows();
  const defenseSnapshot = buildDefenseSatelliteDevSnapshot(planetId);
  const shipyardSnapshot = buildOrbitShipyardDevSnapshot(planetId);
  const tradePortSnapshot = buildTradePortDevSnapshot(planetId);
  const laboratorySnapshot = buildLaboratoryDevSnapshot(planetId);
  const tavernSnapshot = buildTavernFacilityDevSnapshot(planetId);

  const snapshotByCatalogId: Record<string, PlanetDevFacilitySnapshotSlice | null> = {
    defense_satellite: toSnapshotSlice(defenseSnapshot),
    dev_orbit_shipyard: toSnapshotSlice(shipyardSnapshot),
    dev_trade_port: toSnapshotSlice(tradePortSnapshot),
    dev_research_lab: toSnapshotSlice(laboratorySnapshot),
    dev_population_dome: toSnapshotSlice(tavernSnapshot),
  };

  const activeSnapshots = Object.values(snapshotByCatalogId).filter(
    (s): s is PlanetDevFacilitySnapshotSlice => s != null,
  );

  return { catalogRows, snapshotByCatalogId, activeSnapshots };
}

export function createPlanetDevelopmentListSession(
  planetId: string,
): HeavyUiSessionConfig<PlanetDevelopmentListSessionData> {
  return {
    sessionKey: `planet-development-list:${planetId}`,
    preflight: () => preflightPlanetHubSession(planetId),
    hydrateSteps: createPlanetDevelopmentHydrateSteps(),
    build: () => buildPlanetDevelopmentListSessionData(planetId),
  };
}
