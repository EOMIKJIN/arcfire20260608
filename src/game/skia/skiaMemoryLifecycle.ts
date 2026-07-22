/**
 * Skia JSI/C++ 수명 — arcfire-skia-memory-lifecycle.mdc §2·§3 공용 헬퍼.
 * Worklet 내부 dispose 금지 — JS 클린업 + 지연만 허용.
 */

import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { SkPath, SkPicture } from '@shopify/react-native-skia';
import { Skia } from '@shopify/react-native-skia';

/**
 * @deprecated 수동 Picture dispose 지연값 — 더 이상 dispose 하지 않음.
 * 호환용으로만 유지(호출부/감사 스크립트).
 */
export const SK_PICTURE_DISPOSE_DELAY_MS = 48;

export function safeSkiaDispose(obj: { dispose?: () => void } | null | undefined): void {
  if (!obj) return;
  try {
    obj.dispose?.();
  } catch {
    /* idempotent */
  }
}

/**
 * React `<Picture picture={skPicture}>` 에 넘긴 SkPicture 수동 dispose **금지**.
 *
 * 원인(logcat 2026-07-22 22:50:06):
 *   Fatal signal 11 SIGSEGV · tid=FinalizerDaemon
 *   SkiaDomView.finalize → PictureProp::~ → JsiSkPicture::~ → jsi::Pointer::~ (NPE)
 *
 * JS에서 `picture.dispose()` 후 HybridData Finalizer가 동일 native를 재해제하면
 * null deref. SkImage(useImage) 와 동일 — 참조만 끊고 native 수명은 RN Skia finalizer에 위임.
 * (이전 48ms 지연 dispose는 반쪽 패치 — Finalizer 경로를 막지 못함)
 */
export function scheduleSkPictureDispose(pic: SkPicture | null | undefined): void {
  void pic;
}

/** React Picture 노드에서 제거 — native dispose 는 finalizer에만 위임 */
export function dropSkPictureReactFrame(input: {
  liveRef: MutableRefObject<SkPicture | null>;
  setPicture: Dispatch<SetStateAction<SkPicture | null>>;
}): void {
  input.liveRef.current = null;
  input.setPicture(null);
}

/**
 * 새 프레임 Picture 커밋.
 * 이전 프레임 참조는 React state 교체로만 끊는다(수동 dispose 없음).
 */
export function commitSkPictureReactFrame(input: {
  liveRef: MutableRefObject<SkPicture | null>;
  setPicture: Dispatch<SetStateAction<SkPicture | null>>;
  next: SkPicture;
}): void {
  input.liveRef.current = input.next;
  input.setPicture(input.next);
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
