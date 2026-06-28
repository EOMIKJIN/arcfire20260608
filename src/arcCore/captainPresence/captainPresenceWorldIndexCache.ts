// ============================================================
// Captain presence world index — 캐시만 (순환 참조 차단)
// buildCaptainPresenceWorldIndex ↔ captainOrbitPlanetAssignment 분리용
// ============================================================

import type { CaptainPresenceWorldIndex } from './captainPresenceTypes';

let cachedKey = '';
let cachedIndex: CaptainPresenceWorldIndex | null = null;

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
}
