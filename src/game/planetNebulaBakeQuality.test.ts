/**
 * npx tsx --test src/game/planetNebulaBakeQuality.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PLANET_NEBULA_CANON_PALETTES } from './planetNebulaCanonPalettes';
import {
  PLANET_NEBULA_BAKE_RING_HEX,
  resolvePlanetNebulaBakeRingHex,
} from './planetNebulaBakeRingHex';
import { resolvePlanetNebulaBakeKey } from './planetNebulaBakeKey';
import {
  nebulaProfileToBakeUniforms,
  samplePlanetNebulaRgba,
} from './planetNebulaBakeSample';
import { buildNebulaProfile, resolvePlanetAtmosphereRingHex } from './planetNebulaProfile';
import type { Planet, ZoneType } from '../types';

const CORE21 = [
  'arcadia_prime',
  'solar_station',
  'minerva_deep',
  'vega_base',
  'eden_city',
  'iron_remnant',
  'draco_haven',
  'omega_hub',
  'helios_core',
  'sirius_border',
  'titan_ruins',
  'perseus_memorial',
  'crimson_base',
  'dark_haven',
  'blood_station',
  'shadow_market',
  'abyss_gate',
  'nightfall_citadel',
  'core_prime',
  'eternal_throne',
  'genesis_origin',
] as const;

const BROKEN_BEFORE = [
  'dark_haven',
  'abyss_gate',
  'arcadia_prime',
  'nightfall_citadel',
  'shadow_market',
] as const;

function stubPlanet(id: string): Planet {
  return {
    id,
    systemId: id,
    name: id,
    nameEn: id,
    description: '',
    descriptionEn: '',
    hasTradePort: false,
    hasShipyard: false,
    hasBar: false,
    tradeGoods: [],
    factionId: 'test',
    coreResource: 40,
    corePopulation: 40,
    coreDefense: 40,
    coreTechnology: 40,
    coreEnvironment: 40,
    backdropImageAssetKey: null,
    infoPanelPortraitAssetKey: null,
    mainStageSkiaNebulaEnabled: true,
    mainStageBackdropImageEnabled: false,
  };
}

function rgbToHueDeg(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d < 1e-5) return 0;
  let h = 0;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  return h < 0 ? h + 360 : h;
}

function rgbSat(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max < 1e-5 ? 0 : (max - min) / max;
}

/** 가산 합성이 만들던 연두·청록 섬 (sat 높은 95~190°) */
function sampleTealLimeArtifactRatio(planetId: string, zone: ZoneType = 'neutral'): number {
  const profile = buildNebulaProfile(stubPlanet(planetId), zone);
  const uniforms = nebulaProfileToBakeUniforms(profile);
  const size = 72;
  let opaque = 0;
  let artifact = 0;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const [r, g, b, a] = samplePlanetNebulaRgba(x, y, size, uniforms, 0);
      if (a < 0.28) continue;
      opaque += 1;
      const sat = rgbSat(r, g, b);
      if (sat < 0.4) continue;
      const h = rgbToHueDeg(r, g, b);
      if (h >= 95 && h <= 190) artifact += 1;
    }
  }
  return opaque === 0 ? 0 : artifact / opaque;
}

test('정본 21행성 팔레트가 모두 있다', () => {
  for (const id of CORE21) {
    assert.ok(PLANET_NEBULA_CANON_PALETTES[id], id);
  }
  assert.equal(Object.keys(PLANET_NEBULA_CANON_PALETTES).length, 21);
});

test('정본 팔레트는 청록·금 보색 가산 타깃을 쓰지 않는다', () => {
  for (const row of Object.values(PLANET_NEBULA_CANON_PALETTES)) {
    assert.notEqual(row.b.toLowerCase(), '#4ec5ff');
    assert.notEqual(row.c.toLowerCase(), '#ffcc66');
  }
});

test('깨졌던 5장 포함 21장에 연두·청록 섬이 없다', () => {
  const zoneById: Record<string, ZoneType> = {
    arcadia_prime: 'safe',
    solar_station: 'safe',
    minerva_deep: 'safe',
    vega_base: 'safe',
    crimson_base: 'pvp',
    dark_haven: 'pvp',
    blood_station: 'pvp',
    shadow_market: 'pvp',
    abyss_gate: 'pvp',
    nightfall_citadel: 'pvp',
    core_prime: 'endgame',
    eternal_throne: 'endgame',
    genesis_origin: 'endgame',
  };
  for (const id of CORE21) {
    const ratio = sampleTealLimeArtifactRatio(id, zoneById[id] ?? 'neutral');
    assert.equal(ratio <= 0.012, true, `${id} tealLimeRatio=${ratio.toFixed(3)}`);
  }
  for (const id of BROKEN_BEFORE) {
    const ratio = sampleTealLimeArtifactRatio(id, zoneById[id] ?? 'pvp');
    assert.equal(ratio <= 0.006, true, `${id} still artifact ${ratio.toFixed(3)}`);
  }
});

test('아르카디아 팔레트는 새벽 남청이지 연두가 아니다', () => {
  const p = buildNebulaProfile(stubPlanet('arcadia_prime'), 'safe');
  const c = p.paletteC;
  const n = parseInt(c.slice(1), 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  assert.equal(b > g, true, `C should be blue-haze not lime (${c})`);
  assert.equal(g - r < 90, true);
});

function hexHueDeg(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return rgbToHueDeg(((n >> 16) & 0xff) / 255, ((n >> 8) & 0xff) / 255, (n & 0xff) / 255);
}

function hueDeltaDeg(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

const STALE_HIGHLIGHT_MISMATCH = [
  'minerva_deep',
  'solar_station',
  'eternal_throne',
  'shadow_market',
  'genesis_origin',
  'sirius_border',
  'core_prime',
] as const;

test('베이크 링 hex가 정본 21성과 일치하고 주요색(B)과 같은 가문이다', () => {
  for (const id of CORE21) {
    const ring = PLANET_NEBULA_BAKE_RING_HEX[id];
    assert.ok(ring, id);
    const canon = PLANET_NEBULA_CANON_PALETTES[id]!;
    const d = hueDeltaDeg(hexHueDeg(ring), hexHueDeg(canon.b));
    assert.equal(d <= 22, true, `${id} ring ${ring} vs primary ${canon.b} hueΔ=${d.toFixed(1)}`);
  }
  assert.equal(Object.keys(PLANET_NEBULA_BAKE_RING_HEX).length, 21);
});

test('하이라이트 금·호박에 묶이던 7성은 베이크 본색 링이다', () => {
  const forbiddenOld: Record<string, string> = {
    minerva_deep: '#6e5f4f',
    solar_station: '#73756f',
    eternal_throne: '#6e6362',
    shadow_market: '#6c5754',
    genesis_origin: '#857279',
    sirius_border: '#664664',
    core_prime: '#a36954',
  };
  for (const id of STALE_HIGHLIGHT_MISMATCH) {
    const ring = resolvePlanetAtmosphereRingHex(id, 'neutral');
    assert.ok(ring, id);
    assert.notEqual(ring.toLowerCase(), forbiddenOld[id]);
    const d = hueDeltaDeg(hexHueDeg(ring), hexHueDeg(PLANET_NEBULA_CANON_PALETTES[id]!.b));
    assert.equal(d <= 18, true, `${id} still stale hueΔ=${d.toFixed(1)} ring=${ring}`);
  }
});

test('synth 폴백 성운 링은 깔린 베이크 장과 같은 키다', () => {
  const key = resolvePlanetNebulaBakeKey('synth_002_p', 'neutral');
  assert.ok(key);
  const ring = resolvePlanetAtmosphereRingHex('synth_002_p', 'neutral');
  assert.equal(ring, resolvePlanetNebulaBakeRingHex(key));
});
