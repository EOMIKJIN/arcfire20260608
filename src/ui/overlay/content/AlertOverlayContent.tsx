import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ArcOverlayAlertEntry } from '../arcOverlayStore';
import { FONTS, OVERLAY_TOKENS, SPACING } from '../../../utils/theme';
import { ArcButton } from '../ArcButton';
import { ArcOverlayCard } from '../ArcOverlayCard';
import { phosphorOverlay } from './phosphorOverlayStyles';

type Props = {
  entry: ArcOverlayAlertEntry;
  onButton: (onPress?: () => void | Promise<void>) => void;
};

export const AlertOverlayContent = memo(function AlertOverlayContent({ entry, onButton }: Props) {
  const hasCancel = entry.buttons.some((b) => b.style === 'cancel');
  const isAckOnly = entry.buttons.length === 1 || !hasCancel;
  const btnRowStyle = isAckOnly ? phosphorOverlay.btnRowAckOnly : phosphorOverlay.btnRowCancelConfirm;

  return (
    <ArcOverlayCard title={entry.title} layout="compact">
      {entry.message.length > 0 ? (
        <Text style={[styles.body, { color: OVERLAY_TOKENS.valueContentColor }]}>{entry.message}</Text>
      ) : null}
      <View style={btnRowStyle}>
        {entry.buttons.map((b, i) => {
          const variant =
            b.style === 'destructive'
              ? 'destructive'
              : b.style === 'cancel'
                ? 'secondary'
                : 'primary';
          return (
            <ArcButton
              key={`${b.text}-${i}`}
              label={b.text}
              variant={variant}
              onPress={() => onButton(b.onPress)}
            />
          );
        })}
      </View>
    </ArcOverlayCard>
  );
});

const styles = StyleSheet.create({
  body: {
    marginTop: SPACING.md,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    lineHeight: 20,
    textAlign: 'center',
    alignSelf: 'stretch',
    width: '100%',
    textShadowColor: 'rgba(107, 212, 255, 0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
});
