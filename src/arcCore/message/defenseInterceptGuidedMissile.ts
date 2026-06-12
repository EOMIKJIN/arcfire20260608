// ============================================================
// 방위위성 요격미사일 — 예측 조준·직진(화면 밖 exit) · 근접 교차 판정
// ============================================================

import {
  buildArcCoreMessageMissileBezier,
  quadBezierPoint,
  resolveArcCoreMessageMissileViewportURange,
} from './arcCoreMessageMissileGeometry';

export {
  DEFENSE_INTERCEPT_MISS_AIM_OFFSET_PX,
  DEFENSE_INTERCEPT_VISUAL_SPEED_PX_PER_MS,
  DEFENSE_INTERCEPT_VISUAL_TRAVEL_MS_MIN,
  DEFENSE_INTERCEPT_VISUAL_TRAVEL_MS_MAX,
} from './defenseInterceptConstants';

export const DEFENSE_INTERCEPT_GUIDED_MISSILE_TRAIL_FADE_MS = 700;
export const DEFENSE_INTERCEPT_GUIDED_MISSILE_TRAIL_WINDOW_U = 0.55;
/** 꼬리→탄두 방향 밴드 수(스트로크만 증가, 산술만 추가) */
export const DEFENSE_INTERCEPT_GUIDED_MISSILE_TRAIL_BANDS = 3;
export const DEFENSE_INTERCEPT_HIT_RADIUS_PX = 26;

/** 예측 조준 후 직진 — p0→exit, aim은 교차 판정용 */
export type DefenseInterceptGuidedMissile = {
  id: number;
  slotIndex: number;
  startMs: number;
  travelMs: number;
  p0: { x: number; y: number };
  exitX: number;
  exitY: number;
  aimX: number;
  aimY: number;
  tangentRad: number;
  hitApplied: boolean;
  willHit: boolean;
  missileWeaponId: string;
  hitX: number;
  hitY: number;
  hitAtMs: number;
  /** aim 통과 u (0..1) — 교차 판정 */
  aimPassU: number;
  /** 교차 시점 롤 트리거 1회 */
  aimCrossedReported: boolean;
};

export type DefenseInterceptGuidedTickResult = {
  primaryHitRelativeMs: number | null;
  hitX: number;
  hitY: number;
  primaryAimCrossed: boolean;
  aimCrossRelativeMs: number | null;
  aimCrossX: number;
  aimCrossY: number;
};

export function resolveArcCoreInboundWarheadPoint(
  clockMs: number,
  inboundStartMs: number,
  travelMs: number,
  orbitSize: number,
): { x: number; y: number; u: number; visible: boolean } {
  const bezier = buildArcCoreMessageMissileBezier(orbitSize);
  const tSince = clockMs - inboundStartMs;
  if (tSince < 0) {
    return { x: bezier.p0.x, y: bezier.p0.y, u: 0, visible: false };
  }
  const travelClamped = Math.max(1, travelMs);
  const u = Math.min(1, tSince / travelClamped);
  const p = quadBezierPoint(bezier.p0, bezier.p1, bezier.p2, u);
  const { uEnter, uExit } = resolveArcCoreMessageMissileViewportURange(orbitSize);
  const visible = u >= uEnter && u < uExit;
  return { x: p.x, y: p.y, u, visible };
}

function lerpPt(
  a: { x: number; y: number },
  b: { x: number; y: number },
  t: number,
): { x: number; y: number } {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

export function resolveDefenseInterceptMissileLifeEndMs(m: DefenseInterceptGuidedMissile): number {
  return m.startMs + m.travelMs + DEFENSE_INTERCEPT_GUIDED_MISSILE_TRAIL_FADE_MS;
}

export function areDefenseInterceptGuidedMissilesAlive(
  missiles: DefenseInterceptGuidedMissile[],
  clockMs: number,
): boolean {
  for (const m of missiles) {
    if (clockMs < resolveDefenseInterceptMissileLifeEndMs(m)) return true;
  }
  return false;
}

export function resolveDefenseInterceptMissileHead(
  m: DefenseInterceptGuidedMissile,
  uFlight: number,
): { x: number; y: number } {
  const t = Math.min(1, Math.max(0, uFlight));
  return lerpPt(m.p0, { x: m.exitX, y: m.exitY }, t);
}

export function tickDefenseInterceptGuidedMissiles(
  missiles: DefenseInterceptGuidedMissile[],
  clockMs: number,
  inboundStartMs: number,
  travelMs: number,
  orbitSize: number,
): DefenseInterceptGuidedTickResult {
  let primaryHitRelativeMs: number | null = null;
  let hitX = 0;
  let hitY = 0;
  let primaryAimCrossed = false;
  let aimCrossRelativeMs: number | null = null;
  let aimCrossX = 0;
  let aimCrossY = 0;
  const warhead = resolveArcCoreInboundWarheadPoint(clockMs, inboundStartMs, travelMs, orbitSize);

  for (const m of missiles) {
    if (m.hitApplied) continue;
    if (clockMs < m.startMs) continue;

    const tSince = clockMs - m.startMs;
    const uFlight = Math.min(1, tSince / Math.max(1, m.travelMs));
    const head = resolveDefenseInterceptMissileHead(m, uFlight);

    if (m.slotIndex === 0 && !m.aimCrossedReported && uFlight >= m.aimPassU * 0.92) {
      m.aimCrossedReported = true;
      primaryAimCrossed = true;
      aimCrossRelativeMs = clockMs - inboundStartMs;
      aimCrossX = m.aimX;
      aimCrossY = m.aimY;
    }

    if (m.willHit && !m.hitApplied) {
      const passedAim = uFlight >= m.aimPassU * 0.92;
      const distToWarhead = Math.hypot(head.x - warhead.x, head.y - warhead.y);
      const distToAim = Math.hypot(head.x - m.aimX, head.y - m.aimY);
      const closeToPredicted = distToAim <= DEFENSE_INTERCEPT_HIT_RADIUS_PX * 1.2;
      const closeToWarhead = distToWarhead <= DEFENSE_INTERCEPT_HIT_RADIUS_PX;
      if (passedAim && (closeToPredicted || closeToWarhead)) {
        m.hitApplied = true;
        m.hitAtMs = clockMs;
        m.hitX = m.aimX;
        m.hitY = m.aimY;
        if (m.slotIndex === 0) {
          primaryHitRelativeMs = clockMs - inboundStartMs;
          hitX = m.aimX;
          hitY = m.aimY;
        }
      }
    }

    if (uFlight >= 1) {
      m.hitApplied = true;
      if (m.hitAtMs <= 0) {
        m.hitAtMs = clockMs;
        m.hitX = head.x;
        m.hitY = head.y;
      }
    }
  }

  return {
    primaryHitRelativeMs,
    hitX,
    hitY,
    primaryAimCrossed,
    aimCrossRelativeMs,
    aimCrossX,
    aimCrossY,
  };
}

export function resolveDefenseInterceptMissileRenderState(
  m: DefenseInterceptGuidedMissile,
  clockMs: number,
): {
  head: { x: number; y: number };
  uHead: number;
  uTail: number;
  headOpacity: number;
  trailOpacity: number;
  visible: boolean;
  explosionOpacity: number;
  tangentRad: number;
} {
  const tSince = clockMs - m.startMs;
  const lifeEnd = m.travelMs + DEFENSE_INTERCEPT_GUIDED_MISSILE_TRAIL_FADE_MS;
  if (tSince < 0 || tSince >= lifeEnd) {
    return {
      head: { x: m.p0.x, y: m.p0.y },
      uHead: 0,
      uTail: 0,
      headOpacity: 0,
      trailOpacity: 0,
      visible: false,
      explosionOpacity: 0,
      tangentRad: m.tangentRad,
    };
  }

  const uFlight = Math.min(1, tSince / Math.max(1, m.travelMs));
  const uHead = uFlight;
  const uTail = Math.max(0, uHead - DEFENSE_INTERCEPT_GUIDED_MISSILE_TRAIL_WINDOW_U);
  let headOpacity = 0.96;
  let trailOpacity = 0.82;
  let explosionOpacity = 0;

  if (tSince < m.travelMs) {
    const inFlightFade = 1 - Math.min(0.42, Math.pow(uFlight, 1.35) * 0.38);
    trailOpacity *= inFlightFade;
  }

  if (m.hitApplied && m.willHit && m.hitAtMs > 0 && tSince < m.travelMs) {
    const postHitT = clockMs - m.hitAtMs;
    const explT = Math.min(1, Math.max(0, postHitT / 520));
    explosionOpacity = Math.max(0, 1 - explT * 0.88);
  }

  if (tSince >= m.travelMs) {
    const fadeT = Math.min(1, (tSince - m.travelMs) / DEFENSE_INTERCEPT_GUIDED_MISSILE_TRAIL_FADE_MS);
    headOpacity = Math.max(0, 1 - fadeT);
    trailOpacity = Math.max(0, trailOpacity * (1 - fadeT));
  }

  const head = resolveDefenseInterceptMissileHead(m, uHead);
  return {
    head,
    uHead,
    uTail,
    headOpacity,
    trailOpacity,
    visible: headOpacity > 0.02 || trailOpacity > 0.02 || explosionOpacity > 0.02,
    explosionOpacity,
    tangentRad: m.tangentRad,
  };
}

export type DefenseInterceptMissileTrailBand = {
  u0: number;
  u1: number;
  /** 꼬리(오래된 구간)일수록 낮음 */
  opacityMul: number;
};

export function buildDefenseInterceptMissileTrailBands(
  uTail: number,
  uHead: number,
  bandCount: number = DEFENSE_INTERCEPT_GUIDED_MISSILE_TRAIL_BANDS,
): DefenseInterceptMissileTrailBand[] {
  const span = uHead - uTail;
  if (span < 0.004 || bandCount < 1) return [];
  const bands: DefenseInterceptMissileTrailBand[] = [];
  for (let b = 0; b < bandCount; b += 1) {
    const t0 = b / bandCount;
    const t1 = (b + 1) / bandCount;
    const mid = (t0 + t1) * 0.5;
    const opacityMul = 0.1 + mid * 0.9;
    bands.push({
      u0: uTail + span * t0,
      u1: uTail + span * t1,
      opacityMul,
    });
  }
  return bands;
}

export function buildDefenseInterceptMissileTrailPath(
  m: DefenseInterceptGuidedMissile,
  uTail: number,
  uHead: number,
): { x: number; y: number }[] {
  const span = uHead - uTail;
  if (span < 0.004) return [];
  const pts: { x: number; y: number }[] = [];
  const n = Math.max(2, Math.min(12, Math.ceil(6 + 10 * span)));
  for (let k = 0; k <= n; k += 1) {
    const t = uTail + (k / n) * span;
    pts.push(resolveDefenseInterceptMissileHead(m, t));
  }
  return pts;
}

export function writeDefenseInterceptMissileTrailPath(
  path: { reset: () => void; moveTo: (x: number, y: number) => void; lineTo: (x: number, y: number) => void },
  m: DefenseInterceptGuidedMissile,
  uTail: number,
  uHead: number,
  canvasPad: number,
): boolean {
  const span = uHead - uTail;
  if (span < 0.004) {
    path.reset();
    return false;
  }
  const n = Math.max(2, Math.min(8, Math.ceil(4 + 8 * span)));
  path.reset();
  for (let k = 0; k <= n; k += 1) {
    const t = uTail + (k / n) * span;
    const p = resolveDefenseInterceptMissileHead(m, t);
    const x = p.x + canvasPad;
    const y = p.y + canvasPad;
    if (k === 0) path.moveTo(x, y);
    else path.lineTo(x, y);
  }
  return true;
}
