import type { Planet, ZoneType } from '../types';

export type PlanetNebulaProfile = {
  seed: number;
  flowSpeed: number;
  swirl: number;
  density: number;
  paletteA: string;
  paletteB: string;
  paletteC: string;
  updatedAt: number;
};

function hashStringToInt(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return function rand() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function mixHex(a: string, b: string, tRaw: number): string {
  const t = clamp01(tRaw);
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ar = (pa >> 16) & 0xff;
  const ag = (pa >> 8) & 0xff;
  const ab = pa & 0xff;
  const br = (pb >> 16) & 0xff;
  const bg = (pb >> 8) & 0xff;
  const bb = pb & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bch = Math.round(ab + (bb - ab) * t);
  return `#${[r, g, bch].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}

function resolveZonePalette(zone: ZoneType): { a: string; b: string; c: string } {
  switch (zone) {
    case 'safe':
      return { a: '#17253f', b: '#335b9a', c: '#78b7ff' };
    case 'neutral':
      return { a: '#221b3e', b: '#5a3d9a', c: '#7f65d7' };
    case 'pvp':
      return { a: '#33142a', b: '#8c2f51', c: '#f29e5c' };
    case 'endgame':
    default:
      return { a: '#161128', b: '#4c3f87', c: '#d7c46f' };
  }
}

export function buildNebulaProfile(planet: Planet, zone: ZoneType): PlanetNebulaProfile {
  const seed = hashStringToInt(
    `${planet.id}:${planet.factionId}:${planet.coreResource}:${planet.corePopulation}:${planet.coreDefense}:${planet.coreTechnology}:${planet.coreEnvironment}`,
  );
  const rand = mulberry32(seed);
  const base = resolveZonePalette(zone);
  const techFactor = clamp01(planet.coreTechnology / 100);
  const envFactor = clamp01(planet.coreEnvironment / 100);
  const defenseFactor = clamp01(planet.coreDefense / 100);
  const resourceFactor = clamp01(planet.coreResource / 100);

  const paletteA = mixHex(base.a, '#0b0f18', 0.24 * (1 - envFactor));
  const paletteB = mixHex(base.b, '#4ec5ff', 0.18 * techFactor + rand() * 0.08);
  const paletteC = mixHex(base.c, '#ffcc66', 0.12 * resourceFactor + 0.1 * defenseFactor);

  return {
    seed,
    flowSpeed: 0.012 + techFactor * 0.018 + rand() * 0.01,
    swirl: 1.2 + defenseFactor * 1.1 + rand() * 0.6,
    density: 0.36 + resourceFactor * 0.42 + rand() * 0.14,
    paletteA,
    paletteB,
    paletteC,
    updatedAt: Date.now(),
  };
}

export function hexToRgb01(hex: string): [number, number, number] {
  const raw = hex.startsWith('#') ? hex.slice(1) : hex;
  const n = parseInt(raw.padStart(6, '0').slice(0, 6), 16);
  return [((n >> 16) & 0xff) / 255, ((n >> 8) & 0xff) / 255, (n & 0xff) / 255];
}
