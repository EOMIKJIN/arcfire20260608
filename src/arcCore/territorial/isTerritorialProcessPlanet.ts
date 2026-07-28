// ============================================================
// 분쟁·영토 프로세스 진행 행성 — 시드 initialOwner보다 런타임 hold 우선
// ============================================================

import { isPlanetContestedZone } from '../balance/balanceTableRegistry';
import { getTerritorialCombatPolicy } from './arcCoreTerritorialCombatPolicy';
import { isDynamicContestedZonePlanet } from './dynamicContestedZoneStore';

/**
 * contested seed / dynamic contested / territorial policy.enabled
 * → 진행 중 점유는 시드 디폴트로 덮거나 시드 폴백 표시하지 않음.
 */
export function isTerritorialProcessPlanet(planetId: string): boolean {
  if (isPlanetContestedZone(planetId)) return true;
  if (isDynamicContestedZonePlanet(planetId)) return true;
  const policy = getTerritorialCombatPolicy(planetId);
  return Boolean(policy?.enabled);
}
