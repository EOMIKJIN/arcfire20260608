// ============================================================
// 아크파이어 온라인 - 갤럭시맵 (react-native-svg)
// ============================================================

import React, { useState, useCallback, useMemo, useEffect, useLayoutEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  useWindowDimensions, Animated as RNAnimated, Easing, AppState,
} from 'react-native';
import Svg from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDecay,
  cancelAnimation,
  runOnJS,
  runOnUI,
  type SharedValue,
} from 'react-native-reanimated';
import { router, useFocusEffect } from 'expo-router';
import { useT } from '../../src/i18n';
import { resolvePlanetZoneDisplayLabel } from '../../src/i18n/zoneText';
import { resolveCoreOpenStarSystem } from '../../src/world/coreOpenGameplayPlanets';
import {
  resolveStarSystemDescription,
  resolveStarSystemDisplayName,
} from '../../src/i18n/systemText';
import {
  GALAXY_MAP_UNIDENTIFIED_LABEL_FILL,
  isGalaxyMapSystemNameRevealed,
  resolveGalaxyMapSystemDisplayLabel,
} from '../../src/galaxyMap/galaxyMapUnidentifiedLabel';
import { isPlanetInfoInspected } from '../../src/world/planetInfoReveal';
import { useAppSettingsStore } from '../../src/store/appSettingsStore';
import { useLocaleRenderKey } from '../../src/hooks/useLocaleRenderKey';
import { COLORS, FONTS, SPACING, ZONE_COLORS } from '../../src/utils/theme';
import { TACTICAL_HUB as TH } from '../../src/ui/tactical/tacticalHubTokens';
import { showArcAlert } from '../../src/utils/showArcAlert';
import {
  isPlayerShipCombatCapable,
  resolvePlayerTravelBlock,
  resolveSurvivalPodDestinationBlock,
} from '../../src/game/playerSurvivalPod';
import { presentPlanetEconomyInfoOverlay } from '../../src/ui/overlay/arcOverlayStore';
import { QuestHUD } from '../../src/components/QuestHUD';
import { StageLoadingOverlay } from '../../src/components/StageLoadingOverlay';
import { StageShell } from '../../src/stages/StageShell';
import {
  PLANET_MAIN_TOPBAR_BORDER_BOTTOM_PX,
  PLANET_MAIN_TOPBAR_ICON_BORDER_RADIUS,
  PLANET_MAIN_TOPBAR_PADDING_HORIZONTAL,
  PLANET_MAIN_TOPBAR_PADDING_VERTICAL,
} from '../../src/stages/planetMainStageLayout';
import { shallow } from 'zustand/shallow';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { usePlayerStore } from '../../src/store/playerStore';
import { useWorldStore } from '../../src/store/worldStore';
import { useMissionStore } from '../../src/store/missionStore';
import { hasPrimaryActiveCombatMission } from '../../src/missions/missionActiveBundles';
import { applyReachSystemMissionObjectives } from '../../src/missions/applyReachSystemMissionObjectives';
import { tryPresentPendingMissionClearDialog } from '../../src/missions/missionPlanetHubSync';
import { resolveTransitEncounterChance } from '../../src/missions/missionCombatEncounter';
import { useTransitCombatSessionStore } from '../../src/game/transitCombat/transitCombatSession';
import { useClanWarFoundationStore } from '../../src/store/clanWarFoundationStore';
import { resolveTempClanColor } from '../../src/clanWar/tempClanColors';
import {
  resolveEffectiveMapOccupierClanId,
  resolvePlanetHubOwnershipPlate,
} from '../../src/clanWar/planetOwnershipModel';
import { resolvePlayerPlanetStayBlock } from '../../src/clanWar/planetTerritoryPlayerAccess';
import {
  clearPlanetAssaultIntent,
  markPlanetAssaultIntent,
} from '../../src/game/waveDefense/planetAssaultIntent';
import { isPlanetWaveAssaultAvailable } from '../../src/game/waveDefense/resolvePlanetWaveCombatTrigger';
import {
  EXPANSION_GATEWAYS_PER_DIRECTION,
  GAMEPLAY_SYSTEM_IDS,
  LEGACY_VISIBLE_TOTAL_SYSTEMS,
  isExpansionGatewayOrdinal,
  parseSynthOrdinal,
} from '../../src/data/galaxy100';
import { StarSystem } from '../../src/types';
import { useStageMemory } from '../../src/hooks/useStageMemory';
import { useStageFirstFrameReady } from '../../src/navigation/useStageFirstFrameReady';
import { useUiScreenShell } from '../../src/ui/process/useUiScreenShell';
import { runStageUiAfterIdle } from '../../src/navigation/stageNavGate';
import { useStageTransitionStuckWatchdog } from '../../src/navigation/stageTransitionStuckWatchdog';
import {
  registerGalaxyMapDeferredTileReset,
  registerGalaxyMapPresentationReset,
  releaseGalaxyMapStageMemoryFull,
} from '../../src/game/galaxyMapStageSession';
import {
  registerGalaxyMapScrollHandles,
  teardownGalaxyMapScrollFromJs,
} from '../../src/game/galaxyMapScrollLifecycle';
import {
  finalizeGalaxyMapSessionForExit,
  persistGalaxyMapSessionOnBackground,
} from '../../src/game/galaxyMapSessionResume';
import {
  GALAXY_MAP_DEEP_RECLAIM_EVERY_N_SOFT_TICKS,
  GALAXY_MAP_DEEP_RECLAIM_RETRY_MAX,
  GALAXY_MAP_DEEP_RECLAIM_RETRY_MS,
  GALAXY_MAP_POST_HUB_COMBAT_FOLLOWUP_MS,
  GALAXY_MAP_POST_HUB_COMBAT_SETTLE_MS,
  GALAXY_MAP_SOFT_RECLAIM_INTERVAL_MS,
  runGalaxyMapResidentDeepReclaimPass,
  runGalaxyMapSoftNativeReclaimPass,
} from '../../src/game/nativeReclaim';
import { consumeGalaxyMapIngressReclaim } from '../../src/game/nativeReclaim/galaxyMapIngressReclaim';
import { markGalaxyMapResidentActive } from '../../src/arcCore/memory';
import { markPlanetHubIngressReclaim } from '../../src/game/nativeReclaim/planetHubIngressReclaim';
import { emitMemProfileMarker } from '../../src/game/devMemoryProfileBridge';
import { ackDevMetroReloadMount, isDevMetroReloadPrepareInFlight, registerDevHotModuleDisposeGuard } from '../../src/game/devMetroReloadGuard';
import {
  resolveActivePlanetSessionAnchorId,
  resolveSinglePlanetSessionKeepIds,
} from '../../src/game/nativeReclaim/singlePlanetSessionKeep';
import {
  createWorldmapScreenSession,
  HeavyUiStageErrorPanel,
  readWorldmapSessionRevision,
  useHeavyUiDataSession,
} from '../../src/ui/heavyUiDataSession';
import { buildCsvStaticIndexesFull } from '../../src/game/buildCsvStaticIndexes';
import {
  paintGalaxyMapTerritoryVoronoiModel,
  tessellateGalaxyMapTerritoryVoronoiModel,
} from '../../src/galaxyMap/computeGalaxyMapTerritoryVoronoiModel';
import { GalaxyMapTerritoryOccupationLabelsSvg } from '../../src/galaxyMap/GalaxyMapTerritoryOccupationLabelsSvg';
import { GalaxyMapTerritoryVoronoiSvg } from '../../src/galaxyMap/GalaxyMapTerritoryVoronoiSvg';
import { GalaxyMapSystemsSvg } from '../../src/galaxyMap/GalaxyMapSystemsSvg';
import { useGalaxyMapQuestAcceptMarks } from '../../src/galaxyMap/useGalaxyMapQuestAcceptMarks';
import { GalaxyMapUndiscoveredStarlightSvg } from '../../src/galaxyMap/GalaxyMapUndiscoveredStarlightSvg';
import { buildGalaxyMapAmbientStarlightSites } from '../../src/galaxyMap/galaxyMapStarlightPaths';
import { GalaxyMapZoomControls } from '../../src/galaxyMap/GalaxyMapZoomControls';
import {
  GALAXY_MAP_ZOOM_DEFAULT_STEP,
  GALAXY_MAP_ZOOM_ENABLED,
  GALAXY_MAP_ZOOM_STEP_MAX,
  GALAXY_MAP_ZOOM_STEP_MIN,
  clampGalaxyMapContentDim,
  mapViewportTapToContent,
  resolveGalaxyMapNodeHitRadius,
  resolveGalaxyMapZoomLetterbox,
  resolveGalaxyMapZoomMaxScroll,
  resolveGalaxyMapZoomScaleAtStep,
  resolveGalaxyMapZoomScaleMax,
  resolveGalaxyMapZoomScaleMin,
  resolveGalaxyMapZoomScrollTarget,
  stepGalaxyMapZoom,
} from '../../src/galaxyMap/galaxyMapZoomLadder';
import {
  GALAXY_MAP_ZONE_LOAD_INITIAL,
  isHiddenSystemInGalaxyMapStarlightPayload,
  resolveGalaxyMapZoneLoadState,
  sameGalaxyMapZoneIdList,
} from '../../src/galaxyMap/galaxyMapZoneLoadSession';
import type { GalaxyMapZoneId } from '../../src/galaxyMap/galaxyMapZoneContract';
import { findShortestUnlockedSystemPath } from '../../src/galaxyMap/findShortestUnlockedSystemPath';
import {
  partitionVisibleSystemsByTravelFog,
  resolveGalaxyMapTravelFogRevealedIds,
  reuseGalaxyMapIdSetIfSame,
  sameGalaxyMapSystemIdSeq,
} from '../../src/galaxyMap/galaxyMapTravelFog';
import {
  isGalaxyMapStableVoronoiSiteId,
  selectGalaxyMapVoronoiSites,
} from '../../src/galaxyMap/selectGalaxyMapVoronoiSites';
import { GalaxyMapContestedZoneRingOverlay } from '../../src/galaxyMap/GalaxyMapContestedZoneRingOverlay';
import { useUnidentifiedAnomalyStore } from '../../src/store/unidentifiedAnomalyStore';
import { scheduleUnidentifiedAnomalyTestWatch } from '../../src/missions/unidentifiedAnomaly/unidentifiedAnomalyTestRotationWatch';
import { flushPendingTerritorialOccupationAlert } from '../../src/arcCore/territorial/showTerritorialOccupationChangeAlert';
import { UNIDENTIFIED_ANOMALY_RING_COLOR } from '../../src/missions/unidentifiedAnomaly/unidentifiedAnomalyTestPolicy';
import { GalaxyMapColonizeHubPulseOverlay } from '../../src/galaxyMap/GalaxyMapColonizeHubPulseOverlay';
import {
  GalaxyMapSystemActionMenu,
  MENU_ITEM_HEIGHT,
  MENU_WIDTH,
  resolveGalaxyMapMenuTap,
  resolveMenuTopLeft,
  type GalaxyMapSystemActionMenuItem,
  type GalaxyMapSystemActionMenuSide,
} from '../../src/galaxyMap/GalaxyMapSystemActionMenu';
import { useContestedZonePreviewSystemIds } from '../../src/galaxyMap/useContestedZonePreviewSystemIds';
import {
  DEFAULT_STAGE_NAV_DRAIN_MS,
  runStageNavAfterTeardown,
  useStageNavGate,
} from '../../src/navigation/stageNavGate';
import {
  canAffordGalaxyTransitFuel,
  computeGalaxyTransitFuelQuote,
} from '../../src/game/galaxyTransit/computeGalaxyTransitFuelQuote';
import {
  applyJumpBoostToTransitMs,
  playerOwnsSensorArray,
  resolveSensorFogExtraHops,
} from '../../src/game/playerOwnedSkillNavAdjust';
import { SKILL_PROC_LABEL, presentSkillProcBanner } from '../../src/game/skillProcBanner';

/** 은하 좌표 1단위 = 뷰포트 한 변 픽셀(기존 맵과 동일 스케일). 라벨/노드 여백만 픽셀로 추가 */
const MAP_PAD_PX = 44;
const NODE_HIT_R = 28;

const MAP_PAN_MIN_DISTANCE_PX = 8;
const MAP_PAN_DECELERATION = 0.992;
/** 루트 1홉당 예산(ms) — 멀티홉은 거리 비례로 합산해 끝점까지 등속 연속 이동 */
const SHIP_TRANSIT_DURATION_MS = 3000;
/** 출발 직후 replace — 강제 ms 대기 없이 2프레임 페인트 후 게이트 해제(실 readiness는 mapMetrics·stageFrame·session) */
/** worldmap → planet/combat replace 전 Reanimated performOperations drain */
const HUB_NAV_POST_TEARDOWN_DELAY_MS = DEFAULT_STAGE_NAV_DRAIN_MS;
type DeferredDirection = 'north' | 'east' | 'south' | 'west';
const ROUTE_LABEL_META: Record<DeferredDirection, { textKey: string; color: string }> = {
  north: { textKey: 'worldmap.route.north', color: '#7CC7FF' },
  east: { textKey: 'worldmap.route.east', color: '#9CE47A' },
  south: { textKey: 'worldmap.route.south', color: '#FFC97A' },
  west: { textKey: 'worldmap.route.west', color: '#D5A1FF' },
};

/** UI 스레드 전용 — JS useEffect에서 scroll SharedValue 읽기 금지 (executeSync SIGSEGV) */
function clampGalaxyMapScrollWorklet(
  scrollX: SharedValue<number>,
  scrollY: SharedValue<number>,
  savedScrollX: SharedValue<number>,
  savedScrollY: SharedValue<number>,
  maxScrollX: SharedValue<number>,
  maxScrollY: SharedValue<number>,
) {
  'worklet';
  if (scrollX.value > maxScrollX.value) {
    scrollX.value = maxScrollX.value;
    savedScrollX.value = scrollX.value;
  }
  if (scrollY.value > maxScrollY.value) {
    scrollY.value = maxScrollY.value;
    savedScrollY.value = scrollY.value;
  }
}

function applyGalaxyMapScrollTargetWorklet(
  scrollX: SharedValue<number>,
  scrollY: SharedValue<number>,
  savedScrollX: SharedValue<number>,
  savedScrollY: SharedValue<number>,
  targetX: number,
  targetY: number,
) {
  'worklet';
  cancelAnimation(scrollX);
  cancelAnimation(scrollY);
  scrollX.value = targetX;
  scrollY.value = targetY;
  savedScrollX.value = targetX;
  savedScrollY.value = targetY;
}

function runGalaxyMapScrollClampOnUi(
  scrollX: SharedValue<number>,
  scrollY: SharedValue<number>,
  savedScrollX: SharedValue<number>,
  savedScrollY: SharedValue<number>,
  maxScrollX: SharedValue<number>,
  maxScrollY: SharedValue<number>,
) {
  runOnUI(() => {
    'worklet';
    clampGalaxyMapScrollWorklet(scrollX, scrollY, savedScrollX, savedScrollY, maxScrollX, maxScrollY);
  })();
}

function resolveWorldmapReleaseAnchorPlanetId(): string | null {
  return resolveActivePlanetSessionAnchorId();
}

function resolveWorldmapKeepPlanetIds(anchorPlanetId: string | null): string[] {
  return resolveSinglePlanetSessionKeepIds(anchorPlanetId);
}

function releaseWorldmapSessionFloor(opts?: {
  reason?: 'route_blur' | 'system_change' | 'transit_combat_nav';
  previousSystemId?: string | null;
  anchorPlanetId?: string | null;
}): void {
  const anchor = opts?.anchorPlanetId ?? resolveWorldmapReleaseAnchorPlanetId();
  releaseGalaxyMapStageMemoryFull({
    reason: opts?.reason ?? 'route_blur',
    previousSystemId: opts?.previousSystemId ?? null,
    anchorPlanetId: anchor,
    keepPlanetIds: resolveWorldmapKeepPlanetIds(anchor),
  });
}

export default function WorldMapScreen() {
  const t = useT();
  const locale = useAppSettingsStore((s) => s.locale);
  // freezeOnBlur 복귀 리렌더만. StageShell key 리마운트 금지(Skia).
  useLocaleRenderKey();
  const { width } = useWindowDimensions();
  const player = useStoreWithEqualityFn(usePlayerStore, (s) => {
    const p = s.player;
    if (!p) return null;
    return {
      currentSystemId: p.currentSystemId,
      currentPlanetId: p.currentPlanetId,
      lastHubPlanetId: p.lastHubPlanetId,
      homePlanetId: p.homePlanetId,
      nickname: p.nickname,
      credits: p.credits,
      ship: p.ship,
      skills: p.skills,
    };
  }, shallow);
  const moveToSystem = usePlayerStore((s) => s.moveToSystem);
  const landOnPlanet = usePlayerStore((s) => s.landOnPlanet);
  const persist = usePlayerStore((s) => s.persist);
  const spendCredits = usePlayerStore((s) => s.spendCredits);
  const systems = useWorldStore((s) => s.systems);
  const selectedSystemId = useWorldStore((s) => s.selectedSystemId);
  const selectSystem = useWorldStore((s) => s.selectSystem);
  const markVisited = useWorldStore((s) => s.markVisited);
  const visitedSystemIds = useWorldStore((s) => s.visitedSystemIds);
  const inspectedPlanetInfoIds = useWorldStore((s) => s.inspectedPlanetInfoIds);
  const unlockedSystemIds = useWorldStore((s) => s.unlockedSystemIds);
  const synthColonizationPhaseByPlanetId = useWorldStore((s) => s.synthColonizationPhaseByPlanetId);
  const anomalyActiveSystemId = useUnidentifiedAnomalyStore((s) => s.active?.systemId ?? null);

  const [showPanel, setShowPanel] = useState(false);
  const [zoomStep, setZoomStep] = useState(GALAXY_MAP_ZOOM_DEFAULT_STEP);
  const nodeHitRRef = useRef(NODE_HIT_R);
  const [shipTransit, setShipTransit] = useState<{
    fromSystemId: string;
  } | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  /** 조기 moveToSystem 뒤 system_change floor — 연출이 끝난 뒤에만 */
  const pendingSystemChangePrevRef = useRef<string | null>(null);
  /**
   * persist await 동안 shipTransit 이 아직 null 이면 현재 마크가 목적지로 붙는다.
   * 출발 성계를 커밋보다 먼저 ref 에 고정한다(렌더는 player/shipTransit 갱신에 맞춰 읽음).
   */
  const transitPresentSystemIdRef = useRef<string | null>(null);
  /**
   * 조기 moveToSystem 직후 zustand 리렌더가 목적지 인접·경로·존로드를 바꿔
   * 출발 성계에 마크가 한 번 더 찍힌 뒤 애니가 시작되는 끊김을 막는다.
   */
  const transitVisualFreezeRef = useRef<{
    presentSystemId: string;
    reachableIds: string[];
    routePreviewSystemIds: string[];
  } | null>(null);

  const isMountedRef = useRef(true);
  const isFocusedRef = useRef(false);
  /** combat/planet replace 시 blur finalize 오작동 방지 */
  const worldmapInternalNavRef = useRef(false);
  /** 착륙·전투 진입 — GestureDetector unmount + 버튼 연타 차단 */
  const hubNavGate = useStageNavGate();

  /** 전함 마크 화면 절대좌표 — 멀티홉도 setValue(0) 없이 sequence로 끝점까지 연속 */
  const shipTransitX = React.useRef(new RNAnimated.Value(0)).current;
  const shipTransitY = React.useRef(new RNAnimated.Value(0)).current;
  const transitAnimRef = useRef<RNAnimated.CompositeAnimation | null>(null);
  const transitFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitWaitTokenRef = useRef(0);
  const abortTransitWaitRef = useRef<{
    token: number;
    resolve: (finished: boolean) => void;
  } | null>(null);
  const scrollX = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const savedScrollX = useSharedValue(0);
  const savedScrollY = useSharedValue(0);
  const maxScrollX = useSharedValue(0);
  const maxScrollY = useSharedValue(0);
  const scrollAliveSv = useSharedValue(0);
  const isMovingSv = useSharedValue(0);
  /** Pan/Tap worklet → runOnJS — 렌더 중 .current 할당 금지 (read-only ref 크래시) */
  const isMovingRef = useRef(false);
  const touchTargetsRef = useRef<{ id: string; x: number; y: number }[]>([]);
  /** 드롭다운 메뉴가 화면에 떠 있는 동안의 사각형(맵 콘텐츠 좌표) — 그 아래 성계 노드는 탭 판정에서 제외 */
  const activeMenuRectRef = useRef<{ left: number; top: number; right: number; bottom: number } | null>(null);
  const systemActionMenuItemsRef = useRef<GalaxyMapSystemActionMenuItem[]>([]);
  const lastMenuTapRef = useRef<{ ms: number; key: string } | null>(null);
  const handleMoveRef = useRef<() => void>(() => {});
  const handlePlanetInfoRef = useRef<() => void>(() => {});
  const handleCombatRef = useRef<() => void>(() => {});
  const handleCloseSystemPanelRef = useRef<() => void>(() => {});
  const handleNodeTapRef = useRef<(systemId: string) => void>(() => {});
  const handleMapTapAtRef = useRef(
    (_viewportX: number, _viewportY: number, _sx: number, _sy: number) => {},
  );
  const zoomScaleRef = useRef(1);
  const zoomLetterXRef = useRef(0);
  const zoomLetterYRef = useRef(0);
  const zoomCameraAppliedRef = useRef(false);
  /** runOnUI 스크롤 — scrollAlive=1 이전에 실행하면 executeSync SIGSEGV (장기 idle 후 출발) */
  const pendingScrollTargetRef = useRef<{ x: number; y: number } | null>(null);
  const scrollGesturesArmedRef = useRef(false);
  /** 이동중 전투 복귀 — arrival UI 1회 + scroll gate 재-arm */
  const pendingTransitCombatReturnRef = useRef(false);

  const settleTransitWait = useCallback((finished: boolean) => {
    if (transitFallbackTimerRef.current) {
      clearTimeout(transitFallbackTimerRef.current);
      transitFallbackTimerRef.current = null;
    }
    const handle = abortTransitWaitRef.current;
    abortTransitWaitRef.current = null;
    handle?.resolve(finished);
  }, []);

  const stopGalaxyMapInteractionLoops = useCallback(() => {
    scrollGesturesArmedRef.current = false;
    setMapInteractionReady(false);
    settleTransitWait(false);
    isMovingSv.value = 0;
    cancelAnimation(isMovingSv);
    teardownGalaxyMapScrollFromJs({ scrollX, scrollY, scrollAliveSv });
  }, [scrollX, scrollY, scrollAliveSv, isMovingSv, settleTransitWait]);

  const handleExitToTitle = useCallback(() => {
    showArcAlert(
      t('planet.exitGameTitle'),
      t('planet.exitGameBody'),
      [
        { text: t('planet.cancel'), style: 'cancel' },
        {
          text: t('planet.exit'),
          style: 'destructive',
          onPress: () => {
            if (!hubNavGate.tryBegin()) return;
            stopGalaxyMapInteractionLoops();
            runStageNavAfterTeardown({
              teardown: () => finalizeGalaxyMapSessionForExit({ persist: true }),
              navigate: () => router.replace('/?forceTitle=1'),
              isMounted: () => isMountedRef.current,
              onAborted: () => hubNavGate.reset(),
            });
          },
        },
      ],
    );
  }, [hubNavGate, stopGalaxyMapInteractionLoops, t]);

  const handleOpenWorldmapMenu = useCallback(() => {
    if (isMoving || hubNavGate.isLocked()) return;
    showArcAlert(
      t('worldmap.menu.modalTitle'),
      t('worldmap.menu.modalBody'),
      [
        { text: t('worldmap.menu.close'), style: 'cancel' },
        {
          text: t('worldmap.menu.exitGame'),
          style: 'destructive',
          onPress: handleExitToTitle,
        },
      ],
    );
  }, [handleExitToTitle, hubNavGate, isMoving, t]);

  /**
   * worldmap → planet/combat replace — gesture unmount → memory release → drain → navigate.
   */
  const navigateToPlanetHubAfterTeardown = useCallback((anchorPlanetId: string | null) => {
    // 이전 착륙이 isMounted=false 로 abort되면 navigateScheduled 만 남고 reset이 안 되어
    // 이후 착륙·이동이 전부 무반응(tryScheduleNavigate/tryBegin 실패)이 된다.
    if (!hubNavGate.tryScheduleNavigate()) {
      hubNavGate.reset();
      if (!hubNavGate.tryBegin() || !hubNavGate.tryScheduleNavigate()) return;
    }
    worldmapInternalNavRef.current = true;
    if (!hubNavGate.isLocked()) hubNavGate.tryBegin();

    markPlanetHubIngressReclaim({ invalidateMemoCaches: true });
    stopGalaxyMapInteractionLoops();
    if (transitAnimRef.current) {
      transitAnimRef.current.stop();
      transitAnimRef.current = null;
    }
    shipTransitX.stopAnimation();
    shipTransitY.stopAnimation();
    shipTransitX.setValue(0);
    shipTransitY.setValue(0);
    setIsMoving(false);
    transitPresentSystemIdRef.current = null;
    transitVisualFreezeRef.current = null;
    setShipTransit(null);
    setShowPanel(false);

    runStageNavAfterTeardown({
      teardown: () => releaseWorldmapSessionFloor({ reason: 'route_blur', anchorPlanetId }),
      navigate: () => router.replace('/(game)/planet'),
      isMounted: () => isMountedRef.current,
      onAborted: () => hubNavGate.reset(),
      drainMs: HUB_NAV_POST_TEARDOWN_DELAY_MS,
    });
  }, [hubNavGate, stopGalaxyMapInteractionLoops, shipTransitX, shipTransitY]);

  const navigateToCombatAfterTeardown = useCallback(() => {
    if (!hubNavGate.tryScheduleNavigate()) {
      hubNavGate.reset();
      if (!hubNavGate.tryBegin() || !hubNavGate.tryScheduleNavigate()) return;
    }
    worldmapInternalNavRef.current = true;
    if (!hubNavGate.isLocked()) hubNavGate.tryBegin();

    stopGalaxyMapInteractionLoops();
    if (transitAnimRef.current) {
      transitAnimRef.current.stop();
      transitAnimRef.current = null;
    }
    shipTransitX.stopAnimation();
    shipTransitY.stopAnimation();
    shipTransitX.setValue(0);
    shipTransitY.setValue(0);
    setIsMoving(false);
    transitPresentSystemIdRef.current = null;
    transitVisualFreezeRef.current = null;
    setShipTransit(null);
    setShowPanel(false);

    runStageNavAfterTeardown({
      teardown: () => releaseWorldmapSessionFloor({
        reason: 'transit_combat_nav',
        anchorPlanetId: resolveWorldmapReleaseAnchorPlanetId(),
      }),
      navigate: () => router.replace('/(game)/combat'),
      isMounted: () => isMountedRef.current,
      onAborted: () => hubNavGate.reset(),
      drainMs: HUB_NAV_POST_TEARDOWN_DELAY_MS,
    });
  }, [hubNavGate, stopGalaxyMapInteractionLoops, shipTransitX, shipTransitY]);

  const handleReturnToLastHub = useCallback(() => {
    if (!hubNavGate.tryBegin()) return;
    finalizeGalaxyMapSessionForExit({ persist: true });
    const anchor = usePlayerStore.getState().player?.currentPlanetId ?? null;
    navigateToPlanetHubAfterTeardown(anchor);
  }, [hubNavGate, navigateToPlanetHubAfterTeardown]);

  const runScrollTargetOnUi = useCallback((targetX: number, targetY: number) => {
    runOnUI(() => {
      'worklet';
      applyGalaxyMapScrollTargetWorklet(
        scrollX,
        scrollY,
        savedScrollX,
        savedScrollY,
        targetX,
        targetY,
      );
    })();
  }, [scrollX, scrollY, savedScrollX, savedScrollY]);

  const flushDeferredScrollUiOps = useCallback(() => {
    if (!isFocusedRef.current) return;
    const pending = pendingScrollTargetRef.current;
    if (pending) {
      // 1회 소비 — 유지하면 이후 re-arm(전투 복귀·watchdog)마다 사용자가 이동해 둔
      // 스크롤이 과거 타깃으로 되돌아간다
      pendingScrollTargetRef.current = null;
      runScrollTargetOnUi(pending.x, pending.y);
    }
    runGalaxyMapScrollClampOnUi(scrollX, scrollY, savedScrollX, savedScrollY, maxScrollX, maxScrollY);
  }, [runScrollTargetOnUi, scrollX, scrollY, savedScrollX, savedScrollY, maxScrollX, maxScrollY]);

  /** UI scroll apply → 2×rAF → scrollAlive=1 (허브 teardown·idle 직후 제스처 SIGSEGV 방지) */
  const armGalaxyMapScrollGestures = useCallback(() => {
    if (!isFocusedRef.current) return;
    scrollGesturesArmedRef.current = false;
    flushDeferredScrollUiOps();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!isFocusedRef.current) return;
        // arm 도중(onLayout 자동 중앙정렬이 flush~armed 사이에 실행) 도착한 pending 타깃
        // 재flush — 미적용 시 스크롤 (0,0) 좌상단 고정(빈 검은 지도) 회귀 (2026-07-20)
        flushDeferredScrollUiOps();
        scrollAliveSv.value = 1;
        scrollGesturesArmedRef.current = true;
        setMapInteractionReady(true);
      });
    });
  }, [flushDeferredScrollUiOps, scrollAliveSv]);

  useEffect(() => {
    isMovingSv.value = isMoving ? 1 : 0;
  }, [isMoving, isMovingSv]);

  useFocusEffect(
    useCallback(() => {
      return registerGalaxyMapScrollHandles({ scrollX, scrollY, scrollAliveSv });
    }, [scrollX, scrollY, scrollAliveSv]),
  );

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
      stopGalaxyMapInteractionLoops();
      if (worldmapInternalNavRef.current) {
        releaseWorldmapSessionFloor({
          reason: 'transit_combat_nav',
          anchorPlanetId: resolveWorldmapReleaseAnchorPlanetId(),
        });
      } else {
        releaseWorldmapSessionFloor();
      }
    },
  );

  useEffect(() => {
    // effect 재실행(Fast Refresh·deps identity 변경) 시 cleanup만 돌면 false로 고착되어
    // 이후 착륙·전투·타이틀 navigate가 전부 조용히 취소된다 (combat/continue-warp와 동일 계약)
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopGalaxyMapInteractionLoops();
      if (transitAnimRef.current) {
        transitAnimRef.current.stop();
        transitAnimRef.current = null;
      }
    };
  }, [stopGalaxyMapInteractionLoops]);

  useFocusEffect(
    useCallback(() => {
      worldmapInternalNavRef.current = false;
      hubNavGate.reset();
      isFocusedRef.current = true;
      consumeGalaxyMapIngressReclaim();
      markGalaxyMapResidentActive();
      emitMemProfileMarker({ stage: 'galaxy_map', event: 'route_focus' });
      ackDevMetroReloadMount();
      try {
        const { backfillStelliumColonizeFromInspected } = require('../../src/arcCore/colonize/tryEnqueueStelliumColonize') as typeof import('../../src/arcCore/colonize/tryEnqueueStelliumColonize');
        backfillStelliumColonizeFromInspected();
      } catch {
        /* 개척 패스 미기동 */
      }
      // Reanimated Pan worklet — scrollAlive=1 은 runOnUI 스크롤 적용·2×rAF 이후에만 (SIGSEGV 방지)
      const enableScrollTask = runStageUiAfterIdle(() => {
        requestAnimationFrame(() => {
          armGalaxyMapScrollGestures();
        });
      });
      /** combat/planet 복귀 직후 scroll gate 유실 시 1회 재-arm (Heavy UI warm 유지 전제) */
      const scrollRecoveryTimer = setTimeout(() => {
        if (!isFocusedRef.current || scrollGesturesArmedRef.current) return;
        armGalaxyMapScrollGestures();
      }, 900);
      return () => {
        clearTimeout(scrollRecoveryTimer);
        enableScrollTask.cancel();
        isFocusedRef.current = false;
        scrollGesturesArmedRef.current = false;
        setMapInteractionReady(false);
        stopGalaxyMapInteractionLoops();
        // combat/planet replace — route_blur release 시 Heavy UI abort·presentation reset →
        // 복귀 후 loading…/패널 고착(P1-2, 2026-06-23 감사). navigate 측에서 이미 teardown 한 경우도 skip.
        if (!worldmapInternalNavRef.current && !isDevMetroReloadPrepareInFlight()) {
          releaseWorldmapSessionFloor();
        }
        if (transitAnimRef.current) {
          transitAnimRef.current.stop();
          transitAnimRef.current = null;
        }
        // 화면 이탈 시 이동 잠금/잔상 즉시 해제 (재진입 후 클릭 불가 방지)
        setIsMoving(false);
        transitPresentSystemIdRef.current = null;
        transitVisualFreezeRef.current = null;
        setShipTransit(null);
        shipTransitX.setValue(0);
        shipTransitY.setValue(0);
      };
    }, [shipTransitX, shipTransitY, armGalaxyMapScrollGestures, stopGalaxyMapInteractionLoops]),
  );

  /**
   * worldmap 체류 PSS floor — 5분 soft + N회(15분) deep + 진입 settle/followup deep.
   * soft만으로는 허브 전투 GL 잔존이 안 풀림(2026-07-21·07-23 실측 GL~140·Views 555).
   * transit(isMoving) 중이면 deep을 skip하지 않고 재시도(영구 누락 방지).
   */
  useFocusEffect(
    useCallback(() => {
      let softTick = 0;
      const pendingDeepRetryTimers: ReturnType<typeof setTimeout>[] = [];

      const runDeepNow = (reason: string, reclaimHubSkia: boolean) => {
        const anchor = resolveWorldmapReleaseAnchorPlanetId();
        runGalaxyMapResidentDeepReclaimPass(
          reason,
          resolveWorldmapKeepPlanetIds(anchor),
          { reclaimHubSkia },
        );
      };

      /** isMoving이면 최대 N회 재시도 — 90s 단일 skip으로 deep이 증발하던 회귀 차단 */
      const scheduleDeepWhenIdle = (
        reason: string,
        reclaimHubSkia: boolean,
        attempt = 0,
      ) => {
        if (!isFocusedRef.current) return;
        if (!isMovingRef.current) {
          runDeepNow(reason, reclaimHubSkia);
          return;
        }
        if (attempt >= GALAXY_MAP_DEEP_RECLAIM_RETRY_MAX) {
          // 이동이 길어도 1회는 강제 — GPU layer·Fresco만이라도 걷음
          runDeepNow(`${reason}_forced`, reclaimHubSkia);
          return;
        }
        const t = setTimeout(() => {
          scheduleDeepWhenIdle(reason, reclaimHubSkia, attempt + 1);
        }, GALAXY_MAP_DEEP_RECLAIM_RETRY_MS);
        pendingDeepRetryTimers.push(t);
      };

      const intervalId = setInterval(() => {
        if (isMovingRef.current) return;
        softTick += 1;
        const anchor = resolveWorldmapReleaseAnchorPlanetId();
        const keepIds = resolveWorldmapKeepPlanetIds(anchor);
        if (softTick % GALAXY_MAP_DEEP_RECLAIM_EVERY_N_SOFT_TICKS === 0) {
          runGalaxyMapResidentDeepReclaimPass('galaxy_map_periodic_deep', keepIds, {
            reclaimHubSkia: true,
          });
          return;
        }
        runGalaxyMapSoftNativeReclaimPass('galaxy_map_periodic', keepIds);
      }, GALAXY_MAP_SOFT_RECLAIM_INTERVAL_MS);

      /** 1차 — focus 후 수 초(허브 teardown·Skia finalizer lag) */
      const settleTimer = setTimeout(() => {
        scheduleDeepWhenIdle('galaxy_map_post_ingress_settle', true);
      }, GALAXY_MAP_POST_HUB_COMBAT_SETTLE_MS);

      /** 2차 — settle 이후 Fresco/GL lag 잔여 */
      const followupTimer = setTimeout(() => {
        scheduleDeepWhenIdle('galaxy_map_post_ingress_followup', true);
      }, GALAXY_MAP_POST_HUB_COMBAT_FOLLOWUP_MS);

      return () => {
        clearInterval(intervalId);
        clearTimeout(settleTimer);
        clearTimeout(followupTimer);
        for (let i = 0; i < pendingDeepRetryTimers.length; i++) {
          clearTimeout(pendingDeepRetryTimers[i]);
        }
      };
    }, []),
  );

  /**
   * 백그라운드 — 허브 좌표 persist만(route_blur 금지).
   * 포그라운드 복귀 — 제스처·착륙 게이트 재arm(background full-release 회귀 방어).
   * blur/언마운트 정리(route_blur)는 아래 cleanup · useStageMemory onUnmount 정본.
   */
  useFocusEffect(
    useCallback(() => {
      const appSub = AppState.addEventListener('change', (next) => {
        if (next === 'background' || next === 'inactive') {
          persistGalaxyMapSessionOnBackground({ persist: true });
          return;
        }
        if (next !== 'active') return;
        if (!isFocusedRef.current) return;
        hubNavGate.reset();
        // isMoving/isMovingRef는 여기서 강제로 안 풂 — doMoveAlongPath 자체가 홉마다
        // fallback 타이머(SHIP_TRANSIT_DURATION_MS+40ms)로 항상 스스로 정착·해제된다.
        // 여기서 같이 풀면, 백그라운드 중 타이머가 스로틀돼 아직 진행 중인(진짜 stuck 아닌)
        // doMoveAlongPath 호출과 경합해 "이동 중 재입력 허용 → 동시 2회 실행"으로
        // 마크·애니메이션이 중복 재생되는 회귀가 생긴다(2026-08-02 대표님 실측: 전함 마크 이동 2회 반복).
        armGalaxyMapScrollGestures();
      });
      return () => {
        appSub.remove();
        worldmapInternalNavRef.current = false;
        // "!currentPlanetId → 마지막 허브로 강제 복귀" 안전망은 여기서 제거함 — currentPlanetId는
        // moveToSystem()이 도착 즉시(애니메이션 전) null로 세팅하므로, 성계 간 이동 성공 직후
        // "아직 어디에도 착륙 안 한 정상 상태"에서도 항상 true가 되어 매 이동마다 아르카디아로
        // 되돌리는 회귀가 있었다(2026-08-02 대표님 실측: 이동 애니메이션 후 로딩 → 출발지 원복).
        // 리로드 도중 유실 방지는 이미 doMoveAlongPath의 조기 커밋(moveToSystem+persist)이 담당.
      };
    }, [armGalaxyMapScrollGestures, hubNavGate]),
  );

  /** 애니 중 리로드로 전함 마크 도착 콜백이 스킵돼도, 커밋된 현재 성계 본명은 유지 */
  useEffect(() => {
    if (!player?.currentSystemId) return;
    if (isMoving || shipTransit) return;
    markVisited(player.currentSystemId);
  }, [player?.currentSystemId, isMoving, shipTransit, markVisited]);

  useFocusEffect(
    useCallback(() => {
      scheduleUnidentifiedAnomalyTestWatch();
      flushPendingTerritorialOccupationAlert();
    }, []),
  );

  // 점유클랜을 zone/위험도 2행에 인라인 합류 → 별도 clan 행 제거 (높이 축소)
  // 하단 텍스트·회색 배경 끝 여백(+6px) — 딱 붙음 방지
  const PANEL_H = 134;
  const [mapLayout, setMapLayout] = useState({ w: width, h: 1 });
  const stageFrameReady = useStageFirstFrameReady();
  const [galaxyLoadingMinHold, setGalaxyLoadingMinHold] = useState(false);
  /** scrollAlive=1 + runOnUI scroll 적용 후에만 SVG·gesture mount — STAGE 겹침 views 폭주 방지 */
  const [mapInteractionReady, setMapInteractionReady] = useState(false);
  const clanWarHydrated = useClanWarFoundationStore((s) => s.hydrated);
  const clanWarClans = useClanWarFoundationStore((s) => s.clans);
  /**
   * moveToSystem은 currentPlanetId=null — 성계 첫 행성으로 키를 바꾸면
   * 아르카디아↔베가 이동마다 heavyUi 재로딩·mapInteraction gate 고착(검은 화면).
   * lastHubPlanetId 앵커로 세션 키를 고정한다 (galaxyMapSessionResume·singlePlanetSessionKeep 정본).
   */
  const worldmapSessionPlanetId = useMemo(() => {
    if (!player) return null;
    return resolveActivePlanetSessionAnchorId();
  }, [player?.currentPlanetId, player?.lastHubPlanetId, player?.homePlanetId]);
  const worldmapSessionConfig = useMemo(
    () => (worldmapSessionPlanetId ? createWorldmapScreenSession(worldmapSessionPlanetId) : null),
    [worldmapSessionPlanetId],
  );
  const worldmapRevision = useMemo(() => readWorldmapSessionRevision(), [clanWarHydrated]);
  const worldmapSession = useHeavyUiDataSession(worldmapSessionConfig, worldmapRevision);
  useUiScreenShell(
    'worldmap',
    worldmapSession.phase === 'ready' && stageFrameReady && mapInteractionReady,
  );

  useFocusEffect(
    useCallback(() => {
      const transitReturn = pendingTransitCombatReturnRef.current;
      if (transitReturn) {
        setGalaxyLoadingMinHold(true);
        return () => {
          setGalaxyLoadingMinHold(false);
        };
      }
      setGalaxyLoadingMinHold(false);
      let cancelled = false;
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          if (!cancelled) setGalaxyLoadingMinHold(true);
        });
      });
      return () => {
        cancelled = true;
        cancelAnimationFrame(raf1);
        if (raf2) cancelAnimationFrame(raf2);
        setGalaxyLoadingMinHold(false);
      };
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      if (!useTransitCombatSessionStore.getState().consumeWorldmapArrivalUi()) return;
      pendingTransitCombatReturnRef.current = true;
      hubNavGate.reset();
      setIsMoving(false);
      transitPresentSystemIdRef.current = null;
      transitVisualFreezeRef.current = null;
      setShipTransit(null);
      shipTransitX.setValue(0);
      shipTransitY.setValue(0);
      isMovingSv.value = 0;
      const sysId = usePlayerStore.getState().player?.currentSystemId;
      if (!sysId) return;
      selectSystem(sysId);
      setShowPanel(true);
      if (worldmapSession.phase !== 'ready') {
        worldmapSession.retry();
      }
      requestAnimationFrame(() => {
        armGalaxyMapScrollGestures();
      });
    }, [
      armGalaxyMapScrollGestures,
      hubNavGate,
      isMovingSv,
      shipTransitX,
      shipTransitY,
      selectSystem,
      worldmapSession.phase,
      worldmapSession.retry,
    ]),
  );

  useEffect(() => {
    if (!pendingTransitCombatReturnRef.current) return;
    if (!isFocusedRef.current) return;
    if (worldmapSession.phase !== 'ready') return;
    if (scrollGesturesArmedRef.current && mapInteractionReady) {
      pendingTransitCombatReturnRef.current = false;
      return;
    }
    hubNavGate.reset();
    armGalaxyMapScrollGestures();
    pendingTransitCombatReturnRef.current = false;
  }, [
    worldmapSession.phase,
    mapInteractionReady,
    armGalaxyMapScrollGestures,
    hubNavGate,
  ]);

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
  /** 코어+레거시+관문(+해금). 존5(97)만이 아님 — 존 필터 금지(관문 16은 2/4/6/8). */
  const visibleSystemsList = useMemo(
    () => systemsList.filter((s) => {
      if (!s.id.startsWith('synth_')) return true;
      if (isLegacyVisibleSynth(s.id)) return true;
      if (isExpansionGatewaySynth(s.id)) return true;
      return unlockedSystemIds.includes(s.id);
    }),
    [systemsList, isLegacyVisibleSynth, isExpansionGatewaySynth, unlockedSystemIds],
  );
  /** 방문 ∪ 방문지 이웃. 이동 클릭의 current 커밋은 이웃을 열지 않음 — 도착 markVisited 후. */
  const travelFogHeldRef = useRef<Set<string> | null>(null);
  const travelFogRevealedIds = useMemo(() => {
    const next = resolveGalaxyMapTravelFogRevealedIds({
      visitedSystemIds,
      currentSystemId: player?.currentSystemId,
      systems,
      extraNeighborHops: resolveSensorFogExtraHops(player?.skills),
    });
    const held = reuseGalaxyMapIdSetIfSame(travelFogHeldRef.current, next);
    travelFogHeldRef.current = held;
    return held;
  }, [visitedSystemIds, player?.currentSystemId, player?.skills, systems]);
  const fogVisibleHeldRef = useRef<typeof visibleSystemsList>([]);
  const fogHiddenHeldRef = useRef<typeof visibleSystemsList>([]);
  const { fogVisibleSystemsList, fogHiddenSystemsList } = useMemo(() => {
    const part = partitionVisibleSystemsByTravelFog(visibleSystemsList, travelFogRevealedIds);
    const visible = sameGalaxyMapSystemIdSeq(fogVisibleHeldRef.current, part.visible)
      ? fogVisibleHeldRef.current
      : part.visible;
    const hidden = sameGalaxyMapSystemIdSeq(fogHiddenHeldRef.current, part.hidden)
      ? fogHiddenHeldRef.current
      : part.hidden;
    fogVisibleHeldRef.current = visible;
    fogHiddenHeldRef.current = hidden;
    return { fogVisibleSystemsList: visible, fogHiddenSystemsList: hidden };
  }, [visibleSystemsList, travelFogRevealedIds]);
  const questAcceptMarks = useGalaxyMapQuestAcceptMarks(fogVisibleSystemsList);
  const voronoiSystemsHeldRef = useRef<typeof visibleSystemsList>([]);
  const voronoiSystemsList = useMemo(() => {
    const next = selectGalaxyMapVoronoiSites(
      visibleSystemsList,
      travelFogRevealedIds,
      (id) => isGalaxyMapStableVoronoiSiteId(id, isLegacyVisibleSynth, isExpansionGatewaySynth),
    );
    const held = sameGalaxyMapSystemIdSeq(voronoiSystemsHeldRef.current, next)
      ? voronoiSystemsHeldRef.current
      : next;
    voronoiSystemsHeldRef.current = held;
    return held;
  }, [visibleSystemsList, travelFogRevealedIds, isLegacyVisibleSynth, isExpansionGatewaySynth]);
  const contestedPreviewSystemIds = useContestedZonePreviewSystemIds(true);
  const contestedVisibleSystems = useMemo(
    () =>
      fogVisibleSystemsList.filter(
        (s) => contestedPreviewSystemIds.has(s.id) && s.id !== anomalyActiveSystemId,
      ),
    [fogVisibleSystemsList, contestedPreviewSystemIds, anomalyActiveSystemId],
  );
  const anomalyVisibleSystems = useMemo(() => {
    if (!anomalyActiveSystemId) return [];
    for (let i = 0; i < fogVisibleSystemsList.length; i += 1) {
      if (fogVisibleSystemsList[i]!.id === anomalyActiveSystemId) {
        return [fogVisibleSystemsList[i]!];
      }
    }
    return [];
  }, [fogVisibleSystemsList, anomalyActiveSystemId]);
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
  const [loadedZoneIds, setLoadedZoneIds] = useState<readonly GalaxyMapZoneId[]>(
    GALAXY_MAP_ZONE_LOAD_INITIAL,
  );
  const zoneLoadInputRef = useRef<{
    currentSystemId: string | null;
    selectedSystemId: string | null;
  }>({ currentSystemId: null, selectedSystemId: null });
  zoneLoadInputRef.current = {
    currentSystemId:
      transitVisualFreezeRef.current?.presentSystemId ?? player?.currentSystemId ?? null,
    selectedSystemId: selectedSystemId ?? null,
  };
  const applyZoneLoadState = useCallback((prevLoaded: readonly GalaxyMapZoneId[]) => {
    return resolveGalaxyMapZoneLoadState({
      currentSystemId: zoneLoadInputRef.current.currentSystemId,
      selectedSystemId: zoneLoadInputRef.current.selectedSystemId,
      prevLoaded,
    }).loaded;
  }, []);
  useEffect(() => {
    const resetZonesFromCurrent = () => {
      setLoadedZoneIds((prev) => {
        const next = applyZoneLoadState(GALAXY_MAP_ZONE_LOAD_INITIAL);
        return sameGalaxyMapZoneIdList(prev, next) ? prev : next;
      });
    };
    const unregisterTiles = registerGalaxyMapDeferredTileReset(resetZonesFromCurrent);
    const unregisterPresentation = registerGalaxyMapPresentationReset(() => {
      scrollGesturesArmedRef.current = false;
      setMapInteractionReady(false);
      setShowPanel(false);
      setZoomStep(GALAXY_MAP_ZOOM_DEFAULT_STEP);
      zoomCameraAppliedRef.current = false;
      transitPresentSystemIdRef.current = null;
      transitVisualFreezeRef.current = null;
      setShipTransit(null);
      setIsMoving(false);
      shipTransitX.setValue(0);
      shipTransitY.setValue(0);
      resetZonesFromCurrent();
    });
    return () => {
      unregisterTiles();
      unregisterPresentation();
    };
  }, [shipTransitX, shipTransitY, applyZoneLoadState]);
  useEffect(() => {
    if (isMovingRef.current) return;
    setLoadedZoneIds((prev) => {
      const next = applyZoneLoadState(prev);
      return sameGalaxyMapZoneIdList(prev, next) ? prev : next;
    });
  }, [isMoving, player?.currentSystemId, selectedSystemId, applyZoneLoadState]);
  const prevWorldmapSystemIdRef = useRef<string | null>(null);
  useEffect(() => {
    const cur = player?.currentSystemId ?? null;
    const prev = prevWorldmapSystemIdRef.current;
    if (prev && cur && prev !== cur) {
      if (isMovingRef.current) {
        pendingSystemChangePrevRef.current = prev;
      } else {
        releaseWorldmapSessionFloor({
          reason: 'system_change',
          previousSystemId: prev,
        });
        // 성계 전환 직후 스크롤·제스처 gate 복구 — presentation reset 없이 gate만 빠진 경우 대비
        if (isFocusedRef.current && !scrollGesturesArmedRef.current) {
          armGalaxyMapScrollGestures();
        }
      }
    }
    if (cur) prevWorldmapSystemIdRef.current = cur;
  }, [player?.currentSystemId, armGalaxyMapScrollGestures]);
  useEffect(() => {
    if (isMoving) return;
    const prev = pendingSystemChangePrevRef.current;
    if (!prev) return;
    pendingSystemChangePrevRef.current = null;
    releaseWorldmapSessionFloor({
      reason: 'system_change',
      previousSystemId: prev,
    });
    if (isFocusedRef.current && !scrollGesturesArmedRef.current) {
      armGalaxyMapScrollGestures();
    }
  }, [isMoving, armGalaxyMapScrollGestures]);
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

  const zoomScaleMin = useMemo(() => {
    if (!GALAXY_MAP_ZOOM_ENABLED || mapLayout.w <= 0 || mapLayout.h <= 0) return 1;
    return resolveGalaxyMapZoomScaleMin({
      viewportW: mapLayout.w,
      viewportH: mapLayout.h,
      spanX: galaxyBounds.maxX - galaxyBounds.minX,
      spanY: galaxyBounds.maxY - galaxyBounds.minY,
      padPx: MAP_PAD_PX,
    });
  }, [galaxyBounds.maxX, galaxyBounds.minX, galaxyBounds.maxY, galaxyBounds.minY, mapLayout.h, mapLayout.w]);
  const zoomScaleMax = useMemo(
    () => (GALAXY_MAP_ZOOM_ENABLED ? resolveGalaxyMapZoomScaleMax(zoomScaleMin) : 1),
    [zoomScaleMin],
  );
  const zoomScale = useMemo(() => {
    if (!GALAXY_MAP_ZOOM_ENABLED) return 1;
    return resolveGalaxyMapZoomScaleAtStep(zoomStep, zoomScaleMin);
  }, [zoomScaleMin, zoomStep]);
  const nodeHitR = useMemo(
    () => resolveGalaxyMapNodeHitRadius(NODE_HIT_R, zoomScale, zoomScaleMax),
    [zoomScale, zoomScaleMax],
  );

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
        text: t(meta.textKey),
        color: meta.color,
      });
    }
    return out;
  }, [systems, toScreen, triggerSystemIdsByDirection, t]);

  const mapContentSize = useMemo(() => {
    const spanX = Math.max(galaxyBounds.maxX - galaxyBounds.minX, 0.001);
    const spanY = Math.max(galaxyBounds.maxY - galaxyBounds.minY, 0.001);
    return {
      cw: clampGalaxyMapContentDim(spanX * mapLayout.w + MAP_PAD_PX * 2),
      ch: clampGalaxyMapContentDim(spanY * mapLayout.h + MAP_PAD_PX * 2),
    };
  }, [galaxyBounds, mapLayout.w, mapLayout.h]);

  const mapMetricsReady = useMemo(() => mapLayout.w > 0 && mapLayout.h > 1, [mapLayout.h, mapLayout.w]);
  const galaxyMapStageReady =
    mapMetricsReady
    && stageFrameReady
    && galaxyLoadingMinHold
    && !hubNavGate.pending
    && mapInteractionReady
    && (worldmapSessionConfig == null || worldmapSession.phase === 'ready');

  const worldmapLoadingGateActive =
    hubNavGate.pending
    || (!galaxyMapStageReady && worldmapSession.phase !== 'error');

  useStageTransitionStuckWatchdog(worldmapLoadingGateActive, () => {
    hubNavGate.reset();
    if (worldmapSession.phase === 'loading') {
      worldmapSession.retry();
    }
    if (!scrollGesturesArmedRef.current && isFocusedRef.current) {
      armGalaxyMapScrollGestures();
    }
  });

  const computeScrollTargetForSystem = useCallback(
    (systemId: string): { x: number; y: number } | null => {
      const cur = systems[systemId];
      if (!cur) return null;
      const pos = toScreen(cur.position);
      return resolveGalaxyMapZoomScrollTarget({
        contentX: pos.x,
        contentY: pos.y,
        viewportW: mapLayout.w,
        viewportH: mapLayout.h,
        contentW: mapContentSize.cw,
        contentH: mapContentSize.ch,
        scale: zoomScale,
      });
    },
    [
      systems,
      toScreen,
      mapLayout.w,
      mapLayout.h,
      mapContentSize.cw,
      mapContentSize.ch,
      zoomScale,
    ],
  );

  // 진입·현재 성계·뷰포트 크기 변경 시 1회만 중앙 정렬 — 노드 탭·패널·재포커스는 스크롤 유지
  // 이동 연출 중에는 목적지 커밋으로 카메라를 먼저 옮기지 않는다(마크 이중 이동).
  useEffect(() => {
    if (!mapMetricsReady || !player) return;
    if (isMovingRef.current || isMoving) return;
    const systemId = player.currentSystemId;
    const key = `${systemId}|${mapLayout.w}|${mapLayout.h}|${mapContentSize.cw}|${mapContentSize.ch}`;
    if (autoScrollKeyRef.current === key) return;

    const maxScroll = resolveGalaxyMapZoomMaxScroll({
      viewportW: mapLayout.w,
      viewportH: mapLayout.h,
      contentW: mapContentSize.cw,
      contentH: mapContentSize.ch,
      scale: zoomScale,
    });
    maxScrollX.value = maxScroll.maxSX;
    maxScrollY.value = maxScroll.maxSY;

    const target = computeScrollTargetForSystem(systemId);
    if (!target) {
      // 현재 성계가 아직 systems 인덱스에 없음(분할 로딩·hydrate 경합) — key를 소비하지
      // 않아야 systems 갱신 시 재시도된다. 소비하면 (0,0) 좌상단 고정(검은 지도) 회귀.
      return;
    }
    autoScrollKeyRef.current = key;
    pendingScrollTargetRef.current = { x: target.x, y: target.y };
    if (scrollGesturesArmedRef.current && isFocusedRef.current) {
      pendingScrollTargetRef.current = null;
      runScrollTargetOnUi(target.x, target.y);
    }
  }, [
    mapMetricsReady,
    player?.currentSystemId,
    isMoving,
    mapLayout.w,
    mapLayout.h,
    mapContentSize.cw,
    mapContentSize.ch,
    zoomScale,
    computeScrollTargetForSystem,
    maxScrollX,
    maxScrollY,
    runScrollTargetOnUi,
  ]);

  useEffect(() => {
    if (!mapMetricsReady) return;
    const maxScroll = resolveGalaxyMapZoomMaxScroll({
      viewportW: mapLayout.w,
      viewportH: mapLayout.h,
      contentW: mapContentSize.cw,
      contentH: mapContentSize.ch,
      scale: zoomScale,
    });
    maxScrollX.value = maxScroll.maxSX;
    maxScrollY.value = maxScroll.maxSY;
    if (scrollGesturesArmedRef.current && isFocusedRef.current) {
      runGalaxyMapScrollClampOnUi(scrollX, scrollY, savedScrollX, savedScrollY, maxScrollX, maxScrollY);
    }
  }, [
    mapMetricsReady,
    mapContentSize.cw,
    mapContentSize.ch,
    mapLayout.w,
    mapLayout.h,
    zoomScale,
    maxScrollX,
    maxScrollY,
    scrollX,
    scrollY,
    savedScrollX,
    savedScrollY,
  ]);

  const zoomCameraStyle = useMemo(() => {
    const letter = resolveGalaxyMapZoomLetterbox({
      viewportW: mapLayout.w,
      viewportH: mapLayout.h,
      contentW: mapContentSize.cw,
      contentH: mapContentSize.ch,
      scale: zoomScale,
    });
    return {
      width: mapContentSize.cw,
      height: mapContentSize.ch,
      transform: [
        { translateX: letter.x + (mapContentSize.cw / 2) * (zoomScale - 1) },
        { translateY: letter.y + (mapContentSize.ch / 2) * (zoomScale - 1) },
        { scale: zoomScale },
      ],
    };
  }, [mapContentSize.cw, mapContentSize.ch, mapLayout.w, mapLayout.h, zoomScale]);

  useEffect(() => {
    const letter = resolveGalaxyMapZoomLetterbox({
      viewportW: mapLayout.w,
      viewportH: mapLayout.h,
      contentW: mapContentSize.cw,
      contentH: mapContentSize.ch,
      scale: zoomScale,
    });
    zoomScaleRef.current = zoomScale;
    zoomLetterXRef.current = letter.x;
    zoomLetterYRef.current = letter.y;
  }, [zoomScale, mapContentSize.cw, mapContentSize.ch, mapLayout.w, mapLayout.h]);

  useEffect(() => {
    if (!GALAXY_MAP_ZOOM_ENABLED || !mapMetricsReady || !player) return;
    if (isMovingRef.current || isMoving) return;
    if (zoomStep === GALAXY_MAP_ZOOM_DEFAULT_STEP && !zoomCameraAppliedRef.current) {
      return;
    }
    zoomCameraAppliedRef.current = true;
    const target = computeScrollTargetForSystem(player.currentSystemId);
    if (!target) return;
    if (scrollGesturesArmedRef.current && isFocusedRef.current) {
      pendingScrollTargetRef.current = null;
      runScrollTargetOnUi(target.x, target.y);
    } else {
      pendingScrollTargetRef.current = target;
    }
  }, [
    zoomStep,
    mapMetricsReady,
    player?.currentSystemId,
    isMoving,
    computeScrollTargetForSystem,
    runScrollTargetOnUi,
  ]);

  const starlightSystems = useMemo(() => {
    const out: StarSystem[] = [];
    for (const sys of hiddenUndiscoveredSystems) {
      const p = toScreen(sys.position);
      if (
        isHiddenSystemInGalaxyMapStarlightPayload({
          systemId: sys.id,
          loadedZoneIds,
          screenX: p.x,
          screenY: p.y,
          contentW: mapContentSize.cw,
          contentH: mapContentSize.ch,
        })
      ) {
        out.push(sys);
      }
    }
    return out;
  }, [hiddenUndiscoveredSystems, loadedZoneIds, toScreen, mapContentSize.cw, mapContentSize.ch]);
  const fogStarlightSystems = useMemo(() => {
    const out: StarSystem[] = [];
    for (const sys of fogHiddenSystemsList) {
      const p = toScreen(sys.position);
      if (
        isHiddenSystemInGalaxyMapStarlightPayload({
          systemId: sys.id,
          loadedZoneIds,
          screenX: p.x,
          screenY: p.y,
          contentW: mapContentSize.cw,
          contentH: mapContentSize.ch,
        })
      ) {
        out.push(sys);
      }
    }
    return out;
  }, [fogHiddenSystemsList, loadedZoneIds, toScreen, mapContentSize.cw, mapContentSize.ch]);
  const ambientStarlightSites = useMemo(() => {
    if (mapLayout.w <= 0 || mapLayout.h <= 1) return [];
    const occupierPositions: { x: number; y: number }[] = [];
    for (let i = 0; i < systemsList.length; i += 1) {
      occupierPositions.push(systemsList[i]!.position);
    }
    return buildGalaxyMapAmbientStarlightSites({
      minX: galaxyBounds.minX,
      minY: galaxyBounds.minY,
      maxX: galaxyBounds.maxX,
      maxY: galaxyBounds.maxY,
      occupierPositions,
      padWorldX: MAP_PAD_PX / mapLayout.w,
      padWorldY: MAP_PAD_PX / mapLayout.h,
    });
  }, [
    galaxyBounds.minX,
    galaxyBounds.minY,
    galaxyBounds.maxX,
    galaxyBounds.maxY,
    systemsList,
    mapLayout.w,
    mapLayout.h,
  ]);

  const selectedSystem = useMemo(() => {
    if (!selectedSystemId) return null;
    return resolveCoreOpenStarSystem(selectedSystemId) ?? systems[selectedSystemId] ?? null;
  }, [selectedSystemId, systems, unlockedSystemIds, synthColonizationPhaseByPlanetId]);
  const selectedSystemNameRevealed = Boolean(
    selectedSystem
    && isGalaxyMapSystemNameRevealed(
      visitedSystemIds.includes(selectedSystem.id),
      selectedSystem.id === player?.currentSystemId,
    ),
  );
  const selectedPlanetInfoRevealed = Boolean(
    selectedSystem?.planets[0]?.id
    && isPlanetInfoInspected(selectedSystem.planets[0].id, inspectedPlanetInfoIds),
  );
  const sensorThreatPreview = Boolean(
    selectedSystem
    && playerOwnsSensorArray(player?.skills)
    && travelFogRevealedIds.has(selectedSystem.id)
    && !selectedPlanetInfoRevealed,
  );
  const planetHolds = useClanWarFoundationStore((s) => s.planetHolds);
  const occupierClanIdBySystemId = useMemo(() => {
    const out: Record<string, string | undefined> = {};
    for (const sys of voronoiSystemsList) {
      const p0 = sys.planets[0];
      if (!p0) continue;
      const occupier = resolveEffectiveMapOccupierClanId(p0.id, planetHolds[p0.id]);
      if (!occupier) continue;
      out[sys.id] = occupier;
    }
    return out;
  }, [voronoiSystemsList, planetHolds]);

  const clanOwnerColorBySystemId = useMemo(() => {
    const out: Record<string, string | undefined> = {};
    for (const [sysId, occupier] of Object.entries(occupierClanIdBySystemId)) {
      if (occupier) out[sysId] = resolveTempClanColor(occupier);
    }
    return out;
  }, [occupierClanIdBySystemId]);

  const territoryMapBounds = useMemo(() => ({
    x0: MAP_PAD_PX,
    y0: MAP_PAD_PX,
    x1: Math.max(MAP_PAD_PX + 1, mapContentSize.cw - MAP_PAD_PX),
    y1: Math.max(MAP_PAD_PX + 1, mapContentSize.ch - MAP_PAD_PX),
  }), [mapContentSize.cw, mapContentSize.ch]);

  const territoryNationLabels = useMemo(
    () => ({
      blue: t('worldmap.territory.nation.blue'),
      red: t('worldmap.territory.nation.red'),
      // 싱글플레이 — 독립국 소유자는 항상 본인 1명뿐이라 닉네임 고정 표기 가능
      independent: t('worldmap.territory.nation.independent', { name: player?.nickname ?? '' }),
    }),
    [t, locale, player?.nickname],
  );

  const territoryTessellation = useMemo(
    () =>
      tessellateGalaxyMapTerritoryVoronoiModel({
        systems: voronoiSystemsList,
        occupierClanIdBySystemId,
        mapBounds: territoryMapBounds,
        toScreen,
      }),
    [voronoiSystemsList, occupierClanIdBySystemId, territoryMapBounds, toScreen],
  );
  const territoryVoronoiModel = useMemo(
    () => paintGalaxyMapTerritoryVoronoiModel(territoryTessellation, travelFogRevealedIds),
    [territoryTessellation, travelFogRevealedIds],
  );
  const panelPrimaryPlanetClanLine = useClanWarFoundationStore(
    useCallback(
      (s) => {
        const p0 = selectedSystem?.planets[0];
        if (!p0) return null;
        const h = s.planetHolds[p0.id];
        if (!h || h.kind === 'neutral' || h.occupierClanId === 'neutral') return null;
        const plate = resolvePlanetHubOwnershipPlate(h, s.clans, locale);
        if (!plate) return null;
        const nm = plate.clanName;
        if (h.kind === 'player_home') return t('worldmap.panel.homeBase', { name: nm });
        if (plate.isIndependent) return t('worldmap.panel.independent', { name: nm });
        if (h.occupierClanId.startsWith('ai_clan_') && plate.isNationDefault) {
          return t('worldmap.panel.aiClan', { name: nm });
        }
        return t('worldmap.panel.clan', { name: nm });
      },
      [selectedSystem?.planets[0]?.id, locale, t],
    ),
  );
  const mapPresentSystemId =
    transitVisualFreezeRef.current?.presentSystemId
    ?? transitPresentSystemIdRef.current
    ?? shipTransit?.fromSystemId
    ?? player?.currentSystemId
    ?? null;
  const currentSystem = mapPresentSystemId ? systems[mapPresentSystemId] : null;
  const galaxyCurrent = player ? systems[player.currentSystemId] : undefined;
  const unlockedSet = useMemo(() => new Set(unlockedSystemIds), [unlockedSystemIds]);
  const reachableIds = useMemo(() => {
    const frozen = transitVisualFreezeRef.current;
    if (frozen) return frozen.reachableIds;
    return galaxyCurrent?.connections.filter((id) => unlockedSet.has(id)) ?? [];
  }, [galaxyCurrent, unlockedSet, isMoving, shipTransit]);

  const routePreviewSystemIds = useMemo(() => {
    const frozen = transitVisualFreezeRef.current;
    if (frozen) return frozen.routePreviewSystemIds;
    if (!player?.currentSystemId || !selectedSystemId) return [];
    if (selectedSystemId === player.currentSystemId) return [];
    return (
      findShortestUnlockedSystemPath(
        systems,
        player.currentSystemId,
        selectedSystemId,
        unlockedSystemIds,
      ) ?? []
    );
  }, [player?.currentSystemId, selectedSystemId, systems, unlockedSystemIds, isMoving, shipTransit]);

  /** 인접 1-hop 또는 BFS 다중 홉 경로 */
  const selectedMovePath = useMemo((): string[] | null => {
    if (!player?.currentSystemId || !selectedSystemId) return null;
    if (selectedSystemId === player.currentSystemId) return [player.currentSystemId];
    if (reachableIds.includes(selectedSystemId)) {
      return [player.currentSystemId, selectedSystemId];
    }
    if (routePreviewSystemIds.length >= 2) return routePreviewSystemIds;
    return null;
  }, [player?.currentSystemId, selectedSystemId, reachableIds, routePreviewSystemIds]);

  const selectedFuelQuote = useMemo(() => {
    if (!player?.ship || !selectedMovePath || selectedMovePath.length < 2) return null;
    return computeGalaxyTransitFuelQuote({
      systems,
      pathSystemIds: selectedMovePath,
      ship: player.ship,
      destSystemId: selectedMovePath[selectedMovePath.length - 1],
      visitedSystemIds,
      ownedSkillIds: player.skills,
    });
  }, [player?.ship, player?.skills, selectedMovePath, systems, visitedSystemIds]);

  const canAffordSelectedFuel = canAffordGalaxyTransitFuel(
    player?.credits ?? 0,
    selectedFuelQuote,
  );

  const handleNodeTap = useCallback((systemId: string) => {
    if (isMoving) return;
    selectSystem(systemId);
    setShowPanel(true);
  }, [selectSystem, isMoving]);

  const touchTargets = useMemo(
    () =>
      fogVisibleSystemsList.map((sys) => {
        const pos = toScreen(sys.position);
        return { id: sys.id, x: pos.x, y: pos.y };
      }),
    [fogVisibleSystemsList, toScreen],
  );

  const handleMapTapAt = useCallback((viewportX: number, viewportY: number, sx: number, sy: number) => {
    if (isMovingRef.current) return;
    const mapped = mapViewportTapToContent({
      viewportX,
      viewportY,
      scrollX: sx,
      scrollY: sy,
      scale: zoomScaleRef.current,
      letterX: zoomLetterXRef.current,
      letterY: zoomLetterYRef.current,
    });
    const cx = mapped.x;
    const cy = mapped.y;
    const menuRect = activeMenuRectRef.current;
    // 메뉴 영역 탭 — Gesture.Tap이 RN TouchableOpacity보다 먼저 승리하므로 여기서 행 dispatch
    if (
      menuRect
      && cx >= menuRect.left
      && cx <= menuRect.right
      && cy >= menuRect.top
      && cy <= menuRect.bottom
    ) {
      const localX = cx - menuRect.left;
      const localY = cy - menuRect.top;
      const tap = resolveGalaxyMapMenuTap(localX, localY, systemActionMenuItemsRef.current.length);
      if (tap?.kind === 'close') {
        handleCloseSystemPanelRef.current();
        return;
      }
      if (tap?.kind === 'item') {
        dispatchMenuItemByIndexRef.current(tap.index);
      }
      return;
    }
    let bestId: string | null = null;
    const hitR = nodeHitRRef.current;
    let bestDist = hitR + 1;
    for (const t of touchTargetsRef.current) {
      // 드롭다운 메뉴가 떠 있는 영역에 걸친 노드는 탭 판정에서 제외 —
      // 메뉴 버튼이 이미 그 자리의 터치를 가로채므로, 지도 쪽 판정도 명시적으로 비활성화해
      // 제스처핸들러 Tap과 TouchableOpacity가 같은 터치에 동시 반응하는 걸 원천 차단.
      if (
        menuRect
        && t.x >= menuRect.left
        && t.x <= menuRect.right
        && t.y >= menuRect.top
        && t.y <= menuRect.bottom
      ) {
        continue;
      }
      const dist = Math.hypot(t.x - cx, t.y - cy);
      if (dist <= hitR && dist < bestDist) {
        bestDist = dist;
        bestId = t.id;
      }
    }
    if (bestId) handleNodeTapRef.current(bestId);
  }, []);

  useLayoutEffect(() => {
    isMovingRef.current = isMoving;
    touchTargetsRef.current = touchTargets;
    nodeHitRRef.current = nodeHitR;
    handleNodeTapRef.current = handleNodeTap;
    handleMapTapAtRef.current = handleMapTapAt;
  }, [isMoving, touchTargets, nodeHitR, handleNodeTap, handleMapTapAt]);

  const dispatchMapTapAt = useCallback((x: number, y: number, sx: number, sy: number) => {
    handleMapTapAtRef.current(x, y, sx, sy);
  }, []);

  const mapGesture = useMemo(() => {
    const tap = Gesture.Tap()
      .maxDuration(250)
      .maxDistance(12)
      .onEnd((e) => {
        'worklet';
        if (scrollAliveSv.value <= 0 || isMovingSv.value > 0) return;
        runOnJS(dispatchMapTapAt)(e.x, e.y, scrollX.value, scrollY.value);
      });

    const pan = Gesture.Pan()
      .minDistance(MAP_PAN_MIN_DISTANCE_PX)
      .onBegin(() => {
        'worklet';
        if (scrollAliveSv.value <= 0 || isMovingSv.value > 0) return;
        cancelAnimation(scrollX);
        cancelAnimation(scrollY);
        savedScrollX.value = scrollX.value;
        savedScrollY.value = scrollY.value;
      })
      .onUpdate((e) => {
        'worklet';
        if (scrollAliveSv.value <= 0 || isMovingSv.value > 0) return;
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
        if (scrollAliveSv.value <= 0 || isMovingSv.value > 0) return;
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
  }, [scrollX, scrollY, savedScrollX, savedScrollY, maxScrollX, maxScrollY, scrollAliveSv, isMovingSv, dispatchMapTapAt]);

  const doMoveAlongPath = useCallback(
    async (pathSystemIds: string[]) => {
      if (!player || pathSystemIds.length < 2) return;
      const travelBlock = resolvePlayerTravelBlock(player);
      if (travelBlock) {
        showArcAlert(
          travelBlock === 'durability' ? t('worldmap.durabilityTitle') : t('worldmap.podTitle'),
          travelBlock === 'durability' ? t('worldmap.durabilityBody') : t('worldmap.podBody'),
        );
        return;
      }
      const destPlanet = systems[pathSystemIds[pathSystemIds.length - 1]!]?.planets[0];
      if (
        destPlanet &&
        resolveSurvivalPodDestinationBlock({
          player,
          destStayBlocked: Boolean(resolvePlayerPlanetStayBlock(destPlanet.id)),
        })
      ) {
        showArcAlert(t('worldmap.podDestTitle'), t('worldmap.podDestBody'));
        return;
      }
      if (!mapMetricsReady) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          // eslint-disable-next-line no-console
          console.warn('[NAV] worldmap move aborted — mapMetricsReady=false');
        }
        return;
      }
      if (isMovingRef.current) return;

      const finalSystemId = pathSystemIds[pathSystemIds.length - 1]!;
      const targetSystem = systems[finalSystemId];
      if (!targetSystem) return;

      isMovingRef.current = true;
      transitPresentSystemIdRef.current = pathSystemIds[0]!;
      setIsMoving(true);
      emitMemProfileMarker({
        stage: 'galaxy_map',
        event: 'transit_hop_start',
        detail: `${pathSystemIds[0] ?? ''}→${finalSystemId}`,
      });
      setShowPanel(false);
      selectSystem(null);

      // 이동 잠금(isMoving)은 이 try 블록 전체(비동기 정착·연료 차감까지) 동안 유지 — finally에서만 해제.
      // 조기에 풀리면 정착 전(moveToSystem/persist/selectSystem 사이) 지도가 다시 탭 가능해져,
      // 사용자가 재선택한 목적지를 아래 selectSystem(targetSystem.id)가 되돌려버리는 레이스가 있었음.
      try {
      const fuelQuote = computeGalaxyTransitFuelQuote({
        systems,
        pathSystemIds,
        ship: player.ship,
        destSystemId: pathSystemIds[pathSystemIds.length - 1],
        visitedSystemIds: useWorldStore.getState().visitedSystemIds,
        ownedSkillIds: player.skills,
      });
      if (fuelQuote && fuelQuote.totalCredits > 0) {
        if (!canAffordGalaxyTransitFuel(player.credits, fuelQuote)) {
          showArcAlert(
            t('worldmap.fuelInsufficientTitle'),
            t('worldmap.fuelInsufficientBody', {
              cost: fuelQuote.totalCredits,
              balance: player.credits,
            }),
          );
          return;
        }
        if (!spendCredits(fuelQuote.totalCredits)) {
          showArcAlert(
            t('worldmap.fuelInsufficientTitle'),
            t('worldmap.fuelInsufficientBody', {
              cost: fuelQuote.totalCredits,
              balance: usePlayerStore.getState().player?.credits ?? 0,
            }),
          );
          return;
        }
        if (fuelQuote.wormholeProc) presentSkillProcBanner(SKILL_PROC_LABEL.wormhole);
        else if (applyJumpBoostToTransitMs(1000, player.skills) < 1000) {
          presentSkillProcBanner(SKILL_PROC_LABEL.jumpBoost);
        }
      }

      // 조우전 여부만 애니메이션 전에 미리 판정(순수 확률 롤, 부작용 없음).
      // 조우전이 아니면 좌표 커밋(moveToSystem+persist)도 애니메이션 "전"에 확정 —
      // 이후 애니메이션은 순수 연출이라 재생 중 리로드/백그라운드가 끼어들어도 이미
      // 커밋된 도착 결과는 보존된다. 조우전 분기(begin·전투 진입)는 기존과 동일하게
      // 애니메이션 뒤(allFinished 확인 후)에서만 실행 — 그 경로는 동작 변경 없음.
      // (2026-08-02 대표님 실측: 이동 애니메이션 후 로딩 → 출발지에 그대로 남는 회귀 대응)
      const missionState = useMissionStore.getState();
      const missionProgresses = missionState.progresses;
      const encounterChance = resolveTransitEncounterChance(
        targetSystem.zone,
        hasPrimaryActiveCombatMission(missionProgresses, missionState.activeMissionId),
        missionProgresses,
        missionState.activeMissionId,
        targetSystem.id,
      );
      const willEncounter =
        Math.random() < encounterChance && isPlayerShipCombatCapable(player.ship);

      const originId = pathSystemIds[0]!;
      const originSystem = systems[originId];
      const unlockedNow = new Set(useWorldStore.getState().unlockedSystemIds);
      transitVisualFreezeRef.current = {
        presentSystemId: originId,
        reachableIds: originSystem
          ? originSystem.connections.filter((id) => unlockedNow.has(id))
          : [],
        routePreviewSystemIds: pathSystemIds,
      };

      const screenPts: { x: number; y: number }[] = [];
      for (let i = 0; i < pathSystemIds.length; i += 1) {
        const sys = systems[pathSystemIds[i]!];
        if (!sys) {
          screenPts.length = 0;
          break;
        }
        screenPts.push(toScreen(sys.position));
      }
      if (screenPts.length < 2) {
        transitVisualFreezeRef.current = null;
        return;
      }

      const startPt = screenPts[0]!;
      shipTransitX.stopAnimation();
      shipTransitY.stopAnimation();
      shipTransitX.setValue(startPt.x);
      shipTransitY.setValue(startPt.y);
      transitPresentSystemIdRef.current = originId;
      setShipTransit({ fromSystemId: originId });

      if (!willEncounter) {
        moveToSystem(targetSystem.id);
        // 성계 본명은 전함 마크가 해당 성계에 도착한 뒤에만 markVisited.
        // 좌표 커밋은 기존처럼 애니 전 — 리로드 시 출발지 원복 회귀 방지.
        const playerAfterMove = usePlayerStore.getState().player;
        if (playerAfterMove) {
          applyReachSystemMissionObjectives(targetSystem.id, playerAfterMove, {
            deliverFailTitle: t('worldmap.deliverFailTitle'),
            deliverFailBody: t('worldmap.deliverFailBody'),
          });
          tryPresentPendingMissionClearDialog();
        }
        void persist();
      }

        const hopDists: number[] = [];
        let totalDist = 0;
        for (let i = 0; i < screenPts.length - 1; i += 1) {
          const a = screenPts[i]!;
          const b = screenPts[i + 1]!;
          const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
          hopDists.push(d);
          totalDist += d;
        }
        const totalDurationMs = applyJumpBoostToTransitMs(
          hopDists.length * SHIP_TRANSIT_DURATION_MS,
          player.skills,
        );
        const hopDurations = hopDists.map((d) =>
          Math.max(180, Math.round(totalDurationMs * (d / totalDist))),
        );

        const hopAnims = hopDurations.map((duration, i) => {
          const to = screenPts[i + 1]!;
          return RNAnimated.parallel([
            RNAnimated.timing(shipTransitX, {
              toValue: to.x,
              duration,
              easing: Easing.linear,
              useNativeDriver: false,
            }),
            RNAnimated.timing(shipTransitY, {
              toValue: to.y,
              duration,
              easing: Easing.linear,
              useNativeDriver: false,
            }),
          ]);
        });

        let allFinished = true;
        for (let hopIdx = 0; hopIdx < hopAnims.length; hopIdx += 1) {
          if (!isMountedRef.current || !isFocusedRef.current) {
            allFinished = false;
            break;
          }
          const transitToken = ++transitWaitTokenRef.current;
          try {
            const anim = hopAnims[hopIdx]!;
            transitAnimRef.current = anim;
            const hopOk = await new Promise<boolean>((resolve) => {
              abortTransitWaitRef.current = { token: transitToken, resolve };
              anim.start(({ finished: ok }) => {
                const pending = abortTransitWaitRef.current;
                if (pending?.token !== transitToken) return;
                settleTransitWait(!!ok);
              });
              transitFallbackTimerRef.current = setTimeout(() => {
                const pending = abortTransitWaitRef.current;
                if (pending?.token !== transitToken) return;
                settleTransitWait(true);
              }, hopDurations[hopIdx]! + 80);
            });
            if (!hopOk) {
              allFinished = false;
              break;
            }
            const arrivedId = pathSystemIds[hopIdx + 1];
            if (arrivedId) markVisited(arrivedId);
          } finally {
            transitAnimRef.current = null;
            if (transitFallbackTimerRef.current) {
              clearTimeout(transitFallbackTimerRef.current);
              transitFallbackTimerRef.current = null;
            }
            const pending = abortTransitWaitRef.current;
            if (pending?.token === transitToken) {
              abortTransitWaitRef.current = null;
              pending.resolve(false);
            }
          }
        }

        if (!isMountedRef.current || !isFocusedRef.current) {
          allFinished = false;
        }

        if (isMountedRef.current) {
          transitPresentSystemIdRef.current = null;
          transitVisualFreezeRef.current = null;
          setShipTransit(null);
        }

        if (!allFinished || !isMountedRef.current || !isFocusedRef.current) return;

        if (willEncounter) {
          useTransitCombatSessionStore.getState().begin({
            originSystemId: pathSystemIds[0]!,
            destinationSystemId: targetSystem.id,
          });
          selectSystem(targetSystem.id);
          navigateToCombatAfterTeardown();
          return;
        }

        if (isMountedRef.current) {
          // 방어적 가드 — 잠금이 꼬리 전체를 덮으므로 사실상 항상 null이지만,
          // 향후 다른 경로가 isMoving 게이트 밖에서 selectSystem을 건드릴 경우를 대비한 이중 방어.
          if (useWorldStore.getState().selectedSystemId === null) {
            selectSystem(targetSystem.id);
          }
          setShowPanel(true);
        }
      } finally {
        isMovingRef.current = false;
        transitPresentSystemIdRef.current = null;
        transitVisualFreezeRef.current = null;
        if (isMountedRef.current) setIsMoving(false);
      }
    },
    [
      player,
      systems,
      toScreen,
      shipTransitX,
      shipTransitY,
      moveToSystem,
      markVisited,
      persist,
      selectSystem,
      setShowPanel,
      mapMetricsReady,
      settleTransitWait,
      navigateToCombatAfterTeardown,
      spendCredits,
      t,
    ],
  );

  const doMove = useCallback(
    (targetSystem: StarSystem) => {
      if (!player) return;
      void doMoveAlongPath([player.currentSystemId, targetSystem.id]);
    },
    [player, doMoveAlongPath],
  );

  const handleMove = useCallback(async () => {
    if (!selectedSystem || !player) return;
    if (isMovingRef.current || isMoving) return;

    const travelBlock = resolvePlayerTravelBlock(player);
    if (travelBlock) {
      showArcAlert(
        travelBlock === 'durability' ? t('worldmap.durabilityTitle') : t('worldmap.podTitle'),
        travelBlock === 'durability' ? t('worldmap.durabilityBody') : t('worldmap.podBody'),
      );
      return;
    }

    if (selectedSystem.id === player.currentSystemId) {
      if (!hubNavGate.tryBegin()) return;
      const planet = selectedSystem.planets[0];
      try {
        if (planet) {
          const stayBlock = resolvePlayerPlanetStayBlock(planet.id);
          if (stayBlock) {
            hubNavGate.reset();
            showArcAlert(t('worldmap.redTerritoryTitle'), t('worldmap.redTerritoryBody'));
            return;
          }
          landOnPlanet(planet.id);
          await persist();
        }
        if (!isMountedRef.current) {
          // gate를 열어두지 않으면 이후 탭이 tryBegin에서 전부 막혀 무반응이 된다
          hubNavGate.reset();
          if (typeof __DEV__ !== 'undefined' && __DEV__) {
            // eslint-disable-next-line no-console
            console.warn('[NAV] worldmap land aborted — isMounted=false');
          }
          return;
        }
        navigateToPlanetHubAfterTeardown(planet?.id ?? null);
      } catch {
        hubNavGate.reset();
      }
      return;
    }

    // 성계 간 이동은 StageNavGate 불필요 — 잔여 pending/lock 이 이동 버튼을 영구 비활성화하던 회귀
    if (hubNavGate.isLocked()) {
      hubNavGate.reset();
    }

    if (!selectedMovePath || selectedMovePath.length < 2) {
      showArcAlert(t('worldmap.moveBlockedTitle'), t('worldmap.moveBlockedBody'));
      return;
    }

    const moveFuelQuote = computeGalaxyTransitFuelQuote({
      systems,
      pathSystemIds: selectedMovePath,
      ship: player.ship,
      destSystemId: selectedMovePath[selectedMovePath.length - 1],
      visitedSystemIds,
      ownedSkillIds: player.skills,
    });
    if (moveFuelQuote && !canAffordGalaxyTransitFuel(player.credits, moveFuelQuote)) {
      showArcAlert(
        t('worldmap.fuelInsufficientTitle'),
        t('worldmap.fuelInsufficientBody', {
          cost: moveFuelQuote.totalCredits,
          balance: player.credits,
        }),
      );
      return;
    }

    if (selectedSystem.zone === 'pvp') {
      showArcAlert(
        t('worldmap.pvpTitle'),
        t('worldmap.pvpBody'),
        [
          { text: t('worldmap.btn.cancel'), style: 'cancel' },
          { text: t('worldmap.btn.enter'), onPress: () => void doMoveAlongPath(selectedMovePath) },
        ],
      );
    } else {
      void doMoveAlongPath(selectedMovePath);
    }
  }, [selectedSystem, player, selectedMovePath, systems, doMoveAlongPath, landOnPlanet, persist, isMoving, t, navigateToPlanetHubAfterTeardown, hubNavGate]);

  const handlePlanetInfo = useCallback((): void => {
    if (!selectedSystem) return;
    const planet = selectedSystem.planets[0];
    if (!planet) return;
    presentPlanetEconomyInfoOverlay(planet.id, planet.name?.trim() || planet.id);
  }, [selectedSystem]);

  /**
   * [전투] — RED 점유 성계 공격 진입. 이동중 인스턴스 전투(/combat)가 아니라
   * 착륙과 동일한 순서로 행성 허브에 진입한 뒤, 웨이브 전투(카운트다운 →
   * 9웨이브 · vega_base 룰)로 이어진다. 승리 시 중립화. (대표님 지시 2026-07-20)
   */
  const handleCombat = useCallback(async (): Promise<void> => {
    if (!selectedSystem || !player) return;
    if (isMoving || hubNavGate.isLocked()) return;
    if (selectedSystem.id !== player.currentSystemId) return;
    const planet = selectedSystem.planets[0];
    if (!planet || !isPlanetWaveAssaultAvailable(planet.id)) return;
    if (!isPlayerShipCombatCapable(player.ship)) {
      showArcAlert(t('worldmap.podTitle'), t('worldmap.podBody'));
      return;
    }

    if (!hubNavGate.tryBegin()) return;
    try {
      markPlanetAssaultIntent(planet.id);
      landOnPlanet(planet.id);
      await persist();
      if (!isMountedRef.current) {
        clearPlanetAssaultIntent();
        hubNavGate.reset();
        return;
      }
      navigateToPlanetHubAfterTeardown(planet.id);
    } catch {
      clearPlanetAssaultIntent();
      hubNavGate.reset();
    }
  }, [
    selectedSystem,
    player,
    isMoving,
    hubNavGate,
    landOnPlanet,
    persist,
    navigateToPlanetHubAfterTeardown,
    t,
  ]);

  const dispatchMenuItemByIndex = useCallback((index: number) => {
    const items = systemActionMenuItemsRef.current;
    if (index < 0 || index >= items.length) return;
    const item = items[index]!;
    const key = item.key;
    if (item.disabled) return;
    const now = Date.now();
    const last = lastMenuTapRef.current;
    if (last && last.key === key && now - last.ms < 320) return;
    lastMenuTapRef.current = { ms: now, key };
    if (key === 'nav') {
      void handleMoveRef.current();
      return;
    }
    if (key === 'planetInfo') {
      handlePlanetInfoRef.current();
      return;
    }
    void handleCombatRef.current();
  }, []);

  const handleCloseSystemPanel = useCallback(() => {
    setShowPanel(false);
    selectSystem(null);
  }, [selectSystem]);

  const dispatchMenuItemByIndexRef = useRef<(index: number) => void>(() => {});

  const selectedPrimaryPlanet = selectedSystem?.planets[0] ?? null;
  const isAtSelectedSystem = Boolean(
    selectedSystem && player && selectedSystem.id === player.currentSystemId,
  );
  const selectedPlanetStayBlock = selectedPrimaryPlanet
    ? resolvePlayerPlanetStayBlock(selectedPrimaryPlanet.id)
    : null;
  const combatAvailable = isAtSelectedSystem
    && !!selectedPrimaryPlanet
    && isPlanetWaveAssaultAvailable(selectedPrimaryPlanet.id);

  const primaryNavDisabled =
    isMoving
    || (isAtSelectedSystem && (hubNavGate.pending || !!selectedPlanetStayBlock))
    || (!isAtSelectedSystem
      && (!selectedMovePath || selectedMovePath.length < 2 || !canAffordSelectedFuel));

  const primaryNavLabel =
    isAtSelectedSystem && hubNavGate.pending
      ? t('worldmap.btn.landing')
      : isMoving
        ? t('worldmap.btn.moving')
        : isAtSelectedSystem
          ? t('worldmap.dropdown.land')
          : t('worldmap.dropdown.move');

  const landAvailable = isAtSelectedSystem && !primaryNavDisabled;
  const systemActionMenuItems = useMemo((): GalaxyMapSystemActionMenuItem[] => [
      {
        key: 'nav',
        label: primaryNavLabel,
        disabled: primaryNavDisabled,
        ink: landAvailable ? 'land' : 'default',
        onPress: () => dispatchMenuItemByIndexRef.current(0),
      },
      {
        key: 'planetInfo',
        label: t('worldmap.dropdown.planetInfo'),
        disabled: !selectedPrimaryPlanet,
        onPress: () => dispatchMenuItemByIndexRef.current(1),
      },
      {
        key: 'combat',
        label: t('worldmap.dropdown.combat'),
        disabled: !combatAvailable,
        ink: combatAvailable ? 'combat' : 'default',
        onPress: () => dispatchMenuItemByIndexRef.current(2),
      },
    ],
    [
      primaryNavLabel,
      primaryNavDisabled,
      landAvailable,
      t,
      selectedPrimaryPlanet,
      combatAvailable,
    ],
  );

  /**
   * 드롭다운 위치 — 항상 성계 노드 오른쪽(김팀장 원안 "원래 위치" 그대로, 고정).
   * 좌/하/상 반전은 쓰지 않음(대표님 지시 — 오른쪽 고정, 다른 방향으로 옮기지 말 것).
   */
  const selectedSystemMenuPlacement = useMemo((): {
    x: number;
    y: number;
    side: GalaxyMapSystemActionMenuSide;
  } | null => {
    if (!selectedSystem) return null;
    const anchor = toScreen(selectedSystem.position);
    return { x: anchor.x, y: anchor.y, side: 'right' };
  }, [selectedSystem, toScreen]);

  /**
   * 메뉴가 실제로 화면에 떠 있을 때만 activeMenuRectRef를 채운다(handleMapTapAt이 이 사각형에
   * 걸친 노드를 탭 판정에서 제외 — 메뉴 버튼 아래 인터랙션 요소 비활성화, 겹침 회피 대신).
   */
  useLayoutEffect(() => {
    if (!showPanel || !selectedSystem || !travelFogRevealedIds.has(selectedSystem.id) || !selectedSystemMenuPlacement) {
      activeMenuRectRef.current = null;
      return;
    }
    const { x, y, side } = selectedSystemMenuPlacement;
    const itemCount = systemActionMenuItems.length;
    const { left, top } = resolveMenuTopLeft(side, x, y, itemCount);
    activeMenuRectRef.current = {
      left,
      top,
      right: left + MENU_WIDTH,
      bottom: top + itemCount * MENU_ITEM_HEIGHT,
    };
  }, [showPanel, selectedSystem, selectedSystemMenuPlacement, systemActionMenuItems.length]);

  useLayoutEffect(() => {
    systemActionMenuItemsRef.current = systemActionMenuItems;
    handleMoveRef.current = handleMove;
    handlePlanetInfoRef.current = handlePlanetInfo;
    handleCombatRef.current = handleCombat;
    handleCloseSystemPanelRef.current = handleCloseSystemPanel;
    dispatchMenuItemByIndexRef.current = dispatchMenuItemByIndex;
  }, [systemActionMenuItems, handleMove, handlePlanetInfo, handleCombat, handleCloseSystemPanel, dispatchMenuItemByIndex]);

  const handleZoomOut = useCallback(() => {
    if (!GALAXY_MAP_ZOOM_ENABLED) return;
    setZoomStep((prev) => stepGalaxyMapZoom(prev, -1));
  }, []);
  const handleZoomIn = useCallback(() => {
    if (!GALAXY_MAP_ZOOM_ENABLED) return;
    setZoomStep((prev) => stepGalaxyMapZoom(prev, 1));
  }, []);

  if (!player) return null;

  return (
    <StageShell
      routeName="worldmap"
      background="none"
      edges={['bottom']}
      safeAreaBackgroundColor={COLORS.bg_primary}
    >
      <View style={styles.rootColumn}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleOpenWorldmapMenu}
          style={styles.menuBtn}
          accessibilityLabel={t('worldmap.menu.a11y')}
        >
          <Text style={styles.menuText}>{t('worldmap.menu.label')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('worldmap.title')}</Text>
        <Text style={styles.headerSub}>
          {currentSystem ? resolveStarSystemDisplayName(currentSystem, locale) : ''}
        </Text>
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
        {galaxyMapStageReady ? (
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
                <View
                  pointerEvents="box-none"
                  renderToHardwareTextureAndroid={false}
                  style={zoomCameraStyle}
                >
                <Svg
                  width={mapContentSize.cw}
                  height={mapContentSize.ch}
                  pointerEvents="none"
                >
                  <GalaxyMapTerritoryVoronoiSvg
                    fills={territoryVoronoiModel.fills}
                    paths={territoryVoronoiModel.paths}
                  />
                  <GalaxyMapUndiscoveredStarlightSvg
                    systems={starlightSystems}
                    alwaysVisibleSystems={fogStarlightSystems}
                    fillSites={ambientStarlightSites}
                    toScreen={toScreen}
                  />
                  <GalaxyMapSystemsSvg
                    systems={fogVisibleSystemsList}
                    systemById={systems}
                    currentId={shipTransit ? '' : (mapPresentSystemId ?? player.currentSystemId)}
                    selectedId={
                      selectedSystemId && travelFogRevealedIds.has(selectedSystemId)
                        ? selectedSystemId
                        : ''
                    }
                    routePreviewSystemIds={
                      selectedSystemId && travelFogRevealedIds.has(selectedSystemId)
                        ? routePreviewSystemIds
                        : []
                    }
                    visitedIds={visitedSystemIds}
                    reachableIds={reachableIds}
                    unlockedIds={unlockedSystemIds}
                    clanOwnerColorBySystemId={clanOwnerColorBySystemId}
                    toScreen={toScreen}
                    locale={locale}
                    questAcceptMarks={questAcceptMarks}
                  />
                  <GalaxyMapTerritoryOccupationLabelsSvg
                    labels={territoryVoronoiModel.occupationLabels}
                    nationLabelBySide={territoryNationLabels}
                  />
                </Svg>
                <GalaxyMapColonizeHubPulseOverlay
                  systems={fogVisibleSystemsList}
                  toScreen={toScreen}
                  animActive={galaxyMapStageReady && !isMoving}
                />
                <GalaxyMapContestedZoneRingOverlay
                  systems={contestedVisibleSystems}
                  currentSystemId={shipTransit ? '' : (mapPresentSystemId ?? player.currentSystemId)}
                  toScreen={toScreen}
                  animActive={galaxyMapStageReady && !isMoving}
                />
                {anomalyVisibleSystems.length > 0 ? (
                  <GalaxyMapContestedZoneRingOverlay
                    systems={anomalyVisibleSystems}
                    currentSystemId={shipTransit ? '' : (mapPresentSystemId ?? player.currentSystemId)}
                    toScreen={toScreen}
                    animActive={galaxyMapStageReady && !isMoving}
                    ringColor={UNIDENTIFIED_ANOMALY_RING_COLOR}
                  />
                ) : null}
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
                        left: shipTransitX,
                        top: shipTransitY,
                      },
                    ]}
                  >
                    <Text style={styles.shipTransitIcon}>▼</Text>
                  </RNAnimated.View>
                )}
                {showPanel && selectedSystem && travelFogRevealedIds.has(selectedSystem.id) && selectedSystemMenuPlacement ? (
                  <GalaxyMapSystemActionMenu
                    anchorX={selectedSystemMenuPlacement.x}
                    anchorY={selectedSystemMenuPlacement.y}
                    side={selectedSystemMenuPlacement.side}
                    items={systemActionMenuItems}
                    onClose={handleCloseSystemPanel}
                    closeA11yLabel={t('worldmap.dropdown.closeA11y')}
                  />
                ) : null}
                </View>
              </Animated.View>
            </View>
          </GestureDetector>
        ) : null}
        {GALAXY_MAP_ZOOM_ENABLED && galaxyMapStageReady ? (
          <GalaxyMapZoomControls
            onZoomOut={handleZoomOut}
            onZoomIn={handleZoomIn}
            canZoomOut={zoomStep > GALAXY_MAP_ZOOM_STEP_MIN}
            canZoomIn={zoomStep < GALAXY_MAP_ZOOM_STEP_MAX}
            zoomOutA11y={t('worldmap.zoom.outA11y')}
            zoomInA11y={t('worldmap.zoom.inA11y')}
          />
        ) : null}
        <StageLoadingOverlay
          visible={worldmapLoadingGateActive}
          overlayId="stage-loading-worldmap"
        />
        {worldmapSession.phase === 'error' ? (
          <HeavyUiStageErrorPanel
            preflightCode={worldmapSession.preflightCode}
            error={worldmapSession.error}
            onRetry={worldmapSession.retry}
            onBack={handleReturnToLastHub}
          />
        ) : null}
      </View>

      {showPanel && selectedSystem && travelFogRevealedIds.has(selectedSystem.id) ? (
        <View style={[styles.panel, { height: PANEL_H }]}>
          <View style={styles.panelHeader}>
            <View>
              <Text
                style={[
                  styles.panelSystemName,
                  selectedSystemNameRevealed ? null : styles.panelFogged,
                ]}
              >
                {resolveGalaxyMapSystemDisplayLabel(
                  selectedSystem,
                  locale,
                  selectedSystemNameRevealed,
                )}
              </Text>
              <Text
                style={[
                  styles.panelZone,
                  selectedPlanetInfoRevealed
                    ? { color: ZONE_COLORS[selectedSystem.zone] ?? COLORS.ink_mid }
                    : styles.panelFogged,
                ]}
                numberOfLines={1}
              >
                {selectedPlanetInfoRevealed
                  ? panelPrimaryPlanetClanLine
                    ? `${t('worldmap.panel.threatLine', {
                        level: selectedSystem.enemyLevel,
                      })}  ${panelPrimaryPlanetClanLine}`
                    : t('worldmap.panel.zoneLine', {
                        zone: resolvePlanetZoneDisplayLabel(
                          selectedSystem.planets[0]?.id ?? '',
                          selectedSystem.zone,
                          t,
                          clanWarClans,
                        ),
                        level: selectedSystem.enemyLevel,
                      })
                  : sensorThreatPreview
                    ? t('worldmap.panel.threatLine', {
                        level: selectedSystem.enemyLevel,
                      })
                  : t('worldmap.unidentifiedValue')}
              </Text>
            </View>
            <TouchableOpacity onPress={handleCloseSystemPanel}>
              <Text style={styles.panelClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text
            style={[
              styles.panelDesc,
              selectedPlanetInfoRevealed ? null : styles.panelFogged,
            ]}
            numberOfLines={2}
          >
            {selectedPlanetInfoRevealed
              ? resolveStarSystemDescription(selectedSystem, locale)
              : t('worldmap.unidentifiedDesc')}
          </Text>
          <View style={styles.panelActions}>
            <Text style={styles.panelReachable}>
              {selectedSystem.id === player.currentSystemId
                ? t('worldmap.panel.here')
                : selectedMovePath && selectedMovePath.length >= 2 && selectedFuelQuote
                  ? (() => {
                      const hops = selectedMovePath.length - 1;
                      const costLine =
                        hops <= 1
                          ? t('worldmap.panel.reachableWithCost', {
                              cost: selectedFuelQuote.totalCredits,
                            })
                          : t('worldmap.panel.routeReachableWithCost', {
                              hops,
                              cost: selectedFuelQuote.totalCredits,
                            });
                      return canAffordSelectedFuel
                        ? costLine
                        : `${costLine}${t('worldmap.panel.insufficientCredits')}`;
                    })()
                  : selectedMovePath && selectedMovePath.length >= 2
                    ? t('worldmap.panel.routeReachable', { hops: selectedMovePath.length - 1 })
                    : t('worldmap.panel.unreachable')}
            </Text>
          </View>
        </View>
      ) : (
        <View style={[styles.panel, { height: PANEL_H, justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={styles.panelHint}>{t('worldmap.panel.hint')}</Text>
        </View>
      )}
      </View>
    </StageShell>
  );
}

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
    borderBottomColor: TH.chromeBorder,
    backgroundColor: TH.chromeBg,
  },
  menuBtn: {
    borderWidth: 1,
    borderColor: TH.controlBtnBorder,
    backgroundColor: TH.controlBtnBg,
    borderRadius: PLANET_MAIN_TOPBAR_ICON_BORDER_RADIUS,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  menuText: { fontFamily: FONTS.mono, fontSize: FONTS.size.sm, color: TH.chromeInk },
  headerTitle: {
    flex: 1,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    color: TH.chromeInk,
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  headerSub: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: TH.miningSummaryInk,
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
    color: TH.topBarCurrencyInk,
  },
  panel: {
    backgroundColor: TH.pilotExpandBg,
    borderTopWidth: 1,
    borderTopColor: TH.pilotExpandBorder,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    // 하단 도달/힌트 텍스트가 배경 끝과 붙지 않도록 6px 여유
    paddingBottom: SPACING.md + 6,
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
    color: TH.pilotValueInk,
  },
  panelFogged: {
    color: GALAXY_MAP_UNIDENTIFIED_LABEL_FILL,
  },
  panelZone: { fontFamily: FONTS.mono, fontSize: FONTS.size.xs, marginTop: 2 },
  panelClose: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    color: TH.miningSummaryInk,
    padding: SPACING.xs,
  },
  panelDesc: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: TH.pilotLabelInk,
    lineHeight: 18,
    marginBottom: SPACING.xs,
  },
  panelCapitalLine: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.bold,
    color: TH.topBarCurrencyInk,
    marginBottom: SPACING.xs,
  },
  panelActions: { marginTop: SPACING.xs },
  panelReachable: { fontFamily: FONTS.mono, fontSize: FONTS.size.sm, color: TH.pilotLabelInk },
  panelHint: { fontFamily: FONTS.mono, fontSize: FONTS.size.sm, color: TH.miningSummaryInk },
});

registerDevHotModuleDisposeGuard('galaxy_map');
