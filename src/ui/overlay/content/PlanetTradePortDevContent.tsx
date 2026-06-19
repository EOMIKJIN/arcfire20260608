import React, { memo } from 'react';
import { Text, View } from 'react-native';
import type { PlanetDevelopmentModuleContext } from '../../../game/planetDevelopment/planetDevelopmentRegistry';
import {
  resolveTradePortHighGradeWeaponWeightBonus,
  resolveTradePortFeeRatePct,
} from '../../../arcCore/balance/facilityTradePortLevelPolicy';
import {
  PLANET_DEV_MODULE_TRADE_PORT,
  buildTradePortDevSnapshot,
  formatTradePortDurationLabel,
  getTradePortLevelStatRow,
  installPlanetTradePort,
  instantCompleteTradePortUpgrade,
  instantUpgradeTradePortNext,
  listFacilityTradePortLevelRows,
  resolveTradePortStockLimit,
  startPlanetTradePortUpgrade,
  tryCompleteTradePortUpgrade,
} from '../../../game/planetDevelopment/planetTradePortDevelopment';
import { useT } from '../../../i18n';
import { OVERLAY_TOKENS } from '../../../utils/theme';
import { planetDevelopmentOverlayStyles as styles } from './planetDevelopmentOverlayStyles';
import { PlanetGenericFacilityDevContent } from './PlanetGenericFacilityDevContent';

const api = {
  buildSnapshot: buildTradePortDevSnapshot,
  tryCompleteUpgrade: tryCompleteTradePortUpgrade,
  install: installPlanetTradePort,
  startUpgrade: startPlanetTradePortUpgrade,
  instantCompleteUpgrade: instantCompleteTradePortUpgrade,
  instantUpgradeNext: instantUpgradeTradePortNext,
  formatDurationLabel: formatTradePortDurationLabel,
  getLevelRow: getTradePortLevelStatRow,
  listLevelRows: listFacilityTradePortLevelRows,
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

export const PlanetTradePortDevContent = memo(function PlanetTradePortDevContent(props: PlanetDevelopmentModuleContext) {
  const t = useT();
  return (
    <PlanetGenericFacilityDevContent
      {...props}
      moduleId={PLANET_DEV_MODULE_TRADE_PORT}
      i18nPrefix="tradePortDev"
      api={api}
      renderExtraStats={(snapshot) => {
        if (!snapshot.installed) return null;
        return (
          <>
            <InfoRow label={t('tradePortDev.highGradeLabel')} value={`+${resolveTradePortHighGradeWeaponWeightBonus(snapshot.level)}%`} />
            <InfoRow label={t('tradePortDev.feeLabel')} value={`${resolveTradePortFeeRatePct(snapshot.level)}%`} />
            <InfoRow label={t('tradePortDev.stockLabel')} value={String(resolveTradePortStockLimit(snapshot.level))} />
          </>
        );
      }}
      renderLevelMeta={(row) => t('tradePortDev.levelMeta', {
        highGrade: resolveTradePortHighGradeWeaponWeightBonus(row.level),
        fee: resolveTradePortFeeRatePct(row.level),
      })}
    />
  );
});
