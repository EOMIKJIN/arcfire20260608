import React, { memo, useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFacilityHatchHeaderWindowBottom } from '../../planetFacility/facilityHatchHeaderMeasure';
import type { ArcOverlayNarrativeEntry } from '../arcOverlayStore';
import { NarrativeDialogRow } from '../NarrativeDialogRow';
import { resolveNarrativeDialogStageFill } from '../narrativeDialogLayout';
import { resolveArcOverlayVisualTheme } from '../tacticalOverlayRollout';

type Props = {
  entry: ArcOverlayNarrativeEntry;
  onPressNext: () => void;
  onPressSecondary?: () => void;
};

export const NarrativeOverlayContent = memo(function NarrativeOverlayContent({
  entry,
  onPressNext,
  onPressSecondary,
}: Props) {
  const visualTheme = resolveArcOverlayVisualTheme('narrative');
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const hatchBottomY = useFacilityHatchHeaderWindowBottom();
  const stageFill = useMemo(
    () => (
      entry.anchor === 'center'
        ? resolveNarrativeDialogStageFill(windowHeight, {
            hatchBottomY,
            safeBottomPx: insets.bottom,
          })
        : null
    ),
    [entry.anchor, windowHeight, hatchBottomY, insets.bottom],
  );
  return (
    <NarrativeDialogRow
      stageFill={stageFill}
      label={entry.label}
      text={entry.text}
      typewriterKey={entry.typewriterKey}
      typewriterSpeedMs={entry.typewriterSpeedMs}
      typewriterActive={entry.typewriterActive !== false}
      onTextComplete={entry.onTextComplete}
      imageSource={entry.imageSource}
      portraitScale={entry.portraitScale}
      maxLines={entry.maxLines}
      buttonText={entry.buttonText}
      secondaryButtonText={entry.secondaryButtonText}
      nextDisabled={entry.nextDisabled}
      onPressNext={onPressNext}
      onPressSecondary={onPressSecondary ?? entry.onPressSecondary}
      showActionButton={entry.showActionButton !== false}
      visualTheme={visualTheme}
    />
  );
});
