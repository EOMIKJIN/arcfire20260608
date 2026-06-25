import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FONTS, SPACING } from '../../utils/theme';
import { TACTICAL_FACILITY as TF } from '../../ui/tactical/tacticalFacilityScreenTokens';
import { ArcButton } from '../../ui/overlay/ArcButton';
import {
  NEARBY_PRESENCE_ROW_ACTION_NONE,
  type NearbyPresenceRowAction,
} from '../../game/planetHub/nearbyPresenceDisplay';
import { useT } from '../../i18n';

type Props = {
  action: NearbyPresenceRowAction;
  variant: 'compact' | 'panel';
};

export const NearbyPresenceRowActionButton = memo(function NearbyPresenceRowActionButton({
  action: actionProp,
  variant,
}: Props) {
  const t = useT();
  const action = actionProp ?? NEARBY_PRESENCE_ROW_ACTION_NONE;
  const isNone = action.kind === 'none';
  const label =
    action.label
    ?? (action.kind === 'dialog'
      ? t('nearbyPresence.action.dialog')
      : action.kind === 'mission'
        ? t('nearbyPresence.action.mission')
        : action.kind === 'custom'
          ? t('nearbyPresence.action.custom')
          : '');

  if (variant === 'compact') {
    return (
      <View style={styles.compactSlot}>
        {isNone ? (
          <View style={styles.compactNull} accessibilityLabel={t('nearbyPresence.action.none')} />
        ) : (
          <Pressable
            style={({ pressed }) => [styles.compactBtn, pressed && styles.compactBtnPressed]}
            disabled={action.disabled ?? !action.onPress}
            onPress={action.onPress}
            accessibilityRole="button"
            accessibilityLabel={label}
          >
            <Text style={styles.compactIcon}>
              {action.kind === 'dialog' ? '💬' : action.kind === 'mission' ? '📋' : '▸'}
            </Text>
          </Pressable>
        )}
      </View>
    );
  }

  if (isNone) {
    return <View style={styles.panelNullSlot} accessibilityLabel={t('nearbyPresence.action.none')} />;
  }

  return (
    <ArcButton
      label={label}
      variant="tacticalSecondary"
      disabled={action.disabled ?? !action.onPress}
      onPress={action.onPress ?? (() => {})}
      style={styles.panelBtn}
    />
  );
});

const styles = StyleSheet.create({
  compactSlot: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  compactNull: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(120, 132, 160, 0.28)',
  },
  compactBtn: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: TF.cardBorder,
    backgroundColor: TF.insetBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactBtnPressed: {
    opacity: 0.82,
  },
  compactIcon: {
    fontSize: 10,
    lineHeight: 12,
  },
  panelNullSlot: {
    width: 72,
    minHeight: 32,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: TF.cardBorder,
    backgroundColor: TF.insetBg,
    opacity: 0.45,
  },
  panelBtn: {
    minWidth: 72,
    minHeight: 32,
    paddingHorizontal: SPACING.xs,
  },
});
