import React, { memo, useCallback, useEffect, useState } from 'react';
import { resolvePlayerHomePlanetId } from '../../../game/playerSurvivalPod';
import {
  getPlanetDevelopmentModule,
  PLANET_DEV_MODULE_DEFENSE_SATELLITE,
  registerPlanetDevelopmentModule,
} from '../../../game/planetDevelopment/planetDevelopmentRegistry';
import { markPlanetDevelopmentModuleRegistered } from '../../../game/planetDevelopment/registerPlanetDevelopmentModules';
import { PLANET_DEV_MODULE_ORBIT_SHIPYARD } from '../../../game/planetDevelopment/planetOrbitShipyardDevelopment';
import { registerPlanetSessionResource } from '../../../game/planetSessionRegistry';
import { usePlayerStore } from '../../../store/playerStore';
import { usePlanetCoreRuntimeStore } from '../../../store/planetCoreRuntimeStore';
import type { ArcOverlayPlanetDevelopmentEntry } from '../arcOverlayStore';
import { PlanetDefenseSatelliteDevContent } from './PlanetDefenseSatelliteDevContent';
import { PlanetDevelopmentListContent } from './PlanetDevelopmentListContent';
import { PlanetOrbitShipyardDevContent } from './PlanetOrbitShipyardDevContent';

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
    labelKo: '방위위성',
    summaryKo: '궤도 방어·inbound 드론 요격',
    enabled: true,
    DetailView: PlanetDefenseSatelliteDevContent,
  });
  registerPlanetDevelopmentModule({
    id: PLANET_DEV_MODULE_ORBIT_SHIPYARD,
    labelKo: '궤도 조선소',
    summaryKo: '함대 지원·함선 정비',
    enabled: true,
    DetailView: PlanetOrbitShipyardDevContent,
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
  const homePlanetId = player ? resolvePlayerHomePlanetId(player) : null;
  const isHomePlanet = homePlanetId === planetId;
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
        isHomePlanet={isHomePlanet}
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
      isHomePlanet={isHomePlanet}
      onBack={handleBack}
      onClose={onClose}
    />
  );
});
