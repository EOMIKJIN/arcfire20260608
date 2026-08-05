import React, { memo } from 'react';
import type { ArcOverlayLevelUpEntry } from '../arcOverlayStore';
import { LevelUpDetailPanel } from '../../../components/LevelUpDetailPanel';
import { ArcButton } from '../ArcButton';
import { ArcOverlayCard } from '../ArcOverlayCard';
import { resolveOverlayCompactBodyStyles } from '../overlayCompactBodyStyles';
import { resolveArcOverlayVisualTheme } from '../tacticalOverlayRollout';
import { useT } from '../../../i18n';

type Props = {
  entry: ArcOverlayLevelUpEntry;
  onClose: () => void;
};

export const LevelUpOverlayContent = memo(function LevelUpOverlayContent({ entry, onClose }: Props) {
  const t = useT();
  const visualTheme = resolveArcOverlayVisualTheme('levelUp');
  const body = resolveOverlayCompactBodyStyles(visualTheme);
  return (
    <ArcOverlayCard
      title={t('levelUp.cardTitle')}
      layout="compact"
      visualTheme={visualTheme}
      onClose={onClose}
    >
      <LevelUpDetailPanel summary={entry.summary} visualTheme={visualTheme} />
      <ArcButton
        label={t('common.confirm')}
        visualTheme={visualTheme}
        intent="primary"
        onPress={onClose}
        style={body.closeBtn}
      />
    </ArcOverlayCard>
  );
});
