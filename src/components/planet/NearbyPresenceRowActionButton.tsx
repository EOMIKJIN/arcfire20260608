import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FONTS, SPACING } from '../../utils/theme';
import { TACTICAL_FACILITY as TF } from '../../ui/tactical/tacticalFacilityScreenTokens';
import { useArcButtonReleaseHandlers } from '../../ui/press/useArcButtonRelease';
import {
  NEARBY_PRESENCE_ROW_ACTION_NONE,
  type NearbyPresenceRowAction,
} from '../../game/planetHub/nearbyPresenceDisplay';
import { useT } from '../../i18n';

type Props = {
  action: NearbyPresenceRowAction;
  variant: 'compact' | 'panel';
  onPress?: () => void;
};

export const NearbyPresenceRowActionButton = memo(function NearbyPresenceRowActionButton({
  action: actionProp,
  variant,
  onPress,
}: Props) {
  const t = useT();
  const action = actionProp ?? NEARBY_PRESENCE_ROW_ACTION_NONE;
  const isNone = action.kind === 'none';
  const handlePress = action.onPress ?? onPress;
  const disabled = action.disabled ?? !handlePress;
  const release = useArcButtonReleaseHandlers({
    onPress: handlePress,
    disabled,
  });
  const label =
    action.label
    ?? (action.kind === 'dialog'
      ? t('nearbyPresence.action.commRequest')
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
            disabled={action.disabled ?? !handlePress}
            onPress={(event) => {
              event.stopPropagation();
              handlePress?.();
            }}
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
    <Pressable
      style={({ pressed }) => [
        styles.panelBtn,
        pressed && !disabled && styles.panelBtnPressed,
        disabled && styles.panelBtnDisabled,
      ]}
      disabled={disabled}
      onPressIn={release.onPressIn}
      onPressOut={release.onPressOut}
      onPress={release.onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      android_disableSound
    >
      <Text style={styles.panelBtnLabel} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
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
    minWidth: 88,
    minHeight: 32,
    paddingHorizontal: SPACING.sm,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#8F96A3',
    backgroundColor: '#C5C9D2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelBtnPressed: {
    opacity: 0.82,
  },
  panelBtnDisabled: {
    opacity: 0.45,
  },
  panelBtnLabel: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.bold,
    color: '#3E4552',
    letterSpacing: 0.2,
  },
});
