// ============================================================
// 정본 + 일일개방 개척 synth 허브 원반 베이크.
// 끄면 초상 SVG(+아르카디아 틸트)로 복구.
// 아크코어 derive·성운 persist·prewarm·remount 키 미연결.
// ============================================================

import type { ImageSourcePropType } from 'react-native';
import { PLANET_GLOBE_BAKED_BY_PLANET_ID } from '../data/generated/planetGlobeBakedAssets';
import { TEMP_ADMIN_ARCADIA_GLOBE_BAKE } from './tempAdminArcadiaGlobeBakeFlag';

export { TEMP_ADMIN_ARCADIA_GLOBE_BAKE } from './tempAdminArcadiaGlobeBakeFlag';

export function resolveArcadiaGlobeBakeSource(
  planetId: string | null | undefined,
  opts?: { combatMuted?: boolean; runtimeFileUri?: string | null },
): ImageSourcePropType | null {
  if (!TEMP_ADMIN_ARCADIA_GLOBE_BAKE) return null;
  if (opts?.combatMuted) return null;
  if (planetId == null) return null;
  const bundled = PLANET_GLOBE_BAKED_BY_PLANET_ID[planetId];
  if (bundled) return bundled;
  if (opts?.runtimeFileUri) return { uri: opts.runtimeFileUri };
  return null;
}

export const resolvePlanetGlobeBakeSource = resolveArcadiaGlobeBakeSource;
