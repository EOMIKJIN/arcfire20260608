import React, { memo } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import { ArcButton } from './ArcButton';

type Props = {
  onPress: () => void;
  label?: string;
  style?: StyleProp<ViewStyle>;
};

/** 서브 스테이지 공통 — ◀ 나가기 */
export const ArcStageBackButton = memo(function ArcStageBackButton({
  onPress,
  label = '◀ 나가기',
  style,
}: Props) {
  return (
    <ArcButton
      label={label}
      variant="secondary"
      onPress={onPress}
      style={[{ alignSelf: 'flex-start', marginRight: 8 }, style]}
    />
  );
});
