/**
 * 정본 21행성 성운 팔레트 — 2026-09-19~20 업그레이드 베이크 PNG 샘플(dark/primary/high).
 * 링 hex는 `planetNebulaBakeRingHex`(주요색 리프트). 보색 금·청록 하이라이트는 본색과 분리.
 */
export type PlanetNebulaCanonPalette = {
  a: string;
  b: string;
  c: string;
  swirlMul?: number;
  densityMul?: number;
};

/** persist 프로필이 구 팔레트면 1회 재빌드. */
export const PLANET_NEBULA_PALETTE_REV = 2;

export const PLANET_NEBULA_CANON_PALETTES: Record<string, PlanetNebulaCanonPalette> = {
  // safe
  arcadia_prime: {
    // 새벽 남청 안개.
    a: '#183451',
    b: '#1d3b59',
    c: '#2a5175',
    swirlMul: 0.92,
    densityMul: 0.88,
  },
  solar_station: {
    // 심야 남청. 부두 호박은 본색이 아님.
    a: '#202f41',
    b: '#253445',
    c: '#414f5d',
    densityMul: 0.94,
  },
  minerva_deep: {
    // 슬레이트. 광맥 호박은 업그레이드 베이크에 없음.
    a: '#1c222a',
    b: '#1e232c',
    c: '#2b3039',
    densityMul: 1.06,
  },
  vega_base: {
    // 냉철 인디고.
    a: '#101f32',
    b: '#15253b',
    c: '#213854',
    swirlMul: 1.04,
  },

  // neutral
  eden_city: {
    // 심자남. 진주 하이라이트는 본색이 아님.
    a: '#222142',
    b: '#252345',
    c: '#2f2d55',
    densityMul: 0.9,
  },
  iron_remnant: {
    // 재 + 녹슨 철.
    a: '#201916',
    b: '#2b211c',
    c: '#3c2e26',
    swirlMul: 1.08,
  },
  draco_haven: {
    // 신비 자청.
    a: '#1f173c',
    b: '#221a42',
    c: '#2d2254',
    swirlMul: 1.12,
    densityMul: 1.1,
  },
  omega_hub: {
    // 황혼 장미강(저채도).
    a: '#341f2c',
    b: '#39222f',
    c: '#482b3a',
  },
  helios_core: {
    // 코로나 호박.
    a: '#4a2a11',
    b: '#593516',
    c: '#7a4b1f',
    swirlMul: 0.96,
    densityMul: 1.08,
  },
  sirius_border: {
    // 인디고 본색. 경고 장미는 희미.
    a: '#1e1a2d',
    b: '#231d32',
    c: '#302742',
  },
  titan_ruins: {
    // 석조 올리브금(저휘도).
    a: '#1d1a15',
    b: '#252019',
    c: '#332d21',
    swirlMul: 1.06,
  },
  perseus_memorial: {
    // 와인 안개.
    a: '#20141c',
    b: '#2d1c25',
    c: '#442b37',
  },

  // pvp
  crimson_base: {
    // 혈홍.
    a: '#320e16',
    b: '#3c111a',
    c: '#531922',
    densityMul: 1.04,
  },
  dark_haven: {
    // 보이드 자청.
    a: '#1f1735',
    b: '#251b3d',
    c: '#322552',
    swirlMul: 1.16,
    densityMul: 0.98,
  },
  blood_station: {
    // 암적.
    a: '#250d11',
    b: '#2e0f13',
    c: '#45161a',
    swirlMul: 1.1,
  },
  shadow_market: {
    // 먹보라. 밀금은 본색이 아님.
    a: '#1d1723',
    b: '#221b27',
    c: '#342a35',
    swirlMul: 1.08,
    densityMul: 0.96,
  },
  abyss_gate: {
    // 심연 자홍.
    a: '#221129',
    b: '#24122b',
    c: '#2f1937',
    swirlMul: 1.14,
    densityMul: 0.94,
  },
  nightfall_citadel: {
    // 자정 보라.
    a: '#231a35',
    b: '#281f3c',
    c: '#392d53',
    swirlMul: 1.1,
    densityMul: 0.96,
  },

  // endgame
  core_prime: {
    // 심홍. 아크 금은 본색이 아님.
    a: '#36151f',
    b: '#3a1721',
    c: '#4f222d',
    swirlMul: 1.08,
    densityMul: 0.98,
  },
  eternal_throne: {
    // 제국 인디고. 창백금은 본색이 아님.
    a: '#111022',
    b: '#151327',
    c: '#201d35',
    swirlMul: 0.94,
  },
  genesis_origin: {
    // 심자. 신화 금은 본색이 아님.
    a: '#211837',
    b: '#2a1f3c',
    c: '#463756',
    swirlMul: 1.18,
    densityMul: 1.04,
  },
};

export function resolvePlanetNebulaCanonPalette(
  planetId: string | null | undefined,
): PlanetNebulaCanonPalette | null {
  const id = planetId?.trim();
  if (!id) return null;
  return PLANET_NEBULA_CANON_PALETTES[id] ?? null;
}
