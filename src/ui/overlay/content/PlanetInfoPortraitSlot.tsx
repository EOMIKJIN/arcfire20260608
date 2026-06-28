import React, { memo, useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useAppSettingsStore } from '../../../store/appSettingsStore';
import { resolvePlanetInfoPanelPresentation } from '../../../game/planetHub/resolvePlanetInfoPanelStage';
import {
  resolvePlanetInfoPortraitAspectRatio,
  resolvePlanetInfoPortraitSource,
} from '../../../game/planetInfoPortraitAssets';
import { useT } from '../../../i18n';
import { OVERLAY_TOKENS } from '../../../utils/theme';

/** 행성 정보창 — 이미지 미할당 placeholder 높이 */
export const PLANET_INFO_PORTRAIT_SLOT_HEIGHT_PX = 132;

type Props = {
  planetId: string;
};

/**
 * 행성 정보 오버레이 — 헤더 바로 아래 카드 **가로 100%** 맞춤.
 * 세로는 번들 PNG 원본 width/height(`resolvePlanetInfoPortraitAspectRatio`)만 사용.
 * @2x 제작 가로 660px · 세로는 원본 비율 유지 — UI 고정 높이 없음.
 */
export const PlanetInfoPortraitSlot = memo(function PlanetInfoPortraitSlot({ planetId }: Props) {
  const t = useT();
  const locale = useAppSettingsStore((s) => s.locale);
  const a11yLabel = t('econInfo.portraitSlotA11y');
  const portraitKey = useMemo(() => {
    return resolvePlanetInfoPanelPresentation(planetId, locale).infoPanelPortraitAssetKey;
  }, [planetId, locale]);
  const imageSource = useMemo(() => resolvePlanetInfoPortraitSource(portraitKey), [portraitKey]);
  const aspectRatio = useMemo(
    () => resolvePlanetInfoPortraitAspectRatio(imageSource),
    [imageSource],
  );

  if (imageSource && aspectRatio != null) {
    return (
      <View style={[styles.frame, styles.frameFilled]}>
        <Image
          source={imageSource}
          style={[styles.image, { aspectRatio }]}
          resizeMode="contain"
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
    overflow: 'hidden',
  },
  frameEmpty: {
    height: PLANET_INFO_PORTRAIT_SLOT_HEIGHT_PX,
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
    width: '100%',
    height: undefined,
  },
});
