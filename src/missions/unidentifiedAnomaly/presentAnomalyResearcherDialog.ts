import { presentIngameDialogScene, registerIngameDialogCallback } from '../../game/ingameDialog/ingameDialogApi';
import {
  ANOMALY_RESEARCHER_ABANDON_SCENE_ID,
  ANOMALY_RESEARCHER_CAPTAIN_ID,
  ANOMALY_RESEARCHER_OFFER_SCENE_ID,
} from './unidentifiedAnomalyIds';
import { settleAnomalyEvent } from './settleAnomalyEvent';

const ABANDON_CALLBACK_ID = 'unidentified-anomaly-abandon';

export function isAnomalyResearcherVisibleOnPlanet(planetId: string): boolean {
  const { useUnidentifiedAnomalyStore } =
    require('../../store/unidentifiedAnomalyStore') as typeof import('../../store/unidentifiedAnomalyStore');
  const active = useUnidentifiedAnomalyStore.getState().active;
  if (!active) return false;
  return active.planetId === planetId;
}

export function presentAnomalyResearcherDialog(planetId: string): boolean {
  const { useUnidentifiedAnomalyStore } =
    require('../../store/unidentifiedAnomalyStore') as typeof import('../../store/unidentifiedAnomalyStore');
  const active = useUnidentifiedAnomalyStore.getState().active;
  if (!active || active.planetId !== planetId) return false;

  if (active.status === 'listed') {
    return presentIngameDialogScene(ANOMALY_RESEARCHER_OFFER_SCENE_ID, {
      skipSeenCheck: true,
      completionActions: [
        {
          type: 'accept_quest_mission',
          missionId: active.instanceId,
          planetId,
          expectCaptainId: ANOMALY_RESEARCHER_CAPTAIN_ID,
        },
      ],
    });
  }

  const presented = presentIngameDialogScene(ANOMALY_RESEARCHER_ABANDON_SCENE_ID, {
    skipSeenCheck: true,
    completionActions: [{ type: 'run_callback', callbackId: ABANDON_CALLBACK_ID }],
  });
  if (presented) {
    registerIngameDialogCallback(ABANDON_CALLBACK_ID, () => {
      settleAnomalyEvent('abandoned', active.instanceId);
    });
  }
  return presented;
}
