import { PlanetDefenseSatellitePolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';
import { clampDefenseSatelliteRadiusScale } from '../../worldObjects/planetWorldObjectOrbit';
import { getPlanetDefenseSatelliteMaxLevel } from './planetDefenseSatelliteLevelPolicy';

export type PlanetDefenseSatellitePolicy = {
  minPerPlanet: number;
  defaultWeaponId: string;
  defaultRadiusScale: number;
  defaultPhaseBias: number;
  phaseBiasStep: number;
  radiusScaleStep: number;
  interceptEnabled: boolean;
  defaultLevel: number;
  maxLevel: number;
};

function readPolicyValue(key: string, fallback: string): string {
  const row = PlanetDefenseSatellitePolicy_FROM_BALANCE_CSV.find((r) => r.key === key);
  const raw = row?.value;
  return typeof raw === 'string' && raw.trim().length > 0 ? raw.trim() : fallback;
}

function readPolicyNumber(key: string, fallback: number): number {
  const n = Number(readPolicyValue(String(key), String(fallback)));
  return Number.isFinite(n) ? n : fallback;
}

function readPolicyBoolean(key: string, fallback: boolean): boolean {
  const raw = readPolicyValue(key, fallback ? 'true' : 'false').toLowerCase();
  if (raw === 'true' || raw === '1' || raw === 'yes') return true;
  if (raw === 'false' || raw === '0' || raw === 'no') return false;
  return fallback;
}

let cachedPolicy: PlanetDefenseSatellitePolicy | null = null;

export function getPlanetDefenseSatellitePolicy(): PlanetDefenseSatellitePolicy {
  if (cachedPolicy) return cachedPolicy;
  cachedPolicy = {
    minPerPlanet: Math.max(0, Math.floor(readPolicyNumber('min_per_planet', 1))),
    defaultWeaponId: readPolicyValue('default_weapon_id', 'w_intercept_missile_01'),
    defaultRadiusScale: readPolicyNumber('default_radius_scale', 0.72),
    defaultPhaseBias: readPolicyNumber('default_phase_bias', 0.08),
    phaseBiasStep: readPolicyNumber('phase_bias_step', 0.11),
    radiusScaleStep: readPolicyNumber('radius_scale_step', 0.025),
    interceptEnabled: readPolicyBoolean('intercept_enabled', true),
    defaultLevel: Math.max(1, Math.floor(readPolicyNumber('default_level', 1))),
    maxLevel: Math.max(1, Math.floor(readPolicyNumber('max_level', getPlanetDefenseSatelliteMaxLevel()))),
  };
  return cachedPolicy;
}

/** 행성 id 기반 결정론 위상 — 배치·재시작 후 동일. 짝수 인덱스 기준, 홀수는 +0.5(정반대). */
export function resolveDefenseSatellitePhaseBias(planetId: string, satelliteIndex: number): number {
  const policy = getPlanetDefenseSatellitePolicy();
  let hash = 0;
  for (let i = 0; i < planetId.length; i += 1) {
    hash = (hash * 31 + planetId.charCodeAt(i)) >>> 0;
  }
  const base = (hash % 997) / 997;
  const phase0 = (policy.defaultPhaseBias + base * 0.07) % 1;
  const pairIndex = satelliteIndex % 2;
  const pairOffset = Math.floor(satelliteIndex / 2) * policy.phaseBiasStep;
  if (pairIndex === 0) return (phase0 + pairOffset) % 1;
  return (phase0 + 0.5 + pairOffset) % 1;
}

/** 동일 쌍(0·1, 2·3…)은 같은 반경 — 동일 궤도 속도 */
export function resolveDefenseSatelliteRadiusScale(satelliteIndex: number): number {
  const policy = getPlanetDefenseSatellitePolicy();
  const pairGroup = Math.floor(satelliteIndex / 2);
  const raw = policy.defaultRadiusScale + pairGroup * policy.radiusScaleStep;
  return clampDefenseSatelliteRadiusScale(raw);
}
