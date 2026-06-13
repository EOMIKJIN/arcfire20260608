// ============================================================
// 전함 유도미사일 — Skia trail/head (combat·아크코어 요격 공용)
// ============================================================

import { quadBezierCapitalPoint } from './capitalGuidedMissileBezier';

export type CapitalGuidedMissileVisualInput = {
  p0: { x: number; y: number };
  p1: { x: number; y: number };
  p2: { x: number; y: number };
  startMs: number;
  travelMs: number;
};

export const CAPITAL_GUIDED_MISSILE_TRAIL_FADE_MS = 700;
export const CAPITAL_GUIDED_MISSILE_INFLIGHT_TRAIL_WINDOW_U = 0.55;

export function resolveCapitalGuidedMissileVisualState(
  m: CapitalGuidedMissileVisualInput,
  tMs: number,
  opts?: {
    trailFadeMs?: number;
    trailWindowU?: number;
    hitApplied?: boolean;
    willHit?: boolean;
    hitAtMs?: number;
  },
): {
  head: { x: number; y: number };
  headOpacity: number;
  trailOpacity: number;
  headVisible: boolean;
  visible: boolean;
  uHead: number;
  uTail: number;
  explosionOpacity: number;
} {
  const trailFadeMs = opts?.trailFadeMs ?? CAPITAL_GUIDED_MISSILE_TRAIL_FADE_MS;
  const trailWindowU = opts?.trailWindowU ?? CAPITAL_GUIDED_MISSILE_INFLIGHT_TRAIL_WINDOW_U;
  const tSince = tMs - m.startMs;
  const pursuitMs = opts?.hitApplied && opts?.willHit && (opts.hitAtMs ?? 0) > 0
    ? Math.max(0, (opts.hitAtMs ?? 0) - m.startMs - m.travelMs) + 120
    : 0;
  const lifeEnd = m.travelMs + pursuitMs + trailFadeMs;

  if (tSince < 0 || tSince >= lifeEnd) {
    return {
      head: { x: m.p0.x, y: m.p0.y },
      headOpacity: 0,
      trailOpacity: 0,
      headVisible: false,
      visible: false,
      uHead: 0,
      uTail: 0,
      explosionOpacity: 0,
    };
  }

  const uFlight = Math.min(1, tSince / Math.max(1, m.travelMs));
  const tailStartAtImpact = Math.max(0, 1 - trailWindowU);
  let uHead: number;
  let uTail: number;

  if (tSince < m.travelMs) {
    uHead = uFlight;
    uTail = Math.max(0, uHead - trailWindowU);
  } else {
    uHead = 1;
    const postHitFade = Math.min(1, (tSince - m.travelMs) / trailFadeMs);
    uTail = tailStartAtImpact + (1 - tailStartAtImpact) * postHitFade;
  }

  let trailOpacity = 0.9;
  let headOpacity = 0.98;
  if (tSince >= m.travelMs) {
    const postHitT01 = Math.min(1, (tSince - m.travelMs) / Math.max(1, trailFadeMs));
    trailOpacity *= Math.max(0, 1 - Math.pow(postHitT01, 0.85));
  }

  if (tSince >= m.travelMs + pursuitMs) {
    const fadeT = Math.min(1, (tSince - m.travelMs - pursuitMs) / trailFadeMs);
    headOpacity = Math.max(0, 1 - fadeT);
    trailOpacity = Math.max(0, trailOpacity * (1 - fadeT));
  }

  const head = quadBezierCapitalPoint(m.p0, m.p1, m.p2, uHead);
  const headVisible = tSince < m.travelMs + pursuitMs;
  const span = uHead - uTail;
  const visible = (trailOpacity > 0.01 && span >= 0.004) || headVisible;

  let explosionOpacity = 0;
  if (opts?.hitApplied && opts?.willHit && (opts.hitAtMs ?? 0) > 0 && tMs < (opts.hitAtMs ?? 0) + 520) {
    const explT = Math.min(1, Math.max(0, (tMs - (opts.hitAtMs ?? 0)) / 520));
    explosionOpacity = Math.max(0, 1 - explT * 0.88);
  }

  return {
    head,
    headOpacity,
    trailOpacity,
    headVisible,
    visible,
    uHead,
    uTail,
    explosionOpacity,
  };
}

export function writeCapitalGuidedMissileTrailPath(
  path: { reset: () => void; moveTo: (x: number, y: number) => void; lineTo: (x: number, y: number) => void },
  m: CapitalGuidedMissileVisualInput,
  uTail: number,
  uHead: number,
  canvasPad: number,
): boolean {
  const span = uHead - uTail;
  if (span < 0.004) {
    path.reset();
    return false;
  }
  const n = Math.max(2, Math.min(14, Math.ceil(4 + 10 * span)));
  path.reset();
  for (let k = 0; k <= n; k += 1) {
    const t = uTail + (k / n) * span;
    const p = quadBezierCapitalPoint(m.p0, m.p1, m.p2, t);
    const x = p.x + canvasPad;
    const y = p.y + canvasPad;
    if (k === 0) path.moveTo(x, y);
    else path.lineTo(x, y);
  }
  return true;
}
