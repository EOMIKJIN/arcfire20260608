import React, { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  runOnJS,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import {
  BlurMask,
  Canvas,
  Circle,
  Group,
  LinearGradient,
  Paint,
  Path,
  RadialGradient,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import type { SharedValue } from 'react-native-reanimated';
import { PLANET_MAIN_ORBIT_SCENE_SIZE } from '../../stages/planetMainStageLayout';
import { ARC_CORE_MESSAGE_MISSILE_TRAIL_FADE_MS } from '../../arcCore/message/arcCoreMessagePolicy';
import {
  buildArcCoreMessageMissileBezier,
  resolveArcCoreMessageClosestApproach,
  resolveArcCoreMessageMissileCanvasPadPx,
  resolveArcCoreMessageMissileViewportURange,
  resolveArcCoreMeteorHeadRadiiPx,
} from '../../arcCore/message/arcCoreMessageMissileGeometry';
import {
  packDefenseInterceptDodgeFlash,
} from '../../arcCore/message/defenseInterceptMissileWorklets';
import { DEFENSE_INTERCEPT_EXPLOSION_MS } from '../../arcCore/message/defenseInterceptVisualPlan';
import {
  ARC_CORE_MISSILE_TRAIL_GRADIENT_COLORS,
  ARC_CORE_MISSILE_TRAIL_GRADIENT_POSITIONS,
  ARC_CORE_MISSILE_WARHEAD_GRADIENT_COLORS,
  ARC_CORE_MISSILE_WARHEAD_GRADIENT_POSITIONS,
  arcCoreMessageBezierPointFlat,
  arcCoreMessageBezierTangentFlat,
  arcCoreMessageDodgeBlinkPulse,
  arcCoreMessageScrapeIntensity,
  buildArcCoreMessageTrailPathSkia,
  packArcCoreMessageBezierFlat,
  ARC_CORE_MSG_VIS_IDX as VIS,
  packArcCoreMessageMissileVisualSnapshot,
} from '../../arcCore/message/arcCoreMessageMissileWorklets';

const DODGE_BLINK_HZ = 8;
const DODGE_HEAD_SIZE_RATIO = 0.13;
const WARHEAD_PASS_RING_BASE_R_MUL = 2.35;
const WARHEAD_PASS_RING_OUTER_R_MUL = 3.15;

/** 탄두 상시 닷지 — 비행 내내 깜박이는 글로우(탄두 좌표 원점) */
function ArcCoreMessageHeadDodgeGlow({
  boxSize,
  opacity,
}: {
  boxSize: number;
  opacity: SharedValue<number>;
}) {
  const outerR = boxSize * 0.46;
  const midR = boxSize * 0.28;
  const coreR = boxSize * 0.1;
  return (
    <Group layer={<Paint blendMode="plus" opacity={opacity} />}>
      <Circle cx={0} cy={0} r={outerR} color="rgba(255, 186, 96, 0.42)">
        <BlurMask blur={outerR * 0.72} style="normal" />
      </Circle>
      <Circle cx={0} cy={0} r={midR} color="rgba(255, 232, 180, 0.5)">
        <BlurMask blur={midR * 0.55} style="normal" />
      </Circle>
      <Circle cx={0} cy={0} r={coreR} color="rgba(255, 255, 248, 0.82)">
        <BlurMask blur={coreR * 0.35} style="normal" />
      </Circle>
    </Group>
  );
}

/** 중앙 스침 구간 — 탄두에 붙는 빛번짐 + 동심원 링 */
function ArcCoreMessageWarheadPassFx({
  headMajor,
  glowOpacity,
  ringOpacity,
  ringScale,
}: {
  headMajor: number;
  glowOpacity: SharedValue<number>;
  ringOpacity: SharedValue<number>;
  ringScale: SharedValue<number>;
}) {
  const ringMatrix = useDerivedValue(() => {
    'worklet';
    const s = ringScale.value;
    const m = Skia.Matrix();
    m.scale(s, s);
    return m;
  });
  const innerR = headMajor * WARHEAD_PASS_RING_BASE_R_MUL;
  const outerR = headMajor * WARHEAD_PASS_RING_OUTER_R_MUL;
  return (
    <>
      <Group layer={<Paint blendMode="plus" opacity={glowOpacity} />}>
        <Circle cx={0} cy={0} r={headMajor * 3.1} color="rgba(255, 148, 72, 0.48)">
          <BlurMask blur={headMajor * 1.75} style="normal" />
        </Circle>
        <Circle cx={0} cy={0} r={headMajor * 1.85} color="rgba(255, 218, 150, 0.58)">
          <BlurMask blur={headMajor * 0.95} style="normal" />
        </Circle>
        <Circle cx={0} cy={0} r={headMajor * 0.95} color="rgba(255, 248, 230, 0.72)">
          <BlurMask blur={headMajor * 0.42} style="normal" />
        </Circle>
      </Group>
      <Group matrix={ringMatrix} opacity={ringOpacity}>
        <Circle
          cx={0}
          cy={0}
          r={innerR}
          style="stroke"
          strokeWidth={Math.max(1, headMajor * 0.22)}
          color="rgba(255, 205, 118, 0.92)"
        />
        <Circle
          cx={0}
          cy={0}
          r={outerR}
          style="stroke"
          strokeWidth={Math.max(0.8, headMajor * 0.14)}
          color="rgba(255, 128, 64, 0.52)"
        />
      </Group>
    </>
  );
}

type Props = {
  orbitSize?: number;
  active: boolean;
  missileStartMs: number;
  travelMs: number;
  loopsActive: boolean;
  onFlightComplete?: () => void;
  /** 요격 명중 시 탄두 숨김(절대 시각 ms) */
  suppressWarheadAfterMs?: number;
  /** 요격 연출 — 닷지 플래시 */
  interceptSucceeded?: boolean;
  interceptAtRelativeMs?: number;
};

export const PlanetArcCoreMessageMissileSkiaLayer = memo(function PlanetArcCoreMessageMissileSkiaLayer({
  orbitSize = PLANET_MAIN_ORBIT_SCENE_SIZE,
  active,
  missileStartMs,
  travelMs,
  loopsActive,
  onFlightComplete,
  suppressWarheadAfterMs = 0,
  interceptSucceeded = false,
  interceptAtRelativeMs = 0,
}: Props) {
  const startMsSv = useSharedValue(0);
  const travelMsSv = useSharedValue(1);
  const activeSv = useSharedValue(0);
  const clockMs = useSharedValue(0);
  const uClosestSv = useSharedValue(0.5);
  const uEnterSv = useSharedValue(0);
  const uExitSv = useSharedValue(1);
  const bezierFlat = useSharedValue<number[]>([0, 0, 0, 0, 0, 0]);
  const flightCompleteFiredRef = useRef(false);

  const planetCenter = useMemo(() => ({ x: orbitSize / 2, y: orbitSize / 2 }), [orbitSize]);
  const headRadii = useMemo(() => resolveArcCoreMeteorHeadRadiiPx(orbitSize), [orbitSize]);
  const viewportURange = useMemo(
    () => resolveArcCoreMessageMissileViewportURange(orbitSize, headRadii.major * 0.6),
    [orbitSize, headRadii.major],
  );
  const canvasPad = useMemo(() => resolveArcCoreMessageMissileCanvasPadPx(orbitSize), [orbitSize]);
  const canvasSize = orbitSize + canvasPad * 2;
  const headDodgeSize = orbitSize * DODGE_HEAD_SIZE_RATIO;

  const closestApproach = useMemo(() => {
    const bezier = buildArcCoreMessageMissileBezier(orbitSize);
    return resolveArcCoreMessageClosestApproach(bezier, planetCenter);
  }, [orbitSize, planetCenter]);

  const fireFlightComplete = useCallback(() => {
    if (flightCompleteFiredRef.current) return;
    flightCompleteFiredRef.current = true;
    onFlightComplete?.();
  }, [onFlightComplete]);

  useLayoutEffect(() => {
    flightCompleteFiredRef.current = false;
    const bezier = buildArcCoreMessageMissileBezier(orbitSize);
    bezierFlat.value = packArcCoreMessageBezierFlat(bezier);
    uClosestSv.value = closestApproach.u;
    uEnterSv.value = viewportURange.uEnter;
    uExitSv.value = viewportURange.uExit;
    if (active && loopsActive && missileStartMs > 0 && travelMs > 0) {
      startMsSv.value = missileStartMs;
      travelMsSv.value = travelMs;
      activeSv.value = 1;
      clockMs.value = Date.now();
    } else {
      activeSv.value = 0;
    }
  }, [
    active,
    loopsActive,
    missileStartMs,
    travelMs,
    orbitSize,
    closestApproach.u,
    viewportURange.uEnter,
    viewportURange.uExit,
  ]);

  const flightFrame = useFrameCallback(() => {
    'worklet';
    if (!activeSv.value) return;
    clockMs.value = Date.now();
    const tSince = clockMs.value - startMsSv.value;
    const travel = Math.max(1, travelMsSv.value);
    const lifeEnd = travel + ARC_CORE_MESSAGE_MISSILE_TRAIL_FADE_MS;
    if (tSince >= lifeEnd) {
      activeSv.value = 0;
      runOnJS(fireFlightComplete)();
    }
  }, false);

  useEffect(() => {
    const on = active && loopsActive && missileStartMs > 0 && travelMs > 0;
    flightFrame.setActive(on);
    return () => flightFrame.setActive(false);
  }, [active, loopsActive, missileStartMs, travelMs, flightFrame]);

  const visPack = useDerivedValue(() => {
    'worklet';
    return packArcCoreMessageMissileVisualSnapshot(
      activeSv.value,
      clockMs.value,
      startMsSv.value,
      travelMsSv.value,
      ARC_CORE_MESSAGE_MISSILE_TRAIL_FADE_MS,
      uEnterSv.value,
      uExitSv.value,
    );
  });

  const trailPath = useDerivedValue(() => {
    'worklet';
    const path = Skia.Path.Make();
    const v = visPack.value;
    if (v[VIS.alive] < 0.5) return path;
    buildArcCoreMessageTrailPathSkia(path, bezierFlat.value, v[VIS.uTail], v[VIS.uHead]);
    return path;
  });

  const trailOpacity = useDerivedValue(() => {
    'worklet';
    const v = visPack.value;
    if (v[VIS.alive] < 0.5) return 0;
    return 0.85 * v[VIS.lifeOpacity];
  });

  const trailGradientStart = useDerivedValue(() => {
    'worklet';
    const v = visPack.value;
    if (v[VIS.alive] < 0.5) return vec(0, 0);
    const p = arcCoreMessageBezierPointFlat(bezierFlat.value, v[VIS.uTail]);
    return vec(p.x, p.y);
  });

  const trailGradientEnd = useDerivedValue(() => {
    'worklet';
    const v = visPack.value;
    if (v[VIS.alive] < 0.5) return vec(0, 0);
    const p = arcCoreMessageBezierPointFlat(bezierFlat.value, v[VIS.uHead]);
    return vec(p.x, p.y);
  });

  const warheadOpacity = useDerivedValue(() => {
    'worklet';
    const v = visPack.value;
    if (v[VIS.alive] < 0.5 || v[VIS.warheadShown] < 0.5) return 0;
    if (suppressWarheadAfterMs > 0 && clockMs.value >= suppressWarheadAfterMs) return 0;
    return v[VIS.lifeOpacity];
  });

  const warheadPositionMatrix = useDerivedValue(() => {
    'worklet';
    const v = visPack.value;
    if (v[VIS.alive] < 0.5 || v[VIS.warheadShown] < 0.5) return Skia.Matrix();
    const p = arcCoreMessageBezierPointFlat(bezierFlat.value, v[VIS.warheadU]);
    const rad = arcCoreMessageBezierTangentFlat(bezierFlat.value, v[VIS.warheadU]);
    const m = Skia.Matrix();
    m.translate(p.x, p.y);
    m.rotate(rad);
    return m;
  });

  const warheadBodyMatrix = useDerivedValue(() => {
    'worklet';
    const aspect = headRadii.minor / Math.max(1e-6, headRadii.major);
    const m = Skia.Matrix();
    m.scale(1, aspect);
    return m;
  }, [headRadii.major, headRadii.minor]);

  const warheadPassGlowOpacity = useDerivedValue(() => {
    'worklet';
    const v = visPack.value;
    if (v[VIS.alive] < 0.5 || v[VIS.inFlight] < 0.5) return 0;
    const scrape = arcCoreMessageScrapeIntensity(v[VIS.warheadU], uClosestSv.value);
    if (scrape < 0.1) return 0;
    const blink = arcCoreMessageDodgeBlinkPulse(clockMs.value, DODGE_BLINK_HZ);
    return scrape * blink * 0.98 * v[VIS.lifeOpacity];
  });

  const warheadPassRingOpacity = useDerivedValue(() => {
    'worklet';
    const v = visPack.value;
    if (v[VIS.alive] < 0.5 || v[VIS.inFlight] < 0.5) return 0;
    const scrape = arcCoreMessageScrapeIntensity(v[VIS.warheadU], uClosestSv.value);
    if (scrape < 0.12) return 0;
    const blink = arcCoreMessageDodgeBlinkPulse(clockMs.value, DODGE_BLINK_HZ + 1);
    return scrape * (0.42 + blink * 0.58) * 0.92 * v[VIS.lifeOpacity];
  });

  const warheadPassRingScale = useDerivedValue(() => {
    'worklet';
    const v = visPack.value;
    if (v[VIS.alive] < 0.5 || v[VIS.inFlight] < 0.5) return 0;
    const scrape = arcCoreMessageScrapeIntensity(v[VIS.warheadU], uClosestSv.value);
    if (scrape < 0.12) return 0;
    const blink = arcCoreMessageDodgeBlinkPulse(clockMs.value, DODGE_BLINK_HZ);
    return 0.82 + scrape * 0.48 + blink * 0.22;
  });

  const headDodgeOpacity = useDerivedValue(() => {
    'worklet';
    const v = visPack.value;
    if (v[VIS.alive] < 0.5 || v[VIS.warheadShown] < 0.5) return 0;
    if (suppressWarheadAfterMs > 0 && clockMs.value >= suppressWarheadAfterMs) return 0;
    const scrape = arcCoreMessageScrapeIntensity(v[VIS.warheadU], uClosestSv.value);
    const blink = arcCoreMessageDodgeBlinkPulse(clockMs.value, DODGE_BLINK_HZ + 2);
    const interceptFlash = packDefenseInterceptDodgeFlash(
      clockMs.value,
      startMsSv.value,
      interceptAtRelativeMs,
      interceptSucceeded,
      DEFENSE_INTERCEPT_EXPLOSION_MS,
    );
    const base = 0.38 + scrape * 0.5 + interceptFlash * 0.85;
    return base * blink * 0.85 * v[VIS.lifeOpacity];
  });

  if (!active || !loopsActive || missileStartMs <= 0) {
    return null;
  }

  return (
    <View
      style={[
        styles.root,
        {
          left: -canvasPad,
          top: -canvasPad,
          width: canvasSize,
          height: canvasSize,
        },
      ]}
      pointerEvents="none"
    >
      <Canvas style={{ width: canvasSize, height: canvasSize }}>
        <Path
          path={trailPath}
          style="stroke"
          strokeWidth={Math.max(1, headRadii.major * 0.55)}
          strokeJoin="round"
          strokeCap="round"
          opacity={trailOpacity}
        >
          <LinearGradient
            start={trailGradientStart}
            end={trailGradientEnd}
            colors={[...ARC_CORE_MISSILE_TRAIL_GRADIENT_COLORS]}
            positions={[...ARC_CORE_MISSILE_TRAIL_GRADIENT_POSITIONS]}
          />
        </Path>
        <Group matrix={warheadPositionMatrix} opacity={warheadOpacity}>
          <ArcCoreMessageWarheadPassFx
            headMajor={headRadii.major}
            glowOpacity={warheadPassGlowOpacity}
            ringOpacity={warheadPassRingOpacity}
            ringScale={warheadPassRingScale}
          />
          <Group matrix={warheadBodyMatrix}>
            <Circle cx={0} cy={0} r={headRadii.major}>
              <RadialGradient
                c={vec(0, 0)}
                r={headRadii.major * 1.15}
                colors={[...ARC_CORE_MISSILE_WARHEAD_GRADIENT_COLORS]}
                positions={[...ARC_CORE_MISSILE_WARHEAD_GRADIENT_POSITIONS]}
              />
            </Circle>
          </Group>
          <ArcCoreMessageHeadDodgeGlow boxSize={headDodgeSize} opacity={headDodgeOpacity} />
        </Group>
      </Canvas>
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    zIndex: 6,
    overflow: 'visible',
  },
});
