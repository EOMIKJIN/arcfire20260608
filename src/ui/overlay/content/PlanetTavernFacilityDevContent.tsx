import React, { memo } from 'react';
import { Text, View } from 'react-native';
import type { PlanetDevelopmentModuleContext } from '../../../game/planetDevelopment/planetDevelopmentRegistry';
import {
  PLANET_DEV_MODULE_POPULATION_DOME,
  buildTavernFacilityDevSnapshot,
  formatTavernFacilityDurationLabel,
  getTavernFacilityLevelStatRow,
  installPlanetTavernFacility,
  instantCompleteTavernFacilityUpgrade,
  instantUpgradeTavernFacilityNext,
  listFacilityTavernLevelRows,
  resolveTavernBountySlots,
  resolveTavernMercTierUnlock,
  resolveTavernRefreshIntervalHours,
  resolveTavernReputationBonusPct,
  startPlanetTavernFacilityUpgrade,
  tryCompleteTavernFacilityUpgrade,
} from '../../../game/planetDevelopment/planetTavernFacilityDevelopment';
import { useT } from '../../../i18n';
import { OVERLAY_TOKENS } from '../../../utils/theme';
import { planetDevelopmentOverlayStyles as styles } from './planetDevelopmentOverlayStyles';
import { PlanetGenericFacilityDevContent } from './PlanetGenericFacilityDevContent';

const api = {
  buildSnapshot: buildTavernFacilityDevSnapshot,
  tryCompleteUpgrade: tryCompleteTavernFacilityUpgrade,
  install: installPlanetTavernFacility,
  startUpgrade: startPlanetTavernFacilityUpgrade,
  instantCompleteUpgrade: instantCompleteTavernFacilityUpgrade,
  instantUpgradeNext: instantUpgradeTavernFacilityNext,
  formatDurationLabel: formatTavernFacilityDurationLabel,
  getLevelRow: getTavernFacilityLevelStatRow,
  listLevelRows: listFacilityTavernLevelRows,
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

export const PlanetTavernFacilityDevContent = memo(function PlanetTavernFacilityDevContent(props: PlanetDevelopmentModuleContext) {
  const t = useT();
  return (
    <PlanetGenericFacilityDevContent
      {...props}
      moduleId={PLANET_DEV_MODULE_POPULATION_DOME}
      i18nPrefix="populationDomeDev"
      api={api}
      renderExtraStats={(snapshot) => {
        if (!snapshot.installed) return null;
        return (
          <>
            <InfoRow label={t('populationDomeDev.bountySlotsLabel')} value={String(resolveTavernBountySlots(snapshot.level))} />
            <InfoRow label={t('populationDomeDev.reputationLabel')} value={`+${resolveTavernReputationBonusPct(snapshot.level)}%`} />
            <InfoRow label={t('populationDomeDev.mercTierLabel')} value={resolveTavernMercTierUnlock(snapshot.level)} />
            <InfoRow
              label={t('populationDomeDev.refreshLabel')}
              value={t('populationDomeDev.refreshValue', { hours: resolveTavernRefreshIntervalHours(snapshot.level) })}
            />
          </>
        );
      }}
      renderLevelMeta={(row) => t('populationDomeDev.levelMeta', {
        slots: resolveTavernBountySlots(row.level),
        rep: resolveTavernReputationBonusPct(row.level),
      })}
    />
  );
});
