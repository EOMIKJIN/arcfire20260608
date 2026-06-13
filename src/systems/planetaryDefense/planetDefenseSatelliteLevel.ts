import {
  clampPlanetDefenseSatelliteLevel,
  resolveDefenseSatelliteInterceptChancePct,
} from '../../arcCore/balance/planetDefenseSatelliteLevelPolicy';
import { getPlanetDefenseSatellitePolicy } from '../../arcCore/balance/planetDefenseSatellitePolicy';
import { invalidatePlanetMemoCachesForPlanet } from '../../game/planetMemoCache';
import { usePlanetCoreRuntimeStore } from '../../store/planetCoreRuntimeStore';
import { patchPlanetDefenseSatelliteInstanceState } from './planetDefenseSatelliteInstanceRuntime';

/** 행성 방위위성 현재 레벨 — 런타임 detail 우선, 없으면 정책 디폴트(1) */
export function resolvePlanetDefenseSatelliteLevel(planetId: string): number {
  const policy = getPlanetDefenseSatellitePolicy();
  const runtime = usePlanetCoreRuntimeStore.getState().getPlanetCoreRuntime(planetId);
  const stored = runtime?.detail?.defenseSatellite?.level;
  if (typeof stored === 'number' && Number.isFinite(stored)) {
    return clampPlanetDefenseSatelliteLevel(stored);
  }
  return clampPlanetDefenseSatelliteLevel(policy.defaultLevel);
}

export function resolvePlanetDefenseSatelliteInterceptChancePct(planetId: string): number {
  return resolveDefenseSatelliteInterceptChancePct(resolvePlanetDefenseSatelliteLevel(planetId));
}

export function patchPlanetDefenseSatelliteInstanceLevel(
  planetId: string,
  instanceKey: string,
  level: number,
): void {
  patchPlanetDefenseSatelliteInstanceState(planetId, instanceKey, {
    defenseLevel: clampPlanetDefenseSatelliteLevel(level),
  });
  invalidatePlanetMemoCachesForPlanet(planetId);
}

/** @deprecated 행성 공통 레벨 — 신규는 patchPlanetDefenseSatelliteInstanceLevel 사용 */
export function patchPlanetDefenseSatelliteLevel(planetId: string, level: number): void {
  const clamped = clampPlanetDefenseSatelliteLevel(level);
  const store = usePlanetCoreRuntimeStore.getState();
  const cur = store.getPlanetCoreRuntime(planetId);
  if (!cur) return;
  const atMs = Date.now();
  store.patchPlanetCore(planetId, {
    detail: {
      ...cur.detail,
      defenseSatellite: {
        version: 1,
        level: clamped,
        updatedAtMs: atMs,
      },
    },
  });
  invalidatePlanetMemoCachesForPlanet(planetId);
}
