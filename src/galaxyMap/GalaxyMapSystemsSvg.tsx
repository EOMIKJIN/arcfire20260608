import React, { memo, useMemo } from 'react';
import { Circle, G, Path, Text as SvgText } from 'react-native-svg';
import type { StarSystem } from '../types';
import type { AppLocale } from '../i18n/types';
import { resolveStarSystemDisplayName } from '../i18n/systemText';
import { COLORS, FONTS, LAYOUT, ZONE_COLORS } from '../utils/theme';
import {
  batchGalaxyMapConnectionPaths,
  type GalaxyMapEdgeSegment,
} from './batchGalaxyMapConnectionPaths';

const NODE_R = LAYOUT.map_node_radius;
const NODE_R_CURRENT = LAYOUT.map_node_radius_start;

const LOCK_LINE = '#526483';
const GAME_LINE_DIM = 'rgba(255,255,255,0.22)';
const GAME_LINE_HI = 'rgba(255,255,255,0.85)';

export type GalaxyMapSystemsSvgProps = {
  systems: StarSystem[];
  systemById: Record<string, StarSystem>;
  currentId: string;
  selectedId: string;
  visitedIds: string[];
  reachableIds: string[];
  unlockedIds: string[];
  clanOwnerColorBySystemId: Record<string, string | undefined>;
  toScreen: (pos: { x: number; y: number }) => { x: number; y: number };
  locale: AppLocale;
};

function shortName(name: string): string {
  return name.length > 10 ? `${name.slice(0, 9)}…` : name;
}

/** 점유 확정(블루/레드) vs 미결정 — 방문 노드 안쪽 점 색 */
function resolveOccupiedNodeInnerFill(clanOwnerColor: string | undefined): string {
  return clanOwnerColor ?? '#FFFFFF';
}

export const GalaxyMapSystemsSvg = memo(function GalaxyMapSystemsSvg({
  systems,
  systemById,
  currentId,
  selectedId,
  visitedIds,
  reachableIds,
  unlockedIds,
  clanOwnerColorBySystemId,
  toScreen,
  locale,
}: GalaxyMapSystemsSvgProps) {
  const unlockedSet = useMemo(() => new Set(unlockedIds), [unlockedIds]);
  const visitedSet = useMemo(() => new Set(visitedIds), [visitedIds]);
  const reachableSet = useMemo(() => new Set(reachableIds), [reachableIds]);

  const batchedLines = useMemo(() => {
    const renderedLines = new Set<string>();
    const segments: GalaxyMapEdgeSegment[] = [];

    for (const sys of systems) {
      const posA = toScreen(sys.position);
      for (const connId of sys.connections) {
        const key = [sys.id, connId].sort().join('--');
        if (renderedLines.has(key)) continue;
        renderedLines.add(key);

        const connSys = systemById[connId];
        if (!connSys) continue;
        const posB = toScreen(connSys.position);

        const aPlay = unlockedSet.has(sys.id);
        const bPlay = unlockedSet.has(connId);
        const isGameplayEdge = aPlay && bPlay;
        const isReachable =
          (sys.id === currentId && reachableSet.has(connId))
          || (connId === currentId && reachableSet.has(sys.id));

        segments.push({
          x1: posA.x,
          y1: posA.y,
          x2: posB.x,
          y2: posB.y,
          stroke: isGameplayEdge ? (isReachable ? GAME_LINE_HI : GAME_LINE_DIM) : LOCK_LINE,
          strokeWidth: isGameplayEdge ? (isReachable ? 1.75 : 1) : 0.9,
          opacity: isGameplayEdge ? 1 : 0.35,
        });
      }
    }

    return batchGalaxyMapConnectionPaths(segments);
  }, [systems, systemById, currentId, unlockedSet, reachableSet, toScreen]);

  const nodes = useMemo(() => {
    return systems.map((sys) => {
      const pos = toScreen(sys.position);
      const isCurrent = sys.id === currentId;
      const isSelected = sys.id === selectedId;
      const isVisited = visitedSet.has(sys.id);
      const isReachable = reachableSet.has(sys.id);
      const isGameplay = unlockedSet.has(sys.id);
      const zoneColor = ZONE_COLORS[sys.zone] ?? COLORS.info;
      const clanOwnerColor = clanOwnerColorBySystemId[sys.id];
      const accent = clanOwnerColor ?? zoneColor;
      const r = isCurrent ? NODE_R_CURRENT : NODE_R;
      const opacity = isGameplay
        ? (isVisited || isCurrent || isReachable ? 1 : 0.75)
        : 0.55;
      const label = shortName(resolveStarSystemDisplayName(sys, locale));
      const labelFill = isGameplay ? '#FFFFFF' : '#7F93B8';

      let body: React.ReactNode;
      if (!isGameplay) {
        body = (
          <Circle cx={pos.x} cy={pos.y} r={r} fill="#2B3547" stroke="#526483" strokeWidth={1} />
        );
      } else if (isCurrent) {
        body = (
          <Circle
            cx={pos.x}
            cy={pos.y}
            r={r}
            fill={resolveOccupiedNodeInnerFill(clanOwnerColor)}
          />
        );
      } else if (isVisited) {
        const innerR = Math.max(2.5, r * 0.42) + 1;
        const innerFill = resolveOccupiedNodeInnerFill(clanOwnerColor);
        body = (
          <>
            <Circle
              cx={pos.x}
              cy={pos.y}
              r={r}
              fill="rgba(255,255,255,0.10)"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth={1.25}
            />
            <Circle cx={pos.x} cy={pos.y} r={innerR} fill={innerFill} />
          </>
        );
      } else if (isReachable) {
        body = (
          <Circle
            cx={pos.x}
            cy={pos.y}
            r={r}
            fill={`${accent}33`}
            stroke={clanOwnerColor ? `${clanOwnerColor}DD` : GAME_LINE_HI}
            strokeWidth={1.5}
          />
        );
      } else {
        body = (
          <Circle
            cx={pos.x}
            cy={pos.y}
            r={r}
            fill={clanOwnerColor ? `${clanOwnerColor}22` : 'rgba(255,255,255,0.10)'}
            stroke={clanOwnerColor ? `${clanOwnerColor}CC` : 'rgba(255,255,255,0.55)'}
            strokeWidth={1.25}
          />
        );
      }

      return (
        <G key={sys.id} opacity={opacity}>
          {isSelected ? (
            <Circle
              cx={pos.x}
              cy={pos.y}
              r={r + 5}
              stroke={isGameplay ? 'rgba(255,255,255,0.85)' : 'rgba(127,147,184,0.75)'}
              strokeWidth={1}
              fill="transparent"
            />
          ) : null}
          {body}
          {isCurrent ? <Circle cx={pos.x} cy={pos.y} r={3} fill={COLORS.bg_primary} /> : null}
          <SvgText
            x={pos.x}
            y={pos.y + r + 10}
            fill={labelFill}
            fontSize={8}
            fontFamily={FONTS.mono}
            textAnchor="middle"
            opacity={isGameplay ? 0.95 : 0.75}
          >
            {label}
          </SvgText>
        </G>
      );
    });
  }, [
    systems,
    currentId,
    selectedId,
    visitedSet,
    reachableSet,
    unlockedSet,
    clanOwnerColorBySystemId,
    toScreen,
    locale,
  ]);

  return (
    <G>
      {batchedLines.map((line) => (
        <Path
          key={line.key}
          d={line.d}
          stroke={line.stroke}
          strokeWidth={line.strokeWidth}
          opacity={line.opacity}
          fill="none"
        />
      ))}
      {nodes}
    </G>
  );
});
