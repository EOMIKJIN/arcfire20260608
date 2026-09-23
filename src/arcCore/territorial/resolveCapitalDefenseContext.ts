// ============================================================
// 4대 항로 수도 방위 컨텍스트 — 순수 함수 (zustand 없음)
// ============================================================

import { isRouteCapitalPlanetId } from '../../world/galaxyFrontierDevelopmentRidge';
import type { PlanetClanHold } from '../../types';
import {
  getArcCoreCapitalDefensePolicy,
  type ArcCoreCapitalDefensePolicy,
} from './arcCoreCapitalDefensePolicy';
import type { TerritorialHoldSide } from './territorialFactionSide';
import { countAdjacentFriendlySystems, hasAdjacentHostileFactionSystem } from './territorialSupplyLine';
import type { SupplyEnvelopeAdjacency } from './resolveSupplyEnvelope';

export type CapitalDefenseMode =
  | 'not_capital'
  | 'hold_defense'
  | 'siege_open'
  | 'fallen_recapture';

export type CapitalDefenseContext = {
  mode: CapitalDefenseMode;
  isRouteCapital: boolean;
  holdSide: TerritorialHoldSide;
  alliedAdjacent: number;
  hostileAdjacent: boolean;
};

export function resolveCapitalDefenseContext(input: {
  planetId: string;
  systemId: string;
  holdSide: TerritorialHoldSide;
  adjacency?: SupplyEnvelopeAdjacency;
  holds: Readonly<Record<string, PlanetClanHold>>;
  policy?: ArcCoreCapitalDefensePolicy;
}): CapitalDefenseContext {
  const policy = input.policy ?? getArcCoreCapitalDefensePolicy();
  const isRouteCapital = isRouteCapitalPlanetId(input.planetId);
  const adjacency = input.adjacency ?? {
    blue: countAdjacentFriendlySystems({ systemId: input.systemId, side: 'BLUE', holds: input.holds }),
    red: countAdjacentFriendlySystems({ systemId: input.systemId, side: 'RED', holds: input.holds }),
  };
  const empty: CapitalDefenseContext = {
    mode: 'not_capital',
    isRouteCapital,
    holdSide: input.holdSide,
    alliedAdjacent: 0,
    hostileAdjacent: false,
  };
  if (!policy.enabled || !isRouteCapital) return empty;

  const holdSide = input.holdSide;
  if (holdSide !== 'BLUE' && holdSide !== 'RED' && holdSide !== 'INDEPENDENT') {
    return {
      mode: 'fallen_recapture',
      isRouteCapital: true,
      holdSide,
      alliedAdjacent: 0,
      hostileAdjacent: false,
    };
  }

  const alliedAdjacent =
    holdSide === 'BLUE'
      ? adjacency.blue
      : holdSide === 'RED'
        ? adjacency.red
        : countAdjacentFriendlySystems({
            systemId: input.systemId,
            side: 'INDEPENDENT',
            holds: input.holds,
          });
  const hostileAdjacent = hasAdjacentHostileFactionSystem({
    systemId: input.systemId,
    side: holdSide,
    holds: input.holds,
  });

  const ringIntact = alliedAdjacent >= policy.siegeGateAlliedMin || !hostileAdjacent;
  return {
    mode: ringIntact ? 'hold_defense' : 'siege_open',
    isRouteCapital: true,
    holdSide,
    alliedAdjacent,
    hostileAdjacent,
  };
}

/** 포위문이 닫힌 수도·함락/중립 수도는 min8 땜빵 승격 금지. siege_open만 풀 후보. */
export function shouldBanCapitalFromContestedPool(
  ctx: CapitalDefenseContext,
  policy?: ArcCoreCapitalDefensePolicy,
): boolean {
  const p = policy ?? getArcCoreCapitalDefensePolicy();
  if (!p.enabled || !ctx.isRouteCapital) return false;
  if (ctx.mode === 'siege_open') return false;
  return p.capitalPoolPromoteBannedWhenRingIntact || ctx.mode === 'fallen_recapture';
}
