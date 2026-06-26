// ============================================================
// RTDB learning/global → 로컬 Learning Store (boot 1회 · persist 1회)
// ============================================================

import type { ArcCoreRtdbLearningGlobal } from '../../firebase/arccoreRtdbTypes';
import {
  mergeRtdbLearningSnapshot,
  type ArcCoreLearningKpiTimelineEntry,
} from './arcCoreLearningStore';

export type MergeRtdbLearningGlobalResult = {
  mergedEntries: number;
  policyHistoryAppended: boolean;
};

export async function mergeRtdbLearningGlobalIntoStore(
  global: ArcCoreRtdbLearningGlobal | null,
): Promise<MergeRtdbLearningGlobalResult> {
  if (!global || !Array.isArray(global.kpiTimelineTail)) {
    return { mergedEntries: 0, policyHistoryAppended: false };
  }

  const kpiEntries: ArcCoreLearningKpiTimelineEntry[] = [];
  for (const row of global.kpiTimelineTail.slice(-14)) {
    if (!row || typeof row.dayKey !== 'string' || !row.dayKey.trim()) continue;
    kpiEntries.push({
      dayKey: row.dayKey.trim(),
      economy: row.economy ?? {},
      combat: {},
    });
  }

  const packId = global.activePolicyPackId;
  const { kpiMerged, policyAppended } = await mergeRtdbLearningSnapshot({
    kpiEntries,
    policyEntry: packId
      ? {
          packId,
          ingestedAt: global.updatedAt ?? Date.now(),
          source: 'rtdb',
        }
      : null,
  });

  if (__DEV__ && kpiMerged > 0) {
    console.log(`[ArcCore/Learning] RTDB global merge entries=${kpiMerged}`);
  }

  return { mergedEntries: kpiMerged, policyHistoryAppended: policyAppended };
}
