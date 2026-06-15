// ============================================================
// 아크파이어 온라인 - 갤럭시맵 (react-native-svg)
// ============================================================

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  useWindowDimensions, Animated as RNAnimated, Easing,
} from 'react-native';
import Svg, { Line, Circle, G, Text as SvgText } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDecay,
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated';
import { router, useFocusEffect } from 'expo-router';
import { useSafeRouterBack } from '../../src/navigation/useSafeRouterBack';
import { COLORS, FONTS, SPACING, LAYOUT, ZONE_COLORS, ZONE_LABELS } from '../../src/utils/theme';
import { showArcAlert } from '../../src/utils/showArcAlert';
import { isPlayerShipCombatCapable } from '../../src/game/playerSurvivalPod';
import { ArcButton } from '../../src/ui/overlay/ArcButton';
import { QuestHUD } from '../../src/components/QuestHUD';
import { StageLoadingOverlay } from '../../src/components/StageLoadingOverlay';
import { StageShell } from '../../src/stages/StageShell';
import {
  PLANET_MAIN_TOPBAR_BORDER_BOTTOM_PX,
  PLANET_MAIN_TOPBAR_PADDING_HORIZONTAL,
  PLANET_MAIN_TOPBAR_PADDING_VERTICAL,
} from '../../src/stages/planetMainStageLayout';
import { usePlayerStore } from '../../src/store/playerStore';
import { useWorldStore } from '../../src/store/worldStore';
import { useMissionStore } from '../../src/store/missionStore';
import { useClanWarFoundationStore } from '../../src/store/clanWarFoundationStore';
import { resolveTempClanColor } from '../../src/clanWar/tempClanColors';
import {
  EXPANSION_GATEWAYS_PER_DIRECTION,
  GAMEPLAY_SYSTEM_IDS,
  LEGACY_VISIBLE_TOTAL_SYSTEMS,
  isExpansionGatewayOrdinal,
  parseSynthOrdinal,
} from '../../src/data/galaxy100';
import { StarSystem } from '../../src/types';
import { countGoodInInventory, normalizeInventorySlots, removeGoodFromInventorySlots } from '../../src/game/playerInventory';
import { useStageMemory } from '../../src/hooks/useStageMemory';
import { useStageFirstFrameReady } from '../../src/navigation/useStageFirstFrameReady';
import { releaseGalaxyMapStageMemory } from '../../src/game/stageMemoryRelease';
import { buildCsvStaticIndexesFull } from '../../src/game/buildCsvStaticIndexes';

const NODE_R = LAYOUT.map_node_radius;
const NODE_R_CURRENT = LAYOUT.map_node_radius_start;
/** 은하 좌표 1단위 = 뷰포트 한 변 픽셀(기존 맵과 동일 스케일). 라벨/노드 여백만 픽셀로 추가 */
const MAP_PAD_PX = 44;
const NODE_HIT_R = 28;
const MAP_PAN_MIN_DISTANCE_PX = 8;
const MAP_PAN_DECELERATION = 0.992;
/** 루트 간 이동 시간(임시 고정) */
const SHIP_TRANSIT_DURATION_MS = 3000;
const DEFERRED_TILE_STEP_MS = 120;
/** 출발 직후 replace — 맵 onLayout·첫 rAF 전까지 LOADING 유지(시설 서브스테이지와 동일 패턴) */
const GALAXY_MAP_LOADING_MIN_MS = 520;
type DeferredDirection = 'north' | 'east' | 'south' | 'west';
const ROUTE_LABEL_META: Record<DeferredDirection, { text: string; color: string }> = {
  north: { text: '북부항로', color: '#7CC7FF' },
  east: { text: '동부항로', color: '#9CE47A' },
  south: { text: '남부항로', color: '#FFC97A' },
  west: { text: '서부항로', color: '#D5A1FF' },
};

export default function WorldMapScreen() {
  const { width } = useWindowDimensions();
  const player = usePlayerStore((s) => s.player);
  const moveToSystem = usePlayerStore((s) => s.moveToSystem);
  const landOnPlanet = usePlayerStore((s) => s.landOnPlanet);
  const persist = usePlayerStore((s) => s.persist);
  const { systems, selectedSystemId, selectSystem, markVisited, visitedSystemIds } = useWorldStore();
  const unlockedSystemIds = useWorldStore((s) => s.unlockedSystemIds);
  const getActiveMission = useMissionStore((s) => s.getActiveMission);
  const completeObjective = useMissionStore((s) => s.completeObjective);
  const safeMenuBack = useSafeRouterBack({ fallbackReplace: '/(game)/planet' });

  const [showPanel, setShowPanel] = useState(false);
  const [shipTransit, setShipTransit] = useState<{
    from: { x: number; y: number };
    to: { x: number; y: number };
  } | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const moveProgress = React.useRef(new RNAnimated.Value(0)).current;
  const isMountedRef = useRef(true);
  const isFocusedRef = useRef(false);
  const transitAnimRef = useRef<RNAnimated.CompositeAnimation | null>(null);
  const transitFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollX = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const savedScrollX = useSharedValue(0);
  const savedScrollY = useSharedValue(0);
  const maxScrollX = useSharedValue(0);
  const maxScrollY = useSharedValue(0);
  /** 진입·currentSystemId·뷰포트 크기 변경 시 1회만 중앙 정렬 — 노드 탭·패널과 무관 */
  const autoScrollKeyRef = useRef('');

  useStageMemory(
    'galaxy_map',
    () => {
      buildCsvStaticIndexesFull();
    },
    () => {
      if (transitAnimRef.current) {
        transitAnimRef.current.stop();
        transitAnimRef.current = null;
      }
      if (transitFallbackTimerRef.current) {
        clearTimeout(transitFallbackTimerRef.current);
        transitFallbackTimerRef.current = null;
      }
      releaseGalaxyMapStageMemory();
    },
  );

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (transitAnimRef.current) {
        transitAnimRef.current.stop();
        transitAnimRef.current = null;
      }
      if (transitFallbackTimerRef.current) {
        clearTimeout(transitFallbackTimerRef.current);
        transitFallbackTimerRef.current = null;
      }
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true;
      return () => {
        isFocusedRef.current = false;
        if (transitAnimRef.current) {
          transitAnimRef.current.stop();
          transitAnimRef.current = null;
        }
        if (transitFallbackTimerRef.current) {
          clearTimeout(transitFallbackTimerRef.current);
          transitFallbackTimerRef.current = null;
        }
        // 화면 이탈 시 이동 잠금/잔상 즉시 해제 (재진입 후 클릭 불가 방지)
        setIsMoving(false);
        setShipTransit(null);
        moveProgress.setValue(0);
      };
    }, [moveProgress]),
  );

  const PANEL_H = 148;
  const [mapLayout, setMapLayout] = useState({ w: width, h: 1 });
  const stageFrameReady = useStageFirstFrameReady();
  const [galaxyLoadingMinHold, setGalaxyLoadingMinHold] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setGalaxyLoadingMinHold(false);
      const t = setTimeout(() => setGalaxyLoadingMinHold(true), GALAXY_MAP_LOADING_MIN_MS);
      return () => {
        clearTimeout(t);
        setGalaxyLoadingMinHold(false);
      };
    }, []),
  );

  const mapAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -scrollX.value }, { translateY: -scrollY.value }],
  }));

  const systemsList = useMemo(() => Object.values(systems), [systems]);
  const legacySynthVisibleCount = useMemo(
    () => Math.max(0, LEGACY_VISIBLE_TOTAL_SYSTEMS - GAMEPLAY_SYSTEM_IDS.size),
    [],
  );
  const isLegacyVisibleSynth = useCallback((id: string) => {
    const ord = parseSynthOrdinal(id);
    return ord !== null && ord <= legacySynthVisibleCount;
  }, [legacySynthVisibleCount]);
  const isExpansionGatewaySynth = useCallback((id: string) => {
    const ord = parseSynthOrdinal(id);
    if (ord === null) return false;
    return isExpansionGatewayOrdinal(ord, legacySynthVisibleCount, EXPANSION_GATEWAYS_PER_DIRECTION);
  }, [legacySynthVisibleCount]);
  const visibleSystemsList = useMemo(
    () => systemsList.filter((s) => {
      if (!s.id.startsWith('synth_')) return true;
      if (isLegacyVisibleSynth(s.id)) return true;
      if (isExpansionGatewaySynth(s.id)) return true;
      return unlockedSystemIds.includes(s.id);
    }),
    [systemsList, isLegacyVisibleSynth, isExpansionGatewaySynth, unlockedSystemIds],
  );
  const hiddenUndiscoveredSystems = useMemo(
    () => systemsList.filter((s) =>
      s.id.startsWith('synth_') &&
      !isLegacyVisibleSynth(s.id) &&
      !isExpansionGatewaySynth(s.id) &&
      !unlockedSystemIds.includes(s.id)),
    [systemsList, isLegacyVisibleSynth, isExpansionGatewaySynth, unlockedSystemIds],
  );
  const visibleCenter = useMemo(() => {
    if (!visibleSystemsList.length) return { x: 0.5, y: 0.5 };
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const s of visibleSystemsList) {
      minX = Math.min(minX, s.position.x);
      minY = Math.min(minY, s.position.y);
      maxX = Math.max(maxX, s.position.x);
      maxY = Math.max(maxY, s.position.y);
    }
    return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
  }, [visibleSystemsList]);
  const hiddenUndiscoveredByDirection = useMemo(() => {
    const out: Record<DeferredDirection, StarSystem[]> = { north: [], east: [], south: [], west: [] };
    const cx = visibleCenter.x;
    const cy = visibleCenter.y;
    for (const sys of hiddenUndiscoveredSystems) {
      const dx = sys.position.x - cx;
      const dy = sys.position.y - cy;
      const dir: DeferredDirection = Math.abs(dx) >= Math.abs(dy)
        ? (dx >= 0 ? 'east' : 'west')
        : (dy >= 0 ? 'south' : 'north');
      out[dir].push(sys);
    }
    return out;
  }, [hiddenUndiscoveredSystems, visibleCenter.x, visibleCenter.y]);
  const triggerSystemIdsByDirection = useMemo(() => {
    const cx = visibleCenter.x;
    const cy = visibleCenter.y;
    const visibleCandidates = visibleSystemsList;
    const score = (p: { x: number; y: number }, dir: DeferredDirection) => {
      const dx = p.x - cx;
      const dy = p.y - cy;
      if (dir === 'north') return -dy;
      if (dir === 'south') return dy;
      if (dir === 'east') return dx;
      return -dx;
    };
    const pickTop3 = (dir: DeferredDirection) =>
      visibleCandidates
        .slice()
        .sort((a, b) => score(b.position, dir) - score(a.position, dir))
        .slice(0, 3)
        .map((s) => s.id);
    return {
      north: pickTop3('north'),
      east: pickTop3('east'),
      south: pickTop3('south'),
      west: pickTop3('west'),
    } as Record<DeferredDirection, string[]>;
  }, [visibleSystemsList, visibleCenter.x, visibleCenter.y]);
  const unlockedSet = useMemo(() => new Set(unlockedSystemIds), [unlockedSystemIds]);
  const activeDeferredDirections = useMemo(() => {
    const currentId = player?.currentSystemId ?? null;
    const isTriggered = (dir: DeferredDirection) => triggerSystemIdsByDirection[dir].some((id) =>
      id === currentId || unlockedSet.has(id));
    return {
      north: isTriggered('north'),
      east: isTriggered('east'),
      south: isTriggered('south'),
      west: isTriggered('west'),
    } as Record<DeferredDirection, boolean>;
  }, [player?.currentSystemId, triggerSystemIdsByDirection, unlockedSet]);
  const deferredTileCount = hiddenUndiscoveredSystems.length > 700 ? 8 : 4;
  const [loadedDeferredTileCount, setLoadedDeferredTileCount] = useState(1);
  useEffect(() => {
    setLoadedDeferredTileCount(1);
  }, [deferredTileCount, hiddenUndiscoveredSystems.length]);
  useEffect(() => {
    if (loadedDeferredTileCount >= deferredTileCount) return;
    const t = setTimeout(() => {
      setLoadedDeferredTileCount((prev) => Math.min(prev + 1, deferredTileCount));
    }, DEFERRED_TILE_STEP_MS);
    return () => clearTimeout(t);
  }, [loadedDeferredTileCount, deferredTileCount]);
  const galaxyBounds = useMemo(() => {
    const list = visibleSystemsList;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const s of list) {
      minX = Math.min(minX, s.position.x);
      minY = Math.min(minY, s.position.y);
      maxX = Math.max(maxX, s.position.x);
      maxY = Math.max(maxY, s.position.y);
    }
    const eps = 0.001;
    if (!list.length) {
      return { minX: 0, minY: 0, maxX: 1, maxY: 1 };
    }
    if (maxX - minX < eps) {
      minX -= eps;
      maxX += eps;
    }
    if (maxY - minY < eps) {
      minY -= eps;
      maxY += eps;
    }
    return { minX, minY, maxX, maxY };
  }, [visibleSystemsList]);

  const toScreen = useCallback(
    (pos: { x: number; y: number }) => ({
      x: (pos.x - galaxyBounds.minX) * mapLayout.w + MAP_PAD_PX,
      y: (pos.y - galaxyBounds.minY) * mapLayout.h + MAP_PAD_PX,
    }),
    [galaxyBounds.minX, galaxyBounds.minY, mapLayout.w, mapLayout.h],
  );
  const routeLabelAnchors = useMemo(() => {
    const out: Array<{ id: DeferredDirection; x: number; y: number; text: string; color: string }> = [];
    const directions: DeferredDirection[] = ['north', 'east', 'south', 'west'];
    for (const dir of directions) {
      const ids = triggerSystemIdsByDirection[dir];
      if (!ids?.length) continue;
      let sx = 0;
      let sy = 0;
      let n = 0;
      for (const id of ids) {
        const sys = systems[id];
        if (!sys) continue;
        const p = toScreen(sys.position);
        sx += p.x;
        sy += p.y;
        n += 1;
      }
      if (n === 0) continue;
      const meta = ROUTE_LABEL_META[dir];
      out.push({
        id: dir,
        x: sx / n,
        y: sy / n,
        text: meta.text,
        color: meta.color,
      });
    }
    return out;
  }, [systems, toScreen, triggerSystemIdsByDirection]);

  const mapContentSize = useMemo(() => {
    const spanX = Math.max(galaxyBounds.maxX - galaxyBounds.minX, 0.001);
    const spanY = Math.max(galaxyBounds.maxY - galaxyBounds.minY, 0.001);
    /** Android Canvas/SVG 비정상 크기 시 네이티브 크래시 방지 */
    const clampDim = (v: number) => {
      if (!Number.isFinite(v) || v <= 0) return 1;
      return Math.min(8192, Math.max(1, v));
    };
    return {
      cw: clampDim(spanX * mapLayout.w + MAP_PAD_PX * 2),
      ch: clampDim(spanY * mapLayout.h + MAP_PAD_PX * 2),
    };
  }, [galaxyBounds, mapLayout.w, mapLayout.h]);

  const mapMetricsReady = useMemo(() => mapLayout.w > 0 && mapLayout.h > 1, [mapLayout.h, mapLayout.w]);
  const galaxyMapStageReady = mapMetricsReady && stageFrameReady && galaxyLoadingMinHold;

  const computeScrollTargetForSystem = useCallback(
    (systemId: string): { x: number; y: number } | null => {
      const cur = systems[systemId];
      if (!cur) return null;
      const posX = (cur.position.x - galaxyBounds.minX) * mapLayout.w + MAP_PAD_PX;
      const posY = (cur.position.y - galaxyBounds.minY) * mapLayout.h + MAP_PAD_PX;
      const vx = mapLayout.w;
      const vy = mapLayout.h;
      const maxSX = Math.max(0, mapContentSize.cw - vx);
      const maxSY = Math.max(0, mapContentSize.ch - vy);
      return {
        x: Math.max(0, Math.min(posX - vx / 2, maxSX)),
        y: Math.max(0, Math.min(posY - vy / 2, maxSY)),
      };
    },
    [
      systems,
      galaxyBounds.minX,
      galaxyBounds.minY,
      mapLayout.w,
      mapLayout.h,
      mapContentSize.cw,
      mapContentSize.ch,
    ],
  );

  // 진입·현재 성계·뷰포트 크기 변경 시 1회만 중앙 정렬 — 노드 탭·패널·재포커스는 스크롤 유지
  useEffect(() => {
    if (!mapMetricsReady || !player) return;
    const systemId = player.currentSystemId;
    const key = `${systemId}|${mapLayout.w}|${mapLayout.h}|${mapContentSize.cw}|${mapContentSize.ch}`;
    if (autoScrollKeyRef.current === key) return;
    autoScrollKeyRef.current = key;

    const maxSX = Math.max(0, mapContentSize.cw - mapLayout.w);
    const maxSY = Math.max(0, mapContentSize.ch - mapLayout.h);
    maxScrollX.value = maxSX;
    maxScrollY.value = maxSY;

    const target = computeScrollTargetForSystem(systemId);
    if (target) {
      cancelAnimation(scrollX);
      cancelAnimation(scrollY);
      scrollX.value = target.x;
      scrollY.value = target.y;
      savedScrollX.value = target.x;
      savedScrollY.value = target.y;
    }
  }, [
    mapMetricsReady,
    player?.currentSystemId,
    mapLayout.w,
    mapLayout.h,
    mapContentSize.cw,
    mapContentSize.ch,
    computeScrollTargetForSystem,
    maxScrollX,
    maxScrollY,
    scrollX,
    scrollY,
    savedScrollX,
    savedScrollY,
  ]);

  useEffect(() => {
    if (!mapMetricsReady) return;
    maxScrollX.value = Math.max(0, mapContentSize.cw - mapLayout.w);
    maxScrollY.value = Math.max(0, mapContentSize.ch - mapLayout.h);
    if (scrollX.value > maxScrollX.value) scrollX.value = maxScrollX.value;
    if (scrollY.value > maxScrollY.value) scrollY.value = maxScrollY.value;
  }, [
    mapMetricsReady,
    mapContentSize.cw,
    mapContentSize.ch,
    mapLayout.w,
    mapLayout.h,
    maxScrollX,
    maxScrollY,
    scrollX,
    scrollY,
  ]);

  // 동/서/남/북 트리거 성계 도달 시, 해당 방향 미발견 성계를 분할 로딩 준비한다.
  useEffect(() => {
    if (!hiddenUndiscoveredSystems.length) return;
    const activeTiles = Math.max(1, loadedDeferredTileCount);
    const dirs: DeferredDirection[] = ['north', 'east', 'south', 'west'];
    for (const dir of dirs) {
      if (!activeDeferredDirections[dir]) continue;
      const bucket = hiddenUndiscoveredByDirection[dir];
      if (!bucket?.length) continue;
      const sliceSize = Math.max(1, Math.ceil(bucket.length / activeTiles));
      const loadedCount = Math.min(bucket.length, sliceSize * activeTiles);
      for (let i = 0; i < loadedCount; i += 1) {
        const sys = bucket[i];
        if (!sys) continue;
        // reserved: hidden undiscovered prewarm by directional trigger
      }
    }
  }, [hiddenUndiscoveredSystems, hiddenUndiscoveredByDirection, deferredTileCount, loadedDeferredTileCount, activeDeferredDirections]);

  const selectedSystem = selectedSystemId ? systems[selectedSystemId] : null;
  const planetHolds = useClanWarFoundationStore((s) => s.planetHolds);
  const clanOwnerColorBySystemId = useMemo(() => {
    const out: Record<string, string | undefined> = {};
    for (const sys of visibleSystemsList) {
      const p0 = sys.planets[0];
      if (!p0) continue;
      const hold = planetHolds[p0.id];
      if (!hold || hold.kind === 'neutral') continue;
      out[sys.id] = resolveTempClanColor(hold.occupierClanId);
    }
    return out;
  }, [visibleSystemsList, planetHolds]);

  const panelPrimaryPlanetClanLine = useClanWarFoundationStore(
    useCallback(
      (s) => {
        const p0 = selectedSystem?.planets[0];
        if (!p0) return null;
        const h = s.planetHolds[p0.id];
        if (!h || h.kind === 'neutral') return null;
        const nm = s.clans[h.occupierClanId]?.displayName ?? h.occupierClanId;
        if (h.kind === 'player_home') return `주 행성 거점 · ${nm}`;
        if (h.occupierClanId.startsWith('ai_clan_')) return `AI 클랜 기지 · ${nm}`;
        return `점유 클랜 · ${nm}`;
      },
      [selectedSystem?.planets[0]?.id],
    ),
  );
  const currentSystem = player ? systems[player.currentSystemId] : null;
  const galaxyCurrent = player ? systems[player.currentSystemId] : undefined;
  const reachableIds =
    galaxyCurrent?.connections.filter((id) => unlockedSet.has(id)) ?? [];

  const handleNodeTap = useCallback((systemId: string) => {
    if (isMoving) return;
    selectSystem(systemId);
    setShowPanel(true);
  }, [selectSystem, isMoving]);

  const touchTargets = useMemo(
    () =>
      visibleSystemsList.map((sys) => {
        const pos = toScreen(sys.position);
        return { id: sys.id, x: pos.x, y: pos.y };
      }),
    [visibleSystemsList, toScreen],
  );

  const isMovingRef = useRef(isMoving);
  isMovingRef.current = isMoving;
  const touchTargetsRef = useRef(touchTargets);
  touchTargetsRef.current = touchTargets;
  const handleNodeTapRef = useRef(handleNodeTap);
  handleNodeTapRef.current = handleNodeTap;

  const handleMapTapAt = useCallback((viewportX: number, viewportY: number, sx: number, sy: number) => {
    if (isMovingRef.current) return;
    const cx = viewportX + sx;
    const cy = viewportY + sy;
    let bestId: string | null = null;
    let bestDist = NODE_HIT_R + 1;
    for (const t of touchTargetsRef.current) {
      const dist = Math.hypot(t.x - cx, t.y - cy);
      if (dist <= NODE_HIT_R && dist < bestDist) {
        bestDist = dist;
        bestId = t.id;
      }
    }
    if (bestId) handleNodeTapRef.current(bestId);
  }, []);

  const handleMapTapAtRef = useRef(handleMapTapAt);
  handleMapTapAtRef.current = handleMapTapAt;

  const mapGesture = useMemo(() => {
    const tap = Gesture.Tap()
      .enabled(!isMoving)
      .maxDuration(250)
      .maxDistance(12)
      .onEnd((e) => {
        'worklet';
        runOnJS(handleMapTapAtRef.current)(e.x, e.y, scrollX.value, scrollY.value);
      });

    const pan = Gesture.Pan()
      .enabled(!isMoving)
      .minDistance(MAP_PAN_MIN_DISTANCE_PX)
      .onBegin(() => {
        'worklet';
        cancelAnimation(scrollX);
        cancelAnimation(scrollY);
        savedScrollX.value = scrollX.value;
        savedScrollY.value = scrollY.value;
      })
      .onUpdate((e) => {
        'worklet';
        scrollX.value = Math.max(
          0,
          Math.min(savedScrollX.value - e.translationX, maxScrollX.value),
        );
        scrollY.value = Math.max(
          0,
          Math.min(savedScrollY.value - e.translationY, maxScrollY.value),
        );
      })
      .onEnd((e) => {
        'worklet';
        scrollX.value = withDecay({
          velocity: -e.velocityX,
          clamp: [0, maxScrollX.value],
          deceleration: MAP_PAN_DECELERATION,
        });
        scrollY.value = withDecay({
          velocity: -e.velocityY,
          clamp: [0, maxScrollY.value],
          deceleration: MAP_PAN_DECELERATION,
        });
      });

    return Gesture.Exclusive(tap, pan);
  }, [isMoving, scrollX, scrollY, savedScrollX, savedScrollY, maxScrollX, maxScrollY]);

  const doMove = useCallback(
    async (targetSystem: StarSystem) => {
      if (!player) return;
      if (!isPlayerShipCombatCapable(player.ship)) {
        showArcAlert(
          '생존포드',
          '전함이 격침된 상태입니다. 거점 조선소에서 전함을 재구매·탑승한 뒤 이동할 수 있습니다.',
        );
        return;
      }
      if (!mapMetricsReady) return;
      const fromSystem = systems[player.currentSystemId];
      if (!fromSystem) return;

      const from = toScreen(fromSystem.position);
      const to = toScreen(targetSystem.position);

      setIsMoving(true);
      setShipTransit({ from, to });
      moveProgress.stopAnimation();
      moveProgress.setValue(0);
      setShowPanel(false);
      selectSystem(null);

      let finished = false;
      try {
        const anim = RNAnimated.timing(moveProgress, {
          toValue: 1,
          duration: SHIP_TRANSIT_DURATION_MS,
          easing: Easing.linear,
          useNativeDriver: false,
        });
        transitAnimRef.current = anim;
        anim.start();
        // 콜백 누락 환경 대응: 고정 시간만큼 애니메이션을 유지한 뒤 완료 처리
        finished = await new Promise<boolean>((resolve) => {
          transitFallbackTimerRef.current = setTimeout(() => {
            transitFallbackTimerRef.current = null;
            resolve(true);
          }, SHIP_TRANSIT_DURATION_MS + 40);
        });
      } finally {
        transitAnimRef.current = null;
        if (transitFallbackTimerRef.current) {
          clearTimeout(transitFallbackTimerRef.current);
          transitFallbackTimerRef.current = null;
        }
        // 어떤 경로로든 이동 잠금이 남지 않게 항상 해제
        if (isMountedRef.current) {
          setShipTransit(null);
          setIsMoving(false);
        }
      }

      if (!finished || !isMountedRef.current || !isFocusedRef.current) return;

      moveToSystem(targetSystem.id);
      markVisited(targetSystem.id);

      const active = getActiveMission();
      if (active) {
        const buyObjectives = active.mission.objectives.filter((obj) => obj.type === 'buy_goods');
        const pendingBuyObjectives = buyObjectives.filter((obj) => !active.progress.objectives[obj.id]);

        active.mission.objectives.forEach((obj) => {
          if (
            obj.type === 'reach_system' &&
            obj.targetId === targetSystem.id &&
            !active.progress.objectives[obj.id]
          ) {
            // 배달형 미션은 구매 조건 충족 + 화물 보유 확인 후 도착 완료 처리
            if (pendingBuyObjectives.length > 0) return;

            if (buyObjectives.length > 0) {
              let nextSlots = normalizeInventorySlots(player.inventorySlots);
              let canDeliver = true;

              buyObjectives.forEach((buyObj) => {
                const required = buyObj.quantity ?? 1;
                const currentQty = countGoodInInventory(nextSlots, buyObj.targetId);
                if (currentQty < required) {
                  canDeliver = false;
                  return;
                }
                const removed = removeGoodFromInventorySlots(nextSlots, buyObj.targetId, required);
                if (!removed) {
                  canDeliver = false;
                  return;
                }
                nextSlots = removed;
              });

              if (!canDeliver) {
                showArcAlert('배달 실패', '도착했지만 배달 화물이 부족합니다. 화물을 다시 준비하세요.');
                return;
              }

              usePlayerStore.getState().setPlayer({ ...player, inventorySlots: nextSlots });
            }

            completeObjective(active.mission.id, obj.id);
          }
        });
      }

      await persist();

      const encounterChance =
        targetSystem.zone === 'pvp' ? 0.7 : targetSystem.zone === 'neutral' ? 0.3 : 0.1;

      if (Math.random() < encounterChance && isPlayerShipCombatCapable(player.ship)) {
        selectSystem(targetSystem.id);
        // finally 블록에서 transit·타이머 정리 완료 — Combat replace (`2.1.memory.md` §4-2)
        router.replace('/(game)/combat');
      } else {
        selectSystem(targetSystem.id);
        setShowPanel(true);
      }
      // 도착 후 자동 착륙/행성 화면 이동 없음 — [행성 착륙]으로만 행성 화면 진입
    },
    [
      player,
      systems,
      toScreen,
      moveProgress,
      getActiveMission,
      completeObjective,
      moveToSystem,
      markVisited,
      persist,
      selectSystem,
      setShowPanel,
      mapMetricsReady,
      galaxyBounds.minX,
      galaxyBounds.minY,
    ],
  );

  const handleMove = useCallback(async () => {
    if (!selectedSystem || !player) return;
    if (isMoving) return;

    if (!isPlayerShipCombatCapable(player.ship)) {
      showArcAlert(
        '생존포드',
        '전함이 격침된 상태입니다. 거점 조선소에서 전함을 재구매·탑승한 뒤 이동할 수 있습니다.',
      );
      return;
    }

    if (selectedSystem.id === player.currentSystemId) {
      const planet = selectedSystem.planets[0];
      if (planet) {
        landOnPlanet(planet.id);
        await persist();
      }
      router.replace('/(game)/planet');
      return;
    }

    if (!reachableIds.includes(selectedSystem.id)) {
      showArcAlert('이동 불가', '인접한 성계로만 이동할 수 있습니다.');
      return;
    }

    if (selectedSystem.zone === 'pvp') {
      showArcAlert(
        '⚠ PvP 구역',
        '이 구역에서는 다른 파일럿의 공격을 받을 수 있습니다.\n계속하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          { text: '진입', onPress: () => doMove(selectedSystem) },
        ],
      );
    } else {
      doMove(selectedSystem);
    }
  }, [selectedSystem, player, reachableIds, doMove, landOnPlanet, persist, isMoving]);

  if (!player) return null;

  return (
    <StageShell routeName="worldmap" background="none" edges={['bottom']}>
      <View style={styles.rootColumn}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={safeMenuBack}
          style={styles.menuBtn}
          accessibilityLabel="메뉴"
        >
          <Text style={styles.menuText}>☰ 메뉴</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>은하계 지도</Text>
        <Text style={styles.headerSub}>{currentSystem?.name ?? ''}</Text>
      </View>

      <QuestHUD />

      <View
        style={styles.mapArea}
        onLayout={(e) => {
          const { width: w, height: h } = e.nativeEvent.layout;
          if (w <= 0 || h <= 0) return;
          setMapLayout((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
        }}
      >
        {mapMetricsReady ? (
          <GestureDetector gesture={mapGesture}>
            <View style={[styles.mapViewport, { width: mapLayout.w, height: mapLayout.h }]}>
              <Animated.View
                style={[
                  {
                    width: mapContentSize.cw,
                    height: mapContentSize.ch,
                  },
                  mapAnimatedStyle,
                ]}
              >
                <Svg
                  width={mapContentSize.cw}
                  height={mapContentSize.ch}
                  pointerEvents="none"
                >
                  <MemoGalaxyMapSvg
                    systems={visibleSystemsList}
                    systemById={systems}
                    currentId={player.currentSystemId}
                    selectedId={selectedSystemId ?? ''}
                    visitedIds={visitedSystemIds}
                    reachableIds={reachableIds}
                    unlockedIds={unlockedSystemIds}
                    clanOwnerColorBySystemId={clanOwnerColorBySystemId}
                    toScreen={toScreen}
                  />
                </Svg>
                <View style={[StyleSheet.absoluteFillObject, styles.routeLabelOverlay]} pointerEvents="none">
                  {routeLabelAnchors.map((label) => (
                    <Text
                      key={label.id}
                      style={[
                        styles.routeLabelText,
                        {
                          left: label.x,
                          top: label.y,
                          color: label.color,
                        },
                      ]}
                    >
                      {label.text}
                    </Text>
                  ))}
                </View>

                {shipTransit && (
                  <RNAnimated.View
                    pointerEvents="none"
                    style={[
                      styles.shipTransit,
                      {
                        left: shipTransit.from.x,
                        top: shipTransit.from.y,
                        transform: [
                          {
                            translateX: moveProgress.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, shipTransit.to.x - shipTransit.from.x],
                            }),
                          },
                          {
                            translateY: moveProgress.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, shipTransit.to.y - shipTransit.from.y],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <Text style={styles.shipTransitIcon}>▼</Text>
                  </RNAnimated.View>
                )}
              </Animated.View>
            </View>
          </GestureDetector>
        ) : null}
        <StageLoadingOverlay visible={!galaxyMapStageReady} overlayId="stage-loading-worldmap" />
      </View>

      {showPanel && selectedSystem ? (
        <View style={[styles.panel, { height: PANEL_H }]}>
          <View style={styles.panelHeader}>
            <View>
              <Text style={styles.panelSystemName}>{selectedSystem.name}</Text>
              <Text style={[styles.panelZone, { color: ZONE_COLORS[selectedSystem.zone] ?? COLORS.ink_mid }]}>
                {ZONE_LABELS[selectedSystem.zone]} · 위험도 Lv.{selectedSystem.enemyLevel}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setShowPanel(false);
                selectSystem(null);
              }}
            >
              <Text style={styles.panelClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.panelDesc} numberOfLines={2}>
            {selectedSystem.description}
          </Text>
          {panelPrimaryPlanetClanLine ? (
            <Text style={styles.panelClanLine} numberOfLines={2}>
              {panelPrimaryPlanetClanLine}
            </Text>
          ) : null}
          <View style={styles.panelActions}>
            <Text style={styles.panelReachable}>
              {selectedSystem.id === player.currentSystemId
                ? '[ 현재 위치 ]'
                : reachableIds.includes(selectedSystem.id)
                  ? '✓ 이동 가능'
                  : '✗ 직접 이동 불가'}
            </Text>
            <ArcButton
              label={
                isMoving
                  ? '[ 이동중... ]'
                  : selectedSystem.id === player.currentSystemId
                    ? '[ 행성 착륙 ]'
                    : '[ 이동 ]'
              }
              variant="cta"
              onPress={handleMove}
              disabled={
                isMoving ||
                (!reachableIds.includes(selectedSystem.id) &&
                  selectedSystem.id !== player.currentSystemId)
              }
            />
          </View>
        </View>
      ) : (
        <View style={[styles.panel, { height: PANEL_H, justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={styles.panelHint}>성계를 탭하여 정보를 확인하세요</Text>
        </View>
      )}
      </View>
    </StageShell>
  );
}

interface GalaxyMapSvgProps {
  systems: StarSystem[];
  systemById: Record<string, StarSystem>;
  currentId: string;
  selectedId: string;
  visitedIds: string[];
  reachableIds: string[];
  unlockedIds: string[];
  clanOwnerColorBySystemId: Record<string, string | undefined>;
  toScreen: (pos: { x: number; y: number }) => { x: number; y: number };
}

function GalaxyMapSvg({
  systems,
  systemById,
  currentId,
  selectedId,
  visitedIds,
  reachableIds,
  unlockedIds,
  clanOwnerColorBySystemId,
  toScreen,
}: GalaxyMapSvgProps) {
  const unlockedSet = new Set(unlockedIds);
  const LOCK_LINE = '#526483';
  const GAME_LINE_DIM = 'rgba(255,255,255,0.22)';
  const GAME_LINE_HI = 'rgba(255,255,255,0.85)';

  const renderedLines = new Set<string>();
  const lines: React.ReactElement[] = [];

  systems.forEach((sys) => {
    const posA = toScreen(sys.position);
    sys.connections.forEach((connId) => {
      const key = [sys.id, connId].sort().join('--');
      if (renderedLines.has(key)) return;
      renderedLines.add(key);

      const connSys = systemById[connId];
      if (!connSys) return;
      const posB = toScreen(connSys.position);

      const aPlay = unlockedSet.has(sys.id);
      const bPlay = unlockedSet.has(connId);
      const isGameplayEdge = aPlay && bPlay;

      const isReachable =
        (sys.id === currentId && reachableIds.includes(connId)) ||
        (connId === currentId && reachableIds.includes(sys.id));

      const stroke = isGameplayEdge
        ? (isReachable ? GAME_LINE_HI : GAME_LINE_DIM)
        : LOCK_LINE;
      const strokeWidth = isGameplayEdge
        ? (isReachable ? 1.75 : 1)
        : 0.9;
      const opacity = isGameplayEdge ? 1 : 0.35;

      lines.push(
        <Line
          key={key}
          x1={posA.x}
          y1={posA.y}
          x2={posB.x}
          y2={posB.y}
          stroke={stroke}
          strokeWidth={strokeWidth}
          opacity={opacity}
        />,
      );
    });
  });

  const shortName = (name: string) => (name.length > 10 ? `${name.slice(0, 9)}…` : name);

  const nodes: React.ReactElement[] = systems.map((sys) => {
    const pos = toScreen(sys.position);
    const isCurrent = sys.id === currentId;
    const isSelected = sys.id === selectedId;
    const isVisited = visitedIds.includes(sys.id);
    const isReachable = reachableIds.includes(sys.id);
    const isGameplay = unlockedSet.has(sys.id);
    const zoneColor = ZONE_COLORS[sys.zone] ?? COLORS.info;
    const clanOwnerColor = clanOwnerColorBySystemId[sys.id];
    const r = isCurrent ? NODE_R_CURRENT : NODE_R;
    const opacity = isGameplay ? (isVisited || isCurrent || isReachable ? 1 : 0.75) : 0.55;

    const label = shortName(sys.name);
    const labelFill = isGameplay ? '#FFFFFF' : '#7F93B8';

    return (
      <G key={sys.id} opacity={opacity}>
        {isSelected && (
          <Circle
            cx={pos.x}
            cy={pos.y}
            r={r + 5}
            stroke={isGameplay ? 'rgba(255,255,255,0.85)' : 'rgba(127,147,184,0.75)'}
            strokeWidth={1}
            fill="transparent"
          />
        )}
        {isGameplay ? (
          isCurrent || isVisited ? (
            <Circle cx={pos.x} cy={pos.y} r={r} fill={clanOwnerColor ?? '#FFFFFF'} />
          ) : isReachable ? (
            <G>
              <Circle
                cx={pos.x}
                cy={pos.y}
                r={r + 3}
                fill={`${(clanOwnerColor ?? zoneColor)}40`}
              />
              <Circle
                cx={pos.x}
                cy={pos.y}
                r={r}
                fill={`${(clanOwnerColor ?? zoneColor)}33`}
                stroke={clanOwnerColor ? `${clanOwnerColor}DD` : GAME_LINE_HI}
                strokeWidth={1.5}
              />
            </G>
          ) : (
            <G>
              <Circle cx={pos.x} cy={pos.y} r={r} fill={clanOwnerColor ? `${clanOwnerColor}22` : 'rgba(255,255,255,0.10)'} />
              <Circle
                cx={pos.x}
                cy={pos.y}
                r={r}
                stroke={clanOwnerColor ? `${clanOwnerColor}CC` : 'rgba(255,255,255,0.55)'}
                strokeWidth={1.25}
                fill="transparent"
              />
            </G>
          )
        ) : (
          <G>
            <Circle cx={pos.x} cy={pos.y} r={r} fill="#2B3547" />
            <Circle cx={pos.x} cy={pos.y} r={r} stroke="#526483" strokeWidth={1} fill="transparent" />
          </G>
        )}
        {isCurrent && <Circle cx={pos.x} cy={pos.y} r={3} fill={COLORS.bg_primary} />}

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

  return (
    <G>
      {lines}
      {nodes}
    </G>
  );
}

const MemoGalaxyMapSvg = React.memo(GalaxyMapSvg);

const styles = StyleSheet.create({
  rootColumn: { flex: 1 },
  mapArea: { flex: 1, position: 'relative' },
  mapViewport: { flex: 1, overflow: 'hidden' },
  routeLabelOverlay: { zIndex: 0 },
  routeLabelText: {
    position: 'absolute',
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md, // headerTitle과 동일 크기
    fontWeight: FONTS.weight.bold,
    opacity: 0.36,
    transform: [{ translateX: -30 }, { translateY: -10 }],
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PLANET_MAIN_TOPBAR_PADDING_HORIZONTAL,
    paddingVertical: PLANET_MAIN_TOPBAR_PADDING_VERTICAL,
    borderBottomWidth: PLANET_MAIN_TOPBAR_BORDER_BOTTOM_PX,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg_panel,
  },
  menuBtn: { padding: SPACING.xs },
  menuText: { fontFamily: FONTS.mono, fontSize: FONTS.size.sm, color: COLORS.ink_mid },
  headerTitle: {
    flex: 1,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    color: COLORS.ink_dark,
    textAlign: 'center',
  },
  headerSub: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_light,
    minWidth: 60,
    textAlign: 'right',
  },
  shipTransit: {
    position: 'absolute',
    width: 28,
    height: 28,
    marginLeft: -14,
    marginTop: -14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shipTransitIcon: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.lg,
    color: COLORS.info,
  },
  panel: {
    backgroundColor: COLORS.bg_panel,
    borderTopWidth: 1.5,
    borderTopColor: COLORS.border_dark,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  panelSystemName: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    color: COLORS.ink_dark,
  },
  panelZone: { fontFamily: FONTS.mono, fontSize: FONTS.size.xs, marginTop: 2 },
  panelClose: { fontFamily: FONTS.mono, fontSize: FONTS.size.md, color: COLORS.ink_light, padding: SPACING.xs },
  panelDesc: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: COLORS.ink_mid,
    lineHeight: 18,
    marginBottom: SPACING.xs,
  },
  panelClanLine: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_mid,
    lineHeight: 16,
    marginBottom: SPACING.sm,
  },
  panelActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  panelReachable: { fontFamily: FONTS.mono, fontSize: FONTS.size.sm, color: COLORS.ink_mid },
  moveBtn: {
    backgroundColor: COLORS.ink_dark,
    borderRadius: 4,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  moveBtnDisabled: { backgroundColor: COLORS.border },
  moveBtnText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    color: COLORS.bg_primary,
  },
  panelHint: { fontFamily: FONTS.mono, fontSize: FONTS.size.sm, color: COLORS.ink_faint },
});
