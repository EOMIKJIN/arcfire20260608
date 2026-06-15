import type { GalaxyVoronoiBorderSegment } from './buildGalaxyBlueRedVoronoiBorders';

export type BorderPolyline = {
  kind: 'blue' | 'red' | 'contest';
  color: string;
  points: [number, number][];
  closed: boolean;
};

type Pt = [number, number];

const MATCH_EPS = 0.5;
/** 이 각도(라디안)보다 크게 꺾이는 꼭짓점만 모따기 (≈30°) */
const SHARP_TURN_RAD = (30 * Math.PI) / 180;
/** 모따기 컷 길이(px) — 인접 변의 40% 이내로 제한 */
const CHAMFER_PX = 9;
const CHAMFER_EDGE_FRACTION = 0.4;

function near(a: Pt, b: Pt): boolean {
  return Math.abs(a[0] - b[0]) <= MATCH_EPS && Math.abs(a[1] - b[1]) <= MATCH_EPS;
}

function dist(a: Pt, b: Pt): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

/** 동일 kind segment를 끝점 공유로 polyline 체인 연결 */
function chainSegments(segs: GalaxyVoronoiBorderSegment[]): { points: Pt[]; closed: boolean }[] {
  const remaining = segs.map((s) => ({
    a: [s.x1, s.y1] as Pt,
    b: [s.x2, s.y2] as Pt,
    used: false,
  }));

  const chains: { points: Pt[]; closed: boolean }[] = [];

  const findConnecting = (tip: Pt, excludeIdx: number): { idx: number; nextPt: Pt } | null => {
    let found: { idx: number; nextPt: Pt } | null = null;
    let count = 0;
    for (let i = 0; i < remaining.length; i += 1) {
      if (remaining[i].used || i === excludeIdx) continue;
      if (near(remaining[i].a, tip)) {
        count += 1;
        if (!found) found = { idx: i, nextPt: remaining[i].b };
      } else if (near(remaining[i].b, tip)) {
        count += 1;
        if (!found) found = { idx: i, nextPt: remaining[i].a };
      }
    }
    // 분기점(3개 이상)에서는 모호하므로 체인을 끊는다.
    return count === 1 ? found : null;
  };

  for (let start = 0; start < remaining.length; start += 1) {
    if (remaining[start].used) continue;
    remaining[start].used = true;
    const points: Pt[] = [remaining[start].a, remaining[start].b];

    // tail 확장
    for (;;) {
      const tip = points[points.length - 1];
      const conn = findConnecting(tip, -1);
      if (!conn) break;
      remaining[conn.idx].used = true;
      points.push(conn.nextPt);
    }
    // head 확장
    for (;;) {
      const tip = points[0];
      const conn = findConnecting(tip, -1);
      if (!conn) break;
      remaining[conn.idx].used = true;
      points.unshift(conn.nextPt);
    }

    const closed = points.length >= 4 && near(points[0], points[points.length - 1]);
    if (closed) points.pop();
    chains.push({ points, closed });
  }

  return chains;
}

/** 급하게 꺾이는 꼭짓점에만 모따기 — 꼭짓점 1개를 A·B 2개로 치환(중간 라인 1단 추가) */
function chamferPolyline(points: Pt[], closed: boolean): Pt[] {
  const n = points.length;
  if (n < 3) return points;

  const out: Pt[] = [];
  const lastIdx = n - 1;

  for (let i = 0; i < n; i += 1) {
    const isEnd = !closed && (i === 0 || i === lastIdx);
    if (isEnd) {
      out.push(points[i]);
      continue;
    }
    const prev = points[(i - 1 + n) % n];
    const v = points[i];
    const next = points[(i + 1) % n];

    const inLen = dist(prev, v);
    const outLen = dist(v, next);
    if (inLen < 1e-6 || outLen < 1e-6) {
      out.push(v);
      continue;
    }

    const dirInX = (v[0] - prev[0]) / inLen;
    const dirInY = (v[1] - prev[1]) / inLen;
    const dirOutX = (next[0] - v[0]) / outLen;
    const dirOutY = (next[1] - v[1]) / outLen;

    const dot = Math.max(-1, Math.min(1, dirInX * dirOutX + dirInY * dirOutY));
    const turn = Math.acos(dot);

    if (turn < SHARP_TURN_RAD) {
      out.push(v);
      continue;
    }

    const t = Math.min(CHAMFER_PX, inLen * CHAMFER_EDGE_FRACTION, outLen * CHAMFER_EDGE_FRACTION);
    if (t <= 0.5) {
      out.push(v);
      continue;
    }

    const a: Pt = [v[0] - dirInX * t, v[1] - dirInY * t];
    const b: Pt = [v[0] + dirOutX * t, v[1] + dirOutY * t];
    out.push(a);
    out.push(b);
  }

  return out;
}

/** segment → kind별 체인 연결 → 급커브 모따기 polyline */
export function chainAndChamferGalaxyBorders(
  segments: GalaxyVoronoiBorderSegment[],
): BorderPolyline[] {
  const byKind = new Map<'blue' | 'red' | 'contest', GalaxyVoronoiBorderSegment[]>();
  for (const seg of segments) {
    const list = byKind.get(seg.kind);
    if (list) list.push(seg);
    else byKind.set(seg.kind, [seg]);
  }

  const out: BorderPolyline[] = [];
  for (const [kind, segs] of byKind) {
    const color = segs[0].color;
    const chains = chainSegments(segs);
    for (const chain of chains) {
      const chamfered = chamferPolyline(chain.points, chain.closed);
      if (chamfered.length < 2) continue;
      out.push({ kind, color, points: chamfered, closed: chain.closed });
    }
  }

  return out;
}
