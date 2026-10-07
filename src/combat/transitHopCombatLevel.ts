// ============================================================
// 이동중 전투 레벨 — CSV 함장만. 초상·세션 스토어 없음.
// 시드 1회. 틱/렌더 금지.
// ============================================================

import { TransitCombatCaptainFallback_FROM_BALANCE_CSV } from '../data/balance/generated/csvTransitCombatCaptainFallback';
import { NPC_CAPTAINS_FROM_CSV } from '../data/generated/csvNpcCaptains';
import { NPC_CAPITAL_SHIPS_FROM_CSV } from '../data/generated/csvNpcCapitalShips';
import { pickTransitHostileCaptain } from '../npc/pickTransitHostileCaptain';
import type { NpcCaptain } from '../types';
import { peekTransitCaptainPickOrdinal } from './transitCaptainPickOrdinal';
import {
  resolveTransitHopCombatLevel,
  resolveTransitHopDangerPolicyForSystem,
} from './transitHopDangerPolicy';

const SHIP_IDS = new Set(
  (NPC_CAPITAL_SHIPS_FROM_CSV as ReadonlyArray<{ id: string }>).map((ship) => ship.id),
);

let fallbackBySystemId: Map<string, string> | null = null;

function fallbackCaptainId(systemId: string): string | null {
  if (!fallbackBySystemId) {
    fallbackBySystemId = new Map();
    for (const row of TransitCombatCaptainFallback_FROM_BALANCE_CSV) {
      const sid = String(row.systemId ?? '').trim();
      const captainId = String(row.captainId ?? '').trim();
      if (!sid || !captainId || fallbackBySystemId.has(sid)) continue;
      fallbackBySystemId.set(sid, captainId);
    }
  }
  return fallbackBySystemId.get(systemId) ?? null;
}

export function resolveTransitHopCaptainForSystem(
  systemId: string | null,
): NpcCaptain | undefined {
  const sid = systemId?.trim() ?? '';
  if (!sid) return undefined;
  const policy = resolveTransitHopDangerPolicyForSystem(sid);
  return pickTransitHostileCaptain(NPC_CAPTAINS_FROM_CSV, sid, {
    hasShip: (id) => SHIP_IDS.has(id),
    allowedInCombat: () => true,
    fallbackCaptainId: fallbackCaptainId(sid),
    levelMin: policy.levelMin,
    levelMax: policy.levelMax,
    pickOrdinal: peekTransitCaptainPickOrdinal(sid),
  });
}

export function resolveTransitHopCombatLevelForSystem(
  systemId: string | null,
): number {
  const captain = resolveTransitHopCaptainForSystem(systemId);
  return resolveTransitHopCombatLevel(systemId, captain?.progression.initialLevel ?? null);
}
