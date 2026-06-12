/** 요격미사일 1발 스냅샷 — [x, y, bodyOpacity, explosionOpacity, trailOpacity] */
export const DEFENSE_INTERCEPT_VIS_LEN = 5;

function lerp(a: number, b: number, t: number): number {
  'worklet';
  return a + (b - a) * t;
}

export function packDefenseInterceptMissileSnapshot(
  clockMs: number,
  inboundStartMs: number,
  launchDelayMs: number,
  flightMs: number,
  explosionMs: number,
  launchX: number,
  launchY: number,
  endX: number,
  endY: number,
  hits: boolean,
): number[] {
  'worklet';
  if (!Number.isFinite(clockMs) || !Number.isFinite(inboundStartMs)) {
    return [launchX, launchY, 0, 0, 0];
  }
  const t = clockMs - inboundStartMs - launchDelayMs;
  if (t < 0) {
    return [launchX, launchY, 0, 0, 0];
  }
  const prog = t / Math.max(1, flightMs);
  if (hits) {
    if (prog >= 1) {
      const explT = (t - flightMs) / Math.max(1, explosionMs);
      if (explT >= 1) return [endX, endY, 0, 0, 0];
      const bodyFade = Math.max(0, 1 - explT * 2.2);
      return [endX, endY, bodyFade, Math.max(0, 1 - explT * 0.85), 0];
    }
    const x = lerp(launchX, endX, prog);
    const y = lerp(launchY, endY, prog);
    return [x, y, 1, 0, 0.75];
  }
  if (prog >= 1.4) {
    return [endX, endY, 0, 0, 0];
  }
  const moveT = Math.min(1, prog);
  const x = lerp(launchX, endX, moveT);
  const y = lerp(launchY, endY, moveT);
  const fade = prog > 1 ? Math.max(0, 1 - (prog - 1) / 0.4) : 1;
  return [x, y, fade, 0, fade * 0.55];
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
