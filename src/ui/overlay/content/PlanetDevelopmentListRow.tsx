import React, { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { PlanetHubDigitalGauge } from '../../../components/planet/PlanetHubActionGaugeSlot';
import type { PlanetDevListRowView } from '../../../game/planetDevelopment/planetDevelopmentListRowModel';
import { useT } from '../../../i18n';
import { overlayInkColor } from '../overlayVisualTokens';
import type { ArcOverlayVisualTheme } from '../tacticalOverlayRollout';
import { PlanetDevListItemHeader, PlanetDevListMetaSection } from './PlanetDevOverlayChrome';
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
          <Text style={styles.listItemImagePlaceholder}>{row.placeholderGlyph}</Text>
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
          {row.progress ? (
            <PlanetDevListMetaSection visualTheme={visualTheme}>
              <Text style={[styles.listItemProgressLabel, { color: labelInk }]}>
                {row.progress.label}
              </Text>
              <PlanetHubDigitalGauge
                progressPct={row.progress.progressPct}
                accessibilityLabel={row.progress.a11yLabel}
              />
            </PlanetDevListMetaSection>
          ) : row.completeStatus ? (
            <PlanetDevListMetaSection visualTheme={visualTheme}>
              <Text style={[styles.listItemStatusComplete, { color: valueInk }]}>
                {row.completeStatus}
              </Text>
            </PlanetDevListMetaSection>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
});
