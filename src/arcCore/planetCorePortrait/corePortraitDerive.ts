// ============================================================
// 아크코어 — 행성 핵심 5지표 기반 초상(프로시저) 파생값 (순수 함수)
// PNG 없이 SVG만으로 최소 용량 · 10% 단위 양자화로 과민 갱신 방지
// ============================================================

import type { PlanetCoreGaugeView } from '../../store/planetCoreRuntimeStore';
import type { ZoneType } from '../../types';
import { ZONE_COLORS } from '../../utils/theme';

const GAUGE_ORDER = ['resource', 'population', 'defense', 'technology', 'environment'] as const;
const GAUGE_COLORS = ['#35D0FF', '#6BFF8D', '#FF6B6B', '#D37BFF', '#FFE36B'] as const;

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace('#', '');
  if (h.length === 6) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    if ([r, g, b].some((n) => Number.isNaN(n))) return null;
    return { r, g, b };
  }
  return null;
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

function blendWeighted(pairs: { rgb: { r: number; g: number; b: number }; w: number }[]): string {
  const tw = pairs.reduce((s, p) => s + p.w, 0) || 1;
  let r = 0;
  let g = 0;
  let b = 0;
  for (const p of pairs) {
    const k = p.w / tw;
    r += p.rgb.r * k;
    g += p.rgb.g * k;
    b += p.rgb.b * k;
  }
  return rgbToHex(r, g, b);
}

/** 초상용 — 10% 버킷(리렌더·합성 부하와 미세 떨림 억제) */
export function quantizePortraitCore(g: PlanetCoreGaugeView): PlanetCoreGaugeView {
  const q = (n: number) => Math.round(Math.max(0, Math.min(100, n)) / 10) * 10;
  return {
    resource: q(g.resource),
    population: q(g.population),
    defense: q(g.defense),
    technology: q(g.technology),
    environment: q(g.environment),
  };
}

export function planetPortraitSignature(planetId: string, zone: ZoneType, q: PlanetCoreGaugeView): string {
  return `${planetId}|${zone}|${q.resource},${q.population},${q.defense},${q.technology},${q.environment}`;
}

export function planetIdHueSkewDeg(planetId: string): number {
  let h = 2166136261;
  for (let i = 0; i < planetId.length; i++) {
    h ^= planetId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (Math.abs(h) % 360) * 0.07;
}

export type DerivedPlanetPortrait = {
  gradId: string;
  baseFill: string;
  highlight: string;
  ring: string;
  innerCore: string;
  innerBulge: number;
  spokes: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    stroke: string;
    opacity: number;
    sw: number;
  }[];
};

export function derivePlanetPortrait(input: {
  planetId: string;
  zone: ZoneType;
  core: PlanetCoreGaugeView;
  combatMuted?: boolean;
}): DerivedPlanetPortrait {
  const { planetId, zone, combatMuted } = input;
  const core = quantizePortraitCore(input.core);
  const sig = planetPortraitSignature(planetId, zone, core).replace(/[^a-zA-Z0-9_-]/g, '_');
  const gradId = `pcp_${sig.slice(0, 72)}`;

  if (combatMuted) {
    return {
      gradId,
      baseFill: '#1a2230',
      highlight: '#2c3848',
      ring: '#5a6474',
      innerCore: '#0e141c',
      innerBulge: 6,
      spokes: GAUGE_ORDER.map((key, i) => {
        const v = core[key];
        const ang = (-90 + i * 72 + planetIdHueSkewDeg(planetId)) * (Math.PI / 180);
        const r1 = 12;
        const r2 = 36 + v * 0.1;
        return {
          x1: 50 + Math.cos(ang) * r1,
          y1: 50 + Math.sin(ang) * r1,
          x2: 50 + Math.cos(ang) * r2,
          y2: 50 + Math.sin(ang) * r2,
          stroke: '#6a7488',
          opacity: 0.08 + v * 0.002,
          sw: 0.85,
        };
      }),
    };
  }

  const pairs = GAUGE_ORDER.map((key, i) => {
    const rgb = hexToRgb(GAUGE_COLORS[i] ?? '#888888');
    return { rgb: rgb ?? { r: 100, g: 100, b: 100 }, w: Math.max(0.12, core[key] / 100) };
  });
  const baseFill = blendWeighted(pairs);
  const zoneRgb = hexToRgb(ZONE_COLORS[zone]) ?? { r: 80, g: 120, b: 160 };
  const highlight = rgbToHex(
    zoneRgb.r * 0.52 + 36 * 0.48,
    zoneRgb.g * 0.52 + 44 * 0.48,
    zoneRgb.b * 0.52 + 58 * 0.48,
  );
  const ring = ZONE_COLORS[zone];
  const innerCore = blendWeighted(
    GAUGE_ORDER.map((key, i) => ({
      rgb: hexToRgb(GAUGE_COLORS[i] ?? '#888888') ?? { r: 90, g: 90, b: 90 },
      w: 0.32 + core[key] / 220,
    })),
  );

  const skew = planetIdHueSkewDeg(planetId);
  const spokes = GAUGE_ORDER.map((key, i) => {
    const v = core[key];
    const ang = (-90 + i * 72 + skew) * (Math.PI / 180);
    const r1 = 14;
    const r2 = 34 + v * 0.15;
    return {
      x1: 50 + Math.cos(ang) * r1,
      y1: 50 + Math.sin(ang) * r1,
      x2: 50 + Math.cos(ang) * r2,
      y2: 50 + Math.sin(ang) * r2,
      stroke: GAUGE_COLORS[i] ?? '#888888',
      opacity: 0.11 + (v / 100) * 0.2,
      sw: 0.9 + (v / 100) * 0.5,
    };
  });

  return {
    gradId,
    baseFill,
    highlight,
    ring,
    innerCore,
    innerBulge: 5 + (core.defense / 100) * 8,
    spokes,
  };
}
