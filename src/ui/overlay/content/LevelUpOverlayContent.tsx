import React, { memo } from 'react';
import type { ArcOverlayLevelUpEntry } from '../arcOverlayStore';
import { LevelUpDetailPanel } from '../../../components/LevelUpDetailPanel';
import { ArcOverlayCard } from '../ArcOverlayCard';
import { ArcOverlayFooterActions } from '../ArcOverlayFooterActions';
import { resolveArcOverlayVisualTheme } from '../tacticalOverlayRollout';
import { useT } from '../../../i18n';

type Props = {
  entry: ArcOverlayLevelUpEntry;
  onClose: () => void;
};

export const LevelUpOverlayContent = memo(function LevelUpOverlayContent({ entry, onClose }: Props) {
  const t = useT();
  const visualTheme = resolveArcOverlayVisualTheme('levelUp');
  return (
    <ArcOverlayCard
      title={t('levelUp.cardTitle')}
      layout="compact"
      visualTheme={visualTheme}
      onClose={onClose}
      footer={(
        <ArcOverlayFooterActions
          confirmOnly
          confirmLabel={t('common.confirm')}
          onConfirm={onClose}
          visualTheme={visualTheme}
        />
      )}
    >
      <LevelUpDetailPanel summary={entry.summary} visualTheme={visualTheme} />
    </ArcOverlayCard>
  );
});
