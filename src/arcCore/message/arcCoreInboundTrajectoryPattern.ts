// ============================================================
// 아크코어 장거리 미사일 — inbound 궤도 패턴(선판정, 메타만)
// 요격 발사 각도·시계 구간 제한 없음 — predict/engagement/collision 축만 사용
// ============================================================

import { PLANET_MAIN_ORBIT_SCENE_SIZE } from '../../stages/planetMainStageLayout';
import {
  buildArcCoreMessageMissileBezier,
  resolveArcCoreMessageClosestApproach,
} from './arcCoreMessageMissileGeometry';

export type ArcCoreInboundTrajectoryPattern =
  | 'top_miss'
  | 'center_strike'
  | 'bottom_miss';

const PLANET_RIM_RADIUS_RATIO = (120 / 2) / (PLANET_MAIN_ORBIT_SCENE_SIZE / 2);

/**
 * inbound 궤도 패턴 선판정(연출·명령 메타).
 * - 명시값(`trajectoryPattern` 명령) 우선
 * - 현행 단일 베지어는 상단 스침(top_miss) 고정
 */
export function resolveArcCoreInboundTrajectoryPattern(input?: {
  orbitSize?: number;
  explicitPattern?: ArcCoreInboundTrajectoryPattern | null;
}): ArcCoreInboundTrajectoryPattern {
  if (input?.explicitPattern) return input.explicitPattern;
  return 'top_miss';
}

/** 추후 전용 베지어 도입 시 기하 자동분류(현재 미사용) */
export function inferArcCoreInboundTrajectoryPatternFromBezier(
  orbitSize: number = PLANET_MAIN_ORBIT_SCENE_SIZE,
): ArcCoreInboundTrajectoryPattern {
  const center = { x: orbitSize / 2, y: orbitSize / 2 };
  const rim = orbitSize * PLANET_RIM_RADIUS_RATIO;
  const bezier = buildArcCoreMessageMissileBezier(orbitSize);
  const closest = resolveArcCoreMessageClosestApproach(bezier, center);
  const dy = closest.point.y - center.y;
  if (closest.distancePx <= rim * 0.42) return 'center_strike';
  if (dy > rim * 0.12) return 'bottom_miss';
  return 'top_miss';
}
