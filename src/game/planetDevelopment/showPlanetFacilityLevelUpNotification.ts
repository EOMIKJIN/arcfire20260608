// ============================================================
// 행성개발 설치·레벨업 완료 — 40초 자동 닫힘 알림(범용)
// ============================================================

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

/** 설치(Lv.1)·레벨업 완료 시 ArcOverlay alert — 40초 후 자동 닫힘 */
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

  const title = t('planetDev.levelUpAlertTitle');
  const message = isInstall
    ? t('planetDev.levelUpAlertInstallBody', {
      planet: planetLabel,
      facility: facilityLabel,
      level: newLevel,
    })
    : t('planetDev.levelUpAlertUpgradeBody', {
      planet: planetLabel,
      facility: facilityLabel,
      level: newLevel,
    });
  // 전투·이동 중 InteractionManager 대기는 완료 팝업을 착륙 뒤로 미룬다. 범용 알림은 즉시.
  setTimeout(() => {
    showArcNotificationAlert(title, message, {
      id: PLANET_DEV_LEVEL_UP_ALERT_ID,
      autoDismissMs: ARC_ALERT_DEFAULT_AUTO_DISMISS_MS,
    });
  }, 0);
}
