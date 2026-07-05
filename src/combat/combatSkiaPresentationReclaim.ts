/**
 * STAGE 3 Skia 모듈 캐시 회수 — Path pool 은 컴포넌트 unmount 가 담당.
 * 여기서는 process-lifetime Map(color/tint) 만 STAGE exit 시 비운다.
 */

type CombatSkiaReclaimFn = () => void;

const reclaimFns = new Set<CombatSkiaReclaimFn>();

export function registerCombatSkiaPresentationReclaim(fn: CombatSkiaReclaimFn): () => void {
  reclaimFns.add(fn);
  return () => {
    reclaimFns.delete(fn);
  };
}

export function runCombatSkiaPresentationReclaim(): void {
  for (const fn of reclaimFns) {
    try {
      fn();
    } catch {
      /* idempotent */
    }
  }
}
