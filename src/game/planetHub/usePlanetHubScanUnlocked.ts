import { useSyncExternalStore } from 'react';
import {
  isPlanetHubScanUnlocked,
  subscribePlanetHubScanUnlock,
} from './planetHubScanUnlockState';

/** 행성 허브 스캔 해제 여부 — session Map 구독(부모·row desync 방지) */
export function usePlanetHubScanUnlocked(planetId: string | null | undefined): boolean {
  return useSyncExternalStore(
    subscribePlanetHubScanUnlock,
    () => isPlanetHubScanUnlocked(planetId),
    () => isPlanetHubScanUnlocked(planetId),
  );
}
