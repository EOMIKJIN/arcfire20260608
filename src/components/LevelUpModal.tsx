import React, { memo } from 'react';
import type { LevelUpSummary } from '../types';
import { LevelUpOverlayContent } from '../ui/overlay/content/LevelUpOverlayContent';

type Props = {
  visible: boolean;
  summary: LevelUpSummary;
  onClose: () => void;
};

/** @deprecated LevelUpOverlayBridge + ArcOverlayHost 사용 */
export const LevelUpModal = memo(function LevelUpModal({ visible, summary, onClose }: Props) {
  if (!visible) return null;
  return (
    <LevelUpOverlayContent
      entry={{
        id: 'legacy-level-up',
        kind: 'levelUp',
        summary,
        onClose,
        dismissOnBackdrop: false,
      }}
      onClose={onClose}
    />
  );
});
