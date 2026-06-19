import React, { memo, useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { findPlanetById } from '../../../arcCore/planetEnvironment/resolvePlanetAsteroidVisualPolicy';
import { resolvePlanetBackdropSource } from '../../../game/planetBackdropAssets';
import { useT } from '../../../i18n';
import { OVERLAY_TOKENS, SPACING } from '../../../utils/theme';

/** 행성 정보창 — 추후 행성 비주얼 PNG/Image 연동용 고정 슬롯 높이 */
export const PLANET_INFO_PORTRAIT_SLOT_HEIGHT_PX = 132;

type Props = {
  planetId: string;
};

/**
 * 행성 정보 오버레이 — 제목·서브 설명 아래, PGP 배너 위 직사각형 이미지 영역.
 * `planets.csv` backdropImageAssetKey 가 있으면 즉시 표시, 없으면 빈 프레임 유지.
 */
export const PlanetInfoPortraitSlot = memo(function PlanetInfoPortraitSlot({ planetId }: Props) {
  const t = useT();
  const a11yLabel = t('econInfo.portraitSlotA11y');
  const imageSource = useMemo(() => {
    const planet = findPlanetById(planetId);
    return resolvePlanetBackdropSource(planet?.backdropImageAssetKey);
  }, [planetId]);

  if (imageSource) {
    return (
      <View style={[styles.frame, styles.frameFilled]}>
        <Image
          source={imageSource}
          style={styles.image}
          resizeMode="cover"
          accessibilityRole="image"
          accessibilityLabel={a11yLabel}
        />
      </View>
    );
  }

  return (
    <View
      style={[styles.frame, styles.frameEmpty]}
      accessible
      accessibilityLabel={a11yLabel}
    />
  );
});

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    height: PLANET_INFO_PORTRAIT_SLOT_HEIGHT_PX,
    marginTop: SPACING.md,
    borderRadius: 4,
    overflow: 'hidden',
  },
  frameEmpty: {
    borderWidth: 1,
    borderColor: 'rgba(107, 212, 255, 0.22)',
    backgroundColor: 'rgba(8, 18, 28, 0.55)',
  },
  frameFilled: {
    borderWidth: 1,
    borderColor: OVERLAY_TOKENS.phosphorBorder,
    backgroundColor: 'rgba(8, 18, 28, 0.72)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
