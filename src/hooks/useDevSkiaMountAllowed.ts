import { useEffect, useState } from 'react';
import {
  isDevSkiaMountAllowed,
  subscribeDevSkiaMountGate,
} from '../game/devMetroReloadGuard';

/** __DEV__ reload gate — false 이면 Skia Canvas 를 그리지 않는다. */
export function useDevSkiaMountAllowed(): boolean {
  const [allowed, setAllowed] = useState(isDevSkiaMountAllowed);

  useEffect(() => {
    if (typeof __DEV__ === 'undefined' || !__DEV__) return undefined;
    return subscribeDevSkiaMountGate(() => {
      setAllowed(isDevSkiaMountAllowed());
    });
  }, []);

  return allowed;
}
