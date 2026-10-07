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
  /** 홉 정책 레벨 하한. 있으면 전용적 1순위 대신 이 범위에서 고른다. */
  levelMin?: number;
  levelMax?: number;
  /** 같은 성계 재조우 순환. 없으면 0. */
  pickOrdinal?: number;
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
  if (captain.questOnly) return false;
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

function captainLevel(captain: NpcCaptain): number {
  const lv = captain.progression?.initialLevel;
  return typeof lv === 'number' && Number.isFinite(lv) ? Math.floor(lv) : 1;
}

function byCaptainId(a: NpcCaptain, b: NpcCaptain): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function pickOrdinalFrom(list: NpcCaptain[], ordinal: number): NpcCaptain | undefined {
  if (list.length === 0) return undefined;
  const sorted = list.slice().sort(byCaptainId);
  const index = ((ordinal % sorted.length) + sorted.length) % sorted.length;
  return sorted[index];
}

function collectInLevelRange(
  captains: readonly NpcCaptain[],
  levelMin: number,
  levelMax: number,
  opts: Pick<TransitHostileCaptainPickOpts, 'hasShip' | 'allowedInCombat'>,
  systemId?: string,
): NpcCaptain[] {
  const out: NpcCaptain[] = [];
  for (const captain of captains) {
    if (!isDedicatedTransitEnemyCaptain(captain)) continue;
    if (!isEligibleTransitHostileCaptain(captain, opts.hasShip, opts.allowedInCombat)) continue;
    const lv = captainLevel(captain);
    if (lv < levelMin || lv > levelMax) continue;
    if (systemId && !captainBelongsToTransitSystem(captain, systemId)) continue;
    out.push(captain);
  }
  return out;
}

function pickNearestDedicatedByLevel(
  captains: readonly NpcCaptain[],
  targetLevel: number,
  opts: TransitHostileCaptainPickOpts,
): NpcCaptain | undefined {
  let best: NpcCaptain | undefined;
  let bestDelta = Infinity;
  for (const captain of captains) {
    if (!isDedicatedTransitEnemyCaptain(captain)) continue;
    if (!isEligibleTransitHostileCaptain(captain, opts.hasShip, opts.allowedInCombat)) continue;
    const delta = Math.abs(captainLevel(captain) - targetLevel);
    if (delta < bestDelta || (delta === bestDelta && best && captain.id < best.id)) {
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
  const ordinal = opts.pickOrdinal ?? 0;
  if (opts.levelMin != null && opts.levelMax != null) {
    const levelMin = Math.min(opts.levelMin, opts.levelMax);
    const levelMax = Math.max(opts.levelMin, opts.levelMax);
    const local = collectInLevelRange(captains, levelMin, levelMax, opts, sid);
    const localPick = pickOrdinalFrom(local, ordinal);
    if (localPick) return localPick;
    const global = collectInLevelRange(captains, levelMin, levelMax, opts);
    const globalPick = pickOrdinalFrom(global, ordinal);
    if (globalPick) return globalPick;
    const nearest = pickNearestDedicatedByLevel(captains, levelMin, opts);
    if (nearest) return nearest;
  }

  const dedicated = collectDedicatedForSystem(captains, sid, opts);
  if (dedicated.length > 0) return dedicated.slice().sort(byCaptainId)[0];

  const fallbackId = opts.fallbackCaptainId?.trim() ?? '';
  if (fallbackId) {
    const fallback = captains.find((c) => c.id === fallbackId);
    if (fallback && isEligibleTransitHostileCaptain(fallback, opts.hasShip, opts.allowedInCombat)) {
      return fallback;
    }
  }

  return pickNearestDedicatedByLevel(captains, opts.levelMin ?? 1, opts);
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
