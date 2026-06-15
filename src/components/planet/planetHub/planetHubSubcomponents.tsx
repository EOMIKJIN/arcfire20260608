// planet hub subcomponents — extracted from app/(game)/planet.tsx
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, useWindowDimensions, Platform } from 'react-native';
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
import { COLORS, FONTS, SPACING, ZONE_LABELS, ZONE_COLORS } from '../../../utils/theme';
import type { StarSystem, ZoneType } from '../../../types';
import type { PlanetCoreGaugeView } from '../../../store/planetCoreRuntimeStore';
import { planetCoreRuntimeToGaugeView, planetCsvBaselineToRuntime, usePlanetCoreRuntimeStore } from '../../../store/planetCoreRuntimeStore';
import { usePlanetNebulaStore } from '../../../store/planetNebulaStore';
import { usePlayerStore } from '../../../store/playerStore';
import type { ArcNpcTrafficShip } from '../../../store/arcNpcTrafficStore';
import type { ArcInboundDrone } from '../../../store/arcInboundDroneStore';
import { PlanetCorePortraitWithTempAdminOverride } from '../PlanetCorePortraitWithTempAdminOverride';
import { PlanetHubOrbitSkiaLayer } from '../PlanetHubOrbitSkiaLayer';
import { PlanetHubInboundDroneLayer } from '../PlanetHubInboundDroneLayer';
import { hubInboundDroneDodgeHitFxRef } from '../../../arcCore/inboundDrone/hubInboundDroneDodgeBridge';
import { PlanetNebulaImageBackdrop } from '../PlanetNebulaImageBackdrop';
import { SkiaPlanetNebulaShaderBackdrop } from '../SkiaPlanetNebulaShaderBackdrop';
import { resolveMainStageSkiaBackdrop } from '../../../game/mainStageSkiaBackdrop';
import { useCapitalRealtimeCombatSimContext } from '../../../combat';
import { resolvePlanetNebulaBakedSource } from '../../../game/planetNebulaBakedAssets';
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
import { WORLD_OBJECT_DEFENSE_SATELLITE_ORBIT_CYCLE_MS, WORLD_OBJECT_ORBIT_CYCLE_MS, clampDefenseSatelliteRadiusScale, clampWorldObjectRadiusScale } from '../../../worldObjects/planetWorldObjectOrbit';
import {
  INFO_LOG_SCROLL_VIEWPORT_PX,
  INFO_LOG_VIEWPORT_ROWS,
  MAX_WORLD_OBJECT_MARKS,
  MINING_GUIDE_LINE_RUN_PX,
  NPC_ORBIT_CYCLE_MS,
  PLANET_CORE_GAUGE_SPEC,
  PLANET_HUB_CAPITAL_COMBAT_GRAY,
  PLANET_MAIN_COMBAT_LAYER_HEIGHT_SCALE_Y,
  PLANET_MAIN_COMBAT_LAYER_WIDTH_SCALE_X,
  PLANET_MAIN_ORBIT_VISUAL_LIFT_PX,
  splitNearbyInfoLine,
  WORLD_OBJECT_ANCHOR_PX,
} from '../../../game/planetHub/planetHubConstants';
import { planetHubStyles as styles, planetHubBgStyles as bgStyles } from './planetHubStyles';

export const ORBIT_CENTER = ORBIT_SCENE_SIZE / 2;

export type NearbyInfoRow = { keySlot: number; line: string };
/** 행성 주변 NPC 궤도·채굴 앵커 — 화면 중심 기준 */

/** 궤도 박스 수직 중심에서 함선 마커까지(하단+여백+글자 반줄) 거리의 50%만큼 위로 — 행성에 가깝게 */
/** 배경 행성/성운(및 궤도 전함) 블록을 소폭 위로 보정 */

export function NearbyShipInfoPanel({
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
  const [inboundDroneSkiaDodgeLatch, setInboundDroneSkiaDodgeLatch] = useState(false);
  /** 드론 FX 1회 — Skia 교차 페이드 후 RN 언마운트(영구 이중 마운트 방지) */
  const [skiaNebulaSwappedIn, setSkiaNebulaSwappedIn] = useState(false);
  const [skiaNebulaImagesReady, setSkiaNebulaImagesReady] = useState(false);
  const [skiaNebulaCommitted, setSkiaNebulaCommitted] = useState(false);
  /** Canvas 1프레임 선그린 뒤 RN→Skia opacity 전환 */
  const [skiaNebulaRevealed, setSkiaNebulaRevealed] = useState(false);
  const hubDodgeTimeMsRef = useRef(0);
  const noteHubDodgeTimeMs = useCallback((ms: number) => {
    hubDodgeTimeMsRef.current = ms;
  }, []);
  useAnimatedReaction(
    () => orbitClockMs.value,
    (ms) => {
      runOnJS(noteHubDodgeTimeMs)(ms);
    },
    [orbitClockMs, noteHubDodgeTimeMs],
  );
  const handleInboundDroneSkiaDodgeLatch = useCallback((active: boolean) => {
    setInboundDroneSkiaDodgeLatch(active);
    if (active) setSkiaNebulaSwappedIn(true);
  }, []);
  const handleSkiaNebulaImagesReady = useCallback(() => {
    setSkiaNebulaImagesReady(true);
  }, []);
  useEffect(() => {
    setInboundDroneSkiaDodgeLatch(false);
    setSkiaNebulaSwappedIn(false);
    setSkiaNebulaImagesReady(false);
    setSkiaNebulaCommitted(false);
    setSkiaNebulaRevealed(false);
  }, [planetId]);
  useEffect(() => {
    if (!skiaNebulaSwappedIn || !skiaNebulaImagesReady) {
      setSkiaNebulaRevealed(false);
      return undefined;
    }
    const id = requestAnimationFrame(() => {
      setSkiaNebulaRevealed(true);
    });
    return () => cancelAnimationFrame(id);
  }, [skiaNebulaSwappedIn, skiaNebulaImagesReady]);
  useEffect(() => {
    if (!skiaNebulaRevealed || skiaNebulaCommitted) return undefined;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setSkiaNebulaCommitted(true);
      });
    });
    return () => cancelAnimationFrame(id);
  }, [skiaNebulaRevealed, skiaNebulaCommitted]);
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
  /** Skia 표시 — 1프레임 선그린(revealed) 후 RN opacity 0 */
  const skiaNebulaLayerActive = skiaNebulaRevealed;
  const nebulaBakedImageSource = useMemo(
    () => resolvePlanetNebulaBakedSource(planetId),
    [planetId],
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

  const hubInboundSkiaNebulaLayer = (
    <SkiaPlanetNebulaShaderBackdrop
      size={nebulaBackdropSize}
      dodgeFxActive={inboundDroneSkiaDodgeLatch}
      nebulaBakedImageSource={nebulaBakedImageSource}
      renderNebulaShader={mainStageBackdrop.nebulaShaderEnabled}
      backgroundImageSource={mainStageBackdrop.backdropImageSource}
      dodgeHitFxRef={hubInboundDroneDodgeHitFxRef}
      dodgeTimeMsRef={hubDodgeTimeMsRef}
      dodgeOrbitSize={ORBIT_SCENE_SIZE}
      dodgeOrbitVisualScaleX={PLANET_MAIN_COMBAT_LAYER_WIDTH_SCALE_X}
      dodgeOrbitVisualScaleY={PLANET_MAIN_COMBAT_LAYER_HEIGHT_SCALE_Y}
      dodgeOrbitOffsetX={dodgeOrbitOffset.x}
      dodgeOrbitOffsetY={dodgeOrbitOffset.y}
      sessionPlanetId={planetId}
      hideUntilImagesReady={!skiaNebulaImagesReady}
      onNebulaImagesReady={handleSkiaNebulaImagesReady}
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
        {useSkiaCombatNebulaBackdrop ? (
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
            {!skiaNebulaCommitted ? (
              <PlanetNebulaImageBackdrop
                size={nebulaBackdropSize}
                nebulaBakedImageSource={nebulaBakedImageSource}
                renderNebulaLayer={mainStageBackdrop.nebulaShaderEnabled}
                backgroundImageSource={mainStageBackdrop.backdropImageSource}
                opacity={skiaNebulaLayerActive ? 0 : 1}
              />
            ) : null}
            <View
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: nebulaBackdropSize,
                height: nebulaBackdropSize,
                opacity: skiaNebulaLayerActive || skiaNebulaCommitted ? 1 : 0,
              }}
              pointerEvents="none"
            >
              {hubInboundSkiaNebulaLayer}
            </View>
          </>
        ) : (
          <PlanetNebulaImageBackdrop
            size={nebulaBackdropSize}
            nebulaBakedImageSource={nebulaBakedImageSource}
            renderNebulaLayer={mainStageBackdrop.nebulaShaderEnabled}
            backgroundImageSource={mainStageBackdrop.backdropImageSource}
          />
        )}
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
              {tableOrbitSlotCount > 0 || arcNpcShipsAtPlanet.length > 0 || arcInboundDronesAtPlanet.length > 0 ? (
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
}: {
  object: WorldObject;
  orbitClockMs: SharedValue<number>;
  miningPathActive: boolean;
  mineable: boolean;
  miningProgressPct: number;
}) {
  const orbitRadiusPx = useMemo(() => {
    const radiusScale =
      object.kind === 'defense_satellite'
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
    const cycleMs =
      object.kind === 'defense_satellite'
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
        ) : object.kind === 'wreck' ? (
          <View style={bgStyles.worldObjectWreckMark} accessibilityLabel="잔해" />
        ) : object.kind === 'defense_satellite' ? (
          <View style={bgStyles.worldObjectDefenseSatelliteWrap} accessibilityLabel="방위위성">
            <View
              style={[bgStyles.worldObjectDefenseZoneRing, defenseZoneRingStyle]}
              pointerEvents="none"
              accessibilityLabel="방어구"
            />
            <View style={bgStyles.worldObjectDefenseSatelliteMark} />
          </View>
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
