import React, { memo } from 'react';
import { Text, View } from 'react-native';
import type { ArcOverlayWaveResultEntry } from '../arcOverlayStore';
import { COLORS } from '../../../utils/theme';
import { useT } from '../../../i18n';
import { ArcButton } from '../ArcButton';
import { ArcOverlayCard } from '../ArcOverlayCard';
import { ArcOverlayInfoRow } from '../ArcOverlayInfoRow';
import { resolveOverlayCompactBodyStyles } from '../overlayCompactBodyStyles';
import { resolveArcOverlayVisualTheme } from '../tacticalOverlayRollout';

type Props = {
  entry: ArcOverlayWaveResultEntry;
  onClose: () => void;
};

export const WaveResultOverlayContent = memo(function WaveResultOverlayContent({ entry, onClose }: Props) {
  const t = useT();
  const visualTheme = resolveArcOverlayVisualTheme('waveResult');
  const body = resolveOverlayCompactBodyStyles(visualTheme);
  const { outcome, wavesCleared, totalWaves, expEarned, itemRewards } = entry;
  const isWin = outcome === 'win';

  return (
    <ArcOverlayCard
      title={isWin ? t('waveResult.win') : t('waveResult.lose')}
      subtitle={t('waveResult.subtitle')}
      titleColor={isWin ? undefined : COLORS.danger}
      layout="compact"
      visualTheme={visualTheme}
      footer={(
        <ArcButton
          label={t('waveResult.confirm')}
          visualTheme={visualTheme}
          intent="primary"
          onPress={onClose}
          style={body.closeBtn}
        />
      )}
    >
      <View style={body.divider} />
      <ArcOverlayInfoRow
        label={t('waveResult.clearedWaves')}
        value={`${wavesCleared} / ${totalWaves}`}
        visualTheme={visualTheme}
      />
      <Text style={body.sectionLabel}>{t('waveResult.rewards')}</Text>
      <View style={body.row}>
        <Text style={body.rowIcon}>⭐</Text>
        <Text style={body.rowText}>{t('waveResult.exp', { exp: expEarned.toLocaleString() })}</Text>
      </View>
      {itemRewards && itemRewards.length > 0 ? (
        itemRewards.map((it, i) => (
          <View style={body.row} key={`${it.label}-${i}`}>
            <Text style={body.rowIcon}>{it.icon}</Text>
            <Text style={body.rowText}>{it.label}</Text>
          </View>
        ))
      ) : (
        <View style={body.row}>
          <Text style={body.rowIcon}>🎁</Text>
          <Text style={body.rowMuted}>{t('waveResult.otherItems')}</Text>
        </View>
      )}
    </ArcOverlayCard>
  );
});
