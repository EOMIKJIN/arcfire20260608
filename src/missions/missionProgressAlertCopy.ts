/**
 * 미션 업데이트 범용 팝업 문구 — 순수. overlay/RN 없음.
 */

import { t } from '../i18n';
import type { MissionProgress } from '../types';

export type MissionProgressAlertCopy = {
  title: string;
  message: string;
  messageSection?: { label: string; text: string };
};

export function buildMissionProgressAlertCopy(input: {
  kind: 'step' | 'complete';
  missionTitle: string;
  completedObjectiveText?: string;
  nextObjectiveText?: string | null;
  nextMissionTitle?: string | null;
}): MissionProgressAlertCopy {
  const title = t('mission.progress.alertTitle');
  if (input.kind === 'step') {
    const message = t('mission.progress.stepBody', {
      title: input.missionTitle,
      objective: input.completedObjectiveText ?? '',
    });
    const next = input.nextObjectiveText?.trim();
    return {
      title,
      message,
      ...(next
        ? {
            messageSection: {
              label: t('mission.progress.nextObjectiveLabel'),
              text: next,
            },
          }
        : {}),
    };
  }
  const message = t('mission.progress.completeBody', { title: input.missionTitle });
  const nextTitle = input.nextMissionTitle?.trim();
  return {
    title,
    message,
    ...(nextTitle
      ? {
          messageSection: {
            label: t('mission.progress.nextMissionLabel'),
            text: t('mission.progress.nextMission', { title: nextTitle }),
          },
        }
      : {}),
  };
}

/** 이번 완료로 새로 active가 된 미션만 — 이미 켜져 있던 다른 의뢰는 제외 */
export function resolveNewlyActivatedMissionId(
  completedMissionId: string,
  before: Record<string, MissionProgress>,
  after: Record<string, MissionProgress>,
  afterActiveId: string | null,
): string | null {
  if (!afterActiveId || afterActiveId === completedMissionId) return null;
  const prev = before[afterActiveId];
  const next = after[afterActiveId];
  if (!next || next.status !== 'active') return null;
  if (prev && prev.status === 'active') return null;
  return afterActiveId;
}
