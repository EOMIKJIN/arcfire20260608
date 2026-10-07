/**
 * STAGE 3 Skia 모듈 캐시 회수 — Path pool 은 컴포넌트 unmount 가 담당.
 * 여기서는 process-lifetime Map(color/tint) 만 STAGE exit 시 비운다.
 */

import { invalidateAllSkPictureFrames } from '../game/skia/skiaPictureFrameRegistry';

type CombatSkiaReclaimFn = () => void;

const reclaimFns = new Set<CombatSkiaReclaimFn>();
let combatOrbitPresentingCount = 0;

/** 전투 궤도 Canvas 마운트·언마운트 시 짝으로 호출. 반환값으로 해제한다. */
export function markCombatOrbitPresenting(): () => void {
  combatOrbitPresentingCount += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    combatOrbitPresentingCount = Math.max(0, combatOrbitPresentingCount - 1);
  };
}

export function isCombatOrbitPresenting(): boolean {
  return combatOrbitPresentingCount > 0;
}

export function registerCombatSkiaPresentationReclaim(fn: CombatSkiaReclaimFn): () => void {
  reclaimFns.add(fn);
  return () => {
    reclaimFns.delete(fn);
  };
}

export function runCombatSkiaPresentationReclaim(): void {
  invalidateAllSkPictureFrames();
  for (const fn of reclaimFns) {
    try {
      fn();
    } catch {
      /* idempotent */
    }
  }
}
