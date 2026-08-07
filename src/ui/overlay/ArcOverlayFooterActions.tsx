// ============================================================
// 범용 패널 하단 [취소][확인] — 모든 ArcOverlayCard footerDock 공통
// ============================================================
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SPACING } from '../../utils/theme';
import { useT } from '../../i18n';
import { ArcButton } from './ArcButton';
import type { ArcButtonVariant } from './ArcButton';
import type { ArcOverlayVisualTheme } from './tacticalOverlayPreview';

type Props = {
  onCancel?: () => void;
  onConfirm: () => void;
  cancelLabel?: string;
  confirmLabel?: string;
  confirmVariant?: ArcButtonVariant;
  cancelDisabled?: boolean;
  confirmDisabled?: boolean;
  visualTheme?: ArcOverlayVisualTheme;
  /** true — 확인만 (reward · waveResult 등 compact 단버튼) */
  confirmOnly?: boolean;
};

export const ArcOverlayFooterActions = memo(function ArcOverlayFooterActions({
  onCancel,
  onConfirm,
  cancelLabel,
  confirmLabel,
  confirmVariant,
  cancelDisabled,
  confirmDisabled,
  visualTheme = 'phosphor',
  confirmOnly = false,
}: Props) {
  const t = useT();
  const cancelVariant: ArcButtonVariant =
    visualTheme === 'tactical' ? 'tacticalSecondary' : 'secondary';
  const resolvedConfirmVariant: ArcButtonVariant =
    confirmVariant ?? (visualTheme === 'tactical' ? 'tacticalPrimary' : 'primary');
  if (confirmOnly) {
    return (
      <View style={styles.row}>
        <ArcButton
          label={confirmLabel ?? t('common.confirm')}
          variant={resolvedConfirmVariant}
          onPress={onConfirm}
          disabled={confirmDisabled}
          style={styles.btn}
        />
      </View>
    );
  }
  return (
    <View style={styles.row}>
      <ArcButton
        label={cancelLabel ?? t('common.cancel')}
        variant={cancelVariant}
        onPress={onCancel ?? onConfirm}
        disabled={cancelDisabled}
        style={styles.btn}
      />
      <ArcButton
        label={confirmLabel ?? t('common.confirm')}
        variant={resolvedConfirmVariant}
        onPress={onConfirm}
        disabled={confirmDisabled}
        style={styles.btn}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: SPACING.sm,
  },
  btn: {
    flex: 1,
    minHeight: 46,
  },
});
