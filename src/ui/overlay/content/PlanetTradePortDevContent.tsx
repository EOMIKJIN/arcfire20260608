import React, { memo } from 'react';
import type { PlanetDevelopmentModuleContext } from '../../../game/planetDevelopment/planetDevelopmentRegistry';import {
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
import { ArcOverlayInfoRow } from '../ArcOverlayInfoRow';
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
            <ArcOverlayInfoRow label={t('tradePortDev.highGradeLabel')} value={`+${resolveTradePortHighGradeWeaponWeightBonus(snapshot.level)}%`} />
            <ArcOverlayInfoRow label={t('tradePortDev.feeLabel')} value={`${resolveTradePortFeeRatePct(snapshot.level)}%`} />
            <ArcOverlayInfoRow label={t('tradePortDev.stockLabel')} value={String(resolveTradePortStockLimit(snapshot.level))} />
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
