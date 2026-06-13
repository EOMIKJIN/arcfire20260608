import { useEffect } from 'react';
import { registerPlanetSessionResource } from '../planetSessionRegistry';

/**
 * 행성 허브 전용 setTimeout — `registerPlanetSessionResource`로 route_blur·planet_change 시 자동 정리.
 */
export function usePlanetHubTimeout(
  ownerId: string,
  planetId: string | null,
  enabled: boolean,
  delayMs: number,
  onFire: () => void,
): void {
  useEffect(() => {
    if (!enabled || delayMs <= 0) return;
    const handle = setTimeout(onFire, delayMs);
    const token = registerPlanetSessionResource({
      ownerId,
      planetId,
      dispose: () => clearTimeout(handle),
    });
    return () => token.release();
  }, [ownerId, planetId, enabled, delayMs, onFire]);
}
