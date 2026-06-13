import {
  getPlanetDefenseSatellitePolicy,
} from '../../arcCore/balance/planetDefenseSatellitePolicy';
import type { DefenseInterceptEngagementBlockReason } from '../../arcCore/message/defenseInterceptEngagement';
import { resolvePlanetWorldObjectContext } from '../../worldObjects/planetContext';
import { listPlanetWorldObjectsByKind } from '../../worldObjects/query';
import type { WorldObject } from '../../worldObjects';
import {
  resolvePlanetDefenseSatelliteInterceptChancePct,
  resolvePlanetDefenseSatelliteLevel,
} from './planetDefenseSatelliteLevel';
import {
  resolveDefenseSatelliteInterceptChanceForObject,
  resolveDefenseSatelliteLevelForObject,
} from './resolveDefenseSatelliteLevelForObject';

/** 행성 `planetId` 기준 방위위성 — 월드오브젝트 리스트 단일 경로 */
export function listPlanetDefenseSatellites(planetId: string): WorldObject[] {
  const ctx = resolvePlanetWorldObjectContext(planetId);
  if (!ctx) return [];
  return listPlanetWorldObjectsByKind(ctx.planetId, ctx.systemId, 'defense_satellite');
}

export type PlanetDefenseInterceptRollResult = {
  /** 방위위성 배치·활성 여부 */
  hasActiveSatellites: boolean;
  activeSatelliteCount: number;
  weaponId: string | null;
  defenseLevel: number;
  interceptChancePct: number;
  /** 연출 스케줄 성공 여부 — buildDefenseInterceptVisualPlan이 갱신 */
  engagementEligible: boolean;
  engagementBlockReason?: DefenseInterceptEngagementBlockReason | 'ok';
  /** 교차 시점 1회 롤 완료 여부 */
  rollAttempted: boolean;
  interceptSucceeded: boolean;
};

/** inbound 메타만 — 확률 롤은 교차 시점(arcCoreMessageStore.resolveInterceptRollAtCrossing) */
export function resolvePlanetDefenseInterceptRoll(
  planetId: string,
  _strikeId: string,
  _opts?: { travelMs?: number; orbitClockAtInboundMs?: number },
): PlanetDefenseInterceptRollResult {
  const policy = getPlanetDefenseSatellitePolicy();
  const planetFallbackLevel = resolvePlanetDefenseSatelliteLevel(planetId);
  const planetFallbackPct = resolvePlanetDefenseSatelliteInterceptChancePct(planetId);
  const empty: PlanetDefenseInterceptRollResult = {
    hasActiveSatellites: false,
    activeSatelliteCount: 0,
    weaponId: null,
    defenseLevel: planetFallbackLevel,
    interceptChancePct: planetFallbackPct,
    engagementEligible: false,
    rollAttempted: false,
    interceptSucceeded: false,
  };
  if (!policy.interceptEnabled) return empty;

  const satellites = listPlanetDefenseSatellites(planetId).filter(
    (o) => !o.state.depleted && o.state.hp !== 0,
  );
  if (satellites.length === 0) return empty;

  const weaponId = satellites.find((o) => o.defenseWeaponId)?.defenseWeaponId
    ?? policy.defaultWeaponId;

  const defenseLevels = satellites.map((sat) => resolveDefenseSatelliteLevelForObject(sat));
  const summaryDefenseLevel = Math.max(...defenseLevels);
  const interceptChances = satellites.map((sat) => resolveDefenseSatelliteInterceptChanceForObject(sat));
  const summaryInterceptChancePct = Math.max(...interceptChances);

  return {
    hasActiveSatellites: true,
    activeSatelliteCount: satellites.length,
    weaponId,
    defenseLevel: summaryDefenseLevel,
    interceptChancePct: summaryInterceptChancePct,
    engagementEligible: true,
    engagementBlockReason: 'ok',
    rollAttempted: false,
    interceptSucceeded: false,
  };
}

/** @deprecated resolvePlanetDefenseInterceptRoll 사용 */
export function resolvePlanetDefenseInterceptCapability(planetId: string): {
  eligible: boolean;
  activeSatelliteCount: number;
  weaponId: string | null;
} {
  const roll = resolvePlanetDefenseInterceptRoll(planetId, `${planetId}:capability_probe`);
  return {
    eligible: roll.hasActiveSatellites,
    activeSatelliteCount: roll.activeSatelliteCount,
    weaponId: roll.weaponId,
  };
}
