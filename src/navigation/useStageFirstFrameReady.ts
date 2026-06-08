import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

/**
 * 포커스 직후 첫 프레임까지 대기 — `worldmap` 의 `mapInteractiveReady`(rAF 1회) 와 동일 패턴.
 * 화면 전환 직후 메인스테이지 Skia·gesture 와 겹치는 첫 렌더 부하를 한 틱 뒤로 미룬다.
 */
export function useStageFirstFrameReady(): boolean {
  const [ready, setReady] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setReady(false);
      const id = requestAnimationFrame(() => {
        setReady(true);
      });
      return () => {
        cancelAnimationFrame(id);
        setReady(false);
      };
    }, []),
  );
  return ready;
}
