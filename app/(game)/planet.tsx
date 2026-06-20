// ============================================================
// 아크파이어 온라인 - 행성 허브 화면
// ============================================================

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity,
  ScrollView, useWindowDimensions,
  AppState,
} from 'react-native';
import Animated, {
  type SharedValue,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import { router, useFocusEffect, useNavigation, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS, FONTS, SPACING, ZONE_COLORS } from '../../src/utils/theme';
import { formatCredits } from '../../src/utils/formatCredits';
import { formatGemBalance, resolvePlayerGemBalance } from '../../src/bm/bmWalletDisplay';
import { showArcAlert } from '../../src/utils/showArcAlert';
import type { StarSystem } from '../../src/types';
import { usePlayerStore } from '../../src/store/playerStore';
import { useWorldStore } from '../../src/store/worldStore';
import { useMissionStore } from '../../src/store/missionStore';
import { useItemLedgerStore } from '../../src/store/itemLedgerStore';
import { useAccountProfileStore } from '../../src/store/accountProfileStore';
import { useSkillDbStore } from '../../src/store/skillDbStore';
import { useClanWarFoundationStore } from '../../src/store/clanWarFoundationStore';
import { usePlanetCoreRuntimeStore } from '../../src/store/planetCoreRuntimeStore';
import { useMenuNotificationStore } from '../../src/store/menuNotificationStore';
import { useArcNpcTrafficStore, type ArcNpcTrafficShip } from '../../src/store/arcNpcTrafficStore';
import { useArcInboundDroneStore } from '../../src/store/arcInboundDroneStore';
import { registerPlanetOrbitClockMs } from '../../src/arcCore/orbitClockMsBridge';
import {
  publishArcInboundDroneHubBridge,
  resetArcInboundDroneHubBridge,
} from '../../src/arcCore/inboundDrone/arcInboundDroneHubBridge';
import { resetHubInboundDroneDodgeBridge } from '../../src/arcCore/inboundDrone/hubInboundDroneDodgeBridge';
import { resolveMainStageCombatEnabled } from '../../src/arcCore/planetBalance/planetZoneIndexRegistry';
import { releasePlanetMainStageSession } from '../../src/game/planetMainStageSession';
import { registerPlanetSessionResource } from '../../src/game/planetSessionRegistry';
import { usePlanetStageSession } from '../../src/game/usePlanetStageSession';
import { buildCsvStaticIndexesFull } from '../../src/game/buildCsvStaticIndexes';
import { markBootPerf } from '../../src/game/bootPerformance';
import {
  PlanetCapitalCombatRoot,
  PlanetCapitalCombatPreloader,
  PlanetCapitalCombatHeavySlot,
} from '../../src/game/planetCapitalCombatIntegration';
import type { CapitalRealtimeCombatSim } from '../../src/combat/capitalRealtimeTypes';
import { isPlayerShipCombatCapable } from '../../src/game/playerSurvivalPod';
import { releasePlanetHubStageMemory } from '../../src/game/stageMemoryRelease';
import { ackDevMetroReloadMount } from '../../src/game/devMetroReloadGuard';
import { useStageMemory } from '../../src/hooks/useStageMemory';
import { usePlanetStageLifecycleStore } from '../../src/game/planetStageLifecycle';
import { resetPlanetHubNavigationThrottle } from '../../src/navigation/safePlanetHubNavigate';
import {
  computeTableNpcOrbitXY,
  jsArcNpcDistanceFromCenter,
  jsTableNpcDistanceFromCenter,
  packArcNpcShipsToFloat32,
} from '../../src/components/planet/planetOrbitHubWorklets';
import { QuestHUD } from '../../src/components/QuestHUD';
import { StageLoadingOverlay } from '../../src/components/StageLoadingOverlay';
import { useArcNarrativeOverlay } from '../../src/ui/overlay/useArcNarrativeOverlay';
import type { ArcNarrativeOverlayConfig } from '../../src/ui/overlay/useArcNarrativeOverlay';
import { StageShell } from '../../src/stages/StageShell';
import {
  getPlanetMainStageVerticalMetrics,
  getPlanetMainStageBackgroundScale,
  PLANET_MAIN_BACKGROUND_CLAN_PLATE_AFTER_NAME_GAP_PX,
  PLANET_MAIN_BACKGROUND_CLAN_PLATE_OFFSET_X_PX,
  PLANET_MAIN_BACKGROUND_CLAN_PLATE_OFFSET_Y_PX,
  PLANET_MAIN_BACKGROUND_CLAN_PLATE_SLOT_HEIGHT_PX,
  PLANET_MAIN_BACKGROUND_SYSTEM_BADGE_BLOCK_EST_PX,
  PLANET_MAIN_BACKGROUND_SYSTEM_NAME_MIN_HEIGHT_PX,
  PLANET_MAIN_BOTTOM_DOCK_BASE_PX,
  PLANET_MAIN_BOTTOM_DOCK_WITH_SCAN_EST_PX,
  PLANET_MAIN_BOTTOM_FEATURE_RESERVE_PX,
  PLANET_MAIN_FOREGROUND_TOP_CHROME_LIFT_PX,
  PLANET_MAIN_ORBIT_SCENE_SIZE as ORBIT_SCENE_SIZE,
  PLANET_MAIN_TOPBAR_BORDER_BOTTOM_PX,
  PLANET_MAIN_TOPBAR_ICON_BORDER_RADIUS,
  PLANET_MAIN_TOPBAR_ICON_BUTTON_PX,
  PLANET_MAIN_TOPBAR_PADDING_HORIZONTAL,
  PLANET_MAIN_TOPBAR_PADDING_VERTICAL,
} from '../../src/stages/planetMainStageLayout';
import {
  mergeArcShipsIntoNearbyHubPresence,
  resolvePlanetNearbyPresence,
} from '../../src/npc';
import { isArcCorePricedMineral } from '../../src/arcCore/economy/mineralTradePricing';
import { resolvePlanetDisplayPrimaryMineralId } from '../../src/arcCore/economy/mineralMiningDropPolicy';
import { ORBIT_MINING_CYCLE_MS, ORBIT_MINING_REWARD_GOOD_ID } from '../../src/game/miningConfig';
import { planetHasMineableOrbitalDeposits } from '../../src/world/mineralDepositModel';
import { listPlanetWorldObjects } from '../../src/worldObjects';
import { tryCompleteDefenseSatelliteUpgrade } from '../../src/systems/planetaryDefense/planetDefenseSatelliteDevelopment';
import { tryCompleteOrbitShipyardUpgrade } from '../../src/game/planetDevelopment/planetOrbitShipyardDevelopment';
import {
  createInitialMiningSessionState,
  flushMiningPlayerPersist,
  scheduleMiningPlayerPersist,
  startMiningSession,
  teardownPlanetHubMiningPresentation,
  useMiningDriver,
  type MiningSessionState,
  type PlanetHubMiningTeardownReason,
} from '../../src/systems/mining';
import { STORY_SCENES_FROM_CSV } from '../../src/data/generated/csvStoryScenes';
import { getNpcCaptain } from '../../src/npc/npcFleetRegistry';
import { resolveTempClanColor } from '../../src/clanWar/tempClanColors';
import { getCurrentUser } from '../../src/firebase/auth';
import { requestLocalAccountResetFromPlanetHub, isAccountResetInProgress } from '../../src/account/localAccountReset';
import { resolveNpcCaptainPortraitSource } from '../../src/game/npcCaptainPortraitAssets';
import { countGoodInInventory } from '../../src/game/playerInventory';
import { buildPlanetHubFeatureMenuItems } from '../../src/systems/planetHub/planetHubFeatureSystems';
import { PlanetHubFeatureMenuRow } from '../../src/components/planet/PlanetHubFeatureMenuRow';
import { PlanetMainScanActionRow } from '../../src/components/planet/PlanetMainScanActionRow';
import { PlanetMainPilotInfoPanel } from '../../src/components/planet/PlanetMainPilotInfoPanel';
import {
  collectPlanetHubCaptainIds,
  resolvePlanetHubNpcDialogSceneId,
} from '../../src/game/planetHubNpcDialog';
import { formatSalvageLootLabel, pickSalvageLootItemId } from '../../src/game/planetSalvageSearch';
import { NearbyShipInfoPanel, PlanetStageBackground } from '../../src/components/planet/planetHub/planetHubSubcomponents';
import { planetHubStyles as styles } from '../../src/components/planet/planetHub/planetHubStyles';
import {
  EDEN_COMBAT_HUD_BLOCK_PX,
  formatPilotExp8,
  hasEnemyFleetEnteredPlanetOrbit,
  NPC_ORBIT_CYCLE_MS,
  ORBIT_FLAT_STRIDE,
  ORBIT_FRAME_DT_MAX_MS,
  orbitCaptainCaptionFromLine,
  orbitLabelHead3,
  PLANET_MAIN_STANCE_ROW_HEIGHT_EST_PX,
  resolvePlanetBattleReadyDurationMs,
  splitStoryTextByMaxLines,
} from '../../src/game/planetHub/planetHubConstants';
import { usePlanetHubBattleReady } from '../../src/game/planetHub/usePlanetHubBattleReady';
import { useWaveDefenseStore } from '../../src/game/waveDefense/waveDefenseStore';
import { useWaveDefenseController } from '../../src/game/waveDefense/useWaveDefenseController';
import { WAVE_DEFENSE_MAX_WAVES } from '../../src/game/waveDefense/waveDefenseFleet';
import { presentWaveResultOverlay, presentSettingsOverlay, presentBmShopOverlay } from '../../src/ui/overlay/showArcOverlay';
import { useAppSettingsStore } from '../../src/store/appSettingsStore';
import { useT } from '../../src/i18n';
import { resolveStoryPageText, resolveStoryPageLabel } from '../../src/i18n/storyText';
import { usePlanetHubInfoDistanceSort } from '../../src/game/planetHub/usePlanetHubInfoDistanceSort';
import { usePlanetHubInterval } from '../../src/game/planetHub/usePlanetHubInterval';
import {
  buildHubTrafficPresenceRows,
  HUB_ORBIT_TRAFFIC_CYCLE_MS,
  HUB_ORBIT_TRAFFIC_MAX_ACTIVE,
  seedHubOrbitTraffic,
  startHubOrbitTrafficSession,
  tickHubOrbitTraffic,
} from '../../src/game/hubOrbitTrafficSession';
import {
  applyPlanetHubOrbitRenderBudget,
  capHubOrbitPresenceByRenderPriority,
} from '../../src/game/planetHubOrbitRenderBudget';
import {
  isPlanetHubResearchLabEnabled,
  isPlanetHubShipyardEnabled,
  isPlanetHubTavernEnabled,
  isPlanetHubTradePortEnabled,
} from '../../src/game/planetDevelopment/planetHubFacilityGates';


export default function PlanetScreen() {
  const player = usePlayerStore(s => s.player);
  const t = useT();
  const appLocale = useAppSettingsStore(s => s.locale);
  const playerHydrated = usePlayerStore(s => s.hydrated);
  const getSystem = useWorldStore(s => s.getSystem);
  const { width: windowWidth, height: windowHeight, fontScale } = useWindowDimensions();
  const safeAreaInsets = useSafeAreaInsets();
  const setPlayer = usePlayerStore(s => s.setPlayer);
  const addInventoryItem = usePlayerStore(s => s.addInventoryItem);
  const recordOrbitalMiningDelivery = usePlayerStore(s => s.recordOrbitalMiningDelivery);
  const persist = usePlayerStore(s => s.persist);
  const setMenuBadge = useMenuNotificationStore(s => s.setBadge);
  const clearMenuBadge = useMenuNotificationStore(s => s.clearBadge);
  const hasTradeMenuBadge = useMenuNotificationStore(s => Boolean(s.badges.trade));
  const hasQuestHud = useMissionStore(s => !!s.getActiveMission());
  const mainStageVertical = useMemo(
    () =>
      getPlanetMainStageVerticalMetrics({
        windowHeight,
        windowWidth,
        fontScale,
        hasQuestHud,
      }),
    [windowHeight, windowWidth, fontScale, hasQuestHud],
  );
  const planetStageReservePx = mainStageVertical.stageReservePx;
  const planetStageScale = useMemo(
    () => getPlanetMainStageBackgroundScale(windowWidth, windowHeight),
    [windowWidth, windowHeight],
  );
  const navigation = useNavigation();
  const [isPlanetRouteFocused, setIsPlanetRouteFocused] = useState(() => navigation.isFocused());
  const [appStateActive, setAppStateActive] = useState(() => AppState.currentState === 'active');
  const [miningSession, setMiningSession] = useState<MiningSessionState>(() => createInitialMiningSessionState());
  const miningSessionRef = useRef<MiningSessionState>(createInitialMiningSessionState());
  const [miningUiNowMs, setMiningUiNowMs] = useState(() => Date.now());
  const applyMiningTeardownRef = useRef<(reason: PlanetHubMiningTeardownReason) => void>(() => {});
  applyMiningTeardownRef.current = (reason) => {
    const { session, uiNowMs } = teardownPlanetHubMiningPresentation(reason);
    miningSessionRef.current = session;
    setMiningSession(session);
    setMiningUiNowMs(uiNowMs);
  };
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      const active = next === 'active';
      setAppStateActive(active);
      if (!active) {
        flushMiningPlayerPersist();
      }
    });
    return () => sub.remove();
  }, []);

  /** Phase 2: 메인스테이지 라이프사이클(Active/Suspending/Frozen/Resuming) 단일 진입점. */
  const stageSession = usePlanetStageSession();
  /**
   * 성운 셰이더·허브 궤도 Skia·Reanimated 궤도 시계 공통 게이트.
   * 출발 직후 lifecycle≠active 동안 Skia만 계속 돌면 전투 dispose 와 레이스(SIGSEGV).
   * 백그라운드에서도 Skia·궤도 rAF 유지 시 네이티브 크래시 — appStateActive 와 AND.
   */
  const planetStageSkiaActive = isPlanetRouteFocused && stageSession.isActive && appStateActive;
  /** 출발 시점에 전투 sim 스냅샷을 동기 캡처하기 위한 *바인더 내부* sim 참조 — `<CombatSimRefBridge/>`가 채운다. */
  const combatSimRef = useRef<CapitalRealtimeCombatSim | null>(null);

  useFocusEffect(
    useCallback(() => {
      setIsPlanetRouteFocused(true);
      resetPlanetHubNavigationThrottle();
      /**
       * 메인 스테이지 진입 직전 세션 등록 — `1.arcfire_flowchart.md` §2-2
       */
      const pid = usePlayerStore.getState().player?.currentPlanetId ?? null;
      registerPlanetSessionResource({
        ownerId: 'planet_main_stage_hub',
        planetId: pid,
        dispose: () => {},
      });
      /**
       * 출발 후 귀환 또는 시설에서 back 으로 복귀 시 frozen/suspending → resuming → active 자동 전이.
       * 의존성을 `[]` 로 고정하기 위해 store 의 stable action 을 getState() 로 직접 호출.
       */
      usePlanetStageLifecycleStore.getState().beginResume();
      ackDevMetroReloadMount();
      return () => {
        setIsPlanetRouteFocused(false);
        flushMiningPlayerPersist();
        const blurPid = usePlayerStore.getState().player?.currentPlanetId ?? null;
        releasePlanetMainStageSession({ reason: 'route_blur', previousPlanetId: blurPid });
      };
    }, []),
  );

  useEffect(() => {
    miningSessionRef.current = miningSession;
  }, [miningSession]);

  /** 착륙 행성 id — store 순간 공백·fallback planets[0] 로 id 가 바뀌면 useStageMemory·채굴이 초기화된다. */
  const hubPlanetIdRef = useRef<string | null>(null);
  const currentPlanetId = player?.currentPlanetId ?? null;
  if (currentPlanetId) {
    hubPlanetIdRef.current = currentPlanetId;
  }
  const resolvedPlanetId = currentPlanetId ?? hubPlanetIdRef.current;

  const system = player ? getSystem(player.currentSystemId) : undefined;
  const planet =
    resolvedPlanetId && system
      ? system.planets.find((p) => p.id === resolvedPlanetId) ?? null
      : null;

  useStageMemory(
    'planet_main_stage_hub',
    () => {
      buildCsvStaticIndexesFull();
    },
    () => {
      const pid = usePlayerStore.getState().player?.currentPlanetId ?? null;
      releasePlanetHubStageMemory(pid);
    },
  );

  const prevMainStagePlanetIdRef = useRef<string | null>(null);
  useEffect(() => {
    const cur = player?.currentPlanetId ?? null;
    const prev = prevMainStagePlanetIdRef.current;
    if (prev !== null && cur !== null && prev !== cur) {
      releasePlanetMainStageSession({ reason: 'planet_change', previousPlanetId: prev });
    }
    if (cur) {
      prevMainStagePlanetIdRef.current = cur;
    }
  }, [player?.currentPlanetId]);
  /**
   * 출발·시설 공통 — 진행 중인 채굴·전투 스냅샷 후 lifecycle suspend → frozen 뒤 navigate.
   * 무역소·조선소 등 즉시 push 만 하면 메인스테이지 Skia·sim 과 신규 화면 첫 mount 가 겹쳐 크래시가 날 수 있어
   * 출발(은하지도)과 동일한 직렬화를 탄다.
   */
  const beginPlanetHubSuspendingNavigation = useCallback((navigate: () => void) => {
    const now = Date.now();
    applyMiningTeardownRef.current('hub_navigation');

    const sim = combatSimRef.current;
    if (sim) sim.captureSuspendSnapshot(now);

    /**
     * 의존성 [] 고정용 — store action 은 stable. lifecycle 이 'active' 가 아니면 beginSuspend 가
     * 자동 무시(idempotent), 5초 안전망이 반드시 active 로 복귀시키므로 영구 lock 없음.
     */
    usePlanetStageLifecycleStore.getState().beginSuspend(navigate);
  }, []);

  /**
   * 출발(은하계 지도) — `Navigation.replace()`로 스택 누적 방지 (`1.arcfire_flowchart.md` §4-1)
   */
  const handleDeparture = useCallback(() => {
    beginPlanetHubSuspendingNavigation(() => router.replace('/(game)/worldmap'));
  }, [beginPlanetHubSuspendingNavigation]);

  const onFacilityNavigate = useCallback(
    (href: Href) => {
      beginPlanetHubSuspendingNavigation(() => router.push(href));
    },
    [beginPlanetHubSuspendingNavigation],
  );

  /** dev 설치·CSV 월드 플래그 변경 시 메뉴 게이트 재계산 (SUB-STAGE 게이트와 동일 정본) */
  const hubFacilityDevRev = usePlanetCoreRuntimeStore((s) => {
    const pid = resolvedPlanetId;
    if (!pid) return '';
    return JSON.stringify(s.byPlanetId[pid]?.detail?.development?.byModuleId ?? null);
  });
  const featureMenuPlanet = useMemo(() => {
    if (!planet) return planet;
    const pid = resolvedPlanetId ?? planet.id;
    return {
      ...planet,
      hasShipyard: isPlanetHubShipyardEnabled(pid),
      hasTradePort: isPlanetHubTradePortEnabled(pid),
      hasResearchLab: isPlanetHubResearchLabEnabled(pid),
      hasTavern: isPlanetHubTavernEnabled(pid),
    };
  }, [planet, resolvedPlanetId, hubFacilityDevRev]);

  const featureMenuItems = useMemo(
    () => buildPlanetHubFeatureMenuItems({
      planet: featureMenuPlanet,
      hasTradeBadge: hasTradeMenuBadge,
      clearTradeBadge: () => clearMenuBadge('trade'),
      push: router.push,
      onFacilityNavigate,
      onDeparture: handleDeparture,
    }, t),
    [featureMenuPlanet, hasTradeMenuBadge, clearMenuBadge, handleDeparture, onFacilityNavigate, t],
  );
  const arcNpcCaptainsSnap = useArcNpcTrafficStore((s) => s.captains);
  const arcNpcShipsSnap = useArcNpcTrafficStore((s) => s.ships);
  const arcNpcShipsAtPlanet = useMemo(() => {
    const pid = planet?.id;
    if (!pid) return [];
    const out: typeof arcNpcShipsSnap = [];
    for (const sh of arcNpcShipsSnap) {
      if (sh.planetId === pid) out.push(sh);
    }
    out.sort((a, b) => a.id.localeCompare(b.id));
    return out;
  }, [arcNpcShipsSnap, planet?.id]);

  const arcInboundDronesSnap = useArcInboundDroneStore((s) => s.drones);
  const arcInboundDronesAtPlanet = useMemo(() => {
    const pid = planet?.id;
    if (!pid) return [];
    const out: typeof arcInboundDronesSnap = [];
    for (const d of arcInboundDronesSnap) {
      if (d.planetId !== pid) continue;
      if (d.phase === 'inbound' || d.phase === 'destroyed' || d.phase === 'impacted') {
        out.push(d);
      }
    }
    return out;
  }, [arcInboundDronesSnap, planet?.id]);

  /** 웨이브 디펜스 활성(이 행성) — 전투 활성 게이트 우회 + Wave UI */
  const waveDefenseActiveHere = useWaveDefenseStore(
    (s) => s.active && s.planetId === (planet?.id ?? null),
  );
  const waveDefenseWaveIndex = useWaveDefenseStore((s) => s.waveIndex);
  /** 적팀(red/orange) 진입 + balance CSV `mainStageCombatEnabled` 게이트, 또는 웨이브 디펜스 활성 */
  const enemyFleetEntered = Boolean(
    player
    && planet
    && system
    && isPlayerShipCombatCapable(player.ship)
    && (
      (hasEnemyFleetEnteredPlanetOrbit(planet.id, system.id) && resolveMainStageCombatEnabled(planet.id))
      || waveDefenseActiveHere
    ),
  );
  const battleReadyDurationMs = useMemo(
    () => resolvePlanetBattleReadyDurationMs(planet?.id),
    [planet?.id],
  );
  const {
    battleReadyBlinkOn,
    battleReadyVisible,
    battleReadyCounterSec,
    capitalCombatOrbitActive,
  } = usePlanetHubBattleReady({
    planetId: planet?.id ?? null,
    enemyFleetEntered,
    battleReadyDurationMs,
    isPlanetRouteFocused,
    appStateActive,
    stageSessionActive: stageSession.isActive,
  });
  const capitalCombatOrbitPaused = !isPlanetRouteFocused || !appStateActive;

  useEffect(() => {
    if (!planet?.id || !system?.id) {
      resetArcInboundDroneHubBridge();
      resetHubInboundDroneDodgeBridge();
      return;
    }
    publishArcInboundDroneHubBridge({
      planetId: planet.id,
      systemId: system.id,
      hubCombatActive: capitalCombatOrbitActive,
      routeFocused: isPlanetRouteFocused,
      appActive: appStateActive,
      stageSessionActive: stageSession.isActive,
    });
    return () => {
      resetArcInboundDroneHubBridge();
      resetHubInboundDroneDodgeBridge();
    };
  }, [
    planet?.id,
    system?.id,
    capitalCombatOrbitActive,
    isPlanetRouteFocused,
    appStateActive,
    stageSession.isActive,
  ]);

  const defenseSatelliteRuntimeKey = usePlanetCoreRuntimeStore((s) => {
    const pid = planet?.id;
    if (!pid) return '';
    const detail = s.byPlanetId[pid]?.detail;
    const dev = detail?.development?.byModuleId?.defense_satellite ?? detail?.defenseSatellite;
    return JSON.stringify(dev ?? null);
  });

  /** 방위위성 업그레이드 — 오버레이 닫혀도 허브 체류 중 wall-clock 완료 */
  useEffect(() => {
    const pid = planet?.id;
    if (!pid || !isPlanetRouteFocused || !appStateActive || !stageSession.isActive) return undefined;
    const intervalId = setInterval(() => {
      tryCompleteDefenseSatelliteUpgrade(pid);
      tryCompleteOrbitShipyardUpgrade(pid);
    }, 2000);
    const token = registerPlanetSessionResource({
      ownerId: 'planet_defense_satellite_upgrade_tick',
      planetId: pid,
      dispose: () => clearInterval(intervalId),
    });
    return () => {
      clearInterval(intervalId);
      token.release();
    };
  }, [planet?.id, isPlanetRouteFocused, appStateActive, stageSession.isActive]);

  const planetWorldObjects = useMemo(
    () => (planet && system ? listPlanetWorldObjects({ planet, system }) : []),
    [planet, system, defenseSatelliteRuntimeKey],
  );
  const canOrbitalMine = useMemo(
    () => Boolean(planet && planetHasMineableOrbitalDeposits(planet.id)
      && planetWorldObjects.some((object) => object.kind === 'asteroid')),
    [planet, planetWorldObjects],
  );
  const activeMineableAsteroid = useMemo(
    () => planetWorldObjects.find((object) => object.kind === 'asteroid') ?? null,
    [planetWorldObjects],
  );
  const miningCycleProgressPct = useMemo(() => {
    if (miningSession.status !== 'running' || !miningSession.lastTickAtMs) return 0;
    const elapsed = Math.max(0, miningUiNowMs - miningSession.lastTickAtMs);
    const ratio = Math.max(0, Math.min(1, elapsed / ORBIT_MINING_CYCLE_MS));
    return Math.round(ratio * 100);
  }, [miningSession.lastTickAtMs, miningSession.status, miningUiNowMs]);
  const [planetScanActionsUnlocked, setPlanetScanActionsUnlocked] = useState(false);
  const prevScanPlanetIdRef = useRef<string | null>(null);
  useEffect(() => {
    const cur = player?.currentPlanetId ?? null;
    if (!cur || prevScanPlanetIdRef.current === cur) return;
    prevScanPlanetIdRef.current = cur;
    setPlanetScanActionsUnlocked(false);
  }, [player?.currentPlanetId]);
  const handlePlanetScanComplete = useCallback(() => {
    setPlanetScanActionsUnlocked(true);
  }, []);
  const salvageAttemptRef = useRef(0);
  useEffect(() => {
    salvageAttemptRef.current = 0;
  }, [player?.currentPlanetId]);
  const activeSalvageWreck = useMemo(
    () => planetWorldObjects.find((object) => object.kind === 'wreck') ?? null,
    [planetWorldObjects],
  );
  const handleToggleMining = useCallback(() => {
    if (!planet || !canOrbitalMine || !planetScanActionsUnlocked) return;
    if (miningSessionRef.current.status === 'running') {
      applyMiningTeardownRef.current('manual_stop');
      return;
    }
    const miningGoodId = resolvePlanetDisplayPrimaryMineralId(planet.id);
    const now = Date.now();
    const next = startMiningSession(miningSessionRef.current, planet.id, miningGoodId, now);
    miningSessionRef.current = next;
    setMiningSession(next);
    setMiningUiNowMs(now);
  }, [planet, canOrbitalMine, planetScanActionsUnlocked]);
  useEffect(() => {
    const pid = player?.currentPlanetId;
    if (!pid) return undefined;
    const token = registerPlanetSessionResource({
      ownerId: 'planet_hub_mining',
      planetId: pid,
      dispose: () => applyMiningTeardownRef.current('route_blur'),
    });
    return () => token.release();
  }, [player?.currentPlanetId]);
  /**
   * Phase 3: 채굴 tick 인터벌·분배 알고리즘은 `useMiningDriver` 로 추출.
   * `enabled` 신호 한 곳에 정책을 모아두면 lifecycle/포커스/앱 상태 변경 시 즉시 정지.
   */
  const miningDriverEnabled =
    miningSession.status === 'running' &&
    Boolean(planet) &&
    canOrbitalMine &&
    planetScanActionsUnlocked &&
    isPlanetRouteFocused &&
    appStateActive &&
    stageSession.isActive;
  const handleMiningGrant = useCallback(
    (grants: { goodId: string; quantity: number }[]) => {
      if (grants.length === 0 || AppState.currentState !== 'active') return;
      const planetId =
        miningSessionRef.current.planetId
        ?? usePlayerStore.getState().player?.currentPlanetId
        ?? null;
      for (const g of grants) {
        if (g.quantity <= 0) continue;
        addInventoryItem(g.goodId, g.quantity);
        if (planetId && (isArcCorePricedMineral(g.goodId) || g.goodId === 'ore_mineral_1')) {
          recordOrbitalMiningDelivery(planetId, g.goodId, g.quantity);
        }
      }
      setMenuBadge('trade', true);
      scheduleMiningPlayerPersist();
    },
    [addInventoryItem, recordOrbitalMiningDelivery, setMenuBadge],
  );
  useMiningDriver({
    enabled: miningDriverEnabled,
    sessionRef: miningSessionRef,
    applySession: setMiningSession,
    applyUiNowMs: setMiningUiNowMs,
    onGrant: handleMiningGrant,
  });
  const [activeIngameDialogSceneId, setActiveIngameDialogSceneId] = useState<string | null>(null);
  const [ingameDialogPage, setIngameDialogPage] = useState(0);
  const [ingameDialogSegment, setIngameDialogSegment] = useState(0);
  const [ingameDialogPageComplete, setIngameDialogPageComplete] = useState(false);

  /** 웨이브 디펜스 전체 종료 → 오퍼레이터 종료 대사 1회 */
  const handleWaveDefenseRunEnded = useCallback(() => {
    setIngameDialogPage(0);
    setIngameDialogSegment(0);
    setIngameDialogPageComplete(false);
    setActiveIngameDialogSceneId('ingame_dialog_wave_defense_end');
  }, []);
  useWaveDefenseController({
    planetId: planet?.id ?? null,
    systemId: system?.id ?? null,
    isTestBed: planet?.id === 'vega_base',
    introDone: !activeIngameDialogSceneId,
    routeFocused: isPlanetRouteFocused,
    appActive: appStateActive,
    onRunEnded: handleWaveDefenseRunEnded,
  });

  // 웨이브 종료 대사(ingame_dialog_wave_defense_end)가 닫히면 최종 결과창 표시.
  // 결과창 닫을 때 누적 경험치를 실제 지급(addExp)하고 웨이브 상태를 초기화한다.
  const waveEndDialogShownRef = useRef(false);
  useEffect(() => {
    if (activeIngameDialogSceneId === 'ingame_dialog_wave_defense_end') {
      waveEndDialogShownRef.current = true;
      return;
    }
    if (!waveEndDialogShownRef.current || activeIngameDialogSceneId) return;
    waveEndDialogShownRef.current = false;
    const s = useWaveDefenseStore.getState();
    const expEarned = s.expEarned;
    presentWaveResultOverlay({
      outcome: s.outcome ?? 'win',
      wavesCleared: s.wavesCleared,
      totalWaves: WAVE_DEFENSE_MAX_WAVES,
      expEarned,
      onClose: () => {
        if (expEarned > 0) usePlayerStore.getState().addExp(expEarned);
        useWaveDefenseStore.getState().reset();
      },
    });
  }, [activeIngameDialogSceneId]);
  /**
   * 인게임 대화 트리거 전용: `player.currentPlanetId`(메인 행성 허브 착륙) 기준으로만 소비.
   * 무역소·조선소 등 세부 화면 라우트 포커스와 무관.
   */
  const ingameDialogLastLandedPlanetIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!playerHydrated || !player?.currentPlanetId) return;
    markBootPerf('planet_first_render');
  }, [playerHydrated, player?.currentPlanetId]);

  useEffect(() => {
    if (!playerHydrated) return;
    // 계정 초기화 purge 도중 player 가 null 이 되어도 여기서 조기 리다이렉트하지 않는다.
    // (나머지 purge 완료 후 finalize 가 1회 타이틀로 이동 — 부하정리 완료 후 복귀 보장)
    if (!player && !isAccountResetInProgress()) router.replace('/');
  }, [player, playerHydrated]);

  useEffect(() => {
    const p = usePlayerStore.getState().player;
    const landedPlanetId = p?.currentPlanetId ?? null;

    if (!landedPlanetId) {
      ingameDialogLastLandedPlanetIdRef.current = null;
      return;
    }

    // 단일 조건: 메인스테이지(행성 허브) = currentPlanetId 가 비어 있지 않은 값으로 막 바뀐 착륙 1회
    if (ingameDialogLastLandedPlanetIdRef.current === landedPlanetId) {
      return;
    }
    ingameDialogLastLandedPlanetIdRef.current = landedPlanetId;

    if (activeIngameDialogSceneId) return;

    const candidate = Object.values(STORY_SCENES_FROM_CSV).find((sceneDef) => {
      if (sceneDef.triggerKey !== 'planet_landed') return false;
      if (sceneDef.triggerTargetId !== landedPlanetId) return false;
      if (!sceneDef.pages.some((page) => page.viewMode === 'ingame_dialog')) return false;
      if (sceneDef.triggerRepeat === 'once' && p && p.flags.seenStorySceneIds.includes(sceneDef.id)) {
        return false;
      }
      return true;
    });
    if (!candidate) return;

    setIngameDialogPage(0);
    setIngameDialogSegment(0);
    setIngameDialogPageComplete(false);
    setActiveIngameDialogSceneId(candidate.id);
  }, [player?.currentPlanetId, activeIngameDialogSceneId]);

  const activeIngameDialogScene = activeIngameDialogSceneId
    ? STORY_SCENES_FROM_CSV[activeIngameDialogSceneId]
    : null;
  const activeIngameDialogPages = activeIngameDialogScene?.pages ?? [];
  const activeIngameDialogCurrentPage = activeIngameDialogPages[ingameDialogPage];
  const activeIngameDialogSpeaker = useMemo(() => {
    const sid = activeIngameDialogCurrentPage?.speakerNpcCaptainId;
    if (!sid) return null;
    return getNpcCaptain(sid) ?? null;
  }, [activeIngameDialogCurrentPage?.speakerNpcCaptainId]);
  const activeIngameDialogImageSource =
    resolveNpcCaptainPortraitSource(
      activeIngameDialogSpeaker?.portraitImageAssetKey ?? activeIngameDialogCurrentPage?.imageAssetKey,
    ) ?? undefined;
  const activeIngameDialogTextRaw = (
    activeIngameDialogCurrentPage
      ? resolveStoryPageText(activeIngameDialogCurrentPage, appLocale, player?.nickname)
      : ''
  )
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n');
  const activeIngameDialogTextChunks = splitStoryTextByMaxLines(
    activeIngameDialogTextRaw,
    activeIngameDialogScene?.maxLinesPerPage ?? 4,
  );
  const activeIngameDialogText = activeIngameDialogTextChunks[ingameDialogSegment] ?? '';
  const activeIngameDialogIsLastSegment =
    ingameDialogSegment >= Math.max(0, activeIngameDialogTextChunks.length - 1);
  const activeIngameDialogIsLast = ingameDialogPage >= Math.max(0, activeIngameDialogPages.length - 1);
  const isFinalIngameDialogStep =
    activeIngameDialogIsLast && activeIngameDialogIsLastSegment;
  const markIngameDialogSceneSeen = useCallback((sceneId: string) => {
    const snapshot = usePlayerStore.getState().player;
    if (!snapshot) return;
    const prevSeen = snapshot.flags.seenStorySceneIds ?? [];
    if (prevSeen.includes(sceneId)) return;
    setPlayer({
      ...snapshot,
      flags: {
        ...snapshot.flags,
        seenStorySceneIds: [...prevSeen, sceneId],
      },
    });
    void persist();
  }, [setPlayer, persist]);

  const handleNextIngameDialog = useCallback(() => {
    if (!activeIngameDialogScene || activeIngameDialogPages.length === 0) {
      setActiveIngameDialogSceneId(null);
      return;
    }
    if (isFinalIngameDialogStep && ingameDialogPageComplete) {
      if (activeIngameDialogScene.triggerRepeat === 'once') {
        markIngameDialogSceneSeen(activeIngameDialogScene.id);
      }
      setActiveIngameDialogSceneId(null);
      setIngameDialogPage(0);
      setIngameDialogSegment(0);
      setIngameDialogPageComplete(false);
      return;
    }
    if (!ingameDialogPageComplete) {
      return;
    }
    if (!activeIngameDialogIsLastSegment) {
      setIngameDialogSegment((s) => s + 1);
      setIngameDialogPageComplete(false);
      return;
    }
    if (activeIngameDialogIsLast) {
      if (activeIngameDialogScene.triggerRepeat === 'once') {
        markIngameDialogSceneSeen(activeIngameDialogScene.id);
      }
      setActiveIngameDialogSceneId(null);
      setIngameDialogPage(0);
      setIngameDialogSegment(0);
      setIngameDialogPageComplete(false);
      return;
    }
    setIngameDialogPage((p) => p + 1);
    setIngameDialogSegment(0);
    setIngameDialogPageComplete(false);
  }, [
    activeIngameDialogScene,
    activeIngameDialogPages.length,
    activeIngameDialogIsLast,
    activeIngameDialogIsLastSegment,
    isFinalIngameDialogStep,
    ingameDialogPageComplete,
    markIngameDialogSceneSeen,
  ]);

  const planetIngameNarrativeConfig = useMemo((): ArcNarrativeOverlayConfig | null => {
    if (!activeIngameDialogScene) return null;
    return {
      anchor: 'center',
      label:
        (activeIngameDialogCurrentPage
          ? resolveStoryPageLabel(activeIngameDialogCurrentPage, appLocale)
          : '') || (appLocale === 'ko' ? '[ 통신 ]' : '[ COMM ]'),
      text: activeIngameDialogText,
      typewriterKey: `ingame-dialog-${activeIngameDialogScene.id}-${ingameDialogPage}-${ingameDialogSegment}`,
      typewriterSpeedMs: activeIngameDialogScene.typewriterSpeedMs ?? 28,
      onTextComplete: () => setIngameDialogPageComplete(true),
      imageSource: activeIngameDialogImageSource,
      onPressNext: handleNextIngameDialog,
      nextDisabled: !ingameDialogPageComplete,
      buttonText: isFinalIngameDialogStep
        ? (appLocale === 'ko' ? '[ 확인 ]' : '[ OK ]')
        : (appLocale === 'ko' ? '[ 다음 ]' : '[ Next ]'),
    };
  }, [
    activeIngameDialogScene,
    activeIngameDialogCurrentPage,
    appLocale,
    activeIngameDialogText,
    ingameDialogPage,
    ingameDialogSegment,
    activeIngameDialogImageSource,
    handleNextIngameDialog,
    ingameDialogPageComplete,
    isFinalIngameDialogStep,
  ]);

  useArcNarrativeOverlay(
    'planet-ingame-dialog',
    Boolean(activeIngameDialogScene),
    planetIngameNarrativeConfig,
  );

  const [nearbyPresence, setNearbyPresence] = useState<ReturnType<typeof resolvePlanetNearbyPresence>>([]);
  useEffect(() => {
    if (!isPlanetRouteFocused || !planet || !system) {
      setNearbyPresence([]);
      return;
    }
    // 스테이지(행성) 진입 시에만 테이블 기반 배치 스냅샷 로드
    setNearbyPresence(resolvePlanetNearbyPresence(planet.id, system.id));
    return () => {
      // 스테이지 이탈 시 즉시 해제
      setNearbyPresence([]);
    };
  }, [isPlanetRouteFocused, planet?.id, system?.id]);

  /** 궤도 Skia·마크 렌더 — 테이블+아크 합산 상한 (아르카디아 17척 등 GL·뷰 폭주 방지) */
  const orbitRenderBudget = useMemo(
    () => applyPlanetHubOrbitRenderBudget(nearbyPresence, arcNpcShipsAtPlanet),
    [nearbyPresence, arcNpcShipsAtPlanet],
  );
  const orbitTablePresence = orbitRenderBudget.tableRows;
  const orbitArcShipsAtPlanet = orbitRenderBudget.arcShips;
  const orbitArcSkiaCaptionHeads = useMemo(() => {
    const m = new Map(arcNpcCaptainsSnap.map((c) => [c.id, c.name] as const));
    return orbitArcShipsAtPlanet.map((s) => orbitLabelHead3(m.get(s.captainId) ?? s.captainId));
  }, [orbitArcShipsAtPlanet, arcNpcCaptainsSnap]);

  /** 테이블 근접 + 현재 행성에 머문 아크 수송선 + 허브 트래픽(‹AI›) — INFO·궤도 공통 · v4.0 최대 5척 */
  const [hubTrafficTick, setHubTrafficTick] = useState(0);
  const hubMergedNearbyPresence = useMemo(() => {
    if (!planet || !system) return [];
    const arcInfoRows = mergeArcShipsIntoNearbyHubPresence(
      [],
      orbitArcShipsAtPlanet,
      arcNpcCaptainsSnap,
      planet.id,
      system.id,
    );
    const hubTrafficRows = buildHubTrafficPresenceRows(planet.id, system.id);
    void hubTrafficTick;
    return capHubOrbitPresenceByRenderPriority(
      arcInfoRows,
      hubTrafficRows,
      orbitTablePresence,
      HUB_ORBIT_TRAFFIC_MAX_ACTIVE,
    );
  }, [
    orbitTablePresence,
    orbitArcShipsAtPlanet,
    arcNpcCaptainsSnap,
    planet,
    system,
    hubTrafficTick,
  ]);

  useEffect(() => {
    if (!isPlanetRouteFocused || !planet || !system) return;
    const stopSession = startHubOrbitTrafficSession(planet.id, system.id);
    const excludeCaptains = new Set<string>();
    const excludeShips = new Set<string>();
    for (const row of nearbyPresence) {
      const sid = row.linkedCapitalShipId;
      if (sid) excludeShips.add(sid);
    }
    for (const ship of arcNpcShipsAtPlanet) {
      excludeCaptains.add(ship.captainId);
      excludeShips.add(ship.id);
    }
    seedHubOrbitTraffic(planet.id, system.id, excludeCaptains, excludeShips);
    setHubTrafficTick((v) => v + 1);
    const token = registerPlanetSessionResource({
      ownerId: 'hub_orbit_traffic_session',
      planetId: planet.id,
      dispose: stopSession,
    });
    return () => token.release();
  }, [isPlanetRouteFocused, planet?.id, system?.id, nearbyPresence, arcNpcShipsAtPlanet]);

  const tickHubTraffic = useCallback(() => {
    if (!planet || !system) return;
    const excludeCaptains = new Set<string>();
    const excludeShips = new Set<string>();
    for (const row of nearbyPresence) {
      const sid = row.linkedCapitalShipId;
      if (sid) excludeShips.add(sid);
    }
    for (const ship of arcNpcShipsAtPlanet) {
      excludeCaptains.add(ship.captainId);
      excludeShips.add(ship.id);
    }
    tickHubOrbitTraffic(planet.id, system.id, excludeCaptains, excludeShips);
    setHubTrafficTick((v) => v + 1);
  }, [planet, system, nearbyPresence, arcNpcShipsAtPlanet]);

  usePlanetHubInterval(
    'planet_hub_orbit_traffic',
    planet?.id ?? null,
    isPlanetRouteFocused && Boolean(planet && system),
    HUB_ORBIT_TRAFFIC_CYCLE_MS,
    tickHubTraffic,
  );

  const hubMergedRowsRef = useRef(hubMergedNearbyPresence);
  hubMergedRowsRef.current = hubMergedNearbyPresence;
  const planetHubCaptainIds = useMemo(() => {
    if (!planet || !system) return [];
    return collectPlanetHubCaptainIds(
      planet.id,
      system.id,
      arcNpcShipsAtPlanet,
      hubMergedNearbyPresence,
    );
  }, [planet, system, arcNpcShipsAtPlanet, hubMergedNearbyPresence]);
  const openPlanetHubNpcDialog = useCallback(() => {
    if (activeIngameDialogSceneId) return;
    const sceneId = resolvePlanetHubNpcDialogSceneId(planetHubCaptainIds);
    setIngameDialogPage(0);
    setIngameDialogSegment(0);
    setIngameDialogPageComplete(false);
    setActiveIngameDialogSceneId(sceneId);
  }, [planetHubCaptainIds, activeIngameDialogSceneId]);
  const handlePlanetSalvageSearch = useCallback(() => {
    if (!planet || !activeSalvageWreck) {
      showArcAlert(t('planet.searchTitle'), t('planet.searchNone'));
      return;
    }
    const attempt = salvageAttemptRef.current;
    salvageAttemptRef.current += 1;
    const itemId = pickSalvageLootItemId(planet.id, activeSalvageWreck.id, attempt);
    addInventoryItem(itemId, 1);
    setMenuBadge('trade', true);
    showArcAlert(t('planet.searchDoneTitle'), t('planet.searchDoneBody', { item: formatSalvageLootLabel(itemId) }));
  }, [planet, activeSalvageWreck, addInventoryItem, setMenuBadge, t]);
  const tableOrbitSlotCountRef = useRef(0);
  tableOrbitSlotCountRef.current = orbitTablePresence.length;
  const arcShipIndexByIdRef = useRef<Map<string, number>>(new Map());
  useEffect(() => {
    const m = new Map<string, number>();
    for (let i = 0; i < arcNpcShipsAtPlanet.length; i++) {
      m.set(arcNpcShipsAtPlanet[i]!.id, i);
    }
    arcShipIndexByIdRef.current = m;
  }, [arcNpcShipsAtPlanet]);

  /** 행성 주변에만 체류하도록 궤도 반지름 축소(Skia 궤도와 동일) */
  const NEAR_PLANET_ORBIT_RADIUS_SCALE = 0.62;

  /** 궤도 worklet용 평탄화 (ORBIT_FLAT_STRIDE 개/슬롯) */
  const orbitFlatParams = useMemo(
    () =>
      orbitTablePresence.flatMap(r => {
        const o = r.orbit;
        const radius = o.radius * NEAR_PLANET_ORBIT_RADIUS_SCALE;
        return [
          o.phase,
          o.speed,
          radius,
          o.moving ? 1 : 0,
          o.ellipseY,
          o.pathTilt,
          o.periodScale,
        ];
      }),
    [orbitTablePresence],
  );

  /** 누적 경과 ms — %1 없이 각도만 선형 증가 (함선별 periodScale 로 고유 속도) */
  const orbitClockMs = useSharedValue(0);
  const orbitParamsSv = useSharedValue<number[]>([]);

  useEffect(() => {
    if (!isPlanetRouteFocused) {
      registerPlanetOrbitClockMs(null);
      return;
    }
    registerPlanetOrbitClockMs(orbitClockMs);
    return () => registerPlanetOrbitClockMs(null);
  }, [orbitClockMs, isPlanetRouteFocused]);

  const orbitFrame = useFrameCallback(({ timeSincePreviousFrame }) => {
    'worklet';
    const dt = Math.min(timeSincePreviousFrame ?? 0, ORBIT_FRAME_DT_MAX_MS);
    if (dt <= 0 || !Number.isFinite(dt)) return;
    orbitClockMs.value += dt;
  }, false);

  useEffect(() => {
    orbitParamsSv.value = orbitFlatParams.slice();
  }, [orbitFlatParams, orbitParamsSv]);

  useEffect(() => {
    const needOrbitClock =
      planetStageSkiaActive &&
      (orbitTablePresence.length > 0 ||
        planetWorldObjects.length > 0 ||
        orbitArcShipsAtPlanet.length > 0 ||
        arcInboundDronesAtPlanet.length > 0);
    if (!needOrbitClock) {
      orbitFrame.setActive(false);
      return;
    }
    orbitFrame.setActive(true);
    const token = registerPlanetSessionResource({
      ownerId: 'planet_hub_orbit_clock',
      planetId: planet?.id ?? null,
      dispose: () => orbitFrame.setActive(false),
    });
    return () => {
      token.release();
      orbitFrame.setActive(false);
    };
  }, [
    planetStageSkiaActive,
    orbitTablePresence.length,
    planetWorldObjects.length,
    orbitArcShipsAtPlanet.length,
    arcInboundDronesAtPlanet.length,
    orbitFrame,
    planet?.id,
    system?.id,
  ]);

  const arcPackSortRef = useRef<{ flat: number[]; t0: number; count: number }>({
    flat: [],
    t0: 0,
    count: 0,
  });
  useEffect(() => {
    arcPackSortRef.current = {
      flat: packArcNpcShipsToFloat32(orbitArcShipsAtPlanet),
      t0: orbitClockMs.value,
      count: orbitArcShipsAtPlanet.length,
    };
  }, [orbitArcShipsAtPlanet, orbitClockMs]);

  const [infoLineOrder, setInfoLineOrder] = useState<number[]>([]);
  useEffect(() => {
    const len = hubMergedNearbyPresence.length;
    if (len === 0) {
      setInfoLineOrder([]);
      return;
    }
    setInfoLineOrder(prev => (prev.length === len ? prev : Array.from({ length: len }, (_, i) => i)));
  }, [hubMergedNearbyPresence.length]);

  const applyInfoDistanceSort = useCallback(() => {
    const merged = hubMergedRowsRef.current;
    const L = merged.length;
    if (L === 0) {
      setInfoLineOrder([]);
      return;
    }
    const baseLen = tableOrbitSlotCountRef.current;
    const arcIndexById = arcShipIndexByIdRef.current;
    const m = orbitClockMs.value;
    const flatTable = orbitParamsSv.value;
    const { flat: arcFlat, t0: arcT0, count: arcCount } = arcPackSortRef.current;
    const distances = new Array<number>(L);
    for (let i = 0; i < L; i++) {
      if (i < baseLen) {
        distances[i] =
          jsTableNpcDistanceFromCenter(flatTable, i, m, NPC_ORBIT_CYCLE_MS) ?? Number.POSITIVE_INFINITY;
      } else {
        const row = merged[i]!;
        const sid = row.linkedCapitalShipId;
        const arcIdx = sid ? (arcIndexById.get(sid) ?? -1) : -1;
        distances[i] =
          arcIdx >= 0
            ? jsArcNpcDistanceFromCenter(arcIdx, m, arcT0, arcFlat, arcCount) ?? Number.POSITIVE_INFINITY
            : Number.POSITIVE_INFINITY;
      }
    }
    const idx = Array.from({ length: L }, (_, i) => i);
    idx.sort((a, b) => distances[a]! - distances[b]! || a - b);
    setInfoLineOrder(prev => (prev.length === L && prev.every((v, k) => v === idx[k]) ? prev : idx));
  }, [orbitClockMs, orbitParamsSv]);

  usePlanetHubInfoDistanceSort(
    resolvedPlanetId,
    planetStageSkiaActive,
    applyInfoDistanceSort,
    hubMergedNearbyPresence.length,
  );

  const sortedShipInfoRows = useMemo(() => {
    const len = hubMergedNearbyPresence.length;
    if (len === 0) return [];
    const order =
      infoLineOrder.length === len ? infoLineOrder : Array.from({ length: len }, (_, i) => i);
    return order.map(i => ({
      keySlot: hubMergedNearbyPresence[i]!.slotIndex,
      line: hubMergedNearbyPresence[i]!.displayLine,
    }));
  }, [infoLineOrder, hubMergedNearbyPresence]);
  const orbitCaptionsBySlot = useMemo(
    () => orbitTablePresence.map(r => orbitCaptainCaptionFromLine(r.displayLine)),
    [orbitTablePresence],
  );

  const handleExitToTitle = useCallback(() => {
    showArcAlert(
      t('planet.exitGameTitle'),
      t('planet.exitGameBody'),
      [
        { text: t('planet.cancel'), style: 'cancel' },
        {
          text: t('planet.exit'),
          style: 'destructive',
          onPress: () => beginPlanetHubSuspendingNavigation(() => router.replace('/?forceTitle=1')),
        },
      ],
    );
  }, [beginPlanetHubSuspendingNavigation, t]);

  const handleResetAllData = useCallback(() => {
    showArcAlert(
      t('planet.resetTitle'),
      t('planet.resetBody'),
      [
        { text: t('planet.cancel'), style: 'cancel' },
        {
          text: t('planet.reset'),
          style: 'destructive',
          onPress: () => {
            const playerSnapshot = usePlayerStore.getState().player;
            requestLocalAccountResetFromPlanetHub(
              beginPlanetHubSuspendingNavigation,
              () => router.replace('/?forceTitle=1'),
              {
                uid: playerSnapshot?.uid ?? getCurrentUser().uid ?? null,
                currentClanId: playerSnapshot?.political.clanId ?? null,
              },
            );
          },
        },
      ],
    );
  }, [beginPlanetHubSuspendingNavigation, t]);

  const handleOpenSettings = useCallback(() => {
    presentSettingsOverlay({ onResetAccount: handleResetAllData });
  }, [handleResetAllData]);

  /** 클랜 점유: 솔라 스테이션과 동일 플로우(플레이트만, 성계별 보정 없음) */
  const safeAiClanTerritoryPlate = useClanWarFoundationStore(
    useCallback((s) => {
      const pid = planet?.id;
      if (!pid) return null;
      const h = s.planetHolds[pid];
      if (!h || h.kind === 'neutral') return null;
      const clan = s.clans[h.occupierClanId];
      const clanName = (clan?.displayName ?? '').trim() || h.occupierClanId;
      const clanColor = resolveTempClanColor(h.occupierClanId);
      return { clanName, clanColor };
    }, [planet?.id]),
  );

  /** 클랜 소유 문구는 `safeAiClanPlate` 한 곳만 사용(솔라 스테이션과 동일 레이아웃 기준). */
  const clanTerritorySubtitle: string | null = null;
  const currentPilotClanName = useClanWarFoundationStore(
    useCallback((s) => {
      const clanId = player?.political.clanId;
      if (!clanId) return t('planet.unaffiliated');
      const displayName = (s.clans[clanId]?.displayName ?? '').trim();
      return displayName.length > 0 ? displayName : clanId;
    }, [player?.political.clanId, t]),
  );
  if (!player || !system || !planet) return null;

  const zoneColor = ZONE_COLORS[system.zone];

  return (
    <PlanetCapitalCombatRoot
      orbitSize={ORBIT_SCENE_SIZE}
      active={capitalCombatOrbitActive}
      paused={capitalCombatOrbitPaused}
      combatPlanetId={capitalCombatOrbitActive ? planet.id : null}
      combatSystemId={system.id}
    >
    <PlanetCapitalCombatPreloader active={enemyFleetEntered} />
    <PlanetCapitalCombatHeavySlot
      active={capitalCombatOrbitActive}
      render={(ui) => <ui.CombatSimRefBridge targetRef={combatSimRef} />}
    />
    <StageShell
      routeName="planet"
      background="stars"
      starFieldCount={36}
      edges={['bottom']}
      backgroundOverlay={
        <PlanetStageBackground
          planetId={planet.id}
          system={system}
          zoneColor={zoneColor}
          orbitParamsSv={orbitParamsSv}
          tableOrbitSlotCount={orbitTablePresence.length}
          npcOrbitCycleMs={NPC_ORBIT_CYCLE_MS}
          orbitCaptionsBySlot={orbitCaptionsBySlot}
          orbitClockMs={orbitClockMs}
          arcNpcShipsAtPlanet={orbitArcShipsAtPlanet}
          arcSkiaCaptionHeads={orbitArcSkiaCaptionHeads}
          arcInboundDronesAtPlanet={arcInboundDronesAtPlanet}
          worldObjects={planetWorldObjects}
          showEdenRaidTest={capitalCombatOrbitActive}
          miningPathActive={miningSession.status === 'running' && appStateActive}
          miningProgressPct={miningCycleProgressPct}
          territorySubtitle={clanTerritorySubtitle}
          safeAiClanTerritoryPlate={safeAiClanTerritoryPlate}
          backgroundChrome={mainStageVertical.backgroundChrome}
          planetStageScale={planetStageScale}
          combatSimRef={combatSimRef}
        />
      }
      absoluteOverlay={
        capitalCombatOrbitActive ? (
          <PlanetCapitalCombatHeavySlot
            active={capitalCombatOrbitActive}
            render={(ui) => (
              <ui.PlanetCapitalCombatOrbitForegroundOverlay
                backgroundChrome={mainStageVertical.backgroundChrome}
                planetStageScale={planetStageScale}
              />
            )}
          />
        ) : null
      }
    >
      <View style={styles.stageRoot}>
      <View style={styles.foreground}>
        {/* translateY만: 레이아웃 높이·backgroundChrome·스크롤 시작선 불변 */}
        <View
          style={
            PLANET_MAIN_FOREGROUND_TOP_CHROME_LIFT_PX > 0
              ? { transform: [{ translateY: -PLANET_MAIN_FOREGROUND_TOP_CHROME_LIFT_PX }] }
              : undefined
          }
        >
          <View style={styles.topBar}>
            <View style={styles.topBarLeft}>
              <TouchableOpacity style={styles.iconBtn} onPress={handleExitToTitle} accessibilityLabel={t('planet.a11yExitGame')}>
                <Ionicons name="power" size={18} color={COLORS.ink_dark} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={handleOpenSettings} accessibilityLabel={t('planet.a11ySettings')}>
                <Ionicons name="settings-outline" size={18} color={COLORS.ink_dark} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => showArcAlert(t('planet.rankingTitle'), t('planet.rankingBody'))}
                accessibilityLabel={t('planet.a11yRanking')}
              >
                <Ionicons name="podium-outline" size={18} color={COLORS.ink_dark} />
              </TouchableOpacity>
            </View>

            <Text style={styles.topBarTitle} numberOfLines={1}>{t('planet.mainStage')}</Text>

            <View style={styles.topBarRight}>
              <TouchableOpacity
                style={[styles.currencyChip, styles.currencyChipGem]}
                onPress={() => presentBmShopOverlay('premium')}
                accessibilityLabel={t('planet.a11yGemShop')}
              >
                <Ionicons name="diamond-outline" size={14} color={COLORS.info} />
                <Text style={styles.currencyChipTextGem} numberOfLines={1}>
                  {formatGemBalance(resolvePlayerGemBalance(player))}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.currencyChip, styles.currencyChipCredits]}
                onPress={() => presentBmShopOverlay('exchange')}
                accessibilityLabel={t('planet.a11yCreditExchange')}
              >
                <Ionicons name="logo-usd" size={14} color={COLORS.gold} />
                <Text style={styles.currencyChipTextCredits} numberOfLines={1}>
                  {formatCredits(player?.credits ?? 0, { suffix: false })}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <QuestHUD />
        </View>

        {/* ScrollView는 전체 너비(하단 메뉴 4열 레이아웃 유지). info는 우상단 오버레이. */}
        <View style={styles.mainArea}>
        <ScrollView
          style={[styles.scroll, styles.scrollTransparent]}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom:
                (capitalCombatOrbitActive
                  ? PLANET_MAIN_BOTTOM_DOCK_BASE_PX
                  : PLANET_MAIN_BOTTOM_DOCK_WITH_SCAN_EST_PX)
                + PLANET_MAIN_BOTTOM_FEATURE_RESERVE_PX
                + safeAreaInsets.bottom,
            },
          ]}
          showsVerticalScrollIndicator={false}
          pointerEvents="box-none"
        >
        {/* 행성·궤도는 배경 레이어 — 여기는 투명 예약으로 메뉴가 가리지 않게 함 */}
        <View
          style={[styles.planetStageReserve, { minHeight: planetStageReservePx }]}
          accessibilityLabel={t('planet.a11yPlanetView')}
        />

        {/* 소형 메뉴 버튼 — marginTop만 포그라운드: 배경 행성 `paddingBottom`과 분리 */}
        <PlanetCapitalCombatHeavySlot
          active={capitalCombatOrbitActive}
          render={(ui) => (
            <ui.PlanetMainStanceRow
              routeFocused={isPlanetRouteFocused && appStateActive}
              planetId={planet?.id ?? null}
            />
          )}
        />
        </ScrollView>

        <View
          style={[
            styles.planetBottomDock,
            { paddingBottom: Math.max(SPACING.xs, safeAreaInsets.bottom) },
          ]}
        >
          {!capitalCombatOrbitActive ? (
            <PlanetMainScanActionRow
              layout="dock"
              planetId={planet?.id ?? null}
              planetName={planet?.name ?? null}
              scanEnabled={Boolean(planet)}
              actionsUnlocked={planetScanActionsUnlocked}
              miningLabel={miningSession.status === 'running' ? t('planet.miningStop') : t('planet.mining')}
              miningDisabled={!canOrbitalMine}
              miningPrimary={miningSession.status === 'running'}
              dialogDisabled={false}
              searchDisabled={!activeSalvageWreck}
              onScanComplete={handlePlanetScanComplete}
              onPressMining={handleToggleMining}
              onPressDialog={openPlanetHubNpcDialog}
              onSearchComplete={handlePlanetSalvageSearch}
            />
          ) : null}
          <PlanetMainPilotInfoPanel
            nickname={player.nickname}
            level={player.level}
            expLabel={formatPilotExp8(player.exp)}
            creditsLabel={formatCredits(player.credits, { suffix: false })}
            shipName={player.ship.name}
            skillPoints={player.skillPoints}
            clanName={currentPilotClanName}
            menuSlot={<PlanetHubFeatureMenuRow key={appLocale} items={featureMenuItems} />}
          />
        </View>

        <View style={styles.infoOverlaySlot} pointerEvents="box-none">
          <NearbyShipInfoPanel rows={sortedShipInfoRows} mutedForCapitalCombat={capitalCombatOrbitActive} />
        </View>
        {capitalCombatOrbitActive ? (
          <View
            style={[
              styles.edenCombatHudSlot,
              { top: Math.max(4, planetStageReservePx - EDEN_COMBAT_HUD_BLOCK_PX) },
            ]}
            pointerEvents="box-none"
          >
            <PlanetCapitalCombatHeavySlot
              active={capitalCombatOrbitActive}
              render={(ui) => <ui.CapitalRealtimeCombatHudOverlay />}
            />
          </View>
        ) : null}
        {battleReadyVisible ? (
          <View style={styles.battleReadyOverlay} pointerEvents="none">
            <Text
              style={[
                styles.battleReadyText,
                battleReadyBlinkOn ? styles.battleReadyTextBlinkOn : styles.battleReadyTextBlinkOff,
              ]}
            >
              - Ready to Battle! -
            </Text>
            <Text style={styles.battleReadyCounter}>{`- ${battleReadyCounterSec} -`}</Text>
          </View>
        ) : null}
        {capitalCombatOrbitActive && waveDefenseActiveHere && waveDefenseWaveIndex > 0 ? (
          <View style={styles.battleReadyOverlay} pointerEvents="none">
            <Text style={styles.battleReadyText}>{`- WAVE ${waveDefenseWaveIndex} -`}</Text>
          </View>
        ) : null}
        </View>
      </View>
      </View>
    </StageShell>
    <StageLoadingOverlay
      visible={stageSession.isTransiting}
      overlayId="stage-loading-planet-departure"
    />
    </PlanetCapitalCombatRoot>
  );
}