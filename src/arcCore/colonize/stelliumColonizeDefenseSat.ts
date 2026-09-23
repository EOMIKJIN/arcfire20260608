import { resolveStelliumColonizePolicy } from './stelliumColonizePolicy';

/** 개척선 접근·사령부에 필요한 방위위성 레벨. 0이면 게이트 없음 */
export function resolveStelliumColonizeRequiredDefenseSatLevel(): number {
  return Math.max(0, Math.floor(resolveStelliumColonizePolicy().requireDefenseSatLevel));
}

/** 정보요약에 개척선 진입 한 줄을 붙인다. 이미 있으면 그대로 */
export function appendDefenseSatColonizeSummaryLine(base: string, extraLine: string): string {
  const b = String(base ?? '').replace(/\s+$/g, '');
  const extra = String(extraLine ?? '').trim();
  if (!extra) return b;
  if (b.includes(extra)) return b;
  return b.length > 0 ? `${b}\n${extra}` : extra;
}

/** 접근·사령부 — 방위위성 미달이면 출항/접근 금지 · 사령부는 보류. required=0 이면 게이트 없음 */
export function meetsStelliumColonizeHqDefenseSat(
  requiredLevel: number,
  actualLevel: number,
): boolean {
  const need = Math.max(0, Math.floor(requiredLevel));
  if (need <= 0) return true;
  return Math.max(0, Math.floor(actualLevel)) >= need;
}

export function resolveStelliumColonizeDefenseSatLevel(planetId: string): number {
  try {
    const { resolvePlanetDefenseSatelliteLevel } =
      require('../../systems/planetaryDefense/planetDefenseSatelliteLevel') as typeof import('../../systems/planetaryDefense/planetDefenseSatelliteLevel');
    return resolvePlanetDefenseSatelliteLevel(planetId);
  } catch {
    return 0;
  }
}
