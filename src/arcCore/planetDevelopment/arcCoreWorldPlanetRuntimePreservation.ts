// ============================================================
// ArcCore 월드 축 — RED 점령 행성 런타임 보존 (계정 purge 시)
// planetCoreRuntimeStore는 uid 키 없이 기기 로컬 1벌 · Firebase byPlanetId 미동기
// ============================================================

import { PlanetOccupationSeeds_FROM_BALANCE_CSV } from '../../data/balance/generated/csvPlanetOccupationSeeds';
import type { PlanetCoreRuntime } from '../../store/planetCoreRuntimeStore';
import { isRedOccupiedPlanet } from '../../clanWar/planetTerritoryPlayerAccess';

const RED_SEED_PLANET_IDS: readonly string[] = PlanetOccupationSeeds_FROM_BALANCE_CSV
  .filter((row) => String(row.initialOwner ?? '').trim().toUpperCase() === 'RED')
  .map((row) => row.planetId);

/** purge 전 — 현재 RED 점령 행성 코어·개발 전체 스냅샷 */
export function snapshotArcCoreRedWorldPlanetRuntime(
  byPlanetId: Record<string, PlanetCoreRuntime>,
): Record<string, PlanetCoreRuntime> {
  const snap: Record<string, PlanetCoreRuntime> = {};
  for (let i = 0; i < RED_SEED_PLANET_IDS.length; i += 1) {
    const planetId = RED_SEED_PLANET_IDS[i]!;
    if (!isRedOccupiedPlanet(planetId)) continue;
    const rec = byPlanetId[planetId];
    if (rec) snap[planetId] = rec;
  }
  return snap;
}

/** baseline 재시드 후 — 스냅샷 키(이미 RED 필터됨)만 복원 */
export function mergeArcCoreRedWorldPlanetRuntime(
  baseline: Record<string, PlanetCoreRuntime>,
  snapshot: Record<string, PlanetCoreRuntime>,
): Record<string, PlanetCoreRuntime> {
  const next = { ...baseline };
  const ids = Object.keys(snapshot);
  for (let i = 0; i < ids.length; i += 1) {
    const planetId = ids[i]!;
    next[planetId] = snapshot[planetId]!;
  }
  return next;
}

export function listArcCoreRedSeedPlanetIds(): readonly string[] {
  return RED_SEED_PLANET_IDS;
}
