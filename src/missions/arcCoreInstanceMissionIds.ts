import { ARC_CORE_INSTANCE_MISSION_ID_PREFIX } from './arcCoreInstanceMissionTypes';
import type { ArcCoreInstanceMissionBoardEntry } from './arcCoreInstanceMissionTypes';

function sanitizePlanetToken(planetId: string): string {
  return planetId.replace(/[^a-z0-9_]/gi, '').toLowerCase().slice(0, 24);
}

export function buildArcCoreInstanceId(planetId: string, seq: number): string {
  const token = sanitizePlanetToken(planetId);
  const seqText = String(seq + 1).padStart(2, '0');
  return `${ARC_CORE_INSTANCE_MISSION_ID_PREFIX}${token}_${seqText}`;
}

/** 행성 보드에 이미 있는 instanceId는 건너뛴다. seq=listed 개수면 수락 잔존 `_10`과 충돌한다. */
export function allocateUniqueArcCoreInstanceId(
  planetId: string,
  usedInstanceIds: ReadonlySet<string>,
  extraUsedInstanceIds?: Iterable<string>,
): string {
  const used: ReadonlySet<string> = extraUsedInstanceIds
    ? new Set<string>([...usedInstanceIds, ...extraUsedInstanceIds])
    : usedInstanceIds;
  let seq = 0;
  while (seq < 10_000) {
    const id = buildArcCoreInstanceId(planetId, seq);
    if (!used.has(id)) return id;
    seq += 1;
  }
  return `${ARC_CORE_INSTANCE_MISSION_ID_PREFIX}${sanitizePlanetToken(planetId)}_${Date.now().toString(36)}`;
}

const BOARD_STATUS_KEEP_RANK: Record<ArcCoreInstanceMissionBoardEntry['boardStatus'], number> = {
  accepted: 2,
  listed: 1,
  cleared: 0,
};

/** persist에 같은 instanceId가 2건이면 수락 > listed > 클리어, 동률은 최근 등록. */
export function dedupeArcCoreInstanceBoardEntries(
  entries: readonly ArcCoreInstanceMissionBoardEntry[],
): ArcCoreInstanceMissionBoardEntry[] {
  const byId = new Map<string, ArcCoreInstanceMissionBoardEntry>();
  for (const row of entries) {
    const prev = byId.get(row.instanceId);
    if (!prev) {
      byId.set(row.instanceId, row);
      continue;
    }
    const prevRank = BOARD_STATUS_KEEP_RANK[prev.boardStatus];
    const nextRank = BOARD_STATUS_KEEP_RANK[row.boardStatus];
    if (nextRank > prevRank) {
      byId.set(row.instanceId, row);
      continue;
    }
    if (nextRank === prevRank && row.registeredAtMs >= prev.registeredAtMs) {
      byId.set(row.instanceId, row);
    }
  }
  if (byId.size === entries.length) return entries as ArcCoreInstanceMissionBoardEntry[];
  return [...byId.values()];
}
