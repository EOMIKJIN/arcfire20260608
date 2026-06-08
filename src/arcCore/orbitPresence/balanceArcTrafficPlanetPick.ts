// ============================================================
// 아크코어 — 궤도 수송선(AiNpcSubCore) 행성 배치 균형
// - 동일 행성에 과밀 체류 방지: 현재 planetId 기준 최소 부하 행성 우선
// ============================================================

import type { ArcNpcTrafficShip } from '../../store/arcNpcTrafficStore';

const FALLBACK_PLANET_ID = 'arcadia_prime';

function countShipsPerPlanet(
  allPlanetIds: readonly string[],
  ships: ReadonlyArray<Pick<ArcNpcTrafficShip, 'id' | 'planetId'>>,
  excludeShipId?: string,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const pid of allPlanetIds) counts.set(pid, 0);
  for (const s of ships) {
    if (excludeShipId && s.id === excludeShipId) continue;
    if (!counts.has(s.planetId)) continue;
    counts.set(s.planetId, (counts.get(s.planetId) ?? 0) + 1);
  }
  return counts;
}

function pickAmongLeastLoaded(
  allPlanetIds: readonly string[],
  counts: ReadonlyMap<string, number>,
  salt: number,
): string {
  if (allPlanetIds.length === 0) return FALLBACK_PLANET_ID;
  let min = Infinity;
  for (const pid of allPlanetIds) {
    const c = counts.get(pid) ?? 0;
    if (c < min) min = c;
  }
  const candidates = allPlanetIds.filter(pid => (counts.get(pid) ?? 0) === min);
  if (candidates.length === 0) return allPlanetIds[0] ?? FALLBACK_PLANET_ID;
  return candidates[salt % candidates.length] ?? candidates[0] ?? FALLBACK_PLANET_ID;
}

/** 단일 함선의 다음 목표 행성 — gather 지시가 있으면 그 행성, 아니면 최소 부하 행성 중 하나 */
export function pickBalancedArcTrafficPlanetId(
  allPlanetIds: readonly string[],
  ships: ReadonlyArray<Pick<ArcNpcTrafficShip, 'id' | 'planetId'>>,
  options?: { excludeShipId?: string; gatherPlanetId?: string | null; salt?: number },
): string {
  if (options?.gatherPlanetId) return options.gatherPlanetId;
  const counts = countShipsPerPlanet(allPlanetIds, ships, options?.excludeShipId);
  const salt =
    options?.salt ??
    Math.floor(Math.random() * Math.max(1, allPlanetIds.length));
  return pickAmongLeastLoaded(allPlanetIds, counts, salt);
}

/** 부트스트랩: N척을 행성 풀에 순차 균등 분산 */
export function spreadArcTrafficInitialPlanetIds(
  allPlanetIds: readonly string[],
  shipCount: number,
): string[] {
  if (shipCount <= 0) return [];
  const counts = countShipsPerPlanet(allPlanetIds, []);
  const out: string[] = [];
  for (let i = 0; i < shipCount; i++) {
    const pid = pickAmongLeastLoaded(allPlanetIds, counts, i);
    out.push(pid);
    counts.set(pid, (counts.get(pid) ?? 0) + 1);
  }
  return out;
}
