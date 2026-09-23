// ============================================================
// 아크파이어 온라인 - 행성 허브 화면
// ============================================================

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import {
  View, Text, TouchableOpacity,
  ScrollView, useWindowDimensions,
  AppState,
} from 'react-native';
import Animated, {
  runOnJS,
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
import { useStelliumColonizeStore } from '../../src/store/stelliumColonizeStore';
import { useMenuNotificationStore } from '../../src/store/menuNotificationStore';
import { useArcNpcTrafficStore, type ArcNpcTrafficShip } from '../../src/store/arcNpcTrafficStore';
import { useArcInboundDroneStore } from '../../src/store/arcInboundDroneStore';
import {
  notePlanetOrbitClockMsJs,
  readPlanetOrbitClockMs,
  registerPlanetOrbitClockMs,
} from '../../src/arcCore/orbitClockMsBridge';
import { ORBIT_CLOCK_JS_MIRROR_IDLE_MS, ORBIT_CLOCK_JS_MIRROR_INTERVAL_MS } from '../../src/components/planet/planetHubWorkletContract';
import {
  publishArcInboundDroneHubBridge,
  resetArcInboundDroneHubBridge,
} from '../../src/arcCore/inboundDrone/arcInboundDroneHubBridge';
import { resetHubInboundDroneDodgeBridge } from '../../src/arcCore/inboundDrone/hubInboundDroneDodgeBridge';
import { resolveMainStageCombatEnabled } from '../../src/arcCore/planetBalance/planetZoneIndexRegistry';
import { releasePlanetMainStageSession } from '../../src/game/planetMainStageSession';
import { registerPlanetSessionResource } from '../../src/game/planetSessionRegistry';
import { registerArcCoreChatFacilityOpener } from '../../src/arcCore/chat/arcCoreChatFacilityBridge';
import {
  HUB_COMBAT_SAFE_RECLAIM_INTERVAL_MS,
  HUB_DEEP_NATIVE_RECLAIM_INTERVAL_MS,
  HUB_SOFT_NATIVE_RECLAIM_INTERVAL_MS,
  markHubSoftReclaimPending,
  runDeepNativeReclaimPass,
  runPlanetHubCombatSafeReclaimPass,
  runPlanetHubPreCombatReclaimPass,
  runPlanetHubSoftNativeReclaimPass,
  schedulePlanetHubPostSkiaPeakReclaim,
} from '../../src/game/nativeReclaim';
import { recordHubDeparturePlanet } from '../../src/game/galaxyMapSessionResume';
import { markGalaxyMapIngressFromPlanetHub } from '../../src/game/nativeReclaim/galaxyMapIngressReclaim';
import { consumePlanetHubIngressReclaim } from '../../src/game/nativeReclaim/planetHubIngressReclaim';
import { emitMemProfileMarker } from '../../src/game/devMemoryProfileBridge';
import { teardownPlanetHubCombatForGalaxyDeparture } from '../../src/game/teardownPlanetHubCombatForGalaxyDeparture';
import { resolvePlayerTravelBlock } from '../../src/game/playerSurvivalPod';
import { resolvePlayerPlanetStayBlock } from '../../src/clanWar/planetTerritoryPlayerAccess';
import { clearPlanetAssaultIntent } from '../../src/game/waveDefense/planetAssaultIntent';
import { showTerritorialOccupationChangeAlert } from '../../src/arcCore/territorial/showTerritorialOccupationChangeAlert';
import { getPlanetOccupationSeedRow } from '../../src/arcCore/balance/balanceTableRegistry';
import { usePlanetStageSession } from '../../src/game/usePlanetStageSession';
import { useStageTransitionStuckWatchdog } from '../../src/navigation/stageTransitionStuckWatchdog';
import { buildCsvStaticIndexesFull } from '../../src/game/buildCsvStaticIndexes';
import {
  warmGalaxyDeparturePreflight,
  warmPlanetHubResidentSet,
} from '../../src/arcCore/memory';
import { markBootPerf } from '../../src/game/bootPerformance';
import {
  PlanetCapitalCombatRoot,
  PlanetCapitalCombatPreloader,
  PlanetCapitalCombatHeavySlot,
} from '../../src/game/planetCapitalCombatIntegration';
import type { CapitalRealtimeCombatSim } from '../../src/combat/capitalRealtimeTypes';
import { isPlayerShipCombatCapable } from '../../src/game/playerSurvivalPod';
import { releasePlanetHubStageMemory } from '../../src/game/stageMemoryRelease';
import { ackDevMetroReloadMount, isDevMetroReloadPrepareInFlight, registerDevHotModuleDisposeGuard } from '../../src/game/devMetroReloadGuard';
import { useStageMemory } from '../../src/hooks/useStageMemory';
import { usePlanetStageLifecycleStore } from '../../src/game/planetStageLifecycle';
import { resetPlanetHubNavigationThrottle } from '../../src/navigation/safePlanetHubNavigate';
import { markPlanetHubWorldOpsNotifyUnlocked } from '../../src/navigation/worldOpsNotifyPresence';
import {
  computeTableNpcOrbitXY,
  jsArcNpcDistanceFromCenter,
  jsTableNpcDistanceFromCenter,
} from '../../src/components/planet/planetOrbitHubWorklets';
import {
  createArcOrbitPackEpochState,
  packArcNpcShipsWithEpoch,
} from '../../src/components/planet/arcOrbitPackEpoch';
import { QuestHUD } from '../../src/components/QuestHUD';
import { StageLoadingOverlay } from '../../src/components/StageLoadingOverlay';
import {
  COMBAT_END_OPERATOR_AUTO_DISMISS_MS,
  flushPendingScanIngameDialog,
  isIngameDialogActive,
  presentIngameDialogScene,
  resetIngameDialogPlanetLandedDedupe,
  runAfterIngameDialogFeatureLinkDelay,
  tryPresentScanToMainQuestDialog,
} from '../../src/game/ingameDialog';
import { hasAnyActiveMissionBundle } from '../../src/missions/missionActiveBundles';
import { applyDefeatEnemyMissionObjectives } from '../../src/missions/applyDefeatEnemyMissionObjectives';
import {
  isQuestHubOrbitLockAtPlanet,
  resolveQuestCombatLock,
} from '../../src/missions/questCombatLock';
import {
  syncPlanetHubMissionAndDialog,
  tryPresentPendingMissionClearDialog,
} from '../../src/missions/missionPlanetHubSync';
import { runAfterIngameDialogIdle } from '../../src/game/ingameDialog/ingameDialogIdle';
import { useIngameDialogStore } from '../../src/store/ingameDialogStore';
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
import { resolvePlanetNearbyPresence } from '../../src/npc';
import { getNpcCaptain } from '../../src/npc/npcFleetRegistry';
import { resolveNpcCaptainDisplayName } from '../../src/i18n/captainText';
import { resolvePlayerShipDisplayName } from '../../src/i18n/shipText';
import { resolveClanDisplayNameForLocale } from '../../src/clanWar/formatClanPlateDisplayName';
import { getCaptainOrbitAssignmentEpochBucket } from '../../src/arcCore/orbitPresence/captainOrbitPlanetAssignment';
import { listCaptainCoPresencePairsAtPlanet } from '../../src/arcCore/captainPresence';
import {
  publishPlanetHubCoPresenceObservationIfChanged,
  resetPlanetHubCoPresenceObservationThrottle,
} from '../../src/arcCore/observation/publishPlanetHubCoPresenceObservation';
import { resolvePlanetHubCoPresenceInteractionHints } from '../../src/arcCore/observation/resolvePlanetHubCoPresenceInteractionHints';
import { isArcCorePricedMineral } from '../../src/arcCore/economy/mineralTradePricing';
import { resolvePlanetDisplayPrimaryMineralId } from '../../src/arcCore/economy/mineralMiningDropPolicy';
import { resolveOrbitMiningSessionMaxForPlanet } from '../../src/arcCore/planetResource/planetResourceEcosystemPolicy';
import { isOrbitMiningDailyAllowanceExhausted } from '../../src/game/mining/orbitMiningPlayerLimitPolicy';
import {
  clearPlanetHubScanUnlockOnDeparture,
  setPlanetHubScanUnlocked,
} from '../../src/game/planetHub/planetHubScanUnlockState';
import {
  missionProgressMemoRev,
  planetHubDefenseSatelliteMemoRev,
  planetHubFacilityDevMemoRev,
} from '../../src/game/planetHub/planetHubStoreMemoRevisions';
import { usePlanetHubScanUnlocked } from '../../src/game/planetHub/usePlanetHubScanUnlocked';
import { ORBIT_MINING_CYCLE_MS, ORBIT_MINING_REWARD_GOOD_ID } from '../../src/game/miningConfig';
import { planetHasMineableOrbitalDeposits } from '../../src/world/mineralDepositModel';
import { listPlanetWorldObjects } from '../../src/worldObjects';
import { tryCompleteAllPlanetDevJobs } from '../../src/game/planetDevelopment/planetDevelopmentListRowModel';
import { syncPlanetHubDevelopmentOnLanding } from '../../src/game/planetDevelopment/syncPlanetHubDevelopmentOnLanding';
import { tryApplyRepairDroneOnHubPresence } from '../../src/game/playerOwnedSkillFleetAdjust';
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
import { getCurrentUser } from '../../src/firebase/auth';
import { resolveTempClanColor } from '../../src/clanWar/tempClanColors';
import { resolvePlanetHubOwnershipPlate } from '../../src/clanWar/planetOwnershipModel';
import { requestLocalAccountResetFromPlanetHub, isAccountResetInProgress } from '../../src/account/localAccountReset';
import { countGoodInInventory } from '../../src/game/playerInventory';
import {
  buildNearbyInfoDetailRow,
  normalizeNearbyInfoDetailRow,
  omitPlayerFlagshipHubInfoRows,
} from '../../src/game/planetHub/nearbyPresenceDisplay';
import {
  buildPlanetHubPinnedInfoRows,
  ensurePlanetGovernorForCurrentHold,
  mergePinnedHubInfoRows,
  stampNearbyInfoMainQuestFlags,
} from '../../src/game/planetHub/planetHubPinnedInfoCaptains';
import { resolvePlayerFlagshipNpcShipId } from '../../src/game/galaxyTransit/computeGalaxyTransitFuelQuote';
import { buildPlanetHubFeatureMenuItems } from '../../src/systems/planetHub/planetHubFeatureSystems';
import { isPlanetHubCombatSessionLock } from '../../src/systems/planetHub/planetHubCombatMenuLock';
import { PlanetHubFeatureMenuRow } from '../../src/components/planet/PlanetHubFeatureMenuRow';
import { PlanetMainScanActionRow } from '../../src/components/planet/PlanetMainScanActionRow';
import { PlanetMainPilotInfoPanel } from '../../src/components/planet/PlanetMainPilotInfoPanel';
import { resolvePlayerPilotPortraitSource } from '../../src/game/playerPilotProfessionModel';
import { collectPlanetHubCaptainIds } from '../../src/game/planetHubNpcDialog';
import {
  planetHubTalkRosterHasBadge,
  presentHubNlMouthThenMessenger,
  rememberPlanetHubTalkRosterSession,
} from '../../src/game/planetHubTalkRoster';
import { presentArcCoreBackchannel } from '../../src/arcCore/chat/presentArcCoreBackchannel';
import {
  hasInboundTalkPending,
  subscribeInboundTalkPending,
} from '../../src/arcCore/chat/arcCoreInboundTalkPending';
import {
  hideArcCoreAgentSurfaceForCombat,
  useArcCoreAgentSurfaceStore,
} from '../../src/arcCore/chat/arcCoreAgentSurfaceStore';
import { isArcCoreTutorialForceActive } from '../../src/arcCore/chat/arcCoreChatTutorialForce';
import { bindArcCoreInboundTalkRequestToPlanetSession } from '../../src/arcCore/chat/arcCoreInboundTalkRequest';
import { bindStellaLifeAskToPlanetSession } from '../../src/arcCore/chat/bindStellaLifeAskToPlanetSession';
import { applyOrbitPresenceHubVisit } from '../../src/game/planetHub/orbitPresenceHubVisit';
import {
  getArcCoreSpyIntelAlertRevision,
  subscribeArcCoreSpyIntelAlert,
} from '../../src/arcCore/spy/arcCoreSpyIntelAlertStore';
import {
  markPlanetHubLandDialogSyncDone,
  resetPlanetHubSpyIntelDialogSchedule,
  schedulePlanetHubSpyIntelDialog,
} from '../../src/game/planetHubSpyIntelDialog';
import {
  formatPantheonGodLabel,
  formatSalvageLootLabel,
  resolvePlanetSalvageSearchOutcome,
} from '../../src/game/planetSalvageSearch';
import { resolvePlanetSalvageSearchPolicy } from '../../src/game/planetSalvageSearchPolicy';
import { getArcCorePantheonRelicByItemId } from '../../src/arcCore/pantheon/arcCorePantheonRelicRegistry';
import { useArcCorePantheonCodexStore } from '../../src/arcCore/pantheon/arcCorePantheonCodexStore';
import { NearbyShipInfoPanel, PlanetStageBackground } from '../../src/components/planet/planetHub/planetHubSubcomponents';
import { PlanetMainPlanetInfoTapOverlay } from '../../src/components/planet/PlanetMainPlanetInfoTapOverlay';
import { planetHubStyles as styles } from '../../src/components/planet/planetHub/planetHubStyles';
import { presentPlanetEconomyInfoOverlay, resolvePendingArcOverlaysForStageExit } from '../../src/ui/overlay/arcOverlayStore';
import { useHeavyUiPlanetHubAction } from '../../src/ui/heavyUiDataSession';
import { useStageFirstFrameReady } from '../../src/navigation/useStageFirstFrameReady';
import { useUiScreenShell } from '../../src/ui/process/useUiScreenShell';
import { TACTICAL_HUB } from '../../src/ui/tactical/tacticalHubTokens';
import {
  EDEN_COMBAT_HUD_BLOCK_PX,
  hasEnemyFleetEnteredPlanetOrbit,
  NPC_ORBIT_CYCLE_MS,
  ORBIT_FLAT_STRIDE,
  ORBIT_FRAME_DT_MAX_MS,
  orbitCaptainCaptionFromLine,
  orbitLabelHead3,
  PLANET_MAIN_STANCE_ROW_HEIGHT_EST_PX,
  resolvePlanetBattleReadyDurationMs,
} from '../../src/game/planetHub/planetHubConstants';
import { resolvePlanetWaveCombatTrigger } from '../../src/game/waveDefense/resolvePlanetWaveCombatTrigger';
import { isWaveCombatCooldownActive, markWaveCombatVictoryCooldown } from '../../src/game/waveDefense/waveCombatCooldownStore';
import { promoteDynamicContestedZone } from '../../src/arcCore/territorial/dynamicContestedZoneStore';
import {
  completeTerritorialPassAfterPlayerWave,
  getTerritorialPlayerWavePending,
  isTerritorialPlayerWavePending,
  subscribeTerritorialPlayerWavePending,
  getTerritorialPlayerWavePendingRevision,
} from '../../src/arcCore/territorial/territorialPlayerWavePending';
import { publishTerritorialPassLearning } from '../../src/arcCore/learning/publishTerritorialPassLearning';
import { applyTheaterNpcPassSideEffects } from '../../src/arcCore/territorial/applyTheaterNpcPassSideEffects';
import { evaluateHubMainStageCombatEntered } from '../../src/game/waveDefense/evaluateHubMainStageCombatGate';
import { isDracoCombatTestVenue } from '../../src/combat/dracoCombatTestVenue';
import { requestTerritorialPlayerWaveIfLandedOnDue } from '../../src/arcCore/territorial/runTerritorialCombatPass';
import { usePlanetHubBattleReady } from '../../src/game/planetHub/usePlanetHubBattleReady';
import { COMBAT_END_HOLD_MS } from '../../src/game/combatEndHold';
import { CombatEndHoldVeil } from '../../src/components/combat/CombatEndHoldVeil';
import { useWaveDefenseStore } from '../../src/game/waveDefense/waveDefenseStore';
import { useWaveDefenseController } from '../../src/game/waveDefense/useWaveDefenseController';
import { WAVE_DEFENSE_MAX_WAVES } from '../../src/game/waveDefense/waveDefenseFleet';
import { presentWaveResultOverlay, presentSettingsOverlay, presentBmShopOverlay, presentPlanetOwnershipRosterOverlay } from '../../src/ui/overlay/showArcOverlay';
import { useAppSettingsStore } from '../../src/store/appSettingsStore';
import { useT } from '../../src/i18n';
import { usePlanetHubInfoDistanceSort } from '../../src/game/planetHub/usePlanetHubInfoDistanceSort';
import {
  applyPlanetHubOrbitRenderBudget,
  buildPlanetHubOrbitInfoRows,
} from '../../src/game/planetHubOrbitRenderBudget';
import {
  isPlanetHubResearchLabEnabled,
  isPlanetHubShipyardEnabled,
  isPlanetHubBarEnabled,
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
  const grantSalvageCredits = usePlayerStore(s => s.grantSalvageCredits);
  const tryConsumeSalvageSearchDailyAttempt = usePlayerStore(s => s.tryConsumeSalvageSearchDailyAttempt);
  const isSalvageSearchDailyCapped = usePlayerStore(s => s.isSalvageSearchDailyCapped);
  const recordOrbitalMiningDelivery = usePlayerStore(s => s.recordOrbitalMiningDelivery);
  const persist = usePlayerStore(s => s.persist);
  const setMenuBadge = useMenuNotificationStore(s => s.setBadge);
  const clearMenuBadge = useMenuNotificationStore(s => s.clearBadge);
  const hasTradeMenuBadge = useMenuNotificationStore(s => Boolean(s.badges.trade));
  const hasBarMenuBadge = useMenuNotificationStore(s => Boolean(s.badges.bar));
  const hasQuestHud = useMissionStore((s) => hasAnyActiveMissionBundle(s.progresses));
  const missionProgressRev = useMissionStore((s) => missionProgressMemoRev(s.progresses));
  const missionProgresses = useMissionStore((s) => s.progresses);
  const activeMissionId = useMissionStore((s) => s.activeMissionId);
  const hubDialogBadgeRev = usePlayerStore((s) => {
    const seen = s.player?.flags.seenStorySceneIds ?? [];
    const ack = s.player?.flags.acknowledgedHubDialogKeys ?? [];
    return `${seen.length}|${ack.length}|${ack[ack.length - 1] ?? ''}`;
  });
  const spyIntelAlertRev = useSyncExternalStore(
    subscribeArcCoreSpyIntelAlert,
    getArcCoreSpyIntelAlertRevision,
    getArcCoreSpyIntelAlertRevision,
  );
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
  /**
   * SUB-STAGE(무역소·조선소) push — 허브는 스택에 유지.
   * blur 시 full `route_blur` release 금지(usePlanetSubStageMemory 계약 · 6/30 Native/GL 회귀).
   */
  const hubSubStageNavRef = useRef(false);
  const [isPlanetRouteFocused, setIsPlanetRouteFocused] = useState(() => navigation.isFocused());
  const stageFrameReady = useStageFirstFrameReady();
  const hubShellReady = playerHydrated && isPlanetRouteFocused && stageFrameReady;
  const { visitGen: hubVisitGen } = useUiScreenShell('planet_hub', hubShellReady);
  const [appStateActive, setAppStateActive] = useState(() => AppState.currentState === 'active');
  const [miningSession, setMiningSession] = useState<MiningSessionState>(() => createInitialMiningSessionState());
  const miningSessionRef = useRef<MiningSessionState>(createInitialMiningSessionState());
  const [miningUiNowMs, setMiningUiNowMs] = useState(() => Date.now());
  const applyMiningTeardownRef = useRef<(reason: PlanetHubMiningTeardownReason) => void>(() => {});
  useLayoutEffect(() => {
    applyMiningTeardownRef.current = (reason) => {
      const { session, uiNowMs } = teardownPlanetHubMiningPresentation(reason);
      miningSessionRef.current = session;
      setMiningSession(session);
      setMiningUiNowMs(uiNowMs);
    };
  });
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      const active = next === 'active';
      setAppStateActive(active);
      if (!active) {
        flushMiningPlayerPersist();
        const pid = usePlayerStore.getState().player?.currentPlanetId ?? null;
        if (pid && navigation.isFocused()) {
          runDeepNativeReclaimPass({
            planetId: pid,
            reason: 'hub_background',
            skipBackdropRemount: true,
          });
        }
      }
    });
    return () => sub.remove();
  }, [navigation]);

  /** Phase 2: 메인스테이지 라이프사이클(Active/Suspending/Frozen/Resuming) 단일 진입점. */
  const stageSession = usePlanetStageSession();
  useStageTransitionStuckWatchdog(stageSession.isTransiting);
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
      markPlanetHubWorldOpsNotifyUnlocked();
      resetPlanetHubNavigationThrottle();
      /**
       * 메인 스테이지 진입 직전 세션 등록 — `1.arcfire_flowchart.md` §2-2
       */
      const pid = usePlayerStore.getState().player?.currentPlanetId ?? null;
      flushPendingScanIngameDialog(pid);
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
      consumePlanetHubIngressReclaim();
      emitMemProfileMarker({ stage: 'planet_hub', event: 'route_focus' });
      ackDevMetroReloadMount();
      return () => {
        setIsPlanetRouteFocused(false);
        resetPlanetHubSpyIntelDialogSchedule();
        flushMiningPlayerPersist();
        if (hubSubStageNavRef.current) {
          hubSubStageNavRef.current = false;
          return;
        }
        if (isDevMetroReloadPrepareInFlight()) {
          return;
        }
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
  useLayoutEffect(() => {
    if (currentPlanetId) {
      hubPlanetIdRef.current = currentPlanetId;
    }
  }, [currentPlanetId]);
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
      const pid = usePlayerStore.getState().player?.currentPlanetId ?? null;
      warmPlanetHubResidentSet(pid);
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
  const beginPlanetHubSuspendingNavigation = useCallback((
    navigate: () => void,
    opts?: { preserveCombatSnapshot?: boolean },
  ) => {
    const now = Date.now();
    applyMiningTeardownRef.current('hub_navigation');

    /**
     * STAGE 이탈 시 오버레이/다이얼로그 잔존 방지 — 대사창을 오래 방치하다 닫고 바로
     * 출발하면(웨이브 종료 대화·결과창 등) 루트 레벨 ArcOverlayHost/IngameDialogHost가
     * 다음 STAGE 위에 그대로 남아 화면이 안 보일 수 있음(7/6 은하지도 검은화면).
     * 오버레이는 onClose 부수효과(보상 지급 등)를 먼저 실행한 뒤 비움 — 보상 유실 방지.
     */
    resolvePendingArcOverlaysForStageExit();
    if (useIngameDialogStore.getState().session != null) {
      useIngameDialogStore.getState().dismiss();
    }

    const sim = combatSimRef.current;
    const preserveCombat = opts?.preserveCombatSnapshot !== false;
    if (preserveCombat) {
      if (sim) sim.captureSuspendSnapshot(now);
    } else {
      teardownPlanetHubCombatForGalaxyDeparture(sim, {
        previousPlanetId: usePlayerStore.getState().player?.currentPlanetId ?? null,
      });
    }

    stageSession.beginDeparture(navigate);
  }, [stageSession.beginDeparture]);

  /**
   * 출발(은하계 지도) — `Navigation.replace()`로 스택 누적 방지 (`1.arcfire_flowchart.md` §4-1)
   */
  const handleDeparture = useCallback(() => {
    const currentPlayer = usePlayerStore.getState().player;
    const travelBlock = resolvePlayerTravelBlock(currentPlayer);
    if (travelBlock) {
      showArcAlert(
        travelBlock === 'durability' ? t('worldmap.durabilityTitle') : t('worldmap.podTitle'),
        travelBlock === 'durability' ? t('worldmap.durabilityBody') : t('worldmap.podBody'),
      );
      return;
    }
    const departPlanetId = currentPlayer?.currentPlanetId ?? null;
    clearPlanetAssaultIntent();
    clearPlanetHubScanUnlockOnDeparture(departPlanetId);
    recordHubDeparturePlanet(departPlanetId);
    warmGalaxyDeparturePreflight(departPlanetId);
    markGalaxyMapIngressFromPlanetHub();
    beginPlanetHubSuspendingNavigation(() => router.replace('/(game)/worldmap'), {
      preserveCombatSnapshot: false,
    });
  }, [beginPlanetHubSuspendingNavigation, t]);

  /** RED 점령지 — 저장 상태로 허브 진입 시 즉시 퇴거 (공격 진입([전투])은 예외 — 웨이브 전투로 판가름) */
  useEffect(() => {
    const pid = resolvedPlanetId?.trim();
    if (!pid || !isPlanetRouteFocused) return;
    if (!resolvePlayerPlanetStayBlock(pid)) return;
    // 분쟁외 RED [전투] 허용 — assault+stay면 resolver.enabled true라 퇴거하지 않는다.
    // 쿨다운·occupationCombatEnabled=false 등 웨이브 OFF면 퇴거.
    if (resolvePlanetWaveCombatTrigger(pid).enabled) return;
    // 웨이브 판가름 진행 중 — intent TTL이 장기 런 도중 만료돼도 퇴거하지 않는다(종료 시 승패로 처리)
    if (useWaveDefenseStore.getState().active) return;
    showArcAlert(t('worldmap.redTerritoryTitle'), t('worldmap.redTerritoryBody'));
    beginPlanetHubSuspendingNavigation(() => router.replace('/(game)/worldmap'), {
      preserveCombatSnapshot: false,
    });
  }, [resolvedPlanetId, isPlanetRouteFocused, beginPlanetHubSuspendingNavigation, t]);

  const onFacilityNavigate = useCallback(
    (href: Href) => {
      hubSubStageNavRef.current = true;
      beginPlanetHubSuspendingNavigation(() => router.push(href));
    },
    [beginPlanetHubSuspendingNavigation],
  );

  useEffect(() => {
    if (!isPlanetRouteFocused) {
      registerArcCoreChatFacilityOpener(null);
      return undefined;
    }
    registerArcCoreChatFacilityOpener(onFacilityNavigate);
    const token = registerPlanetSessionResource({
      ownerId: 'arc_core_chat_facility_opener',
      planetId: resolvedPlanetId ?? null,
      dispose: () => registerArcCoreChatFacilityOpener(null),
    });
    return () => {
      registerArcCoreChatFacilityOpener(null);
      token.release();
    };
  }, [isPlanetRouteFocused, onFacilityNavigate, resolvedPlanetId]);

  /** dev 설치·CSV 월드 플래그 변경 시 메뉴 게이트 재계산 (SUB-STAGE 게이트와 동일 정본) */
  const hubFacilityDevRev = usePlanetCoreRuntimeStore((s) => {
    const pid = resolvedPlanetId;
    if (!pid) return '';
    return planetHubFacilityDevMemoRev(s.byPlanetId[pid]?.detail);
  });
  const featureMenuPlanet = useMemo(() => {
    if (!planet) return planet;
    const pid = resolvedPlanetId ?? planet.id;
    return {
      ...planet,
      hasShipyard: isPlanetHubShipyardEnabled(pid),
      hasTradePort: isPlanetHubTradePortEnabled(pid),
      hasResearchLab: isPlanetHubResearchLabEnabled(pid),
      hasBar: isPlanetHubBarEnabled(pid),
    };
  }, [planet, resolvedPlanetId, hubFacilityDevRev, missionProgressRev]);

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

  /** Skia dodge·inbound 마크 — trail(destroyed/impacted) 잔존과 분리 (reclaim 게이트) */
  const arcInboundFlyingDroneCount = useMemo(() => {
    let n = 0;
    for (const d of arcInboundDronesAtPlanet) {
      if (d.phase === 'inbound') n += 1;
    }
    return n;
  }, [arcInboundDronesAtPlanet]);

  /** AiNpc publish와 동일 키 — 궤도 예산 useMemo 불필요 재계산 억제 */
  const arcNpcAtPlanetRenderSig = useMemo(() => {
    const parts: string[] = [];
    for (const ship of arcNpcShipsAtPlanet) {
      parts.push(`${ship.id}:${ship.phase}:${ship.planetId}:${Math.round(ship.orbitRadiusPx)}`);
    }
    parts.sort();
    return parts.join('|');
  }, [arcNpcShipsAtPlanet]);

  const arcNpcShipsAtPlanetRef = useRef(arcNpcShipsAtPlanet);

  /** 웨이브 디펜스 활성(이 행성) — 전투 활성 게이트 우회 + Wave UI */
  const waveDefenseActiveHere = useWaveDefenseStore(
    (s) => s.active && s.planetId === (planet?.id ?? null),
  );
  /** 웨이브 시작 시 동적 분쟁 편입 (idempotent · 중도 이탈에도 편입 · 대표님 2026-09-05) */
  useEffect(() => {
    if (!waveDefenseActiveHere) return;
    const pid = (planet?.id ?? '').trim();
    const sid = (system?.id ?? '').trim();
    if (!pid || !sid) return;
    if (!resolvePlayerPlanetStayBlock(pid)) return;
    void promoteDynamicContestedZone({
      planetId: pid,
      systemId: sid,
      source: 'player_wave_defense',
    });
  }, [waveDefenseActiveHere, planet?.id, system?.id]);
  const waveDefenseSessionHere = useWaveDefenseStore(
    (s) => s.planetId === (planet?.id ?? null) && (s.active || s.phase === 'ended'),
  );
  const waveDefenseWaveIndex = useWaveDefenseStore((s) => s.waveIndex);
  /** 웨이브 간(cleared) reclaim 훅·주기 reclaim skip 정밀화용 — 이 행성 활성 아니면 무관 */
  const waveDefensePhase = useWaveDefenseStore((s) => s.phase);
  const waveDefenseEndHoldActive = useWaveDefenseStore((s) => s.endHoldActive);
  const [midWaveEndHold, setMidWaveEndHold] = useState(false);
  useEffect(() => {
    if (
      !waveDefenseActiveHere
      || waveDefensePhase !== 'cleared'
      || waveDefenseWaveIndex >= WAVE_DEFENSE_MAX_WAVES
    ) {
      setMidWaveEndHold(false);
      return;
    }
    setMidWaveEndHold(true);
    const midHoldTimer = setTimeout(() => setMidWaveEndHold(false), COMBAT_END_HOLD_MS);
    return () => clearTimeout(midHoldTimer);
  }, [waveDefenseActiveHere, waveDefensePhase, waveDefenseWaveIndex]);
  const waveCombatEndVeilVisible =
    waveDefenseEndHoldActive
    || midWaveEndHold
    || (waveDefenseActiveHere && waveDefensePhase === 'cleared' && waveDefenseWaveIndex >= WAVE_DEFENSE_MAX_WAVES)
    || (waveDefenseSessionHere && waveDefensePhase === 'ended');
  useSyncExternalStore(
    subscribeTerritorialPlayerWavePending,
    getTerritorialPlayerWavePendingRevision,
    getTerritorialPlayerWavePendingRevision,
  );
  const territorialTurnPendingHere = isTerritorialPlayerWavePending(planet?.id);
  const questHubOrbitActive = isQuestHubOrbitLockAtPlanet(
    resolveQuestCombatLock(missionProgresses, activeMissionId),
    planet?.id,
  );
  /** 적팀(red/orange) 진입 + balance CSV `mainStageCombatEnabled` 게이트, 또는 웨이브 디펜스 활성 */
  const enemyFleetEntered = Boolean(
    player
    && planet
    && system
    && isPlayerShipCombatCapable(player.ship)
    && evaluateHubMainStageCombatEntered({
      hubOrbitHostileEntered: hasEnemyFleetEnteredPlanetOrbit(planet.id, system.id) || questHubOrbitActive,
      mainStageCombatEnabled: resolveMainStageCombatEnabled(planet.id),
      cooldownActive: isWaveCombatCooldownActive(planet.id),
      territorialTurnPending: territorialTurnPendingHere,
      waveDefenseActiveHere,
      waveDefenseSessionHere,
      dracoCombatTestVenue: isDracoCombatTestVenue(planet.id),
      questHubOrbitActive,
    }),
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
  const hubCombatMenuLocked = isPlanetHubCombatSessionLock({
    battleReadyVisible,
    capitalCombatOrbitActive,
    waveDefenseActive: waveDefenseActiveHere,
  });
  useEffect(() => {
    if (!hubCombatMenuLocked) return;
    hideArcCoreAgentSurfaceForCombat();
  }, [hubCombatMenuLocked]);
  const featureMenuItems = useMemo(
    () => buildPlanetHubFeatureMenuItems({
      planetId: resolvedPlanetId,
      planet: featureMenuPlanet,
      hasTradeBadge: hasTradeMenuBadge,
      clearTradeBadge: () => clearMenuBadge('trade'),
      hasBarBadge: hasBarMenuBadge,
      clearBarBadge: () => clearMenuBadge('bar'),
      push: router.push,
      onFacilityNavigate,
      onDeparture: handleDeparture,
      lockNonDepartureMenus: hubCombatMenuLocked,
    }, t),
    [
      featureMenuPlanet,
      hasTradeMenuBadge,
      hasBarMenuBadge,
      clearMenuBadge,
      handleDeparture,
      onFacilityNavigate,
      resolvedPlanetId,
      t,
      hubCombatMenuLocked,
    ],
  );
  /** menuSlot JSX 안정화 — 채굴 등 상태 갱신 시 무역소 행 불필요 repaint·깜박임 방지 */
  const featureMenuRow = useMemo(
    () => <PlanetHubFeatureMenuRow key={appLocale} items={featureMenuItems} />,
    [appLocale, featureMenuItems],
  );
  const capitalCombatOrbitPaused = !isPlanetRouteFocused || !appStateActive;
  useEffect(() => {
    const pid = (planet?.id ?? resolvedPlanetId ?? '').trim();
    const enabled = Boolean(
      pid
      && playerHydrated
      && isPlanetRouteFocused
      && appStateActive
      && stageSession.isActive
      && !waveDefenseActiveHere
      && !capitalCombatOrbitActive,
    );
    if (!enabled) return undefined;
    const releaseInbound = bindArcCoreInboundTalkRequestToPlanetSession(pid);
    const releaseLifeAsk = bindStellaLifeAskToPlanetSession(pid);
    return () => {
      releaseInbound();
      releaseLifeAsk();
    };
  }, [
    planet?.id,
    resolvedPlanetId,
    playerHydrated,
    isPlanetRouteFocused,
    appStateActive,
    stageSession.isActive,
    waveDefenseActiveHere,
    capitalCombatOrbitActive,
  ]);

  useEffect(() => {
    if (!planet?.id || !system?.id) {
      resetArcInboundDroneHubBridge();
      resetHubInboundDroneDodgeBridge();
      return;
    }
    publishArcInboundDroneHubBridge({
      planetId: planet.id,
      systemId: system.id,
      hubCombatActive: capitalCombatOrbitActive || battleReadyVisible,
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
    battleReadyVisible,
    isPlanetRouteFocused,
    appStateActive,
    stageSession.isActive,
  ]);

  const defenseSatelliteRuntimeKey = usePlanetCoreRuntimeStore((s) => {
    const pid = planet?.id;
    if (!pid) return '';
    return planetHubDefenseSatelliteMemoRev(s.byPlanetId[pid]?.detail);
  });
  const stelliumColonizeRev = useStelliumColonizeStore((s) => `${s.revision}:${s.hydrated}`);
  const planetWorldObjects = useMemo(
    () => (planet && system ? listPlanetWorldObjects({ planet, system }) : []),
    [planet?.id, system?.id, defenseSatelliteRuntimeKey, hubFacilityDevRev, stelliumColonizeRev],
  );

  /** 방위위성 업그레이드 — 오버레이 닫혀도 허브 체류 중 wall-clock 완료 */
  useEffect(() => {
    const pid = planet?.id;
    if (!pid || !isPlanetRouteFocused || !appStateActive || !stageSession.isActive) return undefined;
    const intervalId = setInterval(() => {
      tryCompleteAllPlanetDevJobs(pid);
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

  const capitalCombatOrbitActiveRef = useRef(capitalCombatOrbitActive);
  useLayoutEffect(() => {
    capitalCombatOrbitActiveRef.current = capitalCombatOrbitActive;
  }, [capitalCombatOrbitActive]);

  /**
   * 5분 soft·15분 deep 주기 reclaim skip 게이트 — 웨이브 디펜스 런 중에는
   * capitalCombatOrbitActive가 9웨이브 내내 true로 고정되어 주기 reclaim이 통째로 막힌다.
   * 웨이브 모드일 때는 phase==='combat'(실제 교전 스텝) 동안만 skip하고
   * cleared·countdown·ended 구간은 주기 reclaim을 허용한다. 비웨이브 전투는 기존 동작 유지.
   */
  const periodicReclaimSuppressedRef = useRef(capitalCombatOrbitActive);
  useLayoutEffect(() => {
    periodicReclaimSuppressedRef.current = waveDefenseActiveHere
      ? waveDefensePhase === 'combat'
      : capitalCombatOrbitActive;
  }, [waveDefenseActiveHere, waveDefensePhase, capitalCombatOrbitActive]);

  /** 웨이브 간(cleared) — Skia peak 종료로 간주해 GL floor 회수(연속 웨이브 누적 방지) */
  const prevWaveDefensePhaseRef = useRef(waveDefensePhase);
  useEffect(() => {
    const prevPhase = prevWaveDefensePhaseRef.current;
    prevWaveDefensePhaseRef.current = waveDefensePhase;
    const pid = planet?.id;
    if (!pid || !isPlanetRouteFocused || !waveDefenseActiveHere) return undefined;
    if (prevPhase === waveDefensePhase || waveDefensePhase !== 'cleared') return undefined;
    return schedulePlanetHubPostSkiaPeakReclaim(pid, 'hub_wave_inter_wave');
  }, [waveDefensePhase, waveDefenseActiveHere, planet?.id, isPlanetRouteFocused]);

  const arcInboundFlyingDroneCountRef = useRef(arcInboundFlyingDroneCount);
  useLayoutEffect(() => {
    arcInboundFlyingDroneCountRef.current = arcInboundFlyingDroneCount;
  }, [arcInboundFlyingDroneCount]);

  /** heavy Skia spike(허브 전투 orbit) 종료 — GL floor 즉시 회수 (route_blur 없이) */
  const prevCapitalCombatOrbitActiveRef = useRef(capitalCombatOrbitActive);
  useEffect(() => {
    const wasActive = prevCapitalCombatOrbitActiveRef.current;
    prevCapitalCombatOrbitActiveRef.current = capitalCombatOrbitActive;
    const pid = planet?.id;
    if (!pid || !isPlanetRouteFocused || !wasActive || capitalCombatOrbitActive) return undefined;
    return schedulePlanetHubPostSkiaPeakReclaim(pid, 'hub_combat_orbit_end');
  }, [capitalCombatOrbitActive, planet?.id, isPlanetRouteFocused]);

  /** battleReady 시작 — 전투 Canvas보다 먼저 dodge/Fresco만 비움(순차 할당 대신 켜기 전 회수) */
  const prevBattleReadyVisibleRef = useRef(battleReadyVisible);
  useEffect(() => {
    const wasVisible = prevBattleReadyVisibleRef.current;
    prevBattleReadyVisibleRef.current = battleReadyVisible;
    const pid = planet?.id;
    if (!pid || !isPlanetRouteFocused || wasVisible || !battleReadyVisible) return;
    runPlanetHubPreCombatReclaimPass('hub_battle_ready_pre_combat');
  }, [battleReadyVisible, planet?.id, isPlanetRouteFocused]);

  /**
   * flying→0 — dodge/peak 1차만. pending soft·settle은 trail 잔존(~1.4s) 뒤 vfx_cleared에서.
   * (flying 직후 soft flush는 45s coalesce로 settle soft를 무효화하는 회귀가 있었음)
   */
  const prevInboundFlyingDroneCountRef = useRef(arcInboundFlyingDroneCount);
  useEffect(() => {
    const prevCount = prevInboundFlyingDroneCountRef.current;
    const curCount = arcInboundFlyingDroneCount;
    prevInboundFlyingDroneCountRef.current = curCount;
    const pid = planet?.id;
    if (!pid || !isPlanetRouteFocused || capitalCombatOrbitActive || battleReadyVisible) return undefined;
    if (prevCount <= 0 || curCount !== 0) return undefined;
    return schedulePlanetHubPostSkiaPeakReclaim(pid, 'hub_inbound_drone_end');
  }, [
    arcInboundFlyingDroneCount,
    capitalCombatOrbitActive,
    battleReadyVisible,
    planet?.id,
    isPlanetRouteFocused,
  ]);

  /**
   * trail·destroyed/impacted 잔존까지 0 — VFX 레이어 완전 이탈 후 settle soft + pending flush.
   * flying→0 시점에는 trail Canvas가 아직 마운트인 경우가 많음(시각 변경 없음).
   */
  const prevInboundAtPlanetCountRef = useRef(arcInboundDronesAtPlanet.length);
  useEffect(() => {
    const prevLen = prevInboundAtPlanetCountRef.current;
    const curLen = arcInboundDronesAtPlanet.length;
    prevInboundAtPlanetCountRef.current = curLen;
    const pid = planet?.id;
    if (!pid || !isPlanetRouteFocused || capitalCombatOrbitActive || battleReadyVisible) return undefined;
    if (prevLen <= 0 || curLen !== 0) return undefined;
    return schedulePlanetHubPostSkiaPeakReclaim(pid, 'hub_inbound_vfx_cleared');
  }, [
    arcInboundDronesAtPlanet.length,
    capitalCombatOrbitActive,
    battleReadyVisible,
    planet?.id,
    isPlanetRouteFocused,
  ]);

  /** Skia arm — route_blur teardown 2×rAF 후 mount (ingress Native step 완화) */
  const [hubSkiaArmReady, setHubSkiaArmReady] = useState(false);
  useEffect(() => {
    if (!planetStageSkiaActive) {
      setHubSkiaArmReady(false);
      return undefined;
    }
    let cancelled = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) setHubSkiaArmReady(true);
      });
    });
    return () => {
      cancelled = true;
      setHubSkiaArmReady(false);
    };
  }, [planetStageSkiaActive]);
  const hubStageSkiaActive = planetStageSkiaActive && hubSkiaArmReady;

  /** 허브 체류 PSS/Native floor — 5분 soft + deferred Fresco (전투 orbit 활성 시 skip) */
  useEffect(() => {
    const pid = planet?.id;
    if (!pid || !isPlanetRouteFocused || !appStateActive || !stageSession.isActive) return undefined;
    const intervalId = setInterval(() => {
      if (periodicReclaimSuppressedRef.current) return;
      if (arcInboundFlyingDroneCountRef.current > 0) {
        /** soft 누락 → flying=0 때 flush (허브 idle PSS 계단 완화) */
        markHubSoftReclaimPending('hub_periodic_soft_skipped_inbound');
        return;
      }
      runPlanetHubSoftNativeReclaimPass(pid, 'hub_periodic_soft');
    }, HUB_SOFT_NATIVE_RECLAIM_INTERVAL_MS);
    const token = registerPlanetSessionResource({
      ownerId: 'planet_hub_soft_native_reclaim',
      planetId: pid,
      dispose: () => clearInterval(intervalId),
    });
    return () => {
      clearInterval(intervalId);
      token.release();
    };
  }, [planet?.id, isPlanetRouteFocused, appStateActive, stageSession.isActive]);

  /** 허브 체류 Native(PSS) floor — 15분 주기 Fresco trim + RN 백드롭 remount */
  useEffect(() => {
    const pid = planet?.id;
    if (!pid || !isPlanetRouteFocused || !appStateActive || !stageSession.isActive) return undefined;
    const intervalId = setInterval(() => {
      if (periodicReclaimSuppressedRef.current) return;
      if (arcInboundFlyingDroneCountRef.current > 0) {
        markHubSoftReclaimPending('hub_periodic_deep_skipped_inbound');
        return;
      }
      runDeepNativeReclaimPass({
        planetId: pid,
        reason: 'hub_periodic',
        /** idle 15m — Fresco trim만. RN 백드롭 remount는 native_heap floor 계단 유발(6/30 22:52·23:22) */
        skipBackdropRemount: true,
      });
    }, HUB_DEEP_NATIVE_RECLAIM_INTERVAL_MS);
    const token = registerPlanetSessionResource({
      ownerId: 'planet_hub_deep_native_reclaim',
      planetId: pid,
      dispose: () => clearInterval(intervalId),
    });
    return () => {
      clearInterval(intervalId);
      token.release();
    };
  }, [planet?.id, isPlanetRouteFocused, appStateActive, stageSession.isActive]);

  /**
   * 전투 orbit "진행 중" 안전판 — 위 두 주기(5분 soft·15분 deep)는 전투 중 전면 skip되므로,
   * 인카운터가 길게 이어지면 그 사이 module Path/Paint/maskfilter 캐시가 계속 상주할 수 있다.
   * dodge overlay 해제·Fresco trim·RN remount 없이 안전한 캐시 trim만 도는 별도 3분 주기.
   */
  useEffect(() => {
    const pid = planet?.id;
    if (!pid || !isPlanetRouteFocused || !appStateActive || !stageSession.isActive) return undefined;
    const intervalId = setInterval(() => {
      if (!periodicReclaimSuppressedRef.current) return;
      runPlanetHubCombatSafeReclaimPass('hub_combat_in_progress');
    }, HUB_COMBAT_SAFE_RECLAIM_INTERVAL_MS);
    const token = registerPlanetSessionResource({
      ownerId: 'planet_hub_combat_safe_reclaim',
      planetId: pid,
      dispose: () => clearInterval(intervalId),
    });
    return () => {
      clearInterval(intervalId);
      token.release();
    };
  }, [planet?.id, isPlanetRouteFocused, appStateActive, stageSession.isActive]);

  const canOrbitalMine = useMemo(
    () => Boolean(planet && planetHasMineableOrbitalDeposits(planet.id)
      && planetWorldObjects.some((object) => object.kind === 'asteroid')),
    [planet, planetWorldObjects],
  );
  const miningCycleProgressPct = useMemo(() => {
    if (miningSession.status !== 'running' || !miningSession.lastTickAtMs) return 0;
    const elapsed = Math.max(0, miningUiNowMs - miningSession.lastTickAtMs);
    const ratio = Math.max(0, Math.min(1, elapsed / ORBIT_MINING_CYCLE_MS));
    return Math.round(ratio * 100);
  }, [miningSession.lastTickAtMs, miningSession.status, miningUiNowMs]);
  const planetScanActionsUnlocked = usePlanetHubScanUnlocked(resolvedPlanetId);
  const handlePlanetScanComplete = useCallback(() => {
    const pid = resolvedPlanetId ?? usePlayerStore.getState().player?.currentPlanetId ?? null;
    if (!pid) return;
    setPlanetHubScanUnlocked(pid, true);
    tryPresentScanToMainQuestDialog(pid);
  }, [resolvedPlanetId]);
  const handlePlanetScanReset = useCallback(() => {
    const pid = resolvedPlanetId ?? usePlayerStore.getState().player?.currentPlanetId ?? null;
    if (pid) setPlanetHubScanUnlocked(pid, false);
    if (miningSessionRef.current.status === 'running') {
      applyMiningTeardownRef.current('manual_stop');
    }
  }, [resolvedPlanetId]);
  const activeSalvageWreck = useMemo(
    () => planetWorldObjects.find((object) => object.kind === 'wreck') ?? null,
    [planetWorldObjects],
  );
  const handleToggleMining = useCallback(() => {
    if (!planet) return;
    if (!planetScanActionsUnlocked) {
      showArcAlert(t('planet.miningNeedScanTitle'), t('planet.miningNeedScanBody'));
      return;
    }
    if (!canOrbitalMine) {
      showArcAlert(t('planet.miningUnavailableTitle'), t('planet.miningUnavailableBody'));
      return;
    }
    if (miningSessionRef.current.status === 'running') {
      applyMiningTeardownRef.current('manual_stop');
      return;
    }
    if (isOrbitMiningDailyAllowanceExhausted(planet.id)) {
      showArcAlert(t('planet.miningDailyLimitTitle'), t('planet.miningDailyLimitBody'));
      return;
    }
    const miningGoodId = resolvePlanetDisplayPrimaryMineralId(planet.id);
    const now = Date.now();
    const next = startMiningSession(miningSessionRef.current, planet.id, miningGoodId, now);
    miningSessionRef.current = next;
    setMiningSession(next);
    setMiningUiNowMs(now);
  }, [planet, canOrbitalMine, planetScanActionsUnlocked, t]);
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
  const miningScanReady = Boolean(planet) && planetScanActionsUnlocked;
  const miningDriverEnabled =
    miningSession.status === 'running' &&
    Boolean(planet) &&
    canOrbitalMine &&
    miningScanReady &&
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
  const handleMiningDailyAllowanceExhausted = useCallback(() => {
    showArcAlert(t('planet.miningDailyLimitTitle'), t('planet.miningDailyLimitBody'));
  }, [t]);
  const resolveMiningSessionMaxUnits = useCallback((planetId: string) => {
    const runtime = usePlanetCoreRuntimeStore.getState().getPlanetCoreRuntime(planetId);
    return resolveOrbitMiningSessionMaxForPlanet(planetId, runtime?.resource);
  }, []);
  useMiningDriver({
    enabled: miningDriverEnabled,
    sessionRef: miningSessionRef,
    resolveSessionMaxUnits: resolveMiningSessionMaxUnits,
    applySession: setMiningSession,
    applyUiNowMs: setMiningUiNowMs,
    onGrant: handleMiningGrant,
    onDailyAllowanceExhausted: handleMiningDailyAllowanceExhausted,
  });
  const ingameDialogActive = useIngameDialogStore((s) => s.session != null);

  /** 웨이브 디펜스 전체 종료 → 오퍼레이터 종료 대사 1회 · RED 점유 행성이면 승리=중립화 / 패배=퇴거 */
  const waveEndDialogShownRef = useRef(false);
  const handleWaveDefenseRunEnded = useCallback(() => {
    const ended = useWaveDefenseStore.getState();
    const endedPlanetId = (ended.planetId ?? '').trim();
    const endedSystemId = (ended.systemId ?? '').trim();
    const endedOutcome = ended.outcome ?? 'win';
    // 승리 → 30분 재개 대기 마킹 (결과창 중 즉시 재트리거 차단 · 대표님 지시 2026-07-22)
    if (endedOutcome === 'win' && endedPlanetId) {
      markWaveCombatVictoryCooldown(endedPlanetId);
      const waveLock = resolveQuestCombatLock(
        useMissionStore.getState().progresses,
        useMissionStore.getState().activeMissionId,
      );
      applyDefeatEnemyMissionObjectives({
        venue: 'wave_assault',
        planetId: endedPlanetId,
        enemyTemplateId: waveLock?.venue === 'wave_assault' ? waveLock.templateId : null,
      });
    }
    // RED 점유 행성 웨이브 승리 → 즉시 중립화 (대표님 지시 — [전투] 진입 · vega_base 룰 공통)
    const wasRedOccupied = Boolean(endedPlanetId) && resolvePlayerPlanetStayBlock(endedPlanetId) != null;
    // 종료 시 편입 — 한 번이라도 전투가 벌어진 RED 시드 행성 → 동적 분쟁 편입 (승패 무관 · idempotent)
    // 시작 시에도 1회 promote — 여기 종료 호출은 보강(이미 있으면 skip)
    if (wasRedOccupied && endedSystemId) {
      void promoteDynamicContestedZone({
        planetId: endedPlanetId,
        systemId: endedSystemId,
        source: 'player_wave_defense',
      });
    }
    let waveHoldChanged = false;
    let wavePreviousSide: string | undefined;
    let waveNewSide: string | undefined;
    if (wasRedOccupied && endedOutcome === 'win' && endedSystemId) {
      const result = useClanWarFoundationStore.getState().applyArcCoreTerritorialHold({
        planetId: endedPlanetId,
        systemId: endedSystemId,
        factionSide: 'NEUTRAL',
        operationMeta: { source: 'player_wave_defense_win' },
        neutralizedByPlayer: true,
      });
      clearPlanetAssaultIntent();
      waveHoldChanged = result.changed;
      wavePreviousSide = result.previousSide;
      waveNewSide = result.newSide;
      if (result.changed) {
        const seed = getPlanetOccupationSeedRow(endedPlanetId);
        showTerritorialOccupationChangeAlert({
          planetLabelKo: seed?.alertLabelKo?.trim() || planet?.name?.trim() || endedPlanetId,
          planetLabelEn: seed?.alertLabelEn?.trim() || endedPlanetId,
          previousSide: result.previousSide,
          newSide: result.newSide,
          decision: 'battle',
          attackerWon: true,
        });
      }
    }
    // 분쟁 차례 웨이브면 승/패 모두 패스 완료 → 다음 순차. 플레이어 웨이브는 블루 점령을 쓰지 않음.
    // 관측만 기록 — 주둔·승리금은 applyOnPlayerWave=false.
    if (endedPlanetId) {
      applyTheaterNpcPassSideEffects({
        planetId: endedPlanetId,
        decision: waveHoldChanged ? 'battle' : 'status_quo',
        holdChanged: waveHoldChanged,
        source: 'player_wave',
      });
      const pendingSnap = getTerritorialPlayerWavePending();
      void completeTerritorialPassAfterPlayerWave(endedPlanetId).then((ok) => {
        if (!ok || !pendingSnap || pendingSnap.planetId !== endedPlanetId) return;
        publishTerritorialPassLearning({
          planetId: pendingSnap.planetId,
          systemId: pendingSnap.systemId,
          campaignGroup: pendingSnap.campaignGroup,
          decision: waveHoldChanged ? 'battle' : 'status_quo',
          holdChanged: waveHoldChanged,
          previousSide: wavePreviousSide ?? 'unknown',
          newSide: waveNewSide ?? 'unknown',
          source: 'player_wave',
          attackerWon: endedOutcome === 'win',
        });
      });
    }
    waveEndDialogShownRef.current = true;
    presentIngameDialogScene('ingame_dialog_wave_defense_end', {
      autoDismissMs: COMBAT_END_OPERATOR_AUTO_DISMISS_MS,
      onDismiss: () => {
        if (!waveEndDialogShownRef.current) return;
        waveEndDialogShownRef.current = false;
        const s = useWaveDefenseStore.getState();
        const expEarned = s.expEarned;
        runAfterIngameDialogFeatureLinkDelay(() => {
          presentWaveResultOverlay({
          outcome: s.outcome ?? 'win',
          wavesCleared: s.wavesCleared,
          totalWaves: WAVE_DEFENSE_MAX_WAVES,
          expEarned,
          onClose: () => {
            if (expEarned > 0) usePlayerStore.getState().addExp(expEarned);
            useWaveDefenseStore.getState().reset();
            // 패배 — 행성이 여전히 RED 점유면 체류 불가, 은하 지도로 퇴거
            const pid = usePlayerStore.getState().player?.currentPlanetId?.trim() ?? '';
            if (pid && resolvePlayerPlanetStayBlock(pid)) {
              clearPlanetAssaultIntent();
              showArcAlert(t('worldmap.redTerritoryTitle'), t('worldmap.redTerritoryBody'));
              beginPlanetHubSuspendingNavigation(() => router.replace('/(game)/worldmap'), {
                preserveCombatSnapshot: false,
              });
              return;
            }
            const presentCombatEndChannel = () => {
              if (isArcCoreTutorialForceActive()) return;
              queueMicrotask(() => {
                void presentArcCoreBackchannel({
                  reason: 'combat_end',
                  triggerId: `wave:${endedPlanetId || pid}`,
                  openerText: t('arcCoreChat.opener.combat_end'),
                  speakerId: 'arc_core',
                });
              });
            };
            tryPresentPendingMissionClearDialog();
            if (isIngameDialogActive()) {
              runAfterIngameDialogIdle(presentCombatEndChannel);
              return;
            }
            presentCombatEndChannel();
          },
        });
        });
      },
    });
  }, [planet?.name, beginPlanetHubSuspendingNavigation, t]);
  useEffect(() => {
    const id = (planet?.id ?? '').trim();
    if (!id || !playerHydrated || !isPlanetRouteFocused) return;
    void requestTerritorialPlayerWaveIfLandedOnDue(id);
  }, [planet?.id, playerHydrated, isPlanetRouteFocused]);
  /** 웨이브 전투 발생조건 — 단일 정본 resolver (규칙 조율은 resolvePlanetWaveCombatTrigger에서만) */
  const waveCombatTrigger = resolvePlanetWaveCombatTrigger(planet?.id);
  useWaveDefenseController({
    planetId: planet?.id ?? null,
    systemId: system?.id ?? null,
    waveDefenseEnabled: waveCombatTrigger.enabled,
    introDone: !ingameDialogActive,
    routeFocused: isPlanetRouteFocused,
    appActive: appStateActive,
    combatSimActive: capitalCombatOrbitActive,
    onRunEnded: handleWaveDefenseRunEnded,
  });

  useEffect(() => {
    if (!playerHydrated || !player?.currentPlanetId) return;
    markBootPerf('planet_first_render');
  }, [playerHydrated, player?.currentPlanetId]);

  useEffect(() => {
    if (!playerHydrated) return;
    if (!player && !isAccountResetInProgress()) router.replace('/');
  }, [player, playerHydrated]);

  /** 허브 셸·착륙 데이터 끝난 뒤에만 착륙 대사. 개발 sync와 대화를 한 턴에 겹치지 않음. */
  useEffect(() => {
    if (!playerHydrated || !isPlanetRouteFocused) return;
    const landedPlanetId = player?.currentPlanetId ?? null;
    if (!landedPlanetId) {
      resetIngameDialogPlanetLandedDedupe();
      return;
    }
    if (!hubShellReady) return;
    let cancelled = false;
    void (async () => {
      await syncPlanetHubDevelopmentOnLanding(landedPlanetId);
      if (cancelled) return;
      try {
        const { tryEnqueueStelliumColonizeFromLanding } = require('../../src/arcCore/colonize/tryEnqueueStelliumColonize') as typeof import('../../src/arcCore/colonize/tryEnqueueStelliumColonize');
        tryEnqueueStelliumColonizeFromLanding(landedPlanetId);
        const { syncStelliumColonizeOnHubPresence } =
          require('../../src/arcCore/colonize/tickStelliumColonizeRealtime') as typeof import('../../src/arcCore/colonize/tickStelliumColonizeRealtime');
        syncStelliumColonizeOnHubPresence(landedPlanetId);
      } catch {
        /* 개척 패스 미기동 */
      }
      if (cancelled) return;
      tryApplyRepairDroneOnHubPresence();
      if (cancelled) return;
      syncPlanetHubMissionAndDialog(landedPlanetId);
      if (cancelled) return;
      markPlanetHubLandDialogSyncDone(landedPlanetId);
      schedulePlanetHubSpyIntelDialog(landedPlanetId);
    })();
    return () => {
      cancelled = true;
    };
  }, [player?.currentPlanetId, playerHydrated, isPlanetRouteFocused, hubShellReady, hubVisitGen]);

  /** 세축 W3 — 허브 세션 진입 1회. 대사 lastPlanetLandedId 와 공유하지 않음. */
  const orbitVisitSnapKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!playerHydrated || !isPlanetRouteFocused) {
      if (!isPlanetRouteFocused) orbitVisitSnapKeyRef.current = null;
      return;
    }
    const pid = player?.currentPlanetId ?? null;
    if (!pid) {
      orbitVisitSnapKeyRef.current = null;
      return;
    }
    if (orbitVisitSnapKeyRef.current === pid) return;
    orbitVisitSnapKeyRef.current = pid;
    applyOrbitPresenceHubVisit(pid);
  }, [playerHydrated, isPlanetRouteFocused, player?.currentPlanetId]);

  const [nearbyPresence, setNearbyPresence] = useState<ReturnType<typeof resolvePlanetNearbyPresence>>([]);
  const captainOrbitEpochRef = useRef(getCaptainOrbitAssignmentEpochBucket());
  useEffect(() => {
    if (!isPlanetRouteFocused || !planet || !system) {
      setNearbyPresence([]);
      return;
    }
    const refreshTablePresence = () => {
      captainOrbitEpochRef.current = getCaptainOrbitAssignmentEpochBucket();
      setNearbyPresence(resolvePlanetNearbyPresence(planet.id, system.id));
    };
    refreshTablePresence();
    const epochPollId = setInterval(() => {
      const nextEpoch = getCaptainOrbitAssignmentEpochBucket();
      if (nextEpoch === captainOrbitEpochRef.current) return;
      refreshTablePresence();
    }, 60_000);
    const token = registerPlanetSessionResource({
      ownerId: 'planet_hub_captain_orbit_epoch_poll',
      planetId: planet.id,
      dispose: () => clearInterval(epochPollId),
    });
    return () => {
      clearInterval(epochPollId);
      token.release();
      setNearbyPresence([]);
    };
  }, [isPlanetRouteFocused, planet?.id, system?.id, appLocale]);

  const nearbyPresenceRef = useRef(nearbyPresence);

  /** 궤도 Skia·마크 렌더 — 테이블+아크 합산 상한 (아르카디아 17척 등 GL·뷰 폭주 방지) */
  const orbitRenderBudget = useMemo(
    () => applyPlanetHubOrbitRenderBudget(nearbyPresence, arcNpcShipsAtPlanet),
    // arcNpcAtPlanetRenderSig: 구조 동일 시 재계산 억제 · nearbyPresence/목록 길이로 예산 갱신
    [nearbyPresence, arcNpcAtPlanetRenderSig, arcNpcShipsAtPlanet.length],
  );
  const orbitTablePresence = orbitRenderBudget.tableRows;
  const orbitArcShipsAtPlanet = orbitRenderBudget.arcShips;
  const orbitArcSkiaCaptionHeads = useMemo(() => {
    const m = new Map(
      arcNpcCaptainsSnap.map((c) => {
        const csv = getNpcCaptain(c.id);
        const name = resolveNpcCaptainDisplayName(csv, appLocale) || c.name;
        return [c.id, name] as const;
      }),
    );
    return orbitArcShipsAtPlanet.map((s) => orbitLabelHead3(m.get(s.captainId) ?? s.captainId));
  }, [orbitArcShipsAtPlanet, arcNpcCaptainsSnap, appLocale]);

  /** 궤도에 표시 중인 전함 = INFO 단일 소스 (중복 출연 금지) */
  const planetHubOrbitInfoRows = useMemo(() => {
    if (!planet || !system) return [];
    return buildPlanetHubOrbitInfoRows(
      orbitTablePresence,
      orbitArcShipsAtPlanet,
      arcNpcCaptainsSnap,
      planet.id,
      system.id,
    );
  }, [orbitTablePresence, orbitArcShipsAtPlanet, arcNpcCaptainsSnap, planet, system, appLocale]);

  const hubMergedRowsRef = useRef(planetHubOrbitInfoRows);
  const occupierRev = useClanWarFoundationStore(
    (s) => (planet?.id ? (s.planetHolds[planet.id]?.occupierClanId ?? '') : ''),
  );
  const [governorAssignRev, setGovernorAssignRev] = useState(0);
  useEffect(() => {
    if (!planet?.id || !isPlanetRouteFocused) return;
    if (!ensurePlanetGovernorForCurrentHold(planet.id)) return;
    setGovernorAssignRev((n) => n + 1);
  }, [planet?.id, occupierRev, isPlanetRouteFocused]);
  const pinnedInfoRows = useMemo(
    () => (planet?.id
      ? buildPlanetHubPinnedInfoRows(planet.id, appLocale, {
        systemId: system?.id,
        arcShips: orbitArcShipsAtPlanet,
      })
      : []),
    [planet?.id, system?.id, orbitArcShipsAtPlanet, missionProgressRev, occupierRev, governorAssignRev, appLocale],
  );
  const planetHubCaptainIds = useMemo(() => {
    const orbit = collectPlanetHubCaptainIds(planetHubOrbitInfoRows);
    if (pinnedInfoRows.length === 0) return orbit;
    const ids = new Set(orbit);
    for (let i = 0; i < pinnedInfoRows.length; i += 1) {
      const captainId = pinnedInfoRows[i]!.captainId?.trim();
      if (captainId) ids.add(captainId);
    }
    return [...ids];
  }, [planetHubOrbitInfoRows, pinnedInfoRows]);
  /** 동일 행성 co-presence — 팩션 rival/hostile 쌍 (향후 교전·대화 이벤트 훅) */
  const planetHubCoPresencePairs = useMemo(() => {
    if (!planet?.id) return [];
    return listCaptainCoPresencePairsAtPlanet(planet.id, planetHubCaptainIds);
  }, [planet?.id, planetHubCaptainIds]);
  const planetHubCoPresenceHints = useMemo(
    () => resolvePlanetHubCoPresenceInteractionHints(planetHubCoPresencePairs),
    [planetHubCoPresencePairs],
  );
  useEffect(() => {
    if (!planet?.id) return;
    publishPlanetHubCoPresenceObservationIfChanged(
      planet.id,
      system?.id ?? null,
      planetHubCoPresencePairs,
    );
  }, [planet?.id, system?.id, planetHubCoPresencePairs]);
  useEffect(() => () => resetPlanetHubCoPresenceObservationThrottle(), []);
  const hubTalkRosterHasUnread = useMemo(() => {
    if (!planet?.id) return false;
    return planetHubTalkRosterHasBadge(planet.id, planetHubCaptainIds, planetHubCoPresenceHints);
  }, [planet?.id, planetHubCaptainIds, planetHubCoPresenceHints, hubDialogBadgeRev, missionProgressRev, spyIntelAlertRev]);
  const inboundTalkPending = useSyncExternalStore(
    subscribeInboundTalkPending,
    hasInboundTalkPending,
    hasInboundTalkPending,
  );
  useEffect(() => {
    if (!planet?.id) return;
    if (!hubShellReady || !isPlanetRouteFocused) return;
    schedulePlanetHubSpyIntelDialog(planet.id);
  }, [planet?.id, spyIntelAlertRev, hubDialogBadgeRev, hubShellReady, isPlanetRouteFocused]);
  const openPlanetHubNpcDialog = useCallback(() => {
    if (hubCombatMenuLocked) return;
    if (isIngameDialogActive() || !planet) return;
    rememberPlanetHubTalkRosterSession(planet.id, planetHubCaptainIds, planetHubCoPresenceHints);
    presentHubNlMouthThenMessenger('operator');
  }, [hubCombatMenuLocked, planet, planetHubCaptainIds, planetHubCoPresenceHints]);
  const handlePlanetSalvageSearchBegin = useCallback(() => {
    if (isSalvageSearchDailyCapped()) {
      showArcAlert(
        t('planet.searchDailyLimitTitle'),
        t('planet.searchDailyLimitBody', { cap: String(resolvePlanetSalvageSearchPolicy().dailySearchCap) }),
      );
      return false;
    }
    return true;
  }, [isSalvageSearchDailyCapped, t]);
  const handlePlanetSalvageSearch = useCallback(() => {
    if (!planet || !activeSalvageWreck) {
      showArcAlert(t('planet.searchTitle'), t('planet.searchNone'));
      return;
    }
    if (!tryConsumeSalvageSearchDailyAttempt()) {
      showArcAlert(
        t('planet.searchDailyLimitTitle'),
        t('planet.searchDailyLimitBody', { cap: String(resolvePlanetSalvageSearchPolicy().dailySearchCap) }),
      );
      return;
    }
    const afterConsume = usePlayerStore.getState().player;
    const attempt = afterConsume?.salvageSearchCountToday ?? 1;
    const dayKey = afterConsume?.salvageSearchDayKey ?? '';
    const outcome = resolvePlanetSalvageSearchOutcome(
      planet.id,
      activeSalvageWreck.id,
      attempt,
      dayKey,
    );
    if (outcome.kind === 'relic') {
      addInventoryItem(outcome.itemId, 1);
      setMenuBadge('trade', true);
      const relic = getArcCorePantheonRelicByItemId(outcome.itemId);
      if (relic) {
        useArcCorePantheonCodexStore.getState().unlockGod(relic.godId, relic.revealLevelDefault);
        showArcAlert(
          t('planet.searchRelicDoneTitle'),
          t('planet.searchRelicDoneBody', {
            god: formatPantheonGodLabel(relic),
            item: formatSalvageLootLabel(outcome.itemId),
          }),
        );
      } else {
        showArcAlert(
          t('planet.searchDoneTitle'),
          t('planet.searchDoneBody', { item: formatSalvageLootLabel(outcome.itemId) }),
        );
      }
      return;
    }
    if (outcome.kind === 'cash') {
      grantSalvageCredits(outcome.credits);
      showArcAlert(
        t('planet.searchCashTitle'),
        t('planet.searchCashBody', {
          credits: formatCredits(outcome.credits, { suffix: false }),
        }),
      );
      return;
    }
    addInventoryItem(outcome.itemId, 1);
    setMenuBadge('trade', true);
    showArcAlert(t('planet.searchDoneTitle'), t('planet.searchDoneBody', { item: formatSalvageLootLabel(outcome.itemId) }));
  }, [
    planet,
    activeSalvageWreck,
    addInventoryItem,
    grantSalvageCredits,
    tryConsumeSalvageSearchDailyAttempt,
    setMenuBadge,
    t,
  ]);
  const tableOrbitSlotCountRef = useRef(0);
  const arcShipIndexByIdRef = useRef<Map<string, number>>(new Map());

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
  const agentFrontSv = useSharedValue(0);
  useEffect(() => {
    const sync = (front: 'game' | 'agent') => {
      agentFrontSv.value = front === 'agent' ? 1 : 0;
    };
    sync(useArcCoreAgentSurfaceStore.getState().front);
    return useArcCoreAgentSurfaceStore.subscribe((s) => {
      sync(s.front);
    });
  }, [agentFrontSv]);
  const orbitParamsSv = useSharedValue<number[]>([]);
  const orbitClockJsBridgeLastSyncSv = useSharedValue(0);
  /** inbound·전투 없을 때 JS 미러 512ms — idle 2h PSS creep(32ms runOnJS) 원천 차단 */
  const orbitClockJsMirrorIntervalSv = useSharedValue(ORBIT_CLOCK_JS_MIRROR_INTERVAL_MS);
  const bridgeNoteOrbitClockJs = useCallback((ms: number) => {
    notePlanetOrbitClockMsJs(ms);
  }, []);
  const orbitFlatParamsJsRef = useRef(orbitFlatParams);
  const orbitFlatParamsSigRef = useRef('');

  useLayoutEffect(() => {
    arcNpcShipsAtPlanetRef.current = arcNpcShipsAtPlanet;
    nearbyPresenceRef.current = nearbyPresence;
    hubMergedRowsRef.current = planetHubOrbitInfoRows;
    tableOrbitSlotCountRef.current = orbitTablePresence.length;
    const shipIndex = new Map<string, number>();
    for (let i = 0; i < arcNpcShipsAtPlanet.length; i++) {
      shipIndex.set(arcNpcShipsAtPlanet[i]!.id, i);
    }
    arcShipIndexByIdRef.current = shipIndex;
    orbitFlatParamsJsRef.current = orbitFlatParams;
  }, [
    arcNpcShipsAtPlanet,
    nearbyPresence,
    planetHubOrbitInfoRows,
    orbitTablePresence.length,
    orbitFlatParams,
  ]);

  useEffect(() => {
    const needsFastMirror =
      arcInboundDronesAtPlanet.length > 0 || capitalCombatOrbitActive;
    orbitClockJsMirrorIntervalSv.value = needsFastMirror
      ? ORBIT_CLOCK_JS_MIRROR_INTERVAL_MS
      : ORBIT_CLOCK_JS_MIRROR_IDLE_MS;
  }, [
    arcInboundDronesAtPlanet.length,
    capitalCombatOrbitActive,
    orbitClockJsMirrorIntervalSv,
  ]);

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
    if (agentFrontSv.value > 0) return;
    const dt = Math.min(timeSincePreviousFrame ?? 0, ORBIT_FRAME_DT_MAX_MS);
    if (dt <= 0 || !Number.isFinite(dt)) return;
    orbitClockMs.value += dt;
    const now = orbitClockMs.value;
    if (now - orbitClockJsBridgeLastSyncSv.value >= orbitClockJsMirrorIntervalSv.value) {
      orbitClockJsBridgeLastSyncSv.value = now;
      runOnJS(bridgeNoteOrbitClockJs)(now);
    }
  }, false);

  useEffect(() => {
    const sig = orbitFlatParams.length > 0 ? orbitFlatParams.join(',') : '';
    if (sig === orbitFlatParamsSigRef.current) return;
    orbitFlatParamsSigRef.current = sig;
    orbitParamsSv.value = orbitFlatParams.length > 0 ? orbitFlatParams.slice() : orbitFlatParams;
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
      notePlanetOrbitClockMsJs(0);
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
  const arcPackSortEpochRef = useRef(createArcOrbitPackEpochState());
  useEffect(() => {
    const { flat, syncMs } = packArcNpcShipsWithEpoch(
      orbitArcShipsAtPlanet,
      arcPackSortEpochRef.current,
    );
    arcPackSortRef.current = {
      flat,
      t0: syncMs,
      count: orbitArcShipsAtPlanet.length,
    };
  }, [orbitArcShipsAtPlanet]);

  const [infoLineOrder, setInfoLineOrder] = useState<number[]>([]);
  useEffect(() => {
    const len = planetHubOrbitInfoRows.length;
    if (len === 0) {
      setInfoLineOrder([]);
      return;
    }
    setInfoLineOrder(prev => (prev.length === len ? prev : Array.from({ length: len }, (_, i) => i)));
  }, [planetHubOrbitInfoRows.length]);

  const applyInfoDistanceSort = useCallback(() => {
    const merged = hubMergedRowsRef.current;
    const L = merged.length;
    if (L === 0) {
      setInfoLineOrder([]);
      return;
    }
    const baseLen = tableOrbitSlotCountRef.current;
    const arcIndexById = arcShipIndexByIdRef.current;
    const m = readPlanetOrbitClockMs();
    const flatTable = orbitFlatParamsJsRef.current;
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
  }, []);

  usePlanetHubInfoDistanceSort(
    resolvedPlanetId,
    planetStageSkiaActive && !capitalCombatOrbitActive,
    applyInfoDistanceSort,
    capitalCombatOrbitActive ? 0 : planetHubOrbitInfoRows.length,
  );

  const sortedShipInfoRows = useMemo(() => {
    if (capitalCombatOrbitActive) return [];
    const len = planetHubOrbitInfoRows.length;
    const order =
      len === 0
        ? []
        : infoLineOrder.length === len
          ? infoLineOrder
          : Array.from({ length: len }, (_, i) => i);
    const npcRows = order.map((i) => {
      const slot = planetHubOrbitInfoRows[i]!;
      return normalizeNearbyInfoDetailRow(
        buildNearbyInfoDetailRow(slot.slotIndex, slot.displayLine, {
          captainId: slot.captainId,
          shipId: slot.linkedCapitalShipId,
        }),
      );
    });
    const withPinned = mergePinnedHubInfoRows(npcRows, pinnedInfoRows);
    const stamped = planet?.id
      ? stampNearbyInfoMainQuestFlags(withPinned, planet.id)
      : withPinned;
    return omitPlayerFlagshipHubInfoRows(
      stamped,
      player ? resolvePlayerFlagshipNpcShipId(player.ship) : undefined,
    );
  }, [
    infoLineOrder,
    planetHubOrbitInfoRows,
    pinnedInfoRows,
    player?.ship.templateId,
    player?.ship.portraitNpcCapitalShipId,
    planet?.id,
    missionProgressRev,
    capitalCombatOrbitActive,
  ]);
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

  const handleOpenPlanetInfo = useHeavyUiPlanetHubAction(planet?.id ?? null, () => {
    if (hubCombatMenuLocked || !planet?.id) return;
    presentPlanetEconomyInfoOverlay(planet.id, planet.name?.trim() || planet.id);
  });

  /** 클랜 점유: 솔라 스테이션과 동일 플로우(플레이트만, 성계별 보정 없음) */
  const safeAiClanTerritoryPlate = useClanWarFoundationStore(
    useCallback((s) => {
      const pid = planet?.id;
      if (!pid) return null;
      const h = s.planetHolds[pid];
      if (!h) return null;
      const plate = resolvePlanetHubOwnershipPlate(h, s.clans, appLocale);
      if (!plate) return null;
      return {
        clanName: plate.clanName,
        clanColor: resolveTempClanColor(plate.clanColorClanId),
      };
    }, [planet?.id, appLocale]),
  );

  /** 수도 거점 부제 — 행성 정보 오버레이(PGP 상단)로 이전, 허브 중앙 배지에는 미표시 */
  const clanTerritorySubtitle: string | null = null;
  const currentPilotClanName = useClanWarFoundationStore(
    useCallback((s) => {
      const clanId = player?.political.clanId;
      if (!clanId) return t('planet.unaffiliated');
      const displayName = (s.clans[clanId]?.displayName ?? '').trim();
      const raw = displayName.length > 0 ? displayName : clanId;
      return resolveClanDisplayNameForLocale(raw, appLocale);
    }, [player?.political.clanId, t, appLocale]),
  );
  const pilotShipDisplayName = useMemo(
    () =>
      player?.ship
        ? resolvePlayerShipDisplayName(player.ship, appLocale)
        : '',
    [
      player?.ship?.name,
      player?.ship?.templateId,
      player?.ship?.portraitNpcCapitalShipId,
      appLocale,
    ],
  );
  const pilotPortraitSource = useMemo(
    () => resolvePlayerPilotPortraitSource(player?.pilotProfile?.professionId),
    [player?.pilotProfile?.professionId],
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
          hubStageSkiaActive={hubStageSkiaActive}
        />
      }
      absoluteOverlay={
        capitalCombatOrbitActive ? (
          <>
            <PlanetCapitalCombatHeavySlot
              active={capitalCombatOrbitActive}
              render={(ui) => (
                <ui.PlanetCapitalCombatOrbitForegroundOverlay
                  backgroundChrome={mainStageVertical.backgroundChrome}
                  planetStageScale={planetStageScale}
                />
              )}
            />
            <CombatEndHoldVeil visible={waveCombatEndVeilVisible} />
          </>
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
                <Ionicons name="power" size={18} color={TACTICAL_HUB.topBarIconInk} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={handleOpenSettings} accessibilityLabel={t('planet.a11ySettings')}>
                <Ionicons name="settings-outline" size={18} color={TACTICAL_HUB.topBarIconInk} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => presentPlanetOwnershipRosterOverlay()}
                accessibilityLabel={t('planet.a11yRanking')}
              >
                <Ionicons name="podium-outline" size={18} color={TACTICAL_HUB.topBarIconInk} />
              </TouchableOpacity>
            </View>

            <Text style={styles.topBarTitle} numberOfLines={1}>{t('planet.mainStage')}</Text>

            <View style={styles.topBarRight}>
              <TouchableOpacity
                style={[styles.currencyChip, styles.currencyChipGem]}
                onPress={() => presentBmShopOverlay('premium')}
                accessibilityLabel={t('planet.a11yGemShop')}
              >
                <Ionicons name="diamond-outline" size={14} color={TACTICAL_HUB.topBarIconInk} />
                <Text style={styles.currencyChipTextGem} numberOfLines={1}>
                  {formatGemBalance(resolvePlayerGemBalance(player))}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.currencyChip, styles.currencyChipCredits]}
                onPress={() => presentBmShopOverlay('exchange')}
                accessibilityLabel={t('planet.a11yCreditExchange')}
              >
                <Ionicons name="logo-usd" size={14} color={TACTICAL_HUB.topBarIconInk} />
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
                (hubCombatMenuLocked
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
          pointerEvents="none"
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

        <PlanetMainPlanetInfoTapOverlay
          reserveHeightPx={planetStageReservePx}
          planetStageScale={planetStageScale}
          disabled={!planet?.id || hubCombatMenuLocked}
          onPress={handleOpenPlanetInfo}
        />

        <View
          style={[
            styles.planetBottomDock,
            { paddingBottom: Math.max(SPACING.xs, safeAreaInsets.bottom) },
          ]}
        >
          {!hubCombatMenuLocked ? (
            <PlanetMainScanActionRow
              layout="dock"
              planetId={planet?.id ?? null}
              planetName={planet?.name ?? null}
              scanEnabled={Boolean(planet)}
              actionsUnlocked={planetScanActionsUnlocked}
              miningLabel={miningSession.status === 'running' ? t('planet.miningStop') : t('planet.mining')}
              miningDisabled={!canOrbitalMine}
              miningPrimary={miningSession.status === 'running'}
              dialogShowBadge={hubTalkRosterHasUnread || inboundTalkPending}
              searchDisabled={!activeSalvageWreck}
              onScanComplete={handlePlanetScanComplete}
              onScanReset={handlePlanetScanReset}
              onPressMining={handleToggleMining}
              onPressDialog={openPlanetHubNpcDialog}
              onSearchBegin={handlePlanetSalvageSearchBegin}
              onSearchComplete={handlePlanetSalvageSearch}
            />
          ) : null}
          <PlanetMainPilotInfoPanel
            nickname={player.nickname}
            level={player.level}
            creditsLabel={formatCredits(player.credits, { suffix: false })}
            shipName={pilotShipDisplayName}
            skillPoints={player.skillPoints}
            clanName={currentPilotClanName}
            portraitSource={pilotPortraitSource}
            menuSlot={featureMenuRow}
          />
        </View>

        {!capitalCombatOrbitActive ? (
        <View style={styles.infoOverlaySlot}>
          <NearbyShipInfoPanel
            rows={sortedShipInfoRows}
            planetId={planet?.id ?? ''}
          />
        </View>
        ) : null}
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

registerDevHotModuleDisposeGuard('planet_hub');