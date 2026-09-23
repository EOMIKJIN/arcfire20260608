// ============================================================
// 아크코어 — CSV 함장 궤도 주둔 행성 단일 배정 (전역 중복 방지)
// - `arcOrbitPresenceFill` 수송선·`npc_cpt_arc_seed_*`: AiNpcSubCore 궤도 교통만 (본 모듈 제외)
// - `questOnly` 본편 퀘스트 전용 함장: 궤도·주둔 배정 제외 (행은 추후 등록)
// - 그 외 비전투 함장: CSV 후보 ∩ 팩션 ∩ 개방 행성에서 다요인 판단(중력·역할·혼잡·운용)
// - tick·persist 없음 — 3h epoch + KST day 버킷에서만 재판단
// ============================================================

import type { NpcCaptain } from '../../types';
import { resolvePlanetById } from '../../world/resolvePlanetById';
import {
  listCoreOpenGameplayPlanetIds,
  resolveCoreOpenStarSystem,
} from '../../world/coreOpenGameplayPlanets';
import { npcDeterministicHash32 } from '../../npc/npcDeterministicHash';
import { invalidatePlanetMemoCacheNamespace } from '../../game/planetMemoCache';
import { invalidateCaptainPresenceWorldIndexCache } from '../captainPresence/captainPresenceWorldIndexCache';
import {
  listUnlockedPlanetIdsForOrbitPresence,
  readUnlockedPlanetIdsSig,
} from './orbitPresenceUnlockedPlanets';
import { isArcSeedTransportCaptainId } from '../arcSeedTransportRegistry';
import { peekDwellOccupancyTotals, type DwellRoleCounts } from '../dwell/planetDwellCivicAcc';
import { getDwellJudgmentDayBucket, judgeTableDwellPlanet } from '../dwell/planetDwellJudgment';
import { resolveCaptainDwellRole } from '../dwell/planetDwellRoleCatalog';
import { getOrBuildDwellSignalIndex, invalidateDwellSignalIndex } from '../dwell/planetDwellSignals';
import type { DwellRoleId } from '../dwell/planetDwellTypes';

/** nearbyOrbitPresenceSystem locale 분리 memo — 순환 import 금지로 문자열 상수만 공유(`.v3` 동기) */
const NEARBY_PRESENCE_MEMO_NAMESPACE_KO =
  'nearbyOrbitPresenceSystem.resolvePlanetNearbyPresence.ko.v3';
const NEARBY_PRESENCE_MEMO_NAMESPACE_EN =
  'nearbyOrbitPresenceSystem.resolvePlanetNearbyPresence.en.v3';

function invalidateNearbyPresenceMemos(): void {
  invalidatePlanetMemoCacheNamespace(NEARBY_PRESENCE_MEMO_NAMESPACE_KO);
  invalidatePlanetMemoCacheNamespace(NEARBY_PRESENCE_MEMO_NAMESPACE_EN);
}

/** synth·성계 개방 직후 — 3h 배정·근접 궤도 memo 즉시 갱신 */
export function invalidateOrbitPresenceCachesOnWorldExpansion(): void {
  planetFactionById = null;
  invalidateDwellSignalIndex();
  invalidateNearbyPresenceMemos();
  invalidateCaptainPresenceWorldIndexCache();
}

/**
 * AiNpc arc 구조 publish 직후 — nearby memo만 타깃 무효화.
 * (presence 인덱스 키에 arcTrafficSig가 있어 캐시는 자연 miss; nearby는 planet|system만 키라 필수)
 */
export function invalidateNearbyPresenceMemosOnArcTrafficPublish(): void {
  invalidateNearbyPresenceMemos();
}

export { readUnlockedPlanetIdsSig };

/** 테이블 주둔 전함 행성 재배치 주기 (wall-clock, ms) — 3시간 */
export const CAPTAIN_ORBIT_ASSIGNMENT_ROTATION_MS = 3 * 60 * 60 * 1000;

let planetFactionById: Map<string, string | null> | null = null;
let lastMemoEpochBucket = -1;
let lastMemoDayBucket = -1;

function getPlanetFactionByIdIndex(): Map<string, string | null> {
  if (!planetFactionById) {
    planetFactionById = new Map<string, string | null>();
    for (const pid of listCoreOpenGameplayPlanetIds()) {
      planetFactionById.set(pid, resolvePlanetById(pid)?.factionId ?? null);
    }
  }
  return planetFactionById;
}

/** wall-clock 3h 버킷 — ArcCore tick·AsyncStorage 불필요 */
export function getCaptainOrbitAssignmentEpochBucket(nowMs = Date.now()): number {
  return Math.floor(nowMs / CAPTAIN_ORBIT_ASSIGNMENT_ROTATION_MS);
}

/**
 * 후보 규칙 리비전 — 로컬 CSV/성계 우선(전역 unlocked 폴백) 변경 시 올린다.
 * epoch가 같아도 memo·presence 인덱스를 1회 무효화해 핫 리로드·구캐시 잔존을 막는다.
 */
const CAPTAIN_ORBIT_CANDIDATE_RULE_REV = 4;
let lastAppliedCandidateRuleRev = -1;

/**
 * epoch·KST day·후보 규칙이 바뀌면 행성 체류 전함 memo만 무효화.
 * `resolvePlanetNearbyPresence` 호출 직전 1회면 충분.
 */
export function syncCaptainOrbitAssignmentEpochMemo(nowMs = Date.now()): number {
  const bucket = getCaptainOrbitAssignmentEpochBucket(nowMs);
  const dayBucket = getDwellJudgmentDayBucket(nowMs);
  const ruleChanged = lastAppliedCandidateRuleRev !== CAPTAIN_ORBIT_CANDIDATE_RULE_REV;
  if (ruleChanged) {
    lastAppliedCandidateRuleRev = CAPTAIN_ORBIT_CANDIDATE_RULE_REV;
  }
  if (bucket !== lastMemoEpochBucket || dayBucket !== lastMemoDayBucket || ruleChanged) {
    lastMemoEpochBucket = bucket;
    lastMemoDayBucket = dayBucket;
    invalidateDwellSignalIndex();
    invalidateNearbyPresenceMemos();
    invalidateCaptainPresenceWorldIndexCache();
  }
  return bucket;
}

/**
 * Set 기반 dedup — 예전엔 `out.includes(pid)`(배열 선형 탐색)로 중복 체크해
 * 개방 행성(최대 757) 전체를 넣는 마지막 루프에서 O(P²)로 폭주했다. 끝에서
 * `.sort()`하므로 결과 집합·순서는 동일 — dedup 메커니즘만 O(1) 조회로 교체.
 * (일일 배치 tailGroup `getCaptainPresenceWorldIndex` 최초 빌드 1회가 ~9초를
 * 잡아먹던 근본 원인, task_id=daily-ops-batch-incomplete-fix-20260803 후속).
 */
/**
 * unlockedPlanetIds 생략 시 매 호출마다 listUnlockedPlanetIdsForOrbitPresence()를
 * 직접 조회한다 — 이 조회 자체가 가벼운 연산이 아니라(전 시스템 순회), 함장마다
 * 반복 호출하는 벌크 경로(`getCaptainPresenceWorldIndex`)는 1회만 계산해 넘겨준다
 * (인덱스 1회 빌드에 ~8초가 걸리던 근본 원인 — Set dedup 자체보다 이 반복 호출이
 * 지배적이었다. task_id=daily-ops-batch-incomplete-fix-20260803 후속).
 */
export function listCaptainTableOrbitPlanetCandidates(
  captain: NpcCaptain,
  unlockedPlanetIds: readonly string[] = listUnlockedPlanetIdsForOrbitPresence(),
): string[] {
  const seen = new Set<string>();
  const add = (planetId: string | null | undefined) => {
    const pid = String(planetId ?? '').trim();
    if (!pid) return;
    seen.add(pid);
  };

  add(captain.basePlanetId);
  for (const pid of captain.activityPlanetIds) add(pid);

  const systemIds = new Set<string>();
  if (captain.baseSystemId) systemIds.add(captain.baseSystemId);
  for (const sid of captain.activitySystemIds) {
    if (sid) systemIds.add(sid);
  }
  for (const sid of systemIds) {
    const sys = resolveCoreOpenStarSystem(sid);
    if (!sys) continue;
    for (const planet of sys.planets) add(planet.id);
  }

  // CSV·성계 로컬 후보가 있을 때는 개방 전역 풀을 넣지 않는다.
  // 전역 풀 강제 시 홈 행성 주둔이 희석되어 허브가 빈 화면처럼 보임(2026-08-10 재조사).
  // 로컬 후보가 전무할 때만 개방 행성으로 폴백(순환 체류).
  if (seen.size === 0) {
    for (const pid of unlockedPlanetIds) add(pid);
  }

  return [...seen].sort();
}

function isPlanetAlignedWithCaptainFaction(captain: NpcCaptain, planetId: string): boolean {
  const captainFaction = String(captain.factionId ?? '').trim();
  if (!captainFaction) return true;
  const planetFaction = getPlanetFactionByIdIndex().get(planetId);
  if (!planetFaction) return true;
  if (planetFaction === captainFaction) return true;
  return captain.friendlyFactionIds.includes(planetFaction);
}

/** CSV 후보 중 함장·우호 팩션 행성만 우선 — 없으면 CSV 후보 전체 */
function resolveFactionCenteredCandidates(captain: NpcCaptain, candidates: readonly string[]): string[] {
  const aligned = candidates.filter((pid) => isPlanetAlignedWithCaptainFaction(captain, pid));
  return aligned.length > 0 ? aligned : [...candidates];
}

export type TableDwellAssignContext = {
  epochBucket: number;
  dayBucket: number;
  unlockedPlanetIds: readonly string[];
  occupancy: Map<string, number>;
  roleOccupancy: Map<string, DwellRoleCounts>;
};

function filterUnlockedCandidates(
  candidates: readonly string[],
  unlockedPlanetIds: readonly string[],
): string[] {
  if (unlockedPlanetIds.length === 0) return [...candidates];
  const open = new Set(unlockedPlanetIds);
  return candidates.filter((pid) => open.has(pid));
}

function incrementRoleOccupancy(
  roleOccupancy: Map<string, DwellRoleCounts>,
  planetId: string,
  role: DwellRoleId,
): void {
  const cur = roleOccupancy.get(planetId) ?? {};
  roleOccupancy.set(planetId, { ...cur, [role]: (cur[role] ?? 0) + 1 });
}

function resolveTableDwellCandidates(
  captain: NpcCaptain,
  unlockedPlanetIds: readonly string[],
): string[] {
  const tableCandidates = listCaptainTableOrbitPlanetCandidates(captain, unlockedPlanetIds);
  if (tableCandidates.length === 0) return [];
  const factioned = resolveFactionCenteredCandidates(captain, tableCandidates);
  return filterUnlockedCandidates(factioned, unlockedPlanetIds);
}

function isFrontierEarlyForCaptain(
  candidates: readonly string[],
  signalsById: ReturnType<typeof getOrBuildDwellSignalIndex>,
): boolean {
  if (candidates.length === 0) return false;
  let frontierEarly = 0;
  for (const pid of candidates) {
    const sig = signalsById.get(pid);
    if (sig?.isFrontier && sig.colonizationPhase <= 1) frontierEarly += 1;
  }
  return frontierEarly === candidates.length;
}

function pickTableDwellPlanetId(
  captain: NpcCaptain,
  options: {
    epochBucket: number;
    dayBucket: number;
    unlockedPlanetIds: readonly string[];
    occupancy: ReadonlyMap<string, number>;
  },
): { planetId: string | null; role: DwellRoleId } {
  const candidates = resolveTableDwellCandidates(captain, options.unlockedPlanetIds);
  const signalsById = getOrBuildDwellSignalIndex();
  const role = resolveCaptainDwellRole(captain, {
    frontierEarly: isFrontierEarlyForCaptain(candidates, signalsById),
  });

  if (candidates.length === 0) return { planetId: null, role };
  if (signalsById.size === 0) {
    const h = npcDeterministicHash32(
      `arcCoreOrbitAssign:v${CAPTAIN_ORBIT_CANDIDATE_RULE_REV}:${captain.id}:${options.epochBucket}`,
    );
    return { planetId: candidates[h % candidates.length] ?? candidates[0] ?? null, role };
  }

  const judged = judgeTableDwellPlanet({
    captainId: captain.id,
    role,
    basePlanetId: captain.basePlanetId,
    activityPlanetIds: captain.activityPlanetIds,
    candidates,
    signalsById,
    occupancy: options.occupancy,
    dayBucket: options.dayBucket,
    epochBucket: options.epochBucket,
  });
  return { planetId: judged.planetId, role };
}

/** 인덱스 빌드용 — 순차 occupancy 갱신으로 혼잡 피드백 */
export function assignCaptainTableDwellPlanetId(
  captain: NpcCaptain,
  ctx: TableDwellAssignContext,
): { planetId: string | null; role: DwellRoleId } {
  if (captain.questOnly) return { planetId: null, role: 'survey' };
  if (captain.arcOrbitPresenceFill) return { planetId: null, role: 'survey' };
  if (isArcSeedTransportCaptainId(captain.id)) return { planetId: null, role: 'survey' };
  if (captain.operationalState === 'combat') return { planetId: null, role: 'survey' };

  const picked = pickTableDwellPlanetId(captain, ctx);
  if (picked.planetId) {
    ctx.occupancy.set(picked.planetId, (ctx.occupancy.get(picked.planetId) ?? 0) + 1);
    incrementRoleOccupancy(ctx.roleOccupancy, picked.planetId, picked.role);
  }
  return picked;
}

/** 테이블 순찰·주둔 함장이 궤도에 표시될 단일 행성 id. 수송 풀·seed·전투 함장은 null. */
export function resolveCaptainTableOrbitPlanetId(
  captain: NpcCaptain,
  options?: { epochBucket?: number; unlockedPlanetIds?: readonly string[]; dayBucket?: number },
): string | null {
  if (captain.questOnly) return null;
  if (captain.arcOrbitPresenceFill) return null;
  if (isArcSeedTransportCaptainId(captain.id)) return null;
  if (captain.operationalState === 'combat') return null;

  const unlockedPlanetIds = options?.unlockedPlanetIds ?? listUnlockedPlanetIdsForOrbitPresence();
  return pickTableDwellPlanetId(captain, {
    epochBucket: options?.epochBucket ?? getCaptainOrbitAssignmentEpochBucket(),
    dayBucket: options?.dayBucket ?? getDwellJudgmentDayBucket(),
    unlockedPlanetIds,
    occupancy: peekDwellOccupancyTotals(),
  }).planetId;
}

/** @deprecated `isCaptainHubOrbitPrimaryAtPlanet` — captainPresence 통합 인덱스 경유 */
export function isCaptainTableOrbitAssignedToPlanet(captain: NpcCaptain, planetId: string): boolean {
  if (captain.questOnly) return false;
  if (captain.arcOrbitPresenceFill) return false;
  if (isArcSeedTransportCaptainId(captain.id)) return false;
  if (captain.operationalState === 'combat') return false;
  return resolveCaptainTableOrbitPlanetId(captain) === planetId;
}
