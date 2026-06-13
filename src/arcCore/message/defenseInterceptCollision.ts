// ============================================================
// 방위위성 요격 — inbound 탄두 vs 요격탄 충돌 (단일 판정 축)
// bezier mid-flight retarget 금지 → u≥trackStart 후 pure pursuit
// ============================================================

import type {
  DefenseInterceptGuidedMissile,
  DefenseInterceptHitResult,
  DefenseInterceptInboundContext,
  DefenseInterceptRollAtProximity,
} from './defenseInterceptTypes';
import {
  quadBezierPoint,
  resolveArcCoreInboundWarheadAtMs,
  resolveDefenseInterceptCollisionRadiusPx,
  isInboundWarheadCollisionEligible,
} from './arcCoreMessageMissileGeometry';
import {
  DEFENSE_INTERCEPT_PURSUIT_INTEGRATE_STEP_MS,
  DEFENSE_INTERCEPT_TRAIL_MAX_PAIRS,
  DEFENSE_INTERCEPT_TRAIL_MIN_STEP_PX,
  DEFENSE_INTERCEPT_VISUAL_IMPACT_RADIUS_PX,
  DEFENSE_INTERCEPT_VISUAL_SPEED_PX_PER_MS,
} from './defenseInterceptConstants';

const DEFENSE_INTERCEPT_MIN_ENGAGE_MS = 520;

/** 0 = 발사 직후 inbound warhead pure pursuit (bezier blind 구간 없음) */
export const DEFENSE_INTERCEPT_TRACK_INBOUND_START_U = 0;

export { DEFENSE_INTERCEPT_PRIMARY_PURSUIT_MS } from './defenseInterceptConstants';

/** pursuit 적분 스텝 — 작을수록 inbound 추적 궤적이 매끈 */
const PURSUIT_INTEGRATE_STEP_MS = DEFENSE_INTERCEPT_PURSUIT_INTEGRATE_STEP_MS;

const MAX_TRAIL_HISTORY_VALUES = DEFENSE_INTERCEPT_TRAIL_MAX_PAIRS * 2;

function resolveInterceptHeadBezier(
  m: DefenseInterceptGuidedMissile,
  uFlight: number,
): { x: number; y: number } {
  const t = Math.min(1, Math.max(0, uFlight));
  if (m.bezier) {
    return quadBezierPoint(m.bezier.p0, m.bezier.p1, m.bezier.p2, t);
  }
  return {
    x: m.p0.x + (m.exitX - m.p0.x) * t,
    y: m.p0.y + (m.exitY - m.p0.y) * t,
  };
}

export function resolveUFlight(m: DefenseInterceptGuidedMissile, clockMs: number): number {
  const tSince = clockMs - m.startMs;
  if (tSince <= 0) return 0;
  return Math.min(1, tSince / Math.max(1, m.travelMs));
}

function resolveTrackStartMs(m: DefenseInterceptGuidedMissile): number {
  return m.startMs + m.travelMs * DEFENSE_INTERCEPT_TRACK_INBOUND_START_U;
}

function resetPursuitCache(m: DefenseInterceptGuidedMissile): void {
  m.pursuitIntegratedToMs = 0;
  m.pursuitHx = 0;
  m.pursuitHy = 0;
}

function resolveHeadingFromTrail(m: DefenseInterceptGuidedMissile): number | null {
  const hist = m.trailHistory;
  if (hist.length >= 4) {
    const dy = hist[hist.length - 1] - hist[hist.length - 3];
    const dx = hist[hist.length - 2] - hist[hist.length - 4];
    if (Math.hypot(dx, dy) >= 1e-6) {
      return Math.atan2(dy, dx);
    }
  }
  return null;
}

export function resolveLaunchLineHeadAtMs(
  m: DefenseInterceptGuidedMissile,
  clockMs: number,
): { x: number; y: number } {
  const t = Math.max(0, clockMs - m.startMs);
  const dx = m.exitX - m.p0.x;
  const dy = m.exitY - m.p0.y;
  const dist = Math.hypot(dx, dy) || 1;
  const speed = m.launchSpeedPxPerMs > 0
    ? m.launchSpeedPxPerMs
    : DEFENSE_INTERCEPT_VISUAL_SPEED_PX_PER_MS;
  return {
    x: m.p0.x + (dx / dist) * speed * t,
    y: m.p0.y + (dy / dist) * speed * t,
  };
}

export function seedPursuitFromHead(
  m: DefenseInterceptGuidedMissile,
  clockMs: number,
  head: { x: number; y: number },
): void {
  m.pursuitIntegratedToMs = clockMs;
  m.pursuitHx = head.x;
  m.pursuitHy = head.y;
  m.pursuitLastTan = m.tangentRad;
}

export function resolveDefenseInterceptMissileHeadingRad(
  m: DefenseInterceptGuidedMissile,
  clockMs: number,
  ctx: DefenseInterceptInboundContext,
): number {
  if (m.coastFromMs > 0 && clockMs >= m.coastFromMs) {
    return m.coastTangentRad;
  }
  if (!m.trackInbound) {
    return m.tangentRad;
  }
  const fromTrail = resolveHeadingFromTrail(m);
  if (fromTrail != null) return fromTrail;
  if (Number.isFinite(m.pursuitLastTan)) return m.pursuitLastTan;
  return m.tangentRad;
}

function ensurePursuitCacheAtTrackStart(
  m: DefenseInterceptGuidedMissile,
  trackStartMs: number,
): void {
  if (m.pursuitIntegratedToMs >= trackStartMs) return;
  const entry = resolveInterceptHeadBezier(m, DEFENSE_INTERCEPT_TRACK_INBOUND_START_U);
  m.pursuitIntegratedToMs = trackStartMs;
  m.pursuitHx = entry.x;
  m.pursuitHy = entry.y;
}

function integratePursuitSegment(
  m: DefenseInterceptGuidedMissile,
  fromMs: number,
  toMs: number,
  ctx: DefenseInterceptInboundContext,
): { x: number; y: number } {
  if (toMs <= fromMs) {
    return { x: m.pursuitHx, y: m.pursuitHy };
  }
  let hx = m.pursuitHx;
  let hy = m.pursuitHy;
  let t = fromMs;
  let lastTan = m.pursuitLastTan;
  const speed = m.launchSpeedPxPerMs > 0
    ? m.launchSpeedPxPerMs
    : DEFENSE_INTERCEPT_VISUAL_SPEED_PX_PER_MS;
  const capMs = m.impactAtMs > 0 ? Math.min(toMs, m.impactAtMs) : toMs;

  while (t < capMs) {
    const dt = Math.min(PURSUIT_INTEGRATE_STEP_MS, capMs - t);
    t += dt;
    const warhead = resolveArcCoreInboundWarheadAtMs(
      t,
      ctx.inboundStartMs,
      ctx.travelMs,
      ctx.orbitSize,
    );
    const dx = warhead.x - hx;
    const dy = warhead.y - hy;
    const dist = Math.hypot(dx, dy);
    const step = speed * dt;
    const prevHx = hx;
    const prevHy = hy;
    if (dist <= step || dist < 1e-6) {
      hx = warhead.x;
      hy = warhead.y;
    } else {
      hx += (dx / dist) * step;
      hy += (dy / dist) * step;
    }
    if (Math.hypot(hx - prevHx, hy - prevHy) >= 1e-6) {
      lastTan = Math.atan2(hy - prevHy, hx - prevHx);
    }
  }

  m.pursuitIntegratedToMs = capMs;
  m.pursuitHx = hx;
  m.pursuitHy = hy;
  m.pursuitLastTan = lastTan;
  if (m.impactAtMs > 0 && capMs >= m.impactAtMs) {
    return { x: m.hitX, y: m.hitY };
  }
  return { x: hx, y: hy };
}

/** 결정론 pure pursuit — 증분 캐시로 O(Δt)만 적분 */
export function resolveInterceptHeadAtMs(
  m: DefenseInterceptGuidedMissile,
  clockMs: number,
  ctx: DefenseInterceptInboundContext,
): { x: number; y: number } {
  if (m.impactAtMs > 0 && clockMs >= m.impactAtMs) {
    return { x: m.hitX, y: m.hitY };
  }

  if (m.coastFromMs > 0 && clockMs >= m.coastFromMs) {
    const tCoast = clockMs - m.coastFromMs;
    const speed = m.launchSpeedPxPerMs > 0
      ? m.launchSpeedPxPerMs
      : DEFENSE_INTERCEPT_VISUAL_SPEED_PX_PER_MS;
    return {
      x: m.coastX + Math.cos(m.coastTangentRad) * speed * tCoast,
      y: m.coastY + Math.sin(m.coastTangentRad) * speed * tCoast,
    };
  }

  const tSince = clockMs - m.startMs;
  if (tSince <= 0) return { x: m.p0.x, y: m.p0.y };

  if (!m.trackInbound) {
    return resolveLaunchLineHeadAtMs(m, clockMs);
  }

  const trackStartMs = resolveTrackStartMs(m);
  if (clockMs < trackStartMs) {
    return { x: m.p0.x, y: m.p0.y };
  }

  if (m.pursuitIntegratedToMs > 0 && clockMs < m.pursuitIntegratedToMs) {
    resetPursuitCache(m);
  }

  if (m.pursuitIntegratedToMs > 0 && clockMs >= m.pursuitIntegratedToMs) {
    return integratePursuitSegment(m, m.pursuitIntegratedToMs, clockMs, ctx);
  }

  ensurePursuitCacheAtTrackStart(m, trackStartMs);
  return integratePursuitSegment(m, m.pursuitIntegratedToMs, clockMs, ctx);
}

export function appendDefenseInterceptTrailPoint(
  m: DefenseInterceptGuidedMissile,
  x: number,
  y: number,
): void {
  if (!m.trailHistory) {
    m.trailHistory = [];
  }
  const hist = m.trailHistory;
  const n = hist.length;
  if (n >= 2) {
    const lx = hist[n - 2];
    const ly = hist[n - 1];
    if (Math.hypot(x - lx, y - ly) < DEFENSE_INTERCEPT_TRAIL_MIN_STEP_PX) return;
  }
  hist.push(x, y);
  if (hist.length > MAX_TRAIL_HISTORY_VALUES) {
    hist.splice(0, hist.length - MAX_TRAIL_HISTORY_VALUES);
  }
}

function buildSampleTimes(clockMs: number, prevClockMs?: number): number[] {
  const sampleTimes: number[] = [clockMs];
  if (prevClockMs != null && prevClockMs < clockMs - 4) {
    const step = Math.min(20, Math.max(8, Math.floor((clockMs - prevClockMs) / 3)));
    for (let t = prevClockMs + step; t < clockMs; t += step) {
      sampleTimes.push(t);
    }
  }
  return sampleTimes;
}

/** 탄두가 목표 중심에 도달했는지 — 연출용(작은 반경) */
export function isDefenseInterceptVisualImpactAtCenter(
  m: DefenseInterceptGuidedMissile,
  clockMs: number,
  ctx: DefenseInterceptInboundContext,
): boolean {
  if (!m.hitApplied || !m.willHit || m.impactAtMs > 0) return false;
  const head = resolveInterceptHeadAtMs(m, clockMs, ctx);
  return Math.hypot(head.x - m.hitX, head.y - m.hitY) <= DEFENSE_INTERCEPT_VISUAL_IMPACT_RADIUS_PX;
}

export function tryDefenseInterceptProjectileHit(
  m: DefenseInterceptGuidedMissile,
  clockMs: number,
  ctx: DefenseInterceptInboundContext,
  prevClockMs: number | undefined,
  rollAtProximity: DefenseInterceptRollAtProximity | undefined,
): DefenseInterceptHitResult | null {
  if (m.hitApplied) return null;
  if (clockMs < m.startMs) return null;

  const tSince = clockMs - m.startMs;
  const minEngageMs = DEFENSE_INTERCEPT_MIN_ENGAGE_MS;
  if (tSince < minEngageMs) return null;

  const radius = resolveDefenseInterceptCollisionRadiusPx(ctx.orbitSize);
  const sampleTimes = buildSampleTimes(clockMs, prevClockMs).sort((a, b) => a - b);

  for (const sampleMs of sampleTimes) {
    const warhead = resolveArcCoreInboundWarheadAtMs(
      sampleMs,
      ctx.inboundStartMs,
      ctx.travelMs,
      ctx.orbitSize,
    );
    if (!isInboundWarheadCollisionEligible(warhead, ctx.orbitSize)) continue;

    const head = resolveInterceptHeadAtMs(m, sampleMs, ctx);
    const dist = Math.hypot(head.x - warhead.x, head.y - warhead.y);
    if (dist > radius) continue;

    const relativeMs = sampleMs - ctx.inboundStartMs;
    if (!m.proximityRollAttempted && rollAtProximity) {
      m.proximityRollAttempted = true;
      // spawn 시 결정론 롤(willHit) 유지 — store 동기만, 덮어쓰기 금지
      rollAtProximity(relativeMs, m.slotIndex);
    }
    if (!m.willHit) {
      return {
        hitX: warhead.x,
        hitY: warhead.y,
        relativeMs,
        passThrough: true,
      };
    }

    return {
      hitX: warhead.x,
      hitY: warhead.y,
      relativeMs,
    };
  }

  return null;
}
