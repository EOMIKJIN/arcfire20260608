// ============================================================
// 아크파이어 온라인 - 행성 허브 화면
// ============================================================

import React, { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, useWindowDimensions, Image, Platform,
  AppState,
} from 'react-native';
import type { LayoutChangeEvent, NativeSyntheticEvent, TextLayoutEventData } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import { router, useFocusEffect, useNavigation, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line, Polyline } from 'react-native-svg';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS, FONTS, SPACING, ZONE_LABELS, ZONE_COLORS } from '../../src/utils/theme';
import { showArcAlert } from '../../src/utils/showArcAlert';
import type { StarSystem, ZoneType } from '../../src/types';
import { usePlayerStore } from '../../src/store/playerStore';
import { useWorldStore } from '../../src/store/worldStore';
import { useMissionStore } from '../../src/store/missionStore';
import { useItemLedgerStore } from '../../src/store/itemLedgerStore';
import { useAccountProfileStore } from '../../src/store/accountProfileStore';
import { useSkillDbStore } from '../../src/store/skillDbStore';
import { useClanWarFoundationStore } from '../../src/store/clanWarFoundationStore';
import { useMenuNotificationStore } from '../../src/store/menuNotificationStore';
import { useArcNpcTrafficStore, type ArcNpcTrafficShip } from '../../src/store/arcNpcTrafficStore';
import {
  planetCoreRuntimeToGaugeView,
  type PlanetCoreGaugeView,
  planetCsvBaselineToRuntime,
  usePlanetCoreRuntimeStore,
} from '../../src/store/planetCoreRuntimeStore';
import { usePlanetNebulaStore } from '../../src/store/planetNebulaStore';
import { useBattleStanceStore, BATTLE_STANCE_META } from '../../src/store/battleStanceStore';
import { registerPlanetOrbitClockMs } from '../../src/arcCore/orbitClockMsBridge';
import { releasePlanetMainStageSession } from '../../src/game/planetMainStageSession';
import { registerPlanetSessionResource } from '../../src/game/planetSessionRegistry';
import { usePlanetStageSession } from '../../src/game/usePlanetStageSession';
import { buildCsvStaticIndexes } from '../../src/game/buildCsvStaticIndexes';
import { releasePlanetHubStageMemory } from '../../src/game/stageMemoryRelease';
import { useStageMemory } from '../../src/hooks/useStageMemory';
import { usePlanetStageLifecycleStore } from '../../src/game/planetStageLifecycle';
import {
  resetPlanetHubNavigationThrottle,
} from '../../src/navigation/safePlanetHubNavigate';
import { PlanetCorePortraitWithTempAdminOverride } from '../../src/components/planet/PlanetCorePortraitWithTempAdminOverride';
import { PlanetHubOrbitSkiaLayer } from '../../src/components/planet/PlanetHubOrbitSkiaLayer';
import { SkiaPlanetNebulaShaderBackdrop } from '../../src/components/planet/SkiaPlanetNebulaShaderBackdrop';
import {
  computeArcNpcShipScreenPacked,
  computeTableNpcOrbitXY,
  jsArcNpcDistanceFromCenter,
  jsTableNpcDistanceFromCenter,
  packArcNpcShipsToFloat32,
} from '../../src/components/planet/planetOrbitHubWorklets';
import { QuestHUD } from '../../src/components/QuestHUD';
import { IngameDialogOverlay } from '../../src/components/IngameDialogOverlay';
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
  PLANET_MAIN_BOTTOM_FEATURE_RESERVE_PX,
  PLANET_MAIN_FOREGROUND_MENU_STACK_OFFSET_TOP_PX,
  PLANET_MAIN_FOREGROUND_TOP_CHROME_LIFT_PX,
  PLANET_MAIN_ORBIT_SCENE_SIZE as ORBIT_SCENE_SIZE,
  PLANET_MAIN_TOPBAR_BORDER_BOTTOM_PX,
  PLANET_MAIN_TOPBAR_ICON_BORDER_RADIUS,
  PLANET_MAIN_TOPBAR_ICON_BUTTON_PX,
  PLANET_MAIN_TOPBAR_PADDING_HORIZONTAL,
  PLANET_MAIN_TOPBAR_PADDING_VERTICAL,
} from '../../src/stages/planetMainStageLayout';
import {
  NEARBY_PRESENCE_DISPLAY_SEP,
  mergeArcShipsIntoNearbyHubPresence,
  resolvePlanetNearbyPresence,
} from '../../src/npc';
import {
  CapitalRealtimeCombatHudOverlay,
  CapitalRealtimeCombatOrbitSvg,
  CapitalRealtimeCombatSimBinder,
  useCapitalRealtimeCombatSimContext,
  type PlanetEdenRaidSim,
} from '../../src/combat';
import { ORBIT_MINING_CYCLE_MS } from '../../src/game/miningConfig';
import { listPlanetWorldObjects, type WorldObject } from '../../src/worldObjects';
import {
  captureMiningResumeSnapshot,
  clearMiningResumeSnapshot,
  consumeMiningResumeSnapshotForPlanet,
  createInitialMiningSessionState,
  hydrateMiningResumeStore,
  miningResumeSnapshotToSession,
  startMiningSession,
  stopMiningSession,
  useMiningDriver,
  type MiningSessionState,
} from '../../src/systems/mining';
import { STORY_SCENES_FROM_CSV } from '../../src/data/generated/csvStoryScenes';
import { resolveMainStageSkiaBackdrop } from '../../src/game/mainStageSkiaBackdrop';
import { NPC_CAPTAINS_FROM_CSV } from '../../src/data/generated/csvNpcCaptains';
import { captainMatchesPlanetOrbitTable } from '../../src/npc/captainOrbitTableMatch';
import { resolveTempClanColor } from '../../src/clanWar/tempClanColors';
import { markFreshStartAfterReset } from '../../src/firebase/auth';
import { purgeAccountDataByUid } from '../../src/account/accountLifecycle';
import { resolveNpcCaptainPortraitSource } from '../../src/game/npcCaptainPortraitAssets';
import { countGoodInInventory } from '../../src/game/playerInventory';
import { buildPlanetHubFeatureMenuItems } from '../../src/systems/planetHub/planetHubFeatureSystems';

/** 행성 허브 궤도 worklet·Skia 공통 — `PlanetScreen`보다 아래에 두면 TDZ이므로 상단 고정 */
const NPC_ORBIT_CYCLE_MS = 54000;
const ORBIT_FLAT_STRIDE = 7;
const ORBIT_FRAME_DT_MAX_MS = 34;

/** INFO: 행성 중심에 가까운 순 — `2.1.memory.md` §9 · rendering-pipeline-baseline §2 (5000ms) */
const INFO_DISTANCE_SORT_INTERVAL_MS = 5000;

const PLANET_CORE_GAUGE_SPEC = [
  { key: 'resource', label: 'R', color: '#35D0FF' },
  { key: 'population', label: 'P', color: '#6BFF8D' },
  { key: 'defense', label: 'D', color: '#FF6B6B' },
  { key: 'technology', label: 'T', color: '#D37BFF' },
  { key: 'environment', label: 'E', color: '#FFE36B' },
] as const;

/**
 * 메인스테이지 자본궤도 전투 활성 시(`CapitalRealtimeCombatSimBinder` active) 행성 허브 정보 톤다운.
 * 전투 SVG(`CapitalRealtimeCombatOrbitSvg`)는 `orbitTestLayer`에 두어 이 톤과 분리한다.
 */
const PLANET_HUB_CAPITAL_COMBAT_DIM_OPACITY = 0.48;
const PLANET_HUB_CAPITAL_COMBAT_GRAY = {
  zoneText: '#96A0B0',
  zoneBorder: '#7E8896',
  systemName: '#9AA6B6',
  territory: '#98A2B2',
  clanText: '#A4AEBE',
  clanIcon: '#9AA4B4',
  shipMark: '#AAB4C4',
  gaugeLabel: '#8B95A8',
  gaugeOn: '#8F99A8',
  gaugeOffBg: 'rgba(90, 98, 110, 0.2)',
  gaugeOffBorder: 'rgba(110, 118, 130, 0.34)',
  planetRing: '#8E98A8',
} as const;

/** info 로그: 한 줄 블록(한글 포함 실제 행 높이 + 행 간격) */
const INFO_LOG_LINE_HEIGHT_PX = 16;
const INFO_LOG_ROW_GAP_PX = 4;
const INFO_LOG_LINE_BLOCK_PX = INFO_LOG_LINE_HEIGHT_PX + INFO_LOG_ROW_GAP_PX;
/** 스크롤 뷰포트에 고정으로 보이는 줄 수 — 전함 4척 기준, 초과분은 스크롤 */
const INFO_LOG_VIEWPORT_ROWS = 4;
/** 스크롤 콘텐츠 하단(마지막 글자 하강·측정 오차) */
const INFO_LOG_CONTENT_PAD_BOTTOM = 8;
/** 뷰포트 높이(고정): 4행 + 하단 패딩 */
const INFO_LOG_SCROLL_VIEWPORT_PX =
  INFO_LOG_VIEWPORT_ROWS * INFO_LOG_LINE_BLOCK_PX + INFO_LOG_CONTENT_PAD_BOTTOM;
/** 에덴 전투 HUD(2줄+리스폰) 높이 추정 — `출발` 메뉴 직상 배치용 */
const EDEN_COMBAT_HUD_BLOCK_PX = 54;
const PLANET_MAIN_STANCE_ROW_HEIGHT_EST_PX = 28;
/** 태세 표시: 슬롯 보유 여부가 아니라 실제 교전 중 시뮬 상태만 본다 — 간격 폴링 */
const PLANET_MAIN_STANCE_ENGAGEMENT_POLL_MS = 250;
const PLANET_MAIN_STANCE_UI_DELAY_MS = 3000;
const PLANET_MAIN_BATTLE_READY_DURATION_MS = 3000;
const PLANET_MAIN_BATTLE_READY_TICK_MS = 100;
const PLANET_MAIN_BATTLE_READY_BLINK_MS = 180;
const PLANET_MAIN_COMBAT_LAYER_WIDTH_SCALE_X = 1.1;
const PLANET_MAIN_COMBAT_LAYER_HEIGHT_SCALE_Y = 1.1;

function hasEnemyFleetEnteredPlanetOrbit(planetId: string, systemId: string): boolean {
  return NPC_CAPTAINS_FROM_CSV.some((captain) => {
    if (captain.operationalState !== 'combat') return false;
    if (captain.combatTeam !== 'red' && captain.combatTeam !== 'orange') return false;
    return captainMatchesPlanetOrbitTable(captain, planetId, systemId);
  });
}

function computeMainStageCapitalEngagement(sim: PlanetEdenRaidSim): boolean {
  const agents = sim.agentsRef.current;
  let blueAlive = false;
  let foeAlive = false;
  for (let i = 0; i < agents.length; i += 1) {
    const a = agents[i]!;
    if (!a.alive) continue;
    if (a.team === 'blue') blueAlive = true;
    if (a.team === 'red' || a.team === 'orange') foeAlive = true;
  }
  return blueAlive && foeAlive;
}

function formatPilotExp8(exp: number): string {
  const safe = Math.max(0, Math.floor(Number.isFinite(exp) ? exp : 0));
  return String(safe).padStart(8, '0');
}
/** 궤도 ◇ 옆 캡션 — 최대 3글자(확인용) */
function orbitLabelHead3(label: string): string {
  return [...String(label).trim()].slice(0, 3).join('');
}

function orbitCaptainCaptionFromLine(line: string): string {
  const left = line.split(NEARBY_PRESENCE_DISPLAY_SEP)[0] ?? '';
  const idx = left.indexOf(' · ');
  const raw = idx >= 0 ? left.slice(0, idx).trim() : left.trim();
  return orbitLabelHead3(raw);
}

function splitStoryTextByMaxLines(text: string, maxLines: number): string[] {
  const normalized = String(text ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // 의도된 한 줄 띄우기(\n\n)는 유지, 과도한 다중 개행만 축소
    .replace(/\n{3,}/g, '\n\n');
  const lines = normalized
    .split('\n')
    .map((line) => line.trimEnd());
  const safeMax = Math.max(1, maxLines | 0);
  const chunks: string[] = [];
  for (let i = 0; i < lines.length; i += safeMax) {
    chunks.push(lines.slice(i, i + safeMax).join('\n'));
  }
  return chunks.length > 0 ? chunks : [''];
}
function chunkMeasuredLines(lines: string[], maxLines: number): string[] {
  const safeMax = Math.max(1, maxLines | 0);
  const chunks: string[] = [];
  for (let i = 0; i < lines.length; i += safeMax) {
    chunks.push(lines.slice(i, i + safeMax).join('\n'));
  }
  return chunks.length > 0 ? chunks : [''];
}

/**
 * 메인스테이지 출발 시 활성 sim 의 스냅샷을 캡처하기 위한 바인더 내부 ↔ 화면 ref 브리지.
 * 바인더의 Provider 안에서만 `useCapitalRealtimeCombatSimContext()`가 활성 sim 을 반환하므로,
 * 화면(`PlanetScreen` 본문)에서는 ref 로 노출시켜 onPress 동기 흐름에서 읽는다.
 */
const CombatSimRefBridge = memo(function CombatSimRefBridge({
  targetRef,
}: {
  targetRef: React.MutableRefObject<PlanetEdenRaidSim | null>;
}) {
  const sim = useCapitalRealtimeCombatSimContext();
  useEffect(() => {
    targetRef.current = sim;
    return () => {
      targetRef.current = null;
    };
  }, [sim, targetRef]);
  return null;
});

export default function PlanetScreen() {
  const player = usePlayerStore(s => s.player);
  const playerHydrated = usePlayerStore(s => s.hydrated);
  const getSystem = useWorldStore(s => s.getSystem);
  const { width: windowWidth, height: windowHeight, fontScale } = useWindowDimensions();
  const resetLocalPlayer = usePlayerStore(s => s.resetLocalPlayer);
  const setPlayer = usePlayerStore(s => s.setPlayer);
  const addInventoryItem = usePlayerStore(s => s.addInventoryItem);
  const resetLocalMissions = useMissionStore(s => s.resetLocalMissions);
  const purgePlayerAccountWorldState = useClanWarFoundationStore(s => s.purgePlayerAccountWorldState);
  const purgeAllNonAiClanWorldState = useClanWarFoundationStore(s => s.purgeAllNonAiClanWorldState);
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
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      setAppStateActive(next === 'active');
    });
    return () => sub.remove();
  }, []);
  const [miningSession, setMiningSession] = useState<MiningSessionState>(() => createInitialMiningSessionState());
  const miningSessionRef = useRef<MiningSessionState>(createInitialMiningSessionState());
  const [miningUiNowMs, setMiningUiNowMs] = useState(() => Date.now());
  /** 게이지 스로틀(2s)·tick 분배는 `useMiningDriver` 안에서 관리 — Phase 3. */
  const resetTipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Phase 2: 메인스테이지 라이프사이클(Active/Suspending/Frozen/Resuming) 단일 진입점. */
  const stageSession = usePlanetStageSession();
  /**
   * 성운 셰이더·허브 궤도 Skia·Reanimated 궤도 시계 공통 게이트.
   * 출발 직후 `lifecycle !== 'active'` 인 동안 `routeFocused` 는 아직 true 로 남아 Skia 레이어만
   * 따로 계속 도는 상태가 된다 → 전투 Skia 레이어 dispose 와 같은 프레임에서 `librnskia.so` 레이스
   * (SIGSEGV) 가 보고되어, lifecycle 과 반드시 AND 한다.
   */
  const planetStageSkiaActive = isPlanetRouteFocused && stageSession.isActive;
  /** 출발 시점에 전투 sim 스냅샷을 동기 캡처하기 위한 *바인더 내부* sim 참조 — `<CombatSimRefBridge/>`가 채운다. */
  const combatSimRef = useRef<PlanetEdenRaidSim | null>(null);

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
      return () => {
        setIsPlanetRouteFocused(false);
        const blurPid = usePlayerStore.getState().player?.currentPlanetId ?? null;
        releasePlanetMainStageSession({ reason: 'route_blur', previousPlanetId: blurPid });
      };
    }, []),
  );

  useEffect(() => () => {
    if (resetTipTimerRef.current) clearTimeout(resetTipTimerRef.current);
  }, []);
  useEffect(() => {
    miningSessionRef.current = miningSession;
  }, [miningSession]);

  const system = player ? getSystem(player.currentSystemId) : undefined;
  const planet = system?.planets.find(p => p.id === player?.currentPlanetId)
    ?? system?.planets[0];

  useStageMemory(
    planet?.id ?? 'planet_main_stage_hub',
    () => {
      buildCsvStaticIndexes();
    },
    () => {
      const pid = usePlayerStore.getState().player?.currentPlanetId ?? null;
      releasePlanetHubStageMemory(pid);
    },
  );

  const prevMainStagePlanetIdRef = useRef<string | null>(null);
  useEffect(() => {
    const cur = planet?.id ?? null;
    const prev = prevMainStagePlanetIdRef.current;
    if (prev !== null && cur !== null && prev !== cur) {
      releasePlanetMainStageSession({ reason: 'planet_change', previousPlanetId: prev });
    }
    prevMainStagePlanetIdRef.current = cur;
  }, [planet?.id]);
  /**
   * 출발·시설 공통 — 진행 중인 채굴·전투 스냅샷 후 lifecycle suspend → frozen 뒤 navigate.
   * 무역소·조선소 등 즉시 push 만 하면 메인스테이지 Skia·sim 과 신규 화면 첫 mount 가 겹쳐 크래시가 날 수 있어
   * 출발(은하지도)과 동일한 직렬화를 탄다.
   */
  const beginPlanetHubSuspendingNavigation = useCallback((navigate: () => void) => {
    const now = Date.now();
    const ms = miningSessionRef.current;
    if (ms.status === 'running') {
      captureMiningResumeSnapshot(ms, now);
    } else {
      clearMiningResumeSnapshot();
    }
    miningSessionRef.current = stopMiningSession();
    setMiningSession(miningSessionRef.current);

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

  const featureMenuItems = useMemo(
    () => buildPlanetHubFeatureMenuItems({
      planet,
      hasTradeBadge: hasTradeMenuBadge,
      clearTradeBadge: () => clearMenuBadge('trade'),
      push: router.push,
      onFacilityNavigate,
      onDeparture: handleDeparture,
    }),
    [planet, hasTradeMenuBadge, clearMenuBadge, handleDeparture, onFacilityNavigate],
  );
  /** 궤도 시계 활성 조건용 — 함선 수만 구독해 스냅샷 갱신마다 전체 행성 화면이 리렌더되지 않게 함 */
  const arcNpcAtPlanetCount = useArcNpcTrafficStore(
    useCallback((s) => {
      const pid = planet?.id;
      if (!pid) return 0;
      let n = 0;
      for (const sh of s.ships) {
        if (sh.planetId === pid) n += 1;
      }
      return n;
    }, [planet?.id]),
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
  const arcSkiaCaptionHeads = useMemo(() => {
    const m = new Map(arcNpcCaptainsSnap.map((c) => [c.id, c.name] as const));
    return arcNpcShipsAtPlanet.map((s) => orbitLabelHead3(m.get(s.captainId) ?? s.captainId));
  }, [arcNpcShipsAtPlanet, arcNpcCaptainsSnap]);

  /** 모든 행성 공통: 적팀(red/orange) 진입 감지 시 자동 전투 활성 */
  const enemyFleetEntered = Boolean(
    player
    && planet
    && system
    && hasEnemyFleetEnteredPlanetOrbit(planet.id, system.id),
  );
  const [battleReadyMsLeft, setBattleReadyMsLeft] = useState(0);
  const [battleReadyBlinkOn, setBattleReadyBlinkOn] = useState(true);
  const prevEnemyFleetEnteredRef = useRef(false);
  useEffect(() => {
    if (!enemyFleetEntered) {
      setBattleReadyMsLeft(0);
      prevEnemyFleetEnteredRef.current = false;
      return;
    }
    if (!prevEnemyFleetEnteredRef.current) {
      setBattleReadyMsLeft(PLANET_MAIN_BATTLE_READY_DURATION_MS);
      setBattleReadyBlinkOn(true);
    }
    prevEnemyFleetEnteredRef.current = true;
  }, [enemyFleetEntered]);
  useEffect(() => {
    if (battleReadyMsLeft <= 0 || !isPlanetRouteFocused || !appStateActive) return;
    const id = setInterval(() => {
      setBattleReadyMsLeft((prev) => Math.max(0, prev - PLANET_MAIN_BATTLE_READY_TICK_MS));
    }, PLANET_MAIN_BATTLE_READY_TICK_MS);
    return () => clearInterval(id);
  }, [battleReadyMsLeft, appStateActive, isPlanetRouteFocused]);
  useEffect(() => {
    if (battleReadyMsLeft <= 0 || !isPlanetRouteFocused || !appStateActive) return;
    const id = setInterval(() => setBattleReadyBlinkOn((v) => !v), PLANET_MAIN_BATTLE_READY_BLINK_MS);
    return () => clearInterval(id);
  }, [battleReadyMsLeft, appStateActive, isPlanetRouteFocused]);
  const battleReadyVisible = enemyFleetEntered && battleReadyMsLeft > 0;
  const battleReadyCounterSec = Math.max(1, Math.ceil(battleReadyMsLeft / 1000));
  /**
   * Phase 2: lifecycle === 'active' 일 때만 sim refs 가 살아있도록 강제.
   * suspending/frozen 구간에는 active=false 로 sim 의 초기화 effect 가 cleanup → refs 비움.
   */
  const capitalCombatOrbitActive =
    enemyFleetEntered && !battleReadyVisible && stageSession.isActive;
  const capitalCombatOrbitPaused = !isPlanetRouteFocused;

  const planetWorldObjects = useMemo(
    () => (planet && system ? listPlanetWorldObjects({ planet, system }) : []),
    [planet, system],
  );
  const canOrbitalMine = useMemo(
    () => planetWorldObjects.some((object) => object.kind === 'asteroid'),
    [planetWorldObjects],
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
  const handleToggleMining = useCallback(() => {
    if (!planet || !canOrbitalMine) return;
    const miningGoodId = activeMineableAsteroid?.mineralItemId ?? 'ore_mineral_1';
    setMiningSession((prev) => {
      if (prev.status === 'running') {
        /** 사용자 수동 중단 → 출발-재개 스냅샷도 함께 폐기 */
        clearMiningResumeSnapshot();
        return stopMiningSession();
      }
      return startMiningSession(prev, planet.id, miningGoodId, Date.now());
    });
  }, [planet, canOrbitalMine, activeMineableAsteroid]);
  useEffect(() => {
    if (!planet) return;
    /** 행성 변경/초진입 시 우선 동기 초기화(다른 행성의 잔류 상태 격리) */
    setMiningSession(createInitialMiningSessionState());
    miningSessionRef.current = createInitialMiningSessionState();
    let mounted = true;
    void hydrateMiningResumeStore().then(() => {
      if (!mounted) return;
      /** 사용자가 하이드레이트 중에 직접 채굴을 시작했으면 그 의도가 우선이므로 복원 생략. */
      if (miningSessionRef.current.status !== 'idle') return;
      const snap = consumeMiningResumeSnapshotForPlanet(planet.id);
      if (snap) {
        const restored = miningResumeSnapshotToSession(snap);
        miningSessionRef.current = restored;
        setMiningSession(restored);
      }
    });
    return () => {
      mounted = false;
    };
  }, [planet?.id]);
  /**
   * Phase 3: 채굴 tick 인터벌·분배 알고리즘은 `useMiningDriver` 로 추출.
   * `enabled` 신호 한 곳에 정책을 모아두면 lifecycle/포커스/앱 상태 변경 시 즉시 정지.
   */
  const miningDriverEnabled =
    miningSession.status === 'running' &&
    Boolean(planet) &&
    canOrbitalMine &&
    isPlanetRouteFocused &&
    appStateActive &&
    stageSession.isActive;
  const handleMiningGrant = useCallback(
    (grants: { goodId: string; quantity: number }[]) => {
      if (grants.length === 0) return;
      for (const g of grants) {
        if (g.quantity > 0) addInventoryItem(g.goodId, g.quantity);
      }
      setMenuBadge('trade', true);
      void persist();
    },
    [addInventoryItem, setMenuBadge, persist],
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
  const [measuredDialogChunks, setMeasuredDialogChunks] = useState<string[] | null>(null);
  /**
   * 인게임 대화 트리거 전용: `player.currentPlanetId`(메인 행성 허브 착륙) 기준으로만 소비.
   * 무역소·조선소 등 세부 화면 라우트 포커스와 무관.
   */
  const ingameDialogLastLandedPlanetIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!playerHydrated) return;
    if (!player) router.replace('/');
  }, [player, playerHydrated]);

  useEffect(() => {
    const p = usePlayerStore.getState().player;
    const landedPlanetId = p?.currentPlanetId ?? null;
    const forceArcadiaPendingDialog =
      Boolean(p?.flags.pendingArcadiaDialog01)
      && landedPlanetId === 'arcadia_prime';

    if (!landedPlanetId) {
      ingameDialogLastLandedPlanetIdRef.current = null;
      return;
    }

    // 단일 조건: 메인스테이지(행성 허브) = currentPlanetId 가 비어 있지 않은 값으로 막 바뀐 착륙 1회
    if (!forceArcadiaPendingDialog && ingameDialogLastLandedPlanetIdRef.current === landedPlanetId) {
      return;
    }
    ingameDialogLastLandedPlanetIdRef.current = landedPlanetId;

    if (activeIngameDialogSceneId) return;

    const candidate = (forceArcadiaPendingDialog
      ? STORY_SCENES_FROM_CSV.ingame_dialog_01
      : null) ?? Object.values(STORY_SCENES_FROM_CSV).find((sceneDef) => {
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
    return NPC_CAPTAINS_FROM_CSV.find((c) => c.id === sid) ?? null;
  }, [activeIngameDialogCurrentPage?.speakerNpcCaptainId]);
  const activeIngameDialogImageSource =
    resolveNpcCaptainPortraitSource(
      activeIngameDialogSpeaker?.portraitImageAssetKey ?? activeIngameDialogCurrentPage?.imageAssetKey,
    ) ?? undefined;
  const activeIngameDialogTextRaw = (activeIngameDialogCurrentPage?.text ?? '')
    .replace(/\[닉네임\]/g, player?.nickname ?? '파일럿')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n');
  const activeIngameDialogTextChunks =
    measuredDialogChunks
    ?? splitStoryTextByMaxLines(activeIngameDialogTextRaw, activeIngameDialogScene?.maxLinesPerPage ?? 5);
  const activeIngameDialogText = activeIngameDialogTextChunks[ingameDialogSegment] ?? '';
  const activeIngameDialogIsLastSegment =
    ingameDialogSegment >= Math.max(0, activeIngameDialogTextChunks.length - 1);
  const activeIngameDialogIsLast = ingameDialogPage >= Math.max(0, activeIngameDialogPages.length - 1);
  const isFinalIngameDialogStep =
    activeIngameDialogIsLast && activeIngameDialogIsLastSegment;
  const consumePendingArcadiaDialogFlag = useCallback(() => {
    const snapshot = usePlayerStore.getState().player;
    if (!snapshot || !snapshot.flags.pendingArcadiaDialog01) return;
    setPlayer({
      ...snapshot,
      flags: {
        ...snapshot.flags,
        pendingArcadiaDialog01: false,
        ingameDialog01Seen: true,
      },
    });
    void persist();
  }, [setPlayer, persist]);

  useEffect(() => {
    setMeasuredDialogChunks(null);
  }, [activeIngameDialogSceneId, ingameDialogPage, activeIngameDialogTextRaw, activeIngameDialogScene?.maxLinesPerPage]);

  const handleIngameDialogTextLayout = useCallback((e: NativeSyntheticEvent<TextLayoutEventData>) => {
    if (measuredDialogChunks != null) return;
    const lines = e.nativeEvent.lines.map((line) =>
      String(line.text ?? '').replace(/\r\n/g, '').replace(/[\r\n]/g, ''),
    );
    if (lines.length === 0) {
      setMeasuredDialogChunks([activeIngameDialogTextRaw]);
      return;
    }
    const chunks = chunkMeasuredLines(lines, activeIngameDialogScene?.maxLinesPerPage ?? 4);
    setMeasuredDialogChunks(chunks);
    setIngameDialogSegment(0);
    setIngameDialogPageComplete(false);
  }, [measuredDialogChunks, activeIngameDialogTextRaw, activeIngameDialogScene?.maxLinesPerPage]);

  const handleNextIngameDialog = useCallback(() => {
    if (!activeIngameDialogScene || activeIngameDialogPages.length === 0) {
      setActiveIngameDialogSceneId(null);
      return;
    }
    if (isFinalIngameDialogStep && ingameDialogPageComplete) {
      if (activeIngameDialogScene.id === 'ingame_dialog_01') {
        consumePendingArcadiaDialogFlag();
      }
      if (activeIngameDialogScene.triggerRepeat === 'once' && player) {
        const prevSeen = player.flags.seenStorySceneIds ?? [];
        if (!prevSeen.includes(activeIngameDialogScene.id)) {
          const updated = {
            ...player,
            flags: {
              ...player.flags,
              seenStorySceneIds: [...prevSeen, activeIngameDialogScene.id],
            },
          };
          setPlayer(updated);
          void persist();
        }
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
      if (activeIngameDialogScene.id === 'ingame_dialog_01') {
        consumePendingArcadiaDialogFlag();
      }
      if (activeIngameDialogScene.triggerRepeat === 'once' && player) {
        const prevSeen = player.flags.seenStorySceneIds ?? [];
        if (!prevSeen.includes(activeIngameDialogScene.id)) {
          const updated = {
            ...player,
            flags: {
              ...player.flags,
              seenStorySceneIds: [...prevSeen, activeIngameDialogScene.id],
            },
          };
          setPlayer(updated);
          void persist();
        }
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
    activeIngameDialogTextChunks,
    player,
    setPlayer,
    persist,
    consumePendingArcadiaDialogFlag,
  ]);

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

  /** 테이블 근접 + 현재 행성에 머문 아크 수송선 — INFO 목록·궤도 표시 공통 */
  const hubMergedNearbyPresence = useMemo(() => {
    if (!planet || !system) return nearbyPresence;
    return mergeArcShipsIntoNearbyHubPresence(
      nearbyPresence,
      arcNpcShipsAtPlanet,
      arcNpcCaptainsSnap,
      planet.id,
      system.id,
    );
  }, [nearbyPresence, arcNpcShipsAtPlanet, arcNpcCaptainsSnap, planet, system]);

  const hubMergedRowsRef = useRef(hubMergedNearbyPresence);
  hubMergedRowsRef.current = hubMergedNearbyPresence;
  const tableOrbitSlotCountRef = useRef(0);
  tableOrbitSlotCountRef.current = nearbyPresence.length;
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
      nearbyPresence.flatMap(r => {
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
    [nearbyPresence],
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
      (nearbyPresence.length > 0 || planetWorldObjects.length > 0 || arcNpcAtPlanetCount > 0);
    if (!needOrbitClock) {
      orbitFrame.setActive(false);
      return;
    }
    orbitFrame.setActive(true);
    return () => {
      orbitFrame.setActive(false);
    };
  }, [
    planetStageSkiaActive,
    nearbyPresence.length,
    planetWorldObjects.length,
    arcNpcAtPlanetCount,
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
      flat: packArcNpcShipsToFloat32(arcNpcShipsAtPlanet),
      t0: orbitClockMs.value,
      count: arcNpcShipsAtPlanet.length,
    };
  }, [arcNpcShipsAtPlanet, orbitClockMs]);

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

  useEffect(() => {
    if (!planetStageSkiaActive) return;
    applyInfoDistanceSort();
    const id = setInterval(applyInfoDistanceSort, INFO_DISTANCE_SORT_INTERVAL_MS);
    return () => clearInterval(id);
  }, [planetStageSkiaActive, applyInfoDistanceSort, hubMergedNearbyPresence.length]);

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
    () => nearbyPresence.map(r => orbitCaptainCaptionFromLine(r.displayLine)),
    [nearbyPresence],
  );

  const handleExitToTitle = useCallback(() => {
    showArcAlert(
      '게임 종료',
      '타이틀 화면으로 돌아가시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '종료',
          style: 'destructive',
          onPress: () => beginPlanetHubSuspendingNavigation(() => router.replace('/?forceTitle=1')),
        },
      ],
    );
  }, [beginPlanetHubSuspendingNavigation]);

  const handleResetAllData = useCallback(() => {
    showArcAlert(
      '캐릭터 초기화',
      '플레이어 계정 데이터(닉네임/진행/미션/인벤/스킬)만 삭제하고\n최종 시작 화면(타이틀)으로 돌아갑니다.\n월드/클랜전 배치 및 테이블 설정은 유지됩니다.\n계속하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '초기화',
          style: 'destructive',
          onPress: async () => {
            const playerSnapshot = usePlayerStore.getState().player;
            const uidToPurge = playerSnapshot?.uid;
            if (uidToPurge) {
              await purgePlayerAccountWorldState({
                uid: uidToPurge,
                currentClanId: playerSnapshot?.political.clanId ?? null,
              });
              await purgeAccountDataByUid(uidToPurge);
            }
            // 안전망: 로컬 계정 초기화 시 플레이어 유래 클랜 흔적 전체 제거
            await purgeAllNonAiClanWorldState();
            await resetLocalPlayer();
            await resetLocalMissions();
            await markFreshStartAfterReset();
            // dismissAll → popToTop() 은 단일 화면 스택에서 'POP_TO_TOP' 미처리 예외가 나는 경우가 있어 사용하지 않음
            try {
              beginPlanetHubSuspendingNavigation(() => router.replace('/?forceTitle=1'));
            } catch {
              requestAnimationFrame(() => {
                try {
                  beginPlanetHubSuspendingNavigation(() => router.replace('/?forceTitle=1'));
                } catch {
                  /* ignore */
                }
              });
            }
            if (resetTipTimerRef.current) clearTimeout(resetTipTimerRef.current);
            resetTipTimerRef.current = setTimeout(() => {
              try {
                showArcAlert(
                  '초기화 완료',
                  '최종 시작 화면에서 [ 게임 시작 ]을 눌러 닉네임 등록 → 인트로 → 플레이 순서로 다시 진행할 수 있습니다.',
                );
              } catch {
                /* 모달 표시 실패 시 무시 */
              }
              resetTipTimerRef.current = null;
            }, 220);
          },
        },
      ],
    );
  }, [
    beginPlanetHubSuspendingNavigation,
    resetLocalMissions,
    resetLocalPlayer,
    purgeAllNonAiClanWorldState,
    purgePlayerAccountWorldState,
  ]);

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
      if (!clanId) return '미소속';
      const displayName = (s.clans[clanId]?.displayName ?? '').trim();
      return displayName.length > 0 ? displayName : clanId;
    }, [player?.political.clanId]),
  );
  if (!player || !system || !planet) return null;

  const zoneColor = ZONE_COLORS[system.zone];

  return (
    <CapitalRealtimeCombatSimBinder
      orbitSize={ORBIT_SCENE_SIZE}
      active={capitalCombatOrbitActive}
      paused={capitalCombatOrbitPaused}
      combatPlanetId={capitalCombatOrbitActive ? planet.id : null}
      combatSystemId={system.id}
    >
    <CombatSimRefBridge targetRef={combatSimRef} />
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
          tableOrbitSlotCount={nearbyPresence.length}
          npcOrbitCycleMs={NPC_ORBIT_CYCLE_MS}
          orbitCaptionsBySlot={orbitCaptionsBySlot}
          orbitClockMs={orbitClockMs}
          arcNpcShipsAtPlanet={arcNpcShipsAtPlanet}
          arcSkiaCaptionHeads={arcSkiaCaptionHeads}
          worldObjects={planetWorldObjects}
          showEdenRaidTest={capitalCombatOrbitActive}
          miningPathActive={miningSession.status === 'running'}
          miningProgressPct={miningCycleProgressPct}
          territorySubtitle={clanTerritorySubtitle}
          safeAiClanTerritoryPlate={safeAiClanTerritoryPlate}
          backgroundChrome={mainStageVertical.backgroundChrome}
          planetStageScale={planetStageScale}
          /**
           * Skia 레이어(성운 셰이더·허브 궤도) 활성 게이트: 포커스 + lifecycle active.
           * 출발 순간에는 routeFocused 만으로는 불충분(전투 Skia teardown 과 동시 draw 방지).
           */
          skiaLoopsActive={planetStageSkiaActive}
        />
      }
      absoluteOverlay={
        capitalCombatOrbitActive ? (
          <PlanetCapitalCombatOrbitForegroundOverlay
            backgroundChrome={mainStageVertical.backgroundChrome}
            planetStageScale={planetStageScale}
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
              <TouchableOpacity style={styles.iconBtn} onPress={handleExitToTitle} accessibilityLabel="게임 종료">
                <Ionicons name="power" size={18} color={COLORS.ink_dark} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={handleResetAllData} accessibilityLabel="설정(임시: 전체 초기화)">
                <Ionicons name="settings-outline" size={18} color={COLORS.ink_dark} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => showArcAlert('랭킹', '랭킹은 준비 중입니다.')}
                accessibilityLabel="랭킹"
              >
                <Ionicons name="podium-outline" size={18} color={COLORS.ink_dark} />
              </TouchableOpacity>
            </View>

            <Text style={styles.topBarTitle} numberOfLines={1}>메인스테이지</Text>

            <View style={styles.topBarRight}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => showArcAlert('코인 충전', '코인 충전은 준비 중입니다.')}
                accessibilityLabel="코인 충전"
              >
                <Ionicons name="logo-usd" size={18} color={COLORS.gold} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => showArcAlert('보석 충전', '보석 충전은 준비 중입니다.')}
                accessibilityLabel="보석 충전"
              >
                <Ionicons name="diamond-outline" size={18} color={COLORS.info} />
              </TouchableOpacity>
            </View>
          </View>

          <QuestHUD />
        </View>

        {/* ScrollView는 전체 너비(하단 메뉴 4열 레이아웃 유지). info는 우상단 오버레이. */}
        <View style={styles.mainArea}>
        <ScrollView
          style={[styles.scroll, styles.scrollTransparent]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          pointerEvents="box-none"
        >
        {/* 행성·궤도는 배경 레이어 — 여기는 투명 예약으로 메뉴가 가리지 않게 함 */}
        <View
          style={[styles.planetStageReserve, { minHeight: planetStageReservePx }]}
          accessibilityLabel="행성 시야 예약 영역"
        />

        {/* 소형 메뉴 버튼 — marginTop만 포그라운드: 배경 행성 `paddingBottom`과 분리 */}
        <PlanetMainStanceRow routeFocused={isPlanetRouteFocused && appStateActive} />
        {!capitalCombatOrbitActive ? (
          <View style={styles.miningQuickControlRow}>
            <MenuButton
              label={miningSession.status === 'running' ? '채굴 중단' : '채굴 시작'}
              onPress={handleToggleMining}
              disabled={!canOrbitalMine}
              primary={miningSession.status === 'running'}
            />
          </View>
        ) : null}
        <View
          style={[
            styles.menuRow,
            {
              marginTop: Math.max(
                0,
                PLANET_MAIN_FOREGROUND_MENU_STACK_OFFSET_TOP_PX
                  - PLANET_MAIN_STANCE_ROW_HEIGHT_EST_PX
                  - 14,
              ),
            },
          ]}
        >
          {featureMenuItems.map((item) => (
            <MenuButton
              key={item.id}
              label={item.label}
              onPress={item.onPress}
              disabled={item.disabled}
              showBadge={item.showBadge}
              primary={item.primary}
            />
          ))}
        </View>

        {null}

        {/* 하단 캐릭터 정보 */}
        <View style={styles.statsBox}>
          <Text style={styles.statsTitle}>— 파일럿 정보 —</Text>
          <View style={styles.statsRow}>
            <StatItem label="닉네임" value={player.nickname} />
            <StatItem label="레벨" value={`Lv.${player.level} (${formatPilotExp8(player.exp)})`} />
            <StatItem label="크레딧" value={player.credits.toLocaleString()} />
          </View>
          <View style={styles.statsRow}>
            <StatItem label="함선" value={player.ship.name} />
            <StatItem label="스킬 포인트" value={`${player.skillPoints}P`} highlight={player.skillPoints > 0} />
            <StatItem label="클랜" value={currentPilotClanName} />
          </View>
        </View>

        <View
          style={[styles.bottomFeatureReserve, { minHeight: PLANET_MAIN_BOTTOM_FEATURE_RESERVE_PX }]}
          pointerEvents="box-none"
          accessibilityLabel="하단 확장 예약 영역"
        />
        </ScrollView>

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
            <CapitalRealtimeCombatHudOverlay />
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
        <IngameDialogOverlay
          visible={Boolean(activeIngameDialogScene)}
          label={activeIngameDialogCurrentPage?.label ?? '[ 통신 ]'}
          text={activeIngameDialogText}
          typewriterKey={`ingame-dialog-${activeIngameDialogScene?.id ?? 'none'}-${ingameDialogPage}-${ingameDialogSegment}`}
          typewriterSpeedMs={activeIngameDialogScene?.typewriterSpeedMs ?? 28}
          onTextComplete={() => setIngameDialogPageComplete(true)}
          imageSource={activeIngameDialogImageSource}
          measureTextRaw={activeIngameDialogTextRaw}
          onMeasureTextLayout={handleIngameDialogTextLayout}
          onPressNext={handleNextIngameDialog}
          nextDisabled={!ingameDialogPageComplete}
          buttonText={isFinalIngameDialogStep ? '[ 확인 ]' : '[ 다음 ]'}
          align="center"
        />
        </View>
      </View>
      </View>
    </StageShell>
    </CapitalRealtimeCombatSimBinder>
  );
}

/** 행성 주변 NPC 궤도·채굴 앵커 — 화면 중심 기준 */
const ORBIT_CENTER = ORBIT_SCENE_SIZE / 2;
/** 궤도 박스 수직 중심에서 함선 마커까지(하단+여백+글자 반줄) 거리의 50%만큼 위로 — 행성에 가깝게 */
/** 배경 행성/성운(및 궤도 전함) 블록을 소폭 위로 보정 */
const PLANET_MAIN_ORBIT_VISUAL_LIFT_PX = 14;
function splitNearbyInfoLine(line: string): { left: string; right?: string } {
  const parts = line.split(NEARBY_PRESENCE_DISPLAY_SEP);
  if (parts.length >= 2) {
    const head = parts[0];
    if (head != null && head.length > 0) {
      return { left: head, right: parts.slice(1).join(NEARBY_PRESENCE_DISPLAY_SEP) };
    }
  }
  return { left: line };
}

type NearbyInfoRow = { keySlot: number; line: string };

function NearbyShipInfoPanel({
  rows,
  mutedForCapitalCombat,
}: {
  rows: NearbyInfoRow[];
  /** 메인스테이지 자본궤도 전투 중 — info 패널을 회색·낮은 불투명도로 전환 */
  mutedForCapitalCombat?: boolean;
}) {
  const scrollRef = useRef<ScrollView>(null);
  /** 거리순 정렬만 바뀔 때마다 `scrollTo` 하면 패널이 흔들림 — 행 수가 바뀔 때만 맨 위로 */
  const prevRowCountRef = useRef<number | null>(null);

  useEffect(() => {
    const len = rows.length;
    if (prevRowCountRef.current === null) {
      prevRowCountRef.current = len;
      return;
    }
    if (len !== prevRowCountRef.current) {
      prevRowCountRef.current = len;
      const id = requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      });
      return () => cancelAnimationFrame(id);
    }
  }, [rows.length]);

  return (
    <View
      style={[styles.infoPanelWrap, mutedForCapitalCombat && styles.infoPanelWrapCapitalCombatMuted]}
      accessibilityLabel="info"
    >
      <Text style={[styles.infoPanelTitle, mutedForCapitalCombat && styles.infoPanelTitleCapitalCombatMuted]}>
        info
      </Text>
      <ScrollView
        ref={scrollRef}
        style={[styles.infoLogScroll, { height: INFO_LOG_SCROLL_VIEWPORT_PX }]}
        contentContainerStyle={styles.infoLogContent}
        showsVerticalScrollIndicator={rows.length > INFO_LOG_VIEWPORT_ROWS}
        nestedScrollEnabled
      >
        {rows.map(({ keySlot, line }) => {
          const { left, right } = splitNearbyInfoLine(line);
          return (
            <View key={`info-slot-${keySlot}`} style={styles.infoTableRow}>
              <Text
                style={[styles.infoRowBullet, mutedForCapitalCombat && styles.infoInkCapitalCombatMuted]}
              >
                ›{' '}
              </Text>
              {right != null ? (
                <View style={styles.infoNameMkCluster}>
                  <Text
                    style={[styles.infoTableName, mutedForCapitalCombat && styles.infoInkCapitalCombatMuted]}
                    numberOfLines={1}
                  >
                    {left}
                  </Text>
                  <Text
                    style={[styles.infoTableSep, mutedForCapitalCombat && styles.infoInkCapitalCombatMuted]}
                    numberOfLines={1}
                  >
                    │
                  </Text>
                  <Text
                    style={[styles.infoTableMk, mutedForCapitalCombat && styles.infoInkCapitalCombatMuted]}
                    numberOfLines={1}
                  >
                    {right}
                  </Text>
                </View>
              ) : (
                <Text
                  style={[styles.infoTableFull, mutedForCapitalCombat && styles.infoInkCapitalCombatMuted]}
                  numberOfLines={2}
                >
                  {left}
                </Text>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ── 행성 도트 그래픽 ──────────────────────────────────────────

function PlanetCoreGaugeRow({
  label,
  value,
  color,
  combatMuted,
}: {
  label: string;
  value: number;
  color: string;
  /** 메인스테이지 자본궤도 전투 중 — 게이지를 회색 톤으로 */
  combatMuted?: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const activeSegments = Math.max(0, Math.min(5, Math.floor(clamped / 20)));
  const labelColor = combatMuted ? PLANET_HUB_CAPITAL_COMBAT_GRAY.gaugeLabel : color;
  const onSegStyle = combatMuted
    ? {
        backgroundColor: PLANET_HUB_CAPITAL_COMBAT_GRAY.gaugeOn,
        borderColor: PLANET_HUB_CAPITAL_COMBAT_GRAY.gaugeOn,
      }
    : { backgroundColor: color, borderColor: color };
  const offSegStyle = combatMuted
    ? {
        backgroundColor: PLANET_HUB_CAPITAL_COMBAT_GRAY.gaugeOffBg,
        borderColor: PLANET_HUB_CAPITAL_COMBAT_GRAY.gaugeOffBorder,
      }
    : styles.planetCoreGaugeSegOff;
  return (
    <View style={styles.planetCoreGaugeRow}>
      <Text style={[styles.planetCoreGaugeLabel, { color: labelColor }]}>{label}</Text>
      <View style={styles.planetCoreGaugeSegWrap}>
        {Array.from({ length: 5 }, (_, i) => (
          <View
            // 20% 단위 디지털 칸(5칸)
            key={`${label}-${i}`}
            style={[styles.planetCoreGaugeSeg, i < activeSegments ? onSegStyle : offSegStyle]}
          />
        ))}
      </View>
    </View>
  );
}

function PlanetDot({
  planetId,
  size,
  zone,
  coreGauges,
  combatMuted,
}: {
  planetId: string;
  size: number;
  zone: ZoneType;
  coreGauges?: PlanetCoreGaugeView;
  /** 메인스테이지 자본궤도 전투 중 — 행성 링·내부 톤을 회색으로 */
  combatMuted?: boolean;
}) {
  const color = combatMuted ? PLANET_HUB_CAPITAL_COMBAT_GRAY.planetRing : ZONE_COLORS[zone];
  const innerSize = size * 0.7;

  return (
    <View style={[styles.planetOuter, { width: size, height: size, borderRadius: size / 2, borderColor: color }]}>
      {coreGauges ? (
        <View style={styles.planetPortraitInnerWrap} pointerEvents="none">
          <View
            style={{
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
              overflow: 'hidden',
            }}
          >
            <PlanetCorePortraitWithTempAdminOverride
              planetId={planetId}
              size={innerSize}
              zone={zone}
              coreGauges={coreGauges}
              combatMuted={combatMuted}
            />
          </View>
        </View>
      ) : null}
      <View
        style={[
          styles.planetInner,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
            backgroundColor: coreGauges ? 'transparent' : `${color}22`,
            borderColor: `${color}66`,
          },
        ]}
      />
      {coreGauges ? (
        <View style={styles.planetCoreGaugePanel} pointerEvents="none">
          {PLANET_CORE_GAUGE_SPEC.map((g) => (
            <PlanetCoreGaugeRow
              key={g.key}
              label={g.label}
              color={g.color}
              value={coreGauges[g.key]}
              combatMuted={combatMuted}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

/**
 * 궤도 실시간 전투(Reanimated) — `StageShell.absoluteOverlay`에서만 그림.
 * 배경 레이어는 스크롤/포그라운드 아래에 깔려 가려질 수 있어, 포그라운드 위에 동일 기하로 겹친다.
 */
const PlanetCapitalCombatOrbitForegroundOverlay = memo(function PlanetCapitalCombatOrbitForegroundOverlay({
  backgroundChrome,
  planetStageScale,
}: {
  backgroundChrome: { paddingTop: number; paddingBottom: number };
  planetStageScale: number;
}) {
  const sim = useCapitalRealtimeCombatSimContext();
  if (!sim) return null;
  return (
    <View style={[bgStyles.root, backgroundChrome]} pointerEvents="box-none">
      <View style={bgStyles.planetBgStack}>
        <View
          style={{
            width: '100%',
            maxWidth: 340,
            alignSelf: 'center',
            minHeight: PLANET_MAIN_BACKGROUND_SYSTEM_BADGE_BLOCK_EST_PX,
            marginBottom: SPACING.xs,
          }}
        />
        <View style={bgStyles.planetOrbitSlot}>
          <View
            style={[
              bgStyles.planetColumn,
              { transform: [{ translateY: -PLANET_MAIN_ORBIT_VISUAL_LIFT_PX }, { scale: planetStageScale }] },
            ]}
          >
            <View style={bgStyles.orbitScene}>
              <View style={bgStyles.orbitTestLayer} pointerEvents="none">
                <CapitalRealtimeCombatOrbitSvg />
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
});

/** 별 배경(StageShell) 위 레이어 — 행성 그래픽·성계/행성 명칭 (터치 없음) */
const PlanetStageBackground = memo(function PlanetStageBackground({
  planetId,
  system,
  zoneColor,
  orbitParamsSv,
  tableOrbitSlotCount,
  npcOrbitCycleMs,
  orbitCaptionsBySlot,
  orbitClockMs,
  arcNpcShipsAtPlanet,
  arcSkiaCaptionHeads,
  worldObjects,
  showEdenRaidTest,
  miningPathActive,
  miningProgressPct,
  territorySubtitle,
  safeAiClanTerritoryPlate,
  /** `getPlanetMainStageBackgroundScale` — 채굴 오버레이와 동일 */
  planetStageScale,
  /** `getPlanetMainStageVerticalMetrics` 결과 — 포그라운드와 동일한 세로 패딩만 허용 */
  backgroundChrome,
  /**
   * Skia 레이어(성운 셰이더·허브 아크 궤도) 활성 플래그.
   * `isPlanetRouteFocused && stageLifecycle === 'active'` — 출발 순간 teardown 레이스 방지 필수 AND.
   */
  skiaLoopsActive,
}: {
  planetId: string;
  system: StarSystem;
  zoneColor: string;
  orbitParamsSv: SharedValue<number[]>;
  tableOrbitSlotCount: number;
  npcOrbitCycleMs: number;
  orbitCaptionsBySlot?: string[];
  orbitClockMs: SharedValue<number>;
  arcNpcShipsAtPlanet: ArcNpcTrafficShip[];
  arcSkiaCaptionHeads: string[];
  worldObjects: WorldObject[];
  showEdenRaidTest: boolean;
  /** 채굴 활성 중에는 Skia 궤도 대신 정적 마커로 안전 모드 렌더 */
  miningPathActive?: boolean;
  miningProgressPct?: number;
  /** 클랜전 점유/거점 한 줄(없으면 null) */
  territorySubtitle?: string | null;
  /** 안전구역 AI 클랜 소유 — `systemBadge` 내 표시(궤도 컬럼과 분리) */
  safeAiClanTerritoryPlate?: { clanName: string; clanColor: string } | null;
  planetStageScale: number;
  backgroundChrome: { paddingTop: number; paddingBottom: number };
  skiaLoopsActive: boolean;
}) {
  const { width: bgWindowWidth, height: bgWindowHeight } = useWindowDimensions();
  const nebulaBackdropRef = useRef<View | null>(null);
  const orbitSceneRef = useRef<View | null>(null);
  const dodgeStageMountedRef = useRef(true);
  useEffect(() => {
    dodgeStageMountedRef.current = true;
    return () => {
      dodgeStageMountedRef.current = false;
    };
  }, []);
  const [dodgeOrbitOffset, setDodgeOrbitOffset] = useState({ x: 0, y: 0 });
  const recomputeDodgeOrbitOffset = useCallback(() => {
    if (!dodgeStageMountedRef.current) return;
    const nebulaNode = nebulaBackdropRef.current;
    const orbitNode = orbitSceneRef.current;
    if (!nebulaNode || !orbitNode) return;
    orbitNode.measureInWindow((orbitX, orbitY, orbitW, orbitH) => {
      if (!dodgeStageMountedRef.current) return;
      nebulaNode.measureInWindow((nebulaX, nebulaY, nebulaW, nebulaH) => {
        if (!dodgeStageMountedRef.current) return;
        const orbitCx = orbitX + orbitW / 2;
        const orbitCy = orbitY + orbitH / 2;
        const nebulaCx = nebulaX + nebulaW / 2;
        const nebulaCy = nebulaY + nebulaH / 2;
        const dx = orbitCx - nebulaCx;
        const dy = orbitCy - nebulaCy;
        setDodgeOrbitOffset((prev) =>
          Math.abs(prev.x - dx) < 0.25 && Math.abs(prev.y - dy) < 0.25 ? prev : { x: dx, y: dy });
      });
    });
  }, []);
  const handleBackdropLayout = useCallback((_e: LayoutChangeEvent) => {
    requestAnimationFrame(() => {
      if (!dodgeStageMountedRef.current) return;
      recomputeDodgeOrbitOffset();
    });
  }, [recomputeDodgeOrbitOffset]);
  const handleOrbitSceneLayout = useCallback((_e: LayoutChangeEvent) => {
    requestAnimationFrame(() => {
      if (!dodgeStageMountedRef.current) return;
      recomputeDodgeOrbitOffset();
    });
  }, [recomputeDodgeOrbitOffset]);
  const edenSim = useCapitalRealtimeCombatSimContext();
  const planetCoreHydrated = usePlanetCoreRuntimeStore((s) => s.hydrated);
  const planetCoreRuntime = usePlanetCoreRuntimeStore(
    useCallback((s) => s.byPlanetId[planetId], [planetId]),
  );
  const templatePlanet = useMemo(
    () => system.planets.find((p) => p.id === planetId),
    [system.planets, planetId],
  );
  const planetCoreGauges = useMemo(() => {
    if (planetCoreHydrated && planetCoreRuntime) {
      return planetCoreRuntimeToGaugeView(planetCoreRuntime);
    }
    if (templatePlanet) {
      return planetCoreRuntimeToGaugeView(planetCsvBaselineToRuntime(templatePlanet));
    }
    return undefined;
  }, [planetCoreHydrated, planetCoreRuntime, templatePlanet]);
  /**
   * 자본궤도 실시간 전투가 이 행성 허브에서 활성일 때 — Sim 컨텍스트가 붙은 뒤에만 톤다운(전투 레이어는 제외).
   * `showEdenRaidTest`는 부모의 `capitalCombatOrbitActive`와 동일 신호.
   */
  const hubCapitalCombatMute = Boolean(showEdenRaidTest && edenSim);
  const mainStageBackdrop = useMemo(
    () => resolveMainStageSkiaBackdrop(templatePlanet ?? null),
    [templatePlanet],
  );
  const nebulaProfile = usePlanetNebulaStore(
    useCallback((s) => s.profilesByPlanetId[planetId] ?? null, [planetId]),
  );
  const ensureNebulaProfileForPlanet = usePlanetNebulaStore((s) => s.ensureProfileForPlanet);

  useEffect(() => {
    if (!mainStageBackdrop.nebulaShaderEnabled) return;
    ensureNebulaProfileForPlanet(planetId);
  }, [ensureNebulaProfileForPlanet, planetId, mainStageBackdrop.nebulaShaderEnabled]);
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      recomputeDodgeOrbitOffset();
    });
    return () => cancelAnimationFrame(id);
  }, [
    recomputeDodgeOrbitOffset,
    bgWindowWidth,
    bgWindowHeight,
    backgroundChrome.paddingTop,
    backgroundChrome.paddingBottom,
    planetStageScale,
    showEdenRaidTest,
  ]);
  const nebulaBackdropSize = Math.round(Math.max(bgWindowWidth, bgWindowHeight) * 0.59);

  return (
    <View style={[bgStyles.root, backgroundChrome]} pointerEvents="box-none">
      <View
        ref={nebulaBackdropRef}
        onLayout={handleBackdropLayout}
        style={[
          bgStyles.nebulaBackdropLayer,
          {
            left: bgWindowWidth / 2,
            top: bgWindowHeight / 2,
            width: nebulaBackdropSize,
            height: nebulaBackdropSize,
            marginLeft: -nebulaBackdropSize / 2,
            marginTop: -nebulaBackdropSize / 2,
          },
        ]}
        pointerEvents="none"
      >
        <SkiaPlanetNebulaShaderBackdrop
          size={nebulaBackdropSize}
          /** 성운 성운만: 포커스 + lifecycle active 일 때만 rAF 시작(출발 순간 즉시 OFF). */
          active={skiaLoopsActive}
          profile={nebulaProfile}
          renderNebulaShader={mainStageBackdrop.nebulaShaderEnabled}
          backgroundImageSource={mainStageBackdrop.backdropImageSource}
          dodgeHitFxRef={edenSim?.missileHitFxRef ?? null}
          dodgeTimeMsRef={edenSim?.tMsRef ?? null}
          dodgeOrbitSize={ORBIT_SCENE_SIZE}
          dodgeOrbitVisualScaleX={PLANET_MAIN_COMBAT_LAYER_WIDTH_SCALE_X}
          dodgeOrbitVisualScaleY={PLANET_MAIN_COMBAT_LAYER_HEIGHT_SCALE_Y}
          dodgeOrbitOffsetX={dodgeOrbitOffset.x}
          dodgeOrbitOffsetY={dodgeOrbitOffset.y}
        />
      </View>
      <View style={bgStyles.planetBgStack}>
        <View style={[bgStyles.systemBadge, hubCapitalCombatMute && bgStyles.planetHubCapitalCombatBadgeDim]}>
          <Text
            style={[
              bgStyles.zoneBadge,
              hubCapitalCombatMute
                ? {
                    color: PLANET_HUB_CAPITAL_COMBAT_GRAY.zoneText,
                    borderColor: PLANET_HUB_CAPITAL_COMBAT_GRAY.zoneBorder,
                    fontWeight: FONTS.weight.bold,
                  }
                : system.zone === 'safe'
                  ? bgStyles.zoneBadgeSafe
                  : { color: zoneColor, borderColor: zoneColor },
            ]}
          >
            {ZONE_LABELS[system.zone]}
          </Text>
          <View
            style={[
              bgStyles.systemNameSlot,
              { minHeight: PLANET_MAIN_BACKGROUND_SYSTEM_NAME_MIN_HEIGHT_PX },
            ]}
          >
            <Text
              style={[
                bgStyles.systemName,
                hubCapitalCombatMute && {
                  color: PLANET_HUB_CAPITAL_COMBAT_GRAY.systemName,
                  textShadowColor: 'rgba(8, 12, 18, 0.45)',
                  textShadowRadius: 2,
                },
              ]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {system.name}
            </Text>
          </View>
          <View
            style={[
              bgStyles.clanPlateInBadge,
              {
                minHeight: PLANET_MAIN_BACKGROUND_CLAN_PLATE_SLOT_HEIGHT_PX,
                marginTop: PLANET_MAIN_BACKGROUND_CLAN_PLATE_AFTER_NAME_GAP_PX,
                transform: [
                  { translateX: PLANET_MAIN_BACKGROUND_CLAN_PLATE_OFFSET_X_PX },
                  { translateY: PLANET_MAIN_BACKGROUND_CLAN_PLATE_OFFSET_Y_PX },
                ],
              },
            ]}
          >
            {safeAiClanTerritoryPlate ? (
              <View style={bgStyles.safeAiClanPlate} accessibilityRole="text" accessibilityLabel="AI 클랜 거점">
                <Ionicons
                  name="shield-checkmark"
                  size={22}
                  color={
                    hubCapitalCombatMute
                      ? PLANET_HUB_CAPITAL_COMBAT_GRAY.clanIcon
                      : safeAiClanTerritoryPlate.clanColor
                  }
                  style={bgStyles.safeAiClanPlateMark}
                  accessibilityLabel="클랜 마크"
                />
                <View style={bgStyles.safeAiClanPlateTextCol}>
                  <Text
                    style={[
                      bgStyles.safeAiClanPlateClan,
                      hubCapitalCombatMute && { color: PLANET_HUB_CAPITAL_COMBAT_GRAY.clanText },
                    ]}
                    numberOfLines={1}
                  >
                    {safeAiClanTerritoryPlate.clanName} (소유중)
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
          {territorySubtitle ? (
            <Text
              style={[
                bgStyles.territorySubtitle,
                hubCapitalCombatMute && {
                  color: PLANET_HUB_CAPITAL_COMBAT_GRAY.territory,
                  opacity: 0.88,
                },
              ]}
              numberOfLines={2}
            >
              {territorySubtitle}
            </Text>
          ) : null}
        </View>
        <View style={bgStyles.planetOrbitSlot}>
          <View
            style={[
              bgStyles.planetColumn,
              { transform: [{ translateY: -PLANET_MAIN_ORBIT_VISUAL_LIFT_PX }, { scale: planetStageScale }] },
            ]}
          >
            <View ref={orbitSceneRef} style={bgStyles.orbitScene} onLayout={handleOrbitSceneLayout}>
              <View
                style={[
                  bgStyles.orbitLayerPlanet,
                  hubCapitalCombatMute && bgStyles.planetHubCapitalCombatOrbitDim,
                ]}
                pointerEvents="box-none"
              >
                <PlanetDot
                  planetId={planetId}
                  size={120}
                  zone={system.zone}
                  coreGauges={planetCoreGauges}
                  combatMuted={hubCapitalCombatMute}
                />
              </View>
              {worldObjects.length > 0 ? (
                <View
                  style={[
                    bgStyles.orbitLayerWorldObjects,
                    hubCapitalCombatMute && bgStyles.planetHubCapitalCombatOrbitDim,
                  ]}
                  pointerEvents="box-none"
                >
                  <PlanetWorldObjectOrbitMarks
                    orbitClockMs={orbitClockMs}
                    worldObjects={worldObjects}
                    miningPathActive={Boolean(miningPathActive)}
                    miningProgressPct={Math.max(0, Math.min(100, Math.round(miningProgressPct ?? 0)))}
                  />
                </View>
              ) : null}
              {tableOrbitSlotCount > 0 || arcNpcShipsAtPlanet.length > 0 ? (
                <View
                  style={[
                    bgStyles.orbitLayerShips,
                    hubCapitalCombatMute && bgStyles.planetHubCapitalCombatOrbitDim,
                  ]}
                  pointerEvents="none"
                >
                <PlanetTableOrbitMarks
                  orbitClockMs={orbitClockMs}
                  orbitParamsSv={orbitParamsSv}
                  tableSlotCount={tableOrbitSlotCount}
                  npcOrbitCycleMs={npcOrbitCycleMs}
                  captions={orbitCaptionsBySlot ?? []}
                />
                  <PlanetHubOrbitSkiaLayer
                    orbitClockMs={orbitClockMs}
                    arcShips={arcNpcShipsAtPlanet}
                    arcCaptionHeads={arcSkiaCaptionHeads}
                    paused={!skiaLoopsActive}
                  />
                </View>
              ) : null}
              {!showEdenRaidTest ? (
                <View
                  style={[
                    bgStyles.orbitLayerPlayer,
                    hubCapitalCombatMute && bgStyles.planetHubCapitalCombatOrbitDim,
                  ]}
                  pointerEvents="none"
                >
                  <PlanetPlayerBlueOrbitMark orbitClockMs={orbitClockMs} />
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
});

const WORLD_OBJECT_ORBIT_CYCLE_MS = 168000;
const MAX_WORLD_OBJECT_MARKS = 16;
const WORLD_OBJECT_ANCHOR_PX = 11;
/** 설명선: 소행성 마커 중심에서 우상향 45°로 이 거만큼(+/- 동일) 뻗음(SVG y축 아래방향). */
const MINING_GUIDE_LINE_RUN_PX = 24;
/** 설명선 끝점(오버레이 좌표)에서 텍스트를 살짝 바깥쪽(대각 방향)으로 밀 오프셋. */
const MINING_GUIDE_LABEL_PAST_TIP_PX = 2;

function worldObjectGlyph(kind: WorldObject['kind']): string {
  if (kind === 'station') return '▣';
  if (kind === 'wreck') return '✦';
  if (kind === 'anomaly') return '◇';
  return '';
}

const PlanetWorldObjectOrbitMark = memo(function PlanetWorldObjectOrbitMark({
  object,
  orbitClockMs,
  miningPathActive,
  mineable,
  miningProgressPct,
}: {
  object: WorldObject;
  orbitClockMs: SharedValue<number>;
  miningPathActive: boolean;
  mineable: boolean;
  miningProgressPct: number;
}) {
  const animated = useAnimatedStyle(() => {
    'worklet';
    const now = orbitClockMs.value;
    const phase = ((now % WORLD_OBJECT_ORBIT_CYCLE_MS) / WORLD_OBJECT_ORBIT_CYCLE_MS + object.transform.phaseBias) % 1;
    const angle = phase * Math.PI * 2;
    const orbitRadius = ORBIT_CENTER * Math.max(0.5, Math.min(0.96, object.transform.radiusScale));
    const x = ORBIT_CENTER + Math.cos(angle) * orbitRadius;
    const y = ORBIT_CENTER + Math.sin(angle) * orbitRadius;
    return {
      opacity: object.kind === 'station' ? 0.95 : 0.88,
      transform: [{ translateX: x - WORLD_OBJECT_ANCHOR_PX }, { translateY: y - WORLD_OBJECT_ANCHOR_PX }],
    };
  }, [object.kind, object.transform.phaseBias, object.transform.radiusScale, orbitClockMs]);

  return (
    <Animated.View style={[bgStyles.orbitMarkWrap, bgStyles.worldObjectMarkWrap, animated]}>
      <View style={[bgStyles.orbitMarkLabelCol, bgStyles.worldObjectLabelCol]}>
        {object.kind === 'asteroid' ? (
          <>
            <View
              style={[
                bgStyles.worldObjectAsteroidDot,
                mineable ? null : bgStyles.worldObjectAsteroidDotInactive,
              ]}
            />
            {mineable ? (
              <View style={bgStyles.worldObjectMiningOverlay} pointerEvents="box-none">
              <Svg
                width={MINING_GUIDE_LINE_RUN_PX}
                height={MINING_GUIDE_LINE_RUN_PX}
                viewBox={`${WORLD_OBJECT_ANCHOR_PX} ${WORLD_OBJECT_ANCHOR_PX - MINING_GUIDE_LINE_RUN_PX} ${MINING_GUIDE_LINE_RUN_PX} ${MINING_GUIDE_LINE_RUN_PX}`}
                style={bgStyles.worldObjectMiningGuideSvg}
                pointerEvents="none"
              >
                <Line
                  x1={WORLD_OBJECT_ANCHOR_PX}
                  y1={WORLD_OBJECT_ANCHOR_PX}
                  x2={WORLD_OBJECT_ANCHOR_PX + MINING_GUIDE_LINE_RUN_PX}
                  y2={WORLD_OBJECT_ANCHOR_PX - MINING_GUIDE_LINE_RUN_PX}
                  stroke="rgba(255, 232, 166, 0.9)"
                  strokeWidth={1}
                />
              </Svg>
              <View style={bgStyles.worldObjectMiningGuideWrap} pointerEvents="none">
                <Text
                  style={[
                    bgStyles.worldObjectMiningLabel,
                    miningPathActive ? bgStyles.worldObjectMiningLabelActive : null,
                  ]}
                >
                  [채굴]
                </Text>
                <View style={bgStyles.worldObjectMiningGaugeRow}>
                  {Array.from({ length: 10 }, (_, i) => (
                    <View
                      key={`wo-mining-seg-${object.id}-${i}`}
                      style={[
                        bgStyles.worldObjectMiningGaugeSeg,
                        i < Math.floor(miningProgressPct / 10)
                          ? bgStyles.worldObjectMiningGaugeSegOn
                          : bgStyles.worldObjectMiningGaugeSegOff,
                        miningPathActive ? null : bgStyles.worldObjectMiningGaugeSegPaused,
                      ]}
                    />
                  ))}
                </View>
              </View>
              </View>
            ) : null}
          </>
        ) : (
          <Text style={bgStyles.worldObjectGlyph}>{worldObjectGlyph(object.kind)}</Text>
        )}
        <Text
          style={[bgStyles.worldObjectCaption, bgStyles.worldObjectCaptionOverlay]}
          numberOfLines={1}
          ellipsizeMode="clip"
        >
          {object.title}
        </Text>
      </View>
    </Animated.View>
  );
});

const PlanetWorldObjectOrbitMarks = memo(function PlanetWorldObjectOrbitMarks({
  worldObjects,
  orbitClockMs,
  miningPathActive,
  miningProgressPct,
}: {
  worldObjects: WorldObject[];
  orbitClockMs: SharedValue<number>;
  miningPathActive: boolean;
  miningProgressPct: number;
}) {
  const renderTargets = worldObjects.slice(0, MAX_WORLD_OBJECT_MARKS);
  const activeMineableAsteroidId = useMemo(
    () => renderTargets.find((object) => object.kind === 'asteroid')?.id ?? null,
    [renderTargets],
  );
  return (
    <>
      {renderTargets.map((object) => (
        <PlanetWorldObjectOrbitMark
          key={object.id}
          object={object}
          orbitClockMs={orbitClockMs}
          miningPathActive={miningPathActive}
          mineable={object.kind === 'asteroid' && object.id === activeMineableAsteroidId}
          miningProgressPct={miningProgressPct}
        />
      ))}
    </>
  );
});

const PlanetTableOrbitMark = memo(function PlanetTableOrbitMark({
  slotIndex,
  caption,
  orbitClockMs,
  orbitParamsSv,
  tableSlotCount,
  npcOrbitCycleMs,
}: {
  slotIndex: number;
  caption: string;
  orbitClockMs: SharedValue<number>;
  orbitParamsSv: SharedValue<number[]>;
  tableSlotCount: number;
  npcOrbitCycleMs: number;
}) {
  const animated = useAnimatedStyle(() => {
    'worklet';
    if (slotIndex >= tableSlotCount) {
      return {
        opacity: 0,
        transform: [{ translateX: -9999 }, { translateY: -9999 }],
      };
    }
    const pt = computeTableNpcOrbitXY(
      orbitParamsSv.value,
      slotIndex,
      orbitClockMs.value,
      ORBIT_CENTER,
      npcOrbitCycleMs,
    );
    if (!pt) {
      return {
        opacity: 0,
        transform: [{ translateX: -9999 }, { translateY: -9999 }],
      };
    }
    return {
      opacity: 0.96,
      transform: [{ translateX: pt.x - 7 }, { translateY: pt.y - 7 }],
    };
  }, [slotIndex, tableSlotCount, npcOrbitCycleMs]);

  return (
    <Animated.View style={[bgStyles.orbitMarkWrap, animated]}>
      <View style={bgStyles.orbitMarkLabelCol}>
        <Text style={bgStyles.orbitMarkGray}>◇</Text>
        {caption ? (
          <Text style={bgStyles.orbitShipCaption} numberOfLines={1} ellipsizeMode="tail">
            {caption}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );
});

const PlanetTableOrbitMarks = memo(function PlanetTableOrbitMarks({
  orbitClockMs,
  orbitParamsSv,
  tableSlotCount,
  npcOrbitCycleMs,
  captions,
}: {
  orbitClockMs: SharedValue<number>;
  orbitParamsSv: SharedValue<number[]>;
  tableSlotCount: number;
  npcOrbitCycleMs: number;
  captions: string[];
}) {
  return (
    <>
      {Array.from({ length: tableSlotCount }, (_, i) => (
        <PlanetTableOrbitMark
          key={`tbl-orbit-${i}`}
          slotIndex={i}
          caption={captions[i] ?? ''}
          orbitClockMs={orbitClockMs}
          orbitParamsSv={orbitParamsSv}
          tableSlotCount={tableSlotCount}
          npcOrbitCycleMs={npcOrbitCycleMs}
        />
      ))}
    </>
  );
});

const PlanetArcStaticMarks = memo(function PlanetArcStaticMarks({
  orbitClockMs,
  arcShips,
  arcCount,
  arcCaptionHeads,
}: {
  orbitClockMs: SharedValue<number>;
  arcShips: ArcNpcTrafficShip[];
  arcCount: number;
  arcCaptionHeads: string[];
}) {
  const flatSv = useSharedValue<number[]>([]);
  const syncMsSv = useSharedValue(0);
  const shipCountSv = useSharedValue(0);
  const arcPackSigRef = useRef('');
  const arcPackSig = useMemo(
    () =>
      arcShips
        .map(s =>
          [
            s.id,
            s.phase,
            s.phaseDurationSec.toFixed(3),
            s.orbitRadiusPx.toFixed(2),
            s.edgeAngleRad.toFixed(4),
            s.arcTrafficDwellRadPerSec.toFixed(4),
          ].join(':'),
        )
        .join('|'),
    [arcShips],
  );
  useLayoutEffect(() => {
    if (arcPackSigRef.current === arcPackSig) return;
    arcPackSigRef.current = arcPackSig;
    shipCountSv.value = arcShips.length;
    flatSv.value = packArcNpcShipsToFloat32(arcShips);
    syncMsSv.value = orbitClockMs.value;
  }, [arcPackSig, arcShips, orbitClockMs, flatSv, shipCountSv, syncMsSv]);

  const count = Math.min(arcCount, 12);
  if (count <= 0) return null;
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const caption = arcCaptionHeads[i] ?? '';
        return (
          <PlanetArcStaticOrbitMark
            key={`arc-static-${i}`}
            index={i}
            caption={caption}
            orbitClockMs={orbitClockMs}
            syncMsSv={syncMsSv}
            flatSv={flatSv}
            shipCountSv={shipCountSv}
          />
        );
      })}
    </>
  );
});

const PlanetArcStaticOrbitMark = memo(function PlanetArcStaticOrbitMark({
  index,
  caption,
  orbitClockMs,
  syncMsSv,
  flatSv,
  shipCountSv,
}: {
  index: number;
  caption: string;
  orbitClockMs: SharedValue<number>;
  syncMsSv: SharedValue<number>;
  flatSv: SharedValue<number[]>;
  shipCountSv: SharedValue<number>;
}) {
  const animated = useAnimatedStyle(() => {
    'worklet';
    const p = computeArcNpcShipScreenPacked(
      index,
      orbitClockMs.value,
      syncMsSv.value,
      flatSv.value,
      shipCountSv.value,
      ORBIT_CENTER,
    );
    if (!p) {
      return {
        opacity: 0,
        transform: [{ translateX: -9999 }, { translateY: -9999 }],
      };
    }
    return {
      opacity: p.opacity,
      transform: [{ translateX: p.x - 7 }, { translateY: p.y - 7 }],
    };
  }, [index]);
  return (
    <Animated.View style={[bgStyles.orbitMarkWrap, animated]}>
            <View style={bgStyles.orbitMarkLabelCol}>
              <Text style={bgStyles.orbitMarkArcStatic}>◇</Text>
              {caption ? (
                <Text style={bgStyles.orbitShipCaptionArcStatic} numberOfLines={1} ellipsizeMode="tail">
                  {caption}
                </Text>
              ) : null}
            </View>
    </Animated.View>
  );
});

const PlanetPlayerBlueOrbitMark = memo(function PlanetPlayerBlueOrbitMark({
  orbitClockMs,
}: {
  orbitClockMs: SharedValue<number>;
}) {
  const playerNick = usePlayerStore((s) => s.player?.nickname ?? '');
  const playerNickLabel = useMemo(() => {
    const t = String(playerNick ?? '').trim();
    return t.length > 0 ? t : '—';
  }, [playerNick]);
  const animated = useAnimatedStyle(() => {
    'worklet';
    const t01 =
      (((orbitClockMs.value % NPC_ORBIT_CYCLE_MS) + NPC_ORBIT_CYCLE_MS) % NPC_ORBIT_CYCLE_MS)
      / NPC_ORBIT_CYCLE_MS;
    const ang = -Math.PI / 2 + t01 * Math.PI * 2;
    const r = ORBIT_SCENE_SIZE * 0.43;
    const x = ORBIT_CENTER + Math.cos(ang) * r;
    const y = ORBIT_CENTER + Math.sin(ang) * r;
    return {
      opacity: 0.98,
      transform: [{ translateX: x - 7 }, { translateY: y - 7 }],
    };
  }, [orbitClockMs]);

  return (
    <Animated.View style={[bgStyles.orbitMarkWrap, animated]} pointerEvents="none">
      <View style={bgStyles.orbitMarkLabelCol}>
        <Text style={bgStyles.orbitShipCaptionPlayerBlue} numberOfLines={1} ellipsizeMode="tail">
          {playerNickLabel}
        </Text>
        <Text style={bgStyles.orbitMarkPlayerBlue}>◇</Text>
      </View>
    </Animated.View>
  );
});

// ── 메뉴 버튼 ──────────────────────────────────────────────────

function MenuButton({
  label, onPress, primary, disabled, showBadge,
}: {
  label: string;
  onPress: () => void; primary?: boolean; disabled?: boolean; showBadge?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.menuBtn, primary && styles.menuBtnPrimary, disabled && styles.menuBtnDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      {showBadge ? <View style={styles.menuBadgeDot} /> : null}
      <Text style={[styles.menuLabel, primary && styles.menuLabelPrimary, disabled && styles.menuLabelDisabled]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function StatItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, highlight && { color: COLORS.skill, fontWeight: FONTS.weight.bold }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stageRoot: { flex: 1, position: 'relative' },
  foreground: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'column',
  },
  mainArea: {
    flex: 1,
    minHeight: 0,
    position: 'relative',
  },
  scroll: { flex: 1 },
  /** Android 등에서 스크롤 기본 불투명 레이어가 배경 궤도를 덮는 경우 방지 */
  scrollTransparent: { backgroundColor: 'transparent' },
  scrollContent: {
    flexGrow: 1,
  },
  infoOverlaySlot: {
    position: 'absolute',
    right: SPACING.xs,
    top: SPACING.xs,
    zIndex: 10,
    maxWidth: '42%',
  },
  edenCombatHudSlot: {
    position: 'absolute',
    left: 4,
    right: 4,
    zIndex: 11,
  },
  battleReadyOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '22%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 12,
  },
  battleReadyText: {
    fontFamily: FONTS.mono,
    fontSize: Math.max(9, Math.floor(FONTS.size.lg * 0.5)),
    fontWeight: FONTS.weight.bold,
    color: '#FF4D4D',
    letterSpacing: 1.2,
    textShadowColor: 'rgba(32,0,0,0.65)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  battleReadyTextBlinkOn: {
    opacity: 1,
  },
  battleReadyTextBlinkOff: {
    opacity: 0.25,
  },
  battleReadyCounter: {
    marginTop: 4,
    fontFamily: FONTS.mono,
    fontSize: Math.max(8, Math.floor(FONTS.size.md * 0.5)),
    color: '#FF8A8A',
    fontWeight: FONTS.weight.bold,
    textShadowColor: 'rgba(18,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  infoPanelWrap: {
    width: 112,
    flexShrink: 0,
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: 'rgba(120,132,160,0.35)',
    backgroundColor: 'rgba(12,18,32,0.42)',
    paddingLeft: SPACING.xs,
    paddingRight: 2,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.sm,
    borderRadius: 4,
    overflow: 'hidden',
  },
  infoPanelTitle: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.ink_faint,
    letterSpacing: 3,
    marginBottom: 4,
    textTransform: 'lowercase',
  },
  infoPanelWrapCapitalCombatMuted: {
    opacity: PLANET_HUB_CAPITAL_COMBAT_DIM_OPACITY,
    borderColor: 'rgba(130, 138, 150, 0.3)',
    backgroundColor: 'rgba(14, 18, 26, 0.34)',
  },
  infoPanelTitleCapitalCombatMuted: {
    color: PLANET_HUB_CAPITAL_COMBAT_GRAY.systemName,
  },
  infoInkCapitalCombatMuted: {
    color: PLANET_HUB_CAPITAL_COMBAT_GRAY.territory,
  },
  infoLogScroll: {
    flexGrow: 0,
  },
  infoLogContent: {
    paddingBottom: INFO_LOG_CONTENT_PAD_BOTTOM,
  },
  infoTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: INFO_LOG_ROW_GAP_PX,
    minHeight: INFO_LOG_LINE_HEIGHT_PX,
  },
  infoRowBullet: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    lineHeight: INFO_LOG_LINE_HEIGHT_PX,
    color: COLORS.ink_light,
  },
  infoNameMkCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  infoTableName: {
    flexShrink: 1,
    fontFamily: FONTS.mono,
    fontSize: 9,
    lineHeight: INFO_LOG_LINE_HEIGHT_PX,
    color: COLORS.ink_light,
  },
  infoTableSep: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    lineHeight: INFO_LOG_LINE_HEIGHT_PX,
    color: COLORS.ink_faint,
    marginLeft: 3,
    marginRight: 2,
  },
  infoTableMk: {
    flexShrink: 0,
    fontFamily: FONTS.mono,
    fontSize: 9,
    lineHeight: INFO_LOG_LINE_HEIGHT_PX,
    color: COLORS.ink_mid,
  },
  infoTableFull: {
    flex: 1,
    fontFamily: FONTS.mono,
    fontSize: 9,
    lineHeight: INFO_LOG_LINE_HEIGHT_PX,
    color: COLORS.ink_light,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PLANET_MAIN_TOPBAR_PADDING_HORIZONTAL,
    paddingVertical: PLANET_MAIN_TOPBAR_PADDING_VERTICAL,
    borderBottomWidth: PLANET_MAIN_TOPBAR_BORDER_BOTTOM_PX,
    borderBottomColor: COLORS.border,
    backgroundColor: `${COLORS.bg_panel}CC`,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: SPACING.xs,
    width: 112,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    columnGap: SPACING.xs,
    width: 112,
  },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    color: COLORS.ink_dark,
    letterSpacing: 1,
  },
  iconBtn: {
    width: PLANET_MAIN_TOPBAR_ICON_BUTTON_PX,
    height: PLANET_MAIN_TOPBAR_ICON_BUTTON_PX,
    borderRadius: PLANET_MAIN_TOPBAR_ICON_BORDER_RADIUS,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: `${COLORS.bg_secondary}AA`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planetStageReserve: {
    width: '100%',
    backgroundColor: 'transparent',
  },
  miningQuickControlRow: {
    width: '100%',
    paddingHorizontal: 2,
    marginTop: -30,
    marginBottom: 4,
  },
  planetOuter: {
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg_secondary,
  },
  /** 핵심 초상 — `planetInner`와 동일 지름(0.7×) 원 안에만 합성 */
  planetPortraitInnerWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planetInner: {
    borderWidth: 1,
  },
  planetCoreGaugePanel: {
    position: 'absolute',
    width: 58,
    rowGap: 1,
    /** 행성 원·테두리 대비 시각적 중앙 보정 */
    transform: [{ translateX: 3 }],
  },
  planetCoreGaugeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 2,
  },
  planetCoreGaugeLabel: {
    width: 8,
    fontFamily: FONTS.mono,
    fontSize: 8,
    lineHeight: 10,
    fontWeight: FONTS.weight.bold,
    textAlign: 'center',
  },
  planetCoreGaugeSegWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 0,
    flex: 1,
  },
  planetCoreGaugeSeg: {
    width: 8,
    height: 3,
    borderWidth: 1,
    borderRadius: 1,
  },
  planetCoreGaugeSegOff: {
    backgroundColor: 'rgba(110,128,160,0.16)',
    borderColor: 'rgba(110,128,160,0.35)',
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    columnGap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  miningCard: {
    marginHorizontal: SPACING.md,
    marginTop: -2,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(120, 158, 226, 0.45)',
    borderRadius: 10,
    backgroundColor: 'rgba(14, 24, 42, 0.8)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    rowGap: 6,
  },
  miningHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: SPACING.sm,
  },
  miningTitle: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    color: COLORS.ink_dark,
  },
  miningMeta: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_mid,
  },
  miningGuideLine: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: 'rgba(188, 214, 238, 0.9)',
  },
  miningGaugeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
  },
  miningGaugeLabel: {
    width: 34,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_mid,
  },
  miningGaugeSegments: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 2,
  },
  miningGaugeSeg: {
    flex: 1,
    height: 6,
    borderRadius: 2,
    borderWidth: 1,
  },
  miningGaugeSegOn: {
    backgroundColor: '#F5D86B',
    borderColor: '#FFE8A6',
  },
  miningGaugeSegOff: {
    backgroundColor: 'rgba(90, 108, 132, 0.25)',
    borderColor: 'rgba(122, 140, 164, 0.45)',
  },
  miningGaugePct: {
    width: 36,
    textAlign: 'right',
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: '#FFE6A1',
  },
  miningSummary: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: '#9FD7FF',
  },
  miningSummaryMuted: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_light,
  },
  miningActionsWrap: {
    rowGap: 8,
  },
  miningControlRow: {
    flexDirection: 'row',
    columnGap: SPACING.sm,
  },
  miningControlBtn: {
    borderWidth: 1,
    borderColor: 'rgba(140, 166, 210, 0.6)',
    borderRadius: 8,
    backgroundColor: 'rgba(24, 38, 66, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  miningControlText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_dark,
    fontWeight: FONTS.weight.bold,
  },
  stanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    columnGap: SPACING.sm,
    marginBottom: 4,
  },
  stanceRowHidden: {
    opacity: 0,
  },
  stanceBtn: {
    width: '30.5%',
    backgroundColor: COLORS.bg_panel,
    borderWidth: 1,
    borderColor: COLORS.border_dark,
    borderRadius: 6,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  stanceLabel: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_mid,
  },
  menuBtn: {
    position: 'relative',
    width: '18%',
    backgroundColor: COLORS.bg_panel,
    borderWidth: 1,
    borderColor: COLORS.border_dark,
    borderRadius: 6,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  menuBadgeDot: {
    position: 'absolute',
    top: -5.6,
    right: -5.6,
    width: 11.2,
    height: 11.2,
    borderRadius: 5.6,
    backgroundColor: '#8A1538',
  },
  menuBtnPrimary: {
    backgroundColor: COLORS.ink_dark,
    borderColor: COLORS.ink_dark,
  },
  menuBtnDisabled: {
    opacity: 0.35,
  },
  menuLabel: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    color: COLORS.ink_dark,
  },
  menuLabelPrimary: { color: COLORS.bg_primary },
  menuLabelDisabled: { color: COLORS.ink_light },
  statsBox: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.xl,
    backgroundColor: COLORS.bg_panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  statsTitle: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_light,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  statItem: { flex: 1 },
  statLabel: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_light,
  },
  statValue: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: COLORS.ink_dark,
  },
  bottomFeatureReserve: {
    width: '100%',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    alignSelf: 'center',
    maxWidth: 430,
    backgroundColor: 'transparent',
  },
});

const bgStyles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
  },
  nebulaBackdropLayer: {
    position: 'absolute',
    opacity: 0.94,
  },
  /** 배지는 상단 고정, 행성은 아래 `planetOrbitSlot`에서만 수직 조정 */
  planetBgStack: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
  },
  systemBadge: {
    width: '100%',
    maxWidth: 340,
    alignSelf: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    zIndex: 20,
    ...(Platform.OS === 'android' ? { elevation: 20 } : {}),
    /** 행성 궤도와 붙이기 — 배지 자체 Y는 스택 상단에서 동일 */
    marginBottom: SPACING.xs,
  },
  /** 자본궤도 전투 중 — 성계 배지 전체를 살짝 투명하게(텍스트는 별도 회색 톤) */
  planetHubCapitalCombatBadgeDim: {
    opacity: 0.9,
  },
  /** 자본궤도 전투 중 — 궤도 연출(전투 SVG 제외) 투명도 */
  planetHubCapitalCombatOrbitDim: {
    opacity: PLANET_HUB_CAPITAL_COMBAT_DIM_OPACITY,
  },
  planetOrbitSlot: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneBadge: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 1,
  },
  zoneBadgeSafe: {
    color: COLORS.safe_zone,
    borderColor: COLORS.safe_zone,
    fontWeight: FONTS.weight.bold,
  },
  systemNameSlot: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  systemName: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    color: COLORS.ink_mid,
    textAlign: 'center',
    alignSelf: 'stretch',
    textShadowColor: 'rgba(6,10,20,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  /** 클랜 마크/소유 — `systemBadge` 내 고정 슬롯(`planetMainStageLayout` 높이와 동기) */
  clanPlateInBadge: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  territorySubtitle: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_mid,
    opacity: 0.92,
    textAlign: 'center',
    alignSelf: 'stretch',
    marginTop: 2,
    textShadowColor: 'rgba(6,10,20,0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  planetColumn: {
    alignItems: 'center',
    maxWidth: 430,
    alignSelf: 'center',
    width: '100%',
  },
  /** 클랜 소유(솔라 스테이션과 동일 플로우) — 별도 translate/마진 보정 없음 */
  safeAiClanPlate: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    maxWidth: 320,
    marginBottom: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  safeAiClanPlateMark: {
    marginRight: SPACING.sm,
  },
  safeAiClanPlateTextCol: {
    flexShrink: 1,
    minWidth: 0,
    maxWidth: 260,
  },
  safeAiClanPlateClan: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_light,
    fontWeight: '400',
    textAlign: 'center',
  },
  orbitScene: {
    width: ORBIT_SCENE_SIZE,
    height: ORBIT_SCENE_SIZE,
    alignSelf: 'center',
    position: 'relative',
  },
  orbitLayerPlanet: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planetTapHitbox: {
    position: 'absolute',
    width: 164,
    height: 164,
    borderRadius: 82,
    backgroundColor: 'transparent',
  },
  orbitLayerWorldObjects: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  orbitLayerShips: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  orbitLayerArcNpcTraffic: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
  },
  orbitLayerPlayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 4,
  },
  orbitTestLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
    transform: [
      { scaleX: PLANET_MAIN_COMBAT_LAYER_WIDTH_SCALE_X },
      { scaleY: PLANET_MAIN_COMBAT_LAYER_HEIGHT_SCALE_Y },
    ],
    ...(Platform.OS === 'android' ? { elevation: 8 } : {}),
  },
  orbitMarkWrap: {
    position: 'absolute',
    width: 14,
    height: 14,
    left: 0,
    top: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  worldObjectMarkWrap: {
    width: WORLD_OBJECT_ANCHOR_PX * 2,
    height: WORLD_OBJECT_ANCHOR_PX * 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  orbitMarkLabelCol: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    maxWidth: 220,
  },
  worldObjectLabelCol: {
    width: WORLD_OBJECT_ANCHOR_PX * 2,
    minHeight: WORLD_OBJECT_ANCHOR_PX * 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  worldObjectMiningOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: WORLD_OBJECT_ANCHOR_PX * 2,
    height: WORLD_OBJECT_ANCHOR_PX * 2,
    overflow: 'visible',
  },
  worldObjectMiningGuideSvg: {
    position: 'absolute',
    left: WORLD_OBJECT_ANCHOR_PX,
    top: WORLD_OBJECT_ANCHOR_PX - MINING_GUIDE_LINE_RUN_PX,
  },
  worldObjectCaptionOverlay: {
    position: 'absolute',
    left: -(96 - WORLD_OBJECT_ANCHOR_PX * 2) / 2,
    top: WORLD_OBJECT_ANCHOR_PX * 2 + 4,
  },
  orbitMarkGray: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: '#8B95A8',
    lineHeight: 11,
    textAlign: 'center',
  },
  worldObjectGlyph: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    lineHeight: 11,
    color: '#A7E0FF',
    textAlign: 'center',
  },
  worldObjectAsteroidDot: {
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: '#F5D86B',
    borderWidth: 2,
    borderColor: 'rgba(255, 245, 205, 0.95)',
  },
  worldObjectAsteroidDotInactive: {
    backgroundColor: '#7C8798',
    borderColor: 'rgba(180, 190, 206, 0.75)',
  },
  worldObjectMiningGuideWrap: {
    position: 'absolute',
    left:
      WORLD_OBJECT_ANCHOR_PX +
      MINING_GUIDE_LINE_RUN_PX +
      MINING_GUIDE_LABEL_PAST_TIP_PX,
    top:
      WORLD_OBJECT_ANCHOR_PX -
      MINING_GUIDE_LINE_RUN_PX -
      MINING_GUIDE_LABEL_PAST_TIP_PX,
    alignItems: 'flex-start',
    width: 120,
  },
  worldObjectMiningLabel: {
    marginLeft: 0,
    marginTop: 0,
    fontFamily: FONTS.mono,
    fontSize: 9,
    lineHeight: 11,
    color: '#FFE4A3',
    textShadowColor: 'rgba(6,10,18,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  worldObjectMiningLabelActive: {
    color: '#71E391',
  },
  worldObjectMiningGaugeRow: {
    marginLeft: 0,
    marginTop: 1,
    flexDirection: 'row',
    columnGap: 1,
  },
  worldObjectMiningGaugeSeg: {
    width: 5,
    height: 4,
    borderRadius: 1,
    borderWidth: 1,
  },
  worldObjectMiningGaugeSegOn: {
    backgroundColor: '#F5D86B',
    borderColor: '#FFE8A6',
  },
  worldObjectMiningGaugeSegOff: {
    backgroundColor: 'rgba(90,108,132,0.25)',
    borderColor: 'rgba(122,140,164,0.45)',
  },
  worldObjectMiningGaugeSegPaused: {
    opacity: 0.45,
  },
  worldObjectCaption: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    lineHeight: 12,
    width: 96,
    textAlign: 'center',
    color: 'rgba(188,214,238,0.9)',
    textShadowColor: 'rgba(6,10,18,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  orbitShipCaption: {
    fontFamily: FONTS.mono,
    fontSize: 6,
    lineHeight: 8,
    color: 'rgba(200,208,220,0.92)',
    textAlign: 'center',
    marginTop: 1,
    maxWidth: 70,
    textShadowColor: 'rgba(6,10,20,0.75)',
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 1.5,
  },
  orbitMarkArcStatic: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: 'rgba(220,200,255,0.92)',
    lineHeight: 11,
    textAlign: 'center',
  },
  orbitMarkPlayerBlue: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: '#6CB6FF',
    lineHeight: 12,
    textAlign: 'center',
    textShadowColor: 'rgba(8,16,32,0.75)',
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 1.5,
  },
  orbitShipCaptionPlayerBlue: {
    fontFamily: FONTS.mono,
    fontSize: 6,
    lineHeight: 8,
    color: '#9ED0FF',
    textAlign: 'center',
    marginBottom: 1,
    maxWidth: 70,
    textShadowColor: 'rgba(6,10,20,0.75)',
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 1.5,
  },
  orbitShipCaptionArcStatic: {
    fontFamily: FONTS.mono,
    fontSize: 6,
    lineHeight: 8,
    color: 'rgba(220,200,255,0.9)',
    textAlign: 'center',
    marginTop: 1,
    maxWidth: 70,
    textShadowColor: 'rgba(20,10,32,0.65)',
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 1.5,
  },
});

function PlanetMainStanceRow({ routeFocused }: { routeFocused: boolean }) {
  const sim = useCapitalRealtimeCombatSimContext();
  const activeStance = useBattleStanceStore((s) => s.activeStance);
  const setBattleStance = useBattleStanceStore((s) => s.setStance);
  const [engaged, setEngaged] = useState(false);
  const [delayReady, setDelayReady] = useState(false);

  useEffect(() => {
    if (!sim || !routeFocused) {
      setEngaged(false);
      return;
    }
    const tick = () => setEngaged(computeMainStageCapitalEngagement(sim));
    tick();
    const id = setInterval(tick, PLANET_MAIN_STANCE_ENGAGEMENT_POLL_MS);
    return () => clearInterval(id);
  }, [sim, routeFocused]);

  useEffect(() => {
    if (!engaged) {
      setDelayReady(false);
      return;
    }
    setDelayReady(false);
    const t = setTimeout(() => setDelayReady(true), PLANET_MAIN_STANCE_UI_DELAY_MS);
    return () => clearTimeout(t);
  }, [engaged]);

  const stanceControlsEnabled = engaged && delayReady;

  return (
    <View
      style={[
        styles.stanceRow,
        !stanceControlsEnabled && styles.stanceRowHidden,
      ]}
      pointerEvents={stanceControlsEnabled ? 'auto' : 'none'}
    >
      {(['AGGRESSIVE', 'DEFENSIVE', 'NEUTRAL'] as const).map((stanceId) => {
        const meta = BATTLE_STANCE_META[stanceId];
        const isActive = stanceControlsEnabled && activeStance === stanceId;
        return (
          <TouchableOpacity
            key={stanceId}
            style={[
              styles.stanceBtn,
              isActive && { borderColor: meta.color, backgroundColor: `${meta.color}22` },
            ]}
            onPress={() => setBattleStance(stanceId)}
            disabled={!stanceControlsEnabled}
            activeOpacity={stanceControlsEnabled ? 0.7 : 1}
          >
            <Text
              style={[
                styles.stanceLabel,
                isActive && { color: meta.color, fontWeight: FONTS.weight.bold },
              ]}
              numberOfLines={1}
            >
              [{meta.label}]
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
