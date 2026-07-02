import type { Mission } from '../types';
import { formatArcCoreOpsDayKey, resolveArcCoreDailyOpsPolicy } from '../arcCore/schedule/arcCoreDailyOpsPolicy';
import { listQuestMissions } from './missionCatalog';
import { deriveMissionPlayCategory } from './missionCategory';
import type {
  ArcCoreInstanceMissionBoardEntry,
  ArcCoreInstanceMissionBoardState,
  ArcCoreInstanceMissionCategoryTag,
} from './arcCoreInstanceMissionTypes';
import {
  ARC_CORE_INSTANCE_BOARD_MAX,
  ARC_CORE_INSTANCE_MISSION_ID_PREFIX,
} from './arcCoreInstanceMissionTypes';

const WEEK_MS = 7 * 24 * 3600 * 1000;

function resolveCategoryTag(mission: Mission): ArcCoreInstanceMissionCategoryTag {
  const play = deriveMissionPlayCategory(mission);
  if (play === 'combat') {
    const bounty = mission.objectives.some(
      (o) => o.type === 'defeat_enemy' && o.targetId === 'bounty_hunter',
    );
    return bounty ? 'bounty' : 'combat';
  }
  if (play === 'delivery') return 'delivery';
  if (play === 'travel') return 'travel';
  if (mission.type === 'trade') return 'trade';
  if (mission.type === 'explore') return 'explore';
  return 'mixed';
}

function hashDaySeed(dayKey: string, cycleStartedAtMs: number, salt: number): number {
  let h = cycleStartedAtMs ^ salt;
  for (let i = 0; i < dayKey.length; i += 1) {
    h = (h * 31 + dayKey.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function buildInstanceId(dayKeyKst: string, listedCount: number): string {
  const compact = dayKeyKst.replace(/-/g, '');
  const seq = String(listedCount + 1).padStart(2, '0');
  return `${ARC_CORE_INSTANCE_MISSION_ID_PREFIX}${compact}_${seq}`;
}

function listEligibleTemplates(
  entries: readonly ArcCoreInstanceMissionBoardEntry[],
): Mission[] {
  const blockedTemplateIds = new Set<string>();
  for (const entry of entries) {
    if (entry.boardStatus === 'cleared') continue;
    blockedTemplateIds.add(entry.templateMissionId);
  }
  const pool: Mission[] = [];
  for (const mission of listQuestMissions()) {
    if (!mission.offerPlanetId) continue;
    if (blockedTemplateIds.has(mission.id)) continue;
    pool.push(mission);
  }
  pool.sort((a, b) => a.id.localeCompare(b.id));
  return pool;
}

export function shouldRefreshArcCoreInstanceMissionBoard(
  state: ArcCoreInstanceMissionBoardState,
  nowMs: number,
): boolean {
  const listed = state.entries.filter((e) => e.boardStatus === 'listed').length;
  if (listed < ARC_CORE_INSTANCE_BOARD_MAX) return false;
  return nowMs - state.cycleStartedAtMs >= WEEK_MS;
}

export function refreshArcCoreInstanceMissionBoardState(
  state: ArcCoreInstanceMissionBoardState,
  nowMs: number,
): ArcCoreInstanceMissionBoardState {
  const kept = state.entries.filter((e) => e.boardStatus === 'accepted');
  return {
    entries: kept,
    lastRegistrationDayKeyKst: null,
    cycleStartedAtMs: nowMs,
  };
}

export function pickArcCoreInstanceMissionTemplate(
  state: ArcCoreInstanceMissionBoardState,
  dayKeyKst: string,
): Mission | null {
  const pool = listEligibleTemplates(state.entries);
  if (pool.length === 0) return null;
  const seed = hashDaySeed(dayKeyKst, state.cycleStartedAtMs, pool.length);
  return pool[seed % pool.length] ?? null;
}

export function buildArcCoreInstanceMissionEntry(
  template: Mission,
  dayKeyKst: string,
  nowMs: number,
  listedCount: number,
): ArcCoreInstanceMissionBoardEntry {
  return {
    instanceId: buildInstanceId(dayKeyKst, listedCount),
    templateMissionId: template.id,
    categoryTag: resolveCategoryTag(template),
    offerPlanetId: template.offerPlanetId!,
    offerCaptainId: template.offerCaptainId ?? null,
    registeredAtMs: nowMs,
    dayKeyKst,
    boardStatus: 'listed',
    briefingDialogSceneId: null,
  };
}

export function createEmptyArcCoreInstanceMissionBoard(nowMs = Date.now()): ArcCoreInstanceMissionBoardState {
  return {
    entries: [],
    lastRegistrationDayKeyKst: null,
    cycleStartedAtMs: nowMs,
  };
}

export function resolveArcCoreInstanceDayKeyKst(nowMs: number): string {
  const policy = resolveArcCoreDailyOpsPolicy();
  return formatArcCoreOpsDayKey(nowMs, policy.timeZone);
}

export function countListedArcCoreInstanceMissions(
  entries: readonly ArcCoreInstanceMissionBoardEntry[],
): number {
  let count = 0;
  for (const entry of entries) {
    if (entry.boardStatus === 'listed') count += 1;
  }
  return count;
}
