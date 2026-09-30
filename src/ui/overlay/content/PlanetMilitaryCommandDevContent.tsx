import React, { memo } from 'react';
import type { PlanetDevelopmentModuleContext } from '../../../game/planetDevelopment/planetDevelopmentRegistry';
import {
  PLANET_DEV_MODULE_MILITARY_COMMAND,
  buildMilitaryCommandDevSnapshot,
  formatMilitaryCommandDurationLabel,
  getMilitaryCommandLevelStatRow,
  installPlanetMilitaryCommand,
  instantCompleteMilitaryCommandUpgrade,
  instantUpgradeMilitaryCommandNext,
  listFacilityMilitaryCommandLevelRows,
  startPlanetMilitaryCommandUpgrade,
  tryCompleteMilitaryCommandUpgrade,
} from '../../../game/planetDevelopment/planetMilitaryCommandDevelopment';
import { interpolateMilitaryCommandLevel, resolvePlanetMilitaryCommandPolicy } from '../../../arcCore/balance/planetMilitaryCommandPolicy';
import { resolveMilitaryCommandLogisticsDiscountPct } from '../../../arcCore/planetDevelopment/militaryCommandLogistics';
import { useT } from '../../../i18n';
import { ArcOverlayInfoRow } from '../ArcOverlayInfoRow';
import { PlanetGenericFacilityDevContent } from './PlanetGenericFacilityDevContent';

const api = {
  buildSnapshot: buildMilitaryCommandDevSnapshot,
  tryCompleteUpgrade: tryCompleteMilitaryCommandUpgrade,
  install: installPlanetMilitaryCommand,
  startUpgrade: startPlanetMilitaryCommandUpgrade,
  instantCompleteUpgrade: instantCompleteMilitaryCommandUpgrade,
  instantUpgradeNext: instantUpgradeMilitaryCommandNext,
  formatDurationLabel: formatMilitaryCommandDurationLabel,
  getLevelRow: getMilitaryCommandLevelStatRow,
  listLevelRows: listFacilityMilitaryCommandLevelRows,
};

export const PlanetMilitaryCommandDevContent = memo(function PlanetMilitaryCommandDevContent(
  props: PlanetDevelopmentModuleContext,
) {
  const t = useT();
  const policy = resolvePlanetMilitaryCommandPolicy();
  return (
    <PlanetGenericFacilityDevContent
      {...props}
      moduleId={PLANET_DEV_MODULE_MILITARY_COMMAND}
      i18nPrefix="militaryCommandDev"
      api={api}
      renderExtraStats={(snapshot, _currentRow, visualTheme) => {
        if (!snapshot.installed) return null;
        const doctrine = interpolateMilitaryCommandLevel(
          snapshot.level,
          policy.doctrineAdvantageL1,
          policy.doctrineAdvantageL15,
        );
        return (
          <>
            <ArcOverlayInfoRow
              label={t('militaryCommandDev.doctrineLabel')}
              value={t('militaryCommandDev.doctrineValue', {
                pct: Math.min(policy.doctrineAdvantageCap, doctrine).toFixed(1),
              })}
              visualTheme={visualTheme}
            />
            <ArcOverlayInfoRow
              label={t('militaryCommandDev.logisticsLabel')}
              value={t('militaryCommandDev.logisticsValue', {
                pct: resolveMilitaryCommandLogisticsDiscountPct(snapshot.level).toFixed(1),
              })}
              visualTheme={visualTheme}
            />
          </>
        );
      }}
      renderLevelMeta={(row) => {
        const doctrine = interpolateMilitaryCommandLevel(
          row.level,
          policy.doctrineAdvantageL1,
          policy.doctrineAdvantageL15,
        );
        return t('militaryCommandDev.levelMeta', {
          pct: Math.min(policy.doctrineAdvantageCap, doctrine).toFixed(1),
        });
      }}
    />
  );
});
