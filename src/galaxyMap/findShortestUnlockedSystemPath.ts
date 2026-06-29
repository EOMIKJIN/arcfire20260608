// ============================================================
// 은하 지도 — 개방 성계 그래프 BFS 최단 홉 경로
// ============================================================

import type { StarSystem } from '../types';

/** `from`→`to` 최단 경로(성계 id 배열). 동일·미연결·잠금 시 null. */
export function findShortestUnlockedSystemPath(
  systems: Record<string, StarSystem>,
  fromSystemId: string,
  toSystemId: string,
  unlockedSystemIds: readonly string[],
): string[] | null {
  const from = fromSystemId?.trim();
  const to = toSystemId?.trim();
  if (!from || !to) return null;
  if (from === to) return [from];

  const unlocked = new Set(unlockedSystemIds);
  if (!unlocked.has(from) || !unlocked.has(to)) return null;

  const queue: string[] = [from];
  const prev = new Map<string, string | null>();
  prev.set(from, null);

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (id === to) break;
    const sys = systems[id];
    if (!sys) continue;
    for (const connId of sys.connections) {
      if (!unlocked.has(connId) || prev.has(connId)) continue;
      prev.set(connId, id);
      queue.push(connId);
    }
  }

  if (!prev.has(to)) return null;

  const path: string[] = [];
  let cur: string | null = to;
  while (cur) {
    path.unshift(cur);
    cur = prev.get(cur) ?? null;
  }
  return path.length >= 2 ? path : null;
}
