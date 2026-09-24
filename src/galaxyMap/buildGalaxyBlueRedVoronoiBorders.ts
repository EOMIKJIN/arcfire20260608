import { Delaunay } from 'd3-delaunay';
import { resolveVoronoiInfluenceRadiusPx } from './clampGalaxyVoronoiInfluenceCell';
import {
  clipSegmentToDiskIntersection,
  findSharedUnclampedEdge,
  type BisectorPoint,
} from './clipGalaxyVoronoiBisectorToInfluenceDisks';
import { computeGalaxyVoronoiClipBounds } from './galaxyVoronoiClipBounds';
import {
  MAP_FACTION_CONTEST_BORDER_COLOR,
  resolveMapFactionBorderColor,
} from './mapFactionSideCore';

export type VoronoiSiteSide = 'blue' | 'red' | 'neutral' | 'independent';

export type GalaxyVoronoiSite = {
  systemId: string;
  x: number;
  y: number;
  /**
   * blue/red/independent = 소유 팀. neutral = 중립·미개척.
   * 중립·미개척은 국경선 owner가 아니지만, 위치는 격자 계산에 포함되어
   * 블루·레드·독립 셀이 직접 붙지 않게 완충 셀을 만든다.
   */
  side: VoronoiSiteSide;
};

export type GalaxyVoronoiBorderSegment = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** 'blue' | 'red' | 'contest'(블루-레드 접경, 노랑) | 'independent'(녹색, 최우선) */
  kind: 'blue' | 'red' | 'contest' | 'independent';
  color: string;
};

export type GalaxyVoronoiOwnedBorderSegment = GalaxyVoronoiBorderSegment & {
  ownerA: string;
  ownerB: string;
};

type Bounds = { x0: number; y0: number; x1: number; y1: number };
type Point = BisectorPoint;

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
 * - 국경 짝짓기는 클램프 후 좌표가 아니라 Delaunay 성계 쌍.
 *   공유 이등분선 ∩ 원(i) ∩ 원(j)만 실선. 빈 우주·거리 2R 초과는 없음.
 */
export function tessellateGalaxyBlueRedVoronoiBorderSegments(input: {
  sites: GalaxyVoronoiSite[];
  bounds: Bounds;
  influenceRadiusPx?: number;
}): GalaxyVoronoiOwnedBorderSegment[] {
  const { sites, bounds: mapBounds } = input;
  const n = sites.length;
  if (n < 2) return [];

  const bounds = computeGalaxyVoronoiClipBounds(sites, mapBounds);
  const influenceR = input.influenceRadiusPx ?? resolveVoronoiInfluenceRadiusPx(sites);
  const coords: Point[] = [];
  for (let i = 0; i < n; i += 1) {
    const s = sites[i]!;
    coords.push([s.x, s.y]);
  }
  const delaunay = Delaunay.from(coords, (p) => p[0], (p) => p[1]);
  const voronoi = delaunay.voronoi([bounds.x0, bounds.y0, bounds.x1, bounds.y1]);

  const rawCells: Array<Point[] | null> = [];
  for (let i = 0; i < n; i += 1) {
    const raw = voronoi.cellPolygon(i);
    if (!raw || raw.length < 2) {
      rawCells.push(null);
      continue;
    }
    const asPoints: Point[] = [];
    for (let p = 0; p < raw.length; p += 1) {
      asPoints.push([raw[p][0], raw[p][1]]);
    }
    rawCells.push(asPoints);
  }

  const blueColor = resolveMapFactionBorderColor('blue');
  const redColor = resolveMapFactionBorderColor('red');
  const independentColor = resolveMapFactionBorderColor('independent');
  const contestColor = MAP_FACTION_CONTEST_BORDER_COLOR;
  const twoR = influenceR > 0 ? influenceR * 2 : Infinity;

  const segments: GalaxyVoronoiOwnedBorderSegment[] = [];
  for (let i = 0; i < n; i += 1) {
    const polyI = rawCells[i];
    if (!polyI) continue;
    const siteA = sites[i]!;
    for (const j of delaunay.neighbors(i)) {
      if (j <= i) continue;
      const polyJ = rawCells[j];
      if (!polyJ) continue;
      const siteB = sites[j]!;
      const sideA = siteA.side;
      const sideB = siteB.side;
      if (sideA === sideB) continue;

      const hasBlue = sideA === 'blue' || sideB === 'blue';
      const hasRed = sideA === 'red' || sideB === 'red';
      const hasIndependent = sideA === 'independent' || sideB === 'independent';
      if (!hasBlue && !hasRed && !hasIndependent) continue;

      const dist = Math.hypot(siteA.x - siteB.x, siteA.y - siteB.y);
      if (!(dist > 0) || dist >= twoR) continue;

      const shared = findSharedUnclampedEdge(polyI, polyJ);
      if (!shared) continue;
      const clipped = clipSegmentToDiskIntersection(
        shared[0],
        shared[1],
        siteA,
        siteB,
        influenceR,
      );
      if (!clipped) continue;
      const [a, b] = clipped;
      if (isClipHullEdge(a, b, bounds)) continue;

      let kind: 'blue' | 'red' | 'contest' | 'independent';
      let color: string;
      if (hasIndependent) {
        kind = 'independent';
        color = independentColor;
      } else if (hasBlue && hasRed) {
        kind = 'contest';
        color = contestColor;
      } else if (hasBlue) {
        kind = 'blue';
        color = blueColor;
      } else {
        kind = 'red';
        color = redColor;
      }

      segments.push({
        x1: a[0],
        y1: a[1],
        x2: b[0],
        y2: b[1],
        kind,
        color,
        ownerA: siteA.systemId,
        ownerB: siteB.systemId,
      });
    }
  }

  return segments;
}

export function paintGalaxyBlueRedVoronoiBorderSegments(
  segments: readonly GalaxyVoronoiOwnedBorderSegment[],
  revealedSystemIds?: ReadonlySet<string>,
): GalaxyVoronoiBorderSegment[] {
  if (!revealedSystemIds) return segments.slice();
  const out: GalaxyVoronoiBorderSegment[] = [];
  for (let i = 0; i < segments.length; i += 1) {
    const seg = segments[i]!;
    if (revealedSystemIds.has(seg.ownerA) && revealedSystemIds.has(seg.ownerB)) {
      out.push(seg);
    }
  }
  return out;
}

export function buildGalaxyBlueRedVoronoiBorderSegments(input: {
  sites: GalaxyVoronoiSite[];
  bounds: Bounds;
  revealedSystemIds?: ReadonlySet<string>;
}): GalaxyVoronoiBorderSegment[] {
  return paintGalaxyBlueRedVoronoiBorderSegments(
    tessellateGalaxyBlueRedVoronoiBorderSegments(input),
    input.revealedSystemIds,
  );
}
