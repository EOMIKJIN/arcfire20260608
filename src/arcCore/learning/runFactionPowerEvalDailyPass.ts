// ============================================================
// 팩션 전력 평가 일일 패스 — 관측 flush(메모리) + 스냅샷/비교
// persist는 호출측(경제 학습 KPI 1회)에서만
// ============================================================

import { useClanWarFoundationStore } from '../../store/clanWarFoundationStore';
import { drainArcCoreObservationBuffer } from '../observation/arcCoreObservationBus';
import {
  getArcCoreLearningStoreSnapshot,
  hydrateArcCoreLearningStore,
  ingestObservationsInMemory,
} from './arcCoreLearningStore';
import { collectTerritorialLearningOutcomes } from './collectTerritorialLearningOutcomes';
import {
  compactFactionPowerKpiFromCompare,
  compareFactionPowerToTerritorialOutcomes,
} from './compareFactionPowerToTerritorialOutcomes';
import { computeFactionPowerSnapshotFromStores } from './computeFactionPowerSnapshot';
import type {
  FactionPowerCompareReport,
  FactionPowerKpiCompact,
  FactionPowerSnapshot,
} from './factionPowerTypes';

export type FactionPowerEvalDailyPassResult = {
  flushed: number;
  snapshot: FactionPowerSnapshot;
  compare: FactionPowerCompareReport;
  kpi: FactionPowerKpiCompact;
};

export async function runFactionPowerEvalDailyPass(
  nowMs = Date.now(),
): Promise<FactionPowerEvalDailyPassResult> {
  await hydrateArcCoreLearningStore();
  const flushed = ingestObservationsInMemory(drainArcCoreObservationBuffer());
  const learning = getArcCoreLearningStoreSnapshot();
  const war = useClanWarFoundationStore.getState();
  const outcomes = collectTerritorialLearningOutcomes({
    observations: learning.observations.tail,
    operations: war.hydrated ? war.operations : [],
    nowMs,
  });
  const snapshot = computeFactionPowerSnapshotFromStores(nowMs);
  const compare = compareFactionPowerToTerritorialOutcomes(snapshot, outcomes);
  const kpi = compactFactionPowerKpiFromCompare(snapshot, compare);
  return { flushed, snapshot, compare, kpi };
}
