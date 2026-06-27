import React, { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { PlanetHubDigitalGauge } from '../../../components/planet/PlanetHubActionGaugeSlot';
import type { PlanetDevListRowView } from '../../../game/planetDevelopment/planetDevelopmentListRowModel';
import { useT } from '../../../i18n';
import { PlanetHubActionIcon } from '../../../ui/tactical/PlanetHubActionIcon';
import { overlayInkColor } from '../overlayVisualTokens';
import type { ArcOverlayVisualTheme } from '../tacticalOverlayRollout';
import { PlanetDevListItemHeader } from './PlanetDevOverlayChrome';
import { planetDevelopmentOverlayStyles as styles } from './planetDevelopmentOverlayStyles';

type Props = {
  row: PlanetDevListRowView;
  visualTheme?: ArcOverlayVisualTheme;
  onPress: () => void;
};

export const PlanetDevelopmentListRow = memo(function PlanetDevelopmentListRow({
  row,
  visualTheme = 'phosphor',
  onPress,
}: Props) {
  const t = useT();
  const isTactical = visualTheme === 'tactical';
  const labelInk = overlayInkColor(visualTheme, 'label');
  const valueInk = overlayInkColor(visualTheme, 'value');
  const listItemStyle = isTactical
    ? [styles.listItem, styles.listItemTactical]
    : [styles.listItem, styles.listItemPhosphor];
  const imageSlotStyle = isTactical
    ? [styles.listItemImageSlot, styles.listItemImageSlotTactical]
    : [styles.listItemImageSlot, styles.listItemImageSlotPhosphor];

  const progressPct = row.progress?.progressPct ?? 0;
  const gaugeA11y = row.progress
    ? row.progress.a11yLabel
    : t('planetDev.listGaugeIdleA11y', { pct: progressPct });

  return (
    <Pressable
      style={({ pressed }) => [
        listItemStyle,
        !row.enabled && styles.listItemDisabled,
        pressed && styles.listItemPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={row.label}
    >
      <View style={styles.listItemRow}>
        <View
          style={imageSlotStyle}
          accessibilityLabel={t('planetDev.listImagePlaceholderA11y', { label: row.label })}
        >
          <PlanetHubActionIcon spec={row.placeholderIcon} size={28} color={labelInk} />
        </View>
        <View style={styles.listItemBody}>
          <PlanetDevListItemHeader
            title={row.label}
            summary={row.summary}
            visualTheme={visualTheme}
            disabled={!row.enabled}
            titleSuffix={
              !row.enabled ? (
                <Text style={[styles.listItemComingSoonBadge, { color: labelInk }]}>
                  {' '}
                  · {t('planetDev.listComingSoonBadge')}
                </Text>
              ) : null
            }
          />
          <View style={styles.listDevGaugeSlot}>
            {row.progress ? (
              <Text
                style={[styles.listItemProgressLabel, { color: labelInk }]}
                numberOfLines={2}
              >
                {row.progress.label}
              </Text>
            ) : row.completeStatus ? (
              <Text
                style={[styles.listItemStatusComplete, { color: valueInk }]}
                numberOfLines={2}
              >
                {row.completeStatus}
              </Text>
            ) : null}
            <View style={styles.listDevGaugeRow}>
              <PlanetHubDigitalGauge
                progressPct={progressPct}
                accessibilityLabel={gaugeA11y}
              />
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
});
