/**
 * 주간 보드 갱신 후 고아 arc_inst_* 완료 진행 정리.
 * 스토어 비의존 — 호출부가 persist·카운터를 맡는다.
 */
import type { MissionProgress } from '../types';
import { ARC_CORE_INSTANCE_MISSION_ID_PREFIX } from './arcCoreInstanceMissionTypes';

export const CLEARED_ARC_INST_SNAPSHOT_LIMIT = 32;

export type ClearedArcInstSnapshot = {
  instanceId: string;
  title: string;
  completedAt: number;
};

export function isArcCoreInstanceProgressId(missionId: string): boolean {
  return missionId.startsWith(ARC_CORE_INSTANCE_MISSION_ID_PREFIX);
}

/** 초회 빈 보드(파일 없음)에서 고아 정리를 돌리면 complete arc_inst 가 전부 지워진다. */
export function shouldReconcileOrphanArcInstWithBoard(input: {
  hydrated: boolean;
  loadedFromStorage: boolean;
  entryCount: number;
}): boolean {
  if (!input.hydrated) return false;
  if (!input.loadedFromStorage && input.entryCount === 0) return false;
  return true;
}

export function collectArcCoreInstanceProgressIds(
  progresses: Record<string, MissionProgress>,
): string[] {
  const out: string[] = [];
  const ids = Object.keys(progresses);
  for (let i = 0; i < ids.length; i += 1) {
    const id = ids[i]!;
    if (isArcCoreInstanceProgressId(id)) out.push(id);
  }
  return out;
}

export function appendClearedArcInstSnapshot(
  prev: readonly ClearedArcInstSnapshot[],
  row: ClearedArcInstSnapshot,
): ClearedArcInstSnapshot[] {
  const next = [...prev, row];
  if (next.length <= CLEARED_ARC_INST_SNAPSHOT_LIMIT) return next;
  return next.slice(next.length - CLEARED_ARC_INST_SNAPSHOT_LIMIT);
}

export function pruneOrphanArcInstProgresses(input: {
  progresses: Record<string, MissionProgress>;
  boardInstanceIds: ReadonlySet<string>;
  resolveTitle: (missionId: string) => string | undefined;
  prevCount: number;
  prevSnapshots: readonly ClearedArcInstSnapshot[];
}): {
  nextProgresses: Record<string, MissionProgress>;
  prunedIds: string[];
  clearedArcInstCount: number;
  clearedArcInstSnapshots: ClearedArcInstSnapshot[];
  changed: boolean;
} {
  const ids = Object.keys(input.progresses);
  let next = input.progresses;
  let copied = false;
  const prunedIds: string[] = [];
  let clearedArcInstCount = Math.max(0, Math.floor(input.prevCount));
  let snapshots = input.prevSnapshots.slice();

  for (let i = 0; i < ids.length; i += 1) {
    const id = ids[i]!;
    if (!isArcCoreInstanceProgressId(id)) continue;
    if (input.boardInstanceIds.has(id)) continue;
    const progress = input.progresses[id]!;
    if (progress.status !== 'complete' && progress.status !== 'failed') continue;
    if (!copied) {
      next = { ...input.progresses };
      copied = true;
    }
    delete next[id];
    prunedIds.push(id);
    if (progress.status === 'complete') {
      clearedArcInstCount += 1;
      const title = (input.resolveTitle(id) ?? id).trim().slice(0, 80) || id;
      snapshots = appendClearedArcInstSnapshot(snapshots, {
        instanceId: id,
        title,
        completedAt: progress.completedAt ?? 0,
      });
    }
  }

  return {
    nextProgresses: next,
    prunedIds,
    clearedArcInstCount,
    clearedArcInstSnapshots: snapshots,
    changed: copied,
  };
}
