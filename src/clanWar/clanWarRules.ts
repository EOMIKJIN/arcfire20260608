// ============================================================
// 클랜전 기반 규칙(순수 함수) — v1 로컬 클라이언트
// ============================================================

import type { PlanetCapitalDeployment, PlanetClanHold } from '../types';

/** 한 행성 궤도·방공 슬롯 상한(임시, NPC 기함 슬롯 상한과 개념 정렬) */
export const CLAN_WAR_MAX_CAPITAL_DEPLOYMENTS_PER_PLANET = 4;

export function soloClanIdForUid(uid: string): string {
  return `solo_clan_${uid}`;
}

export function isNeutralHold(hold: PlanetClanHold | undefined): boolean {
  return !hold || hold.kind === 'neutral';
}

export function countDeploymentsOnPlanet(
  deployments: readonly PlanetCapitalDeployment[],
  planetId: string,
): number {
  return deployments.filter((d) => d.planetId === planetId).length;
}

export function canDeployCapitalAtPlanet(
  hold: PlanetClanHold | undefined,
  clanId: string,
  deployments: readonly PlanetCapitalDeployment[],
  planetId: string,
): boolean {
  if (!hold || hold.kind === 'neutral') return false;
  if (hold.occupierClanId !== clanId) return false;
  return countDeploymentsOnPlanet(deployments, planetId) < CLAN_WAR_MAX_CAPITAL_DEPLOYMENTS_PER_PLANET;
}

/** 거점 선언: 비어 있거나 동일 클랜 점유일 때만(타 클랜 점유 행성은 전쟁 선포 후로 미룸) */
export function canClaimAsHomePlanet(hold: PlanetClanHold | undefined, clanId: string): boolean {
  if (!hold || hold.kind === 'neutral') return true;
  return hold.occupierClanId === clanId;
}
