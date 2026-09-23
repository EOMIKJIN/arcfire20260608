import { resolveStellaLifeAt } from './stellaLifeResolve';
import { snapshotStellaLifeMemory } from './stellaLifeMemory';
import type { StellaLifeEnv, StellaLifeResolved } from './stellaLifeTypes';
import { stellaLifeDayKey, stellaLifeSlotIndex } from './stellaLifeClock';

let cached: { key: string; value: StellaLifeResolved } | null = null;

export function stellaLifeSessionCacheKey(nowMs: number, uid: string): string {
  return `${uid}|${stellaLifeDayKey(nowMs)}|${stellaLifeSlotIndex(nowMs)}`;
}

export function clearStellaLifeSessionCache(): void {
  cached = null;
}

export function readStellaLifeSession(nowMs: number, uid: string, env: StellaLifeEnv): StellaLifeResolved {
  const key = stellaLifeSessionCacheKey(nowMs, uid);
  if (cached && cached.key === key) return cached.value;
  const value = resolveStellaLifeAt(nowMs, uid, env, snapshotStellaLifeMemory());
  cached = { key, value };
  return value;
}
