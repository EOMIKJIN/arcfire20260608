import { PLANET_MAIN_ORBIT_SCENE_SIZE } from '../stages/planetMainStageLayout';

/** world object mark·요격 연출 공통 궤도 주기(ms) */
export const WORLD_OBJECT_ORBIT_CYCLE_MS = 168_000;
/** 방위위성 — 동일 궤도 반경, 회전 2배 느림 */
export const WORLD_OBJECT_DEFENSE_SATELLITE_ORBIT_CYCLE_MS = WORLD_OBJECT_ORBIT_CYCLE_MS * 2;

/** `query.ts` 소행성 최내곽 — `0.58 + i * 0.035` 의 i=0 */
export const WORLD_OBJECT_ASTEROID_INNER_RADIUS_SCALE = 0.58;

/** 행성 도트(120px) 림 — ORBIT_SCENE/2 대비 */
export const WORLD_OBJECT_PLANET_RIM_RADIUS_SCALE =
  (120 / 2) / (PLANET_MAIN_ORBIT_SCENE_SIZE / 2);

/**
 * 방위위성 밴드: 중심 행성 바깥 · 소행성 궤도 안쪽.
 * planet mark clamp(0.5)와 소행성 내곽(0.58) 사이.
 */
export const WORLD_OBJECT_DEFENSE_SATELLITE_RADIUS_SCALE_MIN = 0.5;
export const WORLD_OBJECT_DEFENSE_SATELLITE_RADIUS_SCALE_MAX =
  WORLD_OBJECT_ASTEROID_INNER_RADIUS_SCALE - 0.03;

export const WORLD_OBJECT_ORBIT_RADIUS_SCALE_CLAMP_MIN = 0.5;
export const WORLD_OBJECT_ORBIT_RADIUS_SCALE_CLAMP_MAX = 0.96;

export function clampWorldObjectRadiusScale(radiusScale: number): number {
  return Math.max(
    WORLD_OBJECT_ORBIT_RADIUS_SCALE_CLAMP_MIN,
    Math.min(WORLD_OBJECT_ORBIT_RADIUS_SCALE_CLAMP_MAX, radiusScale),
  );
}

export function clampDefenseSatelliteRadiusScale(radiusScale: number): number {
  return Math.max(
    WORLD_OBJECT_DEFENSE_SATELLITE_RADIUS_SCALE_MIN,
    Math.min(WORLD_OBJECT_DEFENSE_SATELLITE_RADIUS_SCALE_MAX, radiusScale),
  );
}

export function resolveWorldObjectOrbitRadiusPx(
  orbitSize: number,
  radiusScale: number,
): number {
  const center = orbitSize / 2;
  return center * clampWorldObjectRadiusScale(radiusScale);
}

/** planet world object mark·요격 발사점 — 동일 궤도식 */
export function resolveWorldObjectOrbitXY(
  orbitSize: number,
  radiusScale: number,
  phaseBias: number,
  orbitClockMs: number,
  cycleMs: number = WORLD_OBJECT_ORBIT_CYCLE_MS,
): { x: number; y: number } {
  const center = orbitSize / 2;
  const phase = ((orbitClockMs % cycleMs) / cycleMs + phaseBias) % 1;
  const angle = phase * Math.PI * 2;
  const orbitRadius = resolveWorldObjectOrbitRadiusPx(orbitSize, radiusScale);
  return {
    x: center + Math.cos(angle) * orbitRadius,
    y: center + Math.sin(angle) * orbitRadius,
  };
}

/** 방위위성 전용 — `WORLD_OBJECT_DEFENSE_SATELLITE_ORBIT_CYCLE_MS` */
export function resolveDefenseSatelliteOrbitXY(
  orbitSize: number,
  radiusScale: number,
  phaseBias: number,
  orbitClockMs: number,
): { x: number; y: number } {
  return resolveWorldObjectOrbitXY(
    orbitSize,
    radiusScale,
    phaseBias,
    orbitClockMs,
    WORLD_OBJECT_DEFENSE_SATELLITE_ORBIT_CYCLE_MS,
  );
}
