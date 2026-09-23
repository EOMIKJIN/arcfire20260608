// ============================================================
// Captain presence world index — 캐시만 (순환 참조 차단)
// buildCaptainPresenceWorldIndex ↔ captainOrbitPlanetAssignment 분리용
// ============================================================

import type { CaptainPresenceWorldIndex } from './captainPresenceTypes';

let cachedKey = '';
let cachedIndex: CaptainPresenceWorldIndex | null = null;
let lastEpochBucket = Number.NaN;
let lastDayBucket = Number.NaN;
let lastShips: readonly unknown[] | null = null;
let lastGovMap: ReadonlyMap<string, string> | null = null;
let lastUnlockedSig = '';

export function readCaptainPresenceWorldIndexIfUnchanged(
  epochBucket: number,
  dayBucket: number,
  ships: readonly unknown[],
  govMap: ReadonlyMap<string, string>,
  unlockedSig: string,
): CaptainPresenceWorldIndex | null {
  if (
    cachedIndex
    && lastEpochBucket === epochBucket
    && lastDayBucket === dayBucket
    && lastShips === ships
    && lastGovMap === govMap
    && lastUnlockedSig === unlockedSig
  ) {
    return cachedIndex;
  }
  return null;
}

export function rememberCaptainPresenceWorldIndexInputs(
  epochBucket: number,
  dayBucket: number,
  ships: readonly unknown[],
  govMap: ReadonlyMap<string, string>,
  unlockedSig: string,
): void {
  lastEpochBucket = epochBucket;
  lastDayBucket = dayBucket;
  lastShips = ships;
  lastGovMap = govMap;
  lastUnlockedSig = unlockedSig;
}

export function readCaptainPresenceWorldIndexCache(
  key: string,
): CaptainPresenceWorldIndex | null {
  if (cachedIndex && cachedKey === key) return cachedIndex;
  return null;
}

export function writeCaptainPresenceWorldIndexCache(
  key: string,
  index: CaptainPresenceWorldIndex,
): void {
  cachedKey = key;
  cachedIndex = index;
}

export function invalidateCaptainPresenceWorldIndexCache(): void {
  cachedKey = '';
  cachedIndex = null;
  lastEpochBucket = Number.NaN;
  lastDayBucket = Number.NaN;
  lastShips = null;
  lastGovMap = null;
  lastUnlockedSig = '';
}
