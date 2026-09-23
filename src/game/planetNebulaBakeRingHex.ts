/**
 * 허브 행성 볼드 링 — 업그레이드 베이크 PNG **주요색**(안개 본색)에서 리프트한 hex.
 * 능선 하이라이트(옛 C=금·호박)를 45% 섞으면 본색과 어긋난다.
 * 런타임 PNG 디코드 없음(정적 맵). synth는 `resolvePlanetNebulaBakeKey`로 폴백 장과 동일 키.
 */
export const PLANET_NEBULA_BAKE_RING_HEX: Record<string, string> = {
  abyss_gate: '#6e3286',
  arcadia_prime: '#3072b1',
  blood_station: '#912631',
  core_prime: '#883046',
  crimson_base: '#952337',
  dark_haven: '#4a3286',
  draco_haven: '#422e8a',
  eden_city: '#403d88',
  eternal_throne: '#40397e',
  genesis_origin: '#5c4280',
  helios_core: '#af6829',
  iron_remnant: '#775340',
  minerva_deep: '#405677',
  nightfall_citadel: '#503b80',
  omega_hub: '#793f5f',
  perseus_memorial: '#77405c',
  shadow_market: '#674077',
  sirius_border: '#513e79',
  solar_station: '#4c6b8c',
  titan_ruins: '#776240',
  vega_base: '#2b578d',
};

export function resolvePlanetNebulaBakeRingHex(
  bakePlanetId: string | null | undefined,
): string | null {
  const id = bakePlanetId?.trim();
  if (!id) return null;
  return PLANET_NEBULA_BAKE_RING_HEX[id] ?? null;
}
