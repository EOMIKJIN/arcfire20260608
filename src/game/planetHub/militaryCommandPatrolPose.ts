// ============================================================
// 사령부 순찰 — 선회 후 감속 소멸 · 수초 대기 · 사출 (원점 관통 없음)
// 도트 파라미터는 모듈 1회 계산. worklet은 숫자만 닫는다.
// ============================================================

export const MILITARY_COMMAND_PATROL_DOT_COUNT = 6;
export const MILITARY_COMMAND_PATROL_INNER_RX = 32;
export const MILITARY_COMMAND_PATROL_INNER_RY = 24;
export const MILITARY_COMMAND_PATROL_OUTER_RX = 48;
export const MILITARY_COMMAND_PATROL_OUTER_RY = 36;
export const MILITARY_COMMAND_PATROL_CYCLE_MS = 16_000;
export const MILITARY_COMMAND_PATROL_DOCK_MS = 2_800;
export const MILITARY_COMMAND_PATROL_LAUNCH_MS = 1_000;
export const MILITARY_COMMAND_PATROL_RETURN_MS = 1_600;
export const MILITARY_COMMAND_PATROL_EXIT_PX = 16;
export const MILITARY_COMMAND_PATROL_WOBBLE = 0.22;
export const MILITARY_COMMAND_PATROL_CYCLE_MUL = [0.68, 0.8, 0.93, 1.07, 1.22, 1.4] as const;

const PATROL_OVERHEAD_MS =
  MILITARY_COMMAND_PATROL_DOCK_MS
  + MILITARY_COMMAND_PATROL_LAUNCH_MS
  + MILITARY_COMMAND_PATROL_RETURN_MS;

export type MilitaryCommandPatrolDotParams = {
  cycleMs: number;
  patrolMs: number;
  phase: number;
  dir: number;
  rx: number;
  ry: number;
  homeAng: number;
};

export function resolveMilitaryCommandPatrolCycleMs(index: number): number {
  const mul = MILITARY_COMMAND_PATROL_CYCLE_MUL[index] ?? 1;
  return Math.max(PATROL_OVERHEAD_MS + 4_000, Math.round(MILITARY_COMMAND_PATROL_CYCLE_MS * mul));
}

function buildPatrolDotParams(index: number): MilitaryCommandPatrolDotParams {
  const i = index | 0;
  const ring = i < 3 ? 0 : 1;
  const slot = i < 3 ? i : i - 3;
  const cycleMs = resolveMilitaryCommandPatrolCycleMs(i);
  const scale = 0.84 + slot * 0.08;
  const dir = ring === 1 ? -1 : 1;
  return {
    cycleMs,
    patrolMs: Math.max(1, cycleMs - PATROL_OVERHEAD_MS),
    phase: slot / 3 + (ring === 1 ? 1 / 6 : 0),
    dir,
    rx: (ring === 0 ? MILITARY_COMMAND_PATROL_INNER_RX : MILITARY_COMMAND_PATROL_OUTER_RX) * scale,
    ry: (ring === 0 ? MILITARY_COMMAND_PATROL_INNER_RY : MILITARY_COMMAND_PATROL_OUTER_RY) * scale,
    homeAng: (slot * ((Math.PI * 2) / 3) + ring * 0.7) * dir,
  };
}

export const MILITARY_COMMAND_PATROL_DOT_PARAMS: readonly MilitaryCommandPatrolDotParams[] = [
  buildPatrolDotParams(0),
  buildPatrolDotParams(1),
  buildPatrolDotParams(2),
  buildPatrolDotParams(3),
  buildPatrolDotParams(4),
  buildPatrolDotParams(5),
];

export type MilitaryCommandPatrolPose = {
  x: number;
  y: number;
  opacity: number;
};

export function resolveMilitaryCommandPatrolPose(
  index: number,
  orbitClockMs: number,
  cycleMs?: number,
): MilitaryCommandPatrolPose {
  const p = MILITARY_COMMAND_PATROL_DOT_PARAMS[index | 0] ?? MILITARY_COMMAND_PATROL_DOT_PARAMS[0]!;
  const cycle = cycleMs && cycleMs > 1 ? cycleMs : p.cycleMs;
  const patrol = cycle === p.cycleMs ? p.patrolMs : Math.max(1, cycle - PATROL_OVERHEAD_MS);
  const now = orbitClockMs < 0 ? 0 : orbitClockMs;
  const dock = MILITARY_COMMAND_PATROL_DOCK_MS;
  const launch = MILITARY_COMMAND_PATROL_LAUNCH_MS;
  const ret = MILITARY_COMMAND_PATROL_RETURN_MS;
  const exitPx = MILITARY_COMMAND_PATROL_EXIT_PX;
  const wobble = MILITARY_COMMAND_PATROL_WOBBLE;
  let local = (now + p.phase * cycle) % cycle;
  if (local < 0) local += cycle;
  const homeAng = p.homeAng;
  const rx = p.rx;
  const ry = p.ry;
  const dir = p.dir;

  if (local < dock) {
    return { x: 0, y: 0, opacity: 0 };
  }
  if (local < dock + launch) {
    const t = (local - dock) / launch;
    const e = 1 - (1 - t) * (1 - t) * (1 - t);
    const ox = Math.cos(homeAng) * rx;
    const oy = Math.sin(homeAng) * ry + Math.sin(2 * homeAng) * wobble * ry;
    const gx = Math.cos(homeAng) * exitPx;
    const gy = Math.sin(homeAng) * exitPx;
    return {
      x: gx + e * (ox - gx),
      y: gy + e * (oy - gy),
      opacity: e,
    };
  }
  if (local < dock + launch + patrol) {
    const t = (local - dock - launch) / patrol;
    const ang = homeAng + dir * t * Math.PI * 2;
    return {
      x: Math.cos(ang) * rx,
      y: Math.sin(ang) * ry + Math.sin(2 * ang) * wobble * ry,
      opacity: 1,
    };
  }
  const t = (local - dock - launch - patrol) / ret;
  const e = t * t;
  const s = 1 - e;
  const ox = Math.cos(homeAng) * rx;
  const oy = Math.sin(homeAng) * ry + Math.sin(2 * homeAng) * wobble * ry;
  const gx = Math.cos(homeAng) * exitPx;
  const gy = Math.sin(homeAng) * exitPx;
  return {
    x: gx + s * (ox - gx),
    y: gy + s * (oy - gy),
    opacity: 1 - e,
  };
}
