import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { ScrollView, Text, View } from 'react-native';

import {

  buildPlanetDevListRowView,

  hasAnyPlanetDevJobInProgress,

  tryCompleteAllPlanetDevJobs,

  type PlanetDevFacilitySnapshotSlice,

} from '../../../game/planetDevelopment/planetDevelopmentListRowModel';

import { listPlanetDevelopmentCatalogRows } from '../../../game/planetDevelopment/planetDevelopmentCatalog';

import { buildOrbitShipyardDevSnapshot } from '../../../game/planetDevelopment/planetOrbitShipyardDevelopment';

import { buildTradePortDevSnapshot } from '../../../game/planetDevelopment/planetTradePortDevelopment';

import { buildLaboratoryDevSnapshot } from '../../../game/planetDevelopment/planetLaboratoryDevelopment';

import { buildTavernFacilityDevSnapshot } from '../../../game/planetDevelopment/planetTavernFacilityDevelopment';

import { buildDefenseSatelliteDevSnapshot } from '../../../systems/planetaryDefense/planetDefenseSatelliteDevelopment';

import { formatCredits } from '../../../utils/formatCredits';

import { showArcAlert } from '../../../utils/showArcAlert';

import { useT } from '../../../i18n';

import { OVERLAY_TOKENS } from '../../../utils/theme';

import { ArcOverlayCard } from '../ArcOverlayCard';
import { ArcOverlayFooterActions } from '../ArcOverlayFooterActions';

import { planetDevelopmentOverlayStyles as styles } from './planetDevelopmentOverlayStyles';

import { PlanetDevelopmentListRow } from './PlanetDevelopmentListRow';



type Props = {

  planetId: string;

  planetName: string;

  credits: number;

  canManageDevelopment: boolean;

  onSelectModule: (moduleId: string) => void;

  onClose: () => void;

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



export const PlanetDevelopmentListContent = memo(function PlanetDevelopmentListContent({

  planetId,

  planetName,

  credits,

  canManageDevelopment,

  onSelectModule,

  onClose,

}: Props) {

  const t = useT();
  const [tick, setTick] = useState(0);

  const PH = OVERLAY_TOKENS.phosphorAccent;

  const catalogRows = listPlanetDevelopmentCatalogRows();



  void tick;



  const defenseSnapshot = buildDefenseSatelliteDevSnapshot(planetId);

  const shipyardSnapshot = buildOrbitShipyardDevSnapshot(planetId);

  const tradePortSnapshot = buildTradePortDevSnapshot(planetId);

  const laboratorySnapshot = buildLaboratoryDevSnapshot(planetId);

  const tavernSnapshot = buildTavernFacilityDevSnapshot(planetId);



  const snapshotByCatalogId = useMemo((): Record<string, PlanetDevFacilitySnapshotSlice | null> => ({

    defense_satellite: toSnapshotSlice(defenseSnapshot),

    dev_orbit_shipyard: toSnapshotSlice(shipyardSnapshot),

    dev_trade_port: toSnapshotSlice(tradePortSnapshot),

    dev_research_lab: toSnapshotSlice(laboratorySnapshot),

    dev_population_dome: toSnapshotSlice(tavernSnapshot),

  }), [

    defenseSnapshot,

    shipyardSnapshot,

    tradePortSnapshot,

    laboratorySnapshot,

    tavernSnapshot,

  ]);



  const activeSnapshots = useMemo(

    () => Object.values(snapshotByCatalogId).filter((s): s is PlanetDevFacilitySnapshotSlice => s != null),

    [snapshotByCatalogId],

  );



  const hasActiveJob = hasAnyPlanetDevJobInProgress(activeSnapshots);



  useEffect(() => {

    if (!hasActiveJob) return undefined;

    const id = setInterval(() => {

      tryCompleteAllPlanetDevJobs(planetId);

      setTick((v) => v + 1);

    }, 500);

    return () => clearInterval(id);

  }, [hasActiveJob, planetId]);



  const resolveLabel = useCallback((row: { id: string; labelKo: string }) => {

    const key = `planetDev.label.${row.id}`;

    const val = t(key);

    return val === key ? row.labelKo : val;

  }, [t]);



  const handlePressRow = useCallback((id: string, enabled: boolean, label: string) => {

    if (enabled) {

      onSelectModule(id);

      return;

    }

    showArcAlert(t('planetDev.comingSoonTitle'), t('planetDev.comingSoonBody', { label }));

  }, [onSelectModule, t]);



  return (
    <ArcOverlayCard
      title={t('planetDev.title')}
      subtitle={t('planetDev.subtitle', { name: planetName, credits: formatCredits(credits, { suffix: true }) })}
      layout="panel"
      footer={<ArcOverlayFooterActions onCancel={onClose} onConfirm={onClose} />}
    >
      {!canManageDevelopment ? (
        <Text style={[styles.hint, { color: PH }]}>
          {t('planetDev.manageDeniedHint')}
        </Text>
      ) : null}
      {catalogRows.map((row) => {
        const snapshot = snapshotByCatalogId[row.id] ?? null;
        const rowView = buildPlanetDevListRowView(row, snapshot);
        return (
          <PlanetDevelopmentListRow
            key={row.id}
            row={rowView}
            onPress={() => handlePressRow(row.id, row.enabled, resolveLabel(row))}
          />
        );
      })}
    </ArcOverlayCard>
  );
});


