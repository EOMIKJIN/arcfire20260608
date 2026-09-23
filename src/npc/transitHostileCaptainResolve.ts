// ============================================================
// 이동중 전투 적 함장 — 목적지 성계 `npc_cpt_enemy_*` + 적대 조직
// 시드 1회 조회 전용(틱/렌더 금지). 전용적 인덱스 모듈 1회.
// ============================================================

import { TransitCombatCaptainFallback_FROM_BALANCE_CSV } from '../data/balance/generated';
import { resolveCombatEncounterTargetLevel } from '../arcCore/balance/balanceTableRegistry';
import { isCaptainAllowedInCombat } from './mainStoryCaptainDeathGate';
import {
  getNpcCaptain,
  hasNpcCapitalShipId,
  listNpcCaptains,
} from './npcFleetRegistry';
import {
  indexDedicatedTransitHostileCaptains,
  pickTransitHostileCaptain,
  resolveTransitHostileHullScalePlanetIdForCaptain,
} from './pickTransitHostileCaptain';
import type { NpcCaptain } from '../types';

const TRANSIT_PLANET_ID = '__transit__';

let fallbackCaptainIdBySystemId: Map<string, string> | null = null;
let dedicatedIndex: {
  bySystem: Map<string, NpcCaptain[]>;
  list: NpcCaptain[];
} | null = null;

function getFallbackCaptainIdBySystem(): Map<string, string> {
  if (fallbackCaptainIdBySystemId) return fallbackCaptainIdBySystemId;
  fallbackCaptainIdBySystemId = new Map();
  for (const row of TransitCombatCaptainFallback_FROM_BALANCE_CSV) {
    const systemId = String(row.systemId ?? '').trim();
    const captainId = String(row.captainId ?? '').trim();
    if (!systemId || !captainId) continue;
    if (!fallbackCaptainIdBySystemId.has(systemId)) {
      fallbackCaptainIdBySystemId.set(systemId, captainId);
    }
  }
  return fallbackCaptainIdBySystemId;
}

function getDedicatedIndex(): { bySystem: Map<string, NpcCaptain[]>; list: NpcCaptain[] } {
  if (!dedicatedIndex) {
    dedicatedIndex = indexDedicatedTransitHostileCaptains(listNpcCaptains(), {
      hasShip: hasNpcCapitalShipId,
      allowedInCombat: isCaptainAllowedInCombat,
    });
  }
  return dedicatedIndex;
}

function resolveNearestFromIndex(destTcl: number): NpcCaptain | undefined {
  let best: NpcCaptain | undefined;
  let bestDelta = Infinity;
  for (const captain of getDedicatedIndex().list) {
    const tcl = resolveCombatEncounterTargetLevel(TRANSIT_PLANET_ID, captain.baseSystemId);
    const delta = Math.abs(tcl - destTcl);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = captain;
    }
  }
  return best;
}

/**
 * 목적지 성계 전용적(`npc_cpt_enemy_*`) → CSV 폴백 → TCL 최근접 전용적.
 * 허브 트래픽 해적(`raid_scar` · `vega_red_*`)은 전용적보다 뒤에 있어 선택되지 않는다.
 */
export function resolveTransitHostileCaptainForSystem(
  systemId: string | null,
): NpcCaptain | undefined {
  const sid = systemId?.trim() ?? '';
  if (!sid) return undefined;

  const dedicated = getDedicatedIndex().bySystem.get(sid);
  if (dedicated && dedicated.length > 0) return dedicated[0];

  const fallbackId = getFallbackCaptainIdBySystem().get(sid);
  if (fallbackId) {
    const fallback = getNpcCaptain(fallbackId);
    const shipId = fallback?.assignedShipId?.trim() ?? '';
    if (fallback && shipId && hasNpcCapitalShipId(shipId) && isCaptainAllowedInCombat(fallback.id)) {
      return fallback;
    }
  }

  return resolveNearestFromIndex(resolveCombatEncounterTargetLevel(TRANSIT_PLANET_ID, sid));
}

/** @deprecated `resolveTransitHostileCaptainForSystem` — 호환 별칭 */
export function resolveTransitPirateCaptainForSystem(
  systemId: string | null,
): NpcCaptain | undefined {
  return resolveTransitHostileCaptainForSystem(systemId);
}

export function resolveTransitHostileHullScalePlanetId(
  combatSystemId: string | null,
  captainId: string | null,
): string {
  return resolveTransitHostileHullScalePlanetIdForCaptain(
    combatSystemId,
    captainId ? getNpcCaptain(captainId) : undefined,
  );
}

export {
  pickTransitHostileCaptain,
  resolveTransitHostileHullScalePlanetIdForCaptain,
  captainBelongsToTransitSystem,
} from './pickTransitHostileCaptain';
export type { TransitHostileCaptainPickOpts } from './pickTransitHostileCaptain';
