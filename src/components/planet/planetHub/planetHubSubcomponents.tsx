// planet hub subcomponents — extracted from app/(game)/planet.tsx
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, useWindowDimensions, Platform } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Svg, { Line, Polyline } from 'react-native-svg';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS, FONTS, SPACING, ZONE_LABELS, ZONE_COLORS } from '../../../utils/theme';
import type { StarSystem, ZoneType } from '../../../types';
import type { PlanetCoreGaugeView } from '../../../store/planetCoreRuntimeStore';
import { planetCoreRuntimeToGaugeView, planetCsvBaselineToRuntime, usePlanetCoreRuntimeStore } from '../../../store/planetCoreRuntimeStore';
import { usePlanetNebulaStore } from '../../../store/planetNebulaStore';
import { usePlayerStore } from '../../../store/playerStore';
import type { ArcNpcTrafficShip } from '../../../store/arcNpcTrafficStore';
import { PlanetCorePortraitWithTempAdminOverride } from '../PlanetCorePortraitWithTempAdminOverride';
import { PlanetHubOrbitSkiaLayer } from '../PlanetHubOrbitSkiaLayer';
import { SkiaPlanetNebulaShaderBackdrop } from '../SkiaPlanetNebulaShaderBackdrop';
import { resolveMainStageSkiaBackdrop } from '../../../game/mainStageSkiaBackdrop';
import { resolvePlanetNebulaBakedSource } from '../../../game/planetNebulaBakedAssets';
import { registerPlanetSessionResource } from '../../../game/planetSessionRegistry';
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
import type { DefenseInterceptVisualPlan } from '../../../arcCore/message/defenseInterceptVisualPlan';
import { DEFENSE_INTERCEPT_EXPLOSION_MS } from '../../../arcCore/message/defenseInterceptVisualPlan';
import { parseWorldObjectId } from '../../../worldObjects/ids';
import { useArcCoreMessageStore } from '../../../store/arcCoreMessageStore';
import type { WorldObject } from '../../../worldObjects';
import { WORLD_OBJECT_DEFENSE_SATELLITE_ORBIT_CYCLE_MS, WORLD_OBJECT_ORBIT_CYCLE_MS, clampDefenseSatelliteRadiusScale, clampWorldObjectRadiusScale } from '../../../worldObjects/planetWorldObjectOrbit';
import { PlanetArcCoreMessageMissileSkiaLayer } from '../PlanetArcCoreMessageMissileSkiaLayer';
import { PlanetDefenseInterceptMissileSkiaLayer } from '../PlanetDefenseInterceptMissileSkiaLayer';
import {
  DEFENSE_SATELLITE_INTERCEPT_READY_BLINK_HZ,
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
  DEFENSE_SATELLITE_INTERCEPT_READY_STROKE,
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
  arcCoreMissileActive,
  arcCoreMissileStartMs,
  arcCoreMissileTravelMs,
  arcCoreInterceptVisualPlan,
  arcCoreInterceptSucceeded,
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
  worldObjects: WorldObject[];
  showEdenRaidTest: boolean;
  /** 채굴 활성 중에는 Skia 궤도 대신 정적 마커로 안전 모드 렌더 */
  miningPathActive?: boolean;
  miningProgressPct?: number;
  arcCoreMissileActive?: boolean;
  arcCoreMissileStartMs?: number;
  arcCoreMissileTravelMs?: number;
  arcCoreInterceptVisualPlan?: DefenseInterceptVisualPlan | null;
  arcCoreInterceptSucceeded?: boolean;
  combatSimRef: React.MutableRefObject<CapitalRealtimeCombatSim | null>;
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
  const edenSim = combatSimRef.current;
  const interceptInboundStartMs = arcCoreMissileStartMs ?? 0;
  const interceptLaunchAtBySatelliteId = useMemo(() => {
    const map = new Map<string, number>();
    if (
      !arcCoreMissileActive
      || !arcCoreInterceptVisualPlan
      || !interceptInboundStartMs
      || !arcCoreInterceptVisualPlan.engagementEligible
    ) {
      return map;
    }
    for (const slot of arcCoreInterceptVisualPlan.missiles) {
      map.set(slot.satelliteId, interceptInboundStartMs + slot.launchDelayMs);
    }
    return map;
  }, [
    arcCoreMissileActive,
    interceptInboundStartMs,
    arcCoreInterceptVisualPlan?.strikeId,
    arcCoreInterceptVisualPlan?.engagementEligible,
    arcCoreInterceptVisualPlan?.missiles,
  ]);
  const tryCompleteNearMiss = useArcCoreMessageStore((s) => s.tryCompleteNearMiss);
  const [interceptHitRelativeMs, setInterceptHitRelativeMs] = useState<number | null>(null);
  const strikeVisualGateRef = useRef({ inbound: false, intercept: false });
  const interceptEngagementEligible = Boolean(
    arcCoreInterceptVisualPlan?.engagementEligible
    && (arcCoreInterceptVisualPlan?.missiles.length ?? 0) > 0,
  );
  useEffect(() => {
    setInterceptHitRelativeMs(null);
    strikeVisualGateRef.current = {
      inbound: false,
      intercept: !interceptEngagementEligible,
    };
  }, [arcCoreInterceptVisualPlan?.strikeId, interceptEngagementEligible]);
  const tryFinishArcCoreStrike = useCallback(() => {
    const gate = strikeVisualGateRef.current;
    if (!gate.inbound || !gate.intercept) return;
    tryCompleteNearMiss(planetId, Date.now(), { visualReady: true });
  }, [planetId, tryCompleteNearMiss]);
  const handleInterceptVisualHit = useCallback((relativeMs: number) => {
    setInterceptHitRelativeMs(relativeMs);
  }, []);
  const handleInterceptAllMissilesComplete = useCallback(() => {
    strikeVisualGateRef.current.intercept = true;
    tryFinishArcCoreStrike();
  }, [tryFinishArcCoreStrike]);
  const handleArcCoreMissileFlightComplete = useCallback(() => {
    strikeVisualGateRef.current.inbound = true;
    tryFinishArcCoreStrike();
  }, [tryFinishArcCoreStrike]);
  const arcCoreSuppressWarheadAfterMs = useMemo(() => {
    if (interceptHitRelativeMs == null || !(arcCoreMissileStartMs ?? 0)) return 0;
    return (arcCoreMissileStartMs ?? 0) + interceptHitRelativeMs;
  }, [
    arcCoreMissileStartMs,
    interceptHitRelativeMs,
  ]);
  const showArcCoreMissileLayers = Boolean(arcCoreMissileActive);
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
          /** 성운 베이크 PNG: 포커스 + lifecycle active 일 때만 명중 FX 루프. */
          active={skiaLoopsActive}
          sessionPlanetId={planetId}
          nebulaBakedImageSource={nebulaBakedImageSource}
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
                    interceptLaunchAtBySatelliteId={interceptLaunchAtBySatelliteId}
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
              {showArcCoreMissileLayers ? (
                <>
                  <PlanetDefenseInterceptMissileSkiaLayer
                    orbitSize={ORBIT_SCENE_SIZE}
                    planetId={planetId}
                    active
                    inboundStartMs={interceptInboundStartMs}
                    travelMs={arcCoreMissileTravelMs ?? 0}
                    plan={arcCoreInterceptVisualPlan ?? null}
                    onInterceptVisualHit={handleInterceptVisualHit}
                    onAllMissilesComplete={handleInterceptAllMissilesComplete}
                  />
                  <PlanetArcCoreMessageMissileSkiaLayer
                    orbitSize={ORBIT_SCENE_SIZE}
                    active
                    missileStartMs={arcCoreMissileStartMs ?? 0}
                    travelMs={arcCoreMissileTravelMs ?? 0}
                    onFlightComplete={handleArcCoreMissileFlightComplete}
                    suppressWarheadAfterMs={arcCoreSuppressWarheadAfterMs}
                    interceptSucceeded={arcCoreInterceptSucceeded ?? false}
                    interceptAtRelativeMs={interceptHitRelativeMs ?? 0}
                  />
                </>
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
  interceptLaunchAtWallMs,
  defenseSatelliteOrbitFreezeMs = -1,
}: {
  object: WorldObject;
  orbitClockMs: SharedValue<number>;
  miningPathActive: boolean;
  mineable: boolean;
  miningProgressPct: number;
  /** 0=비활성, >0=이 시각까지 요격 준비 깜박임 */
  interceptLaunchAtWallMs: number;
  /** >=0 — 방위위성만 이 시계(ms)에 고정 */
  defenseSatelliteOrbitFreezeMs?: number;
}) {
  const defenseOrbitFreezeSv = useSharedValue(defenseSatelliteOrbitFreezeMs);
  useEffect(() => {
    defenseOrbitFreezeSv.value = defenseSatelliteOrbitFreezeMs;
  }, [defenseSatelliteOrbitFreezeMs, defenseOrbitFreezeSv]);
  const interceptLaunchAtSv = useSharedValue(interceptLaunchAtWallMs);
  useEffect(() => {
    interceptLaunchAtSv.value = interceptLaunchAtWallMs;
  }, [interceptLaunchAtWallMs, interceptLaunchAtSv]);

  const interceptReadyOutlineStyle = useAnimatedStyle(() => {
    'worklet';
    void orbitClockMs.value;
    const launchAt = interceptLaunchAtSv.value;
    if (launchAt <= 0) return { opacity: 0 };
    const now = Date.now();
    if (now >= launchAt) return { opacity: 0 };
    const phase = now * 0.001 * DEFENSE_SATELLITE_INTERCEPT_READY_BLINK_HZ * Math.PI * 2;
    return { opacity: 0.32 + 0.68 * (0.5 + 0.5 * Math.sin(phase)) };
  }, [orbitClockMs, interceptLaunchAtSv]);

  const orbitRadiusPx = useMemo(() => {
    const radiusScale =
      object.kind === 'defense_satellite'
        ? clampDefenseSatelliteRadiusScale(object.transform.radiusScale)
        : clampWorldObjectRadiusScale(object.transform.radiusScale);
    return ORBIT_CENTER * radiusScale;
  }, [object.kind, object.transform.radiusScale]);

  const animated = useAnimatedStyle(() => {
    'worklet';
    const freezeMs = defenseOrbitFreezeSv.value;
    const now = object.kind === 'defense_satellite' && freezeMs >= 0
      ? freezeMs
      : orbitClockMs.value;
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
  }, [object.kind, object.transform.phaseBias, orbitRadiusPx, orbitClockMs, defenseOrbitFreezeSv]);

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
            <Animated.View
              style={[bgStyles.worldObjectDefenseSatelliteReadyOutline, interceptReadyOutlineStyle]}
              pointerEvents="none"
            >
              <Svg width={16} height={14} viewBox="0 0 16 14">
                <Polyline
                  points="8,1.5 14.5,12.5 1.5,12.5 8,1.5"
                  fill="none"
                  stroke={DEFENSE_SATELLITE_INTERCEPT_READY_STROKE}
                  strokeWidth={2.2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </Svg>
            </Animated.View>
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
  interceptLaunchAtBySatelliteId,
  defenseSatelliteOrbitFreezeById,
}: {
  worldObjects: WorldObject[];
  orbitClockMs: SharedValue<number>;
  miningPathActive: boolean;
  miningProgressPct: number;
  interceptLaunchAtBySatelliteId: ReadonlyMap<string, number>;
  defenseSatelliteOrbitFreezeById?: ReadonlyMap<string, number>;
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
          interceptLaunchAtWallMs={
            object.kind === 'defense_satellite'
              ? (interceptLaunchAtBySatelliteId.get(object.id) ?? 0)
              : 0
          }
          defenseSatelliteOrbitFreezeMs={
            object.kind === 'defense_satellite'
              ? (defenseSatelliteOrbitFreezeById?.get(object.id) ?? -1)
              : -1
          }
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
