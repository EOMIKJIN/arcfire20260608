import type { StelliumColonizeCoreGauges, StelliumColonizePolicy } from './stelliumColonizeTypes';

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function clamp100(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

export function resolveStelliumColonizeAttemptBand(
  attempt: number,
  policy: StelliumColonizePolicy,
): { minPct: number; maxPct: number } {
  if (attempt <= 1) return { minPct: policy.attempt1MinPct, maxPct: policy.attempt1MaxPct };
  if (attempt === 2) return { minPct: policy.attempt2MinPct, maxPct: policy.attempt2MaxPct };
  return { minPct: policy.attempt3MinPct, maxPct: policy.attempt3MaxPct };
}

/**
 * D·가혹 E(낮은 E) → 하단. P·T → 상단.
 * t=0 하단, t=1 상단. 캡은 정책 successCapPct.
 */
export function resolveStelliumColonizeSuccessPct(
  attempt: number,
  gauges: StelliumColonizeCoreGauges,
  policy: StelliumColonizePolicy,
): number {
  const band = resolveStelliumColonizeAttemptBand(attempt, policy);
  const p = clamp100(gauges.population);
  const t = clamp100(gauges.technology);
  const d = clamp100(gauges.defense);
  const e = clamp100(gauges.environment);
  const boost = (p + t) / 200;
  const harsh = (d + (100 - e)) / 200;
  const mix = clamp01(0.5 + (boost - harsh) * 0.5);
  const raw = band.minPct + (band.maxPct - band.minPct) * mix;
  return Math.min(policy.successCapPct, Math.max(band.minPct, raw));
}

export function computeStelliumColonizeRoll01(
  dayKey: string,
  planetId: string,
  attempt: number,
): number {
  const seed = `${dayKey}:${planetId}:${attempt}:stellium_colonize`;
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

export function shouldStelliumColonizeHqSucceed(input: {
  dayKey: string;
  planetId: string;
  attempt: number;
  gauges: StelliumColonizeCoreGauges;
  policy: StelliumColonizePolicy;
}): { success: boolean; chancePct: number; roll01: number } {
  const chancePct = resolveStelliumColonizeSuccessPct(input.attempt, input.gauges, input.policy);
  const roll01 = computeStelliumColonizeRoll01(input.dayKey, input.planetId, input.attempt);
  return {
    success: roll01 < chancePct / 100,
    chancePct,
    roll01,
  };
}
