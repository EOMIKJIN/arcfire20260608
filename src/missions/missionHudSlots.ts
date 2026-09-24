/**
 * QuestHUD 주선·부선 슬롯 — 트랙 우선순위(tutorial > main_story > quest).
 * 렌더 경로 전용 조회. 틱/persist 없음.
 */
import type { Mission, MissionProgress } from '../types';
import { getMissionById } from './missionCatalog';
import { listActiveMissionBundles } from './missionActiveBundles';
import {
  isArcCoreAutoInstanceMissionId,
  isCampaignPrimaryMissionId,
  isQuestMissionId,
  missionTrackHudPriority,
  resolveMissionTrack,
} from './missionTrack';
import { isArcCoreInstanceMissionId } from './arcCoreInstanceMissionResolver';
import { isCaptainPersonalMissionId } from './captainPersonalMissionIds';
import { isUnidentifiedAnomalyMissionId } from './unidentifiedAnomaly/unidentifiedAnomalyIds';

export type MissionHudBundle = {
  mission: Mission;
  progress: MissionProgress;
};

function asActiveBundle(
  missionId: string,
  progresses: Record<string, MissionProgress>,
): MissionHudBundle | null {
  const progress = progresses[missionId];
  if (!progress || progress.status !== 'active') return null;
  const mission = getMissionById(missionId);
  if (!mission) return null;
  return { mission, progress };
}

/** QuestHUD 전체 목록(스크롤) — 트랙 우선순위 → 최근 시작순, 개수 제한 없음 */
export function listAllMissionHudBundles(
  progresses: Record<string, MissionProgress>,
): MissionHudBundle[] {
  return listActiveBundles(progresses);
}

function listActiveBundles(
  progresses: Record<string, MissionProgress>,
): MissionHudBundle[] {
  const out = listActiveMissionBundles(progresses);
  out.sort((a, b) => {
    const pa = missionTrackHudPriority(resolveMissionTrack(a.mission.id));
    const pb = missionTrackHudPriority(resolveMissionTrack(b.mission.id));
    if (pa !== pb) return pa - pb;
    return (b.progress.startedAt ?? 0) - (a.progress.startedAt ?? 0);
  });
  return out;
}

function isQuestLikeMissionId(missionId: string): boolean {
  return (
    isQuestMissionId(missionId)
    || isArcCoreInstanceMissionId(missionId)
    || isArcCoreAutoInstanceMissionId(missionId)
    || isCaptainPersonalMissionId(missionId)
    || isUnidentifiedAnomalyMissionId(missionId)
  );
}

/**
 * 주선: activeMissionId(캠페인 우선) → 없으면 트랙 우선순위 1건.
 * 부선: 주선이 아닌 활성 의뢰(quest/inst) 1건. 주선이 의뢰면 부선은 생략(중복 방지).
 */
export function resolveMissionHudSlots(
  progresses: Record<string, MissionProgress>,
  activeMissionId: string | null,
): { primary: MissionHudBundle | null; secondary: MissionHudBundle | null } {
  const active = listActiveBundles(progresses);
  if (active.length === 0) return { primary: null, secondary: null };

  let primary: MissionHudBundle | null = null;
  if (activeMissionId) {
    const pinned = asActiveBundle(activeMissionId, progresses);
    if (pinned) primary = pinned;
  }
  if (!primary) {
    primary = active[0] ?? null;
  }

  // 캠페인(튜토리얼/메인)이 활성인데 핀이 의뢰면 주선을 캠페인으로 승격
  if (primary && isQuestLikeMissionId(primary.mission.id)) {
    const campaign = active.find((row) => isCampaignPrimaryMissionId(row.mission.id));
    if (campaign) primary = campaign;
  }

  let secondary: MissionHudBundle | null = null;
  if (primary && isCampaignPrimaryMissionId(primary.mission.id)) {
    secondary =
      active.find(
        (row) =>
          row.mission.id !== primary!.mission.id && isQuestLikeMissionId(row.mission.id),
      ) ?? null;
  }

  return { primary, secondary };
}
