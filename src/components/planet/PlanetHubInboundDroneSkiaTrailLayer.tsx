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
import { PLANET_MAIN_ORBIT_SCENE_SIZE } from '../../stages/planetMainStageLayout';
import type { InboundDroneHitFx } from './inboundDroneHitFx';
import { drawInboundDroneHitFxOnSkCanvas } from './inboundDroneHitFxDraw';
import {
  INBOUND_DRONE_TRAIL_GLOW_COLOR,
  INBOUND_DRONE_TRAIL_GLOW_OPACITY_MUL,
  resolveInboundDroneTrailSlice,
  writeInboundDroneTaperedTrailFillPath,
} from './inboundDroneSkiaTrail';

const SCENE_SIZE = PLANET_MAIN_ORBIT_SCENE_SIZE;
const PICTURE_DISPOSE_DELAY_MS = 120;
const TRAIL_BRIDGE_INTERVAL_MS = 48;

function safeDispose(obj: { dispose?: () => void } | null | undefined): void {
  try { obj?.dispose?.(); } catch { /* ignore */ }
}

function schedulePictureDispose(pic: SkPicture | null): void {
  if (!pic) return;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      setTimeout(() => safeDispose(pic), PICTURE_DISPOSE_DELAY_MS);
    });
  });
}

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
}): SkPicture | null {
  const { orbitMs, flat, droneCount, center, edgeR, impactR, hitFxList, flameImage, pathPool, trailPaint } = input;

  const recorder = Skia.PictureRecorder();
  const canvas = recorder.beginRecording(Skia.XYWHRect(0, 0, SCENE_SIZE, SCENE_SIZE));
  let drewAny = false;

  for (let i = 0; i < droneCount; i += 1) {
    const slice = resolveInboundDroneTrailSlice(i, orbitMs, flat, droneCount);
    if (!slice) continue;

    // rewind() 재사용 — Make() 금지 (Skia 메모리 헌법 §1)
    if (!pathPool[i]) pathPool[i] = Skia.Path.Make();
    const path = pathPool[i]!;
    path.rewind();

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
    safeDispose(empty);
    return null;
  }

  return recorder.finishRecordingAsPicture();
}

export const PlanetHubInboundDroneSkiaTrailLayer = memo(function PlanetHubInboundDroneSkiaTrailLayer({
  orbitClockMs,
  trailFlatSv,
  trailCountSv,
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
  const hitFxActiveSv = useSharedValue(0);

  // ── 사전 할당 Path 풀 + trail scratch Paint (컴포넌트 수명)
  const pathPoolRef = useRef<SkPath[]>([]);
  const trailPaintRef = useRef<SkPaint | null>(null);

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
      const liveIdle = liveFrameRef.current;
      if (liveIdle != null) {
        liveFrameRef.current = null;
        setPicture(null);
        schedulePictureDispose(liveIdle);
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
    });

    if (!next) {
      if (droneCount <= 0 && hitFxRef.current.length === 0) {
        onVfxIdleRef.current?.();
      }
      return;
    }

    const prev = liveFrameRef.current;
    liveFrameRef.current = next;
    setPicture(next);
    if (prev != null && prev !== next) {
      schedulePictureDispose(prev);
    }

    if (droneCount <= 0 && hitFxRef.current.length === 0) {
      onVfxIdleRef.current?.();
    }
  }, [hitFxRef]);

  const scheduleFlush = useCallback(() => {
    if (rafIdRef.current != null) return;
    rafIdRef.current = requestAnimationFrame(flushPicture);
  }, [flushPicture]);

  const noteOrbitMs = useCallback(
    (orbitMs: number) => {
      pendingOrbitMsRef.current = orbitMs;
      scheduleFlush();
    },
    [scheduleFlush],
  );

  useLayoutEffect(() => {
    trailFlatRef.current = trailFlatSv.value;
    trailCountRef.current = trailCountSv.value;
    pendingOrbitMsRef.current = orbitClockMs.value;
    hitFxActiveSv.value = hitFxRef.current.length > 0 ? 1 : 0;
    scheduleFlush();
  }, [droneIds, hitFxTick, orbitClockMs, trailFlatSv, trailCountSv, scheduleFlush, hitFxRef, hitFxActiveSv]);

  useAnimatedReaction(
    () => ({
      ms: orbitClockMs.value,
      trailCount: trailCountSv.value,
      hitFxActive: hitFxActiveSv.value,
    }),
    (cur) => {
      'worklet';
      if (cur.trailCount <= 0 && cur.hitFxActive === 0) return;
      if (cur.ms - trailBridgeLastSyncMs.value < TRAIL_BRIDGE_INTERVAL_MS) return;
      trailBridgeLastSyncMs.value = cur.ms;
      runOnJS(noteOrbitMs)(cur.ms);
    },
    [orbitClockMs, trailCountSv, hitFxActiveSv, noteOrbitMs, trailBridgeLastSyncMs],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      // pooled path 해제 (컴포넌트 수명 객체)
      for (const p of pathPoolRef.current) {
        safeDispose(p);
      }
      pathPoolRef.current = [];
      // scratch trail paint 해제
      safeDispose(trailPaintRef.current);
      trailPaintRef.current = null;
      // live picture 해제
      const live = liveFrameRef.current;
      liveFrameRef.current = null;
      schedulePictureDispose(live);
    };
  }, []);

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
