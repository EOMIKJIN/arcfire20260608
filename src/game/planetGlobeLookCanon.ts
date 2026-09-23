/**
 * 정본 21행성 허브 원반 룩.
 * 일일개방 개척 synth 룩은 `planetGlobeLookColonized` (베이크 생성).
 * 같은 kind여도 variant(광원·회전·팔레트·구름)가 행성마다 다름. 이미지 공유 금지.
 */
export type PlanetGlobeBakeKind =
  | 'habit'
  | 'arid'
  | 'barren'
  | 'volcanic'
  | 'gas'
  | 'umbral'
  | 'aether'
  | 'station';

export type Rgb01 = readonly [number, number, number];

/** 행성 고유 베리에이션 — 시드만 바꾸면 84px에서 형제처럼 보임. */
export type PlanetGlobeVariant = {
  lightX: number;
  lightY: number;
  lightZ: number;
  rotDeg: number;
  ox: number;
  oy: number;
  scale: number;
  cloudLo: number;
  cloudHi: number;
  landLo: number;
  landHi: number;
  /** gas=밴드주파수, station=링 Y, volcanic=균열 문턱 */
  extra: number;
  c0: Rgb01;
  c1: Rgb01;
  c2: Rgb01;
  c3: Rgb01;
  c4: Rgb01;
  atmo: Rgb01;
  rim: Rgb01;
};

export type PlanetGlobeLookRow = {
  planetId: string;
  kind: PlanetGlobeBakeKind;
  seed: number;
  variant: PlanetGlobeVariant;
};

function v(p: PlanetGlobeVariant): PlanetGlobeVariant {
  return p;
}

export const PLANET_GLOBE_LOOK_CANON: readonly PlanetGlobeLookRow[] = [
  {
    planetId: 'arcadia_prime',
    kind: 'habit',
    seed: 0x41c4d1a,
    variant: v({
      lightX: 0.58, lightY: -0.4, lightZ: 0.71, rotDeg: 12, ox: 0.2, oy: -0.15, scale: 1,
      cloudLo: 0.48, cloudHi: 0.7, landLo: 0.44, landHi: 0.56, extra: 0,
      c0: [0.06, 0.18, 0.48], c1: [0.16, 0.46, 0.6], c2: [0.18, 0.52, 0.18],
      c3: [0.42, 0.68, 0.22], c4: [0.46, 0.34, 0.16],
      atmo: [0.35, 0.78, 0.92], rim: [0.55, 0.88, 1],
    }),
  },
  {
    planetId: 'eden_city',
    kind: 'habit',
    seed: 0xed01c17,
    variant: v({
      lightX: 0.22, lightY: -0.55, lightZ: 0.8, rotDeg: -48, ox: 1.4, oy: 0.9, scale: 1.18,
      cloudLo: 0.4, cloudHi: 0.62, landLo: 0.4, landHi: 0.54, extra: 0,
      c0: [0.05, 0.14, 0.4], c1: [0.22, 0.48, 0.62], c2: [0.16, 0.38, 0.32],
      c3: [0.32, 0.52, 0.42], c4: [0.38, 0.34, 0.28],
      atmo: [0.42, 0.7, 0.95], rim: [0.7, 0.86, 1],
    }),
  },
  {
    planetId: 'vega_base',
    kind: 'arid',
    seed: 0x7e6a0b1,
    variant: v({
      lightX: 0.7, lightY: -0.2, lightZ: 0.68, rotDeg: 8, ox: 0.4, oy: 0.1, scale: 1.05,
      cloudLo: 0.62, cloudHi: 0.82, landLo: 0.42, landHi: 0.7, extra: 0,
      c0: [0.58, 0.4, 0.24], c1: [0.32, 0.28, 0.26], c2: [0.68, 0.52, 0.3],
      c3: [0.8, 0.68, 0.48], c4: [0.58, 0.4, 0.24],
      atmo: [0.85, 0.6, 0.35], rim: [0.95, 0.72, 0.4],
    }),
  },
  {
    planetId: 'sirius_border',
    kind: 'arid',
    seed: 0x514105,
    variant: v({
      lightX: -0.45, lightY: -0.5, lightZ: 0.74, rotDeg: 62, ox: -1.1, oy: 0.7, scale: 0.92,
      cloudLo: 0.55, cloudHi: 0.78, landLo: 0.38, landHi: 0.66, extra: 0,
      c0: [0.7, 0.32, 0.2], c1: [0.42, 0.18, 0.14], c2: [0.78, 0.42, 0.22],
      c3: [0.9, 0.55, 0.32], c4: [0.7, 0.32, 0.2],
      atmo: [0.95, 0.45, 0.28], rim: [1, 0.58, 0.32],
    }),
  },
  {
    planetId: 'perseus_memorial',
    kind: 'arid',
    seed: 0x9e45e05,
    variant: v({
      lightX: 0.15, lightY: -0.62, lightZ: 0.77, rotDeg: -27, ox: 0.8, oy: -1.2, scale: 1.22,
      cloudLo: 0.5, cloudHi: 0.74, landLo: 0.48, landHi: 0.74, extra: 0,
      c0: [0.55, 0.48, 0.4], c1: [0.3, 0.28, 0.26], c2: [0.68, 0.62, 0.52],
      c3: [0.78, 0.74, 0.66], c4: [0.55, 0.48, 0.4],
      atmo: [0.7, 0.68, 0.62], rim: [0.88, 0.84, 0.72],
    }),
  },
  {
    planetId: 'minerva_deep',
    kind: 'barren',
    seed: 0x6e1e4a2,
    variant: v({
      lightX: 0.5, lightY: -0.35, lightZ: 0.79, rotDeg: 18, ox: 0.3, oy: 0.5, scale: 1.1,
      cloudLo: 0.7, cloudHi: 0.9, landLo: 0.32, landHi: 0.68, extra: 0,
      c0: [0.28, 0.22, 0.18], c1: [0.12, 0.1, 0.09], c2: [0.55, 0.32, 0.14],
      c3: [0.5, 0.45, 0.38], c4: [0.28, 0.22, 0.18],
      atmo: [0.5, 0.42, 0.32], rim: [0.72, 0.55, 0.38],
    }),
  },
  {
    planetId: 'iron_remnant',
    kind: 'barren',
    seed: 0x1404e01,
    variant: v({
      lightX: -0.55, lightY: -0.28, lightZ: 0.78, rotDeg: 71, ox: -0.9, oy: 0.2, scale: 0.95,
      cloudLo: 0.66, cloudHi: 0.88, landLo: 0.36, landHi: 0.72, extra: 0,
      c0: [0.3, 0.34, 0.32], c1: [0.14, 0.16, 0.15], c2: [0.28, 0.38, 0.3],
      c3: [0.48, 0.52, 0.5], c4: [0.3, 0.34, 0.32],
      atmo: [0.4, 0.48, 0.44], rim: [0.58, 0.66, 0.6],
    }),
  },
  {
    planetId: 'titan_ruins',
    kind: 'barren',
    seed: 0x717a001,
    variant: v({
      lightX: 0.28, lightY: -0.58, lightZ: 0.76, rotDeg: -54, ox: 1.2, oy: -0.6, scale: 1.28,
      cloudLo: 0.6, cloudHi: 0.84, landLo: 0.3, landHi: 0.64, extra: 0,
      c0: [0.42, 0.34, 0.24], c1: [0.2, 0.16, 0.12], c2: [0.58, 0.42, 0.22],
      c3: [0.62, 0.52, 0.38], c4: [0.42, 0.34, 0.24],
      atmo: [0.62, 0.5, 0.36], rim: [0.82, 0.68, 0.42],
    }),
  },
  {
    planetId: 'helios_core',
    kind: 'volcanic',
    seed: 0x8e1105,
    variant: v({
      lightX: 0.35, lightY: -0.62, lightZ: 0.7, rotDeg: 24, ox: 0.15, oy: -0.4, scale: 1.08,
      cloudLo: 0.58, cloudHi: 0.76, landLo: 0.28, landHi: 0.66, extra: 0.56,
      c0: [0.1, 0.07, 0.04], c1: [0.28, 0.18, 0.08], c2: [1, 0.72, 0.22],
      c3: [1, 0.88, 0.45], c4: [0.1, 0.07, 0.04],
      atmo: [1, 0.7, 0.28], rim: [1, 0.82, 0.4],
    }),
  },
  {
    planetId: 'crimson_base',
    kind: 'volcanic',
    seed: 0xc41b501,
    variant: v({
      lightX: -0.4, lightY: -0.3, lightZ: 0.86, rotDeg: -66, ox: 1.05, oy: 0.85, scale: 0.9,
      cloudLo: 0.64, cloudHi: 0.82, landLo: 0.32, landHi: 0.7, extra: 0.68,
      c0: [0.06, 0.04, 0.05], c1: [0.16, 0.08, 0.08], c2: [1, 0.22, 0.08],
      c3: [1, 0.45, 0.12], c4: [0.06, 0.04, 0.05],
      atmo: [1, 0.28, 0.12], rim: [1, 0.42, 0.18],
    }),
  },
  {
    planetId: 'draco_haven',
    kind: 'gas',
    seed: 0xd4ac0a1,
    variant: v({
      lightX: 0.48, lightY: -0.42, lightZ: 0.77, rotDeg: 15, ox: 0.25, oy: 0.35, scale: 1,
      cloudLo: 0.52, cloudHi: 0.76, landLo: 0, landHi: 1, extra: 7.6,
      c0: [0.22, 0.28, 0.52], c1: [0.36, 0.62, 0.72], c2: [0.55, 0.38, 0.78],
      c3: [0.7, 0.82, 1], c4: [0.85, 0.9, 1],
      atmo: [0.7, 0.82, 1], rim: [0.85, 0.9, 1],
    }),
  },
  {
    planetId: 'dark_haven',
    kind: 'gas',
    seed: 0xda480a1,
    variant: v({
      lightX: -0.62, lightY: -0.18, lightZ: 0.76, rotDeg: 88, ox: -1.3, oy: 0.4, scale: 1.15,
      cloudLo: 0.48, cloudHi: 0.72, landLo: 0, landHi: 1, extra: 4.8,
      c0: [0.14, 0.05, 0.18], c1: [0.06, 0.03, 0.1], c2: [0.42, 0.1, 0.22],
      c3: [0.55, 0.16, 0.38], c4: [0.72, 0.22, 0.48],
      atmo: [0.55, 0.16, 0.42], rim: [0.78, 0.28, 0.52],
    }),
  },
  {
    planetId: 'shadow_market',
    kind: 'umbral',
    seed: 0x5ead001,
    variant: v({
      lightX: 0.62, lightY: -0.22, lightZ: 0.75, rotDeg: 33, ox: 0.55, oy: 0.2, scale: 1.06,
      cloudLo: 0.58, cloudHi: 0.8, landLo: 0.42, landHi: 0.7, extra: 0,
      c0: [0.06, 0.04, 0.05], c1: [0.18, 0.1, 0.08], c2: [0.42, 0.24, 0.1],
      c3: [0.55, 0.32, 0.12], c4: [0.72, 0.48, 0.18],
      atmo: [0.55, 0.32, 0.14], rim: [0.82, 0.52, 0.22],
    }),
  },
  {
    planetId: 'abyss_gate',
    kind: 'umbral',
    seed: 0xab55501,
    variant: v({
      lightX: -0.2, lightY: -0.65, lightZ: 0.73, rotDeg: -41, ox: -0.7, oy: 1.1, scale: 0.88,
      cloudLo: 0.62, cloudHi: 0.84, landLo: 0.48, landHi: 0.74, extra: 0,
      c0: [0.03, 0.05, 0.09], c1: [0.06, 0.1, 0.18], c2: [0.1, 0.22, 0.38],
      c3: [0.16, 0.32, 0.52], c4: [0.28, 0.48, 0.7],
      atmo: [0.2, 0.38, 0.62], rim: [0.35, 0.58, 0.88],
    }),
  },
  {
    planetId: 'nightfall_citadel',
    kind: 'umbral',
    seed: 0x11f411,
    variant: v({
      lightX: 0.18, lightY: -0.48, lightZ: 0.86, rotDeg: 102, ox: 1.15, oy: -0.85, scale: 1.2,
      cloudLo: 0.52, cloudHi: 0.76, landLo: 0.4, landHi: 0.68, extra: 0,
      c0: [0.04, 0.02, 0.06], c1: [0.14, 0.05, 0.12], c2: [0.32, 0.08, 0.22],
      c3: [0.48, 0.12, 0.28], c4: [0.62, 0.18, 0.36],
      atmo: [0.48, 0.12, 0.32], rim: [0.7, 0.22, 0.42],
    }),
  },
  {
    planetId: 'core_prime',
    kind: 'aether',
    seed: 0xc0e501,
    variant: v({
      lightX: 0.52, lightY: -0.38, lightZ: 0.76, rotDeg: 20, ox: 0.2, oy: 0.15, scale: 1,
      cloudLo: 0.6, cloudHi: 0.82, landLo: 0.35, landHi: 0.68, extra: 0,
      c0: [0.12, 0.08, 0.22], c1: [0.28, 0.16, 0.48], c2: [0.82, 0.66, 0.32],
      c3: [0.72, 0.55, 1], c4: [0.95, 0.82, 0.45],
      atmo: [0.72, 0.55, 1], rim: [0.95, 0.82, 0.45],
    }),
  },
  {
    planetId: 'eternal_throne',
    kind: 'aether',
    seed: 0xe7e401,
    variant: v({
      lightX: -0.3, lightY: -0.58, lightZ: 0.75, rotDeg: -72, ox: 0.95, oy: -1.05, scale: 1.16,
      cloudLo: 0.55, cloudHi: 0.78, landLo: 0.3, landHi: 0.62, extra: 0,
      c0: [0.16, 0.1, 0.08], c1: [0.42, 0.28, 0.14], c2: [0.92, 0.78, 0.38],
      c3: [0.85, 0.7, 0.42], c4: [1, 0.9, 0.55],
      atmo: [0.9, 0.72, 0.4], rim: [1, 0.88, 0.5],
    }),
  },
  {
    planetId: 'genesis_origin',
    kind: 'aether',
    seed: 0x6e0e515,
    variant: v({
      lightX: 0.12, lightY: -0.7, lightZ: 0.7, rotDeg: 44, ox: -0.85, oy: 0.65, scale: 0.86,
      cloudLo: 0.46, cloudHi: 0.7, landLo: 0.38, landHi: 0.7, extra: 0,
      c0: [0.08, 0.14, 0.2], c1: [0.16, 0.36, 0.48], c2: [0.72, 0.92, 1],
      c3: [0.55, 0.85, 0.95], c4: [0.9, 0.98, 1],
      atmo: [0.55, 0.88, 1], rim: [0.85, 0.96, 1],
    }),
  },
  {
    planetId: 'solar_station',
    kind: 'station',
    seed: 0x501a001,
    variant: v({
      lightX: 0.55, lightY: -0.36, lightZ: 0.76, rotDeg: 6, ox: 0.1, oy: 0.05, scale: 1,
      cloudLo: 0.78, cloudHi: 0.92, landLo: 0.4, landHi: 0.7, extra: 0.02,
      c0: [0.22, 0.24, 0.28], c1: [0.34, 0.36, 0.4], c2: [0.16, 0.36, 0.52],
      c3: [0.95, 0.82, 0.45], c4: [0.45, 0.62, 0.78],
      atmo: [0.45, 0.62, 0.78], rim: [0.7, 0.8, 0.9],
    }),
  },
  {
    planetId: 'omega_hub',
    kind: 'station',
    seed: 0x0e6a000,
    variant: v({
      lightX: -0.5, lightY: -0.45, lightZ: 0.74, rotDeg: 55, ox: 0.7, oy: -0.5, scale: 1.12,
      cloudLo: 0.72, cloudHi: 0.9, landLo: 0.36, landHi: 0.68, extra: -0.28,
      c0: [0.18, 0.2, 0.24], c1: [0.3, 0.34, 0.4], c2: [0.22, 0.48, 0.55],
      c3: [0.7, 0.9, 1], c4: [0.35, 0.7, 0.82],
      atmo: [0.35, 0.7, 0.82], rim: [0.55, 0.85, 0.95],
    }),
  },
  {
    planetId: 'blood_station',
    kind: 'station',
    seed: 0xb100d01,
    variant: v({
      lightX: 0.25, lightY: -0.2, lightZ: 0.95, rotDeg: -38, ox: -0.6, oy: 0.95, scale: 0.94,
      cloudLo: 0.7, cloudHi: 0.88, landLo: 0.34, landHi: 0.66, extra: 0.22,
      c0: [0.2, 0.14, 0.14], c1: [0.32, 0.2, 0.18], c2: [0.55, 0.12, 0.12],
      c3: [1, 0.45, 0.28], c4: [0.7, 0.28, 0.22],
      atmo: [0.7, 0.28, 0.22], rim: [0.9, 0.42, 0.32],
    }),
  },
];

const LOOK_BY_ID: Record<string, PlanetGlobeLookRow> = (() => {
  const m: Record<string, PlanetGlobeLookRow> = {};
  for (const row of PLANET_GLOBE_LOOK_CANON) m[row.planetId] = row;
  return m;
})();

export function getPlanetGlobeLook(planetId: string | null | undefined): PlanetGlobeLookRow | null {
  if (planetId == null) return null;
  return LOOK_BY_ID[planetId] ?? null;
}

export function variantFingerprint(v: PlanetGlobeVariant): string {
  return [
    v.lightX, v.lightY, v.lightZ, v.rotDeg, v.ox, v.oy, v.scale,
    v.cloudLo, v.cloudHi, v.landLo, v.landHi, v.extra,
    ...v.c0, ...v.c1, ...v.c2, ...v.c3, ...v.c4, ...v.atmo, ...v.rim,
  ].map((n) => n.toFixed(4)).join('|');
}

/** 같은 kind 안 시드·베리에이션 충돌 검사 (베이크 게이트). */
export function assertPlanetGlobeLooksUniqueness(rows: readonly PlanetGlobeLookRow[]): void {
  const ids = new Set<string>();
  const seeds = new Set<number>();
  const printsByKind = new Map<PlanetGlobeBakeKind, Set<string>>();
  for (const row of rows) {
    if (ids.has(row.planetId)) throw new Error(`duplicate planetId ${row.planetId}`);
    ids.add(row.planetId);
    if (seeds.has(row.seed)) throw new Error(`duplicate seed ${row.seed} (${row.planetId})`);
    seeds.add(row.seed);
    const fp = variantFingerprint(row.variant);
    const set = printsByKind.get(row.kind) ?? new Set<string>();
    if (set.has(fp)) throw new Error(`identical variant in kind ${row.kind} (${row.planetId})`);
    set.add(fp);
    printsByKind.set(row.kind, set);
  }
}

export function assertPlanetGlobeLookUniqueness(): void {
  assertPlanetGlobeLooksUniqueness(PLANET_GLOBE_LOOK_CANON);
}
