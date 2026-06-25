import React, { memo, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useT } from '../../../i18n';
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
import {
  HeavyUiOverlayShell,
  createPlanetDevDetailSession,
  useHeavyUiDataSession,
} from '../../heavyUiDataSession';
import type { ArcOverlayPlanetDevelopmentEntry } from '../arcOverlayStore';
import { ArcOverlayFooterActions } from '../ArcOverlayFooterActions';
import { resolveArcOverlayVisualTheme } from '../tacticalOverlayRollout';
import { PlanetDefenseSatelliteDevContent } from './PlanetDefenseSatelliteDevContent';
import { PlanetDevelopmentListContent } from './PlanetDevelopmentListContent';
import { PlanetOrbitShipyardDevContent } from './PlanetOrbitShipyardDevContent';
import { PlanetTradePortDevContent } from './PlanetTradePortDevContent';
import { PlanetLaboratoryDevContent } from './PlanetLaboratoryDevContent';
import { PlanetTavernFacilityDevContent } from './PlanetTavernFacilityDevContent';

type DevView = 'list' | string;

type DevDetailHydrateGateProps = {
  planetId: string;
  planetName: string;
  moduleId: string;
  titleKey: string;
  backLabelKey: string;
  onBack: () => void;
  onClose: () => void;
  children: ReactNode;
};

/** 행성개발 상세 — preflight + 코어 bootstrap 후 본문 렌더 */
const PlanetDevDetailHydrateGate = memo(function PlanetDevDetailHydrateGate({
  planetId,
  planetName,
  moduleId,
  titleKey,
  backLabelKey,
  onBack,
  onClose,
  children,
}: DevDetailHydrateGateProps) {
  const t = useT();
  const visualTheme = resolveArcOverlayVisualTheme('planetDevelopment');
  const sessionConfig = useMemo(
    () =>
      createPlanetDevDetailSession(planetId, moduleId, () => ({
        planetId,
        moduleId,
      })),
    [moduleId, planetId],
  );
  const session = useHeavyUiDataSession(sessionConfig);

  if (session.phase !== 'ready') {
    return (
      <HeavyUiOverlayShell
        title={t(titleKey)}
        subtitle={planetName}
        layout="panel"
        phase={session.phase}
        error={session.error}
        preflightCode={session.preflightCode}
        onClose={onClose}
        onRetry={session.retry}
        visualTheme={visualTheme}
        footer={
          <ArcOverlayFooterActions
            onCancel={onBack}
            onConfirm={onClose}
            cancelLabel={t(backLabelKey)}
            confirmLabel={t('planetDev.close')}
            visualTheme={visualTheme}
          />
        }
      >
        {null}
      </HeavyUiOverlayShell>
    );
  }

  return <>{children}</>;
});

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

  const detailBody = (
    <DetailView
      planetId={planetId}
      planetName={planetName}
      canManageDevelopment={canManageDevelopment}
      onBack={handleBack}
      onClose={onClose}
    />
  );

  const needsHydrateGate =
    view === PLANET_DEV_MODULE_DEFENSE_SATELLITE
    || view === PLANET_DEV_MODULE_ORBIT_SHIPYARD;

  if (needsHydrateGate) {
    const titleKey =
      view === PLANET_DEV_MODULE_DEFENSE_SATELLITE
        ? 'defenseSat.title'
        : 'orbitShipyard.title';
    const backLabelKey =
      view === PLANET_DEV_MODULE_DEFENSE_SATELLITE
        ? 'defenseSat.backToList'
        : 'orbitShipyard.backToList';
    return (
      <PlanetDevDetailHydrateGate
        planetId={planetId}
        planetName={planetName}
        moduleId={view}
        titleKey={titleKey}
        backLabelKey={backLabelKey}
        onBack={handleBack}
        onClose={onClose}
      >
        {detailBody}
      </PlanetDevDetailHydrateGate>
    );
  }

  return detailBody;
});
