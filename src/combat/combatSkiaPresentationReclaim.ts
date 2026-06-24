/**
 * STAGE 3 Skia 모듈 캐시 회수 — Path pool 은 컴포넌트 unmount 가 담당.
 * 여기서는 process-lifetime Map(color/tint) 만 STAGE exit 시 비운다.
 */

type CombatSkiaReclaimFn = () => void;

let reclaimFn: CombatSkiaReclaimFn | null = null;

export function registerCombatSkiaPresentationReclaim(fn: CombatSkiaReclaimFn): () => void {
  reclaimFn = fn;
  return () => {
    if (reclaimFn === fn) reclaimFn = null;
  };
}

export function runCombatSkiaPresentationReclaim(): void {
  try {
    reclaimFn?.();
  } catch {
    /* idempotent */
  }
}
