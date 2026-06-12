// ============================================================
// 아크코어 장거리 미사일 — 궤도 패턴(선판정) × 방위위성 시계 요격 구간
// ----------------------------------------------------------------------
// 패턴 3종(추후 베지어·명령으로 확정) — inbound 1회 선판정 후 요격 스케줄에 고정.
// 시계: 12시=정상, 시계방향 증가(3·6·9). 화면 y↓, 행성 중심 기준.
//
// | 패턴           | 아크코어 연출 의도        | 요격 허용(시계방향) | 요격 금지      |
// |----------------|---------------------------|---------------------|----------------|
// | top_miss       | 상단 스침·불발(현행)      | 3시 → 9시           | 9시 → 3시      |
// | center_strike  | 우상→행성 중심 명중(추후) | 5시 → 11시          | 11시 → 5시     |
// | bottom_miss    | 하단 스침·불발(추후)      | 9시 → 3시           | 3시 → 9시      |
//
// 최종 명중·파괴는 방위위성 레벨 롤. 본 모듈은 발사 각도·스케줄만 담당.
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

type PatternClockAllowArc = {
  allowStartHour: number;
  allowEndHour: number;
};

const PATTERN_CLOCK_ALLOW: Record<ArcCoreInboundTrajectoryPattern, PatternClockAllowArc> = {
  top_miss: { allowStartHour: 3, allowEndHour: 9 },
  center_strike: { allowStartHour: 5, allowEndHour: 11 },
  bottom_miss: { allowStartHour: 9, allowEndHour: 3 },
};

const PLANET_RIM_RADIUS_RATIO = (120 / 2) / (PLANET_MAIN_ORBIT_SCENE_SIZE / 2);

function normalizeClockHour(hour: number): number {
  let h = hour % 12;
  if (h < 0) h += 12;
  return h;
}

/** atan2(dy,dx) → 시계 시각(0..12, 12=정12시) */
export function mathAngleToClockHour(angleRad: number): number {
  return normalizeClockHour((angleRad + Math.PI / 2) * (6 / Math.PI));
}

/** 시계방향 호 [start, end] 포함(양끝 경계 포함) */
export function isClockHourInAllowArc(
  hour: number,
  startHour: number,
  endHour: number,
): boolean {
  const h = normalizeClockHour(hour);
  const a = normalizeClockHour(startHour);
  const b = normalizeClockHour(endHour);
  if (Math.abs(a - b) < 1e-6) return false;
  if (a <= b) return h >= a && h <= b;
  return h >= a || h <= b;
}

export function resolveDefenseClockAllowArc(
  pattern: ArcCoreInboundTrajectoryPattern,
): PatternClockAllowArc {
  return PATTERN_CLOCK_ALLOW[pattern];
}

/** 방위위성 궤도 위치 — 패턴별 요격 허용 시계 호 여부 */
export function isDefenseSatelliteInAllowedClockSector(
  launchX: number,
  launchY: number,
  pattern: ArcCoreInboundTrajectoryPattern,
  orbitSize: number = PLANET_MAIN_ORBIT_SCENE_SIZE,
): boolean {
  const cy = orbitSize / 2;
  // top_miss / bottom_miss — 궤도식(cos/sin)과 동일한 반원(적도 포함). 시계 0=12시·3/9시 경계 중복 방지.
  if (pattern === 'top_miss') {
    return launchY >= cy - 1e-4;
  }
  if (pattern === 'bottom_miss') {
    return launchY <= cy + 1e-4;
  }
  const cx = orbitSize / 2;
  const hour = mathAngleToClockHour(Math.atan2(launchY - cy, launchX - cx));
  const { allowStartHour, allowEndHour } = PATTERN_CLOCK_ALLOW[pattern];
  return isClockHourInAllowArc(hour, allowStartHour, allowEndHour);
}

/**
 * inbound 궤도 패턴 선판정.
 * - 명시값(`trajectoryPattern` 명령) 우선
 * - 현행 단일 베지어는 상단 스침(top_miss) 고정 — 기하 자동분류는 전용 궤도·명령 도입 후 사용
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
