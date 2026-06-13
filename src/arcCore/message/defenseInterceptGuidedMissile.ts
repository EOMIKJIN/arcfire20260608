// ============================================================
// 방위위성 요격미사일 — guided sim tick (렌더는 Skia worklet)
// predict→engagement→spawn→tick — inbound warhead pure pursuit
// ============================================================

import {
  isDefenseInterceptVisualImpactAtCenter,
  resolveDefenseInterceptMissileHeadingRad,
  resolveInterceptHeadAtMs,
  resolveLaunchLineHeadAtMs,
  resolveUFlight,
  seedPursuitFromHead,
  tryDefenseInterceptProjectileHit,
} from './defenseInterceptCollision';
import { resolveArcCoreInboundWarheadAtMs } from './arcCoreMessageMissileGeometry';
import { resolveArcCoreMessageMissileCanvasPadPx } from './arcCoreMessageMissileGeometry';
import {
  DEFENSE_INTERCEPT_COAST_MS,
  DEFENSE_INTERCEPT_GUIDED_MISSILE_HIT_EXPLOSION_MS,
  DEFENSE_INTERCEPT_GUIDED_MISSILE_TRAIL_FADE_MS,
  DEFENSE_INTERCEPT_MISS_STRAIGHT_COAST_MS,
  DEFENSE_INTERCEPT_PRIMARY_PURSUIT_MS,
  DEFENSE_INTERCEPT_VISUAL_SPEED_PX_PER_MS,
} from './defenseInterceptConstants';
import type {
  DefenseInterceptGuidedMissile,
  DefenseInterceptGuidedTickResult,
  DefenseInterceptInboundContext,
  DefenseInterceptRollAtProximity,
} from './defenseInterceptTypes';
import { PLANET_MAIN_ORBIT_SCENE_SIZE } from '../../stages/planetMainStageLayout';

export type {
  DefenseInterceptGuidedMissile,
  DefenseInterceptGuidedTickResult,
  DefenseInterceptInboundContext,
  DefenseInterceptRollAtProximity,
} from './defenseInterceptTypes';

export function resolveDefenseInterceptStraightFlightLifeEndMs(
  m: DefenseInterceptGuidedMissile,
  orbitSize: number,
): number {
  const dx = m.exitX - m.p0.x;
  const dy = m.exitY - m.p0.y;
  const chordDist = Math.hypot(dx, dy) || 1;
  const speed = m.launchSpeedPxPerMs > 0
    ? m.launchSpeedPxPerMs
    : DEFENSE_INTERCEPT_VISUAL_SPEED_PX_PER_MS;
  const pad = resolveArcCoreMessageMissileCanvasPadPx(orbitSize);
  const beyondPx = (orbitSize + pad * 2) * 0.52;
  const coastMs = Math.max(
    DEFENSE_INTERCEPT_MISS_STRAIGHT_COAST_MS,
    beyondPx / Math.max(1e-6, speed),
  );
  return m.startMs + m.travelMs + coastMs + DEFENSE_INTERCEPT_GUIDED_MISSILE_TRAIL_FADE_MS;
}

export function resolveDefenseInterceptMissileLifeEndMs(
  m: DefenseInterceptGuidedMissile,
  orbitSize = PLANET_MAIN_ORBIT_SCENE_SIZE,
): number {
  if (m.willHit && m.impactAtMs > 0) {
    return m.impactAtMs + DEFENSE_INTERCEPT_GUIDED_MISSILE_HIT_EXPLOSION_MS + DEFENSE_INTERCEPT_GUIDED_MISSILE_TRAIL_FADE_MS;
  }
  if (!m.trackInbound && m.impactAtMs <= 0) {
    return resolveDefenseInterceptStraightFlightLifeEndMs(m, orbitSize);
  }
  if (m.coastFromMs > 0) {
    return m.coastFromMs + DEFENSE_INTERCEPT_COAST_MS + DEFENSE_INTERCEPT_GUIDED_MISSILE_TRAIL_FADE_MS;
  }
  if (m.hitApplied && m.willHit && m.impactAtMs <= 0) {
    return m.startMs + m.travelMs + DEFENSE_INTERCEPT_PRIMARY_PURSUIT_MS + DEFENSE_INTERCEPT_GUIDED_MISSILE_TRAIL_FADE_MS;
  }
  const pursuit = m.trackInbound ? DEFENSE_INTERCEPT_PRIMARY_PURSUIT_MS : 0;
  return m.startMs + m.travelMs + pursuit + DEFENSE_INTERCEPT_GUIDED_MISSILE_TRAIL_FADE_MS;
}

export function resolveDefenseInterceptMissilesSessionEndMs(
  missiles: DefenseInterceptGuidedMissile[],
  orbitSize = PLANET_MAIN_ORBIT_SCENE_SIZE,
): number {
  let endMs = 0;
  for (const m of missiles) {
    endMs = Math.max(endMs, resolveDefenseInterceptMissileLifeEndMs(m, orbitSize));
  }
  return endMs;
}

export function areDefenseInterceptGuidedMissilesAlive(
  missiles: DefenseInterceptGuidedMissile[],
  clockMs: number,
  orbitSize = PLANET_MAIN_ORBIT_SCENE_SIZE,
): boolean {
  for (const m of missiles) {
    if (clockMs < resolveDefenseInterceptMissileLifeEndMs(m, orbitSize)) return true;
  }
  return false;
}

function applyProximityHit(
  m: DefenseInterceptGuidedMissile,
  clockMs: number,
  hitX: number,
  hitY: number,
  slotPrimary: boolean,
  result: DefenseInterceptGuidedTickResult,
  inboundStartMs: number,
): void {
  m.hitApplied = true;
  m.hitAtMs = clockMs;
  m.hitX = hitX;
  m.hitY = hitY;
  if (!m.trackInbound) {
    m.trackInbound = true;
    seedPursuitFromHead(m, clockMs, resolveLaunchLineHeadAtMs(m, clockMs));
  }
  if (slotPrimary) {
    result.primaryHitRelativeMs = clockMs - inboundStartMs;
  }
}

function applyVisualImpact(
  m: DefenseInterceptGuidedMissile,
  clockMs: number,
  slotPrimary: boolean,
  result: DefenseInterceptGuidedTickResult,
  inboundStartMs: number,
): void {
  m.impactAtMs = clockMs;
  if (slotPrimary) {
    result.primaryImpactRelativeMs = clockMs - inboundStartMs;
    result.hitX = m.hitX;
    result.hitY = m.hitY;
  }
}

function resolveInboundDestroyMs(missiles: DefenseInterceptGuidedMissile[]): number {
  let destroyMs = 0;
  for (const m of missiles) {
    if (m.willHit && m.impactAtMs > 0) {
      destroyMs = Math.max(destroyMs, m.impactAtMs);
    }
  }
  return destroyMs;
}

/** 격중 롤 실패 — 발사 직선·속도 유지(inbound 관통), willHit=false 유지 */
function releaseMissilePassThrough(
  m: DefenseInterceptGuidedMissile,
  clockMs: number,
): void {
  if (m.passThroughAtMs > 0) return;
  m.passThroughAtMs = clockMs;
  m.willHit = false;
  m.trackInbound = false;
  m.coastFromMs = 0;
}

/** 격중 위성 1기가 inbound 격추 — 나머지는 발사 직선 유지 */
function releaseNonHittingMissilesToCoast(
  missiles: DefenseInterceptGuidedMissile[],
  destroyMs: number,
): void {
  if (destroyMs <= 0) return;
  for (const m of missiles) {
    if (m.willHit) continue;
    m.trackInbound = false;
    m.coastFromMs = 0;
  }
}

export function tickDefenseInterceptGuidedMissiles(
  missiles: DefenseInterceptGuidedMissile[],
  clockMs: number,
  inboundStartMs: number,
  travelMs: number,
  orbitSize: number,
  prevClockMs?: number,
  rollAtProximity?: DefenseInterceptRollAtProximity,
): DefenseInterceptGuidedTickResult {
  const result: DefenseInterceptGuidedTickResult = {
    primaryHitRelativeMs: null,
    primaryImpactRelativeMs: null,
    hitX: 0,
    hitY: 0,
    primaryAimCrossed: false,
    aimCrossRelativeMs: null,
    aimCrossX: 0,
    aimCrossY: 0,
  };

  const ctx: DefenseInterceptInboundContext = { inboundStartMs, travelMs, orbitSize };

  for (const m of missiles) {
    if (m.impactAtMs > 0) continue;
    if (clockMs < m.startMs) continue;

    if (m.hitApplied && m.willHit) {
      const warhead = resolveArcCoreInboundWarheadAtMs(
        clockMs,
        ctx.inboundStartMs,
        ctx.travelMs,
        ctx.orbitSize,
      );
      m.hitX = warhead.x;
      m.hitY = warhead.y;
      if (isDefenseInterceptVisualImpactAtCenter(m, clockMs, ctx)) {
        applyVisualImpact(
          m,
          clockMs,
          result.primaryImpactRelativeMs == null,
          result,
          inboundStartMs,
        );
      }
      continue;
    }

    if (m.hitApplied) continue;

    const hit = tryDefenseInterceptProjectileHit(
      m,
      clockMs,
      ctx,
      prevClockMs,
      rollAtProximity,
    );
    if (hit) {
      if (hit.passThrough) {
        releaseMissilePassThrough(m, clockMs);
        continue;
      }
      applyProximityHit(
        m,
        clockMs,
        hit.hitX,
        hit.hitY,
        result.primaryHitRelativeMs == null,
        result,
        inboundStartMs,
      );
      continue;
    }

    const uFlight = resolveUFlight(m, clockMs);
    if (uFlight >= 1 && !m.trackInbound && !m.willHit) {
      const head = resolveInterceptHeadAtMs(m, clockMs, ctx);
      m.hitX = head.x;
      m.hitY = head.y;
    }
  }

  const destroyMs = resolveInboundDestroyMs(missiles);
  if (destroyMs > 0) {
    releaseNonHittingMissilesToCoast(missiles, destroyMs);
  }

  return result;
}
