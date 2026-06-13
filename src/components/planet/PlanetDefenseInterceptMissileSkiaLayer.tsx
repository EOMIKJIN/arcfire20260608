import React, { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  makeMutable,
  runOnJS,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import {
  BlurMask,
  Canvas,
  Circle,
  Group,
  LinearGradient,
  Paint,
  Path,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import type { SkPath } from '@shopify/react-native-skia';
import {
  buildArcCoreMessageMissileBezier,
} from '../../arcCore/message/arcCoreMessageMissileGeometry';
import { packArcCoreMessageBezierFlat } from '../../arcCore/message/arcCoreMessageMissileWorklets';
import {
  areDefenseInterceptGuidedMissilesAlive,
  resolveDefenseInterceptMissileLifeEndMs,
  tickDefenseInterceptGuidedMissiles,
  type DefenseInterceptGuidedMissile,
} from '../../arcCore/message/defenseInterceptGuidedMissile';
import {
  appendDefenseInterceptTrailPoint,
  resolveDefenseInterceptMissileHeadingRad,
  resolveInterceptHeadAtMs,
} from '../../arcCore/message/defenseInterceptCollision';
import { createDefenseInterceptGuidedMissiles } from '../../arcCore/message/defenseInterceptSpawn';
import {
  buildDefenseInterceptTrailPathFromFlat,
  INTERCEPT_MISSILE_FLAT_LEN,
  INTERCEPT_MISSILE_IDX,
  INTERCEPT_TRAIL_GRADIENT_COLORS,
  INTERCEPT_TRAIL_GRADIENT_POSITIONS,
  INTERCEPT_VIS_IDX as VIS,
  packDefenseInterceptMissileFlat,
  packDefenseInterceptMissileVisualPack,
  readDefenseInterceptSimMotionWorklet,
  syncDefenseInterceptMissileFlatFromSim,
  unwrapInterceptTangentWorklet,
} from '../../arcCore/message/defenseInterceptMissileWorklets';
import {
  DEFENSE_INTERCEPT_EXPLOSION_MS,
  type DefenseInterceptVisualPlan,
} from '../../arcCore/message/defenseInterceptVisualPlan';
import { PLANET_MAIN_ORBIT_SCENE_SIZE } from '../../stages/planetMainStageLayout';
import { registerPlanetSessionResource } from '../../game/planetSessionRegistry';
import { useArcCoreMessageStore } from '../../store/arcCoreMessageStore';

const MAX_INTERCEPT_SLOTS = 5;
const INTERCEPT_TRAIL_W = 0.85;
const INTERCEPT_HEAD_RX = 2.2;
const INTERCEPT_HEAD_RY = 1.3;
const INTERCEPT_TRAIL_GLOW = 'rgba(255, 255, 255, 0.38)';
const INTERCEPT_HEAD_FILL = 'rgba(255, 255, 255, 0.97)';
const INTERCEPT_HEAD_CORE = 'rgba(255, 255, 255, 0.95)';
const INTERCEPT_PLUS_BLEND_PAINT = <Paint blendMode="plus" />;

function writeInterceptHeadOvalWorklet(
  path: SkPath,
  cx: number,
  cy: number,
  tangentRad: number,
  rxAlong: number,
  ryPerp: number,
): void {
  'worklet';
  path.reset();
  const tc = Math.cos(tangentRad);
  const ts = Math.sin(tangentRad);
  const seg = 14;
  for (let i = 0; i <= seg; i += 1) {
    const phi = (i / seg) * Math.PI * 2;
    const lx = rxAlong * Math.cos(phi);
    const ly = ryPerp * Math.sin(phi);
    const wx = cx + lx * tc - ly * ts;
    const wy = cy + lx * ts + ly * tc;
    if (i === 0) path.moveTo(wx, wy);
    else path.lineTo(wx, wy);
  }
  path.close();
}

type InterceptMissileDrawProps = {
  clockMs: SharedValue<number>;
  missileFlat: SharedValue<number[]>;
  inboundStartMsSv: SharedValue<number>;
  inboundTravelMsSv: SharedValue<number>;
  inboundBezierFlatSv: SharedValue<number[]>;
  canvasPad: number;
  initialTangentRad: number;
};

const InterceptMissileDraw = memo(function InterceptMissileDraw({
  clockMs,
  missileFlat,
  inboundStartMsSv,
  inboundTravelMsSv,
  inboundBezierFlatSv,
  canvasPad,
  initialTangentRad,
}: InterceptMissileDrawProps) {
  const prevTangentSv = useSharedValue(initialTangentRad);

  const visPack = useDerivedValue(() => {
    'worklet';
    return packDefenseInterceptMissileVisualPack(
      clockMs.value,
      missileFlat.value,
      inboundStartMsSv.value,
      inboundTravelMsSv.value,
      inboundBezierFlatSv.value,
    );
  });

  const trailPath = useDerivedValue(() => {
    'worklet';
    const path = Skia.Path.Make();
    const v = visPack.value;
    if (v[VIS.visible] < 0.5 || v[VIS.trailAlive] < 0.5) return path;
    buildDefenseInterceptTrailPathFromFlat(
      path,
      missileFlat.value,
      canvasPad,
      clockMs.value,
      v[VIS.dissolveT] ?? 0,
    );
    return path;
  });

  const trailGradientStart = useDerivedValue(() => {
    'worklet';
    const v = visPack.value;
    const dissolveT = v[VIS.dissolveT] ?? 0;
    const motion = readDefenseInterceptSimMotionWorklet(missileFlat.value, clockMs.value);
    const headX = motion[0] ?? 0;
    const headY = motion[1] ?? 0;
    const pairCount = Math.floor(motion[3] ?? 0);
    if (pairCount >= 2) {
      const keepPairs = Math.max(2, Math.ceil(pairCount * (1 - dissolveT * 0.94)));
      const startPair = Math.max(0, pairCount - keepPairs);
      const idx = 4 + startPair * 2;
      return vec((motion[idx] ?? headX) + canvasPad, (motion[idx + 1] ?? headY) + canvasPad);
    }
    if (pairCount === 1) {
      return vec((motion[4] ?? headX) + canvasPad, (motion[5] ?? headY) + canvasPad);
    }
    return vec(headX + canvasPad, headY + canvasPad);
  });

  const trailGradientEnd = useDerivedValue(() => {
    'worklet';
    const v = visPack.value;
    return vec(v[VIS.headX] + canvasPad, v[VIS.headY] + canvasPad);
  });

  const headPath = useDerivedValue(() => {
    'worklet';
    const path = Skia.Path.Make();
    const v = visPack.value;
    if (v[VIS.visible] < 0.5 || v[VIS.headOpacity] < 0.02) return path;
    const stableTan = unwrapInterceptTangentWorklet(prevTangentSv.value, v[VIS.tangentRad]);
    prevTangentSv.value = stableTan;
    writeInterceptHeadOvalWorklet(
      path,
      v[VIS.headX] + canvasPad,
      v[VIS.headY] + canvasPad,
      stableTan,
      INTERCEPT_HEAD_RX,
      INTERCEPT_HEAD_RY,
    );
    return path;
  });

  const headOpacity = useDerivedValue(() => {
    'worklet';
    return visPack.value[VIS.headOpacity];
  });
  const trailOpacity = useDerivedValue(() => {
    'worklet';
    return visPack.value[VIS.trailOpacity];
  });
  const explosionOpacity = useDerivedValue(() => {
    'worklet';
    return visPack.value[VIS.explosionOpacity];
  });
  const explosionCx = useDerivedValue(() => {
    'worklet';
    const flat = missileFlat.value;
    const v = visPack.value;
    const impactAtMs = flat[INTERCEPT_MISSILE_IDX.impactAtMs] ?? 0;
    if (impactAtMs > 0) return (flat[INTERCEPT_MISSILE_IDX.hitX] ?? v[VIS.headX]) + canvasPad;
    return v[VIS.headX] + canvasPad;
  });
  const explosionCy = useDerivedValue(() => {
    'worklet';
    const flat = missileFlat.value;
    const v = visPack.value;
    const impactAtMs = flat[INTERCEPT_MISSILE_IDX.impactAtMs] ?? 0;
    if (impactAtMs > 0) return (flat[INTERCEPT_MISSILE_IDX.hitY] ?? v[VIS.headY]) + canvasPad;
    return v[VIS.headY] + canvasPad;
  });

  return (
    <>
      <Group opacity={trailOpacity}>
        <Path
          path={trailPath}
          style="stroke"
          strokeWidth={INTERCEPT_TRAIL_W * 1.25}
          strokeCap="round"
          color={INTERCEPT_TRAIL_GLOW}
          opacity={0.55}
        >
          <LinearGradient
            start={trailGradientStart}
            end={trailGradientEnd}
            colors={[...INTERCEPT_TRAIL_GRADIENT_COLORS]}
            positions={[...INTERCEPT_TRAIL_GRADIENT_POSITIONS]}
          />
        </Path>
        <Path
          path={trailPath}
          style="stroke"
          strokeWidth={INTERCEPT_TRAIL_W}
          strokeCap="round"
        >
          <LinearGradient
            start={trailGradientStart}
            end={trailGradientEnd}
            colors={[...INTERCEPT_TRAIL_GRADIENT_COLORS]}
            positions={[...INTERCEPT_TRAIL_GRADIENT_POSITIONS]}
          />
        </Path>
      </Group>
      <Group opacity={headOpacity}>
        <Path path={headPath} color={INTERCEPT_HEAD_FILL}>
          <BlurMask blur={1.6} style="solid" />
        </Path>
        <Path
          path={headPath}
          style="stroke"
          strokeWidth={0.5}
          color={INTERCEPT_HEAD_CORE}
          opacity={0.9}
        />
      </Group>
      <Group opacity={explosionOpacity} layer={INTERCEPT_PLUS_BLEND_PAINT}>
        <Circle cx={explosionCx} cy={explosionCy} r={14} color="rgba(255, 120, 40, 0.55)">
          <BlurMask blur={10} style="normal" />
        </Circle>
        <Circle cx={explosionCx} cy={explosionCy} r={8} color="rgba(255, 220, 140, 0.72)">
          <BlurMask blur={5} style="normal" />
        </Circle>
        <Circle cx={explosionCx} cy={explosionCy} r={3.5} color="rgba(255, 255, 240, 0.9)" />
      </Group>
    </>
  );
});

type Props = {
  orbitSize?: number;
  planetId?: string | null;
  active: boolean;
  inboundStartMs: number;
  travelMs: number;
  plan: DefenseInterceptVisualPlan | null;
  onInterceptVisualHit?: (relativeMs: number) => void;
  /** 모든 요격탄(명중·빗나감) 연출 종료 */
  onAllMissilesComplete?: () => void;
};

export const PlanetDefenseInterceptMissileSkiaLayer = memo(function PlanetDefenseInterceptMissileSkiaLayer({
  orbitSize = PLANET_MAIN_ORBIT_SCENE_SIZE,
  planetId = null,
  active,
  inboundStartMs,
  travelMs,
  plan,
  onInterceptVisualHit,
  onAllMissilesComplete,
}: Props) {
  const missilesRef = useRef<DefenseInterceptGuidedMissile[]>([]);
  const planRef = useRef<DefenseInterceptVisualPlan | null>(null);
  const hitReportedRef = useRef(false);
  const allCompleteReportedRef = useRef(false);
  const prevClockRef = useRef(0);
  const missileFlatRefs = useRef<(SharedValue<number[]> | null)[]>([]);
  const interceptSucceeded = useArcCoreMessageStore((s) =>
    s.strike?.interceptRoll?.interceptSucceeded
    ?? false,
  );
  const [missiles, setMissiles] = useState<DefenseInterceptGuidedMissile[]>([]);
  const [hitRelativeMs, setHitRelativeMs] = useState<number | null>(null);
  const hitPointSv = useSharedValue({ x: 0, y: 0 });
  const hitRelativeMsSv = useSharedValue(-1);
  const interceptSucceededSv = useSharedValue(0);

  const clockMs = useSharedValue(Date.now());
  const activeSv = useSharedValue(0);
  const inboundStartMsSv = useSharedValue(0);
  const inboundTravelMsSv = useSharedValue(1);
  const inboundBezierFlatSv = useSharedValue<number[]>([0, 0, 0, 0, 0, 0]);

  const strikeId = plan?.strikeId ?? '';
  const planMissileCount = plan?.missiles.length ?? 0;
  const canvasPadRef = useRef(0);
  const sessionInboundStartMsRef = useRef(0);
  const spawnedStrikeIdRef = useRef('');

  const inboundBezierFlat = useMemo(
    () => packArcCoreMessageBezierFlat(buildArcCoreMessageMissileBezier(orbitSize)),
    [orbitSize],
  );

  useEffect(() => {
    planRef.current = plan;
    if (plan) canvasPadRef.current = plan.canvasPad;
    if (inboundStartMs > 0) sessionInboundStartMsRef.current = inboundStartMs;
  }, [plan, inboundStartMs]);

  const reportHit = useCallback((relativeMs: number, x: number, y: number) => {
    if (hitReportedRef.current) return;
    hitReportedRef.current = true;
    setHitRelativeMs(relativeMs);
    hitPointSv.value = { x, y };
    hitRelativeMsSv.value = relativeMs;
    onInterceptVisualHit?.(relativeMs);
  }, [onInterceptVisualHit, hitPointSv, hitRelativeMsSv]);

  const syncMissileVisualState = useCallback((now: number) => {
    const ctx = { inboundStartMs, travelMs, orbitSize };
    for (let i = 0; i < missilesRef.current.length; i += 1) {
      const sv = missileFlatRefs.current[i];
      const m = missilesRef.current[i];
      if (!sv || !m) continue;
      const head = resolveInterceptHeadAtMs(m, now, ctx);
      appendDefenseInterceptTrailPoint(m, head.x, head.y);
      const simTan = resolveDefenseInterceptMissileHeadingRad(m, now, ctx);
      const next = sv.value.length >= INTERCEPT_MISSILE_FLAT_LEN
        ? sv.value.slice()
        : [...sv.value, ...new Array(INTERCEPT_MISSILE_FLAT_LEN - sv.value.length).fill(0)];
      syncDefenseInterceptMissileFlatFromSim(
        next,
        m,
        head.x,
        head.y,
        simTan,
        now,
        resolveDefenseInterceptMissileLifeEndMs(m, orbitSize),
      );
      sv.value = next;
    }
  }, [inboundStartMs, travelMs, orbitSize]);

  const tickSim = useCallback((now: number) => {
    if (missilesRef.current.length === 0) {
      activeSv.value = 0;
      return;
    }

    const currentPlan = planRef.current;
    const prevClock = prevClockRef.current > 0 ? prevClockRef.current : undefined;
    const rollAtProximity = currentPlan
      ? (relativeMs: number, slotIndex: number) =>
        useArcCoreMessageStore.getState().resolveInterceptRollAtCrossing(
          currentPlan.planetId,
          currentPlan.strikeId,
          relativeMs,
          slotIndex,
        )
      : undefined;

    const tick = tickDefenseInterceptGuidedMissiles(
      missilesRef.current,
      now,
      inboundStartMs,
      travelMs,
      orbitSize,
      prevClock,
      rollAtProximity,
    );

    syncMissileVisualState(now);

    if (
      tick.primaryImpactRelativeMs != null
      && !hitReportedRef.current
      && missilesRef.current.some((m) => m.willHit && m.impactAtMs > 0)
    ) {
      reportHit(tick.primaryImpactRelativeMs, tick.hitX, tick.hitY);
    }

    prevClockRef.current = now;

    const alive = areDefenseInterceptGuidedMissilesAlive(missilesRef.current, now, orbitSize);
    if (!alive) {
      activeSv.value = 0;
      if (!allCompleteReportedRef.current && missilesRef.current.length > 0) {
        allCompleteReportedRef.current = true;
        onAllMissilesComplete?.();
      }
      if (missilesRef.current.length > 0) {
        missilesRef.current = [];
        missileFlatRefs.current = [];
        setMissiles([]);
      }
    }
  }, [inboundStartMs, travelMs, orbitSize, reportHit, syncMissileVisualState, activeSv, onAllMissilesComplete]);

  const tickSimRef = useRef(tickSim);
  tickSimRef.current = tickSim;

  const dispatchTickSim = useCallback((now: number) => {
    tickSimRef.current(now);
  }, []);

  useLayoutEffect(() => {
    if (active && plan && plan.missiles.length > 0 && inboundStartMs > 0 && travelMs > 0) {
      if (spawnedStrikeIdRef.current === strikeId && missilesRef.current.length > 0) {
        return;
      }
      spawnedStrikeIdRef.current = strikeId;
      hitReportedRef.current = false;
      allCompleteReportedRef.current = false;
      prevClockRef.current = 0;
      setHitRelativeMs(null);
      hitRelativeMsSv.value = -1;
      hitPointSv.value = { x: 0, y: 0 };
      canvasPadRef.current = plan.canvasPad;
      sessionInboundStartMsRef.current = inboundStartMs;
      inboundStartMsSv.value = inboundStartMs;
      inboundTravelMsSv.value = travelMs;
      inboundBezierFlatSv.value = inboundBezierFlat;
      const created = createDefenseInterceptGuidedMissiles(
        plan,
        inboundStartMs,
        travelMs,
        orbitSize,
      );
      missilesRef.current = created;
      missileFlatRefs.current = created.map((m) => makeMutable(packDefenseInterceptMissileFlat(m)));
      setMissiles(created);
      clockMs.value = Date.now();
      activeSv.value = 1;
    }
    return () => {
      if (!active) {
        spawnedStrikeIdRef.current = '';
        missilesRef.current = [];
        missileFlatRefs.current = [];
        activeSv.value = 0;
      }
    };
  }, [
    active,
    strikeId,
    planMissileCount,
    inboundStartMs,
    travelMs,
    orbitSize,
    inboundBezierFlat,
    clockMs,
    activeSv,
    inboundStartMsSv,
    inboundTravelMsSv,
    inboundBezierFlatSv,
  ]);

  const flightFrame = useFrameCallback(() => {
    'worklet';
    if (!activeSv.value) return;
    const now = Date.now();
    clockMs.value = now;
    runOnJS(dispatchTickSim)(now);
  }, false);

  useEffect(() => {
    const shouldRun = Boolean(
      active && inboundStartMs > 0 && travelMs > 0 && missiles.length > 0,
    );
    if (!shouldRun) {
      activeSv.value = 0;
      flightFrame.setActive(false);
      return undefined;
    }
    activeSv.value = 1;
    flightFrame.setActive(true);
    clockMs.value = Date.now();
    tickSim(Date.now());
    const sessionToken = planetId
      ? registerPlanetSessionResource({
        ownerId: 'defense_intercept_missile_skia_raf',
        planetId,
        dispose: () => {
          activeSv.value = 0;
          flightFrame.setActive(false);
        },
      })
      : null;
    return () => {
      activeSv.value = 0;
      flightFrame.setActive(false);
      sessionToken?.release();
    };
  }, [active, inboundStartMs, travelMs, missiles.length, tickSim, planetId, flightFrame, clockMs, activeSv]);

  useEffect(() => {
    interceptSucceededSv.value = interceptSucceeded ? 1 : 0;
  }, [interceptSucceeded, interceptSucceededSv]);

  const renderInboundStartMs = inboundStartMs > 0 ? inboundStartMs : sessionInboundStartMsRef.current;
  const renderCanvasPad = plan?.canvasPad ?? canvasPadRef.current;
  const renderCanvasSize = orbitSize + renderCanvasPad * 2;
  const renderInboundStartMsSv = useSharedValue(renderInboundStartMs);

  useEffect(() => {
    renderInboundStartMsSv.value = renderInboundStartMs;
  }, [renderInboundStartMs, renderInboundStartMsSv]);

  const burstOpacity = useDerivedValue(() => {
    'worklet';
    if (interceptSucceededSv.value < 0.5 || hitRelativeMsSv.value < 0) return 0;
    const burstT = clockMs.value - renderInboundStartMsSv.value - hitRelativeMsSv.value;
    if (burstT < 0 || burstT >= DEFENSE_INTERCEPT_EXPLOSION_MS * 1.2) return 0;
    return Math.max(0, 1 - burstT / (DEFENSE_INTERCEPT_EXPLOSION_MS * 1.2));
  });

  const burstCx = useDerivedValue(() => {
    'worklet';
    return hitPointSv.value.x + renderCanvasPad;
  });
  const burstCy = useDerivedValue(() => {
    'worklet';
    return hitPointSv.value.y + renderCanvasPad;
  });

  if (missiles.length === 0) {
    return null;
  }

  return (
    <View
      style={[
        styles.root,
        {
          left: -renderCanvasPad,
          top: -renderCanvasPad,
          width: renderCanvasSize,
          height: renderCanvasSize,
        },
      ]}
      pointerEvents="none"
    >
      <Canvas style={{ width: renderCanvasSize, height: renderCanvasSize }}>
        {missiles.slice(0, MAX_INTERCEPT_SLOTS).map((m, index) => {
          const missileFlat = missileFlatRefs.current[index];
          if (!missileFlat) return null;
          return (
            <InterceptMissileDraw
              key={`def-intercept-${m.slotIndex}`}
              clockMs={clockMs}
              missileFlat={missileFlat}
              inboundStartMsSv={inboundStartMsSv}
              inboundTravelMsSv={inboundTravelMsSv}
              inboundBezierFlatSv={inboundBezierFlatSv}
              canvasPad={renderCanvasPad}
              initialTangentRad={m.tangentRad}
            />
          );
        })}
        {hitRelativeMs != null ? (
          <Group opacity={burstOpacity} layer={INTERCEPT_PLUS_BLEND_PAINT}>
            <Circle cx={burstCx} cy={burstCy} r={22} color="rgba(255, 96, 32, 0.42)">
              <BlurMask blur={16} style="normal" />
            </Circle>
            <Circle cx={burstCx} cy={burstCy} r={12} color="rgba(255, 210, 120, 0.55)">
              <BlurMask blur={8} style="normal" />
            </Circle>
            <Circle cx={burstCx} cy={burstCy} r={5} color="rgba(255, 255, 248, 0.88)" />
          </Group>
        ) : null}
      </Canvas>
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    zIndex: 7,
    overflow: 'visible',
  },
});
