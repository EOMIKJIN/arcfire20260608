import { useEffect } from 'react';
import { INFO_DISTANCE_SORT_INTERVAL_MS } from './planetHubConstants';
import { usePlanetHubInterval } from './usePlanetHubInterval';

/** INFO 패널 거리순 정렬 — Skia 활성 구간에서만 session registry interval */
export function usePlanetHubInfoDistanceSort(
  planetId: string | null,
  planetStageSkiaActive: boolean,
  applySort: () => void,
  presenceLength: number,
): void {
  useEffect(() => {
    if (!planetStageSkiaActive) return;
    applySort();
  }, [planetStageSkiaActive, applySort, presenceLength]);

  usePlanetHubInterval(
    'planet_hub_info_distance_sort',
    planetId,
    planetStageSkiaActive,
    INFO_DISTANCE_SORT_INTERVAL_MS,
    applySort,
  );
}
