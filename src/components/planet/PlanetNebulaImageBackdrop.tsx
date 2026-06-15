/**
 * 행성 허브·전투 배경 — 베이크 성운 PNG + 테이블 배경을 RN Image로 표시.
 * (구 Skia Canvas ~1400px GL 서피스 제거 — idle PSS 절감. 시각은 cover·opacity 동일.)
 */
import React, { memo } from 'react';
import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native';

const NEBULA_EMPTY_FILL = '#0a0f18';

type Props = {
  size: number;
  nebulaBakedImageSource?: ImageSourcePropType | null;
  renderNebulaLayer?: boolean;
  backgroundImageSource?: ImageSourcePropType | null;
  /** 드론 dodge Skia 교차 페이드 — 0이면 RN Image 숨김 */
  opacity?: number;
};

export const PlanetNebulaImageBackdrop = memo(function PlanetNebulaImageBackdrop({
  size,
  nebulaBakedImageSource = null,
  renderNebulaLayer = true,
  backgroundImageSource = null,
  opacity = 1,
}: Props) {
  const showNebula = renderNebulaLayer && nebulaBakedImageSource != null;
  const showBackdrop = backgroundImageSource != null;
  const fillWhenEmpty = !showNebula && !showBackdrop;

  return (
    <View
      style={[
        styles.root,
        {
          width: size,
          height: size,
          opacity,
          backgroundColor: fillWhenEmpty ? NEBULA_EMPTY_FILL : 'transparent',
        },
      ]}
      pointerEvents="none"
    >
      {showBackdrop ? (
        <Image
          source={backgroundImageSource}
          style={[styles.layer, styles.backdropImage]}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      ) : null}
      {showNebula ? (
        <Image
          source={nebulaBakedImageSource}
          style={styles.layer}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  backdropImage: {
    opacity: 0.42,
  },
});
