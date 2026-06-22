import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useT } from '../../i18n';
import { COLORS, FONTS, SPACING } from '../../utils/theme';
import { ArcButton } from '../overlay/ArcButton';
import type { HeavyUiPreflightCode } from './types';
import type { PlanetHubFacilityGateKind } from '../../hooks/usePlanetHubFacilityAccessGate';

type Props = {
  preflightCode: HeavyUiPreflightCode | null;
  error: string | null;
  facilityKind?: PlanetHubFacilityGateKind;
  onRetry: () => void;
  onBack: () => void;
};

export const HeavyUiStageErrorPanel = memo(function HeavyUiStageErrorPanel({
  preflightCode,
  error,
  facilityKind,
  onRetry,
  onBack,
}: Props) {
  const t = useT();
  let detail = error ?? t('heavyUi.buildFailed');
  if (preflightCode === 'facility_not_installed' && facilityKind) {
    detail = t(`hubFacilityGate.${facilityKind}`);
  } else if (preflightCode) {
    detail = t(`heavyUi.preflight.${preflightCode}`);
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{t('heavyUi.errorTitle')}</Text>
      <Text style={styles.body}>{detail}</Text>
      <View style={styles.actions}>
        <ArcButton variant="primary" label={t('heavyUi.retry')} onPress={onRetry} style={styles.btn} />
        <ArcButton variant="secondary" label={t('heavyUi.back')} onPress={onBack} style={styles.btn} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  title: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    color: COLORS.ink_light,
    textAlign: 'center',
  },
  body: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    lineHeight: 20,
    color: COLORS.ink_mid,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  btn: {
    minWidth: 120,
  },
});
