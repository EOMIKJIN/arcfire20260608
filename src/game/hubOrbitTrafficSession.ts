// ============================================================
// STAGE 1 허브 궤도 트래픽 — v4.0 §6-2 (최대 5척 · ~15s spawn/despawn)
// 휘발 상태는 행성 세션 dispose 시 해제 · 정적 풀은 planetMemoCache
// ============================================================

import { ARC_ORBIT_PRESENCE_FILL_MAX } from '../arcCore/arcNpcTrafficTableRegistry';
import { memoizePerPlanetSystem } from './planetMemoCache';
import { getNpcCaptain, getNpcCapitalShip, listNpcCaptains } from '../npc/npcFleetRegistry';
import { getNpcCapitalHullClassDef, resolveNpcCapitalOrbitKinematic } from '../npc/npcCapitalClassRegistry';
import { NPC_CAPITAL_HULL_FALLBACK_ID } from '../types';
import {
  formatCapitalShipInfoPanelBadge,
  resolveCapitalShipClassification,
} from '../arcCore/balance/capitalShipClassification';
import { NEARBY_PRESENCE_DISPLAY_SEP, type NearbyOrbitPresenceRow } from '../npc/nearbyOrbitPresenceSystem';
import { npcDeterministicHash32 } from '../npc/npcDeterministicHash';

export const HUB_ORBIT_TRAFFIC_MAX_ACTIVE = 5;
export const HUB_ORBIT_TRAFFIC_CYCLE_MS = 15_000;

const HUB_TRAFFIC_SLOT_BASE = 2000;

type HubTrafficCaptainRef = { captainId: string; shipId: string };

type ActiveHubTrafficNpc = {
  npcUid: string;
  captainId: string;
  shipId: string;
  slotSalt: number;
  spawnedAtMs: number;
};

type HubTrafficSession = {
  active: ActiveHubTrafficNpc[];
};

const sessions = new Map<string, HubTrafficSession>();

const resolveHubTrafficCaptainPool = memoizePerPlanetSystem(
  'hub_traffic',
  (_planetId, _systemId): HubTrafficCaptainRef[] =>
    listNpcCaptains()
      .filter((c) => c.arcOrbitPresenceFill && c.operationalState === 'general')
      .map((c) => ({ captainId: c.id, shipId: c.assignedShipId ?? '' }))
      .filter((r) => r.shipId.length > 0)
      .slice(0, ARC_ORBIT_PRESENCE_FILL_MAX),
);

function sessionKey(planetId: string, systemId: string): string {
  return `${planetId}|${systemId}`;
}

function pickNextHubTrafficNpc(
  planetId: string,
  systemId: string,
  excludeCaptainIds: Set<string>,
  excludeShipIds: Set<string>,
  salt: number,
): ActiveHubTrafficNpc | null {
  const pool = resolveHubTrafficCaptainPool(planetId, systemId);
  if (pool.length === 0) return null;
  for (let i = 0; i < pool.length; i++) {
    const idx = (salt + i) % pool.length;
    const ref = pool[idx]!;
    if (excludeCaptainIds.has(ref.captainId) || excludeShipIds.has(ref.shipId)) continue;
    const h = npcDeterministicHash32(`hub_traffic:${planetId}:${systemId}:${salt}:${ref.captainId}`);
    return {
      npcUid: `hub_traffic_${planetId}_${ref.captainId}_${salt}`,
      captainId: ref.captainId,
      shipId: ref.shipId,
      slotSalt: h % 64,
      spawnedAtMs: Date.now(),
    };
  }
  return null;
}

export function startHubOrbitTrafficSession(planetId: string, systemId: string): () => void {
  const key = sessionKey(planetId, systemId);
  if (!sessions.has(key)) {
    sessions.set(key, { active: [] });
  }
  return () => {
    sessions.delete(key);
  };
}

/** 15초 주기로 1척 despawn 후 1척 spawn — 동시 active ≤ 5 */
export function tickHubOrbitTraffic(
  planetId: string,
  systemId: string,
  excludeCaptainIds: Set<string>,
  excludeShipIds: Set<string>,
): void {
  const key = sessionKey(planetId, systemId);
  const session = sessions.get(key);
  if (!session) return;

  if (session.active.length >= HUB_ORBIT_TRAFFIC_MAX_ACTIVE) {
    session.active.shift();
  }

  const activeCaptainIds = new Set(session.active.map((n) => n.captainId));
  const activeShipIds = new Set(session.active.map((n) => n.shipId));
  const mergedExcludeCaptains = new Set([...excludeCaptainIds, ...activeCaptainIds]);
  const mergedExcludeShips = new Set([...excludeShipIds, ...activeShipIds]);

  if (session.active.length < HUB_ORBIT_TRAFFIC_MAX_ACTIVE) {
    const next = pickNextHubTrafficNpc(
      planetId,
      systemId,
      mergedExcludeCaptains,
      mergedExcludeShips,
      Date.now(),
    );
    if (next) session.active.push(next);
  }
}

export function seedHubOrbitTraffic(
  planetId: string,
  systemId: string,
  excludeCaptainIds: Set<string>,
  excludeShipIds: Set<string>,
): void {
  const key = sessionKey(planetId, systemId);
  if (!sessions.has(key)) {
    sessions.set(key, { active: [] });
  }
  for (let i = 0; i < HUB_ORBIT_TRAFFIC_MAX_ACTIVE; i++) {
    tickHubOrbitTraffic(planetId, systemId, excludeCaptainIds, excludeShipIds);
  }
}

export function buildHubTrafficPresenceRows(
  planetId: string,
  systemId: string,
): NearbyOrbitPresenceRow[] {
  const session = sessions.get(sessionKey(planetId, systemId));
  if (!session || session.active.length === 0) return [];

  const sep = NEARBY_PRESENCE_DISPLAY_SEP;
  return session.active.map((npc, i) => {
    const captain = getNpcCaptain(npc.captainId);
    const hull = getNpcCapitalShip(npc.shipId);
    const captainName = captain?.displayName ?? npc.captainId;
    const shipName = hull?.name ?? npc.shipId;
    const classification = resolveCapitalShipClassification(npc.shipId);
    const infoRight = classification
      ? formatCapitalShipInfoPanelBadge(classification)
      : (hull?.infoLineSuffix && hull.infoLineSuffix.trim()) || 'MK.I';
    const hullClassId = hull?.hullTypeId ?? NPC_CAPITAL_HULL_FALLBACK_ID;
    const motion = getNpcCapitalHullClassDef(hullClassId).orbit;
    const tight = {
      ...motion,
      radiusBase: Math.max(28, Math.round(motion.radiusBase * 0.5)),
      radiusSpread: Math.max(2, Math.floor(motion.radiusSpread * 0.3)),
      stillProbability: 0.06,
    };
    return {
      slotIndex: HUB_TRAFFIC_SLOT_BASE + i,
      hullClassId,
      displayLine: `‹AI› ${captainName} · ${shipName}${sep}${infoRight}`,
      orbit: resolveNpcCapitalOrbitKinematic(planetId, systemId, 96 + npc.slotSalt, tight),
      linkedCapitalShipId: npc.shipId,
    };
  });
}

/** 테이블·transient 구분 없이 INFO 행 전체를 maxActive로 자름 (테이블 무제한 유지 회귀 방지) */
export function capHubOrbitPresenceToBudget(
  rows: NearbyOrbitPresenceRow[],
  maxActive = HUB_ORBIT_TRAFFIC_MAX_ACTIVE,
): NearbyOrbitPresenceRow[] {
  if (rows.length <= maxActive) return rows;
  return rows.slice(0, maxActive);
}
