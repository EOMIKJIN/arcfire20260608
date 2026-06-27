/** 은하 지도 연결선 — 동일 stroke 스타일별 단일 SVG Path 배칭 */

export type GalaxyMapEdgeSegment = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  strokeWidth: number;
  opacity: number;
};

export type BatchedGalaxyMapPath = {
  key: string;
  d: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
};

function segmentToD(x1: number, y1: number, x2: number, y2: number): string {
  return `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

export function batchGalaxyMapConnectionPaths(segments: readonly GalaxyMapEdgeSegment[]): BatchedGalaxyMapPath[] {
  const groups = new Map<
    string,
    { stroke: string; strokeWidth: number; opacity: number; parts: string[] }
  >();

  for (const s of segments) {
    const styleKey = `${s.stroke}|${s.strokeWidth}|${s.opacity}`;
    let group = groups.get(styleKey);
    if (!group) {
      group = {
        stroke: s.stroke,
        strokeWidth: s.strokeWidth,
        opacity: s.opacity,
        parts: [],
      };
      groups.set(styleKey, group);
    }
    group.parts.push(segmentToD(s.x1, s.y1, s.x2, s.y2));
  }

  let idx = 0;
  const out: BatchedGalaxyMapPath[] = [];
  for (const [styleKey, group] of groups) {
    if (group.parts.length === 0) continue;
    out.push({
      key: `galaxy-edges-${idx}-${styleKey}`,
      d: group.parts.join(''),
      stroke: group.stroke,
      strokeWidth: group.strokeWidth,
      opacity: group.opacity,
    });
    idx += 1;
  }
  return out;
}
