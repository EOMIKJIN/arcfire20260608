/**
 * 허브 행성 원반 베이크 샘플 — 빌드타임 + 개척 unlock 1회 패스.
 * 런타임 틱·Skia 루프·PlanetDot 렌더에서 import 금지. 해상도 256 (허브 표시 ~84px).
 */
import type { PlanetGlobeLookRow, PlanetGlobeVariant, Rgb01 } from './planetGlobeLookCanon';

export const PLANET_GLOBE_BAKE_SIZE_PX = 256;

type Rgb = [number, number, number];

function fract(x: number): number {
  return x - Math.floor(x);
}

function hash(ix: number, iy: number, seed: number): number {
  return fract(Math.sin(ix * 127.1 + iy * 311.7 + seed * 0.00021) * 43758.5453123);
}

function noise(x: number, y: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = fract(x);
  const fy = fract(y);
  const a = hash(ix, iy, seed);
  const b = hash(ix + 1, iy, seed);
  const c = hash(ix, iy + 1, seed);
  const d = hash(ix + 1, iy + 1, seed);
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy;
}

function fbm(x: number, y: number, seed: number, octaves: number): number {
  let v = 0;
  let a = 0.5;
  let px = x;
  let py = y;
  for (let i = 0; i < octaves; i += 1) {
    v += a * noise(px, py, seed + i * 19);
    const nx = 1.7 * px + -1.15 * py;
    const ny = 1.15 * px + 1.7 * py;
    px = nx;
    py = ny;
    a *= 0.5;
  }
  return v;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function mix3(a: Rgb | Rgb01, b: Rgb | Rgb01, t: number): Rgb {
  const k = clamp01(t);
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
}

function sampleHabit(px: number, py: number, nz: number, r: number, seed: number, ndotl: number, wrap: number, v: PlanetGlobeVariant): Rgb {
  const sc = v.scale;
  const warp = fbm(px * 1.15 * sc + v.ox, py * 1.15 * sc + v.oy, seed, 4);
  const continent =
    fbm(px * 2.05 * sc + warp * 0.55 + v.ox, py * 2.15 * sc - warp * 0.4 + v.oy, seed + 3, 5) * 0.72 +
    fbm(px * 4.4 * sc + 8.2, py * 4.1 * sc - 3.3, seed + 11, 3) * 0.28;
  const land = smoothstep(v.landLo, v.landHi, continent);
  const coast = smoothstep(v.landLo - 0.06, v.landLo + 0.04, continent) * (1 - land);
  const highland = fbm(px * 7.2 * sc + 1.7, py * 6.8 * sc - 2.1, seed + 21, 4);
  const meadow = fbm(px * 5.1 * sc - 4.4, py * 5.4 * sc + 2.8, seed + 29, 3);

  let albedo = mix3(v.c0, v.c1, clamp01(continent * 1.1 + 0.15));
  const landCol = mix3(v.c2, v.c3, smoothstep(0.35, 0.7, meadow));
  albedo = mix3(albedo, mix3(landCol, v.c4, smoothstep(0.58, 0.82, highland) * 0.65), land);
  albedo = mix3(albedo, v.c1, coast * 0.55);

  const spec = land < 0.35 ? Math.pow(ndotl, 18) * 0.22 : 0;
  let col: Rgb = [albedo[0] * wrap + spec, albedo[1] * wrap + spec * 0.95, albedo[2] * wrap + spec * 0.85];

  const cloudN =
    fbm(px * 3.05 * sc + 12.4 + v.ox, py * 2.7 * sc - 6.1 + v.oy, seed + 41, 5) * 0.7 +
    fbm(px * 6.8 * sc - 3.2, py * 6.2 * sc + 1.5, seed + 47, 3) * 0.3;
  const cloud = smoothstep(v.cloudLo, v.cloudHi, cloudN) * (0.62 + 0.38 * nz);
  col = mix3(col, mix3([0.94, 0.97, 0.99], [0.62, 0.7, 0.78], 1 - ndotl), cloud * 0.78);
  col = mix3(col, v.atmo, Math.pow(1 - nz, 2.15) * 0.72);
  col = mix3(col, v.rim, smoothstep(0.78, 0.98, r) * (0.35 + 0.65 * ndotl) * 0.45);
  return col;
}

function sampleArid(px: number, py: number, nz: number, r: number, seed: number, ndotl: number, wrap: number, v: PlanetGlobeVariant): Rgb {
  const sc = v.scale;
  const n =
    fbm(px * 2.4 * sc + v.ox, py * 2.2 * sc + v.oy, seed, 5) * 0.65 +
    fbm(px * 7.1 * sc, py * 6.4 * sc, seed + 8, 3) * 0.35;
  const dune = fbm(px * 9.2 * sc + py * 2.1, py * 3.4 * sc, seed + 14, 3);
  let col = mix3(v.c0, v.c1, smoothstep(v.landLo, v.landHi, n));
  col = mix3(col, v.c2, smoothstep(0.55, 0.8, dune) * 0.45);
  col = [col[0] * wrap, col[1] * wrap, col[2] * wrap];
  const haze = smoothstep(v.cloudLo, v.cloudHi, fbm(px * 2.8 * sc, py * 2.6 * sc, seed + 40, 4)) * 0.28 * nz;
  col = mix3(col, v.c3, haze);
  col = mix3(col, v.atmo, Math.pow(1 - nz, 2.1) * 0.5);
  col = mix3(col, v.rim, smoothstep(0.8, 0.98, r) * ndotl * 0.35);
  return col;
}

function sampleBarren(px: number, py: number, nz: number, r: number, seed: number, ndotl: number, wrap: number, v: PlanetGlobeVariant): Rgb {
  const sc = v.scale;
  const n = fbm(px * 3.2 * sc + v.ox, py * 3.0 * sc + v.oy, seed, 5);
  const crater = Math.pow(1 - Math.abs(fbm(px * 8.4 * sc, py * 8.1 * sc, seed + 17, 3) - 0.55) * 2, 2);
  let col = mix3(v.c0, v.c1, smoothstep(v.landLo, v.landHi, n));
  col = mix3(col, v.c2, crater * 0.4);
  const bump = 0.82 + crater * 0.28;
  col = [col[0] * wrap * bump, col[1] * wrap * bump, col[2] * wrap * bump];
  col = mix3(col, v.c3, Math.pow(1 - nz, 2.2) * 0.28);
  col = mix3(col, v.rim, smoothstep(0.82, 0.98, r) * ndotl * 0.22);
  return col;
}

function sampleVolcanic(px: number, py: number, nz: number, r: number, seed: number, ndotl: number, wrap: number, v: PlanetGlobeVariant): Rgb {
  const sc = v.scale;
  const crust = fbm(px * 2.6 * sc + v.ox, py * 2.5 * sc + v.oy, seed, 5);
  const crackN = fbm(px * 10.5 * sc + 3, py * 9.8 * sc - 2, seed + 22, 4);
  const crack = smoothstep(v.extra, v.extra + 0.16, crackN);
  let col = mix3(v.c0, v.c1, smoothstep(v.landLo, v.landHi, crust));
  col = [col[0] * wrap, col[1] * wrap, col[2] * wrap];
  const emit = crack * (0.55 + 0.45 * (1 - ndotl));
  col = mix3(col, mix3(v.c2, v.c3, ndotl), emit);
  col = mix3(col, v.atmo, Math.pow(1 - nz, 2) * 0.4);
  col = mix3(col, v.rim, smoothstep(0.8, 0.98, r) * 0.35);
  return col;
}

function sampleGas(px: number, py: number, nz: number, r: number, seed: number, ndotl: number, wrap: number, v: PlanetGlobeVariant): Rgb {
  const sc = v.scale;
  const freq = Math.max(2.5, v.extra);
  const band = Math.sin(py * freq + fbm(px * 1.8 * sc + v.ox, py * 2.4 * sc + v.oy, seed, 4) * 2.4);
  const storm = fbm(px * 3.6 * sc + 4, py * 2.2 * sc, seed + 9, 4);
  let col = mix3(v.c0, v.c1, 0.5 + band * 0.5);
  col = mix3(col, v.c2, smoothstep(v.cloudLo, v.cloudHi, storm) * 0.45);
  col = [col[0] * (0.22 + wrap * 0.78), col[1] * (0.22 + wrap * 0.78), col[2] * (0.22 + wrap * 0.78)];
  col = mix3(col, v.c3, Math.pow(1 - nz, 2.05) * 0.62);
  col = mix3(col, v.rim, smoothstep(0.78, 0.98, r) * ndotl * 0.4);
  return col;
}

function sampleUmbral(px: number, py: number, nz: number, r: number, seed: number, ndotl: number, wrap: number, v: PlanetGlobeVariant): Rgb {
  const sc = v.scale;
  const n = fbm(px * 2.8 * sc + v.ox, py * 2.6 * sc + v.oy, seed, 5);
  const veil = fbm(px * 4.4 * sc, py * 3.8 * sc, seed + 13, 4);
  let col = mix3(v.c0, v.c1, smoothstep(v.landLo, v.landHi, n));
  col = [col[0] * (0.12 + wrap * 0.55), col[1] * (0.12 + wrap * 0.55), col[2] * (0.12 + wrap * 0.55)];
  col = mix3(col, v.c2, smoothstep(v.cloudLo, v.cloudHi, veil) * 0.4);
  col = mix3(col, v.c3, Math.pow(1 - nz, 2.3) * 0.55);
  col = mix3(col, v.rim, smoothstep(0.8, 0.98, r) * (0.25 + ndotl * 0.4));
  return col;
}

function sampleAether(px: number, py: number, nz: number, r: number, seed: number, ndotl: number, wrap: number, v: PlanetGlobeVariant): Rgb {
  const sc = v.scale;
  const n = fbm(px * 2.1 * sc + v.ox, py * 2.0 * sc + v.oy, seed, 5);
  const vein = fbm(px * 6.8 * sc, py * 6.2 * sc, seed + 19, 4);
  let col = mix3(v.c0, v.c1, smoothstep(v.landLo, v.landHi, n));
  col = mix3(col, v.c2, smoothstep(0.66, 0.84, vein) * 0.4);
  col = [col[0] * wrap, col[1] * wrap, col[2] * wrap];
  const spec = Math.pow(ndotl, 14) * 0.18;
  col = [col[0] + spec, col[1] + spec * 0.9, col[2] + spec * 0.55];
  col = mix3(col, v.c3, Math.pow(1 - nz, 2.05) * 0.58);
  col = mix3(col, v.rim, smoothstep(0.78, 0.98, r) * ndotl * 0.42);
  return col;
}

function sampleStation(px: number, py: number, nz: number, r: number, seed: number, ndotl: number, wrap: number, v: PlanetGlobeVariant): Rgb {
  const sc = v.scale;
  const plate = fbm(px * 5.2 * sc + v.ox, py * 5.0 * sc + v.oy, seed, 4);
  let col = mix3(v.c0, v.c1, smoothstep(v.landLo, v.landHi, plate));
  const ring = smoothstep(0.045, 0, Math.abs(py - v.extra - 0.05 * px));
  col = mix3(col, v.c2, ring * 0.75);
  const grid = Math.abs(Math.sin(px * (16 + v.rotDeg * 0.04)) * Math.sin(py * 15));
  col = mix3(col, mix3(v.c1, [0.55, 0.58, 0.62], 0.4), (1 - grid) * 0.12);
  col = [col[0] * wrap, col[1] * wrap, col[2] * wrap];
  const lights = smoothstep(v.cloudLo, v.cloudHi, fbm(px * 14 * sc, py * 14 * sc, seed + 33, 3)) * (1 - ndotl);
  col = mix3(col, v.c3, lights * 0.55);
  col = mix3(col, v.c4, Math.pow(1 - nz, 2.2) * 0.32);
  col = mix3(col, v.rim, smoothstep(0.84, 0.98, r) * ndotl * 0.28);
  return col;
}

export function samplePlanetGlobeLookRgba(
  row: PlanetGlobeLookRow,
  fragX: number,
  fragY: number,
  res: number,
): [number, number, number, number] {
  const uvx = fragX / Math.max(res, 1);
  const uvy = fragY / Math.max(res, 1);
  const nx = (uvx - 0.5) * 2;
  const ny = (uvy - 0.5) * 2;
  const r2 = nx * nx + ny * ny;
  if (r2 > 1.02) return [0, 0, 0, 0];

  const r = Math.sqrt(Math.max(0, r2));
  const nz = Math.sqrt(Math.max(0, 1 - Math.min(1, r2)));
  const edge = 1 - smoothstep(0.965, 1.0, r);
  if (edge <= 0.002) return [0, 0, 0, 0];

  const v = row.variant;
  const llen = Math.hypot(v.lightX, v.lightY, v.lightZ) || 1;
  const ndotl = clamp01(nx * (v.lightX / llen) + ny * (v.lightY / llen) + nz * (v.lightZ / llen));
  const wrap = 0.18 + 0.82 * Math.pow(ndotl, 1.08);

  const rad = (v.rotDeg * Math.PI) / 180;
  const cs = Math.cos(rad);
  const sn = Math.sin(rad);
  const px = nx * cs - ny * sn;
  const py = nx * sn + ny * cs;

  let col: Rgb;
  switch (row.kind) {
    case 'habit':
      col = sampleHabit(px, py, nz, r, row.seed, ndotl, wrap, v);
      break;
    case 'arid':
      col = sampleArid(px, py, nz, r, row.seed, ndotl, wrap, v);
      break;
    case 'barren':
      col = sampleBarren(px, py, nz, r, row.seed, ndotl, wrap, v);
      break;
    case 'volcanic':
      col = sampleVolcanic(px, py, nz, r, row.seed, ndotl, wrap, v);
      break;
    case 'gas':
      col = sampleGas(px, py, nz, r, row.seed, ndotl, wrap, v);
      break;
    case 'umbral':
      col = sampleUmbral(px, py, nz, r, row.seed, ndotl, wrap, v);
      break;
    case 'aether':
      col = sampleAether(px, py, nz, r, row.seed, ndotl, wrap, v);
      break;
    case 'station':
      col = sampleStation(px, py, nz, r, row.seed, ndotl, wrap, v);
      break;
    default:
      col = sampleArid(px, py, nz, r, row.seed, ndotl, wrap, v);
  }

  return [clamp01(col[0]), clamp01(col[1]), clamp01(col[2]), edge];
}
