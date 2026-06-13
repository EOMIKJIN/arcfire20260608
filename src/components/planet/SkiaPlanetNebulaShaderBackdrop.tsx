import React, { memo, useEffect, useState } from 'react';
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
import type { MissileHitFx } from './PlanetEdenRaidTestLayer';

const DODGE_HIT_FX_DURATION_MS = 203;
const DODGE_HIT_FX_RENDER_LIMIT = 12;

function resolveDodgeFxDurationMs(fx: MissileHitFx): number {
  if (fx.effectKind === 'laser_dodge') return Math.max(1, Math.round(DODGE_HIT_FX_DURATION_MS * 0.5));
  return DODGE_HIT_FX_DURATION_MS;
}

function resolveDodgeFxSizeScale(fx: MissileHitFx): number {
  if (fx.effectKind === 'laser_dodge') return 0.5;
  return 1;
}

/** 메인·전투 스테이지 Skia 성운 — 행성별 베이크 PNG + 선택적 배경·명중 FX. */
export const SkiaPlanetNebulaShaderBackdrop = memo(function SkiaPlanetNebulaShaderBackdrop({
  size,
  active,
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
}: {
  size: number;
  active: boolean;
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
}) {
  const [frameTickMs, setFrameTickMs] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return () => {};
    const id = setInterval(() => {
      if (!active) return;
      let needsRedraw = false;
      if (dodgeHitFxRef?.current?.length) {
        const t = dodgeTimeMsRef?.current ?? 0;
        const fxList = dodgeHitFxRef.current;
        for (let i = 0; i < fxList.length; i += 1) {
          const fx = fxList[i]!;
          const age = t - fx.startMs;
          if (age >= 0 && age <= resolveDodgeFxDurationMs(fx)) {
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
  }, [active, dodgeHitFxRef, dodgeTimeMsRef, sessionPlanetId]);

  void frameTickMs;

  const nebulaImage = useImage((nebulaBakedImageSource as any) ?? null);
  const backdropImage = useImage((backgroundImageSource as any) ?? null);
  const dodgeImage = useImage(require('../../../assets/images/effects/color_dodge_02.png'));
  const dodgeHitFx = dodgeHitFxRef?.current;
  const dodgeTimeMs = dodgeTimeMsRef?.current ?? 0;
  const canRenderDodgeHitFx = Boolean(dodgeHitFx && dodgeOrbitSize > 0 && dodgeImage);
  const showNebulaBaked = renderNebulaShader && Boolean(nebulaImage);
  const showBackdropImage = Boolean(backdropImage);
  const fillWhenEmpty = !showNebulaBaked && !showBackdropImage;

  useEffect(() => {
    return () => {
      try {
        (nebulaImage as unknown as { dispose?: () => void })?.dispose?.();
      } catch {
        /* SkImage.dispose 미지원·이중 호출 방어 */
      }
    };
  }, [nebulaImage]);

  useEffect(() => {
    return () => {
      try {
        (backdropImage as unknown as { dispose?: () => void })?.dispose?.();
      } catch {
        /* SkImage.dispose 미지원·이중 호출 방어 */
      }
    };
  }, [backdropImage]);

  useEffect(() => {
    return () => {
      try {
        (dodgeImage as unknown as { dispose?: () => void })?.dispose?.();
      } catch {
        /*同上*/
      }
    };
  }, [dodgeImage]);

  return (
    <View style={styles.root} pointerEvents="none">
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
              const fxDurationMs = resolveDodgeFxDurationMs(fx);
              if (age < 0 || age > fxDurationMs) continue;
              const t01 = Math.max(0, Math.min(1, age / fxDurationMs));
              const pulse = 1 - Math.abs(t01 * 2 - 1);
              const baseSizeScale = resolveDodgeFxSizeScale(fx);
              const pulseScale = (0.72 + pulse * 0.85) * baseSizeScale;
              const pulseSize = 60 * pulseScale;
              const pulseOpacity = Math.max(0, 1 - Math.pow(t01, 0.58));
              if (pulseOpacity < 0.015) continue;
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
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
  },
});
