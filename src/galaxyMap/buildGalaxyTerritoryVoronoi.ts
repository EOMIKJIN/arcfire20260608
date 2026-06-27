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

export type GalaxyTerritoryOccupationLabel = {
  key: string;
  factionSide: 'blue' | 'red';
  x: number;
  y: number;
};

export type GalaxyTerritoryLayers = {
  fills: GalaxyTerritoryFill[];
  borders: GalaxyTerritoryBorderPath[];
  occupationLabels: GalaxyTerritoryOccupationLabel[];
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
    return { glowColor: c, coreColor: c };
  }
  const side = sideA !== 'neutral' ? sideA : sideB;
  const glowColor = resolveMapFactionBorderColor(side);
  return { glowColor, coreColor: glowColor };
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

/** 다각형 면적·무게중심 — Voronoi 셀 라벨 앵커 */
function polygonAreaCentroid(poly: Point[]): { x: number; y: number; area: number } {
  if (poly.length < 3) {
    const p = poly[0] ?? [0, 0];
    return { x: p[0], y: p[1], area: 0 };
  }
  let twiceArea = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < poly.length; i += 1) {
    const [x0, y0] = poly[i];
    const [x1, y1] = poly[(i + 1) % poly.length];
    const cross = x0 * y1 - x1 * y0;
    twiceArea += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  }
  if (Math.abs(twiceArea) < 1e-4) {
    let sx = 0;
    let sy = 0;
    for (const [x, y] of poly) {
      sx += x;
      sy += y;
    }
    return { x: sx / poly.length, y: sy / poly.length, area: 0 };
  }
  const area = Math.abs(twiceArea) * 0.5;
  return { x: cx / (3 * twiceArea), y: cy / (3 * twiceArea), area };
}

class UnionFind {
  private parent: number[];

  constructor(size: number) {
    this.parent = Array.from({ length: size }, (_, i) => i);
  }

  find(i: number): number {
    let root = i;
    while (this.parent[root] !== root) root = this.parent[root];
    let cur = i;
    while (this.parent[cur] !== cur) {
      const next = this.parent[cur];
      this.parent[cur] = root;
      cur = next;
    }
    return root;
  }

  union(a: number, b: number): void {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.parent[rb] = ra;
  }
}

const MIN_LABEL_COMPONENT_AREA_PX2 = 12_000;

function buildOccupationLabels(
  sites: GalaxyTerritorySite[],
  n: number,
  edgeOwners: Map<string, { a: Point; b: Point; sites: number[] }>,
  cellMetrics: Array<{ side: 'blue' | 'red'; x: number; y: number; area: number } | null>,
): GalaxyTerritoryOccupationLabel[] {
  const uf = new UnionFind(n);
  for (const { sites: owners } of edgeOwners.values()) {
    if (owners.length !== 2) continue;
    const i = owners[0];
    const j = owners[1];
    const sideA = sites[i]?.factionSide;
    const sideB = sites[j]?.factionSide;
    if (sideA !== 'neutral' && sideA === sideB) uf.union(i, j);
  }

  const groups = new Map<number, { side: 'blue' | 'red'; sumX: number; sumY: number; sumArea: number }>();
  for (let i = 0; i < n; i += 1) {
    const m = cellMetrics[i];
    if (!m || m.area <= 0) continue;
    const root = uf.find(i);
    const cur = groups.get(root);
    if (cur) {
      cur.sumX += m.x * m.area;
      cur.sumY += m.y * m.area;
      cur.sumArea += m.area;
    } else {
      groups.set(root, {
        side: m.side,
        sumX: m.x * m.area,
        sumY: m.y * m.area,
        sumArea: m.area,
      });
    }
  }

  const labels: GalaxyTerritoryOccupationLabel[] = [];
  let blueIdx = 0;
  let redIdx = 0;
  for (const g of groups.values()) {
    if (g.sumArea < MIN_LABEL_COMPONENT_AREA_PX2) continue;
    const x = g.sumX / g.sumArea;
    const y = g.sumY / g.sumArea;
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    if (g.side === 'blue') {
      labels.push({ key: `blue-${blueIdx}`, factionSide: 'blue', x, y });
      blueIdx += 1;
    } else {
      labels.push({ key: `red-${redIdx}`, factionSide: 'red', x, y });
      redIdx += 1;
    }
  }
  return labels;
}

export function buildGalaxyTerritoryVoronoiLayers(input: {
  sites: GalaxyTerritorySite[];
  bounds: Bounds;
}): GalaxyTerritoryLayers {
  const { sites, bounds: mapBounds } = input;
  const n = sites.length;
  if (n < 2) return { fills: [], borders: [], occupationLabels: [] };

  const clipBounds = computeClipBounds(sites, mapBounds);
  const delaunay = Delaunay.from(sites, (d) => d.x, (d) => d.y);
  const voronoi = delaunay.voronoi([clipBounds.x0, clipBounds.y0, clipBounds.x1, clipBounds.y1]);

  const fills: GalaxyTerritoryFill[] = [];
  const borderSegments: BorderSegment[] = [];
  const edgeOwners = new Map<string, { a: Point; b: Point; sites: number[] }>();
  const cellMetrics: Array<{ side: 'blue' | 'red'; x: number; y: number; area: number } | null> =
    Array.from({ length: n }, () => null);

  for (let i = 0; i < n; i += 1) {
    const site = sites[i];
    const poly = voronoi.cellPolygon(i);
    if (!poly || poly.length < 3) continue;

    if (site.factionSide === 'blue' || site.factionSide === 'red') {
      const { x, y, area } = polygonAreaCentroid(poly);
      cellMetrics[i] = { side: site.factionSide, x, y, area };
    }

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

  const occupationLabels = buildOccupationLabels(sites, n, edgeOwners, cellMetrics);

  return { fills, borders, occupationLabels };
}
