import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ArcOverlayAlertEntry } from '../arcOverlayStore';
import { FONTS, OVERLAY_TOKENS, SPACING } from '../../../utils/theme';
import { ArcButton } from '../ArcButton';

type Props = {
  entry: ArcOverlayAlertEntry;
  onButton: (onPress?: () => void | Promise<void>) => void;
};

export const AlertOverlayContent = memo(function AlertOverlayContent({ entry, onButton }: Props) {
  const PH = OVERLAY_TOKENS.phosphorAccent;
  const hasCancel = entry.buttons.some((b) => b.style === 'cancel');
  const isAckOnly = entry.buttons.length === 1 || !hasCancel;
  const btnRowStyle = isAckOnly ? styles.btnRowAckOnly : styles.btnRowCancelConfirm;
  return (
    <View style={styles.card}>
      <Text style={[styles.title, { color: PH }]}>{entry.title}</Text>
      {entry.message.length > 0 ? (
        <Text style={[styles.body, { color: PH }]}>{entry.message}</Text>
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
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: OVERLAY_TOKENS.cardMaxWidth,
    borderWidth: 1.5,
    borderColor: OVERLAY_TOKENS.phosphorBorder,
    borderRadius: 6,
    padding: SPACING.xl,
    backgroundColor: OVERLAY_TOKENS.phosphorCardBg,
  },
  title: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    letterSpacing: 1,
    textAlign: 'center',
    textShadowColor: 'rgba(107, 212, 255, 0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  body: {
    marginTop: SPACING.md,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    lineHeight: 20,
    textAlign: 'center',
    textShadowColor: 'rgba(107, 212, 255, 0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  btnRowAckOnly: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignSelf: 'stretch',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  btnRowCancelConfirm: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignSelf: 'stretch',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
});
