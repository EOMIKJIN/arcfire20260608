import React, { memo } from 'react';
import type { PlanetDevelopmentModuleContext } from '../../../game/planetDevelopment/planetDevelopmentRegistry';
import { readPlanetCoreStatRdSnapshot } from '../../../game/planetDevelopment/planetCoreStatRdRuntime';
import {
  PLANET_DEV_MODULE_RESEARCH_LAB,
  buildLaboratoryDevSnapshot,
  formatLaboratoryDurationLabel,
  getLaboratoryLevelStatRow,
  installPlanetLaboratory,
  instantCompleteLaboratoryUpgrade,
  instantUpgradeLaboratoryNext,
  listFacilityLaboratoryLevelRows,
  resolveLaboratoryEnvRegenPctDaily,
  resolveLaboratoryEquipmentTierUnlock,
  resolveLaboratoryRdSpeedReductionPct,
  startPlanetLaboratoryUpgrade,
  tryCompleteLaboratoryUpgrade,
} from '../../../game/planetDevelopment/planetLaboratoryDevelopment';
import { useT } from '../../../i18n';
import { ArcOverlayInfoRow } from '../ArcOverlayInfoRow';
import { PlanetGenericFacilityDevContent } from './PlanetGenericFacilityDevContent';

const api = {
  buildSnapshot: buildLaboratoryDevSnapshot,
  tryCompleteUpgrade: tryCompleteLaboratoryUpgrade,
  install: installPlanetLaboratory,
  startUpgrade: startPlanetLaboratoryUpgrade,
  instantCompleteUpgrade: instantCompleteLaboratoryUpgrade,
  instantUpgradeNext: instantUpgradeLaboratoryNext,
  formatDurationLabel: formatLaboratoryDurationLabel,
  getLevelRow: getLaboratoryLevelStatRow,
  listLevelRows: listFacilityLaboratoryLevelRows,
};

export const PlanetLaboratoryDevContent = memo(function PlanetLaboratoryDevContent(props: PlanetDevelopmentModuleContext) {
  const t = useT();
  const rdSnapshot = readPlanetCoreStatRdSnapshot(props.planetId);
  return (
    <PlanetGenericFacilityDevContent
      {...props}
      moduleId={PLANET_DEV_MODULE_RESEARCH_LAB}
      i18nPrefix="researchLabDev"
      api={api}
      renderExtraStats={(snapshot, _currentRow, visualTheme) => {
        if (!snapshot.installed) return null;
        return (
          <>
            <ArcOverlayInfoRow
              label={t('researchLabDev.rdSpeedLabel')}
              value={t('researchLabDev.rdSpeedValue', { pct: resolveLaboratoryRdSpeedReductionPct(snapshot.level) })}
              visualTheme={visualTheme}
            />
            {rdSnapshot.nextTechnologyRdHours != null ? (
              <ArcOverlayInfoRow
                label={t('researchLabDev.coreStatRdLabel')}
                value={t('researchLabDev.coreStatRdValue', {
                  stage: rdSnapshot.technologyStage,
                  hours: rdSnapshot.nextTechnologyRdHours,
                })}
                visualTheme={visualTheme}
              />
            ) : null}
            <ArcOverlayInfoRow
              label={t('researchLabDev.equipmentTierLabel')}
              value={resolveLaboratoryEquipmentTierUnlock(snapshot.level) || '—'}
              visualTheme={visualTheme}
            />
            <ArcOverlayInfoRow
              label={t('researchLabDev.envRegenLabel')}
              value={t('researchLabDev.envRegenValue', { pct: resolveLaboratoryEnvRegenPctDaily(snapshot.level) })}
              visualTheme={visualTheme}
            />
          </>
        );
      }}
      renderLevelMeta={(row) => t('researchLabDev.levelMeta', {
        rd: resolveLaboratoryRdSpeedReductionPct(row.level),
        tier: resolveLaboratoryEquipmentTierUnlock(row.level),
      })}
    />
  );
});
