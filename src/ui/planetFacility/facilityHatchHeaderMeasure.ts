import { useSyncExternalStore } from 'react';

/**
 * 빗살무늬 시설 헤더(`PlanetFacilityTitleHeader`) 화면 하단 Y.
 * `measureInWindow` 실측만. 추정값 없음. 미실측이면 null.
 */
let hatchBottomY: number | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((fn) => fn());
}

export function reportFacilityHatchHeaderWindowBottom(bottomY: number | null): void {
  const next = bottomY != null && bottomY > 0 ? Math.round(bottomY) : null;
  if (hatchBottomY === next) return;
  hatchBottomY = next;
  emit();
}

export function getFacilityHatchHeaderWindowBottom(): number | null {
  return hatchBottomY;
}

export function subscribeFacilityHatchHeaderMeasure(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

export function useFacilityHatchHeaderWindowBottom(): number | null {
  return useSyncExternalStore(
    subscribeFacilityHatchHeaderMeasure,
    getFacilityHatchHeaderWindowBottom,
    getFacilityHatchHeaderWindowBottom,
  );
}
