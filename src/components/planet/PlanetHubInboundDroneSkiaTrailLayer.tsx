// ============================================================
// 행성 허브 — 아크코어 드론 Skia trail + 충돌 FX (단일 Canvas + Picture)
//
// ── 메모리 정책 (2026-06-15 리팩터) ─────────────────────────────
//   trail Path : 컴포넌트 ref pathPoolRef — rewind() 재사용, Make() 금지
//   trail Paint: 컴포넌트 ref trailPaintRef — setAlphaf만 갱신
//   burst Paint : planetSkiaHitFxContract 모듈 스크래치 (disposables 불필요)
//   RecordedTrailFrame: disposables 폐기 → picture 단독 보관
//   언마운트 시 pathPool + trailPaint + live picture 순서대로 해제
// ============================================================

import React, { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import {
  Canvas,
  PaintStyle,
  Picture,
  Skia,
  useImage,
} from '@shopify/react-native-skia';
import type { SkImage, SkPaint, SkPath, SkPicture } from '@shopify/react-native-skia';
import {
  runOnJS,
  type SharedValue,
  useAnimatedReaction,
  useSharedValue,
} from 'react-native-reanimated';
import { readPlanetOrbitClockMs } from '../../arcCore/orbitClockMsBridge';
import { PLANET_MAIN_ORBIT_SCENE_SIZE } from '../../stages/planetMainStageLayout';
import { HUB_WORKLET_JS_BRIDGE_INTERVAL_MS } from './planetHubWorkletContract';
import type { InboundDroneHitFx } from './inboundDroneHitFx';
import { drawInboundDroneHitFxOnSkCanvas } from './inboundDroneHitFxDraw';
import {
  INBOUND_DRONE_TRAIL_GLOW_COLOR,
  INBOUND_DRONE_TRAIL_GLOW_OPACITY_MUL,
  resolveInboundDroneTrailSlice,
  writeInboundDroneTaperedTrailFillPath,
} from './inboundDroneSkiaTrail';
import {
  commitSkPictureReactFrame,
  dropSkPictureReactFrame,
  resetSkPath,
  safeSkiaDispose,
} from '../../game/skia/skiaMemoryLifecycle';
import { registerSkPictureFrameInvalidate } from '../../game/skia/skiaPictureFrameRegistry';
import { registerGpuLayer, unregisterGpuLayer } from '../../game/planetStageGpuSupervisor';

const SCENE_SIZE = PLANET_MAIN_ORBIT_SCENE_SIZE;
const TRAIL_BRIDGE_INTERVAL_MS = HUB_WORKLET_JS_BRIDGE_INTERVAL_MS;

function recordInboundDroneVfxPicture(input: {
  orbitMs: number;
  flat: number[];
  droneCount: number;
  center: number;
  edgeR: number;
  impactR: number;
  hitFxList: InboundDroneHitFx[];
  flameImage: SkImage | null;
  pathPool: SkPath[];
  trailPaint: SkPaint;
  recorder: ReturnType<typeof Skia.PictureRecorder>;
}): SkPicture | null {
  const { orbitMs, flat, droneCount, center, edgeR, impactR, hitFxList, flameImage, pathPool, trailPaint, recorder } = input;

  // recorder는 컴포넌트 수명 동안 재사용(호출부에서 lazy 생성·전달) — 매 flush마다 새로
  // Skia.PictureRecorder()를 만들면 dispose() 메서드가 없어 JS GC finalizer가 지연 회수할
  // 때까지 native(JSI) 쪽에 계속 쌓인다(장시간 드론 교전에서 native_heap 누적 원인).
  const canvas = recorder.beginRecording(Skia.XYWHRect(0, 0, SCENE_SIZE, SCENE_SIZE));
  let drewAny = false;

  for (let i = 0; i < droneCount; i += 1) {
    const slice = resolveInboundDroneTrailSlice(i, orbitMs, flat, droneCount);
    if (!slice) continue;

    // rewind() 재사용 — Make() 금지 (Skia 메모리 헌법 §1)
    if (!pathPool[i]) pathPool[i] = Skia.Path.Make();
    const path = pathPool[i]!;
    resetSkPath(path);

    const wrote = writeInboundDroneTaperedTrailFillPath(path, center, edgeR, impactR, slice.ang, slice.uTail, slice.uHead);
    if (!wrote) continue;

    trailPaint.setAlphaf(Math.max(0, Math.min(1, slice.trailOpacity * INBOUND_DRONE_TRAIL_GLOW_OPACITY_MUL)));
    canvas.drawPath(path, trailPaint);
    drewAny = true;
  }

  // burst Paint 은 planetSkiaHitFxContract 모듈 스크래치 재사용 (disposables 불필요)
  if (drawInboundDroneHitFxOnSkCanvas(canvas, flameImage, hitFxList, orbitMs)) {
    drewAny = true;
  }

  if (!drewAny) {
    // PictureRecorder 는 beginRecording 후 반드시 finishRecording 호출 필요
    const empty = recorder.finishRecordingAsPicture();
    safeSkiaDispose(empty);
    return null;
  }

  return recorder.finishRecordingAsPicture();
}

export const PlanetHubInboundDroneSkiaTrailLayer = memo(function PlanetHubInboundDroneSkiaTrailLayer({
  orbitClockMs,
  trailFlatSv,
  trailCountSv,
  trailFlatJsRef,
  trailCountJsRef,
  droneIds,
  hitFxRef,
  hitFxTick,
  onVfxIdle,
  center,
  edgeR,
  impactR,
}: {
  orbitClockMs: SharedValue<number>;
  trailFlatSv: SharedValue<number[]>;
  trailCountSv: SharedValue<number>;
  /** JS 팩 미러 — SharedValue.value JS 읽기 금지 */
  trailFlatJsRef: React.MutableRefObject<number[]>;
  trailCountJsRef: React.MutableRefObject<number>;
  droneIds: string[];
  hitFxRef: React.MutableRefObject<InboundDroneHitFx[]>;
  hitFxTick: number;
  onVfxIdle?: () => void;
  center: number;
  edgeR: number;
  impactR: number;
}) {
  const mountedRef = useRef(true);
  const liveFrameRef = useRef<SkPicture | null>(null);
  const geomRef = useRef({ center, edgeR, impactR });
  geomRef.current = { center, edgeR, impactR };
  const onVfxIdleRef = useRef(onVfxIdle);
  onVfxIdleRef.current = onVfxIdle;

  const trailFlatRef = useRef<number[]>([]);
  const trailCountRef = useRef(0);
  const pendingOrbitMsRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);
  const trailBridgeLastSyncMs = useSharedValue(0);
  const trailBridgeAliveSv = useSharedValue(1);
  const hitFxActiveSv = useSharedValue(0);

  // ── 사전 할당 Path 풀 + trail scratch Paint + PictureRecorder (컴포넌트 수명)
  const pathPoolRef = useRef<SkPath[]>([]);
  const trailPaintRef = useRef<SkPaint | null>(null);
  const recorderRef = useRef<ReturnType<typeof Skia.PictureRecorder> | null>(null);

  const flameImage = useImage(require('../../../assets/images/effects/tail_fire_02.png'));
  const flameImageRef = useRef<SkImage | null>(null);
  useEffect(() => {
    flameImageRef.current = flameImage ?? null;
  }, [flameImage]);

  // SkImage(useImage 반환) 수동 dispose 금지 — 훅이 수명을 자체 관리한다.
  // 수동 해제는 SkPicture/JsiImageNode 가 참조 중인 이미지를 조기 해제해
  // use-after-free → GC FinalizerDaemon 파괴 시 SIGSEGV 를 유발한다(2026-06-17 크래시).

  const [picture, setPicture] = useState<SkPicture | null>(null);

  const flushPicture = useCallback(() => {
    rafIdRef.current = null;
    if (!mountedRef.current) return;

    const droneCount = trailCountRef.current;
    // 허브 상시 누수 방지: 드론·히트FX 가 전혀 없으면 PictureRecorder 를 만들지 않는다.
    // (orbit clock 틱마다 빈 recorder 생성/finish/dispose → 장시간 네이티브(JSI finalizer 지연) 누적 원인)
    if (droneCount <= 0 && hitFxRef.current.length === 0) {
      if (liveFrameRef.current != null) {
        dropSkPictureReactFrame({ liveRef: liveFrameRef, setPicture });
      }
      onVfxIdleRef.current?.();
      return;
    }

    // trail paint 지연 초기화
    if (!trailPaintRef.current) {
      const p = Skia.Paint();
      p.setStyle(PaintStyle.Fill);
      p.setColor(Skia.Color(INBOUND_DRONE_TRAIL_GLOW_COLOR));
      p.setAntiAlias(true);
      trailPaintRef.current = p;
    }
    // PictureRecorder 지연 초기화 — 컴포넌트 수명 동안 1개만 만들어 매 flush마다 재사용
    if (!recorderRef.current) {
      recorderRef.current = Skia.PictureRecorder();
    }

    const next = recordInboundDroneVfxPicture({
      orbitMs: pendingOrbitMsRef.current,
      flat: trailFlatRef.current,
      droneCount,
      center: geomRef.current.center,
      edgeR: geomRef.current.edgeR,
      impactR: geomRef.current.impactR,
      hitFxList: hitFxRef.current,
      flameImage: flameImageRef.current,
      pathPool: pathPoolRef.current,
      trailPaint: trailPaintRef.current,
      recorder: recorderRef.current,
    });

    if (!next) {
      if (droneCount <= 0 && hitFxRef.current.length === 0) {
        dropSkPictureReactFrame({ liveRef: liveFrameRef, setPicture });
        onVfxIdleRef.current?.();
      }
      return;
    }

    commitSkPictureReactFrame({ liveRef: liveFrameRef, setPicture, next });

    if (droneCount <= 0 && hitFxRef.current.length === 0) {
      onVfxIdleRef.current?.();
    }
  }, [hitFxRef]);

  const scheduleFlush = useCallback(() => {
    if (rafIdRef.current != null) return;
    rafIdRef.current = requestAnimationFrame(flushPicture);
  }, [flushPicture]);

  const noteOrbitMsImpl = useCallback(
    (orbitMs: number) => {
      if (!mountedRef.current) return;
      pendingOrbitMsRef.current = orbitMs;
      scheduleFlush();
    },
    [scheduleFlush],
  );

  const noteOrbitMsRef = useRef(noteOrbitMsImpl);
  noteOrbitMsRef.current = noteOrbitMsImpl;

  /** identity 고정 — reaction deps 변경 시 triggerUI ShareableWorklet SIGSEGV 방지 */
  const bridgeNoteOrbitMs = useCallback((orbitMs: number) => {
    if (!mountedRef.current) return;
    noteOrbitMsRef.current(orbitMs);
  }, []);

  useLayoutEffect(() => {
    trailFlatRef.current = trailFlatJsRef.current;
    trailCountRef.current = trailCountJsRef.current;
    pendingOrbitMsRef.current = readPlanetOrbitClockMs();
    hitFxActiveSv.value = hitFxRef.current.length > 0 ? 1 : 0;
    scheduleFlush();
  }, [droneIds, hitFxTick, trailFlatJsRef, trailCountJsRef, scheduleFlush, hitFxRef, hitFxActiveSv]);

  useAnimatedReaction(
    () => ({
      ms: orbitClockMs.value,
      trailCount: trailCountSv.value,
      hitFxActive: hitFxActiveSv.value,
    }),
    (cur) => {
      'worklet';
      if (trailBridgeAliveSv.value === 0) return;
      if (cur.trailCount <= 0 && cur.hitFxActive === 0) return;
      if (cur.ms - trailBridgeLastSyncMs.value < TRAIL_BRIDGE_INTERVAL_MS) return;
      trailBridgeLastSyncMs.value = cur.ms;
      runOnJS(bridgeNoteOrbitMs)(cur.ms);
    },
  );

  useEffect(() => {
    return registerSkPictureFrameInvalidate(() => {
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      dropSkPictureReactFrame({ liveRef: liveFrameRef, setPicture });
    });
  }, []);

  // GPU 레이어 진단 계측 — 허브 리클레임 로그의 debugPlanetGpuLayerSnapshot()에서
  // 이 Canvas의 동시 마운트 여부를 확인하기 위함(동작 변경 없음, 카운트 전용 — 2026-07-10).
  useEffect(() => {
    registerGpuLayer('skia_inbound_drone_trail', 'T0');
    return () => {
      unregisterGpuLayer('skia_inbound_drone_trail');
    };
  }, []);

  useLayoutEffect(() => {
    mountedRef.current = true;
    trailBridgeAliveSv.value = 1;
    return () => {
      trailBridgeAliveSv.value = 0;
      trailBridgeLastSyncMs.value = 0;
      mountedRef.current = false;
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      // pooled path 해제 (컴포넌트 수명 객체)
      for (const p of pathPoolRef.current) {
        safeSkiaDispose(p);
      }
      pathPoolRef.current = [];
      safeSkiaDispose(trailPaintRef.current);
      trailPaintRef.current = null;
      safeSkiaDispose(recorderRef.current as unknown as { dispose?: () => void });
      recorderRef.current = null;
      dropSkPictureReactFrame({ liveRef: liveFrameRef, setPicture });
    };
  }, [trailBridgeAliveSv]);

  return (
    <Canvas style={styles.canvas} pointerEvents="none">
      {picture ? <Picture picture={picture} /> : null}
    </Canvas>
  );
});

const styles = StyleSheet.create({
  canvas: {
    ...StyleSheet.absoluteFillObject,
  },
});
