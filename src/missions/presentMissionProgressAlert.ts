/**
 * 퀘스트 진행 갱신 — 범용 compact 팝업 (`showArcAlert` · 40초).
 * completeObjective / finalizeMissionCompletion 이벤트만. 틱·새 overlay kind 없음.
 *
 * [pss-pre-dev] hot_path=event(complete/finalize) alloc=alert 1건 cache=없음
 * [pss-pre-dev] stage=Host compact 기존 · dispose=autoDismiss 40s risk=없음
 * [pss-pre-dev] verdict=PASS
 */

import { resolveMissionObjectiveDescription, resolveMissionTitle } from '../i18n/missionText';
import { useAppSettingsStore } from '../store/appSettingsStore';
import { useAppBootStore } from '../store/appBootStore';
import { isAccountResetInProgress } from '../account/accountResetPresence';
import { isTitleStartScreenActive } from '../navigation/titleStartScreenPresence';
import { showArcAlert } from '../utils/showArcAlert';
import { getMissionById } from './missionCatalog';
import {
  buildMissionProgressAlertCopy,
  type MissionProgressAlertCopy,
} from './missionProgressAlertCopy';

export {
  buildMissionProgressAlertCopy,
  resolveNewlyActivatedMissionId,
} from './missionProgressAlertCopy';
export type { MissionProgressAlertCopy } from './missionProgressAlertCopy';

/** 연속 목표 완료 시 같은 창만 교체 — 스택 누적 방지 */
export const MISSION_PROGRESS_ALERT_ID = 'mission-progress-alert';

export function shouldSkipMissionProgressAlert(): boolean {
  if (isTitleStartScreenActive()) return true;
  if (isAccountResetInProgress()) return true;
  if (!useAppBootStore.getState().bootReady) return true;
  return false;
}

function showMissionProgressAlert(copy: MissionProgressAlertCopy): void {
  if (shouldSkipMissionProgressAlert()) return;
  showArcAlert(copy.title, copy.message, undefined, {
    id: MISSION_PROGRESS_ALERT_ID,
    ...(copy.messageSection ? { messageSection: copy.messageSection } : {}),
  });
}

/** 목표 1건 완료 · 미션은 아직 남음 */
export function presentMissionObjectiveProgressAlert(args: {
  missionId: string;
  completedObjectiveId: string;
  objectives: Record<string, boolean>;
}): void {
  const mission = getMissionById(args.missionId);
  if (!mission) return;
  const locale = useAppSettingsStore.getState().locale;
  const completed = mission.objectives.find((o) => o.id === args.completedObjectiveId);
  if (!completed) return;
  let nextObjectiveText: string | null = null;
  for (let i = 0; i < mission.objectives.length; i += 1) {
    const row = mission.objectives[i]!;
    if (!args.objectives[row.id]) {
      nextObjectiveText = resolveMissionObjectiveDescription(row, locale);
      break;
    }
  }
  showMissionProgressAlert(
    buildMissionProgressAlertCopy({
      kind: 'step',
      missionTitle: resolveMissionTitle(mission, locale),
      completedObjectiveText: resolveMissionObjectiveDescription(completed, locale),
      nextObjectiveText,
    }),
  );
}

/** 미션 완료 · 체인으로 새 미션이 열린 경우만 next 표시 */
export function presentMissionChainUpdateAlert(args: {
  completedMissionId: string;
  nextMissionId: string | null;
}): void {
  const mission = getMissionById(args.completedMissionId);
  if (!mission) return;
  const locale = useAppSettingsStore.getState().locale;
  const next = args.nextMissionId ? getMissionById(args.nextMissionId) : undefined;
  showMissionProgressAlert(
    buildMissionProgressAlertCopy({
      kind: 'complete',
      missionTitle: resolveMissionTitle(mission, locale),
      nextMissionTitle: next ? resolveMissionTitle(next, locale) : null,
    }),
  );
}
