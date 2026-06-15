import { Delaunay } from 'd3-delaunay';
import {
  MAP_FACTION_CONTEST_BORDER_COLOR,
  type MapFactionSide,
  resolveMapFactionBorderColor,
} from './resolveMapFactionSide';

export type GalaxyTerritorySite = {
  systemId: string;
  x: number;
  y: number;
  factionSide: MapFactionSide;
  displayColor: string;
};

export type GalaxyTerritoryFill = {
  key: string;
  points: string;
  fillColor: string;
};

export type GalaxyTerritoryBorderPath = {
  key: string;
  d: string;
  glowColor: string;
  coreColor: string;
};

export type GalaxyTerritoryLayers = {
  fills: GalaxyTerritoryFill[];
  borders: GalaxyTerritoryBorderPath[];
};

type Bounds = { x0: number; y0: number; x1: number; y1: number };
type Point = [number, number];

type BorderSegment = {
  a: Point;
  b: Point;
  glowColor: string;
  coreColor: string;
};

const CHAIN_EPS = 0.5;

function polyToPointsAttr(poly: Point[]): string {
  return poly.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
}

function pointsNear(a: Point, b: Point, eps = CHAIN_EPS): boolean {
  return Math.abs(a[0] - b[0]) <= eps && Math.abs(a[1] - b[1]) <= eps;
}

function edgeKey(a: Point, b: Point): string {
  const sa = `${a[0].toFixed(2)},${a[1].toFixed(2)}`;
  const sb = `${b[0].toFixed(2)},${b[1].toFixed(2)}`;
  return sa < sb ? `${sa}|${sb}` : `${sb}|${sa}`;
}

function isOnClipBounds(x: number, y: number, bounds: Bounds, eps = 2): boolean {
  return (
    Math.abs(x - bounds.x0) <= eps
    || Math.abs(x - bounds.x1) <= eps
    || Math.abs(y - bounds.y0) <= eps
    || Math.abs(y - bounds.y1) <= eps
  );
}

/** 클립 rect 외곽 — 양 끝 모두 경계일 때만 제외 */
function isClipHullEdge(a: Point, b: Point, bounds: Bounds): boolean {
  return isOnClipBounds(a[0], a[1], bounds) && isOnClipBounds(b[0], b[1], bounds);
}

function computeClipBounds(sites: GalaxyTerritorySite[], mapBounds: Bounds, padding = 48): Bounds {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const s of sites) {
    minX = Math.min(minX, s.x);
    minY = Math.min(minY, s.y);
    maxX = Math.max(maxX, s.x);
    maxY = Math.max(maxY, s.y);
  }
  if (!Number.isFinite(minX)) return mapBounds;
  return {
    x0: Math.max(mapBounds.x0, minX - padding),
    y0: Math.max(mapBounds.y0, minY - padding),
    x1: Math.min(mapBounds.x1, maxX + padding),
    y1: Math.min(mapBounds.y1, maxY + padding),
  };
}

function resolveBorderStyle(sideA: MapFactionSide, sideB: MapFactionSide): { glowColor: string; coreColor: string } {
  const activeSides = new Set([sideA, sideB].filter((s) => s !== 'neutral'));
  if (activeSides.has('blue') && activeSides.has('red')) {
    const c = MAP_FACTION_CONTEST_BORDER_COLOR;
    return { glowColor: c, coreColor: lightenHex(c, 0.55) };
  }
  const side = sideA !== 'neutral' ? sideA : sideB;
  const glowColor = resolveMapFactionBorderColor(side);
  return { glowColor, coreColor: lightenHex(glowColor, 0.55) };
}

function lightenHex(hex: string, mix: number): string {
  const raw = hex.replace('#', '').trim();
  if (raw.length !== 6) return hex;
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  const lr = Math.round(r + (255 - r) * mix);
  const lg = Math.round(g + (255 - g) * mix);
  const lb = Math.round(b + (255 - b) * mix);
  return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`;
}

function polylineToSvgPath(points: Point[]): string {
  if (points.length < 2) return '';
  const [first, ...rest] = points;
  return `M${first[0].toFixed(2)} ${first[1].toFixed(2)}${rest.map(([x, y]) => ` L${x.toFixed(2)} ${y.toFixed(2)}`).join('')}`;
}

function extendChain(chain: Point[], end: 'head' | 'tail', segs: BorderSegment[], used: Set<number>): void {
  const tip = end === 'tail' ? chain[chain.length - 1] : chain[0];
  for (const idx of [...used]) {
    const seg = segs[idx];
    if (pointsNear(seg.a, tip)) {
      if (end === 'tail') chain.push(seg.b);
      else chain.unshift(seg.b);
      used.delete(idx);
      extendChain(chain, end, segs, used);
      return;
    }
    if (pointsNear(seg.b, tip)) {
      if (end === 'tail') chain.push(seg.a);
      else chain.unshift(seg.a);
      used.delete(idx);
      extendChain(chain, end, segs, used);
      return;
    }
  }
}

/** 동색 변을 Voronoi 원좌표 그대로 폴리라인으로 연결 — 후처리·facet 없음 */
function chainBorderSegments(segments: BorderSegment[]): Point[][] {
  const groups = new Map<string, BorderSegment[]>();
  for (const seg of segments) {
    const key = `${seg.glowColor}|${seg.coreColor}`;
    const list = groups.get(key) ?? [];
    list.push(seg);
    groups.set(key, list);
  }

  const chains: Point[][] = [];
  for (const group of groups.values()) {
    const used = new Set(group.map((_, i) => i));
    while (used.size > 0) {
      const idx = used.values().next().value as number;
      used.delete(idx);
      const first = group[idx];
      const chain: Point[] = [first.a, first.b];
      extendChain(chain, 'tail', group, used);
      extendChain(chain, 'head', group, used);
      chains.push(chain);
    }
  }
  return chains;
}

export function buildGalaxyTerritoryVoronoiLayers(input: {
  sites: GalaxyTerritorySite[];
  bounds: Bounds;
}): GalaxyTerritoryLayers {
  const { sites, bounds: mapBounds } = input;
  const n = sites.length;
  if (n < 2) return { fills: [], borders: [] };

  const clipBounds = computeClipBounds(sites, mapBounds);
  const delaunay = Delaunay.from(sites, (d) => d.x, (d) => d.y);
  const voronoi = delaunay.voronoi([clipBounds.x0, clipBounds.y0, clipBounds.x1, clipBounds.y1]);

  const fills: GalaxyTerritoryFill[] = [];
  const borderSegments: BorderSegment[] = [];
  const edgeOwners = new Map<string, { a: Point; b: Point; sites: number[] }>();

  for (let i = 0; i < n; i += 1) {
    const site = sites[i];
    const poly = voronoi.cellPolygon(i);
    if (!poly || poly.length < 3) continue;

    if (site.factionSide !== 'neutral') {
      fills.push({
        key: site.systemId,
        points: polyToPointsAttr(poly),
        fillColor: site.displayColor,
      });
    }

    for (let k = 0; k < poly.length; k += 1) {
      const a: Point = [poly[k][0], poly[k][1]];
      const b: Point = [poly[(k + 1) % poly.length][0], poly[(k + 1) % poly.length][1]];
      const key = edgeKey(a, b);
      const cur = edgeOwners.get(key);
      if (cur) {
        if (!cur.sites.includes(i)) cur.sites.push(i);
      } else {
        edgeOwners.set(key, { a, b, sites: [i] });
      }
    }
  }

  for (const { a, b, sites: owners } of edgeOwners.values()) {
    if (owners.length !== 2) continue;

    const sideA = sites[owners[0]].factionSide;
    const sideB = sites[owners[1]].factionSide;
    if (sideA === sideB) continue;
    if (sideA === 'neutral' && sideB === 'neutral') continue;
    if (isClipHullEdge(a, b, clipBounds)) continue;

    const { glowColor, coreColor } = resolveBorderStyle(sideA, sideB);
    borderSegments.push({ a, b, glowColor, coreColor });
  }

  const borders: GalaxyTerritoryBorderPath[] = [];
  const styleByColor = new Map<string, { glowColor: string; coreColor: string }>();
  for (const seg of borderSegments) {
    styleByColor.set(`${seg.glowColor}|${seg.coreColor}`, { glowColor: seg.glowColor, coreColor: seg.coreColor });
  }

  let borderIdx = 0;
  for (const [styleKey, style] of styleByColor) {
    const subset = borderSegments.filter((s) => `${s.glowColor}|${s.coreColor}` === styleKey);
    for (const chain of chainBorderSegments(subset)) {
      if (chain.length < 2) continue;
      borders.push({
        key: `border-${borderIdx}`,
        d: polylineToSvgPath(chain),
        glowColor: style.glowColor,
        coreColor: style.coreColor,
      });
      borderIdx += 1;
    }
  }

  return { fills, borders };
}
