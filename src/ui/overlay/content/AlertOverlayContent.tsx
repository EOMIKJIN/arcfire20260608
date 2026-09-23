import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ArcOverlayAlertEntry } from '../arcOverlayStore';
import { FONTS, SPACING } from '../../../utils/theme';
import { ArcButton } from '../ArcButton';
import { ArcOverlayCard } from '../ArcOverlayCard';
import { overlayInkColor } from '../overlayVisualTokens';
import { resolveArcOverlayVisualTheme } from '../tacticalOverlayRollout';
import { resolveOverlayCompactBodyStyles } from '../overlayCompactBodyStyles';

type Props = {
  entry: ArcOverlayAlertEntry;
  onButton: (onPress?: () => void | Promise<void>) => void;
  onClose: () => void;
};

const MESSAGE_LEAD_READY = '#1565C0';
const MESSAGE_LEAD_PENDING = '#C62828';

export const AlertOverlayContent = memo(function AlertOverlayContent({ entry, onButton, onClose }: Props) {
  const visualTheme = resolveArcOverlayVisualTheme('alert');
  const body = resolveOverlayCompactBodyStyles(visualTheme);
  const hasCancel = entry.buttons.some((b) => b.style === 'cancel');
  const isAckOnly = entry.buttons.length === 1 || !hasCancel;
  const btnRowStyle = isAckOnly ? body.btnRowAckOnly : body.btnRowCancelConfirm;

  const leadColor =
    entry.messageLead?.tone === 'ready'
      ? MESSAGE_LEAD_READY
      : entry.messageLead?.tone === 'pending'
        ? MESSAGE_LEAD_PENDING
        : null;

  return (
    <ArcOverlayCard title={entry.title} layout="compact" visualTheme={visualTheme} onClose={onClose}>
      {entry.messageLead && leadColor ? (
        <Text style={[styles.messageLead, { color: leadColor }]}>{entry.messageLead.text}</Text>
      ) : null}
      {entry.message.length > 0 ? (
        <Text style={[
          styles.body,
          { color: overlayInkColor(visualTheme, 'value') },
          entry.messageLead ? styles.bodyAfterLead : null,
        ]}
        >
          {entry.message}
        </Text>
      ) : null}
      {entry.messageSection?.label && entry.messageSection.text ? (
        <>
          <View style={body.divider} />
          <Text style={body.sectionLabel}>{entry.messageSection.label}</Text>
          <Text style={[styles.sectionBody, { color: overlayInkColor(visualTheme, 'value') }]}>
            {entry.messageSection.text}
          </Text>
        </>
      ) : null}
      <View style={btnRowStyle}>
        {entry.buttons.map((b, i) => {
          const intent =
            b.style === 'destructive'
              ? undefined
              : b.style === 'cancel'
                ? ('secondary' as const)
                : ('primary' as const);
          return (
            <ArcButton
              key={`alert-btn-${i}`}
              label={b.text}
              variant={b.style === 'destructive' ? 'destructive' : undefined}
              visualTheme={b.style === 'destructive' ? undefined : visualTheme}
              intent={intent}
              onPress={() => onButton(b.onPress)}
            />
          );
        })}
      </View>
    </ArcOverlayCard>
  );
});

const styles = StyleSheet.create({
  messageLead: {
    marginTop: SPACING.md,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    letterSpacing: 0.4,
    textAlign: 'center',
    alignSelf: 'stretch',
    width: '100%',
  },
  bodyAfterLead: {
    marginTop: SPACING.sm,
  },
  body: {
    marginTop: SPACING.md,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    lineHeight: 20,
    textAlign: 'center',
    alignSelf: 'stretch',
    width: '100%',
  },
  sectionBody: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    lineHeight: 20,
    textAlign: 'center',
    alignSelf: 'stretch',
    width: '100%',
  },
});
