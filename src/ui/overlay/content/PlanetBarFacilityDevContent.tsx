import React, { memo } from 'react';
import type { PlanetDevelopmentModuleContext } from '../../../game/planetDevelopment/planetDevelopmentRegistry';
import {
  PLANET_DEV_MODULE_POPULATION_DOME,
  buildBarFacilityDevSnapshot,
  formatBarFacilityDurationLabel,
  getBarFacilityLevelStatRow,
  installPlanetBarFacility,
  instantCompleteBarFacilityUpgrade,
  instantUpgradeBarFacilityNext,
  listFacilityBarLevelRows,
  resolveBarReputationBonusPct,
  startPlanetBarFacilityUpgrade,
  tryCompleteBarFacilityUpgrade,
} from '../../../game/planetDevelopment/planetBarFacilityDevelopment';
import { useT } from '../../../i18n';
import { ArcOverlayInfoRow } from '../ArcOverlayInfoRow';
import { PlanetGenericFacilityDevContent } from './PlanetGenericFacilityDevContent';
import { resolveBarInstanceListedCap } from '../../../missions/barInstanceBoardPolicy';

const api = {
  buildSnapshot: buildBarFacilityDevSnapshot,
  tryCompleteUpgrade: tryCompleteBarFacilityUpgrade,
  install: installPlanetBarFacility,
  startUpgrade: startPlanetBarFacilityUpgrade,
  instantCompleteUpgrade: instantCompleteBarFacilityUpgrade,
  instantUpgradeNext: instantUpgradeBarFacilityNext,
  formatDurationLabel: formatBarFacilityDurationLabel,
  getLevelRow: getBarFacilityLevelStatRow,
  listLevelRows: listFacilityBarLevelRows,
};

export const PlanetBarFacilityDevContent = memo(function PlanetBarFacilityDevContent(props: PlanetDevelopmentModuleContext) {
  const t = useT();
  return (
    <PlanetGenericFacilityDevContent
      {...props}
      moduleId={PLANET_DEV_MODULE_POPULATION_DOME}
      i18nPrefix="populationDomeDev"
      api={api}
      renderExtraStats={(snapshot, _currentRow, visualTheme) => {
        if (!snapshot.installed) return null;
        return (
          <>
            <ArcOverlayInfoRow
              label={t('populationDomeDev.instanceSlotsLabel')}
              value={String(resolveBarInstanceListedCap(snapshot.level))}
              visualTheme={visualTheme}
            />
            <ArcOverlayInfoRow
              label={t('populationDomeDev.reputationLabel')}
              value={`+${resolveBarReputationBonusPct(snapshot.level)}%`}
              visualTheme={visualTheme}
            />
          </>
        );
      }}
      renderLevelMeta={(row) => t('populationDomeDev.levelMeta', {
        slots: resolveBarInstanceListedCap(row.level),
        rep: resolveBarReputationBonusPct(row.level),
      })}
    />
  );
});
