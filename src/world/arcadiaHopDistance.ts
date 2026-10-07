// ============================================================
// 아르카디아 기준 성계 홉 — 그래프 BFS 1회 후 Map 조회
// 이동 조우 시드에서만 쓴다. 틱·렌더 금지.
// ============================================================

import { GALAXY_SYSTEMS_PRECOMPUTED } from '../data/generated/galaxySystems100.generated';

const ORIGIN_SYSTEM_ID = 'arcadia';
/** 그래프에 없거나 아르카디아에서 닿지 않으면 7홉 이상 정책 */
const UNREACHABLE_HOP = 7;

let hopBySystemId: Map<string, number> | null = null;

function buildHopMap(): Map<string, number> {
  const hop = new Map<string, number>([[ORIGIN_SYSTEM_ID, 0]]);
  const queue: string[] = [ORIGIN_SYSTEM_ID];
  let head = 0;
  while (head < queue.length) {
    const id = queue[head]!;
    head += 1;
    const links = GALAXY_SYSTEMS_PRECOMPUTED[id]?.connections;
    if (!links) continue;
    const nextHop = (hop.get(id) ?? 0) + 1;
    for (let i = 0; i < links.length; i += 1) {
      const neighbor = links[i];
      if (!neighbor || hop.has(neighbor) || !GALAXY_SYSTEMS_PRECOMPUTED[neighbor]) continue;
      hop.set(neighbor, nextHop);
      queue.push(neighbor);
    }
  }
  return hop;
}

function getHopMap(): Map<string, number> {
  if (!hopBySystemId) hopBySystemId = buildHopMap();
  return hopBySystemId;
}

/** 아르카디아에서 성계까지의 연결 홉. 미도달은 7. */
export function resolveArcadiaHopDistance(systemId: string | null | undefined): number {
  const sid = systemId?.trim() ?? '';
  if (!sid) return UNREACHABLE_HOP;
  const hop = getHopMap().get(sid);
  return hop == null ? UNREACHABLE_HOP : hop;
}
