// ============================================================
// 사령부 5대 스탯 — max-weight 밖 일일 오프셋 (음수 maxW 금지)
// ============================================================

import type { PlanetCoreGaugeView } from '../../store/planetCoreRuntimeStore';
import { resolvePlanetMilitaryCommandLevel } from '../../game/planetDevelopment/planetMilitaryCommandListing';
import {
  applyMilitaryCommandStatOffsetValues,
  resolveMilitaryCommandStatOffsetsFromLevel,
  type MilitaryCommandStatOffset,
} from './militaryCommandMath';

export type { MilitaryCommandStatOffset };
export { applyMilitaryCommandStatOffsetValues, resolveMilitaryCommandStatOffsetsFromLevel };

export function resolveMilitaryCommandStatOffsets(planetId: string): MilitaryCommandStatOffset {
  return resolveMilitaryCommandStatOffsetsFromLevel(resolvePlanetMilitaryCommandLevel(planetId));
}

export function applyMilitaryCommandStatOffsetsToTargets(
  planetId: string,
  targets: PlanetCoreGaugeView,
  floors: Partial<PlanetCoreGaugeView>,
): PlanetCoreGaugeView {
  return applyMilitaryCommandStatOffsetValues(
    targets,
    floors,
    resolveMilitaryCommandStatOffsets(planetId),
  );
}
