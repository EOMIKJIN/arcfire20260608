import type { PlanetNebulaProfile } from './planetNebulaProfile';
import { hexToRgb01 } from './planetNebulaProfile';

/** 베이크·런타임 공통 — Skia 성운 SKSL과 동일 수식(정적 프레임 t=0). */
export const PLANET_NEBULA_BAKE_SIZE_PX = 1024;

export type PlanetNebulaBakeUniforms = {
  seed: number;
  flowSpeed: number;
  swirl: number;
  density: number;
  colA: [number, number, number];
  colB: [number, number, number];
  colC: [number, number, number];
};

export function nebulaProfileToBakeUniforms(profile: PlanetNebulaProfile): PlanetNebulaBakeUniforms {
  return {
    seed: profile.seed,
    flowSpeed: profile.flowSpeed,
    swirl: profile.swirl,
    density: profile.density,
    colA: hexToRgb01(profile.paletteA),
    colB: hexToRgb01(profile.paletteB),
    colC: hexToRgb01(profile.paletteC),
  };
}

function fract(x: number): number {
  return x - Math.floor(x);
}

function dot2(a: [number, number], b: [number, number]): number {
  return a[0] * b[0] + a[1] * b[1];
}

function hash(p: [number, number], seed: number): number {
  return fract(Math.sin(dot2(p, [127.1, 311.7]) + seed * 0.00021) * 43758.5453123);
}

function noise(p: [number, number], seed: number): number {
  const i: [number, number] = [Math.floor(p[0]), Math.floor(p[1])];
  const f: [number, number] = [fract(p[0]), fract(p[1])];
  const a = hash(i, seed);
  const b = hash([i[0] + 1, i[1]], seed);
  const c = hash([i[0], i[1] + 1], seed);
  const d = hash([i[0] + 1, i[1] + 1], seed);
  const u: [number, number] = [f[0] * f[0] * (3 - 2 * f[0]), f[1] * f[1] * (3 - 2 * f[1])];
  return (
    a * (1 - u[0]) * (1 - u[1]) +
    b * u[0] * (1 - u[1]) +
    c * (1 - u[0]) * u[1] +
    d * u[0] * u[1]
  );
}

function fbm(p: [number, number], seed: number): number {
  let v = 0;
  let a = 0.5;
  let cur: [number, number] = [p[0], p[1]];
  for (let i = 0; i < 5; i += 1) {
    v += a * noise(cur, seed);
    const nx = 1.6 * cur[0] + -1.2 * cur[1];
    const ny = 1.2 * cur[0] + 1.6 * cur[1];
    cur = [nx, ny];
    a *= 0.53;
  }
  return v;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** fragcoord 기준 RGBA 0..1 — SkiaPlanetNebulaShaderBackdrop SKSL과 동일. */
export function samplePlanetNebulaRgba(
  fragX: number,
  fragY: number,
  res: number,
  uniforms: PlanetNebulaBakeUniforms,
  tSec = 0,
): [number, number, number, number] {
  const uv: [number, number] = [fragX / Math.max(res, 1), fragY / Math.max(res, 1)];
  let p: [number, number] = [(uv[0] - 0.5) * 2.3, (uv[1] - 0.5) * 1.7];
  const t = tSec * uniforms.flowSpeed;
  const sw = Math.max(0.6, uniforms.swirl);
  const d = Math.max(0.05, Math.min(1.4, uniforms.density));
  const seed = uniforms.seed;

  const n1 = fbm([p[0] * (2 + d * 0.4) + 0, p[1] * (2 + d * 0.4) + t], seed);
  const n2 = fbm([p[0] * (3.1 + d * 0.5) + t * 0.9, p[1] * (3.1 + d * 0.5) - t * 0.35], seed);
  const n3 = fbm([p[0] * (4.9 + d * 0.3) - t * 0.65, p[1] * (4.9 + d * 0.3) + t * 0.52], seed);
  let n = n1 * 0.5 + n2 * 0.32 + n3 * 0.18;
  n += Math.sin((p[0] * 1.4 + p[1] * 1.1) * sw + t * 2.2) * 0.08;

  const fog = smoothstep(0.22, 0.88, n);
  const ridge = smoothstep(0.6, 0.94, n + 0.04 * Math.sin((p[0] - p[1]) * 5.2 + t * 1.3));
  let col: [number, number, number] = [uniforms.colA[0], uniforms.colA[1], uniforms.colA[2]];
  col = [
    col[0] + uniforms.colB[0] * fog * (0.68 + d * 0.2),
    col[1] + uniforms.colB[1] * fog * (0.68 + d * 0.2),
    col[2] + uniforms.colB[2] * fog * (0.68 + d * 0.2),
  ];
  col = [
    col[0] + uniforms.colC[0] * ridge * (0.48 + d * 0.36),
    col[1] + uniforms.colC[1] * ridge * (0.48 + d * 0.36),
    col[2] + uniforms.colC[2] * ridge * (0.48 + d * 0.36),
  ];

  const vignette = smoothstep(1.34, 0.36, Math.hypot(p[0] * 1, p[1] * 1.2));
  col = [col[0] * vignette, col[1] * vignette, col[2] * vignette];

  const c: [number, number] = [uv[0] - 0.5, uv[1] - 0.5];
  const r = Math.hypot(c[0], c[1]);
  const ang = Math.atan2(c[1], c[0]);
  const wobble =
    (fbm([c[0] * 6.2 + tSec * 0.1, c[1] * 6.2 - tSec * 0.08], seed) - 0.5) * 0.1 +
    Math.sin(ang * 3 + tSec * 0.24) * 0.02 +
    Math.sin(ang * 7 - tSec * 0.17) * 0.013;
  const cloudCore = 0.35 + wobble;
  const cloudOuter = cloudCore + 0.16;
  const edgeFade = 1 - smoothstep(cloudCore, cloudOuter, r);
  const tailFade = 1 - smoothstep(cloudOuter - 0.02, cloudOuter + 0.08, r);
  const alpha = Math.max(0, Math.min(1, edgeFade * tailFade * vignette));

  return [Math.max(0, col[0]), Math.max(0, col[1]), Math.max(0, col[2]), alpha];
}
