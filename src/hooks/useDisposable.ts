// ============================================================
// 자원 등록/해제 쌍 — `2.1.memory.md` §원칙 3 · P2-8
// ============================================================

import { useEffect, useRef } from 'react';

export type DisposableRelease = () => void;

/**
 * mount 시 register, unmount 시 dispose를 보장한다.
 * @returns 등록 함수 — 반환값 release()는 멀티 호출 안전
 */
export function useDisposableRegistry(stageId: string): (dispose: DisposableRelease) => DisposableRelease {
  const disposersRef = useRef<DisposableRelease[]>([]);

  useEffect(() => {
    return () => {
      const list = disposersRef.current;
      disposersRef.current = [];
      for (let i = list.length - 1; i >= 0; i -= 1) {
        try {
          list[i]!();
        } catch {
          /* 흡수 */
        }
      }
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        // eslint-disable-next-line no-console
        console.log(`[MEM] useDisposableRegistry cleared (${stageId})`);
      }
    };
  }, [stageId]);

  return (dispose: DisposableRelease) => {
    disposersRef.current.push(dispose);
    let released = false;
    return () => {
      if (released) return;
      released = true;
      const idx = disposersRef.current.indexOf(dispose);
      if (idx >= 0) disposersRef.current.splice(idx, 1);
      try {
        dispose();
      } catch {
        /* 흡수 */
      }
    };
  };
}
