import React, { memo, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useT } from '../../i18n';
import { FONTS, OVERLAY_TOKENS, SPACING } from '../../utils/theme';
import { ArcOverlayCard, type ArcOverlayCardLayout } from '../overlay/ArcOverlayCard';
import { ArcOverlayFooterActions } from '../overlay/ArcOverlayFooterActions';
import { ArcButton } from '../overlay/ArcButton';
import type { HeavyUiLoadPhase, HeavyUiPreflightCode } from './types';

type Props = {
  title: string;
  subtitle?: string;
  layout?: ArcOverlayCardLayout;
  panelPrefix?: ReactNode;
  phase: HeavyUiLoadPhase;
  error: string | null;
  preflightCode: HeavyUiPreflightCode | null;
  onClose: () => void;
  onRetry: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export const HeavyUiOverlayShell = memo(function HeavyUiOverlayShell({
  title,
  subtitle,
  layout = 'panel',
  panelPrefix,
  phase,
  error,
  preflightCode,
  onClose,
  onRetry,
  children,
  footer,
}: Props) {
  const t = useT();
  const PH = OVERLAY_TOKENS.phosphorAccent;

  const resolvedFooter =
    footer
    ?? (
      phase === 'error' ? (
        <View style={styles.errorFooter}>
          <ArcButton variant="primary" label={t('heavyUi.retry')} onPress={onRetry} />
          <ArcButton variant="secondary" label={t('heavyUi.close')} onPress={onClose} />
        </View>
      ) : (
        <ArcOverlayFooterActions onCancel={onClose} onConfirm={onClose} />
      )
    );

  if (phase === 'loading' || phase === 'idle') {
    return (
      <ArcOverlayCard
        title={title}
        subtitle={subtitle}
        layout={layout}
        panelPrefix={panelPrefix}
        footer={<ArcOverlayFooterActions onCancel={onClose} onConfirm={onClose} confirmDisabled />}
      >
        <View style={styles.center}>
          <ActivityIndicator color={PH} size="small" />
          <Text style={[styles.status, { color: PH }]}>{t('heavyUi.loading')}</Text>
        </View>
      </ArcOverlayCard>
    );
  }

  if (phase === 'error') {
    const messageKey = preflightCode
      ? (`heavyUi.preflight.${preflightCode}` as const)
      : 'heavyUi.buildFailed';
    const detail = preflightCode ? t(messageKey) : (error ?? t('heavyUi.buildFailed'));
    return (
      <ArcOverlayCard title={title} subtitle={subtitle} layout={layout} footer={resolvedFooter}>
        <View style={styles.center}>
          <Text style={[styles.errorTitle, { color: PH }]}>{t('heavyUi.errorTitle')}</Text>
          <Text style={[styles.errorBody, { color: PH }]}>{detail}</Text>
        </View>
      </ArcOverlayCard>
    );
  }

  return (
    <ArcOverlayCard
      title={title}
      subtitle={subtitle}
      layout={layout}
      panelPrefix={panelPrefix}
      footer={resolvedFooter}
    >
      {children}
    </ArcOverlayCard>
  );
});

const styles = StyleSheet.create({
  center: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
  },
  status: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    letterSpacing: 1,
  },
  errorTitle: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    textAlign: 'center',
  },
  errorBody: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    lineHeight: 20,
    textAlign: 'center',
    opacity: 0.9,
  },
  errorFooter: {
    flexDirection: 'row',
    gap: SPACING.sm,
    justifyContent: 'center',
  },
});
