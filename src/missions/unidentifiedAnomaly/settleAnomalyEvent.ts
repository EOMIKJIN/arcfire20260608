/**
 * 이상현상 수명 단일 정리 — 링·동시 1·이력·유물 회수·미션 progress.
 * 두 번 호출돼도 idempotent.
 */
import { ANOMALY_RELIC_ITEM_ID, isUnidentifiedAnomalyMissionId } from './unidentifiedAnomalyIds';
import { forgetUnidentifiedAnomalyMaterializedMission } from './unidentifiedAnomalyResolver';
import { onQuestRelicLost } from '../../game/questRelic/questRelicEffectRegistry';
import type { UnidentifiedAnomalySettleReason } from '../../store/unidentifiedAnomalyStore';

let settlingId: string | null = null;

export function settleAnomalyEvent(
  reason: UnidentifiedAnomalySettleReason,
  instanceId?: string,
): void {
  const { useUnidentifiedAnomalyStore } =
    require('../../store/unidentifiedAnomalyStore') as typeof import('../../store/unidentifiedAnomalyStore');
  const store = useUnidentifiedAnomalyStore.getState();
  const active = store.active;
  if (!active) return;
  if (instanceId && active.instanceId !== instanceId) return;
  if (settlingId === active.instanceId) return;
  settlingId = active.instanceId;

  try {
    const snap = active;
    store.recordResolved({
      planetId: snap.planetId,
      resolvedAtMs: Date.now(),
      reason,
    });
    store.settleActive();

    if (reason !== 'cleared') {
      try {
        const { usePlayerStore } =
          require('../../store/playerStore') as typeof import('../../store/playerStore');
        usePlayerStore.getState().removeInventoryItemBestEffort(ANOMALY_RELIC_ITEM_ID, 1);
        onQuestRelicLost(ANOMALY_RELIC_ITEM_ID);
      } catch {
        /* 인벤 미준비 */
      }
    }

    if (isUnidentifiedAnomalyMissionId(snap.instanceId)) {
      try {
        const { useMissionStore } =
          require('../../store/missionStore') as typeof import('../../store/missionStore');
        useMissionStore.getState().closeAnomalyMission(
          snap.instanceId,
          reason === 'failed' ? 'failed' : 'expired',
        );
      } catch {
        /* 미션 스토어 미준비 */
      }
      forgetUnidentifiedAnomalyMaterializedMission(snap.instanceId);
    }

    void store.persistLocal();
  } finally {
    settlingId = null;
  }
}
