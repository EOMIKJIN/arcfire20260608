/**
 * 종료된 arc_anom_* progress 정리 — persist JSON·PSS floor 누적 차단.
 * 이력은 unidentifiedAnomalyStore.recentResolved(cap 8)가 맡는다.
 */
import type { MissionProgress } from '../../types';
import { isUnidentifiedAnomalyMissionId } from './unidentifiedAnomalyIds';

export function isLivingUnidentifiedAnomalyProgressStatus(status: string): boolean {
  return status === 'active' || status === 'available';
}

export function pruneSettledUnidentifiedAnomalyProgresses(
  progresses: Record<string, MissionProgress>,
  keepMissionId?: string | null,
): {
  next: Record<string, MissionProgress>;
  prunedIds: string[];
  changed: boolean;
} {
  const ids = Object.keys(progresses);
  let next = progresses;
  let copied = false;
  const prunedIds: string[] = [];
  const keep = String(keepMissionId ?? '').trim();

  for (let i = 0; i < ids.length; i += 1) {
    const id = ids[i]!;
    if (!isUnidentifiedAnomalyMissionId(id)) continue;
    if (keep && id === keep) continue;
    const progress = progresses[id];
    if (!progress) continue;
    if (!keep && isLivingUnidentifiedAnomalyProgressStatus(progress.status)) continue;
    if (!copied) {
      next = { ...progresses };
      copied = true;
    }
    delete next[id];
    prunedIds.push(id);
  }

  return { next, prunedIds, changed: copied };
}
