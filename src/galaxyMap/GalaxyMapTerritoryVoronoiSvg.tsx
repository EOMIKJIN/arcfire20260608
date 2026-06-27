import React, { memo } from 'react';

import { G, Path, Polygon } from 'react-native-svg';

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



/** Voronoi 국경 — 헤일로(번짐) + 코어(선명) 동일 hue */

const BORDER_HALO = { width: 12, opacity: 0.17 };

const BORDER_CORE = { width: 2.2, opacity: 0.98 };



/** Voronoi 채움·국경선만 (라벨은 노드 위 별도 레이어) */

export const GalaxyMapTerritoryVoronoiSvg = memo(function GalaxyMapTerritoryVoronoiSvg({

  fills,

  paths,

}: Props) {

  if (fills.length === 0 && paths.length === 0) return null;



  return (

    <G pointerEvents="none">

      {fills.map((fill) => (

        <Polygon

          key={`fill-${fill.key}`}

          points={fill.points}

          fill={withFillAlphaHex(fill.fillColor, TERRITORY_CELL_FILL_ALPHA)}

          stroke="transparent"

        />

      ))}

      {paths.map((p) => (

        <Path

          key={`halo-${p.key}`}

          d={p.d}

          stroke={p.color}

          strokeWidth={BORDER_HALO.width}

          strokeOpacity={BORDER_HALO.opacity}

          fill="none"

          strokeLinecap="round"

          strokeLinejoin="round"

        />

      ))}

      {paths.map((p) => (

        <Path

          key={`core-${p.key}`}

          d={p.d}

          stroke={p.coreColor}

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


