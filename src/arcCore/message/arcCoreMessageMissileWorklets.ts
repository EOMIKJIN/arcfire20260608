import { Skia } from '@shopify/react-native-skia';
import type { ArcCoreMessageMissileBezier } from './arcCoreMessageMissileGeometry';

export const ARC_MSG_BEZIER_FLAT_LEN = 6;
export const ARC_CORE_MISSILE_TRAIL_WINDOW_U = 0.72;
export const ARC_CORE_MISSILE_TRAIL_SAMPLES = 5;

/** 꼬리·탄두 그라데이션 — 보라(꼬리) → 마젠타 → 빨강(탄두) */
export const ARC_CORE_MISSILE_TRAIL_GRADIENT_COLORS = [
  'rgba(168, 108, 255, 0.38)',
  'rgba(228, 92, 168, 0.58)',
  'rgba(255, 48, 58, 0.9)',
] as const;

export const ARC_CORE_MISSILE_TRAIL_GRADIENT_POSITIONS = [0, 0.52, 1] as const;

export const ARC_CORE_MISSILE_WARHEAD_GRADIENT_COLORS = [
  '#FF1A1A',
  '#FF3D52',
  'rgba(210, 88, 195, 0.42)',
] as const;

export const ARC_CORE_MISSILE_WARHEAD_GRADIENT_POSITIONS = [0, 0.58, 1] as const;

/** Reanimated derived 간 공유 — 숫자 배열만 사용(worklet 직렬화·호출 안전) */
export const ARC_CORE_MSG_VIS_PACK_LEN = 7;
export const ARC_CORE_MSG_VIS_IDX = {
  alive: 0,
  uHead: 1,
  uTail: 2,
  warheadU: 3,
  warheadShown: 4,
  lifeOpacity: 5,
  inFlight: 6,
} as const;

/**
 * 탄두·꼬리·닷지 공통 시각 상태 — worklet 단일 함수(내부 호출 없음).
 * - 비행 중: 꼬리 머리 = 탄두 u (혜성 꼬리)
 * - 화면 이탈(uExit) 이후: 꼬리 구간 고정 + lifeOpacity 페이드
 */
export function packArcCoreMessageMissileVisualSnapshot(
  active: number,
  clockMs: number,
  startMs: number,
  travelMs: number,
  fadeMs: number,
  uEnter: number,
  uExit: number,
): number[] {
  'worklet';
  if (!active) return [0, 0, 0, 0, 0, 0, 0];

  const tSince = clockMs - startMs;
  const windowU = ARC_CORE_MISSILE_TRAIL_WINDOW_U;
  const uEnterClamped = Math.min(1, Math.max(0, uEnter));
  const uExitClamped = Math.min(1, Math.max(uEnterClamped, uExit));
  const travelClamped = Math.max(1, travelMs);
  const tExit = travelClamped * uExitClamped;
  const lifeEnd = travelClamped + fadeMs;

  if (tSince < 0 || tSince >= lifeEnd) {
    return [0, 0, 0, 0, 0, 0, 0];
  }

  const u = Math.min(1, tSince / travelClamped);
  const pastExit = u >= uExitClamped;
  const beforeEnter = u < uEnterClamped;

  let lifeOpacity = 1;
  if (pastExit) {
    const fadeEnd = Math.min(tExit + fadeMs, lifeEnd);
    lifeOpacity = Math.max(0, 1 - (tSince - tExit) / Math.max(1, fadeEnd - tExit));
  }

  const warheadShown = !beforeEnter && !pastExit;
  let uHead: number;
  let uTail: number;

  if (!pastExit) {
    uHead = u;
    uTail = Math.max(0, uHead - windowU);
  } else {
    uHead = uExitClamped;
    uTail = Math.max(0, uExitClamped - windowU);
  }

  const warheadU = warheadShown ? u : Math.min(u, uExitClamped);
  const inFlight = tSince < travelClamped && !pastExit && !beforeEnter;

  return [
    1,
    uHead,
    uTail,
    warheadU,
    warheadShown ? 1 : 0,
    lifeOpacity,
    inFlight ? 1 : 0,
  ];
}

export function packArcCoreMessageBezierFlat(bezier: ArcCoreMessageMissileBezier): number[] {
  return [bezier.p0.x, bezier.p0.y, bezier.p1.x, bezier.p1.y, bezier.p2.x, bezier.p2.y];
}

export function arcCoreMessageBezierPointFlat(flat: number[], t: number): { x: number; y: number } {
  'worklet';
  const u = 1 - t;
  const p0x = flat[0] ?? 0;
  const p0y = flat[1] ?? 0;
  const p1x = flat[2] ?? 0;
  const p1y = flat[3] ?? 0;
  const p2x = flat[4] ?? 0;
  const p2y = flat[5] ?? 0;
  return {
    x: u * u * p0x + 2 * u * t * p1x + t * t * p2x,
    y: u * u * p0y + 2 * u * t * p1y + t * t * p2y,
  };
}

export function arcCoreMessageBezierTangentFlat(flat: number[], t: number): number {
  'worklet';
  const u = 1 - t;
  const p0x = flat[0] ?? 0;
  const p0y = flat[1] ?? 0;
  const p1x = flat[2] ?? 0;
  const p1y = flat[3] ?? 0;
  const p2x = flat[4] ?? 0;
  const p2y = flat[5] ?? 0;
  const vx = 2 * u * (p1x - p0x) + 2 * t * (p2x - p1x);
  const vy = 2 * u * (p1y - p0y) + 2 * t * (p2y - p1y);
  if (!Number.isFinite(vx) || !Number.isFinite(vy) || Math.hypot(vx, vy) < 1e-9) {
    return Math.atan2(p2y - p0y, p2x - p0x);
  }
  return Math.atan2(vy, vx);
}

export function arcCoreMessageScrapeIntensity(u: number, uClosest: number): number {
  'worklet';
  return Math.max(0, 1 - Math.abs(u - uClosest) / 0.09);
}

/** 닷지 광원 깜박임 — UI 스레드 전용(React setState 없음) */
export function arcCoreMessageDodgeBlinkPulse(timeMs: number, hz = 8): number {
  'worklet';
  const phase = timeMs * 0.001 * hz * Math.PI * 2;
  return 0.25 + 0.75 * Math.abs(Math.sin(phase));
}

export function buildArcCoreMessageTrailPathSkia(
  path: ReturnType<typeof Skia.Path.Make>,
  flat: number[],
  uTail: number,
  uHead: number,
): void {
  'worklet';
  path.reset();
  const span = uHead - uTail;
  if (span < 0.01) return;
  const q0 = arcCoreMessageBezierPointFlat(flat, uTail);
  path.moveTo(q0.x, q0.y);
  const n = Math.min(28, Math.max(2, Math.ceil(8 + 20 * span)));
  for (let k = 1; k <= n; k += 1) {
    const tt = uTail + (k / n) * span;
    const q = arcCoreMessageBezierPointFlat(flat, tt);
    path.lineTo(q.x, q.y);
  }
}
