import React, { memo, useMemo } from 'react';
import { Circle, G, Path, Text as SvgText } from 'react-native-svg';
import type { StarSystem } from '../types';
import type { AppLocale } from '../i18n/types';
import {
  GALAXY_MAP_UNIDENTIFIED_LABEL_FILL,
  isGalaxyMapSystemNameRevealed,
  resolveGalaxyMapSystemDisplayLabel,
  shouldShowGalaxyMapSystemLabel,
} from './galaxyMapUnidentifiedLabel';
import { resolveVisitedNodeInnerR } from './galaxyMapColonizeHubPulse';
import { COLORS, FONTS, LAYOUT, ZONE_COLORS } from '../utils/theme';
import {
  EMPTY_GALAXY_MAP_QUEST_ACCEPT_MARKS,
  GALAXY_MAP_QUEST_MARK_MAIN_FILL,
  GALAXY_MAP_QUEST_MARK_MAIN_STROKE,
  GALAXY_MAP_QUEST_MARK_SIDE_FILL,
  GALAXY_MAP_QUEST_MARK_SIDE_STROKE,
  GALAXY_MAP_QUEST_MARK_STROKE_WIDTH,
  diamondPathD,
  resolveQuestMarkCenter,
  type GalaxyMapQuestAcceptMarks,
} from './galaxyMapQuestAcceptMarks';
/** Hermes — named import from sibling module can throw at runtime after HMR; keep local. */
type GalaxyMapEdgeSegment = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  strokeWidth: number;
  opacity: number;
};

type BatchedGalaxyMapPath = {
  key: string;
  d: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
};

function segmentToConnectionPathD(x1: number, y1: number, x2: number, y2: number): string {
  return `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

function batchGalaxyMapConnectionPaths(segments: readonly GalaxyMapEdgeSegment[]): BatchedGalaxyMapPath[] {
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
    group.parts.push(segmentToConnectionPathD(s.x1, s.y1, s.x2, s.y2));
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

/** 경로 미리보기 — edges와 형제 Path라 key 네임스페이스를 분리한다 */
function batchGalaxyMapRoutePreviewPaths(segments: readonly GalaxyMapEdgeSegment[]): BatchedGalaxyMapPath[] {
  const batched = batchGalaxyMapConnectionPaths(segments);
  return batched.map((line, i) => ({
    ...line,
    key: `galaxy-route-${i}-${line.stroke}|${line.strokeWidth}|${line.opacity}`,
  }));
}

const NODE_R = LAYOUT.map_node_radius;
const NODE_R_CURRENT = LAYOUT.map_node_radius_start;

const LOCK_LINE = '#526483';
const GAME_LINE_DIM = 'rgba(255,255,255,0.22)';
const GAME_LINE_HI = 'rgba(255,255,255,0.85)';
/** 선택 성계까지 최단 이동 경로 미리보기 */
const ROUTE_PREVIEW_ORANGE = '#FF9A3C';
/** 연결선이 모이는 성계 중심점 — 원 테두리(0.39)보다 아주 살짝 밝음 */
const HUB_DOT_R = 1.5;
const HUB_DOT_FILL = 'rgba(255,255,255,0.48)';

export type GalaxyMapSystemsSvgProps = {
  systems: StarSystem[];
  systemById: Record<string, StarSystem>;
  currentId: string;
  selectedId: string;
  /** current→selected BFS 최단 경로(성계 id). 2개 미만이면 미표시 */
  routePreviewSystemIds?: readonly string[];
  visitedIds: string[];
  reachableIds: string[];
  unlockedIds: string[];
  clanOwnerColorBySystemId: Record<string, string | undefined>;
  toScreen: (pos: { x: number; y: number }) => { x: number; y: number };
  locale: AppLocale;
  /** 수락 전 퀘스트 위치. 끄면 EMPTY */
  questAcceptMarks?: GalaxyMapQuestAcceptMarks;
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
  routePreviewSystemIds = [],
  visitedIds,
  reachableIds,
  unlockedIds,
  clanOwnerColorBySystemId,
  toScreen,
  locale,
  questAcceptMarks = EMPTY_GALAXY_MAP_QUEST_ACCEPT_MARKS,
}: GalaxyMapSystemsSvgProps) {
  const unlockedSet = useMemo(() => new Set(unlockedIds), [unlockedIds]);
  const visitedSet = useMemo(() => new Set(visitedIds), [visitedIds]);
  const reachableSet = useMemo(() => new Set(reachableIds), [reachableIds]);
  const renderedSystemIds = useMemo(() => {
    const ids = new Set<string>();
    for (let i = 0; i < systems.length; i++) ids.add(systems[i]!.id);
    return ids;
  }, [systems]);

  const batchedLines = useMemo(() => {
    const renderedLines = new Set<string>();
    const segments: GalaxyMapEdgeSegment[] = [];

    for (const sys of systems) {
      const posA = toScreen(sys.position);
      for (const connId of sys.connections) {
        if (!renderedSystemIds.has(connId)) continue;
        const key = sys.id < connId ? `${sys.id}--${connId}` : `${connId}--${sys.id}`;
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
  }, [systems, systemById, currentId, unlockedSet, reachableSet, renderedSystemIds, toScreen]);

  const routePreviewLines = useMemo(() => {
    if (routePreviewSystemIds.length < 2) return [];
    const segments: GalaxyMapEdgeSegment[] = [];
    for (let i = 0; i < routePreviewSystemIds.length - 1; i += 1) {
      const a = systemById[routePreviewSystemIds[i]!];
      const b = systemById[routePreviewSystemIds[i + 1]!];
      if (!a || !b) continue;
      const posA = toScreen(a.position);
      const posB = toScreen(b.position);
      segments.push({
        x1: posA.x,
        y1: posA.y,
        x2: posB.x,
        y2: posB.y,
        stroke: ROUTE_PREVIEW_ORANGE,
        strokeWidth: 2.75,
        opacity: 1,
      });
    }
    return batchGalaxyMapRoutePreviewPaths(segments);
  }, [routePreviewSystemIds, systemById, toScreen]);

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
      const nameRevealed = isGalaxyMapSystemNameRevealed(isVisited, isCurrent);
      const rawLabel = resolveGalaxyMapSystemDisplayLabel(sys, locale, nameRevealed);
      const label = nameRevealed ? shortName(rawLabel) : rawLabel;
      const labelFill = nameRevealed
        ? (isGameplay ? '#FFFFFF' : '#7F93B8')
        : GALAXY_MAP_UNIDENTIFIED_LABEL_FILL;
      const showLabel = shouldShowGalaxyMapSystemLabel(isGameplay, isSelected);

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
        const innerR = resolveVisitedNodeInnerR(r);
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
            stroke={clanOwnerColor ? `${clanOwnerColor}9B` : 'rgba(255,255,255,0.60)'}
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
            stroke={clanOwnerColor ? `${clanOwnerColor}8F` : 'rgba(255,255,255,0.39)'}
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
          <Circle cx={pos.x} cy={pos.y} r={HUB_DOT_R} fill={HUB_DOT_FILL} />
          {/*
            Views: 잠금 전체 라벨은 생략. 개방 성계는 미확인/실명 라벨 유지.
            실명은 도착(방문·현재) 후에만 — 선택/도달만으로는 본명 노출 금지.
          */}
          {showLabel ? (
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
          ) : null}
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

  const questMarkPaths = useMemo(() => {
    if (questAcceptMarks === EMPTY_GALAXY_MAP_QUEST_ACCEPT_MARKS) {
      return { mainD: '', sideD: '' };
    }
    let mainD = '';
    let sideD = '';
    for (const systemId in questAcceptMarks) {
      const mark = questAcceptMarks[systemId];
      if (!mark || (!mark.main && !mark.side)) continue;
      const sys = systemById[systemId];
      if (!sys) continue;
      const pos = toScreen(sys.position);
      const r = systemId === currentId ? NODE_R_CURRENT : NODE_R;
      const both = mark.main && mark.side;
      if (mark.main) {
        const c = resolveQuestMarkCenter(pos.x, pos.y, r, both ? 'main' : 'solo');
        mainD += diamondPathD(c.x, c.y);
      }
      if (mark.side) {
        const c = resolveQuestMarkCenter(pos.x, pos.y, r, both ? 'side' : 'solo');
        sideD += diamondPathD(c.x, c.y);
      }
    }
    return { mainD, sideD };
  }, [systemById, currentId, questAcceptMarks, toScreen]);

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
      {routePreviewLines.map((line) => (
        <Path
          key={line.key}
          d={line.d}
          stroke={line.stroke}
          strokeWidth={line.strokeWidth}
          opacity={line.opacity}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {nodes}
      {questMarkPaths.mainD ? (
        <Path
          d={questMarkPaths.mainD}
          fill={GALAXY_MAP_QUEST_MARK_MAIN_FILL}
          stroke={GALAXY_MAP_QUEST_MARK_MAIN_STROKE}
          strokeWidth={GALAXY_MAP_QUEST_MARK_STROKE_WIDTH}
          strokeLinejoin="miter"
        />
      ) : null}
      {questMarkPaths.sideD ? (
        <Path
          d={questMarkPaths.sideD}
          fill={GALAXY_MAP_QUEST_MARK_SIDE_FILL}
          stroke={GALAXY_MAP_QUEST_MARK_SIDE_STROKE}
          strokeWidth={GALAXY_MAP_QUEST_MARK_STROKE_WIDTH}
          strokeLinejoin="miter"
        />
      ) : null}
    </G>
  );
});
