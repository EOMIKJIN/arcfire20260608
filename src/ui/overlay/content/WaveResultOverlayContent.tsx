import React, { memo } from 'react';
import { Text, View } from 'react-native';
import type { ArcOverlayWaveResultEntry } from '../arcOverlayStore';
import { COLORS, OVERLAY_TOKENS } from '../../../utils/theme';
import { useT } from '../../../i18n';
import { ArcButton } from '../ArcButton';
import { ArcOverlayCard } from '../ArcOverlayCard';
import { phosphorOverlay } from './phosphorOverlayStyles';

type Props = {
  entry: ArcOverlayWaveResultEntry;
  onClose: () => void;
};

export const WaveResultOverlayContent = memo(function WaveResultOverlayContent({ entry, onClose }: Props) {
  const t = useT();
  const { outcome, wavesCleared, totalWaves, expEarned, itemRewards } = entry;
  const isWin = outcome === 'win';

  return (
    <ArcOverlayCard
      title={isWin ? t('waveResult.win') : t('waveResult.lose')}
      subtitle={t('waveResult.subtitle')}
      titleColor={isWin ? OVERLAY_TOKENS.titleHeaderTitleColor : COLORS.danger}
      layout="compact"
    >
      <View style={phosphorOverlay.divider} />
      <View style={phosphorOverlay.rowBetween}>
        <Text style={phosphorOverlay.statLabel}>{t('waveResult.clearedWaves')}</Text>
        <Text style={phosphorOverlay.statValue}>
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
    </ArcOverlayCard>
  );
});
