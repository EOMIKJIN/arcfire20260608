import type { Mission } from '../types';
import { resolveTavernHostCaptainAtPlanet } from '../arcCore/captainPresence';
import { formatArcCoreOpsDayKey, resolveArcCoreDailyOpsPolicy } from '../arcCore/schedule/arcCoreDailyOpsPolicy';
import { listTavernEnabledCoreOpenPlanetIds } from './listTavernEnabledCoreOpenPlanetIds';
import { listTavernInstanceTemplateMissions } from './missionTrack';
import { deriveMissionPlayCategory } from './missionCategory';
import type {
  ArcCoreInstanceMissionBoardEntry,
  ArcCoreInstanceMissionBoardState,
  ArcCoreInstanceMissionCategoryTag,
} from './arcCoreInstanceMissionTypes';
import { ARC_CORE_INSTANCE_MISSION_ID_PREFIX } from './arcCoreInstanceMissionTypes';
import {
  TAVERN_INSTANCE_CATEGORY_SLOTS,
  TAVERN_INSTANCE_MAX_LISTED_PER_PLANET,
  type TavernInstanceBoardBucket,
  resolveTavernInstanceBoardBucket,
} from './tavernInstanceBoardPolicy';

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

function hashSeed(parts: readonly string[]): number {
  let h = 0;
  for (const part of parts) {
    for (let i = 0; i < part.length; i += 1) {
      h = (h * 31 + part.charCodeAt(i)) | 0;
    }
  }
  return Math.abs(h);
}

function sanitizePlanetToken(planetId: string): string {
  return planetId.replace(/[^a-z0-9_]/gi, '').toLowerCase().slice(0, 24);
}

function buildInstanceId(planetId: string, seq: number): string {
  const token = sanitizePlanetToken(planetId);
  const seqText = String(seq + 1).padStart(2, '0');
  return `${ARC_CORE_INSTANCE_MISSION_ID_PREFIX}${token}_${seqText}`;
}

function countListedByBucket(
  entries: readonly ArcCoreInstanceMissionBoardEntry[],
  planetId: string,
): Record<TavernInstanceBoardBucket, number> {
  const counts: Record<TavernInstanceBoardBucket, number> = {
    delivery: 0,
    combat: 0,
    bounty: 0,
    other: 0,
  };
  for (const entry of entries) {
    if (entry.offerPlanetId !== planetId) continue;
    if (entry.boardStatus !== 'listed') continue;
    const bucket = resolveTavernInstanceBoardBucket(entry.categoryTag);
    counts[bucket] += 1;
  }
  return counts;
}

function listTemplatesForBucket(bucket: TavernInstanceBoardBucket): Mission[] {
  const pool: Mission[] = [];
  for (const mission of listTavernInstanceTemplateMissions()) {
    const tag = resolveCategoryTag(mission);
    if (resolveTavernInstanceBoardBucket(tag) !== bucket) continue;
    pool.push(mission);
  }
  return pool;
}

function pickTemplateForBucket(
  bucket: TavernInstanceBoardBucket,
  blockedTemplateIds: ReadonlySet<string>,
  planetId: string,
  dayKeyKst: string,
  salt: number,
): Mission | null {
  const pool = listTemplatesForBucket(bucket).filter((m) => !blockedTemplateIds.has(m.id));
  if (pool.length === 0) return null;
  const seed = hashSeed([planetId, dayKeyKst, bucket, String(salt), String(pool.length)]);
  return pool[seed % pool.length] ?? null;
}

export function shouldRefreshArcCoreInstanceMissionBoard(
  state: ArcCoreInstanceMissionBoardState,
  nowMs: number,
): boolean {
  const listed = countListedArcCoreInstanceMissions(state.entries);
  if (listed < 7) return false;
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

export function buildArcCoreInstanceMissionEntry(
  template: Mission,
  offerPlanetId: string,
  dayKeyKst: string,
  nowMs: number,
  seq: number,
): ArcCoreInstanceMissionBoardEntry {
  const hostCaptain = resolveTavernHostCaptainAtPlanet(offerPlanetId);
  return {
    instanceId: buildInstanceId(offerPlanetId, seq),
    templateMissionId: template.id,
    categoryTag: resolveCategoryTag(template),
    offerPlanetId,
    offerCaptainId: hostCaptain?.id ?? template.offerCaptainId ?? null,
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
  planetId?: string,
): number {
  let count = 0;
  for (const entry of entries) {
    if (entry.boardStatus !== 'listed') continue;
    if (planetId && entry.offerPlanetId !== planetId) continue;
    count += 1;
  }
  return count;
}

export type EnsurePlanetTavernBoardResult = {
  next: ArcCoreInstanceMissionBoardState;
  added: number;
  planetId: string;
};

/** 행성 선술집 [신규 의뢰] — listed 10건·40/40/20 비율 보충. */
export function ensurePlanetTavernInstanceBoard(
  state: ArcCoreInstanceMissionBoardState,
  planetId: string,
  nowMs: number,
): EnsurePlanetTavernBoardResult {
  const pid = planetId.trim();
  if (!pid) return { next: state, added: 0, planetId: pid };

  const dayKey = resolveArcCoreInstanceDayKeyKst(nowMs);
  const keptOther = state.entries.filter((e) => e.offerPlanetId !== pid || e.boardStatus !== 'listed');
  const listedForPlanet = state.entries.filter(
    (e) => e.offerPlanetId === pid && e.boardStatus === 'listed',
  );

  const blockedTemplates = new Set<string>();
  for (const entry of state.entries) {
    if (entry.offerPlanetId !== pid) continue;
    if (entry.boardStatus === 'cleared') continue;
    blockedTemplates.add(entry.templateMissionId);
  }

  const bucketCounts = countListedByBucket(listedForPlanet, pid);
  const nextListed: ArcCoreInstanceMissionBoardEntry[] = [...listedForPlanet];
  let added = 0;
  let salt = 0;

  const buckets = Object.keys(TAVERN_INSTANCE_CATEGORY_SLOTS) as TavernInstanceBoardBucket[];
  for (const bucket of buckets) {
    const target = TAVERN_INSTANCE_CATEGORY_SLOTS[bucket];
    let need = target - (bucketCounts[bucket] ?? 0);
    while (need > 0 && nextListed.length < TAVERN_INSTANCE_MAX_LISTED_PER_PLANET) {
      const template = pickTemplateForBucket(bucket, blockedTemplates, pid, dayKey, salt);
      salt += 1;
      if (!template) break;
      blockedTemplates.add(template.id);
      const entry = buildArcCoreInstanceMissionEntry(template, pid, dayKey, nowMs, nextListed.length);
      nextListed.push(entry);
      bucketCounts[bucket] = (bucketCounts[bucket] ?? 0) + 1;
      added += 1;
      need -= 1;
    }
  }

  while (nextListed.length < TAVERN_INSTANCE_MAX_LISTED_PER_PLANET) {
    let filled = false;
    for (const bucket of buckets) {
      if (nextListed.length >= TAVERN_INSTANCE_MAX_LISTED_PER_PLANET) break;
      const target = TAVERN_INSTANCE_CATEGORY_SLOTS[bucket];
      if ((bucketCounts[bucket] ?? 0) >= target) continue;
      const template = pickTemplateForBucket(bucket, blockedTemplates, pid, dayKey, salt);
      salt += 1;
      if (!template) continue;
      blockedTemplates.add(template.id);
      const entry = buildArcCoreInstanceMissionEntry(template, pid, dayKey, nowMs, nextListed.length);
      nextListed.push(entry);
      bucketCounts[bucket] = (bucketCounts[bucket] ?? 0) + 1;
      added += 1;
      filled = true;
    }
    if (!filled) break;
  }

  if (nextListed.length > TAVERN_INSTANCE_MAX_LISTED_PER_PLANET) {
    nextListed.sort((a, b) => a.registeredAtMs - b.registeredAtMs);
    nextListed.length = TAVERN_INSTANCE_MAX_LISTED_PER_PLANET;
  }

  const nextEntries = [...keptOther, ...nextListed];
  return {
    next: {
      ...state,
      entries: nextEntries,
      lastRegistrationDayKeyKst: dayKey,
    },
    added,
    planetId: pid,
  };
}

export function listPlanetIdsWithBoardEntries(
  entries: readonly ArcCoreInstanceMissionBoardEntry[],
): string[] {
  const ids = new Set<string>();
  for (const entry of entries) {
    if (entry.boardStatus === 'cleared') continue;
    ids.add(entry.offerPlanetId);
  }
  return [...ids];
}

/** ArcCore 일일 배치 — 선술집 활성 코어 행성 전체 보드 보충. */
export function runArcCoreTavernInstanceBoardReplenishPass(
  state: ArcCoreInstanceMissionBoardState,
  nowMs: number,
): { next: ArcCoreInstanceMissionBoardState; added: number; lastInstanceId: string | null } {
  let next = state;
  let added = 0;
  let lastInstanceId: string | null = null;

  for (const planetId of listTavernEnabledCoreOpenPlanetIds()) {
    const result = ensurePlanetTavernInstanceBoard(next, planetId, nowMs);
    next = result.next;
    added += result.added;
    if (result.added > 0) {
      for (const entry of next.entries) {
        if (entry.offerPlanetId !== planetId || entry.boardStatus !== 'listed') continue;
        if (
          !lastInstanceId
          || entry.registeredAtMs
            > (next.entries.find((e) => e.instanceId === lastInstanceId)?.registeredAtMs ?? 0)
        ) {
          lastInstanceId = entry.instanceId;
        }
      }
    }
  }

  return { next, added, lastInstanceId };
}
