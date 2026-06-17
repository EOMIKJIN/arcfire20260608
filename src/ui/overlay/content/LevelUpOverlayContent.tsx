import React, { memo } from 'react';
import { Text, View } from 'react-native';
import type { ArcOverlayLevelUpEntry } from '../arcOverlayStore';
import { LevelUpDetailPanel } from '../../../components/LevelUpDetailPanel';
import { ArcButton } from '../ArcButton';
import { phosphorOverlay } from './phosphorOverlayStyles';

type Props = {
  entry: ArcOverlayLevelUpEntry;
  onClose: () => void;
};

export const LevelUpOverlayContent = memo(function LevelUpOverlayContent({ entry, onClose }: Props) {
  return (
    <View style={phosphorOverlay.card}>
      <Text style={phosphorOverlay.title}>✦ LEVEL UP ✦</Text>
      <LevelUpDetailPanel summary={entry.summary} />
      <ArcButton label="[ 확인 ]" variant="primary" onPress={onClose} style={phosphorOverlay.closeBtn} />
    </View>
  );
});
