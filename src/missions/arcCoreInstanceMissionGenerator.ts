import type { Mission, NpcCaptain } from '../types';
import { resolveBarHostCaptainAtPlanet } from '../arcCore/captainPresence';
import { formatArcCoreOpsDayKey, resolveArcCoreDailyOpsPolicy } from '../arcCore/schedule/arcCoreDailyOpsPolicy';
import { listBarEnabledCoreOpenPlanetIds } from './listBarEnabledCoreOpenPlanetIds';
import { listBarInstanceTemplateMissions } from './missionTrack';
import { deriveMissionPlayCategory } from './missionCategory';
import type {
  ArcCoreInstanceMissionBoardEntry,
  ArcCoreInstanceMissionBoardState,
  ArcCoreInstanceMissionCategoryTag,
} from './arcCoreInstanceMissionTypes';
import {
  allocateUniqueArcCoreInstanceId,
  buildArcCoreInstanceId,
  dedupeArcCoreInstanceBoardEntries,
} from './arcCoreInstanceMissionIds';
import {
  type BarInstanceBoardBucket,
  resolveBarInstanceBoardBucket,
  resolveBarInstanceHarderTemplateCutRatio,
  shouldBiasHarderBarInstanceTemplates,
} from './barInstanceBoardPolicy';
import { resolveBarInstanceBoardLayout } from './barInstanceDomeLevel';
import { collectArcCoreInstanceProgressIds } from './arcCoreInstanceProgressCleanup';

function peekArcInstProgressIds(): readonly string[] {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useMissionStore } = require('../store/missionStore') as typeof import('../store/missionStore');
    return collectArcCoreInstanceProgressIds(useMissionStore.getState().progresses);
  } catch {
    return [];
  }
}

export {
  allocateUniqueArcCoreInstanceId,
  buildArcCoreInstanceId,
  dedupeArcCoreInstanceBoardEntries,
} from './arcCoreInstanceMissionIds';

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

function countListedByBucket(
  entries: readonly ArcCoreInstanceMissionBoardEntry[],
  planetId: string,
): Record<BarInstanceBoardBucket, number> {
  const counts: Record<BarInstanceBoardBucket, number> = {
    delivery: 0,
    combat: 0,
    bounty: 0,
    other: 0,
  };
  for (const entry of entries) {
    if (entry.offerPlanetId !== planetId) continue;
    if (entry.boardStatus !== 'listed') continue;
    const bucket = resolveBarInstanceBoardBucket(entry.categoryTag);
    counts[bucket] += 1;
  }
  return counts;
}

function listTemplatesForBucket(bucket: BarInstanceBoardBucket): Mission[] {
  const pool: Mission[] = [];
  for (const mission of listBarInstanceTemplateMissions()) {
    const tag = resolveCategoryTag(mission);
    if (resolveBarInstanceBoardBucket(tag) !== bucket) continue;
    pool.push(mission);
  }
  return pool;
}

function pickTemplateForBucket(
  bucket: BarInstanceBoardBucket,
  blockedTemplateIds: ReadonlySet<string>,
  planetId: string,
  dayKeyKst: string,
  salt: number,
  domeLevel: number,
): Mission | null {
  let pool = listTemplatesForBucket(bucket).filter((m) => !blockedTemplateIds.has(m.id));
  if (pool.length === 0) return null;
  if (shouldBiasHarderBarInstanceTemplates(domeLevel, bucket) && pool.length > 1) {
    pool = pool.slice().sort((a, b) => {
      const sa = (a.dc ?? 0) + (a.levelRequired ?? 1);
      const sb = (b.dc ?? 0) + (b.levelRequired ?? 1);
      if (sb !== sa) return sb - sa;
      return a.id.localeCompare(b.id);
    });
    const cut = Math.max(1, Math.ceil(pool.length * resolveBarInstanceHarderTemplateCutRatio(domeLevel)));
    pool = pool.slice(0, cut);
  }
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

/**
 * hostCaptain 생략 시 resolveBarHostCaptainAtPlanet(offerPlanetId)로 직접 조회한다.
 * 단, 이 조회는 캐시 키 계산에 `readUnlockedPlanetIdsSig()`(전체 개방 행성 O(N) join)가
 * 포함돼 있어 행성당 여러 건(최대 10건) 반복 호출 시 비용이 커진다 — 벌크 경로
 * (`computeReplenishedPlanetEntries`)는 행성당 1회만 조회해 hostCaptain으로 넘겨준다
 * (task_id=daily-ops-batch-incomplete-fix-20260803 후속 — tailGroup 실측 ~17.4s의
 * 핵심 원인, buildEntry당 매번 재조회 시 757행성 × 최대16건 = 최대 ~1.2만회 호출).
 */
export function buildArcCoreInstanceMissionEntry(
  template: Mission,
  offerPlanetId: string,
  dayKeyKst: string,
  nowMs: number,
  seq: number,
  hostCaptain: NpcCaptain | undefined = resolveBarHostCaptainAtPlanet(offerPlanetId),
  instanceId?: string,
): ArcCoreInstanceMissionBoardEntry {
  return {
    instanceId: instanceId ?? buildArcCoreInstanceId(offerPlanetId, seq),
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

export type EnsurePlanetBarBoardResult = {
  next: ArcCoreInstanceMissionBoardState;
  added: number;
  planetId: string;
};

/**
 * 특정 행성 소유 entries(어떤 status든)만 입력받아 돔 레벨 슬롯·버킷으로 보충한다.
 * 전체 보드 entries 배열 스캔은 호출부(단일 행성 vs 일괄 배치)에서 각자 책임진다 —
 * 일괄 배치에서 행성마다 전체 entries를 filter하면 O(P × N) = O(N²)로 폭주한다
 * (일일 배치 tailGroup 실측 ~17.5s의 핵심 원인, task_id=daily-ops-batch-incomplete-fix-20260803 후속).
 */
function computeReplenishedPlanetEntries(
  planetEntries: readonly ArcCoreInstanceMissionBoardEntry[],
  planetId: string,
  dayKey: string,
  nowMs: number,
): { nextEntries: ArcCoreInstanceMissionBoardEntry[]; added: number } {
  const uniquePlanetEntries = dedupeArcCoreInstanceBoardEntries(planetEntries);
  const keptOther = uniquePlanetEntries.filter((e) => e.boardStatus !== 'listed');
  const listedForPlanet = uniquePlanetEntries.filter((e) => e.boardStatus === 'listed');

  const usedInstanceIds = new Set<string>();
  for (const entry of uniquePlanetEntries) usedInstanceIds.add(entry.instanceId);
  const extraProgressIds = peekArcInstProgressIds();
  for (const id of extraProgressIds) usedInstanceIds.add(id);

  const blockedTemplates = new Set<string>();
  for (const entry of uniquePlanetEntries) {
    if (entry.boardStatus === 'cleared') continue;
    blockedTemplates.add(entry.templateMissionId);
  }

  const layout = resolveBarInstanceBoardLayout(planetId);
  const maxListed = layout.maxListed;
  const categorySlots = layout.slots;
  const bucketCounts = countListedByBucket(listedForPlanet, planetId);
  const nextListed: ArcCoreInstanceMissionBoardEntry[] = [...listedForPlanet];
  let added = 0;
  let salt = 0;
  // 행성당 1회만 조회 — buildArcCoreInstanceMissionEntry 내부 기본값에 맡기면
  // 신규 entry(최대 16건)마다 재조회돼 비용이 불어난다(위 주석 참고).
  const hostCaptain = resolveBarHostCaptainAtPlanet(planetId);

  const pushUniqueListed = (template: Mission): void => {
    const instanceId = allocateUniqueArcCoreInstanceId(planetId, usedInstanceIds);
    usedInstanceIds.add(instanceId);
    blockedTemplates.add(template.id);
    nextListed.push(
      buildArcCoreInstanceMissionEntry(
        template,
        planetId,
        dayKey,
        nowMs,
        nextListed.length,
        hostCaptain,
        instanceId,
      ),
    );
    added += 1;
  };

  const buckets = Object.keys(categorySlots) as BarInstanceBoardBucket[];
  for (const bucket of buckets) {
    const target = categorySlots[bucket];
    let need = target - (bucketCounts[bucket] ?? 0);
    while (need > 0 && nextListed.length < maxListed) {
      const template = pickTemplateForBucket(
        bucket,
        blockedTemplates,
        planetId,
        dayKey,
        salt,
        layout.level,
      );
      salt += 1;
      if (!template) break;
      pushUniqueListed(template);
      bucketCounts[bucket] = (bucketCounts[bucket] ?? 0) + 1;
      need -= 1;
    }
  }

  while (nextListed.length < maxListed) {
    let filled = false;
    for (const bucket of buckets) {
      if (nextListed.length >= maxListed) break;
      const target = categorySlots[bucket];
      if ((bucketCounts[bucket] ?? 0) >= target) continue;
      const template = pickTemplateForBucket(
        bucket,
        blockedTemplates,
        planetId,
        dayKey,
        salt,
        layout.level,
      );
      salt += 1;
      if (!template) continue;
      pushUniqueListed(template);
      bucketCounts[bucket] = (bucketCounts[bucket] ?? 0) + 1;
      filled = true;
    }
    if (!filled) break;
  }

  if (nextListed.length > maxListed) {
    nextListed.sort((a, b) => a.registeredAtMs - b.registeredAtMs);
    nextListed.length = maxListed;
  }

  return { nextEntries: [...keptOther, ...nextListed], added };
}

/** 행성 바 [신규 의뢰] — 돔 레벨 슬롯 보충(단일 행성 — UI 진입 경로). */
export function ensurePlanetBarInstanceBoard(
  state: ArcCoreInstanceMissionBoardState,
  planetId: string,
  nowMs: number,
): EnsurePlanetBarBoardResult {
  const pid = planetId.trim();
  if (!pid) return { next: state, added: 0, planetId: pid };

  const dayKey = resolveArcCoreInstanceDayKeyKst(nowMs);
  const planetEntries = state.entries.filter((e) => e.offerPlanetId === pid);
  const otherEntries = state.entries.filter((e) => e.offerPlanetId !== pid);
  const { nextEntries: nextPlanetEntries, added } = computeReplenishedPlanetEntries(
    planetEntries,
    pid,
    dayKey,
    nowMs,
  );

  return {
    next: {
      ...state,
      entries: [...otherEntries, ...nextPlanetEntries],
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

/**
 * ArcCore 일일 배치 — 바 활성 코어 행성 전체 보드 보충.
 * `entries`를 행성별로 1회만 그룹핑(O(N))한 뒤 각 행성은 자기 그룹만 처리 —
 * 예전엔 `ensurePlanetBarInstanceBoard`를 행성마다 호출하며 매번 전체 entries를
 * filter/rebuild(O(N))해 P행성 × O(N) = O(N²)로 폭주했다(실측 tailGroup ~17.5s).
 */
export function runArcCoreBarInstanceBoardReplenishPass(
  state: ArcCoreInstanceMissionBoardState,
  nowMs: number,
): { next: ArcCoreInstanceMissionBoardState; added: number; lastInstanceId: string | null } {
  const dayKey = resolveArcCoreInstanceDayKeyKst(nowMs);
  const byPlanet = new Map<string, ArcCoreInstanceMissionBoardEntry[]>();
  for (const entry of state.entries) {
    const bucket = byPlanet.get(entry.offerPlanetId);
    if (bucket) bucket.push(entry);
    else byPlanet.set(entry.offerPlanetId, [entry]);
  }

  let added = 0;
  let lastInstanceId: string | null = null;
  let lastRegisteredAtMs = -Infinity;

  for (const planetId of listBarEnabledCoreOpenPlanetIds()) {
    const planetEntries = byPlanet.get(planetId) ?? [];
    const result = computeReplenishedPlanetEntries(planetEntries, planetId, dayKey, nowMs);
    byPlanet.set(planetId, result.nextEntries);
    if (result.added > 0) {
      added += result.added;
      for (const entry of result.nextEntries) {
        if (entry.boardStatus !== 'listed') continue;
        if (entry.registeredAtMs > lastRegisteredAtMs) {
          lastRegisteredAtMs = entry.registeredAtMs;
          lastInstanceId = entry.instanceId;
        }
      }
    }
  }

  const nextEntries: ArcCoreInstanceMissionBoardEntry[] = [];
  for (const list of byPlanet.values()) nextEntries.push(...list);

  return {
    next: { ...state, entries: nextEntries, lastRegistrationDayKeyKst: dayKey },
    added,
    lastInstanceId,
  };
}
