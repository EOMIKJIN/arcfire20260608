// ============================================================
// 행성개발 설치·레벨업 완료 — 30초 자동 닫힘 알림(범용)
// ============================================================

import { InteractionManager } from 'react-native';
import { t, getLocale } from '../../i18n';
import { resolvePlanetDisplayName } from '../../i18n/systemText';
import { resolvePlanetById } from '../../world/resolvePlanetById';
import { showArcNotificationAlert } from '../../utils/showArcAlert';
import {
  ARC_ALERT_DEFAULT_AUTO_DISMISS_MS,
  PLANET_DEV_LEVEL_UP_ALERT_ID,
} from '../../ui/overlay/overlayAlertContract';
import { getPlanetDevelopmentCatalogRow } from './planetDevelopmentCatalog';
import { resolveModuleIdFromFacilityType } from './planetFacilityLevelResolver';

function resolveFacilityLabel(moduleId: string | null, facilityType: string): string {
  if (moduleId) {
    const key = `planetDev.label.${moduleId}` as const;
    const translated = t(key);
    if (translated !== key) return translated;
    const row = getPlanetDevelopmentCatalogRow(moduleId);
    if (row?.labelKo) return row.labelKo;
  }
  return facilityType;
}

/** 설치(Lv.1)·레벨업 완료 시 ArcOverlay alert — 30초 후 자동 닫힘 */
export function showPlanetFacilityLevelUpNotification(
  planetId: string,
  facilityType: string,
  newLevel: number,
): void {
  if (!planetId || !facilityType || newLevel <= 0) return;

  const moduleId = resolveModuleIdFromFacilityType(facilityType);
  const planet = resolvePlanetById(planetId);
  const planetLabel = planet ? resolvePlanetDisplayName(planet, getLocale()) : planetId;
  const facilityLabel = resolveFacilityLabel(moduleId, facilityType);
  const isInstall = newLevel === 1;

  InteractionManager.runAfterInteractions(() => {
    showArcNotificationAlert(
      t('planetDev.levelUpAlertTitle'),
      isInstall
        ? t('planetDev.levelUpAlertInstallBody', {
          planet: planetLabel,
          facility: facilityLabel,
          level: newLevel,
        })
        : t('planetDev.levelUpAlertUpgradeBody', {
          planet: planetLabel,
          facility: facilityLabel,
          level: newLevel,
        }),
      {
        id: PLANET_DEV_LEVEL_UP_ALERT_ID,
        autoDismissMs: ARC_ALERT_DEFAULT_AUTO_DISMISS_MS,
      },
    );
  });
}
