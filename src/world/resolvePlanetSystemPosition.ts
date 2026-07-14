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
/** 성계 그래프 1-hop 이웃 — connections·역방향·폴백 순. */
export function resolveFirstGalaxyNeighborSystemId(systemId: string): string | null {
  const origin = systemId.trim();
  if (!origin) return null;
  const sys = readGalaxySystem(origin);
  if (sys?.connections?.length) {
    for (const raw of sys.connections) {
      const candidate = raw?.trim();
      if (candidate && candidate !== origin) return candidate;
    }
    const first = sys.connections[0]?.trim();
    if (first) return first;
  }
  for (const candidate of [...Object.values(STAR_SYSTEMS), ...Object.values(GALAXY_SYSTEMS)]) {
    if (candidate.id === origin) continue;
    if (candidate.connections?.includes(origin)) return candidate.id;
  }
  for (const candidate of [...Object.values(STAR_SYSTEMS), ...Object.values(GALAXY_SYSTEMS)]) {
    if (candidate.id === origin) continue;
    if (candidate.connections?.length) {
      const hop = candidate.connections.find((c) => c?.trim() && c.trim() !== origin);
      if (hop?.trim()) return hop.trim();
    }
  }
  return null;
}

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

/** BFS — origin에서 maxHops 이내 성계 id (홉 거리별 그룹). */
export function listGalaxySystemIdsByHopDistance(
  originSystemId: string,
  maxHops: number,
): Map<number, string[]> {
  const byHop = new Map<number, string[]>();
  const origin = originSystemId.trim();
  if (!origin || maxHops <= 0) return byHop;

  const visited = new Set<string>([origin]);
  const queue: Array<{ id: string; hops: number }> = [{ id: origin, hops: 0 }];

  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur.hops > 0 && cur.hops <= maxHops) {
      const bucket = byHop.get(cur.hops) ?? [];
      bucket.push(cur.id);
      byHop.set(cur.hops, bucket);
    }
    if (cur.hops >= maxHops) continue;
    const sys = readGalaxySystem(cur.id);
    if (!sys) continue;
    for (const raw of sys.connections) {
      const next = raw?.trim();
      if (!next || visited.has(next)) continue;
      visited.add(next);
      queue.push({ id: next, hops: cur.hops + 1 });
    }
  }

  return byHop;
}

export function readGalaxySystemRecord(systemId: string): StarSystem | undefined {
  return readGalaxySystem(systemId);
}

export function resolveSystemIdForPlanetIdFromGalaxy(planetId: string): string | null {
  return resolveSystemIdFromGalaxy(planetId);
}
