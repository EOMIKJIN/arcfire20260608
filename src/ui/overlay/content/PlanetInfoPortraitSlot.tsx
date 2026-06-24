import React, { memo, useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { findPlanetById } from '../../../arcCore/planetEnvironment/resolvePlanetAsteroidVisualPolicy';
import { resolvePlanetBackdropSource } from '../../../game/planetBackdropAssets';
import { useT } from '../../../i18n';
import { OVERLAY_TOKENS } from '../../../utils/theme';

/** 행성 정보창 — 추후 행성 비주얼 PNG/Image 연동용 고정 슬롯 높이 */
export const PLANET_INFO_PORTRAIT_SLOT_HEIGHT_PX = 132;

type Props = {
  planetId: string;
};

/**
 * 행성 정보 오버레이 — 헤더 바로 아래 카드 전폭 이미지.
 * `ArcOverlayCard.panelBleedPrefix` 슬롯에 배치 (bodyPanel padding 밖).
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
    alignSelf: 'stretch',
    width: '100%',
    height: PLANET_INFO_PORTRAIT_SLOT_HEIGHT_PX,
    overflow: 'hidden',
  },
  frameEmpty: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(107, 212, 255, 0.22)',
    backgroundColor: 'rgba(8, 18, 28, 0.55)',
  },
  frameFilled: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: OVERLAY_TOKENS.phosphorBorder,
    backgroundColor: 'rgba(8, 18, 28, 0.72)',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
});
