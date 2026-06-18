import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ArcOverlayWaveResultEntry } from '../arcOverlayStore';
import { COLORS, OVERLAY_TOKENS } from '../../../utils/theme';
import { useT } from '../../../i18n';
import { ArcButton } from '../ArcButton';
import { phosphorOverlay } from './phosphorOverlayStyles';

type Props = {
  entry: ArcOverlayWaveResultEntry;
  onClose: () => void;
};

export const WaveResultOverlayContent = memo(function WaveResultOverlayContent({ entry, onClose }: Props) {
  const t = useT();
  const { outcome, wavesCleared, totalWaves, expEarned, itemRewards } = entry;
  const isWin = outcome === 'win';
  // 통일성: 카드/텍스트는 phosphor(시안), 패배만 의미색(빨강) 강조.
  const outcomeColor = isWin ? OVERLAY_TOKENS.phosphorAccent : COLORS.danger;

  return (
    <View style={phosphorOverlay.card}>
      <Text style={[phosphorOverlay.title, !isWin && { color: COLORS.danger }, styles.outcome]}>
        {isWin ? t('waveResult.win') : t('waveResult.lose')}
      </Text>
      <Text style={phosphorOverlay.subtitle}>{t('waveResult.subtitle')}</Text>
      <View style={phosphorOverlay.divider} />

      <View style={phosphorOverlay.rowBetween}>
        <Text style={phosphorOverlay.statLabel}>{t('waveResult.clearedWaves')}</Text>
        <Text style={[phosphorOverlay.statValue, { color: outcomeColor }]}>
          {wavesCleared} / {totalWaves}
        </Text>
      </View>

      <Text style={phosphorOverlay.sectionLabel}>{t('waveResult.rewards')}</Text>
      <View style={phosphorOverlay.row}>
        <Text style={phosphorOverlay.rowIcon}>⭐</Text>
        <Text style={phosphorOverlay.rowText}>{t('waveResult.exp', { exp: expEarned.toLocaleString() })}</Text>
      </View>

      {itemRewards && itemRewards.length > 0 ? (
        itemRewards.map((it, i) => (
          <View style={phosphorOverlay.row} key={`${it.label}-${i}`}>
            <Text style={phosphorOverlay.rowIcon}>{it.icon}</Text>
            <Text style={phosphorOverlay.rowText}>{it.label}</Text>
          </View>
        ))
      ) : (
        <View style={phosphorOverlay.row}>
          <Text style={phosphorOverlay.rowIcon}>🎁</Text>
          <Text style={phosphorOverlay.rowMuted}>{t('waveResult.otherItems')}</Text>
        </View>
      )}

      <ArcButton label={t('waveResult.confirm')} variant="primary" onPress={onClose} style={phosphorOverlay.closeBtn} />
    </View>
  );
});

const styles = StyleSheet.create({
  outcome: {
    letterSpacing: 2,
    marginBottom: 2,
  },
});
