import { useEffect } from 'react';
import { registerPlanetSessionResource } from '../planetSessionRegistry';

/**
 * 행성 허브 전용 setInterval — `registerPlanetSessionResource`로 route_blur·planet_change 시 자동 정리.
 */
export function usePlanetHubInterval(
  ownerId: string,
  planetId: string | null,
  enabled: boolean,
  intervalMs: number,
  tick: () => void,
): void {
  useEffect(() => {
    if (!enabled) return;
    const handle = setInterval(tick, intervalMs);
    const token = registerPlanetSessionResource({
      ownerId,
      planetId,
      dispose: () => clearInterval(handle),
    });
    return () => token.release();
  }, [ownerId, planetId, enabled, intervalMs, tick]);
}
