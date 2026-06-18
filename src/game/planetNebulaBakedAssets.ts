/**
 * 행성별 베이크 성운 PNG — `tools/planet-nebula-bake/bake-planet-nebula-images.ts`로 생성.
 * 프로필 시드·팔레트는 `buildNebulaProfile`과 동일(정적 t=0 프레임).
 */
import type { ImageSourcePropType } from 'react-native';
import type { ZoneType } from '../types';
import { PLANET_NEBULA_BAKED_BY_PLANET_ID } from '../data/generated/planetNebulaBakedAssets';

/**
 * 미개척(synth)·미등록 행성 폴백 풀 — 아크코어가 미개척 성계를 개방하면 `synth_NNN_p` 같은
 * 절차 생성 행성이 생기는데, 이들은 전용 베이크 PNG가 없다(베이크는 정본 21행성만 존재).
 * 베이크는 빌드타임 정적 에셋이라 런타임에 새로 굽지 못하므로, 같은 zone 계열의 기존 성운
 * 이미지를 결정론적으로 재사용해 "현재 행성환경과 유사한" 성운을 즉시 부여한다.
 * (synth 행성은 galaxy100.ts에서 zone 'neutral' 로 생성된다.)
 */
const FALLBACK_NEBULA_POOL_BY_ZONE: Record<ZoneType, readonly string[]> = {
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

/** 행성 id 해시 — 폴백 성운을 행성마다 안정적·결정론적으로 분산 선택한다. */
function hashStringToInt(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * 행성 id로 베이크 성운 소스를 해석한다.
 * 1) 정본 21행성: 전용 베이크 PNG 직접 반환(기존 동작 불변).
 * 2) 미개척/미등록 행성: zone 계열 풀에서 id 해시로 1장 결정론적 선택(동일 성운 이미지 재사용).
 *    zone 미지정 시 'neutral' 풀(미개척 기본 zone)을 사용한다.
 */
export function resolvePlanetNebulaBakedSource(
  planetId: string | null | undefined,
  zone?: ZoneType | null,
): ImageSourcePropType | null {
  if (planetId == null) return null;
  const id = String(planetId).trim();
  if (!id) return null;

  const direct = PLANET_NEBULA_BAKED_BY_PLANET_ID[id];
  if (direct) return direct;

  // 미개척/미등록 — zone 계열 풀에서 결정론적 폴백(아크코어 개방 행성도 성운이 보이게 한다).
  const pool = FALLBACK_NEBULA_POOL_BY_ZONE[zone ?? 'neutral'] ?? FALLBACK_NEBULA_POOL_BY_ZONE.neutral;
  if (!pool.length) return null;
  const pick = pool[hashStringToInt(id) % pool.length]!;
  return PLANET_NEBULA_BAKED_BY_PLANET_ID[pick] ?? null;
}
