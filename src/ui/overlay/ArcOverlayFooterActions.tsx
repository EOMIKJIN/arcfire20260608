// ============================================================
// 범용 패널 하단 [취소][확인] — 모든 ArcOverlayCard footerDock 공통
// ============================================================
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SPACING } from '../../utils/theme';
import { useT } from '../../i18n';
import { ArcButton } from './ArcButton';
import type { ArcButtonVariant } from './ArcButton';

type Props = {
  onCancel: () => void;
  onConfirm: () => void;
  cancelLabel?: string;
  confirmLabel?: string;
  confirmVariant?: ArcButtonVariant;
  cancelDisabled?: boolean;
  confirmDisabled?: boolean;
};

export const ArcOverlayFooterActions = memo(function ArcOverlayFooterActions({
  onCancel,
  onConfirm,
  cancelLabel,
  confirmLabel,
  confirmVariant = 'primary',
  cancelDisabled,
  confirmDisabled,
}: Props) {
  const t = useT();
  return (
    <View style={styles.row}>
      <ArcButton
        label={cancelLabel ?? t('common.cancel')}
        variant="secondary"
        onPress={onCancel}
        disabled={cancelDisabled}
        style={styles.btn}
      />
      <ArcButton
        label={confirmLabel ?? t('common.confirm')}
        variant={confirmVariant}
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
