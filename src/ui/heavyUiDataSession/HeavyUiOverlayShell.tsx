import React, { memo, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useT } from '../../i18n';
import { FONTS, SPACING } from '../../utils/theme';
import { ArcOverlayCard, type ArcOverlayCardLayout } from '../overlay/ArcOverlayCard';
import { ArcOverlayFooterActions } from '../overlay/ArcOverlayFooterActions';
import { ArcButton } from '../overlay/ArcButton';
import type { ArcOverlayVisualTheme } from '../overlay/tacticalOverlayPreview';
import { resolveOverlayVisualTokens } from '../overlay/overlayVisualTokens';
import type { HeavyUiLoadPhase, HeavyUiPreflightCode } from './types';

type Props = {
  title: string;
  subtitle?: string;
  layout?: ArcOverlayCardLayout;
  panelPrefix?: ReactNode;
  panelBleedPrefix?: ReactNode;
  phase: HeavyUiLoadPhase;
  error: string | null;
  preflightCode: HeavyUiPreflightCode | null;
  onClose: () => void;
  onRetry: () => void;
  children: ReactNode;
  footer?: ReactNode;
  visualTheme?: ArcOverlayVisualTheme;
  minHeight?: number | `${number}%`;
  maxHeight?: number | `${number}%`;
  bodyStyle?: StyleProp<ViewStyle>;
};

export const HeavyUiOverlayShell = memo(function HeavyUiOverlayShell({
  title,
  subtitle,
  layout = 'panel',
  panelPrefix,
  panelBleedPrefix,
  phase,
  error,
  preflightCode,
  onClose,
  onRetry,
  children,
  footer,
  visualTheme = 'phosphor',
  minHeight,
  maxHeight,
  bodyStyle,
}: Props) {
  const t = useT();
  const tokens = resolveOverlayVisualTokens(visualTheme);

  const defaultFooter = (
    <ArcOverlayFooterActions
      onCancel={onClose}
      onConfirm={onClose}
      visualTheme={visualTheme}
    />
  );

  const resolvedFooter =
    footer
    ?? (
      phase === 'error' ? (
        <View style={styles.errorFooter}>
          <ArcButton
            visualTheme={visualTheme}
            intent="primary"
            label={t('heavyUi.retry')}
            onPress={onRetry}
          />
          <ArcButton
            visualTheme={visualTheme}
            intent="secondary"
            label={t('heavyUi.close')}
            onPress={onClose}
          />
        </View>
      ) : (
        defaultFooter
      )
    );

  if (phase === 'loading' || phase === 'idle') {
    return (
      <ArcOverlayCard
        title={title}
        subtitle={subtitle}
        layout={layout}
        panelPrefix={panelPrefix}
        panelBleedPrefix={panelBleedPrefix}
        visualTheme={visualTheme}
        minHeight={minHeight}
        maxHeight={maxHeight}
        bodyStyle={bodyStyle}
        onClose={onClose}
        footer={
          <ArcOverlayFooterActions
            onCancel={onClose}
            onConfirm={onClose}
            confirmDisabled
            visualTheme={visualTheme}
          />
        }
      >
        <View style={styles.center}>
          <ActivityIndicator color={tokens.spinnerInk} size="small" />
          <Text style={[styles.status, { color: tokens.spinnerInk }]}>{t('heavyUi.loading')}</Text>
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
      <ArcOverlayCard
        title={title}
        subtitle={subtitle}
        layout={layout}
        visualTheme={visualTheme}
        minHeight={minHeight}
        maxHeight={maxHeight}
        bodyStyle={bodyStyle}
        onClose={onClose}
        footer={resolvedFooter}
      >
        <View style={styles.center}>
          <Text style={[styles.errorTitle, { color: tokens.spinnerInk }]}>{t('heavyUi.errorTitle')}</Text>
          <Text style={[styles.errorBody, { color: tokens.spinnerInk }]}>{detail}</Text>
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
      panelBleedPrefix={panelBleedPrefix}
      visualTheme={visualTheme}
      minHeight={minHeight}
      maxHeight={maxHeight}
      bodyStyle={bodyStyle}
      onClose={onClose}
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
