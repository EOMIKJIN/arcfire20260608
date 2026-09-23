// ============================================================
// 이동중 전투 함장 선택 — 순수 함수 (레지스트리·초상 require 없음)
// 시드 1회 · 테스트 공용. 틱/렌더 금지.
// ============================================================

import { resolvePlayScenarioPrimaryPlanetId } from '../arcCore/balance/balanceTableRegistry';
import type { NpcCaptain } from '../types';

export type TransitHostileCaptainPickOpts = {
  hasShip: (shipId: string) => boolean;
  allowedInCombat: (captainId: string) => boolean;
  fallbackCaptainId?: string | null;
  destTcl: number;
  tclForSystem: (systemId: string | null) => number;
};

/** 플레이어와 적대적인 항로 조직 — 허브 우호 팩션 제외 */
export const TRANSIT_HOSTILE_FACTION_IDS = new Set([
  'pirates',
  'void_walkers',
  'scavengers',
  'energy_corp',
  'archaeologists',
  'trade_coalition',
  'black_market',
  'dark_lords',
  'unknown',
  'ancients',
]);

function isDedicatedTransitEnemyCaptain(captain: NpcCaptain): boolean {
  return captain.id.startsWith('npc_cpt_enemy_');
}

export function captainBelongsToTransitSystem(
  captain: NpcCaptain,
  systemId: string,
): boolean {
  return captain.baseSystemId === systemId || captain.activitySystemIds.includes(systemId);
}

function isEligibleTransitHostileCaptain(
  captain: NpcCaptain,
  hasShip: (shipId: string) => boolean,
  allowedInCombat: (captainId: string) => boolean,
): boolean {
  if (captain.operationalState !== 'combat' && captain.operationalState !== 'general') return false;
  const faction = (captain.factionId ?? '').trim();
  if (!faction || !TRANSIT_HOSTILE_FACTION_IDS.has(faction)) return false;
  const shipId = (captain.assignedShipId ?? '').trim();
  if (!shipId || !hasShip(shipId)) return false;
  if (!allowedInCombat(captain.id)) return false;
  return true;
}

function collectDedicatedForSystem(
  captains: readonly NpcCaptain[],
  systemId: string,
  opts: Pick<TransitHostileCaptainPickOpts, 'hasShip' | 'allowedInCombat'>,
): NpcCaptain[] {
  const out: NpcCaptain[] = [];
  for (const captain of captains) {
    if (!isDedicatedTransitEnemyCaptain(captain)) continue;
    if (!isEligibleTransitHostileCaptain(captain, opts.hasShip, opts.allowedInCombat)) continue;
    if (!captainBelongsToTransitSystem(captain, systemId)) continue;
    out.push(captain);
  }
  return out;
}

function pickNearestDedicatedByTcl(
  captains: readonly NpcCaptain[],
  destTcl: number,
  opts: TransitHostileCaptainPickOpts,
): NpcCaptain | undefined {
  let best: NpcCaptain | undefined;
  let bestDelta = Infinity;
  for (const captain of captains) {
    if (!isDedicatedTransitEnemyCaptain(captain)) continue;
    if (!isEligibleTransitHostileCaptain(captain, opts.hasShip, opts.allowedInCombat)) continue;
    const tcl = opts.tclForSystem(captain.baseSystemId);
    const delta = Math.abs(tcl - destTcl);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = captain;
    }
  }
  return best;
}

/** 모듈 1회 인덱스용 — 전용적만. */
export function indexDedicatedTransitHostileCaptains(
  captains: readonly NpcCaptain[],
  opts: Pick<TransitHostileCaptainPickOpts, 'hasShip' | 'allowedInCombat'>,
): { bySystem: Map<string, NpcCaptain[]>; list: NpcCaptain[] } {
  const bySystem = new Map<string, NpcCaptain[]>();
  const list: NpcCaptain[] = [];
  const seen = new Set<string>();
  for (const captain of captains) {
    if (!isDedicatedTransitEnemyCaptain(captain)) continue;
    if (!isEligibleTransitHostileCaptain(captain, opts.hasShip, opts.allowedInCombat)) continue;
    if (!seen.has(captain.id)) {
      seen.add(captain.id);
      list.push(captain);
    }
    const systems = new Set<string>();
    if (captain.baseSystemId) systems.add(captain.baseSystemId);
    for (const sid of captain.activitySystemIds) {
      const trimmed = sid.trim();
      if (trimmed) systems.add(trimmed);
    }
    for (const sid of systems) {
      const bucket = bySystem.get(sid);
      if (bucket) bucket.push(captain);
      else bySystem.set(sid, [captain]);
    }
  }
  return { bySystem, list };
}

export function pickTransitHostileCaptain(
  captains: readonly NpcCaptain[],
  systemId: string | null,
  opts: TransitHostileCaptainPickOpts,
): NpcCaptain | undefined {
  const sid = systemId?.trim() ?? '';
  if (!sid) return undefined;
  const dedicated = collectDedicatedForSystem(captains, sid, opts);
  if (dedicated.length > 0) return dedicated[0];

  const fallbackId = opts.fallbackCaptainId?.trim() ?? '';
  if (fallbackId) {
    const fallback = captains.find((c) => c.id === fallbackId);
    if (fallback && isEligibleTransitHostileCaptain(fallback, opts.hasShip, opts.allowedInCombat)) {
      return fallback;
    }
  }

  return pickNearestDedicatedByTcl(captains, opts.destTcl, opts);
}

/**
 * 이동중 적 선체 스케일 행성.
 * 목적지 전용적이면 목적지 행성, 폴백 함장이면 그 함장 거점 행성.
 */
export function resolveTransitHostileHullScalePlanetIdForCaptain(
  combatSystemId: string | null,
  captain: NpcCaptain | undefined,
): string {
  const destPlanet = resolvePlayScenarioPrimaryPlanetId(combatSystemId);
  if (captain && combatSystemId && captainBelongsToTransitSystem(captain, combatSystemId)) {
    return destPlanet ?? captain.basePlanetId ?? '';
  }
  if (captain?.basePlanetId) return captain.basePlanetId;
  return destPlanet ?? '';
}
