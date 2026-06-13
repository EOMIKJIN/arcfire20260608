/** ArcCore inbound + 방위 요격 Skia worklet — JS sim 과 분리 */
// ── 미사일 요격체계 · 안정버전 2026-06-12 ──
import { Skia } from '@shopify/react-native-skia';
import {
  DEFENSE_INTERCEPT_COAST_MS,
  DEFENSE_INTERCEPT_GUIDED_MISSILE_HIT_EXPLOSION_MS,
  DEFENSE_INTERCEPT_GUIDED_MISSILE_TRAIL_FADE_MS,
  DEFENSE_INTERCEPT_MISS_STRAIGHT_COAST_MS,
  DEFENSE_INTERCEPT_PRIMARY_PURSUIT_MS,
  DEFENSE_INTERCEPT_TRAIL_MAX_PAIRS,
  DEFENSE_INTERCEPT_TRAIL_WINDOW_MS_MIN,
  DEFENSE_INTERCEPT_TRAIL_WINDOW_U,
  DEFENSE_INTERCEPT_MOTION_EXTRAPOLATE_MAX_MS,
} from './defenseInterceptConstants';

/** guided missile flat — packDefenseInterceptMissileFlat 와 동기 (16필드) */
export const INTERCEPT_MISSILE_IDX = {
  startMs: 0,
  travelMs: 1,
  p0x: 2,
  p0y: 3,
  exitX: 4,
  exitY: 5,
  impactAtMs: 6,
  hitX: 7,
  hitY: 8,
  trackInbound: 9,
  tangentRad: 10,
  trailFadeMs: 11,
  coastFromMs: 12,
  coastX: 13,
  coastY: 14,
  coastTangentRad: 15,
  lifeEndMs: 16,
  simHeadX: 17,
  simHeadY: 18,
  simTan: 19,
  simVelX: 20,
  simVelY: 21,
  simSyncMs: 22,
  trailPairCount: 23,
  trailStart: 24,
} as const;

export const INTERCEPT_MISSILE_MAX_TRAIL_PAIRS = DEFENSE_INTERCEPT_TRAIL_MAX_PAIRS;
export const INTERCEPT_MISSILE_FLAT_LEN =
  INTERCEPT_MISSILE_IDX.trailStart + INTERCEPT_MISSILE_MAX_TRAIL_PAIRS * 2;

export const INTERCEPT_VIS_IDX = {
  visible: 0,
  headX: 1,
  headY: 2,
  headOpacity: 3,
  trailOpacity: 4,
  explosionOpacity: 5,
  tangentRad: 6,
  trailAlive: 7,
  dissolveT: 8,
} as const;

/** Skia 꼬리 그radient — 꼬리(투명) → 머리(밝음) */
export const INTERCEPT_TRAIL_GRADIENT_COLORS = [
  'rgba(255, 255, 255, 0)',
  'rgba(255, 255, 255, 0.22)',
  'rgba(255, 255, 255, 0.88)',
] as const;

export const INTERCEPT_TRAIL_GRADIENT_POSITIONS = [0, 0.45, 1] as const;

export function readDefenseInterceptSimMotionWorklet(
  flat: number[],
  clockMs: number,
): number[] {
  'worklet';
  const baseX = flat[INTERCEPT_MISSILE_IDX.simHeadX] ?? 0;
  const baseY = flat[INTERCEPT_MISSILE_IDX.simHeadY] ?? 0;
  const syncMs = flat[INTERCEPT_MISSILE_IDX.simSyncMs] ?? 0;
  const velX = flat[INTERCEPT_MISSILE_IDX.simVelX] ?? 0;
  const velY = flat[INTERCEPT_MISSILE_IDX.simVelY] ?? 0;
  const dtMs = syncMs > 0
    ? Math.max(0, Math.min(DEFENSE_INTERCEPT_MOTION_EXTRAPOLATE_MAX_MS, clockMs - syncMs))
    : 0;
  const headX = baseX + velX * dtMs;
  const headY = baseY + velY * dtMs;
  let tangentRad = flat[INTERCEPT_MISSILE_IDX.simTan] ?? 0;
  if (Math.hypot(velX, velY) >= 0.004) {
    tangentRad = Math.atan2(velY, velX);
  }
  const pairCount = Math.min(
    Math.floor(flat[INTERCEPT_MISSILE_IDX.trailPairCount] ?? 0),
    INTERCEPT_MISSILE_MAX_TRAIL_PAIRS,
  );
  const out: number[] = [headX, headY, tangentRad, pairCount];
  const trailBase = INTERCEPT_MISSILE_IDX.trailStart;
  for (let i = 0; i < pairCount; i += 1) {
    out.push(flat[trailBase + i * 2] ?? headX, flat[trailBase + i * 2 + 1] ?? headY);
  }
  if (pairCount < 1) {
    out.push(headX, headY);
  }
  return out;
}

/** bezier u 꼬리 창 — defenseInterceptConstants 와 동기 */
const TRAIL_WINDOW_U = DEFENSE_INTERCEPT_TRAIL_WINDOW_U;

export function packDefenseInterceptMissileFlat(m: {
  startMs: number;
  travelMs: number;
  p0: { x: number; y: number };
  exitX: number;
  exitY: number;
  impactAtMs: number;
  hitX: number;
  hitY: number;
  trackInbound: boolean;
  tangentRad: number;
  coastFromMs: number;
  coastX: number;
  coastY: number;
  coastTangentRad: number;
}): number[] {
  const flat = new Array<number>(INTERCEPT_MISSILE_FLAT_LEN).fill(0);
  flat[INTERCEPT_MISSILE_IDX.startMs] = m.startMs;
  flat[INTERCEPT_MISSILE_IDX.travelMs] = m.travelMs;
  flat[INTERCEPT_MISSILE_IDX.p0x] = m.p0.x;
  flat[INTERCEPT_MISSILE_IDX.p0y] = m.p0.y;
  flat[INTERCEPT_MISSILE_IDX.exitX] = m.exitX;
  flat[INTERCEPT_MISSILE_IDX.exitY] = m.exitY;
  flat[INTERCEPT_MISSILE_IDX.impactAtMs] = m.impactAtMs;
  flat[INTERCEPT_MISSILE_IDX.hitX] = m.hitX;
  flat[INTERCEPT_MISSILE_IDX.hitY] = m.hitY;
  flat[INTERCEPT_MISSILE_IDX.trackInbound] = m.trackInbound ? 1 : 0;
  flat[INTERCEPT_MISSILE_IDX.tangentRad] = m.tangentRad;
  flat[INTERCEPT_MISSILE_IDX.trailFadeMs] = DEFENSE_INTERCEPT_GUIDED_MISSILE_TRAIL_FADE_MS;
  flat[INTERCEPT_MISSILE_IDX.coastFromMs] = m.coastFromMs;
  flat[INTERCEPT_MISSILE_IDX.coastX] = m.coastX;
  flat[INTERCEPT_MISSILE_IDX.coastY] = m.coastY;
  flat[INTERCEPT_MISSILE_IDX.coastTangentRad] = m.coastTangentRad;
  flat[INTERCEPT_MISSILE_IDX.lifeEndMs] = 0;
  flat[INTERCEPT_MISSILE_IDX.simHeadX] = m.p0.x;
  flat[INTERCEPT_MISSILE_IDX.simHeadY] = m.p0.y;
  flat[INTERCEPT_MISSILE_IDX.simTan] = m.tangentRad;
  flat[INTERCEPT_MISSILE_IDX.simVelX] = 0;
  flat[INTERCEPT_MISSILE_IDX.simVelY] = 0;
  flat[INTERCEPT_MISSILE_IDX.simSyncMs] = m.startMs;
  return flat;
}

export function syncDefenseInterceptMissileFlatDynamic(
  flat: number[],
  m: {
    impactAtMs: number;
    hitX: number;
    hitY: number;
    trackInbound: boolean;
    coastFromMs: number;
    coastX: number;
    coastY: number;
    coastTangentRad: number;
  },
): void {
  flat[INTERCEPT_MISSILE_IDX.impactAtMs] = m.impactAtMs;
  flat[INTERCEPT_MISSILE_IDX.hitX] = m.hitX;
  flat[INTERCEPT_MISSILE_IDX.hitY] = m.hitY;
  flat[INTERCEPT_MISSILE_IDX.trackInbound] = m.trackInbound ? 1 : 0;
  flat[INTERCEPT_MISSILE_IDX.coastFromMs] = m.coastFromMs;
  flat[INTERCEPT_MISSILE_IDX.coastX] = m.coastX;
  flat[INTERCEPT_MISSILE_IDX.coastY] = m.coastY;
  flat[INTERCEPT_MISSILE_IDX.coastTangentRad] = m.coastTangentRad;
}

export function syncDefenseInterceptMissileFlatFromSim(
  flat: number[],
  m: {
    impactAtMs: number;
    hitX: number;
    hitY: number;
    trackInbound: boolean;
    coastFromMs: number;
    coastX: number;
    coastY: number;
    coastTangentRad: number;
    trailHistory: number[];
  },
  simHeadX: number,
  simHeadY: number,
  simTan: number,
  syncMs: number,
  lifeEndMs: number,
): void {
  syncDefenseInterceptMissileFlatDynamic(flat, m);
  flat[INTERCEPT_MISSILE_IDX.lifeEndMs] = lifeEndMs;
  const prevX = flat[INTERCEPT_MISSILE_IDX.simHeadX] ?? simHeadX;
  const prevY = flat[INTERCEPT_MISSILE_IDX.simHeadY] ?? simHeadY;
  const prevSyncMs = flat[INTERCEPT_MISSILE_IDX.simSyncMs] ?? syncMs;
  const dtMs = Math.max(1, syncMs - prevSyncMs);
  flat[INTERCEPT_MISSILE_IDX.simVelX] = (simHeadX - prevX) / dtMs;
  flat[INTERCEPT_MISSILE_IDX.simVelY] = (simHeadY - prevY) / dtMs;
  flat[INTERCEPT_MISSILE_IDX.simSyncMs] = syncMs;
  flat[INTERCEPT_MISSILE_IDX.simHeadX] = simHeadX;
  flat[INTERCEPT_MISSILE_IDX.simHeadY] = simHeadY;
  flat[INTERCEPT_MISSILE_IDX.simTan] = simTan;
  const hist = m.trailHistory ?? [];
  const pairCount = Math.min(
    Math.floor(hist.length / 2),
    INTERCEPT_MISSILE_MAX_TRAIL_PAIRS,
  );
  flat[INTERCEPT_MISSILE_IDX.trailPairCount] = pairCount;
  const trailBase = INTERCEPT_MISSILE_IDX.trailStart;
  const histStart = hist.length - pairCount * 2;
  for (let i = 0; i < pairCount * 2; i += 1) {
    flat[trailBase + i] = hist[histStart + i] ?? simHeadX;
  }
}

export function packDefenseInterceptMissileVisualPack(
  clockMs: number,
  flat: number[],
  _inboundStartMs: number,
  _inboundTravelMs: number,
  _inboundBezierFlat: number[],
): number[] {
  'worklet';
  const startMs = flat[INTERCEPT_MISSILE_IDX.startMs] ?? 0;
  const travelMs = Math.max(1, flat[INTERCEPT_MISSILE_IDX.travelMs] ?? 1);
  const trailFadeMs = flat[INTERCEPT_MISSILE_IDX.trailFadeMs] ?? 700;
  const impactAtMs = flat[INTERCEPT_MISSILE_IDX.impactAtMs] ?? 0;
  const coastFromMs = flat[INTERCEPT_MISSILE_IDX.coastFromMs] ?? 0;
  const trackInbound = (flat[INTERCEPT_MISSILE_IDX.trackInbound] ?? 0) > 0.5;
  const packedLifeEndMs = flat[INTERCEPT_MISSILE_IDX.lifeEndMs] ?? 0;
  const tSince = clockMs - startMs;
  const impactDone = impactAtMs > 0;
  const lifeEnd = packedLifeEndMs > startMs
    ? packedLifeEndMs - startMs
    : impactDone
      ? (impactAtMs - startMs) + DEFENSE_INTERCEPT_GUIDED_MISSILE_HIT_EXPLOSION_MS + trailFadeMs
      : coastFromMs > 0
        ? (coastFromMs - startMs) + DEFENSE_INTERCEPT_COAST_MS + trailFadeMs
        : !trackInbound
          ? travelMs + DEFENSE_INTERCEPT_MISS_STRAIGHT_COAST_MS + trailFadeMs
          : travelMs + DEFENSE_INTERCEPT_PRIMARY_PURSUIT_MS + trailFadeMs;

  if (tSince < 0 || clockMs >= startMs + lifeEnd) {
    return [0, 0, 0, 0, 0, 0, 0, 0, 0];
  }

  let dissolveT = 0;
  if (impactDone && clockMs >= impactAtMs) {
    const postImpactMs = clockMs - impactAtMs;
    if (postImpactMs >= DEFENSE_INTERCEPT_GUIDED_MISSILE_HIT_EXPLOSION_MS) {
      const u = Math.min(
        1,
        Math.max(0, (postImpactMs - DEFENSE_INTERCEPT_GUIDED_MISSILE_HIT_EXPLOSION_MS) / Math.max(1, trailFadeMs)),
      );
      const inv = 1 - u;
      dissolveT = 1 - inv * inv * inv;
    }
  } else if (coastFromMs > 0) {
    const tCoast = Math.max(0, clockMs - coastFromMs);
    const fadeStart = Math.max(0, DEFENSE_INTERCEPT_COAST_MS - trailFadeMs);
    if (tCoast >= fadeStart) {
      const u = Math.min(1, Math.max(0, (tCoast - fadeStart) / Math.max(1, trailFadeMs)));
      const inv = 1 - u;
      dissolveT = 1 - inv * inv * inv;
    }
  } else if (!trackInbound && !impactDone) {
    const fadeStartMs = packedLifeEndMs > startMs
      ? packedLifeEndMs - trailFadeMs
      : startMs + travelMs + DEFENSE_INTERCEPT_MISS_STRAIGHT_COAST_MS - trailFadeMs;
    if (clockMs >= fadeStartMs) {
      const u = Math.min(1, Math.max(0, (clockMs - fadeStartMs) / Math.max(1, trailFadeMs)));
      const inv = 1 - u;
      dissolveT = 1 - inv * inv * inv;
    }
  } else if (trackInbound && !impactDone && tSince >= travelMs + DEFENSE_INTERCEPT_PRIMARY_PURSUIT_MS) {
    const fadeStart = travelMs + DEFENSE_INTERCEPT_PRIMARY_PURSUIT_MS;
    const u = Math.min(1, Math.max(0, (tSince - fadeStart) / Math.max(1, trailFadeMs)));
    const inv = 1 - u;
    dissolveT = 1 - inv * inv * inv;
  }

  const trailWindowMs = Math.max(DEFENSE_INTERCEPT_TRAIL_WINDOW_MS_MIN, Math.round(travelMs * TRAIL_WINDOW_U));
  const sampleEndMs = impactDone ? Math.min(clockMs, impactAtMs) : clockMs;
  const effectiveWindowMs = dissolveT > 0
    ? Math.max(28, trailWindowMs * (1 - dissolveT * 0.96))
    : trailWindowMs;
  const trailT0Ms = Math.max(startMs, sampleEndMs - effectiveWindowMs);

  const baseX = flat[INTERCEPT_MISSILE_IDX.simHeadX] ?? 0;
  const baseY = flat[INTERCEPT_MISSILE_IDX.simHeadY] ?? 0;
  const syncMs = flat[INTERCEPT_MISSILE_IDX.simSyncMs] ?? 0;
  const velX = flat[INTERCEPT_MISSILE_IDX.simVelX] ?? 0;
  const velY = flat[INTERCEPT_MISSILE_IDX.simVelY] ?? 0;
  const dtMs = syncMs > 0
    ? Math.max(0, Math.min(DEFENSE_INTERCEPT_MOTION_EXTRAPOLATE_MAX_MS, clockMs - syncMs))
    : 0;
  const headX = baseX + velX * dtMs;
  const headY = baseY + velY * dtMs;
  let tangentRad = flat[INTERCEPT_MISSILE_IDX.simTan] ?? 0;
  if (Math.hypot(velX, velY) >= 0.004) {
    tangentRad = Math.atan2(velY, velX);
  }

  const dissolveEase = (() => {
    const u = Math.min(1, Math.max(0, dissolveT));
    const inv = 1 - u;
    return 1 - inv * inv * inv;
  })();
  const headDissolveEase = (() => {
    const u = Math.min(1, Math.max(0, dissolveT * 1.1));
    const inv = 1 - u;
    return 1 - inv * inv * inv;
  })();

  let headOpacity = 0.96 * (1 - headDissolveEase);
  let trailOpacity = 0.82 * (1 - dissolveEase);
  let explosionOpacity = 0;

  if (impactDone && clockMs >= impactAtMs) {
    const postImpactMs = clockMs - impactAtMs;
    if (postImpactMs < DEFENSE_INTERCEPT_GUIDED_MISSILE_HIT_EXPLOSION_MS) {
      const explT = Math.min(1, Math.max(0, postImpactMs / DEFENSE_INTERCEPT_GUIDED_MISSILE_HIT_EXPLOSION_MS));
      explosionOpacity = Math.max(0, 1 - explT * 0.88);
      headOpacity = Math.max(0, 0.96 * (1 - explT * 1.15));
      trailOpacity = 0.82;
    } else {
      headOpacity = 0;
    }
  }

  const visible = headOpacity > 0.02 || trailOpacity > 0.02 || explosionOpacity > 0.02 ? 1 : 0;
  const trailAlive = sampleEndMs - trailT0Ms >= 6 && trailOpacity > 0.02 ? 1 : 0;

  return [
    visible,
    headX,
    headY,
    headOpacity,
    trailOpacity,
    explosionOpacity,
    tangentRad,
    trailAlive,
    dissolveT,
  ];
}

export function buildDefenseInterceptTrailPathFromFlat(
  path: ReturnType<typeof Skia.Path.Make>,
  flat: number[],
  canvasPad: number,
  clockMs: number,
  dissolveT = 0,
): void {
  'worklet';
  const baseX = flat[INTERCEPT_MISSILE_IDX.simHeadX] ?? 0;
  const baseY = flat[INTERCEPT_MISSILE_IDX.simHeadY] ?? 0;
  const syncMs = flat[INTERCEPT_MISSILE_IDX.simSyncMs] ?? 0;
  const velX = flat[INTERCEPT_MISSILE_IDX.simVelX] ?? 0;
  const velY = flat[INTERCEPT_MISSILE_IDX.simVelY] ?? 0;
  const dtMs = syncMs > 0
    ? Math.max(0, Math.min(DEFENSE_INTERCEPT_MOTION_EXTRAPOLATE_MAX_MS, clockMs - syncMs))
    : 0;
  const headX = baseX + velX * dtMs;
  const headY = baseY + velY * dtMs;
  const pairCount = Math.min(
    Math.floor(flat[INTERCEPT_MISSILE_IDX.trailPairCount] ?? 0),
    INTERCEPT_MISSILE_MAX_TRAIL_PAIRS,
  );
  const trailBase = INTERCEPT_MISSILE_IDX.trailStart;
  path.reset();
  if (pairCount >= 2) {
    const pairTotal = pairCount;
    const keepPairs = Math.max(2, Math.ceil(pairTotal * (1 - dissolveT * 0.94)));
    const startPair = Math.max(0, pairTotal - keepPairs);
    const startI = startPair * 2;
    path.moveTo((flat[trailBase + startI] ?? headX) + canvasPad, (flat[trailBase + startI + 1] ?? headY) + canvasPad);
    for (let i = startPair + 1; i < pairTotal; i += 1) {
      path.lineTo((flat[trailBase + i * 2] ?? headX) + canvasPad, (flat[trailBase + i * 2 + 1] ?? headY) + canvasPad);
    }
    path.lineTo(headX + canvasPad, headY + canvasPad);
    return;
  }
  if (pairCount === 1) {
    path.moveTo((flat[trailBase] ?? headX) + canvasPad, (flat[trailBase + 1] ?? headY) + canvasPad);
    path.lineTo(headX + canvasPad, headY + canvasPad);
    return;
  }
  path.moveTo(headX + canvasPad, headY + canvasPad);
  path.lineTo(headX + canvasPad, headY + canvasPad);
}

export function unwrapInterceptTangentWorklet(prev: number, raw: number): number {
  'worklet';
  let d = raw - prev;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return prev + d;
}

export function packDefenseInterceptDodgeFlash(
  clockMs: number,
  inboundStartMs: number,
  interceptAtMs: number,
  interceptSucceeded: boolean,
  explosionMs: number,
): number {
  'worklet';
  if (!interceptSucceeded) return 0;
  const hitT = clockMs - inboundStartMs - interceptAtMs;
  if (hitT < 0 || hitT > explosionMs * 1.35) return 0;
  const pulse = 0.5 + 0.5 * Math.sin((hitT / 45) * Math.PI * 2);
  const fade = Math.max(0, 1 - hitT / (explosionMs * 1.35));
  return pulse * fade * 0.95;
}
