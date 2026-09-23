export type GalaxyMapSystemActionMenuInk = 'default' | 'land' | 'combat';

/** `TACTICAL_HUB.tileLabelDepartureInk` — 허브 출발과 동일 */
export const GALAXY_MAP_ACTION_LAND_INK = '#3DDC84';
/** `TACTICAL_HUB.tileLabelCombatInk` */
export const GALAXY_MAP_ACTION_COMBAT_INK = '#E36B6B';
const DEFAULT_INK = 'rgba(172, 180, 194, 0.92)';
const DISABLED_INK = '#526483';

/** LAND 가능=출발 녹색 · 전투 가능=적색 · 조건 불충족은 비활성 회색 */
export function resolveGalaxyMapActionMenuLabelColor(
  ink: GalaxyMapSystemActionMenuInk | undefined,
  disabled: boolean,
): string {
  if (disabled) return DISABLED_INK;
  if (ink === 'land') return GALAXY_MAP_ACTION_LAND_INK;
  if (ink === 'combat') return GALAXY_MAP_ACTION_COMBAT_INK;
  return DEFAULT_INK;
}
