import type { ZoneType } from '../types';
import { PLANET_NEBULA_BAKE_RING_HEX } from './planetNebulaBakeRingHex';

/**
 * 미개척(synth) 폴백 풀 — 전용 PNG 없음. zone 계열 정본 장을 결정론 재사용.
 */
export const FALLBACK_NEBULA_POOL_BY_ZONE: Record<ZoneType, readonly string[]> = {
  safe: ['arcadia_prime', 'solar_station', 'minerva_deep', 'vega_base'],
  neutral: [
    'eden_city',
    'iron_remnant',
    'draco_haven',
    'omega_hub',
    'helios_core',
    'sirius_border',
    'titan_ruins',
    'perseus_memorial',
  ],
  pvp: ['crimson_base', 'dark_haven', 'blood_station', 'shadow_market', 'abyss_gate', 'nightfall_citadel'],
  endgame: ['core_prime', 'eternal_throne', 'genesis_origin'],
};

function hashStringToInt(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** 화면에 깔린 베이크 장 planetId — 정본 직접 또는 synth zone 폴백. */
export function resolvePlanetNebulaBakeKey(
  planetId: string | null | undefined,
  zone?: ZoneType | null,
): string | null {
  if (planetId == null) return null;
  const id = String(planetId).trim();
  if (!id) return null;
  if (PLANET_NEBULA_BAKE_RING_HEX[id]) return id;
  const pool = FALLBACK_NEBULA_POOL_BY_ZONE[zone ?? 'neutral'] ?? FALLBACK_NEBULA_POOL_BY_ZONE.neutral;
  if (!pool.length) return null;
  return pool[hashStringToInt(id) % pool.length] ?? null;
}
