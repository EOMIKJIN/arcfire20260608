import React, { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  PLANET_MAIN_ORBIT_VISUAL_LIFT_PX,
  PLANET_MAIN_PLANET_TAP_HITBOX_PX,
} from '../../game/planetHub/planetHubConstants';
import { useT } from '../../i18n';

type Props = {
  reserveHeightPx: number;
  planetStageScale: number;
  disabled?: boolean;
  onPress: () => void;
};

/** 메인스테이지 중앙 행성 도트 탭 — 배경 레이어 위 포그라운드 히트 타겟 */
export const PlanetMainPlanetInfoTapOverlay = memo(function PlanetMainPlanetInfoTapOverlay({
  reserveHeightPx,
  planetStageScale,
  disabled = false,
  onPress,
}: Props) {
  const t = useT();
  const hitPx = Math.round(PLANET_MAIN_PLANET_TAP_HITBOX_PX * planetStageScale);
  const liftPx = Math.round(PLANET_MAIN_ORBIT_VISUAL_LIFT_PX * planetStageScale);
  const top = Math.max(0, Math.round(reserveHeightPx / 2 - hitPx / 2 - liftPx));

  return (
    <View
      style={[styles.slot, { height: reserveHeightPx }]}
      pointerEvents="box-none"
    >
      <Pressable
        style={[
          styles.hitbox,
          {
            width: hitPx,
            height: hitPx,
            borderRadius: hitPx / 2,
            top,
          },
        ]}
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={t('scanRow.planetInfo')}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  slot: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 12,
    alignItems: 'center',
  },
  hitbox: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
});
