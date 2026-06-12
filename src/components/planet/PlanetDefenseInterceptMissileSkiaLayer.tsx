import React, { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  runOnJS,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import {
  BlurMask,
  Canvas,
  Circle,
  Group,
  Paint,
  Path,
  Skia,
} from '@shopify/react-native-skia';
import type { SkPath } from '@shopify/react-native-skia';
import {
  areDefenseInterceptGuidedMissilesAlive,
  buildDefenseInterceptMissileTrailBands,
  DEFENSE_INTERCEPT_GUIDED_MISSILE_TRAIL_BANDS,
  resolveDefenseInterceptMissileRenderState,
  tickDefenseInterceptGuidedMissiles,
  writeDefenseInterceptMissileTrailPath,
  type DefenseInterceptGuidedMissile,
} from '../../arcCore/message/defenseInterceptGuidedMissile';
import { createDefenseInterceptGuidedMissiles } from '../../arcCore/message/defenseInterceptSpawn';
import {
  DEFENSE_INTERCEPT_EXPLOSION_MS,
  type DefenseInterceptVisualPlan,
} from '../../arcCore/message/defenseInterceptVisualPlan';
import { PLANET_MAIN_ORBIT_SCENE_SIZE } from '../../stages/planetMainStageLayout';
import { useArcCoreMessageStore } from '../../store/arcCoreMessageStore';

const MAX_INTERCEPT_SLOTS = 5;
const INTERCEPT_TRAIL_W = 0.85;
const INTERCEPT_HEAD_RX = 2.2;
const INTERCEPT_HEAD_RY = 1.3;
const INTERCEPT_TRAIL_COLOR = 'rgba(255, 255, 255, 0.9)';
const INTERCEPT_TRAIL_GLOW = 'rgba(255, 255, 255, 0.38)';
const INTERCEPT_HEAD_FILL = 'rgba(255, 255, 255, 0.97)';
const INTERCEPT_HEAD_CORE = 'rgba(255, 255, 255, 0.95)';
const INTERCEPT_CLOCK_BUCKET_MS = 16;
const INTERCEPT_PLUS_BLEND_PAINT = <Paint blendMode="plus" />;

function writeInterceptHeadOval(
  path: SkPath,
  cx: number,
  cy: number,
  tangentRad: number,
  rxAlong: number,
  ryPerp: number,
): void {
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

type Props = {
  orbitSize?: number;
  active: boolean;
  inboundStartMs: number;
  travelMs: number;
  plan: DefenseInterceptVisualPlan | null;
  loopsActive: boolean;
  onInterceptVisualHit?: (relativeMs: number) => void;
};

const MissileDraw = memo(function MissileDraw({
  m,
  clockMs,
  canvasPad,
}: {
  m: DefenseInterceptGuidedMissile;
  clockMs: number;
  canvasPad: number;
}) {
  const bandPathsRef = useRef(
    Array.from({ length: DEFENSE_INTERCEPT_GUIDED_MISSILE_TRAIL_BANDS }, () => Skia.Path.Make()),
  );
  const headPathRef = useRef(Skia.Path.Make());

  const state = resolveDefenseInterceptMissileRenderState(m, clockMs);
  if (!state.visible) return null;

  const trailBands = buildDefenseInterceptMissileTrailBands(state.uTail, state.uHead);

  const headX = state.head.x + canvasPad;
  const headY = state.head.y + canvasPad;
  const headPath = headPathRef.current;
  writeInterceptHeadOval(
    headPath,
    headX,
    headY,
    state.tangentRad,
    INTERCEPT_HEAD_RX,
    INTERCEPT_HEAD_RY,
  );

  const explX = (m.hitApplied && m.willHit ? m.hitX : state.head.x) + canvasPad;
  const explY = (m.hitApplied && m.willHit ? m.hitY : state.head.y) + canvasPad;

  return (
    <>
      {trailBands.map((band, i) => {
        const bandPath = bandPathsRef.current[i];
        if (!bandPath) return null;
        if (!writeDefenseInterceptMissileTrailPath(bandPath, m, band.u0, band.u1, canvasPad)) {
          return null;
        }
        const bandAlpha = state.trailOpacity * band.opacityMul;
        if (bandAlpha < 0.02) return null;
        return (
          <React.Fragment key={`intercept-trail-band-${m.slotIndex}-${i}`}>
            <Path
              path={bandPath}
              style="stroke"
              strokeWidth={INTERCEPT_TRAIL_W * 1.25}
              strokeCap="round"
              color={INTERCEPT_TRAIL_GLOW}
              opacity={bandAlpha * 0.65}
            />
            <Path
              path={bandPath}
              style="stroke"
              strokeWidth={INTERCEPT_TRAIL_W}
              strokeCap="round"
              color={INTERCEPT_TRAIL_COLOR}
              opacity={bandAlpha}
            />
          </React.Fragment>
        );
      })}
      <Group opacity={state.headOpacity}>
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
      {state.explosionOpacity > 0.02 ? (
        <Group opacity={state.explosionOpacity} layer={INTERCEPT_PLUS_BLEND_PAINT}>
          <Circle cx={explX} cy={explY} r={14} color="rgba(255, 120, 40, 0.55)">
            <BlurMask blur={10} style="normal" />
          </Circle>
          <Circle cx={explX} cy={explY} r={8} color="rgba(255, 220, 140, 0.72)">
            <BlurMask blur={5} style="normal" />
          </Circle>
          <Circle cx={explX} cy={explY} r={3.5} color="rgba(255, 255, 240, 0.9)" />
        </Group>
      ) : null}
    </>
  );
}, (prev, next) =>
  prev.m === next.m
  && prev.canvasPad === next.canvasPad
  && Math.floor(prev.clockMs / INTERCEPT_CLOCK_BUCKET_MS)
    === Math.floor(next.clockMs / INTERCEPT_CLOCK_BUCKET_MS));

export const PlanetDefenseInterceptMissileSkiaLayer = memo(function PlanetDefenseInterceptMissileSkiaLayer({
  orbitSize = PLANET_MAIN_ORBIT_SCENE_SIZE,
  active,
  inboundStartMs,
  travelMs,
  plan,
  loopsActive,
  onInterceptVisualHit,
}: Props) {
  const activeSv = useSharedValue(0);
  const missilesRef = useRef<DefenseInterceptGuidedMissile[]>([]);
  const planRef = useRef<DefenseInterceptVisualPlan | null>(null);
  const hitReportedRef = useRef(false);
  const aimCrossRollRef = useRef(false);
  const lastClockBucketRef = useRef(-1);
  const interceptSucceeded = useArcCoreMessageStore(
    (s) => s.strike?.interceptRoll?.interceptSucceeded ?? false,
  );
  const [missiles, setMissiles] = useState<DefenseInterceptGuidedMissile[]>([]);
  const [clockMs, setClockMs] = useState(() => Date.now());
  const [hitPoint, setHitPoint] = useState<{ x: number; y: number } | null>(null);
  const [hitRelativeMs, setHitRelativeMs] = useState<number | null>(null);

  const strikeId = plan?.strikeId ?? '';
  const planMissileCount = plan?.missiles.length ?? 0;
  const canvasPad = plan?.canvasPad ?? 0;
  const canvasSize = orbitSize + canvasPad * 2;

  useEffect(() => {
    planRef.current = plan;
  }, [plan]);

  const reportHit = useCallback((relativeMs: number, x: number, y: number) => {
    if (hitReportedRef.current) return;
    hitReportedRef.current = true;
    setHitPoint({ x, y });
    setHitRelativeMs(relativeMs);
    onInterceptVisualHit?.(relativeMs);
  }, [onInterceptVisualHit]);

  const tickSim = useCallback((now: number) => {
    const currentPlan = planRef.current;
    if (missilesRef.current.length === 0 || !currentPlan) return;

    const tick = tickDefenseInterceptGuidedMissiles(
      missilesRef.current,
      now,
      inboundStartMs,
      travelMs,
      orbitSize,
    );

    if (tick.primaryAimCrossed && !aimCrossRollRef.current && tick.aimCrossRelativeMs != null) {
      aimCrossRollRef.current = true;
      const succeeded = useArcCoreMessageStore.getState().resolveInterceptRollAtCrossing(
        currentPlan.planetId,
        currentPlan.strikeId,
        tick.aimCrossRelativeMs,
      );
      if (succeeded) {
        const primary = missilesRef.current.find((m) => m.slotIndex === 0);
        if (primary) primary.willHit = true;
      }
    }

    if (
      tick.primaryHitRelativeMs != null
      && !hitReportedRef.current
      && missilesRef.current.some((m) => m.slotIndex === 0 && m.willHit)
    ) {
      reportHit(tick.primaryHitRelativeMs, tick.hitX, tick.hitY);
    }

    const alive = areDefenseInterceptGuidedMissilesAlive(missilesRef.current, now);
    if (!alive) {
      activeSv.value = 0;
      return;
    }

    const bucket = Math.floor(now / INTERCEPT_CLOCK_BUCKET_MS);
    if (bucket !== lastClockBucketRef.current) {
      lastClockBucketRef.current = bucket;
      setClockMs(now);
    }
  }, [inboundStartMs, travelMs, orbitSize, reportHit, activeSv]);

  useLayoutEffect(() => {
    hitReportedRef.current = false;
    aimCrossRollRef.current = false;
    lastClockBucketRef.current = -1;
    setHitPoint(null);
    setHitRelativeMs(null);
    if (active && plan && plan.missiles.length > 0 && inboundStartMs > 0 && travelMs > 0) {
      const created = createDefenseInterceptGuidedMissiles(
        plan,
        inboundStartMs,
        travelMs,
        orbitSize,
      );
      missilesRef.current = created;
      setMissiles(created);
      setClockMs(Date.now());
    } else {
      missilesRef.current = [];
      setMissiles([]);
    }
  }, [active, strikeId, planMissileCount, inboundStartMs, travelMs, orbitSize]);

  useLayoutEffect(() => {
    if (active && loopsActive && inboundStartMs > 0 && travelMs > 0 && planMissileCount > 0) {
      activeSv.value = 1;
    } else {
      activeSv.value = 0;
    }
  }, [active, loopsActive, inboundStartMs, travelMs, planMissileCount, strikeId, activeSv]);

  const flightFrame = useFrameCallback(() => {
    'worklet';
    if (!activeSv.value) return;
    runOnJS(tickSim)(Date.now());
  }, false);

  useEffect(() => {
    const on = Boolean(
      active && loopsActive && inboundStartMs > 0 && travelMs > 0 && planMissileCount > 0,
    );
    flightFrame.setActive(on);
    if (on) tickSim(Date.now());
    return () => {
      flightFrame.setActive(false);
      activeSv.value = 0;
    };
  }, [active, loopsActive, inboundStartMs, travelMs, planMissileCount, strikeId, flightFrame, tickSim, activeSv]);

  if (!active || !loopsActive || inboundStartMs <= 0 || !plan || plan.missiles.length === 0 || missiles.length === 0) {
    return null;
  }

  const burstCenter = hitPoint ?? { x: plan.interceptX, y: plan.interceptY };
  const relHit = hitRelativeMs ?? plan.interceptAtMs;
  const burstT = interceptSucceeded && hitRelativeMs != null
    ? clockMs - inboundStartMs - relHit
    : -1;
  const burstOpacity = interceptSucceeded && burstT >= 0 && burstT < DEFENSE_INTERCEPT_EXPLOSION_MS * 1.2
    ? Math.max(0, 1 - burstT / (DEFENSE_INTERCEPT_EXPLOSION_MS * 1.2))
    : 0;

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
        {missiles.slice(0, MAX_INTERCEPT_SLOTS).map((m) => (
          <MissileDraw
            key={`def-intercept-${m.slotIndex}`}
            m={m}
            clockMs={clockMs}
            canvasPad={canvasPad}
          />
        ))}
        {burstOpacity > 0.02 ? (
          <Group opacity={burstOpacity} layer={INTERCEPT_PLUS_BLEND_PAINT}>
            <Circle cx={burstCenter.x + canvasPad} cy={burstCenter.y + canvasPad} r={22} color="rgba(255, 96, 32, 0.42)">
              <BlurMask blur={16} style="normal" />
            </Circle>
            <Circle cx={burstCenter.x + canvasPad} cy={burstCenter.y + canvasPad} r={12} color="rgba(255, 210, 120, 0.55)">
              <BlurMask blur={8} style="normal" />
            </Circle>
            <Circle cx={burstCenter.x + canvasPad} cy={burstCenter.y + canvasPad} r={5} color="rgba(255, 255, 248, 0.88)" />
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
