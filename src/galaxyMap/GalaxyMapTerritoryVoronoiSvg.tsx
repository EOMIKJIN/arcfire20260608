import React, { memo, useMemo } from 'react';
import { G, Path } from 'react-native-svg';
import type { StarSystem } from '../types';
import {
  buildGalaxyBlueRedVoronoiBorderSegments,
  type GalaxyVoronoiSite,
} from './buildGalaxyBlueRedVoronoiBorders';
import { chainAndChamferGalaxyBorders } from './chainAndChamferGalaxyBorders';
import { resolveMapFactionSideFromClanId } from './resolveMapFactionSide';

type Props = {
  systems: StarSystem[];
  occupierClanIdBySystemId: Record<string, string | undefined>;
  mapBounds: { x0: number; y0: number; x1: number; y1: number };
  toScreen: (pos: { x: number; y: number }) => { x: number; y: number };
};

function polylineToPath(points: [number, number][], closed: boolean): string {
  const finite = points.filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
  if (finite.length < 2) return '';
  const [first, ...rest] = finite;
  const body = `M${first[0].toFixed(2)} ${first[1].toFixed(2)}${rest
    .map(([x, y]) => ` L${x.toFixed(2)} ${y.toFixed(2)}`)
    .join('')}`;
  return closed ? `${body} Z` : body;
}

/** 코어용 — 색을 흰색 쪽으로 mix(0~1) */
function lightenHex(hex: string, mix: number): string {
  const raw = String(hex ?? '').replace('#', '').trim();
  if (raw.length !== 6) return hex;
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) return hex;
  const lr = Math.round(r + (255 - r) * mix);
  const lg = Math.round(g + (255 - g) * mix);
  const lb = Math.round(b + (255 - b) * mix);
  return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`;
}

/** 네온 글로우 레이어 — 넓고 흐린 헤일로 → 본체 → 밝은 코어 */
const NEON_GLOW_LAYERS: { width: number; opacity: number }[] = [
  { width: 18, opacity: 0.05 },
  { width: 12, opacity: 0.09 },
  { width: 7, opacity: 0.16 },
  { width: 4, opacity: 0.45 },
];

export const GalaxyMapTerritoryVoronoiSvg = memo(function GalaxyMapTerritoryVoronoiSvg({
  systems,
  occupierClanIdBySystemId,
  mapBounds,
  toScreen,
}: Props) {
  const paths = useMemo(() => {
    const sites: GalaxyVoronoiSite[] = [];
    for (const sys of systems) {
      /**
       * 모든 표시 성계를 site로 — 중립·미개척은 side=neutral 로 격자 계산에만 참여(국경선 owner 아님).
       * 블루·레드 셀이 직접 붙지 않게 완충 셀을 만들어 국경선을 구분한다.
       */
      const side = resolveMapFactionSideFromClanId(occupierClanIdBySystemId[sys.id]);
      const pos = toScreen(sys.position);
      if (!Number.isFinite(pos.x) || !Number.isFinite(pos.y)) continue;
      sites.push({ systemId: sys.id, x: pos.x, y: pos.y, side });
    }
    if (sites.length < 2) return [];
    const segments = buildGalaxyBlueRedVoronoiBorderSegments({ sites, bounds: mapBounds });
    const polylines = chainAndChamferGalaxyBorders(segments);
    return polylines
      .map((pl, idx) => ({
        key: `${pl.kind}-${idx}`,
        color: pl.color,
        coreColor: lightenHex(pl.color, 0.7),
        d: polylineToPath(pl.points, pl.closed),
      }))
      .filter((p) => p.d.length > 0 && !p.d.includes('NaN'));
  }, [systems, occupierClanIdBySystemId, mapBounds, toScreen]);

  if (paths.length === 0) return null;

  return (
    <G pointerEvents="none">
      {/* 글로우 헤일로 → 본체 (넓은 것부터) */}
      {NEON_GLOW_LAYERS.map((layer, li) =>
        paths.map((p) => (
          <Path
            key={`glow${li}-${p.key}`}
            d={p.d}
            stroke={p.color}
            strokeWidth={layer.width}
            strokeOpacity={layer.opacity}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )),
      )}
      {/* 밝은 코어(흰색 쪽) */}
      {paths.map((p) => (
        <Path
          key={`core-${p.key}`}
          d={p.d}
          stroke={p.coreColor}
          strokeWidth={1.6}
          strokeOpacity={0.98}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </G>
  );
});
