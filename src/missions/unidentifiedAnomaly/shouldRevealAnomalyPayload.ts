import { hash32 } from './unidentifiedAnomalyPolicy';

function salvageAttemptSeedKey(
  planetId: string,
  wreckId: string,
  attemptIndex: number,
  dayKey = '',
): string {
  return `${dayKey}:${planetId}:${wreckId}:${attemptIndex}`;
}

/** 수락·미공개일 때만 30% 공개. 이미 공개·미수락은 skip. */
export function shouldRevealAnomalyPayload(opts: {
  planetId: string;
  wreckId: string;
  attemptIndex: number;
  dayKey?: string;
  instanceId: string;
  accepted: boolean;
  alreadyRevealed: boolean;
  chancePct: number;
}): boolean {
  if (!opts.accepted || opts.alreadyRevealed) return false;
  const chance = Math.max(0, Math.min(100, Math.floor(opts.chancePct)));
  if (chance <= 0) return false;
  if (chance >= 100) return true;
  const seed = `anom:${opts.instanceId}:${salvageAttemptSeedKey(
    opts.planetId,
    opts.wreckId,
    opts.attemptIndex,
    opts.dayKey ?? '',
  )}`;
  return hash32(seed) % 100 < chance;
}
