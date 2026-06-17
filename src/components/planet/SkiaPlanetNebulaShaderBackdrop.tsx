import React, { memo, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, type ImageSourcePropType } from 'react-native';
import {
  Canvas,
  Fill,
  Group,
  Image as SkiaImage,
  Paint,
  useImage,
} from '@shopify/react-native-skia';
import { registerPlanetSessionResource } from '../../game/planetSessionRegistry';
import { registerGpuLayer, unregisterGpuLayer } from '../../game/planetStageGpuSupervisor';
import type { MissileHitFx } from './PlanetEdenRaidTestLayer';
import { INBOUND_DRONE_FX_ORBIT_AGE_SLOP_MS } from './planetSkiaHitFxContract';
import {
  NEBULA_DODGE_FX_RENDER_LIMIT,
  resolveNebulaDodgeFxDurationMs,
  resolveNebulaDodgeFxPulse,
  resolveNebulaDodgeFxSizeScale,
} from './planetSkiaHitFxContract';

const DODGE_HIT_FX_RENDER_LIMIT = NEBULA_DODGE_FX_RENDER_LIMIT;

/** @deprecated 행·전투 배경은 `PlanetNebulaImageBackdrop`(RN Image). dodge FX는 궤도 SkPicture. */
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
  opacity = 1,
  /** true — useImage 프리로드만, Canvas·dark Fill 미생성(깜박임 방지) */
  hideUntilImagesReady = false,
}: {
  size: number;
  /** @deprecated dodgeFxActive 사용 — GPU·interval 게이트 */
  active?: boolean;
  /** colorDodge FX tick·GPU supervisor — idle prefetch 시 false */
  dodgeFxActive?: boolean;
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
  /** Stage 1 행성 허브 — setInterval을 planet session dispose에 연동 */
  sessionPlanetId?: string | null;
  /** Skia useImage 프리로드 완료 — Canvas·dark Fill 미생성(깜박임 방지) */
  onNebulaImagesReady?: () => void;
  opacity?: number;
  hideUntilImagesReady?: boolean;
}) {
  const fxLoopActive = dodgeFxActive ?? active;
  const [frameTickMs, setFrameTickMs] = useState(() => Date.now());
  const imagesReadyNotifiedRef = useRef(false);

  useEffect(() => {
    if (!fxLoopActive) return undefined;
    registerGpuLayer('skia_nebula_backdrop', 'T0');
    return () => {
      unregisterGpuLayer('skia_nebula_backdrop');
    };
  }, [fxLoopActive]);

  useEffect(() => {
    if (!fxLoopActive) return () => {};
    const id = setInterval(() => {
      if (!fxLoopActive) return;
      let needsRedraw = false;
      if (dodgeHitFxRef?.current?.length) {
        const t = dodgeTimeMsRef?.current ?? 0;
        const fxList = dodgeHitFxRef.current;
        for (let i = 0; i < fxList.length; i += 1) {
          const fx = fxList[i]!;
          const age = t - fx.startMs;
          if (age >= -INBOUND_DRONE_FX_ORBIT_AGE_SLOP_MS && age <= resolveNebulaDodgeFxDurationMs(fx)) {
            needsRedraw = true;
            break;
          }
        }
      }
      if (needsRedraw) setFrameTickMs(Date.now());
    }, 50);
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
  }, [fxLoopActive, dodgeHitFxRef, dodgeTimeMsRef, sessionPlanetId]);

  void frameTickMs;

  const nebulaImage = useImage((nebulaBakedImageSource as any) ?? null);
  const backdropImage = useImage((backgroundImageSource as any) ?? null);
  const dodgeImage = useImage(require('../../../assets/images/effects/color_dodge_02.png'));

  useEffect(() => {
    imagesReadyNotifiedRef.current = false;
  }, [nebulaBakedImageSource, backgroundImageSource, renderNebulaShader]);

  useEffect(() => {
    if (imagesReadyNotifiedRef.current || !onNebulaImagesReady) return;
    const nebulaOk = !renderNebulaShader || !nebulaBakedImageSource || Boolean(nebulaImage);
    const backdropOk = !backgroundImageSource || Boolean(backdropImage);
    if (!nebulaOk || !backdropOk) return;
    imagesReadyNotifiedRef.current = true;
    onNebulaImagesReady();
  }, [
    backdropImage,
    backgroundImageSource,
    nebulaBakedImageSource,
    nebulaImage,
    onNebulaImagesReady,
    renderNebulaShader,
  ]);
  const dodgeHitFx = dodgeHitFxRef?.current;
  const dodgeTimeMs = dodgeTimeMsRef?.current ?? 0;
  const canRenderDodgeHitFx = Boolean(dodgeHitFx && dodgeOrbitSize > 0 && dodgeImage);
  const showNebulaBaked = renderNebulaShader && Boolean(nebulaImage);
  const showBackdropImage = Boolean(backdropImage);
  const imagesReady =
    (!renderNebulaShader || !nebulaBakedImageSource || Boolean(nebulaImage))
    && (!backgroundImageSource || Boolean(backdropImage));
  const fillWhenEmpty = !showNebulaBaked && !showBackdropImage;
  const deferCanvas = hideUntilImagesReady && !imagesReady;

  // SkImage(useImage 반환) 수동 dispose 금지 — 훅이 언마운트·소스 변경 시 수명을 자체 관리한다.
  // 수동 .dispose()는 <SkiaImage>(JsiImageNode)가 아직 참조 중인 SkImage를 조기 해제해
  // 이중 해제(use-after-free)를 유발하고, GC FinalizerDaemon 의 JsiImageNode 파괴 시
  // SIGSEGV(null deref)로 이어진다(2026-06-17 크래시). 해제는 react-native-skia 가 담당.

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
        {canRenderDodgeHitFx
          ? (() => {
            const nodes: React.ReactNode[] = [];
            for (let i = dodgeHitFx!.length - 1; i >= 0; i -= 1) {
              if (nodes.length >= DODGE_HIT_FX_RENDER_LIMIT) break;
              const fx = dodgeHitFx![i]!;
              const age = dodgeTimeMs - fx.startMs;
              const fxDurationMs = resolveNebulaDodgeFxDurationMs(fx);
              if (age < -INBOUND_DRONE_FX_ORBIT_AGE_SLOP_MS || age > fxDurationMs) continue;
              const pulse = resolveNebulaDodgeFxPulse(
                age,
                fxDurationMs,
                resolveNebulaDodgeFxSizeScale(fx),
              );
              if (!pulse) continue;
              const { pulseSize, pulseOpacity } = pulse;
              const orbitCenter = dodgeOrbitSize / 2;
              const px = size / 2 + dodgeOrbitOffsetX + (fx.x - orbitCenter) * dodgeOrbitVisualScaleX;
              const py = size / 2 + dodgeOrbitOffsetY + (fx.y - orbitCenter) * dodgeOrbitVisualScaleY;
              nodes.push(
                <Group key={`nebula-hit-${fx.id}-${fx.startMs}`} layer={<Paint blendMode="colorDodge" opacity={pulseOpacity} />}>
                  <SkiaImage
                    image={dodgeImage!}
                    x={px - pulseSize * 0.5}
                    y={py - pulseSize * 0.5}
                    width={pulseSize}
                    height={pulseSize}
                  />
                </Group>,
              );
            }
            return nodes;
          })()
          : null}
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
