/**
 * 일일개방 개척 행성 원반 룩 — 8 kind 디렉토리 템플릿의 고유 변형.
 * 베이크·개척 unlock 1회 패스·테스트. 런타임 틱·PlanetDot 렌더에서 import 금지.
 */
import type { ZoneType } from '../types';
import {
  PLANET_GLOBE_LOOK_CANON,
  variantFingerprint,
  type PlanetGlobeBakeKind,
  type PlanetGlobeLookRow,
  type PlanetGlobeVariant,
  type Rgb01,
} from './planetGlobeLookCanon';

/** 존 → 쓸 스타일 디렉토리(kind). 어제 정본 8종만. */
const ZONE_KIND_DIRS: Record<ZoneType, readonly PlanetGlobeBakeKind[]> = {
  safe: ['habit', 'station', 'barren', 'gas'],
  neutral: ['arid', 'barren', 'gas', 'station', 'habit'],
  pvp: ['volcanic', 'arid', 'umbral', 'barren'],
  endgame: ['aether', 'umbral', 'gas', 'volcanic'],
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

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function mixRgb(a: Rgb01, b: Rgb01, tRaw: number): Rgb01 {
  const t = clamp(tRaw, 0, 1);
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

function templatesForKind(kind: PlanetGlobeBakeKind): PlanetGlobeLookRow[] {
  return PLANET_GLOBE_LOOK_CANON.filter((row) => row.kind === kind);
}

export function pickColonizedGlobeKind(planetId: string, zone: ZoneType): PlanetGlobeBakeKind {
  const pool = ZONE_KIND_DIRS[zone] ?? ZONE_KIND_DIRS.neutral;
  return pool[hashStringToInt(`${planetId}:kind`) % pool.length]!;
}

function perturbExtra(kind: PlanetGlobeBakeKind, base: number, rand: () => number): number {
  if (kind === 'gas') return 3.4 + rand() * 5.4;
  if (kind === 'station') return (rand() - 0.5) * 0.72;
  if (kind === 'volcanic') return 0.46 + rand() * 0.34;
  return base + (rand() - 0.5) * 0.22;
}

function deriveVariant(
  kind: PlanetGlobeBakeKind,
  base: PlanetGlobeVariant,
  rand: () => number,
): PlanetGlobeVariant {
  const tint: Rgb01 = [0.28 + rand() * 0.62, 0.24 + rand() * 0.62, 0.22 + rand() * 0.64];
  const t = 0.16 + rand() * 0.24;
  return {
    lightX: clamp(base.lightX + (rand() - 0.5) * 1.15, -0.88, 0.88),
    lightY: clamp(base.lightY + (rand() - 0.5) * 0.72, -0.78, -0.1),
    lightZ: clamp(base.lightZ + (rand() - 0.5) * 0.28, 0.6, 0.98),
    rotDeg: base.rotDeg + (rand() - 0.5) * 168,
    ox: base.ox + (rand() - 0.5) * 3.1,
    oy: base.oy + (rand() - 0.5) * 3.1,
    scale: clamp(base.scale * (0.8 + rand() * 0.46), 0.76, 1.4),
    cloudLo: clamp(base.cloudLo + (rand() - 0.5) * 0.18, 0.3, 0.86),
    cloudHi: clamp(base.cloudHi + (rand() - 0.5) * 0.16, 0.52, 0.95),
    landLo: clamp(base.landLo + (rand() - 0.5) * 0.14, 0.2, 0.64),
    landHi: clamp(base.landHi + (rand() - 0.5) * 0.14, 0.46, 0.84),
    extra: perturbExtra(kind, base.extra, rand),
    c0: mixRgb(base.c0, tint, t * 0.85),
    c1: mixRgb(base.c1, tint, t * 0.7),
    c2: mixRgb(base.c2, tint, t * 0.55),
    c3: mixRgb(base.c3, tint, t * 0.45),
    c4: mixRgb(base.c4, tint, t * 0.6),
    atmo: mixRgb(base.atmo, tint, t * 0.35),
    rim: mixRgb(base.rim, [0.95, 0.92, 0.88], t * 0.22),
  };
}

export function deriveColonizedGlobeLook(
  planetId: string,
  zone: ZoneType,
  usedSeeds: Set<number>,
  usedFingerprintsByKind: Map<PlanetGlobeBakeKind, Set<string>>,
): PlanetGlobeLookRow {
  const kind = pickColonizedGlobeKind(planetId, zone);
  const templates = templatesForKind(kind);
  if (templates.length === 0) {
    throw new Error(`no core template for kind ${kind}`);
  }
  for (let attempt = 0; attempt < 48; attempt += 1) {
    const seed = (hashStringToInt(`${planetId}:globe:${attempt}`) || 1) >>> 0;
    if (usedSeeds.has(seed)) continue;
    const tmpl = templates[hashStringToInt(`${planetId}:tmpl:${attempt}`) % templates.length]!;
    const rand = mulberry32(seed);
    const variant = deriveVariant(kind, tmpl.variant, rand);
    const fp = variantFingerprint(variant);
    const set = usedFingerprintsByKind.get(kind) ?? new Set<string>();
    if (set.has(fp)) continue;
    usedSeeds.add(seed);
    set.add(fp);
    usedFingerprintsByKind.set(kind, set);
    return { planetId, kind, seed, variant };
  }
  throw new Error(`could not derive unique globe look for ${planetId} (${kind})`);
}

export function seedColonizedLookUniquenessState(coreRows: readonly PlanetGlobeLookRow[]): {
  usedSeeds: Set<number>;
  usedFingerprintsByKind: Map<PlanetGlobeBakeKind, Set<string>>;
} {
  const usedSeeds = new Set<number>();
  const usedFingerprintsByKind = new Map<PlanetGlobeBakeKind, Set<string>>();
  for (const row of coreRows) {
    usedSeeds.add(row.seed);
    const set = usedFingerprintsByKind.get(row.kind) ?? new Set<string>();
    set.add(variantFingerprint(row.variant));
    usedFingerprintsByKind.set(row.kind, set);
  }
  return { usedSeeds, usedFingerprintsByKind };
}
