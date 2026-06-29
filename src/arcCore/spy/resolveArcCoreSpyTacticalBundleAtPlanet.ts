// ============================================================
// 행성 활성 스파이 — 역할별 전술 modifier 집계 (드론·백도어 연동)
// ============================================================

import type { ArcNpcTrafficShip } from '../../store/arcNpcTrafficStore';
import { resolveArcCoreSpyPolicy } from './arcCoreSpyPolicy';
import { listActiveArcCoreSpyCaptainIdsAtPlanet } from './listActiveArcCoreSpiesAtPlanet';
import { resolveArcCoreSpyCaptainAssignment } from './resolveArcCoreSpyCaptainAssignment';

export type ArcCoreSpyTacticalBundle = {
  activeSpyCount: number;
  backdoorSpyCount: number;
  droneGuidanceSpyCount: number;
  /** 백도어 T 펄스 intensity 가산 배율(역할·프로필 합) */
  backdoorPulseIntensityMul: number;
  /** 방위위성 요격 명중률 감소(%p, 스파이 누적) */
  droneGuidanceAccuracyPenaltyPct: number;
  /** inbound 드론 impact intensity 배율 */
  droneStrikeDamageMul: number;
  /** 최소 strike leak 상향(%p → leak fraction) */
  droneLeakBoostPct: number;
  /** 정보원 알림 가중(프로필 intel_notify_weight 평균) */
  intelNotifyWeightAvg: number;
};

const EMPTY: ArcCoreSpyTacticalBundle = {
  activeSpyCount: 0,
  backdoorSpyCount: 0,
  droneGuidanceSpyCount: 0,
  backdoorPulseIntensityMul: 0,
  droneGuidanceAccuracyPenaltyPct: 0,
  droneStrikeDamageMul: 1,
  droneLeakBoostPct: 0,
  intelNotifyWeightAvg: 1,
};

/**
 * zero/low-allocation — tick·spawn edge 에만 호출.
 */
export function resolveArcCoreSpyTacticalBundleAtPlanet(
  planetId: string,
  arcShips: readonly ArcNpcTrafficShip[] = [],
): ArcCoreSpyTacticalBundle {
  const policy = resolveArcCoreSpyPolicy();
  if (!policy.enabled) return EMPTY;

  const spyIds = listActiveArcCoreSpyCaptainIdsAtPlanet(planetId, arcShips);
  if (spyIds.length === 0) return EMPTY;

  let backdoorSpyCount = 0;
  let droneGuidanceSpyCount = 0;
  let backdoorPulseIntensityMul = 0;
  let droneGuidanceAccuracyPenaltyPct = 0;
  let droneStrikeDamageMul = 1;
  let droneLeakBoostPct = 0;
  let intelWeightSum = 0;

  for (let i = 0; i < spyIds.length; i += 1) {
    const assignment = resolveArcCoreSpyCaptainAssignment(spyIds[i]!);
    const p = assignment.profile;
    intelWeightSum += p.intelNotifyWeight;

    if (assignment.roleId === 'backdoor_tech_terror') {
      backdoorSpyCount += 1;
      backdoorPulseIntensityMul += p.backdoorPulseMul;
    } else {
      droneGuidanceSpyCount += 1;
      if (policy.spyDroneLinkEnabled) {
        droneGuidanceAccuracyPenaltyPct += p.droneGuidanceAccuracyPct;
        droneStrikeDamageMul *= p.droneStrikeDamageMul;
        droneLeakBoostPct += p.droneLeakBoostPct;
      }
    }
  }

  return {
    activeSpyCount: spyIds.length,
    backdoorSpyCount,
    droneGuidanceSpyCount,
    backdoorPulseIntensityMul: Math.max(0, backdoorPulseIntensityMul),
    droneGuidanceAccuracyPenaltyPct: Math.min(50, droneGuidanceAccuracyPenaltyPct),
    droneStrikeDamageMul: Math.max(1, Math.min(4, droneStrikeDamageMul)),
    droneLeakBoostPct: Math.min(40, droneLeakBoostPct),
    intelNotifyWeightAvg: intelWeightSum / spyIds.length,
  };
}
