import { Delaunay } from 'd3-delaunay';
import {
  MAP_FACTION_CONTEST_BORDER_COLOR,
  resolveMapFactionBorderColor,
} from './resolveMapFactionSide';

export type VoronoiSiteSide = 'blue' | 'red' | 'neutral';

export type GalaxyVoronoiSite = {
  systemId: string;
  x: number;
  y: number;
  /**
   * blue/red = 소유 팀. neutral = 중립·미개척.
   * 중립·미개척은 국경선 owner가 아니지만, 위치는 격자 계산에 포함되어
   * 블루·레드 셀이 직접 붙지 않게 완충 셀을 만든다.
   */
  side: VoronoiSiteSide;
};

export type GalaxyVoronoiBorderSegment = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** 'blue' | 'red' | 'contest'(블루-레드 접경, 노랑) */
  kind: 'blue' | 'red' | 'contest';
  color: string;
};

type Bounds = { x0: number; y0: number; x1: number; y1: number };
type Point = [number, number];

function edgeKey(a: Point, b: Point): string {
  const sa = `${a[0].toFixed(3)},${a[1].toFixed(3)}`;
  const sb = `${b[0].toFixed(3)},${b[1].toFixed(3)}`;
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

function isClipHullEdge(a: Point, b: Point, bounds: Bounds): boolean {
  return isOnClipBounds(a[0], a[1], bounds) && isOnClipBounds(b[0], b[1], bounds);
}

/**
 * 블루·레드 국경선 segment 계산.
 *
 * - 모든 site(블루·레드·중립·미개척)로 Voronoi 격자를 만든다.
 * - 인접 두 셀의 side가 다른 변만 국경선 후보.
 * - blue↔red = 노랑(접경) · blue↔neutral = 파랑 · red↔neutral = 빨강
 * - neutral↔neutral = 그리지 않음 (중립·미개척은 자기 국경선 없음)
 * - 맵 가장자리(clip hull) 변은 제외.
 */
export function buildGalaxyBlueRedVoronoiBorderSegments(input: {
  sites: GalaxyVoronoiSite[];
  bounds: Bounds;
}): GalaxyVoronoiBorderSegment[] {
  const { sites, bounds } = input;
  const n = sites.length;
  if (n < 2) return [];

  const coords: Point[] = sites.map((s) => [s.x, s.y]);
  const delaunay = Delaunay.from(coords, (p) => p[0], (p) => p[1]);
  const voronoi = delaunay.voronoi([bounds.x0, bounds.y0, bounds.x1, bounds.y1]);

  const edgeOwners = new Map<string, { a: Point; b: Point; owners: number[] }>();

  for (let i = 0; i < n; i += 1) {
    const poly = voronoi.cellPolygon(i);
    if (!poly || poly.length < 2) continue;
    for (let k = 0; k < poly.length; k += 1) {
      const a: Point = [poly[k][0], poly[k][1]];
      const b: Point = [poly[(k + 1) % poly.length][0], poly[(k + 1) % poly.length][1]];
      if (!Number.isFinite(a[0]) || !Number.isFinite(a[1]) || !Number.isFinite(b[0]) || !Number.isFinite(b[1])) {
        continue;
      }
      const key = edgeKey(a, b);
      const cur = edgeOwners.get(key);
      if (cur) {
        if (!cur.owners.includes(i)) cur.owners.push(i);
      } else {
        edgeOwners.set(key, { a, b, owners: [i] });
      }
    }
  }

  const blueColor = resolveMapFactionBorderColor('blue');
  const redColor = resolveMapFactionBorderColor('red');
  const contestColor = MAP_FACTION_CONTEST_BORDER_COLOR;

  const segments: GalaxyVoronoiBorderSegment[] = [];
  for (const { a, b, owners } of edgeOwners.values()) {
    if (owners.length !== 2) continue;
    const sideA = sites[owners[0]].side;
    const sideB = sites[owners[1]].side;
    if (sideA === sideB) continue;

    const hasBlue = sideA === 'blue' || sideB === 'blue';
    const hasRed = sideA === 'red' || sideB === 'red';
    if (!hasBlue && !hasRed) continue; // neutral↔neutral

    if (isClipHullEdge(a, b, bounds)) continue;

    let kind: 'blue' | 'red' | 'contest';
    let color: string;
    if (hasBlue && hasRed) {
      kind = 'contest';
      color = contestColor;
    } else if (hasBlue) {
      kind = 'blue';
      color = blueColor;
    } else {
      kind = 'red';
      color = redColor;
    }

    segments.push({ x1: a[0], y1: a[1], x2: b[0], y2: b[1], kind, color });
  }

  return segments;
}
