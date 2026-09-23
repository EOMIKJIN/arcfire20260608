/**
 * 베이크 PNG 주요색 vs 캐논 팔레트·허브 링 hex 전수.
 * npx tsx tools/planet-nebula-bake/sample-baked-nebula-primary.ts
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { STAR_SYSTEMS_FROM_CSV } from '../../src/data/generated/csvSystems';
import { PLANET_NEBULA_CANON_PALETTES } from '../../src/game/planetNebulaCanonPalettes';
import {
  buildNebulaProfile,
  resolvePlanetAtmosphereRingHex,
} from '../../src/game/planetNebulaProfile';

const ROOT = path.resolve(__dirname, '../..');
const BAKE_DIR = path.join(ROOT, 'assets/images/nebula/baked');
const SAMPLE = 128;

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d < 1e-6) return { h: 0, s: 0, l };
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return { h, s, l };
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp >= 0 && hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  return [r + m, g + m, b + m];
}

function toHex(r: number, g: number, b: number): string {
  const rr = Math.round(clamp01(r) * 255);
  const gg = Math.round(clamp01(g) * 255);
  const bb = Math.round(clamp01(b) * 255);
  return `#${[rr, gg, bb].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}

function hueDelta(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

function hexHue(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return rgbToHsl(((n >> 16) & 0xff) / 255, ((n >> 8) & 0xff) / 255, (n & 0xff) / 255).h;
}

type Sample = {
  planetId: string;
  zone: string;
  dark: string;
  mid: string;
  high: string;
  primary: string;
  ringProposed: string;
  ringCurrent: string;
  canonA: string;
  canonB: string;
  canonC: string;
  huePng: number;
  hueRing: number;
  hueDelta: number;
};

async function samplePng(planetId: string): Promise<{
  dark: [number, number, number];
  mid: [number, number, number];
  high: [number, number, number];
  primary: [number, number, number];
} | null> {
  const file = path.join(BAKE_DIR, `${planetId}.png`);
  try {
    await fs.access(file);
  } catch {
    return null;
  }
  const { data, info } = await sharp(file)
    .resize(SAMPLE, SAMPLE, { fit: 'fill' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  type Pix = { r: number; g: number; b: number; a: number; l: number; s: number; w: number };
  const pix: Pix[] = [];
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i]! / 255;
    const g = data[i + 1]! / 255;
    const b = data[i + 2]! / 255;
    const a = data[i + 3]! / 255;
    if (a < 0.22) continue;
    const hsl = rgbToHsl(r, g, b);
    if (hsl.l < 0.04 || hsl.l > 0.88) continue;
    const w = a * (0.22 + hsl.s * 1.35) * (0.35 + hsl.l);
    pix.push({ r, g, b, a, l: hsl.l, s: hsl.s, w });
  }
  if (pix.length < 8) return null;
  pix.sort((x, y) => x.l - y.l);

  const avg = (slice: Pix[]): [number, number, number] => {
    let wr = 0;
    let wg = 0;
    let wb = 0;
    let tw = 0;
    for (const p of slice) {
      wr += p.r * p.w;
      wg += p.g * p.w;
      wb += p.b * p.w;
      tw += p.w;
    }
    if (tw < 1e-6) return [slice[0]!.r, slice[0]!.g, slice[0]!.b];
    return [wr / tw, wg / tw, wb / tw];
  };

  const n = pix.length;
  const dark = avg(pix.slice(0, Math.max(1, Math.floor(n * 0.28))));
  const mid = avg(pix.slice(Math.floor(n * 0.28), Math.floor(n * 0.72)));
  const high = avg(pix.slice(Math.floor(n * 0.72)));
  const chroma = pix.filter((p) => p.s >= 0.1);
  const primary = avg(chroma.length >= 8 ? chroma : pix);
  return { dark, mid, high, primary };
}

function proposeRing(primary: [number, number, number], high: [number, number, number]): string {
  const mixed: [number, number, number] = [
    primary[0] * 0.55 + high[0] * 0.45,
    primary[1] * 0.55 + high[1] * 0.45,
    primary[2] * 0.55 + high[2] * 0.45,
  ];
  const hsl = rgbToHsl(mixed[0], mixed[1], mixed[2]);
  const s = clamp01(Math.max(0.3, Math.min(0.62, hsl.s * 1.08 + 0.04)));
  const l = clamp01(Math.max(0.36, Math.min(0.56, hsl.l * 1.35 + 0.08)));
  const [r, g, b] = hslToRgb(hsl.h, s, l);
  return toHex(r, g, b);
}

async function main() {
  const rows: Sample[] = [];
  for (const system of Object.values(STAR_SYSTEMS_FROM_CSV)) {
    for (const planet of system.planets) {
      const sampled = await samplePng(planet.id);
      if (!sampled) continue;
      const profile = buildNebulaProfile(planet, system.zone);
      const ringCurrent = resolvePlanetAtmosphereRingHex(planet.id, system.zone, profile) ?? '#000000';
      const canon = PLANET_NEBULA_CANON_PALETTES[planet.id];
      const primaryHex = toHex(...sampled.primary);
      const ringProposed = proposeRing(sampled.primary, sampled.high);
      const huePng = hexHue(primaryHex);
      const hueRing = hexHue(ringCurrent);
      rows.push({
        planetId: planet.id,
        zone: system.zone,
        dark: toHex(...sampled.dark),
        mid: toHex(...sampled.mid),
        high: toHex(...sampled.high),
        primary: primaryHex,
        ringProposed,
        ringCurrent,
        canonA: canon?.a ?? '-',
        canonB: canon?.b ?? '-',
        canonC: canon?.c ?? '-',
        huePng,
        hueRing,
        hueDelta: hueDelta(huePng, hueRing),
      });
    }
  }

  rows.sort((a, b) => b.hueDelta - a.hueDelta);
  console.log(
    [
      'planetId'.padEnd(20),
      'dlt',
      'pngPri',
      'pngMid',
      'pngHi',
      'ringNow',
      'ringNew',
      'canonB',
      'canonC',
    ].join('  '),
  );
  for (const r of rows) {
    console.log(
      [
        r.planetId.padEnd(20),
        String(Math.round(r.hueDelta)).padStart(3),
        r.primary,
        r.mid,
        r.high,
        r.ringCurrent,
        r.ringProposed,
        r.canonB,
        r.canonC,
      ].join('  '),
    );
  }
  console.log(`\ncount=${rows.length}  hueΔ>18=${rows.filter((r) => r.hueDelta > 18).length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
