/**
 * SkPicture React 프레임 무효화 — reclaim 전 Picture 노드 언마운트용.
 * PictureRecorder dispose 후에도 React가 stale SkPicture를 그리면
 * skPicture "Missing required properties picture" 런타임 오류가 난다.
 */

type SkPictureFrameInvalidateFn = () => void;

const invalidateFns = new Set<SkPictureFrameInvalidateFn>();

export function registerSkPictureFrameInvalidate(fn: SkPictureFrameInvalidateFn): () => void {
  invalidateFns.add(fn);
  return () => {
    invalidateFns.delete(fn);
  };
}

export function invalidateAllSkPictureFrames(): void {
  for (const fn of invalidateFns) {
    try {
      fn();
    } catch {
      /* idempotent */
    }
  }
}
