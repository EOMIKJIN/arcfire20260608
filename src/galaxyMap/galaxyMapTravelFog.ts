// ============================================================
// 은하 지도 이동 안개 — 방문 ∪ 방문지 이웃만 노드/선/국경 표시
// 연결 노드는 전함 마크가 성계에 도착(markVisited)한 뒤에만 연다.
// 이동 클릭 시 currentSystemId만 커밋되어도 이웃은 열지 않는다.
// 정본 연결: 런타임 StarSystem.connections (GALAXY_SYSTEMS · 코어 CSV + synth 항로)
// ============================================================

import type { StarSystem } from '../types';

export function sameGalaxyMapIdSet(
  a: ReadonlySet<string> | null | undefined,
  b: ReadonlySet<string> | null | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b || a.size !== b.size) return false;
  for (const id of a) {
    if (!b.has(id)) return false;
  }
  return true;
}

/** systems 객체 교체만으로 Set 신원가 바뀌면 Voronoi/별빛 전량 재계산 — 멤버십 같으면 재사용 */
export function reuseGalaxyMapIdSetIfSame(
  prev: ReadonlySet<string> | null | undefined,
  next: Set<string>,
): Set<string> {
  if (prev && sameGalaxyMapIdSet(prev, next)) return prev as Set<string>;
  return next;
}

export function sameGalaxyMapSystemIdSeq(
  a: readonly { id: string }[] | null | undefined,
  b: readonly { id: string }[] | null | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i]!.id !== b[i]!.id) return false;
  }
  return true;
}

export function partitionVisibleSystemsByTravelFog<T extends { id: string }>(
  visibleSystems: readonly T[],
  revealedIds: ReadonlySet<string>,
): { visible: T[]; hidden: T[] } {
  const visible: T[] = [];
  const hidden: T[] = [];
  for (let i = 0; i < visibleSystems.length; i++) {
    const sys = visibleSystems[i]!;
    if (revealedIds.has(sys.id)) visible.push(sys);
    else hidden.push(sys);
  }
  return { visible, hidden };
}

export function resolveGalaxyMapTravelFogRevealedIds(params: {
  visitedSystemIds: readonly string[];
  currentSystemId?: string | null;
  systems: Record<string, StarSystem | undefined>;
  extraNeighborHops?: number;
}): Set<string> {
  const revealed = new Set<string>();
  const { systems } = params;

  const addWithNeighbors = (rawId: string | null | undefined) => {
    const id = String(rawId ?? '').trim();
    if (!id || !systems[id]) return;
    revealed.add(id);
    const conns = systems[id]!.connections;
    for (let i = 0; i < conns.length; i++) {
      const connId = String(conns[i] ?? '').trim();
      if (connId && systems[connId]) revealed.add(connId);
    }
  };

  for (let i = 0; i < params.visitedSystemIds.length; i++) {
    addWithNeighbors(params.visitedSystemIds[i]);
  }

  const extra = Math.max(0, Math.min(2, Math.floor(params.extraNeighborHops ?? 0)));
  if (extra > 0) {
    let frontier: string[] = [];
    revealed.forEach((id) => {
      frontier.push(id);
    });
    for (let hop = 0; hop < extra; hop += 1) {
      const next: string[] = [];
      for (let i = 0; i < frontier.length; i += 1) {
        const conns = systems[frontier[i]!]?.connections;
        if (!conns) continue;
        for (let j = 0; j < conns.length; j += 1) {
          const connId = String(conns[j] ?? '').trim();
          if (!connId || !systems[connId] || revealed.has(connId)) continue;
          revealed.add(connId);
          next.push(connId);
        }
      }
      frontier = next;
      if (frontier.length === 0) break;
    }
  }

  // 애니 전 좌표 커밋만 된 현재 성계 — 노드만 유지, 연결 이웃은 도착(방문) 후
  const currentId = String(params.currentSystemId ?? '').trim();
  if (currentId && systems[currentId]) revealed.add(currentId);

  return revealed;
}

export function isGalaxyMapTravelFogRevealed(
  systemId: string,
  revealedIds: ReadonlySet<string>,
): boolean {
  return revealedIds.has(String(systemId ?? '').trim());
}
