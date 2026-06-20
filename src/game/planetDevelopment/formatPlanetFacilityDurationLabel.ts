// ============================================================
// 행성 시설 설치·업그레이드 시간 표시 (분·시·일)
// ============================================================

import { t } from '../../i18n';

export function formatPlanetFacilityDurationLabel(sec: number): string {
  if (sec <= 0) return t('planetFacilityDuration.instant');

  const totalMin = Math.ceil(sec / 60);
  if (totalMin < 60) {
    return t('planetFacilityDuration.min', { min: totalMin });
  }

  const totalHours = Math.ceil(sec / 3600);
  if (totalHours < 24) {
    const hours = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    return mins > 0
      ? t('planetFacilityDuration.hourMin', { hours, mins })
      : t('planetFacilityDuration.hour', { hours });
  }

  const days = Math.floor(totalHours / 24);
  const remHours = totalHours % 24;
  if (remHours <= 0) {
    return t('planetFacilityDuration.day', { days });
  }
  return t('planetFacilityDuration.dayHour', { days, hours: remHours });
}
