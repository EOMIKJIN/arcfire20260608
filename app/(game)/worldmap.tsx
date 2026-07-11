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
import { useAppSettingsStore } from '../../src/store/appSettingsStore';
import { useLocaleRenderKey } from '../../src/hooks/useLocaleRenderKey';
import { COLORS, FONTS, SPACING, ZONE_COLORS } from '../../src/utils/theme';
import { TACTICAL_HUB as TH } from '../../src/ui/tactical/tacticalHubTokens';
import { showArcAlert } from '../../src/utils/showArcAlert';
import { isPlayerShipCombatCapable, resolvePlayerTravelBlock } from '../../src/game/playerSurvivalPod';
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
import { resolvePlayerPlanetStayBlock, isRedOccupiedPlanet } from '../../src/clanWar/planetTerritoryPlayerAccess';
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
import { finalizeGalaxyMapSessionForExit } from '../../src/game/galaxyMapSessionResume';
import {
  GALAXY_MAP_SOFT_RECLAIM_INTERVAL_MS,
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
import { computeGalaxyMapTerritoryVoronoiModel } from '../../src/galaxyMap/computeGalaxyMapTerritoryVoronoiModel';
import { GalaxyMapTerritoryOccupationLabelsSvg } from '../../src/galaxyMap/GalaxyMapTerritoryOccupationLabelsSvg';
import { GalaxyMapTerritoryVoronoiSvg } from '../../src/galaxyMap/GalaxyMapTerritoryVoronoiSvg';
import { GalaxyMapSystemsSvg } from '../../src/galaxyMap/GalaxyMapSystemsSvg';
import { findShortestUnlockedSystemPath } from '../../src/galaxyMap/findShortestUnlockedSystemPath';
import { GalaxyMapContestedZoneRingOverlay } from '../../src/galaxyMap/GalaxyMapContestedZoneRingOverlay';
import {
  GalaxyMapSystemActionMenu,
  MENU_ITEM_HEIGHT,
  MENU_WIDTH,
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
  const localeRenderKey = useLocaleRenderKey();
  const { width } = useWindowDimensions();
  const player = usePlayerStore((s) => s.player);
  const moveToSystem = usePlayerStore((s) => s.moveToSystem);
  const landOnPlanet = usePlayerStore((s) => s.landOnPlanet);
  const persist = usePlayerStore((s) => s.persist);
  const spendCredits = usePlayerStore((s) => s.spendCredits);
  const { systems, selectedSystemId, selectSystem, markVisited, visitedSystemIds } = useWorldStore();
  const unlockedSystemIds = useWorldStore((s) => s.unlockedSystemIds);
  const synthColonizationPhaseByPlanetId = useWorldStore((s) => s.synthColonizationPhaseByPlanetId);

  const [showPanel, setShowPanel] = useState(false);
  const [shipTransit, setShipTransit] = useState<{
    from: { x: number; y: number };
    to: { x: number; y: number };
  } | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  const isMountedRef = useRef(true);
  const isFocusedRef = useRef(false);
  /** combat/planet replace 시 blur finalize 오작동 방지 */
  const worldmapInternalNavRef = useRef(false);
  /** 착륙·전투 진입 — GestureDetector unmount + 버튼 연타 차단 */
  const hubNavGate = useStageNavGate();

  const moveProgress = React.useRef(new RNAnimated.Value(0)).current;
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
  const handleNodeTapRef = useRef<(systemId: string) => void>(() => {});
  const handleMapTapAtRef = useRef(
    (_viewportX: number, _viewportY: number, _sx: number, _sy: number) => {},
  );
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
    teardownGalaxyMapScrollFromJs({ scrollX, scrollY, scrollAliveSv });
    runOnUI(() => {
      'worklet';
      isMovingSv.value = 0;
      cancelAnimation(isMovingSv);
    })();
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
    if (!hubNavGate.tryScheduleNavigate()) return;
    worldmapInternalNavRef.current = true;
    if (!hubNavGate.isLocked()) hubNavGate.tryBegin();

    markPlanetHubIngressReclaim({ invalidateMemoCaches: true });
    stopGalaxyMapInteractionLoops();
    if (transitAnimRef.current) {
      transitAnimRef.current.stop();
      transitAnimRef.current = null;
    }
    moveProgress.stopAnimation();
    moveProgress.setValue(0);
    setIsMoving(false);
    setShipTransit(null);
    setShowPanel(false);

    runStageNavAfterTeardown({
      teardown: () => releaseWorldmapSessionFloor({ reason: 'route_blur', anchorPlanetId }),
      navigate: () => router.replace('/(game)/planet'),
      isMounted: () => isMountedRef.current,
      drainMs: HUB_NAV_POST_TEARDOWN_DELAY_MS,
    });
  }, [hubNavGate, stopGalaxyMapInteractionLoops, moveProgress]);

  const navigateToCombatAfterTeardown = useCallback(() => {
    if (!hubNavGate.tryScheduleNavigate()) return;
    worldmapInternalNavRef.current = true;
    if (!hubNavGate.isLocked()) hubNavGate.tryBegin();

    stopGalaxyMapInteractionLoops();
    if (transitAnimRef.current) {
      transitAnimRef.current.stop();
      transitAnimRef.current = null;
    }
    moveProgress.stopAnimation();
    moveProgress.setValue(0);
    setIsMoving(false);
    setShipTransit(null);
    setShowPanel(false);

    runStageNavAfterTeardown({
      teardown: () => releaseWorldmapSessionFloor({
        reason: 'transit_combat_nav',
        anchorPlanetId: resolveWorldmapReleaseAnchorPlanetId(),
      }),
      navigate: () => router.replace('/(game)/combat'),
      isMounted: () => isMountedRef.current,
      drainMs: HUB_NAV_POST_TEARDOWN_DELAY_MS,
    });
  }, [hubNavGate, stopGalaxyMapInteractionLoops, moveProgress]);

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
        setShipTransit(null);
        moveProgress.setValue(0);
      };
    }, [moveProgress, armGalaxyMapScrollGestures, stopGalaxyMapInteractionLoops]),
  );

  /** worldmap 체류 PSS floor — 5분 주기 soft + deferred Fresco (transit 중 skip) */
  useFocusEffect(
    useCallback(() => {
      const intervalId = setInterval(() => {
        if (isMovingRef.current) return;
        const anchor = resolveWorldmapReleaseAnchorPlanetId();
        runGalaxyMapSoftNativeReclaimPass(
          'galaxy_map_periodic',
          resolveWorldmapKeepPlanetIds(anchor),
        );
      }, GALAXY_MAP_SOFT_RECLAIM_INTERVAL_MS);
      return () => clearInterval(intervalId);
    }, []),
  );

  /** 은하계 지도 이탈·백그라운드·비정상 종료 — 직전 허브 좌표 복원 후 persist */
  useFocusEffect(
    useCallback(() => {
      const appSub = AppState.addEventListener('change', (next) => {
        if (next === 'background' || next === 'inactive') {
          finalizeGalaxyMapSessionForExit({ persist: true });
        }
      });
      return () => {
        appSub.remove();
        if (worldmapInternalNavRef.current) {
          worldmapInternalNavRef.current = false;
          return;
        }
        const landed = usePlayerStore.getState().player?.currentPlanetId;
        if (!landed) {
          finalizeGalaxyMapSessionForExit({ persist: true });
        }
      };
    }, []),
  );

  const PANEL_H = 148;
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

  useFocusEffect(
    useCallback(() => {
      const transitReturn = pendingTransitCombatReturnRef.current;
      if (transitReturn) {
        setGalaxyLoadingMinHold(true);
      } else {
        setGalaxyLoadingMinHold(false);
      }
      const t = transitReturn
        ? null
        : setTimeout(() => setGalaxyLoadingMinHold(true), GALAXY_MAP_LOADING_MIN_MS);
      return () => {
        if (t) clearTimeout(t);
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
      setShipTransit(null);
      moveProgress.setValue(0);
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
      moveProgress,
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
  const visibleSystemsList = useMemo(
    () => systemsList.filter((s) => {
      if (!s.id.startsWith('synth_')) return true;
      if (isLegacyVisibleSynth(s.id)) return true;
      if (isExpansionGatewaySynth(s.id)) return true;
      return unlockedSystemIds.includes(s.id);
    }),
    [systemsList, isLegacyVisibleSynth, isExpansionGatewaySynth, unlockedSystemIds],
  );
  const contestedPreviewSystemIds = useContestedZonePreviewSystemIds(true);
  const contestedVisibleSystems = useMemo(
    () => visibleSystemsList.filter((s) => contestedPreviewSystemIds.has(s.id)),
    [visibleSystemsList, contestedPreviewSystemIds],
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
    const unregisterTiles = registerGalaxyMapDeferredTileReset(() => {
      setLoadedDeferredTileCount(1);
    });
    const unregisterPresentation = registerGalaxyMapPresentationReset(() => {
      scrollGesturesArmedRef.current = false;
      setMapInteractionReady(false);
      setShowPanel(false);
      setShipTransit(null);
      setIsMoving(false);
      moveProgress.setValue(0);
      setLoadedDeferredTileCount(1);
    });
    return () => {
      unregisterTiles();
      unregisterPresentation();
    };
  }, [moveProgress]);
  const prevWorldmapSystemIdRef = useRef<string | null>(null);
  useEffect(() => {
    const cur = player?.currentSystemId ?? null;
    const prev = prevWorldmapSystemIdRef.current;
    if (prev && cur && prev !== cur) {
      releaseWorldmapSessionFloor({
        reason: 'system_change',
        previousSystemId: prev,
      });
      // 성계 전환 직후 스크롤·제스처 gate 복구 — presentation reset 없이 gate만 빠진 경우 대비
      if (isFocusedRef.current && !scrollGesturesArmedRef.current) {
        armGalaxyMapScrollGestures();
      }
    }
    if (cur) prevWorldmapSystemIdRef.current = cur;
  }, [player?.currentSystemId, armGalaxyMapScrollGestures]);
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
        text: t(meta.textKey),
        color: meta.color,
      });
    }
    return out;
  }, [systems, toScreen, triggerSystemIdsByDirection, t]);

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
      pendingScrollTargetRef.current = { x: target.x, y: target.y };
      if (scrollGesturesArmedRef.current && isFocusedRef.current) {
        runScrollTargetOnUi(target.x, target.y);
      }
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
    runScrollTargetOnUi,
  ]);

  useEffect(() => {
    if (!mapMetricsReady) return;
    maxScrollX.value = Math.max(0, mapContentSize.cw - mapLayout.w);
    maxScrollY.value = Math.max(0, mapContentSize.ch - mapLayout.h);
    if (scrollGesturesArmedRef.current && isFocusedRef.current) {
      runGalaxyMapScrollClampOnUi(scrollX, scrollY, savedScrollX, savedScrollY, maxScrollX, maxScrollY);
    }
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
    savedScrollX,
    savedScrollY,
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

  const selectedSystem = useMemo(() => {
    if (!selectedSystemId) return null;
    return resolveCoreOpenStarSystem(selectedSystemId) ?? systems[selectedSystemId] ?? null;
  }, [selectedSystemId, systems, unlockedSystemIds, synthColonizationPhaseByPlanetId]);
  const planetHolds = useClanWarFoundationStore((s) => s.planetHolds);
  const occupierClanIdBySystemId = useMemo(() => {
    const out: Record<string, string | undefined> = {};
    for (const sys of visibleSystemsList) {
      const p0 = sys.planets[0];
      if (!p0) continue;
      const occupier = resolveEffectiveMapOccupierClanId(p0.id, planetHolds[p0.id]);
      if (!occupier) continue;
      out[sys.id] = occupier;
    }
    return out;
  }, [visibleSystemsList, planetHolds]);

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

  const territoryVoronoiModel = useMemo(
    () =>
      computeGalaxyMapTerritoryVoronoiModel({
        systems: visibleSystemsList,
        occupierClanIdBySystemId,
        mapBounds: territoryMapBounds,
        toScreen,
      }),
    [visibleSystemsList, occupierClanIdBySystemId, territoryMapBounds, toScreen],
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
  const currentSystem = player ? systems[player.currentSystemId] : null;
  const galaxyCurrent = player ? systems[player.currentSystemId] : undefined;
  const reachableIds =
    galaxyCurrent?.connections.filter((id) => unlockedSet.has(id)) ?? [];

  const routePreviewSystemIds = useMemo(() => {
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
  }, [player?.currentSystemId, selectedSystemId, systems, unlockedSystemIds]);

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
    });
  }, [player?.ship, selectedMovePath, systems]);

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
      visibleSystemsList.map((sys) => {
        const pos = toScreen(sys.position);
        return { id: sys.id, x: pos.x, y: pos.y };
      }),
    [visibleSystemsList, toScreen],
  );

  const handleMapTapAt = useCallback((viewportX: number, viewportY: number, sx: number, sy: number) => {
    if (isMovingRef.current) return;
    const cx = viewportX + sx;
    const cy = viewportY + sy;
    const menuRect = activeMenuRectRef.current;
    // 메뉴 영역 탭 — Gesture.Tap이 RN TouchableOpacity보다 먼저 승리하므로 여기서 행 dispatch
    if (
      menuRect
      && cx >= menuRect.left
      && cx <= menuRect.right
      && cy >= menuRect.top
      && cy <= menuRect.bottom
    ) {
      const localY = cy - menuRect.top;
      const index = Math.floor(localY / MENU_ITEM_HEIGHT);
      dispatchMenuItemByIndexRef.current(index);
      return;
    }
    let bestId: string | null = null;
    let bestDist = NODE_HIT_R + 1;
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
      if (dist <= NODE_HIT_R && dist < bestDist) {
        bestDist = dist;
        bestId = t.id;
      }
    }
    if (bestId) handleNodeTapRef.current(bestId);
  }, []);

  useLayoutEffect(() => {
    isMovingRef.current = isMoving;
    touchTargetsRef.current = touchTargets;
    handleNodeTapRef.current = handleNodeTap;
    handleMapTapAtRef.current = handleMapTapAt;
  }, [isMoving, touchTargets, handleNodeTap, handleMapTapAt]);

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
      if (!mapMetricsReady) return;
      if (isMovingRef.current) return;

      const finalSystemId = pathSystemIds[pathSystemIds.length - 1]!;
      const targetSystem = systems[finalSystemId];
      if (!targetSystem) return;

      isMovingRef.current = true;
      setIsMoving(true);
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
      }

        let allFinished = true;
        for (let hop = 0; hop < pathSystemIds.length - 1; hop += 1) {
          const fromSystem = systems[pathSystemIds[hop]!];
          const hopTarget = systems[pathSystemIds[hop + 1]!];
          if (!fromSystem || !hopTarget) {
            allFinished = false;
            break;
          }

          const from = toScreen(fromSystem.position);
          const to = toScreen(hopTarget.position);
          setShipTransit({ from, to });
          moveProgress.stopAnimation();
          moveProgress.setValue(0);

          let finished = false;
          const transitToken = ++transitWaitTokenRef.current;
          try {
            const anim = RNAnimated.timing(moveProgress, {
              toValue: 1,
              duration: SHIP_TRANSIT_DURATION_MS,
              easing: Easing.linear,
              useNativeDriver: false,
            });
            transitAnimRef.current = anim;
            anim.start();
            finished = await new Promise<boolean>((resolve) => {
              abortTransitWaitRef.current = { token: transitToken, resolve };
              transitFallbackTimerRef.current = setTimeout(() => {
                const pending = abortTransitWaitRef.current;
                if (pending?.token !== transitToken) return;
                settleTransitWait(true);
              }, SHIP_TRANSIT_DURATION_MS + 40);
            });
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

          if (!finished || !isMountedRef.current || !isFocusedRef.current) {
            allFinished = false;
            break;
          }
        }

        if (isMountedRef.current) {
          setShipTransit(null);
        }

        if (!allFinished || !isMountedRef.current || !isFocusedRef.current) return;

        const missionState = useMissionStore.getState();
        const missionProgresses = missionState.progresses;
        const encounterChance = resolveTransitEncounterChance(
          targetSystem.zone,
          hasPrimaryActiveCombatMission(missionProgresses, missionState.activeMissionId),
          missionProgresses,
          missionState.activeMissionId,
        );

        if (Math.random() < encounterChance && isPlayerShipCombatCapable(player.ship)) {
          useTransitCombatSessionStore.getState().begin({
            originSystemId: pathSystemIds[0]!,
            destinationSystemId: targetSystem.id,
          });
          selectSystem(targetSystem.id);
          navigateToCombatAfterTeardown();
          return;
        }

        moveToSystem(targetSystem.id);
        for (let i = 1; i < pathSystemIds.length; i += 1) {
          markVisited(pathSystemIds[i]!);
        }

        const playerAfterMove = usePlayerStore.getState().player;
        if (playerAfterMove) {
          applyReachSystemMissionObjectives(targetSystem.id, playerAfterMove, {
            deliverFailTitle: t('worldmap.deliverFailTitle'),
            deliverFailBody: t('worldmap.deliverFailBody'),
          });
          tryPresentPendingMissionClearDialog();
        }

        await persist();
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
        if (isMountedRef.current) setIsMoving(false);
      }
    },
    [
      player,
      systems,
      toScreen,
      moveProgress,
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
    if (isMovingRef.current || isMoving || hubNavGate.isLocked()) return;

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
        if (!isMountedRef.current) return;
        navigateToPlanetHubAfterTeardown(planet?.id ?? null);
      } catch {
        hubNavGate.reset();
      }
      return;
    }

    if (!selectedMovePath || selectedMovePath.length < 2) {
      showArcAlert(t('worldmap.moveBlockedTitle'), t('worldmap.moveBlockedBody'));
      return;
    }

    const moveFuelQuote = computeGalaxyTransitFuelQuote({
      systems,
      pathSystemIds: selectedMovePath,
      ship: player.ship,
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

  const handleCombat = useCallback(async (): Promise<void> => {
    if (!selectedSystem || !player) return;
    if (isMoving || hubNavGate.isLocked()) return;
    if (selectedSystem.id !== player.currentSystemId) return;
    const planet = selectedSystem.planets[0];
    if (!planet || !isRedOccupiedPlanet(planet.id)) return;

    if (!hubNavGate.tryBegin()) return;
    try {
      landOnPlanet(planet.id);
      await persist();
      if (!isMountedRef.current) return;
      navigateToCombatAfterTeardown();
    } catch {
      hubNavGate.reset();
    }
  }, [
    selectedSystem,
    player,
    isMoving,
    hubNavGate,
    landOnPlanet,
    persist,
    navigateToCombatAfterTeardown,
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
    && isRedOccupiedPlanet(selectedPrimaryPlanet.id);

  const primaryNavDisabled =
    hubNavGate.pending
    || isMoving
    || (isAtSelectedSystem && !!selectedPlanetStayBlock)
    || (!isAtSelectedSystem
      && (!selectedMovePath || selectedMovePath.length < 2 || !canAffordSelectedFuel));

  const primaryNavLabel = hubNavGate.pending
    ? t('worldmap.btn.landing')
    : isMoving
      ? t('worldmap.btn.moving')
      : isAtSelectedSystem
        ? t('worldmap.dropdown.land')
        : t('worldmap.dropdown.move');

  const systemActionMenuItems = useMemo((): GalaxyMapSystemActionMenuItem[] => [
      {
        key: 'nav',
        label: primaryNavLabel,
        disabled: primaryNavDisabled,
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
        onPress: () => dispatchMenuItemByIndexRef.current(2),
      },
    ],
    [
      primaryNavLabel,
      primaryNavDisabled,
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
    if (!showPanel || !selectedSystem || !selectedSystemMenuPlacement) {
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
    dispatchMenuItemByIndexRef.current = dispatchMenuItemByIndex;
  }, [systemActionMenuItems, handleMove, handlePlanetInfo, handleCombat, dispatchMenuItemByIndex]);

  if (!player) return null;

  return (
    <StageShell
      routeName="worldmap"
      background="none"
      edges={['bottom']}
      safeAreaBackgroundColor={COLORS.bg_primary}
      key={localeRenderKey}
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
                <Svg
                  width={mapContentSize.cw}
                  height={mapContentSize.ch}
                  pointerEvents="none"
                >
                  <GalaxyMapTerritoryVoronoiSvg
                    fills={territoryVoronoiModel.fills}
                    paths={territoryVoronoiModel.paths}
                  />
                  <GalaxyMapSystemsSvg
                    systems={visibleSystemsList}
                    systemById={systems}
                    currentId={player.currentSystemId}
                    selectedId={selectedSystemId ?? ''}
                    routePreviewSystemIds={routePreviewSystemIds}
                    visitedIds={visitedSystemIds}
                    reachableIds={reachableIds}
                    unlockedIds={unlockedSystemIds}
                    clanOwnerColorBySystemId={clanOwnerColorBySystemId}
                    toScreen={toScreen}
                    locale={locale}
                  />
                  <GalaxyMapTerritoryOccupationLabelsSvg
                    labels={territoryVoronoiModel.occupationLabels}
                    nationLabelBySide={territoryNationLabels}
                  />
                </Svg>
                <GalaxyMapContestedZoneRingOverlay
                  systems={contestedVisibleSystems}
                  currentSystemId={player.currentSystemId}
                  toScreen={toScreen}
                  animActive={galaxyMapStageReady}
                />
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
                {showPanel && selectedSystem && selectedSystemMenuPlacement ? (
                  <GalaxyMapSystemActionMenu
                    anchorX={selectedSystemMenuPlacement.x}
                    anchorY={selectedSystemMenuPlacement.y}
                    side={selectedSystemMenuPlacement.side}
                    items={systemActionMenuItems}
                  />
                ) : null}
              </Animated.View>
            </View>
          </GestureDetector>
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

      {showPanel && selectedSystem ? (
        <View style={[styles.panel, { height: PANEL_H }]}>
          <View style={styles.panelHeader}>
            <View>
              <Text style={styles.panelSystemName}>
                {resolveStarSystemDisplayName(selectedSystem, locale)}
              </Text>
              <Text style={[styles.panelZone, { color: ZONE_COLORS[selectedSystem.zone] ?? COLORS.ink_mid }]}>
                {t('worldmap.panel.zoneLine', {
                  zone: resolvePlanetZoneDisplayLabel(
                    selectedSystem.planets[0]?.id ?? '',
                    selectedSystem.zone,
                    t,
                    clanWarClans,
                  ),
                  level: selectedSystem.enemyLevel,
                })}
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
            {resolveStarSystemDescription(selectedSystem, locale)}
          </Text>
          {panelPrimaryPlanetClanLine ? (
            <Text style={styles.panelClanLine} numberOfLines={2}>
              {panelPrimaryPlanetClanLine}
            </Text>
          ) : null}
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
  panelClanLine: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: TH.pilotLabelInk,
    lineHeight: 16,
    marginBottom: SPACING.sm,
  },
  panelActions: { marginTop: SPACING.xs },
  panelReachable: { fontFamily: FONTS.mono, fontSize: FONTS.size.sm, color: TH.pilotLabelInk },
  panelHint: { fontFamily: FONTS.mono, fontSize: FONTS.size.sm, color: TH.miningSummaryInk },
});

registerDevHotModuleDisposeGuard('galaxy_map');
