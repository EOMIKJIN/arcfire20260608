import React, { memo } from 'react';
import { View } from 'react-native';
import type { ArcOverlayLevelUpEntry } from '../arcOverlayStore';
import { LevelUpDetailPanel } from '../../../components/LevelUpDetailPanel';
import { ArcButton } from '../ArcButton';
import { ArcOverlayCard } from '../ArcOverlayCard';
import { phosphorOverlay } from './phosphorOverlayStyles';

type Props = {
  entry: ArcOverlayLevelUpEntry;
  onClose: () => void;
};

export const LevelUpOverlayContent = memo(function LevelUpOverlayContent({ entry, onClose }: Props) {
  return (
    <ArcOverlayCard title="✦ LEVEL UP ✦" layout="compact">
      <LevelUpDetailPanel summary={entry.summary} />
      <ArcButton label="[ 확인 ]" variant="primary" onPress={onClose} style={phosphorOverlay.closeBtn} />
    </ArcOverlayCard>
  );
});
