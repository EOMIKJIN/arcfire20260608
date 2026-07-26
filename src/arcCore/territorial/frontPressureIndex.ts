// ============================================================
// FrontPressure — 성계 단위 전선 압박 자세(posture) · 빈도(battlesPerInterval)
// holds 변경 시에만 재계산(invalidate) — probe/pass 진입 시 캐시 miss일 때만 recompute.
// 60s probe에서 전은하 재스캔 절대 금지(§ARC_CORE_TACTICAL_AUTOMATION_AND_GALAXY_STRATEGY §8).
// 월드 축(ArcCore 환경) — 계정 purge 대상 아님.
// ============================================================

import { countAdjacentFriendlySystems, listAdjacentSystemIds } from './territorialSupplyLine';
import { resolveHoldFactionSide, type TerritorialHoldSide } from './territorialFactionSide';
import { getFactionRelation, type PoliticalFactionToken } from './factionPoliticalRelations';
import { getArcCoreFrontPressurePolicy } from './arcCoreFrontPressurePolicy';
import type { TerritorialSupplyContext } from './territorialSupplyLine';
import type { PlanetClanHold } from '../../types';

export type FrontPosture = 'defensive' | 'normal' | 'aggressive';

export type FrontPressureSnapshot = {
  systemId: string;
  /** 이 성계의 현재 점유 우세 side(복수 행성이면 INDEPENDENT>BLUE>RED 우선) */
  side: TerritorialHoldSide;
  hostileNeighborCount: number;
  friendlySupplyCount: number;
  /** hostileNeighborMinFlanked 이상 — 로그/UI 참고 플래그(posture와 별개) */
  flanked: boolean;
  posture: FrontPosture;
  battlesPerInterval: number;
  computedAtMs: number;
};

/** 무효화 누락 방어용 소프트 세이프티넷 — 이 시간 지나면 다음 조회 시 자동 재계산(전량 재스캔 아님, 조회된 systemId 1건만) */
const FRONT_PRESSURE_CACHE_TTL_MS = 30 * 60_000;

const cache = new Map<string, FrontPressureSnapshot>();

function resolveSystemPrimarySide(
  systemId: string,
  holds: Readonly<Record<string, PlanetClanHold>>,
): TerritorialHoldSide {
  const PRIORITY: TerritorialHoldSide[] = ['INDEPENDENT', 'BLUE', 'RED'];
  const found = new Set<TerritorialHoldSide>();
  for (const planetId of Object.keys(holds)) {
    const hold = holds[planetId];
    if (!hold || hold.systemId !== systemId) continue;
    found.add(resolveHoldFactionSide(hold.occupierClanId));
  }
  for (const p of PRIORITY) {
    if (found.has(p)) return p;
  }
  return 'NEUTRAL';
}

function countHostileNeighborSystems(
  systemId: string,
  side: TerritorialHoldSide,
  holds: Readonly<Record<string, PlanetClanHold>>,
): number {
  if (side === 'NEUTRAL') return 0;
  const adjacent = listAdjacentSystemIds(systemId);
  let count = 0;
  for (const adjSystemId of adjacent) {
    const adjSide = resolveSystemPrimarySide(adjSystemId, holds);
    if (adjSide === 'NEUTRAL') continue;
    const relation = getFactionRelation(
      side as PoliticalFactionToken,
      adjSide as PoliticalFactionToken,
    );
    if (relation.relation === 'hostile') count += 1;
  }
  return count;
}

function resolvePosture(hostileNeighborCount: number, friendlySupplyCount: number): FrontPosture {
  const policy = getArcCoreFrontPressurePolicy();
  if (hostileNeighborCount >= policy.hostileNeighborMinAggressive) return 'aggressive';
  if (hostileNeighborCount === 0 && friendlySupplyCount > 0) return 'defensive';
  return 'normal';
}

/** 성계 1곳 재계산 — holds invalidate 또는 캐시 miss 시에만 호출(틱당 호출 금지) */
export function recomputeFrontPressureForSystem(
  systemId: string,
  holds: Readonly<Record<string, PlanetClanHold>>,
): FrontPressureSnapshot {
  const policy = getArcCoreFrontPressurePolicy();
  const side = resolveSystemPrimarySide(systemId, holds);
  const hostileNeighborCount = countHostileNeighborSystems(systemId, side, holds);
  const friendlySupplyCount =
    side === 'NEUTRAL'
      ? 0
      : countAdjacentFriendlySystems({ systemId, side: side as PoliticalFactionToken, holds });
  const posture = resolvePosture(hostileNeighborCount, friendlySupplyCount);
  const battlesPerInterval =
    posture === 'aggressive' ? policy.battlesPerIntervalAggressive : policy.battlesPerIntervalNormal;
  const snapshot: FrontPressureSnapshot = {
    systemId,
    side,
    hostileNeighborCount,
    friendlySupplyCount,
    flanked: hostileNeighborCount >= policy.hostileNeighborMinFlanked,
    posture,
    battlesPerInterval,
    computedAtMs: Date.now(),
  };
  cache.set(systemId, snapshot);
  return snapshot;
}

/**
 * 캐시 히트 우선 — miss·TTL 만료 시에만 재계산(해당 systemId만).
 * holds는 호출부(이미 warStore.planetHolds를 들고 있는 territorial pass)가 넘긴다 —
 * 이 모듈이 zustand 스토어를 직접 import하지 않아야 Node/tsx 테스트에서 RN 트랜스파일
 * 에러 없이 순수 로직만 단위 테스트할 수 있다(territorialSupplyLine.ts와 동일 원칙).
 */
export function getFrontPressure(
  systemId: string,
  holds: Readonly<Record<string, PlanetClanHold>>,
): FrontPressureSnapshot {
  const cached = cache.get(systemId);
  if (cached && Date.now() - cached.computedAtMs < FRONT_PRESSURE_CACHE_TTL_MS) {
    return cached;
  }
  return recomputeFrontPressureForSystem(systemId, holds);
}

/** holds 변경 시 호출 — 변경된 systemId(+인접) 만 무효화. 인자 생략 시 전체(테스트/리셋 전용, 런타임 미사용). */
export function invalidateFrontPressure(systemIds?: readonly string[]): void {
  if (!systemIds) {
    cache.clear();
    return;
  }
  for (const id of systemIds) cache.delete(id);
}

/** aggressive posture 시 방어측 보급 배율에 소폭 가산 — 기존 supplyBonusCapPct 캡 내에서만(초과 금지) */
export function applyFrontPressureSupplyBonus(
  supply: TerritorialSupplyContext,
  systemId: string,
  supplyBonusCapPct: number,
  holds: Readonly<Record<string, PlanetClanHold>>,
): TerritorialSupplyContext {
  const front = getFrontPressure(systemId, holds);
  if (front.posture !== 'aggressive') return supply;
  const policy = getArcCoreFrontPressurePolicy();
  const ceiling = 1 + supplyBonusCapPct / 100;
  const boosted = Math.min(supply.defender.powerMul * policy.supplyBonusMulAggressive, ceiling);
  return {
    ...supply,
    defender: { ...supply.defender, powerMul: boosted },
  };
}

/** aggressive posture 시 battle 판정 가중치에 소폭 가산(CSV 상한값 그대로 더함) */
export function resolveFrontPressureBattleWeightPct(
  systemId: string,
  baseBattleWeightPct: number,
  holds: Readonly<Record<string, PlanetClanHold>>,
): number {
  const front = getFrontPressure(systemId, holds);
  if (front.posture !== 'aggressive') return baseBattleWeightPct;
  const policy = getArcCoreFrontPressurePolicy();
  return baseBattleWeightPct + policy.battleWeightBonusPctAggressive;
}
