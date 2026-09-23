// ============================================================
// 분쟁 패스 완료 → 관측 버스 (메모리만 · persist 없음)
// pending / 60s probe 반복 publish 금지
// ============================================================

import { publishArcCoreObservation } from '../observation/arcCoreObservationBus';
import { ARC_CORE_OBS_SUBCORE } from '../observation/arcCoreObservationTypes';
import type {
  TerritorialLearningDecision,
  TerritorialLearningSource,
} from './factionPowerTypes';

export type TerritorialPassLearningPayload = {
  planetId: string;
  systemId?: string;
  campaignGroup?: string;
  decision: TerritorialLearningDecision;
  holdChanged: boolean;
  previousSide: string;
  newSide: string;
  source: Exclude<TerritorialLearningSource, 'operation_fallback'>;
  attackerSide?: string;
  attackerWon?: boolean;
};

export function publishTerritorialPassLearning(input: TerritorialPassLearningPayload): void {
  const planetId = String(input.planetId ?? '').trim();
  if (!planetId) return;
  if (input.decision !== 'battle' && input.decision !== 'neutral_declare' && input.decision !== 'status_quo') {
    return;
  }
  publishArcCoreObservation({
    kind: 'territorial.pass_result',
    planetId,
    systemId: input.systemId,
    subCoreId: ARC_CORE_OBS_SUBCORE.territorial,
    payload: {
      campaignGroup: input.campaignGroup ?? null,
      decision: input.decision,
      holdChanged: input.holdChanged,
      previousSide: input.previousSide,
      newSide: input.newSide,
      attackerSide: input.attackerSide ?? null,
      attackerWon: input.attackerWon ?? null,
      source: input.source,
    },
  });
}
