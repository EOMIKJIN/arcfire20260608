/**
 * 영역 = Voronoi 셀 ∩ 원(중심=성계, 반지름 R)
 * 이등분선은 움직이지 않는다. 내부 셀은 셀⊂원이면 1픽셀도 안 바뀐다.
 */

export type InfluencePoint = [number, number];

/** v1: 전 성계 공통 — 최근접 성계 평균 간격 × 이 배수 */
export const VORONOI_INFLUENCE_RADIUS_NN_MUL = 1.35;
const DISK_SIDES = 28;
const INSIDE_EPS = 0.51;

export function meanNearestNeighborDist(
  sites: readonly { x: number; y: number }[],
): number {
  const n = sites.length;
  if (n < 2) return 0;
  let sum = 0;
  let count = 0;
  for (let i = 0; i < n; i += 1) {
    const a = sites[i]!;
    let best = Infinity;
    for (let j = 0; j < n; j += 1) {
      if (i === j) continue;
      const b = sites[j]!;
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d > 0 && d < best) best = d;
    }
    if (Number.isFinite(best)) {
      sum += best;
      count += 1;
    }
  }
  return count > 0 ? sum / count : 0;
}

export function resolveVoronoiInfluenceRadiusPx(
  sites: readonly { x: number; y: number }[],
): number {
  const nn = meanNearestNeighborDist(sites);
  if (!(nn > 0)) return 0;
  return nn * VORONOI_INFLUENCE_RADIUS_NN_MUL;
}

function isFinitePoint(p: InfluencePoint): boolean {
  return Number.isFinite(p[0]) && Number.isFinite(p[1]);
}

function allVerticesInsideDisk(
  poly: InfluencePoint[],
  cx: number,
  cy: number,
  r: number,
): boolean {
  const lim = r + INSIDE_EPS;
  for (let i = 0; i < poly.length; i += 1) {
    const p = poly[i]!;
    if (Math.hypot(p[0] - cx, p[1] - cy) > lim) return false;
  }
  return true;
}

function regularDiskPolygon(
  cx: number,
  cy: number,
  r: number,
  sides: number,
): InfluencePoint[] {
  const out: InfluencePoint[] = [];
  for (let i = 0; i < sides; i += 1) {
    const a = (Math.PI * 2 * i) / sides;
    out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return out;
}

function isLeftOf(p: InfluencePoint, a: InfluencePoint, b: InfluencePoint): boolean {
  return (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) >= -1e-6;
}

function edgeIntersect(
  s: InfluencePoint,
  e: InfluencePoint,
  a: InfluencePoint,
  b: InfluencePoint,
): InfluencePoint {
  const dx1 = e[0] - s[0];
  const dy1 = e[1] - s[1];
  const dx2 = b[0] - a[0];
  const dy2 = b[1] - a[1];
  const den = dx1 * dy2 - dy1 * dx2;
  if (Math.abs(den) < 1e-12) return e;
  const t = ((a[0] - s[0]) * dy2 - (a[1] - s[1]) * dx2) / den;
  return [s[0] + dx1 * t, s[1] + dy1 * t];
}

function sutherlandHodgman(
  subject: InfluencePoint[],
  clip: InfluencePoint[],
): InfluencePoint[] {
  let output = subject;
  const m = clip.length;
  for (let i = 0; i < m; i += 1) {
    const a = clip[i]!;
    const b = clip[(i + 1) % m]!;
    const input = output;
    output = [];
    if (input.length === 0) break;
    let prev = input[input.length - 1]!;
    for (let j = 0; j < input.length; j += 1) {
      const cur = input[j]!;
      const curIn = isLeftOf(cur, a, b);
      const prevIn = isLeftOf(prev, a, b);
      if (curIn) {
        if (!prevIn) output.push(edgeIntersect(prev, cur, a, b));
        output.push(cur);
      } else if (prevIn) {
        output.push(edgeIntersect(prev, cur, a, b));
      }
      prev = cur;
    }
  }
  return output;
}

/** 셀 ⊂ 원이면 원본 참조 유지. 펼쳐진 셀만 깎는다. */
export function clampVoronoiCellToInfluenceRadius(
  poly: InfluencePoint[],
  cx: number,
  cy: number,
  radiusPx: number,
): InfluencePoint[] {
  if (!(radiusPx > 0) || !Number.isFinite(radiusPx) || poly.length < 3) return poly;
  const finite: InfluencePoint[] = [];
  for (let i = 0; i < poly.length; i += 1) {
    const p = poly[i]!;
    if (isFinitePoint(p)) finite.push([p[0], p[1]]);
  }
  if (finite.length < 3) return poly;
  if (allVerticesInsideDisk(finite, cx, cy, radiusPx)) return poly;
  const clipped = sutherlandHodgman(finite, regularDiskPolygon(cx, cy, radiusPx, DISK_SIDES));
  return clipped.length >= 3 ? clipped : poly;
}
