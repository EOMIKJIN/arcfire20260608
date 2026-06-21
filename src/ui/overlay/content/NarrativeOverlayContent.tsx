import React, { memo } from 'react';
import type { ArcOverlayNarrativeEntry } from '../arcOverlayStore';
import { NarrativeDialogRow } from '../NarrativeDialogRow';

type Props = {
  entry: ArcOverlayNarrativeEntry;
  onPressNext: () => void;
};

export const NarrativeOverlayContent = memo(function NarrativeOverlayContent({
  entry,
  onPressNext,
}: Props) {
  return (
    <NarrativeDialogRow
      label={entry.label}
      text={entry.text}
      typewriterKey={entry.typewriterKey}
      typewriterSpeedMs={entry.typewriterSpeedMs}
      onTextComplete={entry.onTextComplete}
      imageSource={entry.imageSource}
      maxLines={entry.maxLines}
      buttonText={entry.buttonText}
      nextDisabled={entry.nextDisabled}
      onPressNext={onPressNext}
      showActionButton={entry.showActionButton !== false}
    />
  );
});
