import { GALAXY_SYSTEMS } from '../data/galaxy100';
import { STAR_SYSTEMS } from '../data/systems';
import type { StarSystem } from '../types';

/** STAR_SYSTEMS(21) + GALAXY_SYSTEMS(synth) — worldStore import 금지(순환 참조 방지) */
function resolveSystemIdFromGalaxy(planetId: string): string | null {
  const id = planetId.trim();
  if (!id) return null;
  for (const system of Object.values(STAR_SYSTEMS)) {
    if (system.planets.some((p) => p.id === id)) return system.id;
  }
  for (const system of Object.values(GALAXY_SYSTEMS)) {
    if (system.planets.some((p) => p.id === id)) return system.id;
  }
  return null;
}

function readGalaxySystem(systemId: string): StarSystem | undefined {
  return GALAXY_SYSTEMS[systemId] ?? STAR_SYSTEMS[systemId];
}

/** CSV 21행성 + synth 성계 좌표(은하 정본 그래프) */
export function resolveSystemPositionForPlanetId(planetId: string): { x: number; y: number } | null {
  const id = planetId.trim();
  if (!id) return null;
  const systemId = resolveSystemIdFromGalaxy(id);
  if (!systemId) return null;
  return readGalaxySystem(systemId)?.position ?? null;
}

/** CSV 21행성 + synth 성계 레코드 */
export function resolveStarSystemForPlanetId(planetId: string): StarSystem | undefined {
  const id = planetId.trim();
  if (!id) return undefined;
  const systemId = resolveSystemIdFromGalaxy(id);
  if (!systemId) return undefined;
  return readGalaxySystem(systemId);
}

/** 성계 연결 그래프 BFS 홉 거리 — GALAXY_SYSTEMS 정본 */
export function resolveGalaxySystemHopDistance(systemIdA: string, systemIdB: string): number {
  if (!systemIdA || !systemIdB || systemIdA === systemIdB) return 0;
  const visited = new Set<string>([systemIdA]);
  const queue: Array<{ id: string; hops: number }> = [{ id: systemIdA, hops: 0 }];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur.id === systemIdB) return cur.hops;
    const sys = readGalaxySystem(cur.id);
    if (!sys) continue;
    for (const next of sys.connections) {
      if (visited.has(next)) continue;
      visited.add(next);
      queue.push({ id: next, hops: cur.hops + 1 });
    }
  }
  return 0;
}

export function resolveSystemIdForPlanetIdFromGalaxy(planetId: string): string | null {
  return resolveSystemIdFromGalaxy(planetId);
}
