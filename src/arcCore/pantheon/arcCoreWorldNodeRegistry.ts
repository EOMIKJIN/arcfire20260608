import { ARC_CORE_WORLD_NODES_FROM_CSV } from '../../data/generated';
import type { ArcCoreWorldNodeRow } from '../../types';

/** godId → 세계 거점 행. 모듈 레벨 1회 구성(틱당 재구성 금지). */
const BY_GOD_ID = new Map<string, ArcCoreWorldNodeRow>();
const SUBCORE_NODES: ArcCoreWorldNodeRow[] = [];

for (const row of ARC_CORE_WORLD_NODES_FROM_CSV) {
  if (row.role !== 'subcore' || !row.godId) continue;
  BY_GOD_ID.set(row.godId, row);
  SUBCORE_NODES.push(row);
}

export function getArcCoreWorldNodeByGodId(godId: string): ArcCoreWorldNodeRow | null {
  return BY_GOD_ID.get(godId) ?? null;
}

export function listArcCoreSubcoreNodes(): readonly ArcCoreWorldNodeRow[] {
  return SUBCORE_NODES;
}
