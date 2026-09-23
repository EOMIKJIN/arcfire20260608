import { useCallback, useEffect, useRef, useState } from 'react';
import {
  reduceOverlayShortHold,
  reduceOverlayShortHoldExited,
} from './overlayShortTransition';

/**
 * store 가 먼저 비워져도 클로징 시퀀스가 끝날 때까지 display 를 유지한다.
 * blocked=다른 kind 가 위에 있으면 hold 즉시 폐기.
 */
export function useOverlayShortTransitionHold<T>(
  live: T | null,
  blocked = false,
): {
  display: T | null;
  visible: boolean;
  onExited: () => void;
} {
  const liveRef = useRef(live);
  liveRef.current = live;
  const [held, setHeld] = useState<T | null>(() => reduceOverlayShortHold(null, live, blocked));

  useEffect(() => {
    setHeld((prev) => reduceOverlayShortHold(prev, live, blocked));
  }, [blocked, live]);

  const onExited = useCallback(() => {
    setHeld(reduceOverlayShortHoldExited(liveRef.current));
  }, []);

  const visible = Boolean(live) && !blocked;
  const display = blocked ? live : live ?? held;
  return { display, visible, onExited };
}
