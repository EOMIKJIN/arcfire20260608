import React, { memo, useCallback, useEffect, useState } from 'react';
import { canManagePlanetDevelopment } from '../../../game/planetDevelopment/planetDevelopmentAccess';
import {
  getPlanetDevelopmentModule,
  PLANET_DEV_MODULE_DEFENSE_SATELLITE,
  registerPlanetDevelopmentModule,
} from '../../../game/planetDevelopment/planetDevelopmentRegistry';
import { markPlanetDevelopmentModuleRegistered } from '../../../game/planetDevelopment/registerPlanetDevelopmentModules';
import { PLANET_DEV_MODULE_ORBIT_SHIPYARD } from '../../../game/planetDevelopment/planetOrbitShipyardDevelopment';
import { PLANET_DEV_MODULE_TRADE_PORT } from '../../../game/planetDevelopment/planetTradePortListing';
import { PLANET_DEV_MODULE_RESEARCH_LAB } from '../../../game/planetDevelopment/planetResearchLabListing';
import { PLANET_DEV_MODULE_POPULATION_DOME } from '../../../game/planetDevelopment/planetPopulationDomeListing';
import { registerPlanetSessionResource } from '../../../game/planetSessionRegistry';
import { usePlayerStore } from '../../../store/playerStore';
import { usePlanetCoreRuntimeStore } from '../../../store/planetCoreRuntimeStore';
import type { ArcOverlayPlanetDevelopmentEntry } from '../arcOverlayStore';
import { PlanetDefenseSatelliteDevContent } from './PlanetDefenseSatelliteDevContent';
import { PlanetDevelopmentListContent } from './PlanetDevelopmentListContent';
import { PlanetOrbitShipyardDevContent } from './PlanetOrbitShipyardDevContent';
import { PlanetTradePortDevContent } from './PlanetTradePortDevContent';
import { PlanetLaboratoryDevContent } from './PlanetLaboratoryDevContent';
import { PlanetTavernFacilityDevContent } from './PlanetTavernFacilityDevContent';

type DevView = 'list' | string;

type Props = {
  entry: ArcOverlayPlanetDevelopmentEntry;
  onClose: () => void;
};

let modulesRegistered = false;

function ensurePlanetDevelopmentModulesRegistered(): void {
  if (modulesRegistered) return;
  registerPlanetDevelopmentModule({
    id: PLANET_DEV_MODULE_DEFENSE_SATELLITE,
    enabled: true,
    DetailView: PlanetDefenseSatelliteDevContent,
  });
  registerPlanetDevelopmentModule({
    id: PLANET_DEV_MODULE_ORBIT_SHIPYARD,
    enabled: true,
    DetailView: PlanetOrbitShipyardDevContent,
  });
  registerPlanetDevelopmentModule({
    id: PLANET_DEV_MODULE_TRADE_PORT,
    enabled: true,
    DetailView: PlanetTradePortDevContent,
  });
  registerPlanetDevelopmentModule({
    id: PLANET_DEV_MODULE_RESEARCH_LAB,
    enabled: true,
    DetailView: PlanetLaboratoryDevContent,
  });
  registerPlanetDevelopmentModule({
    id: PLANET_DEV_MODULE_POPULATION_DOME,
    enabled: true,
    DetailView: PlanetTavernFacilityDevContent,
  });
  /** legacy save deep-link */
  registerPlanetDevelopmentModule({
    id: 'dev_laboratory',
    enabled: true,
    DetailView: PlanetLaboratoryDevContent,
  });
  registerPlanetDevelopmentModule({
    id: 'dev_tavern',
    enabled: true,
    DetailView: PlanetTavernFacilityDevContent,
  });
  markPlanetDevelopmentModuleRegistered();
  modulesRegistered = true;
}

export const PlanetDevelopmentOverlayContent = memo(function PlanetDevelopmentOverlayContent({
  entry,
  onClose,
}: Props) {
  const { planetId, planetName, initialView = 'list' } = entry;
  const [view, setView] = useState<DevView>(initialView);
  const player = usePlayerStore((s) => s.player);
  const canManageDevelopment = canManagePlanetDevelopment(planetId);
  const credits = player?.credits ?? 0;

  useEffect(() => {
    ensurePlanetDevelopmentModulesRegistered();
  }, []);

  useEffect(() => {
    setView(initialView);
  }, [entry.id, initialView]);

  useEffect(() => {
    void usePlanetCoreRuntimeStore.getState().bootstrapFromWorldAsync();
  }, [planetId]);

  useEffect(() => {
    if (!planetId) return undefined;
    const token = registerPlanetSessionResource({
      ownerId: 'planet_development_overlay',
      planetId,
      dispose: () => {},
    });
    return () => token.release();
  }, [planetId]);

  const handleSelectModule = useCallback((moduleId: string) => {
    setView(moduleId);
  }, []);

  const handleBack = useCallback(() => {
    setView('list');
  }, []);

  if (view === 'list') {
    return (
      <PlanetDevelopmentListContent
        planetId={planetId}
        planetName={planetName}
        credits={credits}
        canManageDevelopment={canManageDevelopment}
        onSelectModule={handleSelectModule}
        onClose={onClose}
      />
    );
  }

  const moduleReg = getPlanetDevelopmentModule(view);
  const DetailView = moduleReg?.DetailView ?? PlanetDefenseSatelliteDevContent;

  return (
    <DetailView
      planetId={planetId}
      planetName={planetName}
      canManageDevelopment={canManageDevelopment}
      onBack={handleBack}
      onClose={onClose}
    />
  );
});
