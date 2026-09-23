/**
 * 보드 materialize 해제 후 완료 탭에 남기는 arc_inst 이력.
 * 스토어 비의존 — 바 UI·테스트가 같이 쓴다.
 */
import type { Mission, MissionProgress } from '../types';
import type { ClearedArcInstSnapshot } from './arcCoreInstanceProgressCleanup';

export type ClearedArcInstHistoryRow = {
  mission: Mission;
  progress: MissionProgress;
  isPrimaryActive: false;
};

export function buildClearedArcInstHistoryRow(
  snap: ClearedArcInstSnapshot,
): ClearedArcInstHistoryRow {
  const title = snap.title.trim().slice(0, 80) || snap.instanceId;
  return {
    mission: {
      id: snap.instanceId,
      title,
      description: '',
      type: 'explore',
      objectives: [],
      rewards: { credits: 0, exp: 0 },
      prerequisiteIds: [],
      nextMissionId: null,
      dc: 0,
    },
    progress: {
      missionId: snap.instanceId,
      status: 'complete',
      objectives: {},
      completedAt: snap.completedAt > 0 ? snap.completedAt : undefined,
      titleSnapshot: title,
    },
    isPrimaryActive: false,
  };
}

export function mergeClearedArcInstHistoryRows<T extends { mission: { id: string } }>(
  rows: T[],
  snapshots: readonly ClearedArcInstSnapshot[] | undefined,
  build: (snap: ClearedArcInstSnapshot) => T,
): T[] {
  if (!snapshots || snapshots.length === 0) return rows;
  const seen = new Set<string>();
  for (let i = 0; i < rows.length; i += 1) {
    seen.add(rows[i]!.mission.id);
  }
  for (let i = 0; i < snapshots.length; i += 1) {
    const snap = snapshots[i]!;
    if (seen.has(snap.instanceId)) continue;
    seen.add(snap.instanceId);
    rows.push(build(snap));
  }
  return rows;
}
