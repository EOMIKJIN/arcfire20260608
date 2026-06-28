// ============================================================
// 아크코어 — CSV 함장 궤도 주둔 행성 단일 배정 (전역 중복 방지)
// - `arcOrbitPresenceFill` 수송선: AiNpcSubCore 궤도 교통만 (본 모듈 제외)
// - 그 외 비전투 함장: CSV 후보 ∩ 팩션 행성 풀에서 epoch 버킷마다 1행성 배정
// - tick·persist 없음 — wall-clock 3h 버킷 해시만 갱신
// ============================================================

import type { NpcCaptain } from '../../types';
import { STAR_SYSTEMS } from '../../data/systems';
import { npcDeterministicHash32 } from '../../npc/npcDeterministicHash';
import { invalidatePlanetMemoCacheNamespace } from '../../game/planetMemoCache';
import { invalidateCaptainPresenceWorldIndexCache } from '../captainPresence/captainPresenceWorldIndexCache';
import {
  listUnlockedPlanetIdsForOrbitPresence,
  readUnlockedPlanetIdsSig,
} from './orbitPresenceUnlockedPlanets';

/** synth·성계 개방 직후 — 3h 배정·근접 궤도 memo 즉시 갱신 */
export function invalidateOrbitPresenceCachesOnWorldExpansion(): void {
  planetFactionById = null;
  invalidatePlanetMemoCacheNamespace(NEARBY_PRESENCE_MEMO_NAMESPACE);
  invalidateCaptainPresenceWorldIndexCache();
}

export { readUnlockedPlanetIdsSig };

/** 테이블 주둔 전함 행성 재배치 주기 (wall-clock, ms) — 3시간 */
export const CAPTAIN_ORBIT_ASSIGNMENT_ROTATION_MS = 3 * 60 * 60 * 1000;

const NEARBY_PRESENCE_MEMO_NAMESPACE = 'nearbyOrbitPresenceSystem.resolvePlanetNearbyPresence';

let planetFactionById: Map<string, string | null> | null = null;
let lastMemoEpochBucket = -1;

function getPlanetFactionByIdIndex(): Map<string, string | null> {
  if (!planetFactionById) {
    planetFactionById = new Map<string, string | null>();
    for (const sys of Object.values(STAR_SYSTEMS)) {
      for (const planet of sys.planets) {
        planetFactionById.set(planet.id, planet.factionId ?? null);
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useWorldStore } = require('../../store/worldStore') as typeof import('../../store/worldStore');
    const world = useWorldStore.getState();
    for (const systemId of world.unlockedSystemIds) {
      const sys = world.systems[systemId];
      if (!sys) continue;
      for (const planet of sys.planets) {
        if (!planetFactionById.has(planet.id)) {
          planetFactionById.set(planet.id, planet.factionId ?? null);
        }
      }
    }
  }
  return planetFactionById;
}

/** wall-clock 3h 버킷 — ArcCore tick·AsyncStorage 불필요 */
export function getCaptainOrbitAssignmentEpochBucket(nowMs = Date.now()): number {
  return Math.floor(nowMs / CAPTAIN_ORBIT_ASSIGNMENT_ROTATION_MS);
}

/**
 * epoch 버킷이 바뀌면 행성 체류 전함 memo만 무효화.
 * `resolvePlanetNearbyPresence` 호출 직전 1회면 충분.
 */
export function syncCaptainOrbitAssignmentEpochMemo(nowMs = Date.now()): number {
  const bucket = getCaptainOrbitAssignmentEpochBucket(nowMs);
  if (bucket !== lastMemoEpochBucket) {
    lastMemoEpochBucket = bucket;
    invalidatePlanetMemoCacheNamespace(NEARBY_PRESENCE_MEMO_NAMESPACE);
    invalidateCaptainPresenceWorldIndexCache();
  }
  return bucket;
}

function listCaptainOrbitPlanetCandidates(captain: NpcCaptain): string[] {
  const out: string[] = [];
  const add = (planetId: string | null | undefined) => {
    const pid = String(planetId ?? '').trim();
    if (!pid || out.includes(pid)) return;
    out.push(pid);
  };

  add(captain.basePlanetId);
  for (const pid of captain.activityPlanetIds) add(pid);

  const systemIds = new Set<string>();
  if (captain.baseSystemId) systemIds.add(captain.baseSystemId);
  for (const sid of captain.activitySystemIds) {
    if (sid) systemIds.add(sid);
  }
  for (const sid of systemIds) {
    const sys = STAR_SYSTEMS[sid];
    if (!sys) continue;
    for (const planet of sys.planets) add(planet.id);
  }

  // 개방 성계(21 + synth) — 테이블 주둔 함장 3h 순환 체류 후보 (자동 등록)
  for (const pid of listUnlockedPlanetIdsForOrbitPresence()) add(pid);

  return out.sort();
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

/** 테이블 순찰·주둔 함장이 궤도에 표시될 단일 행성 id. 수송 풀·전투 함장은 null. */
export function resolveCaptainTableOrbitPlanetId(
  captain: NpcCaptain,
  options?: { epochBucket?: number },
): string | null {
  if (captain.arcOrbitPresenceFill) return null;
  if (captain.operationalState === 'combat') return null;

  const tableCandidates = listCaptainOrbitPlanetCandidates(captain);
  if (tableCandidates.length === 0) return null;

  const candidates = resolveFactionCenteredCandidates(captain, tableCandidates);
  const epochBucket = options?.epochBucket ?? getCaptainOrbitAssignmentEpochBucket();
  const h = npcDeterministicHash32(`arcCoreOrbitAssign:v2:${captain.id}:${epochBucket}`);
  return candidates[h % candidates.length] ?? candidates[0] ?? null;
}

/** @deprecated `isCaptainHubOrbitPrimaryAtPlanet` — captainPresence 통합 인덱스 경유 */
export function isCaptainTableOrbitAssignedToPlanet(captain: NpcCaptain, planetId: string): boolean {
  if (captain.arcOrbitPresenceFill) return false;
  if (captain.operationalState === 'combat') return false;
  return resolveCaptainTableOrbitPlanetId(captain) === planetId;
}
