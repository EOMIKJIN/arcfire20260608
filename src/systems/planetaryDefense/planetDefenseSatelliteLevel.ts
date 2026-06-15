import {
  clampPlanetDefenseSatelliteLevel,
} from '../../arcCore/balance/planetDefenseSatelliteLevelPolicy';
import { invalidatePlanetMemoCachesForPlanet } from '../../game/planetMemoCache';
import { usePlanetCoreRuntimeStore } from '../../store/planetCoreRuntimeStore';
import { patchPlanetDefenseSatelliteInstanceState } from './planetDefenseSatelliteInstanceRuntime';

function readDetailRaw(planetId: string) {
  return usePlanetCoreRuntimeStore.getState().getPlanetCoreRuntime(planetId)?.detail?.defenseSatellite;
}

export function isPlanetDefenseSatelliteInstalled(planetId: string): boolean {
  const raw = readDetailRaw(planetId);
  if (!raw || raw.version !== 1) return false;
  if (raw.installed === true) return true;
  return raw.installed !== false && typeof raw.level === 'number' && raw.level >= 1 && raw.updatedAtMs != null;
}

/** 행성 방위위성 현재 레벨 — 미설치 0, 설치 후 1..10 */
export function resolvePlanetDefenseSatelliteLevel(planetId: string): number {
  if (!isPlanetDefenseSatelliteInstalled(planetId)) return 0;
  const stored = readDetailRaw(planetId)?.level;
  if (typeof stored === 'number' && Number.isFinite(stored)) {
    return clampPlanetDefenseSatelliteLevel(stored);
  }
  return 1;
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

/** @deprecated 행성 공통 레벨 — `planetDefenseSatelliteDevelopment` 사용 */
export function patchPlanetDefenseSatelliteLevel(planetId: string, level: number): void {
  const clamped = clampPlanetDefenseSatelliteLevel(level);
  const store = usePlanetCoreRuntimeStore.getState();
  const cur = store.getPlanetCoreRuntime(planetId);
  if (!cur) return;
  const atMs = Date.now();
  const prev = cur.detail?.defenseSatellite;
  store.patchPlanetCore(planetId, {
    detail: {
      ...cur.detail,
      defenseSatellite: {
        version: 1,
        installed: true,
        level: clamped,
        upgradeJob: prev?.upgradeJob ?? null,
        updatedAtMs: atMs,
      },
    },
  });
  invalidatePlanetMemoCachesForPlanet(planetId);
}
