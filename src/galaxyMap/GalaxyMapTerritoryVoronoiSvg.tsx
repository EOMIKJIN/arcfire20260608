import React, { memo, useMemo } from 'react';
import { G, Path } from 'react-native-svg';
import type { GalaxyTerritoryFill } from './buildGalaxyTerritoryVoronoi';
import type { GalaxyTerritoryVoronoiPath } from './computeGalaxyMapTerritoryVoronoiModel';

type Props = {
  fills: GalaxyTerritoryFill[];
  paths: GalaxyTerritoryVoronoiPath[];
};

/** Voronoi 셀 영역 채움 — hex 알파(RN SVG 호환) */
const TERRITORY_CELL_FILL_ALPHA = 0.08;

function withFillAlphaHex(hex: string, alpha: number): string {
  const raw = String(hex ?? '').replace('#', '').trim();
  if (raw.length !== 6) return hex;
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255);
  return `#${raw}${a.toString(16).padStart(2, '0').toUpperCase()}`;
}

/** Polygon `points` → Path d (배칭용) */
function polygonPointsToPathD(points: string): string {
  const toks = String(points ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (toks.length === 0) return '';
  let d = '';
  for (let i = 0; i < toks.length; i += 1) {
    const xy = toks[i]!.split(',');
    const x = xy[0];
    const y = xy[1];
    if (x == null || y == null) continue;
    d += i === 0 ? `M${x} ${y}` : `L${x} ${y}`;
  }
  return d ? `${d}Z` : '';
}

type BatchedFillPath = { key: string; d: string; fill: string };
type BatchedStrokePath = { key: string; d: string; color: string };

function batchFillsByColor(fills: readonly GalaxyTerritoryFill[]): BatchedFillPath[] {
  const groups = new Map<string, string[]>();
  for (const fill of fills) {
    const d = polygonPointsToPathD(fill.points);
    if (!d) continue;
    const color = withFillAlphaHex(fill.fillColor, TERRITORY_CELL_FILL_ALPHA);
    let parts = groups.get(color);
    if (!parts) {
      parts = [];
      groups.set(color, parts);
    }
    parts.push(d);
  }
  const out: BatchedFillPath[] = [];
  let i = 0;
  for (const [fill, parts] of groups) {
    if (parts.length === 0) continue;
    out.push({ key: `voronoi-fill-${i}-${fill}`, d: parts.join(''), fill });
    i += 1;
  }
  return out;
}

function batchStrokesByColor(
  paths: readonly GalaxyTerritoryVoronoiPath[],
  pick: (p: GalaxyTerritoryVoronoiPath) => string,
  prefix: string,
): BatchedStrokePath[] {
  const groups = new Map<string, string[]>();
  for (const p of paths) {
    const d = String(p.d ?? '').trim();
    if (!d) continue;
    const color = pick(p);
    let parts = groups.get(color);
    if (!parts) {
      parts = [];
      groups.set(color, parts);
    }
    parts.push(d);
  }
  const out: BatchedStrokePath[] = [];
  let i = 0;
  for (const [color, parts] of groups) {
    if (parts.length === 0) continue;
    out.push({ key: `${prefix}-${i}-${color}`, d: parts.join(''), color });
    i += 1;
  }
  return out;
}

/** Voronoi 국경 — 헤일로(번짐) + 코어(선명) 동일 hue */
const BORDER_HALO = { width: 12, opacity: 0.17 };
const BORDER_CORE = { width: 2.2, opacity: 0.98 };

/**
 * Voronoi 채움·국경선만 (라벨은 노드 위 별도 레이어).
 * Views 절감: 셀별 Polygon/Path → 색상별 단일 Path 배칭 (overnight soak 2026-09-08).
 */
export const GalaxyMapTerritoryVoronoiSvg = memo(function GalaxyMapTerritoryVoronoiSvg({
  fills,
  paths,
}: Props) {
  const batchedFills = useMemo(() => batchFillsByColor(fills), [fills]);
  const batchedHalos = useMemo(
    () => batchStrokesByColor(paths, (p) => p.color, 'voronoi-halo'),
    [paths],
  );
  const batchedCores = useMemo(
    () => batchStrokesByColor(paths, (p) => p.coreColor, 'voronoi-core'),
    [paths],
  );

  if (batchedFills.length === 0 && batchedHalos.length === 0 && batchedCores.length === 0) {
    return null;
  }

  return (
    <G pointerEvents="none">
      {batchedFills.map((f) => (
        <Path key={f.key} d={f.d} fill={f.fill} stroke="transparent" />
      ))}
      {batchedHalos.map((p) => (
        <Path
          key={p.key}
          d={p.d}
          stroke={p.color}
          strokeWidth={BORDER_HALO.width}
          strokeOpacity={BORDER_HALO.opacity}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {batchedCores.map((p) => (
        <Path
          key={p.key}
          d={p.d}
          stroke={p.color}
          strokeWidth={BORDER_CORE.width}
          strokeOpacity={BORDER_CORE.opacity}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </G>
  );
});
