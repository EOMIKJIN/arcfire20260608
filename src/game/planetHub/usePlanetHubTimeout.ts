import { useEffect, useRef } from 'react';
import { registerPlanetSessionResource } from '../planetSessionRegistry';

/**
 * 행성 허브 전용 setTimeout — `registerPlanetSessionResource`로 route_blur·planet_change 시 자동 정리.
 * onFire 식별자가 바뀌어도 남은 시간은 유지한다.
 */
export function usePlanetHubTimeout(
  ownerId: string,
  planetId: string | null,
  enabled: boolean,
  delayMs: number,
  onFire: () => void,
): void {
  const onFireRef = useRef(onFire);
  onFireRef.current = onFire;

  useEffect(() => {
    if (!enabled || delayMs <= 0) return;
    const handle = setTimeout(() => onFireRef.current(), delayMs);
    const token = registerPlanetSessionResource({
      ownerId,
      planetId,
      dispose: () => clearTimeout(handle),
    });
    return () => token.release();
  }, [ownerId, planetId, enabled, delayMs]);
}
