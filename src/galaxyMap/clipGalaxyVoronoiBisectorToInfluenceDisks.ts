/**
 * 국경 짝짓기 — 좌표 키가 아니라 성계 쌍.
 * 공유 이등분선은 클램프 이전 셀에서 구하고, 원(i) ∩ 원(j)로만 자른다.
 * 채움 폴리곤은 이 모듈을 쓰지 않는다.
 */

export type BisectorPoint = [number, number];

const POINT_EPS = 0.75;
const MIN_SEG_LEN = 0.5;
const INSIDE_EPS = 0.51;

export function pointsNear(
  a: BisectorPoint,
  b: BisectorPoint,
  eps = POINT_EPS,
): boolean {
  return Math.abs(a[0] - b[0]) <= eps && Math.abs(a[1] - b[1]) <= eps;
}

export function forEachPolyEdge(
  poly: readonly BisectorPoint[],
  fn: (a: BisectorPoint, b: BisectorPoint) => void,
): void {
  const n = poly.length;
  if (n < 2) return;
  const closed = pointsNear(poly[0]!, poly[n - 1]!, 1e-6);
  const last = closed ? n - 1 : n;
  for (let k = 0; k < last; k += 1) {
    const a = poly[k]!;
    const b = poly[(k + 1) % n]!;
    if (!Number.isFinite(a[0]) || !Number.isFinite(a[1]) || !Number.isFinite(b[0]) || !Number.isFinite(b[1])) {
      continue;
    }
    if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-6) continue;
    fn(a, b);
  }
}

function edgeMatches(a: BisectorPoint, b: BisectorPoint, c: BisectorPoint, d: BisectorPoint): boolean {
  return (pointsNear(a, c) && pointsNear(b, d)) || (pointsNear(a, d) && pointsNear(b, c));
}

/** 클램프 전 두 셀이 공유하는 이등분선 구간. 없으면 null. */
export function findSharedUnclampedEdge(
  polyI: readonly BisectorPoint[],
  polyJ: readonly BisectorPoint[],
): [BisectorPoint, BisectorPoint] | null {
  let found: [BisectorPoint, BisectorPoint] | null = null;
  let foundLen = 0;
  forEachPolyEdge(polyI, (a, b) => {
    forEachPolyEdge(polyJ, (c, d) => {
      if (!edgeMatches(a, b, c, d)) return;
      const len = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (len > foundLen) {
        found = [a, b];
        foundLen = len;
      }
    });
  });
  return found;
}

function lerp(a: BisectorPoint, b: BisectorPoint, t: number): BisectorPoint {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/** 선분 ∩ 원. 없으면 null. */
export function clipSegmentToDisk(
  a: BisectorPoint,
  b: BisectorPoint,
  cx: number,
  cy: number,
  radiusPx: number,
): [BisectorPoint, BisectorPoint] | null {
  const r = radiusPx + INSIDE_EPS;
  if (!(r > 0) || !Number.isFinite(r)) return [a, b];
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const fx = a[0] - cx;
  const fy = a[1] - cy;
  const A = dx * dx + dy * dy;
  if (A < 1e-16) {
    return Math.hypot(fx, fy) <= r ? [a, b] : null;
  }
  const B = 2 * (fx * dx + fy * dy);
  const C = fx * fx + fy * fy - r * r;
  const disc = B * B - 4 * A * C;
  if (disc < 0) return null;
  const sqrtD = Math.sqrt(disc);
  const inv = 1 / (2 * A);
  const t0 = (-B - sqrtD) * inv;
  const t1 = (-B + sqrtD) * inv;
  const tEnter = Math.max(0, t0);
  const tExit = Math.min(1, t1);
  if (tEnter > tExit + 1e-9) return null;
  const p0 = lerp(a, b, tEnter);
  const p1 = lerp(a, b, tExit);
  if (Math.hypot(p0[0] - p1[0], p0[1] - p1[1]) < MIN_SEG_LEN) return null;
  return [p0, p1];
}

/**
 * 이등분선 ∩ 원(i) ∩ 원(j). 대칭 — 순서만 바꿔도 같은 구간.
 * R<=0 이면 원 제한 없이 원본 선분을 그대로 둔다.
 */
export function clipSegmentToDiskIntersection(
  a: BisectorPoint,
  b: BisectorPoint,
  siteI: { x: number; y: number },
  siteJ: { x: number; y: number },
  radiusPx: number,
): [BisectorPoint, BisectorPoint] | null {
  if (!(radiusPx > 0) || !Number.isFinite(radiusPx)) {
    return Math.hypot(a[0] - b[0], a[1] - b[1]) < MIN_SEG_LEN ? null : [a, b];
  }
  const first = clipSegmentToDisk(a, b, siteI.x, siteI.y, radiusPx);
  if (!first) return null;
  return clipSegmentToDisk(first[0], first[1], siteJ.x, siteJ.y, radiusPx);
}

export function sameSegment(
  a: [BisectorPoint, BisectorPoint],
  b: [BisectorPoint, BisectorPoint],
  eps = POINT_EPS,
): boolean {
  return (
    (pointsNear(a[0], b[0], eps) && pointsNear(a[1], b[1], eps))
    || (pointsNear(a[0], b[1], eps) && pointsNear(a[1], b[0], eps))
  );
}
