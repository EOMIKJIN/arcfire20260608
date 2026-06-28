// v3.2 — 행성개발 L11~15 에픽 레벨 표기

/** facility_upgrade_duration_global · v3.1 에픽 구간 */
export const PLANET_FACILITY_EPIC_LEVEL_MIN = 11;

export function isEpicPlanetFacilityDevLevel(level: number): boolean {
  return Number.isFinite(level) && Math.floor(level) >= PLANET_FACILITY_EPIC_LEVEL_MIN;
}

type PlanetDevTranslate = (
  key: string,
  params?: Record<string, string | number>,
) => string;

export function planetDevLevelEpicBadge(level: number, t: PlanetDevTranslate): string {
  return isEpicPlanetFacilityDevLevel(level) ? t('planetDev.epicLevelBadge') : '';
}

export function planetDevLevelI18nParams(
  level: number,
  t: PlanetDevTranslate,
): { level: number; epicBadge: string } {
  const lv = Math.floor(level);
  return {
    level: lv,
    epicBadge: planetDevLevelEpicBadge(lv, t),
  };
}

export function planetDevUpgradeI18nParams(
  fromLevel: number,
  toLevel: number,
  t: PlanetDevTranslate,
): { from: number; to: number; fromEpic: string; toEpic: string } {
  const from = Math.floor(fromLevel);
  const to = Math.floor(toLevel);
  return {
    from,
    to,
    fromEpic: planetDevLevelEpicBadge(from, t),
    toEpic: planetDevLevelEpicBadge(to, t),
  };
}

export function formatPlanetDevLevelLabel(level: number, t: PlanetDevTranslate): string {
  const lv = Math.floor(level);
  if (!Number.isFinite(level) || lv <= 0) return 'Lv.?';
  if (isEpicPlanetFacilityDevLevel(lv)) {
    return t('planetDev.levelEpicLabel', { level: lv });
  }
  return t('planetDev.levelStandardLabel', { level: lv });
}

export function formatPlanetDevLevelUpgradeArrow(
  fromLevel: number,
  toLevel: number,
  t: PlanetDevTranslate,
): string {
  return `${formatPlanetDevLevelLabel(fromLevel, t)} → ${formatPlanetDevLevelLabel(toLevel, t)}`;
}
