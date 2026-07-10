/**
 * Skia JSI/C++ 수명 — arcfire-skia-memory-lifecycle.mdc §2·§3 공용 헬퍼.
 * Worklet 내부 dispose 금지 — JS 클린업 + 지연만 허용.
 */

import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { SkPath, SkPicture } from '@shopify/react-native-skia';
import { Skia } from '@shopify/react-native-skia';

export const SK_PICTURE_DISPOSE_DELAY_MS = 48;

export function safeSkiaDispose(obj: { dispose?: () => void } | null | undefined): void {
  if (!obj) return;
  try {
    obj.dispose?.();
  } catch {
    /* idempotent */
  }
}

/** UI 스레드·Picture 렌더 레이스 회피 — 이중 rAF + 짧은 지연 */
export function scheduleSkPictureDispose(pic: SkPicture | null | undefined): void {
  if (!pic) return;
  requestAnimationFrame(() => {
    setTimeout(() => {
      safeSkiaDispose(pic);
    }, SK_PICTURE_DISPOSE_DELAY_MS);
  });
}

/** React Picture 노드 제거 → 이후 native dispose (reclaim·언마운트 공용) */
export function dropSkPictureReactFrame(input: {
  liveRef: MutableRefObject<SkPicture | null>;
  setPicture: Dispatch<SetStateAction<SkPicture | null>>;
}): void {
  const live = input.liveRef.current;
  input.liveRef.current = null;
  input.setPicture(null);
  if (live != null) {
    scheduleSkPictureDispose(live);
  }
}

export function commitSkPictureReactFrame(input: {
  liveRef: MutableRefObject<SkPicture | null>;
  setPicture: Dispatch<SetStateAction<SkPicture | null>>;
  next: SkPicture;
}): void {
  const prev = input.liveRef.current;
  input.liveRef.current = input.next;
  input.setPicture(input.next);
  if (prev != null && prev !== input.next) {
    scheduleSkPictureDispose(prev);
  }
}

export function resetSkPath(path: SkPath): void {
  const anyPath = path as unknown as { rewind?: () => void; reset?: () => void };
  if (typeof anyPath.rewind === 'function') anyPath.rewind();
  else if (typeof anyPath.reset === 'function') anyPath.reset();
}

/** 풀 반환 — Make()/dispose 루프 대신 rewind 후 spare 재사용 */
export function releaseSkPathToSpare(
  map: Map<number, SkPath>,
  spare: SkPath[],
  id: number,
): void {
  const p = map.get(id);
  if (!p) return;
  resetSkPath(p);
  spare.push(p);
  map.delete(id);
}

export function acquireSkPathFromPool(
  map: Map<number, SkPath>,
  spare: SkPath[],
  id: number,
): SkPath {
  const existing = map.get(id);
  if (existing) return existing;
  const p = spare.pop() ?? Skia.Path.Make();
  map.set(id, p);
  return p;
}

export function drainSkPathPool(map: Map<number, SkPath>, spare: SkPath[]): void {
  for (const p of map.values()) {
    safeSkiaDispose(p);
  }
  map.clear();
  for (const p of spare) {
    safeSkiaDispose(p);
  }
  spare.length = 0;
}
