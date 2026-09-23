/**
 * 런타임 확인 코어 그래프 — CSV 21성계 정본은 읽기 전용.
 * 플레이어 전함이 도착·확인한 성계만 이동 그래프 이웃을 양방향으로 접목한다.
 */

export type RuntimeCoreAdjMap = Record<string, string[]>;

function pushUnique(
  out: string[],
  seen: Set<string>,
  selfId: string,
  conns: readonly string[] | undefined,
): void {
  if (!conns) return;
  for (let i = 0; i < conns.length; i += 1) {
    const id = String(conns[i] ?? '').trim();
    if (!id || id === selfId || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
}

export function cloneRuntimeCoreAdj(overlay: Readonly<RuntimeCoreAdjMap>): RuntimeCoreAdjMap {
  const next: RuntimeCoreAdjMap = {};
  const keys = Object.keys(overlay);
  for (let i = 0; i < keys.length; i += 1) {
    const id = keys[i];
    next[id] = overlay[id] ? [...overlay[id]] : [];
  }
  return next;
}

/** GALAXY·월드 런타임 연결을 합친 이동 이웃 */
export function collectTravelNeighborIds(
  systemId: string,
  systems: Readonly<Record<string, { connections?: readonly string[] } | undefined>>,
): string[] {
  const selfId = String(systemId ?? '').trim();
  if (!selfId) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  pushUnique(out, seen, selfId, systems[selfId]?.connections);
  try {
    const { GALAXY_SYSTEMS_PRECOMPUTED } =
      require('../../data/generated/galaxySystems100.generated') as typeof import('../../data/generated/galaxySystems100.generated');
    pushUnique(out, seen, selfId, GALAXY_SYSTEMS_PRECOMPUTED[selfId]?.connections);
  } catch {
    /* generated 미기동 */
  }
  return out;
}

/**
 * 확인된 성계를 오버레이에 접목. CSV를 덮어쓰지 않고 양방향 엣지만 추가.
 * 이웃이 없어도 노드 자체는 등록한다.
 */
export function graftSystemIntoRuntimeCoreAdj(
  overlay: Readonly<RuntimeCoreAdjMap>,
  systemId: string,
  neighborIds: readonly string[],
): { next: RuntimeCoreAdjMap; changed: boolean } {
  const selfId = String(systemId ?? '').trim();
  if (!selfId) return { next: cloneRuntimeCoreAdj(overlay), changed: false };

  const next = cloneRuntimeCoreAdj(overlay);
  let changed = !(selfId in overlay);
  const selfAdj = next[selfId] ? [...next[selfId]] : [];
  const selfSeen = new Set(selfAdj);

  for (let i = 0; i < neighborIds.length; i += 1) {
    const neighborId = String(neighborIds[i] ?? '').trim();
    if (!neighborId || neighborId === selfId) continue;
    if (!selfSeen.has(neighborId)) {
      selfSeen.add(neighborId);
      selfAdj.push(neighborId);
      changed = true;
    }
    const otherAdj = next[neighborId] ? [...next[neighborId]] : [];
    if (!otherAdj.includes(selfId)) {
      otherAdj.push(selfId);
      next[neighborId] = otherAdj;
      changed = true;
    }
  }

  next[selfId] = selfAdj;
  return { next, changed };
}

export function listAdjacentFromRuntimeCore(
  systemId: string,
  overlay: Readonly<RuntimeCoreAdjMap>,
  csvAdj: readonly string[],
): string[] {
  const selfId = String(systemId ?? '').trim();
  if (!selfId) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  pushUnique(out, seen, selfId, csvAdj);
  pushUnique(out, seen, selfId, overlay[selfId]);
  return out;
}

export function stripRuntimeCoreAdjSystems(
  overlay: Readonly<RuntimeCoreAdjMap>,
  removeIds: readonly string[],
): RuntimeCoreAdjMap {
  const drop = new Set(removeIds.map((id) => String(id ?? '').trim()).filter(Boolean));
  if (drop.size === 0) return cloneRuntimeCoreAdj(overlay);
  const next: RuntimeCoreAdjMap = {};
  const keys = Object.keys(overlay);
  for (let i = 0; i < keys.length; i += 1) {
    const id = keys[i];
    if (drop.has(id)) continue;
    const src = overlay[id] ?? [];
    const adj: string[] = [];
    for (let j = 0; j < src.length; j += 1) {
      const n = src[j];
      if (!n || drop.has(n) || n === id) continue;
      if (adj.includes(n)) continue;
      adj.push(n);
    }
    next[id] = adj;
  }
  return next;
}

export function sanitizeRuntimeCoreAdj(
  raw: unknown,
  knownSystemIds: Readonly<Record<string, unknown>>,
  normalizeId: (id: string) => string,
): RuntimeCoreAdjMap {
  if (!raw || typeof raw !== 'object') return {};
  const next: RuntimeCoreAdjMap = {};
  const entries = Object.entries(raw as Record<string, unknown>);
  for (let i = 0; i < entries.length; i += 1) {
    const rawId = String(entries[i][0] ?? '').trim();
    const id = rawId ? normalizeId(rawId) : '';
    if (!id || !knownSystemIds[id]) continue;
    const arr = entries[i][1];
    if (!Array.isArray(arr)) continue;
    const seen = new Set<string>();
    const adj: string[] = [];
    for (let j = 0; j < arr.length; j += 1) {
      const n = normalizeId(String(arr[j] ?? '').trim());
      if (!n || n === id || seen.has(n) || !knownSystemIds[n]) continue;
      seen.add(n);
      adj.push(n);
    }
    next[id] = adj;
  }
  return next;
}
