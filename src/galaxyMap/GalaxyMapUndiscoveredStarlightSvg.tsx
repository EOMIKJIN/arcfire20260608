import React, { memo, useMemo } from 'react';
import { G, Path } from 'react-native-svg';
import type { StarSystem } from '../types';
import {
  GALAXY_MAP_STARLIGHT_STROKE_WIDTH,
  buildGalaxyMapStarlightPaths,
} from './galaxyMapStarlightPaths';

/**
 * 미발견·안개 성계 + 빈 구역 별빛(도트) — 노드/라인/라벨 없이
 * 색×opacity 스타일별 배칭 Path 소수로만 렌더한다.
 */

export const GalaxyMapUndiscoveredStarlightSvg = memo(function GalaxyMapUndiscoveredStarlightSvg({
  systems,
  alwaysVisibleSystems,
  fillSites,
  toScreen,
}: {
  systems: readonly StarSystem[];
  /** 이동 안개로 가린 성계 — 샘플링 없이 1성계 1별빛 */
  alwaysVisibleSystems?: readonly StarSystem[];
  /** 성계 없는 전면 채움 */
  fillSites?: readonly Pick<StarSystem, 'id' | 'position'>[];
  toScreen: (pos: { x: number; y: number }) => { x: number; y: number };
}) {
  const paths = useMemo(
    () =>
      buildGalaxyMapStarlightPaths({
        sampledSystems: systems,
        alwaysVisibleSystems,
        fillSites,
        toScreen,
      }),
    [systems, alwaysVisibleSystems, fillSites, toScreen],
  );

  if (paths.length === 0) return null;

  // Fragment 대신 G — Svg 직계에서 다른 레이어 Path와 key 공간이 섞이지 않게 함
  return (
    <G pointerEvents="none">
      {paths.map((p) => (
        <Path
          key={p.key}
          d={p.d}
          stroke={p.color}
          strokeWidth={GALAXY_MAP_STARLIGHT_STROKE_WIDTH}
          strokeLinecap="round"
          opacity={p.opacity}
          fill="none"
        />
      ))}
    </G>
  );
});
