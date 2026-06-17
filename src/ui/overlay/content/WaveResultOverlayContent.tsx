import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ArcOverlayWaveResultEntry } from '../arcOverlayStore';
import { COLORS, OVERLAY_TOKENS } from '../../../utils/theme';
import { ArcButton } from '../ArcButton';
import { phosphorOverlay } from './phosphorOverlayStyles';

type Props = {
  entry: ArcOverlayWaveResultEntry;
  onClose: () => void;
};

export const WaveResultOverlayContent = memo(function WaveResultOverlayContent({ entry, onClose }: Props) {
  const { outcome, wavesCleared, totalWaves, expEarned, itemRewards } = entry;
  const isWin = outcome === 'win';
  // 통일성: 카드/텍스트는 phosphor(시안), 패배만 의미색(빨강) 강조.
  const outcomeColor = isWin ? OVERLAY_TOKENS.phosphorAccent : COLORS.danger;

  return (
    <View style={phosphorOverlay.card}>
      <Text style={[phosphorOverlay.title, !isWin && { color: COLORS.danger }, styles.outcome]}>
        {isWin ? '✦ 승  리 ✦' : '✕ 패  배 ✕'}
      </Text>
      <Text style={phosphorOverlay.subtitle}>웨이브 디펜스 — 최종 결과</Text>
      <View style={phosphorOverlay.divider} />

      <View style={phosphorOverlay.rowBetween}>
        <Text style={phosphorOverlay.statLabel}>클리어 웨이브</Text>
        <Text style={[phosphorOverlay.statValue, { color: outcomeColor }]}>
          {wavesCleared} / {totalWaves}
        </Text>
      </View>

      <Text style={phosphorOverlay.sectionLabel}>— 보상 획득 —</Text>
      <View style={phosphorOverlay.row}>
        <Text style={phosphorOverlay.rowIcon}>⭐</Text>
        <Text style={phosphorOverlay.rowText}>경험치 +{expEarned.toLocaleString()}</Text>
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
          <Text style={phosphorOverlay.rowMuted}>기타 아이템 — 추후 제공 예정</Text>
        </View>
      )}

      <ArcButton label="[ 확인 ]" variant="primary" onPress={onClose} style={phosphorOverlay.closeBtn} />
    </View>
  );
});

const styles = StyleSheet.create({
  outcome: {
    letterSpacing: 2,
    marginBottom: 2,
  },
});
