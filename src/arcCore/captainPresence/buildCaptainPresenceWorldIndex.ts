// ============================================================
// 아크코어 — CSV 함장 primary presence 전역 인덱스 (함장 id당 1곳)
// 우선순위: 총사령관 > 아크 수송 > 전투 주둔 > 테이블 순찰(3h) > off_world
// ============================================================

import { NPC_CAPTAINS_FROM_CSV } from '../../data/generated';
import type { NpcCaptain } from '../../types';
import { resolveCoreOpenStarSystem } from '../../world/coreOpenGameplayPlanets';
import { npcDeterministicHash32 } from '../../npc/npcDeterministicHash';
import type { ArcNpcTrafficShip } from '../../store/arcNpcTrafficStore';
import { listGovernorCaptainPrimaryPlanets } from '../../game/planetGovernor/planetGovernorAssignmentStore';
import { resolveSystemIdForPlanetId } from '../../world/resolvePlanetSystemId';
import {
  getCaptainOrbitAssignmentEpochBucket,
  resolveCaptainTableOrbitPlanetId,
  syncCaptainOrbitAssignmentEpochMemo,
  readUnlockedPlanetIdsSig,
} from '../orbitPresence/captainOrbitPlanetAssignment';
import {
  readCaptainPresenceWorldIndexCache,
  writeCaptainPresenceWorldIndexCache,
} from './captainPresenceWorldIndexCache';
import type {
  CaptainPresenceActivity,
  CaptainPresenceWorldIndex,
  CaptainPrimaryPresence,
} from './captainPresenceTypes';

const ACTIVITY_RANK: Record<CaptainPresenceActivity, number> = {
  off_world: 0,
  transit_encounter: 1,
  orbit_table_patrol: 1,
  mission_combat_anchor: 2,
  combat_orbit_posture: 2,
  orbit_arc_transport: 3,
  tavern_host: 4,
  governor_post: 5,
};

function systemIdForPlanet(planetId: string): string | null {
  return resolveSystemIdForPlanetId(planetId);
}

/** 전투 함장 anchor — epoch 없이 고정(함장당 1행성) */
function resolveCombatCaptainAnchorPlanetId(captain: NpcCaptain): string | null {
  if (captain.operationalState !== 'combat') return null;
  const candidates: string[] = [];
  const add = (pid: string | null | undefined) => {
    const id = String(pid ?? '').trim();
    if (id && !candidates.includes(id)) candidates.push(id);
  };
  add(captain.basePlanetId);
  for (const pid of captain.activityPlanetIds) add(pid);
  for (const sid of [captain.baseSystemId, ...captain.activitySystemIds]) {
    if (!sid) continue;
    const sys = resolveCoreOpenStarSystem(sid);
    if (!sys) continue;
    for (const p of sys.planets) add(p.id);
  }
  candidates.sort();
  if (candidates.length === 0) return null;
  const h = npcDeterministicHash32(`arcCoreCombatAnchor:v1:${captain.id}`);
  return candidates[h % candidates.length] ?? candidates[0] ?? null;
}

function shouldReplacePresence(
  current: CaptainPrimaryPresence | undefined,
  next: CaptainPrimaryPresence,
): boolean {
  if (!current) return true;
  return ACTIVITY_RANK[next.activity] >= ACTIVITY_RANK[current.activity];
}

function commitPresence(
  map: Map<string, CaptainPrimaryPresence>,
  next: CaptainPrimaryPresence,
): void {
  const cur = map.get(next.captainId);
  if (!shouldReplacePresence(cur, next)) return;
  map.set(next.captainId, next);
}

function buildHubOrbitMap(
  byCaptainId: ReadonlyMap<string, CaptainPrimaryPresence>,
): Map<string, string[]> {
  const out = new Map<string, string[]>();
  const push = (planetId: string, captainId: string) => {
    const list = out.get(planetId) ?? [];
    if (!list.includes(captainId)) list.push(captainId);
    out.set(planetId, list);
  };
  for (const p of byCaptainId.values()) {
    if (!p.planetId) continue;
    if (p.activity === 'orbit_arc_transport' || p.activity === 'orbit_table_patrol') {
      push(p.planetId, p.captainId);
    }
  }
  for (const list of out.values()) list.sort();
  return out;
}

function arcTrafficSig(ships: readonly ArcNpcTrafficShip[]): string {
  const parts: string[] = [];
  for (const s of ships) {
    parts.push(`${s.id}:${s.captainId}:${s.planetId}:${s.phase}`);
  }
  parts.sort();
  return parts.join('|');
}

/**
 * 전역 primary presence — AiNpc arc 스냅샷·3h epoch·총사령관 배정 반영.
 * 동일 입력이면 캐시 재사용(틱 부하 최소).
 */
export function getCaptainPresenceWorldIndex(
  arcShips: readonly ArcNpcTrafficShip[] = [],
): CaptainPresenceWorldIndex {
  const epochBucket = syncCaptainOrbitAssignmentEpochMemo();
  const govSig = [...listGovernorCaptainPrimaryPlanets().entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([c, p]) => `${c}:${p}`)
    .join('|');
  const key = `${epochBucket}|${arcTrafficSig(arcShips)}|${govSig}|${readUnlockedPlanetIdsSig()}`;
  const cached = readCaptainPresenceWorldIndexCache(key);
  if (cached) return cached;

  const byCaptainId = new Map<string, CaptainPrimaryPresence>();

  for (const captain of NPC_CAPTAINS_FROM_CSV) {
    commitPresence(byCaptainId, {
      captainId: captain.id,
      activity: 'off_world',
      planetId: null,
      systemId: null,
      shipId: null,
    });
  }

  for (const [captainId, planetId] of listGovernorCaptainPrimaryPlanets()) {
    commitPresence(byCaptainId, {
      captainId,
      activity: 'governor_post',
      planetId,
      systemId: systemIdForPlanet(planetId),
      shipId: null,
    });
  }

  for (const captain of NPC_CAPTAINS_FROM_CSV) {
    for (const planetId of captain.tavernPlanetIds) {
      const pid = String(planetId ?? '').trim();
      if (!pid) continue;
      commitPresence(byCaptainId, {
        captainId: captain.id,
        activity: 'tavern_host',
        planetId: pid,
        systemId: systemIdForPlanet(pid),
        shipId: null,
      });
    }
  }

  for (const ship of arcShips) {
    const pid = String(ship.planetId ?? '').trim();
    if (!pid || !ship.captainId) continue;
    commitPresence(byCaptainId, {
      captainId: ship.captainId,
      activity: 'orbit_arc_transport',
      planetId: pid,
      systemId: systemIdForPlanet(pid),
      shipId: ship.id,
    });
  }

  for (const captain of NPC_CAPTAINS_FROM_CSV) {
    if (captain.arcOrbitPresenceFill) continue;
    if (captain.operationalState === 'combat') {
      const anchor = resolveCombatCaptainAnchorPlanetId(captain);
      if (!anchor) continue;
      commitPresence(byCaptainId, {
        captainId: captain.id,
        activity: 'combat_orbit_posture',
        planetId: anchor,
        systemId: systemIdForPlanet(anchor),
        shipId: captain.assignedShipId ?? null,
      });
      continue;
    }
    const patrolPlanet = resolveCaptainTableOrbitPlanetId(captain, { epochBucket });
    if (!patrolPlanet) continue;
    commitPresence(byCaptainId, {
      captainId: captain.id,
      activity: 'orbit_table_patrol',
      planetId: patrolPlanet,
      systemId: systemIdForPlanet(patrolPlanet),
      shipId: captain.assignedShipId ?? null,
    });
  }

  const hubOrbitCaptainIdsByPlanet = buildHubOrbitMap(byCaptainId);
  const index: CaptainPresenceWorldIndex = {
    epochBucket,
    byCaptainId,
    hubOrbitCaptainIdsByPlanet,
  };
  writeCaptainPresenceWorldIndexCache(key, index);
  return index;
}

export function getCaptainPrimaryPresence(
  captainId: string,
  arcShips: readonly ArcNpcTrafficShip[] = [],
): CaptainPrimaryPresence | null {
  return getCaptainPresenceWorldIndex(arcShips).byCaptainId.get(captainId) ?? null;
}

/** 허브 궤도·INFO — primary가 해당 행성 orbit patrol/arc transport 인 CSV 함장 */
export function isCaptainHubOrbitPrimaryAtPlanet(
  captain: NpcCaptain,
  planetId: string,
  arcShips: readonly ArcNpcTrafficShip[] = [],
): boolean {
  if (captain.arcOrbitPresenceFill) {
    const p = getCaptainPrimaryPresence(captain.id, arcShips);
    return p?.activity === 'orbit_arc_transport' && p.planetId === planetId;
  }
  if (captain.operationalState === 'combat') return false;
  const p = getCaptainPrimaryPresence(captain.id, arcShips);
  return p?.activity === 'orbit_table_patrol' && p.planetId === planetId;
}

export function listHubOrbitCaptainIdsAtPlanet(
  planetId: string,
  arcShips: readonly ArcNpcTrafficShip[] = [],
): readonly string[] {
  return getCaptainPresenceWorldIndex(arcShips).hubOrbitCaptainIdsByPlanet.get(planetId) ?? [];
}

/** 테스트·epoch 갱신 */
export function peekCaptainPresenceEpochBucket(): number {
  return getCaptainOrbitAssignmentEpochBucket();
}
