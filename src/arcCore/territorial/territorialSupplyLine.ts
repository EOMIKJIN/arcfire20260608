// ============================================================
// 보급선(노드 연결) 기반 분쟁 전투 가산 — 런타임 holds 기준 (2026-07-21)
// 인접 성계(1홉) 점유가 아군이면 보급·협동전투 이점 → 전투력 가산,
// 인접 아군 성계 0개(고립)면 원정 페널티. 시드 CSV가 아닌 **런타임 점유** 정본.
// ============================================================

import { STAR_SYSTEMS_FROM_CSV } from '../../data/generated/csvSystems';
import { resolveHoldFactionSide } from './territorialFactionSide';
import {
  getFactionRelation,
  listSupplyEligibleFactions,
  type PoliticalFactionToken,
} from './factionPoliticalRelations';
import type {
  TerritorialCombatParticipant,
  TerritorialCombatPolicy,
} from './arcCoreTerritorialCombatPolicy';
import type { PlanetClanHold } from '../../types';

export type TerritorialSupplySideStatus = {
  /** 인접(1홉) 아군 점유 성계 수 */
  adjacentFriendlySystems: number;
  /** 전투력 배율 — 고립 <1, 보급 확보 ≥1 */
  powerMul: number;
};

export type TerritorialSupplyContext = {
  attacker: TerritorialSupplySideStatus;
  defender: TerritorialSupplySideStatus;
};

/** 인접 성계 id 목록 — 자기참조·중복 제거 (csvSystems 자기 자신 포함 데이터 결함 방어) */
export function listAdjacentSystemIds(systemId: string): string[] {
  const sys = STAR_SYSTEMS_FROM_CSV[systemId as keyof typeof STAR_SYSTEMS_FROM_CSV];
  if (!sys) return [];
  const out: string[] = [];
  for (const connId of sys.connections) {
    if (!connId || connId === systemId || out.includes(connId)) continue;
    out.push(connId);
  }
  return out;
}

/**
 * 인접 성계(1홉) 중 해당 팩션이 **런타임 점유** 중인 성계 수.
 * 성계 내 행성 1곳이라도 해당 팩션 점유면 그 성계는 아군 보급 노드로 계산.
 * 보급 인정 팩션은 정치관계 CSV 경유 — 「동맹 보급(allySupplyEnabled)」 ON인 동맹 점유도
 * 보급 노드로 합산한다 (현재 전 쌍 OFF → 자기 팩션만 · 기존 동작과 동일).
 */
export function countAdjacentFriendlySystems(input: {
  systemId: string;
  side: PoliticalFactionToken;
  holds: Readonly<Record<string, PlanetClanHold>>;
}): number {
  const adjacent = listAdjacentSystemIds(input.systemId);
  if (adjacent.length === 0) return 0;
  const supplySides = listSupplyEligibleFactions(input.side);
  let count = 0;
  for (const adjSystemId of adjacent) {
    for (const planetId of Object.keys(input.holds)) {
      const hold = input.holds[planetId];
      if (!hold || hold.systemId !== adjSystemId) continue;
      const holdSide = resolveHoldFactionSide(hold.occupierClanId);
      if (holdSide !== 'NEUTRAL' && supplySides.includes(holdSide)) {
        count += 1;
        break;
      }
    }
  }
  return count;
}

/** 보급 상태 → 전투력 배율. NEUTRAL(현지 세력)은 항상 1(홈 방어·보급 개념 비적용). */
export function resolveSupplyPowerMul(
  policy: Pick<
    TerritorialCombatPolicy,
    'supplyIsolatedPenaltyPct' | 'supplyBonusPctPerNode' | 'supplyBonusCapPct'
  >,
  adjacentFriendlySystems: number,
): number {
  if (adjacentFriendlySystems <= 0) {
    return Math.max(0.1, 1 - policy.supplyIsolatedPenaltyPct / 100);
  }
  const bonusPct = Math.min(
    policy.supplyBonusCapPct,
    policy.supplyBonusPctPerNode * adjacentFriendlySystems,
  );
  return 1 + bonusPct / 100;
}

function resolveSideStatus(
  participant: TerritorialCombatParticipant,
  policy: TerritorialCombatPolicy,
  holds: Readonly<Record<string, PlanetClanHold>>,
): TerritorialSupplySideStatus {
  if (participant === 'NEUTRAL') {
    return { adjacentFriendlySystems: 0, powerMul: 1 };
  }
  const adjacentFriendlySystems = countAdjacentFriendlySystems({
    systemId: policy.systemId,
    side: participant,
    holds,
  });
  return {
    adjacentFriendlySystems,
    powerMul: resolveSupplyPowerMul(policy, adjacentFriendlySystems),
  };
}

/**
 * 인접 성계(1홉)에 해당 팩션과 **적대(hostile)** 관계인 팩션의 런타임 점유가 있는지.
 * 소유권 구매 시 분쟁지역 편입 조건 판정용 (정치관계 CSV 정본).
 */
export function hasAdjacentHostileFactionSystem(input: {
  systemId: string;
  side: PoliticalFactionToken;
  holds: Readonly<Record<string, PlanetClanHold>>;
}): boolean {
  const adjacent = listAdjacentSystemIds(input.systemId);
  if (adjacent.length === 0) return false;
  for (const adjSystemId of adjacent) {
    for (const planetId of Object.keys(input.holds)) {
      const hold = input.holds[planetId];
      if (!hold || hold.systemId !== adjSystemId) continue;
      const holdSide = resolveHoldFactionSide(hold.occupierClanId);
      if (holdSide === 'NEUTRAL') continue;
      if (getFactionRelation(input.side, holdSide).relation === 'hostile') return true;
    }
  }
  return false;
}

/** 해당 팩션과 적대 관계인 팩션 목록 (판정 공격자 후보) */
export function listHostileFactions(side: PoliticalFactionToken): PoliticalFactionToken[] {
  const candidates: PoliticalFactionToken[] = ['BLUE', 'RED', 'INDEPENDENT'];
  return candidates.filter(
    (other) => other !== side && getFactionRelation(side, other).relation === 'hostile',
  );
}

/** 공격·방어 양측 보급 컨텍스트 — 판정 패스에서 전투 직전 1회 계산 */
export function resolveTerritorialSupplyContext(input: {
  policy: TerritorialCombatPolicy;
  attacker: TerritorialCombatParticipant;
  defender: TerritorialCombatParticipant;
  holds: Readonly<Record<string, PlanetClanHold>>;
}): TerritorialSupplyContext {
  return {
    attacker: resolveSideStatus(input.attacker, input.policy, input.holds),
    defender: resolveSideStatus(input.defender, input.policy, input.holds),
  };
}
