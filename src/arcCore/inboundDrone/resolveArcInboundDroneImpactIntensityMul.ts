// ============================================================
// inbound 드론 impact — 누수·스파이·대테러 mitigation intensity
// ============================================================

import type { ArcInboundDrone } from '../../store/arcInboundDroneStore';
import { resolvePlanetCounterIntelBonuses } from '../../game/resolvePlanetCounterIntelBonuses';
import { resolveArcInboundDroneStrikeLeakMul } from './resolveInboundDroneStrikeLeak';

/** 드론 충돌 시 `applyPlanetAttackCoreDamage` intensityMul */
export function resolveArcInboundDroneImpactIntensityMul(
  drone: ArcInboundDrone,
  planetId: string,
): number {
  let leak = resolveArcInboundDroneStrikeLeakMul(drone);
  if (drone.spyMinStrikeLeakMul != null && Number.isFinite(drone.spyMinStrikeLeakMul)) {
    leak = Math.max(leak, drone.spyMinStrikeLeakMul);
  }
  const spyMul = drone.spyStrikeDamageMul != null && Number.isFinite(drone.spyStrikeDamageMul)
    ? Math.max(1, drone.spyStrikeDamageMul)
    : 1;
  const mitigationPct = resolvePlanetCounterIntelBonuses(planetId).antiTerrorMitigationPct;
  const mitigation = Math.max(0, Math.min(0.75, mitigationPct / 100));
  return Math.max(0.05, leak * spyMul * (1 - mitigation));
}
