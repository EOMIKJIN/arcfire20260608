import type { Mission, MissionObjective, MissionProgress } from '../types';
import { MISSION_TIME_LIMIT_POLICY_FROM_CSV } from './missionTimeLimitPolicy';
import { deriveMissionPlayCategory } from './missionCategory';
import {
  isArcCoreAutoInstanceMissionId,
  isMainStoryMissionId,
  isQuestMissionId,
  isBarInstanceTemplateMissionId,
  isTutorialMissionId,
} from './missionTrack';
import { isCaptainPersonalMissionId } from './captainPersonalMissionIds';

export const MISSION_TIME_LIMIT_MS_PER_HOUR = 3_600_000;
export const MISSION_TIME_LIMIT_MS_PER_DAY = 24 * MISSION_TIME_LIMIT_MS_PER_HOUR;

export type MissionTimeLimitTrack = 'tutorial' | 'main_story' | 'quest' | 'inst_tpl';

export type MissionCargoRemoval = {
  goodId: string;
  quantity: number;
};

export type ExpiredMissionSweepCompute = {
  expiredIds: string[];
  nextProgresses: Record<string, MissionProgress>;
  nextActiveMissionId: string | null;
  cargoRemovals: MissionCargoRemoval[];
  restoreListedInstanceIds: string[];
};

const policyHoursByKey = new Map<string, number>();
for (const row of MISSION_TIME_LIMIT_POLICY_FROM_CSV) {
  policyHoursByKey.set(`${row.track}\t${row.playCategory}`, row.timeLimitHours);
}

function policyKey(track: string, playCategory: string): string {
  return `${track}\t${playCategory}`;
}

export function resolveMissionTimeLimitTrack(missionId: string): MissionTimeLimitTrack {
  if (isTutorialMissionId(missionId)) return 'tutorial';
  if (isMainStoryMissionId(missionId)) return 'main_story';
  if (isBarInstanceTemplateMissionId(missionId)) return 'inst_tpl';
  return 'quest';
}

function fallbackHoursForTrackAndCategory(
  track: MissionTimeLimitTrack,
  playCategory: string,
): number {
  const exact = policyHoursByKey.get(policyKey(track, playCategory));
  if (exact != null) return exact;
  const wildcard = policyHoursByKey.get(policyKey(track, '*'));
  if (wildcard != null) return wildcard;
  if (track === 'tutorial' || track === 'main_story') return 0;
  if (playCategory === 'combat') return 24;
  if (playCategory === 'delivery') return 72;
  return 48;
}

export function resolveMissionTimeLimitHours(
  mission: Pick<Mission, 'id' | 'type' | 'objectives' | 'timeLimitHours'>,
): number {
  if (typeof mission.timeLimitHours === 'number' && Number.isFinite(mission.timeLimitHours)) {
    return Math.max(0, Math.floor(mission.timeLimitHours));
  }
  const track = resolveMissionTimeLimitTrack(mission.id);
  const playCategory = deriveMissionPlayCategory(mission);
  return Math.max(0, Math.floor(fallbackHoursForTrackAndCategory(track, playCategory)));
}

export function stampMissionExpiresAtMs(
  mission: Pick<Mission, 'id' | 'type' | 'objectives' | 'timeLimitHours'>,
  startedAtMs: number,
): number | undefined {
  const hours = resolveMissionTimeLimitHours(mission);
  if (hours <= 0) return undefined;
  return startedAtMs + hours * MISSION_TIME_LIMIT_MS_PER_HOUR;
}

/** 할당 표시 — `1day (24h)`. 제한 없으면 null. */
export function formatMissionTimeLimitAssigned(hours: number): string | null {
  const h = Math.max(0, Math.floor(hours));
  if (h <= 0) return null;
  const days = Math.floor(h / 24);
  return `${days}day (${h}h)`;
}

/** 남은 시간 — 같은 형식. 1시간 미만만 분 표시. */
export function formatMissionTimeLimitRemaining(expiresAtMs: number, nowMs: number): string {
  const rem = Math.max(0, expiresAtMs - nowMs);
  const hours = Math.floor(rem / MISSION_TIME_LIMIT_MS_PER_HOUR);
  const minutes = Math.floor((rem % MISSION_TIME_LIMIT_MS_PER_HOUR) / 60_000);
  const days = Math.floor(hours / 24);
  if (rem < MISSION_TIME_LIMIT_MS_PER_HOUR) {
    return `0day (0h ${minutes}m)`;
  }
  return `${days}day (${hours}h)`;
}

function isCargoObjective(type: MissionObjective['type']): boolean {
  return type === 'buy_goods' || type === 'deliver_cargo';
}

/** 해당 미션 화물만 — 같은 goodId는 수량 최댓값 1건. 전역 quest 태그 삭제는 하지 않는다. */
export function collectMissionCargoRemovals(
  mission: Pick<Mission, 'objectives'>,
): MissionCargoRemoval[] {
  const byGood = new Map<string, number>();
  const objs = mission.objectives;
  for (let i = 0; i < objs.length; i += 1) {
    const obj = objs[i]!;
    if (!isCargoObjective(obj.type)) continue;
    const goodId = obj.targetId?.trim();
    if (!goodId) continue;
    const qty =
      typeof obj.quantity === 'number' && obj.quantity > 0
        ? Math.floor(obj.quantity)
        : 1;
    const prev = byGood.get(goodId) ?? 0;
    if (qty > prev) byGood.set(goodId, qty);
  }
  const out: MissionCargoRemoval[] = [];
  byGood.forEach((quantity, goodId) => {
    out.push({ goodId, quantity });
  });
  return out;
}

function pickFallbackActiveMissionId(
  progresses: Record<string, MissionProgress>,
  excludeIds: ReadonlySet<string>,
): string | null {
  let questId: string | null = null;
  const rows = Object.values(progresses);
  for (let i = 0; i < rows.length; i += 1) {
    const progress = rows[i]!;
    if (excludeIds.has(progress.missionId) || progress.status !== 'active') continue;
    if (isMainStoryMissionId(progress.missionId) || isTutorialMissionId(progress.missionId)) {
      return progress.missionId;
    }
    if (
      isQuestMissionId(progress.missionId)
      || isArcCoreAutoInstanceMissionId(progress.missionId)
      || isCaptainPersonalMissionId(progress.missionId)
    ) {
      questId = progress.missionId;
    }
  }
  return questId;
}

export function computeExpiredMissionSweep(input: {
  progresses: Record<string, MissionProgress>;
  activeMissionId: string | null;
  nowMs: number;
  resolveMission: (missionId: string) => Mission | undefined;
}): ExpiredMissionSweepCompute {
  const expiredIds: string[] = [];
  const cargoRemovals: MissionCargoRemoval[] = [];
  const restoreListedInstanceIds: string[] = [];
  const rows = Object.values(input.progresses);
  for (let i = 0; i < rows.length; i += 1) {
    const progress = rows[i]!;
    if (progress.status !== 'active') continue;
    const expiresAtMs = progress.expiresAtMs;
    if (typeof expiresAtMs !== 'number' || !Number.isFinite(expiresAtMs)) continue;
    if (input.nowMs < expiresAtMs) continue;
    expiredIds.push(progress.missionId);
    const mission = input.resolveMission(progress.missionId);
    if (mission) {
      const cargo = collectMissionCargoRemovals(mission);
      for (let c = 0; c < cargo.length; c += 1) cargoRemovals.push(cargo[c]!);
    }
    if (isArcCoreAutoInstanceMissionId(progress.missionId)) {
      restoreListedInstanceIds.push(progress.missionId);
    }
  }

  if (expiredIds.length === 0) {
    return {
      expiredIds,
      nextProgresses: input.progresses,
      nextActiveMissionId: input.activeMissionId,
      cargoRemovals,
      restoreListedInstanceIds,
    };
  }

  const expiredSet = new Set(expiredIds);
  const nextProgresses: Record<string, MissionProgress> = {};
  const keys = Object.keys(input.progresses);
  for (let i = 0; i < keys.length; i += 1) {
    const id = keys[i]!;
    if (expiredSet.has(id)) continue;
    nextProgresses[id] = input.progresses[id]!;
  }

  let nextActive = input.activeMissionId;
  if (nextActive && expiredSet.has(nextActive)) {
    nextActive = pickFallbackActiveMissionId(nextProgresses, expiredSet);
  }

  return {
    expiredIds,
    nextProgresses,
    nextActiveMissionId: nextActive,
    cargoRemovals,
    restoreListedInstanceIds,
  };
}
