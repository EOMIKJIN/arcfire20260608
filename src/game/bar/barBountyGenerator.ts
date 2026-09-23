// ============================================================
// v2.0 §6-3 — 바 바운티 보드 생성 (결정적 시드)
// ============================================================

import { resolveBarMercTierUnlock } from '../../arcCore/balance/facilityBarLevelPolicy';
import type { BarBountyEntry } from '../../store/planetCoreMetricTypes';

const BOUNTY_TITLE_KEYS = [
  'bar.bountyTitlePatrol',
  'bar.bountyTitleEscort',
  'bar.bountyTitleHunt',
  'bar.bountyTitleSalvage',
  'bar.bountyTitleDefense',
] as const;

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function generateBarBountyBoard(
  planetId: string,
  level: number,
  slotCount: number,
  nowMs: number,
  refreshIntervalHours: number,
): BarBountyEntry[] {
  const mercTier = resolveBarMercTierUnlock(level);
  const dayBucket = Math.floor(nowMs / (refreshIntervalHours * 3600 * 1000));
  const expiresAtMs = nowMs + refreshIntervalHours * 3600 * 1000;
  const baseReward = 5000 + level * 2500;
  const slots = Math.max(0, Math.floor(slotCount));
  const board: BarBountyEntry[] = [];

  for (let i = 0; i < slots; i += 1) {
    const seed = hashSeed(`${planetId}:${dayBucket}:${i}`);
    const titleKey = BOUNTY_TITLE_KEYS[Math.floor(pseudoRandom(seed) * BOUNTY_TITLE_KEYS.length)]!;
    const rewardMul = 0.85 + pseudoRandom(seed + 17) * 0.35;
    board.push({
      id: `${planetId}_b_${dayBucket}_${i}`,
      titleKey,
      rewardCredits: Math.max(1000, Math.floor(baseReward * rewardMul)),
      mercTier,
      postedAtMs: nowMs,
      expiresAtMs,
    });
  }

  return board;
}

export function listActiveBarBounties(
  board: BarBountyEntry[] | undefined,
  nowMs = Date.now(),
): BarBountyEntry[] {
  if (!board?.length) return [];
  return board.filter((b) => b.expiresAtMs > nowMs);
}
