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
import {
  useArcInboundDroneStore,
  type ArcInboundDrone,
  type ArcInboundDronePhase,
} from '../../store/arcInboundDroneStore';
import { useStoreWithEqualityFn } from 'zustand/traditional';
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

// TEMP-DIAG kim-claude 20261009 [arc-hitch-split] droneLayer — 드론 레이어 동기 렌더 구간 분할(효율화 2라운드). 계측 후 삭제.
// hook 을 쓰지 않는다(모듈 변수만) — HMR hook 순서 불변.
const DRONE_LAYER_DIAG = typeof __DEV__ !== 'undefined' && __DEV__;
const droneLayerDiag = { renderStart: 0, renderMs: 0, trailRenderMs: 0, trailLayoutMs: 0 };
/** Skia trail 자식이 자기 구간 ms 를 더한다 — 부모 layoutEffect 가 한 줄로 출력한다. (import 순환을 피해 globalThis 로 연결) */
if (DRONE_LAYER_DIAG) {
  (globalThis as { __arcfireDroneLayerDiag?: (kind: 'render' | 'layout', ms: number) => void }).__arcfireDroneLayerDiag = (
    kind,
    ms,
  ) => {
    if (kind === 'render') droneLayerDiag.trailRenderMs += ms;
    else droneLayerDiag.trailLayoutMs += ms;
  };
}

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
  const fxOrbitMs = drone.inboundEndOrbitMs ?? nowMs;
  const hit = resolveInboundDroneHitXY(
    posDrone,
    center,
    edgeR,
    impactR,
    fxOrbitMs,
  );
  const fxId = fxKey;
  pushInboundDroneHitFx(hitFxRef.current, {
    id: fxId,
    x: hit.x,
    y: hit.y,
    startOrbitMs: fxOrbitMs,
    variant,
  });
  pushHubInboundDroneDodgeFx(
    inboundDroneHitFxAsDodge({
      id: fxId,
      x: hit.x,
      y: hit.y,
      startOrbitMs: fxOrbitMs,
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

const EMPTY_HUB_DRONES: ArcInboundDrone[] = [];

/** 이 행성 + phase inbound/destroyed/impacted — 예전 planet.tsx 필터와 같다. */
function pickHubDronesAtPlanet(all: ArcInboundDrone[], planetId: string): ArcInboundDrone[] {
  if (!planetId) return EMPTY_HUB_DRONES;
  let out: ArcInboundDrone[] | null = null;
  for (const d of all) {
    if (d.planetId !== planetId) continue;
    if (d.phase === 'inbound' || d.phase === 'destroyed' || d.phase === 'impacted') {
      (out ??= []).push(d);
    }
  }
  return out ?? EMPTY_HUB_DRONES;
}

function sameHubDroneRefs(a: ArcInboundDrone[], b: ArcInboundDrone[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export const PlanetHubInboundDroneLayer = memo(function PlanetHubInboundDroneLayer({
  orbitClockMs,
  planetId,
  onSkiaDodgeBackdropLatch,
}: {
  orbitClockMs: SharedValue<number>;
  /** 드론은 이 레이어가 직접 구독한다 — 발행 때 허브 전체가 아니라 이 레이어만 다시 그린다(효율화 E3). */
  planetId: string;
  /** colorDodge는 성운 Skia 백드롭 필요 — 드론/FX 활성 동안 true */
  onSkiaDodgeBackdropLatch?: (active: boolean) => void;
}) {
  if (DRONE_LAYER_DIAG) droneLayerDiag.renderStart = performance.now(); // TEMP-DIAG
  const drones = useStoreWithEqualityFn(
    useArcInboundDroneStore,
    (s) => pickHubDronesAtPlanet(s.drones, planetId),
    sameHubDroneRefs,
  );
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
  const trailDronesRef = useRef<ArcInboundDrone[]>([]);
  const inboundCountSv = useSharedValue(0);
  const impactBridgeLastSyncMs = useSharedValue(0);
  /** worklet→JS impact bridge — unmount 후 runOnJS SIGSEGV 방지 */
  const impactBridgeAliveSv = useSharedValue(1);
  const layerMountedRef = useRef(true);
  const [hitFxTick, setHitFxTick] = useState(0);
  const [vfxOverlayOpen, setVfxOverlayOpen] = useState(false);
  /** 폭발/요격 FX 순간 — 스토어 phase 전환 전 마크·trail 페이드 동기 */
  const [visualEndIds, setVisualEndIds] = useState<ReadonlySet<string>>(() => new Set());

  const inboundDrones = useMemo(
    () =>
      drones
        .filter((d) => d.phase === 'inbound' && !visualEndIds.has(d.id))
        .slice(0, PLANET_HUB_INBOUND_DRONE_RENDER_MAX),
    [drones, visualEndIds],
  );

  const trailDrones = useMemo(
    () => drones.filter(isTrailEligibleDrone).slice(0, PLANET_HUB_INBOUND_DRONE_RENDER_MAX),
    [drones],
  );

  const inboundPackSig = useMemo(() => buildInboundDronePackSig(inboundDrones), [inboundDrones]);
  const trailPackSig = useMemo(() => buildInboundDronePackSig(trailDrones), [trailDrones]);

  inboundDronesRef.current = inboundDrones;
  trailDronesRef.current = trailDrones;

  useEffect(() => {
    if (visualEndIds.size === 0) return;
    const live = new Set(drones.map((d) => d.id));
    let changed = false;
    const next = new Set<string>();
    for (const id of visualEndIds) {
      if (live.has(id)) next.add(id);
      else changed = true;
    }
    if (changed) setVisualEndIds(next);
  }, [drones, visualEndIds]);

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

  const publishTrailPackNow = useCallback(
    (orbitMs: number) => {
      const packed = packInboundDroneTrailFlat(
        trailDronesRef.current,
        startOrbitMsByIdRef.current,
        endOrbitMsByIdRef.current,
        orbitMs,
      );
      trailCountJsRef.current = trailDronesRef.current.length;
      trailPackMirror.publish(packed, (v) => {
        trailFlatSv.value = v;
      });
      trailCountSv.value = trailDronesRef.current.length;
    },
    [trailFlatSv, trailCountSv, trailPackMirror],
  );

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
      const endedIds: string[] = [];
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
          endOrbitMsByIdRef.current.set(d.id, orbitMs);
          endedIds.push(d.id);
          spawned = true;
        }
      }
      if (spawned) {
        publishTrailPackNow(orbitMs);
        if (endedIds.length > 0) {
          setVisualEndIds((prev) => {
            const next = new Set(prev);
            for (const id of endedIds) next.add(id);
            return next;
          });
        }
        noteHitSpawn();
      }
    },
    [noteHitSpawn, publishTrailPackNow],
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
    const diagT0 = DRONE_LAYER_DIAG ? performance.now() : 0; // TEMP-DIAG
    let diagInPackMs = 0;
    let diagTrailPackMs = 0;
    const nowMs = readPlanetOrbitClockMs();
    if (!startOrbitMsByIdRef.current) startOrbitMsByIdRef.current = new Map();
    if (!endOrbitMsByIdRef.current) endOrbitMsByIdRef.current = new Map();
    if (!prevPhaseByIdRef.current) prevPhaseByIdRef.current = new Map();
    if (!spawnedHitFxIdsRef.current) spawnedHitFxIdsRef.current = new Set();

    const startOrbitMsById = startOrbitMsByIdRef.current;
    const endOrbitMsById = endOrbitMsByIdRef.current;
    const prevPhaseById = prevPhaseByIdRef.current;
    const spawnedHitFxIds = spawnedHitFxIdsRef.current;
    const activeTrailIds = new Set<string>();
    const activeInboundIds = new Set<string>();
    let spawnedHit = false;

    // inbound 마크용 startOrbitMs — trail 슬라이스(24) 밖 드론도 등록 (pack 전 필수)
    for (const d of inboundDrones) {
      activeInboundIds.add(d.id);
      if (d.phase === 'inbound' && !startOrbitMsById.has(d.id)) {
        startOrbitMsById.set(d.id, resolveInboundDroneStartOrbitMs(d, nowMs));
      }
    }

    for (const d of trailDrones) {
      activeTrailIds.add(d.id);
      const prevPhase = prevPhaseById.get(d.id);
      if (d.phase === 'inbound' && !startOrbitMsById.has(d.id)) {
        startOrbitMsById.set(d.id, resolveInboundDroneStartOrbitMs(d, nowMs));
      } else if (d.phase !== 'inbound' && !endOrbitMsById.has(d.id)) {
        endOrbitMsById.set(d.id, d.inboundEndOrbitMs ?? nowMs);
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
          if (!endOrbitMsById.has(d.id)) {
            endOrbitMsById.set(d.id, d.inboundEndOrbitMs ?? nowMs);
          }
          spawnedHit = true;
        }
      }
      prevPhaseById.set(d.id, d.phase);
    }

    if (inboundPackSigRef.current !== inboundPackSig) {
      const p0 = DRONE_LAYER_DIAG ? performance.now() : 0; // TEMP-DIAG
      inboundPackSigRef.current = inboundPackSig;
      droneCountSv.value = inboundDrones.length;
      flatSv.value = packInboundDronesToFloat32(inboundDrones, startOrbitMsById, nowMs);
      if (DRONE_LAYER_DIAG) diagInPackMs = performance.now() - p0;
    }
    if (trailPackSigRef.current !== trailPackSig) {
      const p1 = DRONE_LAYER_DIAG ? performance.now() : 0; // TEMP-DIAG
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
      if (DRONE_LAYER_DIAG) diagTrailPackMs = performance.now() - p1;
    }

    for (const id of startOrbitMsById.keys()) {
      if (!activeTrailIds.has(id) && !activeInboundIds.has(id)) startOrbitMsById.delete(id);
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
    if (DRONE_LAYER_DIAG) {
      // TEMP-DIAG — 자식 Skia trail 의 render·layout 은 이 effect 보다 먼저 끝나 누적돼 있다.
      const layoutMs = performance.now() - diagT0;
      const d = droneLayerDiag;
      const total = d.renderMs + layoutMs + d.trailRenderMs + d.trailLayoutMs;
      if (total >= 10) {
        // eslint-disable-next-line no-console
        console.log(
          '[arc-hitch-split] droneLayer',
          'render', Math.round(d.renderMs),
          'layout', Math.round(layoutMs),
          'inPack', Math.round(diagInPackMs),
          'trailPack', Math.round(diagTrailPackMs),
          'trailChildRender', Math.round(d.trailRenderMs),
          'trailChildLayout', Math.round(d.trailLayoutMs),
        );
      }
      d.trailRenderMs = 0;
      d.trailLayoutMs = 0;
    }
  }, [
    inboundPackSig,
    trailPackSig,
    inboundDrones,
    trailDrones,
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
  // 웨이브마다 Canvas 를 내리면 GL 표면이 프로세스에 남는다. 허브가 마운트된 동안 1장만 둔다.
  const keepTrailCanvas = devSkiaMountAllowed;

  if (DRONE_LAYER_DIAG) droneLayerDiag.renderMs = performance.now() - droneLayerDiag.renderStart; // TEMP-DIAG

  if (!keepTrailCanvas && !showVfxLayer && markCount <= 0) return null;

  return (
    <View
      style={styles.root}
      pointerEvents="none"
      accessibilityLabel="아크코어 드론"
      accessibilityRole="image"
      accessible={markCount > 0}
    >
      {keepTrailCanvas ? (
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
