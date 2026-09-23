/**
 * 이동중 전투 전용 Skia 패럴랙스 — 허브 베이크 고정 + space_cd01~03 Screen + ColorDodge.
 * 허브/행성 궤도 성운과 분리. Zero-Allocation: 모듈 Paint·Rect + Picture 1장.
 * React `<Picture>` SkPicture · useImage SkImage 수동 dispose 금지.
 */
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BlendMode, Canvas, Picture, Skia, useImage } from '@shopify/react-native-skia';
import type { SkCanvas, SkImage, SkPaint, SkPicture } from '@shopify/react-native-skia';
import { TRANSIT_SPACE_CD_SOURCES } from '../../combat/transitCombatParallaxAssets';
import {
  areTransitNebulaLayersReady,
  intersectRects,
  pickTransitSpaceCdIndex,
  resolveTransitBakedFillBox,
  resolveTransitChromeCoverBands,
  resolveTransitCloudLayerMotions,
  resolveTransitCloudScrollOrigin,
  resolveTransitCloudSpriteDest,
  resolveTransitCloudSpriteSize,
  resolveTransitNearbyNebulaPlanetId,
  resolveTransitSessionViewStart,
  rollTransitSessionViewSeed,
  TRANSIT_BAKED_FILL_ALPHA,
  TRANSIT_BAKED_NATIVE_PX,
  TRANSIT_CLOUD_LAYER_COUNT,
  TRANSIT_PARALLAX_TICK_MS,
  TRANSIT_SPACE_CD_COUNT,
  TRANSIT_SPACE_CD_NATIVE_PX,
  TRANSIT_STAR_COUNT,
  TRANSIT_STAR_STRIDE,
  fillTransitStarCatalog,
  writeTransitStarDraw,
} from '../../combat/transitCombatParallaxPlan';
import { registerCombatSkiaPresentationReclaim } from '../../combat/combatSkiaPresentationReclaim';
import { resolvePlanetNebulaBakedSource } from '../../game/planetNebulaBakedAssets';
import { registerGpuLayer, unregisterGpuLayer } from '../../game/planetStageGpuSupervisor';
import {
  commitSkPictureReactFrame,
  dropSkPictureReactFrame,
} from '../../game/skia/skiaMemoryLifecycle';
import { registerSkPictureFrameInvalidate } from '../../game/skia/skiaPictureFrameRegistry';
import { useWorldStore } from '../../store/worldStore';
import type { MissileHitFx } from '../planet/PlanetEdenRaidTestLayer';
import { drawNebulaColorDodgeFxTransformedOnSkCanvas } from '../planet/planetSkiaHitFxContract';

const FILL_COLOR = Skia.Color('#05070e');

let _parallaxRecorder: ReturnType<typeof Skia.PictureRecorder> | null = null;
let _fillPaint: SkPaint | null = null;
let _spacePaint: SkPaint | null = null;
let _cloudPaints: SkPaint[] | null = null;
let _cloudSrcRect: ReturnType<typeof Skia.XYWHRect> | null = null;
let _bakedSrcRect: ReturnType<typeof Skia.XYWHRect> | null = null;
let _scratchDestRects: ReturnType<typeof Skia.XYWHRect>[] | null = null;
let _scratchBounds: ReturnType<typeof Skia.XYWHRect> | null = null;
let _recordBounds: ReturnType<typeof Skia.XYWHRect> | null = null;
let _starCatalog: Float32Array | null = null;
let _starDrawScratch: Float32Array | null = null;
let _starDimPaint: SkPaint | null = null;
let _starBrightPaint: SkPaint | null = null;

function getParallaxRecorder() {
  if (!_parallaxRecorder) _parallaxRecorder = Skia.PictureRecorder();
  return _parallaxRecorder;
}

function getFillPaint(): SkPaint {
  if (!_fillPaint) {
    _fillPaint = Skia.Paint();
    _fillPaint.setAntiAlias(false);
    _fillPaint.setColor(FILL_COLOR);
  }
  return _fillPaint;
}

function getBakedPaint(): SkPaint {
  if (!_spacePaint) {
    _spacePaint = Skia.Paint();
    _spacePaint.setAntiAlias(true);
    _spacePaint.setAlphaf(TRANSIT_BAKED_FILL_ALPHA);
  }
  return _spacePaint;
}

function getCloudPaints(): SkPaint[] {
  if (_cloudPaints) return _cloudPaints;
  _cloudPaints = [];
  for (let i = 0; i < TRANSIT_CLOUD_LAYER_COUNT; i += 1) {
    const p = Skia.Paint();
    p.setAntiAlias(true);
    p.setBlendMode(BlendMode.Screen);
    _cloudPaints.push(p);
  }
  return _cloudPaints;
}

function getCloudSrcRect() {
  if (!_cloudSrcRect) {
    _cloudSrcRect = Skia.XYWHRect(0, 0, TRANSIT_SPACE_CD_NATIVE_PX, TRANSIT_SPACE_CD_NATIVE_PX);
  }
  return _cloudSrcRect;
}

function getBakedSrcRect() {
  if (!_bakedSrcRect) {
    _bakedSrcRect = Skia.XYWHRect(0, 0, TRANSIT_BAKED_NATIVE_PX, TRANSIT_BAKED_NATIVE_PX);
  }
  return _bakedSrcRect;
}

function scratchDestRect(slot: number, x: number, y: number, w: number, h: number) {
  if (!_scratchDestRects) {
    _scratchDestRects = [
      Skia.XYWHRect(0, 0, 1, 1),
      Skia.XYWHRect(0, 0, 1, 1),
      Skia.XYWHRect(0, 0, 1, 1),
      Skia.XYWHRect(0, 0, 1, 1),
      Skia.XYWHRect(0, 0, 1, 1),
      Skia.XYWHRect(0, 0, 1, 1),
    ];
  }
  const rect = _scratchDestRects[slot] ?? _scratchDestRects[0]!;
  rect.setXYWH(x, y, w, h);
  return rect;
}

function scratchBounds(w: number, h: number) {
  if (!_scratchBounds) _scratchBounds = Skia.XYWHRect(0, 0, w, h);
  else _scratchBounds.setXYWH(0, 0, w, h);
  return _scratchBounds;
}

function scratchRecordBounds(w: number, h: number) {
  if (!_recordBounds) _recordBounds = Skia.XYWHRect(0, 0, w, h);
  else _recordBounds.setXYWH(0, 0, w, h);
  return _recordBounds;
}

function getStarCatalog(): Float32Array {
  if (!_starCatalog) {
    _starCatalog = new Float32Array(TRANSIT_STAR_COUNT * TRANSIT_STAR_STRIDE);
    fillTransitStarCatalog(_starCatalog);
  }
  return _starCatalog;
}

function getStarDrawScratch(): Float32Array {
  if (!_starDrawScratch) _starDrawScratch = new Float32Array(4);
  return _starDrawScratch;
}

function getStarDimPaint(): SkPaint {
  if (!_starDimPaint) {
    _starDimPaint = Skia.Paint();
    _starDimPaint.setAntiAlias(true);
    _starDimPaint.setBlendMode(BlendMode.Screen);
    _starDimPaint.setColor(Skia.Color('#d8e6ff'));
  }
  return _starDimPaint;
}

function getStarBrightPaint(): SkPaint {
  if (!_starBrightPaint) {
    _starBrightPaint = Skia.Paint();
    _starBrightPaint.setAntiAlias(true);
    _starBrightPaint.setBlendMode(BlendMode.Screen);
    _starBrightPaint.setColor(Skia.Color('#fff6e4'));
  }
  return _starBrightPaint;
}

function drawTransitStarField(
  canvas: SkCanvas,
  canvasW: number,
  canvasH: number,
  elapsedSec: number,
  chromeTopH: number,
  chromeBottomY: number,
): void {
  const catalog = getStarCatalog();
  const scratch = getStarDrawScratch();
  const dim = getStarDimPaint();
  const bright = getStarBrightPaint();
  for (let i = 0; i < TRANSIT_STAR_COUNT; i += 1) {
    writeTransitStarDraw(catalog, i, canvasW, canvasH, elapsedSec, scratch);
    const x = scratch[0] ?? 0;
    const y = scratch[1] ?? 0;
    const r = scratch[2] ?? 0.7;
    const alpha = scratch[3] ?? 0.3;
    if (y < chromeTopH || y > chromeBottomY) continue;
    const paint = r >= 1.25 ? bright : dim;
    paint.setAlphaf(alpha);
    canvas.drawCircle(x, y, r, paint);
  }
}

function drawDriftingCloud(
  canvas: SkCanvas,
  image: SkImage,
  paint: SkPaint,
  dest: { x: number; y: number; w: number; h: number },
  canvasW: number,
  canvasH: number,
  slot: number,
): void {
  if (!intersectRects(dest.x, dest.y, dest.w, dest.h, 0, 0, canvasW, canvasH)) return;
  canvas.drawImageRect(
    image,
    getCloudSrcRect(),
    scratchDestRect(slot, dest.x, dest.y, dest.w, dest.h),
    paint,
  );
}

export const TransitCombatSkiaParallaxBackdrop = memo(function TransitCombatSkiaParallaxBackdrop({
  destSystemId,
  originSystemId = '',
  active = true,
  dodgeHitFxRef = null,
  dodgeTimeMsRef = null,
  dodgeOrbitSize = 0,
  dodgeOrbitOffsetX = 0,
  dodgeOrbitOffsetY = 0,
}: {
  destSystemId: string;
  originSystemId?: string;
  active?: boolean;
  dodgeHitFxRef?: React.MutableRefObject<MissileHitFx[]> | null;
  dodgeTimeMsRef?: React.MutableRefObject<number> | null;
  dodgeOrbitSize?: number;
  dodgeOrbitOffsetX?: number;
  dodgeOrbitOffsetY?: number;
}) {
  const mountedRef = useRef(true);
  const skiaLoopsActiveRef = useRef(true);
  const tickIdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pictureLiveRef = useRef<SkPicture | null>(null);
  const startedAtRef = useRef(Date.now());
  const sessionViewRef = useRef(resolveTransitSessionViewStart(rollTransitSessionViewSeed()));
  const selfWinRef = useRef({ x: 0, y: 0 });
  const [picture, setPicture] = useState<SkPicture | null>(null);
  const [gfxSize, setGfxSize] = useState({ w: 0, h: 0 });
  const gfxSizeRef = useRef({ w: 0, h: 0 });
  const dodgeRef = useRef({ size: 0, x: 0, y: 0 });
  dodgeRef.current = {
    size: dodgeOrbitSize,
    x: dodgeOrbitOffsetX,
    y: dodgeOrbitOffsetY,
  };
  const layoutRef = useRef({
    sprite: { w: 1, h: 1 },
    chrome: { topY: 0, topH: 0, bottomY: 0, bottomH: 0 },
    bake: { x: 0, y: 0, size: 0 },
  });
  const skipFlushTicksRef = useRef(0);
  const flushPictureRef = useRef<() => void>(() => {});

  const stopParallaxLoops = useCallback(() => {
    skiaLoopsActiveRef.current = false;
    if (tickIdRef.current != null) {
      clearInterval(tickIdRef.current);
      tickIdRef.current = null;
    }
  }, []);

  const destPlanetId = useWorldStore((s) => s.systems[destSystemId]?.planets[0]?.id ?? '');
  const destZone = useWorldStore((s) => s.systems[destSystemId]?.zone);
  const originPlanetId = useWorldStore((s) => s.systems[originSystemId]?.planets[0]?.id ?? '');
  const originZone = useWorldStore((s) => s.systems[originSystemId]?.zone);
  const nebulaPlanetId = useMemo(
    () =>
      resolveTransitNearbyNebulaPlanetId({
        originSystemId,
        destSystemId,
        getSystem: (id) => {
          const sys = useWorldStore.getState().systems[id];
          if (!sys) return undefined;
          return { planets: sys.planets, connections: sys.connections };
        },
      }),
    [destPlanetId, destSystemId, originPlanetId, originSystemId],
  );
  const bakedSource = useMemo(
    () => resolvePlanetNebulaBakedSource(nebulaPlanetId, destZone ?? originZone),
    [destZone, nebulaPlanetId, originZone],
  );
  const bakedSourceRef = useRef(bakedSource);
  bakedSourceRef.current = bakedSource;
  const cloudMotions = useMemo(() => resolveTransitCloudLayerMotions(), []);
  const cloudIndexBase = useMemo(() => pickTransitSpaceCdIndex(destSystemId), [destSystemId]);
  const cloudIndexBaseRef = useRef(cloudIndexBase);
  cloudIndexBaseRef.current = cloudIndexBase;
  const cloudMotionsRef = useRef(cloudMotions);
  cloudMotionsRef.current = cloudMotions;

  const bakedImage = useImage((bakedSource as any) ?? null);
  const cloud0 = useImage(TRANSIT_SPACE_CD_SOURCES[0]);
  const cloud1 = useImage(TRANSIT_SPACE_CD_SOURCES[1]);
  const cloud2 = useImage(TRANSIT_SPACE_CD_SOURCES[2]);
  const dodgeImage = useImage(require('../../../assets/images/effects/color_dodge_02.png'));

  const bakedImageRef = useRef<SkImage | null>(null);
  const cloudRefs = useRef<[SkImage | null, SkImage | null, SkImage | null]>([null, null, null]);
  const dodgeImageRef = useRef<SkImage | null>(null);

  useEffect(() => {
    bakedImageRef.current = bakedImage ?? null;
  }, [bakedImage]);
  useEffect(() => {
    cloudRefs.current[0] = cloud0 ?? null;
    cloudRefs.current[1] = cloud1 ?? null;
    cloudRefs.current[2] = cloud2 ?? null;
  }, [cloud0, cloud1, cloud2]);
  useEffect(() => {
    dodgeImageRef.current = dodgeImage ?? null;
  }, [dodgeImage]);
  // SkImage(useImage 반환) 수동 dispose 금지 — 훅이 수명을 자체 관리한다.

  useEffect(() => {
    if (!active) return;
    flushPictureRef.current();
  }, [active, bakedImage, cloud0, cloud1, cloud2, dodgeImage]);

  useEffect(() => {
    registerGpuLayer('skia_transit_parallax', 'T0');
    return () => {
      unregisterGpuLayer('skia_transit_parallax');
    };
  }, []);

  flushPictureRef.current = () => {
    const canvasW = gfxSizeRef.current.w;
    const canvasH = gfxSizeRef.current.h;
    if (!mountedRef.current || !skiaLoopsActiveRef.current || canvasW <= 0 || canvasH <= 0) return;
    const nebulaReady = areTransitNebulaLayersReady({
      clouds: cloudRefs.current,
      indexBase: cloudIndexBaseRef.current,
      cloudIndexBias: sessionViewRef.current.cloudIndexBias,
      bakedRequired: Boolean(bakedSourceRef.current),
      baked: bakedImageRef.current,
    });
    if (!nebulaReady) return;
    if (skipFlushTicksRef.current > 0) {
      if (pictureLiveRef.current) {
        skipFlushTicksRef.current -= 1;
        return;
      }
      skipFlushTicksRef.current = 0;
    }

    const view = sessionViewRef.current;
    const elapsedSec = (Date.now() - startedAtRef.current) / 1000;
    const starElapsedSec = elapsedSec + view.starElapsedBiasSec;
    const recorder = getParallaxRecorder();
    const canvas = recorder.beginRecording(scratchRecordBounds(canvasW, canvasH));
    canvas.drawRect(scratchBounds(canvasW, canvasH), getFillPaint());

    const baked = bakedImageRef.current;
    const bake = layoutRef.current.bake;
    if (baked && bake.size > 0) {
      canvas.drawImageRect(
        baked,
        getBakedSrcRect(),
        scratchDestRect(0, bake.x, bake.y, bake.size, bake.size),
        getBakedPaint(),
      );
    }

    const chrome = layoutRef.current.chrome;
    drawTransitStarField(
      canvas,
      canvasW,
      canvasH,
      starElapsedSec,
      chrome.topH,
      chrome.bottomY,
    );

    const cloudPaints = getCloudPaints();
    const sprite = layoutRef.current.sprite;
    const motions = cloudMotionsRef.current;
    const indexBase = cloudIndexBaseRef.current;
    for (let i = 0; i < TRANSIT_CLOUD_LAYER_COUNT; i += 1) {
      const img = cloudRefs.current[(indexBase + view.cloudIndexBias + i) % TRANSIT_SPACE_CD_COUNT];
      const motion = motions[i];
      const paint = cloudPaints[i];
      if (!img || !motion || !paint) continue;
      paint.setAlphaf(motion.alpha);
      const origin = resolveTransitCloudScrollOrigin({
        spriteW: sprite.w,
        spriteH: sprite.h,
        elapsedSec,
        vx: motion.vx,
        vy: motion.vy,
        wrapPhaseFrac: motion.wrapPhaseFrac,
        sessionStartFrac: view.cloudStartFrac,
      });
      const dest = resolveTransitCloudSpriteDest({
        canvasW,
        canvasH,
        spriteW: sprite.w,
        spriteH: sprite.h,
        ox: origin.ox,
        oy: origin.oy,
      });
      drawDriftingCloud(canvas, img, paint, dest, canvasW, canvasH, i);
    }

    if (chrome.topH > 0) {
      canvas.drawRect(
        scratchDestRect(0, 0, chrome.topY, canvasW, chrome.topH),
        getFillPaint(),
      );
    }
    if (chrome.bottomH > 0) {
      canvas.drawRect(
        scratchDestRect(1, 0, chrome.bottomY, canvasW, chrome.bottomH),
        getFillPaint(),
      );
    }

    const dodge = dodgeImageRef.current;
    const fxList = dodgeHitFxRef?.current ?? [];
    const tMs = dodgeTimeMsRef?.current ?? 0;
    const dodgeNow = dodgeRef.current;
    if (dodge && dodgeNow.size > 0 && fxList.length > 0) {
      drawNebulaColorDodgeFxTransformedOnSkCanvas(canvas, dodge, fxList, tMs, {
        nebulaSize: dodgeNow.size,
        orbitSize: dodgeNow.size,
        orbitOffsetX: dodgeNow.x - selfWinRef.current.x,
        orbitOffsetY: dodgeNow.y - selfWinRef.current.y,
        scaleX: 1,
        scaleY: 1,
      });
    }

    if (!mountedRef.current || !skiaLoopsActiveRef.current) {
      recorder.finishRecordingAsPicture();
      return;
    }
    const next = recorder.finishRecordingAsPicture();
    if (!mountedRef.current || !skiaLoopsActiveRef.current) return;
    commitSkPictureReactFrame({
      liveRef: pictureLiveRef,
      setPicture,
      next,
    });
  };

  useEffect(() => {
    return registerSkPictureFrameInvalidate(() => {
      stopParallaxLoops();
      dropSkPictureReactFrame({ liveRef: pictureLiveRef, setPicture });
    });
  }, [stopParallaxLoops]);

  useEffect(() => {
    return registerCombatSkiaPresentationReclaim(() => {
      stopParallaxLoops();
      dropSkPictureReactFrame({ liveRef: pictureLiveRef, setPicture });
    });
  }, [stopParallaxLoops]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      stopParallaxLoops();
      mountedRef.current = false;
      setTimeout(() => {
        dropSkPictureReactFrame({ liveRef: pictureLiveRef, setPicture });
      }, 16);
    };
  }, [stopParallaxLoops]);

  useEffect(() => {
    if (!active) {
      stopParallaxLoops();
      return undefined;
    }
    skiaLoopsActiveRef.current = true;
    startedAtRef.current = Date.now();
    sessionViewRef.current = resolveTransitSessionViewStart(rollTransitSessionViewSeed());
    flushPictureRef.current();
    tickIdRef.current = setInterval(() => {
      flushPictureRef.current();
    }, TRANSIT_PARALLAX_TICK_MS);
    return () => {
      if (tickIdRef.current != null) {
        clearInterval(tickIdRef.current);
        tickIdRef.current = null;
      }
    };
  }, [active, stopParallaxLoops]);

  const rootRef = useRef<View>(null);
  const handleGfxLayout = useCallback((event: { nativeEvent: { layout: { width: number; height: number } } }) => {
    const nextW = Math.max(0, Math.floor(event.nativeEvent.layout.width));
    const nextH = Math.max(0, Math.floor(event.nativeEvent.layout.height));
    gfxSizeRef.current = { w: nextW, h: nextH };
    layoutRef.current = {
      sprite: resolveTransitCloudSpriteSize(nextW, nextH),
      chrome: resolveTransitChromeCoverBands(nextH),
      bake: resolveTransitBakedFillBox(nextW, nextH),
    };
    setGfxSize((prev) => {
      if (prev.w === nextW && prev.h === nextH) return prev;
      if (prev.w > 0 && prev.h > 0) skipFlushTicksRef.current = 2;
      return { w: nextW, h: nextH };
    });
    rootRef.current?.measureInWindow((x, y) => {
      selfWinRef.current = { x, y };
    });
    flushPictureRef.current();
  }, []);

  return (
    <View ref={rootRef} style={styles.root} pointerEvents="none" onLayout={handleGfxLayout}>
      {gfxSize.w > 0 && gfxSize.h > 0 ? (
        <Canvas style={{ width: gfxSize.w, height: gfxSize.h }}>
          {picture ? <Picture picture={picture} /> : null}
        </Canvas>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
  },
});
