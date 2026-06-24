import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, type ImageSourcePropType } from 'react-native';
import {
  Canvas,
  Fill,
  Image as SkiaImage,
  Picture,
  Skia,
  useImage,
} from '@shopify/react-native-skia';
import type { SkImage, SkPicture } from '@shopify/react-native-skia';
import { registerPlanetSessionResource } from '../../game/planetSessionRegistry';
import { registerGpuLayer, unregisterGpuLayer } from '../../game/planetStageGpuSupervisor';
import {
  scheduleSkPictureDispose,
  safeSkiaDispose,
} from '../../game/skia/skiaMemoryLifecycle';
import type { MissileHitFx } from './PlanetEdenRaidTestLayer';
import { INBOUND_DRONE_FX_ORBIT_AGE_SLOP_MS } from './planetSkiaHitFxContract';
import {
  drawNebulaColorDodgeFxTransformedOnSkCanvas,
  resolveNebulaDodgeFxDurationMs,
} from './planetSkiaHitFxContract';

const DODGE_FX_TICK_MS = 50;

function nebulaDodgeFxNeedsRedraw(
  hitFxList: readonly MissileHitFx[],
  tMs: number,
): boolean {
  for (let i = 0; i < hitFxList.length; i += 1) {
    const fx = hitFxList[i]!;
    const age = tMs - fx.startMs;
    if (age >= -INBOUND_DRONE_FX_ORBIT_AGE_SLOP_MS && age <= resolveNebulaDodgeFxDurationMs(fx)) {
      return true;
    }
  }
  return false;
}

let _nebulaDodgeRecorder: ReturnType<typeof Skia.PictureRecorder> | null = null;

function getNebulaDodgeRecorder() {
  if (!_nebulaDodgeRecorder) _nebulaDodgeRecorder = Skia.PictureRecorder();
  return _nebulaDodgeRecorder;
}

function recordNebulaDodgeFxPicture(input: {
  size: number;
  dodgeImage: SkImage;
  hitFxList: readonly MissileHitFx[];
  tMs: number;
  dodgeOrbitSize: number;
  dodgeOrbitVisualScaleX: number;
  dodgeOrbitVisualScaleY: number;
  dodgeOrbitOffsetX: number;
  dodgeOrbitOffsetY: number;
}): SkPicture | null {
  const recorder = getNebulaDodgeRecorder();
  const canvas = recorder.beginRecording(Skia.XYWHRect(0, 0, input.size, input.size));
  const drew = drawNebulaColorDodgeFxTransformedOnSkCanvas(
    canvas,
    input.dodgeImage,
    input.hitFxList,
    input.tMs,
    {
      nebulaSize: input.size,
      orbitSize: input.dodgeOrbitSize,
      orbitOffsetX: input.dodgeOrbitOffsetX,
      orbitOffsetY: input.dodgeOrbitOffsetY,
      scaleX: input.dodgeOrbitVisualScaleX,
      scaleY: input.dodgeOrbitVisualScaleY,
    },
  );
  const pic = recorder.finishRecordingAsPicture();
  if (!drew) {
    safeSkiaDispose(pic);
    return null;
  }
  return pic;
}

/** @deprecated 행·전투 배경은 `PlanetNebulaImageBackdrop`(RN Image). dodge FX는 단일 Picture. */
export const SkiaPlanetNebulaShaderBackdrop = memo(function SkiaPlanetNebulaShaderBackdrop({
  size,
  active = true,
  dodgeFxActive,
  nebulaBakedImageSource = null,
  renderNebulaShader = true,
  backgroundImageSource = null,
  dodgeHitFxRef = null,
  dodgeTimeMsRef = null,
  dodgeOrbitSize = 0,
  dodgeOrbitVisualScaleX = 1,
  dodgeOrbitVisualScaleY = 1,
  dodgeOrbitOffsetX = 0,
  dodgeOrbitOffsetY = 0,
  sessionPlanetId = null,
  onNebulaImagesReady,
  onNebulaImagesLost,
  opacity = 1,
  hideUntilImagesReady = false,
  dodgeFxOnlyOverlay = false,
}: {
  size: number;
  active?: boolean;
  dodgeFxActive?: boolean;
  dodgeFxOnlyOverlay?: boolean;
  nebulaBakedImageSource?: ImageSourcePropType | null;
  renderNebulaShader?: boolean;
  backgroundImageSource?: unknown;
  dodgeHitFxRef?: React.MutableRefObject<MissileHitFx[]> | null;
  dodgeTimeMsRef?: React.MutableRefObject<number> | null;
  dodgeOrbitSize?: number;
  dodgeOrbitVisualScaleX?: number;
  dodgeOrbitVisualScaleY?: number;
  dodgeOrbitOffsetX?: number;
  dodgeOrbitOffsetY?: number;
  sessionPlanetId?: string | null;
  onNebulaImagesReady?: () => void;
  onNebulaImagesLost?: () => void;
  opacity?: number;
  hideUntilImagesReady?: boolean;
}) {
  const fxLoopActive = dodgeFxActive ?? active;
  const loadNebulaImages = true;
  const mountedRef = useRef(true);
  const skiaLoopsActiveRef = useRef(true);
  const dodgePictureLiveRef = useRef<SkPicture | null>(null);
  const imagesReadyNotifiedRef = useRef(false);
  const everReadyRef = useRef(false);
  const [dodgePicture, setDodgePicture] = useState<SkPicture | null>(null);

  const nebulaImage = useImage(loadNebulaImages && renderNebulaShader ? ((nebulaBakedImageSource as any) ?? null) : null);
  const backdropImage = useImage(loadNebulaImages && backgroundImageSource ? (backgroundImageSource as any) : null);
  const dodgeImage = useImage(require('../../../assets/images/effects/color_dodge_02.png'));
  const dodgeImageRef = useRef<SkImage | null>(null);
  useEffect(() => {
    dodgeImageRef.current = dodgeImage ?? null;
  }, [dodgeImage]);
  // SkImage(useImage 반환) 수동 dispose 금지 — 훅이 수명을 자체 관리한다.

  useEffect(() => {
    if (!fxLoopActive) return undefined;
    registerGpuLayer('skia_nebula_backdrop', 'T0');
    return () => {
      unregisterGpuLayer('skia_nebula_backdrop');
    };
  }, [fxLoopActive]);

  const flushDodgePicture = useCallback(() => {
    if (!mountedRef.current || !skiaLoopsActiveRef.current) return;
    const img = dodgeImageRef.current;
    const fxList = dodgeHitFxRef?.current ?? [];
    const tMs = dodgeTimeMsRef?.current ?? 0;
    if (!img || dodgeOrbitSize <= 0 || fxList.length === 0) {
      const live = dodgePictureLiveRef.current;
      if (live != null) {
        dodgePictureLiveRef.current = null;
        setDodgePicture(null);
        scheduleSkPictureDispose(live);
      }
      return;
    }
    if (!nebulaDodgeFxNeedsRedraw(fxList, tMs)) {
      return;
    }
    const next = recordNebulaDodgeFxPicture({
      size,
      dodgeImage: img,
      hitFxList: fxList,
      tMs,
      dodgeOrbitSize,
      dodgeOrbitVisualScaleX,
      dodgeOrbitVisualScaleY,
      dodgeOrbitOffsetX,
      dodgeOrbitOffsetY,
    });
    if (!next) return;
    const prev = dodgePictureLiveRef.current;
    dodgePictureLiveRef.current = next;
    setDodgePicture(next);
    if (prev != null && prev !== next) {
      scheduleSkPictureDispose(prev);
    }
  }, [
    dodgeHitFxRef,
    dodgeTimeMsRef,
    dodgeOrbitOffsetX,
    dodgeOrbitOffsetY,
    dodgeOrbitSize,
    dodgeOrbitVisualScaleX,
    dodgeOrbitVisualScaleY,
    size,
  ]);

  useEffect(() => {
    if (!loadNebulaImages) return;
    imagesReadyNotifiedRef.current = false;
  }, [loadNebulaImages, nebulaBakedImageSource, backgroundImageSource, renderNebulaShader]);

  useEffect(() => {
    if (!loadNebulaImages || imagesReadyNotifiedRef.current || !onNebulaImagesReady) return;
    if (dodgeFxOnlyOverlay) return;
    const nebulaOk = !renderNebulaShader || !nebulaBakedImageSource || Boolean(nebulaImage);
    const backdropOk = !backgroundImageSource || Boolean(backdropImage);
    if (!nebulaOk || !backdropOk) return;
    imagesReadyNotifiedRef.current = true;
    onNebulaImagesReady();
  }, [
    loadNebulaImages,
    backdropImage,
    backgroundImageSource,
    nebulaBakedImageSource,
    nebulaImage,
    onNebulaImagesReady,
    renderNebulaShader,
    dodgeFxOnlyOverlay,
  ]);

  const showNebulaBaked = loadNebulaImages && renderNebulaShader && Boolean(nebulaImage);
  const showBackdropImage = loadNebulaImages && Boolean(backdropImage);
  const imagesReady =
    (!renderNebulaShader || !nebulaBakedImageSource || Boolean(nebulaImage))
    && (!backgroundImageSource || Boolean(backdropImage));
  const deferCanvas = hideUntilImagesReady && !imagesReady;

  useEffect(() => {
    if (dodgeFxOnlyOverlay) return;
    if (imagesReady) {
      everReadyRef.current = true;
    } else if (everReadyRef.current) {
      everReadyRef.current = false;
      imagesReadyNotifiedRef.current = false;
      onNebulaImagesLost?.();
    }
  }, [dodgeFxOnlyOverlay, imagesReady, onNebulaImagesLost]);

  useEffect(() => {
    if (!dodgeFxOnlyOverlay || !onNebulaImagesReady) return;
    if (!imagesReady) {
      if (imagesReadyNotifiedRef.current) {
        imagesReadyNotifiedRef.current = false;
        onNebulaImagesLost?.();
      }
      return;
    }
    if (imagesReadyNotifiedRef.current) return;
    imagesReadyNotifiedRef.current = true;
    onNebulaImagesReady();
  }, [dodgeFxOnlyOverlay, imagesReady, onNebulaImagesReady, onNebulaImagesLost]);

  useEffect(() => {
    mountedRef.current = true;
    skiaLoopsActiveRef.current = true;
    return () => {
      skiaLoopsActiveRef.current = false;
      mountedRef.current = false;
      setTimeout(() => {
        const live = dodgePictureLiveRef.current;
        dodgePictureLiveRef.current = null;
        scheduleSkPictureDispose(live);
        if (_nebulaDodgeRecorder) {
          safeSkiaDispose(_nebulaDodgeRecorder as unknown as { dispose?: () => void });
          _nebulaDodgeRecorder = null;
        }
      }, 16);
    };
  }, []);

  useEffect(() => {
    if (!fxLoopActive) return undefined;
    const id = setInterval(() => {
      if (!skiaLoopsActiveRef.current) return;
      flushDodgePicture();
    }, DODGE_FX_TICK_MS);
    const sessionToken = sessionPlanetId
      ? registerPlanetSessionResource({
        ownerId: 'skia_nebula_dodge_fx_tick',
        planetId: sessionPlanetId,
        dispose: () => clearInterval(id),
      })
      : null;
    return () => {
      clearInterval(id);
      sessionToken?.release();
    };
  }, [fxLoopActive, sessionPlanetId, flushDodgePicture]);

  useEffect(() => {
    flushDodgePicture();
  }, [flushDodgePicture, dodgeHitFxRef, dodgeTimeMsRef]);

  if (dodgeFxOnlyOverlay && !fxLoopActive) {
    return <View style={[styles.root, { opacity, width: size, height: size }]} pointerEvents="none" />;
  }

  const fillWhenEmpty =
    !dodgeFxOnlyOverlay && !showNebulaBaked && !showBackdropImage && !everReadyRef.current;

  return (
    <View style={[styles.root, { opacity, width: size, height: size }]} pointerEvents="none">
      {deferCanvas ? null : (
        <Canvas style={{ width: size, height: size }}>
          {fillWhenEmpty ? <Fill color="#0a0f18" /> : null}
          {showBackdropImage ? (
            <SkiaImage
              image={backdropImage}
              x={0}
              y={0}
              width={size}
              height={size}
              fit="cover"
              opacity={0.42}
            />
          ) : null}
          {showNebulaBaked ? (
            <SkiaImage
              image={nebulaImage}
              x={0}
              y={0}
              width={size}
              height={size}
              fit="cover"
            />
          ) : null}
          {dodgePicture ? <Picture picture={dodgePicture} /> : null}
        </Canvas>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
  },
});
