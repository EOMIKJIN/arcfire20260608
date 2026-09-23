// planet hub subcomponents — extracted from app/(game)/planet.tsx
import React, { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Image, useWindowDimensions, Platform, Pressable } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import Animated, {
  runOnJS,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS, FONTS, SPACING, ZONE_COLORS } from '../../../utils/theme';
import { useT } from '../../../i18n';
import { useAppSettingsStore } from '../../../store/appSettingsStore';
import { resolveStarSystemDisplayName } from '../../../i18n/systemText';
import { resolvePlanetZoneDisplayLabel } from '../../../i18n/zoneText';
import type { StarSystem, ZoneType } from '../../../types';
import type { PlanetCoreGaugeView } from '../../../store/planetCoreRuntimeStore';
import { planetCoreRuntimeToGaugeView, planetCsvBaselineToRuntime, usePlanetCoreRuntimeStore } from '../../../store/planetCoreRuntimeStore';
import { usePlanetGlobeRuntimeSourceStore } from '../../../store/planetGlobeRuntimeSourceStore';
import { usePlanetNebulaStore } from '../../../store/planetNebulaStore';
import { usePlayerStore } from '../../../store/playerStore';
import { useClanWarFoundationStore } from '../../../store/clanWarFoundationStore';
import type { ArcNpcTrafficShip } from '../../../store/arcNpcTrafficStore';
import type { ArcInboundDrone } from '../../../store/arcInboundDroneStore';
import { PlanetCorePortraitWithTempAdminOverride } from '../PlanetCorePortraitWithTempAdminOverride';
import { resolveArcadiaGlobeBakeSource } from '../../../game/tempAdminArcadiaGlobeBake';
import { PlanetAtmosphereBoundaryRing } from '../PlanetAtmosphereBoundaryRing';
import { PlanetHubOrbitSkiaLayer } from '../PlanetHubOrbitSkiaLayer';
import { PlanetHubInboundDroneLayer } from '../PlanetHubInboundDroneLayer';
import { hubInboundDroneDodgeHitFxRef } from '../../../arcCore/inboundDrone/hubInboundDroneDodgeBridge';
import { readPlanetOrbitClockMs } from '../../../arcCore/orbitClockMsBridge';
import { HUB_WORKLET_JS_BRIDGE_INTERVAL_MS } from '../planetHubWorkletContract';
import { PlanetNebulaImageBackdrop } from '../PlanetNebulaImageBackdrop';
import { SkiaPlanetNebulaShaderBackdrop } from '../SkiaPlanetNebulaShaderBackdrop';
import { enqueueColonizedPlanetGlobeBake, hasBundledPlanetGlobeBake } from '../../../game/planetGlobeRuntimeBake';
import { registerPlanetSessionResource } from '../../../game/planetSessionRegistry';
import { resolvePlanetAtmosphereRingHex } from '../../../game/planetNebulaProfile';
import { resolveMainStageSkiaBackdrop } from '../../../game/mainStageSkiaBackdrop';
import { useCapitalRealtimeCombatSimContext } from '../../../combat';
import { resolvePlanetNebulaBakedSource } from '../../../game/planetNebulaBakedAssets';
import { subscribeHubSkiaNativeReclaim } from '../../../game/nativeReclaim/hubSkiaNativeReclaimSignal';
import { subscribeHubBackdropNativeRemount } from '../../../game/nativeReclaim/hubBackdropNativeRemountSignal';
import { HUB_DODGE_OVERLAY_UNMOUNT_DEBOUNCE_MS } from '../../../game/nativeReclaim/processMemoryBudgetPolicy';
import { emitMemProfileMarker } from '../../../game/devMemoryProfileBridge';
import { useDevSkiaMountAllowed } from '../../../hooks/useDevSkiaMountAllowed';
import { resolveDefenseSatelliteCombatStatsForObject } from '../../../systems/planetaryDefense/resolveDefenseSatelliteCombatStats';
import { computeTableNpcOrbitXY } from '../planetOrbitHubWorklets';
import {
  PLANET_MAIN_BACKGROUND_CLAN_PLATE_AFTER_NAME_GAP_PX,
  PLANET_MAIN_BACKGROUND_CLAN_PLATE_OFFSET_X_PX,
  PLANET_MAIN_BACKGROUND_CLAN_PLATE_OFFSET_Y_PX,
  PLANET_MAIN_BACKGROUND_CLAN_PLATE_SLOT_HEIGHT_PX,
  PLANET_MAIN_BACKGROUND_SYSTEM_NAME_MIN_HEIGHT_PX,
  PLANET_MAIN_ORBIT_SCENE_SIZE as ORBIT_SCENE_SIZE,
} from '../../../stages/planetMainStageLayout';
import type { CapitalRealtimeCombatSim } from '../../../combat/capitalRealtimeTypes';
import type { WorldObject } from '../../../worldObjects';
import { isStelliumColonizeWorldObject } from '../../../worldObjects/providers/stelliumColonizeWorldObjectProvider';
import { STELLIUM_COLONIZE_ORANGE, StelliumColonizeOrbitTrafficMark } from './StelliumColonizeOrbitMark';
import { isStelliumColonizeRimPhase } from '../../../arcCore/colonize/stelliumColonizeTypes';
import { useStelliumColonizeStore } from '../../../store/stelliumColonizeStore';
import {
  WORLD_OBJECT_DEFENSE_SATELLITE_ORBIT_CYCLE_MS,
  WORLD_OBJECT_ORBIT_CYCLE_MS,
  clampDefenseSatelliteRadiusScale,
  clampWorldObjectRadiusScale,
} from '../../../worldObjects/planetWorldObjectOrbit';
import {
  INFO_LOG_VIEWPORT_ROWS,
  MAX_WORLD_OBJECT_MARKS,
  MINING_GUIDE_LINE_RUN_PX,
  PLANET_CORE_GAUGE_SPEC,
  PLANET_HUB_CAPITAL_COMBAT_GRAY,
  PLANET_MAIN_COMBAT_LAYER_HEIGHT_SCALE_Y,
  PLANET_MAIN_COMBAT_LAYER_WIDTH_SCALE_X,
  PLANET_MAIN_ORBIT_VISUAL_LIFT_PX,
  WORLD_OBJECT_ANCHOR_PX,
} from '../../../game/planetHub/planetHubConstants';
import { planetHubStyles as styles, planetHubBgStyles as bgStyles } from './planetHubStyles';
import {
  localizeNearbyInfoDetailRow,
  resolveNearbyInfoPanelCaptainName,
} from '../../../game/planetHub/nearbyPresenceDisplay';
import { resolvePinnedInfoMark } from '../../../game/planetHub/nearbyPresenceContract';
import type { NearbyInfoDetailRow } from '../../../game/planetHub/nearbyPresenceDisplay';
import { presentNearbyPresenceInfoOverlay } from '../../../ui/overlay/arcOverlayStore';

export const ORBIT_CENTER = ORBIT_SCENE_SIZE / 2;

export type NearbyInfoRow = NearbyInfoDetailRow;
/** 행성 주변 NPC 궤도·채굴 앵커 — 화면 중심 기준 */

/** 궤도 박스 수직 중심에서 함선 마커까지(하단+여백+글자 반줄) 거리의 50%만큼 위로 — 행성에 가깝게 */
/** 배경 행성/성운(및 궤도 전함) 블록을 소폭 위로 보정 */

export function NearbyShipInfoPanel({
  rows,
  planetId,
}: {
  rows: NearbyInfoDetailRow[];
  planetId?: string;
}) {
  const t = useT();
  const locale = useAppSettingsStore((s) => s.locale);
  const localizedRows = useMemo(
    () => rows.map((row) => localizeNearbyInfoDetailRow(row, locale)),
    [rows, locale],
  );

  const openDetailOverlay = useCallback(() => {
    presentNearbyPresenceInfoOverlay(localizedRows, planetId ?? '');
  }, [localizedRows, planetId]);

  return (
    <Pressable
      onPress={openDetailOverlay}
      style={styles.infoPanelWrap}
      accessibilityRole="button"
      accessibilityLabel={t('nearbyPresence.panelA11y')}
    >
      <Text style={styles.infoPanelTitle}>
        {t('nearbyPresence.panelTitle')}
      </Text>
      <View style={styles.infoLogContent} pointerEvents="none">
        {localizedRows.slice(0, INFO_LOG_VIEWPORT_ROWS).map((row) => {
          const pinMark = resolvePinnedInfoMark(row.pinKind);
          return (
          <View key={`info-slot-${row.keySlot}`} style={styles.infoTableRow}>
            <Text style={styles.infoRowBullet}>
              ›{' '}
            </Text>
            {pinMark ? (
              <Text style={styles.infoPinMark}>{pinMark} </Text>
            ) : null}
            <Text
              style={styles.infoTableCaptain}
              numberOfLines={1}
            >
              {resolveNearbyInfoPanelCaptainName(row)}
            </Text>
          </View>
          );
        })}
      </View>
    </Pressable>
  );
}

// ── 행성 도트 그래픽 ──────────────────────────────────────────

export function PlanetCoreGaugeRow({
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

export function PlanetDot({
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
  const colonizeRimActive = useStelliumColonizeStore((s) =>
    isStelliumColonizeRimPhase(s.byPlanetId[planetId]?.phase),
  );
  const nebulaRingHex = resolvePlanetAtmosphereRingHex(planetId, zone);
  const runtimeGlobeUri = usePlanetGlobeRuntimeSourceStore((s) =>
    s.activePlanetId === planetId ? s.dataUri : null,
  );
  useLayoutEffect(() => {
    if (combatMuted) return;
    usePlanetNebulaStore.getState().ensureProfileForPlanet(planetId);
  }, [combatMuted, planetId]);
  useEffect(() => {
    if (combatMuted || hasBundledPlanetGlobeBake(planetId)) return;
    const token = registerPlanetSessionResource({
      ownerId: 'planet_globe_runtime',
      planetId,
      dispose: () => {
        usePlanetGlobeRuntimeSourceStore.getState().clearIfPlanet(planetId);
      },
    });
    enqueueColonizedPlanetGlobeBake(planetId, zone);
    return () => {
      token.release();
    };
  }, [combatMuted, planetId, zone]);
  const atmosphereRingColor = colonizeRimActive
    ? STELLIUM_COLONIZE_ORANGE
    : (combatMuted ? color : (nebulaRingHex ?? color));
  const innerSize = size * 0.7;
  const globeBakeSource = resolveArcadiaGlobeBakeSource(planetId, {
    combatMuted,
    runtimeFileUri: runtimeGlobeUri,
  });

  return (
    <View
      style={[
        styles.planetOuter,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
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
            {globeBakeSource ? (
              <Image
                source={globeBakeSource}
                style={{ width: innerSize, height: innerSize }}
                resizeMode="cover"
                resizeMethod="resize"
                accessibilityIgnoresInvertColors
              />
            ) : (
              <PlanetCorePortraitWithTempAdminOverride
                planetId={planetId}
                size={innerSize}
                zone={zone}
                coreGauges={coreGauges}
                combatMuted={combatMuted}
              />
            )}
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
      <PlanetAtmosphereBoundaryRing size={size} borderColor={atmosphereRingColor} borderWidth={2} />
    </View>
  );
}


/** 별 배경(StageShell) 위 레이어 — 행성 그래픽·성계/행성 명칭 (터치 없음) */
export const PlanetStageBackground = memo(function PlanetStageBackground({
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
  arcInboundDronesAtPlanet,
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
  combatSimRef,
  /** false — worldmap/전투/시설 blur: Skia·성운·궤도 레이어 언마운트(PSS 재상승 방지) */
  hubStageSkiaActive = true,
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
  arcInboundDronesAtPlanet: ArcInboundDrone[];
  worldObjects: WorldObject[];
  showEdenRaidTest: boolean;
  /** 채굴 활성 중에는 Skia 궤도 대신 정적 마커로 안전 모드 렌더 */
  miningPathActive?: boolean;
  miningProgressPct?: number;
  combatSimRef: React.MutableRefObject<CapitalRealtimeCombatSim | null>;
  /** 클랜전 점유/거점 한 줄(없으면 null) */
  territorySubtitle?: string | null;
  /** 안전구역 AI 클랜 소유 — `systemBadge` 내 표시(궤도 컬럼과 분리) */
  safeAiClanTerritoryPlate?: { clanName: string; clanColor: string } | null;
  planetStageScale: number;
  backgroundChrome: { paddingTop: number; paddingBottom: number };
  hubStageSkiaActive?: boolean;
}) {
  const t = useT();
  const locale = useAppSettingsStore((s) => s.locale);
  const clanWarClans = useClanWarFoundationStore((s) => s.clans);
  const devSkiaMountAllowed = useDevSkiaMountAllowed();
  const { width: bgWindowWidth, height: bgWindowHeight } = useWindowDimensions();
  const nebulaBackdropRef = useRef<View | null>(null);
  const orbitSceneRef = useRef<View | null>(null);
  const dodgeStageMountedRef = useRef(true);
  /** worklet→JS bridge — unmount 후 runOnJS SIGSEGV 방지 (SharedValue만 worklet에서 안전) */
  const dodgeBridgeAliveSv = useSharedValue(1);
  const [dodgeOrbitOffset, setDodgeOrbitOffset] = useState({ x: 0, y: 0 });
  const [inboundDroneSkiaDodgeLatch, setInboundDroneSkiaDodgeLatch] = useState(false);
  /** dodge Skia 오버레이 — latch 직후 즉시 언마운트 금지(SIGSEGV) · OFF 후 디바운스 언마운트 */
  const [hubDodgeSkiaOverlayMounted, setHubDodgeSkiaOverlayMounted] = useState(false);
  /** Skia dodge Canvas 성운+dodge 로드 완료 — ColorDodge 동일 버퍼 준비 후 RN 성운 숨김 */
  const [hubSkiaDodgeNebulaReady, setHubSkiaDodgeNebulaReady] = useState(false);
  /** deep reclaim — RN Image remount key only (Skia dodge sticky — key remount 금지) */
  const [hubRnBackdropRemountGen, setHubRnBackdropRemountGen] = useState(0);
  const inboundDroneSkiaDodgeLatchRef = useRef(false);
  inboundDroneSkiaDodgeLatchRef.current = inboundDroneSkiaDodgeLatch;
  const handleSkiaDodgeNebulaReady = useCallback(() => setHubSkiaDodgeNebulaReady(true), []);
  const handleSkiaDodgeNebulaLost = useCallback(() => setHubSkiaDodgeNebulaReady(false), []);
  const hubDodgeTimeMsRef = useRef(0);
  const noteHubDodgeTimeMsImpl = useCallback((ms: number) => {
    if (!dodgeStageMountedRef.current) return;
    hubDodgeTimeMsRef.current = ms;
  }, []);

  const noteHubDodgeTimeMsRef = useRef(noteHubDodgeTimeMsImpl);
  noteHubDodgeTimeMsRef.current = noteHubDodgeTimeMsImpl;

  /** identity 고정 — reaction deps 변경 시 triggerUI ShareableWorklet SIGSEGV 방지 */
  const bridgeNoteHubDodgeTimeMs = useCallback((ms: number) => {
    if (!dodgeStageMountedRef.current) return;
    noteHubDodgeTimeMsRef.current(ms);
  }, []);

  /** 드론 dodge FX 구간에만 orbitClock → JS ref 동기 (~20Hz — 60Hz runOnJS 장시간 PSS creep 방지) */
  const dodgeFxBridgeActive = useSharedValue(0);
  const dodgeBridgeLastSyncMs = useSharedValue(0);
  const HUB_DODGE_BRIDGE_INTERVAL_MS = HUB_WORKLET_JS_BRIDGE_INTERVAL_MS;
  useLayoutEffect(() => {
    dodgeBridgeAliveSv.value = 1;
    dodgeStageMountedRef.current = true;
    return () => {
      dodgeBridgeAliveSv.value = 0;
      dodgeFxBridgeActive.value = 0;
      dodgeBridgeLastSyncMs.value = 0;
      dodgeStageMountedRef.current = false;
    };
  }, [dodgeBridgeAliveSv, dodgeFxBridgeActive, dodgeBridgeLastSyncMs]);
  /**
   * latch ON → sticky mount (SIGSEGV 회피).
   * latch OFF → 즉시 언마운트 금지 · 디바운스 후 언마운트해 useImage EGL 상주 해제
   * (이전: soft reclaim/ blur 전까지 sticky → EGL~2× 스파이크가 수분 고정).
   */
  useEffect(() => {
    dodgeFxBridgeActive.value = inboundDroneSkiaDodgeLatch ? 1 : 0;
    if (inboundDroneSkiaDodgeLatch) {
      setHubDodgeSkiaOverlayMounted(true);
      // latch ON 직후 reaction은 ms 변경 전까지 fire 안 함 → JS 미러 1회 동기
      const nowMs = readPlanetOrbitClockMs();
      dodgeBridgeLastSyncMs.value = nowMs;
      bridgeNoteHubDodgeTimeMs(nowMs);
      return undefined;
    }
    const timer = setTimeout(() => {
      if (!dodgeStageMountedRef.current) return;
      if (inboundDroneSkiaDodgeLatchRef.current) return;
      setHubDodgeSkiaOverlayMounted(false);
      setHubSkiaDodgeNebulaReady(false);
      emitMemProfileMarker({
        stage: 'planet_hub',
        event: 'manual',
        detail: 'hub_dodge_overlay_unmount_debounce',
      });
    }, HUB_DODGE_OVERLAY_UNMOUNT_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [inboundDroneSkiaDodgeLatch, dodgeFxBridgeActive, dodgeBridgeLastSyncMs, bridgeNoteHubDodgeTimeMs]);
  useAnimatedReaction(
    () => orbitClockMs.value,
    (ms) => {
      'worklet';
      if (dodgeBridgeAliveSv.value === 0) return;
      if (dodgeFxBridgeActive.value === 0) return;
      if (ms - dodgeBridgeLastSyncMs.value < HUB_DODGE_BRIDGE_INTERVAL_MS) return;
      dodgeBridgeLastSyncMs.value = ms;
      runOnJS(bridgeNoteHubDodgeTimeMs)(ms);
    },
  );
  const handleInboundDroneSkiaDodgeLatch = useCallback((active: boolean) => {
    setInboundDroneSkiaDodgeLatch(active);
  }, []);
  useEffect(() => {
    dodgeFxBridgeActive.value = 0;
    setInboundDroneSkiaDodgeLatch(false);
    setHubDodgeSkiaOverlayMounted(false);
    setHubSkiaDodgeNebulaReady(false);
    dodgeBridgeLastSyncMs.value = 0;
  }, [planetId, dodgeBridgeLastSyncMs, dodgeFxBridgeActive]);

  /** blur(worldmap/전투/시설) — sticky Skia dodge·성운 useImage 네이티브 상주 해제 */
  useEffect(() => {
    if (hubStageSkiaActive) return;
    dodgeFxBridgeActive.value = 0;
    setInboundDroneSkiaDodgeLatch(false);
    setHubDodgeSkiaOverlayMounted(false);
    setHubSkiaDodgeNebulaReady(false);
    dodgeBridgeLastSyncMs.value = 0;
  }, [hubStageSkiaActive, dodgeBridgeLastSyncMs, dodgeFxBridgeActive]);

  /** releasePlanetMainStageSession — focus race 무관 Skia 강제 해제 */
  useEffect(() => {
    return subscribeHubSkiaNativeReclaim(() => {
      dodgeFxBridgeActive.value = 0;
      setInboundDroneSkiaDodgeLatch(false);
      setHubDodgeSkiaOverlayMounted(false);
      setHubSkiaDodgeNebulaReady(false);
      dodgeBridgeLastSyncMs.value = 0;
    });
  }, [dodgeFxBridgeActive, dodgeBridgeLastSyncMs]);

  /** 주기 deep reclaim — RN 성운 Image remount만 (Skia dodge는 sticky, key cycle 금지) */
  useEffect(() => {
    return subscribeHubBackdropNativeRemount(() => {
      setHubRnBackdropRemountGen((g) => g + 1);
    });
  }, []);
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
  const combatSimFromCtx = useCapitalRealtimeCombatSimContext();
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
  const mainStageBackdrop = useMemo(
    () => resolveMainStageSkiaBackdrop(templatePlanet ?? null),
    [templatePlanet],
  );
  const hubCapitalCombatMute = Boolean(showEdenRaidTest && combatSimFromCtx);
  /** colorDodge 닷지는 성운 Skia 캔버스와 동일 버퍼 — 전투·인바운드 드론 */
  const useSkiaCombatNebulaBackdrop = Boolean(
    showEdenRaidTest && mainStageBackdrop.nebulaShaderEnabled,
  );
  const hubNebulaDualStack = Boolean(
    !showEdenRaidTest && mainStageBackdrop.nebulaShaderEnabled,
  );
  const nebulaBakedImageSource = useMemo(
    () => resolvePlanetNebulaBakedSource(planetId, system.zone),
    [planetId, system.zone],
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
  /**
   * ColorDodge는 Skia 성운과 동일 버퍼 필수 — ready 후 RN만 숨김(언마운트 금지).
   * inbound remount 스킵은 reclaim 경로에서 유지(깜빡임↓ · 회수 본체 유지).
   */
  const hideRnNebulaForSkiaDodge =
    hubDodgeSkiaOverlayMounted && hubSkiaDodgeNebulaReady && inboundDroneSkiaDodgeLatch;

  const hubInboundSkiaDodgeOverlay = (
    <SkiaPlanetNebulaShaderBackdrop
      key={`skia-dodge-${planetId}`}
      size={nebulaBackdropSize}
      dodgeFxActive={inboundDroneSkiaDodgeLatch}
      dodgeFxOnlyOverlay
      renderNebulaShader={mainStageBackdrop.nebulaShaderEnabled}
      nebulaBakedImageSource={nebulaBakedImageSource}
      backgroundImageSource={mainStageBackdrop.backdropImageSource}
      dodgeHitFxRef={hubInboundDroneDodgeHitFxRef}
      dodgeTimeMsRef={hubDodgeTimeMsRef}
      dodgeOrbitSize={ORBIT_SCENE_SIZE}
      dodgeOrbitVisualScaleX={PLANET_MAIN_COMBAT_LAYER_WIDTH_SCALE_X}
      dodgeOrbitVisualScaleY={PLANET_MAIN_COMBAT_LAYER_HEIGHT_SCALE_Y}
      dodgeOrbitOffsetX={dodgeOrbitOffset.x}
      dodgeOrbitOffsetY={dodgeOrbitOffset.y}
      sessionPlanetId={planetId}
      hideUntilImagesReady
      onNebulaImagesReady={handleSkiaDodgeNebulaReady}
      onNebulaImagesLost={handleSkiaDodgeNebulaLost}
    />
  );

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
        {hubStageSkiaActive ? (
          useSkiaCombatNebulaBackdrop && devSkiaMountAllowed ? (
          <SkiaPlanetNebulaShaderBackdrop
            size={nebulaBackdropSize}
            active
            dodgeFxActive
            nebulaBakedImageSource={nebulaBakedImageSource}
            renderNebulaShader={mainStageBackdrop.nebulaShaderEnabled}
            backgroundImageSource={mainStageBackdrop.backdropImageSource}
            dodgeHitFxRef={
              showEdenRaidTest && combatSimFromCtx
                ? combatSimFromCtx.missileHitFxRef
                : hubInboundDroneDodgeHitFxRef
            }
            dodgeTimeMsRef={
              showEdenRaidTest && combatSimFromCtx?.tMsRef
                ? combatSimFromCtx.tMsRef
                : hubDodgeTimeMsRef
            }
            dodgeOrbitSize={combatSimFromCtx?.orbitSize ?? ORBIT_SCENE_SIZE}
            dodgeOrbitVisualScaleX={PLANET_MAIN_COMBAT_LAYER_WIDTH_SCALE_X}
            dodgeOrbitVisualScaleY={PLANET_MAIN_COMBAT_LAYER_HEIGHT_SCALE_Y}
            dodgeOrbitOffsetX={dodgeOrbitOffset.x}
            dodgeOrbitOffsetY={dodgeOrbitOffset.y}
            sessionPlanetId={planetId}
          />
        ) : hubNebulaDualStack ? (
          <>
            {/*
              RN 성운은 마운트 유지(키 remount만 deep reclaim). dodge 활성+Skia ready 시에만
              opacity 0 — ColorDodge는 Skia 성운 동일 버퍼. Skia 언마운트 시 RN opacity 1 복귀
              (inbound backdrop remount 스킵으로 재로딩 깜빡임 최소화).
            */}
            <PlanetNebulaImageBackdrop
              key={`rn-nebula-${planetId}-${hubRnBackdropRemountGen}`}
              size={nebulaBackdropSize}
              nebulaBakedImageSource={nebulaBakedImageSource}
              renderNebulaLayer={mainStageBackdrop.nebulaShaderEnabled}
              backgroundImageSource={mainStageBackdrop.backdropImageSource}
              opacity={hideRnNebulaForSkiaDodge ? 0 : 1}
            />
            {devSkiaMountAllowed && hubDodgeSkiaOverlayMounted ? (
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: nebulaBackdropSize,
                  height: nebulaBackdropSize,
                }}
                pointerEvents="none"
              >
                {hubInboundSkiaDodgeOverlay}
              </View>
            ) : null}
          </>
        ) : (
          <PlanetNebulaImageBackdrop
            key={`rn-nebula-solo-${planetId}-${hubRnBackdropRemountGen}`}
            size={nebulaBackdropSize}
            nebulaBakedImageSource={nebulaBakedImageSource}
            renderNebulaLayer={mainStageBackdrop.nebulaShaderEnabled}
            backgroundImageSource={mainStageBackdrop.backdropImageSource}
          />
        )
        ) : null}
      </View>
      <View style={bgStyles.planetBgStack}>
        <View style={[bgStyles.systemBadge, hubCapitalCombatMute && bgStyles.systemBadgeCombatUnderVeil]}>
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
            {resolvePlanetZoneDisplayLabel(planetId, system.zone, t, clanWarClans)}
          </Text>
          <View
            style={[
              bgStyles.systemNameSlot,
              { minHeight: PLANET_MAIN_BACKGROUND_SYSTEM_NAME_MIN_HEIGHT_PX },
            ]}
          >
            <Text
              style={[bgStyles.systemName, hubCapitalCombatMute && bgStyles.hubCombatGrayText]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {resolveStarSystemDisplayName(system, locale)}
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
              <View style={bgStyles.safeAiClanPlate} accessibilityRole="text" accessibilityLabel={t('hubBg.aiClanBase')}>
                <Ionicons
                  name="shield-checkmark"
                  size={22}
                  color={
                    hubCapitalCombatMute
                      ? PLANET_HUB_CAPITAL_COMBAT_GRAY.clanIcon
                      : safeAiClanTerritoryPlate.clanColor
                  }
                  style={bgStyles.safeAiClanPlateMark}
                  accessibilityLabel={t('hubBg.clanMark')}
                />
                <View style={bgStyles.safeAiClanPlateTextCol}>
                  <Text
                    style={[
                      bgStyles.safeAiClanPlateClan,
                      hubCapitalCombatMute && bgStyles.hubCombatGrayText,
                    ]}
                    numberOfLines={1}
                  >
                    {t('hubBg.owned', { clan: safeAiClanTerritoryPlate.clanName })}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
          {territorySubtitle ? (
            <Text
              style={[
                bgStyles.territorySubtitle,
                hubCapitalCombatMute && bgStyles.hubCombatGrayTerritory,
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
                style={bgStyles.orbitLayerPlanet}
                pointerEvents="box-none"
              >
                <PlanetDot
                  planetId={planetId}
                  size={120}
                  zone={system.zone}
                  coreGauges={planetCoreGauges}
                />
              </View>
              {worldObjects.length > 0 ? (
                <View
                  style={bgStyles.orbitLayerWorldObjects}
                  pointerEvents="box-none"
                >
                  <PlanetWorldObjectOrbitMarks
                    orbitClockMs={orbitClockMs}
                    worldObjects={worldObjects}
                    miningPathActive={Boolean(miningPathActive) && !hubCapitalCombatMute}
                    miningProgressPct={Math.max(0, Math.min(100, Math.round(miningProgressPct ?? 0)))}
                    combatGray={hubCapitalCombatMute}
                  />
                </View>
              ) : null}
              {hubStageSkiaActive && (tableOrbitSlotCount > 0 || arcNpcShipsAtPlanet.length > 0 || arcInboundDronesAtPlanet.length > 0) ? (
                <View
                  style={bgStyles.orbitLayerShips}
                  pointerEvents="none"
                >
                <PlanetTableOrbitMarks
                  orbitClockMs={orbitClockMs}
                  orbitParamsSv={orbitParamsSv}
                  tableSlotCount={tableOrbitSlotCount}
                  npcOrbitCycleMs={npcOrbitCycleMs}
                  captions={orbitCaptionsBySlot ?? []}
                  combatGray={hubCapitalCombatMute}
                />
                  <PlanetHubOrbitSkiaLayer
                    orbitClockMs={orbitClockMs}
                    arcShips={arcNpcShipsAtPlanet}
                    arcCaptionHeads={arcSkiaCaptionHeads}
                    combatGray={hubCapitalCombatMute}
                  />
                  {!showEdenRaidTest && arcInboundDronesAtPlanet.length > 0 ? (
                    <PlanetHubInboundDroneLayer
                      orbitClockMs={orbitClockMs}
                      drones={arcInboundDronesAtPlanet}
                      onSkiaDodgeBackdropLatch={handleInboundDroneSkiaDodgeLatch}
                    />
                  ) : null}
                </View>
              ) : null}
              {hubStageSkiaActive && !showEdenRaidTest ? (
                <View
                  style={bgStyles.orbitLayerPlayer}
                  pointerEvents="none"
                >
                  <PlanetPlayerBlueOrbitMark orbitClockMs={orbitClockMs} npcOrbitCycleMs={npcOrbitCycleMs} />
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </View>
      {hubCapitalCombatMute ? (
        <View style={bgStyles.planetHubCapitalCombatVeil} pointerEvents="none" />
      ) : null}
    </View>
  );
});

function worldObjectGlyph(kind: WorldObject['kind']): string {
  if (kind === 'station') return '▣';
  if (kind === 'anomaly') return '◇';
  return '';
}

const PlanetWorldObjectOrbitMark = memo(function PlanetWorldObjectOrbitMark({
  object,
  orbitClockMs,
  miningPathActive,
  mineable,
  miningProgressPct,
  combatGray,
}: {
  object: WorldObject;
  orbitClockMs: SharedValue<number>;
  miningPathActive: boolean;
  mineable: boolean;
  miningProgressPct: number;
  combatGray?: boolean;
}) {
  const t = useT();
  const orbitRadiusPx = useMemo(() => {
    const radiusScale = object.kind === 'defense_satellite'
      ? clampDefenseSatelliteRadiusScale(object.transform.radiusScale)
      : clampWorldObjectRadiusScale(object.transform.radiusScale);
    return ORBIT_CENTER * radiusScale;
  }, [object.kind, object.transform.radiusScale]);

  const defenseZoneDiameterPx = useMemo(() => {
    if (object.kind !== 'defense_satellite') return 0;
    return resolveDefenseSatelliteCombatStatsForObject(object).defenseZoneDiameterPx;
  }, [object]);

  const defenseZoneRingStyle = useMemo(() => {
    const d = defenseZoneDiameterPx;
    const half = d / 2;
    return {
      width: d,
      height: d,
      borderRadius: half,
      left: WORLD_OBJECT_ANCHOR_PX - half,
      top: WORLD_OBJECT_ANCHOR_PX - half,
    };
  }, [defenseZoneDiameterPx]);

  const animated = useAnimatedStyle(() => {
    'worklet';
    const now = orbitClockMs.value;
    const cycleMs = object.kind === 'defense_satellite'
      ? WORLD_OBJECT_DEFENSE_SATELLITE_ORBIT_CYCLE_MS
      : WORLD_OBJECT_ORBIT_CYCLE_MS;
    const phase = ((now % cycleMs) / cycleMs + object.transform.phaseBias) % 1;
    const angle = phase * Math.PI * 2;
    const x = ORBIT_CENTER + Math.cos(angle) * orbitRadiusPx;
    const y = ORBIT_CENTER + Math.sin(angle) * orbitRadiusPx;
    return {
      opacity: object.kind === 'station' ? 0.95 : 0.88,
      transform: [{ translateX: x - WORLD_OBJECT_ANCHOR_PX }, { translateY: y - WORLD_OBJECT_ANCHOR_PX }],
    };
  }, [object.kind, object.transform.phaseBias, orbitRadiusPx, orbitClockMs]);

  return (
    <Animated.View style={[bgStyles.orbitMarkWrap, bgStyles.worldObjectMarkWrap, animated]}>
      <View style={[bgStyles.orbitMarkLabelCol, bgStyles.worldObjectLabelCol]}>
        {object.kind === 'asteroid' ? (
          <>
            <View
              style={[
                bgStyles.worldObjectAsteroidDot,
                mineable ? null : bgStyles.worldObjectAsteroidDotInactive,
                combatGray ? bgStyles.hubCombatGrayAsteroid : null,
              ]}
            />
            {mineable && !combatGray ? (
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
                  {t('hubBg.mining')}
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
        ) : object.kind === 'wreck' ? (
          <View
            style={[bgStyles.worldObjectWreckMark, combatGray && bgStyles.hubCombatGrayWreck]}
            accessibilityLabel={t('hubBg.wreck')}
          />
        ) : object.kind === 'defense_satellite' ? (
          <View style={bgStyles.worldObjectDefenseSatelliteWrap} accessibilityLabel={t('hubBg.defenseSatellite')}>
            <View
              style={[bgStyles.worldObjectDefenseZoneRing, defenseZoneRingStyle]}
              pointerEvents="none"
              accessibilityLabel={t('hubBg.defenseZone')}
            />
            <View
              style={[
                bgStyles.worldObjectDefenseSatelliteMark,
                combatGray && bgStyles.hubCombatGraySat,
              ]}
            />
          </View>
        ) : (
          <Text
            style={[bgStyles.worldObjectGlyph, combatGray && bgStyles.hubCombatGrayMark]}
          >
            {worldObjectGlyph(object.kind)}
          </Text>
        )}
        <Text
          style={[
            bgStyles.worldObjectCaption,
            bgStyles.worldObjectCaptionOverlay,
            combatGray && bgStyles.hubCombatGrayCaption,
          ]}
          numberOfLines={1}
          ellipsizeMode="clip"
        >
          {t(object.title, object.titleOrdinal != null ? { n: object.titleOrdinal } : undefined)}
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
  combatGray,
}: {
  worldObjects: WorldObject[];
  orbitClockMs: SharedValue<number>;
  miningPathActive: boolean;
  miningProgressPct: number;
  combatGray?: boolean;
}) {
  const renderTargets = useMemo(() => {
    const defenseSats = worldObjects.filter((object) => object.kind === 'defense_satellite');
    const colonizers = worldObjects.filter((object) => isStelliumColonizeWorldObject(object));
    const others = worldObjects.filter(
      (object) => object.kind !== 'defense_satellite' && !isStelliumColonizeWorldObject(object),
    );
    return [...colonizers, ...defenseSats, ...others].slice(0, MAX_WORLD_OBJECT_MARKS);
  }, [worldObjects]);
  const activeMineableAsteroidId = useMemo(
    () => renderTargets.find((object) => object.kind === 'asteroid')?.id ?? null,
    [renderTargets],
  );
  return (
    <>
      {renderTargets.map((object) => (
        isStelliumColonizeWorldObject(object) ? (
          <StelliumColonizeOrbitTrafficMark
            key={object.id}
            object={object}
            orbitClockMs={orbitClockMs}
            combatGray={combatGray}
          />
        ) : (
          <PlanetWorldObjectOrbitMark
            key={object.id}
            object={object}
            orbitClockMs={orbitClockMs}
            miningPathActive={miningPathActive}
            mineable={object.kind === 'asteroid' && object.id === activeMineableAsteroidId}
            miningProgressPct={miningProgressPct}
            combatGray={combatGray}
          />
        )
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
  combatGray,
}: {
  slotIndex: number;
  caption: string;
  orbitClockMs: SharedValue<number>;
  orbitParamsSv: SharedValue<number[]>;
  tableSlotCount: number;
  npcOrbitCycleMs: number;
  combatGray?: boolean;
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
        <Text style={[bgStyles.orbitMarkGray, combatGray && bgStyles.hubCombatGrayMark]}>◇</Text>
        {caption ? (
          <Text
            style={[bgStyles.orbitShipCaption, combatGray && bgStyles.hubCombatGrayCaption]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
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
  combatGray,
}: {
  orbitClockMs: SharedValue<number>;
  orbitParamsSv: SharedValue<number[]>;
  tableSlotCount: number;
  npcOrbitCycleMs: number;
  captions: string[];
  combatGray?: boolean;
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
          combatGray={combatGray}
        />
      ))}
    </>
  );
});

const PlanetPlayerBlueOrbitMark = memo(function PlanetPlayerBlueOrbitMark({
  orbitClockMs,
  npcOrbitCycleMs,
}: {
  orbitClockMs: SharedValue<number>;
  npcOrbitCycleMs: number;
}) {
  const playerNick = usePlayerStore((s) => s.player?.nickname ?? '');
  const playerNickLabel = useMemo(() => {
    const t = String(playerNick ?? '').trim();
    return t.length > 0 ? t : '—';
  }, [playerNick]);
  const animated = useAnimatedStyle(() => {
    'worklet';
    const cycleMs = Math.max(1, npcOrbitCycleMs);
    const t01 =
      (((orbitClockMs.value % cycleMs) + cycleMs) % cycleMs) / cycleMs;
    const ang = -Math.PI / 2 + t01 * Math.PI * 2;
    const r = ORBIT_SCENE_SIZE * 0.43;
    const x = ORBIT_CENTER + Math.cos(ang) * r;
    const y = ORBIT_CENTER + Math.sin(ang) * r;
    return {
      opacity: 0.98,
      transform: [{ translateX: x - 7 }, { translateY: y - 7 }],
    };
  }, [orbitClockMs, npcOrbitCycleMs]);

  return (
    <Animated.View style={[bgStyles.orbitMarkWrap, bgStyles.orbitPlayerMarkWrap, animated]} pointerEvents="none">
      <View style={bgStyles.orbitMarkLabelCol}>
        <Text style={bgStyles.orbitShipCaptionPlayerBlue} numberOfLines={1} ellipsizeMode="clip">
          {playerNickLabel}
        </Text>
        <Text style={bgStyles.orbitMarkPlayerBlue}>◇</Text>
      </View>
    </Animated.View>
  );
});
