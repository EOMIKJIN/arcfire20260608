// ============================================================
// 행성 허브 — 아크코어 드론 inbound 마크 (RN Animated) + Skia trail/FX
// ============================================================

import React, { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  runOnJS,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import type { ArcInboundDrone, ArcInboundDronePhase } from '../../store/arcInboundDroneStore';
import { readPlanetOrbitClockMs } from '../../arcCore/orbitClockMsBridge';
import { getArcCoreInboundDronePolicy } from '../../arcCore/balance/arcCoreInboundDronePolicy';
import { createJsWorkletPackMirror, HUB_WORKLET_JS_BRIDGE_INTERVAL_MS } from './planetHubWorkletContract';
import { resolveInboundDroneStartOrbitMs } from '../../arcCore/inboundDrone/inboundDroneKinematics';
import { WORLD_OBJECT_WRECK_MARK_PX } from '../../game/planetHub/planetHubConstants';
import { PLANET_MAIN_ORBIT_SCENE_SIZE } from '../../stages/planetMainStageLayout';
import {
  buildInboundDronePackSig,
  computeInboundDroneScreenPacked,
  packInboundDronesToFloat32,
} from './planetOrbitInboundDroneWorklets';
import { packInboundDroneTrailFlat } from './inboundDroneSkiaTrail';
import {
  compactHubInboundDroneDodgeFxInPlace,
  hubInboundDroneDodgeHitFxRef,
  pushHubInboundDroneDodgeFx,
  resetHubInboundDroneDodgeBridge,
} from '../../arcCore/inboundDrone/hubInboundDroneDodgeBridge';
import {
  compactInboundDroneHitFxInPlace,
  INBOUND_DRONE_VISUAL_IMPACT_PROGRESS,
  pushInboundDroneHitFx,
  resolveInboundDroneHitXY,
  type InboundDroneHitFx,
} from './inboundDroneHitFx';
import { inboundDroneHitFxAsDodge } from './inboundDroneHitFxDraw';
import { PlanetHubInboundDroneSkiaTrailLayer } from './PlanetHubInboundDroneSkiaTrailLayer';
import { useDevSkiaMountAllowed } from '../../hooks/useDevSkiaMountAllowed';

const AnimatedView = Animated.createAnimatedComponent(View);

export const PLANET_HUB_INBOUND_DRONE_RENDER_MAX = 24;

/** trail/dodge와 동일 — 60Hz runOnJS 장시간 PSS creep 방지 */
const IMPACT_BRIDGE_INTERVAL_MS = HUB_WORKLET_JS_BRIDGE_INTERVAL_MS;

/** 잔해(`worldObjectWreckMark`) 정사각 9px — 드론은 절반 직경의 붉은 원 */
const INBOUND_DRONE_MARK_PX = WORLD_OBJECT_WRECK_MARK_PX / 2;
const MARK_ANCHOR_PX = INBOUND_DRONE_MARK_PX / 2;

function isTrailEligibleDrone(d: ArcInboundDrone): boolean {
  return d.phase === 'inbound' || d.phase === 'destroyed' || d.phase === 'impacted';
}

function spawnDroneEndHitFx(input: {
  drone: ArcInboundDrone;
  variant: 'impact' | 'intercept';
  nowMs: number;
  center: number;
  edgeR: number;
  impactR: number;
  hitFxRef: React.MutableRefObject<InboundDroneHitFx[]>;
  spawnedHitFxIds: Set<string>;
}): boolean {
  const { drone, variant, nowMs, center, edgeR, impactR, hitFxRef, spawnedHitFxIds } = input;
  const phaseForKey: ArcInboundDronePhase = variant === 'impact' ? 'impacted' : 'destroyed';
  const fxKey = `${drone.id}:${phaseForKey}`;
  if (spawnedHitFxIds.has(fxKey)) return false;
  spawnedHitFxIds.add(fxKey);

  const posDrone: ArcInboundDrone =
    variant === 'impact'
      ? {
          ...drone,
          phase: 'impacted',
          inboundElapsedSec: drone.inboundDurationSec,
        }
      : drone;
  const hit = resolveInboundDroneHitXY(
    posDrone,
    center,
    edgeR,
    impactR,
    variant === 'impact'
      ? nowMs
      : resolveInboundDroneStartOrbitMs(drone, nowMs) + drone.inboundElapsedSec * 1000,
  );
  const fxId = fxKey;
  pushInboundDroneHitFx(hitFxRef.current, {
    id: fxId,
    x: hit.x,
    y: hit.y,
    startOrbitMs: nowMs,
    variant,
  });
  pushHubInboundDroneDodgeFx(
    inboundDroneHitFxAsDodge({
      id: fxId,
      x: hit.x,
      y: hit.y,
      startOrbitMs: nowMs,
      variant,
    }),
  );
  return true;
}

function shouldSpawnEndHitFx(prevPhase: ArcInboundDronePhase | undefined, phase: ArcInboundDronePhase): boolean {
  if (phase === 'inbound') return false;
  if (prevPhase === 'inbound') return true;
  // 4Hz 스냅샷·레이어 지연 마운트로 inbound 프레임을 건너뛴 경우
  return prevPhase === undefined;
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
  },
  markWrap: {
    position: 'absolute',
    width: INBOUND_DRONE_MARK_PX,
    height: INBOUND_DRONE_MARK_PX,
    left: 0,
    top: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: INBOUND_DRONE_MARK_PX,
    height: INBOUND_DRONE_MARK_PX,
    borderRadius: MARK_ANCHOR_PX,
    backgroundColor: 'rgba(220, 48, 42, 0.94)',
    borderWidth: 0.75,
    borderColor: 'rgba(255, 120, 100, 0.85)',
  },
});

const HubInboundDroneMark = memo(function HubInboundDroneMark({
  index,
  orbitClockMs,
  flatSv,
  droneCountSv,
  center,
  edgeR,
  impactR,
}: {
  index: number;
  orbitClockMs: SharedValue<number>;
  flatSv: SharedValue<number[]>;
  droneCountSv: SharedValue<number>;
  center: number;
  edgeR: number;
  impactR: number;
}) {
  const animated = useAnimatedStyle(() => {
    'worklet';
    const p = computeInboundDroneScreenPacked(
      index,
      orbitClockMs.value,
      flatSv.value,
      droneCountSv.value,
      center,
      edgeR,
      impactR,
    );
    if (!p) {
      return {
        opacity: 0,
        transform: [{ translateX: -9999 }, { translateY: -9999 }],
      };
    }
    return {
      opacity: p.opacity,
      transform: [{ translateX: p.x - MARK_ANCHOR_PX }, { translateY: p.y - MARK_ANCHOR_PX }],
    };
  }, [index, center, edgeR, impactR]);

  return (
    <AnimatedView style={[styles.markWrap, animated]} pointerEvents="none">
      <View style={styles.dot} />
    </AnimatedView>
  );
});

export const PlanetHubInboundDroneLayer = memo(function PlanetHubInboundDroneLayer({
  orbitClockMs,
  drones,
  onSkiaDodgeBackdropLatch,
}: {
  orbitClockMs: SharedValue<number>;
  drones: ArcInboundDrone[];
  /** colorDodge는 성운 Skia 백드롭 필요 — 드론/FX 활성 동안 true */
  onSkiaDodgeBackdropLatch?: (active: boolean) => void;
}) {
  const policy = useMemo(() => getArcCoreInboundDronePolicy(), []);
  const devSkiaMountAllowed = useDevSkiaMountAllowed();
  const flatSv = useSharedValue<number[]>([]);
  const trailFlatSv = useSharedValue<number[]>([]);
  const droneCountSv = useSharedValue(0);
  const trailCountSv = useSharedValue(0);
  const trailPackMirror = useRef(createJsWorkletPackMirror<number[]>([])).current;
  const trailCountJsRef = useRef(0);
  const startOrbitMsByIdRef = useRef<Map<string, number>>(new Map());
  const endOrbitMsByIdRef = useRef<Map<string, number>>(new Map());
  const prevPhaseByIdRef = useRef<Map<string, ArcInboundDronePhase>>(new Map());
  const inboundPackSigRef = useRef('');
  const trailPackSigRef = useRef('');
  const hitFxRef = useRef<InboundDroneHitFx[]>([]);
  const spawnedHitFxIdsRef = useRef<Set<string>>(new Set());
  const inboundDronesRef = useRef<ArcInboundDrone[]>([]);
  const inboundCountSv = useSharedValue(0);
  const impactBridgeLastSyncMs = useSharedValue(0);
  /** worklet→JS impact bridge — unmount 후 runOnJS SIGSEGV 방지 */
  const impactBridgeAliveSv = useSharedValue(1);
  const layerMountedRef = useRef(true);
  const [hitFxTick, setHitFxTick] = useState(0);
  const [vfxOverlayOpen, setVfxOverlayOpen] = useState(false);

  const inboundDrones = useMemo(
    () => drones.filter((d) => d.phase === 'inbound').slice(0, PLANET_HUB_INBOUND_DRONE_RENDER_MAX),
    [drones],
  );

  const trailDrones = useMemo(
    () => drones.filter(isTrailEligibleDrone).slice(0, PLANET_HUB_INBOUND_DRONE_RENDER_MAX),
    [drones],
  );

  const inboundPackSig = useMemo(() => buildInboundDronePackSig(inboundDrones), [inboundDrones]);
  const trailPackSig = useMemo(() => buildInboundDronePackSig(trailDrones), [trailDrones]);

  inboundDronesRef.current = inboundDrones;

  useEffect(() => {
    inboundCountSv.value = inboundDrones.length;
  }, [inboundDrones.length, inboundCountSv]);

  const center = PLANET_MAIN_ORBIT_SCENE_SIZE / 2;
  const edgeR = policy.edgeSpawnRadiusPx;
  const impactR = policy.impactRadiusPx;
  const geomRef = useRef({ center, edgeR, impactR });
  geomRef.current = { center, edgeR, impactR };

  const onSkiaDodgeBackdropLatchRef = useRef(onSkiaDodgeBackdropLatch);
  onSkiaDodgeBackdropLatchRef.current = onSkiaDodgeBackdropLatch;

  const noteHitSpawn = useCallback(() => {
    setHitFxTick((t) => t + 1);
    setVfxOverlayOpen(true);
    onSkiaDodgeBackdropLatchRef.current?.(true);
  }, []);

  useLayoutEffect(() => {
    layerMountedRef.current = true;
    impactBridgeAliveSv.value = 1;
    return () => {
      impactBridgeAliveSv.value = 0;
      impactBridgeLastSyncMs.value = 0;
      layerMountedRef.current = false;
      hitFxRef.current.length = 0;
      spawnedHitFxIdsRef.current.clear();
      startOrbitMsByIdRef.current.clear();
      endOrbitMsByIdRef.current.clear();
      prevPhaseByIdRef.current.clear();
      resetHubInboundDroneDodgeBridge();
      onSkiaDodgeBackdropLatchRef.current?.(false);
    };
  }, [impactBridgeAliveSv, impactBridgeLastSyncMs]);

  const checkVisualImpactsImpl = useCallback(
    (orbitMs: number) => {
      if (!layerMountedRef.current) return;
      const { center: c, edgeR: er, impactR: ir } = geomRef.current;
      let spawned = false;
      for (const d of inboundDronesRef.current) {
        if (d.phase !== 'inbound') continue;
        if (spawnedHitFxIdsRef.current.has(`${d.id}:impacted`)) continue;
        const startMs = startOrbitMsByIdRef.current.get(d.id);
        if (startMs == null) continue;
        const dur = Math.max(0.001, Number.isFinite(d.inboundDurationSec) ? d.inboundDurationSec : 0.001);
        const progress = Math.max(0, (orbitMs - startMs) * 0.001 / dur);
        if (progress < INBOUND_DRONE_VISUAL_IMPACT_PROGRESS) continue;
        if (
          spawnDroneEndHitFx({
            drone: d,
            variant: 'impact',
            nowMs: orbitMs,
            center: c,
            edgeR: er,
            impactR: ir,
            hitFxRef,
            spawnedHitFxIds: spawnedHitFxIdsRef.current,
          })
        ) {
          spawned = true;
        }
      }
      if (spawned) noteHitSpawn();
    },
    [noteHitSpawn],
  );

  const checkVisualImpactsRef = useRef(checkVisualImpactsImpl);
  checkVisualImpactsRef.current = checkVisualImpactsImpl;

  /** identity 고정 — reaction deps에 넣으면 ShareableWorklet SIGSEGV(2026-06-21 14:31) */
  const bridgeCheckVisualImpacts = useCallback((orbitMs: number) => {
    if (!layerMountedRef.current) return;
    checkVisualImpactsRef.current(orbitMs);
  }, []);

  useAnimatedReaction(
    () => ({
      ms: orbitClockMs.value,
      inboundCount: inboundCountSv.value,
    }),
    (cur) => {
      'worklet';
      if (impactBridgeAliveSv.value === 0) return;
      if (cur.inboundCount <= 0) return;
      if (cur.ms - impactBridgeLastSyncMs.value < IMPACT_BRIDGE_INTERVAL_MS) return;
      impactBridgeLastSyncMs.value = cur.ms;
      runOnJS(bridgeCheckVisualImpacts)(cur.ms);
    },
  );

  const handleVfxIdle = useCallback(() => {
    compactHubInboundDroneDodgeFxInPlace(hubInboundDroneDodgeHitFxRef.current, readPlanetOrbitClockMs());
    setVfxOverlayOpen(false);
    if (inboundDrones.length === 0 && trailDrones.length === 0) {
      onSkiaDodgeBackdropLatchRef.current?.(false);
    }
  }, [inboundDrones.length, trailDrones.length]);

  useLayoutEffect(() => {
    const nowMs = readPlanetOrbitClockMs();
    const startOrbitMsById = startOrbitMsByIdRef.current;
    const endOrbitMsById = endOrbitMsByIdRef.current;
    const prevPhaseById = prevPhaseByIdRef.current;
    const spawnedHitFxIds = spawnedHitFxIdsRef.current;
    const activeTrailIds = new Set<string>();
    let spawnedHit = false;

    for (const d of trailDrones) {
      activeTrailIds.add(d.id);
      const prevPhase = prevPhaseById.get(d.id);
      if (d.phase === 'inbound' && !startOrbitMsById.has(d.id)) {
        startOrbitMsById.set(d.id, resolveInboundDroneStartOrbitMs(d, nowMs));
      } else if (d.phase !== 'inbound' && !endOrbitMsById.has(d.id)) {
        endOrbitMsById.set(d.id, nowMs);
      }

      if (shouldSpawnEndHitFx(prevPhase, d.phase)) {
        if (
          spawnDroneEndHitFx({
            drone: d,
            variant: d.phase === 'impacted' ? 'impact' : 'intercept',
            nowMs,
            center,
            edgeR,
            impactR,
            hitFxRef,
            spawnedHitFxIds,
          })
        ) {
          spawnedHit = true;
        }
      }
      prevPhaseById.set(d.id, d.phase);
    }

    for (const id of startOrbitMsById.keys()) {
      if (!activeTrailIds.has(id)) startOrbitMsById.delete(id);
    }
    for (const id of endOrbitMsById.keys()) {
      if (!activeTrailIds.has(id)) endOrbitMsById.delete(id);
    }
    for (const id of prevPhaseById.keys()) {
      if (!activeTrailIds.has(id)) prevPhaseById.delete(id);
    }
    for (const key of spawnedHitFxIds.keys()) {
      const droneId = key.split(':')[0];
      if (droneId && !activeTrailIds.has(droneId)) spawnedHitFxIds.delete(key);
    }

    if (inboundPackSigRef.current !== inboundPackSig) {
      inboundPackSigRef.current = inboundPackSig;
      droneCountSv.value = inboundDrones.length;
      flatSv.value = packInboundDronesToFloat32(inboundDrones, startOrbitMsById);
    }
    if (trailPackSigRef.current !== trailPackSig) {
      trailPackSigRef.current = trailPackSig;
      const packed = packInboundDroneTrailFlat(
        trailDrones,
        startOrbitMsById,
        endOrbitMsById,
        nowMs,
      );
      trailCountJsRef.current = trailDrones.length;
      trailPackMirror.publish(packed, (v) => {
        trailFlatSv.value = v;
      });
      trailCountSv.value = trailDrones.length;
    }

    compactInboundDroneHitFxInPlace(hitFxRef.current, nowMs);
    compactHubInboundDroneDodgeFxInPlace(hubInboundDroneDodgeHitFxRef.current, nowMs);

    if (spawnedHit) {
      noteHitSpawn();
    }
    if (trailDrones.length > 0) {
      setVfxOverlayOpen(true);
      onSkiaDodgeBackdropLatchRef.current?.(true);
    } else if (
      inboundDrones.length === 0 &&
      hitFxRef.current.length === 0 &&
      hubInboundDroneDodgeHitFxRef.current.length === 0
    ) {
      setVfxOverlayOpen(false);
      onSkiaDodgeBackdropLatchRef.current?.(false);
    }
  }, [
    inboundPackSig,
    trailPackSig,
    flatSv,
    trailFlatSv,
    droneCountSv,
    trailCountSv,
    center,
    edgeR,
    impactR,
    noteHitSpawn,
    trailPackMirror,
  ]);

  const markCount = inboundDrones.length;
  const trailCount = trailDrones.length;
  const droneIds = useMemo(() => trailDrones.map((d) => d.id), [trailDrones]);
  const showVfxLayer = vfxOverlayOpen || trailCount > 0 || hitFxRef.current.length > 0;

  if (!showVfxLayer && markCount <= 0) return null;

  return (
    <View
      style={styles.root}
      pointerEvents="none"
      accessibilityLabel="아크코어 드론"
      accessibilityRole="image"
      accessible
    >
      {showVfxLayer && devSkiaMountAllowed ? (
        <PlanetHubInboundDroneSkiaTrailLayer
          orbitClockMs={orbitClockMs}
          trailFlatSv={trailFlatSv}
          trailCountSv={trailCountSv}
          trailFlatJsRef={trailPackMirror.jsRef}
          trailCountJsRef={trailCountJsRef}
          droneIds={droneIds}
          hitFxRef={hitFxRef}
          hitFxTick={hitFxTick}
          onVfxIdle={handleVfxIdle}
          center={center}
          edgeR={edgeR}
          impactR={impactR}
        />
      ) : null}
      {Array.from({ length: markCount }, (_, index) => (
        <HubInboundDroneMark
          key={`hub-inbound-drone-${inboundDrones[index]!.id}`}
          index={index}
          orbitClockMs={orbitClockMs}
          flatSv={flatSv}
          droneCountSv={droneCountSv}
          center={center}
          edgeR={edgeR}
          impactR={impactR}
        />
      ))}
    </View>
  );
});
