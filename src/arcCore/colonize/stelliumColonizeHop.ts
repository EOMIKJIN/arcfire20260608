import { listAdjacentSystemIds } from '../territorial/territorialSupplyLine';
import { PlanetOccupationSeeds_FROM_BALANCE_CSV } from '../../data/balance/generated';
import { listAdjacentFromRuntimeCore } from './runtimeConfirmedCoreGraph';

export type StelliumColonizeHopResult = {
  hops: number;
  originSystemId: string;
};

function pushUniqueAdjacent(
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

/**
 * 개척 홉 인접 — CSV 21성계 + 도착 확인으로 접목된 런타임 코어 그래프.
 * 이동 그래프는 접목 이웃의 폴백만 쓴다(미확인 성계를 코어로 취급하지 않음).
 */
export function listAdjacentSystemIdsForColonize(systemId: string): string[] {
  const selfId = String(systemId ?? '').trim();
  if (!selfId) return [];
  let overlay: Record<string, string[]> = {};
  try {
    const { useWorldStore } = require('../../store/worldStore') as typeof import('../../store/worldStore');
    overlay = useWorldStore.getState().runtimeCoreAdjBySystemId ?? {};
  } catch {
    /* node test / store 미기동 */
  }
  const out = listAdjacentFromRuntimeCore(selfId, overlay, listAdjacentSystemIds(selfId));
  const seen = new Set(out);
  const confirmed = Object.prototype.hasOwnProperty.call(overlay, selfId);
  if (!confirmed) return out;
  try {
    const { GALAXY_SYSTEMS_PRECOMPUTED } = require('../../data/generated/galaxySystems100.generated') as typeof import('../../data/generated/galaxySystems100.generated');
    pushUniqueAdjacent(out, seen, selfId, GALAXY_SYSTEMS_PRECOMPUTED[selfId]?.connections);
  } catch {
    /* generated 미기동 */
  }
  try {
    const { useWorldStore } = require('../../store/worldStore') as typeof import('../../store/worldStore');
    pushUniqueAdjacent(out, seen, selfId, useWorldStore.getState().systems[selfId]?.connections);
  } catch {
    /* node test / store 미기동 */
  }
  return out;
}

/**
 * 목표 성계에서 가장 가까운 BLUE 점유 성계까지 홉.
 * 자기 성계가 BLUE 면 hops=0.
 */
export function hopDistanceToNearestBlueHold(input: {
  systemId: string;
  blueSystemIds: ReadonlySet<string>;
  listAdjacent: (systemId: string) => readonly string[];
}): StelliumColonizeHopResult | null {
  const start = String(input.systemId ?? '').trim();
  if (!start) return null;
  if (input.blueSystemIds.has(start)) {
    return { hops: 0, originSystemId: start };
  }

  const seen = new Set<string>([start]);
  const queue: Array<{ id: string; hops: number }> = [{ id: start, hops: 0 }];

  while (queue.length > 0) {
    const cur = queue.shift();
    if (!cur) break;
    const neighbors = input.listAdjacent(cur.id);
    for (let i = 0; i < neighbors.length; i += 1) {
      const nextId = neighbors[i];
      if (!nextId || seen.has(nextId)) continue;
      seen.add(nextId);
      const nextHops = cur.hops + 1;
      if (input.blueSystemIds.has(nextId)) {
        return { hops: nextHops, originSystemId: nextId };
      }
      queue.push({ id: nextId, hops: nextHops });
    }
  }
  return null;
}

export function collectBlueHoldSystemIds(
  holds: Readonly<Record<string, { systemId?: string; occupierClanId?: string }>>,
  isBlueOccupier: (occupierClanId: string | null | undefined) => boolean,
): Set<string> {
  const out = new Set<string>();
  const keys = Object.keys(holds);
  for (let i = 0; i < keys.length; i += 1) {
    const hold = holds[keys[i]];
    if (!hold?.systemId) continue;
    if (!isBlueOccupier(hold.occupierClanId)) continue;
    out.add(hold.systemId);
  }
  return out;
}

/** 런타임 hold + CSV 시드 BLUE — hold hydrate 전에도 아르카디아 등 출발점이 잡힌다 */
export function collectBlueSystemIdsForColonizeHop(
  holds: Readonly<Record<string, { systemId?: string; occupierClanId?: string }>>,
  isBlueOccupier: (occupierClanId: string | null | undefined) => boolean,
): Set<string> {
  const out = collectBlueHoldSystemIds(holds, isBlueOccupier);
  for (let i = 0; i < PlanetOccupationSeeds_FROM_BALANCE_CSV.length; i += 1) {
    const row = PlanetOccupationSeeds_FROM_BALANCE_CSV[i];
    if (String(row?.initialOwner ?? '').trim().toUpperCase() !== 'BLUE') continue;
    const systemId = String(row?.systemId ?? '').trim();
    if (systemId) out.add(systemId);
  }
  return out;
}
