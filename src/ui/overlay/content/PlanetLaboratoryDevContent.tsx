import React, { memo } from 'react';
import { Text, View } from 'react-native';
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
import { OVERLAY_TOKENS } from '../../../utils/theme';
import { planetDevelopmentOverlayStyles as styles } from './planetDevelopmentOverlayStyles';
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

function InfoRow({ label, value }: { label: string; value: string }) {
  const PH = OVERLAY_TOKENS.phosphorAccent;
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: PH }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: PH }]}>{value}</Text>
    </View>
  );
}

export const PlanetLaboratoryDevContent = memo(function PlanetLaboratoryDevContent(props: PlanetDevelopmentModuleContext) {
  const t = useT();
  const rdSnapshot = readPlanetCoreStatRdSnapshot(props.planetId);
  return (
    <PlanetGenericFacilityDevContent
      {...props}
      moduleId={PLANET_DEV_MODULE_RESEARCH_LAB}
      i18nPrefix="researchLabDev"
      api={api}
      renderExtraStats={(snapshot) => {
        if (!snapshot.installed) return null;
        return (
          <>
            <InfoRow
              label={t('researchLabDev.rdSpeedLabel')}
              value={t('researchLabDev.rdSpeedValue', { pct: resolveLaboratoryRdSpeedReductionPct(snapshot.level) })}
            />
            {rdSnapshot.nextTechnologyRdHours != null ? (
              <InfoRow
                label={t('researchLabDev.coreStatRdLabel')}
                value={t('researchLabDev.coreStatRdValue', {
                  stage: rdSnapshot.technologyStage,
                  hours: rdSnapshot.nextTechnologyRdHours,
                })}
              />
            ) : null}
            <InfoRow
              label={t('researchLabDev.equipmentTierLabel')}
              value={resolveLaboratoryEquipmentTierUnlock(snapshot.level) || '—'}
            />
            <InfoRow
              label={t('researchLabDev.envRegenLabel')}
              value={t('researchLabDev.envRegenValue', { pct: resolveLaboratoryEnvRegenPctDaily(snapshot.level) })}
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
